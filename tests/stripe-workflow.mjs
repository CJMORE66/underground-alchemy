import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StripeOrderWorkflow, createStripeWebhookHandler } from '../server/commerce/stripe-workflow.js';
import { SqliteCommerceRepository } from '../server/commerce/sqlite-repository.js';
import { CommerceError } from '../server/commerce/validation.js';
import { draftPayload } from '../server/commerce/printful.js';
import { verifyStripe } from '../tools/verify-stripe.mjs';

// Only the SQLite database is real in these orchestration tests. Both providers
// are isolated fixtures; the Stripe adapter suite tests the real SDK signatures.
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'ua-stripe-workflow-'));
  let clock = 1800000000000, paid = true, lookupFailures = 0, postFailure = false;
  const repository = new SqliteCommerceRepository({ filename: join(directory, 'orders.sqlite'), clock: () => clock }); repository.migrate();
  t.after(() => { repository.close(); rmSync(directory, { recursive: true, force: true }); });
  const order = { id: 'fixture-order-1', totalMinor: 1200, subtotalMinor: 900, shippingMinor: 100, taxMinor: 200, currency: 'EUR', quoteHash: 'a'.repeat(64),
    recipient: { name: 'Fixture Customer', address1: 'Test Street 1', city: 'Paris', zip: '75001', country_code: 'FR' }, items: [{ sync_variant_id: 101, quantity: 1 }], shippingId: 'fixture-standard',
    checkoutLines: [{ name: 'Fixture shirt', unitAmountMinor: 900, quantity: 1, syncVariantId: 101, taxCode: 'txcd_99999999' }] };
  const sessionId = 'cs_test_fixtureSession1', remote = new Map(), calls = { created: 0, resumed: 0, verified: 0, posts: 0, signatures: 0 };
  const stripe = {
    async createCheckout(source) { assert.equal(source.id, order.id); calls.created++; return { id: sessionId, url: 'https://checkout.stripe.com/c/pay/fixture' }; },
    async resumeCheckout(source) { assert.equal(source.stripeCheckoutSessionId, sessionId); calls.resumed++; return { id: sessionId, url: 'https://checkout.stripe.com/c/pay/fixture' }; },
    async verifyPayment(source) {
      calls.verified++; assert.equal(source.stripeCheckoutSessionId, sessionId);
      if (!paid) throw new CommerceError('STRIPE_PAYMENT_PENDING');
      return { verified: true, status: 'paid', orderId: source.id, amountMinor: source.totalMinor, currency: source.currency, providerReference: 'pi_fixturePayment1' };
    },
    verifyWebhook(raw, signature) { calls.signatures++; if (signature !== 'fixture-valid') throw new CommerceError('STRIPE_WEBHOOK_UNAUTHORIZED'); return JSON.parse(new TextDecoder().decode(raw)); }
  };
  const printful = {
    async lookupOrder(externalId) { if (lookupFailures-- > 0) throw new CommerceError('PRINTFUL_TRANSPORT_ERROR', { retryable: true }); return remote.get(externalId) || null; },
    async createDraft(input) {
      calls.posts++; const body = draftPayload(input); const result = { ...body, id: 1234, status: 'draft' }; remote.set(body.external_id, result);
      if (postFailure) throw new CommerceError('PRINTFUL_DRAFT_UNCERTAIN', { ambiguous: true });
      return { id: result.id, externalId: body.external_id, status: result.status };
    }
  };
  const workflow = new StripeOrderWorkflow({ repository, stripe, printful, now: () => clock });
  const event = (id = 'evt_fixtureEvent1', type = 'checkout.session.completed') => new TextEncoder().encode(JSON.stringify({ id, sessionId, type, created: 1800000000 }));
  return { repository, order, stripe, workflow, event, sessionId, calls,
    persist() { return repository.createOrder(order); }, advance(ms = 1001) { clock += ms; }, setPaid(value) { paid = value; }, failLookup() { lookupFailures = 1; }, failPost() { postFailure = true; } };
}

