/* ISOLATED: real stripe-node SDK/signature code, mocked provider methods; no API/charge. */
import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { STRIPE_API_VERSION, STRIPE_RETURN_URLS, createTestStripeClient, createStripeTestAdapter, StripeCheckoutAdapter } from '../server/commerce/stripe.js';

const SECRET = 'sk_test_isolatedFixtureKey123456789', WEBHOOK_SECRET = 'whsec_isolatedFixtureSecret123456789';
const CLOCK = Date.parse('2026-11-01T10:00:00Z'), SESSION_ID = 'cs_test_isolatedSession123456', INTENT_ID = 'pi_isolatedIntent123456';
const CONFIG = { mode: 'stripe_automatic', policyRevision: 'isolated-policy-v1', registrationIds: ['taxreg_isolatedRegistration123'], allowedCountries: ['FR', 'US'] };
const sourceOrder = () => ({ id: 'isolated_internal_order_1', currency: 'EUR', recipient: { name: 'Isolated Test', address1: 'Synthetic Street 1', city: 'Synthetic City', zip: '00000', country_code: 'FR' }, items: [{ sync_variant_id: 123, quantity: 2 }], shippingId: 'ISOLATED_STANDARD', shippingMinor: 100, shippingTaxCode: 'txcd_92010001', checkoutLines: [{ syncVariantId: 123, name: 'Synthetic artwork / Black / XXL', unitAmountMinor: 500, quantity: 2, taxCode: 'txcd_99999999' }] });
const errorCode = code => error => error?.code === code;
const list = data => ({ object: 'list', data, has_more: false });
const clone = value => structuredClone(value);
const stripeAddress = order => ({ country: order.recipient.country_code, line1: order.recipient.address1, line2: order.recipient.address2 || '', city: order.recipient.city, postal_code: order.recipient.zip, state: order.recipient.state_code || '' });

