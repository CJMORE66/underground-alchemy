import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

const code=fs.readFileSync(new URL('../dist/languages.js',import.meta.url),'utf8');
const lessons=JSON.parse(fs.readFileSync(new URL('../dist/language-lessons.json',import.meta.url),'utf8'));
assert.equal(lessons.version,1);assert(lessons.phrases.length>=36);assert.equal(new Set(lessons.phrases.map(p=>p.id)).size,lessons.phrases.length);
for(const p of lessons.phrases)for(const lang of ['cs','en','fr'])assert(p[lang]?.length>3);
const dictionaries={
 cs:{'THE CITY IS A TEXT.':'MĚSTO JE TEXT.','Open discovery':'Otevřít objev','Original paragraph.':'Původní odstavec.','Read':'Číst','more':'více','A new detail.':'Nový detail.','Helpful label':'Užitečný popisek','Your observation':'Tvoje pozorování','{0} / {1} DISCOVERIES':'{0} / {1} OBJEVŮ'},
 en:{'THE CITY IS A TEXT.':'THE CITY IS A TEXT.','Open discovery':'Open discovery','Original paragraph.':'Original paragraph.','Read':'Read','more':'more','A new detail.':'A new detail.','Helpful label':'Helpful label','Your observation':'Your observation','{0} / {1} DISCOVERIES':'{0} / {1} DISCOVERIES'},
 fr:{'Known source sentence one.':'Cette phrase publique est déjà traduite.','Known source sentence two.':'Cette phrase publique est déjà traduite.','THE CITY IS A TEXT.':'LA VILLE EST UN TEXTE.','Open discovery':'Ouvrir la découverte','Original paragraph.':'Paragraphe original.','Read':'Lire','more':'la suite','A new detail.':'Un nouveau détail.','Helpful label':'Libellé utile','Your observation':'Ton observation','{0} / {1} DISCOVERIES':'{0} / {1} DÉCOUVERTES'}
};
async function fixture({stored='cs',storageFails=false,localeFails=[],deferred=false,voice='local'}={}){
 const {document,window}=parseHTML('<!doctype html><html lang="en"><body><h1 class="ctm-title">THE <ctm-word><ctm-ink><ctm-glyph>C</ctm-glyph><ctm-glyph>I</ctm-glyph><ctm-glyph>T</ctm-glyph><ctm-glyph>Y</ctm-glyph></ctm-ink></ctm-word> IS A TEXT.</h1><button id="original" class="ctm-action" title="Helpful label"><svg aria-hidden="true"><path d="M0 0"/></svg><ctm-run><ctm-word><ctm-ink>Open discovery</ctm-ink></ctm-word></ctm-run></button><img id="venue-image" src="/verified.webp" alt="Helpful label"><p id="prose">Original paragraph.</p><p id="mixed">Read <a href="/real-route/">more</a></p><p id="count">01 / 32 DISCOVERIES</p><label for="draft">Your observation</label><textarea id="draft">MY OWN WORK</textarea><p class="notebook-note">Original paragraph.</p><div data-i18n-user>Original paragraph.</div><dialog id="app-dialog"><button id="app-close">Close</button><p>Original paragraph.</p></dialog><div id="dynamic"></div></body></html>');
 Object.defineProperty(document,'hidden',{value:false,writable:true});
 window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','');};window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 window.HTMLElement.prototype.focus=function(){};
 const storage=new Map([['caisik-language-v1',JSON.stringify({version:1,language:stored})],['caisik-expeditions-v1','keep-expeditions'],['atlas-observations','keep-notes']]);
 const observers=[],requests=[],pending=new Map(),rescans=[],downloads=[];
 class MO{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 let clickCount=0;document.getElementById('original').addEventListener('click',()=>clickCount++);
 const voices=voice==='local'?[{name:'Local French',lang:'fr-FR',localService:true},{name:'Remote English',lang:'en-GB',localService:false}]:[{name:'Remote French',lang:'fr-FR',localService:false}];
 const speech={spoken:[],cancelled:0,handlers:new Set(),getVoices:()=>voices,cancel(){this.cancelled++;},speak(value){this.spoken.push(value);},addEventListener(_,fn){this.handlers.add(fn);},removeEventListener(_,fn){this.handlers.delete(fn);}};
 window.speechSynthesis=speech;window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 window.CaisikTextMotion={rescan:el=>rescans.push(el)};
 const testURL=class extends URL{static createObjectURL(blob){downloads.push(blob);return 'blob:local-test';}static revokeObjectURL(){}};
 const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(storageFails)throw Error('storage');storage.set(key,value);},removeItem:key=>{if(storageFails)throw Error('storage');storage.delete(key);}};
 const context=vm.createContext({window,document,localStorage,MutationObserver:MO,CustomEvent:window.CustomEvent,Event:window.Event,URL:testURL,Blob,console,Map,Set,WeakMap,Object,Promise,setTimeout:()=>1,clearTimeout(){},
 fetch:async url=>{requests.push(url);if(url.includes('language-lessons'))return {ok:true,json:async()=>lessons};const lang=url.match(/\/(cs|en|fr)\.json/)?.[1];if(localeFails.includes(lang))throw Error('offline');if(deferred&&lang!=='cs')return new Promise(resolve=>pending.set(lang,()=>resolve({ok:true,json:async()=>dictionaries[lang]})));return {ok:!!lang,json:async()=>dictionaries[lang]};}
 });
 vm.runInContext(code,context);const api=window.CaisikI18n;await api.ready;
 const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 const click=selector=>{const el=document.querySelector(selector);assert(el,selector);el.click();};
 const change=(selector,value)=>{const el=document.querySelector(selector);if(el.tagName==='SELECT'){for(const option of el.querySelectorAll('option')){if(option.value===value)option.setAttribute('selected','');else option.removeAttribute('selected');}}else el.value=value;el.dispatchEvent(new window.Event('change',{bubbles:true}));};
 return {document,window,api,storage,speech,requests,pending,observers,rescans,downloads,tick,click,change,clicks:()=>clickCount};
}
{
 const h=await fixture();assert.equal(h.api.getLanguage(),'cs');assert.equal(h.document.documentElement.lang,'cs');
 assert.equal(h.document.querySelector('h1').textContent,'MĚSTO JE TEXT.');assert.equal(h.document.getElementById('prose').textContent,'Původní odstavec.');
 assert.equal(h.document.getElementById('count').textContent,'01 / 32 OBJEVŮ','numeric source templates preserve exact digits');
 const original=h.document.getElementById('original'),path=original.querySelector('path');original.click();assert.equal(h.clicks(),1);assert(path.isConnected,'inline SVG icon stays intact');assert.equal(original.title,'Užitečný popisek');const venueImage=h.document.getElementById('venue-image');assert.equal(venueImage.alt,'Užitečný popisek');assert.equal(venueImage.getAttribute('src'),'/verified.webp');
 assert.equal(h.document.getElementById('draft').value,'MY OWN WORK');assert.equal(h.document.querySelector('.notebook-note').textContent,'Original paragraph.');assert.equal(h.document.querySelector('[data-i18n-user]').textContent,'Original paragraph.');
 assert.equal(h.document.querySelector('#mixed a').getAttribute('href'),'/real-route/');assert.equal(h.document.querySelector('#mixed a').textContent,'více');assert(h.rescans.length>0);
 assert.equal(h.requests.filter(u=>u.includes('/i18n/')).length,1,'initial page loads only selected locale');
 await h.api.setLanguage('fr');assert.equal(h.document.getElementById('prose').textContent,'Paragraphe original.');assert.equal(h.document.getElementById('mixed').lang,'fr','translated mixed-link prose has active language metadata');assert.equal(h.document.getElementById('count').textContent,'01 / 32 DÉCOUVERTES');assert.equal(h.document.getElementById('draft').value,'MY OWN WORK');assert.equal(venueImage.alt,'Libellé utile');assert.strictEqual(h.document.getElementById('venue-image'),venueImage);assert.strictEqual(h.document.getElementById('original'),original);assert.strictEqual(original.querySelector('path'),path);original.click();assert.equal(h.clicks(),2);
 await h.api.setLanguage('en');assert.equal(h.document.querySelector('h1').textContent,'THE CITY IS A TEXT.');assert.equal(h.document.getElementById('prose').textContent,'Original paragraph.');assert.equal(original.title,'Helpful label');assert.equal(venueImage.alt,'Helpful label');venueImage.alt='Your observation';h.observers[0].fn([{type:'attributes',attributeName:'alt',target:venueImage}]);await h.tick();await h.api.setLanguage('fr');assert.equal(venueImage.alt,'Ton observation','updated image alt receives a fresh canonical translation');await h.api.setLanguage('en');
 h.document.getElementById('dynamic').innerHTML='<p>A new detail.</p>';await h.api.setLanguage('fr');assert.equal(h.document.querySelector('#dynamic p').textContent,'Un nouveau détail.');
 h.document.querySelector('#dynamic p').textContent='Original paragraph.';h.observers[0].fn([{type:'childList',target:h.document.getElementById('dynamic')}]);await h.tick();assert.equal(h.document.querySelector('#dynamic p').textContent,'Paragraphe original.','runtime source replacement gets a fresh canonical record');
 const modal=h.document.getElementById('app-dialog');modal.showModal();h.observers[0].fn([{type:'attributes',attributeName:'open',target:modal}]);await h.tick();assert.equal(modal.querySelectorAll('[data-language-inline]').length,1);h.observers[0].fn([{type:'attributes',attributeName:'open',target:modal}]);await h.tick();assert.equal(modal.querySelectorAll('[data-language-inline]').length,1,'modal language controls mount idempotently');
 assert.equal(h.storage.get('caisik-expeditions-v1'),'keep-expeditions');assert.equal(h.storage.get('atlas-observations'),'keep-notes');
 h.api.destroy();assert(!h.document.querySelector('[data-language-dock]'));assert(h.observers[0].disconnected);assert.equal(h.speech.handlers.size,0);
}
{
 const h=await fixture({deferred:true});const en=h.api.setLanguage('en'),fr=h.api.setLanguage('fr');await h.tick();h.pending.get('fr')();await fr;h.pending.get('en')();await en;assert.equal(h.api.getLanguage(),'fr','slow prior locale cannot override most recent choice');assert.equal(h.document.getElementById('prose').textContent,'Paragraphe original.');h.api.destroy();
}
{
 const h=await fixture({localeFails:['fr'],storageFails:true});await h.api.setLanguage('fr');assert.equal(h.api.getLanguage(),'cs','failed fetch keeps readable current language');assert.equal(h.document.getElementById('prose').textContent,'Původní odstavec.');assert.match(h.document.querySelector('[data-language-status]').textContent,/nepodařilo/);await h.api.setLanguage('en');assert.match(h.document.querySelector('[data-language-status]').textContent,/uložení|storage/i,'failed preference write is visible');h.api.destroy();
}
{
 const h=await fixture();const dynamic=h.document.getElementById('dynamic');
 dynamic.innerHTML='<p id="split-copy">Original paragraph.<br>A new detail.</p><h2>Cathédrale Notre-Dame de Paris</h2><p class="place-address">Bibliothèque nationale de France, site François Mitterrand.</p><figcaption>A very long documentary image source caption remains authoritative.</figcaption><div class="source-group"><p>A very long documentary image source caption remains authoritative.</p></div>';
 await h.api.setLanguage('fr');assert.equal(dynamic.querySelector('#split-copy').textContent,'Paragraphe original.Un nouveau détail.');assert(dynamic.querySelector('#split-copy br'),'fragment translations preserve authored line breaks');assert.equal(h.document.querySelector('[data-language-status]').textContent,'','covered line-break fragments, names, addresses and source captions do not report incomplete prose');assert(h.api.getMissing().includes('Cathédrale Notre-Dame de Paris'),'retained names remain available as editorial diagnostics');assert.equal(h.api.getState().untranslatedProse,0);
 dynamic.insertAdjacentHTML('beforeend','<p id="already-translated">Cette phrase publique est déjà traduite.</p>');h.api.rescan();assert.equal(dynamic.querySelector('#already-translated').lang,'fr','an ambiguous reverse index still recognises a known active-locale sentence');assert.equal(h.document.querySelector('[data-language-status]').textContent,'','a known translated value does not become a false missing-prose warning');
 dynamic.insertAdjacentHTML('beforeend','<p id="untranslated-lesson">This important lesson is missing its local translation.</p>');h.api.rescan();assert.match(h.document.querySelector('[data-language-status]').textContent,/Certains textes/,'a real missing teaching sentence still discloses fallback');assert.equal(h.api.getState().untranslatedProse,1);
 dynamic.querySelector('#untranslated-lesson').remove();h.api.rescan();assert.equal(h.document.querySelector('[data-language-status]').textContent,'','coverage warning clears when the missing public prose leaves the page');h.api.destroy();
}
{
 const h=await fixture({localeFails:['fr'],storageFails:true});await h.api.setLanguage('fr');const failedLoad=h.document.querySelector('[data-language-status]').textContent;h.api.rescan();assert.equal(h.document.querySelector('[data-language-status]').textContent,failedLoad,'coverage rescans cannot erase a real locale load failure');await h.api.setLanguage('en');const failedStorage=h.document.querySelector('[data-language-status]').textContent;h.api.rescan();assert.equal(h.document.querySelector('[data-language-status]').textContent,failedStorage,'coverage rescans cannot erase a real storage failure');h.api.destroy();
}
{
 const h=await fixture();await h.api.openLearning();const dialog=h.document.getElementById('caisik-language-dialog');assert(dialog.open);assert(h.requests.some(u=>u.includes('language-lessons')));assert.equal(dialog.querySelector('[data-learning-source]').lang,'cs');assert.equal(dialog.querySelector('[data-learning-translation]').lang,'fr');assert(dialog.querySelector('[data-learning-translation]').hidden);
 h.click('[data-learning-reveal]');assert(!dialog.querySelector('[data-learning-translation]').hidden);h.click('[data-learning-listen]');assert.equal(h.speech.spoken.length,1);assert.equal(h.speech.spoken[0].voice.localService,true);assert.equal(h.speech.spoken[0].lang,'fr-FR');
 const expected=dialog.querySelector('[data-learning-translation]').textContent;dialog.querySelector('[data-learning-answer]').value=expected;h.click('[data-learning-check]');assert.match(dialog.querySelector('[data-learning-feedback]').textContent,/odpovídá/);
 h.click('[data-learning-next]');assert.equal(dialog.querySelector('[data-learning-answer]').value,'','a new card starts a new recall attempt');h.click('[data-learning-save]');h.click('[data-learning-reviewed]');const saved=JSON.parse(h.storage.get('caisik-language-learning-v1'));assert(Object.values(saved.phrases).some(v=>v.saved&&v.reviewed));
 h.click('[data-learning-export]');const exported=JSON.parse(await h.downloads.at(-1).text());assert.equal(exported.project,'CAISIK / Language practice');assert(Object.values(exported.practice.phrases).some(v=>v.saved));
 h.click('[data-learning-reset]');assert(!dialog.querySelector('[data-learning-confirm]').hidden);assert(h.storage.has('caisik-language-learning-v1'),'reset requires the explicit local confirmation');h.click('[data-learning-cancel-reset]');assert(h.storage.has('caisik-language-learning-v1'));h.click('[data-learning-reset]');h.click('[data-learning-confirm-reset]');assert(!h.storage.has('caisik-language-learning-v1'));assert.equal(h.storage.get('atlas-observations'),'keep-notes');
 h.document.hidden=true;h.document.dispatchEvent(new h.window.Event('visibilitychange'));assert(h.speech.cancelled>0);h.api.destroy();
}
{
 const h=await fixture({voice:'remote',storageFails:true});await h.api.openLearning();h.click('[data-learning-listen]');assert.equal(h.speech.spoken.length,0,'remote-only speech services are never used');assert.match(h.document.querySelector('[data-learning-status]').textContent,/místní hlas/);h.click('[data-learning-save]');assert.match(h.document.querySelector('[data-learning-status]').textContent,/uložení/);h.document.getElementById('caisik-language-dialog').close();await h.api.openLearning();h.click('[data-learning-export]');const exported=JSON.parse(await h.downloads.at(-1).text());assert(Object.values(exported.practice.phrases).some(p=>p.saved),'failed storage retains exportable session progress');h.api.destroy();
}
console.log('PASS languages: CS/EN/FR persistence and lazy dictionaries, numeric templates, dynamic/kinetic text, native controls/icons/links and user drafts retained; modal controls; race/offline/storage fallback; 40 contextual practice cards, recall, local-only voice, export/confirmation/reset and cleanup.');
{
 const h=await fixture();assert.equal(h.requests.length,1);
 h.document.getElementById('dynamic').innerHTML='<main><p id="public-reading">Original paragraph.</p><textarea id="private-reading">PRIVATE NOTE ONLY</textarea></main>';
 h.api.rescan();const paragraph=h.document.getElementById('public-reading');assert.equal(paragraph.textContent,'Původní odstavec.');
 let selected=paragraph,crossesPrivate=false;
 h.window.getSelection=()=>({isCollapsed:false,rangeCount:1,anchorNode:selected.firstChild,focusNode:selected.firstChild,toString:()=>selected.textContent,getRangeAt:()=>({commonAncestorContainer:selected,intersectsNode:()=>crossesPrivate})});
 h.click('[data-language-dock] [data-reading-toggle]');assert.equal(h.document.querySelector('[data-language-dock] [data-reading-toggle]').getAttribute('aria-pressed'),'true');assert.equal(h.requests.length,1,'reading toggle itself does not download more locales or practice media');
 assert(await h.api.compareSelection());const dialog=h.document.getElementById('caisik-language-dialog');assert(dialog.open);const pair=dialog.querySelector('.language-reading-pair');assert(pair);assert.equal(pair.querySelector('[lang="cs"]').textContent,'Původní odstavec.');assert.equal(pair.querySelector('[lang="fr"]').textContent,'Paragraphe original.');assert(h.requests.some(u=>u.includes('/i18n/fr.json')));
 h.click('[data-reading-listen]');assert.equal(h.speech.spoken.at(-1).text,'Paragraphe original.');assert.equal(h.speech.spoken.at(-1).voice.localService,true);
 h.change('[data-learning-target]','en');await h.tick();assert.equal(dialog.querySelector('.language-reading-pair [lang="en"]').textContent,'Original paragraph.','context comparison follows explicit learning-target changes');
 selected=h.document.getElementById('private-reading');const before=h.requests.length;assert.equal(await h.api.compareSelection(),false,'private textarea selection is rejected');assert(!dialog.textContent.includes('PRIVATE NOTE ONLY'));assert.equal(h.requests.length,before);
 selected=paragraph;const publicSection=paragraph.parentElement;h.window.getSelection=()=>({isCollapsed:false,rangeCount:1,anchorNode:paragraph.firstChild,focusNode:paragraph.firstChild,toString:()=>paragraph.textContent,getRangeAt:()=>({commonAncestorContainer:publicSection,intersectsNode:()=>true})});assert.equal(await h.api.compareSelection(),false,'a range crossing private fields is rejected before reading its selected text');
 h.api.destroy();
}
{
 const h=await fixture();await h.api.setLanguage('fr');h.document.getElementById('dynamic').innerHTML='<p>02 / 33 DÉCOUVERTES</p>';h.api.rescan();await h.api.setLanguage('en');assert.equal(h.document.querySelector('#dynamic p').textContent,'02 / 33 DISCOVERIES','fresh templated translated DOM can recover canonical source without re-translating translated words');h.api.destroy();
}
console.log('PASS contextual reading: explicit public-text selection, paired local translations, updated target language, local pronunciation, private/cross-field exclusion and numeric canonical recovery.');
