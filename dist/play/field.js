/* Private city fieldwork. Public place facts come only from the existing source datasets. */
const DISCIPLINES = ['writer', 'mc', 'dj', 'breaking', 'knowledge'];
const LABELS = {writer: 'Writer', mc: 'MC', dj: 'DJ', breaking: 'B-boy / B-girl', knowledge: 'Knowledge'};
const INTENTS = {all: 'Všechna místa', listen: 'Poslouchat', letters: 'Studovat písmo', observe: 'Pozorovat', write: 'Psát'};
const TASKS = {
  writer: 'Najdi dva tvary a jednu mezeru mezi nimi. Na papíře z nich navrhni kostru vlastního písmene; žádný povrch na místě nemaluj bez výslovného povolení.',
  mc: 'Zapiš jeden konkrétní zvuk, tvar a gesto. Vytvoř čtyři vlastní bary, které je spojí bez použití názvu místa.',
  dj: 'Pozoruj rytmus okolí. Zapiš tři slyšitelné vrstvy a jejich nástupy; záznam není nutný. Později je použij jako dramaturgický podnět pro vlastní mix.',
  breaking: 'V bezpečné neblokující pozici pouze sleduj hudební a prostorové podněty. Zapiš jeden okamžik, na který chceš při své příští vedené session reagovat. Nezkoušej podle této ilustrace techniku.',
  knowledge: 'Odděl tři věty: co opravdu pozoruješ, co podporuje uvedený zdroj a co je tvoje interpretace. Napiš, co by mohlo tvoji interpretaci změnit.'
};
const FALLBACKS = {
  writer: 'Doma použij obal nebo vlastní fotografii jako vizuální podnět. Nakresli písmeno a negativní prostor; výsledek není návštěvou ani legální realizací na zdi.',
  mc: 'U okna si všimni zvuku, tvaru a gesta. Napiš čtyři bary a uprav jeden obecný řádek na konkrétní obraz.',
  dj: 'Poslechni vlastní nebo oprávněně použitou nahrávku třikrát: rytmus, basa, motiv. Zapiš konkrétní okamžik a jeho funkci ve svém zamýšleném mixu.',
  breaking: 'Připrav otázku pro svého lektora a jednu reakci na hudební podnět. Bez odborně zvolené ukázky zůstaň u poslechu a plánování vlastní přiměřené session.',
  knowledge: 'Vyber domácí předmět a vytvoř dvě interpretace jeho významu. Pod každou napiš pozorování, ze kterého vychází; interpretaci nevydávej za historický fakt.'
};
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const safeUrl = value => { try {const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : null;} catch {return null;} };
const dateLabel = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : 'Datum kontroly neuvedeno';

