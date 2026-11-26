// Execute the shared contents runtime against real markup with deterministic focus and scroll.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const dist = new URL('../dist/', import.meta.url);
const source = readFileSync(new URL('iris-engine.js', dist), 'utf8');
const mark = readFileSync(new URL('assets/logo/caisik-iris-motion.svg', dist), 'utf8');
const coreRoutes = ['home', 'story', 'map', 'principles', 'frequency', 'selfmade', 'expeditions', 'wall', 'shop', 'blackbook'];

async function page(path = '/', { saved = {}, storageUnavailable = false } = {}) {
  const location = new URL(path, 'https://example.test');
  const filename = path.slice(1) + 'index.html';
  const { document, window } = parseHTML(readFileSync(new URL(filename, dist), 'utf8'));
  const original = document.querySelector('#exp-mode, .brand-dock [href="#shop-cart"], #notebook-open');
  const dock = document.createElement('aside');
  dock.dataset.languageDock = '';
  document.body.append(dock);
  let lang = 'cs';
  let activeElement = document.body;
  let token = 0;
  const frames = new Map();
  const storage = new Map(Object.entries(saved));
  const bounds = new Map();
  Object.defineProperty(document, 'activeElement', { get: () => activeElement });
  Object.defineProperty(document, 'hidden', { value: false, writable: true });
  window.CaisikI18n = { getLanguage: () => lang };
  const fire = (target, type, extras = {}) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, extras);
    target.dispatchEvent(event);
    return event;
  };
  window.HTMLElement.prototype.focus = function () {
    activeElement = this;
    fire(this, 'focusin');
  };
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.matches('.iris-dock')) return { top: 0, bottom: 116, height: 116 };
    return bounds.get(this.id) || { top: 1000, bottom: 2000, height: 1000 };
  };
  vm.runInNewContext(source, {
    document, window, location, URL, DOMParser: window.DOMParser, CustomEvent: window.CustomEvent,
    localStorage: { getItem(key) { if (storageUnavailable) throw new Error('Storage unavailable'); return storage.get(key) ?? null; } },
    fetch: async url => { assert.match(url, /caisik-iris-motion\.svg/); return { ok: true, text: async () => mark }; },
    requestAnimationFrame: fn => { frames.set(++token, fn); return token; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  await new Promise(resolve => setImmediate(resolve));
  const head = document.querySelector('.iris-dock');
  const toggle = head.querySelector('.iris-switch');
  const nav = head.querySelector('.iris-panel');
  const search = nav.querySelector('#iris-search');
  const links = [...nav.querySelectorAll('[data-route]')];
  // Linkedom does not resolve anchor URLs against the page location.
  for (const anchor of nav.querySelectorAll('a[href]')) Object.defineProperty(anchor, 'href', {
    get: () => new URL(anchor.getAttribute('href'), location).href,
  });
  assert.equal(head.querySelector('[data-brand-language]').firstElementChild, dock);
  assert.ok(head.querySelector('.iris-symbol .ua-mark .ua-iris'), 'art swaps to articulated SVG');
  function expanded(expected) {
    assert.equal(toggle.getAttribute('aria-expanded'), String(expected));
    assert.equal(toggle.dataset.open, String(expected));
    assert.equal(nav.hidden, !expected);
  }
  return {
    document, window, location, head, toggle, nav, search, links, original, expanded, fire, frames, storage, bounds,
    link(id) { return links.find(link => link.dataset.route === id); },
    visible() { return [...nav.querySelectorAll('[data-index-item]')].filter(item => !item.hidden).map(item => item.dataset.indexItem); },
    query(value) { search.value = value; fire(search, 'input'); },
    group(id) { fire(nav.querySelector('[data-index-group="' + id + '"]'), 'click'); },
    flush() { const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn()); },
    language(next) { lang = next; fire(window, 'caisik:languagechange', { detail: { language: next } }); },
  };
}

test('Contents open explicitly, include existing destinations and restore focus', async () => {
  const p = await page();
  p.expanded(false);
  assert.deepEqual(p.links.slice(0, 10).map(link => link.dataset.route), coreRoutes);
  assert.deepEqual(p.links.slice(0, 10).map(link => link.getAttribute('href')), [
    '#home', '#needle-street', '#hidden-city', '#principles', '#frequency', '/play/', '/expeditions/', '#living-wall', '/shop/', '/art/',
  ]);
  assert.equal(p.links.length, 22);
  assert.equal(p.head.querySelector('.iris-tools #notebook-open'), p.original);
  assert.ok(p.nav.querySelector('.iris-pages [href="/logo/"]'));
  for (const link of p.links) {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) assert.ok(p.document.getElementById(href.slice(1)), 'local target ' + href);
    else assert.ok(readFileSync(new URL(href.slice(1) + 'index.html', dist), 'utf8'), 'existing route ' + href);
  }
  p.fire(p.toggle, 'pointerenter', { pointerType: 'mouse' });
  p.expanded(false);
  p.fire(p.toggle, 'click');
  p.expanded(true);
  p.fire(p.nav, 'pointerleave', { pointerType: 'mouse' });
  p.expanded(true);
  p.fire(p.nav.querySelector('[data-index-close]'), 'click');
  p.expanded(false);
  assert.equal(p.document.activeElement, p.toggle);
  p.fire(p.toggle, 'keydown', { key: 'ArrowDown' });
  p.expanded(true);
  assert.equal(p.document.activeElement, p.search);
  p.fire(p.document, 'keydown', { key: 'Escape' });
  p.expanded(false);
  assert.equal(p.document.activeElement, p.toggle);
  p.fire(p.window, 'caisik:open-index');
  p.expanded(true);
  assert.equal(p.document.activeElement, p.search);
  p.fire(p.link('map'), 'click');
  p.expanded(false);
  assert.equal(p.document.activeElement.id, 'hidden-city');
  p.fire(p.toggle, 'click');
  p.fire(p.document.body, 'pointerdown', { pointerType: 'touch' });
  p.expanded(false);
});

