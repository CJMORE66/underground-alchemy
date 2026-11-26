import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { imprintKey, imprintEvent, readImprint } from '../dist/needle-imprint-store.js';
import { createShadowQuestRig } from '../dist/shadow-quest-rig.js';
import { readShadowRoutine, shadowMoveLabels, shadowMoves, shadowRoutineEvent, shadowRoutineKey, writeShadowRoutine } from '../dist/shadow-quest-store.js';

const source = file => readFileSync(new URL('../dist/' + file, import.meta.url), 'utf8');
const runtime = source('shadow-quest.js').replace(/^import .*\r?\n/gm, '');
const steps = [true, false, false, true, false, false, true, false];
const progress = () => new Map([[imprintKey, JSON.stringify({steps, returned:true})]]);

function boot(data = progress(), options = {}) {
  const { document, window } = parseHTML(source('index.html'));
  document.documentElement.lang = 'cs';
  const get = selector => document.querySelector(selector);
  const stage = get('[data-shadow-stage]');
  const order = () => [...document.querySelectorAll('[data-shadow-slot]')].map(slot => slot.textContent);
  let focused;
  let observe;
  let now = 0;
  let events = 0;
  let writes = 0;
  let next = 0;
  const renders = [];
  const frames = new Map();
  const timers = new Map();
  const storage = {
    getItem: key => data.get(key),
    setItem(key, value) {
      if (options.deny) throw new Error('Quota exceeded');
      writes++;
      data.set(key, value);
    },
  };
  let observerTarget;
  function Observer(callback) {
    observe = callback;
    this.observe = node => { observerTarget = node; };
  }
  window.IntersectionObserver = Observer;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLElement.prototype.focus = function () { focused = this; };
  window.addEventListener(shadowRoutineEvent, () => { events++; });
  const put = (clock, callback) => {
    const id = ++next;
    clock.set(id, callback);
    return id;
  };
  runInNewContext(runtime, {
    document, window, Event: window.Event, IntersectionObserver: Observer,
    imprintKey, imprintEvent, readImprint: () => readImprint(storage),
    shadowMoveLabels, shadowMoves, shadowRoutineEvent, shadowRoutineKey,
    readShadowRoutine: () => readShadowRoutine(storage),
    writeShadowRoutine: value => writeShadowRoutine(value, storage),
    createShadowQuestRig: () => ({ render: (...args) => renders.push(args) }),
    matchMedia: () => ({matches: Boolean(options.reduced)}),
    performance: {now: () => now},
    requestAnimationFrame: callback => put(frames, callback),
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: callback => put(timers, callback),
    clearTimeout: id => timers.delete(id),
  });
  assert.equal(observerTarget, stage);
  const click = selector => get(selector).click();
  const move = (...moves) => moves.forEach(value => click(`[data-shadow-move="${value}"]`));
  const advance = elapsed => {
    now += elapsed;
    const clock = frames.size ? frames : timers;
    const [id, callback] = [...clock.entries()][0] ?? [];
    assert(callback, 'playback scheduled a callback');
    clock.delete(id);
    callback(now);
  };
  const escape = () => {
    const event = new window.Event('keydown', { bubbles: true, cancelable: true });
    event.key = 'Escape';
    get('[data-shadow-close]').dispatchEvent(event);
    return event.defaultPrevented;
  };
  return {
    document, window, stage, order, get, click, move, advance, escape, frames, timers, renders, storage,
    focused: () => focused, writes: () => writes, events: () => events,
    offscreen: () => observe([{isIntersecting: false}]),
  };
}

test('unlock follows the existing story and the player can revise and preview a three-move order', () => {
  const data = new Map();
  const app = boot(data);
  assert(app.get('[data-shadow-quest]').hidden);
  data.set(imprintKey, JSON.stringify({steps, returned:true}));
  app.window.dispatchEvent(new app.window.Event(imprintEvent));
  assert(!app.get('[data-shadow-quest]').hidden);
  app.click('[data-shadow-open]');
  assert.equal(app.focused(), app.get('[data-shadow-title]'));
  app.move('turn', 'step', 'turn', 'freeze');
  assert(app.get('[data-shadow-save]').disabled);
  app.move('turn');
  assert.deepEqual(app.order(), ['Krok', 'Freeze', 'Otočka']);
  app.click('[data-shadow-play]');
  assert.equal(app.stage.dataset.shadowPose, 'step');
  assert.equal(app.get('[aria-current="step"]').textContent, 'Krok');
  app.advance(220);
  assert.equal(app.renders.at(-1)[1], .25);
  app.advance(670);
  assert.equal(app.stage.dataset.shadowPose, 'freeze');
  app.advance(880);
  assert.equal(app.stage.dataset.shadowPose, 'turn');
  app.advance(880);
  assert(!app.stage.hasAttribute('data-performing'));
  assert.match(app.get('[data-shadow-caption]').textContent, /finále/);
  assert.equal(app.writes(), 0);
});

