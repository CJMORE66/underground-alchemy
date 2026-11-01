/* ISOLATED provider fixtures only. No API access, real product prices, tax rules or charges. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { CheckoutQuoteService } from '../server/commerce/quote-service.js';
import { CommerceError } from '../server/commerce/validation.js';
import { StripeCheckoutAdapter, createTestStripeClient } from '../server/commerce/stripe.js';
import { PrintfulClient } from '../server/commerce/printful.js';

const NOW = Date.parse('2026-11-01T12:00:00Z'), OWNER = 'opaque_site_owner_123';
const config = () => ({ currency: 'EUR', currencyExponent: 2, allowedCountries: ['FR', 'US'], priceTaxBehavior: 'exclusive', policyRevision: 'isolated-policy-v1', shippingTaxCode: 'txcd_92010001', taxCodeByProductId: { original_product: 'txcd_99999999' } });
const recipient = () => ({ name: 'Private Synthetic Customer', address1: '1 Private Synthetic Street', city: 'Paris', zip: '75001', country_code: 'FR', email: 'isolated@example.test' });
const input = shippingId => ({ lines: [{ variantId: 'original_variant', quantity: 2 }], recipient: recipient(), ...(shippingId == null ? {} : { shippingId }) });
const variant = () => ({ id: 'original_variant', productId: 'original_product', name: 'Synthetic shirt', title: 'Black / XXL', storeId: 18912189, syncVariantId: 123, catalogVariantId: 456, retailPrice: { amount: '12.50', currency: 'EUR' }, availabilityStatus: 'active', synced: true });
const code = expected => error => error?.code === expected;
const clone = value => structuredClone(value);

function fixture({ configuration = config(), taxAdapter, repository } = {}) {
  const calls = { catalogStores: 0, printfulStores: 0, variants: [], shipping: [], tax: [], saved: [] };
  let clock = NOW, current = variant();
  const catalog = { async verifyStore() { calls.catalogStores++; return { id: 18912189, verified: true }; }, async getVariant(id) { calls.variants.push(id); return clone(current); } };
  const printful = { async verifyStore() { calls.printfulStores++; return { id: 18912189, verified: true }; }, async shippingRates(value) { calls.shipping.push(clone(value)); return [{ id: 'FIXTURE_STANDARD', name: 'Synthetic standard method', rate: '3.50', currency: 'EUR' }, { id: 'FIXTURE_EXPRESS', name: 'Synthetic express method', rate: '8.00', currency: 'EUR' }]; } };
  const stripe = taxAdapter || { async calculateTax(base) {
    calls.tax.push(clone(base));
    // Synthetic tax amount returned by an isolated provider adapter, never a rate/policy in the implementation.
    const subtotalMinor = base.checkoutLines.reduce((sum, line) => sum + line.unitAmountMinor * line.quantity, 0), taxMinor = 123;
    return { subtotalMinor, shippingMinor: base.shippingMinor, taxMinor, totalMinor: subtotalMinor + base.shippingMinor + taxMinor, taxCalculationId: 'taxcalc_isolatedQuote123', taxPolicyRevision: configuration.policyRevision, taxQuoteCreatedAt: Math.floor(clock / 1000), taxQuoteExpiresAt: Math.floor(clock / 1000) + 1800, quoteHash: 'a'.repeat(64) };
  } };
  const repo = repository || { async createOrder(order) { await Promise.resolve(); calls.saved.push(clone(order)); return clone(order); } };
  const service = new CheckoutQuoteService({ catalog, printful, stripe, repository: repo, configuration, now: () => clock, generateOrderId: () => 'ua_order_isolated_generated_123' });
  return { service, calls, catalog, printful, stripe, repository: repo, current: () => current, setVariant(value) { current = value; }, setClock(value) { clock = value; }, quote(value = input('FIXTURE_STANDARD'), context = { ownerId: OWNER }) { return service.quote(value, context); } };
}

test('missing merchant configuration, tax treatment/codes or trusted adapters fail before provider requests', () => {
  const dependency = { verifyStore() {}, getVariant() {}, shippingRates() {}, calculateTax() {}, createOrder() {} };
  const base = { catalog: dependency, printful: dependency, stripe: dependency, repository: dependency, configuration: config() };
  assert.throws(() => new CheckoutQuoteService({ ...base, catalog: null }), code('QUOTE_SERVER_ADAPTERS_REQUIRED'));
  for (const change of [copy => { delete copy.priceTaxBehavior; }, copy => { copy.priceTaxBehavior = 'inclusive'; }, copy => { delete copy.currencyExponent; }, copy => { copy.allowedCountries = []; }]) { const value = config(); change(value); assert.throws(() => new CheckoutQuoteService({ ...base, configuration: value }), code('QUOTE_MERCHANT_CONFIGURATION_REQUIRED')); }
  for (const change of [copy => { delete copy.shippingTaxCode; }, copy => { delete copy.taxCodeByProductId; }, copy => { copy.taxCodeByProductId.original_product = 'invented'; }]) { const value = config(); change(value); assert.throws(() => new CheckoutQuoteService({ ...base, configuration: value }), code('QUOTE_TAX_CONFIGURATION_REQUIRED')); }
});

test('browser prices, tax/paid/owner/order fields and malformed cart data are never accepted', async () => {
  const f = fixture();
  for (const key of ['price', 'totalMinor', 'paid', 'taxCode', 'ownerId', 'orderId', 'currency', 'successUrl']) await assert.rejects(f.quote({ ...input(), [key]: 'untrusted' }), code('QUOTE_INVALID_INPUT'));
  await assert.rejects(f.quote({ ...input(), lines: [{ variantId: 'original_variant', quantity: 1, unitAmountMinor: 1 }] }), code('QUOTE_INVALID_LINES'));
  for (const quantity of [0, -1, 1.5, 100, '1']) await assert.rejects(f.quote({ ...input(), lines: [{ variantId: 'original_variant', quantity }] }));
  await assert.rejects(f.quote({ ...input(), lines: [input().lines[0], input().lines[0]] }), code('QUOTE_DUPLICATE_VARIANT'));
  await assert.rejects(f.quote({ ...input(), lines: [] }), code('QUOTE_INVALID_LINES'));
  await assert.rejects(f.quote({ ...input(), lines: Array.from({ length: 51 }, (_, n) => ({ variantId: 'v' + n, quantity: 1 })) }), code('QUOTE_INVALID_LINES'));
  await assert.rejects(f.quote(input(), {}), code('QUOTE_OWNER_REQUIRED'));
  await assert.rejects(f.quote(input(), { ownerId: 'email@example.test' }), code('QUOTE_OWNER_REQUIRED'));
  assert.equal(f.calls.catalogStores, 0); assert.equal(f.calls.printfulStores, 0);
});

test('recipient validation and configured country restrictions precede network access', async () => {
  const f = fixture();
  await assert.rejects(f.quote({ ...input(), recipient: { ...recipient(), paid: true } }), code('QUOTE_INVALID_RECIPIENT'));
  await assert.rejects(f.quote({ ...input(), recipient: { ...recipient(), country_code: 'XX' } }), code('QUOTE_COUNTRY_NOT_CONFIGURED'));
  await assert.rejects(f.quote({ ...input(), recipient: { ...recipient(), country_code: 'US' } }), code('STATE_REQUIRED'));
  await assert.rejects(f.quote({ ...input(), recipient: { ...recipient(), name: '' } }), code('INVALID_TEXT'));
  assert.equal(f.calls.catalogStores, 0);
});

test('both actual provider interfaces must verify store18912189 before any product or shipping work', async () => {
  for (const side of ['catalog', 'printful']) {
    const f = fixture(); f[side].verifyStore = async () => ({ id: 999, verified: true });
    await assert.rejects(f.quote(), code('QUOTE_STORE_NOT_VERIFIED'));
    assert.equal(f.calls.variants.length, 0); assert.equal(f.calls.shipping.length, 0); assert.equal(f.calls.saved.length, 0);
  }
  const f = fixture(); f.catalog.verifyStore = async () => ({ id: 18912189 });
  await assert.rejects(f.quote(), code('QUOTE_STORE_NOT_VERIFIED'));
});

test('shipping preview uses fresh retailer currency/price and catalog IDs, without persisting PII or an order', async () => {
  const f = fixture(), result = await f.quote(input());
  assert.equal(result.status, 'shipping_required'); assert.equal(result.subtotalMinor, 2500);
  assert.deepEqual(result.shippingOptions.map(option => option.amountMinor), [350, 800]);
  assert.deepEqual(f.calls.shipping[0].items, [{ variant_id: 456, quantity: 2 }]);
  assert.deepEqual(f.calls.shipping[0].recipient, recipient());
  assert.equal(f.calls.shipping[0].currency, 'EUR'); assert.equal(f.calls.tax.length, 0); assert.equal(f.calls.saved.length, 0);
  assert(!JSON.stringify(result).includes(recipient().name)); assert(!JSON.stringify(result).includes(recipient().address1)); assert(!JSON.stringify(result).includes(OWNER));
  assert.equal(result.lines[0].variantId, 'original_variant'); assert.equal(result.lines[0].productId, 'original_product');
  const changed = variant(); changed.retailPrice.amount = '14.00'; f.setVariant(changed);
  assert.equal((await f.quote(input())).subtotalMinor, 2800); assert.equal(f.calls.variants.length, 2);
});

test('unknown, unsynced, unmapped, unavailable or unpriced variants cannot use historical price fallbacks', async () => {
  for (const mutate of [copy => { copy.id = 'other'; }, copy => { copy.storeId = 999; }, copy => { copy.synced = false; }, copy => { copy.syncVariantId = 0; }, copy => { copy.catalogVariantId = 0; }, copy => { copy.availabilityStatus = 'unknown'; }, copy => { copy.availabilityStatus = 'out_of_stock'; }, copy => { delete copy.retailPrice; copy.sourcePrice = { amount: 1, currency: 'EUR' }; }, copy => { copy.retailPrice.currency = 'USD'; }, copy => { copy.retailPrice.amount = '0'; }, copy => { copy.retailPrice.amount = '12.501'; }, copy => { copy.retailPrice.amount = '1e2'; }]) {
    const f = fixture(), value = variant(); mutate(value); f.setVariant(value);
    await assert.rejects(f.quote()); assert.equal(f.calls.tax.length, 0); assert.equal(f.calls.saved.length, 0);
  }
  const f = fixture(); f.catalog.getVariant = async () => null;
  await assert.rejects(f.quote(), code('QUOTE_VARIANT_MAPPING_MISMATCH'));
});

test('different merchandising IDs cannot silently alias the same fulfillment variant', async () => {
  const f = fixture(); f.catalog.getVariant = async id => ({ ...variant(), id });
  await assert.rejects(f.quote({ ...input(), lines: [{ variantId: 'one', quantity: 1 }, { variantId: 'two', quantity: 1 }] }), code('QUOTE_VARIANT_MAPPING_MISMATCH'));
  assert.equal(f.calls.shipping.length, 0);
});

test('distinct artwork sync variants sharing one blank aggregate shipping quantities only', async () => {
  const f = fixture(), shippingBodies = [];
  const client = new PrintfulClient({ token: 'isolated-shipping-fixture-token', fetch: async (url, options) => {
    const result = url.endsWith('/stores') ? [{ id: 18912189 }] : [{ id: 'FIXTURE_STANDARD', name: 'Synthetic actual-client method', rate: '3.50', currency: 'EUR' }];
    if (url.endsWith('/shipping/rates')) shippingBodies.push(JSON.parse(options.body));
    return Response.json({ code: 200, result });
  } });
  f.printful.verifyStore = () => client.verifyStore(); f.printful.shippingRates = value => client.shippingRates(value);
  f.catalog.getVariant = async id => ({ ...variant(), id, syncVariantId: id === 'one' ? 123 : 789 });
  await f.quote({ ...input('FIXTURE_STANDARD'), lines: [{ variantId: 'one', quantity: 2 }, { variantId: 'two', quantity: 3 }] });
  assert.deepEqual(shippingBodies[0].items, [{ variant_id: 456, quantity: 5 }]);
  assert.deepEqual(f.calls.saved[0].items, [{ sync_variant_id: 123, quantity: 2 }, { sync_variant_id: 789, quantity: 3 }]);
  assert.deepEqual(f.calls.saved[0].checkoutLines.map(line => line.syncVariantId), [123, 789]);
  await assert.rejects(f.quote({ ...input(), lines: [{ variantId: 'one', quantity: 99 }, { variantId: 'two', quantity: 2 }] }), code('QUOTE_SHIPPING_QUANTITY_LIMIT'));
  assert.equal(shippingBodies.length, 1);
});

test('only a returned current shipping method and exact currency/decimal rate can be selected', async () => {
  const f = fixture(); await assert.rejects(f.quote(input('invented')), code('QUOTE_SHIPPING_METHOD_UNAVAILABLE'));
  assert.equal(f.calls.tax.length, 0); assert.equal(f.calls.saved.length, 0);
  for (const rates of [[], [{ id: 'X', name: 'X', rate: '1.00', currency: 'USD' }], [{ id: 'X', name: 'X', rate: '-1', currency: 'EUR' }], [{ id: 'X', name: 'X', rate: '1.001', currency: 'EUR' }], [{ id: 'X', name: 'X', rate: '1.00', currency: 'EUR' }, { id: 'X', name: 'X', rate: '2.00', currency: 'EUR' }]]) {
    const q = fixture(); q.printful.shippingRates = async () => clone(rates); await assert.rejects(q.quote()); assert.equal(q.calls.saved.length, 0);
  }
});

test('fully quoted immutable order keeps server ownership and original merchandising IDs, with separate provider identities', async () => {
  const f = fixture(), result = await f.quote();
  assert.equal(result.status, 'quoted'); assert.equal(result.orderId, 'ua_order_isolated_generated_123');
  assert.equal(result.subtotalMinor, 2500); assert.equal(result.shippingMinor, 350); assert.equal(result.taxMinor, 123); assert.equal(result.totalMinor, 2973);
  assert.equal(f.calls.saved.length, 1);
  const saved = f.calls.saved[0]; assert.equal(saved.ownerId, OWNER); assert.deepEqual(saved.items, [{ sync_variant_id: 123, quantity: 2 }]);
  assert.deepEqual(saved.merchandisingLines, [{ variantId: 'original_variant', productId: 'original_product', syncVariantId: 123, catalogVariantId: 456, quantity: 2 }]);
  assert.equal(saved.checkoutLines[0].unitAmountMinor, 1250); assert.equal(saved.checkoutLines[0].syncVariantId, 123); assert.equal(saved.checkoutLines[0].taxCode, 'txcd_99999999');
  assert.equal(saved.shippingId, 'FIXTURE_STANDARD'); assert.equal(saved.shippingTaxCode, 'txcd_92010001'); assert.deepEqual(saved.recipient, recipient());
  assert(!JSON.stringify(result).includes(OWNER)); assert(!JSON.stringify(result).includes('taxcalc_')); assert.equal(result.expiresAt, Math.floor(NOW / 1000) + 1800);
  result.lines[0].unitAmountMinor = 1; assert.equal(saved.checkoutLines[0].unitAmountMinor, 1250);
});

test('long multilingual product labels preserve public text and never split a surrogate pair in payment names', async () => {
  const f = fixture(); f.setVariant({ ...variant(), name: 'X'.repeat(197) + '😀', title: 'A'.repeat(300) });
  const result = await f.quote();
  assert.equal(result.lines[0].name, 'X'.repeat(197) + '😀');
  const checkout = f.calls.saved[0].checkoutLines[0].name;
  assert(checkout.length <= 200); assert(checkout.isWellFormed());
  const boundary = fixture(); boundary.setVariant({ ...variant(), name: 'X'.repeat(199) + '😀' });
  await boundary.quote(); assert.equal(boundary.calls.saved[0].checkoutLines[0].name, 'X'.repeat(199));
});

test('per-variant tax configuration overrides product code without mutable external configuration or defaults', async () => {
  const configuration = config(); configuration.taxCodeByVariantId = { original_variant: 'txcd_00000001' };
  const f = fixture({ configuration }); configuration.taxCodeByVariantId.original_variant = 'txcd_00000002';
  await f.quote(); assert.equal(f.calls.saved[0].checkoutLines[0].taxCode, 'txcd_00000001');
  const missing = fixture(); missing.setVariant({ ...variant(), productId: 'unconfigured_product' });
  await assert.rejects(missing.quote(), code('QUOTE_TAX_CONFIGURATION_REQUIRED')); assert.equal(missing.calls.shipping.length, 0);
});

test('unverified/missing/mismatched/expired tax responses fail closed without a tax-zero substitute', async () => {
  for (const mutate of [value => { delete value.taxMinor; }, value => { value.totalMinor++; }, value => { value.subtotalMinor--; }, value => { value.shippingMinor--; }, value => { value.taxPolicyRevision = 'other'; }, value => { value.quoteHash = 'bad'; }, value => { value.taxCalculationId = null; }, value => { value.taxQuoteExpiresAt = Math.floor(NOW / 1000); }, value => { value.taxQuoteCreatedAt = Math.floor(NOW / 1000) + 6; }]) {
    const f = fixture(), calculate = f.stripe.calculateTax.bind(f.stripe);
    f.stripe.calculateTax = async base => { const fields = await calculate(base); mutate(fields); return fields; };
    await assert.rejects(f.quote()); assert.equal(f.calls.saved.length, 0);
  }
});

test('zero shipping and zero tax are accepted only as explicit verified provider results', async () => {
  const f = fixture(); f.printful.shippingRates = async () => [{ id: 'ZERO', name: 'Explicit synthetic zero rate', rate: '0.00', currency: 'EUR' }];
  const calculate = f.stripe.calculateTax.bind(f.stripe);
  f.stripe.calculateTax = async base => { const fields = await calculate(base); return { ...fields, taxMinor: 0, totalMinor: fields.subtotalMinor + fields.shippingMinor }; };
  const result = await f.quote(input('ZERO')); assert.equal(result.shippingMinor, 0); assert.equal(result.taxMinor, 0); assert.equal(result.totalMinor, 2500);
});

test('provider/unknown persistence errors are sanitized and failed storage never returns a usable quote', async () => {
  const f = fixture(); f.catalog.getVariant = async () => { throw new Error('secret-token private-customer-body'); };
  await assert.rejects(f.quote(), error => error.code === 'QUOTE_PROVIDER_UNAVAILABLE' && !String(error).includes('secret-token'));
  const p = fixture({ repository: { async createOrder() { throw new Error('private SQL customer/token'); } } });
  await assert.rejects(p.quote(), code('QUOTE_PERSISTENCE_FAILED'));
  const malformed = fixture({ repository: { async createOrder(order) { return { ...order, ownerId: 'other' }; } } });
  await assert.rejects(malformed.quote(), code('QUOTE_PERSISTENCE_FAILED'));
});

test('clock/amount bounds and a quote expiring during persistence cannot return active checkout data', async () => {
  const f = fixture(); f.setClock(0); await assert.rejects(f.quote(), code('QUOTE_INVALID_CLOCK'));
  const large = fixture(); large.setVariant({ ...variant(), retailPrice: { amount: '999999.99', currency: 'EUR' } });
  await assert.rejects(large.quote(), code('QUOTE_INVALID_AMOUNT'));
  const expiring = fixture(); expiring.repository.createOrder = async order => { expiring.setClock(NOW + 1800000); return clone(order); };
  await assert.rejects(expiring.quote(), code('QUOTE_EXPIRED'));
});

test('actual Stripe quote adapter consumes the service order and its frozen hash without any live API', async () => {
  const sdk = createTestStripeClient('sk_test_isolatedQuoteIntegration123');
  sdk.tax.settings.retrieve = async () => ({ object: 'tax.settings', status: 'active', livemode: false });
  sdk.tax.registrations.retrieve = async id => ({ id, object: 'tax.registration', status: 'active', livemode: false });
  let calculation;
  sdk.tax.calculations.create = async params => {
    const line_items = { object: 'list', has_more: false, data: params.line_items.map((line, index) => ({ ...line, id: 'tax_li_isolated' + index, object: 'tax.calculation_line_item', livemode: false, amount_tax: 0 })) };
    calculation = { id: 'taxcalc_isolatedIntegration123', object: 'tax.calculation', livemode: false, currency: params.currency, expires_at: NOW / 1000 + 3600, customer_details: { ...params.customer_details, taxability_override: 'none', tax_ids: [] }, tax_amount_inclusive: 0, tax_amount_exclusive: 0, shipping_cost: { ...params.shipping_cost, amount_tax: 0 }, amount_total: line_items.data.reduce((sum, line) => sum + line.amount, 0) + params.shipping_cost.amount, line_items };
    return clone(calculation);
  };
  sdk.tax.calculations.retrieve = async () => clone(calculation);
  sdk.checkout.sessions.create = async params => ({ id: 'cs_test_isolatedQuoteSession123', object: 'checkout.session', livemode: false, mode: params.mode, ui_mode: params.ui_mode, client_reference_id: params.client_reference_id, metadata: params.metadata, currency: params.currency, amount_subtotal: params.line_items.reduce((sum, line) => sum + line.price_data.unit_amount * line.quantity, 0), automatic_tax: params.automatic_tax, success_url: params.success_url, cancel_url: params.cancel_url, status: 'open', payment_status: 'unpaid', url: 'https://checkout.stripe.com/c/pay/isolatedquote' });
  const stripe = new StripeCheckoutAdapter({ stripe: sdk, webhookSecret: 'whsec_isolatedQuoteIntegration123', taxConfiguration: { mode: 'stripe_automatic', policyRevision: config().policyRevision, registrationIds: ['taxreg_isolatedQuote123'], allowedCountries: ['FR'] }, now: () => NOW });
  const f = fixture({ taxAdapter: stripe }), result = await f.quote();
  assert.equal(result.totalMinor, 2850); assert.equal(result.taxMinor, 0);
  const checkout = await stripe.createCheckout(f.calls.saved[0]);
  assert.equal(checkout.id, 'cs_test_isolatedQuoteSession123');
  assert.equal(f.calls.saved[0].checkoutLines[0].syncVariantId, f.calls.saved[0].items[0].sync_variant_id);
});
