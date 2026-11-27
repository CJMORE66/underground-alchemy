// A three-stop edition. The geographic plate and all three photographs are served locally.
const stops = [
  {
    id: 'le-grand-jeu', name: 'Le Grand Jeu', district: 'Paris XI', chapter: 'Písmeno',
    address: '15 passage de Ménilmontant, 75011 Paris', lat: 48.864871, lon: 2.381967,
    fact: 'V pasáži mezi Oberkampfem a Ménilmontantem sídlí nezávislé knihkupectví. Vybírá publikace o graffiti, fotografii a scénách, které si svou paměť často tisknou samy.',
    access: 'Aktuální otevírání ověř u knihkupectví. Před focením uvnitř se zeptej obsluhy. K pozorování z pasáže ani ke splnění úkolu nepotřebuješ nic kupovat.',
    sources: [['Knihkupectví · místo a kontakt', 'https://www.legrandj.eu/pages/the-bookstore']],
    photo: 'Passage_Ménilmontant_-_Paris_XI_(FR75)_-_2021-06-08_-_1.jpg',
    caption: 'Passage de Ménilmontant, ulice knihkupectví. Archivní pohled z 8. června 2021.', author: 'Chabe01', landscape: true,
    home: 'Přejeď očima po archivním snímku pasáže. Vyber jedinou hranu, která tě vtahuje dovnitř.',
    paris: 'Zůstaň na prahu pasáže. Najdi hranu domu nebo nápisu, která mění rytmus ulice.',
    question: 'Kdybys z celé ulice mohl vytisknout jen jeden tah, podle čeho by ji někdo znovu poznal?',
    task: 'Nakresli vybranou hranu jako kostru svého písmene. Napiš, co jsi při tom musel vynechat.',
    voice: 'Když z ulice uděláš stránku, její šířku určuje místo, které necháš prázdné.',
  }, {
    id: 'mur-oberkampf', name: 'Le M.U.R. Oberkampf', district: 'Paris XI', chapter: 'Paměť',
    address: '107 rue Oberkampf × rue Saint-Maur, 75011 Paris', lat: 48.8659, lon: 2.3777,
    fact: 'Asociace Le M.U.R. zve umělce k dočasným realizacím na panelu na rohu ulic Oberkampf a Saint-Maur. Každé nové dílo tu překryje předchozí.',
    access: 'Panel můžeš pozorovat z ulice. Jde o kurátorskou výstavní plochu. Vlastní zásah do zdi vyžaduje výslovný souhlas organizátora.',
    sources: [['Le M.U.R. · program a asociace', 'https://www.lemur.fr/lasso/'], ['Paris je t’aime · adresa', 'https://parisjetaime.com/transport/le-mur-oberkampf-p2046']],
    photo: 'Place_Angle_Rue_Oberkampf_Rue_Saint_Maur_-_Paris_XI_(FR75)_-_2023-12-16_-_1.jpg',
    caption: 'Výstavní panel v prostoru křižovatky. Archivní pohled z 16. prosince 2023.', author: 'Chabe01', landscape: true,
    home: 'Najdi na archivním snímku přechod mezi obdélníkem výstavní plochy a ulicí.',
    paris: 'Podívej se na dnešní instalaci z protějšího chodníku. Zapiš autora, pokud ho zjistíš na místě.',
    question: 'Která část obrazu by ti zůstala v ruce, i kdyby ho přes noc celý přelepili?',
    task: 'Odlož předlohu a z paměti nakresli vlastní tah. Pojmenuj jednu změnu, kterou udělala paměť.',
    voice: 'Zeď může zítra mluvit cizím hlasem. Tah, který si dnes odneseš v zápěstí, už má tvoje tempo.',
  }, {
    id: 'le-lavomatik', name: 'Le Lavo//Matik', district: 'Paris XIII', chapter: 'Vlastní stopa',
    address: '20 boulevard du Général d’Armée Jean Simon, 75013 Paris', lat: 48.826535, lon: 2.383632,
    fact: 'Le Lavo//Matik spojuje od března 2014 městské umění, galerii a knihkupectví. V programu střídá sólové výstavy a společné Murs Ouverts.',
    access: 'Návštěvu si naplánuj podle aktuálního programu a kontaktu galerie. Podmínky malování na okolních plochách si domluv přímo se správcem.',
    sources: [['Le Lavo//Matik · historie', 'https://lelavomatik.com/about/'], ['Galerie · návštěva a kontakt', 'https://lelavomatik.com/contact/']],
    photo: 'Artiste_ouvrier_-_Paris_13e.jpg',
    caption: 'Streetartista Artiste Ouvrier před Le Lavo//Matik, 23. ledna 2016.', author: 'Chris93', landscape: false,
    home: 'Všimni si na fotografii rozdílu mezi formátem papíru v ruce a stěnou za postavou.',
    paris: 'Vyber v okolí galerie velkou plochu a vlastní list papíru. Z obou se na chvíli stane obálka.',
    question: 'Co se musí stát s tvým písmenem, aby obstálo na hřbetě zinu i přes celou zeď?',
    task: 'Zahusť svůj tah do značky pro obálku. Připiš, kde jsi znak zúžil a kde potřeboval dýchat.',
    voice: 'Sešit se vejde do kapsy. Když ho otevřeš, může se do něj vrátit celá stěna.',
  },
];
const byId = new Map(stops.map(stop => [stop.id, stop]));
const key = 'caisik-zin-v1:';
const failedWrites = new Map();
const artLimit = 250;
const pointLimit = 1800;

