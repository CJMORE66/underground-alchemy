import merchandising from '../dist/shop/catalog.json' with { type: 'json' };
import { LivePrintfulCatalog } from './commerce/live-catalog.js';
import { D1PublicCatalogCache } from './commerce/catalog-cache.js';
import { PrintfulClient, EXPECTED_STORE_ID } from './commerce/printful.js';
import { D1CommerceRepository } from './commerce/d1-repository.js';
import { CheckoutQuoteService, validateQuoteConfiguration } from './commerce/quote-service.js';
import { createStripeWorkerTestAdapter, isStripeTestKey, verifyStripeTestWebhook, STRIPE_API_VERSION } from './commerce/stripe.js';
import { StripeOrderWorkflow } from './commerce/stripe-workflow.js';
import { FulfillmentSyncService } from './commerce/fulfillment-sync.js';
import { CommerceError, shippingRecipient, decimalToMinor } from './commerce/validation.js';
import { commerceSession, requireSameOrigin, boundedRequestJson, boundedRequestBytes } from './commerce/http-security.js';

const STRIPE_ACCOUNT = 'acct_1UWra7PkIIV492Qz';
const WEBHOOK_VERSIONS = new Set([STRIPE_API_VERSION, '2026-09-30.endive']);
const webhookVersion = env => env.STRIPE_WEBHOOK_API_VERSION || STRIPE_API_VERSION;
const hasPrintfulToken = env => typeof env.PRINTFUL_API_TOKEN === 'string' && /^[!-~]{8,4096}$/.test(env.PRINTFUL_API_TOKEN);
const json = (status, body, cookie) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', ...(cookie ? { 'set-cookie': cookie } : {}) } });
const safeError = error => /^[A-Z][A-Z0-9_]{1,100}$/.test(error?.code || '') ? error.code : 'COMMERCE_UNAVAILABLE';
const only = (value, keys) => { if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw new CommerceError('INVALID_INPUT', { status: 400 }); };
const id = value => { if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(value)) throw new CommerceError('INVALID_INPUT', { status: 400 }); return value; };
function configuredPolicy(env) {
  if (!env.COMMERCE_POLICY_JSON) return null;
  try {
    const policy = JSON.parse(env.COMMERCE_POLICY_JSON);
    if (policy.stripeAccountId !== STRIPE_ACCOUNT || policy.mode !== 'test' || policy.printfulStoreId !== EXPECTED_STORE_ID || policy.priceTaxBehavior !== 'exclusive' || !Array.isArray(policy.registrationIds) || !policy.registrationIds.length || policy.registrationIds.length > 5 || new Set(policy.registrationIds).size !== policy.registrationIds.length || policy.registrationIds.some(value => !/^taxreg_[A-Za-z0-9]{4,240}$/.test(value)) || policy.currency !== 'EUR' || policy.currencyExponent !== 2) return null;
    validateQuoteConfiguration(policy);
    return policy;
  } catch { return null; }
}

