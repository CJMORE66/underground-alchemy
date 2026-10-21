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
assert(requests.every(url=>url.startsWith('https://caisik.test/')),'Offline save never contacts a third party');
networkDown=true;
const offline=await event('fetch',{request:{method:'GET',url:'https://caisik.test/expeditions/writer/?mode=field',mode:'navigate'}});
assert.equal(offline.status,200);assert((await offline.text()).includes('/expeditions/writer/'),'A saved full expedition is served while the network is unavailable');
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
console.log('PASS: isolated note persistence/failure/export; full offline guide; identity namespaces; reversible scroll/scene semantics; field route progression; same-origin opt-in offline text; quota/open/read failure resilience.');