test('Search, categories and reset filter real topics across all supported languages', async () => {
  const p = await page();
  p.fire(p.toggle, 'click');
  assert.equal(p.visible().length, 22);
  p.query('skryte mesto');
  assert.deepEqual(p.visible(), ['map'], 'Czech search ignores diacritics');
  assert.equal(p.nav.querySelector('[data-search-clear]').hidden, false);
  assert.equal(p.nav.querySelector('[data-search-clear]').getAttribute('type'), 'button');
  const submissions = [];
  p.nav.addEventListener('click', event => {
    const anchor = event.target.closest('[data-route]');
    if (anchor) submissions.push(anchor.dataset.route);
  });
  const form = p.nav.querySelector('.iris-search');
  p.fire(form, 'submit');
  assert.deepEqual(submissions, ['map'], 'Enter activates the first visible result once');
  p.expanded(false);
  assert.equal(p.document.activeElement.id, 'hidden-city', 'the local destination receives focus');
  p.fire(p.toggle, 'click');
  p.query('record your voice');
  assert.deepEqual(p.visible(), ['frequency'], 'multiple search words all match in English');
  p.query('histoire');
  assert.ok(p.visible().includes('story'), 'French can be searched while UI is Czech');
  p.query('');
  p.group('archive');
  assert.deepEqual(p.visible(), ['wall', 'blackbook']);
  p.query('Blackbook');
  assert(p.visible().includes('blackbook'));
  p.fire(p.nav.querySelector('[data-search-clear]'), 'click');
  assert.deepEqual(p.visible(), ['wall', 'blackbook'], 'clear keeps selected category');
  assert.equal(p.document.activeElement, p.search);
  p.query('zzzz-no-such-topic');
  assert.deepEqual(p.visible(), []);
  assert.equal(p.nav.querySelector('.iris-empty').hidden, false);
  p.search.focus();
  p.fire(form, 'submit');
  p.expanded(true);
  assert.equal(p.document.activeElement, p.search);
  assert.deepEqual(submissions, ['map'], 'an empty result set never navigates');
  p.fire(p.nav.querySelector('[data-search-reset]'), 'click');
  assert.equal(p.search.value, '');
  assert.equal(p.visible().length, 22);
  assert.equal(p.nav.querySelector('[data-index-group="all"]').getAttribute('aria-pressed'), 'true');
  assert.equal(p.nav.querySelector('.iris-empty').hidden, true);
  p.group('learn');
  assert.equal(p.visible().length, 14);
  assert.ok(p.visible().includes('writer'));
  assert.ok(p.visible().includes('rhythm'));
  p.language('fr');
  assert.equal(p.nav.getAttribute('aria-label'), 'Sommaire et guide');
  assert.equal(p.link('map').querySelector('.iris-entry-title').textContent, 'La ville cachée');
  assert.equal(p.nav.querySelector('[data-index-group="learn"] span').textContent, 'Apprendre');
  assert.equal(p.visible().length, 14, 'language switch keeps category');
  p.language('en');
  assert.equal(p.search.placeholder, 'Chapter, discipline, principle…');
  assert.equal(p.nav.querySelector('[data-index-title]').textContent, 'Contents and guide');
});

