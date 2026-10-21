const {parseHTML} = require('linkedom');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dist = path.resolve(__dirname, '../dist');

function boot({width = 1280, reduced = false, simple = false, productTarget = true} = {}) {
  const {window} = parseHTML(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'));
  const document = window.document;
  const events = new Map(), frames = new Map(), idle = [], observers = [], memory = {};
  let serial = 0, hostTop = 0, productClicks = 0;
  const height = 900, hostHeight = 6600;
  const queries = new Map();
  const matchMedia = query => {
    if (!queries.has(query)) {
      const listeners = [];
      queries.set(query, {
        matches: query.includes('prefers-reduced-motion') ? reduced : query.includes('max-width:700px') ? width <= 700 : false,
        addEventListener(type, callback) { if (type === 'change') listeners.push(callback); },
        change(value) { this.matches = value; for (const callback of listeners) callback({matches: value}); }
      });
    }
    return queries.get(query);
  };
  function addEventListener(type, callback) {
    if (!events.has(type)) events.set(type, []);
    events.get(type).push(callback);
  }
  function removeEventListener(type, callback) {
    events.set(type, (events.get(type) || []).filter(item => item !== callback));
  }
  function requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id; }
  function requestIdleCallback(callback) { idle.push(callback); return idle.length; }
  window.matchMedia = matchMedia;
  window.requestIdleCallback = requestIdleCallback;
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return {top: 0, left: 0, width, height, bottom: height, right: width};
  };
  const cinema = document.querySelector('#cinema');
  assert(cinema, 'Actual index must contain the cinematic section');
  cinema.getBoundingClientRect = () => ({top: hostTop, left: 0, width, height: hostHeight, bottom: hostTop + hostHeight});
  if (simple) document.body.classList.add('simple-mode');
  if (productTarget) {
    let target = document.querySelector('[data-real-detail="printful-18912189-482104768"]');
    if (!target) {
      target = document.createElement('button');
      target.setAttribute('data-real-detail', 'printful-18912189-482104768');
      document.body.append(target);
    }
    target.addEventListener('click', () => { productClicks++; });
  } else {
    for (const target of document.querySelectorAll('[data-real-detail="printful-18912189-482104768"]')) target.remove();
  }
  const location = {hash: '', pathname: '/', href: ''};
  const context = {
    window, document, location, console,
    navigator: {hardwareConcurrency: 8, deviceMemory: 8, connection: {saveData: false, effectiveType: '4g'}},
    innerWidth: width, innerHeight: height, scrollY: 0,
    matchMedia, addEventListener, removeEventListener, requestAnimationFrame,
    cancelAnimationFrame(id) { frames.delete(id); }, requestIdleCallback,
    performance: {getEntriesByType() { return []; }, now() { return 100; }},
    IntersectionObserver: class { constructor(callback) { this.callback = callback; } observe() {} },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target, options) { this.target = target; this.options = options; }
    },
    localStorage: {getItem: key => memory[key] ?? null, setItem: (key, value) => { memory[key] = value; }},
    setTimeout() { return ++serial; }, clearTimeout() {}, queueMicrotask
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dist, 'learn.js'), 'utf8'), context);
  // The actual IIFE runs unchanged. Idle callbacks are recorded but never run,
  // so this DOM test cannot import the WebGL module or allocate a GPU context.
  vm.runInContext(fs.readFileSync(path.join(dist, 'cinematic-v7.js'), 'utf8'), context);
  const flush = () => {
    for (let attempts = 0; frames.size && attempts < 20; attempts++) {
      const pending = [...frames.entries()]; frames.clear();
      for (const [, callback] of pending) callback(100);
    }
    assert.equal(frames.size, 0, 'Controller must not schedule an unbounded DOM frame loop');
  };
  const scrollTo = phase => {
    hostTop = -(hostHeight - height) * phase / 5;
    for (const callback of events.get('scroll') || []) callback();
    flush();
  };
  const mutateBody = () => {
    for (const observer of observers) if (observer.target === document.body) observer.callback([{type: 'attributes', attributeName: 'class'}]);
    flush();
  };
  return {window, document, cinema, context, location, memory, frames, idle, queries, flush, scrollTo, mutateBody, productClicks: () => productClicks};
}

