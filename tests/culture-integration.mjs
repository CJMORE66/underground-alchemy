/* Source-backed culture contracts + actual atlas bridge. No GPU claim. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {parseCultureData,culturePlace,cultureRoutes} from '../dist/culture-data.js';
import {validCityPoint} from '../dist/city-map.js';

const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const read=name=>fs.readFileSync(path.join(dist,name),'utf8');
const atlas=JSON.parse(read('locations-data.json'));
const originalIds=atlas.locations.map(place=>place.id);
const canonical=structuredClone(atlas);
const fixture={
 id:'test-culture',name:'Zkušební kulturní místo',address:'Adresa přímo od provozovatele, Paris',category:'graffiti',
 facts:['Provozovatel dokumentuje vlastní kurátorský program.'],access:'Vstup podle oficiálního programu; malování vyžaduje svolení.',
 checkedAt:'2026-10-26',lat:null,lng:null,coordinateStatus:'Adresa ověřena; přesný bod nebyl ověřen.',
 sources:[{title:'Oficiální informace provozovatele',url:'https://example.org/venue'}],relatedExpedition:'writer',
 task:{question:'Co se mění při opakování stejného znaku?',observe:'Pozoruj překryvy jednotlivých vrstev.',try:'Nakresli tři varianty písmene do svého sešitu.',review:'Srovnej jejich čitelnost a vysvětli jednu úpravu.',output:'Vlastní skica a popsané rozhodnutí.'}
};
const parse=(entries,known=[])=>parseCultureData({version:1,places:entries},known);
assert.deepEqual(parseCultureData(null).places,[]);
assert.deepEqual(parseCultureData({version:99,places:[fixture]}).places,[],'unsupported data cannot partially become UI');
assert.equal(parseCultureData({version:1,places:{}}).places.length,0);
assert.equal(parse([fixture]).places.length,1);
assert.equal(parse([fixture,fixture]).places.length,1,'stable IDs deduplicate optional data');
assert.equal(parse([fixture],['test-culture']).places.length,0,'new content cannot replace an original identity');
for(const invalid of [
 {id:'../../untrusted'}, {category:'constructor'}, {category:'toString'}, {category:'missing'},
 {relatedExpedition:'not-a-route'}, {checkedAt:'2026-99-99'}, {facts:[]},
 {sources:[{title:'Untrusted source',url:'javascript:alert(1)'}]},
 {sources:[{title:'Embedded credential',url:'https://secret@example.org/'}]},
 {task:{...fixture.task,review:''}}
])assert.equal(parse([{...fixture,...invalid}]).places.length,0,`reject invalid optional record ${JSON.stringify(invalid)}`);
for(const coordinate of [
 {lat:null,lng:null},{lat:0,lng:0},{lat:'48.85',lng:'2.35'},{lat:NaN,lng:2.35},
 {lat:48.85,lng:null},{lat:48.85,lng:2.35},{lat:48.85,lng:2.35,coordinateSource:'javascript:bad()'}
]){
 const p=parse([{...fixture,...coordinate}]).places[0];
 assert.equal(p.lat,null,'unverified coordinate remains absent rather than0');assert.equal(p.lng,null);
}
{
 const p=parse([{...fixture,lat:48.85,lng:2.35,coordinateSource:'https://example.org/official-map'}]).places[0];
 assert.equal(p.lat,48.85);assert.equal(p.lng,2.35);
 const adapted=culturePlace(p);
 assert.equal(adapted.culture,true);assert.equal(adapted.history,fixture.facts[0]);assert.equal(adapted.reflection,fixture.task.question);
 assert.equal(adapted.accessVerified,false,'a verified address is not verified mobility access');
 assert.equal(adapted.period,'Současná kulturní místa');
}
{
 const p=parse([{...fixture,photo:{remoteUrl:'https://tracking.invalid/image',sourcePage:'https://tracking.invalid/source'}}]).places[0];
 assert(!culturePlace(p).photo,'unvalidated extra media cannot be introduced through optional content');
}
assert.deepEqual(cultureRoutes([]),[],'incomplete optional content never creates a route with unknown stops');

// The production data must meet the same runtime contracts used on the page.
const research=JSON.parse(read('culture-data.json'));
const result=parseCultureData(research,originalIds);
assert.equal(result.warnings.length,0,'all shipped research records validate');
assert(result.places.length>=12,'the expansion contains substantive researched places');
assert.equal(result.places.length,research.places.length);
const allIds=new Set([...originalIds,...result.places.map(p=>p.id)]);
assert.equal(allIds.size,originalIds.length+result.places.length,'new places do not overwrite existing IDs');
const categories=new Set(result.places.map(p=>p.category));
for(const category of ['graffiti','artshop','hiphop','recordshop','philosophy'])assert(categories.has(category),`real researched category ${category}`);
for(const place of result.places){
 assert.equal(place.checkedAt,'2026-10-26');
 assert(place.sources.every(source=>new URL(source.url).protocol==='https:'));
 assert(fs.existsSync(path.join(dist,`expeditions/${place.relatedExpedition}/index.html`)),'each workshop link points to an existing expedition');
 if(place.lat!==null){assert(place.coordinateSource);assert.equal(typeof place.lng,'number');}
 else assert.equal(place.lng,null,'missing positions remain a pair of nulls');
 assert(!place.photo,'new source data does not impersonate documentary imagery');
}
for(const route of cultureRoutes(result.places)){
 assert(route.stops.every(id=>allIds.has(id)),'new routes refer only to actual discovered locations');
 assert.equal(new Set(route.stops).size,route.stops.length);
}
assert.deepEqual(atlas,canonical,'culture parsing leaves the original location and route data exact');

console.log(`PASS culture content: ${result.places.length} researched additions, six distinct categories, per-place sources/dates/tasks; hostile schema and unverified-coordinate rejection; no invented media or routes.`);

const html=read('index.html'),source=read('atlas.js');
const principles=JSON.parse(read('principles-data.json'));
const illustrationManifest=JSON.parse(read('assets/places-caisik/manifest.json'));
const aliases=fs.readdirSync(path.join(dist,'q'),{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>`q/${entry.name}/index.html`);
for(const name of ['index.html',...aliases]){
 const {document}=parseHTML(read(name));
 assert.equal(document.querySelectorAll('#culture-district').length,1,`${name}: one real culture field target`);
 assert.equal(document.querySelectorAll('[data-atlas-motion]').length,1,`${name}: visible motion preference control`);
 assert.equal(document.querySelectorAll('link[href^="/culture-board.css?"]').length,1,`${name}: culture stylesheet linked once`);
 assert.equal(document.querySelectorAll('script[src^="/place-art-motion.js?"]').length,1,`${name}: individual artwork runtime linked once`);
 for(const id of ['hidden-city','principles','frequency','living-wall','profile-dialog','notebook-dialog'])assert(document.getElementById(id),`${name}: original ${id} retained`);
}

async function boot({data=research,dataFails=false,boardFails=false,storageFails=false,motion='off'}={}){
 const {window,document}=parseHTML(html);
 const oldNote='Původní pozorování zůstává přesně uložené.';
 const oldCultureNote='Moje starší poznámka ke kulturnímu místu.';
 const notes={'notre-dame':oldNote,[result.places[0].id]:oldCultureNote,'unknown-retained-id':'Neznámá poznámka pro obnovu.'};
 const storage=new Map([
  ['atlas-saved-places',JSON.stringify(['notre-dame',result.places[0].id])],
  ['atlas-observations',JSON.stringify(notes)],['atlas-motion',JSON.stringify(motion)],
  ['caisik-expeditions-v1','untouched-expeditions'],['caisik-selfmade-v1','untouched-selfmade']
 ]);
 const calls={geo:0,markers:[],pans:[],lines:[],city:null,sets:[],selections:[],routes:[],board:null,boardDestroyed:0,download:null,errors:[]};
 window.HTMLElement.prototype.scrollIntoView=function(){};
 document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.showModal=()=>{dialog.open=true;dialog.setAttribute('open','');};
  dialog.close=()=>{dialog.open=false;dialog.removeAttribute('open');dialog.dispatchEvent(new window.Event('close'));};
 });
 const map={layers:[],setView(){return this;},panTo(point){calls.pans.push(point);},fitBounds(){},removeLayer(layer){this.layers=this.layers.filter(item=>item!==layer);},invalidateSize(){}};
 const group={layers:[],addTo(){return this;},clearLayers(){this.layers=[];},eachLayer(fn){this.layers.forEach(fn);}};
 const L={map:()=>map,layerGroup:()=>group,divIcon:options=>options,control:{scale:()=>({addTo(){}})},
  marker:(point,options)=>{assert(point.every(Number.isFinite),'no missing/null map marker');calls.markers.push(point);const element=document.createElement('span');return {point,options,getElement:()=>element,bindTooltip(){return this;},on(){return this;},addTo(parent){parent.layers.push(this);return this;}};},
  polyline:points=>{calls.lines.push(points);return {points,getBounds:()=>points,addTo(parent){parent.layers.push(this);return this;}};},
  tileLayer:()=>({on(){return this;},addTo(){return this;}})
 };
 class TestURL extends URL{static createObjectURL(blob){calls.download=blob;return 'blob:qa-export';}static revokeObjectURL(){}}
 window.L=L;window.matchMedia=()=>({matches:false});window.location={pathname:'/',hash:''};
 const context=vm.createContext({window,document,L,URL:TestURL,URLSearchParams,Blob,Map,Set,location:window.location,matchMedia:window.matchMedia,
  console:{...console,error:(...args)=>calls.errors.push(args)},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(storageFails)throw Error('storage unavailable');storage.set(key,value);},removeItem:key=>storage.delete(key)},
  navigator:{geolocation:{getCurrentPosition(success){calls.geo++;success({coords:{latitude:48.86,longitude:2.35}});}}},
  fetch:async url=>{
   if(url.includes('culture-data')){if(dataFails)throw Error('optional network failure');return {ok:true,json:async()=>data};}
   return {ok:true,json:async()=>url.includes('locations-data')?atlas:url.includes('places-caisik')?illustrationManifest:principles};
  },
  parseCultureData,culturePlace,cultureRoutes,validCityPoint,
  artworkMarkup:()=>'<span class="existing-art"></span>',initPrinciples:()=>({select(){}}),initFrequency:()=>({setInspiration(){}}),
  createCityExperience:options=>{calls.city=options;return {setPlaces:(...args)=>calls.sets.push(args),select:(...args)=>calls.selections.push(args),setRoute:route=>calls.routes.push(route),setUserLocation(){}};},
  fakeMountCultureBoard:(host,options)=>{if(boardFails)throw Error('optional board unavailable');calls.board={host,options};return {destroy(){calls.boardDestroyed++;}};}
 });
 const runnable=source.replace(/^import[^\n]+\n/gm,'').replace("import('./culture-board.js?v=2')","Promise.resolve({mountCultureBoard:fakeMountCultureBoard})").replace(/\binit\(\);\s*$/,'globalThis.atlasReady=init();');
 vm.runInContext(runnable,context);await context.atlasReady;for(let i=0;i<5;i++)await Promise.resolve();
 return {window,document,calls,storage,map,group,oldNote,oldCultureNote};
}

{
 const h=await boot();
 assert.equal(h.calls.errors.length,0,'actual atlas starts with optional content');
 assert.equal(h.calls.geo,0,'loading culture never requests location');
 assert.equal(h.calls.city.places.length,atlas.locations.length+result.places.length,'new research joins the real atlas');
 assert.equal(h.document.querySelectorAll('#place-list [data-select-place]').length,32);
 assert.equal(h.group.layers.length,31,'source-backed address points join original markers; unresolved Spot13 stays absent');
 assert(h.calls.board,'real optional board mounts');
 assert.equal(h.calls.board.options.places.length,20);
 assert.equal(h.document.documentElement.dataset.motion,'off','previous pause setting is respected');
 const quickMotion=h.document.querySelector('[data-atlas-motion]');assert.match(quickMotion.textContent,/ZAPNOUT/);
 quickMotion.click();assert.equal(h.document.documentElement.dataset.motion,'on');assert.equal(JSON.parse(h.storage.get('atlas-motion')),'on');
 assert.match(quickMotion.textContent,/POZASTAVIT/,'near-map motion control synchronizes existing footer setting');
 for(const place of result.places){
  const pans=h.calls.pans.length;h.calls.board.options.onOpen(place.id);
  const profile=h.document.getElementById('profile-content');
  assert(profile.textContent.includes(place.name));assert(profile.textContent.includes(place.address));assert(profile.textContent.includes(place.task.review));assert(profile.textContent.includes(place.task.output));
  assert(profile.textContent.includes(place.checkedAt),'new content shows its own verification date');
  assert.equal(profile.querySelector('[data-open-model]'),null,'no model action for an unbuilt new building');
  assert.equal(profile.querySelector('img[data-place-photo]'),null,'no invented documentary images');
  assert.equal(h.calls.pans.length,pans,'opening a profile does not silently request a camera pan');
  for(const source of place.sources)assert([...profile.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===source.url),'source-backed profile retains each official source');
 }
 const first=result.places[0];h.calls.board.options.onOpen(first.id);
 assert.equal(h.document.getElementById('place-observation').value,h.oldCultureNote,'new UI retains existing note by stable ID');
 h.document.getElementById('place-observation').value='Doplněná vlastní terénní zkušenost.';
 h.document.querySelector(`[data-save-observation="${first.id}"]`).click();
 const stored=JSON.parse(h.storage.get('atlas-observations'));
 assert.equal(stored['notre-dame'],h.oldNote);assert.equal(stored[first.id],'Doplněná vlastní terénní zkušenost.');assert.equal(stored['unknown-retained-id'],'Neznámá poznámka pro obnovu.');
 assert.equal(h.storage.get('caisik-expeditions-v1'),'untouched-expeditions');assert.equal(h.storage.get('caisik-selfmade-v1'),'untouched-selfmade');
 h.document.getElementById('profile-dialog').close();h.calls.board.options.onFilter('philosophy');
 assert.equal(h.document.querySelectorAll('#place-list [data-select-place]').length,3);assert.equal(h.group.layers.length,3,'philosophy address points are explicitly sourced');
 assert(h.document.querySelector('#layer-filters [data-layer="Philosophy"][aria-pressed="true"]'));
 h.calls.board.options.onFilter('all');h.document.getElementById('locate').click();assert.equal(h.calls.geo,1);
 assert(!h.document.getElementById('place-list').textContent.includes('NaN'));assert(!h.document.getElementById('place-list').textContent.includes('Infinity'));
 for(const place of result.places.filter(p=>!validCityPoint(p)))assert.match(h.document.querySelector(`[data-select-place="${place.id}"]`).textContent,/BEZ OVĚŘENÉHO PINU/,'missing coordinate is explicit instead of a distance');
 for(const route of cultureRoutes(result.places)){
  const before=h.calls.lines.length;h.document.querySelector(`[data-route="${route.id}"]`).click();
  assert.equal(h.calls.routes.at(-1).stops.length,route.stops.length,'route preserves all source-ordered stops even without positions');
  assert.equal(h.calls.lines.length,before+1,'sourced stops support the ordered route; line is not walking directions');
  const nav=h.document.querySelector('#active-route a[href]');assert(nav,'ordered external directions remain available');
  const url=new URL(nav.getAttribute('href'));assert.equal(url.searchParams.get('origin'),h.calls.routes.at(-1).stops[0].address);
  h.document.getElementById('close-route').click();
 }
 h.document.getElementById('notebook-export').click();assert(h.calls.download,'actual notebook creates an export');
 const exported=JSON.parse(await h.calls.download.text());assert.equal(exported['atlas-observations']['notre-dame'],h.oldNote);assert.equal(exported['atlas-observations']['unknown-retained-id'],'Neznámá poznámka pro obnovu.');
}
for(const options of [{dataFails:true},{data:{version:1,places:[{id:'broken'}]}}]){
 const h=await boot(options);assert.equal(h.calls.errors.length,0);assert(h.calls.city);assert.equal(h.calls.city.places.length,12);assert.equal(h.document.querySelectorAll('#routes [data-route]').length,3);assert.equal(h.group.layers.length,12);assert.match(h.document.getElementById('culture-district').textContent,/nepodařilo|nedostup/i);assert.equal(h.storage.get('caisik-expeditions-v1'),'untouched-expeditions');
}
{
 const h=await boot({boardFails:true});assert.equal(h.calls.errors.length,0);assert.equal(h.document.querySelectorAll('#place-list [data-select-place]').length,32);assert.match(h.document.getElementById('culture-district').textContent,/nelze načíst/,'failed optional board leaves discoveries in original list');
}
{
 const h=await boot({storageFails:true});h.calls.board.options.onOpen(result.places[0].id);h.document.getElementById('place-observation').value='Neuložená práce má zůstat dostupná.';h.document.querySelector(`[data-save-observation="${result.places[0].id}"]`).click();assert.match(h.document.getElementById('toast').textContent,/storage is unavailable/i);h.document.getElementById('notebook-export').click();const exported=JSON.parse(await h.calls.download.text());assert.equal(exported['atlas-observations'][result.places[0].id],'Neuložená práce má zůstat dostupná.','failed persistent storage still permits memory export');
}
assert.deepEqual(atlas,canonical,'actual runtime leaves original data exact');
console.log('PASS culture atlas bridge: all 32 discoveries; 31 source-backed pins; source-dated profiles; real board filter/open links; preserved notes + export; no automatic permissions; optional data/UI failure; synchronized motion preference.');
