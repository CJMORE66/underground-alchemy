import { CommerceError } from './validation.js';
import { EXPECTED_STORE_ID } from './printful.js';

// Official V2 event/signature contract: https://developers.printful.com/docs/v2-beta/#tag/Webhook-v2
// This module authenticates routing hints only. Status/payment/recipient changes
// must be reconciled from a fresh provider read after durable inbox admission.
const encoder = new TextEncoder(), MAX_BYTES = 256 * 1024;
const ORDER_EVENTS = new Set(['order_created', 'order_updated', 'order_failed', 'order_canceled', 'order_refunded', 'order_put_hold', 'order_put_hold_approval', 'order_remove_hold']);
const SHIPMENT_EVENTS = new Set(['shipment_sent', 'shipment_delivered', 'shipment_returned', 'shipment_canceled', 'shipment_out_of_stock', 'shipment_put_hold', 'shipment_put_hold_approval', 'shipment_remove_hold']);
const IGNORED_EVENTS = new Set(['catalog_stock_updated', 'catalog_price_changed', 'mockup_task_finished', 'approval_sheet_status_changed']);
const reject = code => { throw new CommerceError(code, { status: code === 'PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED' ? 503 : 400 }); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hexBytes = value => Uint8Array.from(value.match(/../g), pair => Number.parseInt(pair, 16));
const hexadecimal = bytes => [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');

function base64(value) {
  if (typeof value !== 'string' || value.length < 4 || value.length > 512 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  try {
    const canonical = btoa(atob(value));
    return value.endsWith('=') ? canonical === value : canonical.replace(/=+$/, '') === value;
  } catch { return false; }
}

// JSON.parse alone silently accepts duplicate keys and loses their identity.
// Parse only authenticated bytes with explicit resource/shape limits, retaining
// a duplicate-key set after escape decoding and null-prototype object storage.
function strictJson(bytes) {
  let input;
  try { input = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { reject('PRINTFUL_WEBHOOK_INVALID_JSON'); }
  let offset = 0, nodes = 0, keys = 0;
  const number = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
  const invalid = () => reject('PRINTFUL_WEBHOOK_INVALID_JSON');
  const space = () => { while (/[\x20\t\r\n]/.test(input[offset] || '\0')) offset++; };
  function string(maximum = 16384) {
    if (input[offset] !== '"') invalid();
    const start = offset++; let escaped = false;
    while (offset < input.length) {
      const character = input[offset++];
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (character === '"') {
        let result;
        try { result = JSON.parse(input.slice(start, offset)); } catch { invalid(); }
        if (result.length > maximum) invalid();
        for (const character of result) { const code = character.codePointAt(0); if (code >= 0xd800 && code <= 0xdfff) invalid(); }
        return result;
      }
    }
    invalid();
  }
  function value(depth = 0) {
    if (depth > 24 || ++nodes > 20000) invalid(); space();
    const character = input[offset];
    if (character === '"') return string();
    if (character === '{') {
      offset++; space(); const result = Object.create(null), seen = new Set();
      if (input[offset] === '}') { offset++; return result; }
      for (;;) {
        space(); const key = string(200);
        if (seen.has(key) || ['__proto__', 'prototype', 'constructor'].includes(key) || seen.size >= 256 || ++keys > 10000) invalid();
        seen.add(key); space(); if (input[offset++] !== ':') invalid(); result[key] = value(depth + 1); space();
        const next = input[offset++]; if (next === '}') return result; if (next !== ',') invalid();
      }
    }
    if (character === '[') {
      offset++; space(); const result = [];
      if (input[offset] === ']') { offset++; return result; }
      for (;;) {
        if (result.length >= 4096) invalid(); result.push(value(depth + 1)); space();
        const next = input[offset++]; if (next === ']') return result; if (next !== ',') invalid();
      }
    }
    for (const [literal, result] of [['true', true], ['false', false], ['null', null]]) if (input.startsWith(literal, offset)) { offset += literal.length; return result; }
    number.lastIndex = offset; const match = number.exec(input);
    if (!match || match[0].length > 64) invalid(); offset += match[0].length;
    const result = Number(match[0]);
    if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER || Object.is(result, -0)) invalid();
    return result;
  }
  const result = value(); space(); if (offset !== input.length) invalid(); return result;
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
}
function occurredAt(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 19) !== value.slice(0, 19)) reject('PRINTFUL_WEBHOOK_INVALID_EVENT');
  return value;
}
function identifier(value) { if (!Number.isSafeInteger(value) || value <= 0) reject('PRINTFUL_WEBHOOK_INVALID_EVENT'); return value; }

export async function verifyPrintfulV2Webhook({ raw, publicKey, signature, expectedPublicKey, secretHex, expectedStoreId = EXPECTED_STORE_ID } = {}) {
  if (!(raw instanceof Uint8Array) || raw.byteLength < 1 || raw.byteLength > MAX_BYTES) reject('PRINTFUL_WEBHOOK_INVALID_SIZE');
  if (!base64(expectedPublicKey) || typeof secretHex !== 'string' || !/^(?:[0-9a-fA-F]{2}){16,256}$/.test(secretHex) || expectedStoreId !== EXPECTED_STORE_ID) reject('PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED');
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || ['importKey', 'sign', 'verify', 'digest'].some(name => typeof subtle[name] !== 'function')) reject('PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED');
  if (!base64(publicKey) || typeof signature !== 'string' || !/^[0-9a-fA-F]{64}$/.test(signature)) reject('PRINTFUL_WEBHOOK_UNAUTHORIZED');
  const bytes = new Uint8Array(raw); // Bind parsing to the exact authenticated byte snapshot, including Node Buffers.
  let authenticated = false;
  try {
    const key = await subtle.importKey('raw', hexBytes(secretHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    const expectedIdentifier = await subtle.sign('HMAC', key, encoder.encode(expectedPublicKey));
    const [keyMatches, bodyMatches] = await Promise.all([
      subtle.verify('HMAC', key, expectedIdentifier, encoder.encode(publicKey)),
      subtle.verify('HMAC', key, hexBytes(signature), bytes),
    ]);
    authenticated = keyMatches && bodyMatches;
  } catch { /* Crypto/provider errors never establish authentication. */ }
  if (!authenticated) reject('PRINTFUL_WEBHOOK_UNAUTHORIZED');

  const payload = strictJson(bytes);
  if (!object(payload) || Object.keys(payload).length !== 5 || Object.keys(payload).some(key => !['type', 'occurred_at', 'retries', 'store_id', 'data'].includes(key)) || typeof payload.type !== 'string' || !/^[a-z][a-z0-9_]{1,79}$/.test(payload.type) || !Number.isSafeInteger(payload.retries) || payload.retries < 0 || payload.store_id !== expectedStoreId) reject('PRINTFUL_WEBHOOK_INVALID_EVENT');
  const time = occurredAt(payload.occurred_at), ignored = IGNORED_EVENTS.has(payload.type);
  if (!ignored && !ORDER_EVENTS.has(payload.type) && !SHIPMENT_EVENTS.has(payload.type)) reject('PRINTFUL_WEBHOOK_UNSUPPORTED_EVENT');
  if (payload.type === 'catalog_stock_updated' ? !Array.isArray(payload.data) || payload.data.some(value => !object(value)) : !object(payload.data)) reject('PRINTFUL_WEBHOOK_INVALID_EVENT');
  let printfulId = null, externalId = null, shipmentId = null;
  if (!ignored) {
    const order = payload.data.order;
    if (!object(order) || (order.store_id !== undefined && order.store_id !== expectedStoreId)) reject('PRINTFUL_WEBHOOK_INVALID_EVENT');
    printfulId = identifier(order.id);
    if (order.external_id != null && (typeof order.external_id !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(order.external_id))) reject('PRINTFUL_WEBHOOK_INVALID_EVENT');
    externalId = order.external_id ?? null;
    if (SHIPMENT_EVENTS.has(payload.type)) {
      const shipment = payload.data.shipment;
      if (!object(shipment) || (shipment.store_id !== undefined && shipment.store_id !== expectedStoreId)) reject('PRINTFUL_WEBHOOK_INVALID_EVENT');
      shipmentId = identifier(shipment.id);
    }
  }
  // Retry count is mutable transport metadata, not event identity. Hash all
  // authenticated event data so distinct same-time updates cannot collapse.
  // No raw customer/tracking/approval data is returned for durable storage.
  const identity = canonical({ type: payload.type, occurred_at: time, store_id: payload.store_id, data: payload.data });
  const fingerprint = hexadecimal(new Uint8Array(await subtle.digest('SHA-256', encoder.encode(identity))));
  return Object.freeze({ fingerprint, type: payload.type, occurredAt: time, storeId: payload.store_id, printfulId, externalId, shipmentId, ignored });
}
