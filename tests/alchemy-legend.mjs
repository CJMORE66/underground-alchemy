import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { sampleLegendTimeline, writerFilmClock } from '../dist/alchemy-prologue.js';
import { sampleWriterAction, writerRefillAt } from '../dist/alchemy-writer-strokes.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const { document, window } = parseHTML(read('../dist/index.html'));
const track = document.querySelector('[data-film-prologue]');
const frame = track.querySelector('.ua-film-frame');
const quote = track.querySelector('[data-film-quote]');
const artLink = track.querySelector('[data-film-art]');
const transport = track.querySelector('[data-film-transport]');
const skip = track.querySelector('[data-film-skip]');
const story = track.querySelector('[data-film-story]');
const guide = track.querySelector('[data-film-guide]');

assert(quote.hidden, 'the server-rendered opening hides the spoken caption');
assert.equal(track.querySelectorAll('h1, h2').length, 0, 'no opening headline');
assert.equal(skip.getAttribute('href'), '#home');
assert(document.querySelector('#home'));
assert.equal(story.getAttribute('href'), '#needle-street');
assert(document.querySelector(story.getAttribute('href')).querySelector('[data-play]'));
assert.equal(guide.getAttribute('aria-controls'), 'alchymista-live');
assert.equal(artLink.getAttribute('href'), '/art/#legend-art');

const gallery = parseHTML(read('../dist/art/index.html')).document;
assert(gallery.querySelector('#legend-art'));
assert.equal(gallery.querySelector('[data-gallery-skip]').getAttribute('href'), '#blackbook-collection');
assert(gallery.querySelector('#blackbook-collection'));

const pause = writerFilmClock(1) - 2.71;
const shift = pause + .28;
const length = 3.06 + shift;
const refillAt = writerFilmClock(writerRefillAt) - pause;
const dogAt = refillAt + .112;
const dogClock = p => dogAt + .247 * p;
const sample = clock => sampleLegendTimeline(clock / length);
const checkpoints = [
  [0, 'exterior'], [.18, 'throne'], [.29, 'symbols'], [.40, 'serpent'], [.50, 'entrance'],
  [.61, 'quote'], [.67, 'dj'], [.76, 'stylus'], [.86, 'scratch'], [.97, 'mc'], [1.075, 'voice'],
  [1.25, 'footwork'], [1.51, 'handspin'], [1.68, 'headspin'], [1.83, 'flip'], [1.96, 'pigment'],
  [writerFilmClock(.12), 'writer'], [refillAt+.05, 'refill'], [dogClock(.35), 'dog'],
  [writerFilmClock(.29), 'resume'], [writerFilmClock(.51), 'flare'],
  [writerFilmClock(.86), 'outline'], [writerFilmClock(.99), 'wholetrain'],
  [writerFilmClock(1)+.06, 'railpose'], [writerFilmClock(1)+.24, 'glass'],
  [2.85+shift, 'kungfu'], [length, 'meditation'],
];
for (const [clock, name] of checkpoints) assert.equal(sample(clock).name, name);
for (const phase of [.12, .50, .70, .98]) {
  assert(Math.abs(sample(writerFilmClock(phase)).writer - phase) < 1e-9, 'one continuous paint pass across cut boundaries');
}
assert.equal(sample(.29).serpent, 0);
assert.equal(sample(.40).entrance, 0);
assert.equal(sample(.61).entrance, 1);

let scroll = 0;
let pending;
let reduced = false;
let language = 'cs';
window.CaisikI18n = { getLanguage: () => language };
const travel = 1000;
const top = 116;
Object.defineProperty(track, 'offsetHeight', { get: () => travel / .96 + 684 });
Object.defineProperty(frame, 'offsetHeight', { get: () => 684 });
track.getBoundingClientRect = () => ({ top: top - scroll, bottom: top + track.offsetHeight - scroll });
frame.getBoundingClientRect = () => ({ top, bottom: 800 });
Object.assign(globalThis, {
  document, window, innerHeight: 800,
  matchMedia: query => ({
    get matches() { return query.includes('prefers-reduced-motion') && reduced; },
    addEventListener: () => {},
  }),
  getComputedStyle: () => ({ top: String(top) }),
  requestAnimationFrame: callback => { pending = callback; return 1; },
  cancelAnimationFrame: () => {},
  MutationObserver: class { observe() {} },
  Audio: class { pause() {} },
});

Object.defineProperty(window, 'scrollY', { get: () => scroll });
window.scrollTo = ({ top }) => { scroll = top; };
await import('../dist/alchemy-prologue.js?mounted-test');
function seek(progress) {
  scroll = progress / length * travel;
  window.dispatchEvent(new window.Event('scroll'));
  assert(pending, 'scroll requests a frame');
  pending(1000);
}
function opacity(part) {
  return Number(track.querySelector(`[data-legend-${part}]`).getAttribute('opacity'));
}

