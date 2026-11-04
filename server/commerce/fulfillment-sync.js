import { CommerceError, boundedText, fulfillmentItems, integer } from './validation.js';
import { EXPECTED_STORE_ID, validateExternalId } from './printful.js';

// Printful v1 Order statuses. Fulfilled means shipped, never proof of delivery or payment.
export const PRINTFUL_ORDER_STATUSES = Object.freeze(['draft', 'inreview', 'pending', 'failed', 'canceled', 'inprocess', 'onhold', 'partial', 'fulfilled', 'archived']);
const fail = () => { throw new CommerceError('PRINTFUL_FULFILLMENT_INVALID'); };
const object = value => { if (!value || Object.getPrototypeOf(value) !== Object.prototype) fail(); return value; };
const exactKeys = (value, keys) => { object(value); if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail(); };
const timestamp = value => { if (!Number.isSafeInteger(value) || value < 0) fail(); return value; };
const optionalText = (value, max = 200) => value == null || value === '' ? null : boundedText(value, max);
const optionalTime = value => value == null ? null : timestamp(value);
const identifier = value => { const id = boundedText(value, 120); if (id !== value) fail(); return id; };
const sha = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
const externalIdFor = async orderId => 'ua_' + (await sha(identifier(orderId))).slice(0, 28);
const latestSnapshot = projection => JSON.stringify({ status: projection.status, shipments: projection.shipments.filter(shipment => shipment.reportedInLatest) });

export function safeTrackingUrl(value) {
  if (value == null || value === '') return null;
  try {
    const source = boundedText(value, 2048), url = new URL(source), host = url.hostname.toLowerCase();
    // Display-only links. No URL is fetched. Reject credentials, IP literals and local/reserved names.
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) || /\.(?:localhost|local|internal|invalid|test|example)$/.test(host) || host === 'localhost' || host.endsWith('.localhost')) fail();
    return url.href;
  } catch { return fail(); }
}

/** Whitelist-only durable/customer projection; no raw provider/customer/order bodies. */
export function validateFulfillmentProjection(value) {
  exactKeys(value, ['version', 'printfulId', 'externalId', 'storeId', 'providerUpdatedAt', 'status', 'shipments', 'needsReconciliation']);
  if (value.version !== 1 || value.storeId !== EXPECTED_STORE_ID || !PRINTFUL_ORDER_STATUSES.includes(value.status) || typeof value.needsReconciliation !== 'boolean' || !Array.isArray(value.shipments) || value.shipments.length > 100) fail();
  integer(value.printfulId); validateExternalId(value.externalId); timestamp(value.providerUpdatedAt);
  const seen = new Set();
  const shipments = value.shipments.map(shipment => {
    exactKeys(shipment, ['id', 'carrier', 'service', 'trackingNumber', 'trackingUrl', 'createdAt', 'shippedAt', 'reshipment', 'items', 'reportedInLatest']);
    integer(shipment.id); if (seen.has(shipment.id)) fail(); seen.add(shipment.id);
    if (![true, false, null].includes(shipment.reshipment) || typeof shipment.reportedInLatest !== 'boolean' || !Array.isArray(shipment.items) || !shipment.items.length || shipment.items.length > 100) fail();
    const itemIds = new Set();
    const items = shipment.items.map(item => {
      exactKeys(item, ['itemId', 'syncVariantId', 'quantity']);
      integer(item.itemId); integer(item.syncVariantId); integer(item.quantity, 100);
      if (itemIds.has(item.itemId)) fail(); itemIds.add(item.itemId);
      return { itemId: item.itemId, syncVariantId: item.syncVariantId, quantity: item.quantity };
    }).sort((a, b) => a.itemId - b.itemId);
    return { id: shipment.id, carrier: optionalText(shipment.carrier), service: optionalText(shipment.service), trackingNumber: optionalText(shipment.trackingNumber), trackingUrl: safeTrackingUrl(shipment.trackingUrl), createdAt: optionalTime(shipment.createdAt), shippedAt: optionalTime(shipment.shippedAt), reshipment: shipment.reshipment, items, reportedInLatest: shipment.reportedInLatest };
  }).sort((a, b) => a.id - b.id);
  return { version: 1, printfulId: value.printfulId, externalId: value.externalId, storeId: value.storeId, providerUpdatedAt: value.providerUpdatedAt, status: value.status, shipments, needsReconciliation: value.needsReconciliation };
}

