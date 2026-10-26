import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createExpeditionStore, normalizeNotebook, buildMarkdownGuide, EXPEDITION_STORAGE_KEY} from '../dist/expeditions/store.js';
import {sampleStory, diagramPose, routeAdvanceState} from '../dist/expeditions/app.js';
import {validateExpeditionData} from '../dist/expeditions/schema.js';

const accessed = [], values = new Map(), notices = [];
const storage = {getItem(key) {accessed.push(key);return values.get(key) || null;},setItem(key,value) {accessed.push(key);values.set(key,value);}};
const now = () => '2026-10-21T08:00:00.000Z';
const notebook = createExpeditionStore({storage: () => storage, onStatus: value => notices.push(value), now});
assert.equal(notebook.getChapter('writer').work, undefined);
const authored = 'CAISIK / vlastní kostra → dvě verze.\nČerná, žlutá, kostní bílá.';
notebook.updateChapter('writer', {work: authored, revision: 'Zvětšil jsem mezery mezi písmeny.', decision: 'Čitelnost z dálky.', score: '100%'});
notebook.setCurrentStop('writer','stop-writer-4');
notebook.setMode('field');
const restored = createExpeditionStore({storage: () => storage, now});
assert.equal(restored.getChapter('writer').work, authored, 'A fresh store restores the actual UTF-8 note');
assert.equal(restored.getCurrentStop('writer'),'stop-writer-4','Placement progress survives separately from lesson work');
assert.equal(restored.getMode(),'field');
assert.equal(restored.getChapter('writer').score,undefined,'No invented quality score is persisted');
assert(accessed.every(key => key === EXPEDITION_STORAGE_KEY),'Existing atlas storage keys remain untouched');
assert.equal(notices.at(-1).durable,true);
const payload = JSON.parse(JSON.stringify(restored.exportPayload()));
assert.equal(payload.notes.writer.work,authored);
assert.equal(payload.notes.writer.updatedAt,now());
assert.equal(payload.format,'CAISIK-Expeditions-Blackbook');
assert.throws(()=>restored.getChapter('constructor'),/Unknown/);
assert.throws(()=>restored.setCurrentStop('writer','lesson-writer-1'),/Invalid/);
restored.updateChapter('mc',{work:'x'.repeat(13000)});
assert.equal(restored.getChapter('mc').work.length,12000,'A bounded note remains exportable');

// Two open tabs must patch current persisted data, never replace stale snapshots.
const sharedValues = new Map();
const sharedStorage = {getItem: key => sharedValues.get(key) || null, setItem: (key, value) => sharedValues.set(key, value)};
const tabDJ = createExpeditionStore({storage: () => sharedStorage, now});
const tabMC = createExpeditionStore({storage: () => sharedStorage, now});
tabDJ.updateChapter('dj', {work: 'Můj první mix', tracklist: 'Vlastní skladba A → B'});
tabMC.updateChapter('mc', {work: 'Moje první sloka'});
assert.equal(tabMC.getChapter('dj').work, 'Můj první mix', 'A second tab preserves another expedition’s authored work');
assert.equal(tabDJ.exportPayload().notes.mc.work, 'Moje první sloka', 'Export refreshes chapters saved by another tab');
const writerA = createExpeditionStore({storage: () => sharedStorage, now});
const writerB = createExpeditionStore({storage: () => sharedStorage, now});
writerA.updateChapter('writer', {work: 'Kostra vlastního písma'});
writerB.updateChapter('writer', {palette: 'Žlutá, kostní bílá'});
writerA.updateChapter('writer', {revision: 'Otevřel jsem negativní prostor'});
assert.deepEqual(writerB.refresh().notes.writer, {work: 'Kostra vlastního písma', palette: 'Žlutá, kostní bílá', revision: 'Otevřel jsem negativní prostor', updatedAt: now()}, 'Dirty field patches preserve different fields in the same chapter');
writerA.setCurrentStop('writer', 'stop-writer-4');
writerB.setMode('field');
tabMC.setCurrentStop('mc', 'stop-mc-2');
assert.equal(writerA.getCurrentStop('writer'), 'stop-writer-4');
assert.equal(writerA.getCurrentStop('mc'), 'stop-mc-2');
assert.equal(writerA.getMode(), 'field', 'Mode changes preserve other tabs’ route positions and notes');
writerB.updateChapter('writer', {work: ''});
assert.equal(writerA.refresh().notes.writer.work, '', 'An explicit empty field is a deliberate edit, not ignored');
assert.equal(writerA.getChapter('writer').palette, 'Žlutá, kostní bílá');

