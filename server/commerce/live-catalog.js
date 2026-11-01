/* Server/Worker-only read adapter. Create one instance per incoming request; never share its cache. */
import { CommerceError } from './validation.js';
import { EXPECTED_STORE_ID } from './printful.js';

const ORIGIN = 'https://api.printful.com';
const MAX_PRODUCTS = 500, MAX_VARIANTS = 500, MAX_TOTAL_VARIANTS = 5000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024, MAX_CATALOG_BYTES = 8 * 1024 * 1024;
const TRANSIENT = new Set([429, 500, 502, 503, 504]);
const AVAILABILITY = new Set(['active', 'discontinued', 'out_of_stock', 'temporary_out_of_stock']);
const CATEGORIES = new Set(['tees', 'hoodies', 'accessories', 'other']);
const ID = /^[A-Za-z0-9_-]{1,120}$/;
const clone = value => structuredClone(value);
const fail = code => { throw new CommerceError(code); };

function identifier(value) {
  if (typeof value === 'string' && /^[1-9][0-9]{0,15}$/.test(value)) value = Number(value);
  if (!Number.isSafeInteger(value) || value <= 0) fail('PRINTFUL_INVALID_IDENTIFIER');
  return value;
}
function text(value, maximum = 300, required = true) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > maximum || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) fail('PRINTFUL_INVALID_PUBLIC_TEXT');
  const result = value.replace(/\s+/g, ' ').trim();
  if (required && !result) fail('PRINTFUL_INVALID_PUBLIC_TEXT');
  return result;
}
function stableId(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string' || !ID.test(value)) fail('PRINTFUL_MERCHANDISING_INVALID');
  return value;
}
function localImage(value) {
  return typeof value === 'string' && /^\/assets\/catalog\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(value) ? value : null;
}
function previewImage(value) {
  if (typeof value !== 'string' || value.length > 1500) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.host === 'files.cdn.printful.com' && !url.username && !url.password && !url.search && !url.hash && /^\/files\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+_(?:preview|thumbnail)\.(?:png|jpe?g|webp)$/i.test(url.pathname)) return value;
  } catch { /* Only explicit public preview URLs can leave the server. */ }
  return null;
}
function description(value) {
  return text(value, 12000, false).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function historicalPrice(value) {
  if (value == null) return null;
  if (!value || typeof value !== 'object' || !Number.isFinite(value.amount) || value.amount < 0 || typeof value.currency !== 'string' || !/^[A-Z]{3}$/.test(value.currency) || typeof value.checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.checkedAt) || !Number.isFinite(Date.parse(value.checkedAt))) fail('PRINTFUL_MERCHANDISING_INVALID');
  return { amount: value.amount, currency: value.currency, taxInclusive: typeof value.taxInclusive === 'boolean' ? value.taxInclusive : null, checkedAt: value.checkedAt };
}
function retailPrice(variant, checkedAt) {
  const amount = variant.retail_price;
  if (amount == null || amount === '') return null;
  if (typeof amount !== 'string' || !/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,6})?$/.test(amount)) fail('PRINTFUL_INVALID_RETAIL_PRICE');
  let currency = variant.currency;
  if (currency == null || currency === '') currency = null;
  else if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) fail('PRINTFUL_INVALID_RETAIL_CURRENCY');
  return { amount, currency, checkedAt, source: 'printful-sync-variant', checkoutQuote: false };
}
function variantOptions(variant, previous, catalogId) {
  const values = [];
  for (const key of ['color', 'size']) if (variant[key] != null) values.push({ title: key === 'color' ? 'Color' : 'Size', value: text(variant[key], 150) });
  if (!values.length && previous && identifier(previous.printfulCatalogVariantId) === catalogId) {
    if (!Array.isArray(previous.options) || previous.options.length > 8) fail('PRINTFUL_MERCHANDISING_INVALID');
    const seen = new Set();
    for (const option of previous.options) {
      const title = text(option?.title, 100), value = text(option?.value, 150);
      if (seen.has(title)) fail('PRINTFUL_MERCHANDISING_INVALID');
      seen.add(title); values.push({ title, value });
    }
  }
  return values.length ? values : [{ title: 'Variant', value: text(variant.name) }];
}

