// Controlled DOM/clock checks for scene math, dynamic lifecycle and native actions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';


const source = fs.readFileSync(new URL('../dist/art-motion.js', import.meta.url), 'utf8');
class Element {
  constructor(name = 'div', attributes = {}) {
    this.localName = name; this.tagName = name.toUpperCase(); this.values = new Map(); this.dataset = {}; this.children = []; this.listeners = {}; this.classes = new Set();
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.classList = { contains: name => this.classes.has(name), add: (...names) => names.forEach(name => this.classes.add(name)), remove: (...names) => names.forEach(name => this.classes.delete(name)), toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
    Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
  }
  get id() { return this.values.get('id') || ''; } set id(value) { this.setAttribute('id', value); }
  get className() { return [...this.classes].join(' '); } set className(value) { this.setAttribute('class', value); }
  get isConnected() { let top = this; while (top.parent) top = top.parent; return top.localName === 'document'; }
  get attributes() { return [...this.values].map(([name, value]) => ({ name, localName: name.split(':').at(-1), value })); }
  setAttribute(name, value) { this.values.set(name, String(value)); if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value); if (name === 'class') { this.classes.clear(); String(value).split(/\s+/).forEach(item => this.classes.add(item)); } }
  getAttribute(name) { return this.values.get(name) ?? null; } hasAttribute(name) { return this.values.has(name); } removeAttribute(name) { this.values.delete(name); }
  append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  matches(selector) { return selector.split(',').some(part => { const attr = /\[([^=\]]+)(?:="([^"]*)")?\]/.exec(part); const base = part.replace(/\[[^\]]+\]/g, ''); const baseMatch = !base || base === '*' || (base.startsWith('.') ? this.classes.has(base.slice(1)) : base.startsWith('#') ? this.id === base.slice(1) : this.localName === base.toLowerCase()); return baseMatch && (!attr || this.hasAttribute(attr[1]) && (attr[2] === undefined || this.getAttribute(attr[1]) === attr[2])); }); }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) || null; }
  addEventListener(name, listener) { (this.listeners[name] ??= []).push(listener); }
  removeEventListener(name, listener) { this.listeners[name] = (this.listeners[name] || []).filter(fn => fn !== listener); }
  dispatchEvent(event) { if (!event.target) event.target = this; this.listeners[event.type]?.forEach(fn => fn(event)); if (event.bubbles) this.parent?.dispatchEvent(event); return !event.defaultPrevented; }
  cloneNode(deep) { const node = new Element(this.localName, Object.fromEntries(this.values)); if (deep) node.append(...this.children.map(child => child.cloneNode(true))); return node; }
}
function templateScene(story = false) {
  const svg = new Element('svg', { id: 'scene', viewBox: '0 0 1000 1000', 'aria-labelledby': 'art-title art-description' });
  svg.append(new Element('title', { id: 'art-title' }), new Element('desc', { id: 'art-description' }));
  const defs = new Element('defs'); defs.append(new Element('image', { id: 'paint', href: '/assets/test.webp' }), new Element('mask', { id: 'alpha' })); svg.append(defs, new Element('use', { 'data-reference': '', href: '#paint', mask: "url('#alpha')" }));
  const nodes = [
    ['rotate', { cx: 500, cy: 500, speed: 12 }], ['swing', { cx: 500, cy: 100, amp: 8, period: 4 }], ['float', { x: 4, y: 6, period: 4 }], ['pulse', { min: .2, max: .8, period: 4 }], ['scale', { cx: 500, cy: 500, amp: .02, period: 4 }], ['trace', { speed: 15 }], ['shine', { start: -300, end: 1400, period: 8 }], ['blink', { cx: 500, cy: 400, period: 3 }], ['gaze', { x: 9, y: 4 }], ['lid', { period: 3 }], ['wave', { radius: 300 }], ['spark', { cx: 500, cy: 400, angle: 45, radius: 200 }]
  ];
  for (const [type, attributes] of nodes) { const node = new Element('g', { 'data-am': type, ...Object.fromEntries(Object.entries(attributes).map(([key, value]) => ['data-' + key, value])) }); if (type === 'wave') node.append(new Element('circle', { r: 0 }), new Element('circle', { r: 0 })); svg.append(node); }
  if (story) {
    svg.setAttribute('data-story-duration', '20');
    const node = (name, frames, extra = {}) => new Element(name, { 'data-am': 'story', 'data-frames': JSON.stringify(frames), ...extra });
    svg.append(
      node('g', { opacity: [[0,0],[.8,0],[2,1],[18,1],[20,0]] }, { 'data-story-part': 'guard', opacity: 0 }),
      node('circle', { opacity: [[0,0],[1,0],[2,1],[4,0],[20,0]], r: [[0,0],[1,0],[3,40],[4,0],[20,0]] }, { 'data-story-part': 'seed', 'data-ease': 'smooth', opacity: 0, r: 0 }),
      node('g', { opacity: [[0,0],[8,0],[12,1],[18,1],[20,0]], x: [[0,-30],[8,-30],[12,0],[20,0]], y: [[0,100],[8,100],[12,0],[20,0]], scale: [[0,.1],[8,.1],[12,1],[18,1],[20,.1]], rotate: [[0,-15],[12,0],[20,0]] }, { 'data-story-part': 'world', 'data-cx': 500, 'data-cy': 700, opacity: 0 }),
      node('path', { dash: [[0,100],[3,100],[6,0],[18,0],[20,100]] }, { 'data-story-part': 'drawing', transform: 'translate(2 3)' }),
      new Element('g', { 'data-am': 'pendulum', 'data-cx': 500, 'data-cy': 100, 'data-offset': -20, 'data-amp': 23, 'data-period': 4.8 })
    );
  }
  return svg;
}


async function setup({ reducedMotion = false, storedMotion = null, failBitmap = false, malformed = false, failManifest = false, story = false, failExtraAsset = false, malformedTrack = false } = {}) {
  const document = new Element('document'), window = new Element('window');
  document.documentElement = new Element('html'); document.body = new Element('body'); document.append(document.documentElement); document.documentElement.append(document.body); document.body.append(new Element('dialog', { id: 'art-dialog' }));
  document.createElement = name => new Element(name); document.importNode = (node, deep) => node.cloneNode(deep);
  window.Event = class { constructor(type, options = {}) { this.type = type; this.bubbles = options.bubbles; this.defaultPrevented = false; } preventDefault() { this.defaultPrevented = true; } };
  document.hidden = false;
  const frames = new Map(), observers = [], intersections = new Set(), unobserved = [], fetches = [];
  let frameId = 0, decoded = 0, intersectionCallback;
  const reduced = { matches: reducedMotion, handlers: [], addEventListener(type, handler) { this.handlers.push(handler); }, emit() { this.handlers.forEach(handler => handler()); } };
  const fine = { ...reduced, matches: true, handlers: [] };
  const add = (id = 'mentalism', parent = document.body, tag = 'button') => {
    const scope = document.createElement('section'); scope.className = 'art-motion-scope';
    const action = document.createElement(tag); action.setAttribute('aria-label', 'Awaken artwork');
    if (tag === 'a') action.setAttribute('href', '#home');
    const host = document.createElement('span'); host.className = 'living-art'; host.dataset.artScene = id;
    host.append(new Element('img', { class: 'living-art-poster', src: '/assets/test.webp' }), new Element('span', { class: 'living-art-stage' })); host.setAttribute('data-art-scene', id);
    host.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 1000 });
    action.append(host); scope.append(action);
    const replay = document.createElement('button'); replay.setAttribute('data-art-replay', ''); scope.append(replay);
    let phase, progress, pause;
    if (story) {
      phase = new Element('span', { 'data-art-story-phase': '' });
      progress = new Element('input', { 'data-art-story-progress': '', type: 'range' });
      progress.value = '0';
      pause = new Element('button', { 'data-art-story-pause': '' });
      scope.append(phase, progress, pause);
    }
    parent.append(scope);
    return { scope, action, host, replay, phase, progress, pause, stage: host.querySelector('.living-art-stage') };
  };
  const first = add('mentalism', document.body, 'a'), second = add();
  const context = {
    document, window, console: { warn() {} },
    localStorage: { getItem: () => storedMotion },
    matchMedia: query => query.includes('reduced') ? reduced : fine,
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe(target, options) { this.target = target; this.options = options; } },
    IntersectionObserver: class { constructor(callback) { intersectionCallback = callback; } observe(target) { intersections.add(target); } unobserve(target) { intersections.delete(target); unobserved.push(target); } },
    Image: class { set src(value) { queueMicrotask(() => failBitmap || failExtraAsset && value.includes('clean.png') ? this.onerror() : this.onload()); } decode() { decoded++; return Promise.resolve(); } },
    DOMParser: class { parseFromString() { return { querySelector: () => null, documentElement: malformed ? new Element('html') : (() => { const scene = templateScene(story); if (malformedTrack) scene.querySelector('[data-am="story"]').setAttribute('data-frames', '{bad-json'); return scene; })() }; } },
    fetch: async url => {
      fetches.push(url);
      if (url.includes('scenes.json')) return { ok: !failManifest, json: async () => ['mentalism', 'rhythm'].map(id => ({ id, title: id, poster: '/assets/test.webp', svg: `/assets/art-motion/${id}.svg`, width: 1000, height: 1000, ...(story ? { assets: ['/assets/clean.png'], story: { duration: 20, phases: [{at: 0, label: 'VOID'},{at: 2, label: 'SEED'},{at: 6, label: 'GEOMETRY'},{at: 12, label: 'WORLD'},{at: 18, label: 'RETURN'}] } } : {}) })) };
      return { ok: true, text: async () => '<svg/>' };
    }
  };
  window.IntersectionObserver = context.IntersectionObserver;
  vm.runInNewContext(source, context);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const mutate = (target, name) => observers.filter(observer => observer.target === target && (name ? observer.options.attributeFilter?.includes(name) : observer.options.childList)).forEach(observer => observer.callback([]));
  const emit = (target, type, props = {}) => { const event = new window.Event(type, { bubbles: true, cancelable: true }); Object.assign(event, props); target.dispatchEvent(event); return event; };
  await flush();
  return { document, window, reduced, fine, frames, first, second, add, mutate, emit, flush, fetches, unobserved,
    get decoded() { return decoded; },
    svg(item = first) { return item.stage.querySelector('svg'); },
    part(type, item = first) { return this.svg(item)?.querySelector(`[data-am="${type}"]`); },
    intersect(visible, items = [first, second]) { intersectionCallback(items.map(item => ({ target: item.host, isIntersecting: visible }))); },
    step(now) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)); }
  };
}

