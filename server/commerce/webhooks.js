import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { CommerceError, boundedText, integer, currencyCode } from './validation.js';
import { EXPECTED_STORE_ID, validateExternalId } from './printful.js';

const verifiedEvents = new WeakSet();
const EVENTS = new Set(['order_created', 'order_updated', 'order_failed', 'order_canceled', 'order_refunded', 'order_put_hold', 'order_remove_hold', 'shipment_sent', 'shipment_delivered', 'shipment_returned', 'shipment_canceled']);
const MAX_BYTES = 128 * 1024;

function timestamp(value) {
  if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw new CommerceError('WEBHOOK_INVALID_TIME');
  const normalized = new Date(value).toISOString();
  if (normalized.slice(0, 19) !== value.slice(0, 19)) throw new CommerceError('WEBHOOK_INVALID_TIME');
  return normalized;
}

function httpsUrl(value) {
  if (value == null || value === '') return null;
  boundedText(value, 2000);
  try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch { /* Invalid links never enter tracking display. */ }
  throw new CommerceError('WEBHOOK_INVALID_TRACKING_URL');
}

function equalText(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/* Verify ORIGINAL bytes, before JSON parsing or middleware normalization. v1 is unsupported. */
export function verifyPrintfulV2Webhook({ rawBody, headers, secretHex, publicKey, now = Date.now() }) {
  if (!(rawBody instanceof Uint8Array) || !rawBody.byteLength || rawBody.byteLength > MAX_BYTES) throw new CommerceError('WEBHOOK_INVALID_SIZE');
  if (typeof secretHex !== 'string' || !/^(?:[a-fA-F0-9]{2}){16,256}$/.test(secretHex) || typeof publicKey !== 'string' || !/^[A-Za-z0-9+/]{4,512}={0,2}$/.test(publicKey)) throw new CommerceError('WEBHOOK_KEYS_REQUIRED');
  const requestHeaders = new Headers(headers);
  const signature = requestHeaders.get('x-pf-webhook-signature');
  if (!equalText(requestHeaders.get('x-pf-webhook-public-key'), publicKey) || !/^[a-fA-F0-9]{64}$/.test(signature || '')) throw new CommerceError('WEBHOOK_UNAUTHORIZED');
  const calculated = createHmac('sha256', Buffer.from(secretHex, 'hex')).update(rawBody).digest();
  if (!timingSafeEqual(calculated, Buffer.from(signature, 'hex'))) throw new CommerceError('WEBHOOK_UNAUTHORIZED');
  let payload;
  try { payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(rawBody)); } catch { throw new CommerceError('WEBHOOK_INVALID_JSON'); }
  if (!payload || !EVENTS.has(payload.type) || payload.store_id !== EXPECTED_STORE_ID || !Number.isSafeInteger(payload.retries) || payload.retries < 0 || payload.retries > 100000 || !payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) throw new CommerceError('WEBHOOK_INVALID_EVENT');
  const occurredAt = timestamp(payload.occurred_at);
  if (Date.parse(occurredAt) > now + 300000) throw new CommerceError('WEBHOOK_INVALID_TIME');
  const source = payload.data.order;
  if (!source || typeof source !== 'object' || (source.store_id != null && source.store_id !== EXPECTED_STORE_ID)) throw new CommerceError('WEBHOOK_ORDER_MISMATCH');
  const order = Object.freeze({ id: integer(source.id), externalId: source.external_id == null ? null : validateExternalId(source.external_id), status: boundedText(source.status, 80), updatedAt: source.updated_at == null ? occurredAt : timestamp(source.updated_at) });
  let shipment = null;
  if (payload.type.startsWith('shipment_')) {
    const sourceShipment = payload.data.shipment;
    if (!sourceShipment || (sourceShipment.store_id != null && sourceShipment.store_id !== EXPECTED_STORE_ID)) throw new CommerceError('WEBHOOK_SHIPMENT_MISMATCH');
    shipment = Object.freeze({ id: integer(sourceShipment.id), status: boundedText(sourceShipment.status, 80), trackingNumber: boundedText(sourceShipment.tracking_number, 200, false) || null, trackingUrl: httpsUrl(sourceShipment.tracking_url) });
  }
  let refund = null;
  if (payload.type === 'order_refunded') {
    if (typeof payload.data.amount !== 'string' || !/^(0|[1-9][0-9]{0,11})(\.[0-9]{1,3})?$/.test(payload.data.amount)) throw new CommerceError('WEBHOOK_INVALID_REFUND');
    refund = Object.freeze({ amount: payload.data.amount, currency: currencyCode(payload.data.currency) });
  }
  const normalized = { type: payload.type, occurredAt, storeId: payload.store_id, order, shipment, refund };
  // Provider retries change retries/header bytes. Canonical normalized content identifies the same event.
  const event = Object.freeze({ ...normalized, eventKey: createHash('sha256').update(JSON.stringify(normalized)).digest('hex') });
  verifiedEvents.add(event);
  return event;
}

/* Apply inside the same DB transaction as the UNIQUE eventKey ledger insert, never by itself. */
export function reduceProviderEvent(snapshot, event, processedKeys = new Set()) {
  if (!verifiedEvents.has(event) || !(processedKeys instanceof Set)) throw new CommerceError('VERIFIED_EVENT_REQUIRED');
  if (snapshot && (snapshot.orderId !== event.order.id || snapshot.storeId !== event.storeId)) throw new CommerceError('EVENT_MAPPING_MISMATCH');
  if (processedKeys.has(event.eventKey)) return { changed: false, duplicate: true, snapshot };
  const next = structuredClone(snapshot || { orderId: event.order.id, storeId: event.storeId, status: null, orderUpdatedAt: null, shipments: {}, refunds: {}, needsReconciliation: false, refunded: false });
  const comparison = next.orderUpdatedAt ? Date.parse(event.order.updatedAt) - Date.parse(next.orderUpdatedAt) : 1;
  if (comparison > 0) { next.status = event.order.status; next.orderUpdatedAt = event.order.updatedAt; }
  else if (comparison === 0 && next.status !== event.order.status) next.needsReconciliation = true;
  // Refund is separate from fulfillment and cannot be erased by a delayed status notification.
  if (event.refund) { next.refunded = true; (next.refunds ||= {})[event.eventKey] = { ...event.refund, occurredAt: event.occurredAt }; }
  if (event.shipment) {
    const prior = next.shipments[event.shipment.id];
    if (!prior || Date.parse(event.occurredAt) > Date.parse(prior.updatedAt)) next.shipments[event.shipment.id] = { ...event.shipment, updatedAt: event.occurredAt };
    else if (Date.parse(event.occurredAt) === Date.parse(prior.updatedAt) && prior.status !== event.shipment.status) next.needsReconciliation = true;
  }
  return { changed: JSON.stringify(next) !== JSON.stringify(snapshot), duplicate: false, eventKey: event.eventKey, snapshot: next };
}
