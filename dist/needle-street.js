import { imprintEvent, imprintKey, imprintLength, readImprint, writeImprint } from './needle-imprint-store.js?v=1';

const scene = document.querySelector('#needle-street');
const play = scene.querySelector('[data-play]');
const windows = [...scene.querySelectorAll('[data-window]')];
const deck = scene.querySelector('[data-deck]');
const record = scene.querySelector('[data-record]');
const rewind = scene.querySelector('[data-rewind]');
const back = scene.querySelector('[data-back]');
const courier = scene.querySelector('[data-courier]');
const sound = scene.querySelector('[data-needle-sound]');
const result = scene.querySelector('[data-result]');
const follow = scene.querySelector('[data-follow]');
const fork = scene.querySelector('[data-fork]');
const routeButtons = [...fork.querySelectorAll('[data-route]')];
const branches = [...fork.querySelectorAll('[data-branch]')];
const markButtons = [...fork.querySelectorAll('[data-mark]')];
const padButtons = [...fork.querySelectorAll('[data-pad]')];
const routeBack = fork.querySelector('[data-route-back]');
const routeResult = fork.querySelector('[data-route-result]');
const echo = fork.querySelector('[data-echo]');
const yard = fork.querySelector('[data-yard]');
const yardMessage = yard.querySelector('[data-yard-message]');
const yardMark = yard.querySelector('[data-yard-mark]');
const editor = fork.querySelector('[data-imprint-editor]');
const stepButtons = [...editor.querySelectorAll('[data-imprint-step]')];
const previewImprint = editor.querySelector('[data-imprint-preview]');
const imprintSound = editor.querySelector('[data-imprint-sound]');
const saveImprint = editor.querySelector('[data-imprint-save]');
const returnImprint = editor.querySelector('[data-imprint-return]');
const editorStatus = editor.querySelector('[data-imprint-status]');
const windowMark = windows[1].querySelector('[data-imprint-window-mark]');
const windowCaption = scene.querySelector('[data-imprint-street-status]');
const windowSteps = stepButtons.map(() => windowMark.appendChild(document.createElement('i')));
const poster = fork.querySelector('[data-alt]');
const root = document.documentElement;
const diamondKey = 'caisik-needle-street-v1';
const carrierKey = 'caisik-needle-carrier-v1';
const soundKey = 'caisik-needle-street-sound-v1';
const soundEvent = 'caisik:story-sound-change';
const progressKey = 'caisik-needle-fork-v1';
const routes = ['stairs', 'wall'];
const rhythm = ['short', 'long', 'long'];
const padSounds = { short: [0, 0.16], long: [0.68, 1.31] };
const padMarks = { short: '●', long: '━' };
const windowNames = ['I', 'II', 'III'];
const steps = Number(rewind.max);
const duration = 1.36;
const lateMs = duration * 500;
const stepSeconds = duration / 4;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const lines = {
  cs: {
    location: 'PAŘÍŽ / HERNÍ FIKCE', title: 'Jehla přeskočila.',
    setup: 'Alchymista zvedne hlavu od desky. „Třetí patro má zase vlastní tempo.“',
    goal: 'Pusť takt a klepni na okno, které se rozsvítí až po ostatních.',
    play: 'Pustit takt', again: 'Zopakovat takt', window: 'Okno', sound: 'Zvuk desky',
    clue: 'I a III svítí spolu. II se rozsvítí o dobu později.',
    miss: 'Za sklem někdo počítá přesně do čtyř. Zkus jiné okno.',
    found: 'V okně II se mihne bedna s dvojitým kosočtvercem. Zkus vrátit desku, než zmizí po schodech.',
    rewind: 'Přetoč desku zpět', rewindHelp: 'Táhni doleva nebo použij šipky.',
    back: 'Vrátit celý úsek', past: 'Začátek úseku', present: 'Konec úseku',
    carrier: 'Stříbrné rukavice sevřou bednu. Kurýr s ní mizí po schodech. „A já už myslel, že bedny začaly chodit samy.“',
    saved: 'V okně II jsi zahlédl kurýra ve stříbrných rukavicích a bednu se dvěma kosočtverci.',
    follow: 'Po stopě kurýra', forkTitle: 'Kudy zmizel kurýr?',
    forkSetup: 'Zespodu se ozve zaklepání. Dvojitý kosočtverec je i na zdi u průjezdu.',
    stairs: 'Za zvukem po schodech', wall: 'Za značkou do průjezdu', routeBack: 'Zpátky ke stopám', streetBack: 'Zpátky do ulice',
    stairsTitle: 'Dveře slyší rytmus',
    stairsSetup: 'Dveře zaklapnou. Zevnitř se ozve kurýr: „Jedno krátké, dvě dlouhá. To si pamatuje i moje bedna.“',
    model: 'Vzor', sequence: 'Krátké, dlouhé, dlouhé', short: '● Krátké', long: '━ Dlouhé',
    tapShort: 'Krátké klepnutí', tapLong: 'Dlouhé klepnutí',
    wrongRhythm: 'Zámek cvakl naprázdno. Zkus celý rytmus od začátku.',
    wallTitle: 'Značka na cihle',
    wallSetup: 'Pod dvojitým kosočtvercem někdo přetáhl část značky černou. Na starém plakátu TRANSMUTE najdeš oba krajní hroty. Kterým směrem míří?',
    artAlt: 'TRANSMUTE od CAISIK. Levý krajní hrot míří doleva a pravý doprava.',
    markLeft: '← ← Oba doleva', markOut: '← → Od sebe', markIn: '→ ← K sobě',
    wrongMark: 'Tahle značka nesedí. Podívej se na oba okraje nápisu.',
    yardTitle: 'Vnitřní dvůr', arrived: 'Cesta na dvůr se otevřela.',
    stairsYard: 'Zámek zopakuje tvůj rytmus a povolí. Na dvoře kurýr odloží bednu. „No vidíš. Zvonku jsem ještě nedal lekci.“',
    wallYard: 'Krajní šipky sedí. Jedna ukazuje na petlici ve stínu. Otevřeš průjezd a na stejném dvoře najdeš kurýra i bednu.',
    imprintTitle: 'Rytmus na parapetu',
    imprintSound: 'Zvuk rytmu',
    imprintSetup: 'Kurýr nadzvedne víko bedny. „Gramofon je nahoře. Na parapet ale dosáhnu.“ Vyber, kde má rytmus zaznít. Prázdná políčka jsou pauzy.',
    imprintPreview: 'Zkusit rytmus', imprintSave: 'Uložit do Blackbooku', imprintReturn: 'Vrátit se k oknu II',
    imprintStep: 'Doba', imprintSaved: 'Rytmus je v Blackbooku.', imprintError: 'Rytmus se nepodařilo uložit. Zkus to znovu.',
    imprintPlaying: 'Přehrává se rytmus.', imprintWindow: 'Okno II, přehrát tvůj rytmus',
    imprintEnding: 'V okně II bliká tvoje fráze. „Slyšíš, co dělají ty mezery? Před chvílí šlo celý patro spát. Teď čeká na tvůj další úder.“',
    yardAgain: 'Vrátit se na dvůr',
  },
  en: {
    location: 'PARIS / GAME FICTION', title: 'The needle skipped.',
    setup: 'The Alchemist looks up from his record. “Third floor is on its own time again.”',
    goal: 'Play the bar and tap the window that lights up late.',
    play: 'Play the bar', again: 'Replay the bar', window: 'Window', sound: 'Record sound',
    clue: 'I and III light up together. II follows a beat later.',
    miss: 'Someone behind the glass counts a perfect four. Try another window.',
    found: 'A crate marked with a double diamond crosses window II. Rewind before it vanishes down the stairs.',
    rewind: 'Rewind the record', rewindHelp: 'Drag left or use the arrow keys.',
    back: 'Rewind the whole clip', past: 'Start of clip', present: 'End of clip',
    carrier: 'Two silver gloves grip the crate. The courier disappears down the stairs. “And here I was thinking crates had learned to walk.”',
    saved: 'In window II you spotted a courier in silver gloves carrying the double-diamond crate.',
    follow: 'Follow the courier', forkTitle: 'Which way did the courier go?',
    forkSetup: 'A knock comes from below. The same double diamond is on the wall by the passage.',
    stairs: 'Follow the sound downstairs', wall: 'Follow the mark into the passage', routeBack: 'Back to the leads', streetBack: 'Back to the street',
    stairsTitle: 'The door listens for a beat',
    stairsSetup: 'The door slams. The courier calls from inside: “One short, two long. Even my crate remembers that.”',
    model: 'Pattern', sequence: 'Short, long, long', short: '● Short', long: '━ Long',
    tapShort: 'Short knock', tapLong: 'Long knock',
    wrongRhythm: 'The lock clicks but stays shut. Try the whole pattern again.',
    wallTitle: 'The mark on the brick',
    wallSetup: 'Someone blacked out part of the sign under the double diamond. Find the two outer arrowheads in the old TRANSMUTE poster. Which way do they point?',
    artAlt: 'TRANSMUTE by CAISIK. The leftmost arrowhead points left and the rightmost one points right.',
    markLeft: '← ← Both left', markOut: '← → Apart', markIn: '→ ← Toward each other',
    wrongMark: 'That mark does not fit. Look at both edges of the lettering.',
    yardTitle: 'The courtyard', arrived: 'The way into the courtyard is open.',
    stairsYard: 'The lock echoes your rhythm and gives. In the courtyard, the courier sets down the crate. “See? The doorbell has not had its first lesson yet.”',
    wallYard: 'The outer arrows match. One points to a latch in the shadows. You open the passage and find the courier and the crate in the same courtyard.',
    imprintTitle: 'A beat on the windowsill',
    imprintSound: 'Rhythm sound',
    imprintSetup: 'The courier lifts the crate lid. “The turntable’s upstairs. I can still reach the sill.” Pick the beats you want to hear. Empty pads are rests.',
    imprintPreview: 'Try the rhythm', imprintSave: 'Save to Blackbook', imprintReturn: 'Return to window II',
    imprintStep: 'Beat', imprintSaved: 'Your rhythm is in the Blackbook.', imprintError: 'The rhythm could not be saved. Try again.',
    imprintPlaying: 'Playing the rhythm.', imprintWindow: 'Window II, play your rhythm',
    imprintEnding: 'Your beats light up on the third floor. The Alchemist nods. “Now I know who’s keeping the neighbors awake.”',
    yardAgain: 'Return to the courtyard',
  },
  fr: {
    location: 'PARIS / FICTION DU JEU', title: 'Le diamant a sauté.',
    setup: 'L’Alchimiste lève les yeux de son disque. « Le troisième étage a encore son propre tempo. »',
    goal: 'Lance la mesure et touche la fenêtre qui s’allume en retard.',
    play: 'Lancer la mesure', again: 'Rejouer la mesure', window: 'Fenêtre', sound: 'Son du disque',
    clue: 'I et III s’allument ensemble. II arrive un temps plus tard.',
    miss: 'Derrière la vitre, quelqu’un compte quatre temps bien réguliers. Essaie une autre fenêtre.',
    found: 'Une caisse au double losange passe devant la fenêtre II. Remonte le disque avant qu’elle ne disparaisse dans l’escalier.',
    rewind: 'Remonte le disque', rewindHelp: 'Glisse vers la gauche ou utilise les flèches.',
    back: 'Revenir au début du passage', past: 'Début du passage', present: 'Fin du passage',
    carrier: 'Deux gants argentés agrippent la caisse. Le coursier disparaît dans l’escalier. « Et moi qui croyais que les caisses avaient appris à marcher. »',
    saved: 'À la fenêtre II, tu as aperçu un coursier aux gants argentés avec la caisse au double losange.',
    follow: 'Suivre le coursier', forkTitle: 'Par où est passé le coursier ?',
    forkSetup: 'On frappe en bas. Le même double losange figure sur le mur près du passage.',
    stairs: 'Suivre le bruit dans l’escalier', wall: 'Suivre la marque dans le passage', routeBack: 'Revenir aux pistes', streetBack: 'Revenir dans la rue',
    stairsTitle: 'La porte écoute le rythme',
    stairsSetup: 'La porte claque. Le coursier lance de l’intérieur : « Un coup court, deux longs. Même ma caisse s’en souvient. »',
    model: 'Motif', sequence: 'Court, long, long', short: '● Court', long: '━ Long',
    tapShort: 'Coup court', tapLong: 'Coup long',
    wrongRhythm: 'La serrure claque sans s’ouvrir. Reprends le rythme depuis le début.',
    wallTitle: 'La marque sur la brique',
    wallSetup: 'Sous le double losange, une partie de la marque a été recouverte de noir. Repère les deux pointes extérieures sur la vieille affiche TRANSMUTE. Dans quel sens vont-elles ?',
    artAlt: 'TRANSMUTE de CAISIK. La pointe tout à gauche va vers la gauche et celle tout à droite vers la droite.',
    markLeft: '← ← Toutes deux à gauche', markOut: '← → Vers l’extérieur', markIn: '→ ← L’une vers l’autre',
    wrongMark: 'La marque ne correspond pas. Regarde les deux bords du lettrage.',
    yardTitle: 'La cour intérieure', arrived: 'Le passage vers la cour est ouvert.',
    stairsYard: 'La serrure répète ton rythme et cède. Dans la cour, le coursier pose la caisse. « Tu vois ? La sonnette n’a pas encore eu sa première leçon. »',
    wallYard: 'Les pointes extérieures correspondent. L’une indique un loquet dans l’ombre. Tu ouvres le passage et retrouves le coursier et la caisse dans la même cour.',
    imprintTitle: 'Un rythme sur le rebord',
    imprintSound: 'Son du rythme',
    imprintSetup: 'Le coursier soulève le couvercle. « La platine est à l’étage. Le rebord, lui, est à ma portée. » Choisis les temps que tu veux jouer. Les cases vides sont des silences.',
    imprintPreview: 'Essayer le rythme', imprintSave: 'Sauvegarder dans le Blackbook', imprintReturn: 'Revenir à la fenêtre II',
    imprintStep: 'Temps', imprintSaved: 'Ton rythme est dans le Blackbook.', imprintError: 'Impossible de sauvegarder le rythme. Réessaie.',
    imprintPlaying: 'Le rythme est en cours de lecture.', imprintWindow: 'Fenêtre II, jouer ton rythme',
    imprintEnding: 'Tes temps s’allument au troisième étage. L’Alchimiste hoche la tête. « Je sais qui empêche les voisins de dormir. »',
    yardAgain: 'Retourner dans la cour',
  },
};

