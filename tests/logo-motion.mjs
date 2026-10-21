// Controlled browser surface: scheduling, reference isolation and native input behavior.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../dist/caisik-logo.js', import.meta.url), 'utf8');

class Element {
  constructor(name = 'div', attributes = {}) {
    this.localName = name;
    this.tagName = name.toUpperCase();
    this.values = new Map();
    this.dataset = {};
    this.children = [];
    this.listeners = {};
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.classes = new Set();
    this.classList = {
      contains: name => this.classes.has(name),
      add: (...names) => names.forEach(name => this.classes.add(name)),
      remove: (...names) => names.forEach(name => this.classes.delete(name)),
      toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name)
    };
    Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
  }
  get id() { return this.values.get('id') || ''; }
  set id(value) { this.setAttribute('id', value); }
  get attributes() { return [...this.values].map(([name, value]) => ({ name, localName: name.split(':').at(-1), value })); }
  setAttribute(name, value) {
    this.values.set(name, String(value));
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
    if (name === 'class') String(value).split(/\s+/).forEach(item => this.classes.add(item));
  }
  getAttribute(name) { return this.values.get(name) ?? null; }
  hasAttribute(name) { return this.values.has(name); }
  append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  matches(selector) {
    return selector.split(',').some(part => {
      if (part === '*') return true;
      if (part.startsWith('.')) return this.classes.has(part.slice(1));
      if (part.startsWith('[')) return this.hasAttribute(part.slice(1, -1));
      return this.localName === part.toLowerCase();
    });
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) || null; }
  addEventListener(name, listener) { (this.listeners[name] ??= []).push(listener); }
  emit(name, event = {}) { this.listeners[name]?.forEach(listener => listener(event)); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1942, height: 809 }; }
  cloneNode(deep) {
    const node = new Element(this.localName, Object.fromEntries(this.values));
    if (deep) node.append(...this.children.map(child => child.cloneNode(true)));
    return node;
  }
}

function template() {
  const svg = new Element('svg', { id: 'logo-root', 'aria-labelledby': 'logo-title logo-description' });
  svg.append(new Element('title', { id: 'logo-title' }), new Element('desc', { id: 'logo-description' }));
  const defs = new Element('defs');
  defs.append(new Element('image', { id: 'logo-art', href: '/assets/logo/caisik-signature.webp' }), new Element('mask', { id: 'logo-alpha' }));
  svg.append(defs);
  const use = new Element('use', { href: '#logo-art', mask: 'url("#logo-alpha")', 'xlink:href': '#logo-art', 'data-check-reference': '' });
  svg.append(use);
  for (let index = 0; index < 6; index++) svg.append(new Element('g', { 'data-logo-letter': index, 'data-logo-cx': 300 + index * 270, 'data-logo-cy': 380 }));
  for (const name of ['tagline', 'trace', 'shine', 'shadow', 'eye-content', 'iris', 'closed-lid']) svg.append(new Element('g', { [`data-logo-${name}`]: '' }));
  const wave = new Element('g', { 'data-logo-wave': '' });
  wave.append(new Element('circle', { r: 0 }), new Element('circle', { r: 0 }));
  const sparks = new Element('g', { 'data-logo-sparks': '' });
  sparks.append(...Array.from({ length: 8 }, () => new Element('path', { opacity: 0 })));
  svg.append(wave, sparks);
  return svg;
}

