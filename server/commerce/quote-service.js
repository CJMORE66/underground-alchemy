/* Server-owned quotes. No browser prices, historical snapshots, payments or order confirmation. */
import { CommerceError, boundedText, currencyCode, decimalToMinor, integer, orderTotalMinor, shippingRecipient } from './validation.js';
import { EXPECTED_STORE_ID } from './printful.js';

const MAX_LINES = 50, MAX_QUANTITY = 99, MAX_AMOUNT = 99999999;
const ID = /^[A-Za-z0-9_-]{1,120}$/;
const ownObject = value => value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const allowed = (value, names, code) => {
  if (!ownObject(value) || Object.keys(value).some(key => !names.includes(key))) throw new CommerceError(code);
};
const publicId = value => { if (typeof value !== 'string' || !ID.test(value)) throw new CommerceError('QUOTE_INVALID_VARIANT'); return value; };
const taxCode = value => { if (typeof value !== 'string' || !/^txcd_[0-9]{8}$/.test(value)) throw new CommerceError('QUOTE_TAX_CONFIGURATION_REQUIRED'); return value; };
const amount = value => { if (!Number.isSafeInteger(value) || value < 0 || value > MAX_AMOUNT) throw new CommerceError('QUOTE_INVALID_AMOUNT'); return value; };
const clone = value => structuredClone(value);
const checkoutName = (name, title) => {
  let result = '';
  for (const character of name + ' / ' + title) {
    const point = character.codePointAt(0);
    if (point >= 0xd800 && point <= 0xdfff) throw new CommerceError('QUOTE_INVALID_PRODUCT_TEXT');
    if (result.length + character.length > 200) break;
    result += character;
  }
  return boundedText(result, 200);
};

function taxMap(source) {
  if (source == null) return Object.freeze(Object.create(null));
  if (!ownObject(source) || Object.keys(source).length > 5000) throw new CommerceError('QUOTE_TAX_CONFIGURATION_REQUIRED');
  const result = Object.create(null);
  for (const [id, code] of Object.entries(source)) result[publicId(id)] = taxCode(code);
  return Object.freeze(result);
}

export function validateQuoteConfiguration(source) {
  if (!ownObject(source) || source.priceTaxBehavior !== 'exclusive' || !Number.isInteger(source.currencyExponent) || source.currencyExponent < 0 || source.currencyExponent > 3 || !Array.isArray(source.allowedCountries) || !source.allowedCountries.length || source.allowedCountries.length > 100) throw new CommerceError('QUOTE_MERCHANT_CONFIGURATION_REQUIRED');
  const countries = [...new Set(source.allowedCountries.map(country => {
    if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country)) throw new CommerceError('QUOTE_MERCHANT_CONFIGURATION_REQUIRED');
    return country;
  }))];
  const config = { currency: currencyCode(source.currency), currencyExponent: source.currencyExponent,
    allowedCountries: Object.freeze(countries), priceTaxBehavior: 'exclusive', policyRevision: boundedText(source.policyRevision, 100),
    shippingTaxCode: taxCode(source.shippingTaxCode), taxCodeByVariantId: taxMap(source.taxCodeByVariantId), taxCodeByProductId: taxMap(source.taxCodeByProductId) };
  if (!Object.keys(config.taxCodeByVariantId).length && !Object.keys(config.taxCodeByProductId).length) throw new CommerceError('QUOTE_TAX_CONFIGURATION_REQUIRED');
  return Object.freeze(config);
}