function read(key) {
  try { return (window.UAStoryState?.storage ?? localStorage).getItem(key); } catch { return null; }
}
function save(key, value) {
  try { (window.UAStoryState?.storage ?? localStorage).setItem(key, value); } catch { /* Keep the current run playable. */ }
}

function readProgress() {
  try {
    const stored = JSON.parse(read(progressKey));
    if (stored) {
      const route = routes.includes(stored.route) ? stored.route : null;
      const completed = routes.filter(item => Array.isArray(stored.completed) && stored.completed.includes(item));
      const legacyView = route ? (completed.includes(route) ? 'yard' : 'route') : 'street';
      let view = ['street', 'fork', 'route', 'yard'].includes(stored.view) ? stored.view : legacyView;
      if (!route && (view === 'route' || view === 'yard')) view = 'fork';
      if (view === 'yard' && !completed.includes(route)) view = 'route';
      return { route, completed, view };
    }
  } catch { /* A damaged save must not block the chapter. */ }
  return { route: null, completed: [], view: 'street' };
}

const progress = readProgress();
const currentRoute = () => progress.view === 'route' || progress.view === 'yard' ? progress.route : null;
const completedRoute = () => progress.completed.includes(progress.route) ? progress.route : progress.completed[0];
const emptyImprint = () => Array(imprintLength).fill(false);
const sameSteps = (first, second) => !!second && first.every((hit, index) => hit === second[index]);
let imprint = readImprint();
let draft = imprint?.steps.slice() ?? emptyImprint();
let imprintMessage = '';
let strikes = [];
let feedback = '';
let lastPad = '';

