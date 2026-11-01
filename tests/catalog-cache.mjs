/* ISOLATED cache concurrency/security tests: real local SQLite behind D1-shaped
 * bindings; synthetic public catalogs only. No hosted D1 or provider request. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { D1PublicCatalogCache } from '../server/commerce/catalog-cache.js';

const STORE = 18912189, TABLE = 'commerce_d1_public_catalog_cache';
const code = expected => error => error?.code === expected;
const clone = value => structuredClone(value);
const defer = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const immediate = () => new Promise(resolve => setImmediate(resolve));
const publicCatalog = now => ({ version: 1, checkedAt: new Date(now).toISOString(), mode: 'printful-live', catalogueVerifiedLive: true,
  checkout: { enabled: false, url: null, verifiedAt: null }, products: [],
  sync: { mode: 'full', completeStoreScan: true, refreshedProductIds: [], removedProductIds: [], removedVariantIds: [], unavailableVariantIds: [] } });
const product = now => {
  const checkedAt = new Date(now).toISOString();
  return { id: 'isolated_artwork', productId: 'isolated_artwork', handle: 'printful-18912189-101', name: 'Isolated public shirt', originalName: 'Isolated public shirt', displayName: 'Isolated public artwork', category: 'tees', description: 'Public synthetic description', localImage: '/assets/catalog/isolated.png', image: '/assets/catalog/isolated.png', images: ['/assets/catalog/isolated.png'],
    options: [{ title: 'Color', values: ['Black'] }, { title: 'Size', values: ['L'] }],
    variants: [{ id: 'isolated_black_l', sku: 'ISOLATED_PUBLIC_SKU', title: 'Black / L', options: [{ title: 'Color', value: 'Black' }, { title: 'Size', value: 'L' }], printfulSyncVariantId: 1001, printfulCatalogVariantId: 2001,
      printfulRetailPrice: { amount: '12.50', currency: 'EUR', checkedAt, source: 'printful-sync-variant', checkoutQuote: false }, availability: { status: 'active', checkedAt, source: 'printful-sync-variant' }, configurationStatus: 'synced' }],
    printfulSyncProductId: 101, printfulStoreId: String(STORE), printfulCheckedAt: checkedAt, unconfiguredVariantIds: [], sourceUrl: 'https://hiphop.caisik.i234.me/dk/products/printful-18912189-101' };
};
const populatedCatalog = now => ({ ...publicCatalog(now), products: [product(now)], sync: { ...publicCatalog(now).sync, refreshedProductIds: [101] } });

class SqliteD1Shim {
  constructor(filename) { this.raw = new DatabaseSync(filename, { enableForeignKeyConstraints: true }); this.queries = []; }
  prepare(sql) {
    const owner = this;
    return { sql, bindings: [], bind(...bindings) { return { ...this, bindings }; },
      async first() { await Promise.resolve(); return owner.execute(this).results[0] || null; },
      async all() { await Promise.resolve(); return owner.execute(this); },
      async run() { await Promise.resolve(); return owner.execute(this); } };
  }
  execute(statement) {
    this.queries.push(statement.sql);
    const prepared = this.raw.prepare(statement.sql);
    if (prepared.columns().length) return { success: true, results: prepared.all(...statement.bindings).map(row => ({ ...row })), meta: { changes: 0 } };
    const result = prepared.run(...statement.bindings);
    return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
  }
  async batch(statements) {
    await Promise.resolve(); this.raw.exec('BEGIN IMMEDIATE');
    try { const result = statements.map(statement => this.execute(statement)); this.raw.exec('COMMIT'); return result; }
    catch (error) { this.raw.exec('ROLLBACK'); throw error; }
  }
  withSession(mode) { assert.equal(mode, 'first-primary'); return this; }
  close() { this.raw.close(); }
}

function fixture(t, { apply = true } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'ua-public-catalog-cache-')), filename = join(directory, 'isolated.sqlite');
  const db = new SqliteD1Shim(filename), secondDb = new SqliteD1Shim(filename); let clock = 1800000000000;
  if (apply) {
    const migrations = new URL('../server/commerce/d1-migrations/', import.meta.url);
    for (const name of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) db.raw.exec(readFileSync(new URL(name, migrations), 'utf8'));
  }
  t.after(() => { db.close(); secondDb.close(); rmSync(directory, { recursive: true, force: true }); });
  const options = { now: () => clock, sleep: async ms => { clock += ms; await immediate(); }, ttlMs: 60000, leaseMs: 30000, waitMs: 1500, pollMs: 100 };
  return { db, secondDb, now: () => clock, advance(ms) { clock += ms; },
    cache(overrides = {}) { return new D1PublicCatalogCache({ db, ...options, ...overrides }); },
    second(overrides = {}) { return new D1PublicCatalogCache({ db: secondDb, ...options, ...overrides }); },
    row() { return db.raw.prepare('SELECT * FROM ' + TABLE + ' WHERE store_id = ?').get(STORE); },
  };
}

test('fresh sanitized catalog fills once and is shared across independent cache instances', async t => {
  const f = fixture(t), expected = populatedCatalog(f.now()); let loads = 0;
  const first = await f.cache().getCatalog(async () => { loads++; return clone(expected); });
  assert.deepEqual(first, expected); first.products[0].displayName = 'Caller mutation';
  const second = await f.second().getCatalog(async () => { loads++; assert.fail('Fresh D1 cache must avoid another provider scan'); });
  assert.deepEqual(second, expected); assert.equal(loads, 1);
  const row = f.row(); assert.equal(row.store_id, STORE); assert.equal(row.verified_at_ms, f.now()); assert.equal(row.expires_at_ms - row.verified_at_ms, 60000);
  assert.equal(row.lease_token, null); assert.equal(row.lease_expires_at_ms, 0); assert.deepEqual(JSON.parse(row.payload_json), expected);
});

test('TTL is strict: a fresh hit avoids provider access and exact expiry requires new verification', async t => {
  const f = fixture(t); let loads = 0;
  const load = async () => { loads++; return publicCatalog(f.now()); };
  const original = await f.cache().getCatalog(load); f.advance(59999);
  assert.deepEqual(await f.second().getCatalog(load), original); assert.equal(loads, 1);
  f.advance(1); const renewed = await f.second().getCatalog(load);
  assert.equal(loads, 2); assert.notEqual(renewed.checkedAt, original.checkedAt); assert.equal(renewed.checkedAt, new Date(f.now()).toISOString());
});

test('an expired cached catalog is never served when a fresh provider scan fails', async t => {
  const f = fixture(t); await f.cache().getCatalog(async () => publicCatalog(f.now())); f.advance(60000); let attempts = 0;
  await assert.rejects(f.second().getCatalog(async () => { attempts++; throw new Error('isolated provider unavailable'); }));
  assert.equal(attempts, 1);
  const current = await f.cache().getCatalog(async () => publicCatalog(f.now()));
  assert.equal(current.checkedAt, new Date(f.now()).toISOString(), 'A subsequent request must perform fresh verification rather than reuse stale data');
});

test('a concurrent waiter shares the first refresh without a second provider load', async t => {
  const f = fixture(t), entered = defer(), release = defer(); let loads = 0;
  const expected = publicCatalog(f.now());
  const first = f.cache().getCatalog(async () => { loads++; entered.resolve(); return release.promise; });
  await entered.promise;
  let slept = false;
  const second = f.second({ sleep: async ms => { f.advance(ms); if (!slept) { slept = true; release.resolve(expected); } await first; } }).getCatalog(async () => { loads++; assert.fail('A lease waiter must not start another provider scan'); });
  assert.deepEqual(await second, expected); assert.deepEqual(await first, expected); assert.equal(loads, 1); assert.equal(slept, true);
});

test('a live refresh lease imposes a bounded wait and returns503 pending instead of stale data or another scan', async t => {
  const f = fixture(t), entered = defer(), release = defer(); let loads = 0, slept = 0;
  const expected = publicCatalog(f.now());
  const first = f.cache().getCatalog(async () => { loads++; entered.resolve(); return release.promise; });
  await entered.promise;
  await assert.rejects(f.second({ sleep: async ms => { slept += ms; f.advance(ms); await immediate(); } }).getCatalog(async () => { loads++; assert.fail('Unexpired lease must prevent a duplicate scan'); }), error => error.code === 'CATALOG_REFRESH_PENDING' && error.status === 503);
  assert(slept <= 1600, 'Wait must be bounded near the configured1500ms'); assert.equal(loads, 1);
  release.resolve(expected); await first;
});

test('expired leases recover and an old slow lease cannot overwrite a newer verified catalog', async t => {
  const f = fixture(t), entered = defer(), release = defer(), original = publicCatalog(f.now());
  const old = f.cache().getCatalog(async () => { entered.resolve(); return release.promise; }); await entered.promise;
  f.advance(30001); const replacement = populatedCatalog(f.now());
  assert.deepEqual(await f.second().getCatalog(async () => clone(replacement)), replacement);
  release.resolve(original); const settled = await Promise.allSettled([old]);
  if (settled[0].status === 'fulfilled') assert.deepEqual(settled[0].value, replacement, 'A lost lease may only return the newer verified result');
  assert.deepEqual(JSON.parse(f.row().payload_json), replacement);
  assert.deepEqual(await f.cache().getCatalog(async () => assert.fail('Replacement cache should remain fresh')), replacement);
});

test('refresh heartbeat extends its fenced lease so a long scan cannot trigger a second provider load', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const f = fixture(t), entered = defer(), release = defer(), expected = publicCatalog(f.now());
  const first = f.cache().getCatalog(async () => { entered.resolve(); return release.promise; }); await entered.promise;
  const initialExpiry = f.row().lease_expires_at_ms;
  try {
    for (let heartbeat = 0; heartbeat < 3; heartbeat++) { f.advance(10000); t.mock.timers.tick(10000); await immediate(); }
    assert(f.now() >= initialExpiry); assert(f.row().lease_expires_at_ms > f.now(), 'Heartbeat must extend ownership past the original lease expiry');
    await assert.rejects(f.second({ waitMs: 0 }).getCatalog(async () => assert.fail('Renewed lease must prevent another provider load')), code('CATALOG_REFRESH_PENDING'));
  } finally { release.resolve(expected); await first; }
  assert.deepEqual(JSON.parse(f.row().payload_json), expected);
});

test('store identity is fixed and foreign-store source products cannot publish', async t => {
  const f = fixture(t);
  assert.throws(() => f.cache({ storeId: STORE + 1 }));
  const foreign = populatedCatalog(f.now()); foreign.products[0].printfulStoreId = '123';
  await assert.rejects(f.cache().getCatalog(async () => foreign));
  assert.equal(f.row()?.payload_json ?? null, null);
});

test('failed or structurally invalid provider responses never become a cache hit', async t => {
  const f = fixture(t);
  for (const value of [null, [], {}, { ...publicCatalog(f.now()), catalogueVerifiedLive: false }, { ...publicCatalog(f.now()), checkout: { enabled: true, url: 'https://untrusted.example.test', verifiedAt: null } }, { ...publicCatalog(f.now()), sync: { ...publicCatalog(f.now()).sync, completeStoreScan: false } }]) {
    await assert.rejects(f.cache().getCatalog(async () => clone(value)));
    assert.equal(f.row()?.payload_json ?? null, null);
  }
  await assert.rejects(f.cache().getCatalog(async () => { throw new Error('private synthetic upstream failure'); }));
  assert.equal(f.row()?.payload_json ?? null, null);
  const expected = publicCatalog(f.now()); assert.deepEqual(await f.cache().getCatalog(async () => expected), expected);
});

test('public schema whitelist rejects unknown private and customer fields before persistence', async t => {
  const f = fixture(t);
  for (const mutate of [catalog => { catalog.private_metadata = 'synthetic-private'; }, catalog => { catalog.recipient = { email: 'isolated@example.test' }; }, catalog => { catalog.products[0].customer = { name: 'Synthetic private customer' }; }, catalog => { catalog.products[0].variants[0].manufacturing_cost = '1.00'; }, catalog => { catalog.products[0].variants[0].files = [{ url: 'https://private.example.test/original.png' }]; }]) {
    const catalog = populatedCatalog(f.now()); mutate(catalog);
    await assert.rejects(f.cache().getCatalog(async () => catalog)); assert.equal(f.row()?.payload_json ?? null, null);
  }
});

test('allowed scalar and list-entry slots cannot conceal nested private/customer objects', async t => {
  const f = fixture(t);
  for (const mutate of [catalog => { catalog.products[0].description = { customer: { email: 'isolated@example.test' } }; }, catalog => { catalog.products[0].images = [{ recipient: { address1: 'Synthetic private address' } }]; }, catalog => { catalog.products[0].options[0].values = [{ private_metadata: 'synthetic-private' }]; }, catalog => { catalog.products[0].variants[0].sku = { customer: { name: 'Synthetic private customer' } }; }]) {
    const catalog = populatedCatalog(f.now()); mutate(catalog);
    await assert.rejects(f.cache().getCatalog(async () => catalog)); assert.equal(f.row()?.payload_json ?? null, null);
  }
});

test('secret-shaped credentials in public text and customer email fields are rejected', async t => {
  const f = fixture(t);
  const artificialSecrets = [['sk', 'test', 'F'.repeat(32)].join('_'), ['rk', 'live', 'R'.repeat(32)].join('_'), ['whsec', 'W'.repeat(32)].join('_')];
  for (const secret of artificialSecrets) {
    const catalog = populatedCatalog(f.now()); catalog.products[0].displayName = 'Synthetic public text ' + secret;
    await assert.rejects(f.cache().getCatalog(async () => catalog)); assert.equal(f.row()?.payload_json ?? null, null);
  }
  const catalog = populatedCatalog(f.now()); catalog.products[0].email = 'isolated@example.test';
  await assert.rejects(f.cache().getCatalog(async () => catalog)); assert.equal(f.row()?.payload_json ?? null, null);
});

test('request path performs no DDL and missing deployment migration fails closed without provider fallback', async t => {
  const ready = fixture(t); await ready.cache().getCatalog(async () => publicCatalog(ready.now()));
  assert.equal([...ready.db.queries, ...ready.secondDb.queries].some(sql => /^\s*(?:CREATE|ALTER|DROP|PRAGMA)\b/i.test(sql)), false);
  const missing = fixture(t, { apply: false }); let loads = 0;
  await assert.rejects(missing.cache().getCatalog(async () => { loads++; return publicCatalog(missing.now()); }), error => error.code === 'CATALOG_CACHE_UNAVAILABLE' && error.status === 503 && !/no such table|SELECT|sqlite/i.test(error.message));
  assert.equal(loads, 0); assert.equal(missing.db.queries.some(sql => /^\s*(?:CREATE|ALTER|DROP|PRAGMA)\b/i.test(sql)), false);
});
