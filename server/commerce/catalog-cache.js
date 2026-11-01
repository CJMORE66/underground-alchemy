import { CommerceError } from './validation.js';
import { EXPECTED_STORE_ID } from './printful.js';

const TABLE = 'commerce_d1_public_catalog_cache', MAX_BYTES = 1024 * 1024;
const keys = (value, allowed) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
};
const array = (value, limit) => { if (!Array.isArray(value) || value.length > limit) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA'); return value; };
const text = (value, maximum = 12000) => { if (typeof value !== 'string' || value.length > maximum || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA'); };
const date = value => { text(value, 80); if (!Number.isFinite(Date.parse(value))) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA'); };
const positive = value => { if (!Number.isSafeInteger(value) || value <= 0) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA'); };
const image = value => {
  text(value, 1500);
  if (/^\/assets\/catalog\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(value)) return;
  try { const url = new URL(value); if (url.protocol === 'https:' && url.host === 'files.cdn.printful.com' && !url.username && !url.password && !url.search && !url.hash && /^\/files\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+_(?:preview|thumbnail)\.(?:png|jpe?g|webp)$/i.test(url.pathname)) return; } catch { /* Only sanitized public previews can be shared. */ }
  throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
};
const publicCatalog = (source, storeId) => {
  keys(source, ['version', 'checkedAt', 'mode', 'catalogueVerifiedLive', 'checkout', 'products', 'sync']);
  if (source.version !== 1 || source.mode !== 'printful-live' || source.catalogueVerifiedLive !== true) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
  date(source.checkedAt);
  keys(source.checkout, ['enabled', 'url', 'verifiedAt']);
  if (source.checkout.enabled !== false || source.checkout.url !== null || source.checkout.verifiedAt !== null) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
  keys(source.sync, ['mode', 'completeStoreScan', 'refreshedProductIds', 'removedProductIds', 'removedVariantIds', 'unavailableVariantIds']);
  if (source.sync.mode !== 'full' || source.sync.completeStoreScan !== true) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
  for (const name of ['refreshedProductIds', 'removedProductIds', 'removedVariantIds', 'unavailableVariantIds']) if (array(source.sync[name], 5000).some(id => !Number.isSafeInteger(id) || id <= 0)) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
  let variantCount = 0;
  for (const product of array(source.products, 500)) {
    keys(product, ['id', 'productId', 'handle', 'name', 'originalName', 'displayName', 'category', 'description', 'localImage', 'image', 'images', 'options', 'variants', 'printfulSyncProductId', 'printfulStoreId', 'printfulCheckedAt', 'unconfiguredVariantIds', 'sourceUrl']);
    if (String(product.printfulStoreId) !== String(storeId) || !Number.isSafeInteger(product.printfulSyncProductId) || product.printfulSyncProductId <= 0) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
    if (!['string', 'number'].includes(typeof product.printfulStoreId)) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
    for (const name of ['id', 'productId', 'handle', 'name', 'originalName', 'displayName', 'category', 'description']) text(product[name]);
    date(product.printfulCheckedAt); image(product.image); if (product.localImage !== null) image(product.localImage);
    for (const value of array(product.images, 20)) image(value);
    for (const value of array(product.unconfiguredVariantIds, 500)) positive(value);
    if (product.sourceUrl !== undefined) { text(product.sourceUrl, 500); if (!/^https:\/\/hiphop\.caisik\.i234\.me\/dk\/products\/[A-Za-z0-9_-]+$/.test(product.sourceUrl)) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA'); }
    for (const option of array(product.options, 8)) { keys(option, ['title', 'values']); text(option.title, 100); for (const value of array(option.values, 100)) text(value, 150); }
    for (const variant of array(product.variants, 500)) {
      if (++variantCount > 5000) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
      keys(variant, ['id', 'sku', 'title', 'options', 'printfulSyncVariantId', 'printfulCatalogVariantId', 'printfulRetailPrice', 'availability', 'configurationStatus', 'sourceSku', 'sourcePrice']);
      for (const name of ['id', 'sku', 'title']) text(variant[name], 300);
      if (variant.sourceSku !== undefined) text(variant.sourceSku, 200);
      positive(variant.printfulSyncVariantId); positive(variant.printfulCatalogVariantId);
      if (!['synced', 'incomplete', 'unverified'].includes(variant.configurationStatus)) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
      for (const option of array(variant.options, 8)) { keys(option, ['title', 'value']); text(option.title, 100); text(option.value, 150); }
      keys(variant.availability, ['status', 'checkedAt', 'source']);
      if (!['active', 'discontinued', 'out_of_stock', 'temporary_out_of_stock', 'unknown'].includes(variant.availability.status) || variant.availability.source !== 'printful-sync-variant') throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
      date(variant.availability.checkedAt);
      if (variant.printfulRetailPrice != null) {
        const price = variant.printfulRetailPrice; keys(price, ['amount', 'currency', 'checkedAt', 'source', 'checkoutQuote']);
        text(price.amount, 30); if (!/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,6})?$/.test(price.amount) || (price.currency !== null && (typeof price.currency !== 'string' || !/^[A-Z]{3}$/.test(price.currency))) || price.source !== 'printful-sync-variant' || price.checkoutQuote !== false) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
        date(price.checkedAt);
      }
      if (variant.sourcePrice != null) {
        const price = variant.sourcePrice; keys(price, ['amount', 'currency', 'taxInclusive', 'checkedAt']);
        if (typeof price.amount !== 'number' || !Number.isFinite(price.amount) || price.amount < 0 || typeof price.currency !== 'string' || !/^[A-Z]{3}$/.test(price.currency) || ![true, false, null].includes(price.taxInclusive)) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA'); date(price.checkedAt);
      }
    }
  }
  const serialized = JSON.stringify(source);
  if (new TextEncoder().encode(serialized).byteLength > MAX_BYTES || /(?:\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{8,}|\bwhsec_[A-Za-z0-9]{8,})/.test(serialized)) throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
  return { serialized, value: JSON.parse(serialized) };
};

/** Public presentation only. Financial quotes never read this table. Deployment
 * applies the schema; absent storage fails closed without upstream amplification.
 * A fenced lease permits one live fill across Worker instances. */
export class D1PublicCatalogCache {
  #db; #store; #now; #sleep; #uuid; #ttl; #lease; #wait; #poll; #expiresAt = 0;
  get expiresAtMs() { return this.#expiresAt; }
  constructor({ db, storeId = EXPECTED_STORE_ID, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), uuid = () => crypto.randomUUID(), ttlMs = 60000, leaseMs = 30000, waitMs = 1500, pollMs = 100 } = {}) {
    if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function' || storeId !== EXPECTED_STORE_ID || [now, sleep, uuid].some(value => typeof value !== 'function') || !Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > 60000 || !Number.isSafeInteger(leaseMs) || leaseMs < 1 || leaseMs > 120000 || !Number.isSafeInteger(waitMs) || waitMs < 0 || waitMs > 5000 || !Number.isSafeInteger(pollMs) || pollMs < 1 || pollMs > 1000) throw new CommerceError('CATALOG_CACHE_CONFIGURATION_REQUIRED');
    this.#db = db; this.#store = storeId; this.#now = now; this.#sleep = sleep; this.#uuid = uuid; this.#ttl = ttlMs; this.#lease = leaseMs; this.#wait = waitMs; this.#poll = pollMs;
  }
  #time() { const value = this.#now(); if (!Number.isSafeInteger(value) || value <= 0) throw new CommerceError('CATALOG_CACHE_CONFIGURATION_REQUIRED'); return value; }
  #session() { return typeof this.#db.withSession === 'function' ? this.#db.withSession('first-primary') : this.#db; }
  async #first() {
    try { return await this.#session().prepare(`SELECT * FROM ${TABLE} WHERE store_id = ?`).bind(this.#store).first(); }
    catch { throw new CommerceError('CATALOG_CACHE_UNAVAILABLE', { status: 503, retryable: true }); }
  }
  async #batch(statements) {
    try {
      const db = this.#session(), result = await db.batch(statements.map(([sql, ...bindings]) => db.prepare(sql).bind(...bindings)));
      if (!Array.isArray(result) || result.length !== statements.length || result.some(item => item.success !== true)) throw new Error('invalid D1 response');
      return result;
    } catch { throw new CommerceError('CATALOG_CACHE_UNAVAILABLE', { status: 503, retryable: true }); }
  }
  #fresh(row, now) {
    if (!row || row.expires_at_ms <= now) return null;
    if (row.store_id !== this.#store || !Number.isSafeInteger(row.verified_at_ms) || row.verified_at_ms <= 0 || row.verified_at_ms > now || !Number.isSafeInteger(row.expires_at_ms) || row.expires_at_ms - row.verified_at_ms > this.#ttl || typeof row.payload_json !== 'string') throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA');
    try { const catalog = publicCatalog(JSON.parse(row.payload_json), this.#store).value; this.#expiresAt = row.expires_at_ms; return catalog; }
    catch { throw new CommerceError('CATALOG_CACHE_INVALID_PUBLIC_DATA'); }
  }
  async #fill(load, token) {
    let lost = false, renewal = Promise.resolve(), renewing = false;
    const timer = setInterval(() => {
      if (renewing || lost) return; renewing = true;
      const now = this.#time();
      renewal = this.#batch([[`UPDATE ${TABLE} SET lease_expires_at_ms = ?, updated_at_ms = ? WHERE store_id = ? AND lease_token = ? AND lease_expires_at_ms > ?`, now + this.#lease, now, this.#store, token, now]])
        .then(result => { if (result[0].meta?.changes !== 1) lost = true; }).catch(() => { lost = true; }).finally(() => { renewing = false; });
    }, Math.max(1, Math.floor(this.#lease / 3)));
    try {
      const catalog = publicCatalog(await load(), this.#store);
      clearInterval(timer); await renewal;
      if (lost) throw new CommerceError('CATALOG_CACHE_LEASE_LOST', { status: 503, retryable: true });
      const now = this.#time();
      const result = await this.#batch([[`UPDATE ${TABLE} SET payload_json = ?, verified_at_ms = ?, expires_at_ms = ?, lease_token = NULL, lease_expires_at_ms = 0, updated_at_ms = ? WHERE store_id = ? AND lease_token = ? AND lease_expires_at_ms > ?`, catalog.serialized, now, now + this.#ttl, now, this.#store, token, now]]);
      if (result[0].meta?.changes !== 1) throw new CommerceError('CATALOG_CACHE_LEASE_LOST', { status: 503, retryable: true });
      this.#expiresAt = now + this.#ttl; return catalog.value;
    } finally {
      clearInterval(timer); await renewal;
      try { await this.#batch([[`UPDATE ${TABLE} SET lease_token = NULL, lease_expires_at_ms = 0 WHERE store_id = ? AND lease_token = ?`, this.#store, token]]); } catch { /* Lease expiry provides crash recovery. */ }
    }
  }
  async getCatalog(load) {
    if (typeof load !== 'function') throw new CommerceError('CATALOG_CACHE_CONFIGURATION_REQUIRED');
    const token = this.#uuid();
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(token)) throw new CommerceError('CATALOG_CACHE_CONFIGURATION_REQUIRED');
    const polls = Math.ceil(this.#wait / this.#poll);
    for (let attempt = 0; attempt <= polls; attempt++) {
      const now = this.#time(), fresh = this.#fresh(await this.#first(), now); if (fresh) return fresh;
      const result = await this.#batch([
        [`INSERT INTO ${TABLE}(store_id, lease_token, lease_expires_at_ms, updated_at_ms) VALUES (?, ?, ?, ?) ON CONFLICT(store_id) DO UPDATE SET lease_token = excluded.lease_token, lease_expires_at_ms = excluded.lease_expires_at_ms, updated_at_ms = excluded.updated_at_ms WHERE ${TABLE}.lease_expires_at_ms <= ? AND ${TABLE}.expires_at_ms <= ?`, this.#store, token, now + this.#lease, now, now, now],
        [`SELECT * FROM ${TABLE} WHERE store_id = ?`, this.#store],
      ]);
      const row = result[1].results?.[0], raced = this.#fresh(row, this.#time()); if (raced) return raced;
      if (result[0].meta?.changes === 1 && row?.lease_token === token) return this.#fill(load, token);
      if (attempt < polls) await this.#sleep(Math.min(this.#poll, this.#wait - attempt * this.#poll));
    }
    throw new CommerceError('CATALOG_REFRESH_PENDING', { status: 503, retryable: true });
  }
}
