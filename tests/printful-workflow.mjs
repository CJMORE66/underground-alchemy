/* Integration uses real local SQLite transactions and isolated Printful transport.
 * Injected verifier fixtures are NOT proof of provider webhook authentication;
 * actual raw-body HMAC is exercised separately in printful webhook tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { PrintfulOrderWorkflow, normalizePrintfulHint } from '../server/commerce/printful-workflow.js';
import { verifyPrintfulV2Webhook } from '../server/commerce/printful-webhook.js';
import { PrintfulClient } from '../server/commerce/printful.js';
import { CommerceError } from '../server/commerce/validation.js';
import { fixture, hintFixture, hash, errorCode } from './printful-d1-fixture.mjs';

function isolatedProvider(f) {
  const remote = { id: 1001, external_id: f.reservation.externalId, created: Math.floor(f.now() / 1000) - 1000, updated: Math.floor(f.now() / 1000), status: 'draft', items: [{ id: 10, sync_variant_id: 101, quantity: 1 }], shipments: [], recipient: f.order.recipient };
  const requests = []; let failing = false;
  const printful = new PrintfulClient({ token: 'isolated-not-real-token', retryLimit: 0, fetch: async (source, init) => {
    const url = new URL(source); requests.push({ path: url.pathname, method: init.method }); assert.equal(url.origin, 'https://api.printful.com'); assert.equal(init.method, 'GET', 'this workflow must never write to Printful');
    if (failing) throw new Error('isolated upstream failure with unlogged fixture details');
    if (url.pathname === '/stores') return Response.json({ code: 200, result: [{ id: 18912189 }] });
    assert.equal(url.pathname, '/orders/@' + f.reservation.externalId); return Response.json({ code: 200, result: structuredClone(remote) });
  } });
  return { printful, remote, requests, fail(value = true) { failing = value; } };
}
const make = (f, p, options = {}) => new PrintfulOrderWorkflow({ repository: f.repository, printful: p?.printful, verifyWebhook: async hint => hint, now: f.now, ...options });

test('real raw-body HMAC flows through durable SQL admission and GET-only reconciliation; signed retries deduplicate', async t => {
  const f = await fixture(t), p = isolatedProvider(f), secretHex = '17'.repeat(32), publicKey = Buffer.from('isolated-routing-key').toString('base64');
  const verifyWebhook = ({ raw, publicKey: receivedKey, signature }) => verifyPrintfulV2Webhook({ raw, publicKey: receivedKey, signature, expectedPublicKey: publicKey, secretHex, expectedStoreId: 18912189 });
  const workflow = make(f, p, { verifyWebhook }), event = { type: 'order_updated', occurred_at: hintFixture().occurredAt, retries: 0, store_id: 18912189, data: { order: { id: 1001, external_id: f.reservation.externalId, status: 'fulfilled' }, private_customer: f.order.recipient } };
  const signed = value => { const raw = new TextEncoder().encode(JSON.stringify(value)); return { raw, publicKey, signature: createHmac('sha256', Buffer.from(secretHex, 'hex')).update(raw).digest('hex') }; };
  const first = await workflow.acceptWebhook(signed(event));
  assert.equal((await workflow.processNext({ workerId: 'verified', jobId: first.jobId })).status, 'reconciled');
  const replay = await workflow.acceptWebhook(signed({ ...event, retries: 4 }));
  assert.equal(replay.duplicate, true); assert.equal(replay.jobId, first.jobId); assert.equal(replay.state, 'completed');
  assert.equal((await f.repository.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId })).projection.status, 'draft');
  assert.doesNotMatch(JSON.stringify(f.db.db.prepare('SELECT * FROM commerce_d1_printful_events').all()), /Synthetic Street|Isolated Customer|private_customer|signature/);
  assert.equal(p.requests.length, 2);
});

test('admission requires the trusted verifier and supported normalized hints, never a client verified/paid flag', async t => {
  const f = await fixture(t), p = isolatedProvider(f), rejecting = make(f, p, { verifyWebhook: async () => { throw Error('isolated rejected signature'); } });
  await assert.rejects(rejecting.acceptWebhook({ verified: true, paid: true, ...hintFixture() }), errorCode('PRINTFUL_WEBHOOK_REJECTED'));
  const misconfigured = make(f, p, { verifyWebhook: async () => { throw new CommerceError('PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED', { status: 503 }); } });
  await assert.rejects(misconfigured.acceptWebhook(hintFixture()), error => error.code === 'PRINTFUL_WEBHOOK_CONFIGURATION_REQUIRED' && error.status === 503);
  assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_printful_events').get().n, 0);
  const workflow = make(f, p);
  await assert.rejects(workflow.acceptWebhook({ ...hintFixture(), ownerId: 'other-owner' }), errorCode('INVALID_PRINTFUL_HINT'));
  assert.deepEqual(await workflow.acceptWebhook({ ignored: true }), { received: true, ignored: true });
  assert.equal(p.requests.length, 0);
  assert.throws(() => normalizePrintfulHint({ ...hintFixture(), type: 'shipment_sent' }), errorCode('INVALID_PRINTFUL_HINT'));
});

test('valid hints are durably admitted without a runtime provider token and consume no processing attempt', async t => {
  const f = await fixture(t), workflow = make(f, null), accepted = await workflow.acceptWebhook(hintFixture());
  assert.equal(accepted.state, 'pending');
  await assert.rejects(workflow.processNext({ workerId: 'worker', jobId: accepted.jobId }), errorCode('PRINTFUL_TOKEN_REQUIRED'));
  assert.equal((await f.repository.getPrintfulJob(accepted.jobId)).attempts, 0);
});

test('reconciliation derives owner from persisted mapping and uses fresh provider state, never event payment/refund inference', async t => {
  const f = await fixture(t), p = isolatedProvider(f), workflow = make(f, p, { verifyWebhook: async () => hintFixture({ type: 'order_refunded' }) });
  const before = await f.repository.getDraft(f.order.id), accepted = await workflow.acceptWebhook({ ownerId: 'attacker', paid: true, status: 'refunded' });
  assert.equal((await workflow.processNext({ workerId: 'worker', jobId: accepted.jobId })).status, 'reconciled');
  const projection = await f.repository.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId });
  assert.equal(projection.projection.status, 'draft'); assert.equal((await f.repository.getPrintfulJob(accepted.jobId)).state, 'completed');
  assert.deepEqual(await f.repository.getDraft(f.order.id), before);
  assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_orders').get().n, 1);
  assert.deepEqual(p.requests, [{ path: '/stores', method: 'GET' }, { path: '/orders/@' + f.reservation.externalId, method: 'GET' }]);
  const eventRow = f.db.db.prepare('SELECT * FROM commerce_d1_printful_events').get();
  assert.doesNotMatch(JSON.stringify(eventRow), /Isolated Customer|Synthetic Street|recipient|paid|refunded.*true|attacker/);
});

test('unmapped signed orders are terminal ignored without provider reads or automatic order import', async t => {
  const f = await fixture(t, { mapped: false }), p = isolatedProvider(f), workflow = make(f, p), accepted = await workflow.acceptWebhook(hintFixture());
  assert.equal(accepted.ignored, true); assert.equal(accepted.state, 'ignored');
  assert.equal((await workflow.processNext({ workerId: 'worker', jobId: accepted.jobId })).status, 'idle');
  assert.equal(p.requests.length, 0); assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_orders').get().n, 0);
});

test('temporary provider errors retain a pending job and recover by GET after backoff', async t => {
  const f = await fixture(t), p = isolatedProvider(f), workflow = make(f, p), accepted = await workflow.acceptWebhook(hintFixture()); p.fail();
  assert.equal((await workflow.processNext({ workerId: 'first', jobId: accepted.jobId })).status, 'retry_scheduled');
  assert.equal((await f.repository.getPrintfulJob(accepted.jobId)).state, 'pending');
  assert.equal((await workflow.processNext({ workerId: 'early', jobId: accepted.jobId })).status, 'idle');
  p.fail(false); f.advance(1001);
  assert.equal((await workflow.processNext({ workerId: 'retry', jobId: accepted.jobId })).status, 'reconciled');
  assert.equal((await f.repository.getPrintfulJob(accepted.jobId)).attempts, 2);
  assert.equal(p.requests.every(request => request.method === 'GET'), true);
});

test('remote mapping/item failures dead-letter without changing a projection or opening any mutation gate', async t => {
  const f = await fixture(t), p = isolatedProvider(f), workflow = make(f, p), accepted = await workflow.acceptWebhook(hintFixture()); p.remote.id = 9999;
  const result = await workflow.processNext({ workerId: 'worker', jobId: accepted.jobId }); assert.equal(result.status, 'dead_letter');
  assert.equal(await f.repository.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId }), null);
  assert.equal((await f.repository.getDraft(f.order.id)).state, 'created');
  assert.equal((await workflow.acceptWebhook(hintFixture())).state, 'dead_letter');
});

test('a lost completion reply is recovered from durable terminal state without repeated provider processing', async t => {
  const f = await fixture(t), p = isolatedProvider(f), workflow = make(f, p), accepted = await workflow.acceptWebhook(hintFixture());
  const original = f.repository.completePrintfulJob.bind(f.repository); let disconnected = true;
  f.repository.completePrintfulJob = async input => { const result = await original(input); if (disconnected) { disconnected = false; throw new CommerceError('REPOSITORY_UNAVAILABLE', { retryable: true }); } return result; };
  assert.equal((await workflow.processNext({ workerId: 'worker', jobId: accepted.jobId })).status, 'reconciled');
  assert.equal((await workflow.acceptWebhook(hintFixture())).state, 'completed');
  assert.equal((await workflow.processNext({ workerId: 'redelivery', jobId: accepted.jobId })).status, 'idle'); assert.equal(p.requests.length, 2);
});

test('concurrent out-of-order provider replies cannot replace a newer durable status', async t => {
  const f = await fixture(t), oldProvider = isolatedProvider(f), newProvider = isolatedProvider(f);
  let releaseOld, oldRead;
  const oldReady = new Promise(resolve => { oldRead = resolve; }), blocked = new Promise(resolve => { releaseOld = resolve; });
  const oldPrintful = { verifyStore: () => oldProvider.printful.verifyStore(), async lookupOrder(externalId) { const result = await oldProvider.printful.lookupOrder(externalId); oldRead(); await blocked; return result; } };
  newProvider.remote.updated++; newProvider.remote.status = 'fulfilled';
  const first = make(f, { printful: oldPrintful }), second = make(f, newProvider, { repository: f.second });
  const accepted1 = await first.acceptWebhook(hintFixture()), accepted2 = await second.acceptWebhook(hintFixture({ fingerprint: hash('newer-event') }));
  const delayed = first.processNext({ workerId: 'old', jobId: accepted1.jobId }); await oldReady;
  assert.equal((await second.processNext({ workerId: 'new', jobId: accepted2.jobId })).status, 'reconciled'); releaseOld();
  assert.equal((await delayed).status, 'reconciled');
  const record = await f.repository.getFulfillmentProjection(f.order.id, { ownerId: f.order.ownerId });
  assert.equal(record.projection.status, 'fulfilled'); assert.equal(record.providerUpdatedAt, newProvider.remote.updated);
});

test('bounded server drain and explicit authorized retry preserve failed-job audit and immutable order data', async t => {
  const f = await fixture(t), p = isolatedProvider(f), workflow = make(f, p);
  for (let index = 0; index < 3; index++) await workflow.acceptWebhook(hintFixture({ fingerprint: hash('drain-' + index) }));
  assert.equal((await workflow.drain({ workerId: 'drain', limit: 2 })).processed, 2);
  assert.equal((await f.repository.listPrintfulJobs({ state: 'pending' })).length, 1);
  await assert.rejects(workflow.drain({ workerId: 'drain', limit: 21 }), errorCode('INVALID_PRINTFUL_DRAIN'));
  const remaining = (await f.repository.listPrintfulJobs({ state: 'pending' }))[0]; p.remote.id = 9999;
  await workflow.processNext({ workerId: 'fail', jobId: remaining.jobId });
  const dead = await f.repository.getPrintfulJob(remaining.jobId), request = { jobId: dead.jobId, expectedUpdatedAt: dead.updatedAt, expectedRecoveryCount: dead.recoveryCount, authorization: { authorized: true } };
  await assert.rejects(workflow.retryDeadLetter(request), errorCode('PRINTFUL_RECOVERY_AUTHORIZATION_REQUIRED'));
  const denied = make(f, p, { authorizeRecovery: async () => ({ authorized: false }) });
  await assert.rejects(denied.retryDeadLetter(request), errorCode('PRINTFUL_RECOVERY_AUTHORIZATION_REQUIRED'));
  const authorized = make(f, p, { authorizeRecovery: async source => { assert.equal(source.operation, 'retry_printful_job'); return { authorized: true, actorHash: hash('isolated-operator'), reasonCode: 'MAPPING_REVIEWED' }; } });
  assert.equal((await authorized.retryDeadLetter(request)).state, 'pending');
  p.remote.id = 1001; assert.equal((await authorized.processNext({ workerId: 'recovery', jobId: dead.jobId })).status, 'reconciled');
  assert.equal(f.db.db.prepare('SELECT count(*) AS n FROM commerce_d1_printful_recoveries').get().n, 1);
  assert.equal((await f.repository.getOrder(f.order.id)).totalMinor, f.order.totalMinor);
});