const app = await setup();
assert.equal(app.fetches.length, 0, 'Offscreen scenes use static posters without animated downloads');
app.intersect(true); await app.flush();
assert.equal(app.fetches.length, 2, 'One descriptor index and one shared SVG fetch');
assert.equal(app.decoded, 1, 'Repeated scenes decode their shared bitmap once');
assert.equal(app.frames.size, 1, 'All artworks share one RAF chain');
for (const [index, item] of [app.first, app.second].entries()) {
  assert(item.host.classList.contains('art-ready'));
  assert(item.host.classList.contains('art-running'));
  const svg = app.svg(item), prefix = `caisik-art-${index + 1}-`;
  assert.equal(svg.id, `${prefix}scene`);
  assert.equal(svg.querySelector('[data-reference]').getAttribute('href'), `#${prefix}paint`);
  assert.equal(svg.querySelector('[data-reference]').getAttribute('mask'), `url(#${prefix}alpha)`);
  assert.equal(svg.getAttribute('aria-labelledby'), `${prefix}art-title ${prefix}art-description`);
  assert.equal(svg.getAttribute('aria-hidden'), 'true');
}
const ids = [...app.document.querySelectorAll('[id]')].map(node => node.id);
assert.equal(new Set(ids).size, ids.length, 'Duplicate compositions do not share masks/clip IDs');
app.step(0); for (let now = 100; now <= 1300; now += 100) app.step(now);
assert.equal(app.first.host.dataset.artState, 'idle');
assert.match(app.part('rotate').getAttribute('transform'), /rotate\(15\.600 500 500\)/);
assert.match(app.part('swing').getAttribute('transform'), /rotate\(7\.1281 500 100\)/);
assert.match(app.part('float').getAttribute('transform'), /translate\(3\.564 -2\.724\)/);
assert(Number(app.part('pulse').style.opacity) >= .2 && Number(app.part('pulse').style.opacity) <= .8);
assert.match(app.part('scale').getAttribute('transform'), /scale\(1\.01782\)/);
assert.equal(app.part('trace').style.strokeDashoffset, '-19.5');
assert.match(app.part('blink').getAttribute('transform'), /scale\(1 1\.0000\)/);
assert.equal(app.part('lid').style.opacity, '0');
assert.equal(app.part('wave').style.opacity, '0');
assert.equal(app.part('spark').style.opacity, '0');
app.emit(app.first.action, 'pointerenter', { pointerType: 'mouse' });
app.emit(app.first.action, 'pointermove', { pointerType: 'mouse', clientX: 1000, clientY: 1000 });
app.step(1400);
assert.notEqual(app.part('gaze').getAttribute('transform'), 'translate(0.000 0.000)');
assert(Number(app.part('shine').style.opacity) > 0);
const native = app.emit(app.first.action, 'click');
assert.equal(native.defaultPrevented, false, 'Artwork activation preserves native links/card clicks');
assert.equal(app.first.action.getAttribute('href'), '#home');
app.step(1500);
assert(Number(app.part('wave').style.opacity) > 0);
assert(Number(app.part('wave').children[0].getAttribute('r')) > 0);
assert(Number(app.part('spark').style.opacity) > 0);
app.emit(app.second.action, 'focusin'); app.step(1600);
assert(Number(app.part('shine', app.second).style.opacity) > 0, 'Keyboard focus gets the light sweep');
app.emit(app.second.replay, 'click');
assert.match(app.part('blink', app.second).getAttribute('transform'), /scale\(1 0\.0010\)/, 'Replay resets only its scope');
assert.match(app.part('blink').getAttribute('transform'), /scale\(1 1\.0000\)/);
assert.equal(app.fetches.length, 2);

