// Real page markup with a deterministic pointer, focus and clock for the chapter selector.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const dist = new URL('../dist/', import.meta.url);
const source = readFileSync(new URL('iris-engine.js', dist), 'utf8');
const mark = readFileSync(new URL('assets/logo/caisik-iris-motion.svg', dist), 'utf8');
const chapters = ['map','principles','frequency','selfmade','expeditions','wall','shop'];

async function page(path = '/', fine = true) {
  const location = new URL(path, 'https://example.test');
  const { document, window } = parseHTML(readFileSync(new URL(path.slice(1) + 'index.html', dist), 'utf8'));
  const original = document.querySelector('#exp-mode, .brand-dock [href="#shop-cart"], #notebook-open');
  const dock = document.createElement('aside');
  dock.dataset.languageDock = '';
  document.body.append(dock);
  let lang = 'cs';
  window.CaisikI18n = { getLanguage: () => lang };
  let token = 0;
  const timers = new Map();
  const fire = (target, type, extras = {}) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, extras);
    target.dispatchEvent(event);
    return event;
  };
  vm.runInNewContext(source, {
    document, window, location, URL, DOMParser: window.DOMParser, CustomEvent: window.CustomEvent,
    localStorage: { getItem: () => null },
    fetch: async url => { assert.match(url, /caisik-iris-motion\.svg/); return {ok:true,text:async()=>mark}; },
    matchMedia: () => ({ matches: fine }),
    setTimeout: fn => (timers.set(++token, fn), token),
    clearTimeout: id => timers.delete(id),
  });
  await new Promise(resolve => setImmediate(resolve));
  const head = document.querySelector('.iris-dock');
  const toggle = head.querySelector('.iris-switch');
  const nav = head.querySelector('.iris-panel');
  const links = [...nav.querySelectorAll('[data-route]')];
  let activeElement = document.body;
  Object.defineProperty(document, 'activeElement', { get: () => activeElement });
  // Linkedom has no location-aware anchor resolution or native focus management.
  for (const anchor of nav.querySelectorAll('a[href]')) Object.defineProperty(anchor, 'href', {
    get: () => new URL(anchor.getAttribute('href'), location).href
  });
  for (const el of [toggle, ...links, document.querySelector('#hidden-city')].filter(Boolean)) {
    el.focus = () => { activeElement = el; fire(el, 'focusin'); };
  }
  assert.equal(head.querySelector('[data-brand-language]').firstElementChild, dock);
  assert.ok(head.querySelector('.iris-symbol .ua-mark .ua-iris'), 'art swaps to articulated SVG');
  function expanded(expected) {
    assert.equal(toggle.getAttribute('aria-expanded'), String(expected));
    assert.equal(toggle.dataset.open, String(expected));
    assert.equal(nav.hidden, !expected);
  }
  return {
    document, window, location, head, toggle, nav, links, original, expanded, fire,
    leaveDelay() { for (const [id, fn] of timers) { timers.delete(id); fn(); } },
    language(next) { lang = next; fire(window, 'caisik:languagechange', { detail: { language: next } }); },
  };
}