function fixture({ source = sourceOrder(), config = CONFIG } = {}) {
  const stripe = createTestStripeClient(SECRET), calls = [], logs = [];
  let clock = CLOCK, calculation, session, lineItems, paymentIntent, refundList = list([]);
  const call = (name, fn) => async (...args) => { calls.push({ name, args: clone(args) }); return fn(...args); };
  stripe.tax.settings.retrieve = call('tax.settings.retrieve', () => ({ object: 'tax.settings', status: 'active', livemode: false }));
  stripe.tax.registrations.retrieve = call('tax.registrations.retrieve', id => ({ id, object: 'tax.registration', status: 'active', livemode: false }));
  stripe.tax.calculations.create = call('tax.calculations.create', params => {
    // Synthetic 20% tax fixture only; never used by implementation/merchant rules.
    const lines = params.line_items.map((line, index) => ({ id: 'tax_li_isolated' + index, object: 'tax.calculation_line_item', livemode: false, amount: line.amount, quantity: line.quantity, reference: line.reference, tax_behavior: line.tax_behavior, tax_code: line.tax_code, amount_tax: line.amount / 5 }));
    const tax = lines.reduce((sum, line) => sum + line.amount_tax, 0) + params.shipping_cost.amount / 5;
    calculation = { id: 'taxcalc_isolatedCalculation123', object: 'tax.calculation', livemode: false, currency: params.currency, expires_at: Math.floor(CLOCK / 1000) + 7200, tax_amount_inclusive: 0, tax_amount_exclusive: tax, amount_total: lines.reduce((sum, line) => sum + line.amount, 0) + params.shipping_cost.amount + tax, customer_details: { ...params.customer_details, taxability_override: 'none', tax_ids: [] }, shipping_cost: { ...params.shipping_cost, amount_tax: params.shipping_cost.amount / 5 }, line_items: list(lines) };
    return clone(calculation);
  });
  stripe.tax.calculations.retrieve = call('tax.calculations.retrieve', () => clone(calculation));
  stripe.tax.calculations.listLineItems = call('tax.calculations.listLineItems', () => clone(calculation.line_items));
  stripe.checkout.sessions.create = call('checkout.sessions.create', params => {
    lineItems = params.line_items.map((line, index) => ({ id: 'li_isolated' + index, object: 'item', amount_discount: 0, amount_subtotal: line.price_data.unit_amount * line.quantity, amount_tax: line.price_data.unit_amount * line.quantity / 5, amount_total: line.price_data.unit_amount * line.quantity * 1.2, currency: params.currency, quantity: line.quantity, price: { id: 'price_isolated' + index, object: 'price', livemode: false, type: 'one_time', unit_amount: line.price_data.unit_amount, currency: params.currency, tax_behavior: line.price_data.tax_behavior, product: { id: 'prod_isolated' + index, object: 'product', livemode: false, ...line.price_data.product_data } } }));
    const shipping = params.shipping_options[0].shipping_rate_data;
    session = { id: SESSION_ID, object: 'checkout.session', livemode: false, mode: params.mode, ui_mode: params.ui_mode, client_reference_id: params.client_reference_id, metadata: params.metadata, currency: params.currency, amount_subtotal: calculation.amount_total - calculation.tax_amount_exclusive - params.shipping_options[0].shipping_rate_data.fixed_amount.amount, amount_total: calculation.amount_total, automatic_tax: { enabled: true, status: null }, total_details: { amount_shipping: shipping.fixed_amount.amount, amount_tax: calculation.tax_amount_exclusive, amount_discount: 0 }, status: 'open', payment_status: 'unpaid', expires_at: params.expires_at, success_url: params.success_url, cancel_url: params.cancel_url, url: 'https://checkout.stripe.com/c/pay/' + SESSION_ID, payment_intent: INTENT_ID, shipping_cost: { amount_subtotal: shipping.fixed_amount.amount, amount_tax: shipping.fixed_amount.amount / 5, amount_total: shipping.fixed_amount.amount * 1.2, shipping_rate: { id: 'shr_isolated123', object: 'shipping_rate', livemode: false, ...shipping } }, collected_information: null };
    paymentIntent = { id: INTENT_ID, object: 'payment_intent', livemode: false, status: 'succeeded', capture_method: 'automatic', amount: calculation.amount_total, amount_received: calculation.amount_total, amount_capturable: 0, currency: params.currency, metadata: params.payment_intent_data.metadata, review: null, latest_charge: { id: 'ch_isolatedCharge123', object: 'charge', livemode: false, status: 'succeeded', paid: true, captured: true, amount: calculation.amount_total, amount_captured: calculation.amount_total, currency: params.currency, payment_intent: INTENT_ID, refunded: false, amount_refunded: 0, disputed: false, review: null } };
    return clone(session);
  });
  stripe.checkout.sessions.retrieve = call('checkout.sessions.retrieve', () => clone(session));
  stripe.checkout.sessions.listLineItems = call('checkout.sessions.listLineItems', () => list(clone(lineItems)));
  stripe.paymentIntents.retrieve = call('paymentIntents.retrieve', () => clone(paymentIntent));
  stripe.refunds.list = call('refunds.list', () => clone(refundList));
  const adapter = new StripeCheckoutAdapter({ stripe, webhookSecret: WEBHOOK_SECRET, taxConfiguration: config, now: () => clock, log: entry => logs.push(entry) });
  return { stripe, calls, logs, adapter, source,
    async freeze() { const fields = await adapter.calculateTax(source); return { ...clone(source), ...fields }; },
    async checkout() { const order = await this.freeze(); const result = await adapter.createCheckout(order); return { ...order, stripeCheckoutSessionId: result.id }; },
    pay() { session.status = 'complete'; session.payment_status = 'paid'; session.automatic_tax.status = 'complete'; session.collected_information = { shipping_details: { name: source.recipient.name, address: stripeAddress(source) } }; },
    setClock(value) { clock = value; },
    get calculation() { return calculation; }, get session() { return session; }, get lineItems() { return lineItems; }, get paymentIntent() { return paymentIntent; }, set refunds(value) { refundList = value; }
  };
}

