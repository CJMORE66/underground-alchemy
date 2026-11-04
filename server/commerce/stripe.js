/* Server-only TEST MODE adapter. No HTTP route, live keys, card collection or fulfillment confirmation. */
import Stripe from 'stripe';
import { createHash } from 'node:crypto';
import { CommerceError, boundedText, currencyCode, fulfillmentItems, integer, orderTotalMinor, shippingRecipient } from './validation.js';

export const STRIPE_API_VERSION = '2026-10-28.endive';
export const STRIPE_RETURN_URLS = Object.freeze({
  success: 'https://caisik-underground-alchemy.caisik.chatgpt.site/shop/?checkout=return&session_id={CHECKOUT_SESSION_ID}',
  cancel: 'https://caisik-underground-alchemy.caisik.chatgpt.site/shop/?checkout=canceled'
});
const MAX_AMOUNT = 99999999, MAX_LINES = 100, MAX_PAGES = 5, QUOTE_LIFETIME = 1800;
const sha256 = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const minor = value => { if (!Number.isSafeInteger(value) || value < 0 || value > MAX_AMOUNT) throw new CommerceError('STRIPE_INVALID_AMOUNT'); return value; };
const stripeId = (value, prefix) => { if (typeof value !== 'string' || !new RegExp('^' + prefix + '[A-Za-z0-9]{4,240}$').test(value)) throw new CommerceError('STRIPE_INVALID_ID'); return value; };
const taxCode = value => { if (typeof value !== 'string' || !/^txcd_[0-9]{8}$/.test(value)) throw new CommerceError('STRIPE_TAX_CODE_REQUIRED'); return value; };
const idOf = value => typeof value === 'string' ? value : value?.id;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function isStripeTestKey(secretKey) {
  return typeof secretKey === 'string' && /^(?:sk|rk)_test_[A-Za-z0-9]{8,250}$/.test(secretKey);
}

export function createTestStripeClient(secretKey) {
  if (!isStripeTestKey(secretKey)) throw new CommerceError('STRIPE_TEST_SECRET_KEY_REQUIRED');
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, timeout: 5000, maxNetworkRetries: 1, telemetry: false });
}

export function createWorkerTestStripeClient(secretKey, { fetch: fetchImplementation = (input, init) => globalThis.fetch(input, init) } = {}) {
  if (!isStripeTestKey(secretKey)) throw new CommerceError('STRIPE_TEST_SECRET_KEY_REQUIRED');
  if (fetchImplementation !== undefined && typeof fetchImplementation !== 'function') throw new CommerceError('STRIPE_FETCH_REQUIRED');
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, timeout: 5000, maxNetworkRetries: 1, telemetry: false, httpClient: Stripe.createFetchHttpClient(fetchImplementation) });
}

function configuration(value) {
  if (!value || value.mode !== 'stripe_automatic' || !Array.isArray(value.registrationIds) || !value.registrationIds.length || value.registrationIds.length > 5 || !Array.isArray(value.allowedCountries) || !value.allowedCountries.length || value.allowedCountries.length > 100) throw new CommerceError('STRIPE_TAX_CONFIGURATION_REQUIRED');
  const policyRevision = boundedText(value.policyRevision, 100);
  const registrationIds = [...new Set(value.registrationIds.map(id => stripeId(id, 'taxreg_')))];
  const allowedCountries = [...new Set(value.allowedCountries.map(code => { if (typeof code !== 'string' || !/^[A-Z]{2}$/.test(code)) throw new CommerceError('STRIPE_TAX_CONFIGURATION_REQUIRED'); return code; }))];
  return Object.freeze({ mode: 'stripe_automatic', policyRevision, registrationIds, allowedCountries });
}

function addressOf(recipient) {
  return { country: recipient.country_code, line1: recipient.address1, line2: recipient.address2 || '', city: recipient.city, postal_code: recipient.zip, state: recipient.state_code || '' };
}

function normalizedAddress(address) {
  if (!address || typeof address !== 'object') throw new CommerceError('STRIPE_ADDRESS_MISMATCH');
  return { country: boundedText(address.country, 2), line1: boundedText(address.line1, 200), line2: boundedText(address.line2, 200, false) || '', city: boundedText(address.city, 200), postal_code: boundedText(address.postal_code, 200), state: boundedText(address.state, 200, false) || '' };
}

