/* ISOLATED actual workerd checks against the generated release bundle. All
 * native outbound fetches terminate in a local synthetic provider handler.
 * No account API, real credentials, payment or fulfillment is used. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const ORIGIN = 'https://commerce.example.test', STORE = 18912189;
const TOKEN = ['isolated', 'workerd', 'printful', 'fixture'].join('-');
const SESSION_SECRET = ['isolated', 'session', 'S'.repeat(48)].join('-');
const bundle = readFileSync(new URL('../dist/server/index.js', import.meta.url), 'utf8');
const merchandising = JSON.parse(readFileSync(new URL('../dist/shop/catalog.json', import.meta.url), 'utf8'));
const envelope = (result, paging) => Response.json({ code: 200, result, ...(paging ? { paging } : {}) });
const deploymentSql = readFileSync(new URL('../server/commerce/d1-migrations/0001-commerce.sql', import.meta.url), 'utf8');
const cacheDdl = deploymentSql.match(/CREATE TABLE [`"]commerce_d1_public_catalog_cache[`"]\s*\([\s\S]*?\);/)?.[0];
assert(cacheDdl, 'The deployment-generated migration must contain the public cache table');
async function migrateCache(mf) {
  const db = await mf.getD1Database('COMMERCE_DB');
  await db.prepare(cacheDdl).run(); return db;
}

function runtime(handler, wrapper = "export {default} from './bundle.mjs';", bindings = {}) {
  const { COMMERCE_DB: ignoredFixtureBinding, ...otherBindings } = bindings;
  const options = convertV4MiniflareOptions({
    modulesRoot: '/isolated-proof',
    modules: [
      { type: 'ESModule', path: '/isolated-proof/index.mjs', contents: wrapper },
      { type: 'ESModule', path: '/isolated-proof/bundle.mjs', contents: bundle },
    ],
    compatibilityDate: '2026-10-23', compatibilityFlags: ['nodejs_compat'],
    bindings: { PRINTFUL_API_TOKEN: TOKEN, ...otherBindings },
    d1Databases: { COMMERCE_DB: 'isolated-native-public-catalog-cache' },
    outboundService: async request => {
      assert.equal(new URL(request.url).origin, 'https://api.printful.com', 'All native fetches must terminate in the isolated Printful handler');
      assert.equal(request.headers.get('authorization'), 'Bearer ' + TOKEN);
      return handler(request);
    },
  });
  // Reproduce the hosting environment where the optional edge Cache API is
  // unavailable. Repeated inbound requests must rely on actual native D1.
  options.workers[0].config.cache = { enabled: false };
  return new Miniflare(options);
}

test('generated Worker loads the full isolated merchandising fixture through native workerd fetch', async () => {
  // Retained public identities are fixture inputs, not a claim about current API
  // counts. Prices/availability below are explicitly synthetic provider values.
  const details = new Map(merchandising.products.map(product => [product.printfulSyncProductId, {
    sync_product: { id: product.printfulSyncProductId, name: product.name },
    sync_variants: product.variants.map(variant => ({ id: variant.printfulSyncVariantId,
      sync_product_id: product.printfulSyncProductId, variant_id: variant.printfulCatalogVariantId,
      name: variant.title, sku: variant.sku, synced: true, availability_status: 'active',
      retail_price: '12.50', currency: 'EUR' })),
  }]));
  const paths = [];
  const mf = runtime(request => {
    const url = new URL(request.url); paths.push(url.pathname + url.search);
    assert.equal(request.method, 'GET', 'Catalog loading must never mutate provider state');
    if (url.pathname === '/stores') return envelope([{ id: STORE }]);
    if (url.pathname === '/store/products') return envelope([...details.keys()].map(id => ({ id })), { offset: 0, limit: 100, total: details.size });
    const detail = details.get(Number(url.pathname.split('/').pop()));
    assert(detail, 'Unexpected isolated catalog detail request'); return envelope(detail);
  });
  try {
    const db = await migrateCache(mf);
    const response = await mf.dispatchFetch(ORIGIN + '/api/commerce/catalog'), body = await response.json();
    assert.equal(response.status, 200); assert.equal(body.catalogueVerifiedLive, true);
    assert.equal(body.products.length, merchandising.products.length);
    assert.equal(body.products.reduce((sum, product) => sum + product.variants.length, 0), merchandising.products.reduce((sum, product) => sum + product.variants.length, 0));
    assert.equal(paths.length, 2 + merchandising.products.length);
    assert.equal(JSON.stringify(body).includes(TOKEN), false);
    const row = await db.prepare('SELECT * FROM commerce_d1_public_catalog_cache WHERE store_id = ?').bind(STORE).first();
    assert(row); assert.equal(row.expires_at_ms - row.verified_at_ms, 60000); assert.equal(row.lease_token, null);
    const second = await mf.dispatchFetch(ORIGIN + '/api/commerce/catalog');
    assert.equal(second.status, 200); assert.deepEqual(await second.json(), body);
    assert.equal(paths.length, 2 + merchandising.products.length, 'The second native inbound request performs zero Printful reads');
    assert.equal(JSON.stringify(row).includes(TOKEN), false);
  } finally { await mf.dispose(); }
});

test('generated Worker shipping uses native fetch, a real signed cookie and the server catalog variant', async () => {
  const variant = { id: 'isolated_variant', catalogVariantId: 456, synced: true, availabilityStatus: 'active', retailPrice: { amount: '12.50', currency: 'EUR' } };
  const wrapper = `import {createCommerceWorker} from './bundle.mjs'; export default createCommerceWorker({repositoryFactory:()=>({async migrate(){},async consumeRateLimit(){return {allowed:true}}}),catalogFactory:()=>({async verifyStore(){return {id:${STORE},verified:true}},async getVariant(){return ${JSON.stringify(variant)}}})});`;
  const requests = [];
  const mf = runtime(async request => {
    const url = new URL(request.url); requests.push({ path: url.pathname, method: request.method });
    if (url.pathname === '/stores') return envelope([{ id: STORE }]);
    assert.equal(url.pathname, '/shipping/rates'); assert.equal(request.method, 'POST');
    assert.deepEqual(await request.json(), { recipient: { country_code: 'FR', zip: '00000' }, items: [{ variant_id: 456, quantity: 2 }], currency: 'EUR' });
    return envelope([{ id: 'ISOLATED_STANDARD', name: 'Isolated standard', rate: '3.50', currency: 'EUR' }]);
  }, wrapper, { COMMERCE_DB: 'isolated-binding-present', COMMERCE_SESSION_SECRET: SESSION_SECRET });
  try {
    const status = await mf.dispatchFetch(ORIGIN + '/api/commerce/status');
    assert.equal(status.status, 200); const cookie = status.headers.get('set-cookie')?.split(';')[0]; assert(cookie);
    const response = await mf.dispatchFetch(ORIGIN + '/api/commerce/shipping', { method: 'POST', headers: { origin: ORIGIN, cookie, 'content-type': 'application/json' }, body: JSON.stringify({ lines: [{ variantId: variant.id, quantity: 2 }], recipient: { country_code: 'FR', zip: '00000' } }) });
    assert.equal(response.status, 200); assert.equal((await response.json()).shippingOptions[0].amountMinor, 350);
    assert.deepEqual(requests, [{ path: '/stores', method: 'GET' }, { path: '/shipping/rates', method: 'POST' }]);
  } finally { await mf.dispose(); }
});

test('generated Worker never follows a provider redirect or exposes its response body', async () => {
  let requests = 0;
  const mf = runtime(request => {
    requests++; assert.equal(new URL(request.url).pathname, '/stores');
    return new Response('isolated-private-redirect-body', { status: 302, headers: { location: 'https://redirect-target.example.test/private' } });
  });
  try {
    await migrateCache(mf);
    const response = await mf.dispatchFetch(ORIGIN + '/api/commerce/catalog');
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'PRINTFUL_REDIRECT_REJECTED' });
    assert.equal(requests, 1, 'Manual redirect rejection never forwards credentials or retries');
  } finally { await mf.dispose(); }
});