export function projectPrintfulOrder(remote, { order, mapping, nowMs }) {
  object(remote); timestamp(nowMs);
  if (remote.id !== mapping.printfulId || remote.external_id !== mapping.externalId || (remote.store_id != null && remote.store_id !== EXPECTED_STORE_ID) || !PRINTFUL_ORDER_STATUSES.includes(remote.status)) fail();
  const created = timestamp(remote.created), updated = timestamp(remote.updated), now = Math.floor(nowMs / 1000) + 300;
  if (updated < created || updated > now || JSON.stringify(fulfillmentItems(remote.items)) !== JSON.stringify(fulfillmentItems(order.items))) fail();
  const byItemId = new Map();
  for (const item of remote.items) { integer(item.id); if (byItemId.has(item.id)) fail(); byItemId.set(item.id, item); }
  if (!Array.isArray(remote.shipments) || remote.shipments.length > 100) fail();
  const shipments = remote.shipments.map(shipment => {
    object(shipment);
    if (!Array.isArray(shipment.items)) fail();
    const items = shipment.items.map(item => {
      object(item); const original = byItemId.get(item.item_id);
      if (!original || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > original.quantity) fail();
      return { itemId: item.item_id, syncVariantId: original.sync_variant_id, quantity: item.quantity };
    });
    const trackingNumber = Number.isSafeInteger(shipment.tracking_number) && shipment.tracking_number >= 0 ? String(shipment.tracking_number) : shipment.tracking_number;
    const result = { id: shipment.id, carrier: optionalText(shipment.carrier), service: optionalText(shipment.service), trackingNumber: optionalText(trackingNumber), trackingUrl: safeTrackingUrl(shipment.tracking_url), createdAt: optionalTime(shipment.created), shippedAt: optionalTime(shipment.shipped_at), reshipment: shipment.reshipment == null ? null : shipment.reshipment, items, reportedInLatest: true };
    if ([result.createdAt, result.shippedAt].some(time => time != null && time > now)) fail();
    return result;
  });
  return validateFulfillmentProjection({ version: 1, printfulId: remote.id, externalId: remote.external_id, storeId: EXPECTED_STORE_ID, providerUpdatedAt: updated, status: remote.status, shipments, needsReconciliation: false });
}

/** No status ranking: on-hold, failure and cancellation can be legitimate later states. */
export function reduceFulfillmentProjection(previous, candidate) {
  const next = validateFulfillmentProjection(candidate);
  if (!previous) return next;
  const prior = validateFulfillmentProjection(previous);
  if (prior.printfulId !== next.printfulId || prior.externalId !== next.externalId || prior.storeId !== next.storeId) fail();
  if (next.providerUpdatedAt < prior.providerUpdatedAt) return prior;
  if (next.providerUpdatedAt === prior.providerUpdatedAt) {
    return latestSnapshot(prior) === latestSnapshot(next) ? prior : { ...prior, needsReconciliation: true };
  }
  const currentIds = new Set(next.shipments.map(shipment => shipment.id));
  return validateFulfillmentProjection({ ...next, shipments: [...next.shipments, ...prior.shipments.filter(shipment => !currentIds.has(shipment.id)).map(shipment => ({ ...shipment, reportedInLatest: false }))] });
}

/** Authenticated owner read/poll only. Never creates/confirms orders or verifies payment. */
export class FulfillmentSyncService {
  #repository; #client; #clock;
  constructor({ repository, printful, clock = Date.now } = {}) {
    if (!repository || ['getOrder', 'getDraft', 'getFulfillmentProjection', 'saveFulfillmentProjection'].some(method => typeof repository[method] !== 'function') || !printful || ['verifyStore', 'lookupOrder'].some(method => typeof printful[method] !== 'function') || typeof clock !== 'function') throw new CommerceError('FULFILLMENT_ADAPTERS_REQUIRED');
    this.#repository = repository; this.#client = printful; this.#clock = clock;
  }
  async refreshOrder(orderId, { ownerId } = {}) {
    identifier(orderId); identifier(ownerId);
    const order = await this.#repository.getOrder(orderId);
    if (!order || order.id !== orderId || order.ownerId !== ownerId) throw new CommerceError('ORDER_NOT_FOUND', { status: 404 });
    const mapping = await this.#repository.getDraft(orderId);
    if (!mapping || mapping.state !== 'created' || mapping.orderId !== orderId || !Number.isSafeInteger(mapping.printfulId) || mapping.printfulId <= 0 || mapping.externalId !== await externalIdFor(orderId)) throw new CommerceError('FULFILLMENT_MAPPING_REQUIRED');
    const store = await this.#client.verifyStore();
    if (store?.verified !== true || store.id !== EXPECTED_STORE_ID) throw new CommerceError('PRINTFUL_STORE_MISMATCH');
    const remote = await this.#client.lookupOrder(mapping.externalId);
    if (!remote) throw new CommerceError('PRINTFUL_FULFILLMENT_NOT_FOUND', { retryable: true });
    const now = this.#clock(), candidate = projectPrintfulOrder(remote, { order, mapping, nowMs: now });
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await this.#repository.getFulfillmentProjection(orderId, { ownerId });
      const projection = reduceFulfillmentProjection(existing?.projection, candidate);
      if (existing && JSON.stringify(projection) === JSON.stringify(existing.projection) && (existing.observedAt >= now || candidate.providerUpdatedAt < existing.providerUpdatedAt)) return existing;
      try {
        return await this.#repository.saveFulfillmentProjection({ orderId, ownerId, printfulId: mapping.printfulId, externalId: mapping.externalId, expectedHash: existing?.projectionHash ?? null, projection, observedAt: now });
      } catch (error) { if (error?.code !== 'FULFILLMENT_SYNC_CONFLICT' || attempt === 2) throw error; }
    }
  }
}
