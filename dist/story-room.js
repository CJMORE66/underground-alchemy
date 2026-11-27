import { readImprint, imprintEvent } from './needle-imprint-store.js?v=1';
import { readWriterRepair, writerRepairEvent } from './writer-repair-store.js?v=1';
import { readRevizor, revizorEvent } from './revizor-store.js?v=1';
import { readShadowRoutine, shadowRoutineEvent } from './shadow-quest-store.js?v=1';
import { readCornerNote, cornerNoteEvent } from './corner-note-store.js?v=1';

const state = window.UAStoryState;
const roots = {
  needle: '#needle-street', trails: '#street-trails', dj: '#metro-quest', mc: '#metro-quest',
  writer: '#writer-quest', breaking: '#shadow-quest', knowledge: '#corner-quest',
};
const labels = {
  needle: {
    start: 'Pustit takt', listen: 'Najít opožděné okno', rewind: 'Přetočit desku',
    courier: 'Vydat se po stopě kurýra', fork: 'Vybrat kurýrovu stopu', stairs: 'Doklepat rytmus na dveře',
    wall: 'Přečíst značku na zdi', rhythm: 'Doskládat rytmus na parapetu', return: 'Vrátit můj rytmus do okna II',
    window: 'Přehrát můj rytmus v okně II',
  },
  trails: { '': 'Pokračovat po vedlejších stopách' },
  writer: { poster: 'Prohlédnout plakát TRANSMUTE', crate: 'Prozkoumat otisk na bedně', repair: 'Vrátit se k vlastnímu tahu' },
  dj: { platform: 'Vrátit se na nástupiště', pads: 'Doplnit údery dveří', mix: 'Pustit můj přechod s DJem' },
  mc: { write: 'Dopsat sloku pro revizora', verse: 'Otevřít orazítkovanou sloku' },
  breaking: { compose: 'Dokončit sestavu pod lampou', routine: 'Vrátit se k sestavě stínu' },
  knowledge: { courier: 'Vyslechnout kurýra', dj: 'Vyslechnout DJe', inspector: 'Vyslechnout revizora', reading: 'Otevřít vlastní čtení ulice' },
};
function link(text, href, className) {
  const a = document.createElement('a');
  a.textContent = text;
  a.href = href;
  if (className) a.className = className;
  return a;
}
const streetStory = document.querySelector('#needle-street .needle-story');
const primary = streetStory.querySelector('[data-play]');
const primaryResume = link('', '#story/continue', 'street-resume');
primary.before(primaryResume);
const atlasLink = link('Otevřít atlas Paříže', '#atlas/zin/le-grand-jeu?mode=home&view=list', 'street-atlas-link');
primary.after(atlasLink);
const temporaryNotice = document.createElement('p');
temporaryNotice.className = 'story-temporary';
temporaryNotice.setAttribute('role', 'status');
temporaryNotice.textContent = 'Prohlížeč nemůže uložit postup. Hraješ v této kartě; před jejím zavřením si práci vyexportuj.';
streetStory.append(temporaryNotice);

