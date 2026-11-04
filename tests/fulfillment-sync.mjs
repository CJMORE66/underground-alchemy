/* Isolated provider fixtures, not verification of a real Printful lifecycle. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { FulfillmentSyncService, projectPrintfulOrder, reduceFulfillmentProjection, safeTrackingUrl } from '../server/commerce/fulfillment-sync.js';
import { PrintfulClient } from '../server/commerce/printful.js';
import { CommerceError } from '../server/commerce/validation.js';

const now = 1800000000000;
const errorCode = code => error => error?.code === code;
const externalId = id => 'ua_' + createHash('sha256').update(id).digest('hex').slice(0, 28);
const clone = value => structuredClone(value);
function fixture() {
  const order = { id: 'isolated-order', ownerId: 'isolated-owner', items: [{ sync_variant_id: 101, quantity: 2 }, { sync_variant_id: 102, quantity: 1 }] };
  const mapping = { orderId: order.id, state: 'created', printfulId: 1001, externalId: externalId(order.id) };
  const remote = { id: 1001, external_id: mapping.externalId, status: 'draft', created: 1799999000, updated: 1800000000, items: [{ id: 10, sync_variant_id: 101, quantity: 2 }, { id: 11, sync_variant_id: 102, quantity: 1 }], shipments: [], recipient: { name: 'Never persist fixture customer' }, costs: { total: '99.00' } };
  let saved = null, writes = 0, conflictCount = 0, clock = now;
  const calls = [];
  const repository = {
    async getOrder() { return clone(order); }, async getDraft() { return clone(mapping); },
    async getFulfillmentProjection(id, { ownerId }) { assert.equal(id, order.id); assert.equal(ownerId, order.ownerId); return clone(saved); },
    async saveFulfillmentProjection(input) {
      assert.equal(input.ownerId, order.ownerId); assert.equal(input.expectedHash, saved?.projectionHash ?? null);
      if (conflictCount) { conflictCount--; throw new CommerceError('FULFILLMENT_SYNC_CONFLICT', { retryable: true }); }
      writes++; saved = { orderId: input.orderId, printfulId: input.printfulId, externalId: input.externalId, projectionHash: createHash('sha256').update(JSON.stringify(input.projection)).digest('hex'), observedAt: input.observedAt, providerUpdatedAt: input.projection.providerUpdatedAt, projection: clone(input.projection) }; return clone(saved);
    }
  };
  const printful = new PrintfulClient({ token: 'isolated-not-real-token', retryLimit: 0, fetch: async (url, init) => {
    calls.push({ url, method: init.method });
    assert.equal(init.method, 'GET');
    const result = url.endsWith('/stores') ? [{ id: 18912189 }] : clone(remote);
    return new Response(JSON.stringify({ code: 200, result }), { headers: { 'Content-Type': 'application/json' } });
  } });
  const service = new FulfillmentSyncService({ repository, printful, clock: () => clock });
  return { order, mapping, remote, repository, service, calls, writes: () => writes, saved: () => saved, conflicts(count) { conflictCount = count; }, advance(ms) { clock += ms; }, project: source => projectPrintfulOrder(source, { order, mapping, nowMs: now }) };
}
const shipment = (id = 501, itemId = 10) => ({ id, carrier: 'Carrier', service: 'Standard', tracking_number: 'TRACK123', tracking_url: 'https://tracking.carrier.com/track?id=TRACK123', created: 1799999990, shipped_at: 1800000000, reshipment: false, items: [{ item_id: itemId, quantity: 1 }] });

test('owner polling verifies store freshly, reads mapped external order and never mutates providers', async () => {
  const f = fixture(); await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId }); await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId });
  assert.deepEqual(f.calls.map(call => call.url), [1, 2].flatMap(() => ['https://api.printful.com/stores', 'https://api.printful.com/orders/@' + f.mapping.externalId]));
  assert.equal(f.writes(), 1, 'duplicate observed snapshot does not write again');
  assert.equal(f.saved().projection.status, 'draft');
  assert.doesNotMatch(JSON.stringify(f.saved()), /Never persist|recipient|costs|paid|delivered/);
});

test('wrong owner, missing order or missing/mismatched draft mapping fails before any provider access', async () => {
  for (const kind of ['owner', 'missing', 'reserved', 'mapping']) {
    const f = fixture();
    if (kind === 'missing') f.repository.getOrder = async () => null;
    if (kind === 'reserved') f.mapping.state = 'reserved';
    if (kind === 'mapping') f.mapping.externalId = 'ua_wrong';
    await assert.rejects(f.service.refreshOrder(f.order.id, { ownerId: kind === 'owner' ? 'other-owner' : f.order.ownerId }), errorCode(['owner', 'missing'].includes(kind) ? 'ORDER_NOT_FOUND' : 'FULFILLMENT_MAPPING_REQUIRED'));
    assert.equal(f.calls.length, 0); assert.equal(f.writes(), 0);
  }
});

test('unchanged fresh observations advance only the polling timestamp; stale provider snapshots cannot', async () => {
  const f = fixture(), options = { ownerId: f.order.ownerId };
  const first = await f.service.refreshOrder(f.order.id, options); f.advance(60001);
  const fresh = await f.service.refreshOrder(f.order.id, options);
  assert.equal(fresh.observedAt, first.observedAt + 60001); assert.equal(fresh.projectionHash, first.projectionHash);
  f.advance(60001); f.remote.updated--;
  const stale = await f.service.refreshOrder(f.order.id, options);
  assert.equal(stale.observedAt, fresh.observedAt); assert.equal(f.writes(), 2);
});

test('remote order/store identity, exact variants and quantities and documented status are mandatory', async () => {
  for (const change of [{ id: 2 }, { external_id: 'ua_wrong' }, { store_id: 5 }, { status: 'delivered' }, { updated: 1800000500 }, { updated: 1 }, { items: [{ id: 10, sync_variant_id: 101, quantity: 1 }, { id: 11, sync_variant_id: 102, quantity: 2 }] }, { items: [{ id: 10, sync_variant_id: 102, quantity: 2 }, { id: 11, sync_variant_id: 101, quantity: 1 }] }]) {
    const f = fixture(); Object.assign(f.remote, change);
    await assert.rejects(f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId })); assert.equal(f.writes(), 0);
  }
});

test('split shipments and reshipments preserve exact mapped item quantities without delivery inference', async () => {
  const f = fixture(); f.remote.status = 'partial'; f.remote.shipments = [shipment(), { ...shipment(502, 11), reshipment: true }];
  const saved = await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId });
  assert.equal(saved.projection.shipments.length, 2);
  assert.deepEqual(saved.projection.shipments[1].items, [{ itemId: 11, syncVariantId: 102, quantity: 1 }]);
  assert.equal(saved.projection.shipments[1].reshipment, true); assert.equal(saved.projection.status, 'partial');
  for (const bad of [{ ...shipment(), items: [{ item_id: 99, quantity: 1 }] }, { ...shipment(), items: [{ item_id: 10, quantity: 3 }] }, { ...shipment(), items: [{ item_id: 10, quantity: 1 }, { item_id: 10, quantity: 1 }] }, { ...shipment(), tracking_url: 'http://tracking.carrier.com/' }]) assert.throws(() => f.project({ ...f.remote, shipments: [bad] }));
  assert.throws(() => f.project({ ...f.remote, shipments: [shipment(), shipment()] }));
});

test('only public HTTPS tracking links are accepted and never fetched', () => {
  assert.equal(safeTrackingUrl('https://tracking.carrier.com/a?code=1'), 'https://tracking.carrier.com/a?code=1');
  assert.equal(safeTrackingUrl(null), null);
  for (const value of ['javascript:alert(1)', 'http://tracking.carrier.com/', 'https://user:password@tracking.carrier.com/', 'https://tracking.carrier.com:444/', 'https://127.0.0.1/', 'https://0x7f000001/', 'https://[::1]/', 'https://localhost/', 'https://private.local/', 'https://private.internal/', 'https://carrier.invalid/']) assert.throws(() => safeTrackingUrl(value), errorCode('PRINTFUL_FULFILLMENT_INVALID'));
});

test('older snapshots cannot regress status; equal-time conflicts require reconciliation', () => {
  const f = fixture(), initial = f.project({ ...f.remote, status: 'fulfilled', shipments: [shipment()] });
  assert.deepEqual(reduceFulfillmentProjection(initial, f.project({ ...f.remote, status: 'pending', updated: 1799999999 })), initial);
  const conflict = reduceFulfillmentProjection(initial, f.project({ ...f.remote, status: 'partial' }));
  assert.equal(conflict.status, 'fulfilled'); assert.equal(conflict.needsReconciliation, true); assert.equal(conflict.shipments.length, 1);
  assert.equal(reduceFulfillmentProjection(conflict, initial).needsReconciliation, true, 'same-second replay cannot clear an ambiguity');
  const newer = reduceFulfillmentProjection(conflict, f.project({ ...f.remote, updated: 1800000001, status: 'onhold' }));
  assert.equal(newer.status, 'onhold'); assert.equal(newer.needsReconciliation, false);
  assert.equal(newer.shipments[0].reportedInLatest, false, 'omitted historical tracking is retained and explicitly marked');
});

test('monotonic polling persists tie conflict once and newer provider observation resolves it', async () => {
  const f = fixture(); await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId }); f.remote.status = 'pending';
  let record = await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId });
  assert.equal(record.projection.status, 'draft'); assert.equal(record.projection.needsReconciliation, true);
  await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId }); assert.equal(f.writes(), 2);
  f.remote.updated++; record = await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId });
  assert.equal(record.projection.status, 'pending'); assert.equal(record.projection.needsReconciliation, false);
});

test('CAS recovery retries only local persistence, is bounded and does not repeat provider reads', async () => {
  const f = fixture(); f.conflicts(2); await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId });
  assert.equal(f.calls.length, 2); assert.equal(f.writes(), 1);
  const blocked = fixture(); blocked.conflicts(3);
  await assert.rejects(blocked.service.refreshOrder(blocked.order.id, { ownerId: blocked.order.ownerId }), errorCode('FULFILLMENT_SYNC_CONFLICT'));
  assert.equal(blocked.calls.length, 2); assert.equal(blocked.writes(), 0);
});

test('failed store verification blocks lookup and malformed shipments preserve the old observation', async () => {
  const f = fixture(); await f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId }); const saved = clone(f.saved());
  f.remote.shipments = [{ ...shipment(), items: [] }];
  await assert.rejects(f.service.refreshOrder(f.order.id, { ownerId: f.order.ownerId })); assert.deepEqual(f.saved(), saved);
  let lookups = 0;
  const service = new FulfillmentSyncService({ repository: f.repository, printful: { async verifyStore() { return { id: 1, verified: true }; }, async lookupOrder() { lookups++; } }, clock: () => now });
  await assert.rejects(service.refreshOrder(f.order.id, { ownerId: f.order.ownerId }), errorCode('PRINTFUL_STORE_MISMATCH')); assert.equal(lookups, 0);
});
