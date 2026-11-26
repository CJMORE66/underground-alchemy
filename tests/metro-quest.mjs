import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { imprintEvent, imprintKey, imprintLength, readImprint } from '../dist/needle-imprint-store.js';

const page = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../dist/metro-quest.js', import.meta.url), 'utf8').replace(/^import .*\r?\n/gm, '');
const questKey = 'caisik-metro-dj-v1';
const soundKey = 'caisik-needle-street-sound-v1';
const steps = [true, false, false, true, false, false, true, false];

function openQuest(storage, { reduced = false, failWrites = false } = {}) {
  const { document, window } = parseHTML(page);
  document.documentElement.lang = 'cs';
  const get = selector => document.querySelector(selector);
  const localStorage = {
    getItem: key => storage.get(key),
    setItem(key, value) {
      if (failWrites && key === questKey) throw Error('Quota');
      storage.set(key, value);
    },
  };
  let focused;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const element of document.querySelectorAll('#metro-quest button,#metro-quest h3,#metro-quest h4')) {
    element.focus = () => { focused = element; };
  }
  let transport;
  let phrase;
  runInNewContext(runtime, {
    document, window, localStorage, Event: window.Event, matchMedia: () => ({ matches: reduced }),
    imprintEvent, imprintKey, imprintLength, readImprint: () => readImprint(localStorage),
    createMetroAudio(options) {
      transport = options;
      return {
        play(sequence) { phrase = [...sequence]; options.onStep(0, sequence[0]); },
        stop() { phrase = null; },
      };
    },
  });
  const click = selector => get(selector).dispatchEvent(new window.Event('click', { bubbles: true }));
  const pad = note => click(`[data-metro-pad="${note}"]`);
  const solve = () => ['low', 'high', 'low', 'low'].forEach(pad);
  return { get, document, window, click, pad, solve, transport, focused: () => focused, phrase: () => phrase };
}

test('a silent side quest opens after returning the imprint, can be skipped, and echoes the exact saved steps in the street DJ mix', () => {
  const storage = new Map([[imprintKey, JSON.stringify({ steps, returned: false })]]);
  const app = openQuest(storage);
  const { get, click, pad, solve, window, focused, phrase, transport } = app;
  assert(get('[data-metro-quest]').hidden);
  storage.set(imprintKey, JSON.stringify({ steps, returned: true }));
  window.dispatchEvent(new window.Event(imprintEvent));
  assert(!get('[data-metro-quest]').hidden);
  assert(get('[data-metro-reward]').hidden);

  click('[data-metro-open]');
  assert(!get('[data-metro-platform]').hidden);
  assert(get('[data-metro-model]').hidden);
  assert(get('[data-metro-pad=low]').disabled);
  const escape = new window.Event('keydown', { bubbles: true, cancelable: true });
  escape.key = 'Escape';
  get('[data-metro-platform]').dispatchEvent(escape);
  assert(escape.defaultPrevented);
  assert(get('[data-metro-platform]').hidden);
  assert.equal(focused(), get('[data-metro-open]'));

  click('[data-metro-open]');
  click('[data-metro-cue]');
  assert(!transport.soundEnabled());
  assert.deepEqual(phrase(), ['low', 'high', 'low', 'low']);
  assert(get('[data-metro-model]').firstElementChild.classList.contains('is-current'));
  assert.match(get('[data-metro-model-text]').textContent, /Dun, Cvak, Dun, Dun/);
  pad('high');
  assert.match(get('[data-metro-status]').textContent, /od prvního úderu/);
  assert.equal(storage.has(questKey), false);
  solve();
  assert(get('[data-metro-platform]').hasAttribute('data-gate-open'));
  assert.equal(focused(), get('[data-metro-return]'));
  const saved = storage.get(questKey);
  assert.deepEqual(JSON.parse(saved), { steps });
  pad('low');
  assert.equal(storage.get(questKey), saved);
  click('[data-metro-return]');
  assert(get('[data-metro-platform]').hidden);
  assert(!get('[data-metro-reward]').hidden);
  assert.equal(focused(), get('[data-metro-mix]'));

  const reopened = openQuest(storage, { reduced: true });
  assert(!reopened.get('[data-metro-reward]').hidden);
  reopened.click('[data-metro-mix]');
  assert.deepEqual(reopened.phrase(), ['low', 'high', 'low', 'low', ...steps.map(hit => hit ? 'low' : null)]);
  assert(!reopened.get('#metro-quest .is-current'));
  assert.equal(reopened.get('[data-metro-mix-pattern]').children.length, 12);
  reopened.document.documentElement.lang = 'fr';
  reopened.window.dispatchEvent(new reopened.window.Event('caisik:languagechange'));
  assert.equal(reopened.get('[data-metro-mix]').textContent, 'Écouter la transition du DJ');
});

test('malformed and failed saves do not award a mix, and the shared sound setting stops an active phrase when muted', () => {
  const storage = new Map([
    [imprintKey, JSON.stringify({ steps, returned: true })],
    [questKey, JSON.stringify({ steps: Array(8).fill('false') })],
  ]);
  const { get, click, solve, window, phrase, transport } = openQuest(storage, { failWrites: true });
  assert(get('[data-metro-reward]').hidden);
  click('[data-metro-open]');
  click('[data-metro-sound]');
  assert(transport.soundEnabled());
  assert.equal(storage.get(soundKey), 'on');
  click('[data-metro-cue]');
  assert(phrase());
  window.dispatchEvent(new window.CustomEvent('caisik:story-sound-change', { detail: false }));
  assert(!transport.soundEnabled());
  assert.equal(phrase(), null);
  solve();
  assert.match(get('[data-metro-status]').textContent, /nepodařilo uložit/);
  assert(!get('[data-metro-platform]').hasAttribute('data-gate-open'));
  click('[data-metro-close]');
  assert(get('[data-metro-reward]').hidden);
});
