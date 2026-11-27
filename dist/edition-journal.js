// The book is a read-only view of the original records. It does not maintain a second save game.
import {readImprint, imprintEvent} from './needle-imprint-store.js?v=1';
import {readRevizor, revizorEvent} from './revizor-store.js?v=1';
import {readWriterRepair, writerRepairEvent} from './writer-repair-store.js?v=1';
import {readCornerNote, cornerReadings, cornerNoteEvent} from './corner-note-store.js?v=1';
import {readShadowRoutine, shadowMoveLabels, shadowRoutineEvent} from './shadow-quest-store.js?v=1';
import {renderSketch} from './play/journal.js';
import {readZinPage} from './paris-zin.js';

const groups = {
  story: 'Okno II a stopy', zin: 'Terénní vydání', workshop: 'Dílna',
  principles: 'Sedm principů', atlas: 'Atlas', expeditions: 'Expedice'
};
const stops = {'le-grand-jeu':'Le Grand Jeu', 'mur-oberkampf':'Le M.U.R. Oberkampf', 'le-lavomatik':'Lavo//Matik'};
const lessons = {mentalism:'Mentalismus', correspondence:'Korespondence', vibration:'Vibrace', polarity:'Polarita', rhythm:'Rytmus', 'cause-effect':'Příčina a následek', gender:'Tvoření'};
const disciplines = {dj:'DJ', mc:'MC', writer:'Writer', breaking:'Breaking', knowledge:'Knowledge', cross:'Napříč dílnami', custom:'Vlastní tvorba'};
const expeditionFields = {work:'Moje práce', revision:'Revize', decision:'Moje rozhodnutí', feedback:'Zpětná vazba', nextStep:'Další krok', tracklist:'Tracklist', palette:'Paleta', symbol:'Symbol'};
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const list = value => Array.isArray(value) ? value : [];
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const str = value => typeof value === 'string' ? value.trim() : '';
const field = (label, value) => str(value) ? '<h3>' + escape(label) + '</h3><p class="book-user" dir="auto">' + escape(value) + '</p>' : '';
const anchor = (label, href) => '<a href="' + escape(href) + '">' + escape(label) + '</a>';
const pageUrl = page => '#blackbook/' + page.group + '/' + encodeURIComponent(page.id);
const slug = key => /^[a-z0-9-]+$/i.test(key);
const humanize = value => str(value).replace(/[-_]/g,' ');
function local(key) { try { return localStorage.getItem(key); } catch { return null; } }
function stored(key, fallback = {}) {
  if (window.UAAtlasRead && (key.startsWith('atlas-') || key.startsWith('caisik-frequency-'))) return window.UAAtlasRead(key, fallback);
  try { return JSON.parse(local(key)) ?? fallback; } catch { return fallback; }
}
function placeLabel(id, type = 'place') {
  return window.UAAtlasLabel?.(type, id) || stops[id] || humanize(id);
}
function routeUrl(params) {
  const search = new URLSearchParams(params);
  return '#workshop/frequency' + (search.size ? '?' + search : '');
}
function sketch(strokes, width, height) {
  return renderSketch(list(strokes).map(points => ({points, color:'#FFD600', width:3})), {width,height});
}
function rhythm(steps) {
  const hits = steps.flatMap((hit, i) => hit ? [i + 1] : []);
  return '<div class="book-grid-beat" role="img" aria-label="Údery: ' + hits.join(', ') + '">'
    + steps.map((hit, i) => '<span' + (hit ? ' class="hit"' : '') + '>' + (i + 1) + '</span>').join('') + '</div>';
}