let spotted = read(carrierKey) === 'silver-gloves';
let solved = spotted || read(diamondKey) === 'diamond';
let soundOn = read(soundKey) === 'on';
let message = imprint?.returned ? 'imprintEnding' : spotted ? 'saved' : solved ? 'found' : '';
let observed = solved;
let played = false;
let timer;
let barAttempt = 0;
let position = steps;
const streetDraft = window.UAStoryState?.getDraft('needle');
if (streetDraft) {
  if (Array.isArray(streetDraft.steps) && streetDraft.steps.length === imprintLength && streetDraft.steps.every(v => typeof v === 'boolean')) draft = streetDraft.steps.slice();
  if (Number.isInteger(streetDraft.position)) position = Math.min(steps, Math.max(0, streetDraft.position));
  if (progress.route === 'stairs' && Array.isArray(streetDraft.strikes) && streetDraft.strikes.length < rhythm.length && streetDraft.strikes.every(v => v === 'short' || v === 'long')) strikes = [...streetDraft.strikes];
  if (streetDraft.heard) { played = true; observed = true; if (!solved) message = 'clue'; }
}
let context;
let recording;
const voices = new Set();
let rhythmFrame;
let audioRequest = 0;

function paint() {
  const lang = (window.CaisikI18n?.getLanguage?.() || root.lang || 'cs').split('-')[0];
  const text = lines[lang] || lines.cs;
  scene.querySelectorAll('[data-line]').forEach(element => { element.textContent = text[element.dataset.line]; });
  if (played || solved) play.textContent = text.again;
  windows.forEach((button, index) => {
    button.disabled = !observed;
    button.setAttribute('aria-label', index === 1 && imprint?.returned
      ? text.imprintWindow : text.window + ' ' + windowNames[index]);
    button.classList.toggle('found', solved && index === 1);
  });
  sound.setAttribute('aria-pressed', String(soundOn));
  imprintSound.setAttribute('aria-pressed', String(soundOn));
  deck.hidden = !solved;
  rewind.value = position;
  rewind.setAttribute('aria-valuetext', position === 0 ? text.past : position === steps ? text.present : Math.round(100 * position / steps) + ' %');
  record.style.setProperty('--record-turn', position * 26 + 'deg');
  courier.hidden = position > 2;
  courier.style.setProperty('--courier-step', position);
  const streetMessage = message === 'imprintEnding' ? '' : text[message] || '';
  if (result.textContent !== streetMessage) result.textContent = streetMessage;
  paintFork(text);
  paintImprint(text);
}

