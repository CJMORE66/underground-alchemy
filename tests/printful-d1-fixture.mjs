/* Test-only real SQLite transactions behind the D1 API; no hosted DB/provider. */
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { D1CommerceRepository } from '../server/commerce/d1-repository.js';

export const SCOPE = { stripeAccountId: 'acct_printfulIsolated123', mode: 'test', printfulStoreId: 18912189 };
export const hash = value => createHash('sha256').update(value).digest('hex');
export const errorCode = code => error => error?.code === code;
export const hintFixture = (change = {}) => ({ fingerprint: hash('isolated-order-updated'), type: 'order_updated', occurredAt: '2027-01-15T08:00:00.123456789Z', storeId: 18912189, printfulId: 1001, externalId: 'ua_' + hash('isolated-order').slice(0, 28), shipmentId: null, ...change });

export class SqliteD1Shim {
  constructor(filename) { this.db = new DatabaseSync(filename, { enableForeignKeyConstraints: true }); this.fault = null; this.loseReply = false; }
  prepare(sql) {
    const owner = this;
    return { sql, bindings: [], bind(...bindings) { return { ...this, bindings }; }, async first() { await Promise.resolve(); return owner.execute(this).results[0] || null; }, async all() { await Promise.resolve(); return owner.execute(this); }, async run() { await Promise.resolve(); return owner.execute(this); } };
  }
  execute(statement) {
    if (this.fault?.test(statement.sql)) { this.fault = null; throw new Error('isolated D1 transport failure'); }
    const prepared = this.db.prepare(statement.sql);
    if (prepared.columns().length) return { success: true, results: prepared.all(...statement.bindings).map(row => ({ ...row })), meta: { changes: 0 } };
    const result = prepared.run(...statement.bindings);
    return { success: true, results: [], meta: { changes: Number(result.changes) } };
  }
  async batch(statements) {
    await Promise.resolve(); this.db.exec('BEGIN IMMEDIATE'); let results;
    try { results = statements.map(statement => this.execute(statement)); this.db.exec('COMMIT'); }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
    if (this.loseReply) { this.loseReply = false; throw new Error('isolated reply lost after commit'); }
    return results;
  }
  withSession(mode) { assert.equal(mode, 'first-primary'); return this; }
  close() { this.db.close(); }
}

export async function fixture(t, { mapped = true, uuid } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'ua-pf-d1-isolated-')), filename = join(directory, 'commerce.sqlite');
  const db = new SqliteD1Shim(filename), secondDb = new SqliteD1Shim(filename);
  db.db.exec(readFileSync(new URL('../server/commerce/d1-migrations/0001-commerce.sql', import.meta.url), 'utf8'));
  let clock = 1800000000000;
  const now = () => clock;
  const repository = new D1CommerceRepository({ db, scope: SCOPE, clock: now, ...(uuid ? { uuid } : {}) }), second = new D1CommerceRepository({ db: secondDb, scope: SCOPE, clock: now });
  await repository.migrate(); await second.migrate();
  t.after(() => { db.close(); secondDb.close(); rmSync(directory, { recursive: true, force: true }); });
  const order = { id: 'isolated-order', ownerId: 'isolated-owner', quoteHash: 'a'.repeat(64), totalMinor: 1200, currency: 'EUR', recipient: { name: 'Isolated Customer', address1: 'Synthetic Street 1', city: 'Synthetic City', zip: '00000', country_code: 'FR' }, items: [{ sync_variant_id: 101, quantity: 1 }], shippingId: 'synthetic-standard' };
  const reservation = { orderId: order.id, externalId: hintFixture().externalId, payloadHash: 'b'.repeat(64), paymentReference: 'pi_isolated_not_payment_proof' };
  if (mapped) { await repository.createOrder(order); await repository.claimDraft(reservation); await repository.markDraftCreated({ ...reservation, printfulId: 1001 }); }
  return { db, secondDb, repository, second, order, reservation, now, advance(ms) { clock += ms; }, async scoped(scope) { const repository = new D1CommerceRepository({ db, scope, clock: now }); await repository.migrate(); return repository; } };
}
