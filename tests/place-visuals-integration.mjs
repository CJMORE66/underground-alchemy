import {parseCultureData,culturePlace,cultureRoutes} from '../dist/culture-data.js';
import {validCityPoint} from '../dist/city-map.js';
/* Actual atlas DOM/data contracts. No claim about real GPU pixels is made here. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {createCityExperience} from '../dist/city-map.js';
import {exclusionFilter} from '../src/city-landmarks/registry.js';

const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const read=file=>fs.readFileSync(path.join(dist,file),'utf8');
const atlas=JSON.parse(read('locations-data.json'));
const principles=JSON.parse(read('principles-data.json'));
const html=read('index.html'),source=read('atlas.js');
const manifest=JSON.parse(read('assets/places-caisik/manifest.json'));
const expectedIds=['notre-dame','sainte-chapelle','flamel-house','saint-sulpice','pere-lachaise','republique','abbesses','mur-oberkampf','la-place','centquatre','philharmonie','shakespeare-company'];
const canonical={locations:structuredClone(atlas.locations),routes:structuredClone(atlas.routes)};
const byId=new Map(manifest.illustrations.map(entry=>[entry.id,entry]));

function webpDimensions(buffer){
 assert.equal(buffer.toString('ascii',0,4),'RIFF','image is a RIFF container');
 assert.equal(buffer.toString('ascii',8,12),'WEBP','image is genuine WebP, not a renamed raster');
 for(let offset=12;offset+8<=buffer.length;){
  const type=buffer.toString('ascii',offset,offset+4),size=buffer.readUInt32LE(offset+4),start=offset+8;
  assert(start+size<=buffer.length,'WebP chunk is complete');
  if(type==='VP8X')return {width:buffer.readUIntLE(start+4,3)+1,height:buffer.readUIntLE(start+7,3)+1};
  if(type==='VP8L'){
   assert.equal(buffer[start],0x2f);const bits=buffer.readUInt32LE(start+1);
   return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
  }
  if(type==='VP8 '){assert.equal(buffer.toString('hex',start+3,start+6),'9d012a');return {width:buffer.readUInt16LE(start+6)&0x3fff,height:buffer.readUInt16LE(start+8)&0x3fff};}
  offset=start+size+(size%2);
 }
 throw Error('WebP has no image dimension chunk');
}

assert.equal(manifest.version,1);
assert.match(manifest.classification,/contemporary|autorsk|illustrat/i,'manifest classifies generated art as contemporary illustration');
assert.equal(manifest.illustrations.length,12);
assert.deepEqual([...byId.keys()].sort(),[...expectedIds].sort(),'all twelve original identities have one illustration');
const hashes=new Set();
for(const place of atlas.locations){
 const item=byId.get(place.id);
 assert.equal(item.src,`/assets/places-caisik/${place.id}.webp`,'one local asset per actual place');
 assert.equal(typeof item.alt,'string');assert(item.alt.length>=25,'alt text describes the artwork');
 assert.match(item.alt,/autorsk|illustr|CAISIK/i,'alt text does not imply a documentary photo');
 const buffer=fs.readFileSync(path.join(dist,item.src));
 const dimensions=webpDimensions(buffer);
 assert.deepEqual(dimensions,{width:item.width,height:item.height},`${place.id}: manifest matches actual encoded dimensions`);
 assert(item.width>=1024&&item.height>=700,`${place.id}: image is not a small reference crop`);
 hashes.add(crypto.createHash('sha256').update(buffer).digest('hex'));
}
assert.equal(hashes.size,12,'twelve distinct finished images, not a repeated generic picture');
const production=JSON.parse(fs.readFileSync(path.join(root,'docs/atlas/PLACE_ILLUSTRATION_PROMPTS.json'),'utf8'));
const provenance=[...production.illustrations];
if(!provenance.some(item=>item.id==='notre-dame'))provenance.push(JSON.parse(fs.readFileSync(path.join(root,'docs/atlas/NOTRE_DAME_ART_PROVENANCE.json'),'utf8')));
assert.deepEqual(provenance.map(item=>item.id).sort(),[...expectedIds].sort(),'each delivered asset has one retained production prompt');
for(const item of provenance){
 assert(typeof item.prompt==='string'&&item.prompt.length>100,'full production prompt is retained');
 const src=item.asset||item.src;assert.equal(src,byId.get(item.id).src);
 const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,src))).digest('hex');
 assert.equal(item.sha256,sha,`${item.id}: production provenance matches the shipped WebP`);
 assert.equal(item.width,byId.get(item.id).width);assert.equal(item.height,byId.get(item.id).height);
}

const aliases=fs.readdirSync(path.join(dist,'q'),{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>`q/${entry.name}/index.html`);
assert.equal(aliases.length,12);
for(const name of ['index.html',...aliases]){
 const {document}=parseHTML(read(name));
 for(const asset of ['/place-art-motion.js','/place-art-motion.css']){
  const nodes=[...document.querySelectorAll(asset.endsWith('.js')?'script[src]':'link[href]')];
  assert.equal(nodes.filter(node=>(node.getAttribute('src')||node.getAttribute('href')).split('?')[0]===asset).length,1,`${name}: optional artwork motion is linked once`);
  assert(fs.statSync(path.join(dist,asset)).size>0);
 }
 assert.equal(document.querySelectorAll('#city-map').length,1);
 assert.equal(document.querySelectorAll('.map-wrap').length,1);
}

async function bootAtlas({artManifest=manifest,manifestFails=false}={}){
 const {window,document}=parseHTML(html);
 const calls={city:null,select:[],places:[],routes:[],geo:0,fetches:[],inspiration:[]};
 const oldObservation='Moje původní pozorování zůstává moje.';
 const storage=new Map([
  ['atlas-saved-places','["notre-dame"]'],
  ['atlas-observations',JSON.stringify({'notre-dame':oldObservation})],
  ['caisik-expeditions-v1','legacy expedition notebook'],
  ['caisik-selfmade-v1','legacy selfmade notebook']
 ]);
 window.HTMLElement.prototype.scrollIntoView=function(){};
 for(const dialog of document.querySelectorAll('dialog')){
  dialog.showModal=()=>{dialog.open=true;dialog.setAttribute('open','');};
  dialog.close=()=>{dialog.open=false;dialog.removeAttribute('open');dialog.dispatchEvent(new window.Event('close'));};
 }
 const map={layers:[],setView(){return this;},panTo(){},fitBounds(){},removeLayer(layer){this.layers=this.layers.filter(item=>item!==layer);},invalidateSize(){},remove(){}};
 const group={layers:[],addTo(){return this;},clearLayers(){this.layers=[];},eachLayer(fn){this.layers.forEach(fn);}};
 const L={map:()=>map,layerGroup:()=>group,divIcon:value=>value,control:{scale:()=>({addTo(){}})},
  marker:(point,options)=>{const element=document.createElement('div');return {point,options,getElement:()=>element,bindTooltip(){return this;},on(){return this;},addTo(parent){parent.layers.push(this);return this;}};},
  polyline:points=>({getBounds:()=>points,addTo(parent){parent.layers.push(this);return this;}}),
  tileLayer:()=>({on(){return this;},addTo(){return this;}})};
 window.L=L;window.matchMedia=()=>({matches:false});window.location={pathname:'/',hash:''};
 const context=vm.createContext({window,document,L,location:window.location,URL,URLSearchParams,Blob,console,Map,Set,matchMedia:window.matchMedia,
  parseCultureData,culturePlace,cultureRoutes,validCityPoint,
  requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  navigator:{geolocation:{getCurrentPosition(){calls.geo++;}}},
  fetch:async url=>{
   calls.fetches.push(url);
   if(url.includes('places-caisik/manifest.json')){if(manifestFails)throw Error('Illustration manifest unavailable');return {ok:true,json:async()=>artManifest};}
   return {ok:true,json:async()=>url.includes('locations-data')?atlas:principles};
  },
  artworkMarkup:()=>'<span class="stub-original-art"></span>',
  initPrinciples:()=>({select(){}}),initFrequency:()=>({setInspiration:place=>calls.inspiration.push(place)}),
  createCityExperience:options=>{calls.city=options;return {setPlaces:(...args)=>calls.places.push(args),select:(...args)=>calls.select.push(args),setRoute:route=>calls.routes.push(route),setUserLocation(){},destroy(){}};}
 });
 const runnable=source.replace(/^import[^\n]+\n/gm,'').replace(/\binit\(\);\s*$/,'globalThis.atlasReady=init();');
 vm.runInContext(runnable,context);await context.atlasReady;
 return {window,document,calls,storage,oldObservation,map,group};
}

{
 const h=await bootAtlas();assert(h.calls.city,'missing art must never prevent geographic atlas initialization');
 assert.equal(h.calls.geo,0,'no unrequested geolocation');
 for(const place of atlas.locations){
  h.calls.city.onSelect(place.id);
  const preview=h.document.getElementById('place-preview'),item=byId.get(place.id);
  const image=preview.querySelector(`img[data-place-illustration="${place.id}"]`);
  assert(image,`${place.id}: default discovery image is CAISIK artwork`);assert.equal(image.getAttribute('src'),item.src);
  assert(image.closest(`.place-artwork[data-place-art="${place.id}"]`),'art identity is available to the independent motion layer');
  assert(preview.querySelector(`[data-place-replay="${place.id}"]`),'art motion has an explicit replay control');
  assert.equal(preview.querySelectorAll('img[data-place-photo]').length,0,'archive photo is not the normal discovery hero');
  assert(preview.textContent.includes(place.history),'historical evidence remains exact');
  assert(preview.textContent.includes(place.address),'original address remains exact');
  assert(preview.querySelector(`[data-open-place="${place.id}"]`),'original action survives artwork wrapping');
  h.calls.city.onOpen(place.id);
  const profile=h.document.getElementById('profile-content');
  assert.equal(profile.querySelector(`img[data-place-illustration="${place.id}"]`)?.getAttribute('src'),item.src);
  assert(profile.textContent.includes(place.history));assert(profile.textContent.includes(place.interpretation));
  for(const source of place.sources)assert([...profile.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===source.url),'original historical/access source survives');
  const documentary=profile.querySelector('details.documentary-source');
  if(place.photo){
   assert(documentary,`${place.id}: documentary reference is explicitly expandable`);
   assert(!documentary.hasAttribute('open'),'documentary photograph is not substituted for default art');
   assert(documentary.querySelector('img[data-place-photo]'),'original documentary image is retained');
   for(const value of [place.photo.note,place.photo.author,place.photo.license])assert(documentary.textContent.includes(value),'original caption/credit/licence retained');
   for(const url of [place.photo.sourcePage,place.photo.licenseUrl])assert([...documentary.querySelectorAll('a[href]')].some(a=>a.getAttribute('href')===url));
  }else assert.equal(documentary,null,'a missing documentary photo is not invented');
 }
 h.calls.city.onOpen('notre-dame');
 assert.equal(h.document.getElementById('place-observation').value,h.oldObservation,'existing observation remains available');
 const note='Vlastní poznámka po změně obrazů.';h.document.getElementById('place-observation').value=note;
 h.document.querySelector('[data-save-observation="notre-dame"]').click();
 assert.equal(JSON.parse(h.storage.get('atlas-observations'))['notre-dame'],note,'native note-save handler survives artwork integration');
 h.document.querySelector('#profile-content [data-save-place="notre-dame"]').click();
 assert(!JSON.parse(h.storage.get('atlas-saved-places')).includes('notre-dame'),'native bookmark handler survives artwork integration');
 assert.equal(h.storage.get('caisik-expeditions-v1'),'legacy expedition notebook');assert.equal(h.storage.get('caisik-selfmade-v1'),'legacy selfmade notebook');
 for(const route of atlas.routes){
  h.document.querySelector(`[data-route="${route.id}"]`).click();
  assert.deepEqual(h.calls.routes.at(-1).stops.map(stop=>stop.id),route.stops,'illustrations do not change ordered geography');
  h.document.getElementById('close-route').click();assert.equal(h.calls.routes.at(-1),null);
 }
 h.calls.city.onSelect('notre-dame');
 const preview=h.document.getElementById('place-preview');
 preview.querySelector('img[data-place-illustration]').dispatchEvent(new h.window.Event('error'));
 assert(!preview.querySelector('img[data-place-illustration]'),'failed art does not remain a broken hero');
 assert.match(preview.textContent,/dokument|document|photo|foto|archiv|unavailable|nedostup/i,'fallback states what is being shown');
 assert(preview.querySelector('[data-open-place="notre-dame"]'),'profile action survives asset failure');
 preview.querySelector('[data-open-place="notre-dame"]').click();assert(h.document.getElementById('profile-dialog').open);
 assert(h.document.getElementById('profile-content').textContent.includes(atlas.locations[0].history),'failure does not discard the discovery');
}
{
 const h=await bootAtlas({manifestFails:true});
 assert(h.calls.city,'optional illustration manifest failure does not break the map');
 assert.equal(h.group.layers.length,12,'all original places remain in the 2D fallback');
 assert(h.document.getElementById('place-preview').textContent.includes(atlas.locations[0].history));
}
{
 const invalid=structuredClone(manifest);invalid.illustrations[0].src='https://unrequested.invalid/tracker.webp';
 const h=await bootAtlas({artManifest:invalid});
 assert(h.calls.city);assert(!h.document.querySelector('[src*="unrequested.invalid"]'),'invalid manifest URL is never inserted');
}
assert.deepEqual(atlas.locations,canonical.locations,'visual integration never mutates canonical historical/location data');
assert.deepEqual(atlas.routes,canonical.routes,'visual integration never mutates canonical route data');

function cityModelHarness({reduced=false,loadRejects=false,deferred=false}={}){
 const {window,document}=parseHTML('<html data-motion="on"><head></head><body><div class="map-wrap"><div id="city-map"></div></div></body></html>');
 const maps=[],observers=[],frames=new Map(),mediaHandlers=new Set();let clock=0,frameId=0,resolveModule;
 const calls={loads:0,mounts:[],selections:[],places:[],progress:[],destroy:0,fallback:[],filters:[]};
 const media={matches:reduced,addEventListener(_name,fn){mediaHandlers.add(fn);},removeEventListener(_name,fn){mediaHandlers.delete(fn);},change(value){this.matches=value;for(const fn of mediaHandlers)fn();}};
 class IO{constructor(callback){this.callback=callback;this.connected=true;observers.push(this);}observe(target){this.target=target;}disconnect(){this.connected=false;}show(value=true){this.callback([{target:this.target,isIntersecting:value}]);}}
 class MO{constructor(){}observe(){}disconnect(){}}
 class Bounds{constructor(){this.points=[];}extend(point){this.points.push(point);return this;}}
 class Marker{constructor({element}){this.element=element;}setLngLat(point){this.point=point;return this;}addTo(map){map.options.container.append(this.element);return this;}remove(){this.element.remove();}}
 class MapMock{
  constructor(options){this.options=options;this.events={};this.layers=new Map([['footprints',{id:'footprints',source:'openmaptiles','source-layer':'building',type:'fill'}]]);this.sources={};this.canvas=document.createElement('canvas');options.container.append(this.canvas);this.scrollZoom={disable(){}};this.touchPitch={disable(){}};this.pitch=options.pitch;this.zoom=options.zoom;this.bearing=options.bearing;maps.push(this);}
  on(name,fn){(this.events[name]||=[]).push(fn);return this;}once(name,fn){return this.on(name,fn);}emit(name,event={}){for(const fn of this.events[name]||[])fn(event);}
  getCanvas(){return this.canvas;}getStyle(){return {layers:[...this.layers.values()]};}getLayer(id){return this.layers.get(id);}addLayer(layer){this.layers.set(layer.id,layer);}
  getSource(id){return this.sources[id];}addSource(id,source){this.sources[id]={...source,setData(data){this.data=data;}};}
  setPaintProperty(){}setFilter(id,filter){calls.filters.push([id,filter]);this.layers.get(id).filter=filter;}
  resize(){}stop(){}easeTo(options){this.zoom=options.zoom??this.zoom;this.pitch=options.pitch??this.pitch;this.bearing=options.bearing??this.bearing;}
  jumpTo(options){this.easeTo(options);}fitBounds(){}getPitch(){return this.pitch;}getZoom(){return this.zoom;}getBearing(){return this.bearing;}remove(){this.removed=true;this.canvas.remove();}
 }
 const adapter={setPlaces:(items,id)=>calls.places.push({ids:items.map(p=>p.id),id}),select:(id,options={})=>{calls.selections.push({id,...options});return id?{id,duration:320,focusZoom:17.1}:null;},getState:()=>({count:12,failed:false}),setMotionProgress:progress=>calls.progress.push(progress),destroy:()=>calls.destroy++};
 const module={mountCityLandmarks:(map,gl,options)=>{calls.mounts.push({map,gl,options});return adapter;},getLandmarkExclusionFilter:exclusionFilter};
 const loader=()=>{calls.loads++;if(loadRejects)return Promise.reject(Error('Optional model bundle unavailable'));if(deferred)return new Promise(resolve=>{resolveModule=resolve;});return Promise.resolve(module);};
 window.maplibregl={Map:MapMock,Marker,LngLatBounds:Bounds};window.matchMedia=()=>media;Object.defineProperty(document,'hidden',{value:false,writable:true});
 Object.assign(globalThis,{window,document,IntersectionObserver:IO,MutationObserver:MO,ResizeObserver:MO,performance:{now:()=>clock},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)});
 const host=document.querySelector('.map-wrap'),fallbackElement=document.querySelector('#city-map');
 const api=createCityExperience({host,fallbackElement,places:atlas.locations,landmarksLoader:loader,onFallback:event=>calls.fallback.push(event)});
 api.setPlaces(atlas.locations,'notre-dame');
 const event=(target,name,extra={})=>{const e=new window.Event(name,{bubbles:true,cancelable:true});Object.assign(e,extra);target.dispatchEvent(e);};
 const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 const flush=()=>{let count=0;while(frames.size&&count++<400){clock+=16.67;const work=[...frames.values()];frames.clear();for(const fn of work)fn(clock);}assert(count<400,'animations must settle without an idle frame loop');};
 return {api,host,fallbackElement,maps,calls,observers,frames,media,event,tick,flush,resolve:()=>resolveModule?.(module)};
}
{
 const h=cityModelHarness();assert.equal(h.calls.loads,0);assert.equal(h.maps.length,0,'no GL map or model bundle before viewport discovery');
 h.observers[0].show();h.observers[1].show();await h.tick();
 assert.equal(h.maps.length,1);assert.equal(h.calls.loads,0,'model bundle waits for a ready map style');
 const map=h.maps[0];map.emit('load');await h.tick();
 assert.equal(h.calls.loads,1);assert.equal(h.calls.mounts.length,1);
 assert.equal(h.calls.mounts[0].map,map,'models share the original geographic map instance');
 assert.deepEqual(h.calls.mounts[0].options.places.map(p=>p.id),expectedIds);
 assert.equal(h.host.dataset.landmarkModels,'12');
 assert.match(h.host.querySelector('.city-map-note').textContent,/Autorské 3D modely/,'models are labelled illustrative');
 assert(JSON.stringify(map.getLayer('caisik-buildings').filter).includes('within'),'plain extrusion is excluded beneath authored landmark geometry');
 h.flush();assert.equal(h.frames.size,0);assert.equal(h.calls.progress.at(-1),1,'finite model reveal leaves a complete static end');
 h.event(h.host.querySelector('.city-model-replay'),'click');assert(h.frames.size>0,'explicit model replay schedules finite motion');h.flush();assert.equal(h.calls.progress.at(-1),1);
 h.api.select('sainte-chapelle',{fly:true});assert.equal(h.calls.selections.at(-1).id,'sainte-chapelle');assert.equal(map.zoom,17.1,'selected model supplies a visible focus distance');h.flush();
 h.api.setPlaces(atlas.locations.slice(0,2),'sainte-chapelle');assert.deepEqual(h.calls.places.at(-1).ids,expectedIds.slice(0,2),'filters also control the authored model layer');
 h.media.change(true);h.event(h.host.querySelector('.city-model-replay'),'click');h.flush();assert.equal(h.frames.size,0,'reduced motion keeps models static and complete');assert.equal(h.calls.progress.at(-1),1);
 h.event(h.host.querySelector('.city-map-mode:nth-child(2)'),'click');assert.equal(h.host.dataset.cityMode,'2d');assert.equal(h.frames.size,0);
 h.event(h.host.querySelector('.city-map-mode'),'click');assert.equal(h.host.dataset.cityMode,'3d');assert.equal(h.calls.loads,1,'2D/3D toggles do not duplicate model imports');
 h.event(map.getCanvas(),'webglcontextlost');assert.equal(h.host.dataset.cityMode,'2d');assert.equal(h.calls.destroy,1,'context loss disposes authored geometry');
 assert.deepEqual(map.getLayer('caisik-buildings').filter,['!', ['has','hide_3d']],'fallback restores geographic building rendering rules');
 h.api.destroy();assert.equal(h.frames.size,0);assert(h.observers.every(o=>!o.connected));
}
{
 const h=cityModelHarness({loadRejects:true});h.observers[0].show();h.observers[1].show();await h.tick();h.maps[0].emit('load');await h.tick();
 assert.equal(h.host.dataset.cityMode,'3d','optional model failure retains the working real-geography map');assert.equal(h.calls.mounts.length,0);
 assert.match(h.host.querySelector('.city-map-status').textContent,/modely.*nepodařilo načíst/);
 h.flush();h.api.destroy();
}
{
 const h=cityModelHarness({deferred:true});h.observers[0].show();h.observers[1].show();await h.tick();h.maps[0].emit('load');await h.tick();
 assert.equal(h.calls.loads,1);h.api.destroy();h.resolve();await h.tick();assert.equal(h.calls.mounts.length,0,'late model import never resurrects a destroyed map');assert.equal(h.frames.size,0);
}
console.log('PASS place visuals integration: 12 distinct genuine WebP assets; actual atlas default artwork and documentary credits; original actions/notes/bookmarks/routes; manifest and image failure recovery; 13 alias motion links.');
console.log('PASS landmark bridge: actual city runtime lazy readiness, shared map, selection/filter focus, finite replay/static reduced motion, restored extrusions, context-loss/import-failure/late-import cleanup.');
console.log('Real rendering, architectural resemblance, GPU visibility, and physical-device input require separate visual/browser checks.');
