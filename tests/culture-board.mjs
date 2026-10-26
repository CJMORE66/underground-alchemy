import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {mountCultureBoard,mountCultureSymbols,cultureSymbolMarkup} from '../dist/culture-board.js';

const venue=(id,category='graffiti')=>({id,name:`Místo ${id}`,address:'10 rue de la Culture, 75011 Paris',category,facts:['Doložený kulturní kontext, který se neopírá o ilustraci.'],sources:[{title:'Provozovatel',url:`https://example.org/${id}`}],access:'Vstup podle pravidel provozovatele. Malování vyžaduje souhlas.',checkedAt:'2026-10-26',task:{question:'Jaký detail změní způsob, kterým místo čteš?',observe:'Najdi dva odlišné tahy a popiš jejich strukturu.',try:'Vytvoř vlastní skicu, která spojuje vybrané struktury.',review:'Porovnej skicu s tím, co jsi skutečně pozoroval.',output:'Uchovej skicu a tři vysvětlená rozhodnutí.'},relatedExpedition:category==='philosophy'?'knowledge':'writer'});
function fixture({places=[venue('mural'),venue('shop','artshop'),venue('club','hiphop'),venue('records','recordshop'),venue('dialogue','philosophy')],storage=true,reduced=false}={}){
 const {window,document}=parseHTML('<!doctype html><html data-motion="on"><body><section id="board"></section></body></html>');
 Object.defineProperty(document,'hidden',{value:false,writable:true});
 window.HTMLElement.prototype.focus=function(){this.dataset.focused='true';};
 const media={matches:reduced,handlers:new Set(),addEventListener(_,fn){this.handlers.add(fn);},removeEventListener(_,fn){this.handlers.delete(fn);},change(value){this.matches=value;for(const fn of this.handlers)fn();}};
 window.matchMedia=()=>media;
 const observers=[],mutations=[];let disconnected=0;
 const IO=class{constructor(fn){this.fn=fn;observers.push(this);}observe(element){this.element=element;}unobserve(){}disconnect(){disconnected++;}show(value){this.fn([{target:this.element,isIntersecting:value}]);}};
 const MO=class{constructor(fn){this.fn=fn;mutations.push(this);}observe(){}disconnect(){disconnected++;}};
 const frames=new Map();let frameId=0;
 window.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};window.cancelAnimationFrame=id=>frames.delete(id);
 Object.defineProperty(document,'defaultView',{value:{matchMedia:()=>media,IntersectionObserver:IO,MutationObserver:MO,requestAnimationFrame:window.requestAnimationFrame,cancelAnimationFrame:window.cancelAnimationFrame}});
 const host=document.getElementById('board'),opened=[],filters=[],notices=[],writes=[];
 let currentNotes={legacy:'Původní poznámka'},canStore=storage;
 const api=mountCultureBoard(host,{places,onOpen:id=>opened.push(id),onFilter:value=>filters.push(value),read:(key,fallback)=>key==='atlas-observations'?currentNotes:fallback,write:(key,value)=>{writes.push({key,value});if(canStore)currentNotes=value;return canStore;},notify:value=>notices.push(value)});
 const click=selector=>{const node=host.querySelector(selector);assert(node,`control ${selector} exists`);node.click();};
 const note=value=>{const node=host.querySelector('[data-cb-note]');node.value=value;node.dispatchEvent(new window.Event('input',{bubbles:true}));};
 return {window,document,host,api,media,observers,mutations,frames,opened,filters,notices,writes,click,note,notes:()=>currentNotes,updateNotes:value=>currentNotes=value,storage:value=>canStore=value,disconnected:()=>disconnected};
}
{
 const h=fixture();
 assert.equal(h.api.getState().count,5);assert.equal(h.host.querySelectorAll('[data-cb-place]').length,5);
 assert.match(h.host.textContent,/DOLOŽENÝ KONTEXT/);assert.match(h.host.textContent,/TVŮRČÍ ZADÁNÍ/);
 assert.equal(h.host.querySelectorAll('svg').length,1,'one original drawing, no duplicated media library');
 assert.equal(h.host.querySelectorAll('[data-cb-step]').length,4);
 assert(h.host.querySelector('.cb-field-address>a').href.includes('query=M%C3%ADsto+mural'));
 assert.equal(h.host.querySelector('.cb-quest-links a').getAttribute('href'),'/expeditions/writer/');
 h.click('[data-cb-step="1"]');assert.match(h.host.querySelector('.cb-task').textContent,/Vytvoř vlastní skicu/);assert.equal(h.api.getState().step,1);
 h.click('[data-cb-open]');assert.deepEqual(h.opened,['mural']);
 h.note('Rozpracovaná skica <bez uploadu>');h.click('[data-cb-next]');assert.equal(h.api.getState().selected,'shop');h.click('[data-cb-prev]');assert.equal(h.host.querySelector('[data-cb-note]').value,'Rozpracovaná skica <bez uploadu>','switching place preserves unsaved text and escapes markup');
 h.click('[data-cb-field]');assert(h.host.classList.contains('cb-field'));assert.equal(h.host.querySelector('[data-cb-note]').value,'Rozpracovaná skica <bez uploadu>');
 h.click('[data-cb-filter="philosophy"]');assert.deepEqual(h.filters,['philosophy']);assert.equal(h.host.querySelectorAll('[data-cb-place]').length,1);assert.equal(h.api.getState().selected,'dialogue');assert(h.host.querySelector('[data-cb-next]').hasAttribute('disabled'));assert.equal(h.host.querySelector('.cb-quest-links a').getAttribute('href'),'/expeditions/knowledge/');
 h.click('[data-cb-filter="all"]');h.click('[data-cb-place="mural"]');assert.equal(h.host.querySelector('[data-cb-note]').value,'Rozpracovaná skica <bez uploadu>');
 h.updateNotes({legacy:'Původní poznámka',profile:'Novější úprava z profilu'});h.click('[data-cb-save]');assert.equal(h.notes().profile,'Novější úprava z profilu','save merges current store rather than stale initial snapshot');assert.equal(h.notes().legacy,'Původní poznámka');assert.equal(h.notes().mural,'Rozpracovaná skica <bez uploadu>');assert.equal(h.writes[0].key,'atlas-observations');assert.match(h.host.querySelector('[data-cb-status]').textContent,/Uloženo/);
 h.storage(false);h.note('Text při chybě uložení');h.click('[data-cb-save]');assert.match(h.host.querySelector('[data-cb-status]').textContent,/Trvalé uložení se nezdařilo/);assert(h.host.querySelector('[data-cb-status]').classList.contains('cb-save-error'));assert.equal(h.host.querySelector('[data-cb-note]').value,'Text při chybě uložení');assert.equal(h.notices.length,2);
 h.api.select('records');assert.equal(h.api.getState().selected,'records');assert.equal(h.host.querySelector('[data-cb-art]').dataset.cbArt,'recordshop');h.api.select('unknown');assert.equal(h.api.getState().selected,'records');h.api.destroy();assert.equal(h.host.children.length,0);assert.equal(h.frames.size,0);assert.equal(h.disconnected(),2);h.api.destroy();
}
{
 const h=fixture();assert(!h.api.getState().playing);h.observers[0].show(true);assert(h.host.classList.contains('cb-animating'));h.media.change(true);assert(!h.host.classList.contains('cb-animating'));h.media.change(false);assert(h.host.classList.contains('cb-animating'));h.document.documentElement.dataset.motion='off';h.mutations[0].fn([{target:h.document.documentElement,attributeName:'data-motion'}]);assert(!h.host.classList.contains('cb-animating'));h.document.documentElement.dataset.motion='on';h.mutations[0].fn([{target:h.document.documentElement,attributeName:'data-motion'}]);assert(h.host.classList.contains('cb-animating'));h.document.body.insertAdjacentHTML('beforeend','<dialog open></dialog>');h.mutations[0].fn([{target:h.document.querySelector('dialog'),attributeName:'open'}]);assert(!h.host.classList.contains('cb-animating'),'background culture art pauses behind modal');h.document.querySelector('dialog').remove();h.document.hidden=true;h.document.dispatchEvent(new h.window.Event('visibilitychange'));assert(!h.api.getState().playing);h.api.destroy();assert.equal(h.media.handlers.size,0);
}
{
 const malicious=venue('unsafe');malicious.name='<img src=x onerror=alert(1)>';malicious.sources.push({title:'bad',url:'javascript:alert(1)'});const h=fixture({places:[malicious,venue('unsafe'),null,{...venue('wrong'),category:'fake'},{...venue('no-source'),sources:[{url:'javascript:alert(1)'}]}]});assert.equal(h.api.getState().count,1);assert(!h.host.querySelector('img'));assert.equal(h.host.querySelectorAll('a[href^="javascript:"]').length,0);assert.match(h.host.textContent,/<img src=x/);h.api.destroy();
}
{
 const h=fixture({places:null});assert.match(h.host.textContent,/nepodařilo načíst/);h.api.destroy();assert.equal(h.host.children.length,0);
}
{
 const h=fixture();h.document.body.insertAdjacentHTML('beforeend','<div id="profile-symbol" class="culture-profile-symbol" data-culture-symbol="philosophy"><span>Autorský symbol</span></div>');
 const host=h.document.getElementById('profile-symbol'),controller=mountCultureSymbols(h.document);assert.equal(host.querySelectorAll('svg').length,1);controller.rescan();assert.equal(host.querySelectorAll('svg').length,1,'symbol rescans are idempotent');assert.match(cultureSymbolMarkup('constructor'),/cb-symbol/);h.observers[1].show(true);assert(host.classList.contains('cb-animating'));h.media.change(true);assert(!host.classList.contains('cb-animating'));h.media.change(false);host.dataset.cultureSymbol='recordshop';controller.rescan();assert(host.querySelector('.cb-vinyl'),'changing category replaces managed internal symbol');assert.equal(host.querySelectorAll('svg').length,1);controller.destroy();assert.equal(host.querySelectorAll('svg').length,0);assert.equal(host.querySelector('span').textContent,'Autorský symbol','destroy leaves caller captions intact');assert(!host.classList.contains('cb-animating'));h.api.destroy();
}
console.log('PASS culture board: original symbol scenes, field selection, practice steps, escaped sourced content, address navigation, unsaved drafts, fresh Blackbook merge, visible storage failure, motion preference/modal/visibility cleanup and optional-data fallback.');