test('Atlas opens on hover, offers seven real chapter links and restores the active scene', async () => {
  const p = await page();
  const [map,,frequency] = p.links;
  p.expanded(false);
  assert.deepEqual(p.links.map(a => a.dataset.route), chapters);
  assert.deepEqual(p.links.map(a => a.getAttribute('href')), [
    '#hidden-city', '#principles', '#frequency', '/play/', '/expeditions/', '#living-wall', '/shop/'
  ]);
  assert.equal(p.head.querySelector('.iris-tools #notebook-open'), p.original);
  assert.ok(p.nav.querySelector('.iris-pages [href="/logo/"]'));
  p.fire(p.window, 'caisik:scene', { detail: { action: 'dj' } });
  assert.equal(frequency.getAttribute('aria-current'), 'location');
  p.fire(p.toggle, 'pointerenter', { pointerType: 'mouse' });
  p.expanded(true);
  p.fire(p.toggle, 'pointerleave', { pointerType: 'mouse' });
  p.fire(p.nav, 'pointerenter', { pointerType: 'mouse' });
  p.leaveDelay();
  p.expanded(true);
  p.fire(map.querySelector('span'), 'pointerover', { pointerType: 'mouse' });
  assert.equal(p.head.dataset.engineMode, 'map');
  assert.ok(map.hasAttribute('data-preview'));
  p.language('fr');
  assert.equal(map.querySelector('span').textContent, 'La ville cachée');
  assert.equal(p.nav.querySelector('.iris-plate-name').textContent, 'La ville cachée');
  assert.equal(p.nav.getAttribute('aria-label'), 'Menu principal');
  p.fire(p.nav, 'pointerleave', { pointerType: 'mouse' });
  p.leaveDelay();
  p.expanded(false);
  assert.equal(p.head.dataset.engineMode, 'frequency');
  assert.equal(p.nav.querySelector('.iris-plate-name').textContent, 'Fréquence');
  p.fire(p.toggle, 'keydown', { key: 'ArrowDown' });
  assert.equal(p.document.activeElement, map);
  p.fire(map, 'click');
  p.expanded(false);
  assert.equal(p.document.activeElement.id, 'hidden-city');
});

test('Expedition keeps its mode switch, pinned pointer state and keyboard focus', async () => {
  const p = await page('/expeditions/');
  assert.equal(p.head.querySelector('.iris-tools #exp-mode'), p.original);
  assert.equal(p.head.dataset.engineMode, 'expeditions');
  assert.equal(p.links[0].getAttribute('href'), '/#hidden-city');
  p.fire(p.toggle, 'pointerenter', { pointerType: 'mouse' });
  p.fire(p.toggle, 'click');
  p.fire(p.nav, 'pointerleave', { pointerType: 'mouse' });
  p.leaveDelay();
  p.expanded(true);
  p.fire(p.toggle, 'click');
  p.expanded(false);
  p.fire(p.toggle, 'keydown', { key: 'ArrowDown' });
  assert.equal(p.document.activeElement, p.links[0]);
  p.fire(p.document, 'keydown', { key: 'Escape' });
  p.expanded(false);
  assert.equal(p.document.activeElement, p.toggle);
  p.fire(p.window, 'caisik:scene', { detail: { action: 'writer' } });
  assert.equal(p.links.find(a => a.dataset.route === 'expeditions').getAttribute('aria-current'), 'location');
});

test('Touch opens and dismisses the panel; shop keeps its cart and updates its language', async () => {
  const p = await page('/shop/', false);
  assert.equal(p.head.querySelector('.iris-tools [href="#shop-cart"]'), p.original);
  p.fire(p.toggle, 'pointerenter', { pointerType: 'touch' });
  p.expanded(false);
  p.fire(p.toggle, 'click');
  p.expanded(true);
  p.language('fr');
  assert.equal(p.original.querySelector('[data-brand-cart]')?.textContent ?? p.original.textContent, 'Panier');
  p.fire(p.document.body, 'pointerdown', { pointerType: 'touch' });
  p.expanded(false);
  p.fire(p.toggle, 'click');
  p.fire(p.toggle, 'click');
  p.expanded(false);
});

test('The golden machine in the gallery and the menu has one set of local bearings per mark',async()=>{
  const p=await page('/logo/');
  const models=[p.head.querySelector('.forge-machine'),p.document.querySelector('[data-forge-model] .forge-machine')];
  const names=new Set();
  for(const svg of models){
    assert.ok(svg);
    for(const part of ['lens','intake','return','spine-top','spine-lower','lever-top','lever-bottom','hub']){
      assert.ok(svg.querySelector('.forge-'+part),part);
    }
    for(const el of svg.querySelectorAll('[id]')){assert.ok(!names.has(el.id));names.add(el.id);}
    for(const el of svg.querySelectorAll('use[href]'))assert.ok(svg.querySelector(el.getAttribute('href')));
  }
  assert.match(models[0].querySelector('image').getAttribute('href'),/forge-header/);
  assert.match(models[1].querySelector('image').getAttribute('href'),/forge-master/);
});