function paintFork(text) {
  const active = spotted ? currentRoute() : null;
  follow.hidden = !spotted;
  fork.hidden = !spotted || progress.view === 'street';
  follow.setAttribute('aria-expanded', String(!fork.hidden));
  follow.textContent = fork.hidden ? text[completedRoute() ? 'yardAgain' : 'follow'] : text.streetBack;
  routeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.route === active)));
  branches.forEach(branch => { branch.hidden = progress.view !== 'route' || branch.dataset.branch !== active; });
  poster.alt = text[poster.dataset.alt];
  echo.textContent = strikes.map(strike => padMarks[strike]).join(' ');
  routeBack.hidden = fork.hidden;
  routeBack.textContent = active ? text.routeBack : text.streetBack;
  yard.hidden = !active || progress.view !== 'yard';
  yardMessage.textContent = yard.hidden ? '' : text[active + 'Yard'];
  yardMark.textContent = active === 'stairs' ? rhythm.map(strike => padMarks[strike]).join(' ') : '← ◇◇ →';
  const status = lastPad ? text[lastPad === 'short' ? 'tapShort' : 'tapLong'] + ' · ' + strikes.length + ' / 3' : text[feedback] || '';
  if (routeResult.textContent !== status) routeResult.textContent = status;
}

function paintImprint(text) {
  editor.hidden = yard.hidden;
  const saved = sameSteps(draft, imprint?.steps);
  const hasBeats = draft.some(Boolean);
  stepButtons.forEach((button, index) => {
    button.setAttribute('aria-label', `${text.imprintStep} ${index + 1}`);
    button.setAttribute('aria-pressed', String(draft[index]));
    windowSteps[index].classList.toggle('is-on', !!imprint?.steps[index]);
  });
  previewImprint.disabled = !hasBeats;
  saveImprint.disabled = !hasBeats;
  returnImprint.hidden = !saved;
  windowMark.hidden = !imprint?.returned;
  windowCaption.hidden = !imprint?.returned;
  if (windowCaption.textContent !== text.imprintEnding) windowCaption.textContent = text.imprintEnding;
  const status = text[imprintMessage] || (saved ? text.imprintSaved : '');
  if (editorStatus.textContent !== status) editorStatus.textContent = status;
}

