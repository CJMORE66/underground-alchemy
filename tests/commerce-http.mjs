/* ISOLATED HTTP/security tests. Actual WebCrypto and Stripe signatures; all
 * repositories, provider responses and credentials are synthetic. No network,
 * payment, real tax calculation, customer data or fulfillment is performed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { webcrypto } from 'node:crypto';
import { createCommerceWorker } from '../server/worker.js';
import { commerceSession, requireSameOrigin, boundedRequestBytes, boundedRequestJson } from '../server/commerce/http-security.js';
import { createStripeWorkerTestAdapter, STRIPE_API_VERSION } from '../server/commerce/stripe.js';

const ORIGIN = 'https://commerce.example.test', STORE = 18912189, ACCOUNT = 'acct_1UWra7PkIIV492Qz';
const SESSION_ID = ['cs', 'test', 'IsolatedHttpSession123'].join('_');
const clone = value => structuredClone(value);
const code = expected => error => error?.code === expected;
const syntheticKey = (kind = 'rk', mode = 'test') => {
  assert(['rk', 'sk', 'pk'].includes(kind)); assert(['test', 'live'].includes(mode));
  return [kind, mode, 'F'.repeat(32)].join('_');
};
const webhookSecret = () => ['whsec', 'W'.repeat(32)].join('_');
const sessionSecret = () => ['isolated', 'http', 'session', 'S'.repeat(48)].join('-');
const policy = () => ({ stripeAccountId: ACCOUNT, mode: 'test', printfulStoreId: STORE, currency: 'EUR', currencyExponent: 2, priceTaxBehavior: 'exclusive', policyRevision: 'isolated-http-policy-v1', registrationIds: ['taxreg_isolatedHttp123'], allowedCountries: ['FR'], shippingTaxCode: 'txcd_92010001', taxCodeByProductId: { artwork: 'txcd_99999999' } });
const recipient = () => ({ country_code: 'FR', zip: '00000' });
const shippingInput = () => ({ lines: [{ variantId: 'artwork_black_l', quantity: 2 }], recipient: recipient() });
const variant = (id = 'artwork_black_l') => ({ id, productId: 'artwork', name: 'Isolated artwork', title: 'Black / L', storeId: STORE, syncVariantId: 123, catalogVariantId: 456, retailPrice: { amount: '12.50', currency: 'EUR' }, availabilityStatus: 'active', synced: true });

function fixture({ repository: repositoryOverrides = {}, catalog: catalogOverrides = {}, payments: paymentOverrides = {}, env: envOverrides = {}, rates } = {}) {
  const calls = { assets: [], repositoryFactory: 0, migrate: 0, limits: [], getOrder: [], getSession: [], getDraft: [], bind: [], events: [], jobs: [], claims: 0, paymentFactory: 0, payment: [], provider: [], variants: [], catalogStores: 0, catalog: 0 };
  const orders = new Map(), variants = new Map([['artwork_black_l', variant()], ['artwork_white_l', { ...variant('artwork_white_l'), syncVariantId: 124 }]]);
  const repository = {
    async migrate() { calls.migrate++; },
    async consumeRateLimit(value) { assert(Number.isSafeInteger(value.nowMs) && value.nowMs > 0, 'D1 rate limiting requires a server timestamp'); calls.limits.push(clone(value)); return { allowed: true }; },
    async getOrder(id) { calls.getOrder.push(id); return clone(orders.get(id) || null); },
    async getOrderByStripeSession(id) { calls.getSession.push(id); return clone([...orders.values()].find(order => order.stripeCheckoutSessionId === id) || null); },
    async getDraft(id) { calls.getDraft.push(id); return null; },
    async bindStripeSession(value) { calls.bind.push(clone(value)); orders.get(value.orderId).stripeCheckoutSessionId = value.sessionId; },
    async enqueuePaymentEvent(value) { calls.events.push(clone(value)); return { jobId: 'isolated_http_job_1', duplicate: calls.events.length > 1 }; },
    async getPaymentJob(id) { calls.jobs.push(id); return { id, state: 'completed' }; },
    async claimPaymentJob() { calls.claims++; return null; },
    async completePaymentJob() {}, async failPaymentJob() {},
    ...repositoryOverrides,
  };
  const catalog = {
    async verifyStore() { calls.catalogStores++; return { id: STORE, verified: true }; },
    async getVariant(id) { calls.variants.push(id); return clone(variants.get(id) || null); },
    async getCatalog() { calls.catalog++; return { catalogueVerifiedLive: true, products: [], source: 'isolated-http-fixture' }; },
    ...catalogOverrides,
  };
  const fetchImplementation = async (url, options) => {
    calls.provider.push({ url, method: options.method, ...(options.body ? { body: JSON.parse(options.body) } : {}) });
    assert.equal(new URL(url).origin, 'https://api.printful.com', 'No external provider/network fallback is allowed');
    if (url === 'https://api.printful.com/stores') return Response.json({ code: 200, result: [{ id: STORE }] });
    if (url === 'https://api.printful.com/shipping/rates') return Response.json({ code: 200, result: rates || [{ id: 'ISOLATED_STANDARD', name: 'Isolated standard', rate: '3.50', currency: 'EUR' }] });
    assert.fail('Unexpected provider operation: ' + new URL(url).pathname);
  };
  const realSignatureAdapter = createStripeWorkerTestAdapter({ secretKey: syntheticKey(), webhookSecret: webhookSecret(), taxConfiguration: { mode: 'stripe_automatic', policyRevision: policy().policyRevision, registrationIds: policy().registrationIds, allowedCountries: policy().allowedCountries }, fetch: async () => assert.fail('Stripe HTTP is forbidden in this isolated suite'), subtleCrypto: webcrypto.subtle });
  const payments = {
    verifyWebhook: (...args) => realSignatureAdapter.verifyWebhook(...args),
    async createCheckout(order) { calls.payment.push(['createCheckout', clone(order)]); return { id: SESSION_ID, url: 'https://checkout.stripe.com/c/pay/' + SESSION_ID }; },
    async resumeCheckout(order) { calls.payment.push(['resumeCheckout', clone(order)]); return { id: SESSION_ID, url: 'https://checkout.stripe.com/c/pay/' + SESSION_ID }; },
    async verifyPayment() { calls.payment.push(['verifyPayment']); assert.fail('Terminal/invalid webhook must never verify a payment'); },
    ...paymentOverrides,
  };
  const env = { COMMERCE_DB: {}, COMMERCE_SESSION_SECRET: sessionSecret(), PRINTFUL_API_TOKEN: ['isolated', 'printful', 'fixture'].join('-'), STRIPE_SECRET_KEY: syntheticKey(), STRIPE_WEBHOOK_SECRET: webhookSecret(), COMMERCE_POLICY_JSON: JSON.stringify(policy()), ASSETS: { async fetch(request) { calls.assets.push(request); return new Response('retained asset', { headers: { 'x-isolated-asset': 'yes' } }); } }, ...envOverrides };
  const worker = createCommerceWorker({ fetchImplementation, catalogFactory: () => catalog, repositoryFactory: () => { calls.repositoryFactory++; return repository; }, paymentFactory: () => { calls.paymentFactory++; return payments; } });
  return { calls, env, worker, repository, payments, catalog, orders, variants,
    fetch(request) { return worker.fetch(request, env, { waitUntil() { assert.fail('Unexpected background task'); } }); },
    async session() { const value = await commerceSession(new Request(ORIGIN), env.COMMERCE_SESSION_SECRET, { create: true }); return { ...value, header: value.cookie.split(';')[0] }; },
  };
}

function request(path, { method = 'POST', cookie, body = {}, headers = {} } = {}) {
  return new Request(ORIGIN + path, { method, headers: { origin: ORIGIN, 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, ...(method === 'GET' || method === 'HEAD' ? {} : { body: typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body) }) });
}
const get = (path, cookie) => request(path, { method: 'GET', cookie });
async function result(response) { return { status: response.status, body: await response.json() }; }
function signedEvent({ type = 'checkout.session.completed', id = 'evt_isolatedHttp123', mutate, timestamp = Math.floor(Date.now() / 1000), secret = webhookSecret() } = {}) {
  const event = { id, object: 'event', api_version: STRIPE_API_VERSION, created: timestamp, livemode: false, type, data: { object: { id: SESSION_ID, object: 'checkout.session', livemode: false } } };
  mutate?.(event);
  const raw = JSON.stringify(event);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret, timestamp });
  return { raw, signature };
}
const webhookRequest = (signed, headers = {}) => request('/api/stripe/webhook', { body: signed.raw, headers: { 'stripe-signature': signed.signature, ...headers } });

function isolatedCache(t, cache) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  Object.defineProperty(globalThis, 'caches', { configurable: true, writable: true, value: { default: cache } });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'caches', original); else delete globalThis.caches; });
}

test('existing ASSETS requests retain their Request and response without commerce access', async () => {
  const f = fixture(), incoming = get('/art/?retained=1'), response = await f.fetch(incoming);
  assert.equal(await response.text(), 'retained asset'); assert.equal(response.headers.get('x-isolated-asset'), 'yes');
  assert.equal(f.calls.assets[0], incoming); assert.equal(f.calls.repositoryFactory, 0); assert.equal(f.calls.catalog, 0); assert.equal(f.calls.provider.length, 0);
});

test('catalog route requires a live verification flag and does not expose failed provider details', async () => {
  const f = fixture(); assert.equal((await result(await f.fetch(get('/api/commerce/catalog')))).status, 200);
  f.catalog.getCatalog = async () => ({ products: [{ mocked: true }] });
  assert.deepEqual(await result(await f.fetch(get('/api/commerce/catalog'))), { status: 503, body: { error: 'LIVE_CATALOG_REQUIRED' } });
  f.catalog.getCatalog = async () => { throw new Error('private provider response and synthetic customer'); };
  assert.deepEqual(await result(await f.fetch(get('/api/commerce/catalog'))), { status: 503, body: { error: 'COMMERCE_UNAVAILABLE' } });
});

test('unavailable edge-cache reads still require and return a freshly verified catalog', async t => {
  const cache = { match() {}, async put() {} }; isolatedCache(t, cache);
  for (const match of [() => { throw new Error('Isolated cache API unavailable'); }, async () => { throw new Error('Isolated cache read unavailable'); }]) {
    let reads = 0; cache.match = (...args) => { reads++; return match(...args); };
    const f = fixture(), background = [];
    const response = await f.worker.fetch(get('/api/commerce/catalog'), f.env, { waitUntil(promise) { background.push(promise); } });
    assert.equal(response.status, 200); assert.equal((await response.json()).catalogueVerifiedLive, true);
    assert.equal(reads, 1); assert.equal(f.calls.catalog, 1); assert.equal(f.calls.repositoryFactory, 0);
    await Promise.all(background);
    f.catalog.getCatalog = async () => ({ products: [] });
    assert.deepEqual(await result(await f.worker.fetch(get('/api/commerce/catalog'), f.env, {})), { status: 503, body: { error: 'LIVE_CATALOG_REQUIRED' } });
  }
});

test('sync/async cache-write and background-context failures cannot replace a verified catalog response', async t => {
  const cache = { async match() {}, put() {} }; isolatedCache(t, cache);
  for (const failure of ['sync-write', 'async-write', 'background-context']) {
    let writes = 0, contexts = 0; const background = [];
    cache.put = () => { writes++; if (failure === 'sync-write') throw new Error('Isolated cache write unavailable'); return Promise.reject(new Error('Isolated asynchronous cache write unavailable')); };
    const f = fixture();
    const response = await f.worker.fetch(get('/api/commerce/catalog'), f.env, { waitUntil(promise) { contexts++; background.push(promise); if (failure === 'background-context') throw new Error('Isolated background context unavailable'); } });
    assert.equal(response.status, 200); assert.equal((await response.json()).catalogueVerifiedLive, true);
    assert.equal(f.calls.catalog, 1); assert.equal(writes, 1); assert.equal(contexts, failure === 'sync-write' ? 0 : 1);
    await Promise.all(background); // The write rejection was handled before scheduling.
  }
});

test('a trusted catalog cache hit retains the public response and skips provider reads', async t => {
  const cached = Response.json({ catalogueVerifiedLive: true, products: [], source: 'isolated-cache-fixture' }, { headers: { 'cache-control': 'public, max-age=60' } });
  let reads = 0;
  isolatedCache(t, { async match(key) { reads++; assert.equal(key.method, 'GET'); assert.equal(key.url, ORIGIN + '/api/commerce/catalog'); return cached; }, put() { assert.fail('A cache hit must not trigger a write'); } });
  const f = fixture(), response = await f.fetch(get('/api/commerce/catalog?isolated=1'));
  assert.equal(response, cached); assert.equal(reads, 1); assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(f.calls.catalog, 0); assert.equal(f.calls.provider.length, 0); assert.equal(f.calls.repositoryFactory, 0);
});

test('sandbox readiness fails closed for missing DB, migration, key, webhook, store policy and session config', async () => {
  const ready = fixture(), readiness = await (await ready.fetch(get('/api/commerce/status'))).json();
  assert.deepEqual(readiness, { mode: 'test', catalogAvailable: true, shippingAvailable: true, checkoutAvailable: true });
  for (const change of [f => { delete f.env.COMMERCE_DB; }, f => { f.repository.migrate = async () => { throw new Error('isolated migration unavailable'); }; }, f => { delete f.env.PRINTFUL_API_TOKEN; }, f => { f.env.STRIPE_SECRET_KEY = syntheticKey('rk', 'live'); }, f => { delete f.env.STRIPE_WEBHOOK_SECRET; }, f => { f.env.COMMERCE_POLICY_JSON = JSON.stringify({ ...policy(), stripeAccountId: 'acct_otherFixture' }); }, f => { f.env.COMMERCE_POLICY_JSON = JSON.stringify({ ...policy(), printfulStoreId: 1 }); }]) {
    const f = fixture(); change(f); const response = await f.fetch(get('/api/commerce/status')), value = await response.json();
    assert.equal(response.status, 200); assert.equal(value.mode, 'test'); assert.equal(value.checkoutAvailable, false); assert.equal(f.calls.provider.length, 0);
    assert(!JSON.stringify(value).includes(syntheticKey()));
  }
  const f = fixture({ env: { COMMERCE_SESSION_SECRET: 'short' } });
  assert.deepEqual(await result(await f.fetch(get('/api/commerce/status'))), { status: 503, body: { error: 'SESSION_CONFIGURATION_REQUIRED' } });
});

test('readiness rejects incomplete merchant tax/currency policy rather than advertising unusable checkout', async () => {
  for (const change of [p => { delete p.currency; }, p => { delete p.currencyExponent; }, p => { p.allowedCountries = []; }, p => { delete p.policyRevision; }, p => { delete p.shippingTaxCode; }, p => { delete p.taxCodeByProductId; }, p => { p.registrationIds = ['invalid']; }]) {
    const p = policy(); change(p); const f = fixture({ env: { COMMERCE_POLICY_JSON: JSON.stringify(p) } });
    const response = await f.fetch(get('/api/commerce/status'));
    assert.equal(response.status, 200); assert.equal((await response.json()).checkoutAvailable, false, 'Invalid merchant policy must not enable checkout');
  }
});

test('readiness rejects malformed Printful credentials before claiming catalog/shipping readiness', async () => {
  for (const token of ['', ' ', 'short', 'fixture\ntoken']) {
    const f = fixture({ env: { PRINTFUL_API_TOKEN: token } }); const value = await (await f.fetch(get('/api/commerce/status'))).json();
    assert.equal(value.catalogAvailable, false); assert.equal(value.shippingAvailable, false); assert.equal(value.checkoutAvailable, false); assert.equal(f.calls.provider.length, 0);
  }
});

test('actual WebCrypto sessions are secure, stable for valid cookies, and rotate for invalid cookies', async () => {
  const now = Date.now(), issued = await commerceSession(new Request(ORIGIN), sessionSecret(), { create: true, now });
  assert.match(issued.cookie, /^__Host-ua-commerce=/); assert.match(issued.cookie, /; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800$/);
  const header = issued.cookie.split(';')[0], resumed = await commerceSession(new Request(ORIGIN, { headers: { cookie: header } }), sessionSecret(), { now });
  assert.equal(resumed.ownerId, issued.ownerId); assert.equal(resumed.cookie, undefined); assert.match(issued.ownerId, /^guest_[a-f0-9]{64}$/);
  const [name, value] = header.split('='), parts = value.split('.');
  for (const index of [0, 1, 2]) {
    const bad = [...parts]; bad[index] = (bad[index][0] === 'A' ? 'B' : 'A') + bad[index].slice(1);
    const incoming = new Request(ORIGIN, { headers: { cookie: name + '=' + bad.join('.') } });
    await assert.rejects(commerceSession(incoming, sessionSecret(), { now }), code('SESSION_REQUIRED'));
    assert.notEqual((await commerceSession(incoming, sessionSecret(), { create: true, now })).ownerId, issued.ownerId);
  }
});

test('missing, expired, future-window and wrong-secret sessions cannot establish order ownership', async () => {
  const now = Date.now(); await assert.rejects(commerceSession(new Request(ORIGIN), sessionSecret(), { now }), code('SESSION_REQUIRED'));
  for (const issuedAt of [now - 8 * 86400000, now + 3600000]) {
    const issued = await commerceSession(new Request(ORIGIN), sessionSecret(), { create: true, now: issuedAt });
    await assert.rejects(commerceSession(new Request(ORIGIN, { headers: { cookie: issued.cookie.split(';')[0] } }), sessionSecret(), { now }), code('SESSION_REQUIRED'));
  }
  const f = fixture(), session = await f.session();
  await assert.rejects(commerceSession(new Request(ORIGIN, { headers: { cookie: session.header } }), sessionSecret() + '-other', { now }), code('SESSION_REQUIRED'));
  for (const cookie of [undefined, '__Host-ua-commerce=invalid']) {
    assert.deepEqual(await result(await f.fetch(get('/api/commerce/orders/isolated_order_1', cookie))), { status: 401, body: { error: 'SESSION_REQUIRED' } });
  }
  assert.equal(f.calls.repositoryFactory, 0);
});

test('mutation routes require exact Origin, JSON and same-site browser context before any database/provider use', async () => {
  for (const headers of [{ origin: '' }, { origin: 'https://other.example.test' }, { origin: ORIGIN + '.other.test' }, { origin: ORIGIN.replace('https:', 'http:') }, { 'sec-fetch-site': 'cross-site' }, { 'content-type': 'text/plain' }, { 'content-type': 'application/jsonp' }]) {
    const f = fixture(), session = await f.session();
    const response = await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body: shippingInput(), headers }));
    assert.equal(response.status, headers['content-type'] ? 415 : 403); assert.equal(f.calls.repositoryFactory, 0); assert.equal(f.calls.provider.length, 0);
  }
  assert.doesNotThrow(() => requireSameOrigin(request('/api/commerce/shipping', { headers: { 'content-type': 'Application/JSON; charset=UTF-8' } })));
});

test('bounded JSON rejects primitives, arrays, invalid UTF-8, malformed JSON and absent body', async () => {
  for (const body of ['null', '[]', '1', 'true', '"string"', '{broken', new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125])]) await assert.rejects(boundedRequestJson(request('/api/commerce/quote', { body })), code('INVALID_JSON'));
  await assert.rejects(boundedRequestJson(new Request(ORIGIN, { method: 'POST' })), code('INVALID_JSON'));
  assert.deepEqual(await boundedRequestJson(request('/api/commerce/quote', { body: { valid: true } })), { valid: true });
});

test('raw byte limits reject invalid/oversized declarations and cancel an oversized stream', async () => {
  for (const declared of ['-1', 'not-a-number', '17']) await assert.rejects(boundedRequestBytes(request('/api/commerce/quote', { body: '{}', headers: { 'content-length': declared } }), 16), code('BODY_TOO_LARGE'));
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(17)); }, cancel() { cancelled = true; } });
  await assert.rejects(boundedRequestBytes(new Request(ORIGIN, { method: 'POST', body: stream, duplex: 'half' }), 16), code('BODY_TOO_LARGE'));
  assert.equal(cancelled, true);
  assert.equal((await boundedRequestBytes(request('/api/commerce/quote', { body: 'a'.repeat(16) }), 16)).byteLength, 16);
});

test('oversized and malformed mutation bodies never reach catalog, shipping or Stripe', async () => {
  for (const body of ['x'.repeat(16385), '{broken', '[]']) {
    const f = fixture(), session = await f.session(), response = await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body }));
    assert.equal(response.status, body.length > 16384 ? 413 : 400); assert.equal(f.calls.catalogStores, 0); assert.equal(f.calls.provider.length, 0); assert.equal(f.calls.paymentFactory, 0);
  }
});

test('order and checkout-session lookups enforce the same cookie owner and return only public status', async () => {
  const f = fixture(), own = await f.session(), stranger = await f.session();
  const order = { id: 'isolated_order_1', ownerId: own.ownerId, stripeCheckoutSessionId: SESSION_ID, currency: 'EUR', totalMinor: 2850, recipient: { name: 'Isolated private customer', address1: 'Synthetic private address' }, quoteHash: 'a'.repeat(64) };
  f.orders.set(order.id, order); f.repository.getDraft = async () => ({ state: 'created', printfulId: 12345 });
  for (const path of ['/api/commerce/orders/' + order.id, '/api/commerce/orders/by-session/' + SESSION_ID]) {
    assert.deepEqual(await result(await f.fetch(get(path, stranger.header))), { status: 404, body: { error: 'ORDER_NOT_FOUND' } });
    const response = await f.fetch(get(path, own.header));
    assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.deepEqual(await response.json(), { orderId: order.id, status: 'draft_created', currency: 'EUR', totalMinor: 2850, draftId: 12345 });
  }
  assert.equal((await f.fetch(get('/api/commerce/orders/by-session/cs_live_invalid', own.header))).status, 400);
  assert.equal(f.calls.provider.length, 0);
});

test('checkout accepts an owned persisted order ID only and never browser totals or payment flags', async () => {
  const f = fixture(), own = await f.session(), other = await f.session(), order = { id: 'isolated_order_1', ownerId: own.ownerId, quoteHash: 'a'.repeat(64), currency: 'EUR', totalMinor: 2850 };
  f.orders.set(order.id, order);
  assert.equal((await f.fetch(request('/api/commerce/checkout', { cookie: other.header, body: { orderId: order.id } }))).status, 404);
  for (const field of ['totalMinor', 'paid', 'currency', 'ownerId', 'successUrl']) assert.equal((await f.fetch(request('/api/commerce/checkout', { cookie: own.header, body: { orderId: order.id, [field]: 1 } }))).status, 400);
  assert.equal(f.calls.provider.length, 0); assert.equal(f.calls.payment.length, 0);
  const response = await f.fetch(request('/api/commerce/checkout', { cookie: own.header, body: { orderId: order.id } }));
  assert.equal(response.status, 200); assert.equal((await response.json()).id, SESSION_ID);
  assert.equal(f.calls.payment[0][1].totalMinor, 2850); assert.equal(f.calls.bind[0].orderId, order.id); assert.equal(f.calls.bind[0].sessionId, SESSION_ID);
});

test('shipping uses current server variant catalog IDs, aggregates shared blanks and converts actual decimal rates', async () => {
  const f = fixture(), session = await f.session(), body = { ...shippingInput(), lines: [{ variantId: 'artwork_black_l', quantity: 2 }, { variantId: 'artwork_white_l', quantity: 3 }] };
  const response = await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body }));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { status: 'shipping_required', currency: 'EUR', currencyExponent: 2, shippingOptions: [{ id: 'ISOLATED_STANDARD', name: 'Isolated standard', amountMinor: 350, currency: 'EUR' }] });
  const rateRequest = f.calls.provider.find(call => call.url.endsWith('/shipping/rates'));
  assert.deepEqual(rateRequest.body, { recipient: recipient(), items: [{ variant_id: 456, quantity: 5 }], currency: 'EUR' });
  assert.deepEqual(f.calls.variants, ['artwork_black_l', 'artwork_white_l']); assert.equal(f.calls.payment.length, 0); assert.equal(f.calls.events.length, 0);
});

test('Worker default transport calls global fetch with its native receiver', async t => {
  const original = globalThis.fetch, requests = [];
  globalThis.fetch = async function (url, init) {
    assert.equal(this, globalThis, 'Cloudflare native fetch requires the global receiver');
    requests.push({ url, redirect: init.redirect });
    if (url.endsWith('/stores')) return Response.json({ code: 200, result: [{ id: STORE }] });
    if (url.endsWith('/shipping/rates')) return Response.json({ code: 200, result: [{ id: 'ISOLATED_STANDARD', name: 'Isolated standard', rate: '3.50', currency: 'EUR' }] });
    assert.fail('Unexpected isolated provider request');
  };
  t.after(() => { globalThis.fetch = original; });
  const f = fixture(), session = await f.session();
  const worker = createCommerceWorker({ catalogFactory: () => f.catalog, repositoryFactory: () => f.repository, paymentFactory: () => f.payments });
  const response = await worker.fetch(request('/api/commerce/shipping', { cookie: session.header, body: shippingInput() }), f.env, {});
  assert.equal(response.status, 200); assert.equal((await response.json()).shippingOptions[0].amountMinor, 350);
  assert.equal(requests.length, 2); assert(requests.every(entry => entry.redirect === 'manual'));
});

test('shipping rejects browser prices, currency, paid flags and provider identifiers', async () => {
  for (const change of [body => { body.price = 1; }, body => { body.currency = 'USD'; }, body => { body.paid = true; }, body => { body.lines[0].unitAmountMinor = 1; }, body => { body.lines[0].catalogVariantId = 999; }, body => { body.lines[0].sync_variant_id = 999; }]) {
    const f = fixture(), session = await f.session(), body = shippingInput(); change(body);
    assert.equal((await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body }))).status, 400);
    assert.equal(f.calls.provider.some(call => call.url.endsWith('/shipping/rates')), false);
  }
});

test('shipping rejects missing, unsynced and inactive variants and inconsistent currencies', async () => {
  for (const change of [f => { f.variants.delete('artwork_black_l'); }, f => { f.variants.get('artwork_black_l').synced = false; }, f => { f.variants.get('artwork_black_l').availabilityStatus = 'out_of_stock'; }, f => { f.variants.get('artwork_black_l').retailPrice = null; }]) {
    const f = fixture(), session = await f.session(); change(f);
    assert.equal((await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body: shippingInput() }))).status, 409);
    assert.equal(f.calls.provider.some(call => call.url.endsWith('/shipping/rates')), false);
  }
  const f = fixture(), session = await f.session(); f.variants.get('artwork_white_l').retailPrice.currency = 'USD';
  assert.deepEqual(await result(await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body: { ...shippingInput(), lines: [{ variantId: 'artwork_black_l', quantity: 1 }, { variantId: 'artwork_white_l', quantity: 1 }] } }))), { status: 409, body: { error: 'CURRENCY_MISMATCH' } });
  f.variants.get('artwork_black_l').retailPrice.currency = 'USD';
  assert.deepEqual(await result(await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body: shippingInput() }))), { status: 503, body: { error: 'CURRENCY_NOT_CONFIGURED' } });
});

test('shipping bounds quantity, duplicate variants, aggregate blank quantity and postal requirements', async () => {
  for (const quantity of [0, -1, 1.5, '2', 100]) {
    const f = fixture(), session = await f.session(), body = shippingInput(); body.lines[0].quantity = quantity;
    assert.equal((await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body }))).status, 400);
    assert.equal(f.calls.provider.some(call => call.url.endsWith('/shipping/rates')), false);
  }
  for (const lines of [[...shippingInput().lines, ...shippingInput().lines], [{ variantId: 'artwork_black_l', quantity: 99 }, { variantId: 'artwork_white_l', quantity: 2 }]]) {
    const f = fixture(), session = await f.session(); assert.equal((await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body: { ...shippingInput(), lines } }))).status, 400);
    assert.equal(f.calls.provider.some(call => call.url.endsWith('/shipping/rates')), false);
  }
  const f = fixture(), session = await f.session(), body = shippingInput(); delete body.recipient.zip;
  assert.deepEqual(await result(await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body }))), { status: 400, body: { error: 'POSTAL_CODE_REQUIRED' } });
  assert.equal(f.calls.provider.length, 0);
});

test('shipping rejects provider rates with a mismatched currency instead of inventing a fallback', async () => {
  const f = fixture({ rates: [{ id: 'ISOLATED_STANDARD', name: 'Isolated standard', rate: '3.50', currency: 'USD' }] }), session = await f.session();
  assert.deepEqual(await result(await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body: shippingInput() }))), { status: 503, body: { error: 'PRINTFUL_INVALID_RATES' } });
});

test('owner and network rate limits stop provider work and retain only a keyed network digest', async () => {
  for (const blockedAt of [1, 2]) {
    const f = fixture(), session = await f.session(); let attempts = 0;
    f.repository.consumeRateLimit = async value => { assert(Number.isSafeInteger(value.nowMs) && value.nowMs > 0); f.calls.limits.push(clone(value)); return { allowed: ++attempts !== blockedAt }; };
    assert.equal((await f.fetch(request('/api/commerce/shipping', { cookie: session.header, body: shippingInput(), headers: { 'cf-connecting-ip': '192.0.2.23' } }))).status, 429);
    assert.equal(f.calls.provider.length, 0); assert.equal(f.calls.catalogStores, 0);
    assert(!JSON.stringify(f.calls.limits).includes('192.0.2.23'));
    if (blockedAt === 2) assert.match(f.calls.limits[1].key, /^quote:network:[a-f0-9]{64}$/);
  }
});

test('actual signed webhook tampering, wrong secrets, live mode and wrong API snapshots never reach D1 or Printful', async () => {
  const valid = signedEvent();
  const invalid = [{ ...valid, raw: valid.raw + ' ' }, signedEvent({ secret: ['whsec', 'X'.repeat(32)].join('_') }), signedEvent({ mutate: event => { event.livemode = true; } }), signedEvent({ mutate: event => { event.api_version = '2020-08-27'; } }), signedEvent({ timestamp: Math.floor(Date.now() / 1000) - 601 })];
  for (const signed of invalid) {
    const f = fixture(), response = await f.fetch(webhookRequest(signed));
    assert.deepEqual(await result(response), { status: 400, body: { error: 'WEBHOOK_REJECTED' } });
    assert.equal(f.calls.repositoryFactory, 0); assert.equal(f.calls.migrate, 0); assert.equal(f.calls.events.length, 0); assert.equal(f.calls.provider.length, 0); assert.equal(f.calls.payment.length, 0); assert.equal(f.calls.paymentFactory, 0);
  }
});

test('oversized webhook raw body is rejected before persistence or any upstream operation', async () => {
  for (const declared of [false, true]) {
    const f = fixture(), signed = signedEvent(); signed.raw = 'x'.repeat(256 * 1024 + 1);
    const response = await f.fetch(webhookRequest(signed, declared ? { 'content-length': String(signed.raw.length) } : {}));
    assert.deepEqual(await result(response), { status: 413, body: { error: 'BODY_TOO_LARGE' } });
    assert.equal(f.calls.repositoryFactory, 0); assert.equal(f.calls.events.length, 0); assert.equal(f.calls.provider.length, 0); assert.equal(f.calls.payment.length, 0); assert.equal(f.calls.paymentFactory, 0);
  }
});

test('webhook method, media type and missing signature fail before database/provider access', async () => {
  for (const incoming of [get('/api/stripe/webhook'), request('/api/stripe/webhook', { headers: { 'content-type': 'text/plain' } }), request('/api/stripe/webhook')]) {
    const f = fixture(), response = await f.fetch(incoming);
    assert([400, 405, 415].includes(response.status)); assert.equal(f.calls.repositoryFactory, 0); assert.equal(f.calls.provider.length, 0);
  }
});

test('valid signed ignored events are acknowledged without database, payment readability or fulfillment', async () => {
  const f = fixture({ env: { STRIPE_SECRET_KEY: undefined, COMMERCE_POLICY_JSON: undefined } }), response = await f.fetch(webhookRequest(signedEvent({ type: 'checkout.session.expired' })));
  assert.deepEqual(await result(response), { status: 200, body: { received: true, ignored: true } });
  assert.equal(f.calls.repositoryFactory, 0); assert.equal(f.calls.provider.length, 0); assert.equal(f.calls.payment.length, 0);
});

test('replayed completed signed jobs acknowledge200 without a second payment check or Printful read', async () => {
  const f = fixture(), signed = signedEvent();
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await f.fetch(webhookRequest(signed)); assert.equal(response.status, 200); assert.equal((await response.json()).received, true);
  }
  assert.equal(f.calls.events.length, 2); assert.equal(f.calls.events[0].eventId, f.calls.events[1].eventId); assert.equal(f.calls.claims, 0); assert.equal(f.calls.payment.length, 0); assert.equal(f.calls.provider.length, 0);
});

test('a valid signed payment event is durably admitted while runtime API access is unavailable', async () => {
  const f = fixture({ env: { STRIPE_SECRET_KEY: undefined, COMMERCE_POLICY_JSON: undefined }, repository: { async getPaymentJob(id) { return { id, state: 'pending' }; } } });
  const response = await f.fetch(webhookRequest(signedEvent()));
  assert.equal(response.status, 503); assert.equal((await response.json()).received, true); assert.equal(f.calls.events.length, 1);
  assert.equal(f.calls.payment.length, 0); assert.equal(f.calls.provider.length, 0);
});

test('completed signed job replays remain acknowledged when runtime provider credentials are absent', async () => {
  const f = fixture({ env: { STRIPE_SECRET_KEY: undefined, PRINTFUL_API_TOKEN: undefined, COMMERCE_POLICY_JSON: undefined } });
  const response = await f.fetch(webhookRequest(signedEvent()));
  assert.equal(response.status, 200); assert.equal((await response.json()).received, true); assert.equal(f.calls.events.length, 1);
  assert.equal(f.calls.claims, 0); assert.equal(f.calls.paymentFactory, 0); assert.equal(f.calls.provider.length, 0);
});

test('valid signed events survive missing Printful credentials as durable pending work', async () => {
  const f = fixture({ env: { PRINTFUL_API_TOKEN: undefined }, repository: { async getPaymentJob(id) { return { id, state: 'pending' }; } } });
  const response = await f.fetch(webhookRequest(signedEvent()));
  assert.equal(response.status, 503); assert.equal((await response.json()).received, true); assert.equal(f.calls.events.length, 1);
  assert.equal(f.calls.paymentFactory, 0); assert.equal(f.calls.provider.length, 0);
});

test('owned order exposes only its cached fulfillment projection and preserves internal draft status', async () => {
  let reads = 0;
  const projection = { version: 1, storeId: STORE, status: 'partial', shipments: [] };
  const f = fixture({ repository: {
    async getDraft(id) { return { orderId: id, state: 'created', printfulId: 901 }; },
    async getFulfillmentProjection(id, options) { reads++; assert.equal(options.ownerId, owner.ownerId); return { observedAt: Date.now(), projection }; },
  } });
  const owner = await f.session();
  f.orders.set('owned_order', { id: 'owned_order', ownerId: owner.ownerId, currency: 'EUR', totalMinor: 1250, recipient: { name: 'private isolated value' } });
  const response = await f.fetch(get('/api/commerce/orders/owned_order', owner.header)), body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.status, 'draft_created'); assert.equal(body.fulfillment.status, 'partial'); assert.equal(body.fulfillmentSync, 'cached');
  assert.equal(JSON.stringify(body).includes('private isolated value'), false); assert.equal(f.calls.provider.length, 0); assert.equal(reads, 1);
  f.orders.get('owned_order').ownerId = 'different_owner';
  assert.equal((await f.fetch(get('/api/commerce/orders/owned_order', owner.header))).status, 404); assert.equal(reads, 1, 'Wrong owners never read shipment projections');
});

test('provider refresh failure preserves an explicitly stale owned projection without changing payment/draft state', async () => {
  const old = { version: 1, storeId: STORE, status: 'inprocess', shipments: [] };
  const f = fixture({ repository: {
    async getDraft(id) { return { orderId: id, state: 'created', printfulId: 901, externalId: 'invalid_isolated_mapping' }; },
    async getFulfillmentProjection() { return { observedAt: 1, projection: old }; },
    async saveFulfillmentProjection() { assert.fail('An invalid mapping must never save a provider observation'); },
  } });
  const owner = await f.session(); f.orders.set('owned_order', { id: 'owned_order', ownerId: owner.ownerId, currency: 'EUR', totalMinor: 1250 });
  const response = await f.fetch(get('/api/commerce/orders/owned_order', owner.header)), body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.status, 'draft_created'); assert.equal(body.fulfillmentSync, 'stale'); assert.deepEqual(body.fulfillment, old); assert.equal(f.calls.provider.length, 0);
});