seek(0);
assert(quote.hidden && artLink.hidden);
assert.equal(opacity('graffiti'), 0);
seek(.068);
assert(quote.hidden && opacity('graffiti') > .8 && opacity('apprentice') > .4);
const graffiti = track.querySelector('[data-legend-graffiti]').textContent.replace(/\s+/g, ' ');
assert.match(graffiti, /TRANSMUTE.*AS WITHIN SO WITHOUT/);
seek(.11);
assert(quote.hidden && opacity('graffiti') === 0 && opacity('apprentice') === 0);
for (const [progress] of checkpoints.slice(1, 5)) {
  seek(progress);
  assert(quote.hidden && artLink.hidden, `keep the intro clear at ${progress}`);
}
seek(.61);
assert.equal(quote.hidden, false);
assert.deepEqual([...quote.children].filter(node => !node.hidden).map(node => node.textContent), [
  'Cesta začíná.', 'Alchymista', '„PRAVDA mluví jen k chápavým uším.“',
]);
language = 'en';
window.dispatchEvent(new window.Event('caisik:languagechange'));
assert.equal(quote.querySelector('[data-film-line-title]').textContent, 'The journey begins.');
assert.equal(story.querySelector('[data-film-story-label]').textContent, 'Play chapter one');
assert.equal(guide.textContent, 'Voice guide');
language = 'fr';
window.dispatchEvent(new window.Event('caisik:languagechange'));
assert.equal(guide.textContent, 'Guide vocal');
language = 'cs';
window.dispatchEvent(new window.Event('caisik:languagechange'));
seek(.70);
assert.equal(quote.hidden, true);
assert.equal(track.querySelector('[data-legend-deck]').getAttribute('display'), 'inline');
const actorArt = track.querySelector('.alchemy-prologue-actor');
const deck = track.querySelector('[data-deck-edge]');
const clippedArms = [...track.querySelectorAll('[data-deck-hand-layer] use')];
assert(deck && clippedArms.length === 2);
for (const arm of clippedArms) assert(actorArt.querySelector(arm.getAttribute('href')));
assert(!actorArt.hasAttribute('data-break-skin'));
let needleDrops = 0;
const countNeedle = () => { needleDrops++; };
window.addEventListener('alchymista:needle-drop', countNeedle);
seek(.7524);
assert.equal(needleDrops, 0, 'needle is still above the record');
seek(.7526);
assert.equal(needleDrops, 1, 'touchdown fires at the animated contact point');
seek(.80);
assert.equal(needleDrops, 1, 'remaining in the shot does not repeat playback');
seek(.72);
seek(.858);
assert.equal(needleDrops, 2, 'scrolling over the cut still emits touchdown');
window.removeEventListener('alchymista:needle-drop', countNeedle);
seek(.97);
assert.equal(track.querySelector('[data-legend-deck]').getAttribute('display'), 'none');
const portrait = track.querySelector('[data-part="voice-plate"]');
const portraitAsset = readFileSync(new URL('../dist/assets/alchemy-prologue/voice-portrait.webp', import.meta.url));
assert.equal(portraitAsset.subarray(8, 12).toString(), 'WEBP');
assert.equal(portrait.getAttribute('href'), '/assets/alchemy-prologue/voice-portrait.webp');
seek(1.075);
const macro = track.querySelector('.ua-film-macros');
assert.equal(Number(macro.style.opacity), 0, 'keep the street visible until the portrait loads');
portrait.dispatchEvent(new window.Event('load'));
assert(Number(macro.style.opacity) > .9);
const jaw = track.querySelector('[data-part="voice-jaw"]');
const wave = track.querySelector('[data-part="wave"]');
const voiceFrame = () => [jaw.getAttribute('transform'), wave.getAttribute('d')];
const phrasing = voiceFrame();
seek(1.092);
assert.notDeepEqual(voiceFrame(), phrasing);
seek(1.075);
assert.deepEqual(voiceFrame(), phrasing, 'articulation and grille signal rewind with the take');
const mic = track.querySelector('[data-legend-mic-shell]');
assert(mic.hasAttribute('transform'));
seek(1.51);
assert.equal(track.querySelector('[data-legend-circle]').getAttribute('display'), 'inline');
assert(actorArt.hasAttribute('data-break-skin'));
const freezing = track.querySelector('[data-actor-body]').getAttribute('transform');
seek(.97);
assert(!actorArt.hasAttribute('data-break-skin'), 'returning to MC restores the regular rig art');
seek(1.51);
assert.equal(track.querySelector('[data-actor-body]').getAttribute('transform'), freezing);
seek(length);
assert.equal(artLink.hidden, false);
seek(0);
assert(quote.hidden && artLink.hidden && opacity('graffiti') === 0);