async function scene({ reducedMotion = false, storedMotion = null, failedAsset = false, malformed = false } = {}) {
  const document = new Element('document'), window = new Element('window');
  const html = new Element('html'), body = new Element('body');
  document.documentElement = html;
  document.body = body;
  document.hidden = false;
  document.append(html);
  html.append(body);
  const hosts = [], interactions = [], stages = [];
  const showcase = new Element('section', { class: 'logo-showcase' });
  for (let index = 0; index < 2; index++) {
    const interaction = new Element(index ? 'button' : 'a', index ? {} : { href: '#home' });
    const host = new Element('span', { class: 'caisik-logo', ...(index ? { 'data-logo-interactive': '' } : {}) });
    const poster = new Element('img', { class: 'caisik-logo-poster' });
    const stage = new Element('span', { class: 'caisik-logo-stage' });
    host.append(poster, stage);
    interaction.append(host);
    (index ? showcase : body).append(interaction);
    hosts.push(host); interactions.push(interaction); stages.push(stage);
  }
  body.append(showcase);
  const replay = new Element('button', { 'data-logo-replay': '' });
  showcase.append(replay);
  document.importNode = (node, deep) => node.cloneNode(deep);
  const reduced = new Element(), fine = new Element();
  reduced.matches = reducedMotion;
  fine.matches = true;
  const frames = new Map(), observers = [];
  let requests = 0, fetchCount = 0, decodeCount = 0, intersection;
  const context = {
    document, window,
    localStorage: { getItem: () => storedMotion },
    matchMedia: query => query.includes('reduced') ? reduced : fine,
    requestAnimationFrame: callback => { frames.set(++requests, callback); return requests; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target) { this.target = target; }
    },
    IntersectionObserver: class {
      constructor(callback) { intersection = callback; }
      observe() {}
    },
    Image: class {
      set src(value) { this.url = value; queueMicrotask(() => failedAsset ? this.onerror() : this.onload()); }
      decode() { decodeCount++; return Promise.resolve(); }
    },
    fetch: async url => {
      fetchCount++;
      assert.equal(url, '/assets/logo/caisik-signature.svg?v=1');
      return { ok: true, text: async () => '<svg/>' };
    },
    DOMParser: class { parseFromString() { return { querySelector: () => malformed ? new Element() : null, documentElement: template() }; } },
    console: { warn() {} }
  };
  window.IntersectionObserver = context.IntersectionObserver;
  vm.runInNewContext(source, context);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  return {
    hosts, interactions, stages, html, body, replay, reduced, fine, document, window, frames, flush,
    svg(index = 0) { return stages[index].querySelector('svg'); },
    part(name, index = 0) { return this.svg(index)?.querySelector(`[data-logo-${name}]`); },
    get fetchCount() { return fetchCount; },
    get decodeCount() { return decodeCount; },
    mutate(target) { observers.filter(observer => observer.target === target).forEach(observer => observer.callback()); },
    intersect(visible, index) { intersection((index === undefined ? hosts : [hosts[index]]).map(target => ({ target, isIntersecting: visible }))); },
    step(time) { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); }
  };
}

const app = await scene();
assert.equal(app.fetchCount, 0, 'Offscreen logos do not request animated artwork');
app.intersect(true);
await app.flush();
assert.equal(app.fetchCount, 1, 'Visible instances share one SVG download');
assert.equal(app.decodeCount, 1, 'Visible instances share one bitmap decode');
assert.equal(app.frames.size, 1, 'All instances share one RAF chain');
for (const [index, host] of app.hosts.entries()) {
  assert(host.classList.contains('logo-ready'));
  assert(host.classList.contains('logo-running'));
  const svg = app.svg(index), use = svg.querySelector('[data-check-reference]');
  const prefix = `caisik-signature-${index + 1}-`;
  assert.equal(svg.id, `${prefix}logo-root`);
  assert.equal(use.getAttribute('href'), `#${prefix}logo-art`);
  assert.equal(use.getAttribute('xlink:href'), `#${prefix}logo-art`);
  assert.equal(use.getAttribute('mask'), `url(#${prefix}logo-alpha)`);
  assert.equal(svg.getAttribute('aria-labelledby'), `${prefix}logo-title ${prefix}logo-description`);
  assert.equal(svg.getAttribute('aria-hidden'), 'true');
}
const allIds = app.stages.flatMap(stage => stage.querySelectorAll('*').map(node => node.id).filter(Boolean));
assert.equal(new Set(allIds).size, allIds.length, 'Header and showcase never share SVG IDs');

app.step(0);
for (let time = 100; time <= 1300; time += 100) app.step(time);
assert.equal(app.hosts[0].dataset.logoState, 'idle');
assert.equal(app.part('tagline').style.opacity, '1');
assert.equal(app.part('trace').style.opacity, '0');
assert.match(app.part('eye-content').getAttribute('transform'), /scale\(1 1\.0000\)/, 'Eye opens independently of the bitmap');
assert.equal(app.part('letter').style.opacity, '1');
const settled = app.part('letter').getAttribute('transform');
assert.match(settled, /translate\(0 0\.000\)/, 'Letters return exactly to their approved position');

app.interactions[0].emit('pointerenter', { pointerType: 'mouse' });
app.interactions[0].emit('pointermove', { pointerType: 'mouse', clientX: 1942, clientY: 809 });
app.step(1400);
assert(Number(app.part('shine').style.opacity) > 0, 'Hover sweeps a light band across the lettering');
assert.notEqual(app.part('iris').getAttribute('transform'), 'translate(0.000 0.000)', 'Iris follows the pointer');
assert.notEqual(app.part('letter').getAttribute('transform'), settled, 'Hover adds restrained letter motion');
assert(Number(app.part('shadow').style.opacity) > 0, 'Hover lifts the crimson depth layer');
let navigationPrevented = false;
app.interactions[0].emit('click', { preventDefault() { navigationPrevented = true; } });
app.step(1500);
assert.equal(navigationPrevented, false, 'Logo clicks preserve native home navigation');
assert.equal(app.interactions[0].getAttribute('href'), '#home');
assert(Number(app.part('wave').children[0].getAttribute('r')) > 12);
assert(Number(app.part('wave').style.opacity) > 0, 'Click emits a visible ring');
assert(Number(app.part('sparks').children[0].style.opacity) > 0, 'Click emits the bounded eight glyphs');
assert.equal(app.part('sparks').children.length, 8);
app.interactions[0].emit('pointerleave');
app.interactions[1].emit('focusin');
app.step(1600);
assert(Number(app.part('shine', 1).style.opacity) > 0, 'Keyboard focus gets the same light response');
app.interactions[1].emit('focusout', { relatedTarget: null });
app.replay.emit('click');
assert.equal(app.part('letter', 1).style.opacity, '0', 'Replay restarts its own showcase intro');
assert.equal(app.part('letter').style.opacity, '1', 'Replay does not reset another logo');
assert.equal(app.fetchCount, 1, 'Replay reuses the loaded scene');

