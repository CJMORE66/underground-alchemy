// A controlled browser surface verifies scheduling, preference changes and fallback behavior.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../dist/alchemy-hero.js', import.meta.url), 'utf8');

class Element {
  constructor() {
    this.listeners = {};
    this.attributes = {};
    this.style = {};
    this.dataset = {};
    this.clientWidth = 1440;
    this.clientHeight = 670;
    this.textContent = '';
    this.children = [];
    const classes = new Set();
    this.classList = {
      contains: name => classes.has(name),
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
    };
  }
  addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
  emit(type, event = {}) { this.listeners[type]?.forEach(listener => listener(event)); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; }
  append(child) { this.child = child; this.children.push(child); }
  remove() { this.removed = true; }
}

async function scene({ reducedMotion = false, failedAsset = false } = {}) {
  const hero = new Element(), stage = new Element(), button = new Element(), status = new Element(), controls = new Element();
  const html = new Element(), body = new Element(), svg = new Element();
  const nodes = new Map(['sun', 'moon', 'orbit-ring', 'water', 'vinyl', 'eyelid-left', 'eyelid-right', 'pupil-left', 'pupil-right', 'breath', 'halo-outer', 'halo-inner', 'pendant', 'star', 'energy-back', 'energy-front', 'sparks', 'water-ripples', 'shockwave'].map(id => [`#alchemy-${id}`, new Element()]));
  hero.querySelector = selector => ({ '.alchemy-stage': stage, '.alchemy-awaken': button, '.alchemy-status': status, '.alchemy-controls': controls }[selector]);
  hero.contains = node => node === hero || node === button;
  svg.querySelector = id => nodes.get(id);
  svg.localName = 'svg';
  const reduced = new Element(), fine = new Element();
  reduced.matches = reducedMotion;
  fine.matches = true;
  const document = new Element(), window = new Element();
  document.querySelector = selector => selector === '.hero' ? hero : null;
  document.documentElement = html;
  document.body = body;
  document.hidden = false;
  document.importNode = node => node;
  document.createElementNS = () => new Element();
  window.innerWidth = 1440;
  const frames = new Map(), observers = [];
  let requestCount = 0, fetchCount = 0, intersection;
  const context = {
    document, window,
    matchMedia: query => query.includes('reduced') ? reduced : fine,
    requestAnimationFrame: callback => { frames.set(++requestCount, callback); return requestCount; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target) { this.target = target; }
    },
    IntersectionObserver: class {
      constructor(callback) { intersection = callback; }
      observe() {}
    },
    ResizeObserver: class { observe() {} },
    Image: class {
      set src(value) { queueMicrotask(() => failedAsset && value.endsWith('moon.webp') ? this.onerror() : this.onload()); }
      decode() { return Promise.resolve(); }
    },
    fetch: async () => { fetchCount++; return { ok: true, text: async () => '<svg/>' }; },
    DOMParser: class { parseFromString() { return { querySelector: () => null, documentElement: svg }; } },
    console: { warn() {} }
  };
  window.IntersectionObserver = context.IntersectionObserver;
  window.ResizeObserver = context.ResizeObserver;
  vm.runInNewContext(source, context);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  return {
    hero, stage, button, status, controls, html, body, svg, nodes, reduced, fine, document, window, frames, flush,
    get fetchCount() { return fetchCount; },
    mutate(target) { observers.find(observer => observer.target === target).callback(); },
    intersect(value) { intersection([{ isIntersecting: value }]); },
    step(time) { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); }
  };
}

const asleep = await scene({ reducedMotion: true });
assert.equal(asleep.fetchCount, 0, 'Initial reduced motion avoids all animated-layer requests');
assert.equal(asleep.frames.size, 0, 'Initial reduced motion schedules no animation frame');
assert.equal(asleep.button.disabled, true);
assert.equal(asleep.hero.classList.contains('alchemy-running'), false);
asleep.reduced.matches = false;
asleep.reduced.emit('change');
await asleep.flush();
assert.equal(asleep.fetchCount, 1, 'Turning motion on starts one scene load');
assert.equal(asleep.stage.child, asleep.svg);
assert(asleep.hero.classList.contains('alchemy-ready'));
assert(asleep.hero.classList.contains('alchemy-running'));
assert.equal(asleep.svg.style.width, '1005px');
assert.equal(asleep.svg.style.height, '670px');
assert.equal(asleep.svg.style.left, '435px', 'Desktop source frame is right aligned');
assert.equal(asleep.nodes.get('#alchemy-sparks').children.length, 22, 'Particle population is bounded and allocated once');