function saveRhythm(next) {
  if (!writeImprint(next)) {
    imprintMessage = 'imprintError';
    paint();
    return false;
  }
  imprint = next;
  imprintMessage = 'imprintSaved';
  paint();
  window.dispatchEvent(new Event(imprintEvent));
  return true;
}

function returnWithRhythm() {
  if (editor.hidden) return;
  const latest = readImprint();
  if (!sameSteps(draft, latest?.steps)) return;
  if (!saveRhythm({ steps: latest.steps, returned: true })) return;
  clearTimeout(timer);
  ++barAttempt;
  observed = true;
  position = steps;
  windows.forEach(button => button.classList.remove('lit'));
  message = 'imprintEnding';
  showPanel('street', progress.route, windows[1]);
  void playRhythm(imprint.steps, true);
}

stepButtons.forEach((button, index) => button.addEventListener('click', () => {
  if (editor.hidden) return;
  stopAudio();
  draft[index] = !draft[index];
  imprintMessage = '';
  paint();
}));
previewImprint.addEventListener('click', () => {
  if (editor.hidden || !draft.some(Boolean)) return;
  void playRhythm(draft.slice(), false);
});
saveImprint.addEventListener('click', () => {
  if (editor.hidden || !draft.some(Boolean)) return;
  const latest = readImprint();
  saveRhythm({ steps: draft.slice(), returned: !!latest?.returned && sameSteps(draft, latest.steps) });
});
returnImprint.addEventListener('click', returnWithRhythm);

function persistProgress() {
  const stored = readProgress();
  progress.completed = routes.filter(item => progress.completed.includes(item) || stored.completed.includes(item));
  save(progressKey, JSON.stringify(progress));
}

