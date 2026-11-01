/* Fixture-only HTTP tests; no real Printful account, token, products or orders are requested. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LivePrintfulCatalog } from '../server/commerce/live-catalog.js';

const TOKEN = 'FIXTURE_ONLY_NOT_A_REAL_TOKEN';
const STORE = 18912189;
const IMAGE = 'https://files.cdn.printful.com/files/fixture/fixture_preview.png';
const LOCAL = '/assets/catalog/fixture-design.png';
const CHECKED = '2026-11-01T10:00:00.000Z';
const historical = { amount: 26.65, currency: 'EUR', taxInclusive: false, checkedAt: '2026-10-16T04:52:09.112019+00:00' };
const clone = value => structuredClone(value);
const response = (result, paging, headers = {}) => new Response(JSON.stringify({ code: 200, result, ...(paging ? { paging } : {}) }), { headers: { 'content-type': 'application/json', ...headers } });

function merchandising() {
  return { version: 1, products: [{ id: 'prod_fixture', productId: 'prod_fixture', handle: 'printful-18912189-101',
    name: 'Historical fixture name', displayName: 'Reviewed fixture name', category: 'tees', localImage: LOCAL,
    sourceUrl: 'https://hiphop.caisik.i234.me/dk/products/printful-18912189-101', printfulStoreId: String(STORE), printfulSyncProductId: 101,
    variants: [{ id: 'variant_fixture', sku: 'PF-18912189-1001', title: 'Reviewed Navy / 3XL',
      sourcePrice: clone(historical), printfulSyncVariantId: 1001, printfulCatalogVariantId: 2001,
      options: [{ title: 'Color', value: 'Navy' }, { title: 'Size', value: '3XL' }] }] }] };
}
function details(productId = 101, syncId = 1001) {
  return { sync_product: { id: productId, name: 'Provider fixture name', thumbnail_url: IMAGE,
    description: '<p>Public fixture description</p><script>privateScript()</script>', private_metadata: TOKEN },
    sync_variants: [{ id: syncId, sync_product_id: productId, variant_id: 2001, synced: true, is_ignored: false,
      sku: '6AD_FIXTURE_SKU', name: 'Navy / 3XL', color: 'Navy', size: '3XL', retail_price: '39.90', currency: 'EUR',
      availability_status: 'active', manufacturing_cost: '1.00', private_metadata: TOKEN,
      files: [{ type: 'front', url: 'https://private.example.test/print-original.png', preview_url: 'https://files.cdn.printful.com/files/fixture/front_preview.png' },
        { type: 'preview', preview_url: IMAGE, url: 'https://private.example.test/original.png' }] }] };
}
const sevenStores = () => [...Array.from({ length: 6 }, (_, index) => ({ id: index + 1 })), { id: STORE }];

function fixture({ merch = merchandising(), route, platform = 'api', retryLimit = 2, timeoutMs = 1000 } = {}) {
  const calls = [], delays = [], detail = details();
  const base = platform === 'api' ? '/store/products' : '/sync/products';
  const fetch = async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://api.printful.com'); assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer ' + TOKEN); assert.equal(options.headers['X-PF-Store-Id'], String(STORE));
    assert(options.signal instanceof AbortSignal); calls.push(parsed.pathname + parsed.search);
    if (route) { const found = await route(parsed, options, calls); if (found) return found; }
    if (parsed.pathname === '/stores') return response(sevenStores());
    if (parsed.pathname === base) return response([{ id: 101 }], { total: 1, offset: 0, limit: 100 });
    if (parsed.pathname === base + '/101') return response(detail);
    throw new Error('Unexpected fixture endpoint');
  };
  const catalog = new LivePrintfulCatalog({ token: TOKEN, merchandising: merch, platform, fetch,
    now: () => Date.parse(CHECKED), sleep: async ms => { delays.push(ms); }, retryLimit, timeoutMs });
  return { catalog, calls, delays, detail, fetch };
}

test('canonical expected store is verified exactly once among seven account stores', async () => {
  const f = fixture(); const proof = await f.catalog.verifyStore(); proof.id = 1;
  assert.deepEqual(await f.catalog.verifyStore(), { id: STORE, verified: true });
  assert.deepEqual(f.calls, ['/stores']);
});

test('store mismatch and canonical duplicate store IDs fail before any catalog read', async () => {
  for (const stores of [[{ id: 1 }], [{ id: STORE }, { id: String(STORE) }], [{ id: STORE }, { id: 1 }, { id: 1 }]]) {
    const f = fixture({ route: url => url.pathname === '/stores' ? response(stores) : null });
    await assert.rejects(f.catalog.getCatalog(), { code: 'PRINTFUL_STORE_MISMATCH' }); assert.deepEqual(f.calls, ['/stores']);
  }
});

test('public export retains reviewed IDs, merchandising, local image, dated price and exact legacy SKU alias', async () => {
  const f = fixture(), result = await f.catalog.getCatalog(), product = result.products[0], variant = product.variants[0];
  assert.equal(result.version, 1); assert.equal(result.catalogueVerifiedLive, true); assert.equal(result.checkedAt, CHECKED); assert.equal(result.checkout.enabled, false);
  assert.equal(product.id, 'prod_fixture'); assert.equal(product.productId, 'prod_fixture'); assert.equal(product.displayName, 'Reviewed fixture name');
  assert.equal(product.name, 'Provider fixture name'); assert.equal(product.category, 'tees'); assert.equal(product.localImage, LOCAL); assert.equal(product.image, LOCAL);
  assert.equal(product.sourceUrl, merchandising().products[0].sourceUrl); assert.equal(product.description, 'Public fixture description');
  assert.equal(variant.id, 'variant_fixture'); assert.equal(variant.sku, '6AD_FIXTURE_SKU'); assert.equal(variant.sourceSku, 'PF-18912189-1001'); assert.deepEqual(variant.sourcePrice, historical);
  assert.deepEqual(variant.printfulRetailPrice, { amount: '39.90', currency: 'EUR', checkedAt: CHECKED, source: 'printful-sync-variant', checkoutQuote: false });
  const serialized = JSON.stringify(result);
  for (const forbidden of [TOKEN, 'private.example.test', 'front_preview', 'manufacturing_cost', 'private_metadata', 'privateScript']) assert(!serialized.includes(forbidden), forbidden);
});

test('quote interface returns fresh provider selling data and never historical snapshot prices', async () => {
  const f = fixture();
  const variant = await f.catalog.getVariant('variant_fixture');
  assert.deepEqual(variant, { id: 'variant_fixture', productId: 'prod_fixture', name: 'Reviewed fixture name', title: 'Reviewed Navy / 3XL', storeId: STORE,
    syncVariantId: 1001, catalogVariantId: 2001, retailPrice: { amount: '39.90', currency: 'EUR' }, availabilityStatus: 'active', synced: true });
  variant.retailPrice.amount = '0'; const publicCatalog = await f.catalog.getCatalog(); publicCatalog.products[0].id = 'changed';
  assert.equal((await f.catalog.getVariant('variant_fixture')).retailPrice.amount, '39.90');
  assert.equal((await f.catalog.getCatalog()).products[0].id, 'prod_fixture'); assert.equal(f.calls.length, 3);
});

test('cache is instance/request local; a new request fetches changed prices and availability', async () => {
  let price = '39.90';
  const route = url => { if (url.pathname === '/store/products/101') { const value = details(); value.sync_variants[0].retail_price = price; return response(value); } };
  const first = fixture({ route }); await first.catalog.getVariant('variant_fixture'); price = '49.00';
  assert.equal((await first.catalog.getVariant('variant_fixture')).retailPrice.amount, '39.90');
  const second = fixture({ route }); assert.equal((await second.catalog.getVariant('variant_fixture')).retailPrice.amount, '49.00'); assert.equal(second.calls.length, 3);
});

test('missing price/currency/availability/sync flags stay unknown rather than taking snapshot values', async () => {
  const f = fixture(); delete f.detail.sync_variants[0].currency; delete f.detail.sync_variants[0].availability_status; delete f.detail.sync_variants[0].synced;
  const v = await f.catalog.getVariant('variant_fixture'); assert.equal(v.retailPrice.currency, null); assert.equal(v.availabilityStatus, 'unknown'); assert.equal(v.synced, false);
  const g = fixture(); delete g.detail.sync_variants[0].retail_price;
  assert.equal((await g.catalog.getVariant('variant_fixture')).retailPrice, null);
});

test('catalog/SKU drift, foreign product mapping and lowercase legacy aliases are rejected', async () => {
  for (const changed of [{ variant_id: 9999 }, { sync_product_id: 9999 }]) {
    const f = fixture(); Object.assign(f.detail.sync_variants[0], changed);
    await assert.rejects(f.catalog.getCatalog(), { code: 'PRINTFUL_VARIANT_MAPPING_CONFLICT' });
  }
  for (const previousSku of ['ACTUAL_PREVIOUS_SKU', 'pf-18912189-1001']) {
    const merch = merchandising(); merch.products[0].variants[0].sku = previousSku;
    await assert.rejects(fixture({ merch }).catalog.getCatalog(), { code: 'PRINTFUL_VARIANT_MAPPING_CONFLICT' });
  }
  const merch = merchandising(); merch.products[0].variants[0].sourceSku = 'PF-18912189-9999';
  assert.throws(() => fixture({ merch }), { code: 'PRINTFUL_MERCHANDISING_CONFLICT' });
});

test('already migrated real SKU and original alias survive unchanged', async () => {
  const merch = merchandising(); Object.assign(merch.products[0].variants[0], { sku: '6AD_FIXTURE_SKU', sourceSku: 'PF-18912189-1001' });
  const result = await fixture({ merch }).catalog.getCatalog(); assert.equal(result.products[0].variants[0].sourceSku, 'PF-18912189-1001');
});

test('pagination, ecommerce path and newly observed identities are mapped without invented names or prices', async () => {
  const f = fixture({ platform: 'ecommerce', route: url => {
    if (url.pathname === '/sync/products') { const offset = Number(url.searchParams.get('offset')); assert.equal(url.searchParams.get('status'), null); return response([{ id: offset === 0 ? 101 : 102 }], { total: 2, offset, limit: 1 }); }
    if (url.pathname === '/sync/products/102') return response(details(102, 1002));
  } });
  const result = await f.catalog.getCatalog(); assert.equal(result.products.length, 2); assert.equal(result.products[1].id, 'pf-102'); assert.equal(result.products[1].variants[0].id, 'pfv-1002');
  assert.equal(result.products[1].category, 'other'); assert.equal(result.products[1].displayName, 'Provider fixture name');
  assert.equal(result.products[1].variants[0].sourcePrice, undefined); assert(f.calls.includes('/sync/products?offset=1&limit=100'));
});

test('empty full catalog is real empty state and marks retained identities removed', async () => {
  const f = fixture({ route: url => url.pathname === '/store/products' ? response([], { total: 0, offset: 0, limit: 100 }) : null });
  const result = await f.catalog.getCatalog(); assert.deepEqual(result.products, []); assert.deepEqual(result.sync.removedProductIds, [101]); assert.deepEqual(result.sync.removedVariantIds, [1001]);
  await assert.rejects(f.catalog.getVariant('variant_fixture'), { code: 'PRINTFUL_VARIANT_NOT_FOUND' }); assert.equal(f.calls.length, 2);
});

test('incomplete/ignored/removed/unavailable variants are distinguished without an active-stock promise', async () => {
  const f = fixture(); f.detail.sync_variants[0].synced = false; f.detail.sync_variants[0].availability_status = 'out_of_stock';
  f.detail.sync_variants.push({ id: 1002, sync_product_id: 101, variant_id: null, is_ignored: true });
  const result = await f.catalog.getCatalog(); assert.equal(result.products[0].variants[0].configurationStatus, 'incomplete');
  assert.deepEqual(result.products[0].unconfiguredVariantIds, [1002]); assert.deepEqual(result.sync.unavailableVariantIds.sort(), [1001, 1002]);
  assert.equal((await f.catalog.getVariant('variant_fixture')).synced, false); await assert.rejects(f.catalog.getVariant('pfv-1002'), { code: 'PRINTFUL_VARIANT_NOT_FOUND' });
});

test('duplicate product/variant IDs and inconsistent pagination fail atomically', async () => {
  const duplicate = fixture(); duplicate.detail.sync_variants.push(clone(duplicate.detail.sync_variants[0]));
  await assert.rejects(duplicate.catalog.getCatalog(), { code: 'PRINTFUL_DUPLICATE_VARIANT' });
  const products = fixture({ route: url => url.pathname === '/store/products' ? response([{ id: 101 }, { id: 101 }], { total: 2, offset: 0, limit: 100 }) : null });
  await assert.rejects(products.catalog.getCatalog(), { code: 'PRINTFUL_DUPLICATE_PRODUCT' });
  const paging = fixture({ route: url => url.pathname === '/store/products' ? response([], { total: 1, offset: 0, limit: 100 }) : null });
  await assert.rejects(paging.catalog.getCatalog(), { code: 'PRINTFUL_INVALID_PAGINATION' });
});

test('an ignored product cannot expose an apparently active variant to the quote service', async () => {
  const f = fixture(); f.detail.sync_product.is_ignored = true;
  const result = await f.catalog.getCatalog(); assert.deepEqual(result.products[0].variants, []); assert.deepEqual(result.products[0].unconfiguredVariantIds, [1001]);
  await assert.rejects(f.catalog.getVariant('variant_fixture'), { code: 'PRINTFUL_VARIANT_NOT_FOUND' });
});

test('inconsistent option axes fail instead of silently losing variants in the existing storefront', async () => {
  const f = fixture(); const second = clone(f.detail.sync_variants[0]); second.id = 1002; second.sku = 'FIXTURE_SECOND_SKU'; delete second.color;
  f.detail.sync_variants.push(second);
  await assert.rejects(f.catalog.getCatalog(), { code: 'PRINTFUL_INCONSISTENT_OPTIONS' });
});

test('only safe preview images/local paths are public; new product without a safe preview fails', async () => {
  const f = fixture(); f.detail.sync_product.thumbnail_url = IMAGE + '?private=' + TOKEN;
  f.detail.sync_variants[0].files.push({ type: 'preview', preview_url: 'https://evil.example.test/preview.png' });
  assert.deepEqual((await f.catalog.getCatalog()).products[0].images, [LOCAL, IMAGE]);
  const empty = fixture({ merch: { version: 1, products: [] } }); empty.detail.sync_product.thumbnail_url = 'https://evil.example.test/preview.png'; empty.detail.sync_variants[0].files = [];
  await assert.rejects(empty.catalog.getCatalog(), { code: 'PRINTFUL_PUBLIC_PREVIEW_REQUIRED' });
  const bad = merchandising(); bad.products[0].localImage = '/assets/catalog/../private.png';
  assert.throws(() => fixture({ merch: bad }), { code: 'PRINTFUL_MERCHANDISING_INVALID' });
});

test('unsafe prices/currencies and empty SKUs fail without falling back to historical offers', async () => {
  for (const [field, value, code] of [['retail_price', -1, 'PRINTFUL_INVALID_RETAIL_PRICE'], ['currency', 'eur', 'PRINTFUL_INVALID_RETAIL_CURRENCY'], ['sku', '', 'PRINTFUL_INVALID_PUBLIC_TEXT']]) {
    const f = fixture(); f.detail.sync_variants[0][field] = value; await assert.rejects(f.catalog.getCatalog(), { code });
  }
});

test('authorization failure is not retried and sensitive provider body is not reflected', async () => {
  const f = fixture({ route: () => new Response(TOKEN, { status: 401 }) });
  await assert.rejects(f.catalog.getCatalog(), error => error.code === 'PRINTFUL_AUTH_FAILED' && !String(error).includes(TOKEN)); assert.equal(f.calls.length, 1); assert.deepEqual(f.delays, []);
});

test('transient GET retries and bounded Retry-After are honored', async () => {
  let count = 0;
  const f = fixture({ route: url => { if (url.pathname === '/stores' && count++ < 2) return new Response(TOKEN, { status: count === 1 ? 429 : 503, headers: { 'retry-after': '1' } }); } });
  await f.catalog.getCatalog(); assert.deepEqual(f.delays, [1000, 1000]); assert.equal(f.calls.filter(x => x === '/stores').length, 3);
  const excessive = fixture({ route: () => new Response(TOKEN, { status: 429, headers: { 'retry-after': '60' } }) });
  await assert.rejects(excessive.catalog.verifyStore(), { code: 'PRINTFUL_RETRY_LATER' }); assert.equal(excessive.calls.length, 1); assert.deepEqual(excessive.delays, []);
});

test('successful rate-limit exhaustion waits for the relative reset before the next GET', async () => {
  const f = fixture({ route: url => url.pathname === '/stores' ? response(sevenStores(), null, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1' }) : null });
  await f.catalog.getCatalog(); assert.deepEqual(f.delays, [1000]);
});

test('redirects, malformed JSON/HTML and oversized streamed bodies are rejected', async () => {
  for (const [make, code] of [
    [() => { const result = response([]); Object.defineProperty(result, 'redirected', { value: true }); return result; }, 'PRINTFUL_REDIRECT_REJECTED'],
    [() => new Response('{broken', { headers: { 'content-type': 'application/json' } }), 'PRINTFUL_INVALID_RESPONSE'],
    [() => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }), 'PRINTFUL_INVALID_RESPONSE'],
    [() => new Response(' '.repeat(2 * 1024 * 1024 + 1), { headers: { 'content-type': 'application/json' } }), 'PRINTFUL_RESPONSE_TOO_LARGE']
  ]) {
    const f = fixture({ route: make }); await assert.rejects(f.catalog.getCatalog(), { code }); assert.equal(f.calls.length, 1);
  }
});

test('timeout transport failures are bounded and return only a safe code', async () => {
  const f = fixture({ timeoutMs: 2, route: (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error(TOKEN)), { once: true })) });
  await assert.rejects(f.catalog.verifyStore(), error => error.code === 'PRINTFUL_TRANSPORT_ERROR' && !String(error).includes(TOKEN)); assert.equal(f.calls.length, 3);
});

test('invalid constructor configuration or duplicate merchandising fails before network access', () => {
  assert.throws(() => new LivePrintfulCatalog({ merchandising: merchandising() }), { code: 'PRINTFUL_TOKEN_REQUIRED' });
  assert.throws(() => fixture({ platform: 'https://evil.example.test/' }), { code: 'PRINTFUL_PLATFORM_REQUIRED' });
  const merch = merchandising(); merch.products.push(clone(merch.products[0])); assert.throws(() => fixture({ merch }), { code: 'PRINTFUL_MERCHANDISING_CONFLICT' });
});