test('checkout loads the immutable server order, binds once and resumes from authoritative session mapping', async t => {
  const f = fixture(t); f.persist();
  await assert.rejects(f.workflow.createCheckout({ ...f.order, totalMinor: 1 }), { code: 'INVALID_TEXT' });
  await f.workflow.createCheckout(f.order.id); await f.workflow.createCheckout(f.order.id);
  assert.equal(f.calls.created, 1); assert.equal(f.calls.resumed, 1);
  assert.equal(f.repository.getOrder(f.order.id).stripeCheckoutSessionId, f.sessionId);
});

test('duplicate signed event is stored once; duplicate worker calls create exactly one draft', async t => {
  const f = fixture(t); f.persist(); await f.workflow.createCheckout(f.order.id);
  const accepted = await Promise.all([f.workflow.acceptWebhook(f.event(), 'fixture-valid'), f.workflow.acceptWebhook(f.event(), 'fixture-valid')]);
  assert.equal(accepted.filter(x => x.duplicate).length, 1);
  const results = await Promise.all([f.workflow.processNextPayment({ workerId: 'worker-a' }), f.workflow.processNextPayment({ workerId: 'worker-b' })]);
  assert.equal(results.filter(x => x.status === 'draft_created').length, 1); assert.equal(f.calls.posts, 1);
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-c' })).status, 'idle');
});

test('different events for the same payment reconcile to the same existing draft', async t => {
  const f = fixture(t); f.persist(); await f.workflow.createCheckout(f.order.id);
  for (const [id, type] of [['evt_fixtureOne1', 'checkout.session.completed'], ['evt_fixtureTwo2', 'checkout.session.async_payment_succeeded']]) await f.workflow.acceptWebhook(f.event(id, type), 'fixture-valid');
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-a' })).status, 'draft_created');
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-b' })).status, 'draft_created');
  assert.equal(f.calls.posts, 1); assert.equal(f.calls.verified, 2);
});

test('unpaid completion waits; a separately received async-success event performs fresh verification', async t => {
  const f = fixture(t); f.persist(); await f.workflow.createCheckout(f.order.id); f.setPaid(false);
  await f.workflow.acceptWebhook(f.event(), 'fixture-valid');
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-a' })).status, 'awaiting_payment'); assert.equal(f.calls.posts, 0);
  f.setPaid(true); await f.workflow.acceptWebhook(f.event('evt_fixtureAsync1', 'checkout.session.async_payment_succeeded'), 'fixture-valid');
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-b' })).status, 'draft_created'); assert.equal(f.calls.posts, 1);
});

test('async-success with temporarily unpaid API state is retried, never acknowledged as fulfilled', async t => {
  const f = fixture(t); f.persist(); await f.workflow.createCheckout(f.order.id); f.setPaid(false);
  await f.workflow.acceptWebhook(f.event('evt_fixtureAsync1', 'checkout.session.async_payment_succeeded'), 'fixture-valid');
  const result = await f.workflow.processNextPayment({ workerId: 'worker-a' }); assert.equal(result.status, 'retry_scheduled'); assert.equal(f.calls.posts, 0);
  f.advance(); f.setPaid(true); assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-b' })).status, 'draft_created');
});

test('event arriving before session binding survives in durable inbox and recovers', async t => {
  const f = fixture(t); f.persist(); await f.workflow.acceptWebhook(f.event(), 'fixture-valid');
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-a' })).code, 'STRIPE_ORDER_MAPPING_NOT_READY');
  await f.workflow.createCheckout(f.order.id); f.advance();
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-b' })).status, 'draft_created'); assert.equal(f.calls.posts, 1);
});

test('safe initial lookup failure before the POST can retry through the durable mutation gate', async t => {
  const f = fixture(t); f.persist(); await f.workflow.createCheckout(f.order.id); await f.workflow.acceptWebhook(f.event(), 'fixture-valid'); f.failLookup();
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-a' })).status, 'retry_scheduled'); assert.equal(f.calls.posts, 0);
  f.advance(); assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-b' })).status, 'draft_created'); assert.equal(f.calls.posts, 1);
});