// A single offscreen instance freezes while the other one keeps the shared clock alive.
app.intersect(false, 0);
const frozenFirst = app.svg().dataset.elapsed;
for (let time = 1700; time <= 2200; time += 100) app.step(time);
assert.equal(app.svg().dataset.elapsed, frozenFirst);
assert.equal(app.frames.size, 1);
app.intersect(true, 0);

for (const pause of [
  { name: 'global pause', off() { app.html.dataset.motion = 'off'; app.mutate(app.html); }, on() { app.html.dataset.motion = 'on'; app.mutate(app.html); }, poster: true },
  { name: 'reduced motion', off() { app.reduced.matches = true; app.reduced.emit('change'); }, on() { app.reduced.matches = false; app.reduced.emit('change'); }, poster: true },
  { name: 'simple mode', off() { app.body.classList.add('simple-mode'); app.mutate(app.body); }, on() { app.body.classList.remove('simple-mode'); app.mutate(app.body); }, poster: true },
  { name: 'offscreen hosts', off() { app.intersect(false); }, on() { app.intersect(true); }, poster: false },
  { name: 'hidden document', off() { app.document.hidden = true; app.document.emit('visibilitychange'); }, on() { app.document.hidden = false; app.document.emit('visibilitychange'); }, poster: false },
  { name: 'page cache', off() { app.window.emit('pagehide'); }, on() { app.window.emit('pageshow'); }, poster: false }
]) {
  pause.off();
  assert.equal(app.frames.size, 0, `${pause.name} cancels the RAF`);
  assert.equal(app.hosts[0].classList.contains('logo-running'), !pause.poster, `${pause.name} chooses the correct poster presentation`);
  const iris = app.part('iris').getAttribute('transform');
  const eye = app.part('eye-content').getAttribute('transform');
  pause.on();
  assert.equal(app.frames.size, 1, `${pause.name} resumes one shared chain`);
  app.step(50000);
  assert.equal(app.part('iris').getAttribute('transform'), iris, `${pause.name} excludes the paused time`);
  assert.equal(app.part('eye-content').getAttribute('transform'), eye);
}

let blinkObserved = false;
for (let time = 50100; time <= 60000; time += 50) {
  app.step(time);
  const opening = /scale\(1 ([\d.]+)\)/.exec(app.part('eye-content').getAttribute('transform'));
  if (Number(opening?.[1]) < .5) blinkObserved = true;
  for (const letter of app.svg().querySelectorAll('[data-logo-letter]')) {
    const offset = /translate\(0 ([\d.-]+)\)/.exec(letter.getAttribute('transform'));
    assert(Math.abs(Number(offset?.[1])) <= 4, 'Partition movement remains inside the artwork budget');
  }
}
assert(blinkObserved, 'The eye blinks during the living idle state');
assert.equal(app.frames.size, 1, 'Long idle and repeated resumes still use one chain');

for (const options of [{ reducedMotion: true }, { storedMotion: 'off' }]) {
  const paused = await scene(options);
  paused.intersect(true);
  await paused.flush();
  assert.equal(paused.fetchCount, 0, 'Initial motion preference avoids animated downloads');
  assert.equal(paused.frames.size, 0);
  assert.equal(paused.replay.disabled, true);
  paused.reduced.matches = false;
  paused.html.dataset.motion = 'on';
  paused.mutate(paused.html);
  await paused.flush();
  assert.equal(paused.fetchCount, 1, 'Explicit global preference enables the scene');
  assert.equal(paused.frames.size, 1);
}

for (const options of [{ failedAsset: true }, { malformed: true }]) {
  const broken = await scene(options);
  broken.intersect(true);
  await broken.flush();
  for (const host of broken.hosts) {
    assert.equal(host.classList.contains('logo-running'), false, 'Asset failure keeps the approved poster');
    assert.equal(host.classList.contains('logo-ready'), false);
    assert.equal(host.dataset.logoState, 'static');
  }
  assert.equal(broken.frames.size, 0, 'Failed assets never leave a loop running');
  assert.equal(broken.svg(), null);
  assert.equal(broken.replay.disabled, false, 'Failure does not disable native controls');
}
console.log('PASS: isolated signature instances, shared loading/RAF, eye/hover/click/replay, bounded movement, pause lifecycle and approved fallback.');
