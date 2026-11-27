import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { imprintEvent, imprintKey, readImprint } from '../dist/needle-imprint-store.js';
import { readRevizor, revizorEvent, revizorKey } from '../dist/revizor-store.js';
import { readWriterRepair, writerRepairEvent, writerRepairKey } from '../dist/writer-repair-store.js';
import { readShadowRoutine, shadowRoutineEvent, shadowRoutineKey } from '../dist/shadow-quest-store.js';
import { cornerNoteEvent, cornerNoteKey, readCornerProgress } from '../dist/corner-note-store.js';

const source = file => readFileSync(new URL('../dist/' + file, import.meta.url), 'utf8');
const runtime = source('street-trails.js').replace(/^import .*\r?\n/gm, '');
const visitKey = 'caisik-street-trails-v1';
const steps = [true, false, false, true, false, false, true, false];
const setup = () => new Map([[imprintKey, JSON.stringify({ steps, returned: true })]]);

function boot(data = setup()) {
  const { document, window } = parseHTML(source('index.html'));
  document.documentElement.lang = 'cs';
  const get = name => document.querySelector(name);
  const location = { hash: '' };
  const history = { pushState: (_, __, hash) => { location.hash = hash; } };
  const localStorage = {getItem: key => data.get(key), setItem: (key, value) => data.set(key, value)};
  let focused;
  let observe;
  const openings = {};
  const names = {dj:'metro', mc:'revizor', writer:'writer', breaking:'shadow', knowledge:'corner'};
  function Observer(callback) {
    observe = callback;
    this.observe = () => {};
  }
  window.MutationObserver = Observer;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLElement.prototype.focus = function () { focused = this; };
  for (const [id, prefix] of Object.entries(names)) {
    openings[id] = 0;
    const opener = get(`[data-${prefix}-open]`);
    opener.addEventListener('click', () => {
      openings[id]++;
      const panelName = id === 'dj' ? 'platform' : 'panel';
      get(`[data-${prefix}-${panelName}]`).hidden = false;
      if (id === 'writer') get('[data-writer-stage="0"]').hidden = false;
      opener.hidden = true;
      opener.setAttribute('aria-expanded', 'true');
    });
  }
  runInNewContext(runtime, {
    document, window, location, history, localStorage, MutationObserver: Observer,
    imprintEvent, imprintKey, readImprint: () => readImprint(localStorage),
    revizorEvent, revizorKey, readRevizor: () => readRevizor(localStorage),
    writerRepairEvent, writerRepairKey, readWriterRepair: () => readWriterRepair(localStorage),
    shadowRoutineEvent, shadowRoutineKey, readShadowRoutine: () => readShadowRoutine(localStorage),
    cornerNoteEvent, cornerNoteKey, readCornerProgress: () => readCornerProgress(localStorage),
  });
  const click = selector => get(selector).click();
  const card = id => get(`[data-trail-card="${id}"]`);
  const open = id => click(`[data-trail-card="${id}"] [data-trail-open]`);
  const emit = name => window.dispatchEvent(new window.Event(name));
  const openNatively = id => {
    const selector = `[data-${names[id]}-open]`;
    click(selector);
    observe([{target: get(selector), oldValue: 'false'}]);
  };
  return { card, click, get, location, document, emit, open, openNatively, openings, focused: () => focused };
}

test('the overview waits for the returned imprint and reads progress from the existing records', () => {
  const data = new Map([[imprintKey, JSON.stringify({steps, returned:false})]]);
  const app = boot(data);
  assert(app.get('[data-street-trails]').hidden);
  data.set(imprintKey, JSON.stringify({steps, returned:true}));
  app.emit(imprintEvent);
  assert(!app.get('[data-street-trails]').hidden);
  assert.equal(app.card('mc').dataset.state, 'locked');
  assert(app.card('mc').querySelector('button').disabled);
  assert.equal(app.card('dj').dataset.state, 'ready');
  assert.equal(app.get('[data-trails-count]').textContent, 'Dokončeno 0/5');
  app.get('[data-metro-platform]').setAttribute('data-gate-open', '');
  app.emit('caisik:metro-state');
  assert.equal(app.card('dj').dataset.state, 'done');
  assert.equal(app.card('mc').dataset.state, 'ready');
  data.set(writerRepairKey, JSON.stringify({kind:'preset', points:[[0,0],[30,40]]}));
  app.emit(writerRepairEvent);
  assert.equal(app.card('writer').dataset.state, 'done');
  assert.equal(app.get('[data-trails-count]').textContent, 'Dokončeno 2/5');
});

test('the ledger enters the actual writer panel and returns without resetting an open stage', () => {
  const data = setup();
  const app = boot(data);
  app.click('[data-trails-entry]');
  assert.equal(app.location.hash, '#street-trails');
  assert.equal(app.focused(), app.get('[data-trails-title]'));
  app.open('writer');
  assert.equal(app.location.hash, '#writer-panel');
  assert.equal(app.focused(), app.get('[data-writer-stage="0"] [data-writer-step-title]'));
  app.get('[data-writer-stage="0"]').hidden = true;
  app.get('[data-writer-stage="1"]').hidden = false;
  app.click('[data-writer-panel] [data-trails-back]');
  assert.equal(app.focused(), app.card('writer').querySelector('button'));
  assert.equal(app.card('writer').querySelector('[data-trail-state]').textContent, 'Rozpracováno');
  app.click('[data-trails-continue]');
  assert.equal(app.openings.writer, 1);
  assert.equal(app.focused(), app.get('[data-writer-stage="1"] [data-writer-step-title]'));
  const reopened = boot(data);
  assert.match(reopened.get('[data-trails-continue]').textContent, /Šipka/);
  reopened.click('[data-trails-continue]');
  assert.equal(reopened.openings.writer, 1);
});

test('the inspector opens through its native parent and returns focus to its own card', () => {
  const app = boot();
  app.open('mc');
  assert.equal(app.openings.mc, 0);
  app.get('[data-metro-platform]').setAttribute('data-gate-open', '');
  app.emit('caisik:metro-state');
  app.open('mc');
  assert.equal(app.openings.dj, 1);
  assert.equal(app.openings.mc, 1);
  assert.equal(app.focused(), app.get('[data-revizor-title]'));
  app.click('[data-revizor-panel] [data-trails-back]');
  assert.equal(app.focused(), app.card('mc').querySelector('button'));
});

test('old witness details reconcile with native visits, localization and the most recent unfinished trail', () => {
  const data = setup();
  data.set(cornerNoteKey, JSON.stringify({seen:['courier','dj'],reading:null}));
  data.set(visitKey, JSON.stringify({visited:['invalid','knowledge','knowledge']}));
  const app = boot(data);
  assert.match(app.card('knowledge').querySelector('[data-trail-summary]').textContent, /2\/3/);
  app.openNatively('breaking');
  assert.match(app.get('[data-trails-continue]').textContent, /Souboj se stínem/);
  data.set(shadowRoutineKey, JSON.stringify({moves:['step','freeze','turn']}));
  app.emit(shadowRoutineEvent);
  assert.match(app.get('[data-trails-continue]').textContent, /Stejný roh/);
  app.document.documentElement.lang = 'fr';
  app.emit('caisik:languagechange');
  assert.equal(app.get('[data-trails-title]').textContent, 'Pistes secondaires');
  assert.match(app.get('[data-trails-line="intro"]').textContent, /La fenêtre II/);
  assert.match(app.get('[data-trails-continue]').textContent, /Même coin/);
});