function checkoutInput(source) {
  allowed(source, ['lines', 'recipient', 'shippingId'], 'QUOTE_INVALID_INPUT');
  if (!Array.isArray(source.lines) || !source.lines.length || source.lines.length > MAX_LINES) throw new CommerceError('QUOTE_INVALID_LINES');
  const seen = new Set();
  const lines = source.lines.map(line => {
    allowed(line, ['variantId', 'quantity'], 'QUOTE_INVALID_LINES');
    const variantId = publicId(line.variantId), quantity = integer(line.quantity, MAX_QUANTITY);
    if (seen.has(variantId)) throw new CommerceError('QUOTE_DUPLICATE_VARIANT');
    seen.add(variantId); return { variantId, quantity };
  });
  allowed(source.recipient, ['country_code', 'name', 'company', 'address1', 'address2', 'city', 'zip', 'state_code', 'phone', 'email'], 'QUOTE_INVALID_RECIPIENT');
  return { lines, recipient: shippingRecipient(source.recipient, { order: true }),
    shippingId: source.shippingId == null ? null : boundedText(source.shippingId, 100) };
}

/*
 * catalog is an AUTHORIZED SERVER interface, never a client catalog JSON:
 *   verifyStore() -> {id:18912189, verified:true}, from a real authorized API read.
 *   getVariant(internalId) -> {id,productId,name,title,storeId,syncVariantId,
 *     catalogVariantId,retailPrice:{amount:decimalString,currency:ISO},
 *     availabilityStatus:'active',synced:true} freshly read from that store.
 * It must preserve reviewed merchandising IDs while checking provider identities.
 * configuration comes from verified merchant settings; currency exponents/tax
 * treatment/codes are never inferred here. Stripe.calculateTax verifies its actual
 * tax settings, registrations and calculated response. Callers must authenticate
 * ownerId and rate-limit this operation before invoking it.
 */
export class CheckoutQuoteService {
  #catalog; #printful; #stripe; #repository; #configuration; #now; #generateOrderId;
  constructor({ catalog, printful, stripe, repository, configuration, now = Date.now,
    generateOrderId = () => 'ua_order_' + globalThis.crypto.randomUUID().replaceAll('-', '') } = {}) {
    if (!catalog || ['verifyStore', 'getVariant'].some(name => typeof catalog[name] !== 'function') || !printful || ['verifyStore', 'shippingRates'].some(name => typeof printful[name] !== 'function') || typeof stripe?.calculateTax !== 'function' || typeof repository?.createOrder !== 'function' || typeof now !== 'function' || typeof generateOrderId !== 'function') throw new CommerceError('QUOTE_SERVER_ADAPTERS_REQUIRED');
    this.#configuration = validateQuoteConfiguration(configuration);
    this.#catalog = catalog; this.#printful = printful; this.#stripe = stripe; this.#repository = repository;
    this.#now = now; this.#generateOrderId = generateOrderId;
  }

