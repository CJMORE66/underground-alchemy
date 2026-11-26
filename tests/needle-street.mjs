import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { imprintEvent, imprintKey, imprintLength, readImprint, writeImprint } from '../dist/needle-imprint-store.js';

const page = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../dist/needle-street.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/, '');
const storeKey = 'caisik-needle-fork-v1';

function openStreet(saved = new Map(), reduced = false, audioEnabled = false) {
  const { window, document } = parseHTML(page);
  document.documentElement.lang = 'cs';
  const scene = document.querySelector('#needle-street');
  const get = selector => scene.querySelector(selector);
  const range = get('[data-rewind]');
  // linkedom does not reflect the native range max property.
  range.max = range.getAttribute('max');
  const focus = {};
  const localStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  let now = 0;
  let nextFrame = 0;
  const frames = new Map();
  const slices = [];
  if (audioEnabled) {
    const samples = new Float32Array(9600);
    samples[960] = .12;
    window.AudioContext = class {
      currentTime = 10;
      resume = async () => {};
      decodeAudioData = async () => ({
        duration: .2, numberOfChannels: 1, length: samples.length, sampleRate: 48000,
        getChannelData: () => samples,
      });
      createBuffer = () => ({ copyToChannel() {} });
      createGain = () => ({
        connect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {} },
      });
      createBufferSource = () => {
        const slice = { stopped: false };
        return {
          connect: target => target,
          start(...args) { slice.args = args; slices.push(slice); },
          stop() { slice.stopped = true; },
        };
      };
      getOutputTimestamp = () => ({ contextTime: 10.03, performanceTime: 1000 });
    };
  }
  for (const element of scene.querySelectorAll('button, h3, h4')) {
    element.focus = () => { focus.current = element; };
    element.scrollIntoView = () => { focus.scrolled = element; };
  }
  runInNewContext(runtime, {
    document, window, matchMedia: () => ({ matches: reduced }),
    localStorage, Event: window.Event, imprintEvent, imprintKey, imprintLength,
    readImprint: () => readImprint(localStorage),
    writeImprint: value => writeImprint(value, localStorage),
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }),
    performance: { now: () => now },
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout, clearTimeout,
  });
  const click = selector => get(selector).dispatchEvent(new window.Event('click', { bubbles: true }));
  const escape = () => {
    const event = new window.Event('keydown', { bubbles: true, cancelable: true });
    event.key = 'Escape';
    get('[data-fork]').dispatchEvent(event);
    assert(event.defaultPrevented);
  };
  const tick = milliseconds => {
    now = milliseconds;
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(fn => fn(now));
  };
  return { document, window, get, click, escape, focus, tick, slices };
}

test('rewinding unlocks a closed fork, both routes lead to the same gate, returning restores focus', () => {
  const saved = new Map([['caisik-needle-street-v1', 'diamond']]);
  const { click, get, focus, escape, window } = openStreet(saved);
  click('[data-back]');
  assert.equal(get('[data-follow]').hidden, false);
  assert(get('[data-fork]').hidden);
  click('[data-follow]');
  assert.equal(get('[data-follow]').getAttribute('aria-expanded'), 'true');
  assert.equal(focus.current, get('#needle-fork-title'));
  click('[data-route="stairs"]');
  assert.equal(get('[data-fork]').dataset.cue, 'stairs');
  assert.equal(focus.current, get('[data-branch="stairs"] h4'));
  click('[data-pad="long"]');
  click('[data-pad="short"]');
  click('[data-pad="short"]');
  assert(get('[data-yard]').hidden);
  click('[data-pad="short"]');
  click('[data-pad="long"]');
  click('[data-pad="long"]');
  assert.equal(get('[data-yard]').hidden, false);
  assert.equal(focus.current, get('[data-yard] h4'));
  assert.equal(focus.scrolled, focus.current);
  assert.equal(get('[data-fork]').dataset.cue, 'gate');
  assert(get('[data-branch="stairs"]').hidden);
  window.dispatchEvent(new window.Event('pagehide'));
  assert.equal(get('[data-fork]').dataset.cue, undefined);
  escape();
  assert.equal(focus.current, get('[data-route="stairs"]'));
  click('[data-route="wall"]');
  click('[data-mark="in"]');
  assert(get('[data-yard]').hidden);
  click('[data-mark="out"]');
  assert.equal(focus.current, get('[data-yard] h4'));
  click('[data-route-back]');
  click('[data-route="wall"]');
  click('[data-mark="out"]');
  assert.deepEqual(JSON.parse(saved.get(storeKey)).completed, ['stairs', 'wall']);
  escape();
  escape();
  assert(get('[data-fork]').hidden);
  assert.equal(focus.current, get('[data-follow]'));
  assert.equal(openStreet(saved).get('[data-fork]').hidden, true);
});

