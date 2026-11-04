/* ISOLATED native workerd+D1 test of the actual repository module. Synthetic
 * order/hint only; no provider/account calls, real payment or fulfillment. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

test('native D1 batch admission, fenced claims and recovery audit retain actual SQLite changes() semantics', async () => {
  const repositoryPath = fileURLToPath(new URL('../server/commerce/d1-repository.js', import.meta.url));
  const source = `import {D1CommerceRepository} from ${JSON.stringify(repositoryPath)};
    const scope={stripeAccountId:'acct_nativeIsolated123',mode:'test',printfulStoreId:18912189};
    const now=()=>1800000000000;
    export default {async fetch(request,env){
      const repository=new D1CommerceRepository({db:env.COMMERCE_DB,scope,clock:now});await repository.migrate();
      const order={id:'isolated-native-order',ownerId:'isolated-native-owner',quoteHash:'a'.repeat(64),totalMinor:1200,currency:'EUR',recipient:{name:'Synthetic Native Fixture',address1:'Synthetic Street',city:'Synthetic City',zip:'00000',country_code:'FR'},items:[{sync_variant_id:101,quantity:1}],shippingId:'synthetic'};
      await repository.createOrder(order);
      const reservation={orderId:order.id,externalId:'ua_isolated_native',payloadHash:'b'.repeat(64),paymentReference:'pi_isolated_not_payment_proof'};
      await repository.claimDraft(reservation);await repository.markDraftCreated({...reservation,printfulId:1001});
      const hint={fingerprint:'c'.repeat(64),type:'order_updated',occurredAt:'2027-01-15T08:00:00.123456789Z',storeId:18912189,printfulId:1001,externalId:reservation.externalId,shipmentId:null};
      const admitted=await repository.enqueuePrintfulEvent(hint),duplicate=await repository.enqueuePrintfulEvent(hint);
      const claims=await Promise.all(['one','two'].map(workerId=>repository.claimPrintfulJob({workerId,nowMs:now(),leaseMs:1000,jobId:admitted.jobId})));
      const claimed=claims.find(Boolean);
      const dead=await repository.failPrintfulJob({jobId:admitted.jobId,workerId:claimed.workerId,leaseToken:claimed.leaseToken,code:'ISOLATED_FAILURE',retryable:false,nowMs:now()});
      const before=await repository.getDraft(order.id);
      const recovered=await repository.retryPrintfulJob({jobId:admitted.jobId,expectedUpdatedAt:dead.updatedAt,expectedRecoveryCount:dead.recoveryCount,actorHash:'d'.repeat(64),reasonCode:'ISOLATED_REVIEW'});
      const audit=await env.COMMERCE_DB.prepare('SELECT number,actor_hash,reason_code FROM commerce_d1_printful_recoveries').all();
      const unknown=await repository.enqueuePrintfulEvent({...hint,fingerprint:'e'.repeat(64),printfulId:9999});
      return Response.json({admitted,duplicate,claimCount:claims.filter(Boolean).length,dead,recovered,audit:audit.results,unknown,draftUnchanged:JSON.stringify(before)===JSON.stringify(await repository.getDraft(order.id))});
    }};`;
  const compiled = await build({ stdin: { contents: source, resolveDir: fileURLToPath(new URL('..', import.meta.url)), sourcefile: 'isolated-native-d1.mjs' }, bundle: true, platform: 'browser', format: 'esm', target: 'es2022', write: false, logLevel: 'silent' });
  let outbound = 0;
  const mf = new Miniflare(convertV4MiniflareOptions({
    modulesRoot: '/isolated-pf-d1', modules: [{ type: 'ESModule', path: '/isolated-pf-d1/worker.mjs', contents: compiled.outputFiles[0].text }],
    compatibilityDate: '2026-10-23', d1Databases: { COMMERCE_DB: 'isolated-native-printful-inbox' },
    outboundService: () => { outbound++; throw new Error('No outbound service is allowed in native D1 tests'); }
  }));
  try {
    const db = await mf.getD1Database('COMMERCE_DB');
    const journal = JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8'));
    for (const entry of journal.entries) {
      const sql = readFileSync(new URL('../drizzle/' + entry.tag + '.sql', import.meta.url), 'utf8');
      for (const statement of sql.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean)) await db.prepare(statement).run();
    }
    const response = await mf.dispatchFetch('https://isolated-native.test/'), result = await response.json();
    assert.equal(response.status, 200); assert.equal(result.admitted.state, 'pending'); assert.equal(result.duplicate.duplicate, true); assert.equal(result.claimCount, 1);
    assert.equal(result.dead.state, 'dead_letter'); assert.equal(result.recovered.state, 'pending'); assert.equal(result.recovered.recoveryCount, 1);
    assert.deepEqual(result.audit, [{ number: 1, actor_hash: 'd'.repeat(64), reason_code: 'ISOLATED_REVIEW' }]);
    assert.equal(result.unknown.state, 'ignored'); assert.equal(result.draftUnchanged, true); assert.equal(outbound, 0);
  } finally { await mf.dispose(); }
});
