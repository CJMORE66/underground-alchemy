import { imprintEvent, imprintKey, imprintLength, readImprint } from './needle-imprint-store.js?v=1';
import { createMetroAudio } from './metro-quest-audio.js?v=1';

const quest = document.querySelector('[data-metro-quest]');
const root = document.documentElement;
const platform = quest.querySelector('[data-metro-platform]');
const reward = quest.querySelector('[data-metro-reward]');
const model = quest.querySelector('[data-metro-model]');
const modelText = quest.querySelector('[data-metro-model-text]');
const modelSlots = [...model.children];
const answerSlots = [...quest.querySelectorAll('[data-metro-answer]')];
const pads = [...quest.querySelectorAll('[data-metro-pad]')];
const opener = quest.querySelector('[data-metro-open]');
const cue = quest.querySelector('[data-metro-cue]');
const goBack = quest.querySelector('[data-metro-return]');
const close = quest.querySelector('[data-metro-close]');
const soundToggles = [...quest.querySelectorAll('[data-metro-sound]')];
const status = quest.querySelector('[data-metro-status]');
const mix = quest.querySelector('[data-metro-mix]');
const mixPattern = quest.querySelector('[data-metro-mix-pattern]');
const mixStatus = quest.querySelector('[data-metro-mix-status]');
const verseBeat = platform.querySelector('[data-revizor-beat]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const cueNotes = ['low', 'high', 'low', 'low'];
const noteSymbols = { low: '●', high: '◆' };
const saveKey = 'caisik-metro-dj-v1';
const soundKey = 'caisik-needle-street-sound-v1';
const soundEvent = 'caisik:story-sound-change';
const mixSlots = Array.from({ length: cueNotes.length + imprintLength }, () => {
  const slot = document.createElement('span');
  return mixPattern.appendChild(slot);
});

const copy = {
  cs: {
    setting: 'Paříž · herní fikce',
    entryTitle: 'Poslední metro má swing',
    entryCopy: 'Z mříže pod oknem II se ozvou čtyři rány. Pouliční DJ odloží sluchátka. „Dveře mají přechod. Já mám jenom průvan.“',
    open: 'Sejít na nástupiště', revisit: 'Vrátit se na nástupiště',
    mix: 'Pustit DJův přechod',
    mixCopy: 'DJ roztočí desku. „První půlka metro, druhá tvoje okno. Konečně mi někdo dělá předskokana.“',
    platformTitle: 'Na nástupišti',
    platformCopy: 'DJ přitiskne rekordér ke dveřím. „Tři pokusy a mám jen vlastní kašel.“ Pusť vzor dveří a zopakuj čtyři údery na padech.',
    cue: 'Přehrát dveře', low: 'Dun', high: 'Cvak', sound: 'Zvuk scény',
    back: 'Zpátky do ulice', return: 'Zpátky k DJovi',
    waiting: 'Spusť vzor dveří.',
    ready: 'Teď ho zopakuj na dvou padech.',
    tryAgain: 'Dveře ucukly. „Mají vlastní názor,“ říká DJ. Zkus znovu od prvního úderu.',
    solved: 'Dveře se otevřou. DJ zachytí poslední úder a kývne směrem k ulici.',
    saveError: 'Přechod se nepodařilo uložit. Zkus vzor ještě jednou.',
    mixPlaying: 'DJ přehrává dveře a tvůj rytmus z okna II.',
    rest: 'pauza', pattern: 'Vzor dveří', response: 'Tvoje údery', transition: 'Dveře a tvůj rytmus',
  },
  en: {
    setting: 'Paris · game fiction',
    entryTitle: 'The last train swings',
    entryCopy: 'Four knocks rise through the grate under window II. The street DJ takes off their headphones. “The doors have a transition. All I have is a draft.”',
    open: 'Go down to the platform', revisit: 'Return to the platform',
    mix: 'Play the DJ’s transition',
    mixCopy: 'The DJ spins the record. “First half the metro, second half your window. Finally, an opening act.”',
    platformTitle: 'On the platform',
    platformCopy: 'The DJ holds their recorder up to the door. “Three takes, and all I got was my own cough.” Play the door pattern, then copy the four hits on the pads.',
    cue: 'Play the doors', low: 'Thump', high: 'Click', sound: 'Scene sound',
    back: 'Back to the street', return: 'Back to the DJ',
    waiting: 'Play the door pattern.',
    ready: 'Now play it back on the two pads.',
    tryAgain: 'The doors jerk back. “They have their own opinions,” says the DJ. Try again from the first hit.',
    solved: 'The doors open. The DJ catches the last hit and nods toward the street.',
    saveError: 'The transition could not be saved. Try the pattern again.',
    mixPlaying: 'The DJ is playing the doors and your rhythm from window II.',
    rest: 'rest', pattern: 'Door pattern', response: 'Your hits', transition: 'The doors and your rhythm',
  },
  fr: {
    setting: 'Paris · fiction du jeu',
    entryTitle: 'Le dernier métro a du swing',
    entryCopy: 'Quatre coups remontent de la grille sous la fenêtre II. Le DJ de rue retire son casque. « Les portes ont une transition. Moi, j’ai un courant d’air. »',
    open: 'Descendre sur le quai', revisit: 'Retourner sur le quai',
    mix: 'Écouter la transition du DJ',
    mixCopy: 'Le DJ lance le disque. « D’abord le métro, puis ta fenêtre. J’ai enfin une première partie. »',
    platformTitle: 'Sur le quai',
    platformCopy: 'Le DJ approche son enregistreur de la porte. « Trois prises et j’ai juste ma propre toux. » Lance le motif, puis reproduis les quatre coups sur les pads.',
    cue: 'Écouter les portes', low: 'Boum', high: 'Clac', sound: 'Son de la scène',
    back: 'Retour à la rue', return: 'Retour auprès du DJ',
    waiting: 'Lance le motif des portes.',
    ready: 'À toi de le rejouer sur les deux pads.',
    tryAgain: 'Les portes reculent. « Elles ont leur avis », dit le DJ. Reprends au premier coup.',
    solved: 'Les portes s’ouvrent. Le DJ attrape le dernier coup et fait signe vers la rue.',
    saveError: 'Impossible de sauvegarder la transition. Rejoue le motif.',
    mixPlaying: 'Le DJ joue les portes et ton rythme de la fenêtre II.',
    rest: 'silence', pattern: 'Motif des portes', response: 'Tes coups', transition: 'Les portes et ton rythme',
  },
};

function words() {
  const language = (window.CaisikI18n?.getLanguage?.() || root.lang || 'cs').split('-')[0];
  return copy[language] || copy.cs;
}

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function readReward() {
  try {
    const saved = JSON.parse(read(saveKey));
    if (!Array.isArray(saved?.steps) || saved.steps.length !== imprintLength) return null;
    if (!saved.steps.every(step => typeof step === 'boolean') || !saved.steps.includes(true)) return null;
    return saved;
  } catch { return null; }
}

function saveReward(imprint) {
  const saved = { steps: imprint.steps.slice() };
  try {
    localStorage.setItem(saveKey, JSON.stringify(saved));
    return saved;
  } catch { return null; }
}

let saved = readReward();
let unlocked = Boolean(readImprint()?.returned || saved);
let soundOn = read(soundKey) === 'on';
let open = false;
let heardCue = false;
let answer = [];
let feedback = '';
let playing = null;

const audio = createMetroAudio({
  soundEnabled: () => soundOn,
  onStep(index, note) {
    if (!motionAllowed()) return clearPulse();
    const slots = playing === 'mix' ? mixSlots : playing === 'cue' ? modelSlots : [];
    slots.forEach((slot, position) => slot.classList.toggle('is-current', position === index));
    if (playing === 'verse') verseBeat.setAttribute('data-beat-hit', note ?? 'rest');
    platform.classList.toggle('is-pulse', playing !== 'mix' && Boolean(note));
  },
  onDone() { finishPlayback(); },
});

function motionAllowed() {
  return !document.hidden && !reduced.matches && root.dataset.motion !== 'off' &&
    !['quiet', 'calm', 'off', 'reduced'].includes(root.dataset.selfmadeMotion) &&
    !document.body.matches('.simple-mode,.exp-field') && !document.querySelector('.culture-board.cb-field');
}

function clearPulse() {
  for (const slot of [...mixSlots, ...modelSlots]) slot.classList.remove('is-current');
  platform.classList.remove('is-pulse');
  verseBeat.removeAttribute('data-beat-hit');
}

function finishPlayback() {
  playing = null;
  verseBeat.setAttribute('aria-pressed', 'false');
  clearPulse();
  if (mixStatus.textContent) mixStatus.textContent = '';
}

function stopPlayback() {
  audio.stop();
  finishPlayback();
}

function playSequence(sequence, mode) {
  stopPlayback();
  window.dispatchEvent(new Event('caisik:metro-playback'));
  playing = mode;
  if (mode === 'mix') mixStatus.textContent = words().mixPlaying;
  if (mode === 'verse') verseBeat.setAttribute('aria-pressed', 'true');
  audio.play(sequence);
}

function mixNotes() {
  return [...cueNotes, ...(saved?.steps ?? []).map(hit => hit ? 'low' : null)];
}

function paint() {
  const text = words();
  for (const element of quest.querySelectorAll('[data-metro-line]')) {
    element.textContent = text[element.dataset.metroLine];
  }
  quest.hidden = !unlocked;
  platform.hidden = !open;
  reward.hidden = open || !saved;
  opener.hidden = open;
  opener.setAttribute('aria-expanded', String(open));
  if (saved) opener.textContent = text.revisit;
  platform.toggleAttribute('data-gate-open', !!saved);
  cue.hidden = !!saved;
  close.hidden = !!saved;
  goBack.hidden = !saved;
  model.hidden = !(heardCue || saved);
  modelText.textContent = model.hidden ? '' : text.pattern + ' · ' + cueNotes.map(note => text[note]).join(', ');
  modelSlots.forEach((slot, index) => {
    const note = cueNotes[index];
    slot.textContent = noteSymbols[note];
    slot.dataset.note = note;
  });
  for (const pad of pads) pad.disabled = !heardCue || !!saved;
  const shownAnswer = saved ? cueNotes : answer;
  answerSlots.forEach((slot, index) => {
    const note = shownAnswer[index];
    slot.textContent = noteSymbols[note] ?? '·';
    slot.dataset.note = note ?? '';
  });
  quest.querySelector('[data-metro-answer-group]').setAttribute('aria-label', text.response + ' · ' +
    answerSlots.map((_, index) => text[shownAnswer[index] ?? 'rest']).join(', '));
  for (const toggle of soundToggles) toggle.setAttribute('aria-pressed', String(soundOn));
  const nextStatus = saved ? text.solved : text[feedback || (heardCue ? 'ready' : 'waiting')] || feedback;
  if (status.textContent !== nextStatus) status.textContent = nextStatus;
  if (saved) {
    const sequence = mixNotes();
    mixPattern.setAttribute('aria-label', text.transition + ' · ' + sequence.map(note => text[note ?? 'rest']).join(', '));
    mixSlots.forEach((slot, index) => {
      const note = sequence[index];
      slot.textContent = noteSymbols[note] ?? '·';
      slot.dataset.note = note ?? '';
    });
  }
  window.dispatchEvent(new Event('caisik:metro-state'));
}

function focusInScene(element, scrollTarget = element) {
  element.focus({ preventScroll: true });
  scrollTarget.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function leavePlatform() {
  stopPlayback();
  open = false;
  heardCue = false;
  answer = [];
  feedback = '';
  paint();
  focusInScene(saved ? mix : opener, saved ? reward : quest);
}

opener.addEventListener('click', () => {
  if (!unlocked) return;
  stopPlayback();
  open = true;
  paint();
  focusInScene(platform.querySelector('[data-metro-platform-title]'));
});
close.addEventListener('click', leavePlatform);
goBack.addEventListener('click', leavePlatform);
platform.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || !open) return;
  event.preventDefault();
  leavePlatform();
});