function baseOrder(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new CommerceError('STRIPE_SERVER_ORDER_REQUIRED');
  const id = boundedText(source.id, 120), currency = currencyCode(source.currency);
  const recipient = shippingRecipient(source.recipient, { order: true });
  const items = fulfillmentItems(source.items);
  const shippingId = boundedText(source.shippingId, 200), shippingMinor = minor(source.shippingMinor), shippingTaxCode = taxCode(source.shippingTaxCode);
  if (!Array.isArray(source.checkoutLines) || !source.checkoutLines.length || source.checkoutLines.length > MAX_LINES) throw new CommerceError('STRIPE_INVALID_LINES');
  const checkoutLines = source.checkoutLines.map((line, index) => ({
    reference: 'ua_line_' + index, syncVariantId: integer(line.syncVariantId), name: boundedText(line.name, 200), unitAmountMinor: integer(line.unitAmountMinor, MAX_AMOUNT), quantity: integer(line.quantity, 100), taxCode: taxCode(line.taxCode)
  }));
  const mapped = new Set();
  if (checkoutLines.length !== items.length || checkoutLines.some(line => { const item = items.find(item => item.sync_variant_id === line.syncVariantId); if (!item || mapped.has(line.syncVariantId) || item.quantity !== line.quantity) return true; mapped.add(line.syncVariantId); return false; })) throw new CommerceError('STRIPE_QUANTITY_MAPPING_MISMATCH');
  const subtotalMinor = orderTotalMinor(checkoutLines, 0, 0).subtotalMinor;
  minor(subtotalMinor);
  return { id, currency, recipient, items, shippingId, shippingMinor, shippingTaxCode, checkoutLines, subtotalMinor };
}

function frozenOrder(source, policyRevision) {
  const base = baseOrder(source), taxMinor = minor(source.taxMinor), totalMinor = minor(source.totalMinor);
  if (source.subtotalMinor !== base.subtotalMinor || totalMinor !== base.subtotalMinor + base.shippingMinor + taxMinor || totalMinor <= 0 || source.taxPolicyRevision !== policyRevision) throw new CommerceError('STRIPE_FROZEN_QUOTE_MISMATCH');
  const taxCalculationId = stripeId(source.taxCalculationId, 'taxcalc_');
  if (!Number.isSafeInteger(source.taxQuoteCreatedAt) || !Number.isSafeInteger(source.taxQuoteExpiresAt) || source.taxQuoteCreatedAt <= 0 || source.taxQuoteExpiresAt <= source.taxQuoteCreatedAt || source.taxQuoteExpiresAt - source.taxQuoteCreatedAt > QUOTE_LIFETIME) throw new CommerceError('STRIPE_INVALID_QUOTE_EXPIRY');
  const quote = { ...base, taxMinor, totalMinor, taxCalculationId, taxPolicyRevision: policyRevision, taxQuoteCreatedAt: source.taxQuoteCreatedAt, taxQuoteExpiresAt: source.taxQuoteExpiresAt };
  const quoteHash = sha256(quote);
  if (source.quoteHash !== quoteHash) throw new CommerceError('STRIPE_FROZEN_QUOTE_MISMATCH');
  return { ...quote, quoteHash };
}

function metadata(order) {
  return { ua_order: order.id, ua_quote: order.quoteHash, ua_taxcalc: order.taxCalculationId, ua_taxpolicy: order.taxPolicyRevision };
}

function metadataMatches(actual, expected) {
  return actual && Object.entries(expected).every(([key, value]) => actual[key] === value);
}

