import { imprintEvent, imprintKey, readImprint } from './needle-imprint-store.js?v=1';
import { readWriterRepair, repairPointLimit, writeWriterRepair, writerRepairEvent, writerRepairKey } from './writer-repair-store.js?v=1';

const root = document.querySelector('[data-writer]');
const panel = root.querySelector('[data-writer-panel]');
const opener = root.querySelector('[data-writer-open]');
const stages = [...root.querySelectorAll('[data-writer-stage]')];
const pad = root.querySelector('[data-writer-pad]');
const draw = root.querySelector('[data-writer-draw]');
const save = root.querySelector('[data-writer-save]');
const clear = root.querySelector('[data-writer-clear]');
const status = root.querySelector('[data-writer-status]');
const wall = document.querySelector('[data-writer-wall]');
const sleeve = document.querySelector('[data-writer-sleeve]');
const wallLink = root.querySelector('[data-writer-wall-link]');
const wallReturn = wall.querySelector('[data-writer-wall-return]');
const editorPath = pad.querySelector('[data-writer-path]');
const labels = [root, wall, sleeve].flatMap(element => [...element.querySelectorAll('[data-writer-line]')]);

const anchor = [13, 44];
const presets = {
  hook: [[13, 44], [34, 46], [52, 39], [66, 32], [80, 42]],
  straight: [[13, 44], [34, 48], [57, 53], [77, 59]],
};
const words = {
  cs: {
    title: 'Šipka, co zdrhla z piece', teaser: 'Kurýrovi z plakátu TRANSMUTE upadl hrot. Na bedně po něm zůstal zlatý otisk.',
    open: 'Jít po šipce', openSaved: 'Vrátit se k šipce',
    posterTitle: 'Kus pod deskou', posterCredit: 'TRANSMUTE · CAISIK',
    posterCopy: 'Kurýr narovná pomačkaný plakát. „Koukej na poslední E, pod deskou. Tudy šipka zdrhla.“',
    crateTitle: 'Otisk na víku', crateCopy: 'Na víku bedny se leskne zlatý hrot. Kurýr ho převrátí. „Já blbec s tím celou cestu ukazoval na špatnej východ.“',
    repairTitle: 'Doplň hrot nad E',
    repairCopy: 'Zapni kreslení a táhni od zlatého bodu doprava. Tvar si vymysli, nebo vyber zahnutý či rovný tah.',
    next: 'Sledovat stopu', prev: 'Předchozí stopa', close: 'Zpátky do ulice',
    draw: 'Kreslit tahem', drawing: 'Ukončit kreslení', hook: 'Zahnutý tah', straight: 'Rovný tah',
    clear: 'Smazat návrh', save: 'Uložit opravu', wallLink: 'Podívat se na Living Wall',
    wallTitle: 'TRANSMUTE s tvým tahem', wallCaption: 'Kurýr vrátil plakát na Living Wall. Nad posledním E zůstala tvoje linka.',
    wallReturn: 'Zpátky ke kurýrovi', sleeveTitle: 'Obal DJova přechodu',
    sleeveCaption: 'DJ otiskl tvoji linku na obal desky. „Teď aspoň vím, z které strany ho otevřít.“',
    aimed: 'Začni na zlatém bodu.', short: 'Dotáhni linku až k pravé straně pole.',
    preview: 'Tah je připravený k uložení.', stored: 'Oprava je v Blackbooku i na Living Wall.',
    storageError: 'Opravu se nepodařilo uložit. Zkus to znovu.',
  },
  en: {
    title: 'The arrow that slipped off the piece', teaser: 'The tip fell off the courier’s TRANSMUTE poster and left a gold print on the crate.',
    open: 'Follow the arrow', openSaved: 'Return to the arrow',
    posterTitle: 'Under the record', posterCredit: 'TRANSMUTE · CAISIK',
    posterCopy: 'The courier straightens the crumpled poster. “Look at the last E, just under the record. That’s where it slipped out.”',
    crateTitle: 'A print on the lid', crateCopy: 'The golden tip shines on the crate. The courier flips the lid. “No wonder I kept pointing to the wrong exit.”',
    repairTitle: 'Finish the tip above the E',
    repairCopy: 'Turn on drawing and drag from the gold dot to the right. Draw your own line or choose a hooked or straight stroke.',
    next: 'Follow the clue', prev: 'Previous clue', close: 'Back to the street',
    draw: 'Draw a stroke', drawing: 'Exit drawing', hook: 'Hooked stroke', straight: 'Straight stroke',
    clear: 'Clear draft', save: 'Save repair', wallLink: 'See the Living Wall',
    wallTitle: 'TRANSMUTE with your stroke', wallCaption: 'The courier put the poster back on the Living Wall. Your line is still above the final E.',
    wallReturn: 'Back to the courier', sleeveTitle: 'DJ transition sleeve',
    sleeveCaption: 'The DJ printed your line on the record sleeve. “Now I know which side opens.”',
    aimed: 'Start on the gold dot.', short: 'Carry the line to the right side of the drawing area.',
    preview: 'The stroke is ready to save.', stored: 'The repair is in your Blackbook and on the Living Wall.',
    storageError: 'The repair could not be saved. Try again.',
  },
  fr: {
    title: 'La flèche qui a filé du graffiti', teaser: 'La pointe s’est détachée de l’affiche TRANSMUTE du coursier. Elle a laissé une trace dorée sur la caisse.',
    open: 'Suivre la flèche', openSaved: 'Revenir à la flèche',
    posterTitle: 'Sous le disque', posterCredit: 'TRANSMUTE · CAISIK',
    posterCopy: 'Le coursier redresse l’affiche froissée. « Regarde le dernier E, sous le disque. C’est par là qu’elle a filé. »',
    crateTitle: 'Une trace sur le couvercle', crateCopy: 'La pointe dorée brille sur la caisse. Le coursier retourne le couvercle. « Normal que je montre la mauvaise sortie depuis tout à l’heure. »',
    repairTitle: 'Complète la pointe au-dessus du E',
    repairCopy: 'Active le dessin et trace du point doré vers la droite. Invente ton trait ou choisis une ligne droite ou coudée.',
    next: 'Suivre l’indice', prev: 'Indice précédent', close: 'Retour à la rue',
    draw: 'Tracer un trait', drawing: 'Quitter le dessin', hook: 'Trait coudé', straight: 'Trait droit',
    clear: 'Effacer le brouillon', save: 'Enregistrer la réparation', wallLink: 'Voir le Living Wall',
    wallTitle: 'TRANSMUTE avec ton trait', wallCaption: 'Le coursier a remis l’affiche sur le Living Wall. Ton trait reste au-dessus du dernier E.',
    wallReturn: 'Retour auprès du coursier', sleeveTitle: 'Pochette de la transition du DJ',
    sleeveCaption: 'Le DJ a imprimé ton trait sur la pochette du disque. « Maintenant, je sais de quel côté ça s’ouvre. »',
    aimed: 'Pars du point doré.', short: 'Prolonge le trait jusqu’à la partie droite de la zone de dessin.',
    preview: 'Le trait est prêt à être enregistré.', stored: 'La réparation est dans ton Blackbook et sur le Living Wall.',
    storageError: 'Impossible d’enregistrer la réparation. Réessaie.',
  },
};