// A corrupt record stays intact, with recoverable text and a persistent warning.
const damagedRaw = JSON.stringify({schemaVersion: 1, notes: {dj: {work: 'Zachovat můj mix'}, mc: 'damaged note'}, currentStops: {dj: 'stop-dj-3'}, mode: 'story'});
const damagedValues = new Map([[EXPEDITION_STORAGE_KEY, damagedRaw]]), damagedNotices = [];
const damagedStorage = {getItem: key => damagedValues.get(key) || null, setItem: (key, value) => damagedValues.set(key, value)};
const damaged = createExpeditionStore({storage: () => damagedStorage, onStatus: notice => damagedNotices.push(notice), now});
damaged.setMode('field');
damaged.updateChapter('knowledge', {work: 'Nová myšlenka v paměti'});
assert.equal(damagedValues.get(EXPEDITION_STORAGE_KEY), damagedRaw, 'A mode toggle or edit must never erase corrupt original data');
assert.equal(damaged.getChapter('dj').work, 'Zachovat můj mix', 'Valid known chapter fragments remain available for recovery');
assert.equal(damaged.getCurrentStop('dj'), 'stop-dj-3');
const recoveryPayload = damaged.exportPayload();
assert.equal(recoveryPayload.notes.knowledge.work, 'Nová myšlenka v paměti');
assert.equal(recoveryPayload.recovery.rawNotebook, damagedRaw, 'Export includes the exact damaged original alongside new in-memory work');
assert.equal(damagedNotices.at(-1).problem, 'corrupt');
assert.equal(damagedNotices.at(-1).durable, false);
assert.match(damagedNotices.at(-1).message, /poškozený/);
// Once a valid record is restored externally, pending edits merge into it safely.
damagedValues.set(EXPEDITION_STORAGE_KEY, JSON.stringify({schemaVersion: 1, notes: {dj: {work: 'Obnovený mix'}}, currentStops: {}, mode: 'story'}));
damaged.updateChapter('knowledge', {revision: 'Zpřesněná myšlenka'});
const recovered = JSON.parse(damagedValues.get(EXPEDITION_STORAGE_KEY));
assert.equal(recovered.notes.dj.work, 'Obnovený mix');
assert.equal(recovered.notes.knowledge.work, 'Nová myšlenka v paměti');
assert.equal(recovered.notes.knowledge.revision, 'Zpřesněná myšlenka');
assert.equal(recovered.mode, 'field');
assert.equal(damaged.persistence().durable, true);

// Failed writes remain patchable without rolling back another tab’s newer data.
let blockWrites = true;
const retryValues = new Map();
const retryStorage = {getItem: key => retryValues.get(key) || null, setItem(key, value) {if (blockWrites) throw new Error('Quota'); retryValues.set(key, value);}};
const retryTab = createExpeditionStore({storage: () => retryStorage, now});
retryTab.updateChapter('writer', {work: 'Neuložená kostra'});
blockWrites = false;
const otherTab = createExpeditionStore({storage: () => retryStorage, now});
otherTab.updateChapter('mc', {work: 'Nová uložená sloka'});
retryTab.updateChapter('writer', {palette: 'Dvě barvy'});
assert.equal(retryTab.exportPayload().notes.mc.work, 'Nová uložená sloka');
assert.equal(retryTab.getChapter('writer').work, 'Neuložená kostra');
assert.equal(retryTab.getChapter('writer').palette, 'Dvě barvy');
assert.equal(retryTab.persistence().durable, true);
blockWrites = true;
retryTab.updateChapter('writer', {revision: 'Oprava čeká na zápis'});
assert.equal(retryTab.persistence().durable, false);
blockWrites = false;
otherTab.updateChapter('mc', {revision: 'Srozumitelnější pauza'});
assert.equal(retryTab.updateChapter('writer', {}), true, 'Explicit save retries pending work even when no UI field changed');
const retriedPayload = retryTab.exportPayload();
assert.equal(retriedPayload.notes.writer.revision, 'Oprava čeká na zápis');
assert.equal(retriedPayload.notes.mc.revision, 'Srozumitelnější pauza');
assert.equal(JSON.parse(retryValues.get(EXPEDITION_STORAGE_KEY)).notes.writer.revision, 'Oprava čeká na zápis');
assert.equal(retryTab.persistence().durable, true);