function read(keyName) {
  if (failedWrites.has(keyName)) return failedWrites.get(keyName);
  try { return localStorage.getItem(key + keyName); } catch { return null; }
}

function write(keyName, value) {
  try {
    localStorage.setItem(key + keyName, value);
    failedWrites.delete(keyName);
    return true;
  } catch {
    failedWrites.set(keyName, value);
    return false;
  }
}

function safeStrokes(raw) {
  try {
    const strokes = JSON.parse(raw);
    if (!Array.isArray(strokes)) return [];
    return strokes.slice(0, artLimit).filter(stroke => Array.isArray(stroke) && stroke.length > 0 &&
      stroke.length <= pointLimit && stroke.every(point => Array.isArray(point) && point.length === 2 &&
        Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
        point[0] >= 0 && point[0] <= 600 && point[1] >= 0 && point[1] <= 360));
  } catch { return []; }
}

export function readZinPage(id) {
  if (!byId.has(id)) return { note: '', strokes: [] };
  return { note: (read(id + ':note') || '').slice(0, 4000), strokes: safeStrokes(read(id + ':sketch')) };
}

function canonical({id, mode, view, page}) {
  const params = new URLSearchParams({mode, view});
  if (page === 'work') params.set('page', 'work');
  return '#atlas/zin/' + id + '?' + params;
}

function routeState(route) {
  const parts = route?.parts || [];
  if (route?.section !== 'atlas' || parts[0] !== 'zin') return null;
  const params = route.params || new URLSearchParams();
  return {
    id: byId.has(parts[1]) ? parts[1] : stops[0].id,
    mode: (params.get('mode') || read('mode')) === 'paris' ? 'paris' : 'home',
    view: (params.get('view') || read('view')) === 'map' ? 'map' : 'list',
    page: params.get('page') === 'work' ? 'work' : 'document',
  };
}

function currentRoute() {
  if (window.UAEdition?.current) return window.UAEdition.current();
  const [path, query] = location.hash.slice(1).split('?');
  const [section, ...parts] = path.split('/');
  return {section, parts, params: new URLSearchParams(query)};
}

