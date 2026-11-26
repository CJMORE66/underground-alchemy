import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { imprintEvent, imprintKey, readImprint } from '../dist/needle-imprint-store.js';
import {
  cornerChoices, cornerNoteEvent, cornerNoteKey, cornerReadings, cornerWitnesses,
  readCornerNote, readCornerProgress, writeCornerProgress,
} from '../dist/corner-note-store.js';

const source = name => readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8');
const runtime = source('corner-quest.js').replace(/^import .*\r?\n/gm, '');
const steps = [true, false, false, true, false, false, true, false];
const unlocked = () => new Map([[imprintKey, JSON.stringify({ steps, returned: true })]]);

function boot(data = unlocked(), rejectWrites = false) {
  const { document, window } = parseHTML(source('index.html'));
  document.documentElement.lang = 'cs';
  const get = selector => document.querySelector(selector);
  const note = document.createElement('aside');
  note.id = 'corner-map-note';
  note.tabIndex = -1;
  note.innerHTML = '<a href="#corner-quest">Quest</a><a href="#corner-recall">Recall</a>';
  document.body.append(note);
  let focused;
  let writes = 0;
  let changes = 0;
  const storage = {
    getItem: key => data.get(key),
    setItem(key, value) {
      if (rejectWrites) throw Error('Quota');
      writes++;
      data.set(key, value);
    },
  };
  const location = { hash: '' };
  const history = { pushState: (_, __, hash) => { location.hash = hash; } };
  window.HTMLElement.prototype.focus = function () { focused = this; };
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.addEventListener(cornerNoteEvent, () => { changes++; });
  runInNewContext(runtime, {
    document, window, Event: window.Event, location, history, imprintEvent, imprintKey,
    readImprint: () => readImprint(storage),
    cornerChoices, cornerNoteEvent, cornerNoteKey, cornerReadings, cornerWitnesses,
    readCornerProgress: () => readCornerProgress(storage),
    writeCornerProgress: value => writeCornerProgress(value, storage),
  });
  const click = selector => get(selector).click();
  const key = (selector, name) => {
    const event = new window.Event('keydown', { bubbles: true, cancelable: true });
    event.key = name;
    get(selector).dispatchEvent(event);
    return event.defaultPrevented;
  };
  const inspect = witness => {
    click(`[data-corner-witness="${witness}"]`);
    click('[data-corner-inspect]');
  };
  return {
    document, window, get, click, key, inspect, storage, location,
    focused: () => focused, writes: () => writes, changes: () => changes,
  };
}

test('a returned imprint opens the scene, and three separately examined details unlock the choice', () => {
  const data = new Map();
  const app = boot(data);
  assert(app.get('[data-corner-quest]').hidden);
  data.set(imprintKey, JSON.stringify({ steps, returned: true }));
  app.window.dispatchEvent(new app.window.Event(imprintEvent));
  app.click('[data-corner-open]');
  assert.equal(app.focused(), app.get('[data-corner-title]'));
  assert(app.get('[data-corner-solutions]').hidden);
  app.inspect('courier');
  assert.match(app.get('[data-corner-clue]').textContent, /kosočtverec/);
  app.inspect('courier');
  assert.equal(app.writes(), 1);
  assert(app.key('[data-corner-witness="courier"]', 'ArrowRight'));
  assert.equal(app.focused(), app.get('[data-corner-witness="dj"]'));
  assert(app.get('[data-corner-clue]').hidden);
  app.click('[data-corner-inspect]');
  assert.match(app.get('[data-corner-clue]').textContent, /jedné doby/);
  assert(app.key('[data-corner-close]', 'Escape'));
  assert.equal(app.focused(), app.get('[data-corner-open]'));
  const returned = boot(data);
  returned.click('[data-corner-open]');
  assert.match(returned.get('[data-corner-count]').textContent, /2\/3/);
  assert.equal(readCornerNote(returned.storage), null);
  returned.inspect('inspector');
  assert.match(returned.get('[data-corner-clue]').textContent, /rukavice/);
  assert(!returned.get('[data-corner-solutions]').hidden);
  assert(returned.get('[data-corner-save]').disabled);
});

test('one exact interpretation survives reload and leads from the map to the matching alchemist reply', () => {
  const data = unlocked();
  const app = boot(data);
  app.click('[data-corner-open]');
  for (const witness of cornerWitnesses) app.inspect(witness);
  app.click('[data-corner-choice="timing"]');
  app.click('[data-corner-save]');
  app.click('[data-corner-save]');
  assert.equal(app.writes(), 4);
  assert.equal(app.changes(), 1);
  assert.deepEqual(readCornerNote(app.storage), { seen: [...cornerWitnesses], reading: 'timing' });
  app.click('[data-corner-map-link]');
  assert.equal(app.location.hash, '#corner-map-note');
  assert.equal(app.focused().id, 'corner-map-note');
  assert(app.key('#corner-map-note', 'Escape'));
  assert.equal(app.focused(), app.get('[data-corner-title]'));
  const returned = boot(data);
  assert(!returned.get('[data-corner-recall]').hidden);
  returned.click('#corner-map-note a[href="#corner-recall"]');
  assert.equal(returned.focused().id, 'corner-recall');
  returned.click('[data-corner-recall-open]');
  assert.equal(returned.get('[data-corner-recall-copy]').textContent, cornerReadings.cs.timing.recall);
  returned.document.documentElement.lang = 'fr';
  returned.window.dispatchEvent(new returned.window.Event('caisik:languagechange'));
  assert.equal(returned.get('[data-corner-recall-copy]').textContent, cornerReadings.fr.timing.recall);
  assert(returned.key('[data-corner-recall-open]', 'Escape'));
  assert(returned.get('[data-corner-recall-copy]').hidden);
});

test('failed saves keep the clue walkthrough usable without granting a map note', () => {
  const app = boot(unlocked(), true);
  app.click('[data-corner-open]');
  for (const witness of cornerWitnesses) app.inspect(witness);
  app.click('[data-corner-choice="memory"]');
  app.click('[data-corner-save]');
  assert.equal(app.writes(), 0);
  assert.equal(app.changes(), 0);
  assert.match(app.get('[data-corner-feedback]').textContent, /nepodařilo/);
  assert(app.get('[data-corner-map-link]').hidden);
  assert(app.get('[data-corner-recall]').hidden);
});

test('the store rejects malformed data, repeated clues and premature interpretations', () => {
  let data = '{broken';
  const storage = {getItem: () => data, setItem: (_, raw) => { data = raw; }};
  assert.equal(readCornerProgress(storage), null);
  assert(!writeCornerProgress({seen:['dj'], reading:'timing'}, storage));
  assert(!writeCornerProgress({seen:['dj','dj','courier'], reading:'timing'}, storage));
  assert(writeCornerProgress({seen:['dj','courier'], reading:null}, storage));
  assert.equal(readCornerNote(storage), null);
});