for (const mode of ['read-blocked','write-blocked','corrupt','wrong-version','missing']) {
  const messages = [];
  const target = mode === 'missing' ? undefined : {
    getItem() {if(mode==='read-blocked')throw new Error('denied');return mode==='corrupt' ? '{no-json' : mode==='wrong-version' ? '{"schemaVersion":99}' : null;},
    setItem() {throw new Error('Quota exceeded');}
  };
  const held = createExpeditionStore({storage:()=>target,onStatus:value=>messages.push(value),now});
  held.updateChapter('knowledge',{work:'Pozoruji kruh. Význam si teprve doplňuji.'});
  assert.equal(held.exportPayload().notes.knowledge.work,'Pozoruji kruh. Význam si teprve doplňuji.','Storage failure never prevents export');
  assert.equal(messages.at(-1).durable,false);
  assert.match(messages.at(-1).message,/paměti|export/,'Failure is visible instead of falsely claiming persistence');
}
assert.throws(()=>normalizeNotebook([]),/invalid/);
const polluted=normalizeNotebook(JSON.parse('{"schemaVersion":1,"notes":{"__proto__":{"polluted":true},"writer":{"work":"ok","unknown":"discard"}},"currentStops":{}}'));
assert.deepEqual(Object.keys(polluted.notes),['writer']);
assert.equal({}.polluted,undefined);

const three = [0,1,2].map(phase=>({chapterId:'writer',phase,top:phase*600,bottom:(phase+1)*600}));
const forward = [sampleStory(three,0),sampleStory(three,900),sampleStory(three,1800)];
assert.equal(forward[0].progress,0);
assert.equal(forward[1].phase,1);
assert.equal(forward[1].progress,.5);
assert.equal(forward[2].phase,2);
assert.equal(forward[2].progress,1,'A completed scene holds the readable final diagram');
assert.deepEqual(sampleStory(three,900),forward[1],'Reverse scroll returns exactly to the authored middle state');
assert.deepEqual(sampleStory(three,0),forward[0]);
const overview = ['dj','mc','writer','breaking','knowledge'].map((chapterId,i)=>({chapterId,phase:0,top:i*1000,bottom:(i+1)*1000}));
assert.equal(sampleStory(overview,3600).chapterId,'breaking','Skipping several chapters has no stale state');
assert.equal(sampleStory(overview,900).nextChapterId,'mc');
assert(sampleStory(overview,900).crossfade>0 && sampleStory(overview,900).crossfade<1);
assert.equal(sampleStory(overview,1000).chapterId,'mc');
assert.equal(sampleStory(overview,9000).progress,1);
assert.equal(sampleStory(overview,-1000).progress,0);
const initialPose = diagramPose(0), finalPose=diagramPose(1);
assert(initialPose.dash>finalPose.dash,'The construction is progressively drawn');
assert(finalPose.rotation>initialPose.rotation && finalPose.cursor>initialPose.cursor && finalPose.iris>initialPose.iris);
assert.equal(finalPose.beat,7);
assert.deepEqual(diagramPose(NaN),initialPose);
const stopIds = ['stop-writer-1', 'stop-writer-2', 'stop-writer-3'];
let selectedStop = stopIds[0];
for (const expected of stopIds.slice(1)) {
  const next = routeAdvanceState(stopIds, selectedStop);
  assert.equal(next.nextStopId, expected, 'The global field bar advances from the current stop');
  assert.equal(next.finished, false);
  selectedStop = next.nextStopId;
}
assert.deepEqual(routeAdvanceState(stopIds, selectedStop), {nextStopId: null, finished: true}, 'The last stop ends at Blackbook instead of resetting the route');

