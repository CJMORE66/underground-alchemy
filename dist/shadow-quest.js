import { imprintEvent, imprintKey, readImprint } from './needle-imprint-store.js?v=1';
import { createShadowQuestRig } from './shadow-quest-rig.js?v=1';
import { readShadowRoutine, shadowMoveLabels, shadowMoves, shadowRoutineEvent, shadowRoutineKey, writeShadowRoutine } from './shadow-quest-store.js?v=1';

const quest = document.querySelector('[data-shadow-quest]');
const panel = quest.querySelector('[data-shadow-panel]');
const stage = quest.querySelector('[data-shadow-stage]');
const opener = quest.querySelector('[data-shadow-open]');
const title = quest.querySelector('[data-shadow-title]');
const replay = quest.querySelector('[data-shadow-replay]');
const play = quest.querySelector('[data-shadow-play]');
const save = quest.querySelector('[data-shadow-save]');
const status = quest.querySelector('[data-shadow-status]');
const caption = quest.querySelector('[data-shadow-caption]');
const buttons = [...quest.querySelectorAll('[data-shadow-move]')];
const slots = [...quest.querySelectorAll('[data-shadow-slot]')];
const labels = [...quest.querySelectorAll('[data-shadow-line]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const beatLength = 880;

const words = {
  cs: {
    title: 'Souboj se stínem',
    teaser: 'Tanečník pod lampou se sehne k botě. Jeho stín zůstane stát a kývne na tebe.',
    teaserAgain: 'Tanečník pořád zápasí s tkaničkou. Stín čeká na tvoji sestavu.',
    open: 'Vyzvat stín', edit: 'Změnit sestavu',
    sceneTitle: 'Tkanička proti stínu',
    instructions: 'Seřaď všechny tři pohyby. Druhým stiskem pohyb vyndáš a můžeš ho zařadit jinam.',
    order: 'Pořadí pohybů', play: 'Vyzkoušet sestavu', stop: 'Zastavit sestavu',
    save: 'Nechat sestavu stínu', replay: 'Nechat stín zatančit', close: 'Zavřít scénu',
    ready: 'Stín je připravený. Zkus sestavu nebo mu ji nech.',
    saved: 'Stín si tvé pořadí zapamatoval. Sestava je v Blackbooku.',
    tested: 'Teď můžeš sestavu nechat stínu.',
    done: 'Tanečník zvedne hlavu. „Počkej, to už bylo finále?“',
    interrupted: 'Stín se zastavil. Sestavu můžeš spustit znovu.',
    saveError: 'Sestavu se nepodařilo uložit. Zkus to znovu.',
    idle: 'Tanečník si dělá uzel. Stín už je na značce.',
    stepCue: 'Stín vykročí. Tanečník dotahuje první smyčku.',
    turnCue: 'Stín se otočí. Tanečník hledá konec druhé tkaničky.',
    freezeCue: 'Stín podrží Freeze. Tanečník pořád kouká na botu.',
  },
  en: {
    title: 'Shadow Battle',
    teaser: 'The dancer bends to tie a shoe. Their shadow stays upright under the lamp and nods to you.',
    teaserAgain: 'The dancer is still wrestling with the lace. Their shadow is waiting for your routine.',
    open: 'Challenge the shadow', edit: 'Change the routine',
    sceneTitle: 'A lace versus a shadow',
    instructions: 'Choose all three moves in order. Press a move again to take it out and put it somewhere else.',
    order: 'Move order', play: 'Try the routine', stop: 'Stop the routine',
    save: 'Leave the routine with the shadow', replay: 'Let the shadow dance', close: 'Close the scene',
    ready: 'The shadow is ready. Try the routine or leave it with them.',
    saved: 'The shadow remembers your order. The routine is in your Blackbook.',
    tested: 'You can now leave the routine with the shadow.',
    done: 'The dancer looks up. “Wait, was that the finale?”',
    interrupted: 'The shadow stopped. You can play the routine again.',
    saveError: 'Could not save the routine. Try again.',
    idle: 'The dancer ties a knot. The shadow is already on its mark.',
    stepCue: 'The shadow steps. The dancer tightens the first loop.',
    turnCue: 'The shadow turns. The dancer searches for the end of the other lace.',
    freezeCue: 'The shadow holds a freeze. The dancer is still looking down.',
  },
  fr: {
    title: 'Duel avec l’ombre',
    teaser: 'Le danseur se baisse pour faire son lacet. Sous le lampadaire, son ombre reste debout et te fait signe.',
    teaserAgain: 'Le danseur se bat toujours avec son lacet. Son ombre attend ton enchaînement.',
    open: 'Défier l’ombre', edit: 'Modifier l’enchaînement',
    sceneTitle: 'Un lacet contre une ombre',
    instructions: 'Choisis les trois mouvements dans l’ordre. Appuie de nouveau sur un mouvement pour le retirer et le replacer.',
    order: 'Ordre des mouvements', play: 'Essayer l’enchaînement', stop: 'Arrêter l’enchaînement',
    save: 'Confier l’enchaînement à l’ombre', replay: 'Faire danser l’ombre', close: 'Fermer la scène',
    ready: 'L’ombre est prête. Essaie ton enchaînement ou confie-le-lui.',
    saved: 'L’ombre a retenu ton ordre. L’enchaînement est dans ton Blackbook.',
    tested: 'Tu peux maintenant confier l’enchaînement à l’ombre.',
    done: 'Le danseur lève la tête. « Attends, c’était déjà le final ? »',
    interrupted: 'L’ombre s’est arrêtée. Tu peux relancer l’enchaînement.',
    saveError: 'Impossible d’enregistrer l’enchaînement. Réessaie.',
    idle: 'Le danseur fait son nœud. L’ombre est déjà en place.',
    stepCue: 'L’ombre fait un pas. Le danseur serre la première boucle.',
    turnCue: 'L’ombre tourne. Le danseur cherche le bout de l’autre lacet.',
    freezeCue: 'L’ombre tient le freeze. Le danseur regarde toujours sa chaussure.',
  },
};

let saved = readShadowRoutine();
let draft = [...(saved?.moves ?? [])];
let open = false;
let lastTrigger = opener;
let feedback = '';
let pose = 'idle';
let sceneRig;
let playback = null;
let frame = null;
let timer = null;

const shadowDraft = window.UAStoryState?.getDraft('breaking');
if (Array.isArray(shadowDraft?.moves) && shadowDraft.moves.length <= shadowMoves.length &&
  new Set(shadowDraft.moves).size === shadowDraft.moves.length && shadowDraft.moves.every(m => shadowMoves.includes(m))) draft = [...shadowDraft.moves];
window.UAStoryState?.register('breaking', {
  step: () => saved && sameOrder(saved.moves, draft) ? 'routine' : 'compose',
  open() {
    if (!readImprint()?.returned && !saved) return null;
    open = true;
    sceneRig ??= createShadowQuestRig(stage);
    paint();
    return this.step();
  },
  saveDraft() { window.UAStoryState.saveDraft('breaking', {moves:draft}); },
  target() { return title; },
  suspend,
});
function language() {
  const value = (window.CaisikI18n?.getLanguage?.() || document.documentElement.lang || 'cs').split('-')[0];
  return Object.hasOwn(words, value) ? value : 'cs';
}

function sameOrder(a, b) {
  return Boolean(a && b && a.length === b.length && a.every((move, index) => move === b[index]));
}

function text(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function paint() {
  const lang = language();
  const copy = words[lang];
  const moveCopy = shadowMoveLabels[lang];
  const unlocked = Boolean(readImprint()?.returned || saved);
  for (const label of labels) {
    const key = label.dataset.shadowLine;
    text(label, copy[key] ?? moveCopy[key] ?? label.textContent);
  }
  quest.hidden = !unlocked;
  panel.hidden = !open || !unlocked;
  opener.hidden = !panel.hidden;
  opener.setAttribute('aria-expanded', String(!panel.hidden));
  text(opener, copy[saved ? 'edit' : 'open']);
  text(quest.querySelector('[data-shadow-line="teaser"]'), copy[saved ? 'teaserAgain' : 'teaser']);
  replay.hidden = !saved || !panel.hidden;
  const complete = draft.length === shadowMoves.length;
  play.disabled = !playback && !complete;
  play.setAttribute('aria-pressed', String(Boolean(playback)));
  text(play, copy[playback ? 'stop' : 'play']);
  save.disabled = !complete || Boolean(playback);
  stage.dataset.shadowPose = pose;
  stage.toggleAttribute('data-performing', Boolean(playback));
  stage.toggleAttribute('data-remembered', Boolean(saved));
  for (const button of buttons) {
    button.disabled = Boolean(playback);
    button.setAttribute('aria-pressed', String(draft.includes(button.dataset.shadowMove)));
  }
  const sequence = playback?.moves ?? draft;
  slots.forEach((slot, index) => {
    const active = playback?.index === index;
    text(slot, moveCopy[sequence[index]] ?? '·');
    if (active) slot.setAttribute('aria-current', 'step');
    else slot.removeAttribute('aria-current');
  });
  text(caption, copy[pose === 'idle' ? 'idle' : playback ? pose + 'Cue' : 'done']);
  text(status, copy[feedback] ?? '');
}

function clearClock() {
  if (frame !== null) cancelAnimationFrame(frame);
  if (timer !== null) clearTimeout(timer);
  frame = null;
  timer = null;
}

function stop(message = '', retainPose = false) {
  clearClock();
  playback = null;
  if (!retainPose) pose = 'idle';
  feedback = message;
  sceneRig?.render(pose, 1, false);
  paint();
}

function animate() {
  const root = document.documentElement;
  return !reduced.matches && root.dataset.motion !== 'off' &&
    !['off', 'quiet', 'calm', 'reduced'].includes(root.dataset.selfmadeMotion) &&
    !document.body.classList.contains('simple-mode') && !document.body.classList.contains('exp-field') &&
    !document.querySelector('.culture-board.cb-field');
}

function tick(now) {
  frame = null;
  timer = null;
  if (!playback || document.hidden || !open) return;
  const elapsed = Math.max(0, now - playback.started);
  if (elapsed >= playback.moves.length * beatLength) {
    const result = playback.stored ? 'saved' : 'tested';
    stop(result, true);
    return;
  }
  const index = Math.floor(elapsed / beatLength);
  const moving = animate();
  if (index !== playback.index || moving !== playback.wasMoving) {
    playback.index = index;
    playback.wasMoving = moving;
    pose = playback.moves[index];
    paint();
    sceneRig?.render(pose, moving ? (elapsed % beatLength) / beatLength : 1, true);
  } else if (moving) {
    sceneRig?.render(pose, (elapsed % beatLength) / beatLength, true);
  }
  if (moving) frame = requestAnimationFrame(tick);
  else timer = setTimeout(() => tick(performance.now()), beatLength - elapsed % beatLength);
}

function playRoutine(moves, stored = false) {
  if (!open || moves.length !== shadowMoves.length) return;
  clearClock();
  feedback = '';
  stage.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  const started = performance.now();
  playback = { moves: [...moves], started, index: -1, stored, wasMoving: null };
  tick(started);
}

function land(element) {
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function enter(trigger) {
  if (quest.hidden) return;
  open = true;
  lastTrigger = trigger;
  sceneRig ??= createShadowQuestRig(stage);
  sceneRig?.render('idle', 1, false);
  paint();
  land(title);
}

function close() {
  if (window.UAStoryState?.closeTrail) { window.UAStoryState.closeTrail(); return; }
  open = false;
  stop();
  if (!quest.hidden) land(lastTrigger.hidden ? opener : lastTrigger);
}

opener.addEventListener('click', () => enter(opener));
replay.addEventListener('click', () => {
  if (!saved) return;
  draft = [...saved.moves];
  enter(replay);
  playRoutine(saved.moves, true);
});
quest.querySelector('[data-shadow-close]').addEventListener('click', close);
quest.addEventListener('keydown', event => {
  if (!open || event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
  event.preventDefault();
  close();
});

for (const button of buttons) {
  button.addEventListener('click', () => {
    if (playback) return;
    const move = button.dataset.shadowMove;
    draft = draft.includes(move) ? draft.filter(item => item !== move) : [...draft, move];
    stop(draft.length === shadowMoves.length ? 'ready' : '');
  });
}

play.addEventListener('click', () => {
  if (playback) stop('interrupted');
  else playRoutine(draft);
});
save.addEventListener('click', () => {
  if (playback || draft.length !== shadowMoves.length) return;
  const routine = { moves: [...draft] };
  const changed = !sameOrder(readShadowRoutine()?.moves, routine.moves);
  if (changed && !writeShadowRoutine(routine)) {
    feedback = 'saveError';
    paint();
    return;
  }
  saved = routine;
  if (changed) window.dispatchEvent(new Event(shadowRoutineEvent));
  playRoutine(routine.moves, true);
});

window.addEventListener(imprintEvent, paint);
window.addEventListener('caisik:languagechange', paint);
window.addEventListener('storage', event => {
  if (event.key === shadowRoutineKey || event.key === null) {
    const pristine = sameOrder(draft, saved?.moves) || !draft.length;
    saved = readShadowRoutine();
    if (pristine) draft = [...(saved?.moves ?? [])];
    feedback = '';
  }
  if (event.key !== shadowRoutineKey && event.key !== imprintKey && event.key !== null) return;
  if (!saved && !readImprint()?.returned) {
    open = false;
    stop();
  } else paint();
});
function suspend() { if (playback) stop('interrupted'); }
window.addEventListener('pagehide', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
document.addEventListener('focusin', event => { if (event.target.closest?.('dialog[open]')) suspend(); });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) suspend(); }).observe(stage);
}
paint();