export function createCommerceWorker({ fetchImplementation = (input, init) => globalThis.fetch(input, init), catalogFactory, repositoryFactory, paymentFactory } = {}) {
  const catalogFor = env => catalogFactory ? catalogFactory(env) : new LivePrintfulCatalog({ token: env.PRINTFUL_API_TOKEN, merchandising, platform: 'api', fetch: fetchImplementation });
  const printfulFor = env => new PrintfulClient({ token: env.PRINTFUL_API_TOKEN, fetch: fetchImplementation });
  const repositoryFor = async env => {
    if (!env.COMMERCE_DB) throw new CommerceError('DATABASE_UNAVAILABLE', { status: 503 });
    const repository = repositoryFactory ? repositoryFactory(env) : new D1CommerceRepository({ db: env.COMMERCE_DB, scope: { stripeAccountId: STRIPE_ACCOUNT, mode: 'test', printfulStoreId: EXPECTED_STORE_ID } });
    await repository.migrate(); return repository;
  };
  const paymentFor = (env, policy) => {
    if (!isStripeTestKey(env.STRIPE_SECRET_KEY) || !/^whsec_[A-Za-z0-9]{8,250}$/.test(env.STRIPE_WEBHOOK_SECRET || '') || !policy) throw new CommerceError('CHECKOUT_UNAVAILABLE', { status: 503 });
    return paymentFactory ? paymentFactory(env, policy) : createStripeWorkerTestAdapter({ secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET, fetch: fetchImplementation, taxConfiguration: { mode: 'stripe_automatic', policyRevision: policy.policyRevision, registrationIds: policy.registrationIds, allowedCountries: policy.allowedCountries } });
  };
  async function limited(repository, ownerId, kind, request, secret) {
    const result = await repository.consumeRateLimit({ key: kind + ':' + ownerId, limit: kind === 'checkout' ? 5 : 20, windowMs: 60000, nowMs: Date.now() });
    if (!result.allowed) throw new CommerceError('RATE_LIMITED', { status: 429 });
    const address = request.headers.get('cf-connecting-ip') || 'unknown';
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret + ':' + address)));
    const addressKey = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
    const network = await repository.consumeRateLimit({ key: kind + ':network:' + addressKey, limit: 100, windowMs: 60000, nowMs: Date.now() });
    if (!network.allowed) throw new CommerceError('RATE_LIMITED', { status: 429 });
  }
  async function shipping(input, catalog, printful) {
    only(input, ['lines', 'recipient']);
    if (!Array.isArray(input.lines) || !input.lines.length || input.lines.length > 50) throw new CommerceError('INVALID_ITEMS', { status: 400 });
    const recipient = shippingRecipient(input.recipient);
    if (!recipient.zip) throw new CommerceError('POSTAL_CODE_REQUIRED', { status: 400 });
    await catalog.verifyStore(); await printful.verifyStore();
    const quantities = new Map(), seen = new Set(); let currency;
    for (const line of input.lines) {
      only(line, ['variantId', 'quantity']); id(line.variantId);
      if (seen.has(line.variantId) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new CommerceError('INVALID_ITEMS', { status: 400 });
      seen.add(line.variantId); const variant = await catalog.getVariant(line.variantId);
      if (!variant || variant.synced !== true || variant.availabilityStatus !== 'active' || !/^[A-Z]{3}$/.test(variant.retailPrice?.currency || '')) throw new CommerceError('VARIANT_UNAVAILABLE', { status: 409 });
      if (currency && currency !== variant.retailPrice.currency) throw new CommerceError('CURRENCY_MISMATCH', { status: 409 });
      currency = variant.retailPrice.currency;
      const quantity = (quantities.get(variant.catalogVariantId) || 0) + line.quantity;
      if (quantity > 100) throw new CommerceError('INVALID_ITEMS', { status: 400 });
      quantities.set(variant.catalogVariantId, quantity);
    }
    // This shop's verified current catalog is EUR; other exponents require explicit configuration.
    if (currency !== 'EUR') throw new CommerceError('CURRENCY_NOT_CONFIGURED', { status: 503 });
    const rates = await printful.shippingRates({ recipient, currency, items: [...quantities].map(([variant_id, quantity]) => ({ variant_id, quantity })) });
    return { status: 'shipping_required', currency, currencyExponent: 2, shippingOptions: rates.map(rate => ({ id: rate.id, name: rate.name, amountMinor: decimalToMinor(rate.rate, 2), currency: rate.currency })) };
  }
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url), path = url.pathname;
      if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);
      try {
        if (path === '/api/commerce/catalog' && request.method === 'GET') {
          const cacheKey = new Request(url.origin + '/api/commerce/catalog', { method: 'GET' });
          let cached;
          try { cached = await globalThis.caches?.default?.match(cacheKey); }
          catch { /* The optional edge cache cannot block a fresh provider read. */ }
          if (cached) return cached;
          const loadCatalog = () => catalogFor(env).getCatalog();
          const publicCache = catalogFactory ? null : new D1PublicCatalogCache({ db: env.COMMERCE_DB });
          const catalog = publicCache ? await publicCache.getCatalog(loadCatalog) : await loadCatalog();
          if (catalog.catalogueVerifiedLive !== true) throw new CommerceError('LIVE_CATALOG_REQUIRED');
          const maxAge = publicCache ? Math.max(0, Math.floor((publicCache.expiresAtMs - Date.now()) / 1000)) : 60;
          const response = json(200, catalog); response.headers.set('cache-control', 'public, max-age=' + maxAge);
          try {
            const cache = globalThis.caches?.default;
            if (cache && typeof ctx?.waitUntil === 'function') {
              // Attach rejection handling before waitUntil: some hosting
              // environments expose unavailable cache APIs or reject writes.
              const write = Promise.resolve(cache.put(cacheKey, response.clone())).catch(() => {});
              ctx.waitUntil(write);
            }
          } catch { /* Cache writes never change the verified catalog response. */ }
          return response;
        }
        if (path === '/api/commerce/status' && request.method === 'GET') {
          const session = await commerceSession(request, env.COMMERCE_SESSION_SECRET, { create: true });
          let databaseReady = false; try { await repositoryFor(env); databaseReady = true; } catch { /* Missing migration never enables checkout. */ }
          const policy = configuredPolicy(env);
          const available = databaseReady && hasPrintfulToken(env) && isStripeTestKey(env.STRIPE_SECRET_KEY) && /^whsec_[A-Za-z0-9]{8,250}$/.test(env.STRIPE_WEBHOOK_SECRET || '') && WEBHOOK_VERSIONS.has(webhookVersion(env)) && Boolean(policy);
          return json(200, { mode: 'test', catalogAvailable: hasPrintfulToken(env), shippingAvailable: databaseReady && hasPrintfulToken(env), checkoutAvailable: available }, session.cookie);
        }
        if (path === '/api/stripe/webhook') {
          if (request.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });
          if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) return json(415, { error: 'JSON_REQUIRED' });
          const signature = request.headers.get('stripe-signature');
          if (!signature || signature.length > 8192) return json(400, { error: 'WEBHOOK_REJECTED' });
          const raw = await boundedRequestBytes(request, 256 * 1024);
          let verified;
          try { verified = await verifyStripeTestWebhook(raw, signature, { webhookSecret: env.STRIPE_WEBHOOK_SECRET, apiVersion: webhookVersion(env) }); }
          catch { return json(400, { error: 'WEBHOOK_REJECTED' }); }
          if (verified.ignored) return json(200, { received: true, ignored: true });
          const repository = await repositoryFor(env);
          const admitted = await repository.enqueuePaymentEvent({ eventId: verified.id, sessionId: verified.sessionId, type: verified.type, created: verified.created });
          let current = await repository.getPaymentJob(admitted.jobId);
          if (['completed', 'dead_letter'].includes(current?.state)) return json(200, { received: true });
          const policy = configuredPolicy(env);
          if (!isStripeTestKey(env.STRIPE_SECRET_KEY) || !policy || !hasPrintfulToken(env)) return json(503, { received: true, pending: true });
          const stripe = paymentFor(env, policy);
          const printful = printfulFor(env);
          const workflow = new StripeOrderWorkflow({ repository, stripe, printful });
          await printful.verifyStore();
          // Await durable work. A transient result returns503 so Stripe retries;
          // waitUntil alone is never used as the only delivery/recovery mechanism.
          await workflow.processNextPayment({ workerId: 'webhook_' + crypto.randomUUID(), leaseMs: 120000 });
          current = await repository.getPaymentJob(admitted.jobId);
          const pending = !['completed', 'dead_letter'].includes(current?.state);
          return json(pending ? 503 : 200, { received: true, pending });
        }
        if (path.startsWith('/api/commerce/orders/') && request.method === 'GET') {
          const session = await commerceSession(request, env.COMMERCE_SESSION_SECRET), repository = await repositoryFor(env);
          const suffix = path.slice('/api/commerce/orders/'.length);
          let order;
          if (suffix.startsWith('by-session/')) {
            const sessionId = suffix.slice('by-session/'.length);
            if (!/^cs_test_[A-Za-z0-9]{4,240}$/.test(sessionId)) return json(400, { error: 'INVALID_INPUT' });
            order = await repository.getOrderByStripeSession(sessionId);
          } else order = await repository.getOrder(id(suffix));
          if (!order || order.ownerId !== session.ownerId) return json(404, { error: 'ORDER_NOT_FOUND' });
          const draft = await repository.getDraft(order.id);
          const states = { reserved: 'draft_reserved', created: 'draft_created', uncertain: 'draft_uncertain', failed: 'draft_failed' };
          const observed = {};
          if (draft?.state === 'created' && typeof repository.getFulfillmentProjection === 'function') {
            let record = await repository.getFulfillmentProjection(order.id, { ownerId: session.ownerId });
            let sync = 'cached';
            if (!record || Date.now() - record.observedAt > 60000) {
              try {
                await limited(repository, session.ownerId, 'fulfillment', request, env.COMMERCE_SESSION_SECRET);
                record = await new FulfillmentSyncService({ repository, printful: printfulFor(env) }).refreshOrder(order.id, { ownerId: session.ownerId });
                sync = 'fresh';
              } catch { sync = record ? 'stale' : 'unavailable'; }
            }
            Object.assign(observed, { fulfillment: record?.projection || null, fulfillmentCheckedAt: record?.observedAt || null, fulfillmentSync: sync });
          }
          return json(200, { orderId: order.id, status: states[draft?.state] || 'awaiting_payment', currency: order.currency, totalMinor: order.totalMinor, draftId: draft?.printfulId || null, ...observed });
        }
        if (['/api/commerce/shipping', '/api/commerce/quote', '/api/commerce/checkout'].includes(path)) {
          if (request.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });
          requireSameOrigin(request);
          const session = await commerceSession(request, env.COMMERCE_SESSION_SECRET), repository = await repositoryFor(env);
          await limited(repository, session.ownerId, path.endsWith('checkout') ? 'checkout' : 'quote', request, env.COMMERCE_SESSION_SECRET);
          const body = await boundedRequestJson(request);
          if (path.endsWith('/shipping')) return json(200, await shipping(body, catalogFor(env), printfulFor(env)));
          const policy = configuredPolicy(env), stripe = paymentFor(env, policy), printful = printfulFor(env);
          if (path.endsWith('/quote')) {
            const service = new CheckoutQuoteService({ catalog: catalogFor(env), printful, stripe, repository, configuration: policy });
            return json(200, await service.quote(body, { ownerId: session.ownerId }));
          }
          only(body, ['orderId']); const order = await repository.getOrder(id(body.orderId));
          if (!order || order.ownerId !== session.ownerId) return json(404, { error: 'ORDER_NOT_FOUND' });
          await printful.verifyStore();
          return json(200, await new StripeOrderWorkflow({ repository, stripe, printful }).createCheckout(order.id));
        }
        return json(404, { error: 'NOT_FOUND' });
      } catch (error) {
        const status = Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599 ? error.status : error?.code?.startsWith('INVALID_') ? 400 : 503;
        // Log fixed route classes and stack locations only. Error messages may
        // contain provider/customer values and must never enter production logs.
        const route = ['/api/commerce/catalog', '/api/commerce/status', '/api/commerce/shipping', '/api/commerce/quote', '/api/commerce/checkout', '/api/stripe/webhook'].includes(path) ? path : '/api/other';
        const kind = ['TypeError', 'ReferenceError', 'RangeError', 'SyntaxError', 'Error', 'CommerceError'].includes(error?.name) ? error.name : 'Error';
        const frames = typeof error?.stack === 'string' ? error.stack.split('\n').slice(1, 5).map(line => line.match(/(?:index|worker)\.js:\d+:\d+/)?.[0]).filter(Boolean) : [];
        console.error(JSON.stringify({ event: 'commerce_request_failed', route, status, code: safeError(error), kind, frames }));
        // No upstream response body, credential, SQL, address or raw event is logged/returned.
        return json(status, { error: safeError(error) });
      }
    },
  };
}

export default createCommerceWorker();
