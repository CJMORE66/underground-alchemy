import { normalizeEnding, readRevizor, revizorEvent, revizorKey, writeRevizor } from './revizor-store.js?v=1';

const scene = document.querySelector('[data-revizor]');
const platform = scene.closest('[data-metro-platform]');
const echo = document.querySelector('[data-revizor-echo]');
const quote = echo.querySelector('[data-revizor-quote]');
const returnToDJ = platform.querySelector('[data-metro-return]');
const opener = scene.querySelector('[data-revizor-open]');
const panel = scene.querySelector('[data-revizor-panel]');
const title = scene.querySelector('[data-revizor-title]');
const form = scene.querySelector('[data-revizor-form]');
const fields = [...form.querySelectorAll('[data-revizor-ending]')];
const preset = scene.querySelector('[data-revizor-preset]');
const close = scene.querySelector('[data-revizor-close]');
const street = scene.querySelector('[data-revizor-street]');
const status = scene.querySelector('[data-revizor-status]');
const stamp = scene.querySelector('[data-revizor-stamp]');
const motion = matchMedia('(prefers-reduced-motion: reduce)');

const copy = {
  cs: {
    title: 'Revizor chce šestnáctku',
    teaser: 'Revizor si splete tvůj Blackbook s jízdenkou.',
    open: 'Ukázat Blackbook', revisit: 'Otevřít sloku',
    intro: 'Revizor přiloží čtečku k Blackbooku. Ticho. „Šestnáctku? Začni čtyřmi. Poslední spoj nepočká.“',
    firstSetup: 'Dveře mi odkleply poslední spoj.', first: 'Do Blackbooku píšu…',
    secondSetup: 'Z repráku na sloupu: „Nechte ten hluk být.“', second: 'Já pod to připíšu…',
    preset: 'Použít připravené rýmy', beat: 'DJův přechod', submit: 'Dát sloku orazítkovat',
    close: 'Zavřít Blackbook', street: 'Zpátky k DJovi', stamp: 'Platí do konce taktu',
    echoLead: 'DJ si myslí, že stáhl mikrofon. Do celé ulice se ozve tvoje druhé zakončení:',
    echoEnd: 'Ztichne až po cvaknutí vypínače.',
    endings: ['tři doby pro klid, tu čtvrtou pro boj', 'jedině pokud i ticho umí znít'],
    missing: 'Doplň obě zakončení, každé na jeden řádek do 72 znaků.',
    usedPreset: 'Rýmy jsou doplněné. Můžeš je přepsat.',
    saved: 'Obě zakončení jsou v Blackbooku.',
    saveError: 'Sloku se nepodařilo uložit. Zkus to ještě jednou.',
  },
  en: {
    title: 'The inspector wants sixteen bars',
    teaser: 'A ticket inspector mistakes your Blackbook for a ticket.',
    open: 'Show your Blackbook', revisit: 'Open the verse',
    intro: 'The inspector taps their reader against the Blackbook. Silence. “Sixteen bars? Start with four. The last train won’t wait.”',
    firstSetup: 'The last train leaves. I feel the kick through stone.', first: 'In my Blackbook I write…',
    secondSetup: 'From the speaker: “Please don’t stamp your feet.”', second: 'Under that I write…',
    preset: 'Use the suggested rhymes', beat: 'DJ transition', submit: 'Get the verse stamped',
    close: 'Close the Blackbook', street: 'Back to the DJ', stamp: 'Valid until the end of the bar',
    echoLead: 'The DJ thinks the mic is down. Your second ending goes out to the whole street:',
    echoEnd: 'The switch clicks a moment too late.',
    endings: ['a beat and a couple of lines of my own', 'only if silence can keep the beat'],
    missing: 'Add two endings, each on one line and up to 72 characters.',
    usedPreset: 'The rhymes are filled in. You can edit them.',
    saved: 'Both endings are in the Blackbook.',
    saveError: 'The verse could not be saved. Try again.',
  },
  fr: {
    title: 'Le contrôleur veut seize mesures',
    teaser: 'Le contrôleur prend ton Blackbook pour un ticket.',
    open: 'Montrer le Blackbook', revisit: 'Ouvrir le couplet',
    intro: 'Le contrôleur passe son lecteur sur le Blackbook. Silence. « Seize mesures ? Commence par quatre. Le dernier métro n’attendra pas. »',
    firstSetup: 'Les portes battent le rappel du dernier train.', first: 'Dans mon Blackbook, j’écris…',
    secondSetup: 'Le haut-parleur réclame encore du silence.', second: 'Moi, j’ajoute…',
    preset: 'Utiliser les rimes proposées', beat: 'Transition du DJ', submit: 'Faire tamponner le couplet',
    close: 'Fermer le Blackbook', street: 'Retour auprès du DJ', stamp: 'Valable jusqu’à la fin de la mesure',
    echoLead: 'Le DJ croit avoir coupé son micro. Ton deuxième vers résonne dans toute la rue :',
    echoEnd: 'L’interrupteur claque un peu trop tard.',
    endings: ['trois temps pour le calme, un pour le chemin', 'seulement si le silence entre dans la danse'],
    missing: 'Complète les deux fins de vers, chacune sur une ligne de 72 caractères maximum.',
    usedPreset: 'Les rimes sont ajoutées. Tu peux les modifier.',
    saved: 'Tes deux fins de vers sont dans le Blackbook.',
    saveError: 'Impossible de sauvegarder le couplet. Réessaie.',
  },
};
const labels = [...scene.querySelectorAll('[data-revizor-line]'), ...echo.querySelectorAll('[data-revizor-line]')];

