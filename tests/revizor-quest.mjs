import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { imprintEvent, imprintKey, imprintLength, readImprint } from '../dist/needle-imprint-store.js';
import { normalizeEnding, readRevizor, revizorEvent, revizorKey, writeRevizor } from '../dist/revizor-store.js';

const source = name => readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8');
const runtime = name => source(name).replace(/^import .*\r?\n/gm, '');
const metroKey = 'caisik-metro-dj-v1';
const steps = [true, false, false, true, false, false, true, false];

function boot(saved = new Map(), options = {}) {
  const { document, window } = parseHTML(source('index.html'));
  document.documentElement.lang = options.lang || 'cs';
  const get = selector => document.querySelector(selector);
  const localStorage = {
    getItem: key => saved.get(key),
    setItem(key, value) {
      if (options.reject && key === revizorKey) throw new Error('Quota exceeded');
      saved.set(key, value);
    },
  };
  let focused;
  for (const element of get('#metro-quest').querySelectorAll('button,input,h2,h3,h4,figure')) {
    element.focus = () => { focused = element; };
  }
  window.HTMLElement.prototype.scrollIntoView = () => {};
  let phrase;
  const context = {
    document, window, localStorage, Event: window.Event, matchMedia: () => ({ matches: Boolean(options.reduced) }),
    imprintEvent, imprintKey, imprintLength, readImprint: () => readImprint(localStorage),
    normalizeEnding, revizorEvent, revizorKey,
    readRevizor: () => readRevizor(localStorage), writeRevizor: verse => writeRevizor(verse, localStorage),
    createMetroAudio(settings) {
      return {
        play(sequence) { phrase = [...sequence]; settings.onStep(0, sequence[0]); },
        stop() { phrase = null; },
      };
    },
  };
  for (const file of ['metro-quest.js', 'revizor-quest.js']) {
    runInNewContext('(function () {\n' + runtime(file) + '\n})();', context);
  }
  const click = selector => get(selector).click();
  const fill = (index, value) => {
    const field = get(`[data-revizor-ending="${index}"]`);
    field.value = value;
    field.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const submit = () => get('[data-revizor-form]').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  return { get, click, window, document, fill, submit, focused: () => focused, phrase: () => phrase };
}

const previousWin = () => new Map([
  [imprintKey, JSON.stringify({ steps, returned: true })],
  [metroKey, JSON.stringify({ steps })],
]);

test('the inspector opens only on the solved platform and reuses the saved DJ mix', () => {
  const saved = new Map([[imprintKey, JSON.stringify({ steps, returned: true })]]);
  const app = boot(saved);
  const { get, click, window, focused, phrase } = app;
  assert(get('[data-revizor]').hidden);
  click('[data-metro-open]');
  assert(get('[data-revizor]').hidden);
  click('[data-metro-cue]');
  for (const note of ['low', 'high', 'low', 'low']) click(`[data-metro-pad="${note}"]`);
  assert(!get('[data-revizor]').hidden);
  click('[data-revizor-open]');
  assert.equal(focused(), get('[data-revizor-title]'));
  click('[data-revizor-beat]');
  assert.deepEqual(phrase(), ['low', 'high', 'low', 'low', ...steps.map(step => step ? 'low' : null)]);
  assert.equal(get('[data-revizor-beat]').getAttribute('aria-pressed'), 'true');
  const escape = new window.Event('keydown', { bubbles: true, cancelable: true });
  escape.key = 'Escape';
  get('[data-revizor-ending="0"]').dispatchEvent(escape);
  assert(escape.defaultPrevented);
  assert(get('[data-revizor-panel]').hidden);
  assert(!get('[data-metro-platform]').hidden);
  assert.equal(phrase(), null);
  assert.equal(focused(), get('[data-revizor-open]'));
});

test('two player endings save once and the exact second ending appears in the street after return and reload', () => {
  const saved = previousWin();
  const { get, click, fill, submit, focused, window } = boot(saved);
  const ending = '<b>„Basa mluví“</b>';
  click('[data-metro-open]');
  click('[data-revizor-open]');
  fill(0, 'poslední spoj');
  submit();
  assert.equal(get('[data-revizor-ending="1"]').getAttribute('aria-invalid'), 'true');
  assert.equal(focused(), get('[data-revizor-ending="1"]'));
  assert(!saved.has(revizorKey));

  let changes = 0;
  window.addEventListener(revizorEvent, () => changes++);
  fill(1, ending);
  submit();
  submit();
  assert.equal(changes, 1);
  assert.deepEqual(JSON.parse(saved.get(revizorKey)), { endings: ['poslední spoj', ending], lang: 'cs' });
  assert(get('[data-revizor]').hasAttribute('data-stamped'));
  assert(get('[data-revizor]').hasAttribute('data-stamp-motion'));
  assert(get('[data-metro-reward]').hidden);
  click('[data-revizor-street]');
  assert(get('[data-metro-platform]').hidden);
  assert(!get('[data-metro-reward]').hidden);
  assert.equal(focused(), get('[data-revizor-echo]'));
  assert.equal(get('[data-revizor-quote]').textContent, ending);
  assert.equal(get('[data-revizor-quote] b'), null);
  const reopened = boot(saved, { lang: 'en' });
  assert.equal(reopened.get('[data-revizor-quote]').textContent, ending);
  assert.equal(reopened.get('[data-revizor-quote]').lang, 'cs');
  assert.match(reopened.get('[data-revizor-line="echoLead"]').textContent, /second ending/);
});

test('localized prepared endings are editable, while failed storage gives no stamp or echo', () => {
  const saved = previousWin();
  const { get, click, fill, submit } = boot(saved, { lang: 'fr', reduced: true, reject: true });
  click('[data-metro-open]');
  click('[data-revizor-open]');
  click('[data-revizor-preset]');
  assert.match(get('[data-revizor-ending="0"]').value, /calme/);
  fill(1, 'et le quai se met à danser');
  submit();
  assert(!saved.has(revizorKey));
  assert(get('[data-revizor-stamp]').hidden);
  assert(get('[data-revizor-echo]').hidden);
  assert.match(get('[data-revizor-status]').textContent, /sauvegarder/);
});