function merchandisingIndex(source) {
  if (!source || source.version !== 1 || !Array.isArray(source.products) || source.products.length > MAX_PRODUCTS) fail('PRINTFUL_MERCHANDISING_INVALID');
  const products = new Map(), variants = new Map(), publicProducts = new Set(), publicVariants = new Set(), handles = new Set();
  let count = 0;
  for (const product of source.products) {
    if (!product || typeof product !== 'object' || identifier(product.printfulStoreId) !== EXPECTED_STORE_ID || !Array.isArray(product.variants) || product.variants.length > MAX_VARIANTS) fail('PRINTFUL_MERCHANDISING_INVALID');
    const id = identifier(product.printfulSyncProductId), publicId = stableId(product.id ?? product.productId), handle = stableId(product.handle);
    if (!publicId || !handle || products.has(id) || publicProducts.has(publicId) || handles.has(handle) || !CATEGORIES.has(product.category)) fail('PRINTFUL_MERCHANDISING_CONFLICT');
    stableId(product.productId ?? publicId);
    if (product.localImage != null && !localImage(product.localImage)) fail('PRINTFUL_MERCHANDISING_INVALID');
    publicProducts.add(publicId); handles.add(handle); products.set(id, product);
    for (const variant of product.variants) {
      const syncId = identifier(variant?.printfulSyncVariantId), variantId = stableId(variant?.id);
      if (!variantId || variants.has(syncId) || publicVariants.has(variantId)) fail('PRINTFUL_MERCHANDISING_CONFLICT');
      identifier(variant.printfulCatalogVariantId);
      historicalPrice(variant.sourcePrice);
      const legacySku = `PF-${EXPECTED_STORE_ID}-${syncId}`;
      if (variant.sourceSku != null && variant.sourceSku !== legacySku) fail('PRINTFUL_MERCHANDISING_CONFLICT');
      variants.set(syncId, { productId: id, variant }); publicVariants.add(variantId);
      if (++count > MAX_TOTAL_VARIANTS) fail('PRINTFUL_CATALOG_LIMIT');
    }
  }
  return { products, variants };
}

async function boundedEnvelope(response) {
  if (response.status !== 200 || !/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '')) fail('PRINTFUL_INVALID_RESPONSE');
  const reader = response.body?.getReader();
  if (!reader) fail('PRINTFUL_INVALID_RESPONSE');
  const chunks = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > MAX_RESPONSE_BYTES) { await reader.cancel(); fail('PRINTFUL_RESPONSE_TOO_LARGE'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const envelope = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!envelope || envelope.code !== 200 || !Object.hasOwn(envelope, 'result')) fail('PRINTFUL_INVALID_RESPONSE');
    return envelope;
  } catch (error) {
    if (error instanceof CommerceError) throw error;
    fail('PRINTFUL_INVALID_RESPONSE');
  } finally { reader.releaseLock(); }
}