function storyPages() {
  const pages = [];
  const add = (id,title,preview,body,source,action,href,seal) => pages.push({group:'story',id,title,preview,body,source,action,href,seal});
  const imprint = readImprint();
  if (imprint) add('needle','Můj takt v okně II', imprint.returned ? 'Okno odpovídá tvým vzorem.' : 'Takt čeká na dvoře.',
    () => rhythm(imprint.steps), 'Jehla přeskočila / dvůr', imprint.returned ? 'Přehrát v okně II' : 'Vrátit rytmus do okna II',
    imprint.returned ? '#story/needle/window' : '#story/needle/return', imprint.returned ? 'Okno odpovědělo' : 'Rytmus uložen');
  const mix = stored('caisik-metro-dj-v1', null);
  if (Array.isArray(mix?.steps) && mix.steps.length === 8 && mix.steps.every(s => typeof s === 'boolean') && mix.steps.some(Boolean))
    add('dj','Swing pod nástupištěm','Můj rytmus v odpovědi metra.',() => rhythm(mix.steps),'Vedlejší stopa / DJ','Vrátit se k mixu','#story/dj/mix','DJ převzal takt');
  const verse = readRevizor();
  if (verse) add('mc','Dvě zakončení pro revizora',verse.endings[1],() => verse.endings.map((line,i) => field('Zakončení ' + (i + 1),line)).join('') + anchor('Přečíst u revizora','#story/mc/verse'),'Vedlejší stopa / MC','Najít moji repliku u DJ','#story/dj/mix','Sloka orazítkována');
  const repair = readWriterRepair();
  if (repair) add('writer','Můj tah na TRANSMUTE',repair.kind === 'drawn' ? 'Ručně kreslená linka.' : 'Moje volba z předkreslených tahů.',
    () => sketch([repair.points],100,100) + anchor('Vrátit se k opravě plakátu','#story/writer/repair'),
    'Vedlejší stopa / Writer','Najít tah na Living Wall','#atlas/gallery','Tah na plakátu');
  const routine = readShadowRoutine();
  if (routine) {
    const moves = routine.moves.map(move => shadowMoveLabels.cs[move]);
    add('breaking','Sestava pro stín',moves.join(' → '),() => '<ol class="book-moves">' + moves.map(move => '<li>' + escape(move) + '</li>').join('') + '</ol>',
      'Vedlejší stopa / Breaking','Vrátit se pod lampu','#story/breaking/routine','Sestava zapsána');
  }
  const corner = readCornerNote();
  if (corner) {
    const reading = cornerReadings.cs[corner.reading];
    add('knowledge',reading.title,reading.body,() => field('Mnou zvolená interpretace',reading.body),
      'Vedlejší stopa / Knowledge','Znovu porovnat svědectví','#story/knowledge/reading','Tři svědectví');
  }
  return pages;
}

function zinPages() {
  const pages = [];
  const mode = local('caisik-zin-v1:mode') === 'paris' ? 'paris' : 'home';
  const view = local('caisik-zin-v1:view') === 'map' ? 'map' : 'list';
  for (const [id, name] of Object.entries(stops)) {
    const {note,strokes} = readZinPage(id);
    if (!str(note) && !list(strokes).length) continue;
    pages.push({group:'zin', id, title:name, source:'Písmeno / Paměť / Vlastní stopa', preview:str(note) || 'Moje skica zastávky.',
      body:() => field('Můj zápis',note) + (strokes.length ? sketch(strokes,600,360) : ''),
      seal:'Vlastní list', action:'Zpět na zastávku', href:'#atlas/zin/' + id + '?mode=' + mode + '&view=' + view + '&page=work'});
  }
  return pages;
}