  #seconds() {
    const time = this.#now();
    if (!Number.isSafeInteger(time) || time <= 0) throw new CommerceError('QUOTE_INVALID_CLOCK');
    return Math.floor(time / 1000);
  }
  async #provider(callback) {
    try { return await callback(); }
    catch (error) {
      if (error instanceof CommerceError) throw error;
      throw new CommerceError('QUOTE_PROVIDER_UNAVAILABLE', { retryable: true });
    }
  }
  #verifyStore(proof) {
    if (proof?.id !== EXPECTED_STORE_ID || proof.verified !== true) throw new CommerceError('QUOTE_STORE_NOT_VERIFIED');
  }
  #variant(source, requested) {
    if (!ownObject(source) || source.id !== requested.variantId || source.storeId !== EXPECTED_STORE_ID || source.synced !== true) throw new CommerceError('QUOTE_VARIANT_MAPPING_MISMATCH');
    const productId = publicId(source.productId), syncVariantId = integer(source.syncVariantId), catalogVariantId = integer(source.catalogVariantId);
    if (source.availabilityStatus !== 'active') throw new CommerceError('QUOTE_VARIANT_UNAVAILABLE');
    if (!ownObject(source.retailPrice) || typeof source.retailPrice.amount !== 'string' || source.retailPrice.currency !== this.#configuration.currency) throw new CommerceError('QUOTE_RETAIL_PRICE_UNAVAILABLE');
    const unitAmountMinor = amount(decimalToMinor(source.retailPrice.amount, this.#configuration.currencyExponent));
    if (unitAmountMinor <= 0) throw new CommerceError('QUOTE_RETAIL_PRICE_UNAVAILABLE');
    const code = this.#configuration.taxCodeByVariantId[source.id] || this.#configuration.taxCodeByProductId[productId];
    const name = boundedText(source.name, 300), title = boundedText(source.title, 300);
    return { variantId: requested.variantId, productId, name, title, syncVariantId, catalogVariantId,
      quantity: requested.quantity, unitAmountMinor, taxCode: taxCode(code) };
  }
  #shipping(rates) {
    if (!Array.isArray(rates) || !rates.length || rates.length > 100) throw new CommerceError('QUOTE_NO_SHIPPING_METHODS');
    const seen = new Set();
    return rates.map(rate => {
      const id = boundedText(rate?.id, 100), name = boundedText(rate?.name, 500);
      if (seen.has(id) || rate.currency !== this.#configuration.currency || typeof rate.rate !== 'string') throw new CommerceError('QUOTE_INVALID_SHIPPING_RATE');
      const amountMinor = amount(decimalToMinor(rate.rate, this.#configuration.currencyExponent));
      seen.add(id); return { id, name, amountMinor, currency: rate.currency };
    });
  }
  #tax(fields, base, now) {
    const subtotalMinor = orderTotalMinor(base.checkoutLines, 0, 0).subtotalMinor;
    if (!ownObject(fields) || fields.subtotalMinor !== subtotalMinor || fields.shippingMinor !== base.shippingMinor || fields.taxPolicyRevision !== this.#configuration.policyRevision || typeof fields.taxCalculationId !== 'string' || !/^taxcalc_[A-Za-z0-9]{4,240}$/.test(fields.taxCalculationId) || typeof fields.quoteHash !== 'string' || !/^[a-f0-9]{64}$/.test(fields.quoteHash) || !Number.isSafeInteger(fields.taxQuoteCreatedAt) || fields.taxQuoteCreatedAt <= 0 || fields.taxQuoteCreatedAt > now + 5 || !Number.isSafeInteger(fields.taxQuoteExpiresAt) || fields.taxQuoteExpiresAt <= now || fields.taxQuoteExpiresAt <= fields.taxQuoteCreatedAt || fields.taxQuoteExpiresAt - fields.taxQuoteCreatedAt > 1800) throw new CommerceError('QUOTE_TAX_VERIFICATION_FAILED');
    const taxMinor = amount(fields.taxMinor), totalMinor = amount(fields.totalMinor);
    if (totalMinor <= 0 || totalMinor !== subtotalMinor + base.shippingMinor + taxMinor) throw new CommerceError('QUOTE_TAX_VERIFICATION_FAILED');
    return { subtotalMinor, shippingMinor: base.shippingMinor, taxMinor, totalMinor,
      taxCalculationId: fields.taxCalculationId, taxPolicyRevision: fields.taxPolicyRevision,
      taxQuoteCreatedAt: fields.taxQuoteCreatedAt, taxQuoteExpiresAt: fields.taxQuoteExpiresAt, quoteHash: fields.quoteHash };
  }

  async quote(source, context = {}) {
    const input = checkoutInput(source);
    const ownerId = context?.ownerId;
    if (typeof ownerId !== 'string' || !/^[A-Za-z0-9:_-]{1,200}$/.test(ownerId)) throw new CommerceError('QUOTE_OWNER_REQUIRED');
    if (!this.#configuration.allowedCountries.includes(input.recipient.country_code)) throw new CommerceError('QUOTE_COUNTRY_NOT_CONFIGURED');
    this.#seconds();
    this.#verifyStore(await this.#provider(() => this.#catalog.verifyStore()));
    this.#verifyStore(await this.#provider(() => this.#printful.verifyStore()));
    const lines = [], syncIds = new Set();
    for (const requested of input.lines) {
      const line = this.#variant(await this.#provider(() => this.#catalog.getVariant(requested.variantId)), requested);
      if (syncIds.has(line.syncVariantId)) throw new CommerceError('QUOTE_VARIANT_MAPPING_MISMATCH');
      syncIds.add(line.syncVariantId); lines.push(line);
    }
    const subtotalMinor = amount(orderTotalMinor(lines, 0, 0).subtotalMinor);
    // Different artworks can use the same blank catalog variant. Printful shipping
    // is quoted on catalog IDs; keep artwork/sync IDs separate for fulfillment.
    const shippingItems = new Map();
    for (const line of lines) {
      const quantity = (shippingItems.get(line.catalogVariantId) || 0) + line.quantity;
      if (quantity > 100) throw new CommerceError('QUOTE_SHIPPING_QUANTITY_LIMIT');
      shippingItems.set(line.catalogVariantId, quantity);
    }
    const rates = await this.#provider(() => this.#printful.shippingRates({ recipient: clone(input.recipient),
      items: [...shippingItems].map(([variant_id, quantity]) => ({ variant_id, quantity })), currency: this.#configuration.currency }));
    const shippingOptions = this.#shipping(rates);
    const publicLines = lines.map(({ variantId, productId, name, title, quantity, unitAmountMinor }) => ({ variantId, productId, name, title, quantity, unitAmountMinor, lineAmountMinor: unitAmountMinor * quantity }));
    const summary = { currency: this.#configuration.currency, currencyExponent: this.#configuration.currencyExponent, priceTaxBehavior: 'exclusive', subtotalMinor, lines: publicLines, shippingOptions };
    if (input.shippingId === null) return { status: 'shipping_required', ...summary };
    const shipping = shippingOptions.find(option => option.id === input.shippingId);
    if (!shipping) throw new CommerceError('QUOTE_SHIPPING_METHOD_UNAVAILABLE');
    const id = this.#generateOrderId();
    if (typeof id !== 'string' || !ID.test(id)) throw new CommerceError('QUOTE_SERVER_ID_INVALID');
    const base = { id, currency: this.#configuration.currency, recipient: clone(input.recipient),
      items: lines.map(line => ({ sync_variant_id: line.syncVariantId, quantity: line.quantity })),
      shippingId: shipping.id, shippingMinor: shipping.amountMinor, shippingTaxCode: this.#configuration.shippingTaxCode,
      checkoutLines: lines.map(line => ({ syncVariantId: line.syncVariantId, name: checkoutName(line.name, line.title), unitAmountMinor: line.unitAmountMinor, quantity: line.quantity, taxCode: line.taxCode })) };
    const tax = this.#tax(await this.#provider(() => this.#stripe.calculateTax(clone(base))), base, this.#seconds());
    const order = { ...base, ...tax, ownerId,
      merchandisingLines: lines.map(({ variantId, productId, syncVariantId, catalogVariantId, quantity }) => ({ variantId, productId, syncVariantId, catalogVariantId, quantity })) };
    let saved;
    try { saved = await this.#repository.createOrder(clone(order)); }
    catch (error) {
      if (error instanceof CommerceError) throw error;
      throw new CommerceError('QUOTE_PERSISTENCE_FAILED', { retryable: true });
    }
    if (!saved || saved.id !== order.id || saved.ownerId !== ownerId || saved.quoteHash !== order.quoteHash || saved.currency !== order.currency || saved.totalMinor !== order.totalMinor) throw new CommerceError('QUOTE_PERSISTENCE_FAILED');
    if (order.taxQuoteExpiresAt <= this.#seconds()) throw new CommerceError('QUOTE_EXPIRED');
    return { status: 'quoted', ...summary, orderId: order.id, selectedShippingId: shipping.id,
      shippingMinor: order.shippingMinor, taxMinor: order.taxMinor, totalMinor: order.totalMinor, expiresAt: order.taxQuoteExpiresAt };
  }
}