test('a completed legacy route resumes in the courtyard without autoplay; reduced motion allows replay', () => {
  const saved = new Map([
    ['caisik-needle-carrier-v1', 'silver-gloves'],
    [storeKey, JSON.stringify({ route: 'wall', completed: ['wall'] })],
  ]);
  const { get, click, document, window, focus } = openStreet(saved, true);
  assert.equal(get('[data-yard]').hidden, false);
  assert.equal(get('[data-fork]').dataset.cue, undefined);
  assert.equal(focus.current, undefined);
  click('[data-route-back]');
  click('[data-route="wall"]');
  assert.equal(get('[data-fork]').dataset.cue, undefined);
  assert.equal(openStreet(saved).get('[data-branch="wall"]').hidden, false);
  click('[data-mark="out"]');
  assert.equal(focus.current, get('[data-yard] h4'));
  assert.equal(get('[data-fork]').dataset.cue, undefined);
  document.documentElement.lang = 'fr';
  window.dispatchEvent(new window.Event('caisik:languagechange'));
  assert.equal(get('[data-follow]').textContent, 'Revenir dans la rue');
  assert.equal(get('[data-yard] h4').textContent, 'La cour intérieure');
  assert.equal(openStreet(saved).get('[data-yard]').hidden, false);
});

test('quiet mode skips the cue and unearned courtyard state falls back to the selected puzzle', () => {
  const saved = new Map([
    ['caisik-needle-carrier-v1', 'silver-gloves'],
    [storeKey, JSON.stringify({ route: 'stairs', completed: [], view: 'yard' })],
  ]);
  const { click, get, document } = openStreet(saved);
  assert(get('[data-yard]').hidden);
  assert.equal(get('[data-branch="stairs"]').hidden, false);
  document.documentElement.dataset.selfmadeMotion = 'quiet';
  click('[data-route="wall"]');
  assert.equal(get('[data-fork]').dataset.cue, undefined);
  click('[data-mark="out"]');
  assert.equal(get('[data-fork]').dataset.cue, undefined);
  assert.equal(get('[data-yard]').hidden, false);
});

const yardSave = () => new Map([
  ['caisik-needle-carrier-v1', 'silver-gloves'],
  [storeKey, JSON.stringify({ route: 'wall', completed: ['wall'], view: 'yard' })],
]);

test('a silent rhythm is saved once, travels to window II, and can replay after a reload', () => {
  const saved = yardSave();
  const { get, click, focus, tick, window } = openStreet(saved);
  let changes = 0;
  window.addEventListener(imprintEvent, () => changes++);
  assert(get('[data-imprint-save]').disabled);
  assert(get('[data-imprint-return]').hidden);
  click('[data-imprint-step="0"]');
  click('[data-imprint-step="3"]');
  click('[data-imprint-step="6"]');
  click('[data-imprint-preview]');
  tick(10);
  assert(get('[data-imprint-step="0"]').classList.contains('is-current'));
  tick(1050);
  assert(get('[data-imprint-step="3"]').classList.contains('is-current'));
  tick(2750);
  assert(!get('.is-current'));
  click('[data-imprint-save]');
  click('[data-imprint-save]');
  const pattern = [true, false, false, true, false, false, true, false];
  assert.deepEqual(JSON.parse(saved.get(imprintKey)), { steps: pattern, returned: false });
  assert.equal(get('[data-imprint-return]').hidden, false);
  assert(get('[data-imprint-window-mark]').hidden);
  click('[data-imprint-return]');
  assert.equal(focus.current, get('[data-window="1"]'));
  assert.equal(focus.scrolled, focus.current);
  assert(get('[data-imprint-editor]').hidden);
  assert.equal(get('[data-imprint-window-mark]').hidden, false);
  assert.deepEqual([...get('[data-imprint-window-mark]').children].map(dot => dot.classList.contains('is-on')), pattern);
  assert.deepEqual(JSON.parse(saved.get(imprintKey)), { steps: pattern, returned: true });
  assert.equal(changes, 3);
  const resumed = openStreet(saved);
  assert.equal(resumed.get('[data-imprint-window-mark]').hidden, false);
  assert.equal(resumed.get('[data-follow]').textContent, 'Vrátit se na dvůr');
  resumed.click('[data-window="1"]');
  resumed.tick(350);
  assert(!resumed.get('[data-window="1"]').classList.contains('imprint-beat'));
  resumed.tick(1050);
  assert(resumed.get('[data-window="1"]').classList.contains('imprint-beat'));
  resumed.click('[data-follow]');
  assert.equal(resumed.get('[data-imprint-editor]').hidden, false);
  assert.equal(resumed.get('[data-imprint-step="3"]').getAttribute('aria-pressed'), 'true');
});

test('enabled hits trim decoder padding, use one audio clock, and stop when muted', async () => {
  const saved = yardSave();
  saved.set('caisik-needle-street-sound-v1', 'on');
  const { get, click, tick, slices } = openStreet(saved, false, true);
  click('[data-imprint-step="0"]');
  click('[data-imprint-step="2"]');
  click('[data-imprint-preview]');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(slices.map(slice => slice.args.map(value => Number(value.toFixed(3)))), [
    [10.03, .016, .144], [10.71, .016, .144],
  ]);
  tick(1001);
  assert(get('[data-imprint-step="0"]').classList.contains('is-current'));
  tick(1681);
  assert(get('[data-imprint-step="2"]').classList.contains('is-current'));
  click('[data-needle-sound]');
  assert(slices.every(slice => slice.stopped));
  tick(2000);
  assert(!get('.is-current'));
});