const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const outside = (title, url) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(title)} ↗</a>`;
const sourcePhoto = stop => 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(stop.photo);
const href = (state, changes) => escape(canonical({...state, ...changes}));
function switchLink(state, field, value, title) {
  return `<a href="${href(state,{[field]:value})}" data-zin-${field}="${value}" ${state[field] === value ? 'aria-current="true"' : ''}>${title}</a>`;
}
function point(stop) {
  return [Math.round((stop.lon - 2.311) * 3540), Math.round((48.878 - stop.lat) * 5380)];
}
function mapSheet(state) {
  const points = stops.map(point);
  const shifts = [[39,-19],[-42,-13],[33,-21]];
  const dots = stops.map((stop, i) => {
    const [x,y] = points[i], [dx,dy] = shifts[i];
    return `<a href="${href(state,{id:stop.id,page:'document'})}" aria-label="${i + 1}. ${stop.name}" data-zmap-stop="${stop.id}" ${state.id === stop.id ? 'aria-current="location"' : ''}><path d="M${x} ${y}l${dx} ${dy}"/><circle class="z-pin" cx="${x}" cy="${y}" r="3"/><circle class="z-index" cx="${x+dx}" cy="${y+dy}" r="15"/><text x="${x+dx}" y="${y+dy+4}" text-anchor="middle">${i+1}</text></a>`;
  }).join('');
  return `<div class="z-map"><svg viewBox="0 0 480 320" role="group" aria-label="Tři orientační zastávky ve východní Paříži">
  <image href="/assets/paris-zin/east-paris.svg" width="480" height="320"/><polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ffd600" stroke-width="1.8" stroke-dasharray="4 4"/>${dots}
  <text x="456" y="23" text-anchor="end" fill="#fff" font-size="11">N ↑</text></svg>
  <p>Spojnice označuje pořadí zastávek. Hranice obvodů © ${outside('Ville de Paris','https://opendata.paris.fr/explore/dataset/arrondissements/')} · ${outside('ODbL','https://opendatacommons.org/licenses/odbl/1-0/')}.</p></div>`;
}

function stopMenu(state) {
  return stops.map((stop, i) => `<a href="${href(state,{id:stop.id,page:'document'})}" data-zin-stop="${stop.id}" ${state.id === stop.id ? 'aria-current="location"' : ''}><span>0${i+1}</span>${stop.name}</a>`).join('');
}

function markup(state) {
  const stop = byId.get(state.id), n = stops.indexOf(stop);
  const from = encodeURIComponent(canonical(state)), saved = readZinPage(stop.id);
  const next = stops[n+1], previous=stops[n-1];
  return `<header class="z-head">
  <div class="z-running"><a href="#atlas/places">Atlas Paříže</a><span>Terénní vydání / Writer</span></div>
  <h2>Písmeno <i>/</i> Paměť <i>/</i> Vlastní stopa</h2>
  <nav class="z-switch" aria-label="Způsob procházení">${switchLink(state,'mode','paris','Projít v Paříži')+switchLink(state,'mode','home','Prolistovat doma')}</nav></header>
  <div class="z-itinerary" id="zin-route"><div class="z-route-label"><h3>Trasa</h3><nav class="z-switch" aria-label="Zobrazení trasy">${switchLink(state,'view','list','Seznam')+switchLink(state,'view','map','Mapa')}</nav></div>
  ${state.view === 'map' ? mapSheet(state) : ''}
  <nav class="z-stops" aria-label="Zastávky zinu">${stopMenu(state)}</nav></div>
  <div class="z-paper-tools"><nav class="z-switch z-leaf-tabs" aria-label="List dvojstrany">${switchLink(state,'page','document','Místo')+switchLink(state,'page','work','Moje stránka')}</nav><a href="${href(state,{view:'list',page:'document'})}" data-zin-back>Zpět na stopu ↑</a></div>
  <article class="z-spread" data-leaf="${state.page}">
    <section class="z-document" aria-label="Dokumentární strana">
      <div class="z-page-meta"><span>0${n+1} / ${escape(stop.chapter)}</span><span>${stop.district}</span></div>
      <h3>${stop.name}</h3><p class="z-address">${escape(stop.address)}</p>
      <figure class="z-photo"><img src="/assets/paris-zin/${stop.id}.webp" width="${stop.landscape?1000:675}" height="${stop.landscape?750:900}" alt="${escape(stop.caption)}" decoding="async">
      <figcaption>${escape(stop.caption)}<small>${outside(stop.author+' · Wikimedia Commons',sourcePhoto(stop))} · ${outside('CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/')} · zmenšeno do WebP</small></figcaption></figure>
      <p class="z-fact">${stop.fact}</p>
      <details class="z-sources"><summary>Přístup a ověřené zdroje</summary><p>${stop.access}</p><ul>${stop.sources.map(([title,url])=>'<li>'+outside(title,url)+'</li>').join('')}</ul><small>Ověřeno 27. 11. 2026.</small></details>
      ${state.mode === 'paris' ? `<a class="z-map-out" href="https://www.openstreetmap.org/?mlat=${stop.lat}&amp;mlon=${stop.lon}#map=18/${stop.lat}/${stop.lon}" target="_blank" rel="noopener noreferrer">Otevřít okolí v OpenStreetMap ↗</a>` : ''}
      <a class="z-to-work" data-zin-page="work" href="${href(state,{page:'work'})}">Otočit na vlastní stránku →</a>
    </section>
    <section class="z-work" aria-label="Moje strana zinu">
      <div class="z-page-meta"><span>Strana pro vlastní stopu</span><span>0${n+1} B</span></div><h3>${stop.question}</h3>
      <p>${state.mode==='paris'?stop.paris:stop.home} ${stop.task}</p>
      <div class="z-pad-top"><label id="zin-pad-label">Moje skica</label><button type="button" data-zin-undo>Vrátit poslední tah</button></div>
      <svg class="z-pad" data-zin-pad viewBox="0 0 600 360" tabindex="0" role="group" aria-labelledby="zin-pad-label" aria-describedby="zin-pad-help"><path class="z-guides" d="M0 90h600M0 180h600M0 270h600M150 0v360M300 0v360M450 0v360" aria-hidden="true"/><g data-zin-strokes></g><path data-zin-live class="z-ink" d=""/><circle data-zin-cursor class="z-cursor" cx="300" cy="180" r="7"/></svg>
      <details class="z-pad-help"><summary>Jak kreslit</summary><p id="zin-pad-help">Kresli prstem, perem nebo myší. Na klávesnici posuň bod šipkami. Mezerníkem začni tah, šipkami kresli a Enterem ho ulož.</p></details>
      <label for="zin-note">Co si odneseš?</label><textarea data-zin-note id="zin-note" maxlength="4000" rows="3" placeholder="Jeden detail, který by z fotky nešel vyčíst…"></textarea>
      <p class="z-status" data-zin-status role="status">${saved.note||saved.strokes.length?'Tvoje stopa je v Mém Blackbooku.':'Skica i zápis se průběžně ukládají jen v tomto prohlížeči.'}</p>
      <blockquote><p>${stop.voice}</p><cite>CAISIK / autorské čtení</cite></blockquote>
    </section>
  </article>
  <nav class="z-action-row" aria-label="Pokračovat ze zastávky"><a data-zin-detour href="#story/writer/poster?from=${from}">Za kurýrem <small>Herní fikce ↗</small></a><a data-zin-workshop href="#workshop/frequency?from=${from}&amp;place=${stop.id}">Vzít podnět do dílny <small>Frequency ↗</small></a><a href="#blackbook/zin${saved.note||saved.strokes.length?'/'+stop.id:''}" data-zin-blackbook>Můj Blackbook <small>Moje tvorba ↗</small></a></nav>
  <nav class="z-pagination" aria-label="Listování zastávkami">${previous?`<a href="${href(state,{id:previous.id,page:'document'})}">← ${previous.name}</a>`:'<span></span>'}${next?`<a href="${href(state,{id:next.id,page:'document'})}">${next.name} →</a>`:'<a href="#blackbook/zin">Otevřít moje vydání →</a>'}</nav>`;
}

function strokePath(stroke) {
  if (!stroke.length) return '';
  return 'M'+stroke.map(p=>p.join(' ')).join('L')+(stroke.length===1?'l.01 0':'');
}

function bindPage(host, state) {
  const get = sel => host.querySelector(sel);
  const note=get('[data-zin-note]'), pad=get('[data-zin-pad]'), lines=get('[data-zin-strokes]');
  const live=get('[data-zin-live]'), status=get('[data-zin-status]'), undo=get('[data-zin-undo]');
  note.value=readZinPage(state.id).note;
  const cursor=get('[data-zin-cursor]');
  let draft = null, pointer = null, keyboard = [300,180];
  function draw() {
    const strokes=readZinPage(state.id).strokes;
    lines.innerHTML=strokes.map(stroke=>'<path class="z-ink" d="'+strokePath(stroke)+'"/>').join('');
    undo.disabled=!strokes.length;
  }
  function save(kind, value) {
    const persisted=write(state.id+':'+kind,value);
    const personal=readZinPage(state.id);
    get('[data-zin-blackbook]').setAttribute('href','#blackbook/zin'+(personal.note || personal.strokes.length ? '/'+state.id : ''));
    status.textContent=persisted?'Uloženo v tomto prohlížeči. Najdeš v Mém Blackbooku.':'Tento prohlížeč odmítl uložení. Stopa je dostupná jen v otevřené kartě.';
    window.dispatchEvent(new CustomEvent('ua:zin-change',{detail:{stopId:state.id}}));
  }
  function finish(commit=true) {
    if (!draft) return;
    const fresh=readZinPage(state.id).strokes;
    if (commit && fresh.length<artLimit) save('sketch',JSON.stringify([...fresh,draft]));
    else if (commit) status.textContent='List už má 250 tahů. Pro další tah vrať některý z posledních.';
    draft=null;pointer=null;live.setAttribute('d','');draw();
  }
  function xy(event) {
    const rect=pad.getBoundingClientRect();
    return [Math.round(Math.max(0,Math.min(600,(event.clientX-rect.left)/Math.max(rect.width,1)*600))),Math.round(Math.max(0,Math.min(360,(event.clientY-rect.top)/Math.max(rect.height,1)*360)))];
  }
  function extend(point) {
    if (draft.length>=pointLimit || (draft.at(-1)?.[0]===point[0] && draft.at(-1)?.[1]===point[1])) return;
    draft.push(point);live.setAttribute('d',strokePath(draft));
  }
  pad.addEventListener('pointerdown',event=>{
    if(draft || event.button!==0 || event.isPrimary===false) return;
    event.preventDefault();pointer=event.pointerId;draft=[];extend(xy(event));pad.setPointerCapture?.(pointer);
  });
  pad.addEventListener('pointermove',event=>{if(draft && pointer===event.pointerId) extend(xy(event));});
  pad.addEventListener('pointerup',event=>{if(draft && pointer===event.pointerId){extend(xy(event));finish();}});
  pad.addEventListener('pointercancel',event=>{if(pointer===event.pointerId) finish();});
  pad.addEventListener('lostpointercapture',event=>{if(pointer===event.pointerId) finish();});
  pad.addEventListener('keydown',event=>{
    if(pointer!==null) return;
    const amount=event.shiftKey?25:7;
    const delta={ArrowLeft:[-amount,0],ArrowRight:[amount,0],ArrowUp:[0,-amount],ArrowDown:[0,amount]}[event.key];
    if(delta) {
      event.preventDefault();keyboard=[Math.max(0,Math.min(600,keyboard[0]+delta[0])),Math.max(0,Math.min(360,keyboard[1]+delta[1]))];
      cursor.setAttribute('cx',keyboard[0]);cursor.setAttribute('cy',keyboard[1]);if(draft) extend(keyboard);
    } else if(event.key===' ' || event.key==='Enter') {
      event.preventDefault();if(draft) finish();else if(event.key===' '){draft=[];extend(keyboard);}
    } else if(event.key==='Escape') {finish(false);}
  });
  pad.addEventListener('blur',()=>{if(pointer===null) finish();});
  undo.addEventListener('click',()=>{const strokes=readZinPage(state.id).strokes;if(strokes.length){save('sketch',JSON.stringify(strokes.slice(0,-1)));draw();}});
  note.addEventListener('input',()=>save('note',note.value));
  get('[data-zin-back]').addEventListener('click',()=>requestAnimationFrame(()=>{
    const first=host.querySelector('.z-stops a[aria-current]');first?.focus({preventScroll:true});first?.scrollIntoView?.({block:'center'});
  }));
  draw();
  return {finish,refresh(kind){
    if(kind==='sketch' && !draft)draw();
    if(kind==='note' && document.activeElement!==note)note.value=readZinPage(state.id).note;
  }};
}

const host=typeof document==='undefined'?null:document.getElementById('paris-zin');
if(host) {
  let active=null, page=null;
  const display=route=>{
    const state=routeState(route);
    if(!state){page?.finish();active=null;page=null;return;}
    if(active && canonical(active)===canonical(state)) return;
    const focusId=host.contains(document.activeElement)?document.activeElement.closest('a')?.getAttribute('href'):null;
    page?.finish();
    active=state;
    write('mode',state.mode);write('view',state.view);
    host.innerHTML=markup(state);
    page=bindPage(host,state);
    if(focusId) Array.from(host.querySelectorAll('a[href]')).find(a=>a.getAttribute('href')===focusId)?.focus({preventScroll:true});
  };
  window.addEventListener('ua:route',event=>display(event.detail));
  window.addEventListener('hashchange',()=>display(currentRoute()));
  window.addEventListener('storage',event=>{
    if(!active || !page) return;
    if(event.key===null || event.key===key+active.id+':note')page.refresh('note');
    if(event.key===null || event.key===key+active.id+':sketch')page.refresh('sketch');
  });
  window.addEventListener('pagehide',()=>page?.finish());
  display(currentRoute());
}