const data=validateExpeditionData(JSON.parse(fs.readFileSync(new URL('../dist/expeditions/data/expeditions.json',import.meta.url),'utf8')));
const guide=buildMarkdownGuide(data,'writer',payload);
assert(guide.includes(authored),'The offline guide includes the actual authored note');
for(const id of data.chapters.find(chapter=>chapter.id==='writer').lessonIds){const lesson=data.lessons.find(item=>item.id===id);assert(guide.includes(lesson.example)&&guide.includes(lesson.transfer),'Offline content includes complete examples and transfer tasks');}
for(const stop of data.routes.find(route=>route.chapterId==='writer').stops){const place=data.places.find(item=>item.id===stop.placeId);assert(guide.includes(place.address)&&guide.includes(stop.task),'The offline guide retains route addresses and creative tasks');}
assert.match(guide,/https:\/\/www\.google\.com\/maps\/search/);
assert.equal(data.places.filter(place=>place.coordinates===null).length,data.places.length,'Unknown coordinates remain null');
assert(data.lessons.every(lesson=>lesson.id.startsWith('lesson-')) && data.routes.flatMap(route=>route.stops).every(stop=>stop.id.startsWith('stop-')),'Different objects use different identity namespaces');

// Run the real worker with deterministic same-origin requests and a real Response.
const listeners = new Map(), cacheMap = new Map(), requests = [];
let networkDown=false, failingAsset=false, quotaExceeded=false, cacheOpenFails=false, cacheReadFails=false;
const key = input => new URL(typeof input==='string'?input:input.url,'https://caisik.test').href;
const cache={async put(input,response){if(quotaExceeded)throw new Error('QuotaExceededError');cacheMap.set(key(input),response.clone());},async match(input,options={}){if(cacheReadFails)throw new Error('Cache read unavailable');const exact=cacheMap.get(key(input));if(exact)return exact.clone();if(options.ignoreSearch){const wanted=new URL(key(input));for(const [url,response] of cacheMap)if(new URL(url).pathname===wanted.pathname)return response.clone();}return undefined;}};
const scope={self:{location:{origin:'https://caisik.test'},addEventListener:(type,fn)=>listeners.set(type,fn),skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>{if(cacheOpenFails)throw new Error('Cache unavailable');return cache;},keys:async()=>['caisik-expeditions-v1-20261021','unrelated-atlas-cache'],delete:async()=>{}},URL,Response,console,fetch:async input=>{const url=key(input);requests.push(url);if(networkDown || failingAsset&&url.includes('/assets/masterworks-v2/'))throw new Error('Offline');return new Response(`resource:${new URL(url).pathname}`,{status:200,headers:{'Content-Type':url.includes('.json')?'application/json':'text/plain'}});}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/expeditions/sw.js',import.meta.url),'utf8'),scope);
async function event(type,props={}){let completion=Promise.resolve();let response;listeners.get(type)({...props,waitUntil(promise){completion=promise;},respondWith(promise){response=promise;}});await completion;return response?await response:undefined;}
await event('install');
let receipt;
await event('message',{data:{type:'SAVE_EXPEDITIONS',art:'/assets/masterworks-v2/044.webp'},ports:[{postMessage(value){receipt=value;}}]});
assert.equal(receipt.ok,true);assert.equal(receipt.textReady,true);
for(const id of ['dj','mc','writer','breaking','knowledge'])assert(cacheMap.has(`https://caisik.test/expeditions/${id}/`));
const languagePaths = ['/languages.css?v=1', '/languages.js?v=1', '/language-lessons.json?v=1', ...['cs','en','fr'].map(lang=>`/i18n/${lang}.json?v=1`)];
for(const path of languagePaths)assert(cacheMap.has(`https://caisik.test${path}`), 'Explicit offline save contains language controls, practice cards and all three dictionaries');
assert(requests.every(url=>url.startsWith('https://caisik.test/')),'Offline save never contacts a third party');
networkDown=true;
const offline=await event('fetch',{request:{method:'GET',url:'https://caisik.test/expeditions/writer/?mode=field',mode:'navigate'}});
assert.equal(offline.status,200);assert((await offline.text()).includes('/expeditions/writer/'),'A saved full expedition is served while the network is unavailable');
for(const path of languagePaths){
 const savedLanguage=await event('fetch',{request:{method:'GET',url:`https://caisik.test${path}`,mode:'cors'}});
 assert.equal(savedLanguage.status,200,'Saved language assets remain available with the network down');
 assert.equal(await savedLanguage.text(),`resource:${new URL(path,'https://caisik.test').pathname}`);
}
for(const url of ['https://caisik.test/i18n/private.json','https://caisik.test/play/store.js','https://other.test/i18n/fr.json?v=1']){
 assert.equal(await event('fetch',{request:{method:'GET',url,mode:'cors'}}),undefined,'Only the exact same-origin language allowlist extends the expedition boundary');
}
assert.equal(await event('fetch',{request:{method:'POST',url:'https://caisik.test/i18n/fr.json?v=1',mode:'cors'}}),undefined,'The offline worker never handles a write or upload');
const outside=await event('fetch',{request:{method:'GET',url:'https://caisik.test/locations-data.json',mode:'cors'}});
assert.equal(outside,undefined,'The expedition worker does not intercept the existing atlas');
networkDown=false;failingAsset=true;cacheMap.delete('https://caisik.test/assets/masterworks-v2/044.webp');
await event('message',{data:{type:'SAVE_EXPEDITIONS',art:'/assets/masterworks-v2/044.webp'},ports:[{postMessage(value){receipt=value;}}]});
assert.equal(receipt.ok,false);assert.equal(receipt.textReady,true,'Missing optional art never makes complete offline text disappear');
failingAsset=false;quotaExceeded=true;
const quotaResponse=await event('fetch',{request:{method:'GET',url:'https://caisik.test/expeditions/live-quota.json',mode:'cors'}});
assert.equal(quotaResponse.status,200,'A quota error cannot discard a live HTTP 200');
assert.equal(await quotaResponse.text(),'resource:/expeditions/live-quota.json');
quotaExceeded=false;cacheOpenFails=true;
const openResponse=await event('fetch',{request:{method:'GET',url:'https://caisik.test/expeditions/live-open.json',mode:'cors'}});
assert.equal(openResponse.status,200,'Unavailable CacheStorage cannot discard a live HTTP 200');
assert.equal(await openResponse.text(),'resource:/expeditions/live-open.json');
await event('message',{data:{type:'SAVE_EXPEDITIONS'},ports:[{postMessage(value){receipt=value;}}]});
assert.equal(receipt.ok,false);assert.equal(receipt.textReady,false,'An unavailable cache is reported honestly');
networkDown=true;
assert.equal((await event('fetch',{request:{method:'GET',url:'https://caisik.test/expeditions/writer/',mode:'navigate'}})).status,503,'Offline cache-open failure remains a readable response');
cacheOpenFails=false;cacheReadFails=true;
assert.equal((await event('fetch',{request:{method:'GET',url:'https://caisik.test/expeditions/writer/',mode:'navigate'}})).status,503,'Offline cache-read failure remains a readable response');
// Exercise upgrade lifecycle against separate real cache maps. A partially
// downloaded new version must never retire the previous offline text package.
const workerSource = fs.readFileSync(new URL('../dist/expeditions/sw.js', import.meta.url), 'utf8');
const currentCacheName = /const CACHE = '([^']+)'/.exec(workerSource)[1];
const previousCacheName = 'caisik-expeditions-v1-20261021';
function upgradeFixture(failure = null) {
  const handlers = new Map(), deleted = [], requested = [];
  const oldFiles = new Map([['https://caisik.test/expeditions/writer/', new Response('previous complete Writer guide')]]);
  const newFiles = new Map();
  const stores = new Map([[previousCacheName, oldFiles], [currentCacheName, newFiles], ['unrelated-atlas-cache', new Map()]]);
  let skipped = 0, claimed = 0;
  const cacheFor = files => ({
    async put(input, response) { files.set(key(input), response.clone()); },
    async match(input, options = {}) {
      const url = key(input), exact = files.get(url);
      if (exact) return exact.clone();
      if (options.ignoreSearch) for (const [stored, response] of files) {
        if (new URL(stored).pathname === new URL(url).pathname) return response.clone();
      }
      return undefined;
    }
  });
  const context = {
    self: {location: {origin: 'https://caisik.test'}, addEventListener: (name, fn) => handlers.set(name, fn), skipWaiting: async () => {skipped++;}, clients: {claim: async () => {claimed++;}}},
    caches: {
      async open(name) {if (!stores.has(name)) stores.set(name, new Map()); return cacheFor(stores.get(name));},
      async keys() {return [...stores.keys()];},
      async delete(name) {deleted.push(name); return stores.delete(name);}
    }, URL, Response, console,
    async fetch(input) {
      const url = key(input); requested.push(url);
      if (failure === 'all' || failure && url.endsWith(failure)) throw new Error('Offline during upgrade');
      return new Response(`new:${new URL(url).pathname}`, {status: 200, headers: {'Content-Type': new URL(url).pathname.endsWith('/') ? 'text/html' : 'text/plain'}});
    }
  };
  vm.runInNewContext(workerSource, context);
  return {
    stores, oldFiles, newFiles, deleted, requested,
    get skipped() {return skipped;}, get claimed() {return claimed;},
    async run(type) {let completion; handlers.get(type)({waitUntil(promise) {completion = promise;}}); await completion;}
  };
}
for (const failure of ['/expeditions/knowledge/', '/i18n/fr.json?v=1', '/language-lessons.json?v=1', 'all']) {
  const upgrade = upgradeFixture(failure);
  await assert.rejects(upgrade.run('install'), /Incomplete offline text package/, 'Incomplete mandatory text rejects installation');
  assert.equal(upgrade.skipped, 0, 'Failed install never replaces the old active worker');
  assert.equal(upgrade.claimed, 0);
  assert.equal(upgrade.stores.get(previousCacheName), upgrade.oldFiles);
  assert.equal(await upgrade.oldFiles.get('https://caisik.test/expeditions/writer/').clone().text(), 'previous complete Writer guide');
  await assert.rejects(upgrade.run('activate'), /Offline text package unavailable/);
  assert.deepEqual(upgrade.deleted, [], 'Failed install or activation retains the previous offline cache');
}
const staleVersion = upgradeFixture('/expeditions/store.js?v=2');
staleVersion.newFiles.set('https://caisik.test/expeditions/store.js?v=1', new Response('old runtime'));
await assert.rejects(staleVersion.run('install'), /Incomplete offline text package/, 'A different cached query version cannot stand in for required current code');
assert.equal(staleVersion.skipped, 0);
assert(staleVersion.stores.has(previousCacheName));