function language() {
  const selected = (window.CaisikI18n?.getLanguage?.() || document.documentElement.lang || 'cs').split('-')[0];
  return Object.hasOwn(copy, selected) ? selected : 'cs';
}

let verse = readRevizor();
let opened = false;
let dirty = false;
let draftLanguage = verse?.lang ?? language();
let message = '';
let invalid = [];

function loadFields() {
  fields.forEach((field, index) => { field.value = verse?.endings[index] ?? ''; });
  draftLanguage = verse?.lang ?? language();
}

window.UAStoryState?.register('mc', {
  step: () => hasCurrentVerse() ? 'verse' : 'write',
  open() {
    if (!platform.hasAttribute('data-gate-open')) return null;
    window.UAStoryState.get('dj')?.open('platform');
    opened = true;
    paint();
    return this.step();
  },
  saveDraft() {
    window.UAStoryState.saveDraft('mc', {endings: fields.map(field => field.value.slice(0,72)), lang:draftLanguage});
  },
  target() { return title; },
});
function hasCurrentVerse() {
  return Boolean(verse && fields.every((field, index) => normalizeEnding(field.value) === verse.endings[index]));
}

function paint() {
  const text = copy[language()];
  for (const label of labels) label.textContent = text[label.dataset.revizorLine];
  const eligible = platform.hasAttribute('data-gate-open');
  scene.hidden = !eligible;
  const visible = eligible && opened && !platform.hidden;
  panel.hidden = !visible;
  opener.setAttribute('aria-expanded', String(visible));
  opener.hidden = visible;
  opener.textContent = verse ? text.revisit : text.open;
  const stamped = hasCurrentVerse();
  scene.toggleAttribute('data-stamped', stamped);
  stamp.hidden = !stamped;
  street.hidden = !stamped;
  for (const [index, field] of fields.entries()) {
    if (invalid.includes(index)) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }
  if (status.textContent !== (text[message] ?? '')) status.textContent = text[message] ?? '';
  echo.hidden = !eligible || !verse;
  if (verse) {
    quote.textContent = verse.endings[1];
    quote.lang = verse.lang;
  } else {
    quote.textContent = '';
    quote.removeAttribute('lang');
  }
}

function land(element) {
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function closeEditor(restoreFocus = false) {
  if (!opened) return;
  opened = false;
  invalid = [];
  message = '';
  scene.removeAttribute('data-stamp-motion');
  window.dispatchEvent(new Event('caisik:revizor-close'));
  paint();
  if (restoreFocus) land(opener);
}

opener.addEventListener('click', () => {
  if (scene.hidden || platform.hidden) return;
  opened = true;
  paint();
  land(title);
});
close.addEventListener('click', () => window.UAStoryState?.closeTrail ? window.UAStoryState.closeTrail() : closeEditor(true));
panel.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented || !opened) return;
  event.preventDefault();
  if (window.UAStoryState?.closeTrail) window.UAStoryState.closeTrail();
  else closeEditor(true);
});

for (const field of fields) field.addEventListener('input', () => {
  dirty = true;
  draftLanguage = language();
  invalid = [];
  message = '';
  scene.removeAttribute('data-stamp-motion');
  paint();
});

preset.addEventListener('click', () => {
  if (panel.hidden) return;
  draftLanguage = language();
  fields.forEach((field, index) => { field.value = copy[draftLanguage].endings[index]; });
  dirty = true;
  invalid = [];
  message = 'usedPreset';
  scene.removeAttribute('data-stamp-motion');
  paint();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (panel.hidden) return;
  const endings = fields.map(field => normalizeEnding(field.value));
  invalid = endings.flatMap((ending, index) => ending ? [] : [index]);
  if (invalid.length) {
    message = 'missing';
    paint();
    fields[invalid[0]].focus();
    return;
  }
  const latest = readRevizor();
  const sameVerse = latest?.lang === draftLanguage && endings.every((ending, index) => ending === latest.endings[index]);
  const next = { endings, lang: draftLanguage };
  if (!sameVerse && !writeRevizor(next)) {
    message = 'saveError';
    paint();
    return;
  }
  verse = next;
  dirty = false;
  loadFields();
  message = 'saved';
  if (!sameVerse && !motion.matches) scene.setAttribute('data-stamp-motion', '');
  paint();
  if (!sameVerse) window.dispatchEvent(new Event(revizorEvent));
});

street.addEventListener('click', () => {
  if (panel.hidden || street.hidden) return;
  if (window.UAEdition) { window.UAEdition.navigate('#story/dj/mix'); return; }
  returnToDJ.click();
  if (!echo.hidden) land(echo);
});

window.addEventListener('caisik:metro-state', () => {
  if (platform.hidden || !platform.hasAttribute('data-gate-open')) closeEditor();
  paint();
});
window.addEventListener('caisik:languagechange', paint);
window.addEventListener('storage', event => {
  if (event.key !== revizorKey && event.key !== null) return;
  verse = readRevizor();
  if (!dirty) loadFields();
  message = '';
  paint();
});
stamp.addEventListener('animationend', () => scene.removeAttribute('data-stamp-motion'));
window.addEventListener('pagehide', () => scene.removeAttribute('data-stamp-motion'));

loadFields();
const pendingVerse = window.UAStoryState?.getDraft('mc');
if (Array.isArray(pendingVerse?.endings) && pendingVerse.endings.length === 2 && pendingVerse.endings.every(v => typeof v === 'string' && v.length <= 72)) {
  fields.forEach((field, i) => { field.value = pendingVerse.endings[i]; });
  if (['cs','fr','en'].includes(pendingVerse.lang)) draftLanguage = pendingVerse.lang;
  dirty = !hasCurrentVerse();
}
paint();
