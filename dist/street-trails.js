import { imprintEvent, imprintKey, readImprint } from './needle-imprint-store.js?v=1';
import { readRevizor, revizorEvent, revizorKey } from './revizor-store.js?v=1';
import { readWriterRepair, writerRepairEvent, writerRepairKey } from './writer-repair-store.js?v=1';
import { readShadowRoutine, shadowRoutineEvent, shadowRoutineKey } from './shadow-quest-store.js?v=1';
import { cornerNoteEvent, cornerNoteKey, readCornerProgress } from './corner-note-store.js?v=1';

const board = document.querySelector('[data-street-trails]');
const heading = board.querySelector('[data-trails-title]');
const continueButton = board.querySelector('[data-trails-continue]');
const count = board.querySelector('[data-trails-count]');
const entry = document.querySelector('[data-trails-entry]');
const backLinks = [...document.querySelectorAll('[data-trails-back]')];
const labels = [...board.querySelectorAll('[data-trails-line]')];
const visitsKey = 'caisik-street-trails-v1';
const metroKey = 'caisik-metro-dj-v1';
const cards = new Map([...board.querySelectorAll('[data-trail-card]')].map(card => [card.dataset.trailCard, card]));
const definitions = {
  dj: ['[data-metro-open]', '[data-metro-platform]', '[data-metro-platform-title]'],
  mc: ['[data-revizor-open]', '[data-revizor-panel]', '[data-revizor-title]'],
  writer: ['[data-writer-open]', '[data-writer-panel]', '[data-writer-stage]:not([hidden]) [data-writer-step-title]'],
  breaking: ['[data-shadow-open]', '[data-shadow-panel]', '[data-shadow-title]'],
  knowledge: ['[data-corner-open]', '[data-corner-panel]', '[data-corner-title]'],
};
const destinations = new Map(Object.entries(definitions).map(([id, [open, panel, title]]) => [id, {
  opener: document.querySelector(open),
  panel: document.querySelector(panel),
  title,
}]));

const words = {
  cs: {
    title: 'Vedlejší stopy', intro: 'Okno II už hraje tvůj rytmus. Vyber, kam se teď vydáš.',
    entry: 'Přehled vedlejších stop', back: 'Zpátky na přehled stop',
    ready: 'K otevření', seen: 'Navštíveno', active: 'Rozpracováno', done: 'Dokončeno', locked: 'Zamčeno',
    open: 'Otevřít', resume: 'Pokračovat', revisit: 'Otevřít znovu',
    next: title => 'Pokračovat ve stopě „' + title + '“',
    count: (done, total) => 'Dokončeno ' + done + '/' + total,
    details: (seen, total) => 'Prohlédnuté detaily ' + seen + '/' + total + '.',
    mcLocked: 'Revizor se objeví po vyřešení úkolu Poslední metro má swing.',
    dj: ['Poslední metro má swing', 'Vrať se pod mříž a zopakuj rytmus, který vyťukaly dveře.'],
    mc: ['Revizor chce šestnáctku', 'Dopiš dvě zakončení. Jedním z nich pak DJ přeruší ulici.'],
    writer: ['Šipka, co zdrhla z piece', 'Doplň tah na TRANSMUTE a potkej svůj znak na Living Wall.'],
    breaking: ['Souboj se stínem', 'Seřaď tři pohyby. Stín je zatančí, zatímco se tanečník pere s tkaničkou.'],
    knowledge: ['Stejný roh, tři verze', 'Porovnej tři detaily události u okna II a poznamenej si svůj výklad.'],
  },
  en: {
    title: 'Side trails', intro: 'Window II is playing your rhythm. Choose where to go next.',
    entry: 'See the side trails', back: 'Back to the side trails',
    ready: 'Available', seen: 'Visited', active: 'In progress', done: 'Completed', locked: 'Locked',
    open: 'Open', resume: 'Continue', revisit: 'Open again',
    next: title => 'Continue “' + title + '”',
    count: (done, total) => 'Completed ' + done + '/' + total,
    details: (seen, total) => 'Details examined ' + seen + '/' + total + '.',
    mcLocked: 'The inspector appears after you complete The last train swings.',
    dj: ['The last train swings', 'Return below the grate and repeat the rhythm the doors tapped out.'],
    mc: ['The inspector wants sixteen bars', 'Finish two lines. The DJ will interrupt the street with one of them.'],
    writer: ['The arrow that slipped off the piece', 'Finish the stroke on TRANSMUTE and find it again on the Living Wall.'],
    breaking: ['Shadow Battle', 'Put three moves in order. The shadow dances them while the dancer fights with a shoelace.'],
    knowledge: ['Same corner, three stories', 'Compare three details from window II and write down your reading.'],
  },
  fr: {
    title: 'Pistes secondaires', intro: 'La fenêtre II joue ton rythme. Choisis où aller ensuite.',
    entry: 'Voir les pistes secondaires', back: 'Retour aux pistes secondaires',
    ready: 'Disponible', seen: 'Visitée', active: 'En cours', done: 'Terminée', locked: 'Verrouillée',
    open: 'Ouvrir', resume: 'Continuer', revisit: 'Rouvrir',
    next: title => 'Continuer « ' + title + ' »',
    count: (done, total) => 'Terminées ' + done + '/' + total,
    details: (seen, total) => 'Détails examinés ' + seen + '/' + total + '.',
    mcLocked: 'Le contrôleur apparaît après la quête Le dernier métro a du swing.',
    dj: ['Le dernier métro a du swing', 'Repasse sous la grille et rejoue le rythme frappé par les portes.'],
    mc: ['Le contrôleur veut seize mesures', 'Complète deux fins de vers. Le DJ en fera résonner une dans la rue.'],
    writer: ['La flèche qui a filé du graffiti', 'Complète le trait sur TRANSMUTE et retrouve-le sur le Living Wall.'],
    breaking: ['Duel avec l’ombre', 'Ordonne trois mouvements. L’ombre les danse pendant que le danseur s’occupe de son lacet.'],
    knowledge: ['Même coin, trois versions', 'Compare trois détails autour de la fenêtre II et note ton interprétation.'],
  },
};