function needleStep() {
  if (progress.view === 'yard' && spotted) return sameSteps(draft, imprint?.steps) && !imprint.returned ? 'return' : 'rhythm';
  if (progress.view === 'route' && spotted) return progress.route;
  if (progress.view === 'fork' && spotted) return 'fork';
  if (imprint?.returned) return 'window';
  if (imprint) return 'return';
  if (spotted) return completedRoute() ? 'rhythm' : 'courier';
  if (solved) return 'rewind';
  return observed || played ? 'listen' : 'start';
}
function openNeedle(requested) {
  const earned = completedRoute();
  if (['rhythm', 'return'].includes(requested) && earned && spotted) {
    progress.route = earned;
    progress.view = 'yard';
  } else if (spotted && ['stairs','wall','fork'].includes(requested)) {
    progress.view = requested === 'fork' ? 'fork' : 'route';
    if (requested !== 'fork') progress.route = requested;
  } else if (['start','listen','rewind','courier','window'].includes(requested)) {
    progress.view = 'street';
    if (requested === 'listen' && played && !observed) return 'listen';
  }
  paint();
  return needleStep();
}
window.UAStoryState?.register('needle', {
  step: needleStep, open: openNeedle,
  saveDraft() {
    window.UAStoryState.saveDraft('needle', {steps: draft, position, strikes, heard: played || observed});
  },
  target(step) {
    if (step === 'window') return windows[1];
    if (step === 'return') return returnImprint;
    if (step === 'rhythm') return editor.querySelector('h4');
    if (step === 'fork') return fork.querySelector('h3');
    if (['stairs','wall'].includes(step)) return branches.find(b => b.dataset.branch === step)?.querySelector('h4');
    if (step === 'courier') return follow;
    if (step === 'rewind') return rewind;
    return scene;
  },
});
function canMove() {
  return !document.hidden && !reduced.matches && root.dataset.motion !== 'off' &&
    !['quiet', 'calm', 'off', 'reduced'].includes(root.dataset.selfmadeMotion) &&
    !document.body.matches('.simple-mode,.exp-field') && !document.querySelector('.culture-board.cb-field');
}

function showPanel(view, route = progress.route, focusTarget) {
  stopAudio();
  delete fork.dataset.cue;
  progress.view = view;
  progress.route = route;
  strikes = [];
  feedback = view === 'yard' ? 'arrived' : '';
  lastPad = '';
  persistProgress();
  paint();

  let target = focusTarget ?? follow;
  if (view === 'fork') {
    target = routeButtons.find(button => button.dataset.route === route) || fork.querySelector('h3');
  } else if (view === 'route') {
    target = branches.find(branch => branch.dataset.branch === route).querySelector('h4');
  } else if (view === 'yard') {
    target = yard.querySelector('h4');
  }
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: 'instant', block: view === 'street' && !focusTarget ? 'nearest' : 'start' });
  if (canMove() && (view === 'route' || view === 'yard')) fork.dataset.cue = view === 'yard' ? 'gate' : route;
}

function returnFromPanel() {
  stopAudio();
  showPanel(currentRoute() ? 'fork' : 'street');
}

function reachYard() {
  if (!progress.completed.includes(progress.route)) progress.completed.push(progress.route);
  showPanel('yard');
}

follow.addEventListener('click', () => {
  if (!spotted) return;
  if (!fork.hidden) showPanel('street');
  else if (completedRoute()) showPanel('yard', completedRoute());
  else showPanel('fork');
});
routeButtons.forEach(button => button.addEventListener('click', () => {
  if (fork.hidden) return;
  showPanel('route', button.dataset.route);
}));
routeBack.addEventListener('click', returnFromPanel);
fork.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || fork.hidden) return;
  event.preventDefault();
  returnFromPanel();
});

padButtons.forEach(button => button.addEventListener('click', () => {
  if (progress.view !== 'route' || progress.route !== 'stairs') return;
  const pad = button.dataset.pad;
  strikes.push(pad);
  feedback = '';
  lastPad = pad;
  if (strikes.length === rhythm.length) {
    if (strikes.every((strike, index) => strike === rhythm[index])) {
      reachYard();
    } else {
      feedback = 'wrongRhythm';
      strikes = [];
      lastPad = '';
    }
  }
  if (progress.view === 'route') paint();
  void playAudio(...padSounds[pad]);
}));

markButtons.forEach(button => button.addEventListener('click', () => {
  if (progress.view !== 'route' || progress.route !== 'wall') return;
  if (button.dataset.mark === 'out') reachYard();
  else {
    feedback = 'wrongMark';
    paint();
  }
}));