test('one exact move order persists and replays after reload without duplicate completion', () => {
  const data = progress();
  const app = boot(data);
  app.click('[data-shadow-open]');
  app.move('freeze', 'turn', 'step');
  app.click('[data-shadow-save]');
  assert.equal(app.writes(), 1);
  assert.equal(app.events(), 1);
  assert.deepEqual(readShadowRoutine(app.storage), { moves: ['freeze', 'turn', 'step'] });
  assert.equal(app.stage.dataset.shadowPose, 'freeze');
  app.advance(2640);
  app.click('[data-shadow-save]');
  assert.equal(app.writes(), 1);
  assert(app.escape());
  assert.equal(app.focused(), app.get('[data-shadow-open]'));
  assert.equal(app.frames.size, 0);
  const reloaded = boot(data);
  assert(!reloaded.get('[data-shadow-replay]').hidden);
  reloaded.click('[data-shadow-replay]');
  assert.equal(reloaded.stage.dataset.shadowPose, 'freeze');
  reloaded.advance(880);
  assert.equal(reloaded.stage.dataset.shadowPose, 'turn');
  reloaded.advance(880);
  assert.equal(reloaded.stage.dataset.shadowPose, 'step');
  assert(reloaded.escape());
  assert.equal(reloaded.focused(), reloaded.get('[data-shadow-replay]'));
  assert.equal(reloaded.writes(), 0);
});

test('reduced motion uses stills, offscreen stops the exchange, and failed storage grants no routine', () => {
  const app = boot(progress(), {reduced:true, deny:true});
  app.click('[data-shadow-open]');
  app.move('step', 'turn', 'freeze');
  app.click('[data-shadow-play]');
  assert.equal(app.frames.size, 0);
  assert.equal(app.timers.size, 1);
  assert.deepEqual(app.renders.at(-1), ['step', 1, true]);
  app.advance(880);
  assert.deepEqual(app.renders.at(-1), ['turn', 1, true]);
  app.offscreen();
  assert.equal(app.timers.size, 0);
  assert(!app.stage.hasAttribute('data-performing'));
  app.document.documentElement.lang = 'fr';
  app.window.dispatchEvent(new app.window.Event('caisik:languagechange'));
  assert.deepEqual(app.order(), ['Pas', 'Tour', 'Freeze']);
  app.click('[data-shadow-save]');
  assert.match(app.get('[data-shadow-status]').textContent, /Impossible/);
  assert.equal(app.writes(), 0);
  app.escape();
  assert(app.get('[data-shadow-replay]').hidden);
});

test('actual original cutout mounts twice and the three silhouettes have distinct finite poses', () => {
  const { document } = parseHTML(source('index.html'));
  const stage = document.querySelector('[data-shadow-stage]');
  const rig = createShadowQuestRig(stage);
  const dancer = stage.querySelector('[data-shadow-performer] [data-actor-body]');
  const shadow = stage.querySelector('[data-shadow-dancer] [data-actor-body]');
  const transform = element => element.getAttribute('transform');
  assert.match(shadow.getAttribute('filter'), /^url\(#shadow-quest-ink-\d+\)$/);
  const poses = shadowMoves.map(move => {
    rig.render(move, 1, true);
    assert.match(transform(dancer), /rotate\(77\.00\)/);
    assert.doesNotMatch(transform(shadow), /NaN|Infinity/);
    return transform(shadow);
  });
  assert.equal(new Set(poses).size, 3);
});

test('store rejects invalid move permutations and malformed JSON', () => {
  let value = '{bad';
  const store = {getItem: () => value, setItem: (_, next) => {value = next;}};
  assert.equal(readShadowRoutine(store), null);
  assert(!writeShadowRoutine({moves:['turn', 'turn', 'freeze']}, store));
  assert(!writeShadowRoutine({moves:['step', 'freeze', 'jump']}, store));
  assert(writeShadowRoutine({moves:['freeze', 'step', 'turn']}, store));
  assert.deepEqual(readShadowRoutine(store), {moves:['freeze', 'step', 'turn']});
});