const completeUpgrade = upgradeFixture();
await completeUpgrade.run('install');
for (const path of ['/expeditions/', ...['dj', 'mc', 'writer', 'breaking', 'knowledge'].map(id => `/expeditions/${id}/`)]) {
  assert(completeUpgrade.newFiles.has(`https://caisik.test${path}`), 'Successful install includes every complete text page');
}
assert.equal(completeUpgrade.skipped, 1);
assert(completeUpgrade.stores.has(previousCacheName), 'Installation leaves cleanup to verified activation');
assert(completeUpgrade.requested.every(url => url.startsWith('https://caisik.test/expeditions/') || languagePaths.includes(url.replace('https://caisik.test',''))), 'Mandatory install only downloads expedition text and exact same-origin language assets');
for (const path of languagePaths) assert(completeUpgrade.newFiles.has(`https://caisik.test${path}`), 'A verified upgrade contains every language control, card set and dictionary');
await completeUpgrade.run('activate');
assert.equal(completeUpgrade.claimed, 1);
assert.equal(completeUpgrade.stores.has(previousCacheName), false);
assert(completeUpgrade.stores.has(currentCacheName));
assert(completeUpgrade.stores.has('unrelated-atlas-cache'), 'Successful upgrade never deletes unrelated atlas caches');

const evictedUpgrade = upgradeFixture();
await evictedUpgrade.run('install');
evictedUpgrade.newFiles.delete('https://caisik.test/expeditions/mc/');
await assert.rejects(evictedUpgrade.run('activate'), /Offline text package unavailable/, 'Activation rechecks that mandatory text survived installation');
assert(evictedUpgrade.stores.has(previousCacheName));
assert.deepEqual(evictedUpgrade.deleted, []);

console.log('PASS: isolated and multi-tab note persistence/failure/export; corrupt-data recovery; full offline guide; identity namespaces; reversible scroll/scene semantics; field route progression; same-origin opt-in offline text and CS/EN/FR practice; exact language asset allowlist; quota/open/read failure resilience; complete offline upgrade and previous-cache retention.');