function readyAudio() {
  if (!context) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return Promise.resolve();
    context = new Audio();
  }
  if (!recording) {
    recording = fetch('/assets/alchemy-prologue/needle-street-bar.mp3')
      .then(response => {
        if (!response.ok) throw new Error('Bar unavailable');
        return response.arrayBuffer();
      })
      .then(bytes => context.decodeAudioData(bytes))
      .then(forward => {
        const reverse = context.createBuffer(forward.numberOfChannels, forward.length, forward.sampleRate);
        const leadSamples = Math.floor(padSounds.short[1] * forward.sampleRate);
        let firstHit = leadSamples;
        for (let channel = 0; channel < forward.numberOfChannels; channel++) {
          const samples = forward.getChannelData(channel);
          reverse.copyToChannel(samples.slice().reverse(), channel);
          const attack = samples.subarray(0, firstHit).findIndex(sample => Math.abs(sample) >= .04);
          if (attack !== -1) firstHit = attack;
        }
        // MP3 decoders can produce different amounts of leading padding.
        const rhythmOffset = firstHit === leadSamples ? 0 : Math.max(0, firstHit / forward.sampleRate - .004);
        return { forward, reverse, rhythmOffset };
      })
      .catch(() => { recording = undefined; });
  }
  return Promise.all([context.resume(), recording]).then(([, buffers]) => buffers);
}

function stopAudio() {
  ++audioRequest;
  for (const source of voices) source.stop();
  voices.clear();
  finishRhythm();
}

function audioAvailable(request) {
  if (!soundOn || request !== audioRequest || document.hidden) return false;
  if (!root.hasAttribute('data-alchymista-audio')) return true;
  if (!root.hasAttribute('data-alchymista-film-beat')) return false;
  window.dispatchEvent(new Event('alchymista:needle-mute'));
  return true;
}

function scheduleSlice(buffer, offset, length, when) {
  const source = context.createBufferSource();
  const gain = context.createGain();
  const fade = Math.min(0.012, length / 4);
  source.buffer = buffer;
  source.connect(gain).connect(context.destination);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(0.34, when + fade);
  gain.gain.setValueAtTime(0.34, when + length - fade);
  gain.gain.linearRampToValueAtTime(0, when + length);
  source.onended = () => voices.delete(source);
  source.start(when, offset, length);
  voices.add(source);
}

async function playAudio(from, to) {
  stopAudio();
  if (!soundOn || document.hidden) return;
  window.dispatchEvent(new Event('caisik:needle-playback'));
  const request = audioRequest;
  try {
    const buffers = await readyAudio();
    if (!buffers || !audioAvailable(request)) return;
    const reverse = to < from;
    const buffer = reverse ? buffers.reverse : buffers.forward;
    const offset = reverse ? buffer.duration - from : from;
    const length = Math.min(Math.abs(to - from), buffer.duration - offset);
    if (length <= 0) return;
    scheduleSlice(buffer, offset, length, context.currentTime);
  } catch { /* Sound is optional. The visual clue remains available. */ }
}

function finishRhythm() {
  if (rhythmFrame !== undefined) cancelAnimationFrame(rhythmFrame);
  rhythmFrame = undefined;
  stepButtons.forEach(button => button.classList.remove('is-current'));
  windowSteps.forEach(dot => dot.classList.remove('is-current'));
  windows[1].classList.remove('imprint-beat');
  if (imprintMessage === 'imprintPlaying') {
    imprintMessage = '';
    paint();
  }
}

async function playRhythm(pattern, inWindow) {
  stopAudio();
  if (document.hidden) return;
  window.dispatchEvent(new Event('caisik:needle-playback'));
  const request = audioRequest;
  if (!inWindow) {
    imprintMessage = 'imprintPlaying';
    paint();
  }
  let fromAudio;
  if (soundOn) {
    let waitTimer;
    try {
      const buffers = await Promise.race([
        readyAudio(),
        new Promise(resolve => { waitTimer = setTimeout(resolve, 600); }),
      ]);
      if (buffers?.forward && audioAvailable(request)) {
        const offset = buffers.rhythmOffset;
        const length = Math.min(padSounds.short[1], buffers.forward.duration) - offset;
        const start = context.currentTime + 0.03;
        pattern.forEach((hit, index) => {
          if (hit && length > 0) scheduleSlice(buffers.forward, offset, length, start + stepSeconds * index);
        });
        fromAudio = start;
      }
    } catch {
      // If audio is unavailable, the same rhythm can be read from the lights.
    } finally { clearTimeout(waitTimer); }
  }
  if (request !== audioRequest || document.hidden) return;
  const fromVisual = performance.now();
  function draw(now) {
    const output = fromAudio === undefined ? null : context.getOutputTimestamp?.();
    const audioTime = output?.performanceTime
      ? output.contextTime + (now - output.performanceTime) / 1000 : context?.currentTime;
    const elapsed = fromAudio === undefined ? (now - fromVisual) / 1000 : audioTime - fromAudio;
    const step = Math.floor(elapsed / stepSeconds);
    if (step >= imprintLength || document.hidden) {
      finishRhythm();
      return;
    }
    const active = canMove() ? step : -1;
    const marks = inWindow ? windowSteps : stepButtons;
    marks.forEach((mark, index) => mark.classList.toggle('is-current', index === active));
    if (inWindow) windows[1].classList.toggle('imprint-beat', !!pattern[active]);
    rhythmFrame = requestAnimationFrame(draw);
  }
  rhythmFrame = requestAnimationFrame(draw);
}