asleep.step(1000);
const initialSun = asleep.nodes.get('#alchemy-sun').attributes.transform;
const initialBreath = asleep.nodes.get('#alchemy-breath').attributes.transform;
const initialSpark = asleep.nodes.get('#alchemy-sparks').children[0].attributes.transform;
asleep.step(1100);
assert.notEqual(asleep.nodes.get('#alchemy-sun').attributes.transform, initialSun, 'The celestial body moves independently');
assert.notEqual(asleep.nodes.get('#alchemy-breath').attributes.transform, initialBreath, 'Interior cloth breathes independently of the base image');
assert.notEqual(asleep.nodes.get('#alchemy-sparks').children[0].attributes.transform, initialSpark, 'Embers rise independently');
assert(Number(asleep.nodes.get('#alchemy-energy-back').style.strokeDashoffset) < 0, 'Ribbons carry moving dash bands');
asleep.button.emit('click');
asleep.step(1200);
assert.equal(asleep.button.attributes['aria-pressed'], 'true');
assert.equal(asleep.button.attributes['aria-label'], 'Let the alchemist dream');
assert.equal(asleep.hero.dataset.alchemyState, 'awake');
assert(Number(asleep.nodes.get('#alchemy-eyelid-left').style.opacity) < 1, 'Awakening retracts the lids covering the original eyes');
assert(Number(asleep.nodes.get('#alchemy-shockwave').style.opacity) > 0, 'Awakening emits a visible energy wave');

for (const pause of [
  { name: 'global pause', off() { asleep.html.dataset.motion = 'off'; asleep.mutate(asleep.html); }, on() { asleep.html.dataset.motion = 'on'; asleep.mutate(asleep.html); }, poster: true },
  { name: 'live reduced motion', off() { asleep.reduced.matches = true; asleep.reduced.emit('change'); }, on() { asleep.reduced.matches = false; asleep.reduced.emit('change'); }, poster: true },
  { name: 'simple mode', off() { asleep.body.classList.add('simple-mode'); asleep.mutate(asleep.body); }, on() { asleep.body.classList.remove('simple-mode'); asleep.mutate(asleep.body); }, poster: true },
  { name: 'offscreen scene', off() { asleep.intersect(false); }, on() { asleep.intersect(true); }, poster: false },
  { name: 'hidden tab', off() { asleep.document.hidden = true; asleep.document.emit('visibilitychange'); }, on() { asleep.document.hidden = false; asleep.document.emit('visibilitychange'); }, poster: false }
]) {
  pause.off();
  assert.equal(asleep.frames.size, 0, `${pause.name} cancels the pending RAF`);
  assert.equal(asleep.hero.classList.contains('alchemy-running'), !pause.poster, `${pause.name} chooses the right poster/scene presentation`);
  const frozen = asleep.nodes.get('#alchemy-sun').attributes.transform;
  const frozenBreath = asleep.nodes.get('#alchemy-breath').attributes.transform;
  const frozenRibbon = asleep.nodes.get('#alchemy-energy-back').style.strokeDashoffset;
  pause.on();
  assert.equal(asleep.frames.size, 1, `${pause.name} resumes exactly one RAF chain`);
  asleep.step(50000);
  assert.equal(asleep.nodes.get('#alchemy-sun').attributes.transform, frozen, `${pause.name} resumes without adding time spent paused`);
  assert.equal(asleep.nodes.get('#alchemy-breath').attributes.transform, frozenBreath, `${pause.name} also freezes cloth breathing`);
  assert.equal(asleep.nodes.get('#alchemy-energy-back').style.strokeDashoffset, frozenRibbon, `${pause.name} also freezes energy flow`);
  asleep.step(50100);
  assert.notEqual(asleep.nodes.get('#alchemy-sun').attributes.transform, frozen, `${pause.name} moves again after resuming`);
}

asleep.window.innerWidth = 390;
asleep.stage.clientWidth = 390;
asleep.stage.clientHeight = 490;
asleep.window.emit('resize');
assert.equal(asleep.svg.style.width, '735px');
assert.equal(asleep.svg.style.height, '490px');
assert(Math.abs(parseFloat(asleep.svg.style.left) + 248.4) < .001, 'Every mobile layer shares the original 72% cover crop');
assert.equal(asleep.svg.style.top, '0px');

const broken = await scene({ failedAsset: true });
assert.equal(broken.hero.classList.contains('alchemy-ready'), false);
assert.equal(broken.hero.classList.contains('alchemy-running'), false, 'Asset failure leaves the approved poster visible');
assert.equal(broken.frames.size, 0, 'Asset failure does not leave an animation loop');
assert.equal(broken.stage.child, undefined);
assert.equal(broken.controls.attributes.hidden, '', 'Unavailable interaction controls are hidden');

assert.equal(asleep.nodes.get('#alchemy-sparks').children.length, 22, 'Pause/resume never reallocates particles');
console.log('PASS: cinematic hero layers, bounded particles, energy wave, motion lifecycle, synchronized frame and static fallback.');