function language() {
  const selected = (window.CaisikI18n?.getLanguage?.() || document.documentElement.lang || 'cs').split('-')[0];
  return Object.hasOwn(words, selected) ? words[selected] : words.cs;
}

function readVisits() {
  try {
    const data = JSON.parse((window.UAStoryState?.storage ?? localStorage).getItem(visitsKey));
    if (Array.isArray(data?.visited)) return [...new Set(data.visited.filter(id => destinations.has(id)))];
  } catch { /* The existing quest saves remain independent. */ }
  return [];
}

let visited = readVisits();
let current = null;
let resume = null;

function remember(id) {
  const latest = readVisits();
  const combined = [...visited.filter(visit => !latest.includes(visit)), ...latest];
  visited = [...combined.filter(visit => visit !== id), id];
  if (visited.length === latest.length && latest.every((visit, index) => visit === visited[index])) return;
  try { (window.UAStoryState?.storage ?? localStorage).setItem(visitsKey, JSON.stringify({ visited })); } catch { /* Resume in this tab remains usable. */ }
}

function text(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function snapshot() {
  const edition = window.UAStoryState;
  const gate = edition ? edition.hasDJMix() : destinations.get('dj').panel.hasAttribute('data-gate-open');
  const corner = readCornerProgress();
  const finished = {
    dj: gate,
    mc: Boolean(readRevizor()),
    writer: Boolean(readWriterRepair()),
    breaking: Boolean(readShadowRoutine()),
    knowledge: Boolean(corner?.reading),
  };
  const partial = edition ? {
    dj: Boolean(edition.getDraft('dj').heardCue),
    mc: (Array.isArray(edition.getDraft('mc').endings) && edition.getDraft('mc').endings.some(s => typeof s === 'string' && s.trim())),
    writer: ['crate','repair'].includes(edition.getDraft('writer').stage),
    breaking: Boolean(edition.getDraft('breaking').moves?.length),
    knowledge: Boolean(corner?.seen.length),
  } : {
    dj: Boolean(document.querySelector('[data-metro-platform]:not([hidden]) [data-metro-model]:not([hidden])')),
    mc: [...document.querySelectorAll('[data-revizor-ending]')].some(input => input.value.trim()),
    writer: Boolean(document.querySelector('[data-writer-stage="1"]:not([hidden]), [data-writer-stage="2"]:not([hidden])')),
    breaking: Boolean(document.querySelector('[data-shadow-move][aria-pressed="true"]')),
    knowledge: Boolean(corner?.seen.length),
  };
  return { gate, corner, finished, partial };
}

function paint() {
  const copy = language();
  const visible = Boolean(readImprint()?.returned);
  board.hidden = !visible;
  if (entry) entry.hidden = !visible;
  text(entry, copy.entry);
  for (const link of backLinks) {
    link.hidden = !visible;
    text(link, copy.back);
  }
  if (!visible) return;

  for (const label of labels) {
    const key = label.dataset.trailsLine;
    if (typeof copy[key] === 'string') text(label, copy[key]);
  }
  const { gate, corner, finished, partial } = snapshot();
  const openTodos = new Set();
  for (const [id, card] of cards) {
    const locked = id === 'mc' && !gate;
    const done = finished[id];
    const active = Boolean(partial[id] || visited.includes(id));
    if (active && !locked && !done) openTodos.add(id);
    const state = locked ? 'locked' : done ? 'done' : active ? 'active' : 'ready';
    card.dataset.state = state;
    const [name, description] = copy[id];
    const clues = id === 'knowledge' && partial.knowledge && !done ? ' ' + copy.details(corner.seen.length, 3) : '';
    text(card.querySelector('[data-trail-title]'), name);
    text(card.querySelector('[data-trail-summary]'), (locked ? copy.mcLocked : description) + clues);
    text(card.querySelector('[data-trail-state]'), copy[state === 'active' && !partial[id] ? 'seen' : state]);
    const button = card.querySelector('[data-trail-open]');
    const action = locked ? copy.locked : done ? copy.revisit : active ? copy.resume : copy.open;
    button.disabled = locked;
    button.setAttribute('aria-label', action + ' · ' + name);
    text(button, action);
  }
  text(count, copy.count(Object.values(finished).filter(Boolean).length, cards.size));
  resume = [...visited].reverse().find(id => openTodos.has(id)) ?? openTodos.values().next().value ?? null;
  continueButton.hidden = resume === null;
  if (resume) text(continueButton, copy.next(copy[resume][0]));
}

function land(element) {
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function setHash(id) {
  const hash = '#' + id;
  if (location.hash !== hash) history.pushState(null, '', hash);
}

function enterTrail(id) {
  if (board.hidden) return;
  const entry = destinations.get(id);
  if (window.UAStoryState?.enterTrail) {
    if (!entry || id === 'mc' && !window.UAStoryState.hasDJMix()) return;
    current = id;
    remember(id);
    window.UAStoryState.enterTrail(id);
    paint();
    return;
  }
  const metro = destinations.get('dj');
  if (id === 'mc') {
    if (!metro.panel.hasAttribute('data-gate-open')) return;
    if (metro.panel.hidden) metro.opener.click();
  }
  if (entry.panel.hidden && !entry.opener.hidden) entry.opener.click();
  if (entry.panel.hidden) return;
  // Match the card to the scene just opened, even if another panel is already on the page.
  current = id;
  remember(id);
  setHash(entry.panel.id);
  land(entry.panel.querySelector(entry.title));
  paint();
}

for (const [id, card] of cards) card.querySelector('[data-trail-open]').addEventListener('click', () => enterTrail(id));
continueButton.addEventListener('click', () => { if (resume) enterTrail(resume); });

function showBoard(returnTo = null) {
  paint();
  if (board.hidden) return;
  if (window.UAStoryState?.showBoard) {
    window.UAStoryState.showBoard();
    return;
  }
  setHash(board.id);
  const button = cards.get(returnTo)?.querySelector('[data-trail-open]');
  land(button && !button.disabled ? button : heading);
}

function bindBoardLink(link, returnTo) {
  link?.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showBoard(returnTo);
  });
}
bindBoardLink(entry);
const nestedFirst = [...destinations].reverse();
for (const link of backLinks) bindBoardLink(link, nestedFirst.find(([, scene]) => scene.panel.contains(link))?.[0]);

