/* Actual map runtime contracts; no claim that mocks verify GPU appearance. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {harness,places} from './city-map.mjs';
import {validateStyleMin} from '@maplibre/maplibre-gl-style-spec';
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const originalFilter=['!',['has','hide_3d']];
const exclusion=['!', ['within',{type:'MultiPolygon',coordinates:[]}]];
function moduleFixture(){
 const calls={mounts:[],progress:[],destroy:0,select:[],errors:[],sets:[]};
 const module={getLandmarkExclusionFilter:()=>exclusion,mountCityLandmarks(map,gl,options){
  calls.mounts.push({map,gl,options});map.addLayer({id:'caisik-landmark-models',type:'custom'});
  let failed=false;
  const adapter={getState:()=>({count:2,failed}),setPlaces:(items,id)=>calls.sets.push({items,id}),select:(id,options)=>{calls.select.push({id,options});return places.slice(0,2).some(p=>p.id===id)?{id,focusZoom:17.4,duration:320}:null;},setMotionProgress:p=>calls.progress.push(p),destroy(){calls.destroy++;map.removeLayer('caisik-landmark-models');}};
  calls.errors.push(()=>{failed=true;options.onError();});return adapter;
 }};return {module,calls};
}
async function ready(options={}){const h=harness({observer:false,reduced:true,...options});await settle();const map=h.maps[0];map.emit('load');await settle();return {...h,map};}
const choose=(h,mode)=>h.event(h.host.querySelector(mode==='map'?'.city-building-mode:first-child':'.city-building-mode:last-child'),'click');
{
 const fixture=moduleFixture();let loads=0;
 const h=await ready({landmarksLoader:()=>{loads++;return fixture.module;}});
 assert.equal(loads,0,'default geographic view never imports the optional authored model bundle');
 assert.equal(h.host.dataset.cityBuildingMode,'map');assert.equal(h.host.querySelector('.city-building-mode:first-child').getAttribute('aria-pressed'),'true');
 assert(!h.map.getLayer('caisik-landmark-models'));assert.deepEqual(h.map.getLayer('caisik-buildings').filter,originalFilter);
 choose(h,'artwork');await settle();
 assert.equal(loads,1);assert.equal(fixture.calls.mounts.length,1);assert.equal(h.host.dataset.cityBuildingMode,'artwork');
 assert(h.map.getLayer('caisik-landmark-models'));assert.equal(h.host.querySelector('.city-building-mode:last-child').getAttribute('aria-pressed'),'true');
 choose(h,'artwork');await settle();assert.equal(loads,1,'reselecting loaded mode never imports twice');assert.match(h.host.querySelector('.city-map-status').textContent,/VÝTVARNÁ/,'loaded mode never claims a new pending load');
 assert.match(h.host.querySelector('.city-map-note').textContent,/přibližné proporce/);
 assert.deepEqual(h.map.getLayer('caisik-buildings').filter,['all',originalFilter,exclusion],'base cuts require explicit authored mode');
 h.api.select('first',{fly:true});assert.equal(h.map.moves.at(-1).zoom,17.4);
 h.api.select('third');assert.equal(h.host.querySelector('.city-model-replay').hidden,true,'unsupported place has no authored replay');
 choose(h,'map');assert.equal(fixture.calls.destroy,1);assert.equal(h.host.dataset.cityBuildingMode,'map');assert(!h.map.getLayer('caisik-landmark-models'));
 assert.deepEqual(h.map.getLayer('caisik-buildings').filter,originalFilter,'native building filters restored exactly');
 assert.equal(h.host.dataset.landmarkModels,undefined);assert.equal(h.frames.size,0);
 h.api.select('first',{fly:true});assert.equal(h.map.moves.at(-1).zoom,16.8,'geographic view does not retain artistic focus metadata');
 h.api.setRoute({id:'route',stops:places});assert.match(h.host.querySelector('.city-map-note').textContent,/Skutečné mapové půdorysy/);assert.match(h.host.querySelector('.city-map-note').textContent,/nikoliv pěší trasu/);
 h.api.destroy();assert.equal(h.host.dataset.cityBuildingMode,undefined);
}
{
 const fixture=moduleFixture(),releases=[];let loads=0;
 const h=await ready({landmarksLoader:()=>{loads++;return new Promise(resolve=>releases.push(resolve));}});
 choose(h,'artwork');await settle();assert.equal(loads,1);choose(h,'map');choose(h,'artwork');await settle();assert.equal(loads,2);
 releases[0](fixture.module);await settle();assert.equal(fixture.calls.mounts.length,0,'stale earlier opt-in cannot mount');
 releases[1](fixture.module);await settle();assert.equal(fixture.calls.mounts.length,1);assert.equal(h.host.dataset.cityBuildingMode,'artwork');
 fixture.calls.errors[0]();assert.equal(h.host.dataset.cityBuildingMode,'map');assert.equal(fixture.calls.destroy,1);assert.deepEqual(h.map.getLayer('caisik-buildings').filter,originalFilter);assert.match(h.host.querySelector('.city-map-status').textContent,/nejsou/);h.api.destroy();
}
{
 const fixture=moduleFixture();let release;
 const h=await ready({landmarksLoader:()=>new Promise(resolve=>release=resolve)});
 choose(h,'artwork');await settle();choose(h,'map');release(fixture.module);await settle();
 assert.equal(fixture.calls.mounts.length,0);assert.deepEqual(h.map.getLayer('caisik-buildings').filter,originalFilter);h.api.destroy();
}
{
 const fixture=moduleFixture();let release;
 const h=await ready({landmarksLoader:()=>new Promise(resolve=>release=resolve)});
 choose(h,'artwork');await settle();h.api.destroy();release(fixture.module);await settle();assert.equal(fixture.calls.mounts.length,0,'destroyed map cannot be resurrected');
}
{
 const h=await ready({landmarksLoader:()=>Promise.reject(Error('missing artwork bundle'))});choose(h,'artwork');await settle();
 assert.equal(h.host.dataset.cityBuildingMode,'map');assert.equal(h.host.dataset.cityMode,'3d');assert.match(h.host.querySelector('.city-map-status').textContent,/nepodařilo/);assert.deepEqual(h.map.getLayer('caisik-buildings').filter,originalFilter);h.api.destroy();
}
{
 const fixture=moduleFixture();const h=await ready({landmarksLoader:()=>fixture.module});
 const malicious={...places[0],name:'Jméno <img src=x>',address:'<script>untrusted()</script>',coordinateStatus:'Adresní bod IGN; nikoli potvrzený vstup.'};
 h.api.setPlaces([malicious],malicious.id);const copy=h.host.querySelector('.city-map-selected-copy');
 assert(copy.textContent.includes(malicious.name));assert(copy.textContent.includes(malicious.address));assert(copy.textContent.includes(malicious.coordinateStatus));assert.equal(copy.querySelector('img,script'),null,'map identity uses textContent');h.api.destroy();
}
const style=JSON.parse(fs.readFileSync(new URL('../dist/map-data/caisik-style.json',import.meta.url),'utf8'));
const buildings=style.layers.find(layer=>layer.id==='caisik-buildings');
assert.equal(buildings['source-layer'],'building');assert.deepEqual(buildings.paint['fill-extrusion-height'],['to-number',['get','render_height'],0]);assert.match(style.metadata['caisik:height-note'],/Missing height remains flat/);
assert.deepEqual(validateStyleMin(style),[],'official MapLibre style validator accepts published style');
assert(style.layers.some(layer=>layer.id==='caisik-building-footprints'&&layer.type==='fill'),'source footprint geometry remains visible without height');
console.log('PASS city identity: real map buildings default; zero invented height; explicit authored opt-in; lazy/late-import lifecycle; exact filter restoration; address evidence and safe text; static fallback survives failures.');