test('Story objective reads existing progression without altering saved values', async () => {
  const legacy = [
    [{}, 'Pusť takt a najdi opožděné okno.'],
    [{ 'caisik-needle-street-v1': 'diamond' }, 'Vrať desku a odhal kurýra.'],
    [{ 'caisik-needle-carrier-v1': 'silver-gloves' }, 'Vyber stopu a najdi cestu na dvůr.'],
    [{ 'caisik-needle-fork-v1': JSON.stringify({ route: 'stairs', completed: ['stairs'] }) }, 'Slož na dvoře vlastní rytmus.'],
    [{ 'caisik-needle-fork-v1': JSON.stringify({ route: 'wall', completed: ['wall'] }) }, 'Slož na dvoře vlastní rytmus.'],
  ];
  for (const [saved, objective] of legacy) {
    const p = await page('/', { saved });
    assert.equal(p.nav.querySelector('[data-story-objective]').textContent, objective);
    assert.deepEqual(Object.fromEntries(p.storage), saved, 'contents only read the existing save');
  }
  const changed = await page();
  changed.storage.set('caisik-needle-carrier-v1', 'silver-gloves');
  changed.fire(changed.toggle, 'click');
  assert.equal(changed.nav.querySelector('[data-story-objective]').textContent, 'Vyber stopu a najdi cestu na dvůr.', 'opening refreshes the objective after play');
  const corrupt = await page('/', { saved: { 'caisik-needle-fork-v1': '{broken', 'caisik-needle-carrier-v1': 'silver-gloves' } });
  assert.equal(corrupt.nav.querySelector('[data-story-objective]').textContent, 'Vyber stopu a najdi cestu na dvůr.', 'damaged newer save keeps the valid legacy clue');
  const badShape = await page('/', { saved: { 'caisik-needle-fork-v1': '{"completed":"stairs"}', 'caisik-needle-street-v1': 'diamond' } });
  assert.equal(badShape.nav.querySelector('[data-story-objective]').textContent, 'Vrať desku a odhal kurýra.');
  const unavailable = await page('/', { storageUnavailable: true });
  assert.equal(unavailable.visible().length, 22);
  assert.equal(unavailable.nav.querySelector('[data-story-objective]').textContent, 'Pusť takt a najdi opožděné okno.');
});

test('Story objective follows the first imprint from composing to replay', async () => {
  const progressKey = 'caisik-needle-fork-v1';
  const imprintKey = 'caisik-needle-imprint-v1';
  const completed = JSON.stringify({ route: 'stairs', completed: ['stairs'] });
  const steps = [true, false, true, false, false, true, false, false];
  const imprint = returned => JSON.stringify({ steps, returned });
  const cases = [
    [undefined, imprint(true), 'Pusť takt a najdi opožděné okno.'],
    [completed, '{broken', 'Slož na dvoře vlastní rytmus.'],
    [completed, JSON.stringify({ steps: Array(8).fill(false), returned: true }), 'Slož na dvoře vlastní rytmus.'],
    [completed, JSON.stringify({ steps: [1, 0, 1, 0, 0, 1, 0, 0], returned: true }), 'Slož na dvoře vlastní rytmus.'],
    [completed, imprint(false), 'Vrať se s rytmem k oknu II.'],
    [completed, imprint(true), 'Přehraj svůj rytmus v okně II.'],
  ];
  for (const [progress, value, objective] of cases) {
    const saved = { [imprintKey]: value };
    if (progress) saved[progressKey] = progress;
    const p = await page('/', { saved });
    assert.equal(p.nav.querySelector('[data-story-objective]').textContent, objective);
    assert.deepEqual(Object.fromEntries(p.storage), saved);
  }
  const p = await page('/', { saved: { [progressKey]: completed, [imprintKey]: imprint(true) } });
  p.language('en');
  assert.equal(p.nav.querySelector('[data-story-objective]').textContent, 'Replay your rhythm at window II.');
  p.language('fr');
  assert.equal(p.nav.querySelector('[data-story-objective]').textContent, 'Rejoue ton rythme à la fenêtre II.');
});

