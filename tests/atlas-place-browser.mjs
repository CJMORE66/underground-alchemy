/* Actual atlas runtime: mobile current-place browsing, not a duplicate state model. */
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
const research=JSON.parse(read('culture-data.json'));
const result=parseCultureData(research,atlas.locations.map(p=>p.id));
const principles=JSON.parse(read('principles-data.json'));
const illustrationManifest=JSON.parse(read('assets/places-caisik/manifest.json'));
const html=read('index.html'),source=read('atlas.js');
async function boot({data=research,dataFails=false,boardFails=false,storageFails=false,motion='off',mobile=true}={}){
 const {window,document}=parseHTML(html);document.getElementById('place-list').scrollTop=0;document.getElementById('place-list').scrollLeft=0;
 const oldNote='Původní pozorování zůstává přesně uložené.';
 const oldCultureNote='Moje starší poznámka ke kulturnímu místu.';
 const notes={'notre-dame':oldNote,[result.places[0].id]:oldCultureNote,'unknown-retained-id':'Neznámá poznámka pro obnovu.'};
 const storage=new Map([
  ['atlas-saved-places',JSON.stringify(['notre-dame',result.places[0].id])],
  ['atlas-observations',JSON.stringify(notes)],['atlas-motion',JSON.stringify(motion)],
  ['caisik-expeditions-v1','untouched-expeditions'],['caisik-selfmade-v1','untouched-selfmade']
 ]);
 const mediaListeners=new Set(),mobileMedia={matches:mobile,addEventListener(type,fn){mediaListeners.add(fn);},removeEventListener(type,fn){mediaListeners.delete(fn);}};
 let focused=null;const calls={pageScroll:0,focus:[],geo:0,markers:[],pans:[],lines:[],city:null,sets:[],selections:[],routes:[],board:null,boardDestroyed:0,download:null,errors:[]};
 Object.defineProperty(document,'activeElement',{get:()=>focused,configurable:true});
 window.HTMLElement.prototype.focus=function(options){focused=this;calls.focus.push({element:this,preventScroll:options?.preventScroll});};
 window.HTMLElement.prototype.scrollIntoView=function(){calls.pageScroll++;};
 window.HTMLElement.prototype.getBoundingClientRect=function(){
  if(this.id==='place-list')return {top:100,bottom:300,left:0,right:320,width:320,height:200};
  if(this.hasAttribute('data-select-place')){const index=[...this.parentElement.children].indexOf(this),top=100+index*56-(this.parentElement.scrollTop||0);return {top,bottom:top+56,left:0,right:320,width:320,height:56};}
  return {top:0,bottom:0,left:0,right:0,width:0,height:0};
 };
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
 window.L=L;window.matchMedia=query=>query.includes('max-width')?mobileMedia:({matches:false});window.location={pathname:'/',hash:''};
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
 return {window,document,calls,storage,map,group,oldNote,oldCultureNote,mobileMedia,mediaListeners};
}