function checkoutUrl(value) {
  try { const url = new URL(value); if (url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' && !url.username && !url.password && url.port === '') return url.href; } catch { /* A provider URL is not trusted without validation. */ }
  throw new CommerceError('STRIPE_CHECKOUT_URL_REJECTED');
}

function webhookInput(rawBody, signature, secret) {
  if (typeof secret !== 'string' || !/^whsec_[A-Za-z0-9]{8,250}$/.test(secret)) throw new CommerceError('STRIPE_WEBHOOK_SECRET_REQUIRED');
  if (!(rawBody instanceof Uint8Array) || !rawBody.byteLength || rawBody.byteLength > 256 * 1024 || typeof signature !== 'string' || signature.length > 4096) throw new CommerceError('STRIPE_INVALID_WEBHOOK');
}

function normalizeWebhook(event, signature, seconds, apiVersion = STRIPE_API_VERSION) {
  const signatureTime = signature.split(',').find(part => part.startsWith('t='))?.slice(2);
  if (!signatureTime || !/^\d+$/.test(signatureTime) || Number(signatureTime) > seconds + 300 || event?.object !== 'event' || event.livemode !== false || event.account || event.context || !Number.isSafeInteger(event.created) || event.created <= 0 || event.created > seconds + 300) throw new CommerceError('STRIPE_INVALID_WEBHOOK');
  const id = stripeId(event.id, 'evt_');
  const supported = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired']);
  if (!supported.has(event.type)) return Object.freeze({ id, type: boundedText(event.type, 100), created: event.created, sessionId: null, ignored: true });
  if (event.api_version !== apiVersion || event.data?.object?.object !== 'checkout.session' || event.data.object.livemode !== false) throw new CommerceError('STRIPE_WEBHOOK_VERSION_OR_MODE_MISMATCH');
  return Object.freeze({ id, type: event.type, created: event.created, sessionId: stripeId(event.data.object.id, 'cs_test_'), ignored: !['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) });
}

// Signature admission needs only its own endpoint secret. It must remain usable
// while API credentials/tax configuration are unavailable, so a durable inbox can
// retain verified test events without constructing an authenticated API client.
export async function verifyStripeTestWebhook(rawBody, signature, { webhookSecret, now = Date.now, subtleCrypto = globalThis.crypto?.subtle, apiVersion = STRIPE_API_VERSION } = {}) {
  webhookInput(rawBody, signature, webhookSecret);
  // The endpoint snapshot version is an explicit, bounded contract independent
  // of the API client pin. Only routing fields shared by these versions are
  // consumed; payment evidence always comes from a fresh pinned API read.
  if (![STRIPE_API_VERSION, '2026-09-30.endive'].includes(apiVersion)) throw new CommerceError('STRIPE_WEBHOOK_API_VERSION_UNSUPPORTED');
  if (typeof now !== 'function') throw new CommerceError('STRIPE_INVALID_CLOCK');
  const receivedAt = now(), seconds = Math.floor(receivedAt / 1000);
  if (!Number.isSafeInteger(seconds) || seconds <= 0) throw new CommerceError('STRIPE_INVALID_CLOCK');
  if (!subtleCrypto || typeof subtleCrypto.importKey !== 'function' || typeof subtleCrypto.sign !== 'function') throw new CommerceError('STRIPE_WEB_CRYPTO_REQUIRED');
  let event;
  try {
    event = await Stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret, 300, Stripe.createSubtleCryptoProvider(subtleCrypto), receivedAt);
  } catch { throw new CommerceError('STRIPE_WEBHOOK_UNAUTHORIZED'); }
  return normalizeWebhook(event, signature, seconds, apiVersion);
}

export class StripeCheckoutAdapter {
  #stripe; #secret; #tax; #now; #log; #webhookCryptoProvider;
  constructor({ stripe, webhookSecret, taxConfiguration, now = Date.now, log = () => {}, webhookCryptoProvider }) {
    if (!stripe?.checkout?.sessions || !stripe?.tax?.calculations || !stripe?.webhooks || typeof now !== 'function' || typeof log !== 'function') throw new CommerceError('STRIPE_SDK_REQUIRED');
    if (webhookCryptoProvider !== undefined && typeof webhookCryptoProvider?.computeHMACSignatureAsync !== 'function') throw new CommerceError('STRIPE_WEB_CRYPTO_REQUIRED');
    this.#stripe = stripe; this.#secret = webhookSecret; this.#tax = configuration(taxConfiguration); this.#now = now; this.#log = log; this.#webhookCryptoProvider = webhookCryptoProvider;
  }

  #emit(entry) { try { this.#log(entry); } catch { /* Logs cannot change payment behavior. */ } }
  #seconds() { const result = Math.floor(this.#now() / 1000); if (!Number.isSafeInteger(result) || result <= 0) throw new CommerceError('STRIPE_INVALID_CLOCK'); return result; }
  #order(source) {
    const order = frozenOrder(source, this.#tax.policyRevision);
    if (!this.#tax.allowedCountries.includes(order.recipient.country_code)) throw new CommerceError('STRIPE_COUNTRY_NOT_CONFIGURED');
    return order;
  }
  async #call(operation, callback, { checkoutMutation = false } = {}) {
    try { return await callback(); }
    catch (error) {
      if (error instanceof CommerceError) throw error;
      const status = Number.isInteger(error?.statusCode) ? error.statusCode : null;
      const transient = status === 429 || status === 409 || status >= 500 || ['StripeConnectionError', 'StripeAPIError', 'StripeRateLimitError'].includes(error?.type);
      const code = status === 401 ? 'STRIPE_AUTH_FAILED' : status === 403 ? 'STRIPE_PERMISSION_DENIED' : checkoutMutation && transient ? 'STRIPE_CHECKOUT_CREATE_UNCERTAIN' : transient ? 'STRIPE_PROVIDER_UNAVAILABLE' : 'STRIPE_REQUEST_REJECTED';
      this.#emit({ event: 'stripe_error', operation, code, status });
      throw new CommerceError(code, { status, retryable: transient, ambiguous: checkoutMutation && transient });
    }
  }

  async #assertTaxReady() {
    const [settings, ...registrations] = await Promise.all([
      this.#call('tax_settings', () => this.#stripe.tax.settings.retrieve()),
      ...this.#tax.registrationIds.map(id => this.#call('tax_registration', () => this.#stripe.tax.registrations.retrieve(id)))
    ]);
    if (settings?.object !== 'tax.settings' || settings.status !== 'active' || settings.livemode !== false || registrations.some((registration, index) => registration?.id !== this.#tax.registrationIds[index] || registration.object !== 'tax.registration' || registration.status !== 'active' || registration.livemode !== false)) throw new CommerceError('STRIPE_TAX_NOT_READY');
    // The configured merchant policy determines applicable registrations; no invented country/tax rules.
  }

  async #allPages(first, fetchNext, maximum = MAX_LINES) {
    let page = first, values = [], cursor = null; const ids = new Set();
    for (let count = 0; count < MAX_PAGES; count++) {
      if (page?.object !== 'list' || !Array.isArray(page.data) || page.data.length > 100 || typeof page.has_more !== 'boolean') throw new CommerceError('STRIPE_INVALID_PAGINATION');
      for (const item of page.data) { if (!item?.id || ids.has(item.id)) throw new CommerceError('STRIPE_INVALID_PAGINATION'); ids.add(item.id); values.push(item); }
      if (values.length > maximum) throw new CommerceError('STRIPE_LINE_LIMIT');
      if (!page.has_more) return values;
      const next = page.data.at(-1)?.id;
      if (!next || next === cursor) throw new CommerceError('STRIPE_INVALID_PAGINATION');
      cursor = next; page = await fetchNext(cursor);
    }
    throw new CommerceError('STRIPE_PAGINATION_LIMIT');
  }

  async #taxLines(calculation) {
    const first = calculation.line_items || await this.#call('tax_lines', () => this.#stripe.tax.calculations.listLineItems(calculation.id, { limit: 100 }));
    return this.#allPages(first, cursor => this.#call('tax_lines', () => this.#stripe.tax.calculations.listLineItems(calculation.id, { limit: 100, starting_after: cursor })));
  }

  async #matchCalculation(calculation, base) {
    if (calculation?.object !== 'tax.calculation' || calculation.livemode !== false || calculation.currency !== base.currency.toLowerCase() || !Number.isSafeInteger(calculation.expires_at) || calculation.expires_at <= this.#seconds() || calculation.tax_amount_inclusive !== 0 || calculation.customer_details?.address_source !== 'shipping' || calculation.customer_details?.taxability_override !== 'none' || calculation.customer_details?.tax_ids?.length !== 0 || !same(normalizedAddress(calculation.customer_details?.address), addressOf(base.recipient))) throw new CommerceError('STRIPE_TAX_QUOTE_MISMATCH');
    const taxMinor = minor(calculation.tax_amount_exclusive), totalMinor = minor(calculation.amount_total);
    if (totalMinor !== base.subtotalMinor + base.shippingMinor + taxMinor || calculation.shipping_cost?.amount !== base.shippingMinor || calculation.shipping_cost?.tax_behavior !== 'exclusive' || calculation.shipping_cost?.tax_code !== base.shippingTaxCode) throw new CommerceError('STRIPE_TAX_QUOTE_MISMATCH');
    const lines = await this.#taxLines(calculation);
    if (lines.length !== base.checkoutLines.length) throw new CommerceError('STRIPE_TAX_LINES_MISMATCH');
    const seen = new Set(); let lineTax = 0;
    for (const actual of lines) {
      const expected = base.checkoutLines.find(line => line.reference === actual.reference);
      if (!expected || seen.has(actual.reference) || actual.object !== 'tax.calculation_line_item' || actual.livemode !== false || actual.amount !== expected.unitAmountMinor * expected.quantity || actual.quantity !== expected.quantity || actual.tax_behavior !== 'exclusive' || actual.tax_code !== expected.taxCode) throw new CommerceError('STRIPE_TAX_LINES_MISMATCH');
      seen.add(actual.reference); lineTax += minor(actual.amount_tax);
    }
    if (lineTax + minor(calculation.shipping_cost.amount_tax) !== taxMinor) throw new CommerceError('STRIPE_TAX_QUOTE_MISMATCH');
    return { taxMinor, totalMinor };
  }

  async calculateTax(source) {
    const base = baseOrder(source);
    if (!this.#tax.allowedCountries.includes(base.recipient.country_code)) throw new CommerceError('STRIPE_COUNTRY_NOT_CONFIGURED');
    await this.#assertTaxReady();
    const calculation = await this.#call('calculate_tax', () => this.#stripe.tax.calculations.create({
      currency: base.currency.toLowerCase(),
      customer_details: { address: addressOf(base.recipient), address_source: 'shipping' },
      line_items: base.checkoutLines.map(line => ({ amount: line.unitAmountMinor * line.quantity, quantity: line.quantity, reference: line.reference, tax_code: line.taxCode, tax_behavior: 'exclusive' })),
      shipping_cost: { amount: base.shippingMinor, tax_code: base.shippingTaxCode, tax_behavior: 'exclusive' }, expand: ['line_items']
    }, { idempotencyKey: 'ua-tax-v1-' + sha256({ base, policy: this.#tax.policyRevision }) }));
    const values = await this.#matchCalculation(calculation, base), taxQuoteCreatedAt = this.#seconds();
    const fields = { taxCalculationId: stripeId(calculation.id, 'taxcalc_'), taxQuoteCreatedAt, taxQuoteExpiresAt: Math.min(calculation.expires_at, taxQuoteCreatedAt + QUOTE_LIFETIME), taxPolicyRevision: this.#tax.policyRevision, subtotalMinor: base.subtotalMinor, shippingMinor: base.shippingMinor, ...values };
    const quoteHash = sha256({ ...base, taxMinor: fields.taxMinor, totalMinor: fields.totalMinor, taxCalculationId: fields.taxCalculationId, taxPolicyRevision: fields.taxPolicyRevision, taxQuoteCreatedAt: fields.taxQuoteCreatedAt, taxQuoteExpiresAt: fields.taxQuoteExpiresAt });
    return Object.freeze({ ...fields, quoteHash });
  }

  #matchSession(session, order, expectedId) {
    if (session?.object !== 'checkout.session' || session.id !== expectedId || session.livemode !== false || session.mode !== 'payment' || session.ui_mode !== 'hosted_page' || session.client_reference_id !== order.id || !metadataMatches(session.metadata, metadata(order)) || session.currency !== order.currency.toLowerCase() || session.amount_subtotal !== order.subtotalMinor || session.automatic_tax?.enabled !== true || session.success_url !== STRIPE_RETURN_URLS.success || session.cancel_url !== STRIPE_RETURN_URLS.cancel) throw new CommerceError('STRIPE_SESSION_MISMATCH');
  }

  async resumeCheckout(source) {
    const order = this.#order(source), id = stripeId(source.stripeCheckoutSessionId, 'cs_test_');
    const session = await this.#call('retrieve_checkout', () => this.#stripe.checkout.sessions.retrieve(id));
    this.#matchSession(session, order, id);
    if (session.status !== 'open' || session.payment_status !== 'unpaid' || !Number.isSafeInteger(session.expires_at) || session.expires_at <= this.#seconds()) throw new CommerceError('STRIPE_CHECKOUT_NOT_OPEN');
    return { id, url: checkoutUrl(session.url) };
  }

  async recoverOrderReference(sessionId, loadOrder) {
    const id = stripeId(sessionId, 'cs_test_');
    if (typeof loadOrder !== 'function') throw new CommerceError('STRIPE_ORDER_LOADER_REQUIRED');
    const session = await this.#call('recover_checkout', () => this.#stripe.checkout.sessions.retrieve(id));
    const orderId = boundedText(session?.metadata?.ua_order, 120);
    if (!/^[a-f0-9]{64}$/.test(session?.metadata?.ua_quote || '')) throw new CommerceError('STRIPE_SESSION_MISMATCH');
    let source;
    try { source = await loadOrder(orderId); }
    catch { throw new CommerceError('STRIPE_ORDER_RECOVERY_UNAVAILABLE', { retryable: true }); }
    if (!source || source.id !== orderId) throw new CommerceError('STRIPE_ORDER_MAPPING_NOT_READY', { retryable: true });
    if (source.stripeCheckoutSessionId && source.stripeCheckoutSessionId !== id) throw new CommerceError('STRIPE_SESSION_MAPPING_CONFLICT');
    const order = this.#order(source);
    this.#matchSession(session, order, id);
    // This existing Session may have completed after the creation window closed.
    // Recovery only restores its conditional DB mapping; it is not payment proof.
    return Object.freeze({ orderId: order.id, quoteHash: order.quoteHash, sessionId: id });
  }

  async createCheckout(source) {
    if (source?.stripeCheckoutSessionId) return this.resumeCheckout(source);
    const order = this.#order(source), now = this.#seconds();
    if (now < order.taxQuoteCreatedAt - 5 || now >= order.taxQuoteExpiresAt) throw new CommerceError('STRIPE_QUOTE_EXPIRED');
    await this.#assertTaxReady();
    const calculation = await this.#call('retrieve_tax', () => this.#stripe.tax.calculations.retrieve(order.taxCalculationId, { expand: ['line_items'] }));
    if (calculation?.id !== order.taxCalculationId || !same(await this.#matchCalculation(calculation, order), { taxMinor: order.taxMinor, totalMinor: order.totalMinor })) throw new CommerceError('STRIPE_TAX_QUOTE_MISMATCH');
    if (this.#seconds() >= order.taxQuoteExpiresAt) throw new CommerceError('STRIPE_QUOTE_EXPIRED');
    const session = await this.#call('create_checkout', () => this.#stripe.checkout.sessions.create({
      mode: 'payment', ui_mode: 'hosted_page', currency: order.currency.toLowerCase(), client_reference_id: order.id,
      metadata: metadata(order), payment_intent_data: { metadata: metadata(order), capture_method: 'automatic' },
      automatic_tax: { enabled: true }, adaptive_pricing: { enabled: false }, allow_promotion_codes: false,
      billing_address_collection: 'required', shipping_address_collection: { allowed_countries: [order.recipient.country_code] },
      line_items: order.checkoutLines.map((line, index) => ({ quantity: line.quantity, adjustable_quantity: { enabled: false }, price_data: { currency: order.currency.toLowerCase(), unit_amount: line.unitAmountMinor, tax_behavior: 'exclusive', product_data: { name: line.name, tax_code: line.taxCode, metadata: { ...metadata(order), ua_line: String(index), ua_sync_variant: String(line.syncVariantId) } } } })),
      shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: order.shippingMinor, currency: order.currency.toLowerCase() }, display_name: order.shippingId, tax_behavior: 'exclusive', tax_code: order.shippingTaxCode, metadata: { ...metadata(order), ua_shipping: order.shippingId } } }],
      // Stable across retries. Stripe needs >=30 minutes after creation; the quote's
      // <=30-minute creation window plus 31 minutes leaves room at its final second.
      expires_at: order.taxQuoteExpiresAt + 1860, success_url: STRIPE_RETURN_URLS.success, cancel_url: STRIPE_RETURN_URLS.cancel
    }, { idempotencyKey: 'ua-checkout-v1-' + order.quoteHash }), { checkoutMutation: true });
    try {
      const id = stripeId(session?.id, 'cs_test_'); this.#matchSession(session, order, id);
      if (session.status !== 'open' || session.payment_status !== 'unpaid') throw new CommerceError('STRIPE_CHECKOUT_NOT_OPEN');
      return { id, url: checkoutUrl(session.url) };
    } catch { throw new CommerceError('STRIPE_CHECKOUT_CREATE_UNCERTAIN', { ambiguous: true }); }
  }

  async verifyPayment(source) {
    const order = this.#order(source), id = stripeId(source.stripeCheckoutSessionId, 'cs_test_');
    const session = await this.#call('verify_checkout', () => this.#stripe.checkout.sessions.retrieve(id, { expand: ['shipping_cost.shipping_rate'] }));
    this.#matchSession(session, order, id);
    if (session.status !== 'complete' || session.payment_status !== 'paid') throw new CommerceError(session.status === 'expired' ? 'STRIPE_PAYMENT_EXPIRED' : 'STRIPE_PAYMENT_PENDING');
    if (session.amount_subtotal !== order.subtotalMinor || session.amount_total !== order.totalMinor || session.total_details?.amount_tax !== order.taxMinor || session.total_details?.amount_shipping !== order.shippingMinor || session.total_details?.amount_discount !== 0 || session.automatic_tax.status !== 'complete') throw new CommerceError('STRIPE_PAYMENT_MISMATCH');
    const shippingDetails = session.collected_information?.shipping_details;
    if (!shippingDetails || boundedText(shippingDetails.name, 200) !== order.recipient.name || !same(normalizedAddress(shippingDetails.address), addressOf(order.recipient))) throw new CommerceError('STRIPE_ADDRESS_MISMATCH');
    const shipping = session.shipping_cost, rate = shipping?.shipping_rate;
    if (!rate || typeof rate !== 'object' || rate.object !== 'shipping_rate' || rate.livemode !== false || rate.type !== 'fixed_amount' || rate.fixed_amount?.amount !== order.shippingMinor || rate.fixed_amount?.currency !== order.currency.toLowerCase() || rate.tax_behavior !== 'exclusive' || idOf(rate.tax_code) !== order.shippingTaxCode || !metadataMatches(rate.metadata, { ...metadata(order), ua_shipping: order.shippingId }) || shipping.amount_subtotal !== order.shippingMinor || shipping.amount_total !== order.shippingMinor + minor(shipping.amount_tax)) throw new CommerceError('STRIPE_SHIPPING_MISMATCH');
    const first = await this.#call('checkout_lines', () => this.#stripe.checkout.sessions.listLineItems(id, { limit: 100, expand: ['data.price.product'] }));
    const lines = await this.#allPages(first, cursor => this.#call('checkout_lines', () => this.#stripe.checkout.sessions.listLineItems(id, { limit: 100, starting_after: cursor, expand: ['data.price.product'] })));
    if (lines.length !== order.checkoutLines.length) throw new CommerceError('STRIPE_PAYMENT_LINES_MISMATCH');
    const seen = new Set(); let lineTax = 0, lineTotal = 0;
    for (const actual of lines) {
      const product = actual.price?.product, index = Number(product?.metadata?.ua_line), expected = order.checkoutLines[index];
      if (!expected || !Number.isSafeInteger(index) || String(index) !== product?.metadata?.ua_line || String(expected.syncVariantId) !== product?.metadata?.ua_sync_variant || seen.has(index) || actual.object !== 'item' || actual.currency !== order.currency.toLowerCase() || actual.quantity !== expected.quantity || actual.amount_subtotal !== expected.unitAmountMinor * expected.quantity || actual.amount_discount !== 0 || actual.price?.object !== 'price' || actual.price.livemode !== false || actual.price.unit_amount !== expected.unitAmountMinor || actual.price.currency !== order.currency.toLowerCase() || actual.price.tax_behavior !== 'exclusive' || actual.price.type !== 'one_time' || product?.object !== 'product' || product.livemode !== false || product.name !== expected.name || idOf(product.tax_code) !== expected.taxCode || !metadataMatches(product.metadata, metadata(order))) throw new CommerceError('STRIPE_PAYMENT_LINES_MISMATCH');
      seen.add(index); lineTax += minor(actual.amount_tax); lineTotal += minor(actual.amount_total);
      if (actual.amount_total !== actual.amount_subtotal + actual.amount_tax) throw new CommerceError('STRIPE_PAYMENT_LINES_MISMATCH');
    }
    if (lineTax + shipping.amount_tax !== order.taxMinor || lineTotal + shipping.amount_total !== order.totalMinor) throw new CommerceError('STRIPE_PAYMENT_MISMATCH');
    const paymentIntentId = stripeId(idOf(session.payment_intent), 'pi_');
    const paymentIntent = await this.#call('verify_payment_intent', () => this.#stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] }));
    if (paymentIntent?.object !== 'payment_intent' || paymentIntent.id !== paymentIntentId || paymentIntent.livemode !== false || paymentIntent.status !== 'succeeded' || paymentIntent.capture_method !== 'automatic' || paymentIntent.amount !== order.totalMinor || paymentIntent.amount_received !== order.totalMinor || paymentIntent.amount_capturable !== 0 || paymentIntent.currency !== order.currency.toLowerCase() || !metadataMatches(paymentIntent.metadata, metadata(order))) throw new CommerceError('STRIPE_PAYMENT_MISMATCH');
    const charge = paymentIntent.latest_charge;
    if (!charge || typeof charge !== 'object' || charge.object !== 'charge' || charge.livemode !== false || charge.status !== 'succeeded' || charge.paid !== true || charge.captured !== true || charge.amount !== order.totalMinor || charge.amount_captured !== order.totalMinor || charge.currency !== order.currency.toLowerCase() || idOf(charge.payment_intent) !== paymentIntentId) throw new CommerceError('STRIPE_CAPTURE_NOT_VERIFIED', { retryable: true });
    if (charge.refunded !== false || charge.amount_refunded !== 0 || charge.disputed !== false || charge.review || paymentIntent.review) throw new CommerceError('STRIPE_PAYMENT_REFUND_OR_REVIEW');
    const refunds = await this.#call('verify_refunds', () => this.#stripe.refunds.list({ payment_intent: paymentIntentId, limit: 1 }));
    if (refunds?.object !== 'list' || !Array.isArray(refunds.data) || typeof refunds.has_more !== 'boolean') throw new CommerceError('STRIPE_INVALID_REFUND_RESPONSE');
    // Pending or even failed refund histories require operator review before manufacturing.
    if (refunds.has_more || refunds.data.length) throw new CommerceError('STRIPE_PAYMENT_REFUND_OR_REVIEW');
    return Object.freeze({ verified: true, status: 'paid', orderId: order.id, amountMinor: order.totalMinor, currency: order.currency, providerReference: paymentIntentId, stripeCheckoutSessionId: id, testMode: true });
  }

  #validateWebhookInput(rawBody, signature) {
    webhookInput(rawBody, signature, this.#secret);
  }

  #normalizeWebhook(event, signature) {
    return normalizeWebhook(event, signature, this.#seconds());
  }

  verifyWebhook(rawBody, signature) {
    this.#validateWebhookInput(rawBody, signature);
    let event;
    try { event = this.#stripe.webhooks.constructEvent(rawBody, signature, this.#secret, 300, undefined, this.#now()); }
    catch { throw new CommerceError('STRIPE_WEBHOOK_UNAUTHORIZED'); }
    return this.#normalizeWebhook(event, signature);
  }

  async verifyWebhookAsync(rawBody, signature) {
    this.#validateWebhookInput(rawBody, signature);
    let event;
    try {
      const cryptoProvider = this.#webhookCryptoProvider || Stripe.createSubtleCryptoProvider();
      event = await this.#stripe.webhooks.constructEventAsync(rawBody, signature, this.#secret, 300, cryptoProvider, this.#now());
    } catch { throw new CommerceError('STRIPE_WEBHOOK_UNAUTHORIZED'); }
    return this.#normalizeWebhook(event, signature);
  }
}

export function createStripeTestAdapter({ secretKey, webhookSecret, taxConfiguration, now, log }) {
  return new StripeCheckoutAdapter({ stripe: createTestStripeClient(secretKey), webhookSecret, taxConfiguration, now, log });
}

// Worker entry points must await verifyWebhook. The Node factory above retains
// its synchronous contract; both paths share the same raw-body/schema guards.
export function createStripeWorkerTestAdapter({ secretKey, webhookSecret, taxConfiguration, now, log, fetch: fetchImplementation, subtleCrypto = globalThis.crypto?.subtle }) {
  const stripe = createWorkerTestStripeClient(secretKey, { fetch: fetchImplementation });
  if (!subtleCrypto || typeof subtleCrypto.importKey !== 'function' || typeof subtleCrypto.sign !== 'function') throw new CommerceError('STRIPE_WEB_CRYPTO_REQUIRED');
  const adapter = new StripeCheckoutAdapter({ stripe, webhookSecret, taxConfiguration, now, log, webhookCryptoProvider: Stripe.createSubtleCryptoProvider(subtleCrypto) });
  adapter.verifyWebhook = adapter.verifyWebhookAsync.bind(adapter);
  return adapter;
}