const detourBack = link('← Zpět na stopu', '#atlas', 'story-detour-back');
const writerTitle = document.querySelector('[data-writer-title]');
writerTitle.before(detourBack);
const detourEnd = detourBack.cloneNode(true);
document.querySelector('[data-writer-close]').after(detourEnd);
const responses = {
  needle: [imprintEvent, () => readImprint(), '#story/needle/window', 'Okno II přehrává tvůj rytmus'],
  dj: ['caisik:metro-state', () => state.read('caisik-metro-dj-v1'), '#story/dj/mix', 'DJ přimíchal tvůj rytmus ke dveřím metra'],
  mc: [revizorEvent, () => readRevizor(), '#story/dj/mix', 'Tvůj druhý verš se ozývá v ulici'],
  writer: [writerRepairEvent, () => readWriterRepair(), '#atlas/gallery', 'Tvůj tah se objevil na Living Wall'],
  breaking: [shadowRoutineEvent, () => readShadowRoutine(), '#story/breaking/routine', 'Stín převzal tvoji sestavu'],
  knowledge: [cornerNoteEvent, () => readCornerNote(), '#story/knowledge/reading', 'Alchymista si pamatuje tvůj výklad'],
};
const responseKey = 'caisik-story-world-v1';
const seen = new Map();
function href(scene, step, from) {
  const path = '#story/' + scene + (step ? '/' + step : '');
  return from ? path + '?from=' + encodeURIComponent(from) : path;
}
function safeZin(hash) {
  if (typeof hash !== 'string' || hash.length > 256) return '';
  const [path, query = ''] = hash.split('?');
  if (!['le-grand-jeu', 'mur-oberkampf', 'le-lavomatik'].some(id => path === '#atlas/zin/' + id)) return '';
  const options = {mode:['home','paris'],view:['list','map'],page:['work','document']};
  const params = new URLSearchParams(query);
  for (const [key,value] of params) {
    if (!Object.hasOwn(options,key) || !options[key].includes(value) || params.getAll(key).length !== 1) return '';
  }
  return hash;
}
function allowed(scene, from) {
  if (scene === 'needle') return true;
  if (scene === 'writer' && (from || readWriterRepair())) return true;
  if (scene === 'mc') return state.hasDJMix();
  if (scene === 'dj' && state.hasDJMix()) return true;
  if (scene === 'breaking' && readShadowRoutine()) return true;
  if (scene === 'knowledge' && readCornerNote()) return true;
  return !!readImprint()?.returned;
}
function resume() {
  const prior = state.last();
  if (prior && Object.hasOwn(roots, prior.scene) && allowed(prior.scene, safeZin(prior.from))) {
    const steps = labels[prior.scene];
    const step = Object.hasOwn(steps, prior.step) ? prior.step : state.get(prior.scene)?.step?.() || '';
    return {scene:prior.scene, step, from:safeZin(prior.from)};
  }
  // Open the most advanced reachable old chapter when the edition has no new bookmark.
  const step = state.get('needle')?.step?.() || 'start';
  return {scene:'needle', step, from:''};
}
function resumeLabel(record) {
  return labels[record.scene]?.[record.step] || 'Pokračovat v příběhu';
}
const worldCard = document.createElement('div');
worldCard.className = 'story-world-card';
document.querySelector('#street-trails .street-trails__header').after(worldCard);
const stampList = new Map();
const workshopLinks = new Map();
const studioPrompts = {
  needle:['Okno II','Napiš čtyři bary přes vlastní rytmus z parapetu. Na jedné své pauze nech větu nedořečenou.'],
  dj:['Poslední metro','Přepiš čtyři údery dveří do rytmu jedné věty. Ve druhé verzi nech dveře zavřít o slabiku dřív.'],
  mc:['Revizor','Vezmi svoje druhé zakončení. Napiš první řádek, který mu po opakování změní význam.'],
  writer:['TRANSMUTE','Popiš jediným slovesem svůj tah nad E. Nech se stejným slovesem přehnout čtyři řádky sloky.'],
  breaking:['Souboj se stínem','Přepiš svoji sestavu do tří sloves. Z posledního udělej ticho na konci baru.'],
  knowledge:['Stejný roh','Napiš dvě věty o stejném rohu. První smí říct jen to, cos viděl. Druhá patří tvému výkladu.'],
};
const currentRoute = () => window.UAEdition?.current?.();
let active = null;
let applying = false;
function nav(hash, replace=false) {
  if (window.UAEdition) window.UAEdition.navigate(hash, {replace});
  else if (location.hash !== hash) location.hash = hash;
}
function refreshLinks() {
  const point = resume();
  const returning = point.scene !== 'needle' || point.step !== 'start';
  primaryResume.textContent = resumeLabel(point);
  primaryResume.hidden = !returning || !!active;
  primary.classList.toggle('is-secondary-play', !primaryResume.hidden);
  for (const a of document.querySelectorAll('[data-story-continue]')) {
    a.textContent = resumeLabel(point);
    a.href = href(point.scene, point.step, point.from);
  }
  temporaryNotice.hidden = !state.temporary;
  const last = state.read(responseKey);
  const changed = typeof last === 'string' && responses[last]?.[1]();
  worldCard.hidden = !changed;
  if (changed) {
    const response = responses[last];
    const a = link(response[3], last === 'needle' && !readImprint()?.returned ? '#story/needle/return' : response[2]);
    worldCard.replaceChildren(a, link('Moje stránka v Blackbooku', '#blackbook/story/' + last));
    if (last === 'needle' && !readImprint()?.returned) a.textContent = 'Tvůj rytmus čeká na parapetu';
  }
  for (const [scene, a] of stampList) {
    const earned = Boolean(responses[scene][1]());
    a.hidden = !earned;
    const studio = workshopLinks.get(scene);
    studio.hidden = !earned;
    if (earned) {
      const step = state.get(scene)?.step() || '';
      const source = href(scene,step,active?.scene === scene ? active.from : '');
      const [subject, prompt] = studioPrompts[scene];
      studio.href = '#workshop/frequency?' + new URLSearchParams({from:source, subject, prompt});
    }
  }
}
function attachResult(scene, parent) {
  const where = document.querySelector(parent);
  if (!where) return;
  const stamp = link('Moje stránka v Blackbooku ↗', '#blackbook/story/' + scene, 'story-stamp-link');
  const studio = link('Rozvinout motiv v Dílně', '#workshop/frequency', 'story-studio-link');
  where.append(stamp, studio);
  stampList.set(scene, stamp);
  workshopLinks.set(scene, studio);
}
attachResult('needle', '[data-imprint-editor]');
attachResult('dj', '[data-metro-reward]');
attachResult('mc', '[data-revizor-panel]');
attachResult('writer', '[data-writer-stage="2"]');
attachResult('breaking', '[data-shadow-panel]');
attachResult('knowledge', '[data-corner-panel]');
for (const [scene, [eventName, read]] of Object.entries(responses)) {
  seen.set(scene, JSON.stringify(read()));
  window.addEventListener(eventName, () => {
    const value = read();
    const serialized = JSON.stringify(value);
    if (value && seen.get(scene) !== serialized) state.storage.setItem(responseKey, JSON.stringify(scene));
    seen.set(scene, serialized);
    refreshLinks();
  });
}
function setVisible(scene) {
  document.documentElement.dataset.storyScene = scene;
  for (const id of new Set(Object.values(roots))) {
    document.querySelector(id)?.toggleAttribute('data-story-away', id !== roots[scene]);
  }
}
function suspend(scene) {
  state.get(scene)?.suspend?.();
}
function display(route) {
  if (!route) return;
  const previous = active;
  if (route.section !== 'story') {
    if (active) suspend(active.scene);
    active = null;
    setVisible('needle');
    delete document.documentElement.dataset.storyStep;
    detourBack.hidden = detourEnd.hidden = true;
    refreshLinks();
    return;
  }
  let [scene, requested = ''] = route.parts;
  let from = safeZin(route.params?.get('from'));
  if (!scene || scene === 'continue') {
    const record = resume();
    // An explicit Resume link must refocus even when the target hash matches
    // the last scene in this same document (browser Back and menu included).
    active = null;
    nav(href(record.scene, record.step, record.from), true);
    return;
  }
  if (!Object.hasOwn(roots, scene) || !allowed(scene, from)) {
    const step = state.get('needle')?.step() || 'start';
    nav(href('needle', step), true);
    return;
  }
  if (scene !== 'writer') from = '';
  if (previous && previous.scene !== scene) suspend(previous.scene);
  applying = true;
  let step;
  try {
    setVisible(scene);
    const controller = state.get(scene);
    step = scene === 'trails' ? '' : controller?.open(requested, from);
    if (step === null || step === undefined) return;
    document.documentElement.dataset.storyStep = step;
    active = {scene, step, from};
    state.remember(active);
    detourBack.hidden = detourEnd.hidden = !from;
    if (from) detourBack.href = detourEnd.href = from;
    refreshLinks();
  } finally { applying = false; }
  const canonical = href(scene, step, from);
  if (location.hash !== canonical) {
    nav(canonical, true);
    return;
  }
  if (previous?.scene !== scene || previous?.step !== step || previous?.from !== from) {
    const target = state.get(scene)?.target(step) || document.querySelector('#street-trails-title');
    target?.focus({preventScroll:true});
    target?.scrollIntoView({block:'start', behavior:'instant'});
    // WebKit/Chromium can perform native fragment scrolling after hashchange.
    // Recheck the actual viewport on the next painted frame without stealing focus.
    requestAnimationFrame(() => {
      if (location.hash !== canonical || document.activeElement !== target) return;
      const box = target.getBoundingClientRect();
      if (box.bottom <= 0 || box.top >= window.innerHeight) target.scrollIntoView({block:'center', behavior:'instant'});
    });
  }
}
function capture(scene) {
  if (applying) return;
  const controller = state.get(scene);
  if (!controller) return;
  controller.saveDraft?.();
  const step = controller.step();
  const from = scene === 'writer' ? active?.from : '';
  const next = href(scene, step, from);
  if (currentRoute()?.section !== 'story' || location.hash !== next) {
    // The interaction is already visible, so retain the input focus and caret.
    // On the first gesture the long film track is removed by the shell.
    // Let display() refocus the real street panel after that layout change.
    if (currentRoute()?.section === 'story' && active?.scene === scene) active = {scene, step, from};
    state.remember({scene, step, from});
    nav(next, true);
  }
  refreshLinks();
}
function sourceScene(el) {
  if (!el?.closest) return '';
  if (el.closest('[data-revizor]')) return 'mc';
  for (const id of ['needle','dj','writer','breaking','knowledge']) {
    if (el.closest(roots[id])) return id;
  }
  return '';
}
function track(event) {
  if (event.type === 'click' && (event.target.closest('a,[data-writer-close],[data-shadow-close],[data-corner-close],[data-revizor-close],[data-revizor-street],[data-metro-close],[data-metro-return]') || !event.target.closest('button'))) return;
  const scene = sourceScene(event.target);
  if (!scene || event.defaultPrevented && event.type !== 'submit') return;
  capture(scene);
}
document.addEventListener('click', track);
document.addEventListener('input', track);
document.addEventListener('submit', track);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && event.target.closest?.('#needle-fork')) capture('needle');
  if (['ArrowLeft','ArrowRight'].includes(event.key) && event.target.closest?.('[data-corner-witness]')) capture('knowledge');
});
document.addEventListener('pointerup', e => {
  if (e.target.closest?.('[data-writer-pad]')) capture('writer');
});
window.addEventListener('ua:route', e => display(e.detail));
window.addEventListener('ua:temporary-storage', refreshLinks);
window.addEventListener('storage', refreshLinks);
window.addEventListener('pageshow', () => { if (currentRoute()) display(currentRoute()); });
state.resume = resume;
state.href = href;
state.label = resumeLabel;
state.showBoard = () => nav('#story/trails');
state.enterTrail = scene => {
  const controller = state.get(scene);
  nav(href(scene, controller?.step?.() || ''));
};
state.closeTrail = () => nav(active?.from || '#story/trails');
state.world = () => state.read(responseKey);
setVisible('needle');
refreshLinks();
if (currentRoute()) display(currentRoute());
