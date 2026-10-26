/* Actual DOM/runtime checks. These do not substitute for rendered artwork QA. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
const source=fs.readFileSync(new URL('../dist/place-art-motion.js',import.meta.url),'utf8');
function fixture(id='notre-dame',extra=''){
 return `<!doctype html><html data-motion="on"><body><div id="poster" class="place-image place-artwork" data-place-art="${id}"><img data-place-illustration="${id}" src="/assets/places-caisik/${id}.webp" alt="Original CAISIK illustration"><span class="image-credit">Contemporary CAISIK artwork</span><button data-place-replay="${id}" id="replay">OŽIVIT ILUSTRACI ↻</button></div><img id="archive" data-place-photo="notre-dame" src="/archive.jpg" alt="Documentary archival photograph">${extra}</body></html>`;
}
function harness({html=fixture(),reduced=false,io=true,mo=true}={}){
 const {window,document}=parseHTML(html);delete window.CaisikPlaceArtMotion;const frames=new Map(),observers=[],mutations=[];let serial=0,clock=0;
 Object.defineProperty(document,'hidden',{value:false,writable:true});
 Object.defineProperty(window.HTMLImageElement.prototype,'complete',{get:()=>true,configurable:true});Object.defineProperty(window.HTMLImageElement.prototype,'naturalWidth',{get:()=>1536,configurable:true});
 window.HTMLElement.prototype.getBoundingClientRect=()=>({top:100,bottom:450,left:0,right:600,width:600,height:350});
 const media={matches:reduced,handlers:new Set(),addEventListener(t,fn){this.handlers.add(fn);},removeEventListener(t,fn){this.handlers.delete(fn);},change(value){this.matches=value;for(const fn of this.handlers)fn();}};
 const fine={matches:true,addEventListener(){},removeEventListener(){}};window.matchMedia=query=>query.includes('prefers-reduced-motion')?media:fine;
 class IO{constructor(callback){this.callback=callback;this.targets=new Set();observers.push(this);}observe(el){this.targets.add(el);}unobserve(el){this.targets.delete(el);}disconnect(){this.targets.clear();}show(el,value){this.callback([{target:el,isIntersecting:value}]);}}
 class MO{constructor(callback){this.callback=callback;this.on=true;mutations.push(this);}observe(){}disconnect(){this.on=false;}}
 const requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame=id=>frames.delete(id);
 const context=vm.createContext({window,document,console,requestAnimationFrame,cancelAnimationFrame,...(io?{IntersectionObserver:IO}:{}),...(mo?{MutationObserver:MO}:{})});
 const archive=document.getElementById('archive'),button=document.getElementById('replay');let nativeClicks=0;button?.addEventListener('click',()=>nativeClicks++);
 vm.runInContext(source,context);
 const tick=(count=1,ms=16.667)=>{for(let i=0;i<count;i++){const current=[...frames.values()];frames.clear();clock+=ms;for(const fn of current)fn(clock);}};
 const show=(el,value=true)=>{for(const observer of observers)if(observer.targets.has(el))observer.show(el,value);};
 const mutate=records=>{for(const observer of mutations)if(observer.on)observer.callback(records);};
 const event=(el,type,props={})=>{const e=new window.Event(type,{bubbles:true});for(const[k,v]of Object.entries(props))Object.defineProperty(e,k,{value:v});el.dispatchEvent(e);};
 return {window,document,frames,observers,mutations,media,tick,show,mutate,event,archive,button,nativeClicks:()=>nativeClicks,api:window.CaisikPlaceArtMotion};
}
{
 const h=harness(),poster=h.document.getElementById('poster'),svg=poster.querySelector('svg'),photo=h.archive;
 assert.equal(h.api.stats().items,1);assert.equal(h.api.stats().running,false,'no visible artwork means no idle RAF');
 assert.equal(poster.querySelector('img').getAttribute('alt'),'Original CAISIK illustration');assert.strictEqual(h.document.getElementById('replay'),h.button,'original replay control retains its identity');assert.strictEqual(h.document.getElementById('archive'),photo);assert.equal(photo.parentElement.querySelectorAll('.place-art-motion-overlay').length,1,'archive photo is not enhanced');
 assert(svg.getAttribute('aria-hidden')==='true');assert(svg.hasAttribute('hidden'),'SVG uses reflected attribute rather than a browser-only JS expando');assert.equal(svg.getAttribute('viewBox'),'0 0 1536 1024');assert(svg.querySelectorAll('clipPath').length>=2,'real painted interior windows use bounded source patches');assert(svg.querySelectorAll('.place-art-ink-trace').length>=5,'multiple actual architectural details are independent');
 h.show(poster);assert(h.frames.size===1);h.tick(25,40);assert(!svg.hasAttribute('hidden'));const before=svg.querySelector('.place-art-ink-trace').style.strokeDashoffset;assert(Number(before)<1,'ink draws along its own path');const transform=svg.querySelector('g g').getAttribute('transform');assert.match(transform,/rotate\(/);h.event(poster,'pointerenter',{pointerType:'mouse'});h.tick();assert(poster.classList.contains('place-art-hover'));assert.notEqual(svg.querySelector('g g').getAttribute('transform'),transform,'pointer changes the internal paint response');
 h.button.click();h.tick();assert.equal(h.nativeClicks(),1,'original control handler still fires');assert.equal(svg.querySelector('.place-art-ink-trace').style.strokeDashoffset,'1.0000','replay restarts the architectural sequence');assert(poster.querySelector('[role=status]').textContent.startsWith('Přehrávám:'),'replay reports its actual result');assert.equal(poster.querySelector('.place-art-motion-phase').textContent,'KRESBA / OBRYSY');
 h.tick(45,50);assert(Number(svg.querySelector('.place-art-ink-trace').style.opacity)>.7,'construction is conspicuous within the first 2.3 seconds, not delayed behind a 16-second loop');assert(Number(svg.querySelector('.place-art-window-light').style.opacity)>.3,'internal window light visibly develops');assert.equal(svg.querySelectorAll('.place-art-ink-underlay').length,svg.querySelectorAll('.place-art-ink-trace').length,'contrasting source-aligned under-ink accompanies every trace');assert.equal(svg.querySelectorAll('.place-art-ink-runner').length,svg.querySelectorAll('.place-art-ink-trace').length,'separate light nibs travel the actual outlines');
 h.show(poster,false);assert.equal(h.frames.size,0);assert(svg.hasAttribute('hidden'),'offscreen paint has no running overlay');
 h.api.destroy();assert.equal(h.api.stats().items,0);assert.equal(h.frames.size,0);assert(!poster.querySelector('svg'));assert.strictEqual(h.document.getElementById('replay'),h.button);assert.strictEqual(h.document.getElementById('archive'),photo);
}
{
 const h=harness(),poster=h.document.getElementById('poster');h.show(poster);h.tick();h.media.change(true);assert.equal(h.frames.size,0);assert(poster.querySelector('svg').hasAttribute('hidden'));h.button.click();assert.equal(h.frames.size,0,'replay never overrides reduced motion');assert.match(poster.querySelector('[role=status]').textContent,/Systém požaduje/,'blocked replay explains reduced motion rather than silently doing nothing');assert(poster.querySelector('[role=status]').classList.contains('is-feedback'),'blocked result is also visually discoverable');assert.equal(poster.querySelector('.place-art-motion-phase').textContent,'ANIMACE VYPNUTY');h.media.change(false);assert(h.frames.size===1);h.document.documentElement.dataset.motion='off';h.mutate([{type:'attributes'}]);h.tick();assert.equal(h.frames.size,0);assert(poster.querySelector('svg').hasAttribute('hidden'));h.button.click();assert.match(poster.querySelector('[role=status]').textContent,/RESUME MOTION/,'saved global pause has a concrete recovery instruction');h.document.documentElement.dataset.motion='on';h.mutate([{type:'attributes'}]);h.tick();assert(h.frames.size===1);h.document.hidden=true;h.document.dispatchEvent(new h.window.Event('visibilitychange'));assert.equal(h.frames.size,0);h.api.destroy();
}
{
 const extra='<dialog open><div id="dialog-poster" class="place-artwork" data-place-art="notre-dame"><img data-place-illustration="notre-dame" src="/assets/places-caisik/notre-dame.webp"><button data-place-replay="notre-dame">Replay</button></div></dialog>';
 const h=harness({html:fixture('notre-dame',extra)}),background=h.document.getElementById('poster'),foreground=h.document.getElementById('dialog-poster');
 h.show(background);h.show(foreground);h.tick();assert(background.querySelector('svg').hasAttribute('hidden'),'background art pauses behind modal');assert(!foreground.querySelector('svg').hasAttribute('hidden'));const ids=[...h.document.querySelectorAll('clipPath')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length,'each poster owns unique SVG clip references');foreground.remove();h.mutate([{type:'childList',addedNodes:[],removedNodes:[foreground]}]);h.tick();assert.equal(h.api.stats().items,1,'removed dynamic preview detaches listeners and SVG');h.api.destroy();
}
{
 const h=harness();let poster=h.document.getElementById('poster');h.show(poster);h.tick();h.event(poster.querySelector('img'),'error');assert.equal(h.frames.size,0);assert(poster.querySelector('svg').hasAttribute('hidden'),'failed artwork keeps a static fallback, no paint animation');h.api.destroy();
}
{
 const h=harness();const poster=h.document.getElementById('poster');h.show(poster);h.tick();const e=new h.window.Event('pagehide');Object.defineProperty(e,'persisted',{value:true});h.window.dispatchEvent(e);assert.equal(h.frames.size,0);h.window.dispatchEvent(new h.window.Event('pageshow'));h.tick();assert.equal(h.api.stats().items,1);h.window.dispatchEvent(new h.window.Event('pagehide'));assert.equal(h.api.stats().items,0);assert.equal(h.frames.size,0);
}
{
 const h=harness({io:false,mo:false});assert.equal(h.frames.size,0,'without visibility APIs use the readable static poster');h.button.click();assert.equal(h.frames.size,0);h.api.destroy();
}
{
 const ids=['notre-dame','sainte-chapelle','flamel-house','saint-sulpice','pere-lachaise','republique','abbesses','mur-oberkampf','la-place','centquatre','philharmonie','shakespeare-company'];
 const signatures=new Set();
 for(const id of ids){
  assert(fs.existsSync(new URL(`../dist/assets/places-caisik/${id}.webp`,import.meta.url)),`${id}: inspected delivery artwork exists`);
  const h=harness({html:fixture(id)}),poster=h.document.getElementById('poster');
  assert.equal(h.api.stats().scenes.length,12,'all requested places have independent scene definitions');
  assert(poster.dataset.placeMotion.length>12,`${id}: meaningful local motion description`);
  const lines=[...poster.querySelectorAll('.place-art-ink-trace')];assert(lines.length>=5,`${id}: actual architectural detail paths`);
  const signature=lines.map(p=>p.getAttribute('d')).join('|');assert(!signatures.has(signature),`${id}: not a reused generic animated diagram`);signatures.add(signature);
  h.show(poster);h.tick(20,50);assert(!poster.querySelector('svg').hasAttribute('hidden'));assert(lines.some(line=>Number(line.style.strokeDashoffset)<1),`${id}: detail sequence really progresses`);h.show(poster,false);assert.equal(h.frames.size,0);h.api.destroy();
 }
 assert.equal(signatures.size,12);
}
console.log('PASS place artwork motion: traced architectural details, bounded painted patches, native replay handlers, pointer changes, dialog/visibility/reduced-motion pause, unique SVG references, dynamic cleanup, BFCache and static API/image fallbacks.');
