/* Actual scroll-runtime execution; this is not a claim of physical layout QA. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
const source=fs.readFileSync(new URL('../dist/journey-scroll.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../dist/journey-scroll.css',import.meta.url),'utf8');
const html='<!doctype html><html data-motion="on"><body><header><a href="#hidden-city">Native navigation</a></header><main><section id="home"><h1>Original title</h1></section><section id="hidden-city"><button id="original">Original action</button><p id="prose">Documented history stays readable.</p></section><section id="principles">Principles</section><section id="frequency">Frequency</section><section id="living-wall">Wall</section><section id="manifesto">Manifesto</section><div class="culture-board"></div></main><dialog><button>Close</button></dialog></body></html>';
function harness({markup=html,io=true,mo=true,ro=true,reduced=false}={}){
 const {window,document}=parseHTML(markup);delete window.CaisikJourneyScroll;let serial=0;const frames=new Map(),ios=[],mos=[],ros=[],listeners=[];
 const positions={'hidden-city':1100,principles:2600,frequency:3900,'living-wall':5000,manifesto:6200},bridgePositions={'hidden-city':700,principles:2200,frequency:3500,'living-wall':4600};
 Object.defineProperty(document,'hidden',{value:false,writable:true});Object.defineProperty(window,'innerHeight',{value:900,writable:true});Object.defineProperty(window,'scrollY',{value:0,writable:true});Object.defineProperty(document.documentElement,'scrollHeight',{value:7200,writable:true});Object.defineProperty(document.body,'scrollHeight',{value:7200,writable:true});
 window.HTMLElement.prototype.getBoundingClientRect=function(){const bridge=this.dataset?.journeyBridge,top=(bridge?bridgePositions[bridge]||0:positions[this.id]||0)-window.scrollY,height=bridge?290:1000;return {top,bottom:top+height,left:0,right:1200,width:1200,height};};
 const media={matches:reduced,handlers:new Set(),addEventListener(type,fn){this.handlers.add(fn);},removeEventListener(type,fn){this.handlers.delete(fn);},change(value){this.matches=value;for(const fn of this.handlers)fn();}};window.matchMedia=()=>media;
 const nativeListen=window.addEventListener.bind(window);window.addEventListener=(type,handler,options)=>{listeners.push({type,options});nativeListen(type,handler,options);};
 class IO{constructor(callback){this.callback=callback;this.targets=new Set();ios.push(this);}observe(el){this.targets.add(el);}disconnect(){this.targets.clear();}show(el,value){this.callback([{target:el,isIntersecting:value}]);}}
 class MO{constructor(callback){this.callback=callback;this.connected=true;mos.push(this);}observe(){}disconnect(){this.connected=false;}}
 class RO{constructor(callback){this.callback=callback;this.connected=true;ros.push(this);}observe(){}disconnect(){this.connected=false;}}
 const requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame=id=>frames.delete(id);
 vm.runInContext(source,vm.createContext({window,document,console,requestAnimationFrame,cancelAnimationFrame,...(io?{IntersectionObserver:IO}:{}),...(mo?{MutationObserver:MO}:{}),...(ro?{ResizeObserver:RO}:{})}));
 const flush=()=>{const active=[...frames.values()];frames.clear();active.forEach(fn=>fn(100));};
 const scroll=y=>{window.scrollY=y;window.dispatchEvent(new window.Event('scroll'));flush();};
 const show=(el,value=true)=>{for(const observer of ios)if(observer.targets.has(el))observer.show(el,value);flush();};
 const mutate=records=>{for(const observer of mos)if(observer.connected)observer.callback(records);flush();};
 return {window,document,frames,ios,mos,ros,listeners,media,flush,scroll,show,mutate,api:window.CaisikJourneyScroll};
}
{
 const h=harness();h.flush();const original=h.document.getElementById('original'),prose=h.document.getElementById('prose');
 assert.equal(h.api.stats().bridges,4);assert.equal(h.api.stats().sections,5);assert.equal(h.document.querySelectorAll('.journey-rail').length,1);assert.equal(prose.textContent,'Documented history stays readable.');assert.equal(prose.getAttribute('style'),null,'prose is never hidden or transformed');assert.strictEqual(h.document.getElementById('original'),original);assert.equal(h.document.querySelector('header a').textContent,'Native navigation');
 const signatures=new Set();for(const el of h.document.querySelectorAll('.journey-bridge')){assert(el.querySelector('h2').textContent.length>8);assert.equal(el.getAttribute('data-text-motion'),'off');signatures.add([...el.querySelectorAll('path')].map(p=>p.getAttribute('d')).join('|'));}assert.equal(signatures.size,4,'four distinct compositions, not repeated static cards');
 const map=h.document.querySelector('[data-journey-bridge="hidden-city"]');h.show(map);h.scroll(0);const a=h.api.stats().progress['hidden-city'],dashA=Number(map.querySelector('[data-journey-draw="0"]').style.strokeDashoffset);h.scroll(400);const b=h.api.stats().progress['hidden-city'],dashB=Number(map.querySelector('[data-journey-draw="0"]').style.strokeDashoffset);assert(b>a);assert(dashB<dashA,'real architectural path drawing progresses');assert.equal(h.api.stats().direction,'forward');h.scroll(100);assert(h.api.stats().progress['hidden-city']<b);assert.equal(h.api.stats().direction,'backward');assert.equal(h.frames.size,0,'no permanent RAF');
 for(let i=0;i<20;i++)h.window.dispatchEvent(new h.window.Event('scroll'));assert.equal(h.frames.size,1,'coalesced writes have only one pending frame');h.flush();assert.equal(h.frames.size,0);
 h.scroll(1500);assert.equal(h.document.querySelector('.journey-rail').dataset.activeChapter,'hidden-city');h.scroll(2800);assert.equal(h.document.querySelector('.journey-rail').dataset.activeChapter,'principles');assert.equal(h.document.querySelector('[data-journey-chapter="principles"]').getAttribute('aria-current'),'location');const progress=h.document.querySelector('.journey-rail [role=progressbar]');assert(Number(progress.getAttribute('aria-valuenow'))>0&&Number(progress.getAttribute('aria-valuenow'))<100);for(const link of h.document.querySelectorAll('[data-journey-chapter]'))assert(h.document.querySelector(link.getAttribute('href')),'actual native anchors');
 assert(h.listeners.some(e=>e.type==='scroll'&&e.options.passive===true));assert(!h.listeners.some(e=>['wheel','touchmove','keydown'].includes(e.type)),'no interception of native navigation');
 h.api.rescan();h.flush();assert.equal(h.document.querySelectorAll('.journey-bridge').length,4);h.api.destroy();assert.equal(h.document.querySelectorAll('.journey-bridge,.journey-rail,.journey-section-ruler').length,0);assert.strictEqual(h.document.getElementById('original'),original);assert.equal(h.frames.size,0);assert(h.ios.every(o=>o.targets.size===0));assert(h.mos.every(o=>!o.connected));assert(h.ros.every(o=>!o.connected));h.window.dispatchEvent(new h.window.Event('scroll'));assert.equal(h.frames.size,0);
}
{
 const h=harness(),scene=h.document.querySelector('[data-journey-bridge="principles"]');h.show(scene);h.scroll(1900);const p=h.api.stats().progress.principles;assert(p<1);h.media.change(true);h.flush();assert.equal(h.api.stats().progress.principles,1);assert(!h.document.documentElement.classList.contains('journey-motion-active'));assert.equal(h.frames.size,0);h.media.change(false);h.flush();assert.equal(h.api.stats().progress.principles,p);
 h.document.documentElement.dataset.motion='off';h.mutate([{type:'attributes',target:h.document.documentElement,attributeName:'data-motion'}]);assert.equal(h.api.stats().progress.principles,1);h.document.documentElement.dataset.motion='on';h.mutate([{type:'attributes',target:h.document.documentElement,attributeName:'data-motion'}]);assert(h.api.stats().progress.principles<1);
 const dialog=h.document.querySelector('dialog');dialog.setAttribute('open','');h.mutate([{type:'attributes',target:dialog,attributeName:'open'}]);assert.equal(h.api.stats().progress.principles,1);assert(h.document.querySelector('.journey-rail').classList.contains('journey-obscured'));assert(!h.document.querySelector('.journey-rail').hasAttribute('hidden'),'modal hides rail without collapsing layout');dialog.removeAttribute('open');h.mutate([{type:'attributes',target:dialog,attributeName:'open'}]);assert(h.api.stats().progress.principles<1);
 const board=h.document.querySelector('.culture-board');board.classList.add('cb-field');h.mutate([{type:'attributes',target:board,attributeName:'class'}]);assert.equal(h.api.stats().progress.principles,1);board.classList.remove('cb-field');h.mutate([{type:'attributes',target:board,attributeName:'class'}]);assert(h.api.stats().progress.principles<1);
 h.document.hidden=true;h.document.dispatchEvent(new h.window.Event('visibilitychange'));assert.equal(h.frames.size,0);assert.equal(h.api.stats().progress.principles,1);h.document.hidden=false;h.document.dispatchEvent(new h.window.Event('visibilitychange'));h.flush();assert(h.api.stats().progress.principles<1);h.api.destroy();
}
{
 const h=harness();h.flush();const scene=h.document.querySelector('[data-journey-bridge="hidden-city"]'),svg=scene.querySelector('svg');h.show(scene);h.scroll(300);const progress=h.api.stats().progress['hidden-city'];h.window.CaisikI18n={t:value=>`EN:${value}`};h.window.dispatchEvent(new h.window.Event('caisik:languagechange'));assert.match(scene.querySelector('h2').textContent,/^EN:/);assert.match(h.document.querySelector('.journey-rail-link').textContent,/^EN:/);assert.match(scene.getAttribute('aria-label'),/^EN:/);assert.strictEqual(scene.querySelector('svg'),svg,'language changes preserve vector identity');assert.equal(h.api.stats().progress['hidden-city'],progress,'language does not reset progress');h.api.destroy();h.window.dispatchEvent(new h.window.Event('caisik:languagechange'));assert.equal(h.frames.size,0);
}
{
 const h=harness();h.flush();const event=new h.window.Event('pagehide');Object.defineProperty(event,'persisted',{value:true});h.window.dispatchEvent(event);assert.equal(h.frames.size,0);h.window.dispatchEvent(new h.window.Event('pageshow'));h.flush();assert.equal(h.api.stats().bridges,4);h.window.dispatchEvent(new h.window.Event('pagehide'));assert.equal(h.api.stats().bridges,0);
}
{
 const h=harness({markup:'<!doctype html><html><body><main><section id="hidden-city">Readable atlas</section></main></body></html>',io:false,mo:false,ro:false});h.flush();assert.equal(h.api.stats().bridges,1);assert.equal(h.api.stats().sections,1);h.scroll(200);assert(Number.isFinite(h.api.stats().progress['hidden-city']));h.api.destroy();const empty=harness({markup:'<!doctype html><html><body>No app</body></html>',io:false,mo:false,ro:false});empty.flush();assert.equal(empty.api.stats().bridges,0);empty.api.destroy();
}
{
 const h=harness();h.flush();
 const current=h.document.querySelector('.journey-rail-identity'),previous=h.document.querySelector('.journey-previous'),next=h.document.querySelector('.journey-next'),index=h.document.querySelector('[data-journey-index]');
 assert.equal(current.textContent,'Skryté město');assert.equal(previous.getAttribute('href'),null);assert.equal(previous.getAttribute('aria-disabled'),'true');assert.equal(next.getAttribute('href'),'#principles');
 h.scroll(2800);assert.equal(current.textContent,'Sedm principů');assert.equal(previous.getAttribute('href'),'#hidden-city');assert.equal(next.getAttribute('href'),'#frequency');
 let opened=0;h.window.addEventListener('caisik:open-index',event=>{assert.equal(event.detail.source,'journey-rail');opened++;});index.click();assert.equal(opened,1);
 h.window.CaisikI18n={getLanguage:()=> 'fr'};h.window.dispatchEvent(new h.window.Event('caisik:languagechange'));assert.equal(current.textContent,'Les sept principes');assert.equal(index.textContent,'Sommaire');assert.equal(next.textContent,'Suivant →');
 h.scroll(6500);assert.equal(next.getAttribute('href'),null);assert.equal(next.getAttribute('aria-disabled'),'true');assert.equal(previous.getAttribute('href'),'#living-wall');h.api.destroy();
}
{
 const h=harness();
 h.window.getComputedStyle=()=>({scrollPaddingTop:'188px'});
 h.window.innerHeight=500;
 h.scroll(1100-188);
 const page=h.document.querySelector('.journey-next');
 const target=h.document.getElementById('principles');
 let focused='';
 target.focus=options=>{if(options.preventScroll)focused=target.id;};
 function activate(link,modifiers={}){
  const click=new h.window.Event('click',{bubbles:true,cancelable:true});
  Object.assign(click,modifiers);
  link.dispatchEvent(click);
  assert(!click.defaultPrevented,'native fragment navigation and history remain available');
 }
 activate(page);
 assert.equal(focused,'principles');
 assert.equal(target.getAttribute('tabindex'),'-1');
 assert.equal(page.getAttribute('href'),'#principles','href is stable during native activation');
 assert(h.document.documentElement.classList.contains('journey-page-jump'));
 const leaf=h.document.querySelector('.journey-turn');
 assert.equal(leaf.dataset.turn,'forward');
 assert.equal(leaf.getAttribute('aria-hidden'),'true');
 h.scroll(2600-188);
 assert(!h.document.documentElement.classList.contains('journey-page-jump'));
 assert.equal(h.api.stats().active,'principles','the new section is active below both sticky bars, even at a 500px viewport height');
 assert.equal(page.getAttribute('href'),'#frequency','Next advances after landing');
 activate(h.document.querySelector('.journey-previous'));
 const reverse=h.document.querySelector('.journey-turn');
 assert(!leaf.isConnected);
 assert.equal(reverse.dataset.turn,'backward');
 assert.equal(h.document.querySelectorAll('.journey-turn').length,1,'rapid navigation replaces the previous fold');
 leaf.dispatchEvent(new h.window.Event('animationend'));
 assert(reverse.isConnected,'a stale animation cannot remove its successor');
 reverse.dispatchEvent(new h.window.Event('animationend'));
 assert(!reverse.isConnected);

 const menu=h.document.createElement('nav');
 menu.className='iris-panel';
 menu.innerHTML='<a href="#frequency">Frekvence</a><a href="/art/">Blackbook</a>';
 h.document.querySelector('header').append(menu);
 const local=menu.firstElementChild;
 activate(menu.lastElementChild);
 activate(local,{ctrlKey:true});
 assert.equal(h.document.querySelector('.journey-turn'),null,'external and modified links use browser defaults');
 activate(local);
 assert.equal(h.document.querySelector('.journey-turn').dataset.turn,'forward');
 h.media.change(true);
 assert.equal(h.document.querySelector('.journey-turn'),null,'switching to reduced motion cancels an active fold');
 activate(local);
 assert.equal(h.document.querySelector('.journey-turn'),null,'the destination is usable immediately in reduced motion');
 h.media.change(false);
 const story=h.document.createElement('section');
 story.id='needle-street';
 const entry=h.document.createElement('a');
 entry.setAttribute('data-film-story','');
 entry.href='#needle-street';
 h.document.querySelector('main').append(story,entry);
 activate(entry);
 assert(h.document.documentElement.classList.contains('journey-before-atlas'));
 assert(!h.document.querySelector('.journey-turn').classList.contains('journey-turn-atlas'));
 h.api.destroy();
 assert.equal(h.document.querySelector('.journey-turn'),null);
 assert(!h.document.documentElement.classList.contains('journey-page-jump'));
}
{
 // Chrome in a short iframe can leave the viewport on the previous chapter
 // even though native Enter activation accepted the fragment and moved focus.
 const h=harness();
 h.window.innerHeight=500;
 h.window.getComputedStyle=()=>({scrollPaddingTop:'188px'});
 h.scroll(1100-188);
 const target=h.document.getElementById('principles');
 const next=h.document.querySelector('.journey-next');
 let corrections=0;
 target.scrollIntoView=options=>{
  assert.equal(options.behavior,'instant');assert.equal(options.block,'start');
  assert(h.document.documentElement.classList.contains('journey-page-jump'));
  corrections++;
  h.window.scrollY=2600-188;
 };
 next.click();
 assert.equal(corrections,0,'native navigation gets first opportunity');
 h.flush();
 assert.equal(corrections,1);
 assert.equal(h.api.stats().active,'principles');
 assert.equal(next.getAttribute('href'),'#frequency');
 h.flush();assert.equal(corrections,1,'a landing is checked only once');
 h.scroll(1100-188);
 next.click();
 h.document.dispatchEvent(new h.window.Event('wheel'));
 h.flush();
 assert.equal(corrections,1,'player input cancels the pending correction');
 next.click();
 h.scroll(2600-188);
 assert.equal(corrections,1,'an accurate native landing is left untouched');
 h.api.destroy();
}
assert(!/scrollTo\(|preventDefault\(|\.animate\(/.test(source));assert(!/opacity\s*:\s*0\b/.test(css));assert(css.includes('@media(prefers-reduced-motion:reduce)'));
console.log('PASS journey scroll: four native-scroll compositions; reversible drawing and transforms; native forward/back page folds, immediate reduced motion and small-viewport chapter landing; preserved prose/actions; finite RAF; pause/reduced/field/modal/tab/BFCache cleanup; dynamic language labels without scene reset.');
