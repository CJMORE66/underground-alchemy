import { imprintEvent, imprintKey, readImprint } from './needle-imprint-store.js?v=1';
import { cornerChoices, cornerNoteEvent, cornerNoteKey, cornerReadings, cornerWitnesses, readCornerProgress, writeCornerProgress } from './corner-note-store.js?v=1';

const quest = document.querySelector('[data-corner-quest]');
const panel = quest.querySelector('[data-corner-panel]');
const stage = quest.querySelector('[data-corner-stage]');
const opener = quest.querySelector('[data-corner-open]');
const title = quest.querySelector('[data-corner-title]');
const solutions = quest.querySelector('[data-corner-solutions]');
const save = quest.querySelector('[data-corner-save]');
const mapLink = quest.querySelector('[data-corner-map-link]');
const count = quest.querySelector('[data-corner-count]');
const dialog = quest.querySelector('[data-corner-dialog]');
const clue = quest.querySelector('[data-corner-clue]');
const feedback = quest.querySelector('[data-corner-feedback]');
const witnesses = [...quest.querySelectorAll('[data-corner-witness]')];
const choices = [...quest.querySelectorAll('[data-corner-choice]')];
const recall = document.querySelector('[data-corner-recall]');
const recallToggle = recall.querySelector('[data-corner-recall-open]');
const recallText = recall.querySelector('[data-corner-recall-copy]');
const labels = [quest, recall].flatMap(region => [...region.querySelectorAll('[data-corner-line]')]);

const words = {
  cs: {
    title: 'Stejný roh, tři verze', teaser: 'U rohu pod oknem II se zastaví kurýr, DJ a revizor. Všichni viděli stejnou věc. Každý začne vyprávět odjinud.',
    open: 'Porovnat výpovědi', openSaved: 'Znovu projít výpovědi', sceneTitle: 'Co se stalo u okna II?',
    courier: 'Kurýr', dj: 'DJ', inspector: 'Revizor', inspect: 'Prohlédnout detail',
    choose: 'Co si z toho odneseš do mapy?', save: 'Uložit poznámku do mapy', map: 'Otevřít poznámku na mapě', close: 'Zavřít scénu',
    recallTitle: 'Alchymista u dalších dveří', recallTeaser: 'Za rohem někdo třikrát zaklepe. Alchymista se zastaví. „Co zjistíš jako první?“',
    recallOpen: 'Zeptat se Alchymisty', recallClose: 'Zavřít odpověď',
    compared: 'Porovnané detaily', found: 'Detail je zaznamenaný.',
    completed: 'Poznámka je v mapě i v Blackbooku.',
    saveError: 'Zápis se nepodařilo uložit. Zkus to znovu.',
    courierLine: '„Na dvojku nekoukám. Koukej na víko. S tou bednou jsem hledal dvůr, ne potlesk.“',
    djLine: '„Jednička a trojka spolu. Dvojka o dobu později. Jestli to byla odpověď, někdo tam umí počítat.“',
    inspectorLine: '„Já viděl ruce. Obě na bedně. Takže ji někdo odnesl. Sama po schodech neslezla.“',
    courierClue: 'Dvojitý kosočtverec na bedně má stejný tvar jako značka u průjezdu.',
    djClue: 'Okno II svítí až po oknech I a III. Zpoždění má délku jedné doby.',
    inspectorClue: 'Stříbrné rukavice svírají bednu ve chvíli, kdy mizí po schodech.',
  },
  en: {
    title: 'Same corner, three stories', teaser: 'The courier, DJ, and inspector stop below window II. They saw the same thing, but each starts somewhere different.',
    open: 'Compare accounts', openSaved: 'Revisit the accounts', sceneTitle: 'What happened at window II?',
    courier: 'Courier', dj: 'DJ', inspector: 'Inspector', inspect: 'Look closer',
    choose: 'What will you write on the map?', save: 'Save note to the map', map: 'Open the map note', close: 'Close the scene',
    recallTitle: 'The alchemist at the next door', recallTeaser: 'Three knocks sound around the corner. The alchemist stops. “What will you check first?”',
    recallOpen: 'Ask the alchemist', recallClose: 'Close the reply',
    compared: 'Details compared', found: 'Detail recorded.',
    completed: 'The note is on the map and in your Blackbook.',
    saveError: 'Could not save the note. Try again.',
    courierLine: '“Forget window II. Look at the lid. I was looking for the courtyard, not a round of applause.”',
    djLine: '“One and three together. Two comes in a beat late. If that was an answer, someone knows how to count.”',
    inspectorLine: '“I saw the hands. Both on the crate. Someone carried it. It didn’t walk down the stairs on its own.”',
    courierClue: 'The double diamond on the crate matches the one by the passage.',
    djClue: 'Window II lights up one beat after windows I and III.',
    inspectorClue: 'Silver gloves grip the crate as it disappears down the stairs.',
  },
  fr: {
    title: 'Même coin, trois versions', teaser: 'Le coursier, le DJ et le contrôleur s’arrêtent sous la fenêtre II. Ils ont vu la même chose, mais chacun commence ailleurs.',
    open: 'Comparer les récits', openSaved: 'Revoir les récits', sceneTitle: 'Que s’est-il passé à la fenêtre II ?',
    courier: 'Coursier', dj: 'DJ', inspector: 'Contrôleur', inspect: 'Regarder de plus près',
    choose: 'Que vas-tu noter sur la carte ?', save: 'Noter sur la carte', map: 'Ouvrir la note sur la carte', close: 'Fermer la scène',
    recallTitle: 'L’alchimiste devant la porte suivante', recallTeaser: 'Trois coups résonnent au coin de la rue. L’alchimiste s’arrête. « Qu’est-ce que tu vas vérifier en premier ? »',
    recallOpen: 'Interroger l’alchimiste', recallClose: 'Fermer la réponse',
    compared: 'Détails comparés', found: 'Détail noté.',
    completed: 'La note est sur la carte et dans ton Blackbook.',
    saveError: 'Impossible d’enregistrer la note. Réessaie.',
    courierLine: '« Oublie la fenêtre II. Regarde le couvercle. Je cherchais la cour, pas des applaudissements. »',
    djLine: '« La I et la III ensemble. La II arrive un temps plus tard. Si c’était une réponse, quelqu’un sait compter. »',
    inspectorLine: '« J’ai vu les mains. Toutes les deux sur la caisse. Quelqu’un l’a portée. Elle n’est pas descendue toute seule. »',
    courierClue: 'Le double losange sur la caisse correspond à celui près du passage.',
    djClue: 'La fenêtre II s’allume un temps après les fenêtres I et III.',
    inspectorClue: 'Des gants argentés tiennent la caisse quand elle disparaît dans l’escalier.',
  },
};