test('lost Session binding can recover from a fresh provider reference after the quote creation window', async t => {
  const f = fixture(t); f.persist();
  const bind = f.repository.bindStripeSession.bind(f.repository);
  f.repository.bindStripeSession = () => { throw new CommerceError('REPOSITORY_BUSY', { retryable: true }); };
  await assert.rejects(f.workflow.createCheckout(f.order.id), { code: 'STRIPE_SESSION_PERSISTENCE_UNCERTAIN' });
  assert.equal(f.calls.created, 1);
  f.repository.bindStripeSession = bind;
  f.stripe.recoverOrderReference = async (id, loadOrder) => {
    assert.equal(id, f.sessionId); const source = await loadOrder(f.order.id);
    return { orderId: source.id, quoteHash: source.quoteHash, sessionId: id };
  };
  f.advance(31 * 60 * 1000); await f.workflow.acceptWebhook(f.event(), 'fixture-valid');
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-recovery' })).status, 'draft_created');
  assert.equal(f.repository.getOrder(f.order.id).stripeCheckoutSessionId, f.sessionId);
  assert.equal(f.calls.created, 1); assert.equal(f.calls.posts, 1);
});

test('an ambiguous accepted POST is reconciled on retry without a second POST', async t => {
  const f = fixture(t); f.persist(); await f.workflow.createCheckout(f.order.id); await f.workflow.acceptWebhook(f.event(), 'fixture-valid'); f.failPost();
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-a' })).status, 'retry_scheduled'); assert.equal(f.calls.posts, 1);
  f.advance(); assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-b' })).status, 'draft_created'); assert.equal(f.calls.posts, 1);
});

test('failed/expired events and invalid signatures cannot enqueue fulfillment', async t => {
  const f = fixture(t); f.persist();
  await assert.rejects(f.workflow.acceptWebhook(f.event(), 'invalid'), { code: 'STRIPE_WEBHOOK_REJECTED' });
  for (const type of ['checkout.session.expired', 'checkout.session.async_payment_failed']) assert.equal((await f.workflow.acceptWebhook(f.event('evt_fixtureFail1', type), 'fixture-valid')).ignored, true);
  assert.equal((await f.workflow.processNextPayment({ workerId: 'worker-a' })).status, 'idle'); assert.equal(f.calls.posts, 0);
});

test('HTTP handler preserves raw bytes and never returns200 for a failed durable write', async t => {
  const f = fixture(t), handler = createStripeWebhookHandler(f.workflow), raw = f.event();
  const request = (body = raw, signature = 'fixture-valid') => new Request('https://backend.example.test/api/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': signature }, body });
  assert.equal((await handler(request(raw, 'wrong'))).status, 400);
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request(new Uint8Array(256 * 1024 + 1)))).status, 413);
  assert.equal((await handler(new Request('https://backend.example.test/api/stripe/webhook'))).status, 405);
  assert.equal((await handler(new Request('https://backend.example.test/unknown'))).status, 404);
  const failed = createStripeWebhookHandler({ acceptWebhook: async () => { throw new CommerceError('DATABASE_FAILED'); } });
  const result = await failed(request()); assert.equal(result.status, 503); assert.deepEqual(await result.json(), { error: 'temporarily_unavailable' });
  assert.equal(f.calls.posts, 0, 'HTTP delivery only persists the event; the worker handles provider calls');
});

test('preflight blocks missing/live keys before API access and only exposes sanitized read-only status', async () => {
  let calls = 0; const clientFactory = () => { calls++; return { balance: { retrieve: async () => ({ object: 'balance', livemode: false, available: [{ amount: 123456 }] }) }, tax: { settings: { retrieve: async () => ({ status: 'active' }) } } }; };
  assert.equal((await verifyStripe({}, { clientFactory })).networkAttempted, false);
  assert.equal((await verifyStripe({ STRIPE_SECRET_KEY: 'sk_live_fixture' }, { clientFactory })).networkAttempted, false); assert.equal(calls, 0);
  const result = await verifyStripe({ STRIPE_SECRET_KEY: 'sk_test_fixture123', STRIPE_WEBHOOK_SECRET: 'whsec_fixture123' }, { clientFactory });
  assert.equal(result.status, 'VERIFIED_READ_ONLY'); assert.equal(result.checkoutVerified, false); assert(!JSON.stringify(result).includes('123456'));
});