function assertVisualReset(app) {
  const stage = app.cinema.querySelector('.film-stage');
  assert.equal(String(stage.style.getPropertyValue('--dissolve')), '0');
  assert.equal(String(stage.style.getPropertyValue('--forge')), '0');
  for (const visual of stage.querySelectorAll('.film-emblem,.film-city,.film-sacred,.film-garment')) assert.equal(visual.style.transform, 'none');
  assert.equal(stage.querySelector('.film-garment').style.opacity, '0');
}

const desktop = boot();
assert.equal(desktop.idle.length, 1, 'Desktop WebGL initialization should be deferred');
const initial = JSON.parse(desktop.document.querySelector('#performance-values').textContent);
assert.equal(initial.viewport, '1280×900');
assert.equal(initial.profile, 'desktop');
assert.equal(initial.gpu, 'not attempted');
assert.equal(initial.network, '4g');
for (const metric of ['LCP', 'CLS', 'INP', 'fps']) assert.equal(initial[metric], null, `${metric} must remain unmeasured in the DOM environment`);
assert(!Object.keys(desktop.memory).some(key => /metrics|performance/i.test(key)), 'Metrics must not be silently persisted');

for (let chapter = 0; chapter < 6; chapter++) {
  desktop.scrollTo(chapter);
  const links = [...desktop.cinema.querySelectorAll('.film-index a')];
  assert.equal(desktop.document.querySelector('#film-current').textContent, String(chapter + 1).padStart(2, '0'));
  assert.equal(links.filter(link => link.classList.contains('is-current')).length, 1);
  assert.equal(links[chapter].getAttribute('aria-current'), 'step');
}
desktop.scrollTo(-2);
assert.equal(desktop.document.querySelector('#film-current').textContent, '01', 'Before-section progress must clamp');
desktop.scrollTo(8);
assert.equal(desktop.document.querySelector('#film-current').textContent, '06', 'After-section progress must clamp');
desktop.scrollTo(2);
assert.equal(String(desktop.cinema.querySelector('.film-stage').style.getPropertyValue('--dissolve')), '1');
desktop.scrollTo(5);
assert.equal(String(desktop.cinema.querySelector('.film-stage').style.getPropertyValue('--forge')), '1');

desktop.document.querySelector('[data-film-product]').click();
assert.equal(desktop.productClicks(), 1, 'Film product action must invoke the matching existing catalog target');
assert.equal(desktop.location.href, '');
for (let lesson = 0; lesson < 7; lesson++) {
  desktop.document.querySelector(`[data-film-lesson="${lesson}"]`).click();
  assert.equal(desktop.document.querySelector('#learn [data-lesson][aria-selected="true"]').dataset.lesson, String(lesson));
}

desktop.document.body.classList.add('simple-mode');
desktop.mutateBody();
assertVisualReset(desktop);
assert.equal(desktop.document.querySelector('#film-quality').textContent, 'LITE CINEMA');
desktop.scrollTo(3);
assertVisualReset(desktop);
assert.equal(desktop.document.querySelector('#film-current').textContent, '04');

const reduced = boot({reduced: true});
reduced.scrollTo(5);
assertVisualReset(reduced);
assert.equal(reduced.idle.length, 0, 'Reduced motion must not schedule a GPU initialization');
assert.equal(reduced.cinema.dataset.render, 'lite');
assert.equal(JSON.parse(reduced.document.querySelector('#performance-values').textContent).gpu, 'reduced-motion or Simple mode');

const changedPreference = boot();
changedPreference.scrollTo(2);
changedPreference.queries.get('(prefers-reduced-motion: reduce)').change(true);
changedPreference.flush();
assertVisualReset(changedPreference);

const mobile = boot({width: 390});
assert.equal(mobile.idle.length, 0);
assert.equal(mobile.cinema.dataset.render, 'lite');
assert.equal(JSON.parse(mobile.document.querySelector('#performance-values').textContent).profile, 'mobile-lite');

const fallback = boot({productTarget: false, simple: true});
fallback.document.querySelector('[data-film-product]').click();
assert.equal(fallback.location.href, 'https://hiphop.caisik.i234.me/dk/products/printful-18912189-482104768');

console.log('PASS: actual cinematic IIFE; six scroll chapters and clamping; dissolve/forge states; Simple and reduced-motion visual resets; seven lesson deep actions; catalog target and product fallback; local unmeasured metrics; deferred GPU initialization. DOM checks only, no GPU module executed.');