const empty = () => ({ seen: [], reading: null });
let progress = readCornerProgress() ?? empty();
let witness = cornerWitnesses[0];
let choice = progress.reading;
let open = false;
let recalling = false;
let message = '';

function language() {
  const selected = (window.CaisikI18n?.getLanguage?.() || document.documentElement.lang || 'cs').split('-')[0];
  return Object.hasOwn(words, selected) ? selected : 'cs';
}

function text(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function paint() {
  const lang = language();
  const copy = words[lang];
  const readings = cornerReadings[lang];
  const unlocked = Boolean(readImprint()?.returned || progress.reading);
  for (const label of labels) {
    const key = label.dataset.cornerLine;
    text(label, readings[key]?.title ?? copy[key] ?? label.textContent);
  }
  quest.hidden = !unlocked;
  panel.hidden = !open || !unlocked;
  opener.hidden = !panel.hidden;
  opener.setAttribute('aria-expanded', String(!panel.hidden));
  text(opener, copy[progress.reading ? 'openSaved' : 'open']);
  stage.dataset.witness = witness;
  const examined = progress.seen.includes(witness);
  stage.toggleAttribute('data-revealed', examined);
  text(dialog, copy[witness + 'Line']);
  clue.hidden = !examined;
  text(clue, copy[witness + 'Clue']);
  text(count, copy.compared + ' ' + progress.seen.length + '/' + cornerWitnesses.length);
  for (const button of witnesses) {
    const id = button.dataset.cornerWitness;
    button.setAttribute('aria-pressed', String(id === witness));
    button.toggleAttribute('data-inspected', progress.seen.includes(id));
  }
  solutions.hidden = progress.seen.length !== cornerWitnesses.length;
  for (const button of choices) button.setAttribute('aria-pressed', String(button.dataset.cornerChoice === choice));
  save.disabled = solutions.hidden || !choice;
  mapLink.hidden = !progress.reading;
  text(feedback, copy[message] ?? '');
  recall.hidden = !progress.reading;
  recallText.hidden = !progress.reading || !recalling;
  recallToggle.setAttribute('aria-expanded', String(!recallText.hidden));
  text(recallToggle, copy[recallText.hidden ? 'recallOpen' : 'recallClose']);
  text(recallText, readings[progress.reading]?.recall ?? '');
}

function land(element) {
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function closeScene() {
  open = false;
  message = '';
  paint();
  if (!quest.hidden) land(opener);
}

opener.addEventListener('click', () => {
  if (quest.hidden) return;
  open = true;
  message = '';
  paint();
  land(title);
});
quest.querySelector('[data-corner-close]').addEventListener('click', closeScene);
quest.addEventListener('keydown', event => {
  if (!open || event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
  event.preventDefault();
  closeScene();
});

function selectWitness(id) {
  if (!open || !cornerWitnesses.includes(id)) return;
  witness = id;
  message = '';
  paint();
}
for (const [index, button] of witnesses.entries()) {
  button.addEventListener('click', () => selectWitness(button.dataset.cornerWitness));
  button.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const next = witnesses[(index + offset + witnesses.length) % witnesses.length];
    selectWitness(next.dataset.cornerWitness);
    next.focus();
  });
}

function mergedProgress(latest, extra = []) {
  return {
    seen: [...new Set([...(latest?.seen ?? []), ...progress.seen, ...extra])],
    reading: latest?.reading ?? progress.reading,
  };
}

for (const button of quest.querySelectorAll('[data-corner-inspect]')) {
  button.addEventListener('click', () => {
    if (!open) return;
    const latest = readCornerProgress();
    progress = mergedProgress(latest, [witness]);
    if (!choice) choice = progress.reading;
    const sameSeen = latest?.seen.length === progress.seen.length;
    message = sameSeen || writeCornerProgress(progress) ? 'found' : 'saveError';
    paint();
  });
}

for (const button of choices) {
  button.addEventListener('click', () => {
    if (!open || solutions.hidden || !cornerChoices.includes(button.dataset.cornerChoice)) return;
    choice = button.dataset.cornerChoice;
    message = '';
    paint();
  });
}

save.addEventListener('click', () => {
  if (!open || save.disabled) return;
  const latest = readCornerProgress();
  const next = { ...mergedProgress(latest), reading: choice };
  const changed = latest?.reading !== choice;
  if (changed && !writeCornerProgress(next)) {
    message = 'saveError';
    paint();
    return;
  }
  progress = next;
  message = 'completed';
  paint();
  if (changed) window.dispatchEvent(new Event(cornerNoteEvent));
});

function goTo(target, focusTarget = target) {
  const hash = '#' + target.id;
  if (location.hash !== hash) history.pushState(null, '', hash);
  land(focusTarget);
}

function modified(event) {
  return event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

mapLink.addEventListener('click', event => {
  if (modified(event)) return;
  const note = document.getElementById('corner-map-note');
  if (!note || note.hidden) return;
  event.preventDefault();
  goTo(note);
});

function returnToCorner() {
  goTo(quest, panel.hidden ? opener : title);
}

document.addEventListener('click', event => {
  const link = event.target.closest?.('#corner-map-note a[href^="#"]');
  if (!link || modified(event) || !progress.reading) return;
  if (link.getAttribute('href') === '#corner-quest') {
    event.preventDefault();
    returnToCorner();
  } else if (link.getAttribute('href') === '#corner-recall') {
    event.preventDefault();
    goTo(recall);
  }
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || !progress.reading) return;
  if (!event.target.closest?.('#corner-map-note')) return;
  event.preventDefault();
  returnToCorner();
});

recallToggle.addEventListener('click', () => {
  if (!progress.reading) return;
  recalling = !recalling;
  paint();
});
recall.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || !recalling) return;
  event.preventDefault();
  recalling = false;
  paint();
  land(recallToggle);
});

window.addEventListener(imprintEvent, paint);
window.addEventListener('caisik:languagechange', paint);
window.addEventListener('storage', event => {
  if (event.key === cornerNoteKey || event.key === null) {
    const replaceChoice = choice === progress.reading || !choice;
    progress = readCornerProgress() ?? empty();
    if (replaceChoice) choice = progress.reading;
    if (!progress.reading) recalling = false;
    message = '';
  }
  if (event.key !== cornerNoteKey && event.key !== imprintKey && event.key !== null) return;
  if (!progress.reading && !readImprint()?.returned) open = false;
  paint();
});
paint();