test('factory uses actual SDK23.1.0, pinned API, bounded retries/timeouts and rejects all live keys', () => {
  assert.equal(Stripe.PACKAGE_VERSION, '23.1.0');
  const stripe = createTestStripeClient(SECRET);
  assert.equal(stripe.getApiField('version'), STRIPE_API_VERSION);
  assert.equal(stripe.getApiField('timeout'), 5000);
  assert.equal(stripe.getApiField('maxNetworkRetries'), 1);
  assert.throws(() => createTestStripeClient('sk_live_isolatedRejectedKey1234'), errorCode('STRIPE_TEST_SECRET_KEY_REQUIRED'));
  assert.throws(() => createTestStripeClient(''), errorCode('STRIPE_TEST_SECRET_KEY_REQUIRED'));
  assert.throws(() => createStripeTestAdapter({ secretKey: SECRET }), errorCode('STRIPE_TAX_CONFIGURATION_REQUIRED'));
});

test('StripeTax quote verifies actual settings/registrations, exact address, codes and totals', async () => {
  const f = fixture(), order = await f.freeze();
  assert.equal(order.subtotalMinor, 1000); assert.equal(order.shippingMinor, 100); assert.equal(order.taxMinor, 220); assert.equal(order.totalMinor, 1320);
  assert.equal(order.taxQuoteExpiresAt - order.taxQuoteCreatedAt, 1800);
  assert.match(order.quoteHash, /^[a-f0-9]{64}$/);
  const call = f.calls.find(call => call.name === 'tax.calculations.create');
  assert.deepEqual(call.args[0].line_items, [{ amount: 1000, quantity: 2, reference: 'ua_line_0', tax_code: 'txcd_99999999', tax_behavior: 'exclusive' }]);
  assert.equal(call.args[0].customer_details.address_source, 'shipping');
  assert.match(call.args[1].idempotencyKey, /^ua-tax-v1-[a-f0-9]{64}$/);
  assert.equal(f.calls.some(call => call.name === 'tax.settings.retrieve'), true);
  assert.equal(f.calls.some(call => call.name === 'tax.registrations.retrieve'), true);
});

test('missing/inactive tax setup, tax codes and mismapped variants fail without a tax-zero fallback', async () => {
  const missingCode = fixture(); delete missingCode.source.checkoutLines[0].taxCode;
  await assert.rejects(missingCode.freeze(), errorCode('STRIPE_TAX_CODE_REQUIRED'));
  assert.equal(missingCode.calls.length, 0);
  const inactive = fixture(); inactive.stripe.tax.settings.retrieve = async () => ({ object: 'tax.settings', status: 'pending', livemode: false });
  await assert.rejects(inactive.freeze(), errorCode('STRIPE_TAX_NOT_READY'));
  assert.equal(inactive.calls.some(call => call.name === 'tax.calculations.create'), false);
  const wrongVariant = fixture(); wrongVariant.source.checkoutLines[0].syncVariantId = 999;
  await assert.rejects(wrongVariant.freeze(), errorCode('STRIPE_QUANTITY_MAPPING_MISMATCH'));
  const duplicate = fixture(); duplicate.source.checkoutLines.push(clone(duplicate.source.checkoutLines[0])); duplicate.source.items.push({ sync_variant_id: 999, quantity: 2 });
  await assert.rejects(duplicate.freeze(), errorCode('STRIPE_QUANTITY_MAPPING_MISMATCH'));
});

test('tax responses reject wrong environment/address/amount and incomplete pagination', async () => {
  for (const change of [calculation => { calculation.livemode = true; }, calculation => { calculation.customer_details.address.line1 = 'Other Street'; }, calculation => { calculation.amount_total++; }, calculation => { calculation.line_items.data[0].quantity = 1; }]) {
    const f = fixture(), original = f.stripe.tax.calculations.create;
    f.stripe.tax.calculations.create = async (...args) => { const calculation = await original(...args); change(calculation); return calculation; };
    await assert.rejects(f.freeze());
  }
});

