/* Atlas-to-city bridge checks. MapLibre/WebGL/rendered tiles are tested separately. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('dist/index.html'),source=read('dist/atlas.js');
const atlas=JSON.parse(read('dist/locations-data.json')),principles=JSON.parse(read('dist/principles-data.json'));
const ids=['notre-dame','sainte-chapelle','flamel-house','saint-sulpice','pere-lachaise','republique','abbesses','mur-oberkampf','la-place','centquatre','philharmonie','shakespeare-company'];
assert.deepEqual(atlas.locations.map(p=>p.id),ids);assert.equal(atlas.routes.length,3);
const aliases=fs.readdirSync(path.join(dist,'q'),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>`q/${e.name}/index.html`);
assert.equal(aliases.length,12);
for(const name of ['index.html',...aliases]){
 const {document}=parseHTML(fs.readFileSync(path.join(dist,name),'utf8'));
 assert.equal(document.querySelectorAll('#city-map').length,1,`${name}: one original 2D map target`);
 assert.equal(document.querySelectorAll('.map-wrap').length,1,`${name}: exactly one additive stage wrapper`);
 assert(document.querySelector('#city-map').closest('.map-wrap'));
 for(const asset of ['/city-map.css','/city-atlas.css'])assert.equal([...document.querySelectorAll('link')].filter(n=>n.getAttribute('href')?.split('?')[0]===asset).length,1,`${name}: one ${asset}`);
 for(const id of ['place-search','period-filter','access-filter','place-list','place-preview','routes','active-route','profile-dialog','notebook-dialog'])assert(document.getElementById(id),`${name}: original ${id} retained`);
}
for(const file of ['dist/city-map.js','dist/city-map.css','dist/city-atlas.css','dist/map-data/caisik-style.json','dist/vendor/maplibre-gl.js','dist/vendor/maplibre-gl.css','dist/vendor/maplibre-gl-worker.mjs','dist/vendor/maplibre-gl-LICENSE.txt'])assert(fs.statSync(path.join(root,file)).size>0,`Missing production asset ${file}`);
const style=JSON.parse(read('dist/map-data/caisik-style.json'));assert.equal(style.version,8);assert(style.layers.some(l=>l.type==='fill-extrusion'&&l['source-layer']==='building'),'real geographic footprints provide 3D building source');for(const entry of Object.values(style.sources))if(entry.url)assert.equal(new URL(entry.url).protocol,'https:');assert.match(style.metadata['caisik:height-note'],/illustrative|approximation/i,'missing heights remain disclosed as illustration');

async function bootAtlas(){
 const {window,document}=parseHTML(html),calls={city:null,sets:[],select:[],route:[],user:[],tiles:[],geo:0,ready:0,profile:0},storage=new Map([['atlas-saved-places','["notre-dame"]'],['caisik-expeditions-v1','legacy expedition notes']]);
 window.HTMLElement.prototype.scrollIntoView=function(){};
 document.querySelectorAll('dialog').forEach(d=>{d.showModal=()=>{d.open=true;d.setAttribute('open','');};d.close=()=>{d.open=false;d.removeAttribute('open');d.dispatchEvent(new window.Event('close'));};});
 const map={layers:[],setView(){return this;},panTo(point){this.pan=point;return this;},fitBounds(bounds){this.bounds=bounds;},removeLayer(layer){this.layers=this.layers.filter(x=>x!==layer);},invalidateSize(){}};
 const group={layers:[],addTo(){return this;},clearLayers(){this.layers=[];},eachLayer(fn){this.layers.forEach(fn);}};
 const L={map:()=>map,layerGroup:()=>group,divIcon:x=>x,control:{scale:()=>({addTo(){}})},marker:(point,options)=>{const el=document.createElement('div'),events={};return {point,options,getElement:()=>el,bindTooltip(){return this;},on(type,fn){events[type]=fn;return this;},addTo(parent){parent.layers.push(this);return this;}};},polyline:(points,options)=>({points,options,getBounds:()=>points,addTo(parent){parent.layers.push(this);return this;}}),tileLayer:(url,options)=>{calls.tiles.push({url,options});return {on(){return this;},addTo(){return this;}};}};
 window.L=L;window.matchMedia=()=>({matches:false});window.location={pathname:'/',hash:''};
 const context=vm.createContext({window,document,L,location:window.location,URL,URLSearchParams,Blob,console,Map,Set,matchMedia:window.matchMedia,requestAnimationFrame:fn=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{geolocation:{getCurrentPosition(success){calls.geo++;success({coords:{latitude:48.86,longitude:2.35}});}}},fetch:async url=>({ok:true,json:async()=>url.includes('locations-data')?atlas:principles}),artworkMarkup:()=>'<span class="stub-original-art"></span>',initPrinciples:()=>({select(){}}),initFrequency:()=>({setInspiration(){}}),createCityExperience:options=>{calls.city=options;return {setPlaces:(...args)=>calls.sets.push(args),select:(...args)=>calls.select.push(args),setRoute:r=>calls.route.push(r),setUserLocation:p=>calls.user.push(p),destroy(){}};}});
 const runnable=source.replace(/^import[^\n]+\n/gm,'').replace(/\binit\(\);\s*$/,'globalThis.atlasReady=init();');
 vm.runInContext(runnable,context);await context.atlasReady;
 return {window,document,calls,storage,map,group};
}
{
 const h=await bootAtlas();
 assert(h.calls.city,'actual atlas initializes the new city enhancement');assert(h.calls.city.host.classList.contains('map-wrap')); assert.strictEqual(h.calls.city.fallbackElement,h.document.getElementById('city-map'));assert.deepEqual(h.calls.city.places.map(p=>p.id),ids);assert.equal(h.calls.sets.at(-1)[0].length,12);assert.equal(h.group.layers.length,12,'existing geographic fallback retains every marker');assert.equal(h.calls.tiles.length,0,'2D tiles are not requested while 3D owns the view');assert.equal(h.calls.geo,0,'the enhancement does not request geolocation on load');
 h.calls.city.onSelect('sainte-chapelle');assert.equal(h.calls.select.at(-1)[0],'sainte-chapelle');assert.equal(h.calls.select.at(-1)[1].fly,true);assert.match(h.document.getElementById('place-preview').textContent,/Sainte-Chapelle/i);
 h.calls.city.onOpen('notre-dame');assert(h.document.getElementById('profile-dialog').open);const profile=h.document.getElementById('profile-content');for(const label of ['Historical evidence','Documented symbols','Artistic interpretation','Access & the public boundary','Sources & visitor information'])assert(profile.textContent.includes(label));assert.equal(profile.querySelectorAll('a[href^="https:"]').length>0,true);assert(profile.querySelector('[data-save-observation="notre-dame"]'),'the real personal observation action remains');
 for(const route of atlas.routes){h.document.querySelector(`[data-route="${route.id}"]`).click();const sent=h.calls.route.at(-1);assert.equal(sent.id,route.id);assert.deepEqual(sent.stops.map(p=>p.id),route.stops,'city receives real source-ordered places');assert.equal(h.document.querySelectorAll('#active-route [data-route-stop]').length,route.stops.length);assert.match(h.document.getElementById('active-route').textContent,/not a walkable path/i);h.document.getElementById('close-route').click();assert.equal(h.calls.route.at(-1),null);}
 const search=h.document.getElementById('place-search');search.value='Flamel';search.dispatchEvent(new h.window.Event('input'));assert.deepEqual(h.calls.sets.at(-1)[0].map(p=>p.id),['flamel-house'],'actual search filters both original list and new map');
 h.calls.city.onFallback({reason:'No WebGL',error:true});assert.equal(h.calls.tiles.length,1);assert.match(h.calls.tiles[0].url,/tile\.openstreetmap\.org/);h.calls.city.onFallback({reason:'Retry'});assert.equal(h.calls.tiles.length,1,'fallback does not duplicate its tile layer');
 h.document.getElementById('locate').click();assert.equal(h.calls.geo,1);assert.deepEqual(JSON.parse(JSON.stringify(h.calls.user.at(-1))),{lat:48.86,lng:2.35});assert.equal(h.storage.get('caisik-expeditions-v1'),'legacy expedition notes');
 h.document.querySelector('[data-save-place="flamel-house"]').click();assert(JSON.parse(h.storage.get('atlas-saved-places')).includes('flamel-house'));assert(JSON.parse(h.storage.get('atlas-saved-places')).includes('notre-dame'),'new map does not clear prior bookmarks');
}
{
 // Exercise the real wiring tool against isolated HTML copies, never the active checkout.
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'caisik-city-wire-'));
 try{
  fs.mkdirSync(path.join(temp,'tools'),{recursive:true});fs.copyFileSync(path.join(root,'tools/wire-selfmade.py'),path.join(temp,'tools/wire-selfmade.py'));
  const pages=['index.html','art/index.html','logo/index.html',...aliases];
  for(const name of pages){const file=path.join(temp,'dist',name);fs.mkdirSync(path.dirname(file),{recursive:true});let content=fs.readFileSync(path.join(dist,name),'utf8');if(name==='index.html'||name.startsWith('q/')){content=content.replace(/<link[^>]+href="\/city-(?:atlas|map)\.css[^>]+>/g,'').replace(/<div class="city-scene-heading">[\s\S]*?<\/div><div class="map-wrap"><div id="city-map"[^>]*><\/div><\/div>/,'<div id="city-map" role="region" aria-label="Interactive geographic map of Paris discoveries"></div>');}fs.writeFileSync(file,content);}
  execFileSync('python',[path.join(temp,'tools/wire-selfmade.py')],{stdio:'pipe'});const snapshots=new Map(pages.map(p=>[p,fs.readFileSync(path.join(temp,'dist',p),'utf8')]));execFileSync('python',[path.join(temp,'tools/wire-selfmade.py')],{stdio:'pipe'});for(const [name,first]of snapshots){assert.equal(fs.readFileSync(path.join(temp,'dist',name),'utf8'),first,`${name}: second wiring is byte-identical`);if(name==='index.html'||name.startsWith('q/')){const {document}=parseHTML(first);assert.equal(document.querySelectorAll('.map-wrap').length,1);assert.equal(document.querySelectorAll('#city-map').length,1);assert.equal(document.querySelectorAll('link[href^="/city-map.css?"]').length,1);}}
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
console.log('PASS city atlas integration: 13 actual wrappers/assets; 12 original markers/profiles/actions; 3 source-ordered routes; selection/filter/geolocation bridge; nonduplicating 2D fallback; isolated idempotent wiring.');
console.log('MapLibre rendering, remote tile availability, visual choreography and physical-device input require browser checks.');