app.intersect(false, [app.first]);
const frozen = app.svg().dataset.elapsed;
for (let now = 1700; now <= 2400; now += 100) app.step(now);
assert.equal(app.svg().dataset.elapsed, frozen);
app.intersect(true, [app.first]); app.step(2500);
assert.equal(app.svg().dataset.elapsed, frozen, 'A newly visible host excludes elapsed offscreen time');

const dialog = app.document.querySelector('#art-dialog');
const large = app.add('mentalism', dialog);
app.mutate(app.document.body); app.intersect(true, [large]); await app.flush();
assert.equal(app.fetches.length, 2, 'A dialog clone reuses its loaded scene');
dialog.setAttribute('open', ''); app.mutate(app.document.body, 'open');
assert.equal(app.first.host.dataset.artState, 'paused');
assert(!app.first.host.classList.contains('art-running'));
const behind = app.svg().dataset.elapsed;
app.step(2600); app.step(2700);
assert.equal(app.svg().dataset.elapsed, behind, 'Open modal freezes its background artworks');
assert(large.host.classList.contains('art-running'));
dialog.removeAttribute('open'); app.mutate(app.document.body, 'open');
assert(app.first.host.classList.contains('art-running'));
app.step(10000);
assert.equal(app.svg().dataset.elapsed, behind, 'Closing modal does not jump background clocks');
large.scope.remove(); app.mutate(app.document.body);
assert(app.unobserved.includes(large.host), 'Removed modal instances are unobserved');
const removedNode = app.part('rotate', large), removedTransform = removedNode.getAttribute('transform');
app.step(10100);
assert.equal(removedNode.getAttribute('transform'), removedTransform, 'Removed scenes stop receiving frames');

