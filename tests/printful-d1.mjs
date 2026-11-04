/* Isolated actual SQLite/D1-shaped SQL tests; no account/provider API calls. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { D1CommerceRepository } from '../server/commerce/d1-repository.js';
import { fixture, SCOPE, hintFixture, hash, errorCode } from './printful-d1-fixture.mjs';

test('migration0003 is schema-only; native readiness requires the new durable inbox/jobs/audit', async t => {
  const f = await fixture(t), journal = JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8'));
  assert.equal(journal.entries.at(-1).tag, '0003_printful_inbox');
  const sql = readFileSync(new URL('../drizzle/0003_printful_inbox.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(sql, /^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/im);
  f.db.db.exec('DROP TABLE commerce_d1_printful_recoveries');
  await assert.rejects(f.repository.migrate(), errorCode('REPOSITORY_MIGRATION_MISMATCH'));
});

test('concurrent duplicate deliveries atomically produce one immutable receipt and one job', async t => {
  const f = await fixture(t), event = hintFixture();
  const results = await Promise.all(Array.from({ length: 20 }, (_, index) => (index % 2 ? f.repository : f.second).enqueuePrintfulEvent(event)));
  assert.equal(results.filter(row => !row.duplicate).length, 1); assert.equal(new Set(results.map(row => row.jobId)).size, 1);
  const row = results[0]; assert.equal(row.state, 'pending'); assert.equal(row.orderId, f.order.id); assert.equal(row.occurredAt, event.occurredAt);
  assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_printful_events').get().n, 1);
  assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_printful_jobs').get().n, 1);
  await assert.rejects(f.repository.enqueuePrintfulEvent({ ...event, printfulId: 2 }), errorCode('PRINTFUL_EVENT_CONFLICT'));
  await assert.rejects(f.repository.enqueuePrintfulEvent({ ...event, ownerId: 'attacker' }), errorCode('INVALID_PRINTFUL_HINT'));
  assert.equal((await f.repository.getPrintfulJob(row.jobId)).printfulId, 1001);
});

test('inbox and job admission roll back together; lost committed response recovers as duplicate', async t => {
  const f = await fixture(t), event = hintFixture(); f.db.fault = /INSERT INTO commerce_d1_printful_jobs/;
  await assert.rejects(f.repository.enqueuePrintfulEvent(event), errorCode('REPOSITORY_UNAVAILABLE'));
  assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_printful_events').get().n, 0);
  f.db.loseReply = true;
  await assert.rejects(f.repository.enqueuePrintfulEvent(event), errorCode('REPOSITORY_UNAVAILABLE'));
  const recovered = await f.second.enqueuePrintfulEvent(event); assert.equal(recovered.duplicate, true); assert.equal(recovered.state, 'pending');
});

test('unknown, wrong-external-ID and null-external-ID orders receive terminal ignored receipts with no import', async t => {
  const f = await fixture(t);
  for (const [index, change] of [{ printfulId: 9999 }, { externalId: 'ua_other' }, { externalId: null }].entries()) {
    const row = await f.repository.enqueuePrintfulEvent(hintFixture({ fingerprint: hash('unmapped-' + index), ...change }));
    assert.equal(row.state, 'ignored'); assert.equal(row.orderId, null); assert.equal(row.lastErrorCode, 'PRINTFUL_UNMAPPED_ORDER');
    assert.equal(await f.repository.claimPrintfulJob({ workerId: 'worker', nowMs: f.now(), leaseMs: 1000, jobId: row.jobId }), null);
  }
  assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_orders').get().n, 1);
  const empty = await fixture(t, { mapped: false }), ignored = await empty.repository.enqueuePrintfulEvent(hintFixture());
  await empty.repository.createOrder(empty.order); await empty.repository.claimDraft(empty.reservation); await empty.repository.markDraftCreated({ ...empty.reservation, printfulId: 1001 });
  assert.equal((await empty.repository.enqueuePrintfulEvent(hintFixture())).state, 'ignored', 'a later mapping must not silently reactivate an ignored event');
  assert.equal((await empty.repository.getPrintfulJob(ignored.jobId)).attempts, 0);
});

test('event/job keys and exact existing mappings are isolated by merchant account and test/live scope', async t => {
  const f = await fixture(t), first = await f.repository.enqueuePrintfulEvent(hintFixture());
  for (const scope of [{ ...SCOPE, stripeAccountId: 'acct_otherAccount123' }, { ...SCOPE, mode: 'live' }]) {
    const other = await f.scoped(scope); assert.equal(await other.getPrintfulJob(first.jobId), null);
    const row = await other.enqueuePrintfulEvent(hintFixture()); assert.equal(row.state, 'ignored'); assert.equal(row.duplicate, false);
    assert.equal(await other.getOrderByPrintfulMapping({ printfulId: 1001, externalId: hintFixture().externalId }), null);
  }
  const wrongStore = await f.scoped({ ...SCOPE, printfulStoreId: 9 });
  await assert.rejects(wrongStore.enqueuePrintfulEvent(hintFixture()), errorCode('PRINTFUL_EVENT_SCOPE_MISMATCH'));
});

test('claims are concurrent CAS operations, support targeting and reject reused nonce without a new claim', async t => {
  const f = await fixture(t), events = [hintFixture(), hintFixture({ fingerprint: hash('event2') })];
  const rows = await Promise.all(events.map(event => f.repository.enqueuePrintfulEvent(event)));
  const claims = await Promise.all(Array.from({ length: 10 }, (_, index) => (index % 2 ? f.repository : f.second).claimPrintfulJob({ workerId: 'worker' + index, nowMs: f.now(), leaseMs: 1000 })));
  assert.equal(claims.filter(Boolean).length, 2); assert.equal(new Set(claims.filter(Boolean).map(row => row.jobId)).size, 2);
  const own = claims.find(Boolean), reused = new D1CommerceRepository({ db: f.db, scope: SCOPE, clock: f.now, uuid: () => own.leaseToken }); await reused.migrate();
  assert.equal(await reused.claimPrintfulJob({ workerId: own.workerId, nowMs: f.now(), leaseMs: 1000 }), null);
  f.advance(1001); const targeted = await f.second.claimPrintfulJob({ workerId: 'targeted', nowMs: f.now(), leaseMs: 1000, jobId: rows[1].jobId });
  assert.equal(targeted.jobId, rows[1].jobId);
});

test('expired/replaced leases cannot complete or fail a replacement worker claim', async t => {
  const f = await fixture(t), row = await f.repository.enqueuePrintfulEvent(hintFixture());
  const old = await f.repository.claimPrintfulJob({ workerId: 'same-worker', nowMs: f.now(), leaseMs: 1000 }); f.advance(1001);
  const replacement = await f.second.claimPrintfulJob({ workerId: 'same-worker', nowMs: f.now(), leaseMs: 1000 });
  assert.notEqual(old.leaseToken, replacement.leaseToken);
  await assert.rejects(f.repository.completePrintfulJob({ jobId: row.jobId, workerId: old.workerId, leaseToken: old.leaseToken }), errorCode('PRINTFUL_JOB_LEASE_CONFLICT'));
  await assert.rejects(f.repository.failPrintfulJob({ jobId: row.jobId, workerId: old.workerId, leaseToken: old.leaseToken, code: 'ISOLATED_FAILURE', retryable: true, nowMs: f.now() }), errorCode('PRINTFUL_JOB_LEASE_CONFLICT'));
  const done = await f.second.completePrintfulJob({ jobId: row.jobId, workerId: replacement.workerId, leaseToken: replacement.leaseToken }); assert.equal(done.state, 'completed');
  assert.equal((await f.repository.enqueuePrintfulEvent(hintFixture())).state, 'completed');
});

test('provider failures back off and dead-letter after five attempts without resetting on duplicate', async t => {
  const f = await fixture(t), row = await f.repository.enqueuePrintfulEvent(hintFixture());
  for (let attempt = 1; attempt <= 5; attempt++) {
    const claimed = await f.repository.claimPrintfulJob({ workerId: 'worker', nowMs: f.now(), leaseMs: 1000, jobId: row.jobId }); assert.equal(claimed.attempts, attempt);
    const failed = await f.repository.failPrintfulJob({ jobId: row.jobId, workerId: claimed.workerId, leaseToken: claimed.leaseToken, code: 'PRINTFUL_TRANSPORT_ERROR', retryable: true, nowMs: f.now() });
    assert.equal(failed.state, attempt === 5 ? 'dead_letter' : 'pending');
    assert.equal((await f.repository.enqueuePrintfulEvent(hintFixture())).attempts, attempt);
    assert.equal(await f.repository.claimPrintfulJob({ workerId: 'early', nowMs: f.now(), leaseMs: 1000 }), null);
    f.advance(failed.availableAt - f.now());
  }
  assert.equal((await f.repository.listPrintfulJobs()).length, 1);
});

test('five abandoned leases become durable dead letters', async t => {
  const f = await fixture(t), row = await f.repository.enqueuePrintfulEvent(hintFixture());
  for (let attempt = 1; attempt <= 5; attempt++) { assert.equal((await f.repository.claimPrintfulJob({ workerId: 'crashed', nowMs: f.now(), leaseMs: 1 })).attempts, attempt); f.advance(2); }
  assert.equal(await f.repository.claimPrintfulJob({ workerId: 'next', nowMs: f.now(), leaseMs: 1000 }), null);
  assert.equal((await f.repository.getPrintfulJob(row.jobId)).lastErrorCode, 'LEASE_ATTEMPTS_EXHAUSTED');
});

test('authorized server requeue CAS and hashed audit commit atomically and preserve draft mutation gates', async t => {
  const f = await fixture(t), row = await f.repository.enqueuePrintfulEvent(hintFixture()), claimed = await f.repository.claimPrintfulJob({ workerId: 'worker', nowMs: f.now(), leaseMs: 1000 });
  const dead = await f.repository.failPrintfulJob({ jobId: row.jobId, workerId: claimed.workerId, leaseToken: claimed.leaseToken, code: 'ISOLATED_FAILURE', retryable: false, nowMs: f.now() });
  const before = await f.repository.getDraft(f.order.id), input = { jobId: row.jobId, expectedUpdatedAt: dead.updatedAt, expectedRecoveryCount: 0, actorHash: hash('isolated-operator'), reasonCode: 'PROVIDER_RECOVERED' };
  f.db.fault = /INSERT INTO commerce_d1_printful_recoveries/;
  await assert.rejects(f.repository.retryPrintfulJob(input), errorCode('REPOSITORY_UNAVAILABLE'));
  assert.equal((await f.repository.getPrintfulJob(row.jobId)).state, 'dead_letter');
  const results = await Promise.allSettled([f.repository.retryPrintfulJob(input), f.second.retryPrintfulJob(input)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const audit = f.db.db.prepare('SELECT * FROM commerce_d1_printful_recoveries').all(); assert.equal(audit.length, 1); assert.equal(audit[0].actor_hash, input.actorHash);
  assert.equal((await f.repository.getPrintfulJob(row.jobId)).recoveryCount, 1);
  assert.deepEqual(await f.repository.getDraft(f.order.id), before);
  const next = await f.repository.claimPrintfulJob({ workerId: 'next', nowMs: f.now(), leaseMs: 1000 });
  await f.repository.failPrintfulJob({ jobId: row.jobId, workerId: next.workerId, leaseToken: next.leaseToken, code: 'ISOLATED_FAILURE', retryable: false, nowMs: f.now() });
  await assert.rejects(f.repository.retryPrintfulJob(input), errorCode('PRINTFUL_RECOVERY_CONFLICT'), 'recovery generation protects against same-ms replay');
});