function finishBar() {
  windows[1].classList.add('lit');
  observed = true;
  message = 'clue';
  paint();
}

play.addEventListener('click', () => {
  clearTimeout(timer);
  const attempt = ++barAttempt;
  position = steps;
  windows.forEach(element => element.classList.remove('lit'));
  message = '';
  observed = false;
  played = true;
  paint();

  let started = false;
  let fallback;
  function startBar() {
    if (started || attempt !== barAttempt) return;
    started = true;
    clearTimeout(fallback);
    windows[0].classList.add('lit');
    windows[2].classList.add('lit');
    if (!canMove()) finishBar();
    else timer = setTimeout(finishBar, lateMs);
  }

  if (!soundOn) {
    stopAudio();
    startBar();
    return;
  }
  fallback = setTimeout(() => {
    if (started || attempt !== barAttempt) return;
    stopAudio();
    startBar();
  }, 600);
  void playAudio(0, duration).then(startBar);
});

windows.forEach((element, index) => element.addEventListener('click', () => {
  const correct = index === 1;
  if (correct && imprint?.returned) {
    message = 'imprintEnding';
    paint();
    void playRhythm(imprint.steps, true);
    return;
  }
  message = correct ? (position <= 2 ? 'carrier' : spotted ? 'saved' : 'found') : 'miss';
  if (correct && !solved) {
    solved = true;
    save(diamondKey, 'diamond');
  }
  paint();
}));

function moveRecord(next) {
  if (!solved || next === position) return;
  const previous = position;
  position = next;
  if (position <= 2) {
    message = 'carrier';
    if (!spotted) {
      spotted = true;
      save(carrierKey, 'silver-gloves');
    }
  } else if (previous <= 2) message = 'saved';
  paint();
  void playAudio(duration * previous / steps, duration * position / steps);
}

rewind.addEventListener('input', () => moveRecord(Number(rewind.value)));
rewind.addEventListener('wheel', event => {
  if (document.activeElement !== rewind || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  const next = Math.min(steps, Math.max(0, position + Math.sign(event.deltaY)));
  if (next === position || !event.cancelable) return;
  event.preventDefault();
  moveRecord(next);
}, { passive: false });
rewind.addEventListener('keydown', event => {
  if (event.key === 'Escape') play.focus();
});
back.addEventListener('click', () => {
  if (position > 0) moveRecord(0);
  else void playAudio(duration, 0);
});

function toggleSound() {
  soundOn = !soundOn;
  save(soundKey, soundOn ? 'on' : 'off');
  if (soundOn) {
    try { void readyAudio().catch(() => {}); } catch { /* Visual mode is still available. */ }
  } else stopAudio();
  paint();
  window.dispatchEvent(new window.CustomEvent(soundEvent, { detail: soundOn }));
}
sound.addEventListener('click', toggleSound);
imprintSound.addEventListener('click', toggleSound);

window.addEventListener('caisik:languagechange', paint);
window.addEventListener('caisik:metro-playback', stopAudio);
function syncSound(enabled) {
  if (soundOn === enabled) return;
  soundOn = enabled;
  if (!soundOn) stopAudio();
  paint();
}
window.addEventListener(soundEvent, event => syncSound(event.detail === true));
window.addEventListener('storage', event => {
  if (event.key === soundKey || event.key === null) syncSound(read(soundKey) === 'on');
  if (event.key !== imprintKey && event.key !== null) return;
  const clean = sameSteps(draft, imprint?.steps) || !draft.some(Boolean);
  imprint = readImprint();
  if (clean) draft = imprint?.steps.slice() ?? emptyImprint();
  imprintMessage = '';
  stopAudio();
  if (message === 'imprintEnding' && !imprint?.returned) message = 'saved';
  paint();
});
function leaveScene() {
  delete fork.dataset.cue;
  stopAudio();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) leaveScene(); });
window.addEventListener('pagehide', leaveScene);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) leaveScene(); }).observe(scene);
}
paint();