test('hosted Checkout uses only frozen server quote, fixed return URLs and stable idempotency parameters', async () => {
  const f = fixture(), order = await f.freeze();
  order.successUrl = 'https://attacker.invalid'; order.total = 1; order.paid = true;
  const first = await f.adapter.createCheckout(order);
  f.setClock(CLOCK + 120000);
  const second = await f.adapter.createCheckout(order);
  assert.deepEqual(first, { id: SESSION_ID, url: 'https://checkout.stripe.com/c/pay/' + SESSION_ID }); assert.deepEqual(second, first);
  const calls = f.calls.filter(call => call.name === 'checkout.sessions.create');
  assert.deepEqual(calls[0].args, calls[1].args);
  const [params, options] = calls[0].args;
  assert.equal(params.mode, 'payment'); assert.equal(params.ui_mode, 'hosted_page');
  assert.equal(params.success_url, STRIPE_RETURN_URLS.success); assert.equal(params.cancel_url, STRIPE_RETURN_URLS.cancel);
  assert.equal(params.automatic_tax.enabled, true); assert.equal(params.adaptive_pricing.enabled, false);
  assert.equal(params.line_items[0].price_data.unit_amount, 500); assert.equal(params.line_items[0].quantity, 2);
  assert.equal(params.line_items[0].price_data.product_data.metadata.ua_sync_variant, '123');
  assert.equal(params.payment_intent_data.capture_method, 'automatic');
  assert.equal(Object.hasOwn(params, 'payment_method_types'), false);
  assert.equal(options.idempotencyKey, 'ua-checkout-v1-' + order.quoteHash);
  assert.equal(JSON.stringify(params.metadata).includes('Synthetic Street'), false);
});

test('mutated quote, shipping, recipient or variant mappings cannot create Checkout', async () => {
  const f = fixture(), order = await f.freeze();
  for (const mutate of [copy => { copy.totalMinor--; }, copy => { copy.shippingMinor++; }, copy => { copy.recipient.address1 = 'Other Street'; }, copy => { copy.checkoutLines[0].unitAmountMinor = 1; }, copy => { copy.items[0].sync_variant_id = 999; }, copy => { copy.taxMinor = 0; }]) {
    const copy = clone(order); mutate(copy); await assert.rejects(f.adapter.createCheckout(copy));
  }
  assert.equal(f.calls.filter(call => call.name === 'checkout.sessions.create').length, 0);
});

test('expired quote cannot reuse an idempotency key beyond creation window; resume never creates a second Session', async () => {
  const f = fixture(), order = await f.checkout();
  const before = f.calls.filter(call => call.name === 'checkout.sessions.create').length;
  f.setClock(CLOCK + 1800001);
  const unbound = clone(order); delete unbound.stripeCheckoutSessionId;
  await assert.rejects(f.adapter.createCheckout(unbound), errorCode('STRIPE_QUOTE_EXPIRED'));
  assert.equal((await f.adapter.resumeCheckout(order)).id, SESSION_ID);
  assert.equal(f.calls.filter(call => call.name === 'checkout.sessions.create').length, before);
  f.pay(); await assert.rejects(f.adapter.resumeCheckout(order), errorCode('STRIPE_CHECKOUT_NOT_OPEN'));
  f.session.status = 'expired'; await assert.rejects(f.adapter.createCheckout(order), errorCode('STRIPE_CHECKOUT_NOT_OPEN'));
});

test('fresh Session lookup recovers a lost DB mapping after quote expiry without replaying POST', async () => {
  const f = fixture(), order = await f.checkout(); f.pay(); f.setClock(CLOCK + 1900000);
  const stored = clone(order); delete stored.stripeCheckoutSessionId;
  const before = f.calls.filter(call => call.name === 'checkout.sessions.create').length;
  const recovered = await f.adapter.recoverOrderReference(SESSION_ID, async id => id === stored.id ? stored : null);
  assert.deepEqual(recovered, { orderId: stored.id, quoteHash: stored.quoteHash, sessionId: SESSION_ID });
  assert.equal(f.calls.filter(call => call.name === 'checkout.sessions.create').length, before);
  f.session.metadata.ua_quote = '0'.repeat(64);
  await assert.rejects(f.adapter.recoverOrderReference(SESSION_ID, async () => stored), errorCode('STRIPE_SESSION_MISMATCH'));
  f.session.metadata.ua_quote = stored.quoteHash;
  await assert.rejects(f.adapter.recoverOrderReference(SESSION_ID, async () => ({ ...stored, stripeCheckoutSessionId: 'cs_test_differentSession123' })), errorCode('STRIPE_SESSION_MAPPING_CONFLICT'));
});