let saved = readWriterRepair();
let draft = saved;
let stroke = null;
let pointer = null;
let drawing = false;
let open = false;
let stage = 0;
let feedback = '';
const stageIds = ['poster', 'crate', 'repair'];
let detour = false;
const writerDraft = window.UAStoryState?.getDraft('writer');
if (writerDraft) {
  if (stageIds.includes(writerDraft.stage)) stage = stageIds.indexOf(writerDraft.stage);
  if (Object.hasOwn(writerDraft, 'stroke')) {
    const pending = writerDraft.stroke;
    if (pending === null) draft = null;
    else if (['drawn','preset'].includes(pending?.kind) && Array.isArray(pending.points) && pending.points.length >= 2 && pending.points.length <= repairPointLimit &&
      pending.points.every(p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isInteger(v) && v >= 0 && v <= 100))) draft = pending;
  }
}
window.UAStoryState?.register('writer', {
  step: () => stageIds[stage],
  open(request, from) {
    detour = Boolean(from);
    if (!detour && !readImprint()?.returned && !saved) return null;
    open = true;
    if (stageIds.includes(request)) stage = stageIds.indexOf(request);
    paint();
    return this.step();
  },
  saveDraft() { window.UAStoryState.saveDraft('writer', {stage:stageIds[stage], stroke:draft}); },
  target() { return stages[stage].querySelector('[data-writer-step-title]'); },
  suspend() { stopDrawing(); detour = false; },
});

