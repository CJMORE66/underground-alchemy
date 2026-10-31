/* ISOLATED TESTS ONLY: synthetic data, fake HTTP transports/repositories; no real API. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { PrintfulClient, EXPECTED_STORE_ID, draftPayload } from '../server/commerce/printful.js';
import { DraftOrderService, externalOrderId, transitionOrder } from '../server/commerce/orders.js';
import { verifyPrintfulV2Webhook, reduceProviderEvent } from '../server/commerce/webhooks.js';
import { decimalToMinor, orderTotalMinor, fulfillmentItems } from '../server/commerce/validation.js';
import { verifyPrintful } from '../tools/verify-printful.mjs';

const TOKEN = 'isolated-test-token';
const reply = (result, status = 200, headers = {}, paging) => new Response(JSON.stringify({ code: status, result, ...(paging ? { paging } : {}) }), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const stores = () => reply([{ id: EXPECTED_STORE_ID, name: 'Synthetic fixture' }]);
const recipient = { name: 'Isolated Test', address1: 'Synthetic Test Street 1', city: 'Synthetic City', zip: '00000', country_code: 'FR' };
const draftInput = { externalId: 'isolated_order_1', recipient, items: [{ sync_variant_id: 123, quantity: 2 }], shippingId: 'SYNTHETIC_STANDARD' };
const remoteDraft = (input = draftInput) => ({ id: 456, external_id: input.externalId, status: 'draft', recipient: input.recipient, items: input.items, shipping: input.shippingId });
const errorCode = code => error => error?.code === code;

async function readyClient(handler, options = {}) {
  const requests = [];
  const client = new PrintfulClient({ token: TOKEN, sleep: async () => {}, fetch: async (url, init) => {
    requests.push({ url, init });
    if (url === 'https://api.printful.com/stores') return stores();
    return handler(url, init);
  }, ...options });
  await client.verifyStore();
  return { client, requests };
}

test('missing credentials/configuration blocks CLI before network', async () => {
  let calls = 0;
  const options = { clientFactory() { calls++; throw Error('must not run'); } };
  assert.deepEqual(await verifyPrintful({}, options), { status: 'BLOCKED', code: 'PRINTFUL_TOKEN_REQUIRED', networkAttempted: false });
  assert.equal((await verifyPrintful({ PRINTFUL_API_TOKEN: TOKEN }, options)).code, 'PRINTFUL_PLATFORM_REQUIRED');
  assert.equal(calls, 0);
});

test('store authentication uses exact host, Bearer, store header and no redirects', async () => {
  const requests = [];
  const client = new PrintfulClient({ token: TOKEN, fetch: async (url, init) => { requests.push({ url, init }); return stores(); } });
  await assert.rejects(client.lookupOrder('isolated'), errorCode('PRINTFUL_STORE_NOT_VERIFIED'));
  assert.deepEqual(await client.verifyStore(), { id: EXPECTED_STORE_ID, verified: true });
  assert.equal(requests[0].url, 'https://api.printful.com/stores');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer ' + TOKEN);
  assert.equal(requests[0].init.headers['X-PF-Store-Id'], String(EXPECTED_STORE_ID));
  assert.equal(requests[0].init.redirect, 'error');
  assert.equal(requests[0].init.method, 'GET');
  assert.equal(typeof client.confirmOrder, 'undefined');
  assert.equal(typeof client.request, 'undefined');
});

test('wrong store and unauthorized token fail without sensitive logging/retries', async () => {
  const wrong = new PrintfulClient({ token: TOKEN, fetch: async () => reply([{ id: 999 }]) });
  await assert.rejects(wrong.verifyStore(), errorCode('PRINTFUL_STORE_MISMATCH'));
  const logs = []; let requests = 0;
  const unauthorized = new PrintfulClient({ token: TOKEN, log: entry => logs.push(entry), fetch: async () => { requests++; return reply({ secret: TOKEN, customer: recipient }, 401); } });
  await assert.rejects(unauthorized.verifyStore(), errorCode('PRINTFUL_AUTH_FAILED'));
  assert.equal(requests, 1);
  assert.equal(JSON.stringify(logs).includes(TOKEN), false);
  assert.equal(JSON.stringify(logs).includes(recipient.name), false);
});

test('GET retries honor Retry-After and stop at the bounded wait instead of shortening it', async () => {
  let calls = 0; const waits = [];
  const client = new PrintfulClient({ token: TOKEN, sleep: async ms => waits.push(ms), fetch: async () => ++calls === 1 ? reply(null, 429, { 'Retry-After': '2' }) : stores() });
  await client.verifyStore();
  assert.equal(calls, 2); assert.deepEqual(waits, [2000]);
  const tooLong = new PrintfulClient({ token: TOKEN, sleep: async () => assert.fail('must reschedule externally'), fetch: async () => reply(null, 429, { 'Retry-After': '120' }) });
  await assert.rejects(tooLong.verifyStore(), errorCode('PRINTFUL_RETRY_LATER'));
});

test('network timeouts are bounded and diagnostics exceptions cannot repeat a mutation', async () => {
  let attempts = 0;
  const timeout = new PrintfulClient({ token: TOKEN, retryLimit: 0, timeoutMs: 5, fetch: (_url, { signal }) => new Promise((_, reject) => { attempts++; signal.addEventListener('abort', () => reject(new Error(TOKEN))); }) });
  await assert.rejects(timeout.verifyStore(), errorCode('PRINTFUL_TRANSPORT_ERROR'));
  assert.equal(attempts, 1);
  const { client, requests } = await readyClient(async () => reply(remoteDraft()), { log() { throw Error('logger failed'); } });
  await client.createDraft(draftInput);
  assert.equal(requests.filter(request => request.init.method === 'POST').length, 1);
});

test('malformed, non-JSON and oversized responses fail closed', async () => {
  for (const response of [new Response('<html>bad</html>', { headers: { 'Content-Type': 'text/html' } }), new Response('{bad', { headers: { 'Content-Type': 'application/json' } }), reply([], 200)]) {
    const client = new PrintfulClient({ token: TOKEN, fetch: async () => response });
    await assert.rejects(client.verifyStore());
  }
  const large = new PrintfulClient({ token: TOKEN, fetch: async () => new Response(' '.repeat(2 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'application/json' } }) });
  await assert.rejects(large.verifyStore(), errorCode('PRINTFUL_RESPONSE_TOO_LARGE'));
});

test('catalog summary follows real pagination, accepts an empty store, rejects duplicates', async () => {
  const pages = [reply([{ id: 1 }], 200, {}, { total: 2, offset: 0, limit: 1 }), reply([{ id: 2 }], 200, {}, { total: 2, offset: 1, limit: 1 })];
  const { client, requests } = await readyClient(async () => pages.shift());
  assert.equal((await client.catalogSummary({ platform: 'ecommerce' })).productCount, 2);
  assert.match(requests[1].url, /\/sync\/products\?offset=0&limit=100$/);
  const empty = await readyClient(async () => reply([], 200, {}, { total: 0, offset: 0, limit: 100 }));
  assert.equal((await empty.client.catalogSummary({ platform: 'api' })).productCount, 0);
  const duplicate = await readyClient(async () => reply([{ id: 1 }, { id: 1 }], 200, {}, { total: 2, offset: 0, limit: 100 }));
  await assert.rejects(duplicate.client.catalogSummary({ platform: 'api' }), errorCode('PRINTFUL_DUPLICATE_PRODUCT'));
});

test('shipping validates recipient and exact catalog variant IDs; no invented currency/rates', async () => {
  const { client, requests } = await readyClient(async () => reply([{ id: 'SYNTHETIC_STANDARD', name: 'Synthetic shipping', rate: '4.50', currency: 'EUR' }]));
  const rates = await client.shippingRates({ recipient: { ...recipient, unsafe: TOKEN }, items: [{ variant_id: 321, quantity: 2, value: '0.01' }], currency: 'EUR' });
  assert.equal(rates[0].rate, '4.50');
  const body = JSON.parse(requests.at(-1).init.body);
  assert.deepEqual(body.items, [{ variant_id: 321, quantity: 2 }]);
  assert.equal(Object.hasOwn(body.recipient, 'unsafe'), false);
  const before = requests.length;
  await assert.rejects(client.shippingRates({ recipient: { country_code: 'US' }, items: [{ variant_id: 1, quantity: 1 }], currency: 'EUR' }), errorCode('STATE_REQUIRED'));
  assert.equal(requests.length, before);
  await assert.rejects(client.shippingRates({ recipient, items: [{ variant_id: 1, quantity: 1 }], currency: 'USD' }), errorCode('PRINTFUL_INVALID_RATES'));
});

test('draft POST strips untrusted options and always disables confirmation/update', async () => {
  const { client, requests } = await readyClient(async () => reply(remoteDraft()));
  assert.deepEqual(await client.createDraft({ ...draftInput, confirm: true, update_existing: true, paid: true }), { id: 456, externalId: draftInput.externalId, status: 'draft' });
  const request = requests.at(-1);
  assert.equal(request.url, 'https://api.printful.com/orders?confirm=false&update_existing=false');
  assert.deepEqual(JSON.parse(request.init.body), draftPayload(draftInput));
  assert.equal(Object.hasOwn(JSON.parse(request.init.body), 'confirm'), false);
});

test('ambiguous draft POST reconciles by external ID and never repeats the POST', async () => {
  const { client, requests } = await readyClient(async (url, init) => { if (init.method === 'POST') throw Error('synthetic disconnect after create'); return reply(remoteDraft()); });
  assert.equal((await client.createDraft(draftInput)).id, 456);
  assert.equal(requests.filter(request => request.init.method === 'POST').length, 1);
  assert.equal(requests.at(-1).url, 'https://api.printful.com/orders/@isolated_order_1');
  const uncertain = await readyClient(async (_url, init) => init.method === 'POST' ? reply(null, 503) : reply(null, 404));
  await assert.rejects(uncertain.client.createDraft(draftInput), errorCode('PRINTFUL_DRAFT_UNCERTAIN'));
  assert.equal(uncertain.requests.filter(request => request.init.method === 'POST').length, 1);
  const oversized = await readyClient(async (_url, init) => init.method === 'POST' ? new Response(' '.repeat(2 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'application/json' } }) : reply(remoteDraft()));
  assert.equal((await oversized.client.createDraft(draftInput)).id, 456);
  assert.equal(oversized.requests.filter(request => request.init.method === 'POST').length, 1);
});

test('confirmed or mismatched remote orders cannot be accepted as safe drafts', async () => {
  const confirmed = await readyClient(async () => reply({ ...remoteDraft(), status: 'pending' }));
  await assert.rejects(confirmed.client.createDraft(draftInput), errorCode('DRAFT_MISMATCH'));
  const wrong = await readyClient(async () => reply({ ...remoteDraft(), items: [{ sync_variant_id: 999, quantity: 2 }] }));
  await assert.rejects(wrong.client.createDraft(draftInput), errorCode('DRAFT_MISMATCH'));
});

function serviceFixture({ paymentPatch = {}, persistFailure = false } = {}) {
  const order = { id: 'synthetic_internal_order', totalMinor: 1000, currency: 'EUR', recipient, items: draftInput.items, shippingId: draftInput.shippingId, paid: true };
  let claim = null, remote = null, posts = 0, failedPersistence = false; const failures = [];
  const repository = {
    async getOrder() { return structuredClone(order); },
    async claimDraft(input) { if (!claim) { claim = { ...input, state: 'reserved' }; return { ...claim, acquired: true }; } return { ...claim, acquired: false }; },
    async markDraftCreated(result) { if (persistFailure && !failedPersistence) { failedPersistence = true; throw Error('synthetic DB interruption'); } claim = { ...claim, state: 'created', printfulId: result.printfulId }; },
    async recordDraftFailure(failure) { failures.push(failure); }
  };
  const client = {
    async lookupOrder() { return remote; },
    async createDraft(input) { posts++; await Promise.resolve(); remote = remoteDraft(input); return { id: remote.id, externalId: remote.external_id, status: 'draft' }; }
  };
  const verifyPayment = async () => ({ verified: true, status: 'paid', orderId: order.id, amountMinor: order.totalMinor, currency: order.currency, providerReference: 'synthetic_provider_reference', ...paymentPatch });
  return { order, repository, client, verifyPayment, failures, posts: () => posts, service: new DraftOrderService({ client, repository, verifyPayment }) };
}

test('payment must be verified by the injected server verifier, bound to order/amount/currency', async () => {
  for (const paymentPatch of [{ verified: false }, { status: 'pending' }, { amountMinor: 1 }, { currency: 'USD' }, { orderId: 'another_order' }]) {
    const fixture = serviceFixture({ paymentPatch });
    await assert.rejects(fixture.service.createForPaidOrder(fixture.order.id), errorCode('PAYMENT_NOT_VERIFIED'));
    assert.equal(fixture.posts(), 0);
  }
});

test('atomic draft reservation prevents concurrent and repeated fulfillment creation', async () => {
  const fixture = serviceFixture();
  const results = await Promise.allSettled([fixture.service.createForPaidOrder(fixture.order.id), fixture.service.createForPaidOrder(fixture.order.id)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length >= 1, true);
  await fixture.service.createForPaidOrder(fixture.order.id);
  assert.equal(fixture.posts(), 1);
  assert.equal(externalOrderId(fixture.order.id).length <= 32, true);
});

test('interrupted persistence recovers by lookup; a changed reserved payload is rejected', async () => {
  const fixture = serviceFixture({ persistFailure: true });
  await assert.rejects(fixture.service.createForPaidOrder(fixture.order.id), errorCode('DRAFT_PERSISTENCE_UNCERTAIN'));
  assert.equal((await fixture.service.createForPaidOrder(fixture.order.id)).id, 456);
  assert.equal(fixture.posts(), 1);
  fixture.order.items = [{ sync_variant_id: 123, quantity: 3 }];
  await assert.rejects(fixture.service.createForPaidOrder(fixture.order.id), errorCode('DRAFT_RESERVATION_CONFLICT'));
  assert.equal(fixture.posts(), 1);
});

test('money arithmetic uses explicit exponent and safe integers; invalid transitions fail', () => {
  assert.equal(decimalToMinor('12.34', 2), 1234);
  assert.equal(decimalToMinor('123', 0), 123);
  assert.equal(decimalToMinor('12.345', 3), 12345);
  assert.throws(() => decimalToMinor('12.345', 2), errorCode('INVALID_MONEY_PRECISION'));
  assert.throws(() => decimalToMinor('1e3', 2), errorCode('INVALID_MONEY'));
  assert.deepEqual(orderTotalMinor([{ quantity: 3, unitAmountMinor: 125 }], 100, 50), { subtotalMinor: 375, shippingMinor: 100, taxMinor: 50, totalMinor: 525 });
  assert.throws(() => orderTotalMinor([{ quantity: 100, unitAmountMinor: Number.MAX_SAFE_INTEGER }], 0, 0), errorCode('MONEY_OVERFLOW'));
  assert.throws(() => fulfillmentItems([{ sync_variant_id: 1, quantity: 1 }, { sync_variant_id: 1, quantity: 1 }]), errorCode('DUPLICATE_VARIANT'));
  assert.equal(transitionOrder('awaiting_payment', 'payment_verified'), 'paid');
  assert.equal(transitionOrder('draft_uncertain', 'draft_reconciled'), 'draft_created');
  assert.throws(() => transitionOrder('awaiting_payment', 'draft_created'), errorCode('INVALID_ORDER_TRANSITION'));
  assert.throws(() => transitionOrder('refunded', 'payment_verified'), errorCode('INVALID_ORDER_TRANSITION'));
});

const SECRET_HEX = '12'.repeat(32), PUBLIC_KEY = 'aXNvbGF0ZWQ=';
const eventPayload = (patch = {}) => ({ type: 'order_updated', occurred_at: '2026-10-31T10:00:00Z', retries: 0, store_id: EXPECTED_STORE_ID, data: { order: { id: 456, external_id: 'isolated_order_1', status: 'draft', store_id: EXPECTED_STORE_ID, updated_at: '2026-10-31T10:00:00Z' } }, ...patch });
function signed(payload, { raw, headers = {}, secretHex = SECRET_HEX, publicKey = PUBLIC_KEY } = {}) {
  const rawBody = raw || Buffer.from(JSON.stringify(payload));
  return { rawBody, headers: { 'x-pf-webhook-public-key': PUBLIC_KEY, 'x-pf-webhook-signature': createHmac('sha256', Buffer.from(SECRET_HEX, 'hex')).update(rawBody).digest('hex'), ...headers }, secretHex, publicKey, now: Date.parse('2026-10-31T12:00:00Z') };
}
const verified = patch => verifyPrintfulV2Webhook(signed(eventPayload(patch)));

test('v2 webhook verifies original bytes using decoded hex key and constant-time header/signature checks', () => {
  const request = signed(eventPayload());
  assert.equal(verifyPrintfulV2Webhook(request).order.id, 456);
  const tampered = { ...request, rawBody: Buffer.from(request.rawBody.toString().replace('draft', 'pending')) };
  assert.throws(() => verifyPrintfulV2Webhook(tampered), errorCode('WEBHOOK_UNAUTHORIZED'));
  assert.throws(() => verifyPrintfulV2Webhook(signed(eventPayload(), { headers: { 'x-pf-webhook-public-key': 'other_key' } })), errorCode('WEBHOOK_UNAUTHORIZED'));
  assert.throws(() => verifyPrintfulV2Webhook(signed(eventPayload(), { secretHex: 'not-hex' })), errorCode('WEBHOOK_KEYS_REQUIRED'));
  assert.throws(() => verifyPrintfulV2Webhook({ ...request, rawBody: request.rawBody.toString() }), errorCode('WEBHOOK_INVALID_SIZE'));
});

test('webhook parsing rejects invalid JSON, unsupported types/store, oversized or future events', () => {
  assert.throws(() => verifyPrintfulV2Webhook(signed(null, { raw: Buffer.from('{invalid') })), errorCode('WEBHOOK_INVALID_JSON'));
  assert.throws(() => verified({ type: 'package_shipped' }), errorCode('WEBHOOK_INVALID_EVENT'));
  assert.throws(() => verified({ store_id: 999 }), errorCode('WEBHOOK_INVALID_EVENT'));
  assert.throws(() => verified({ occurred_at: '2027-01-01T00:00:00Z' }), errorCode('WEBHOOK_INVALID_TIME'));
  assert.throws(() => verified({ occurred_at: '2026-02-31T00:00:00Z' }), errorCode('WEBHOOK_INVALID_TIME'));
  assert.throws(() => verifyPrintfulV2Webhook(signed(null, { raw: Buffer.alloc(128 * 1024 + 1) })), errorCode('WEBHOOK_INVALID_SIZE'));
  assert.throws(() => reduceProviderEvent(null, { ...verified({}) }), errorCode('VERIFIED_EVENT_REQUIRED'));
});

test('webhook retries have stable keys; duplicates and old order statuses cannot regress state', () => {
  const initial = verified({});
  assert.equal(verified({ retries: 3 }).eventKey, initial.eventKey);
  const first = reduceProviderEvent(null, initial);
  assert.equal(reduceProviderEvent(first.snapshot, initial, new Set([initial.eventKey])).duplicate, true);
  const later = verified({ occurred_at: '2026-10-31T11:00:00Z', data: { order: { ...eventPayload().data.order, status: 'fulfilled', updated_at: '2026-10-31T11:00:00Z' } } });
  const advanced = reduceProviderEvent(first.snapshot, later).snapshot;
  assert.equal(reduceProviderEvent(advanced, initial).snapshot.status, 'fulfilled');
  const tied = verified({ occurred_at: '2026-10-31T11:00:00Z', data: { order: { ...eventPayload().data.order, status: 'failed', updated_at: '2026-10-31T11:00:00Z' } } });
  assert.equal(reduceProviderEvent(advanced, tied).snapshot.needsReconciliation, true);
});

test('shipment tracking and provider refunds remain separate from whole-order fulfillment', () => {
  let state = reduceProviderEvent(null, verified({})).snapshot;
  const shipment = { id: 789, status: 'shipped', store_id: EXPECTED_STORE_ID, tracking_number: 'SYNTHETIC_TRACKING', tracking_url: 'https://example.com/synthetic-tracking' };
  const sent = verified({ type: 'shipment_sent', data: { ...eventPayload().data, shipment } });
  state = reduceProviderEvent(state, sent).snapshot;
  assert.equal(state.status, 'draft');
  assert.equal(state.shipments[789].trackingNumber, 'SYNTHETIC_TRACKING');
  const refund = verified({ type: 'order_refunded', data: { ...eventPayload().data, amount: '1.00', currency: 'EUR' } });
  const refunded = reduceProviderEvent(state, refund).snapshot;
  assert.equal(refunded.refunded, true);
  assert.deepEqual(refunded.refunds[refund.eventKey], { amount: '1.00', currency: 'EUR', occurredAt: refund.occurredAt });
  const differentRefund = verified({ type: 'order_refunded', data: { ...eventPayload().data, amount: '2.00', currency: 'EUR' } });
  assert.notEqual(refund.eventKey, differentRefund.eventKey);
  assert.throws(() => verified({ type: 'order_refunded' }), errorCode('WEBHOOK_INVALID_REFUND'));
  assert.throws(() => verified({ type: 'shipment_sent', data: { ...eventPayload().data, shipment: { ...shipment, tracking_url: 'javascript:alert(1)' } } }), errorCode('WEBHOOK_INVALID_TRACKING_URL'));
});