// Track native scene entry too. Do not reopen a panel just to read its progress.
if ('MutationObserver' in window) {
  const idsByOpener = new Map([...destinations].map(([id, scene]) => [scene.opener, id]));
  const observer = new MutationObserver(records => {
    if (board.hidden) return;
    for (const { target, oldValue } of records) {
      if (oldValue === 'true' || target.getAttribute('aria-expanded') !== 'true') continue;
      current = idsByOpener.get(target);
      remember(current);
    }
    paint();
  });
  for (const { opener } of destinations.values()) observer.observe(opener, { attributes: true, attributeFilter: ['aria-expanded'], attributeOldValue: true });
}

if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { if (entry.isIntersecting) paint(); }).observe(board);
}
for (const event of [imprintEvent, revizorEvent, writerRepairEvent, shadowRoutineEvent, cornerNoteEvent, 'caisik:metro-state', 'caisik:languagechange']) {
  window.addEventListener(event, paint);
}
const storageKeys = [imprintKey, metroKey, revizorKey, writerRepairKey, shadowRoutineKey, cornerNoteKey, visitsKey];
window.addEventListener('storage', event => {
  if (event.key === visitsKey || event.key === null) visited = readVisits();
  if (event.key === null || storageKeys.includes(event.key)) paint();
});
window.addEventListener('popstate', () => {
  if (location.hash === '#' + board.id && !board.hidden) showBoard(current ?? visited.at(-1));
});
paint();
