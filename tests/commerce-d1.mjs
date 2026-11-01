/* Real SQLite SQL/transactions behind a D1-shaped shim. No hosted D1/provider call. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { D1CommerceRepository } from '../server/commerce/d1-repository.js';
import { DraftOrderService } from '../server/commerce/orders.js';
import { StripeOrderWorkflow } from '../server/commerce/stripe-workflow.js';
import { CommerceError } from '../server/commerce/validation.js';
import { draftPayload } from '../server/commerce/printful.js';
import { projectPrintfulOrder } from '../server/commerce/fulfillment-sync.js';

const migration = readFileSync(new URL('../server/commerce/d1-migrations/0001-commerce.sql', import.meta.url), 'utf8');
const SCOPE = { stripeAccountId: 'acct_isolatedAccount123', mode: 'test', printfulStoreId: 18912189 };
const orderFixture = id => ({ id, quoteHash: 'a'.repeat(64), totalMinor: 1200, currency: 'EUR', recipient: { name: 'Isolated Customer', address1: 'Synthetic Street 1', city: 'Synthetic City', zip: '00000', country_code: 'FR' }, items: [{ sync_variant_id: 101, quantity: 1 }], shippingId: 'synthetic-standard', subtotalMinor: 900, shippingMinor: 100, taxMinor: 200 });
const reservation = orderId => ({ orderId, externalId: 'ua_' + orderId, payloadHash: 'b'.repeat(64), paymentReference: 'pi_' + orderId });
const eventFixture = (id = 'evt_isolatedEvent1') => ({ eventId: id, sessionId: 'cs_test_isolatedSession1', type: 'checkout.session.completed', created: 1800000000 });
const errorCode = code => error => error?.code === code;

class SqliteD1Shim {
  constructor(filename) { this.db = new DatabaseSync(filename, { enableForeignKeyConstraints: true }); this.sessions = []; this.queries = []; this.fault = null; this.loseReply = false; }
  prepare(sql) {
    const owner = this;
    return { sql, bindings: [], bind(...bindings) { return { ...this, bindings }; }, async first() { await Promise.resolve(); return owner.execute(this).results[0] || null; }, async all() { await Promise.resolve(); return owner.execute(this); }, async run() { await Promise.resolve(); return owner.execute(this); } };
  }
  execute(statement) {
    this.queries.push(statement.sql);
    if (this.fault?.test(statement.sql)) { this.fault = null; throw new Error('isolated D1 transport failure after a prior statement'); }
    const prepared = this.db.prepare(statement.sql);
    if (prepared.columns().length) return { success: true, results: prepared.all(...statement.bindings).map(row => ({ ...row })), meta: { changes: 0 } };
    const result = prepared.run(...statement.bindings);
    return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
  }
  async batch(statements) {
    await Promise.resolve();
    this.db.exec('BEGIN IMMEDIATE');
    let results;
    try { results = statements.map(statement => this.execute(statement)); this.db.exec('COMMIT'); }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
    if (this.loseReply) { this.loseReply = false; throw new Error('isolated response lost after transaction commit'); }
    return results;
  }
  withSession(mode) { assert.equal(mode, 'first-primary'); this.sessions.push(mode); return this; }
  close() { this.db.close(); }
}

async function fixture(t, { apply = true } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'ua-d1-isolated-')), filename = join(directory, 'd1.sqlite');
  let clock = 1800000000000;
  const db = new SqliteD1Shim(filename), secondDb = new SqliteD1Shim(filename);
  if (apply) db.db.exec(migration);
  const repository = new D1CommerceRepository({ db, scope: SCOPE, clock: () => clock });
  const second = new D1CommerceRepository({ db: secondDb, scope: SCOPE, clock: () => clock });
  if (apply) { await repository.migrate(); await second.migrate(); }
  t.after(() => { db.close(); secondDb.close(); rmSync(directory, { recursive: true, force: true }); });
  return { db, secondDb, repository, second, filename, now: () => clock, advance(ms) { clock += ms; }, async scoped(scope) { const repo = new D1CommerceRepository({ db, scope, clock: () => clock }); await repo.migrate(); return repo; } };
}

test('production D1 module has no filesystem/native-SQLite dependency; scope and binding are mandatory', async t => {
  const source = readFileSync(new URL('../server/commerce/d1-repository.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from ['"]node:|require\(['"]node:|\.exec\(/);
  assert.throws(() => new D1CommerceRepository(), errorCode('D1_BINDING_REQUIRED'));
  const f = await fixture(t);
  assert.throws(() => new D1CommerceRepository({ db: f.db }), errorCode('COMMERCE_SCOPE_REQUIRED'));
  assert.throws(() => new D1CommerceRepository({ db: f.db, scope: { ...SCOPE, mode: 'unknown' } }), errorCode('COMMERCE_SCOPE_REQUIRED'));
});

test('migrate only verifies deployment-applied schema and never runs DDL during requests', async t => {
  const f = await fixture(t, { apply: false });
  await assert.rejects(f.repository.getOrder('missing'), errorCode('REPOSITORY_MIGRATION_REQUIRED'));
  await assert.rejects(f.repository.migrate(), errorCode('REPOSITORY_MIGRATION_REQUIRED'));
  assert.equal(f.db.queries.some(sql => /CREATE|ALTER|DROP/i.test(sql)), false);
  f.db.db.exec(migration);
  assert.deepEqual(await f.repository.migrate(), { version: 1 });
  assert.equal(f.db.db.prepare('SELECT count(*) AS count FROM commerce_d1_schema').get().count, 0, 'readiness uses schema, never marker seed rows');
  f.db.db.exec("DROP TABLE commerce_d1_schema; CREATE TABLE commerce_d1_schema(version INTEGER DEFAULT 2, contract TEXT DEFAULT 'wrong')");
  await assert.rejects(f.repository.migrate(), errorCode('REPOSITORY_MIGRATION_MISMATCH'));
});

test('deployment SQL and journal are real Drizzle generation plus a schema-only custom trigger migration', () => {
  const journal = JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8'));
  assert.equal(journal.dialect, 'sqlite'); assert.equal(journal.entries.length, 4);
  const generated = journal.entries.map(entry => readFileSync(new URL('../drizzle/' + entry.tag + '.sql', import.meta.url), 'utf8')).join('\n');
  assert.equal(migration, '-- Generated deployment migration mirror; edit db/schema.ts and regenerate Drizzle, not this file.\n' + generated + '\n');
  assert.doesNotMatch(generated, /^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/im);
  assert.match(generated, /CREATE TABLE [`"]?commerce_d1_limits/);
  assert.match(generated, /CREATE TABLE [`"]?commerce_d1_fulfillment/);
  assert.match(generated, /CREATE TABLE [`"]?commerce_d1_printful_events/);
  assert.match(generated, /CREATE TRIGGER commerce_d1_orders_immutable_update/);
});

async function fulfillmentFixture(t) {
  const f = await fixture(t), order = { ...orderFixture('fulfillment-order'), ownerId: 'owner-isolated' }, input = reservation(order.id);
  await f.repository.createOrder(order); await f.repository.claimDraft(input); await f.repository.markDraftCreated({ ...input, printfulId: 1001 });
  const remote = { id: 1001, external_id: input.externalId, created: 1799999000, updated: 1800000000, status: 'draft', items: [{ id: 10, sync_variant_id: 101, quantity: 1 }], shipments: [] };
  const projection = projectPrintfulOrder(remote, { order, mapping: { ...input, printfulId: 1001 }, nowMs: f.now() });
  const write = { orderId: order.id, ownerId: order.ownerId, printfulId: 1001, externalId: input.externalId, expectedHash: null, projection, observedAt: f.now() };
  return { ...f, order, input, projection, write };
}

test('fulfillment projection requires actual owner, created mapping and exact account/store scope', async t => {
  const f = await fulfillmentFixture(t), saved = await f.repository.saveFulfillmentProjection(f.write);
  assert.equal(saved.projection.status, 'draft'); assert.equal(saved.printfulId, 1001);
  assert.equal(await f.repository.getFulfillmentProjection(f.order.id, { ownerId: 'other-owner' }), null);
  await assert.rejects(f.repository.saveFulfillmentProjection({ ...f.write, ownerId: 'other-owner' }), errorCode('ORDER_NOT_FOUND'));
  const otherScope = await f.scoped({ ...SCOPE, stripeAccountId: 'acct_otherAccount123' });
  assert.equal(await otherScope.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId }), null);
  await assert.rejects(otherScope.saveFulfillmentProjection(f.write), errorCode('ORDER_NOT_FOUND'));
  await assert.rejects(f.repository.saveFulfillmentProjection({ ...f.write, printfulId: 2 }), errorCode('FULFILLMENT_MAPPING_REQUIRED'));
  const pending = { ...orderFixture('pending-order'), ownerId: f.order.ownerId }; await f.repository.createOrder(pending); await f.repository.claimDraft({ ...reservation(pending.id), payloadHash: 'c'.repeat(64) });
  await assert.rejects(f.repository.saveFulfillmentProjection({ ...f.write, orderId: pending.id }), errorCode('ORDER_NOT_FOUND'));
  assert.equal((await f.repository.getOrder(f.order.id)).totalMinor, f.order.totalMinor, 'projection never changes immutable order/payment data');
});

test('actual SQL CAS prevents concurrent lost updates and rejects provider timestamp regression', async t => {
  const f = await fulfillmentFixture(t), first = await f.repository.saveFulfillmentProjection(f.write);
  const next = status => ({ ...f.write, expectedHash: first.projectionHash, projection: { ...f.projection, status, providerUpdatedAt: 1800000001 } });
  const results = await Promise.allSettled([f.repository.saveFulfillmentProjection(next('pending')), f.second.saveFulfillmentProjection(next('onhold'))]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 'FULFILLMENT_SYNC_CONFLICT');
  const current = await f.repository.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId });
  await assert.rejects(f.repository.saveFulfillmentProjection({ ...f.write, expectedHash: current.projectionHash }), errorCode('FULFILLMENT_SYNC_CONFLICT'));
  assert.equal((await f.repository.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId })).providerUpdatedAt, 1800000001);
  const resumed = new D1CommerceRepository({ db: f.secondDb, scope: SCOPE, clock: f.now }); await resumed.migrate();
  assert.deepEqual(await resumed.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId }), current);
});

test('projection commit with lost D1 reply safely recovers and unknown fields cannot persist', async t => {
  const f = await fulfillmentFixture(t); f.db.loseReply = true;
  await assert.rejects(f.repository.saveFulfillmentProjection(f.write), errorCode('REPOSITORY_UNAVAILABLE'));
  const recovered = await f.second.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId });
  assert.equal(recovered.projection.status, 'draft');
  assert.equal((await f.repository.saveFulfillmentProjection(f.write)).projectionHash, recovered.projectionHash);
  await assert.rejects(f.repository.saveFulfillmentProjection({ ...f.write, projection: { ...f.projection, recipient: f.order.recipient } }), errorCode('PRINTFUL_FULFILLMENT_INVALID'));
});

test('immutable authoritative order and hydrated Session survive a new repository instance', async t => {
  const f = await fixture(t), order = orderFixture('order1');
  await f.repository.createOrder(order);
  await f.repository.createOrder({ ...order, recipient: { ...order.recipient } });
  await f.repository.bindStripeSession({ orderId: order.id, quoteHash: order.quoteHash, sessionId: 'cs_test_session1' });
  const restored = new D1CommerceRepository({ db: f.secondDb, scope: SCOPE, clock: f.now }); await restored.migrate();
  assert.equal((await restored.getOrder(order.id)).stripeCheckoutSessionId, 'cs_test_session1');
  assert.equal((await restored.getOrderByStripeSession('cs_test_session1')).id, order.id);
  await assert.rejects(f.repository.createOrder({ ...order, totalMinor: 1 }), errorCode('IMMUTABLE_ORDER_CONFLICT'));
  assert.equal((await f.repository.getOrder(order.id)).totalMinor, 1200);
  assert.throws(() => f.db.db.prepare('UPDATE commerce_d1_orders SET total_minor = 1').run(), /immutable/);
  assert.throws(() => f.db.db.prepare('DELETE FROM commerce_d1_orders').run(), /immutable/);
});

test('conditional Session binding is unique per order/session and cannot overwrite another quote', async t => {
  const f = await fixture(t), order = orderFixture('order1'); await f.repository.createOrder(order);
  const results = await Promise.allSettled(['cs_test_session1', 'cs_test_session2'].map((sessionId, index) => (index ? f.second : f.repository).bindStripeSession({ orderId: order.id, quoteHash: order.quoteHash, sessionId })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const sessionId = (await f.repository.getOrder(order.id)).stripeCheckoutSessionId;
  await assert.rejects(f.repository.bindStripeSession({ orderId: order.id, quoteHash: '0'.repeat(64), sessionId }), errorCode('STRIPE_SESSION_BINDING_CONFLICT'));
  await f.repository.createOrder(orderFixture('order2'));
  await assert.rejects(f.repository.bindStripeSession({ orderId: 'order2', quoteHash: order.quoteHash, sessionId }), errorCode('STRIPE_SESSION_BINDING_CONFLICT'));
  assert.equal((await f.repository.getOrder('order2')).stripeCheckoutSessionId, null);
});

test('concurrent draft reservations and durable mutation gates acquire exactly once', async t => {
  const f = await fixture(t); await f.repository.createOrder(orderFixture('order1'));
  const input = reservation('order1');
  const claims = await Promise.all(Array.from({ length: 16 }, (_, index) => (index % 2 ? f.second : f.repository).claimDraft(input)));
  assert.equal(claims.filter(claim => claim.acquired).length, 1);
  const gates = await Promise.all(Array.from({ length: 16 }, (_, index) => (index % 2 ? f.second : f.repository).beginDraftAttempt(input)));
  assert.equal(gates.filter(gate => gate.acquired).length, 1);
  await f.repository.recordDraftFailure({ orderId: input.orderId, externalId: input.externalId, code: 'REMOTE_TIMEOUT', ambiguous: true });
  assert.equal((await f.second.beginDraftAttempt(input)).acquired, false);
  assert.equal((await f.second.getDraft(input.orderId)).attempted, true);
});

test('payment/external/hash/Printful identifiers are unique and created mappings cannot be replaced', async t => {
  const f = await fixture(t); await f.repository.createOrder(orderFixture('order1')); await f.repository.createOrder(orderFixture('order2'));
  const first = reservation('order1'); await f.repository.claimDraft(first);
  for (const change of [{ paymentReference: 'other' }, { externalId: 'other' }, { payloadHash: 'c'.repeat(64) }]) await assert.rejects(f.repository.claimDraft({ ...first, ...change }), errorCode('DRAFT_RESERVATION_CONFLICT'));
  await assert.rejects(f.repository.claimDraft({ ...reservation('order2'), payloadHash: 'c'.repeat(64), paymentReference: first.paymentReference }), errorCode('DRAFT_RESERVATION_CONFLICT'));
  await f.repository.markDraftCreated({ ...first, printfulId: 1001 });
  await assert.rejects(f.repository.markDraftCreated({ ...first, printfulId: 1002 }), errorCode('DRAFT_RESERVATION_CONFLICT'));
  await f.repository.recordDraftFailure({ orderId: first.orderId, externalId: first.externalId, code: 'LATE_ERROR', ambiguous: true });
  assert.equal((await f.repository.getDraft(first.orderId)).state, 'created');
  const second = { ...reservation('order2'), payloadHash: 'c'.repeat(64) }; await f.repository.claimDraft(second);
  await assert.rejects(f.repository.markDraftCreated({ ...second, printfulId: 1001 }), errorCode('REPOSITORY_WRITE_CONFLICT'));
  assert.equal((await f.repository.getDraft(second.orderId)).printfulId, null);
});

test('safe lookup failure before the mutation gate can recover without opening a second POST gate', async t => {
  const f = await fixture(t); await f.repository.createOrder(orderFixture('order1')); const input = reservation('order1');
  await f.repository.claimDraft(input);
  await f.repository.recordDraftFailure({ orderId: input.orderId, externalId: input.externalId, code: 'READ_FAILED', ambiguous: false });
  assert.equal((await f.repository.getDraft(input.orderId)).attempted, false);
  assert.equal((await f.second.beginDraftAttempt(input)).acquired, true);
  assert.equal((await f.repository.beginDraftAttempt(input)).acquired, false);
});

test('inbox and job insertion roll back atomically if the job statement fails', async t => {
  const f = await fixture(t); f.db.fault = /INSERT INTO commerce_d1_jobs/;
  await assert.rejects(f.repository.enqueuePaymentEvent(eventFixture()), candidate => candidate.code === 'REPOSITORY_UNAVAILABLE' && candidate.retryable);
  assert.equal(f.db.db.prepare('SELECT count(*) AS count FROM commerce_d1_events').get().count, 0);
  assert.equal(f.db.db.prepare('SELECT count(*) AS count FROM commerce_d1_jobs').get().count, 0);
  assert.equal((await f.repository.enqueuePaymentEvent(eventFixture())).duplicate, false);
});

test('lost reply after committed inbox transaction recovers by duplicate delivery, not another job', async t => {
  const f = await fixture(t); f.db.loseReply = true;
  await assert.rejects(f.repository.enqueuePaymentEvent(eventFixture()), errorCode('REPOSITORY_UNAVAILABLE'));
  const retried = await f.second.enqueuePaymentEvent(eventFixture()); assert.equal(retried.duplicate, true);
  assert.equal(f.db.db.prepare('SELECT count(*) AS count FROM commerce_d1_events').get().count, 1);
  assert.equal(f.db.db.prepare('SELECT count(*) AS count FROM commerce_d1_jobs').get().count, 1);
});

test('duplicate events do not reset jobs; event fingerprint conflicts cannot change persisted routing', async t => {
  const f = await fixture(t), event = eventFixture();
  const rows = await Promise.all([f.repository.enqueuePaymentEvent(event), f.second.enqueuePaymentEvent(event)]);
  assert.equal(rows.filter(row => row.duplicate).length, 1);
  for (const change of [{ sessionId: 'cs_test_another' }, { type: 'checkout.session.async_payment_succeeded' }, { created: event.created + 1 }]) await assert.rejects(f.second.enqueuePaymentEvent({ ...event, ...change }), errorCode('PAYMENT_EVENT_CONFLICT'));
  assert.equal((await f.repository.getPaymentJob(rows[0].id)).sessionId, event.sessionId);
});

test('concurrent job claims select each SQL row once and return distinct fenced leases', async t => {
  const f = await fixture(t);
  for (let index = 0; index < 4; index++) await f.repository.enqueuePaymentEvent(eventFixture('evt_isolated' + index));
  const claimed = (await Promise.all(Array.from({ length: 20 }, (_, index) => (index % 2 ? f.second : f.repository).claimPaymentJob({ workerId: 'worker-' + index, nowMs: f.now(), leaseMs: 5000 })))).filter(Boolean);
  assert.equal(claimed.length, 4); assert.equal(new Set(claimed.map(row => row.id)).size, 4); assert.equal(new Set(claimed.map(row => row.leaseToken)).size, 4);
  assert.equal(claimed.every(row => row.attempts === 1), true);
});

test('a reused claim nonce cannot return somebody else\'s existing lease when the CAS changed no row', async t => {
  const f = await fixture(t); await f.repository.enqueuePaymentEvent(eventFixture());
  const fixedNonce = () => 'isolated-reused-lease-token';
  const first = new D1CommerceRepository({ db: f.db, scope: SCOPE, clock: f.now, uuid: fixedNonce }); await first.migrate();
  const second = new D1CommerceRepository({ db: f.secondDb, scope: SCOPE, clock: f.now, uuid: fixedNonce }); await second.migrate();
  const claimed = await first.claimPaymentJob({ workerId: 'first-worker', nowMs: f.now(), leaseMs: 1000 });
  assert.equal(claimed.workerId, 'first-worker');
  assert.equal(await second.claimPaymentJob({ workerId: 'second-worker', nowMs: f.now(), leaseMs: 1000 }), null);
});

test('same worker ID cannot complete or fail a replacement lease using its old claim token', async t => {
  const f = await fixture(t); await f.repository.enqueuePaymentEvent(eventFixture());
  const old = await f.repository.claimPaymentJob({ workerId: 'same-worker', nowMs: f.now(), leaseMs: 1000 }); f.advance(1001);
  const current = await f.second.claimPaymentJob({ workerId: 'same-worker', nowMs: f.now(), leaseMs: 1000 });
  assert.notEqual(old.leaseToken, current.leaseToken); assert.equal(current.attempts, 2);
  await assert.rejects(f.repository.completePaymentJob({ jobId: old.id, workerId: 'same-worker', leaseToken: old.leaseToken }), errorCode('PAYMENT_JOB_LEASE_CONFLICT'));
  await assert.rejects(f.repository.failPaymentJob({ jobId: old.id, workerId: 'same-worker', leaseToken: old.leaseToken, nowMs: f.now(), code: 'OLD_WORKER', retryable: true }), errorCode('PAYMENT_JOB_LEASE_CONFLICT'));
  assert.equal((await f.second.completePaymentJob({ jobId: current.id, workerId: 'same-worker', leaseToken: current.leaseToken })).state, 'completed');
});

test('bounded retries respect SQL backoff and terminate in a durable dead letter after five attempts', async t => {
  const f = await fixture(t), event = await f.repository.enqueuePaymentEvent(eventFixture());
  for (let attempt = 1; attempt <= 5; attempt++) {
    const claimed = await f.repository.claimPaymentJob({ workerId: 'worker', nowMs: f.now(), leaseMs: 5000 }); assert.equal(claimed.attempts, attempt);
    const failed = await f.repository.failPaymentJob({ jobId: claimed.id, workerId: 'worker', leaseToken: claimed.leaseToken, nowMs: f.now(), code: 'TRANSIENT_PROVIDER', retryable: true });
    assert.equal(failed.state, attempt < 5 ? 'pending' : 'dead_letter');
    assert.equal(await f.repository.claimPaymentJob({ workerId: 'early', nowMs: f.now(), leaseMs: 5000 }), null);
    f.advance(failed.availableAt - f.now());
  }
  assert.equal((await f.repository.getPaymentJob(event.id)).state, 'dead_letter');
  await f.repository.enqueuePaymentEvent(eventFixture());
  assert.equal((await f.repository.getPaymentJob(event.id)).attempts, 5);
});

test('five abandoned leases are dead-lettered without leaving a permanently processing row', async t => {
  const f = await fixture(t), event = await f.repository.enqueuePaymentEvent(eventFixture());
  for (let attempt = 1; attempt <= 5; attempt++) { const claimed = await f.repository.claimPaymentJob({ workerId: 'worker', nowMs: f.now(), leaseMs: 10 }); assert.equal(claimed.attempts, attempt); f.advance(11); }
  assert.equal(await f.repository.claimPaymentJob({ workerId: 'worker', nowMs: f.now(), leaseMs: 10 }), null);
  const result = await f.repository.getPaymentJob(event.id); assert.equal(result.state, 'dead_letter'); assert.equal(result.lastErrorCode, 'LEASE_ATTEMPTS_EXHAUSTED');
});

test('account, test/live mode and Printful store scopes isolate identical identifiers', async t => {
  const f = await fixture(t), scopes = [SCOPE, { ...SCOPE, stripeAccountId: 'acct_otherIsolated123' }, { ...SCOPE, mode: 'live' }, { ...SCOPE, printfulStoreId: 999 }];
  const repositories = await Promise.all(scopes.map(scope => f.scoped(scope))), order = orderFixture('identical-order');
  for (const [index, repository] of repositories.entries()) {
    assert.equal(await repository.getOrder(order.id), null);
    await repository.createOrder({ ...order, totalMinor: order.totalMinor + index }); await repository.bindStripeSession({ orderId: order.id, quoteHash: order.quoteHash, sessionId: 'cs_test_identical' });
    assert.equal((await repository.claimDraft(reservation(order.id))).acquired, true);
    assert.equal((await repository.enqueuePaymentEvent({ ...eventFixture(), created: eventFixture().created + index })).duplicate, false);
    assert.equal((await repository.getOrderByStripeSession('cs_test_identical')).totalMinor, order.totalMinor + index);
  }
  assert.equal(f.db.db.prepare('SELECT count(*) AS count FROM commerce_d1_orders').get().count, 4);
  const privateOrder = orderFixture('private-to-first'); await repositories[0].createOrder(privateOrder);
  for (const repository of repositories.slice(1)) assert.equal(await repository.getOrder(privateOrder.id), null);
  const input = reservation(order.id); await repositories[0].markDraftCreated({ ...input, printfulId: 1001 });
  for (const repository of repositories.slice(1)) assert.equal((await repository.getDraft(order.id)).printfulId, null);
  for (const [index, repository] of repositories.entries()) {
    const claimed = await repository.claimPaymentJob({ workerId: 'same-worker', nowMs: f.now(), leaseMs: 1000 });
    assert.equal(claimed.created, eventFixture().created + index);
  }
});

test('identifiers are bound as data and database errors never expose SQL or customer payloads', async t => {
  const f = await fixture(t), order = orderFixture("order'; DROP TABLE commerce_d1_orders; --");
  await f.repository.createOrder(order);
  assert.equal((await f.repository.getOrder(order.id)).id, order.id);
  assert.equal(await f.repository.getOrder("' OR 1=1 --"), null);
  f.db.fault = /INSERT INTO commerce_d1_events/;
  await assert.rejects(f.repository.enqueuePaymentEvent(eventFixture()), error => error.message === 'REPOSITORY_UNAVAILABLE' && !error.stack.includes(order.recipient.name));
  assert.equal(f.db.sessions.every(mode => mode === 'first-primary'), true);
});

test('rate limits use atomic scoped counters under concurrent traffic and reset only at a new window', async t => {
  const f = await fixture(t), key = 'quote:hashed-guest-and-IP';
  const input = { key, limit: 5, windowMs: 60000, nowMs: f.now() };
  const responses = await Promise.all(Array.from({ length: 30 }, (_, index) => (index % 2 ? f.repository : f.second).consumeRateLimit(input)));
  assert.equal(responses.filter(response => response.allowed).length, 5);
  assert.equal(responses.filter(response => !response.allowed).every(response => response.remaining === 0 && response.retryAfterSeconds > 0), true);
  const other = await f.scoped({ ...SCOPE, stripeAccountId: 'acct_otherIsolated123' });
  assert.deepEqual(await other.consumeRateLimit(input), { allowed: true, remaining: 4, retryAfterSeconds: 0 });
  const nextWindow = Math.floor(input.nowMs / input.windowMs) * input.windowMs + input.windowMs;
  assert.deepEqual(await f.repository.consumeRateLimit({ ...input, nowMs: nextWindow }), { allowed: true, remaining: 4, retryAfterSeconds: 0 });
  const backwards = await f.repository.consumeRateLimit(input); assert.equal(backwards.allowed, false, 'clock rollback cannot reset or bypass the newer window');
});

test('D1 repository drives existing async payment workflow and reconciles an accepted POST after restart', async t => {
  const f = await fixture(t), order = orderFixture('workflow-order'); await f.repository.createOrder(order);
  let posts = 0, disconnected = true; const remote = new Map();
  const stripe = { async createCheckout() { return { id: 'cs_test_isolatedSession1', url: 'https://checkout.stripe.com/c/pay/synthetic' }; }, async resumeCheckout(source) { return { id: source.stripeCheckoutSessionId, url: 'https://checkout.stripe.com/c/pay/synthetic' }; }, async verifyPayment(source) { return { verified: true, status: 'paid', orderId: source.id, currency: source.currency, amountMinor: source.totalMinor, providerReference: 'pi_syntheticPayment1' }; }, verifyWebhook(raw) { return JSON.parse(new TextDecoder().decode(raw)); } };
  const printful = { async lookupOrder(externalId) { return remote.get(externalId) || null; }, async createDraft(input) { posts++; const body = draftPayload(input), result = { ...body, id: 1234, status: 'draft' }; remote.set(body.external_id, result); if (disconnected) { disconnected = false; throw new CommerceError('PRINTFUL_DRAFT_UNCERTAIN', { ambiguous: true }); } return { id: 1234, externalId: body.external_id, status: 'draft' }; } };
  const workflow = new StripeOrderWorkflow({ repository: f.repository, stripe, printful, now: f.now }); await workflow.createCheckout(order.id);
  const raw = new TextEncoder().encode(JSON.stringify({ id: 'evt_workflow1', sessionId: 'cs_test_isolatedSession1', type: 'checkout.session.completed', created: 1800000000 }));
  await workflow.acceptWebhook(raw, 'isolated-fixture');
  assert.equal((await workflow.processNextPayment({ workerId: 'first-isolate' })).status, 'retry_scheduled'); assert.equal(posts, 1);
  f.repository.close(); f.advance(1001);
  const restarted = new StripeOrderWorkflow({ repository: f.second, stripe, printful, now: f.now });
  assert.equal((await restarted.acceptWebhook(raw, 'isolated-fixture')).duplicate, true);
  assert.equal((await restarted.processNextPayment({ workerId: 'second-isolate' })).status, 'draft_created'); assert.equal(posts, 1);
  const paidService = new DraftOrderService({ repository: f.second, client: printful, verifyPayment: stripe.verifyPayment });
  assert.equal((await paidService.createForPaidOrder(order.id)).id, 1234); assert.equal(posts, 1);
});