for (const pause of [
  { name: 'motion control', off() { app.document.documentElement.dataset.motion = 'off'; app.mutate(app.document.documentElement, 'data-motion'); }, on() { app.document.documentElement.dataset.motion = 'on'; app.mutate(app.document.documentElement, 'data-motion'); }, poster: true },
  { name: 'reduced motion', off() { app.reduced.matches = true; app.reduced.emit(); }, on() { app.reduced.matches = false; app.reduced.emit(); }, poster: true },
  { name: 'simple mode', off() { app.document.body.classList.add('simple-mode'); app.mutate(app.document.body, 'class'); }, on() { app.document.body.classList.remove('simple-mode'); app.mutate(app.document.body, 'class'); }, poster: true },
  { name: 'all offscreen', off() { app.intersect(false); }, on() { app.intersect(true); }, poster: false },
  { name: 'hidden tab', off() { app.document.hidden = true; app.emit(app.document, 'visibilitychange'); }, on() { app.document.hidden = false; app.emit(app.document, 'visibilitychange'); }, poster: false },
  { name: 'page cache', off() { app.emit(app.window, 'pagehide'); }, on() { app.emit(app.window, 'pageshow'); }, poster: false }
]) {
  pause.off();
  assert.equal(app.frames.size, 0, `${pause.name}: no scheduled motion`);
  assert.equal(app.first.host.classList.contains('art-running'), !pause.poster);
  const before = app.part('rotate').getAttribute('transform');
  pause.on();
  assert.equal(app.frames.size, 1, `${pause.name}: one resumed clock`);
  app.step(50000);
  assert.equal(app.part('rotate').getAttribute('transform'), before, `${pause.name}: paused time excluded`);
}
let blink = false;
for (let now = 50050; now <= 54000; now += 50) {
  app.step(now);
  const open = /scale\(1 ([\d.]+)\)/.exec(app.part('blink').getAttribute('transform'));
  if (Number(open?.[1]) < .5) blink = true;
}
assert(blink, 'Living eyes blink in their authored period');
const replaced = app.add('rhythm'); app.first.scope.remove(); app.mutate(app.document.body);
app.intersect(true, [replaced]); await app.flush();
assert.equal(app.fetches.length, 3, 'A different tab scene loads once without re-fetching descriptors');
assert.equal(app.decoded, 1, 'Shared original bitmap still decodes once');
app.step(55000); app.step(55100);
assert.equal(app.frames.size, 1);

