import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { imprintEvent, imprintKey, readImprint } from '../dist/needle-imprint-store.js';
import { readWriterRepair, repairPointLimit, writeWriterRepair, writerRepairEvent, writerRepairKey } from '../dist/writer-repair-store.js';

const source = name => readFileSync(new URL('../dist/' + name, import.meta.url), 'utf8');
const script = source('writer-quest.js').replace(/^import .*\r?\n/gm, '');
const steps = [true, false, false, true, false, false, true, false];
const solved = () => new Map([[imprintKey, JSON.stringify({ steps, returned: true })]]);

function boot(saved = new Map(), rejects = false) {
  const { document, window } = parseHTML(source('index.html'));
  const get = selector => document.querySelector(selector);
  let writes = 0;
  let focused;
  let captured;
  let repairEvents = 0;
  const storage = {
    getItem: key => saved.get(key),
    setItem(key, value) {
      if (rejects && key === writerRepairKey) throw Error('Quota');
      writes++;
      saved.set(key, value);
    },
  };
  const location = { hash: '' };
  const history = { pushState: (_, __, hash) => { location.hash = hash; } };
  window.HTMLElement.prototype.focus = function () { focused = this; };
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.addEventListener(writerRepairEvent, () => { repairEvents++; });
  const pad = get('[data-writer-pad]');
  pad.getBoundingClientRect = () => ({left: 10, top: 14, width: 100, height: 100});
  pad.setPointerCapture = id => { captured = id; };
  pad.hasPointerCapture = id => captured === id;
  pad.releasePointerCapture = () => { captured = undefined; };
  runInNewContext(script, {
    document, window, location, history, Event: window.Event,
    imprintEvent, imprintKey, readImprint: () => readImprint(storage),
    writerRepairKey, writerRepairEvent, repairPointLimit,
    readWriterRepair: () => readWriterRepair(storage),
    writeWriterRepair: repair => writeWriterRepair(repair, storage),
  });
  const click = selector => get(selector).click();
  const send = (element, type, values = {}) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, values);
    element.dispatchEvent(event);
    return event;
  };
  return {
    get, window, document, location, storage, click, send,
    writes: () => writes, focused: () => focused, repairEvents: () => repairEvents,
    pointer: (type, x, y) => send(pad, type, { pointerId: 1, button: 0, isPrimary: true, clientX: x + 10, clientY: y + 14 }),
    editor: () => {
      click('[data-writer-open]');
      click('[data-writer-stage="0"] [data-writer-next]');
      click('[data-writer-stage="1"] [data-writer-next]');
    },
  };
}

const strokeAt = (app, area) => app.get(`[data-writer-${area}] [data-writer-path]`).getAttribute('points');

test('Writer waits for the returned imprint and guides the player through the original poster and the crate', () => {
  const data = new Map([[imprintKey, JSON.stringify({ steps, returned: false })]]);
  const app = boot(data);
  assert(app.get('[data-writer]').hidden);
  data.set(imprintKey, JSON.stringify({ steps, returned: true }));
  app.window.dispatchEvent(new app.window.Event(imprintEvent));
  assert(!app.get('[data-writer]').hidden);
  app.click('[data-writer-open]');
  assert.equal(app.focused().id, 'writer-poster-title');
  app.click('[data-writer-stage="0"] [data-writer-next]');
  assert.equal(app.focused().id, 'writer-crate-title');
  app.click('[data-writer-stage="1"] [data-writer-prev]');
  assert.equal(app.focused().id, 'writer-poster-title');
  app.send(app.focused(), 'keydown', { key: 'Escape' });
  assert(app.get('[data-writer-panel]').hidden);
  assert.equal(app.focused(), app.get('[data-writer-open]'));
});

test('the exact free stroke persists on the wall and DJ sleeve, with one write across repeated saves and reload', () => {
  const data = solved();
  const app = boot(data);
  app.editor();
  assert(app.get('[data-writer-save]').disabled);
  app.pointer('pointerdown', 13, 44);
  app.pointer('pointerup', 75, 46);
  assert.equal(strokeAt(app, 'pad'), '');
  app.click('[data-writer-draw]');
  app.pointer('pointerdown', 90, 90);
  app.pointer('pointerup', 80, 55);
  assert.equal(strokeAt(app, 'pad'), '');
  app.pointer('pointerdown', 13, 44);
  app.pointer('pointermove', 39, 50);
  app.pointer('pointerup', 52, 52);
  assert.equal(strokeAt(app, 'pad'), '');
  assert(!app.get('[data-writer]').hasAttribute('data-drawing'));
  app.click('[data-writer-draw]');
  app.pointer('pointerdown', 13, 44);
  app.pointer('pointermove', 42, 29);
  app.pointer('pointerup', 86, 62);
  assert.equal(strokeAt(app, 'pad'), '13,44 42,29 86,62');
  app.click('[data-writer-save]');
  app.click('[data-writer-save]');
  assert.equal(app.writes(), 1);
  assert.equal(app.repairEvents(), 1);
  assert.deepEqual(readWriterRepair(app.storage), { kind: 'drawn', points: [[13,44],[42,29],[86,62]] });
  for (const area of ['wall', 'sleeve']) assert.equal(strokeAt(app, area), strokeAt(app, 'pad'));
  app.click('[data-writer-wall-link]');
  assert.equal(app.location.hash, '#writer-wall');
  assert.equal(app.focused().id, 'writer-wall');
  app.send(app.focused(), 'keydown', { key: 'Escape' });
  assert.equal(app.focused().id, 'writer-repair-title');
  const reopened = boot(data);
  assert.equal(strokeAt(reopened, 'wall'), '13,44 42,29 86,62');
  reopened.click('[data-writer-open]');
  assert.equal(reopened.focused().id, 'writer-repair-title');
});

test('preset controls work without pointer, an interrupted stroke cancels cleanly and rejected saves add no reward', () => {
  const app = boot(solved(), true);
  app.editor();
  app.click('[data-writer-preset="hook"]');
  const preset = strokeAt(app, 'pad');
  app.click('[data-writer-draw]');
  app.pointer('pointerdown', 13, 44);
  app.pointer('pointermove', 65, 42);
  app.pointer('pointercancel', 65, 42);
  assert.equal(strokeAt(app, 'pad'), preset);
  app.click('[data-writer-draw]');
  app.send(app.get('[data-writer-draw]'), 'keydown', { key: 'Escape' });
  assert(!app.get('[data-writer]').hasAttribute('data-drawing'));
  assert(!app.get('[data-writer-panel]').hidden);
  app.click('[data-writer-save]');
  assert.equal(app.writes(), 0);
  assert(app.get('[data-writer-wall]').hidden);
  assert(app.get('[data-writer-sleeve]').hidden);
  app.document.documentElement.lang = 'fr';
  app.window.dispatchEvent(new app.window.Event('caisik:languagechange'));
  assert.match(app.get('[data-writer-status]').textContent, /Impossible/);
  assert.equal(app.get('[data-writer-preset="hook"]').textContent, 'Trait coudé');
  app.click('[data-writer-clear]');
  assert(app.get('[data-writer-save]').disabled);
});

test('store rejects corrupted, sparse and out of bounds repair points', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  for (const points of [
    [[0, 0], [101, 91]], [[13, 44], ['70', 73]], [[12, 0], [12, 0]], [Array(2), [76, 77]],
    [...Array.from({length: 96}, () => [0, 0]), [77, 77]],
  ]) assert(!writeWriterRepair({kind: 'drawn', points}, storage));
  data.set(writerRepairKey, '{ bad');
  assert.equal(readWriterRepair(storage), null);
});
