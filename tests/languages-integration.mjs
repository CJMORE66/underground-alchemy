/* Independent release gate: shipped catalogues + real MutationObservers and kinetic text. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';
import {disciplineConfigs} from '../dist/play/quests.js';
import {culturePlace,cultureRoutes} from '../dist/culture-data.js';

const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const read=name=>fs.readFileSync(path.join(dist,name),'utf8');
const json=name=>JSON.parse(read(name));
const normalize=value=>String(value).replace(/\s+/gu,' ').trim();
const locales=['cs','en','fr'];
const dictionaries=Object.fromEntries(locales.map(lang=>[lang,json(`i18n/${lang}.json`)]));

if(process.argv.includes('--runtime')){
 const {window,document}=parseHTML(read('index.html'));
 const productionImage=document.querySelector('img.hero-art'),productionAlt=normalize(productionImage.getAttribute('alt')),productionImageSrc=productionImage.getAttribute('src');
 Object.defineProperty(document,'hidden',{value:false,writable:true});
 window.innerWidth=1280;window.innerHeight=800;
 window.HTMLElement.prototype.getBoundingClientRect=function(){return {x:20,y:120,left:20,top:120,right:520,bottom:160,width:500,height:40};};
 window.HTMLElement.prototype.focus=function(){};
 window.HTMLElement.prototype.scrollIntoView=function(){};
 window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','');};
 window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');};
 // Linkedom exposes select.value without the browser's setter; retain real option nodes.
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')??this.querySelector('option')?.getAttribute('value')??'';},set(value){for(const option of this.querySelectorAll('option')){if(option.getAttribute('value')===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
 const fixture=document.createElement('section');fixture.id='integration-fixture';
 const original=json('locations-data.json').locations;
 fixture.innerHTML='<h2 id="integration-title">THE CITY IS A TEXT.</h2><button class="button" id="integration-action"><svg aria-hidden="true"><path d="M0 0"/></svg>HISTORICAL EVIDENCE</button><img id="integration-image" alt="THE CITY IS A TEXT."><p id="integration-prose"></p><textarea id="integration-draft"></textarea><p data-i18n-user id="integration-user"></p><div id="integration-dynamic"></div>';
 document.querySelector('main').append(fixture);
 const source=original[0].history,second=original[1].history;
 document.getElementById('integration-prose').textContent=source;
 document.getElementById('integration-draft').value=source;
 document.getElementById('integration-user').textContent=source;
 const {mountJournal}=await import('../dist/play/journal.js');
 const {createStore,emptyState}=await import('../dist/play/store.js');
 const savedState=emptyState();savedState.profile.alias='THE CITY IS A TEXT.';
 savedState.artifacts=[{id:'translation-private-a',discipline:'writer',title:'THE CITY IS A TEXT.',versions:[{id:'version-a',text:source,decision:second,nextStep:'HISTORICAL EVIDENCE',palette:[{color:'#FFD600',purpose:'Recording studio'}],strokes:[]}]},{id:'translation-private-b',discipline:'mc',title:'Recording studio',versions:[{id:'version-b',text:'HISTORICAL EVIDENCE',decision:source,nextStep:'THE CITY IS A TEXT.'}]}];
 savedState.inventory=[{id:'material-a',type:'word',title:'HISTORICAL EVIDENCE',text:source,source:'Recording studio'}];
 savedState.drafts.journal={selected:['translation-private-a','translation-private-b'],desk:['material-a'],links:[{id:'link-a',from:'translation-private-a',to:'translation-private-b',note:second}],vocabulary:[{id:'word-a',term:'Recording studio',meaning:source}]};
 const journal=document.createElement('section');journal.id='integration-journal';fixture.append(journal);
 globalThis.document=document;
 const journalData=new Map(),journalStore=createStore({storage:()=>({getItem:key=>journalData.get(key)??null,setItem:(key,value)=>journalData.set(key,value)}),eventTarget:null});
 journalStore.update(state=>Object.assign(state,savedState));
 const unmountJournal=mountJournal(journal,{store:journalStore});
 globalThis.window=window;
 const {initFrequency}=await import('../dist/atlas-frequency.js');
 const frequency=document.getElementById('frequency');
 initFrequency(frequency,{data:json('principles-data.json'),read:()=>({draft:source,words:'THE CITY IS A TEXT.'}),write:()=>true,getLocation:()=>original[0]});
 const frequencyModes=[...frequency.querySelectorAll('[data-fl-mode]')].map(button=>button.dataset.flMode),frequencySources=new Map();
 for(const mode of frequencyModes){frequency.querySelector(`[data-fl-mode="${mode}"]`).click();frequencySources.set(mode,[...frequency.querySelectorAll('#fl-prompt>span')].map(el=>normalize(el.textContent)));}
 journal.querySelector('[data-journal-artifact="translation-private-a"]').click();
 const privateSelectors=['.journal-project>h3','.journal-project>p:not(.journal-kicker)','.journal-project details>p','.journal-material-select span[data-i18n-user]','.journal-materials article>p','.journal-desk ol li>strong','.journal-desk ol li>p','.journal-word>h4','.journal-word>p','.journal-links article>strong','.journal-links article>p','.journal-room-work>strong','.journal-room-work>p','.journal-edition h3','.journal-edition li','.journal-swatch','.journal-detail>h3','.journal-version>p:not(.journal-meta)','.journal-lines'];
 const privateSnapshot=()=>privateSelectors.map(selector=>[selector,[...journal.querySelectorAll(selector)].map(el=>el.textContent)]);
 const originalPrivate=privateSnapshot();
 assert(originalPrivate.filter(([,values])=>values.length).length>=14,'real journal exposes actual user-created archive, inventory, vocabulary, room, edition and linked-work fields');
 const action=document.getElementById('integration-action'),icon=action.querySelector('path');let clicks=0;
 const image=document.getElementById('integration-image');
 action.addEventListener('click',()=>clicks++);
 const storage=new Map([['caisik-language-v1',JSON.stringify({version:1,language:'cs'})],['atlas-observations','unchanged-private-notes']]);
 const nativeMO=window.MutationObserver;
 let callbacks=0,records=0,frameId=0,frames=0;const raf=new Map(),requests=[];
 // Delegation retains Linkedom's real delivery/microtask behavior. Only budgets are instrumented.
 class ObservedMO{constructor(fn){this.native=new nativeMO(batch=>{callbacks++;records+=batch.length;assert(callbacks<1200,'MutationObserver requeues without settling');fn(batch);});}observe(...args){this.native.observe(...args);}disconnect(){this.native.disconnect();}takeRecords(){return this.native.takeRecords();}}
 const media=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 const context=vm.createContext({window,document,MutationObserver:ObservedMO,CustomEvent:window.CustomEvent,Event:window.Event,AbortController,Intl,console,Map,Set,WeakMap,URL,Blob,Promise,setTimeout,clearTimeout,matchMedia:media,
 requestAnimationFrame:fn=>{const id=++frameId;raf.set(id,fn);return id;},cancelAnimationFrame:id=>raf.delete(id),
 localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
 fetch:async url=>{requests.push(url);const locale=url.match(/\/(cs|en|fr)\.json/)?.[1];return {ok:true,json:async()=>locale?dictionaries[locale]:json('language-lessons.json')};}
 });
 const settle=async(label)=>{
  let idle=0;
  for(let iteration=0;iteration<80;iteration++){
   const before=callbacks;
   await new Promise(resolve=>setImmediate(resolve));
   const pending=[...raf];raf.clear();
   for(const[,fn]of pending){frames++;assert(frames<1200,'RAF loop never settles');fn(frames*16);}
   await new Promise(resolve=>setImmediate(resolve));
   if(!raf.size&&callbacks===before){if(++idle===3)return;}else idle=0;
  }
  assert.fail(`${label}: observers/RAF did not settle in 80 event-loop turns`);
 };
 // Same defer order as production: language starts a lazy fetch, then kinetic text boots.
 const start=performance.now();
 vm.runInContext(read('languages.js'),context,{timeout:3500,filename:'languages.js'});
 vm.runInContext(read('text-motion.js'),context,{timeout:3500,filename:'text-motion.js'});
 const api=window.CaisikI18n;await api.ready;await settle('initial render');
 assert.equal(document.getElementById('integration-title').textContent,dictionaries.cs['THE CITY IS A TEXT.']);
 assert(document.getElementById('integration-title').querySelector('ctm-word'),'actual kinetic text enhanced the translated title');
 assert.equal(requests.filter(url=>url.includes('/i18n/')).length,1,'initial screen fetches one locale only');
 for(const locale of ['fr','en','cs','fr','cs']){
  await api.setLanguage(locale);await settle(`${locale} switch`);
  assert.equal(document.documentElement.lang,locale);
  assert.equal(document.getElementById('integration-prose').textContent,dictionaries[locale][normalize(source)]);
  assert.equal(document.getElementById('integration-title').textContent,dictionaries[locale]['THE CITY IS A TEXT.']);
  assert.equal(document.getElementById('integration-title').getAttribute('aria-label'),dictionaries[locale]['THE CITY IS A TEXT.'],'kinetic semantic heading has the current translated accessible name');
  assert.strictEqual(document.getElementById('integration-image'),image);assert.equal(image.alt,dictionaries[locale]['THE CITY IS A TEXT.'],'alternative text follows the chosen language without replacing its image');
  assert.strictEqual(document.querySelector('img.hero-art'),productionImage);assert.equal(productionImage.getAttribute('src'),productionImageSrc);assert.equal(productionImage.alt,dictionaries[locale][productionAlt],'actual production hero alternative text follows the selected locale');
  assert(document.getElementById('integration-title').querySelector('ctm-word'),'translated title retains kinetic structure');
  assert.strictEqual(document.getElementById('integration-action'),action);assert.strictEqual(action.querySelector('path'),icon);
  assert.equal(document.getElementById('integration-draft').value,source);assert.equal(document.getElementById('integration-user').textContent,source);
  assert.deepEqual(privateSnapshot(),originalPrivate,`${locale}: rendered private journal fields matching dictionary keys stay unchanged`);
  action.click();
 }
 assert.equal(clicks,5,'original native event handler survives all locale switches');
 const dynamic=document.getElementById('integration-dynamic');
 dynamic.innerHTML='<h2></h2><p></p>';dynamic.querySelector('h2').textContent='HISTORICAL EVIDENCE';dynamic.querySelector('p').textContent=source;
 await settle('real observed dynamic insertion');
 assert.equal(dynamic.querySelector('p').textContent,dictionaries.cs[normalize(source)]);
 assert.equal(dynamic.querySelector('h2').textContent,dictionaries.cs['HISTORICAL EVIDENCE']);
 assert(dynamic.querySelector('h2 ctm-word'),'real text-motion observer enhances newly inserted translated title');
 dynamic.querySelector('p').textContent=second;
 await settle('real observed source replacement');
 assert.equal(dynamic.querySelector('p').textContent,dictionaries.cs[normalize(second)]);
 await api.setLanguage('fr');await settle('dynamic paragraph subsequent locale');
 assert.equal(dynamic.querySelector('p').textContent,dictionaries.fr[normalize(second)]);
 for(const locale of ['cs','en','fr']){
  await api.setLanguage(locale);await settle(`Frequency ${locale} language`);
  for(const mode of frequencyModes){
   frequency.querySelector(`[data-fl-mode="${mode}"]`).click();await settle(`Frequency ${locale}/${mode}`);
   const sources=frequencySources.get(mode);assert(sources.every(source=>Object.hasOwn(dictionaries[locale],source)),`${locale}/${mode}: complete local instruction and linked challenge exist`);
   assert.deepEqual([...frequency.querySelectorAll('#fl-prompt>span')].map(el=>normalize(el.textContent)),sources.map(source=>normalize(dictionaries[locale][source])),`${locale}/${mode}: real clicked mode translates each instruction independently`);
   assert.equal(frequency.querySelector('#fl-draft').value,source);assert.equal(frequency.querySelector('#fl-words').value,'THE CITY IS A TEXT.');
  }
 }
 document.documentElement.dataset.motion='off';await settle('quiet motion preference');
 assert(window.CaisikTextMotion.stats().suspended,'language changes coexist with the real kinetic runtime quiet mode');
 assert.equal(document.getElementById('integration-title').textContent,dictionaries.fr['THE CITY IS A TEXT.']);
 document.documentElement.dataset.motion='on';await settle('resume motion preference');
 const before={callbacks,records,frames};await settle('stable idle');
 assert.deepEqual({callbacks,records,frames},before,'settled DOM causes no observer or animation churn');
 assert.equal(storage.get('atlas-observations'),'unchanged-private-notes');
 const elapsed=Math.round(performance.now()-start);
 assert(elapsed<10000,`full page with ${Object.keys(dictionaries.cs).length} catalogue entries took ${elapsed}ms`);
 if(process.env.CAISIK_AUDIT_MISSING==='1'){console.log('UNTRANSLATED_PUBLIC_PROSE',JSON.stringify(api.getState().untranslatedProse));console.log('UNMATCHED_PUBLIC_TEXT',JSON.stringify(api.getMissing().sort((a,b)=>b.length-a.length).slice(0,24)));}
 api.destroy();window.CaisikTextMotion.destroy();unmountJournal();journalStore.destroy();delete globalThis.document;delete globalThis.window;await settle('destroy');assert.equal(raf.size,0);
 console.log(`PASS real runtime integration: full production DOM, ${Object.keys(dictionaries.cs).length} entries/locale, ${callbacks} observer deliveries, ${records} mutation records, ${frames} finite RAF callbacks, ${elapsed}ms; six switches plus six real Frequency modes ×3 locales, original icons/handlers/private text and observed dynamic updates preserved; idle stable.`);
}else{
 const keys=Object.keys(dictionaries.cs);assert(keys.length>=2400,'substantive content catalogues compiled');
 for(const locale of locales){assert.deepEqual(Object.keys(dictionaries[locale]).sort(),[...keys].sort());assert(Object.values(dictionaries[locale]).every(value=>typeof value==='string'&&value.trim()));}
 const fields=[];const add=(value,label)=>{if(Array.isArray(value))value.forEach((v,index)=>add(v,`${label}[${index}]`));else if(typeof value==='string'&&value.trim())fields.push([normalize(value),label]);};
 const atlas=json('locations-data.json'),principles=json('principles-data.json'),culture=json('culture-data.json'),expeditions=json('expeditions/data/expeditions.json');
 for(const p of atlas.locations)for(const key of ['history','symbols','interpretation','observe','reflection','challenge','access','accessibility'])add(p[key],`location.${p.id}.${key}`);
 for(const p of principles.principles)for(const key of ['subtitle','doctrine','context','explanation','urban','observe','exercise','freestyle','artwork','demo','deeper'])add(p[key],`principle.${p.id}.${key}`);
 for(const p of principles.freestyleExercises)for(const key of ['title','duration','instruction'])add(p[key],`freestyle.${key}`);
 for(const p of culture.places){for(const key of ['facts','legacy','access'])add(p[key],`culture.${p.id}.${key}`);Object.entries(p.task).forEach(([key,value])=>add(value,`culture.${p.id}.task.${key}`));const profile=culturePlace(p);for(const key of ['history','symbols','interpretation','observe','reflection','challenge','accessibility'])add(profile[key],`culture-profile.${p.id}.${key}`);}
 for(const p of cultureRoutes(culture.places))for(const key of ['title','description'])add(p[key],`culture-route.${p.id}.${key}`);
 for(const p of expeditions.chapters){for(const key of ['subtitle','teaser','outcome','goals','preparation','homeAlternative'])add(p[key],`chapter.${p.id}.${key}`);for(const [i,entry]of p.context.entries())add(entry.text,`chapter.${p.id}.context.${i}`);}
 for(const p of expeditions.lessons)for(const key of ['title','objective','why','example','steps','check','artifact','advanced','question','notice','transfer'])add(p[key],`lesson.${p.id}.${key}`);
 for(const p of expeditions.places){add(p.access.summary,`expedition-place.${p.id}.summary`);add(p.access.requiresConfirmation,`expedition-place.${p.id}.conditions`);}
 for(const p of expeditions.routes){for(const key of ['title','summary'])add(p[key],`route.${p.id}.${key}`);for(const stop of p.stops)for(const key of ['task','transfer','conditions'])add(stop[key],`stop.${stop.id}.${key}`);}
 for(const key of ['classification','goals','planningNote'])add(culture.sessionBrief[key],`studio-practice.${key}`);
 for(const [index,lesson]of culture.sessionBrief.lessons.entries())for(const [key,value]of Object.entries(lesson))add(value,`studio-practice.${index}.${key}`);
 for(const p of Object.values(disciplineConfigs)){
  for(const key of ['question','goal','output','skills','prompts','hints'])add(p[key],`selfmade.${p.id}.${key}`);
  Object.entries(p.equipment).forEach(([key,value])=>add(value,`selfmade.${p.id}.equipment.${key}`));
  for(const step of p.steps)add(step.title,`selfmade.${p.id}.step.${step.id}.title`);
 }
 const missing=fields.filter(([source])=>locales.some(locale=>!Object.hasOwn(dictionaries[locale],source)));
 const missingUnique=[...new Map(missing.map(([source,label])=>[source,label])).entries()];
 assert.equal(missing.length,0,`actual public human content fields missing translations: ${JSON.stringify(missingUnique)}`);
 const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(directory,item.name)):item.name.endsWith('.html')?[path.join(directory,item.name)]:[]);
 let htmlCount=0,atlasCount=0;
 for(const file of walk(dist)){
  const html=fs.readFileSync(file,'utf8');if(!html.includes('text-motion.js'))continue;htmlCount++;
  const {document}=parseHTML(html),name=path.relative(dist,file);
  const script=document.querySelectorAll('script[src^="/languages.js?"]');assert.equal(script.length,1,`${name}: one language runtime`);assert(script[0].hasAttribute('defer'),`${name}: nonblocking classic defer`);
  assert.equal(document.querySelectorAll('link[href^="/languages.css?"]').length,1,`${name}: language styles once`);
  for(const img of document.querySelectorAll('img[alt]')){const alt=normalize(img.getAttribute('alt'));if(alt&&!/^(?:CAISIK|CAISIK Underground Alchemy|CAISIK — Underground Alchemy)$/i.test(alt))assert(locales.every(locale=>Object.hasOwn(dictionaries[locale],alt)),`${name}: descriptive alternative text has three local translations: ${alt}`);}
  assert(html.indexOf('/languages.js?')<html.indexOf('/text-motion.js?'),`${name}: locale runtime precedes kinetic text`);
  if(document.getElementById('hidden-city')){atlasCount++;assert.equal(document.querySelectorAll('script[src^="/journey-scroll.js?"]').length,1,`${name}: chapter bridge runtime once`);}
 }
 assert.equal(htmlCount,28);assert.equal(atlasCount,13);assert.equal(atlas.locations.length+culture.places.length,32);
 const studios=culture.places.filter(p=>p.category==='studio');assert.equal(studios.length,6);assert.equal(culture.sessionBrief.lessons.length,3);
 const pinned=[...atlas.locations,...culture.places].filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));assert.equal(pinned.length,31);
 const missingPins=culture.places.filter(p=>p.lat===null);assert.equal(missingPins.length,1);assert.equal(missingPins[0].id,'spot13');
 assert.match(read('city-map.js'),/buildingMode\s*=\s*'map'/,'geographic building footprints default; authored models opt-in');
 const child=spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--runtime'],{cwd:root,encoding:'utf8',timeout:15000,maxBuffer:1000000});
 assert(!child.error,`real-observer runtime exceeded safety budget: ${child.error?.message}\n${child.stdout}\n${child.stderr}`);
 assert.equal(child.status,0,`real-observer runtime failed:\n${child.stdout}\n${child.stderr}`);
 console.log(`PASS release integration: ${keys.length} identical catalogue keys ×3 locales; ${fields.length} actual teaching/profile/task/access fields covered; ${htmlCount} correctly ordered language entries, ${atlasCount} scroll entries; 32 places/31 pins/6 studios/3 session lessons.`);
 process.stdout.write(child.stdout);
}