test('ambiguous Checkout creation keeps a deterministic key; provider errors never log credentials/customer details', async () => {
  const f = fixture(), order = await f.freeze(), error = Object.assign(new Error(SECRET + sourceOrder().recipient.name), { type: 'StripeConnectionError' });
  f.stripe.checkout.sessions.create = async () => { throw error; };
  await assert.rejects(f.adapter.createCheckout(order), candidate => candidate.code === 'STRIPE_CHECKOUT_CREATE_UNCERTAIN' && candidate.ambiguous && candidate.retryable);
  assert.equal(JSON.stringify(f.logs).includes(SECRET), false); assert.equal(JSON.stringify(f.logs).includes(sourceOrder().recipient.name), false);
  f.stripe.checkout.sessions.retrieve = async () => { throw Object.assign(new Error('sensitive provider body'), { statusCode: 503 }); };
  await assert.rejects(f.adapter.resumeCheckout({ ...order, stripeCheckoutSessionId: SESSION_ID }), candidate => candidate.code === 'STRIPE_PROVIDER_UNAVAILABLE' && candidate.retryable);
});

test('accepted Session POST with lost reply retries identical serialized parameters after30seconds', async () => {
  const f = fixture(), order = await f.freeze(), create = f.stripe.checkout.sessions.create;
  const serialized = []; let first = true;
  f.stripe.checkout.sessions.create = async (...args) => {
    serialized.push(JSON.stringify(args));
    const result = await create(...args);
    if (first) { first = false; throw Object.assign(new Error('isolated disconnect after acceptance'), { type: 'StripeConnectionError' }); }
    return result;
  };
  await assert.rejects(f.adapter.createCheckout(order), errorCode('STRIPE_CHECKOUT_CREATE_UNCERTAIN'));
  f.setClock(CLOCK + 30000);
  assert.equal((await f.adapter.createCheckout(order)).id, SESSION_ID);
  assert.equal(serialized.length, 2); assert.equal(serialized[0], serialized[1]);
  const [params, options] = JSON.parse(serialized[0]);
  assert.equal(params.expires_at, order.taxQuoteExpiresAt + 1860);
  assert.equal(options.idempotencyKey, 'ua-checkout-v1-' + order.quoteHash);
});

test('tax-calculation retries keep identical body/key and late preflight cannot outlive creation window', async () => {
  const f = fixture(); await f.freeze(); f.setClock(CLOCK + 30000); await f.freeze();
  const calculations = f.calls.filter(call => call.name === 'tax.calculations.create');
  assert.deepEqual(calculations[0].args, calculations[1].args);
  const late = fixture(), order = await late.freeze(), retrieve = late.stripe.tax.calculations.retrieve;
  late.stripe.tax.calculations.retrieve = async (...args) => { const result = await retrieve(...args); late.setClock(order.taxQuoteExpiresAt * 1000); return result; };
  await assert.rejects(late.adapter.createCheckout(order), errorCode('STRIPE_QUOTE_EXPIRED'));
  assert.equal(late.calls.some(call => call.name === 'checkout.sessions.create'), false);
});

test('fresh paid Session + every line + PaymentIntent/charge/refund state yields a trusted payment proof', async () => {
  const f = fixture(), order = await f.checkout(); f.pay();
  const payment = await f.adapter.verifyPayment(order);
  assert.deepEqual(payment, { verified: true, status: 'paid', orderId: order.id, amountMinor: 1320, currency: 'EUR', providerReference: INTENT_ID, stripeCheckoutSessionId: SESSION_ID, testMode: true });
  assert.equal(f.calls.some(call => call.name === 'checkout.sessions.retrieve'), true);
  assert.equal(f.calls.some(call => call.name === 'checkout.sessions.listLineItems'), true);
  assert.equal(f.calls.some(call => call.name === 'paymentIntents.retrieve'), true);
  assert.equal(f.calls.some(call => call.name === 'refunds.list'), true);
});