for (const [clock, name] of checkpoints) {
  seek(clock);
  assert.equal(track.dataset.filmCut, name);
}
// A finished fill must still have no outline. Rewinding a partially traced
// contour must restore the same endpoint and never leave paint from a later shot.
const cars = [...track.querySelectorAll('[data-writer-word]')];
assert.deepEqual(cars.map(car => car.dataset.writerWord), ['INK', 'FLOW', 'ECHO', 'GOLD']);
for (const car of cars) {
  const letters = [...car.querySelectorAll('[data-writer-letter]')].map(letter => letter.dataset.writerLetter).join('');
  assert.equal(letters, car.dataset.writerWord, 'every carriage renders its complete word');
  assert(car.closest('[clip-path]'), 'paint is clipped to its own carriage');
}
const spray = track.querySelector('[data-finale="spray"]');
const seekWriter = p => seek(writerFilmClock(p));
const deposited = car => [...car.querySelectorAll('[data-load]')].map(mark => Number(mark.getAttribute('opacity')));
seekWriter(.006);
const firstPaint = deposited(cars[0]);
assert(firstPaint.some(amount => amount > 0));
seekWriter(.011);
const nextPaint = deposited(cars[0]);
assert(nextPaint.reduce((a,b)=>a+b,0) > firstPaint.reduce((a,b)=>a+b,0));
assert(cars.slice(1).every(car => deposited(car).every(amount => amount === 0)));
assert.equal(spray.getAttribute('data-spray-state'), 'press');
assert(spray.querySelectorAll('[data-spray-drops] circle').length >= 30);
const release = Array.from({length:500}, (_,i) => i/10000).find(p =>
  sampleWriterAction(p).spray < .015 && sampleWriterAction(Math.max(0,p-.0025)).spray > .1);
assert(release);
seekWriter(release);
assert.equal(spray.getAttribute('data-spray-state'), 'release');
seekWriter(.99);
assert.equal(spray.getAttribute('data-spray-state'), 'idle');
assert(cars.every(car => deposited(car).some(amount => amount > 0)));
seekWriter(.006);
assert.deepEqual(deposited(cars[0]), firstPaint, 'scrubbing backward removes only paint from later strokes');
assert(cars.slice(1).every(car => deposited(car).every(amount => amount === 0)));

const ink = [...track.querySelectorAll('[data-writer-stroke]')];
const outlines = ink.filter(path => path.getAttribute('stroke') === '#201017');
const inkState = path => [path.getAttribute('visibility'), path.getAttribute('stroke-dashoffset')];
assert(outlines.length > 9, 'outline includes inner counters as well as letter exteriors');
seekWriter(.51);
assert(outlines.every(path => inkState(path)[0] === 'hidden'));
seekWriter(.87);
const partialOutline = outlines.map(inkState);
assert(partialOutline.some(([visible, offset]) => visible === 'visible' && Number(offset) > 0));
seekWriter(.99);
assert(outlines.every(path => Number(inkState(path)[1]) === 0));
seekWriter(.87);
assert.deepEqual(outlines.map(inkState), partialOutline);

const dog = track.querySelector('[data-writer-dog]');
const occluder = track.querySelector('[data-rail-occlusion]');
const salami = track.querySelector('[data-rail-salami]');
const glass = track.querySelector('[data-writer-glass]');
const marks = () => cars.map(deposited);
seek(refillAt+.06);
const refillMarks = marks();
assert.equal(spray.getAttribute('opacity'), '0');
seek(dogClock(.09));
assert.equal(dog.getAttribute('display'), 'inline');
assert.equal(salami.getAttribute('display'), 'none', 'the dog arrives before the salami is found');
seek(dogClock(.38));
assert.equal(occluder.getAttribute('display'), 'inline', 'writer is behind the stationary wagon');
seek(dogClock(.72));
assert.equal(salami.getAttribute('display'), 'inline');
assert.deepEqual(marks(), refillMarks, 'the paint stays in place while the can is off');
seek(writerFilmClock(1)+.06);
assert.equal(dog.getAttribute('display'), 'inline');
assert(glass.hidden);
seek(writerFilmClock(1)+.274);
assert(!glass.hidden);
assert.match(glass.textContent, /real culture and knowledge is for every/);
for (const letter of ['O','N','E']) assert.equal(glass.querySelector(`[data-glass-letter="${letter}"]`).getAttribute('opacity'), '1');
seek(2.85+shift);
assert(glass.hidden);
assert(outlines.every(path => Number(path.getAttribute('stroke-width')) < 3), 'skinny-cap stroke stays thin');

seek(1.14);
transport.click();
pending(1100);
pending(1200);
assert.equal(track.dataset.filmCut, 'footwork');
assert(transport.getAttribute('aria-pressed') === 'true' && scroll > 1.14 / length * travel);
transport.click();
assert.equal(transport.getAttribute('aria-pressed'), 'false');

reduced = true;
window.dispatchEvent(new window.Event('pageshow'));
pending(1000);
assert.equal(track.dataset.filmFlow, 'still');
assert(!quote.hidden && track.querySelector('[data-film-next]').hidden && transport.hidden);
console.log('PASS: 27 cuts, train story order, fixed paint during the interruption, skinny outlines, glass message, playback and reduced motion.');