test('Current location follows local sections and scene events', async () => {
  const p = await page();
  p.bounds.set('needle-street', { top: 100, bottom: 800, height: 700 });
  p.flush();
  assert.equal(p.link('story').getAttribute('aria-current'), 'location');
  p.bounds.set('needle-street', { top: -900, bottom: -200, height: 700 });
  p.bounds.set('hidden-city', { top: 90, bottom: 1900, height: 1810 });
  p.fire(p.window, 'scroll');
  p.flush();
  assert.equal(p.link('map').getAttribute('aria-current'), 'location');
  assert.equal(p.link('story').hasAttribute('aria-current'), false);
  p.fire(p.window, 'caisik:scene', { detail: { action: 'dj' } });
  assert.equal(p.link('frequency').getAttribute('aria-current'), 'location');
  p.fire(p.toggle, 'click');
  p.fire(p.link('map'), 'pointerover', { pointerType: 'mouse' });
  assert.equal(p.head.dataset.engineMode, 'map');
  assert.ok(p.link('map').hasAttribute('data-preview'));
  p.fire(p.toggle, 'click');
  assert.equal(p.head.dataset.engineMode, 'frequency', 'closing restores current section after hover preview');
});

test('Expedition keeps mode switch and subpage destinations; shop keeps cart and translated labels', async () => {
  const p = await page('/expeditions/');
  assert.equal(p.head.querySelector('.iris-tools #exp-mode'), p.original);
  assert.equal(p.head.dataset.engineMode, 'expeditions');
  assert.equal(p.link('map').getAttribute('href'), '/#hidden-city');
  assert.equal(p.link('story').getAttribute('href'), '/#needle-street');
  assert.equal(p.link('writer').getAttribute('href'), '/expeditions/writer/');
  p.fire(p.window, 'caisik:scene', { detail: { action: 'writer' } });
  assert.equal(p.link('expeditions').getAttribute('aria-current'), 'location');
  const shop = await page('/shop/');
  assert.equal(shop.head.querySelector('.iris-tools [href="#shop-cart"]'), shop.original);
  shop.language('fr');
  assert.equal(shop.original.querySelector('[data-brand-cart]')?.textContent ?? shop.original.textContent, 'Panier');
  const art = await page('/art/');
  assert.equal(art.link('blackbook').getAttribute('aria-current'), 'location');
  const lesson = await page('/q/mentalism/');
  assert.equal(lesson.link('story').getAttribute('href'), '/#needle-street', 'legacy lesson reaches the current story on the homepage');
  assert.equal(lesson.link('map').getAttribute('href'), '/#hidden-city');
});

test('The golden machine in the gallery and menu has local bearings per mark', async () => {
  const p = await page('/logo/');
  const models = [p.head.querySelector('.forge-machine'), p.document.querySelector('[data-forge-model] .forge-machine')];
  const names = new Set();
  for (const svg of models) {
    assert.ok(svg);
    for (const part of ['lens', 'intake', 'return', 'spine-top', 'spine-lower', 'lever-top', 'lever-bottom', 'hub']) assert.ok(svg.querySelector('.forge-' + part), part);
    for (const element of svg.querySelectorAll('[id]')) { assert.ok(!names.has(element.id)); names.add(element.id); }
    for (const element of svg.querySelectorAll('use[href]')) assert.ok(svg.querySelector(element.getAttribute('href')));
  }
  assert.match(models[0].querySelector('image').getAttribute('href'), /forge-header/);
  assert.match(models[1].querySelector('image').getAttribute('href'), /forge-master/);
});
