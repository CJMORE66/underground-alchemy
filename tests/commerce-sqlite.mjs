/* Actual private on-disk SQLite integration tests; no provider/account requests. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { SqliteCommerceRepository } from '../server/commerce/sqlite-repository.js';

const hash = digit => digit.repeat(64);
const order = (id = 'order-one', quoteHash = hash('1')) => ({
  id, quoteHash, totalMinor: 3250, currency: 'EUR', shippingId: 'STANDARD',
  recipient: { name: 'Synthetic Customer', address1: '1 Test Street', city: 'Paris', zip: '75001', country_code: 'FR' },
  items: [{ sync_variant_id: 1001, quantity: 1 }],
  pricedLines: [{ unitAmountMinor: 2500, quantity: 1 }], shippingMinor: 500, taxMinor: 250
});
const reservation = (id = 'order-one', suffix = '1') => ({ orderId: id, externalId: 'ua_' + suffix, payloadHash: hash(suffix), paymentReference: 'pi_' + suffix });
const event = (id = 'evt_one', sessionId = 'cs_test_one') => ({ eventId: id, sessionId, type: 'checkout.session.completed', created: 12345678 });
const hydrated = (source, sessionId = null) => ({ ...source, stripeCheckoutSessionId: sessionId });
const safeError = code => error => error?.code === code;

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'ua-commerce-sqlite-'));
  const filename = join(directory, 'commerce.sqlite');
  let time = 100000;
  const connections = [];
  const open = () => {
    const repository = new SqliteCommerceRepository({ filename, clock: () => time });
    connections.push(repository);
    return repository;
  };
  t.after(() => {
    for (const repository of connections) { try { repository.close(); } catch {} }
    rmSync(directory, { recursive: true, force: true });
  });
  return { directory, filename, open, setTime: value => { time = value; }, getTime: () => time };
}

test('explicit migration, durable reopen, private permissions, and no request-time schema creation', t => {
  const f = fixture(t), r = f.open();
  assert.throws(() => r.getOrder('order-one'), safeError('REPOSITORY_MIGRATION_REQUIRED'));
  assert.deepEqual(r.migrate(), { version: 1 });
  assert.deepEqual(r.migrate(), { version: 1 });
  r.createOrder(order());
  r.close();
  const reopened = f.open(); reopened.migrate();
  assert.deepEqual(reopened.getOrder('order-one'), hydrated(order()));
  for (const name of readdirSync(f.directory)) assert.equal(statSync(join(f.directory, name)).mode & 0o077, 0, name);
  assert.throws(() => new SqliteCommerceRepository({ filename: ':memory:' }), safeError('PRIVATE_DATABASE_PATH_REQUIRED'));
  chmodSync(f.directory, 0o755);
  assert.throws(() => f.open(), safeError('PRIVATE_DATABASE_PATH_REQUIRED'));
  chmodSync(f.directory, 0o700);
});

test('orders are immutable, key-order independent, and reads cannot mutate persisted values', t => {
  const f = fixture(t), r = f.open(); r.migrate();
  const original = order(); r.createOrder(original);
  const reordered = Object.fromEntries(Object.entries(original).reverse());
  assert.deepEqual(r.createOrder(reordered), hydrated(original));
  const read = r.getOrder(original.id); read.recipient.city = 'Changed'; read.items[0].quantity = 99;
  assert.deepEqual(r.getOrder(original.id), hydrated(original));
  assert.throws(() => r.createOrder({ ...original, stripeCheckoutSessionId: 'cs_forged' }), safeError('STRIPE_SESSION_BINDING_CONFLICT'));
  assert.throws(() => r.createOrder({ ...original, totalMinor: 1 }), safeError('IMMUTABLE_ORDER_CONFLICT'));
  const db = new DatabaseSync(f.filename);
  try {
    assert.throws(() => db.prepare("UPDATE commerce_orders SET total_minor = 1 WHERE id = ?").run(original.id));
    assert.throws(() => db.prepare('DELETE FROM commerce_orders WHERE id = ?').run(original.id));
  } finally { db.close(); }
  assert.deepEqual(r.getOrder(original.id), hydrated(original));
});

test('Stripe session binding is unique and bound to the immutable quote', t => {
  const f = fixture(t), first = f.open(), second = f.open(); first.migrate(); second.migrate();
  first.createOrder(order()); first.createOrder(order('order-two', hash('2')));
  const input = { orderId: 'order-one', quoteHash: hash('1'), sessionId: 'cs_test_one' };
  first.bindStripeSession(input); second.bindStripeSession(input);
  assert.deepEqual(second.getOrderByStripeSession('cs_test_one'), hydrated(order(), 'cs_test_one'));
  assert.equal(second.getOrder('order-one').stripeCheckoutSessionId, 'cs_test_one');
  const db = new DatabaseSync(f.filename);
  assert.equal(JSON.parse(db.prepare('SELECT order_json FROM commerce_orders WHERE id = ?').get('order-one').order_json).stripeCheckoutSessionId, undefined);
  db.close();
  assert.equal(second.getOrderByStripeSession('cs_test_unknown'), null);
  for (const changed of [
    { ...input, quoteHash: hash('3') }, { ...input, sessionId: 'cs_test_two' },
    { ...input, orderId: 'order-two', quoteHash: hash('2') }, { ...input, orderId: 'missing' }
  ]) assert.throws(() => second.bindStripeSession(changed), safeError('STRIPE_SESSION_BINDING_CONFLICT'));
});

test('draft reservations survive restart, stay reserved after uncertainty, and reject changed identity', t => {
  const f = fixture(t), first = f.open(); first.migrate(); first.createOrder(order());
  assert.equal(first.claimDraft(reservation()).acquired, true);
  first.recordDraftFailure({ orderId: 'order-one', externalId: 'ua_1', code: 'PRINTFUL_TIMEOUT', ambiguous: true });
  first.close();
  const second = f.open(); second.migrate();
  assert.equal(second.claimDraft(reservation()).acquired, false);
  assert.equal(second.getDraft('order-one').state, 'uncertain');
  second.recordDraftFailure({ orderId: 'order-one', externalId: 'ua_1', code: 'LOOKUP_EMPTY', ambiguous: false });
  assert.equal(second.getDraft('order-one').state, 'uncertain');
  for (const changed of [{ payloadHash: hash('2') }, { paymentReference: 'pi_changed' }, { externalId: 'ua_changed' }]) {
    assert.throws(() => second.claimDraft({ ...reservation(), ...changed }), safeError('DRAFT_RESERVATION_CONFLICT'));
  }
  second.markDraftCreated({ ...reservation(), printfulId: 9001 });
  assert.equal(second.getDraft('order-one').state, 'created');
  second.recordDraftFailure({ orderId: 'order-one', externalId: 'ua_1', code: 'LATE_ERROR', ambiguous: true });
  assert.equal(second.getDraft('order-one').state, 'created');
  assert.throws(() => second.markDraftCreated({ ...reservation(), printfulId: 9002 }), safeError('DRAFT_RESERVATION_CONFLICT'));
  assert.equal(second.getDraft('order-one').printfulId, 9001);
});

test('draft unique keys roll back conflicts without replacing another reservation', t => {
  const f = fixture(t), r = f.open(); r.migrate(); r.createOrder(order()); r.createOrder(order('order-two', hash('2')));
  r.claimDraft(reservation());
  for (const changed of [{ externalId: 'ua_1' }, { payloadHash: hash('1') }, { paymentReference: 'pi_1' }]) {
    assert.throws(() => r.claimDraft({ ...reservation('order-two', '2'), ...changed }), safeError('REPOSITORY_WRITE_CONFLICT'));
    assert.equal(r.getDraft('order-two'), null);
  }
  assert.equal(r.claimDraft(reservation('order-two', '2')).acquired, true);
  r.markDraftCreated({ ...reservation(), printfulId: 9001 });
  assert.throws(() => r.markDraftCreated({ ...reservation('order-two', '2'), printfulId: 9001 }), safeError('REPOSITORY_WRITE_CONFLICT'));
  assert.equal(r.getDraft('order-two').state, 'reserved');
});

test('concurrent processes sharing an actual SQLite file acquire exactly one draft reservation', async t => {
  const f = fixture(t), r = f.open(); r.migrate(); r.createOrder(order());
  const moduleUrl = new URL('../server/commerce/sqlite-repository.js', import.meta.url).href;
  const script = `import {SqliteCommerceRepository} from ${JSON.stringify(moduleUrl)};
    const r = new SqliteCommerceRepository({filename:process.env.COMMERCE_TEST_DB});r.migrate();
    process.stdout.write(JSON.stringify(r.claimDraft(${JSON.stringify(reservation())})));r.close();`;
  const run = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, COMMERCE_TEST_DB: f.filename }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', error = '';
    child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { error += chunk; });
    child.on('error', reject); child.on('close', code => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(error || 'SQLite child failed')));
  });
  const claims = await Promise.all(Array.from({ length: 8 }, run));
  assert.equal(claims.filter(claim => claim.acquired).length, 1);
  assert.equal(claims.filter(claim => !claim.acquired).length, 7);
  assert.equal(r.getDraft('order-one').state, 'reserved');
});

test('verified event inbox and outbox are atomic, durable, deduplicated and tolerate early delivery', t => {
  const f = fixture(t), first = f.open(); first.migrate();
  const queued = first.enqueuePaymentEvent(event());
  assert.equal(queued.duplicate, false); assert.equal(queued.state, 'pending');
  assert.equal(first.getOrderByStripeSession('cs_test_one'), null);
  first.close();
  const second = f.open(); second.migrate();
  const duplicate = second.enqueuePaymentEvent(event());
  assert.equal(duplicate.id, queued.id); assert.equal(duplicate.duplicate, true);
  for (const changed of [{ sessionId: 'cs_other' }, { type: 'changed' }, { created: 123 }]) {
    assert.throws(() => second.enqueuePaymentEvent({ ...event(), ...changed }), safeError('PAYMENT_EVENT_CONFLICT'));
  }
  const job = second.claimPaymentJob({ workerId: 'worker-one', nowMs: f.getTime(), leaseMs: 1000 });
  assert.equal(job.eventId, event().eventId); assert.equal(job.attempts, 1);
  second.failPaymentJob({ jobId: job.id, workerId: 'worker-one', leaseToken: job.leaseToken, code: 'SESSION_NOT_BOUND', retryable: true, nowMs: f.getTime() });
  assert.equal(second.getPaymentJob(job.id).state, 'pending');
  second.createOrder(order()); second.bindStripeSession({ orderId: 'order-one', quoteHash: hash('1'), sessionId: 'cs_test_one' });
  f.setTime(f.getTime() + 1000);
  const retried = second.claimPaymentJob({ workerId: 'worker-two', nowMs: f.getTime(), leaseMs: 1000 });
  assert.equal(retried.id, queued.id); assert.equal(retried.attempts, 2);
  assert.equal(second.getOrderByStripeSession(retried.sessionId).id, 'order-one');
  second.completePaymentJob({ jobId: retried.id, workerId: 'worker-two', leaseToken: retried.leaseToken });
  assert.equal(second.getPaymentJob(retried.id).state, 'completed');
  assert.equal(second.claimPaymentJob({ workerId: 'worker-two', nowMs: f.getTime(), leaseMs: 1000 }), null);
});

test('a failed outbox insertion rolls the event insertion back', t => {
  const f = fixture(t), r = f.open(); r.migrate();
  const db = new DatabaseSync(f.filename);
  db.exec("CREATE TRIGGER injected_job_failure BEFORE INSERT ON commerce_payment_jobs BEGIN SELECT RAISE(ABORT, 'injected failure'); END;");
  assert.throws(() => r.enqueuePaymentEvent(event()), safeError('REPOSITORY_WRITE_CONFLICT'));
  assert.equal(db.prepare('SELECT count(*) AS count FROM commerce_payment_events').get().count, 0);
  db.exec('DROP TRIGGER injected_job_failure'); db.close();
  assert.equal(r.enqueuePaymentEvent(event()).duplicate, false);
});

test('job leases are atomic between connections and expired workers cannot acknowledge', t => {
  const f = fixture(t), first = f.open(), second = f.open(); first.migrate(); second.migrate();
  const queued = first.enqueuePaymentEvent(event());
  const claimed = first.claimPaymentJob({ workerId: 'worker-one', nowMs: f.getTime(), leaseMs: 1000 });
  assert.equal(second.claimPaymentJob({ workerId: 'worker-two', nowMs: f.getTime(), leaseMs: 1000 }), null);
  assert.throws(() => second.completePaymentJob({ jobId: queued.id, workerId: 'worker-two', leaseToken: claimed.leaseToken }), safeError('PAYMENT_JOB_LEASE_CONFLICT'));
  f.setTime(claimed.leaseExpiresAt);
  assert.throws(() => first.completePaymentJob({ jobId: queued.id, workerId: 'worker-one', leaseToken: claimed.leaseToken }), safeError('PAYMENT_JOB_LEASE_CONFLICT'));
  const reclaimed = second.claimPaymentJob({ workerId: 'worker-two', nowMs: f.getTime(), leaseMs: 1000 });
  assert.equal(reclaimed.attempts, 2);
  assert.throws(() => first.failPaymentJob({ jobId: queued.id, workerId: 'worker-one', leaseToken: claimed.leaseToken, code: 'STALE', retryable: true, nowMs: f.getTime() }), safeError('PAYMENT_JOB_LEASE_CONFLICT'));
  second.completePaymentJob({ jobId: queued.id, workerId: 'worker-two', leaseToken: reclaimed.leaseToken });
});

test('retry backoff is durable and capped at five attempts before dead-letter', t => {
  const f = fixture(t), r = f.open(); r.migrate(); const queued = r.enqueuePaymentEvent(event());
  for (let attempt = 1; attempt <= 5; attempt++) {
    const job = r.claimPaymentJob({ workerId: 'retry-worker', nowMs: f.getTime(), leaseMs: 1000 });
    assert.equal(job.attempts, attempt);
    const failed = r.failPaymentJob({ jobId: job.id, workerId: 'retry-worker', leaseToken: job.leaseToken, code: 'PROVIDER_UNAVAILABLE', retryable: true, nowMs: f.getTime() });
    assert.equal(failed.state, attempt < 5 ? 'pending' : 'dead_letter');
    assert.equal(failed.availableAt, f.getTime() + 1000 * 2 ** (attempt - 1));
    assert.equal(r.claimPaymentJob({ workerId: 'other', nowMs: f.getTime(), leaseMs: 1000 }), null);
    f.setTime(failed.availableAt);
  }
  r.close(); const reopened = f.open(); reopened.migrate();
  assert.equal(reopened.getPaymentJob(queued.id).state, 'dead_letter');
  assert.equal(reopened.getPaymentJob(queued.id).attempts, 5);
  assert.equal(reopened.claimPaymentJob({ workerId: 'other', nowMs: f.getTime(), leaseMs: 1000 }), null);
});

test('process crashes exhaust expired leases without releasing an uncertain draft', t => {
  const f = fixture(t), r = f.open(); r.migrate(); r.createOrder(order()); r.claimDraft(reservation());
  r.recordDraftFailure({ orderId: 'order-one', externalId: 'ua_1', code: 'PRINTFUL_TIMEOUT', ambiguous: true });
  const queued = r.enqueuePaymentEvent(event());
  for (let attempt = 1; attempt <= 5; attempt++) {
    const job = r.claimPaymentJob({ workerId: 'crashing-worker-' + attempt, nowMs: f.getTime(), leaseMs: 1000 });
    assert.equal(job.attempts, attempt); f.setTime(job.leaseExpiresAt);
  }
  assert.equal(r.claimPaymentJob({ workerId: 'sixth-worker', nowMs: f.getTime(), leaseMs: 1000 }), null);
  assert.equal(r.getPaymentJob(queued.id).state, 'dead_letter');
  assert.equal(r.claimDraft(reservation()).acquired, false);
  assert.equal(r.getDraft('order-one').state, 'uncertain');
});

test('a same-worker lease reclaim has a new token and rejects stale acknowledgements', t => {
  const f = fixture(t), r = f.open(); r.migrate(); r.enqueuePaymentEvent(event());
  const first = r.claimPaymentJob({ workerId: 'same-worker', nowMs: f.getTime(), leaseMs: 1000 });
  f.setTime(first.leaseExpiresAt);
  const next = r.claimPaymentJob({ workerId: 'same-worker', nowMs: f.getTime(), leaseMs: 1000 });
  assert.notEqual(first.leaseToken, next.leaseToken);
  assert.throws(() => r.completePaymentJob({ jobId: first.id, workerId: 'same-worker', leaseToken: first.leaseToken }), safeError('PAYMENT_JOB_LEASE_CONFLICT'));
  assert.throws(() => r.failPaymentJob({ jobId: first.id, workerId: 'same-worker', leaseToken: first.leaseToken, code: 'STALE_FAILURE', retryable: true, nowMs: f.getTime() }), safeError('PAYMENT_JOB_LEASE_CONFLICT'));
  assert.equal(r.getPaymentJob(first.id).state, 'processing');
  r.completePaymentJob({ jobId: next.id, workerId: 'same-worker', leaseToken: next.leaseToken });
  assert.equal(r.getPaymentJob(first.id).state, 'completed');
});

test('a failed pre-POST lookup can recover, while a durable POST attempt can never reacquire', t => {
  const f = fixture(t), first = f.open(); first.migrate(); first.createOrder(order());
  const claim = first.claimDraft(reservation());
  assert.equal(claim.attempted, false);
  first.recordDraftFailure({ orderId: 'order-one', externalId: 'ua_1', code: 'PRINTFUL_LOOKUP_TIMEOUT', ambiguous: true });
  first.close();
  const reopened = f.open(); reopened.migrate();
  assert.equal(reopened.claimDraft(reservation()).acquired, false);
  assert.equal(reopened.getDraft('order-one').attempted, false);
  assert.throws(() => reopened.beginDraftAttempt({ ...reservation(), payloadHash: hash('3') }), safeError('DRAFT_RESERVATION_CONFLICT'));
  const begun = reopened.beginDraftAttempt(reservation());
  assert.equal(begun.acquired, true); assert.equal(begun.attempted, true); assert.equal(begun.state, 'reserved');
  reopened.recordDraftFailure({ orderId: 'order-one', externalId: 'ua_1', code: 'PRINTFUL_POST_TIMEOUT', ambiguous: true });
  reopened.close();
  const final = f.open(); final.migrate();
  const blocked = final.beginDraftAttempt(reservation());
  assert.equal(blocked.acquired, false); assert.equal(blocked.attempted, true); assert.equal(blocked.state, 'uncertain');
});

test('multiple processes acquire exactly one durable POST-attempt gate after a preflight failure', async t => {
  const f = fixture(t), r = f.open(); r.migrate(); r.createOrder(order()); r.claimDraft(reservation());
  r.recordDraftFailure({ orderId: 'order-one', externalId: 'ua_1', code: 'LOOKUP_FAILED', ambiguous: false });
  const moduleUrl = new URL('../server/commerce/sqlite-repository.js', import.meta.url).href;
  const script = `import {SqliteCommerceRepository} from ${JSON.stringify(moduleUrl)};
    const r = new SqliteCommerceRepository({filename:process.env.COMMERCE_TEST_DB});r.migrate();
    process.stdout.write(JSON.stringify(r.beginDraftAttempt(${JSON.stringify(reservation())})));r.close();`;
  const run = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, COMMERCE_TEST_DB: f.filename }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', error = '';
    child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { error += chunk; });
    child.on('error', reject); child.on('close', code => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(error || 'SQLite child failed')));
  });
  const attempts = await Promise.all(Array.from({ length: 8 }, run));
  assert.equal(attempts.filter(value => value.acquired).length, 1);
  assert.equal(attempts.filter(value => !value.acquired).length, 7);
  assert.ok(attempts.every(value => value.attempted === true));
  assert.equal(r.getDraft('order-one').attempted, true);
});