test('completed but unpaid async payment and expired Session never verify as paid', async () => {
  const f = fixture(), order = await f.checkout();
  f.session.status = 'complete'; f.session.payment_status = 'unpaid';
  await assert.rejects(f.adapter.verifyPayment(order), errorCode('STRIPE_PAYMENT_PENDING'));
  f.session.payment_status = 'no_payment_required'; await assert.rejects(f.adapter.verifyPayment(order), errorCode('STRIPE_PAYMENT_PENDING'));
  f.session.status = 'expired'; await assert.rejects(f.adapter.verifyPayment(order), errorCode('STRIPE_PAYMENT_EXPIRED'));
  assert.equal(f.calls.some(call => call.name === 'paymentIntents.retrieve'), false);
});

test('Session metadata/mode/currency/totals/tax and changed delivery address fail verification', async () => {
  const cases = [
    [session => { session.metadata.ua_quote = 'other'; }, 'STRIPE_SESSION_MISMATCH'],
    [session => { session.livemode = true; }, 'STRIPE_SESSION_MISMATCH'],
    [session => { session.currency = 'usd'; }, 'STRIPE_SESSION_MISMATCH'],
    [session => { session.amount_total--; }, 'STRIPE_PAYMENT_MISMATCH'],
    [session => { session.total_details.amount_tax--; }, 'STRIPE_PAYMENT_MISMATCH'],
    [session => { session.automatic_tax.status = 'failed'; }, 'STRIPE_PAYMENT_MISMATCH'],
    [session => { session.collected_information.shipping_details.address.line1 = 'Other Street'; }, 'STRIPE_ADDRESS_MISMATCH'],
    [session => { session.shipping_cost.shipping_rate.metadata.ua_shipping = 'other'; }, 'STRIPE_SHIPPING_MISMATCH']
  ];
  for (const [change, code] of cases) { const f = fixture(), order = await f.checkout(); f.pay(); change(f.session); await assert.rejects(f.adapter.verifyPayment(order), errorCode(code)); }
});

test('line verification detects quantity/price/variant substitutions and duplicate metadata', async () => {
  for (const change of [line => { line.quantity = 1; }, line => { line.price.unit_amount = 1; }, line => { line.price.product.metadata.ua_sync_variant = '999'; }, line => { line.price.product.metadata.ua_line = '2'; }, line => { line.price.product.tax_code = 'txcd_00000000'; }]) {
    const f = fixture(), order = await f.checkout(); f.pay(); change(f.lineItems[0]);
    await assert.rejects(f.adapter.verifyPayment(order), errorCode('STRIPE_PAYMENT_LINES_MISMATCH'));
  }
});

test('all Checkout line-item pages are fetched; duplicate and extra pages fail closed', async () => {
  const source = sourceOrder(); source.items.push({ sync_variant_id: 456, quantity: 1 }); source.checkoutLines.push({ syncVariantId: 456, name: 'Another synthetic variant', unitAmountMinor: 100, quantity: 1, taxCode: 'txcd_99999999' });
  const f = fixture({ source }), order = await f.checkout(); f.pay();
  const calls = [];
  f.stripe.checkout.sessions.listLineItems = async (_id, params) => { calls.push(params); return params.starting_after ? list([clone(f.lineItems[1])]) : { ...list([clone(f.lineItems[0])]), has_more: true }; };
  await f.adapter.verifyPayment(order);
  assert.equal(calls.length, 2); assert.equal(calls[1].starting_after, f.lineItems[0].id);
  f.stripe.checkout.sessions.listLineItems = async () => { return { ...list([clone(f.lineItems[0])]), has_more: true }; };
  await assert.rejects(f.adapter.verifyPayment(order), errorCode('STRIPE_INVALID_PAGINATION'));
});