cue.addEventListener('click', () => {
  if (!open || saved) return;
  heardCue = true;
  answer = [];
  feedback = '';
  paint();
  playSequence(cueNotes, 'cue');
});
for (const pad of pads) pad.addEventListener('click', () => {
  if (!open || !heardCue || saved) return;
  const note = pad.dataset.metroPad;
  const index = answer.length;
  answer.push(note);
  if (note !== cueNotes[index]) {
    answer = [];
    feedback = 'tryAgain';
  } else if (answer.length === cueNotes.length) {
    const imprint = readImprint();
    saved = readReward() || (imprint?.returned ? saveReward(imprint) : null);
    if (!saved) {
      answer = [];
      feedback = 'saveError';
    }
  } else {
    feedback = String(answer.length) + ' / ' + cueNotes.length;
  }
  paint();
  playSequence([note], 'pad');
  if (saved) focusInScene(goBack, platform.querySelector('[data-metro-platform-title]'));
});

mix.addEventListener('click', () => {
  if (saved && !open) playSequence(mixNotes(), 'mix');
});
verseBeat.addEventListener('click', () => {
  if (!saved || !open || verseBeat.closest('[data-revizor-panel]').hidden) return;
  if (playing === 'verse') stopPlayback();
  else playSequence(mixNotes(), 'verse');
});
window.addEventListener('caisik:revizor-close', () => {
  if (playing === 'verse') stopPlayback();
});
function toggleSound() {
  soundOn = !soundOn;
  try { localStorage.setItem(soundKey, soundOn ? 'on' : 'off'); } catch { /* This visit still has sound controls. */ }
  window.dispatchEvent(new window.CustomEvent(soundEvent, { detail: soundOn }));
}
for (const toggle of soundToggles) toggle.addEventListener('click', toggleSound);
window.addEventListener(soundEvent, event => {
  soundOn = event.detail === true;
  if (!soundOn) stopPlayback();
  paint();
});
window.addEventListener('caisik:needle-playback', stopPlayback);
window.addEventListener('caisik:languagechange', paint);

function refreshProgress() {
  saved = readReward();
  unlocked = Boolean(readImprint()?.returned || saved);
  if (!unlocked) {
    open = false;
    stopPlayback();
  }
  paint();
}
window.addEventListener(imprintEvent, refreshProgress);
window.addEventListener('storage', event => {
  if (event.key === saveKey || event.key === imprintKey || event.key === null) refreshProgress();
  if (event.key === soundKey || event.key === null) {
    soundOn = read(soundKey) === 'on';
    if (!soundOn) stopPlayback();
    paint();
  }
});
window.addEventListener('pagehide', stopPlayback);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stopPlayback(); }).observe(quest);
}
paint();