for (const options of [{ reducedMotion: true }, { storedMotion: 'off' }, { storedMotion: '"off"' }]) {
  const paused = await setup(options); paused.intersect(true); await paused.flush();
  assert.equal(paused.fetches.length, 0);
  assert.equal(paused.frames.size, 0);
  assert(paused.first.replay.disabled);
  paused.reduced.matches = false; paused.document.documentElement.dataset.motion = 'on'; paused.mutate(paused.document.documentElement, 'data-motion'); await paused.flush();
  assert.equal(paused.frames.size, 1);
}
for (const options of [{ failBitmap: true }, { malformed: true }, { failManifest: true }]) {
  const failed = await setup(options); failed.intersect(true); await failed.flush();
  assert.equal(failed.first.host.dataset.artState, 'static');
  assert(!failed.first.host.classList.contains('art-running'));
  assert.equal(failed.frames.size, 0);
}
// Narrative tests inspect authored early/middle/late poses, rather than mirroring renderer statements.
const story = await setup({ story: true });
story.intersect(true); await story.flush();
assert.equal(story.decoded, 2, 'The shared painting and cleaned background both decode once');
assert.equal(story.first.progress.disabled, false);
assert.equal(story.first.pause.disabled, false);
const storyPart = name => story.svg().querySelector(`[data-story-part="${name}"]`);
assert.equal(storyPart('guard').style.opacity, '0', 'A story can begin with a completely hidden painted world');
assert.equal(storyPart('world').style.opacity, '0');
assert.equal(storyPart('seed').getAttribute('r'), '0');
assert.equal(story.first.phase.textContent, 'VOID');
assert.equal(storyPart('drawing').getAttribute('transform'), 'translate(2 3)', 'Opacity/dash-only tracks retain authored static transforms');
const seek = time => {
  story.first.progress.value = String(time / 20 * 100);
  story.emit(story.first.progress, 'input');
  assert.equal(Number(story.svg().dataset.storyTime), time);
  assert.equal(story.first.host.dataset.artStoryPaused, 'true');
  assert(story.first.host.classList.contains('art-running'), 'Study pause keeps the selected SVG pose visible');
};
seek(.8);
assert.equal(storyPart('guard').style.opacity, '0', 'The requested opening void lasts before the thought seed');
seek(1.5);
assert(Math.abs(Number(storyPart('guard').style.opacity) - 7/12) < 1e-8, 'The first thought fades into the original void');
assert.equal(Number(storyPart('seed').style.opacity), .5, 'Smoothstep reaches the seed midpoint');
assert(Math.abs(Number(storyPart('seed').getAttribute('r')) - 6.25) < 1e-8, 'Radius growth uses authored easing');
seek(4.5);
assert.equal(Number(storyPart('drawing').style.strokeDashoffset), 50, 'The geometric blueprint draws before full paint');
assert.equal(storyPart('world').style.opacity, '0');
seek(10);
assert.equal(Number(storyPart('world').style.opacity), .5, 'The painted world grows through a visible middle pose');
assert.match(storyPart('world').getAttribute('transform'), /translate\(-15\.0000 50\.0000\).*scale\(0\.55000\)/);
seek(13);
assert.equal(storyPart('world').style.opacity, '1', 'The full masterpiece holds after growth');
assert.equal(story.first.phase.textContent, 'WORLD');
seek(19);
assert.equal(Number(storyPart('world').style.opacity), .5, 'The finished world returns gradually toward the next loop');
seek(20);
assert.equal(storyPart('world').style.opacity, '0', 'Scrubbing 100% can inspect the closing pose without modulo jump');
assert.equal(story.first.phase.textContent, 'RETURN');
seek(1.2);
assert.match(story.part('pendulum').getAttribute('transform'), /rotate\(3\.0000 500 100\)/, 'The entire pendulum reaches its right extreme');
seek(3.6);
assert.match(story.part('pendulum').getAttribute('transform'), /rotate\(-43\.0000 500 100\)/, 'The entire pendulum covers a bold 46-degree arc');
const held = story.part('pendulum').getAttribute('transform');
story.step(0); story.step(100);
assert.equal(story.part('pendulum').getAttribute('transform'), held, 'Study pause freezes the full illustrated scene');
assert.equal(story.first.pause.getAttribute('aria-label'), 'Play mentalism animation');
assert.equal(story.first.pause.getAttribute('aria-pressed'), 'true');
story.emit(story.first.pause, 'click');
assert.equal(story.first.host.dataset.artStoryPaused, 'false');
assert.equal(story.first.pause.getAttribute('aria-label'), 'Pause mentalism animation');
story.step(200); story.step(300);
assert.notEqual(story.part('pendulum').getAttribute('transform'), held, 'Play continues from the inspected pose');
seek(19.9); story.emit(story.first.pause, 'click'); story.step(400); story.step(500); story.step(600); story.step(700);
assert(Number(story.svg().dataset.storyTime) < .5, 'A completed narrative loops back to its initial void');
assert.equal(story.first.phase.textContent, 'VOID');
story.emit(story.first.replay, 'click');
assert.equal(story.svg().dataset.storyTime, '0.000');
assert.equal(story.first.host.dataset.artStoryPaused, 'false', 'Replay resumes the story from its true beginning');
assert.equal(storyPart('world').style.opacity, '0');
const initialStoryTime = story.svg().dataset.storyTime;
story.intersect(false, [story.first]); story.step(10000); story.step(10100);
assert.equal(story.svg().dataset.storyTime, initialStoryTime, 'Story clocks also freeze offscreen');
story.intersect(true, [story.first]); story.step(20000);
assert.equal(story.svg().dataset.storyTime, initialStoryTime, 'Story visibility resume excludes hidden elapsed time');
story.document.documentElement.dataset.motion = 'off'; story.mutate(story.document.documentElement, 'data-motion');
assert(story.first.progress.disabled && story.first.pause.disabled && story.first.replay.disabled, 'The global preference disables local narrative controls');
assert(!story.first.host.classList.contains('art-running'), 'Global pause restores the approved poster');
for (const options of [{story: true, failExtraAsset: true}, {story: true, malformedTrack: true}]) {
  const failed = await setup(options); failed.intersect(true); await failed.flush();
  assert.equal(failed.first.host.dataset.artState, 'static', 'Incomplete story assets/tracks retain the original artwork');
  assert.equal(failed.frames.size, 0);
}
console.log('PASS: 14 motion channels; void-to-world narrative, loop and full pendulum arc; scoped seek/pause/replay; shared assets/RAF; modal/offscreen/preferences; static fallback.');