function atlasPages() {
  const pages = [];
  for (const [id, note] of Object.entries(record(stored('atlas-observations')))) {
    if (slug(id) && str(note)) pages.push({group:'atlas',id,title:placeLabel(id),preview:note,source:'Atlas Paříže / pozorování',
      body:() => field('Můj postřeh',note),seal:'Pozorování',action:'Otevřít místo',href:'#atlas/places/' + id});
  }
  for (const [id, note] of Object.entries(record(stored('atlas-principle-notes')))) {
    if (Object.hasOwn(lessons,id) && str(note?.text)) pages.push({group:'principles',id,title:lessons[id],preview:note.text,source:'Sedm principů / vlastní cvičení',
      body:() => field('Moje pozorování',note.text),seal:note.unlocked ? 'Hlubší otázka' : '',action:'Vrátit se ke cvičení',href:'#atlas/principles/' + id});
  }
  for (const [key, route, kind, description] of [['atlas-saved-places','places','place','Uložené místo'],['atlas-saved-routes','routes','route','Uložená trasa']]) {
    for (const id of list(stored(key,[]))) {
      if (typeof id !== 'string' || !slug(id)) continue;
      pages.push({group:'atlas',id:'bookmark-' + kind + '-' + id,title:placeLabel(id,kind),preview:description,source:'Atlas Paříže / moje záložky',
        body:() => '<p>' + description + ' pro další návštěvu.</p>',action:'Otevřít v atlasu',href:'#atlas/' + route + '/' + id});
    }
  }
  return pages;
}

function frequencyPages() {
  const pages = [];
  const contexts = [...new Set(['',...list(stored('caisik-frequency-contexts-v1',[])).filter(ctx => typeof ctx === 'string' && ctx.length < 1000 && ctx)])];
  for (const context of contexts) {
    const draft = record(stored(context ? 'caisik-frequency-v1:' + context : 'atlas-frequency-draft'));
    if (!str(draft.draft) && !str(draft.words)) continue;
    const params = {};
    if (context) for (const key of ['from','place','prompt','subject']) if (str(draft[key])) params[key] = draft[key];
    const title = draft.place ? 'Frequency / ' + placeLabel(draft.place) : 'Frequency / ' + (str(draft.prompt).slice(0,72) || str(draft.draft).split('\n')[0].slice(0,72) || 'Řetěz slov');
    pages.push({group:'workshop',id:context ? 'frequency-' + context : 'frequency',title,preview:str(draft.draft) || draft.words,
      body:() => field('Řetěz slov',draft.words) + field('Moje řádky',draft.draft),source:'Frequency / lokální rozepsaný text',
      action:'Pokračovat v psaní',href:routeUrl(params)});
  }
  return pages;
}

function versionList(versions) {
  return versions.map((version, index) => '<details class="book-version"' + (index === versions.length - 1 ? ' open' : '') + '><summary>Verze ' + (index + 1) + '</summary>'
    + renderSketch(version.strokes) + field('Moje práce',version.text) + field('Rozhodnutí',version.decision) + field('Další krok',version.nextStep) + '</details>').join('');
}
function selfmadePages() {
  const state = record(stored('caisik-selfmade-v1'));
  const pages = [];
  for (const a of list(state.artifacts)) {
    const versions = list(a?.versions).filter(v => v && typeof v === 'object');
    if (!str(a?.id) || !versions.length) continue;
    const latest = versions.at(-1);
    pages.push({group:'workshop',id:'selfmade-' + a.id,title:str(a.title) || 'Dílo SELFMADE',preview:str(latest.text) || str(latest.decision) || 'Vlastní uložená verze.',
      body:() => versionList(versions),source:'SELFMADE / ' + (disciplines[a.discipline] || 'Dílna'),seal:'Verze ' + versions.length,action:'Otevřít procesní deník',href:'/play/#journal'});
  }
  for (const o of list(state.observations)) {
    const fields = {shape:'Tvar', sound:'Zvuk', gesture:'Gesto', text:'Můj zápis'};
    const first = Object.keys(fields).map(key => str(o?.[key])).find(Boolean);
    if (!str(o?.id) || !first) continue;
    pages.push({group:'atlas',id:'field-' + o.id,title:placeLabel(o.placeId) || 'Terénní zápis',preview:first,source:'SELFMADE / terén',
      body:() => Object.entries(fields).map(([key,label]) => field(label,o[key])).join(''),seal:'Terénní zápis',action:'Otevřít můj terén',href:'/play/#field'});
  }
  return pages;
}
function expeditionPages() {
  const {notes} = record(stored('caisik-expeditions-v1'));
  return Object.entries(record(notes)).flatMap(([id,note]) => {
    const fields = Object.entries(expeditionFields).filter(([key]) => str(note?.[key]));
    if (!Object.hasOwn(disciplines,id) || !fields.length) return [];
    return [{group:'expeditions',id,title:'Expedice / ' + disciplines[id],source:'Vedená výprava / vlastní zápis',preview:note[fields[0][0]],
      body:() => fields.map(([key,label]) => field(label,note[key])).join(''),seal:str(note.revision) ? 'Vlastní revize' : 'Zápis z výpravy',
      action:'Pokračovat v expedici',href:'/expeditions/' + encodeURIComponent(id) + '/#blackbook'}];
  });
}