test('uncaptured, partially refunded, disputed, reviewed and pending-refund payments cannot manufacture', async () => {
  for (const change of [charge => { charge.captured = false; }, charge => { charge.amount_captured--; }]) {
    const f = fixture(), order = await f.checkout(); f.pay(); change(f.paymentIntent.latest_charge);
    await assert.rejects(f.adapter.verifyPayment(order), candidate => candidate.code === 'STRIPE_CAPTURE_NOT_VERIFIED' && candidate.retryable);
  }
  for (const change of [charge => { charge.refunded = true; }, charge => { charge.amount_refunded = 1; }, charge => { charge.disputed = true; }, charge => { charge.review = 'prv_synthetic'; }]) {
    const f = fixture(), order = await f.checkout(); f.pay(); change(f.paymentIntent.latest_charge);
    await assert.rejects(f.adapter.verifyPayment(order), errorCode('STRIPE_PAYMENT_REFUND_OR_REVIEW'));
  }
  const f = fixture(), order = await f.checkout(); f.pay(); f.refunds = list([{ id: 're_synthetic', status: 'pending' }]);
  await assert.rejects(f.adapter.verifyPayment(order), errorCode('STRIPE_PAYMENT_REFUND_OR_REVIEW'));
});

function eventPayload(type = 'checkout.session.completed') {
  return { id: 'evt_isolatedEvent123456', object: 'event', api_version: STRIPE_API_VERSION, type, created: Math.floor(CLOCK / 1000), livemode: false, data: { object: { id: SESSION_ID, object: 'checkout.session', livemode: false, payment_status: 'unpaid' } } };
}
function signed(f, event, { timestamp = CLOCK / 1000, secret = WEBHOOK_SECRET } = {}) {
  const payload = JSON.stringify(event);
  return [Buffer.from(payload), f.stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp })];
}

test('actual SDK snapshot signature verification returns only a trigger, never payment evidence', () => {
  const f = fixture(), event = eventPayload();
  const verified = f.adapter.verifyWebhook(...signed(f, event));
  assert.deepEqual(verified, { id: event.id, type: event.type, created: event.created, sessionId: SESSION_ID, ignored: false });
  assert.equal(Object.hasOwn(verified, 'verified'), false);
  for (const type of ['checkout.session.async_payment_failed', 'checkout.session.expired']) assert.equal(f.adapter.verifyWebhook(...signed(f, eventPayload(type))).ignored, true);
  assert.equal(f.adapter.verifyWebhook(...signed(f, eventPayload('checkout.session.async_payment_succeeded'))).ignored, false);
});

test('signed webhook rejects altered raw body, wrong secret, stale signature, live/old-version/thin events', () => {
  const f = fixture(), event = eventPayload(), [raw, signature] = signed(f, event);
  assert.throws(() => f.adapter.verifyWebhook(Buffer.from(raw.toString().replace('unpaid', 'paid')), signature), errorCode('STRIPE_WEBHOOK_UNAUTHORIZED'));
  assert.throws(() => f.adapter.verifyWebhook(...signed(f, event, { secret: 'whsec_otherIsolatedSecret123' })), errorCode('STRIPE_WEBHOOK_UNAUTHORIZED'));
  assert.throws(() => f.adapter.verifyWebhook(...signed(f, event, { timestamp: CLOCK / 1000 - 301 })), errorCode('STRIPE_WEBHOOK_UNAUTHORIZED'));
  assert.throws(() => f.adapter.verifyWebhook(raw.toString(), signature), errorCode('STRIPE_INVALID_WEBHOOK'));
  assert.throws(() => f.adapter.verifyWebhook(...signed(f, { ...event, livemode: true })), errorCode('STRIPE_INVALID_WEBHOOK'));
  assert.throws(() => f.adapter.verifyWebhook(...signed(f, { ...event, api_version: '2020-01-01' })), errorCode('STRIPE_WEBHOOK_VERSION_OR_MODE_MISMATCH'));
  assert.throws(() => f.adapter.verifyWebhook(...signed(f, { ...event, object: 'v2.core.event' })), errorCode('STRIPE_WEBHOOK_UNAUTHORIZED'));
  assert.equal(f.calls.length, 0);
});