/** One request-scoped instance reads provider values; merchandising supplies identities/presentation only. */
export class LivePrintfulCatalog {
  #token; #fetch; #sleep; #now; #timeout; #retries; #maximumWait; #base; #merchandising;
  #storePromise = null; #catalogPromise = null; #quoteVariants = new Map(); #rateDelay = 0;
  constructor({ token, merchandising, platform = 'api', fetch = globalThis.fetch,
    sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now,
    timeoutMs = 10000, retryLimit = 2, maxRetryWaitMs = 5000 } = {}) {
    if (typeof token !== 'string' || !/^[!-~]{8,4096}$/.test(token)) fail('PRINTFUL_TOKEN_REQUIRED');
    if (!['api', 'ecommerce'].includes(platform)) fail('PRINTFUL_PLATFORM_REQUIRED');
    if (typeof fetch !== 'function' || typeof sleep !== 'function' || typeof now !== 'function') fail('INVALID_ADAPTER');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000 || !Number.isInteger(retryLimit) || retryLimit < 0 || retryLimit > 3 || !Number.isInteger(maxRetryWaitMs) || maxRetryWaitMs < 0 || maxRetryWaitMs > 10000) fail('INVALID_RETRY_POLICY');
    this.#token = token; this.#fetch = fetch; this.#sleep = sleep; this.#now = now;
    this.#timeout = timeoutMs; this.#retries = retryLimit; this.#maximumWait = maxRetryWaitMs;
    this.#base = platform === 'api' ? '/store/products' : '/sync/products';
    this.#merchandising = merchandisingIndex(clone(merchandising));
  }

  #delay(response, attempt) {
    const retry = response.headers.get('retry-after'), reset = response.headers.get('x-ratelimit-reset');
    let delay = 250 * 2 ** attempt;
    if (retry != null) delay = /^\d+(?:\.\d+)?$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - this.#now();
    else if ((response.status === 429 || response.headers.get('x-ratelimit-remaining') === '0') && /^\d+$/.test(reset || '')) delay = Number(reset) * 1000;
    if (!Number.isFinite(delay) || delay > this.#maximumWait) throw new CommerceError('PRINTFUL_RETRY_LATER', { retryable: true, status: response.status });
    return Math.max(0, delay);
  }
  async #get(path) {
    if (!(path === '/stores' || new RegExp('^' + this.#base + '\\?offset=[0-9]{1,4}&limit=100$').test(path) || new RegExp('^' + this.#base + '/[1-9][0-9]{0,15}$').test(path))) fail('PRINTFUL_PATH_REJECTED');
    if (this.#rateDelay) { const delay = this.#rateDelay; this.#rateDelay = 0; await this.#sleep(delay); }
    for (let attempt = 0; ; attempt++) {
      const abort = new AbortController(), timer = setTimeout(() => abort.abort(), this.#timeout);
      try {
        const url = ORIGIN + path;
        const response = await this.#fetch(url, { method: 'GET', redirect: 'error', signal: abort.signal,
          headers: { Authorization: `Bearer ${this.#token}`, 'X-PF-Store-Id': String(EXPECTED_STORE_ID), Accept: 'application/json' } });
        if (response.redirected || (response.url && response.url !== url)) fail('PRINTFUL_REDIRECT_REJECTED');
        if (!response.ok) {
          await response.body?.cancel();
          if (TRANSIENT.has(response.status) && attempt < this.#retries) { clearTimeout(timer); await this.#sleep(this.#delay(response, attempt)); continue; }
          throw new CommerceError([401, 403].includes(response.status) ? 'PRINTFUL_AUTH_FAILED' : 'PRINTFUL_HTTP_ERROR', { status: response.status, retryable: TRANSIENT.has(response.status) });
        }
        const envelope = await boundedEnvelope(response);
        if (response.headers.get('x-ratelimit-remaining') === '0') this.#rateDelay = this.#delay(response, attempt);
        return envelope;
      } catch (error) {
        if (error instanceof CommerceError) throw error;
        if (attempt < this.#retries) { clearTimeout(timer); await this.#sleep(Math.min(this.#maximumWait, 250 * 2 ** attempt)); continue; }
        throw new CommerceError('PRINTFUL_TRANSPORT_ERROR', { retryable: true });
      } finally { clearTimeout(timer); }
    }
  }

  async verifyStore() {
    if (!this.#storePromise) this.#storePromise = (async () => {
      const stores = (await this.#get('/stores')).result;
      if (!Array.isArray(stores) || stores.length > 1000) fail('PRINTFUL_STORE_MISMATCH');
      const seen = new Set(); let expected = 0;
      for (const store of stores) {
        const id = identifier(store?.id);
        if (seen.has(id)) fail('PRINTFUL_STORE_MISMATCH');
        seen.add(id); if (id === EXPECTED_STORE_ID) expected++;
      }
      if (expected !== 1) fail('PRINTFUL_STORE_MISMATCH');
      return { id: EXPECTED_STORE_ID, verified: true };
    })();
    return clone(await this.#storePromise);
  }

  #product(productId, detail, checkedAt, quoteVariants, seenVariants) {
    if (!detail || typeof detail !== 'object' || !detail.sync_product || !Array.isArray(detail.sync_variants) || detail.sync_variants.length > MAX_VARIANTS || identifier(detail.sync_product.id) !== productId) fail('PRINTFUL_INVALID_PRODUCT');
    const raw = detail.sync_product, previous = this.#merchandising.products.get(productId);
    const name = text(raw.name), publicId = stableId(previous?.id ?? previous?.productId, 'pf-' + productId);
    const local = localImage(previous?.localImage) || localImage(previous?.image), images = [], options = new Map(), variants = [], unconfigured = [];
    const addImage = value => { if (value && !images.includes(value) && images.length < 20) images.push(value); };
    addImage(local); addImage(previewImage(raw.thumbnail_url));
    for (const variant of detail.sync_variants) {
      const syncId = identifier(variant?.id);
      if (seenVariants.has(syncId)) fail('PRINTFUL_DUPLICATE_VARIANT');
      seenVariants.add(syncId);
      if (seenVariants.size > MAX_TOTAL_VARIANTS) fail('PRINTFUL_CATALOG_LIMIT');
      if (variant.sync_product_id != null && identifier(variant.sync_product_id) !== productId) fail('PRINTFUL_VARIANT_MAPPING_CONFLICT');
      const retained = this.#merchandising.variants.get(syncId);
      if (retained && retained.productId !== productId) fail('PRINTFUL_VARIANT_MAPPING_CONFLICT');
      if (raw.is_ignored === true || variant.is_ignored === true || variant.variant_id == null) { unconfigured.push(syncId); continue; }
      const catalogId = identifier(variant.variant_id), old = retained?.variant;
      if (old && identifier(old.printfulCatalogVariantId) !== catalogId) fail('PRINTFUL_VARIANT_MAPPING_CONFLICT');
      const sku = text(variant.sku, 200), legacySku = `PF-${EXPECTED_STORE_ID}-${syncId}`;
      if (old?.sku && old.sku !== sku && old.sku !== legacySku) fail('PRINTFUL_VARIANT_MAPPING_CONFLICT');
      const sourceSku = old?.sourceSku ?? (old?.sku && old.sku !== sku ? legacySku : null);
      const values = variantOptions(variant, old, catalogId);
      for (const { title, value } of values) {
        if (!options.has(title)) options.set(title, new Set()); options.get(title).add(value);
      }
      const price = retailPrice(variant, checkedAt), availability = AVAILABILITY.has(variant.availability_status) ? variant.availability_status : 'unknown';
      const id = stableId(old?.id, 'pfv-' + syncId), title = text(old?.title || variant.name);
      const record = { id, sku, title, options: values, printfulSyncVariantId: syncId, printfulCatalogVariantId: catalogId,
        printfulRetailPrice: price, availability: { status: availability, checkedAt, source: 'printful-sync-variant' },
        configurationStatus: variant.synced === true ? 'synced' : variant.synced === false ? 'incomplete' : 'unverified' };
      if (sourceSku != null) record.sourceSku = sourceSku;
      const sourcePrice = historicalPrice(old?.sourcePrice); if (sourcePrice) record.sourcePrice = sourcePrice;
      if (quoteVariants.has(id)) fail('PRINTFUL_MERCHANDISING_CONFLICT');
      quoteVariants.set(id, { id, productId: publicId, name: text(previous?.displayName || name), title, storeId: EXPECTED_STORE_ID,
        syncVariantId: syncId, catalogVariantId: catalogId, retailPrice: price ? { amount: price.amount, currency: price.currency } : null,
        availabilityStatus: availability, synced: variant.synced === true });
      variants.push(record);
      if (Array.isArray(variant.files)) for (const file of variant.files.slice(0, 30)) if (file?.type === 'preview') addImage(previewImage(file.preview_url) || previewImage(file.thumbnail_url));
    }
    // The current storefront requires every variant to define all displayed
    // option axes (and caps each axis at 100 values). Reject inconsistent data
    // instead of returning a live catalog whose variants it would silently drop.
    if (options.size > 8 || [...options.values()].some(values => values.size > 100) || variants.some(variant => [...options.keys()].some(title => !variant.options.some(option => option.title === title)))) fail('PRINTFUL_INCONSISTENT_OPTIONS');
    if (!images.length) fail('PRINTFUL_PUBLIC_PREVIEW_REQUIRED');
    const handle = stableId(previous?.handle, `printful-${EXPECTED_STORE_ID}-${productId}`);
    const result = { id: publicId, productId: stableId(previous?.productId, publicId), handle, name, originalName: name,
      displayName: text(previous?.displayName || name), category: previous?.category || 'other',
      description: description(raw.description || previous?.description), localImage: local, image: images[0], images,
      options: [...options].map(([title, values]) => ({ title, values: [...values] })), variants,
      printfulSyncProductId: productId, printfulStoreId: String(EXPECTED_STORE_ID), printfulCheckedAt: checkedAt, unconfiguredVariantIds: unconfigured };
    const sourceUrl = 'https://hiphop.caisik.i234.me/dk/products/' + handle;
    if (/^prod_[A-Za-z0-9]+$/.test(result.productId) && /^printful-18912189-[0-9]+$/.test(handle) && previous?.sourceUrl === sourceUrl) result.sourceUrl = sourceUrl;
    return result;
  }

  async #loadCatalog() {
    await this.verifyStore();
    const time = this.#now();
    if (!Number.isSafeInteger(time) || time <= 0) fail('PRINTFUL_INVALID_CLOCK');
    const checkedAt = new Date(time).toISOString(), products = [], quoteVariants = new Map(), seenVariants = new Set();
    const seenProducts = new Set(), publicProducts = new Set(), handles = new Set();
    let offset = 0, total = null;
    for (let page = 0; page < 10; page++) {
      const envelope = await this.#get(`${this.#base}?offset=${offset}&limit=100`), paging = envelope.paging, items = envelope.result;
      if (!paging || !Array.isArray(items) || !Number.isInteger(paging.total) || paging.total < 0 || paging.total > MAX_PRODUCTS || paging.offset !== offset || !Number.isInteger(paging.limit) || paging.limit < 1 || paging.limit > 100 || items.length > paging.limit || (total != null && paging.total !== total) || offset + items.length > paging.total || (!items.length && offset !== paging.total)) fail('PRINTFUL_INVALID_PAGINATION');
      total = paging.total;
      for (const item of items) {
        const id = identifier(item?.id);
        if (seenProducts.has(id)) fail('PRINTFUL_DUPLICATE_PRODUCT');
        seenProducts.add(id);
        const product = this.#product(id, (await this.#get(`${this.#base}/${id}`)).result, checkedAt, quoteVariants, seenVariants);
        if (publicProducts.has(product.id) || handles.has(product.handle)) fail('PRINTFUL_MERCHANDISING_CONFLICT');
        publicProducts.add(product.id); handles.add(product.handle); products.push(product);
      }
      offset += items.length;
      if (offset === total) {
        const oldVariants = new Set(this.#merchandising.variants.keys());
        const catalog = { version: 1, checkedAt, mode: 'printful-live', catalogueVerifiedLive: true,
          checkout: { enabled: false, url: null, verifiedAt: null }, products,
          sync: { mode: 'full', completeStoreScan: true, refreshedProductIds: [...seenProducts],
            removedProductIds: [...this.#merchandising.products.keys()].filter(id => !seenProducts.has(id)),
            removedVariantIds: [...oldVariants].filter(id => !seenVariants.has(id)),
            unavailableVariantIds: products.flatMap(p => [...p.unconfiguredVariantIds, ...p.variants.filter(v => AVAILABILITY.has(v.availability.status) && v.availability.status !== 'active').map(v => v.printfulSyncVariantId)]) } };
        const serialized = JSON.stringify(catalog);
        if (new TextEncoder().encode(serialized).byteLength > MAX_CATALOG_BYTES || serialized.includes(this.#token)) fail('PRINTFUL_PUBLIC_EXPORT_REJECTED');
        this.#quoteVariants = quoteVariants;
        return catalog;
      }
    }
    fail('PRINTFUL_PAGINATION_LIMIT');
  }

  async getCatalog() {
    if (!this.#catalogPromise) this.#catalogPromise = this.#loadCatalog();
    return clone(await this.#catalogPromise);
  }
  async getVariant(internalId) {
    if (typeof internalId !== 'string' || !ID.test(internalId)) fail('PRINTFUL_VARIANT_NOT_FOUND');
    await this.getCatalog();
    const variant = this.#quoteVariants.get(internalId);
    if (!variant) fail('PRINTFUL_VARIANT_NOT_FOUND');
    return clone(variant);
  }
}