export function collectBookPages() {
  return [...storyPages(),...zinPages(),...frequencyPages(),...atlasPages(),...selfmadePages(),...expeditionPages()];
}

const host = document.querySelector('[data-edition-journal]');
if (host) {
  let currentRoute;
  let query = '', limit = 24, currentPages = [];
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');
  const stamp = page => page.seal ? '<span class="book-stamp">' + escape(page.seal) + '</span>' : '';
  function detail(page) {
    return '<article class="book-sheet"><div class="book-sheet-head"><p class="book-source">' + escape(page.source) + '</p>' + stamp(page)
      + '</div><h2>' + escape(page.title) + '</h2><div class="book-content">' + page.body() + '</div><div class="book-actions">'
      + anchor(page.action + ' →',page.href) + anchor('Zpět na přehled','#blackbook/' + page.group) + '</div></article>';
  }
  function pageGrid(pages, group) {
    const term = normalize(query.trim());
    const matches = pages.filter(p => (!group || p.group === group) && normalize([p.title,p.preview,p.source].join(' ')).includes(term));
    return '<div class="book-pages">' + matches.slice(0,limit).map(page =>
      '<a class="book-card" href="' + escape(pageUrl(page)) + '"><span class="book-source">' + escape(page.source) + '</span><strong>'
      + escape(page.title) + '</strong><span class="book-excerpt" dir="auto">' + escape(str(page.preview).slice(0,170))
      + '</span>' + stamp(page) + '</a>').join('') + '</div>' + (matches.length > limit ? '<button type="button" data-book-more>Další stránky (' + (matches.length-limit) + ')</button>' : '')
      + (!matches.length ? '<p class="book-empty">Pro tento výběr tu zatím žádná stránka není.</p>' : '');
  }
  function render() {
    if (currentRoute?.section !== 'blackbook') return;
    const pages = collectBookPages(), [group,encodedId] = currentRoute.parts;
    currentPages = pages;
    let id = encodedId;
    try { if (encodedId) id = decodeURIComponent(encodedId); } catch { /* Show the missing-page message. */ }
    const page = pages.find(item => item.group === group && item.id === id);
    const filters = [['','Vše'],...Object.entries(groups).filter(([key]) => pages.some(p => p.group === key) || group === key)];
    host.setAttribute('data-i18n','off');
    host.innerHTML = '<div class="book-title"><h1>Můj Blackbook</h1><p>Co nezachytíš, to si beton vezme zpátky.</p></div>'
      + (id ? (page ? detail(page) : '<div class="book-empty"><p>Tahle stránka v tomto prohlížeči chybí.</p>' + anchor('Otevřít moje stránky','#blackbook') + '</div>') : pages.length ?
        '<nav class="book-tabs" aria-label="Druh osobní tvorby">' + filters.map(([key,label]) => '<a href="#blackbook' + (key ? '/' + key : '') + '"' + (key === (group || '') ? ' aria-current="page"' : '') + '>' + escape(label) + '</a>').join('')
        + '</nav><label class="book-search">Najít stránku<input type="search" data-book-search value="' + escape(query) + '" placeholder="Místo, řádek nebo dílo"></label>'
        + '<div data-book-results>' + pageGrid(pages,group) + '</div>' :
        '<div class="book-first"><h2>První prázdný list.</h2><p>Slož osm kroků pro okno II, načrtni tah nad pařížskou zdí nebo napiš první čtyři bary. Každá práce tu dostane vlastní stránku.</p><div class="book-actions">'
        + anchor('Rozehrát okno II →','#story/continue') + anchor('Otevřít pařížský zin','#atlas/zin/le-grand-jeu') + anchor('Napsat čtyři bary','#workshop/frequency') + '</div></div>')
      + '<details class="book-backup"><summary>Moje vydání a původní zápisníky</summary><p>Vydání obsahuje zde dostupné texty a kresby. Zvukové záběry si stahuješ přímo ve Frequency.</p>'
      + (pages.length ? '<button type="button" data-book-edition>Stáhnout moje vydání (.html)</button>' : '')
      + '<button type="button" data-book-notes>Zápisník atlasu a export JSON</button>' + anchor('Procesní deník SELFMADE','/play/#journal')
      + anchor('Zápisník expedic','/expeditions/#blackbook') + '</details>';
  }
  host.addEventListener('input', event => {
    if (!event.target.matches('[data-book-search]')) return;
    query = event.target.value; limit = 24;
    host.querySelector('[data-book-results]').innerHTML = pageGrid(currentPages,currentRoute.parts[0]);
  });
  host.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-book-notes')) window.dispatchEvent(new Event('ua:field-notes'));
    if (button.hasAttribute('data-book-more')) {
      limit += 24;
      const grid = host.querySelector('[data-book-results]'), previous = grid.querySelectorAll('.book-card').length;
      grid.innerHTML = pageGrid(currentPages,currentRoute.parts[0]); grid.querySelectorAll('.book-card')[previous]?.focus();
    }
    if (button.hasAttribute('data-book-edition')) {
      const pages = collectBookPages();
      const contents = pages.map(page => '<article><p>' + escape(page.source) + '</p><h2>' + escape(page.title) + '</h2>' + stamp(page) + page.body() + '</article>').join('');
      const template = document.createElement('template');
      template.innerHTML = contents;
      for (const link of template.content.querySelectorAll('a')) link.remove();
      const html = '<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;"><title>Můj Blackbook · CAISIK</title><style>body{background:#10100e;color:#f8f5e9;font:17px/1.5 system-ui;max-width:700px;margin:auto;padding:24px}h1,h2,.book-stamp{color:#ffd600}article{border-top:1px solid #817843;padding:22px 0}p{white-space:pre-wrap;overflow-wrap:anywhere}svg{display:block;width:100%;max-height:420px}.book-grid-beat{display:flex;gap:5px}.book-grid-beat span{border:1px solid;padding:.3em}.hit{background:#ffd600;color:black}</style><h1>Můj Blackbook</h1>' + template.innerHTML + '</html>';
      const url = URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
      const link = document.createElement('a'); link.href = url; link.download = 'CAISIK-Muj-Blackbook.html';
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),60_000);
    }
  });
  function onRoute(route) {
    if (!route) return;
    if (!currentRoute || currentRoute.section !== route.section || currentRoute.parts.join('/') !== route.parts.join('/')) { query = ''; limit = 24; }
    currentRoute = route.section === 'blackbook' && route.parts[0] === 'works'
      ? {...route, parts:route.parts.slice(1)} : route;
    render();
  }
  window.addEventListener('ua:route', e => onRoute(e.detail));
  for (const type of [imprintEvent,revizorEvent,writerRepairEvent,shadowRoutineEvent,cornerNoteEvent,'ua:zin-change','storage','pageshow']) window.addEventListener(type, render);
  onRoute(window.UAEdition?.current?.());
}