function copy() {
  const language = (window.CaisikI18n?.getLanguage?.() || document.documentElement.lang || 'cs').split('-')[0];
  return Object.hasOwn(words, language) ? words[language] : words.cs;
}

function pathFor(points) {
  return points?.map(point => point.join(',')).join(' ') ?? '';
}

function equal(a, b) {
  return Boolean(a && b && a.kind === b.kind && pathFor(a.points) === pathFor(b.points));
}

function paint() {
  const text = copy();
  for (const label of labels) {
    const key = label.dataset.writerLine;
    if (Object.hasOwn(text, key)) label.textContent = text[key];
  }
  const unlocked = Boolean(detour || readImprint()?.returned || saved);
  root.hidden = !unlocked;
  panel.hidden = !open || !unlocked;
  opener.hidden = !panel.hidden;
  opener.setAttribute('aria-expanded', String(!panel.hidden));
  opener.textContent = text[saved ? 'openSaved' : 'open'];
  stages.forEach((element, index) => { element.hidden = index !== stage; });
  root.toggleAttribute('data-drawing', drawing);
  root.toggleAttribute('data-repaired', !stroke && equal(saved, draft));
  draw.setAttribute('aria-pressed', String(drawing));
  draw.textContent = text[drawing ? 'drawing' : 'draw'];
  save.disabled = !draft || drawing;
  clear.disabled = !draft || drawing;
  wallLink.hidden = !saved;
  editorPath.setAttribute('points', pathFor(stroke ?? draft?.points));
  if (status.textContent !== (text[feedback] ?? '')) status.textContent = text[feedback] ?? '';
  for (const result of [wall, sleeve]) {
    result.hidden = !saved;
    result.querySelector('[data-writer-path]').setAttribute('points', pathFor(saved?.points));
  }
}

function land(element) {
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function stopDrawing() {
  const previous = pointer;
  pointer = null;
  stroke = null;
  drawing = false;
  if (previous !== null && pad.hasPointerCapture(previous)) pad.releasePointerCapture(previous);
}

function changeStage(next) {
  stopDrawing();
  feedback = '';
  stage = next;
  paint();
  land(stages[stage].querySelector('[data-writer-step-title]'));
}

function closeScene() {
  if (window.UAStoryState?.closeTrail) { window.UAStoryState.closeTrail(); return; }
  stopDrawing();
  open = false;
  feedback = '';
  paint();
  if (!root.hidden) land(opener);
}

opener.addEventListener('click', () => {
  if (root.hidden) return;
  open = true;
  changeStage(window.UAStoryState ? stage : saved ? stages.length - 1 : 0);
});
for (const next of root.querySelectorAll('[data-writer-next]')) {
  next.addEventListener('click', () => { if (open && stage < stages.length - 1) changeStage(stage + 1); });
}
for (const prev of root.querySelectorAll('[data-writer-prev]')) {
  prev.addEventListener('click', () => { if (open && stage > 0) changeStage(stage - 1); });
}
root.querySelector('[data-writer-close]').addEventListener('click', closeScene);
root.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || !open) return;
  event.preventDefault();
  if (!drawing) closeScene();
  else {
    stopDrawing();
    feedback = '';
    paint();
    land(draw);
  }
});

draw.addEventListener('click', () => {
  if (drawing) stopDrawing();
  else drawing = true;
  feedback = drawing ? 'aimed' : '';
  paint();
});

