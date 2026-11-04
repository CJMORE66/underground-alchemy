/* ISOLATED: actual WebCrypto HMAC verification over synthetic v2 webhook bytes.
 * No provider calls, account credentials, customer records or fulfillment. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, webcrypto } from 'node:crypto';
import { verifyPrintfulV2Webhook } from '../server/commerce/printful-webhook.js';

const STORE = 18912189, encoder = new TextEncoder();
const secretHex = (length = 32) => Array.from({ length }, (_, index) => ((index + 17) % 256).toString(16).padStart(2, '0')).join('');
const publicKey = () => Buffer.from('isolated-public-webhook-identifier').toString('base64');
const code = (expected, status = 400) => error => error?.code === expected && error.status === status;
const clone = value => structuredClone(value);
const orderEvents = ['order_created', 'order_updated', 'order_failed', 'order_canceled', 'order_refunded', 'order_put_hold', 'order_put_hold_approval', 'order_remove_hold'];
const shipmentEvents = ['shipment_sent', 'shipment_delivered', 'shipment_returned', 'shipment_canceled', 'shipment_out_of_stock', 'shipment_put_hold', 'shipment_put_hold_approval', 'shipment_remove_hold'];
const event = (type = 'order_updated') => ({ type, occurred_at: '2026-11-01T12:34:56.123456Z', store_id: STORE, retries: 0,
  data: { order: { id: 123, external_id: 'ua_isolated_order-123', store_id: STORE, status: 'draft' }, ...(type.startsWith('shipment_') ? { shipment: { id: 456, store_id: STORE } } : {}) } });
async function signed(value = event(), { secret = secretHex(), raw } = {}) {
  raw ??= encoder.encode(typeof value === 'string' ? value : JSON.stringify(value));
  const key = await webcrypto.subtle.importKey('raw', Buffer.from(secret, 'hex'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Buffer.from(await webcrypto.subtle.sign('HMAC', key, raw)).toString('hex');
  return { raw, signature, publicKey: publicKey(), expectedPublicKey: publicKey(), secretHex: secret, expectedStoreId: STORE };
}
async function verify(value = event(), options) { return verifyPrintfulV2Webhook(await signed(value, options)); }

test('real WebCrypto authenticates hex-decoded bytes and exposes a frozen hint without private event data', async () => {
  const source = event(); source.data.private_customer = { email: 'isolated@example.test', address1: 'Synthetic private address' };
  const input = await signed(source);
  assert.equal(input.signature, createHmac('sha256', Buffer.from(input.secretHex, 'hex')).update(input.raw).digest('hex'));
  const hint = await verifyPrintfulV2Webhook(input);
  assert.deepEqual(Object.keys(hint).sort(), ['fingerprint', 'type', 'occurredAt', 'storeId', 'printfulId', 'externalId', 'shipmentId', 'ignored'].sort());
  assert.equal(hint.type, source.type); assert.equal(hint.occurredAt, source.occurred_at); assert.equal(hint.storeId, STORE); assert.equal(hint.printfulId, 123); assert.equal(hint.externalId, 'ua_isolated_order-123'); assert.equal(hint.shipmentId, null); assert.equal(hint.ignored, false);
  assert.match(hint.fingerprint, /^[a-f0-9]{64}$/); assert.equal(Object.isFrozen(hint), true);
  assert(!JSON.stringify(hint).includes('isolated@example.test')); assert(!JSON.stringify(hint).includes('Synthetic private address'));
});

test('verification and parsing use an immutable snapshot even if the caller mutates raw bytes during async crypto', async () => {
  const input = await signed(), expected = await verifyPrintfulV2Webhook(input);
  const pending = verifyPrintfulV2Webhook(input); input.raw.fill(0);
  assert.deepEqual(await pending, expected);
});

test('fingerprints ignore object key order, raw whitespace and retries while retaining full data', async () => {
  const source = event(), first = await verify(source);
  const reordered = { retries: 37, data: { order: { status: 'draft', store_id: STORE, external_id: 'ua_isolated_order-123', id: 123 } }, store_id: STORE, occurred_at: source.occurred_at, type: source.type };
  const second = await verify(JSON.stringify(reordered, null, 2)); assert.equal(second.fingerprint, first.fingerprint);
  for (const mutate of [value => { value.data.order.status = 'pending'; }, value => { value.data.private_customer = { email: 'isolated@example.test' }; }, value => { value.data.order.metadata = { values: [1, 2] }; }]) {
    const changed = event(); mutate(changed); assert.notEqual((await verify(changed)).fingerprint, first.fingerprint);
  }
  const a = event(), b = event(); a.data.sequence = [1, 2]; b.data.sequence = [2, 1];
  assert.notEqual((await verify(a)).fingerprint, (await verify(b)).fingerprint);
});

test('all sixteen documented order/shipment notifications produce mapped hints without assuming payment', async () => {
  for (const type of [...orderEvents, ...shipmentEvents]) {
    const hint = await verify(event(type)); assert.equal(hint.type, type); assert.equal(hint.printfulId, 123); assert.equal(hint.shipmentId, type.startsWith('shipment_') ? 456 : null); assert.equal(hint.ignored, false);
    assert.equal(Object.hasOwn(hint, 'paid'), false); assert.equal(Object.hasOwn(hint, 'status'), false);
  }
});

test('known non-order event shapes, including catalog stock arrays, are authenticated then ignored', async () => {
  for (const type of ['catalog_stock_updated', 'catalog_price_changed', 'mockup_task_finished', 'approval_sheet_status_changed']) {
    const source = event(type); source.data = type === 'catalog_stock_updated' ? [{ variant_id: 1, availability_status: 'active' }] : { id: 1, state: 'synthetic' };
    const hint = await verify(source); assert.equal(hint.ignored, true); assert.equal(hint.printfulId, null); assert.equal(hint.externalId, null); assert.equal(hint.shipmentId, null); assert.match(hint.fingerprint, /^[a-f0-9]{64}$/);
  }
  const malformed = event('catalog_stock_updated'); malformed.data = [1];
  await assert.rejects(verify(malformed), code('PRINTFUL_WEBHOOK_INVALID_EVENT'));
});

test('unknown types and invalid envelope/store identity are rejected after authentication', async () => {
  await assert.rejects(verify(event('synthetic_unknown_event')), code('PRINTFUL_WEBHOOK_UNSUPPORTED_EVENT'));
  for (const mutate of [source => { source.store_id = STORE + 1; }, source => { source.store_id = String(STORE); }, source => { source.retries = -1; }, source => { source.retries = 1.5; }, source => { source.extra = 'unexpected'; }, source => { delete source.occurred_at; }, source => { source.data = null; }]) {
    const source = event(); mutate(source); await assert.rejects(verify(source), code('PRINTFUL_WEBHOOK_INVALID_EVENT'));
  }
});

test('tampering and wrong key/signature are unauthorized before malformed JSON is parsed', async () => {
  const input = await signed();
  for (const changed of [{ ...input, raw: encoder.encode('{}') }, { ...input, signature: '0'.repeat(64) }, { ...input, publicKey: Buffer.from('different-public-identifier').toString('base64') }, { ...input, signature: input.signature.slice(1) }, { ...input, signature: 'g'.repeat(64) }]) await assert.rejects(verifyPrintfulV2Webhook(changed), code('PRINTFUL_WEBHOOK_UNAUTHORIZED'));
  const malformed = await signed('{broken');
  await assert.rejects(verifyPrintfulV2Webhook({ ...malformed, signature: '0'.repeat(64) }), code('PRINTFUL_WEBHOOK_UNAUTHORIZED'));
  await assert.rejects(verifyPrintfulV2Webhook(malformed), code('PRINTFUL_WEBHOOK_INVALID_JSON'));
  assert.equal((await verifyPrintfulV2Webhook({ ...input, signature: input.signature.toUpperCase() })).printfulId, 123);
});

test('canonical encoded key identifiers compare exactly and hex secret size/configuration is bounded', async () => {
  for (const length of [16, 256]) assert.equal((await verify(event(), { secret: secretHex(length) })).printfulId, 123);
  const input = await signed();
  for (const secret of [undefined, '', '0'.repeat(31), 'q'.repeat(64), secretHex(15), secretHex(257)]) await assert.rejects(verifyPrintfulV2Webhook({ ...input, secretHex: secret }), code('PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED', 503));
  for (const expectedPublicKey of [undefined, '', 'not canonical base64!', publicKey() + '=']) await assert.rejects(verifyPrintfulV2Webhook({ ...input, expectedPublicKey }), code('PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED', 503));
  await assert.rejects(verifyPrintfulV2Webhook({ ...input, expectedStoreId: STORE + 1 }), code('PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED', 503));
  const padded = Buffer.from('isolated-key-id-x').toString('base64'), unpadded = padded.replace(/=+$/, '');
  assert.notEqual(padded, unpadded, 'Fixture must exercise an actual padding difference');
  assert.equal((await verifyPrintfulV2Webhook({ ...input, publicKey: unpadded, expectedPublicKey: unpadded })).printfulId, 123);
  await assert.rejects(verifyPrintfulV2Webhook({ ...input, publicKey: unpadded, expectedPublicKey: padded }), code('PRINTFUL_WEBHOOK_UNAUTHORIZED'));
});

test('raw input must be a nonempty Uint8Array bounded to256KiB', async () => {
  const input = await signed();
  for (const raw of [undefined, '', {}, new Uint8Array(), new Uint8Array(256 * 1024 + 1)]) await assert.rejects(verifyPrintfulV2Webhook({ ...input, raw }), code('PRINTFUL_WEBHOOK_INVALID_SIZE'));
});

test('duplicate keys, escaped aliases and prototype keys are rejected at every nesting level', async () => {
  const original = JSON.stringify(event());
  const bodies = [original.replace('"retries":0', '"retries":0,"retries":1'), original.replace('"type":', '"\\u0074ype":"order_created","type":'), original.replace('"id":123', '"id":123,"\\u0069d":456')];
  for (const name of ['__proto__', 'constructor', 'prototype']) bodies.push(original.replace('"status":"draft"', '"status":"draft",' + JSON.stringify(name) + ':{"private":"synthetic"}'));
  for (const body of bodies) await assert.rejects(verify(body), code('PRINTFUL_WEBHOOK_INVALID_JSON'));
});

test('unsafe/nonfinite numeric values and negative zero cannot be fingerprinted as different or rounded data', async () => {
  for (const number of ['9007199254740992', '-9007199254740992', '1e309', '-1e309', '-0', '-0.0', '-0e0']) {
    const body = JSON.stringify(event()).replace('"status":"draft"', '"status":"draft","numeric_metadata":' + number);
    await assert.rejects(verify(body), code('PRINTFUL_WEBHOOK_INVALID_JSON'));
  }
});

test('fatal UTF-8, BOM and lone surrogate rejection preserves valid paired Unicode', async () => {
  const valid = await signed();
  for (const raw of [new Uint8Array([0xc3, 0x28]), new Uint8Array([0xef, 0xbb, 0xbf, ...valid.raw])]) await assert.rejects(verifyPrintfulV2Webhook(await signed(undefined, { raw })), code('PRINTFUL_WEBHOOK_INVALID_JSON'));
  for (const invalid of ['\\ud800', '\\udfff']) {
    const body = JSON.stringify(event()).replace('"status":"draft"', '"status":"draft","note":"' + invalid + '"');
    await assert.rejects(verify(body), code('PRINTFUL_WEBHOOK_INVALID_JSON'));
  }
  const source = event(); source.data.note = 'Synthetic unicode 🧪'; assert.equal((await verify(source)).printfulId, 123);
});

test('depth, node, key, array and string bounds reject resource amplification before event admission', async () => {
  const oversized = [];
  let deep = {}; for (let depth = 0; depth < 30; depth++) deep = { next: deep }; oversized.push(deep);
  oversized.push(Array.from({ length: 5 }, () => Array(4000).fill(0)));
  oversized.push(Array.from({ length: 42 }, () => Object.fromEntries(Array.from({ length: 240 }, (_, index) => ['key' + index, 0]))));
  oversized.push(Object.fromEntries(Array.from({ length: 257 }, (_, index) => ['key' + index, 0])));
  oversized.push(Array(4097).fill(0)); oversized.push('x'.repeat(16385)); oversized.push({ ['k'.repeat(201)]: 'synthetic' });
  for (const metadata of oversized) {
    const source = event(); source.data.metadata = metadata;
    assert(encoder.encode(JSON.stringify(source)).byteLength < 256 * 1024, 'Parser-limit fixture must stay within the independent raw-byte bound');
    await assert.rejects(verify(source), code('PRINTFUL_WEBHOOK_INVALID_JSON'));
  }
  const valid = event(); valid.data.note = 'x'.repeat(16384); assert.equal((await verify(valid)).printfulId, 123);
});

test('UTC calendar precision is preserved and legitimate old/future retries have no local age cutoff', async () => {
  for (const occurred_at of ['2000-02-29T23:59:59Z', '2099-11-01T12:34:56.1Z', '2026-11-01T12:34:56.123456Z']) {
    const source = event(); source.occurred_at = occurred_at; assert.equal((await verify(source)).occurredAt, occurred_at);
  }
  for (const occurred_at of ['2026-02-29T12:00:00Z', '2026-13-01T12:00:00Z', '2026-11-01T24:00:00Z', '2026-11-01T12:00:60Z', '2026-11-01T12:00:00+00:00', '2026-11-01T12:00:00.Z', 'not-a-date']) {
    const source = event(); source.occurred_at = occurred_at; await assert.rejects(verify(source), code('PRINTFUL_WEBHOOK_INVALID_EVENT'));
  }
});

test('order, shipment and external identifiers reject coercion, missing data and foreign nested stores', async () => {
  for (const id of [0, -1, '123', 1.5]) { const source = event(); source.data.order.id = id; await assert.rejects(verify(source), code('PRINTFUL_WEBHOOK_INVALID_EVENT')); }
  for (const external of ['', 'x'.repeat(33), 'nonASCII-ž', 'bad\nidentifier']) { const source = event(); source.data.order.external_id = external; await assert.rejects(verify(source), code('PRINTFUL_WEBHOOK_INVALID_EVENT')); }
  const optional = event(); delete optional.data.order.external_id; assert.equal((await verify(optional)).externalId, null);
  for (const mutate of [source => { delete source.data.order; }, source => { source.data.order.store_id = STORE + 1; }, source => { delete source.data.shipment; }, source => { source.data.shipment.id = 0; }, source => { source.data.shipment.store_id = STORE + 1; }]) {
    const source = event('shipment_sent'); mutate(source); await assert.rejects(verify(source), code('PRINTFUL_WEBHOOK_INVALID_EVENT'));
  }
});

test('signed malformed JSON syntax is rejected without permissive parser fallbacks', async () => {
  for (const body of ['{', '{"a":1,}', '{/*comment*/"a":1}', "{'a':1}", 'NaN', JSON.stringify(event()) + '{}']) await assert.rejects(verify(body), code('PRINTFUL_WEBHOOK_INVALID_JSON'));
  for (const body of ['null', '[]', 'true', '1']) await assert.rejects(verify(body), code('PRINTFUL_WEBHOOK_INVALID_EVENT'));
});
