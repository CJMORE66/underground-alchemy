import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

const source=fs.readFileSync(new URL('../dist/selfmade-motion.js',import.meta.url),'utf8');
const archive=fs.readFileSync(new URL('../dist/art/index.html',import.meta.url),'utf8');
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/art/artworks.json',import.meta.url),'utf8'));
const artworkRows=Array.isArray(catalog)?catalog:catalog.artworks;
function harness({html=archive,reducedMotion=false,stored=null}={}){
 const {window,document}=parseHTML(html);
 const frames=new Map(),io=[],mutations=[];let serial=0;
 const reduced={matches:reducedMotion,addEventListener(){},removeEventListener(){}};
 class IO{constructor(callback){this.callback=callback;this.targets=[];io.push(this);}observe(el){this.targets.push(el);}unobserve(el){this.targets=this.targets.filter(x=>x!==el);}disconnect(){this.targets=[];}}
 class MO{constructor(callback){this.callback=callback;mutations.push(this);}observe(){}disconnect(){}}
 window.matchMedia=()=>reduced;window.IntersectionObserver=IO;window.CAISIK_ART=artworkRows;
 document.hidden=false;
 const ctx={window,document,HTMLElement:window.HTMLElement,customElements:window.customElements,MutationObserver:MO,IntersectionObserver:IO,AbortController,localStorage:{getItem:()=>stored},matchMedia:()=>reduced,requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),console};
 const context=vm.createContext(ctx);vm.runInContext(source,context);
 const shown=[];
 document.addEventListener('click',()=>{});
 const makeDialogReady=()=>{
  const dialog=document.querySelector('.sm-motion-dialog');
  if(dialog&&!dialog.showModal){dialog.showModal=()=>{dialog.open=true;dialog.setAttribute('open','');shown.push(true);};dialog.close=()=>{dialog.open=false;dialog.removeAttribute('open');dialog.dispatchEvent(new window.Event('close'));};}
  return dialog;
 };
 // linkedom has no dialog API; install at creation before click handlers run.
 const create=document.createElement.bind(document);document.createElement=name=>{const el=create(name);if(name==='dialog'){el.showModal=()=>{el.open=true;el.setAttribute('open','');shown.push(true);};el.close=()=>{el.open=false;el.removeAttribute('open');el.dispatchEvent(new window.Event('close'));};}return el;};
 return {window,document,io,mutations,reduced,frames,shown,api:window.CaisikSelfmadeMotion,makeDialogReady};
}
{
 const h=harness();
 const cards=[...h.document.querySelectorAll('.mw-art-card')];
 assert.equal(cards.length,100);
 assert.equal(h.document.querySelectorAll('.sm-scene-frame').length,100,'all100 artwork originals gain a scene');
 assert.equal(h.document.querySelectorAll('.sm-study-button').length,100,'all100 have keyboard/touch study actions');
 assert.equal(h.document.querySelectorAll('.sm-scene-frame > img').length,100,'original raster retained');
 assert.equal(h.document.querySelectorAll('.mw-art-open .sm-study-button').length,0,'no nested buttons');
 assert.equal(h.document.querySelector('.mw-art-card img').getAttribute('src'),'/assets/masterworks-v2/001-thumb.webp');
 assert.equal(h.frames.size,0,'100cards do not allocate RAF loops');
 for(const observer of h.io)observer.callback(observer.targets.map(target=>({target,isIntersecting:true})));
 assert.equal(h.document.querySelectorAll('.sm-is-moving').length,100);
 h.document.documentElement.dataset.motion='off';h.mutations.at(-1).callback([]);
 assert.equal(h.document.querySelectorAll('.sm-is-moving').length,0,'globalpause stops all cards');
 h.document.documentElement.dataset.motion='on';h.document.documentElement.dataset.selfmadeMotion='quiet';h.mutations.at(-1).callback([]);
 assert.equal(h.document.querySelectorAll('.sm-is-moving').length,0,'quiet motion stops all cards');
 h.document.documentElement.dataset.selfmadeMotion='reduced';h.mutations.at(-1).callback([]);assert.equal(h.document.querySelectorAll('.sm-is-moving').length,0,'reduced setting stops all cards');
 h.document.documentElement.dataset.selfmadeMotion='full';h.mutations.at(-1).callback([]);
 h.document.querySelector('.sm-study-button').click();
 const dialog=h.document.querySelector('.sm-motion-dialog');assert(dialog.open);
 assert.equal(dialog.querySelectorAll('[data-sm-phase]').length,4);
 assert.equal(dialog.querySelector('.sm-study-stage > img').getAttribute('src'),'/assets/masterworks-v2/001.webp','full original, not small thumbnail, studied');
 assert.equal(h.document.querySelectorAll('.sm-is-moving').length,0,'cards pause behind dialog');
 const progress=dialog.querySelector('[data-sm-progress]');progress.value='0';progress.dispatchEvent(new h.window.Event('input'));
 assert.equal(dialog.querySelector('.sm-study-stage').dataset.phase,'0');
 progress.value='100';progress.dispatchEvent(new h.window.Event('input'));
 assert.equal(dialog.querySelector('.sm-study-stage').dataset.phase,'3','backwards and forwards phase seeking');
 dialog.querySelector('[data-sm-play]').click();assert.equal(h.frames.size,1,'only active dialog has RAF');
 dialog.querySelector('[data-sm-close]').click();assert.equal(h.frames.size,0,'dialogclose clears RAF');
 assert.equal(h.api.modeFor({title:'Mentalism'}),'perception');assert.equal(h.api.modeFor({title:'Rhythm'}),'rhythm');assert.equal(h.api.modeFor({title:'Correspondence'}),'correspondence');assert.equal(h.api.modeFor({category:'Letterworks'}),'letters');assert.equal(h.api.modeFor({title:'Vinyl'}),'frequency');assert.equal(h.api.phaseFor(-1),0);assert.equal(h.api.phaseFor(1),3);
}
{
 const h=harness({reducedMotion:true});for(const observer of h.io)observer.callback(observer.targets.map(target=>({target,isIntersecting:true})));
 assert.equal(h.document.querySelectorAll('.sm-is-moving').length,0);
 h.document.querySelector('.sm-study-button').click();const d=h.document.querySelector('.sm-motion-dialog');d.querySelector('[data-sm-play]').click();assert.equal(h.frames.size,0,'reducedmotion never starts RAF');assert.equal(d.querySelector('.sm-study-stage').dataset.phase,'0','reducedmotion has staticphase navigation');
}
{
 const h=harness({html:'<html><body><span class="living-art"><img data-selfmade-art src="/assets/masterworks-v2/021.webp"></span><figure class="exp-hero-art"><img src="/assets/masterworks-v2/044.webp"></figure><figure><img data-selfmade-art src="/photo.jpg"></figure><selfmade-world></selfmade-world></body></html>'});
 assert.equal(h.document.querySelector('.living-art .sm-scene-frame'),null,'native livingpaintings not doubled');
 assert.equal(h.document.querySelectorAll('.exp-hero-art .sm-study-button').length,1);
 const world=h.document.querySelector('selfmade-world');assert(world.querySelector('.sm-world-svg'));world.update({alias:'<script>x</script>',count:3,discipline:'Writer',day:'day'});
 assert.equal(world.querySelectorAll('script').length,0,'alias rendered as text');assert.equal(world.dataset.day,'day');assert.match(world.querySelector('[data-world-count]').textContent,/3 díla/);
 assert(world.querySelector('.sm-world-orbit'));assert(world.querySelector('.sm-world-lunar'));assert(world.querySelector('.sm-world-iris'));
 const key=world.querySelector('[data-world-gateway]');key.click();assert.equal(key.getAttribute('aria-pressed'),'true');assert.equal(world.dataset.gate,'open');assert.match(world.querySelector('.sm-world-key').getAttribute('transform'),/45/);key.click();assert.equal(world.dataset.gate,'closed');
 const reveal=world.querySelector('[data-world-reveal]');reveal.value='35';reveal.dispatchEvent(new h.window.Event('input'));assert.equal(world.querySelector('[data-world-reveal-clip]').getAttribute('width'),'350');assert.match(world.querySelector('[data-world-status]').textContent,/35/);
 assert(world.querySelectorAll('.sm-gesture-drop').length>0,'deliberategesture creates painted drops');for(let i=0;i<10;i++)world.drop(i,500);assert.equal(world.querySelectorAll('.sm-world-gesture-drops').length,4,'gesture marks are bounded, no unbounded DOM');
 const guide=world.querySelector('[data-world-guide]');guide.click();assert.equal(guide.getAttribute('aria-expanded'),'true');assert.match(world.querySelector('[data-world-question]').textContent,/tah/);assert.match(world.querySelector('[data-world-guide-panel]').textContent,/FIKTIVNÍ/);world.update({discipline:'MC',phase:.3});assert.match(world.querySelector('[data-world-question]').textContent,/detail/);world.update({discipline:'MC',phase:.9});assert.match(world.querySelector('[data-world-question]').textContent,/první verzi/);
 for(const observer of h.io)observer.callback(observer.targets.map(target=>({target,isIntersecting:true})));world.audioLevel(.8);assert.equal(world.querySelector('.sm-world-audio-ring').getAttribute('opacity'),'0.7200000000000001');h.document.documentElement.dataset.motion='off';h.mutations.at(-1).callback([]);assert.equal(world.querySelector('.sm-world-audio-ring').getAttribute('opacity'),'0','quietmode stops soundresponse');

}
{
 const h=harness({html:'<html><body><section class="layer-doors"><a href="/#frequency"><img src="/assets/masterworks-v2/012.webp"><div>Frequency</div></a></section><section class="expeditions-entry"><div>Expedice</div><img src="/assets/masterworks-v2/081.webp"></section><div class="quest-cover"><img src="/assets/masterworks-v2/044.webp"></div></body></html>'});
 assert.equal(h.document.querySelectorAll('.sm-scene-frame').length,3);assert.equal(h.document.querySelector('.layer-doors').children.length,1,'doorgrid navigation structure retained');assert.equal(h.document.querySelectorAll('.layer-doors button').length,0,'no nestedbutton/link or extra gridrow');assert.equal(h.document.querySelector('.expeditions-entry').children.length,2,'entry image+button in one gridcell');assert.equal(h.document.querySelectorAll('.sm-study-button').length,2);
}
console.log('PASS selfmade-motion: 100 archive scenes, original images preserved, native scene exclusion, controls/seek/pause/quiet/reducedmotion/lifecycle, safe custom world, gateway lever, revealbrush, bounded gesture drops, fictional contextual guide, actual audiolevel response.');