export function normalizeCoordinates(value) {
  if (!value || typeof value !== 'object') return null;
  const lat = value.lat ?? value.latitude, lng = value.lng ?? value.lon ?? value.longitude;
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? {lat, lng} : null;
}
export function navigationUrl(place) {
  const pin = normalizeCoordinates(place.coordinates);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin ? `${pin.lat},${pin.lng}` : [place.name, place.address].filter(Boolean).join(', '))}`;
}
export function normalizePlaces(atlas, expeditions) {
  const places = new Map();
  for (const p of atlas.locations || []) {
    if (!p.id || !p.name) continue;
    places.set(p.id, {id:p.id, name:p.name, address:p.address || '', coordinates:normalizeCoordinates({lat:p.lat,lng:p.lng}), coordinateNote:p.coordinateStatus || '', categories:Array.isArray(p.categories)?p.categories:[], history:p.history || '', documented:p.symbols || '', interpretation:p.interpretation || '', access:p.access || '', accessibility:p.accessibility || '', checkedAt:atlas.checkedAt, sources:(p.sources || []).map(s=>({label:s.title,url:safeUrl(s.url)})).filter(s=>s.url), disciplines:[], placements:[], private:false});
  }
  for (const p of expeditions.places || []) {
    if (!p.id || !p.name) continue;
    const prev = places.get(p.id);
    const sourceList = [...(prev?.sources || []), ...(p.sources || []).map(s=>({label:s.label,url:safeUrl(s.url)})).filter(s=>s.url)];
    const sourceMap = new Map(sourceList.map(s=>[s.url,s]));
    places.set(p.id, {...(prev || {id:p.id,name:p.name,address:p.address || '',coordinates:null,coordinateNote:'Přesný vstup není ověřený.',categories:[],history:'',documented:'',interpretation:'',accessibility:'',disciplines:[],placements:[],private:false}), coordinates:prev?.coordinates || normalizeCoordinates(p.coordinates), access:p.access?.summary || prev?.access || '', checkedAt:p.access?.checkedAt || prev?.checkedAt, conditions:p.access?.requiresConfirmation || [], sources:[...sourceMap.values()]});
  }
  for (const route of expeditions.routes || []) for (const stop of route.stops || []) {
    const p = places.get(stop.placeId); if (!p) continue;
    if (!p.disciplines.includes(route.chapterId)) p.disciplines.push(route.chapterId);
    p.placements.push({id:stop.id,chapterId:route.chapterId,title:stop.title,task:stop.task,conditions:stop.conditions,durationMinutes:stop.durationMinutes,lessonId:stop.lessonId});
  }
  // Atlas architecture is suitable as an observational prompt for any discipline;
  // eligibility is an editorial exercise, never a claim of specialist facilities.
  return [...places.values()];
}
export function reorderStop(ids, index, direction) {
  const result = [...ids], next = index + direction;
  if (!Number.isInteger(index) || !Number.isInteger(direction) || index < 0 || index >= ids.length || next < 0 || next >= ids.length) return result;
  [result[index],result[next]] = [result[next],result[index]]; return result;
}
export function buildRoadbook({title, stopIds, plannedMinutes, transport, observations=[]}, places, discipline='writer') {
  const byId = new Map(places.map(p=>[p.id,p]));
  return [`CAISIK — ${title || 'Osobní výprava'}`,`Disciplína: ${LABELS[discipline] || discipline}`,`Vlastní časový rozpočet: ${plannedMinutes || 30} min; způsob přesunu: ${transport || 'pěšky'}`, 'Rozpočet není výpočet délky cesty. Spoje, vzdálenosti a aktuální provoz ověř před odchodem.', ...stopIds.map((id,i)=>{const p=byId.get(id);if(!p)return `${i+1}. Nedostupný záznam: ${id}`;return `\n${i+1}. ${p.name}\n${p.address}\n${p.private?'Vlastní soukromý postřeh — přístup není ověřený.':`Podmínky: ${p.access}\nKontrola zdroje: ${dateLabel(p.checkedAt)}`}\nTvůrčí zadání: ${TASKS[discipline] || TASKS.writer}\nNavigace: ${navigationUrl(p)}\n${p.sources.map(s=>`${s.label}: ${s.url}`).join('\n')}\n${observations.filter(o=>o.placeId===p.id&&o.discipline===discipline).map(o=>`Vlastní postřehy / ${o.createdAt || ''}\nZaznamenaný čas včetně přestávek: ${Number(o.observedMinutes)||0} min\nTvar: ${o.shape || ''}\nZvuk: ${o.sound || ''}\nGesto: ${o.gesture || ''}\nPoznámka: ${o.text || ''}`).join('\n')}`;}), '\nTři postřehy u každého místa: tvar / zvuk / gesto. Poté přenes jeden detail do vlastní práce.'].join('\n');
}

const plainRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const textValue=(value,fallback='',max=4000)=>typeof value==='string'?value.slice(0,max):fallback;
const validFieldId=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9:_-]{0,159}$/i.test(value);
export function normalizeFieldRoute(value) {
  if(!plainRecord(value)||!validFieldId(value.id)||typeof value.title!=='string'||!Array.isArray(value.stopIds)||!value.stopIds.every(validFieldId))return null;
  return {...value,title:value.title.slice(0,120),stopIds:[...new Set(value.stopIds)].slice(0,512),plannedMinutes:typeof value.plannedMinutes==='number'&&Number.isFinite(value.plannedMinutes)?Math.max(10,Math.min(600,value.plannedMinutes)):30,transport:['pěšky','kolo','MHD','kombinace'].includes(value.transport)?value.transport:'pěšky'};
}
export function normalizeFieldDraft(value) {
  const saved=plainRecord(value)?value:{},timers={};
  for(const [key,timer] of Object.entries(plainRecord(saved.timers)?saved.timers:{}).slice(0,512)) {
    if(!/^(writer|mc|dj|breaking|knowledge):[a-z0-9][a-z0-9:_-]{0,159}$/i.test(key)||!plainRecord(timer))continue;
    timers[key]={elapsedMs:typeof timer.elapsedMs==='number'&&Number.isFinite(timer.elapsedMs)?Math.max(0,Math.min(31*24*60*60*1000,timer.elapsedMs)):0,runningSince:typeof timer.runningSince==='number'&&Number.isFinite(timer.runningSince)&&timer.runningSince>=0?timer.runningSince:null,startedAt:typeof timer.startedAt==='string'&&Number.isFinite(Date.parse(timer.startedAt))?timer.startedAt.slice(0,40):null,finishedAt:typeof timer.finishedAt==='string'&&Number.isFinite(Date.parse(timer.finishedAt))?timer.finishedAt.slice(0,40):null};
  }
  const privatePlaces=(Array.isArray(saved.privatePlaces)?saved.privatePlaces:[]).filter(p=>plainRecord(p)&&validFieldId(p.id)&&typeof p.name==='string'&&p.name.trim()&&typeof p.address==='string'&&p.address.trim()).slice(0,256).map(p=>({id:p.id,name:p.name.slice(0,100),address:p.address.slice(0,300),text:textValue(p.text,'',3000),createdAt:typeof p.createdAt==='string'&&Number.isFinite(Date.parse(p.createdAt))?p.createdAt.slice(0,40):''}));
  const selectedIds=[...new Set((Array.isArray(saved.selectedIds)?saved.selectedIds:[]).filter(validFieldId))].slice(0,512);
  return {discipline:DISCIPLINES.includes(saved.discipline)?saved.discipline:'writer',intent:typeof saved.intent==='string'&&Object.hasOwn(INTENTS,saved.intent)?saved.intent:'all',search:textValue(saved.search,'',300),selectedIds,currentIndex:Number.isInteger(saved.currentIndex)?Math.max(0,Math.min(Math.max(0,selectedIds.length-1),saved.currentIndex)):0,title:textValue(saved.title,'Moje městská výprava',120),plannedMinutes:typeof saved.plannedMinutes==='number'&&Number.isFinite(saved.plannedMinutes)?Math.max(10,Math.min(600,saved.plannedMinutes)):30,transport:['pěšky','kolo','MHD','kombinace'].includes(saved.transport)?saved.transport:'pěšky',privatePlaces:[...new Map(privatePlaces.map(p=>[p.id,p])).values()],returnStep:textValue(saved.returnStep),activeRouteId:validFieldId(saved.activeRouteId)?saved.activeRouteId:'',routeOnly:saved.routeOnly===true,timers};
}

const cloneField=value=>JSON.parse(JSON.stringify(value));
const deletedField=Symbol('deletedField');
export function fieldDraftPatch(before,after) {
  if(JSON.stringify(before)===JSON.stringify(after))return undefined;
  if(!plainRecord(before)||!plainRecord(after))return {value:cloneField(after)};
  const children={};for(const key of new Set([...Object.keys(before),...Object.keys(after)])) {
    if(!Object.hasOwn(after,key))children[key]=deletedField;
    else if(!Object.hasOwn(before,key))children[key]={value:cloneField(after[key])};
    else {const patch=fieldDraftPatch(before[key],after[key]);if(patch!==undefined)children[key]=patch;}
  }
  return {children};
}
export function applyFieldDraftPatch(current,patch) {
  if(patch===undefined)return cloneField(current);
  if(Object.hasOwn(patch,'value'))return cloneField(patch.value);
  const output=plainRecord(current)?cloneField(current):{};
  for(const [key,change] of Object.entries(patch.children)) {
    if(['__proto__','prototype','constructor'].includes(key))continue;
    if(change===deletedField)delete output[key];else output[key]=applyFieldDraftPatch(output[key],change);
  }
  return output;
}

export function sampleVisitTimer(timer, now=Date.now()) {
  const elapsed=Number.isFinite(timer?.elapsedMs)&&timer.elapsedMs>=0?timer.elapsedMs:0;
  const running=Number.isFinite(timer?.runningSince)?Math.max(0,now-timer.runningSince):0;
  return Math.min(31*24*60*60*1000,elapsed+running);
}
export function transitionVisitTimer(timer, action, now=Date.now()) {
  const elapsedMs=sampleVisitTimer(timer,now);
  if(action==='start')return {...timer,elapsedMs,runningSince:now,startedAt:timer?.startedAt||new Date(now).toISOString(),finishedAt:null};
  if(action==='pause'||action==='finish')return {...timer,elapsedMs,runningSince:null,...(action==='finish'?{finishedAt:new Date(now).toISOString()}:{})};
  return {...timer};
}
const formatVisitTime=ms=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;

export function mountField(root, {store, notify = ()=>{}, now=()=>Date.now()}) {
  let alive = true, places = [], loaded = false, draft = {}, fallback = false, timer, activeSpeech = null,baselineDraft,ownUpdateDepth=0,renderedObservation=null,timingDirty=false;
  const observationDirty=new Set();
  const abort = new AbortController(), signal=abort.signal, downloads=new Set();
  const stateDraft=()=>store.get().drafts?.field || {};
  const readDraft=()=>{draft=normalizeFieldDraft(stateDraft());};
  readDraft();baselineDraft=cloneField(draft);
  function updateStore(mutator){ownUpdateDepth++;try{return store.update(mutator);}finally{ownUpdateDepth--;}}
  function persist() {
    const patch=fieldDraftPatch(baselineDraft,draft);if(patch===undefined)return true;
    const ok=updateStore(s=>{s.drafts.field=applyFieldDraftPatch(plainRecord(s.drafts.field)?s.drafts.field:{},patch);});
    baselineDraft=cloneField(draft);return ok;
  }
  function refreshFromStore(){
    if(!alive||ownUpdateDepth)return;
    const focused=document.activeElement;if(focused&&root.contains(focused)&&/^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName))return;
    const patch=fieldDraftPatch(baselineDraft,draft),latest=normalizeFieldDraft(stateDraft());
    baselineDraft=cloneField(latest);draft=applyFieldDraftPatch(latest,patch);render();
  }
  const savedNotice=(ok,message)=>notify(ok?message:'Změny zůstávají v paměti této stránky. Trvalé uložení selhalo; vyexportuj zálohu.');
  const allPlaces=()=>[...places,...draft.privatePlaces.map(p=>({...p,coordinates:null,sources:[],private:true,categories:[],disciplines:[],placements:[],access:'Soukromý záznam; pravidla a přístup nejsou ověřené.',history:p.text || '',documented:'',interpretation:'',accessibility:''}))];
  const timerKey=p=>`${draft.discipline}:${p.id}`;
  const routeElapsed=()=>draft.selectedIds.reduce((sum,id)=>sum+sampleVisitTimer(draft.timers[`${draft.discipline}:${id}`],now()),0);
  const savedRoutes=()=>store.get().routes.map(normalizeFieldRoute).filter(Boolean);
  const selected=()=>draft.selectedIds.map(id=>allPlaces().find(p=>p.id===id)).filter(Boolean);
  const sourceLinks=p=>p.sources.length?`<ul class="field-sources">${p.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a></li>`).join('')}</ul>`:'<p>Soukromý postřeh nemá redakčně ověřené zdroje.</p>';
  function stopSpeech(){if(activeSpeech&&globalThis.speechSynthesis){speechSynthesis.cancel();activeSpeech=null;}}
  function render() {
    if(!alive)return; stopSpeech();
    const chosen=selected();if(loaded)draft.currentIndex=Math.min(draft.currentIndex,Math.max(0,chosen.length-1));const current=chosen[Math.min(Math.max(0,draft.currentIndex),Math.max(0,chosen.length-1))];
    root.innerHTML=`<div class="field-head"><div><p class="play-kicker">HIDDEN CITY / TVOJE TRASA</p><h2>MĚSTO JE<br>TVŮJ TERÉN.</h2><p>Vyber skutečná místa. Vytvoř vlastní pořadí. Odnes si materiál pro vlastní práci.</p></div><div class="field-head-actions"><a class="play-button field-fast-jump" href="#field-stage">DALŠÍ MÍSTO / ADRESA ↓</a><a class="play-button" href="#field-route-title">PLÁN TRASY ↓</a><a class="play-button" href="/#hidden-city">PŮVODNÍ MAPA ↗</a></div></div>
      <div class="field-controls"><label>Tvůj záměr<select name="field-discipline">${DISCIPLINES.map(d=>`<option value="${d}" ${draft.discipline===d?'selected':''}>${LABELS[d]}</option>`).join('')}</select></label><label>Co chci dělat<select name="field-intent">${Object.entries(INTENTS).map(([v,l])=>`<option value="${v}" ${draft.intent===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Hledat místo nebo motiv<input name="field-search" type="search" value="${esc(draft.search)}" placeholder="Název, čtvrť, architektura…"></label></div>
      <label class="field-route-filter"><input type="checkbox" name="field-route-only" ${draft.routeOnly?'checked':''}> Pouze zdrojové zastávky vybrané expedice</label><p class="field-fact-note">Podmínky jsou převzaté z existujícího ověřeného archivu, většinou z 21. 10. 2026. Před návštěvou zkontroluj oficiální zdroj. Veřejná návštěva neopravňuje k malování, placené lekci ani nahrávání jiných lidí.</p>
      <div class="field-layout"><section aria-labelledby="field-discover-title"><h3 id="field-discover-title">01 / VYBER PODNĚT</h3><p class="field-load-status">${loaded?`${places.length} zdrojových míst, ${draft.privatePlaces.length} soukromých postřehů.`:'Načítám existující atlas…'}</p><div class="field-list"></div><details class="field-private"><summary>+ Vlastní soukromý pozorovací bod</summary><form data-form="private"><label>Název<input name="name" maxlength="100" required></label><label>Adresa / popis místa<input name="address" maxlength="300" required></label><label>Co chci pozorovat<textarea name="text" maxlength="3000"></textarea></label><p>Adresa nevytváří ověřený mapový pin. Záznam zůstává jen v tomto prohlížeči.</p><button type="submit">ULOŽIT SOUKROMĚ</button></form></details></section>
      <section class="field-route" aria-labelledby="field-route-title"><h3 id="field-route-title">02 / POSKLÁDEJ CESTU</h3><label>Název výpravy<input name="field-title" maxlength="120" value="${esc(draft.title)}"></label><div class="field-route-options"><label>Vlastní časový rozpočet / min<input name="field-minutes" type="number" min="10" max="600" step="5" value="${draft.plannedMinutes}"></label><label>Přesun<select name="field-transport">${['pěšky','kolo','MHD','kombinace'].map(t=>`<option ${draft.transport===t?'selected':''}>${t}</option>`).join('')}</select></label></div><p class="field-time-comparison" data-field-route-time>Tvůj rozpočet: ${draft.plannedMinutes} min · zaznamenaný čas zastávek: ${(routeElapsed()/60000).toFixed(1)} min.</p><p>Čas zahrnuje tvoji práci a pauzy. Délku přesunů nevypočítáváme; ověř ji v navigaci. Při nejisté dostupnosti zvol domácí větev.</p><ol class="field-route-stops">${chosen.map((p,i)=>`<li><button type="button" data-action="focus" data-index="${i}"><strong>${esc(p.name)}</strong></button><div class="field-stop-actions"><button type="button" data-action="up" data-index="${i}" aria-label="Posunout ${esc(p.name)} výš" ${i===0?'disabled':''}>↑</button><button type="button" data-action="down" data-index="${i}" aria-label="Posunout ${esc(p.name)} níž" ${i===chosen.length-1?'disabled':''}>↓</button><button type="button" data-action="remove" data-id="${esc(p.id)}" aria-label="Odebrat ${esc(p.name)}">×</button></div></li>`).join('')||'<li class="field-empty">Přidej první místo z nabídky vlevo.</li>'}</ol><div class="field-buttons"><button type="button" data-action="save-route" ${!chosen.length?'disabled':''}>ULOŽIT TRASU</button><button type="button" data-action="export-route" ${!chosen.length?'disabled':''}>ROADBOOK ↓ TXT</button></div><label>Uložené osobní trasy<select name="field-load-route"><option value="">Vyber trasu…</option>${savedRoutes().map(r=>`<option value="${esc(r.id)}" ${draft.activeRouteId===r.id?'selected':''}>${esc(r.title)}</option>`).join('')}</select></label>${savedRoutes().length<store.get().routes.length?'<p role="status">Některá importovaná trasa nemá platný seznam zastávek. Původní data zůstávají v záloze; neplatný záznam zde neotevíráme.</p>':''}<button type="button" data-action="delete-route">SMAZAT VYBRANOU ULOŽENOU TRASU</button></section></div>
      <section id="field-stage" class="field-stage" aria-labelledby="field-stage-title"><p class="play-kicker">03 / TERÉNNÍ REŽIM · BEZ ČEKÁNÍ NA ANIMACI</p><h3 id="field-stage-title">${current?esc(current.name):'DALŠÍ MÍSTO ČEKÁ NA TVŮJ VÝBĚR'}</h3>${current?renderCurrent(current,chosen):'<p>Přidej zastávku. Přesná adresa, podmínky a jeden úkol se objeví přímo tady.</p>'}</section>
      <section class="field-return"><p class="play-kicker">04 / NÁVRATOVÁ SESSION</p><h3>Z POSTŘEHU VLASTNÍ VÝSTUP.</h3><label>Co z cesty opravdu použiji?<textarea name="field-return" maxlength="4000" placeholder="Vyber jeden detail a napiš jeden další krok…">${esc(draft.returnStep)}</textarea></label><div class="field-buttons"><button type="button" data-action="save-return">ULOŽIT DALŠÍ KROK</button><a href="#workshop" class="play-button">PŘENÉST DO DÍLNY ↗</a><a href="/expeditions/${draft.discipline}/" class="play-button">CELÁ EXPEDICE ↗</a></div></section>`;
    renderList();
  }
  function renderList(){
    const query=draft.search.toLocaleLowerCase('cs').trim(), list=root.querySelector('.field-list'); if(!list)return;
    const filtered=allPlaces().filter(p=>{
      const text=[p.name,p.address,...p.categories,p.history,p.documented].join(' ').toLocaleLowerCase('cs');
      if(query&&!text.includes(query))return false;
      if(draft.routeOnly&&!p.disciplines.includes(draft.discipline))return false;
      if(draft.intent==='listen'&&!p.disciplines.some(d=>['dj','breaking','mc'].includes(d))&&!p.categories.some(c=>/Music|Hip-hop/i.test(c)))return false;
      if(draft.intent==='letters'&&!p.disciplines.includes('writer')&&!p.categories.some(c=>/Typography|Graffiti|Architecture/i.test(c)))return false;
      if(draft.intent==='write'&&!p.disciplines.some(d=>['mc','knowledge'].includes(d))&&!p.categories.some(c=>/Literature|Symbolism/i.test(c)))return false;
      return true;
    });
    list.innerHTML=filtered.map(p=>`<article class="field-place"><div class="field-place-title"><div><p class="field-evidence">${p.private?'SOUKROMÝ POSTŘEH':'ZDROJOVÝ ZÁZNAM'}</p><h4${p.private?' data-i18n-user':''}>${esc(p.name)}</h4></div><button type="button" data-action="add" data-id="${esc(p.id)}" ${draft.selectedIds.includes(p.id)?'disabled':''} aria-label="Přidat ${esc(p.name)} do výpravy">${draft.selectedIds.includes(p.id)?'✓':'+'}</button></div><p${p.private?' data-i18n-user':''}>${esc(p.address)}</p><div class="field-tags">${(p.disciplines.length?p.disciplines:['pozorování']).map(d=>`<span>${esc(LABELS[d]||d)}</span>`).join('')}</div><details><summary>Podmínky, důkazy a interpretace</summary><p><strong>Přístup:</strong> ${esc(p.access)}</p>${p.accessibility?`<p><strong>Dostupnost:</strong> ${esc(p.accessibility)}</p>`:''}<p class="field-evidence">${p.private?'NEOVĚŘENÝ VLASTNÍ BOD':`KONTROLA ZDROJE / ${esc(dateLabel(p.checkedAt))}`}</p>${p.history?`<h5>${p.private?'Vlastní poznámka':'Doložený kontext'}</h5><p${p.private?' data-i18n-user':''}>${esc(p.history)}</p>`:''}${p.documented?`<h5>Dokumentované prvky</h5><p>${esc(p.documented)}</p>`:''}${p.interpretation?`<h5>Autorská interpretace / CAISIK</h5><p>${esc(p.interpretation)}</p>`:''}${sourceLinks(p)}${p.private?`<button type="button" data-action="delete-private" data-id="${esc(p.id)}">SMAZAT SOUKROMÝ BOD</button>`:''}<p>${p.coordinates?`Poloha: ${esc(p.coordinateNote || 'Zdrojové souřadnice — neověřují správný vstup.')}`:'Přesný vstup není ověřený. Navigace hledá název a adresu, nevytváříme pin.'}</p></details></article>`).join('')||'<p class="field-empty">Nic neodpovídá. Zkus kratší dotaz nebo jiný záměr.</p>';
  }
  function renderCurrent(p,chosen){
    const note=store.get().observations.filter(o=>o.placeId===p.id&&o.discipline===draft.discipline).at(-1) || {};
    renderedObservation={placeId:p.id,discipline:draft.discipline,fields:Object.fromEntries(['shape','sound','gesture','text'].map(key=>[key,typeof note[key]==='string'?note[key]:'']))};
    const placement=p.placements.find(s=>s.chapterId===draft.discipline),visit=draft.timers[timerKey(p)]||{},running=Number.isFinite(visit.runningSince);
    return `<p class="field-position">ZASTÁVKA ${Math.min(draft.currentIndex+1,chosen.length)} / ${chosen.length}</p><p class="field-address">${esc(p.address)}</p><div class="field-buttons"><a class="play-button" href="${esc(navigationUrl(p))}" target="_blank" rel="noopener noreferrer">NAVIGOVAT ↗</a><button type="button" data-action="prev" ${draft.currentIndex<=0?'disabled':''}>← PŘEDCHOZÍ</button><button type="button" data-action="next" ${draft.currentIndex>=chosen.length-1?'disabled':''}>DALŠÍ →</button></div><p>${esc(p.access)}</p><p class="field-evidence">${p.private?'SOUKROMÝ BOD / PŘÍSTUP NEOVĚŘEN':`ZDROJ KONTROLOVÁN ${esc(dateLabel(p.checkedAt))}`}</p>${placement?.conditions?`<p>${esc(placement.conditions)}</p>`:''}${sourceLinks(p)}<section class="field-timer" aria-label="Vlastní čas na zastávce"><p class="field-evidence">VLASTNÍ TEMPO / SKUTEČNÝ ČAS</p><output data-field-visit-time aria-live="off">${formatVisitTime(sampleVisitTimer(visit,now()))}</output><p>Od ručního startu do pauzy či ukončení, včetně přestávek a času mimo tuto kartu i po zavření stránky. Není to délka cesty ani důkaz znalosti.</p><div class="field-buttons"><button type="button" data-action="timer-start" ${running?'disabled':''}>${sampleVisitTimer(visit,now())?'POKRAČOVAT':'SPUSTIT ČAS'}</button><button type="button" data-action="timer-pause" ${running?'':'disabled'}>PAUZA</button><button type="button" data-action="timer-finish" ${sampleVisitTimer(visit,now())||running?'':'disabled'}>UKONČIT A ZAPSAT ČAS</button></div><p>${visit.finishedAt?'Čas ukončený a připojený k osobnímu pozorování.':running?'Čas běží do tvé výslovné pauzy nebo ukončení.':'Čas neběží.'}</p></section><div class="field-task"><p class="field-evidence">TVŮRČÍ ZADÁNÍ / ${LABELS[draft.discipline]}</p><p>${esc(fallback?FALLBACKS[draft.discipline]:TASKS[draft.discipline])}</p>${!fallback&&placement?.task?`<details><summary>Konkrétní úkol původní expedice</summary><p>${esc(placement.task)}</p></details>`:''}<div class="field-buttons"><button type="button" data-action="fallback" aria-pressed="${fallback}">${fallback?'VRÁTIT ÚKOL NA MÍSTĚ':'MÍSTO JE ZAVŘENÉ / DOMÁCÍ VĚTEV'}</button><button type="button" data-action="speak">PŘEČÍST ÚKOL</button><button type="button" data-action="stop-speech">ZASTAVIT HLAS</button></div><p class="field-voice-status" role="status">Hlas se spouští jen tvojí volbou, používá pouze dostupný místní hlas zařízení.</p></div><form data-form="observation"><div class="field-three"><label>Tvar<input name="shape" maxlength="1000" value="${esc(note.shape)}"></label><label>Zvuk<input name="sound" maxlength="1000" value="${esc(note.sound)}"></label><label>Gesto<input name="gesture" maxlength="1000" value="${esc(note.gesture)}"></label></div><label>Pozorování / interpretace / co chci ověřit<textarea name="text" maxlength="4000">${esc(note.text)}</textarea></label><button type="submit">ULOŽIT TŘI POSTŘEHY</button><p>Ukládá se soukromě do tohoto prohlížeče. Zálohu vytvoříš v Blackbooku.</p></form>`;
  }
  function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));downloads.add(url);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();notify('Roadbook je připravený ke stažení. Ověř soubor ve stažených souborech.');}
  root.addEventListener('input',event=>{
    const el=event.target;
    if(el.closest('[data-form="observation"]')){observationDirty.add(el.name);saveObservation(false);}
    if(el.name==='field-search'){draft.search=el.value;renderList();clearTimeout(timer);timer=setTimeout(persist,300);}
    if(el.name==='field-title'){draft.title=el.value;clearTimeout(timer);timer=setTimeout(persist,300);}
    if(el.name==='field-return'){draft.returnStep=el.value;clearTimeout(timer);timer=setTimeout(persist,300);}
  },{signal});
  root.addEventListener('change',event=>{
    const el=event.target;
    if(el.name==='field-discipline'){saveObservation(false);draft.discipline=el.value;fallback=false;persist();render();}
    if(el.name==='field-route-only'){draft.routeOnly=el.checked;persist();renderList();}
    if(el.name==='field-intent'){draft.intent=el.value;persist();renderList();}
    if(el.name==='field-minutes'){draft.plannedMinutes=Math.max(10,Math.min(600,Number(el.value)||30));el.value=draft.plannedMinutes;persist();}
    if(el.name==='field-transport'){draft.transport=el.value;persist();}
    if(el.name==='field-load-route'&&el.value){const r=savedRoutes().find(r=>r.id===el.value);if(r){draft.activeRouteId=r.id;draft.selectedIds=[...r.stopIds];draft.title=r.title;draft.plannedMinutes=r.plannedMinutes||30;draft.transport=r.transport||'pěšky';draft.currentIndex=0;persist();render();}}
  },{signal});
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');if(!button||!root.contains(button))return;
    const a=button.dataset.action, id=button.dataset.id, index=Number(button.dataset.index);
    if(a.startsWith('timer-')){const p=selected()[draft.currentIndex];if(!p)return;const key=timerKey(p),action=a.slice(6),stamp=now();if(action==='start')for(const [k,t] of Object.entries(draft.timers))if(k!==key&&Number.isFinite(t.runningSince))draft.timers[k]=transitionVisitTimer(t,'pause',stamp);draft.timers[key]=transitionVisitTimer(draft.timers[key],action,stamp);timingDirty=true;const ok=persist();saveObservation(false);if(action==='finish')updateStore(s=>{const route=s.routes.find(r=>r.id===draft.activeRouteId);if(route){route.observedMinutes=Number((routeElapsed()/60000).toFixed(2));route.timingIncludesBreaks=true;route.observedAt=new Date(stamp).toISOString();}});render();if(action==='finish')savedNotice(ok,'Skutečný čas zastávky připojený k osobnímu pozorování. Příští rozpočet uprav podle této zkušenosti.');return;}
    if(a==='add'&&allPlaces().some(p=>p.id===id)&&!draft.selectedIds.includes(id)){draft.selectedIds.push(id);persist();render();}
    if(a==='remove'){draft.selectedIds=draft.selectedIds.filter(p=>p!==id);draft.currentIndex=Math.min(draft.currentIndex,Math.max(0,draft.selectedIds.length-1));persist();render();}
    if(a==='up'||a==='down'){draft.selectedIds=reorderStop(draft.selectedIds,index,a==='up'?-1:1);persist();render();}
    if(a==='focus'){draft.currentIndex=index;fallback=false;persist();render();root.querySelector('.field-stage').scrollIntoView({block:'start',behavior:'instant'});}
    if(a==='prev'||a==='next'){saveObservation(false);draft.currentIndex=Math.max(0,Math.min(draft.selectedIds.length-1,draft.currentIndex+(a==='next'?1:-1)));fallback=false;persist();render();root.querySelector('.field-stage').scrollIntoView({block:'start',behavior:'instant'});}
    if(a==='fallback'){saveObservation(false);fallback=!fallback;render();}
    if(a==='save-route') {const route={id:uid('route'),title:draft.title.trim()||'Moje výprava',stopIds:[...draft.selectedIds],plannedMinutes:draft.plannedMinutes,transport:draft.transport,observedMinutes:Number((routeElapsed()/60000).toFixed(2)),timingIncludesBreaks:true,createdAt:new Date().toISOString()};draft.activeRouteId=route.id;persist();savedNotice(updateStore(s=>s.routes.push(route)),'Osobní trasa uložená.');render();}
    if(a==='delete-private'){draft.privatePlaces=draft.privatePlaces.filter(p=>p.id!==id);draft.selectedIds=draft.selectedIds.filter(p=>p!==id);draft.currentIndex=0;updateStore(s=>{s.observations=s.observations.filter(o=>o.placeId!==id);for(const route of s.routes)if(Array.isArray(route.stopIds))route.stopIds=route.stopIds.filter(stop=>stop!==id);});const ok=persist();render();savedNotice(ok,'Soukromý bod odstraněný. Dříve vyexportované zálohy se tím nemění.');}
    if(a==='delete-route'){const routeId=root.querySelector('[name="field-load-route"]').value;if(!routeId){notify('Nejdřív vyber uloženou trasu.');return;}const ok=updateStore(s=>{s.routes=s.routes.filter(r=>r.id!==routeId);});render();savedNotice(ok,'Uložená trasa odstraněná.');}
    if(a==='export-route')download('caisik-roadbook.txt',buildRoadbook({...draft,stopIds:draft.selectedIds,observations:store.get().observations},allPlaces(),draft.discipline));
    if(a==='save-return'){savedNotice(persist(),'Další krok uložený. V dílně použij vybraný postřeh.');}
    if(a==='stop-speech'){stopSpeech();root.querySelector('.field-voice-status').textContent='Čtení zastaveno.';}
    if(a==='speak'){const status=root.querySelector('.field-voice-status');if(!('speechSynthesis'in globalThis)||!('SpeechSynthesisUtterance'in globalThis)){status.textContent='Zařízení nenabízí místní hlas. Celý úkol je napsaný výše.';return;}const voice=speechSynthesis.getVoices().find(v=>v.localService&&/^cs(?:-|$)/i.test(v.lang));if(!voice){status.textContent='Místní český hlas není dostupný. Celý úkol je napsaný výše.';return;}stopSpeech();activeSpeech=new SpeechSynthesisUtterance(fallback?FALLBACKS[draft.discipline]:TASKS[draft.discipline]);activeSpeech.voice=voice;activeSpeech.lang='cs-CZ';activeSpeech.onend=()=>{activeSpeech=null;if(alive&&root.querySelector('.field-voice-status'))root.querySelector('.field-voice-status').textContent='Úkol dočtený.';};activeSpeech.onerror=()=>{activeSpeech=null;if(alive&&root.querySelector('.field-voice-status'))root.querySelector('.field-voice-status').textContent='Hlas se nepodařilo přehrát. Použij celý text výše.';};speechSynthesis.speak(activeSpeech);status.textContent='Čtu místním hlasem zařízení…';}
  },{signal});
  function saveObservation(showNotice=true){
    const form=root.querySelector('[data-form="observation"]'),context=renderedObservation;if(!form||!context)return true;
    const data=new FormData(form),fields=Object.fromEntries(['shape','sound','gesture','text'].map(k=>[k,String(data.get(k)||'')]));
    const changed=Object.fromEntries(Object.entries(fields).filter(([key,value])=>(showNotice||observationDirty.has(key))&&value!==context.fields[key]));
    const elapsedMs=sampleVisitTimer(draft.timers[`${context.discipline}:${context.placeId}`],now());
    const old=store.get().observations.findLast(o=>o.placeId===context.placeId&&o.discipline===context.discipline);
    if(!Object.keys(changed).length&&!timingDirty){if(showNotice)notify(old?'Postřehy už jsou zaznamenané.':'Nejdřív zachyť alespoň jeden vlastní postřeh.');return true;}
    if(!Object.values(fields).some(value=>value.trim())&&!old&&!elapsedMs){timingDirty=false;return true;}
    const timing=timingDirty?{elapsedMs,observedMinutes:Number((elapsedMs/60000).toFixed(2)),timingIncludesBreaks:true}:{};
    const recordId=old?.id||uid('observation'),stamp=new Date().toISOString();
    const ok=updateStore(s=>{
      const i=s.observations.findLastIndex(o=>o.placeId===context.placeId&&o.discipline===context.discipline);
      const latest=i>=0?s.observations[i]:{id:recordId,placeId:context.placeId,discipline:context.discipline,shape:'',sound:'',gesture:'',text:'',createdAt:stamp};
      const record={...latest,...changed,...timing,updatedAt:stamp};if(i>=0)s.observations[i]=record;else s.observations.push(record);
    });
    context.fields={...context.fields,...changed};observationDirty.clear();timingDirty=false;if(showNotice)savedNotice(ok,'Postřehy uložené soukromě.');return ok;
  }
  root.addEventListener('submit',event=>{const form=event.target.closest('form');if(!form)return;event.preventDefault();if(form.dataset.form==='observation'){saveObservation();return;}if(form.dataset.form==='private'){const data=new FormData(form),name=String(data.get('name')||'').trim(),address=String(data.get('address')||'').trim();if(!name||!address)return;draft.privatePlaces.push({id:uid('private'),name,address,text:String(data.get('text')||'').trim(),createdAt:new Date().toISOString()});savedNotice(persist(),'Soukromý bod uložený bez mapového pinu.');render();}},{signal});
  const pagehide=()=>{clearTimeout(timer);saveObservation(false);persist();stopSpeech();};
  globalThis.addEventListener?.('pagehide',pagehide,{signal});
  globalThis.addEventListener?.('caisik:panel',event=>{const panel=event.detail?.panel??event.detail?.id;if(panel!=='field'){saveObservation(false);persist();stopSpeech();}else refreshFromStore();},{signal});
  const timerInterval=setInterval(()=>{if(!alive||document.hidden||root.hidden)return;const p=selected()[draft.currentIndex],output=root.querySelector('[data-field-visit-time]');if(p&&output)output.textContent=formatVisitTime(sampleVisitTimer(draft.timers[timerKey(p)],now()));const summary=root.querySelector('[data-field-route-time]');if(summary)summary.textContent=`Tvůj rozpočet: ${draft.plannedMinutes} min · zaznamenaný čas zastávek: ${(routeElapsed()/60000).toFixed(1)} min.`;},1000);timerInterval.unref?.();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();},{signal});
  render();
  const unsubscribe=typeof store.subscribe==='function'?store.subscribe(refreshFromStore):()=>{};
  Promise.all([fetch('/locations-data.json',{signal}).then(r=>{if(!r.ok)throw Error('atlas');return r.json();}),fetch('/expeditions/data/expeditions.json',{signal}).then(r=>{if(!r.ok)throw Error('expeditions');return r.json();})]).then(([atlas,expeditions])=>{if(!alive)return;places=normalizePlaces(atlas,expeditions);loaded=true;render();}).catch(e=>{if(!alive||e.name==='AbortError')return;const status=root.querySelector('.field-load-status');if(status)status.textContent='Archiv se nepodařilo načíst. Obnov připojení a stránku. Tvoje trasy zůstávají uložené; detaily veřejných míst vyžadují načtený archiv. Soukromé body jsou dostupné i bez něj.';notify('Místa se nepodařilo načíst. Nevytváříme náhradní fakta.');});
  return ()=>{unsubscribe();clearInterval(timerInterval);clearTimeout(timer);saveObservation(false);persist();alive=false;stopSpeech();abort.abort();for(const url of downloads)URL.revokeObjectURL(url);};
}