const choose=(h,id)=>{const select=h.document.getElementById('place-quick-select');const option=[...select.options].find(option=>option.value===id);if(option)option.selected=true;select.dispatchEvent(new h.window.Event('change',{bubbles:true}));};
const key=(h,element,value)=>{const event=new h.window.Event('keydown',{bubbles:true,cancelable:true});event.key=value;element.dispatchEvent(event);return event;};
const selected=h=>h.document.querySelector('#place-list [aria-pressed="true"]')?.dataset.selectPlace;
const position=h=>h.document.querySelector('[data-place-position]').textContent;
const step=(h,n)=>h.document.querySelector(`[data-place-step="${n}"]`);
const list=h=>h.document.getElementById('place-list');
{
 const h=await boot();
 assert.equal(h.calls.errors.length,0,'real atlas initializes');
 const nav=h.document.querySelector('.place-browser'),select=h.document.getElementById('place-quick-select'),preview=h.document.getElementById('place-preview');
 assert(nav&&select);assert.equal(list(h).parentElement,nav,'same original list lives in the chooser');
 assert.equal(nav.parentElement,preview.parentElement,'sticky navigation remains in the detail containing block');
 assert.equal(list(h).hidden,true,'mobile catalogue is folded by default');
 assert.equal(select.options.length,32);assert.equal(position(h),'01 / 32 VE VÝBĚRU');assert(step(h,-1).disabled);assert(!step(h,1).disabled);
 const originalPrev=step(h,-1),originalNext=step(h,1),oldNote=h.storage.get('atlas-observations');
 step(h,1).click();assert.equal(selected(h),'sainte-chapelle');assert.equal(position(h),'02 / 32 VE VÝBĚRU');assert.match(preview.textContent,/Sainte-Chapelle/);
 assert.equal(h.calls.selections.at(-1)[0],'sainte-chapelle','actual map selection follows next');
 choose(h,'studios-ferber');assert.equal(selected(h),'studios-ferber');assert.equal(position(h),'32 / 32 VE VÝBĚRU');assert(step(h,1).disabled);
 assert.equal(step(h,-1),originalPrev);assert.equal(step(h,1),originalNext);assert.equal(h.document.getElementById('place-quick-select'),select,'native controls retain DOM identities across selection');
 h.document.querySelector('[data-layer="Philosophy"]').focus({preventScroll:true});h.document.querySelector('[data-layer="Philosophy"]').click();assert.equal(h.document.activeElement.dataset.layer,'Philosophy','filter rerender restores keyboard focus');
 assert.equal(select.options.length,3,'quick picker follows the actual filtered list');assert.equal(position(h),'01 / 03 VE VÝBĚRU');
 const philosophyIds=[...list(h).querySelectorAll('[data-select-place]')].map(b=>b.dataset.selectPlace);
 step(h,1).click();assert.equal(selected(h),philosophyIds[1]);step(h,1).click();assert.equal(selected(h),philosophyIds[2]);assert(step(h,1).disabled);
 h.document.getElementById('place-search').value='nothing-matches-this-real-fixture';h.document.getElementById('place-search').dispatchEvent(new h.window.Event('input',{bubbles:true}));
 assert(select.disabled);assert(step(h,-1).disabled);assert(step(h,1).disabled);assert.equal(position(h),'00 / 00 VE VÝBĚRU');assert(h.document.querySelector('[data-reset-filters]'));
 h.document.querySelector('[data-reset-filters]').click();assert.equal(select.options.length,32);assert(!select.disabled);
 const noPin=result.places.find(p=>p.lat===null);const pans=h.calls.pans.length;choose(h,noPin.id);assert.equal(selected(h),noPin.id);assert.equal(h.calls.pans.length,pans,'address-only discovery never pans to an invented point');assert.match(preview.textContent,new RegExp(noPin.name.split(' — ')[0]));
 const toggle=h.document.querySelector('[data-place-list-toggle]');toggle.click();assert.equal(list(h).hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert(list(h).scrollTop>0,'only the selected list viewport moves to the late item');
 const active=list(h).querySelector('[aria-pressed="true"]');const down=key(h,active,'ArrowDown');assert(down.defaultPrevented);assert.equal(h.document.activeElement.dataset.selectPlace,selected(h));
 const first=key(h,h.document.activeElement,'Home');assert(first.defaultPrevented);assert.equal(selected(h),'notre-dame');
 key(h,h.document.activeElement,'End');assert.equal(selected(h),'studios-ferber');assert.equal(position(h),'32 / 32 VE VÝBĚRU');
 key(h,h.document.activeElement,'Escape');assert.equal(list(h).hidden,true);assert.equal(h.document.activeElement,select);assert.equal(h.calls.focus.at(-1).preventScroll,true);
 toggle.click();list(h).querySelector('[data-select-place="sainte-chapelle"]').click();assert.equal(list(h).hidden,true);assert.equal(selected(h),'sainte-chapelle');assert.equal(h.document.activeElement,select);
 // A map marker can select a place without moving keyboard focus or page scroll.
 const focused=h.document.activeElement;h.calls.city.onSelect('republique');assert.equal(selected(h),'republique');assert.equal(h.document.activeElement,focused);assert.equal(select.value,'republique');
 h.mobileMedia.matches=false;for(const fn of h.mediaListeners)fn();assert.equal(list(h).hidden,false,'desktop catalogue remains available');assert.equal(toggle.getAttribute('aria-expanded'),'true');
 h.mobileMedia.matches=true;for(const fn of h.mediaListeners)fn();assert.equal(list(h).hidden,true);assert.equal(selected(h),'republique','responsive changes preserve selection');
 assert.equal(h.calls.geo,0,'browsing does not request geolocation');assert.equal(h.calls.pageScroll,0,'changing a place never scrolls the whole page');assert.equal(h.storage.get('atlas-observations'),oldNote,'browsing never modifies notes');
 assert.equal(h.storage.get('caisik-expeditions-v1'),'untouched-expeditions');assert.equal(h.storage.get('caisik-selfmade-v1'),'untouched-selfmade');
 const hide=new h.window.Event('pagehide');hide.persisted=false;h.window.dispatchEvent(hide);assert.equal(h.mediaListeners.size,0,'matchMedia listener is removed on final teardown');
}
{
 const h=await boot({dataFails:true});assert.equal(h.document.getElementById('place-quick-select').options.length,12,'optional culture failure keeps the original atlas browsable');step(h,1).click();assert.equal(selected(h),'sainte-chapelle');assert.equal(h.calls.pageScroll,0);
}
console.log('PASS mobile atlas browser: actual32-place filtered navigation, native quick picker, bounded selectable catalogue, stable controls/focus, list-only reveal, keyboard Home/End/arrows/Escape, map selection, no-pin/no-result/reset behavior, responsive lifecycle and untouched notes; original12-place fallback.');