for (const button of root.querySelectorAll('[data-writer-preset]')) {
  button.addEventListener('click', () => {
    const points = presets[button.dataset.writerPreset];
    if (!points) return;
    stopDrawing();
    draft = { kind: 'preset', points };
    feedback = 'preview';
    paint();
  });
}
clear.addEventListener('click', () => {
  draft = null;
  feedback = '';
  paint();
  draw.focus({ preventScroll: true });
});

function pointAt(event) {
  const rect = pad.getBoundingClientRect();
  const percent = (offset, size) => Math.min(100, Math.max(0, Math.round(100 * offset / size)));
  return [percent(event.clientX - rect.left, rect.width), percent(event.clientY - rect.top, rect.height)];
}

function distanceSquared(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function addPoint(point) {
  if (distanceSquared(point, stroke.at(-1)) < 4) return;
  if (stroke.length === repairPointLimit) stroke = stroke.filter((_, index) => index % 2 === 0);
  stroke.push(point);
  editorPath.setAttribute('points', pathFor(stroke));
}

pad.addEventListener('pointerdown', event => {
  if (!drawing || pointer !== null || event.button !== 0 || !event.isPrimary) return;
  if (distanceSquared(pointAt(event), anchor) > 15 ** 2) {
    feedback = 'aimed';
    paint();
    return;
  }
  pointer = event.pointerId;
  stroke = [anchor];
  pad.setPointerCapture(pointer);
  feedback = '';
  paint();
});
pad.addEventListener('pointermove', event => {
  if (event.pointerId === pointer) addPoint(pointAt(event));
});
pad.addEventListener('pointerup', event => {
  if (event.pointerId !== pointer) return;
  const last = pointAt(event);
  addPoint(last);
  if (last[0] >= 68) {
    draft = { kind: 'drawn', points: stroke };
    feedback = 'preview';
  } else {
    feedback = 'short';
  }
  stopDrawing();
  paint();
});
function cancelPointer(event) {
  if (event.pointerId !== pointer) return;
  stopDrawing();
  feedback = '';
  paint();
}
pad.addEventListener('pointercancel', cancelPointer);
pad.addEventListener('lostpointercapture', cancelPointer);

save.addEventListener('click', () => {
  if (!draft || drawing) return;
  const next = draft;
  const changed = !equal(next, readWriterRepair());
  if (changed && !writeWriterRepair(next)) {
    feedback = 'storageError';
    paint();
    return;
  }
  saved = next;
  feedback = 'stored';
  paint();
  if (changed) window.dispatchEvent(new Event(writerRepairEvent));
});
function moveTo(target, focusTarget) {
  if (location.hash !== '#' + target.id) history.pushState(null, '', '#' + target.id);
  land(focusTarget);
}
wallLink.addEventListener('click', event => {
  if (!saved || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (window.UAEdition) {
    const from = location.hash.startsWith('#story/') ? location.hash : '#story/writer/repair';
    window.UAEdition.navigate('#atlas/gallery?from=' + encodeURIComponent(from));
  } else moveTo(wall, wall);
});
function returnFromWall() {
  if (window.UAEdition) {
    const from = window.UAEdition.current()?.params.get('from');
    window.UAEdition.navigate(from?.startsWith('#story/writer/') ? from : '#story/writer/repair');
    return;
  }
  moveTo(root, panel.hidden ? opener : stages[stage].querySelector('[data-writer-step-title]'));
}
wallReturn.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  returnFromWall();
});
wall.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  event.preventDefault();
  returnFromWall();
});

window.addEventListener(imprintEvent, paint);
window.addEventListener('caisik:languagechange', paint);
window.addEventListener('storage', event => {
  if (event.key === writerRepairKey || event.key === null) {
    const draftWasPristine = draft === saved;
    saved = readWriterRepair();
    if (draftWasPristine) draft = saved;
    feedback = '';
  }
  if (event.key === imprintKey || event.key === writerRepairKey || event.key === null) {
    if (!saved && !readImprint()?.returned) {
      open = false;
      stopDrawing();
    }
    paint();
  }
});
function suspendDrawing() {
  if (!drawing) return;
  stopDrawing();
  feedback = '';
  paint();
}
window.addEventListener('pagehide', suspendDrawing);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspendDrawing(); });
paint();
