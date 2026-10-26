/* Geographic contracts + DOM/MapLibre lifecycle. Actual GPU rendering is browser QA. */
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {validCityPoint, cityRouteData, createCityExperience} from '../dist/city-map.js';

const places = [
  {id: 'first', name: 'První místo', lat: 48.8566, lng: 2.3522},
  {id: 'second', name: 'Druhé místo', lat: 48.861, lng: 2.36},
  {id: 'third', name: 'Třetí místo', lat: 48.872, lng: 2.38}
];
for (const item of [null, {}, {lat: null, lng: 2}, {lat: '48', lng: 2}, {lat: NaN, lng: 2}, {lat: 91, lng: 2}, {lat: 48, lng: 181}]) {
  assert.equal(validCityPoint(item), false, `reject invalid or absent coordinate ${JSON.stringify(item)}`);
}
assert(validCityPoint({lat: 0, lng: 0}), 'real zero coordinates remain legal numbers');
const interrupted = cityRouteData([places[0], {id: 'missing', lat: null, lng: null}, places[1], places[2]]);
assert.equal(interrupted.features.length, 1, 'missing coordinate interrupts route; never invent a leg or 0,0');
assert.deepEqual(interrupted.features[0].geometry.coordinates, [[2.36, 48.861], [2.38, 48.872]], 'GeoJSON uses lng,lat in original order');
assert.equal(cityRouteData([]).features.length, 0);

function harness({reduced = false, observer = true} = {}) {
  const {document, window} = parseHTML('<!doctype html><html data-motion="on"><head></head><body><div class="map-wrap"><div id="city-map"></div></div></body></html>');
  const maps = [], markers = [], observers = [], mutations = [], frames = new Map();
  const mediaHandlers = new Set(); let frameId = 0, clock = 0;
  const media = {matches: reduced, addEventListener(_event, fn) {mediaHandlers.add(fn);}, removeEventListener(_event, fn) {mediaHandlers.delete(fn);}, change(value) {this.matches = value; mediaHandlers.forEach(fn => fn());}};
  class IO {
    constructor(callback, options) {this.callback = callback; this.options = options; this.connected = true; observers.push(this);}
    observe(target) {this.target = target;}
    disconnect() {this.connected = false;}
    show(yes = true) {this.callback([{target: this.target, isIntersecting: yes}]);}
  }
  class MO {
    constructor(callback) {this.callback = callback; this.connected = true; mutations.push(this);}
    observe() {} disconnect() {this.connected = false;}
  }
  class Bounds {constructor() {this.points = [];} extend(p) {this.points.push(p); return this;}}
  class Marker {
    constructor(options) {this.options = options; this.element = options.element; markers.push(this);}
    setLngLat(point) {this.point = point; return this;}
    addTo(map) {this.map = map; map.options.container.append(this.element); return this;}
    remove() {this.removed = true; this.element.remove();}
  }
  class MapMock {
    constructor(options) {
      this.options = options; this.handlers = {}; this.sources = {}; this.layers = new Map(); this.paint = []; this.moves = [];
      this.canvas = document.createElement('canvas'); options.container.append(this.canvas);
      this.scrollZoom = {disable: () => {this.scrollDisabled = true;}};
      this.touchPitch = {disable() {}}; this.pitch = options.pitch; this.zoom = options.zoom; this.bearing = options.bearing;
      maps.push(this);
    }
    on(name, fn) {(this.handlers[name] ||= []).push(fn); return this;}
    once(name, fn) {return this.on(name, fn);}
    emit(name, event = {}) {for (const fn of this.handlers[name] || []) fn(event);}
    getCanvas() {return this.canvas;}
    getStyle() {return {layers: [{id: 'footprints', type: 'fill', source: 'openmaptiles', 'source-layer': 'building'}]};}
    getLayer(id) {return this.layers.get(id);}
    addLayer(layer) {this.layers.set(layer.id, layer);}
    getSource(id) {return this.sources[id];}
    addSource(id, source) {this.sources[id] = {...source, setData(data) {this.data = data;}};}
    setPaintProperty(...args) {this.paint.push(args);}
    resize() {this.resized = true;}
    stop() {this.stopped = true;}
    easeTo(options) {this.moves.push({kind: 'ease', ...options}); this.pitch = options.pitch ?? this.pitch; this.zoom = options.zoom ?? this.zoom; this.bearing = options.bearing ?? this.bearing;}
    jumpTo(options) {this.moves.push({kind: 'jump', ...options}); this.pitch = options.pitch ?? this.pitch; this.zoom = options.zoom ?? this.zoom; this.bearing = options.bearing ?? this.bearing;}
    fitBounds(bounds, options) {this.moves.push({kind: 'bounds', bounds, ...options});}
    getPitch() {return this.pitch;} getZoom() {return this.zoom;} getBearing() {return this.bearing;}
    remove() {this.removed = true; this.canvas.remove();}
  }
  window.maplibregl = {Map: MapMock, Marker, LngLatBounds: Bounds};
  window.matchMedia = () => media;
  Object.defineProperty(document, 'hidden', {value: false, writable: true});
  Object.assign(globalThis, {window, document, MutationObserver: MO, ResizeObserver: MO,
    performance: {now: () => clock},
    requestAnimationFrame: fn => {frames.set(++frameId, fn); return frameId;},
    cancelAnimationFrame: id => frames.delete(id)});
  if (observer) globalThis.IntersectionObserver = IO; else delete globalThis.IntersectionObserver;
  const selections = [], openings = [], fallbacks = [], readies = [];
  const host = document.querySelector('.map-wrap'), fallbackElement = document.querySelector('#city-map');
  const api = createCityExperience({host, fallbackElement, places,
    onSelect: (...args) => selections.push(args), onOpen: id => openings.push(id),
    onFallback: reason => fallbacks.push(reason), onReady: info => readies.push(info)});
  const event = (target, name, props = {}) => {const e = new window.Event(name, {bubbles: true, cancelable: true}); Object.assign(e, props); target.dispatchEvent(e); return e;};
  const flush = (count = 200) => {let i = 0; while (frames.size && i++ < count) {clock += 16.67; const tasks = [...frames.values()]; frames.clear(); tasks.forEach(fn => fn(clock));} return i;};
  return {api, host, fallbackElement, maps, markers, observers, mutations, frames, media, document, selections, openings, fallbacks, readies, event, flush};
}

{
  const h = harness();
  assert.equal(h.maps.length, 0, 'WebGL library is not initialized before map is nearby');
  h.observers[0].show(true); h.observers[1].show(true); await Promise.resolve();
  const map = h.maps[0]; assert(map);
  assert.equal(map.options.scrollZoom, false, 'native wheel scrolling is never captured by default');
  assert(map.scrollDisabled);
  map.emit('load');
  assert.equal(h.host.dataset.cityMode, '3d');
  assert.equal(h.fallbackElement.hidden, true); assert.equal(h.fallbackElement.inert, true);
  assert.equal(h.readies.length, 1);
  assert.equal(h.markers.length, 3, 'each verified point has one native DOM pin');
  assert.deepEqual(h.markers[0].point, [2.3522, 48.8566]);
  const layer = map.getLayer('caisik-buildings');
  assert.equal(layer['source-layer'], 'building', 'buildings use real tile footprint source');
  assert.deepEqual(layer.filter, ['!', ['has', 'hide_3d']], 'source rules suppress hidden 3D footprints');
  h.flush(); assert.equal(h.frames.size, 0, 'finite reveal settles without idle RAF');
  h.event(h.host.querySelector('.city-map-replay'), 'click');
  assert(h.frames.size > 0, 'explicit replay starts a bounded reveal');
  h.event(h.host.querySelector('.city-map-camera button:nth-child(4)'), 'click');
  assert.equal(h.frames.size, 0, 'user zoom cancels intro frames so intro cannot override navigation');
  h.event(h.markers[1].element, 'click');
  assert.deepEqual(h.selections, [['second', true]], 'pin delegates selection once without a duplicate camera callback');
  h.api.select('second', {fly: true}); h.api.select('second');
  assert.equal(h.selections.length, 1, 'selection synchronization never recursively calls onSelect');
  assert.equal(h.markers[1].element.getAttribute('aria-pressed'), 'true');
  h.event(h.host.querySelector('.city-map-selected button'), 'click'); assert.deepEqual(h.openings, ['second']);
  h.api.setRoute({id: 'route', title: 'Vlastní cesta', stops: places});
  assert.equal(map.getSource('caisik-route').data.features.length, 2);
  assert.match(h.host.querySelector('.city-map-note').textContent, /nikoliv pěší trasu/);
  assert.equal(h.markers[2].element.querySelector('.city-pin-number').textContent, '03');
  h.api.setRoute(null); assert.equal(map.getSource('caisik-route').data.features.length, 0, 'clearing route removes all geometry');
  h.api.setUserLocation({lat: null, lng: null}); assert.equal(h.markers.length, 3);
  h.api.setUserLocation({lat: 48.86, lng: 2.35}); assert.equal(h.markers.length, 4);
  h.api.setPlaces([places[1], {id: 'invalid', lat: null, lng: null}, places[1]], 'second');
  assert.equal(h.host.querySelectorAll('.city-pin').length, 1, 'filtering retains stable pin and rejects invalid/duplicate positions');
  assert.equal(h.host.querySelector('.city-pin-number').textContent, '02', 'filtered results preserve original atlas numbering');
  const wheel = h.event(h.host.querySelector('.city-canvas'), 'wheel', {ctrlKey: false, deltaY: 100});
  assert.equal(wheel.defaultPrevented, false, 'ordinary page wheel is not intercepted');
  const ctrlWheel = h.event(h.host.querySelector('.city-canvas'), 'wheel', {ctrlKey: true, deltaY: 100});
  assert.equal(ctrlWheel.defaultPrevented, true, 'explicit Ctrl wheel zoom is available');
  h.event(h.host.querySelector('.city-map-toolbar button:nth-child(2)'), 'click');
  assert.equal(h.host.dataset.cityMode, '2d'); assert.equal(h.fallbackElement.hidden, false); assert.equal(h.fallbackElement.inert, false);
  assert.equal(h.fallbacks.length, 1);
  h.event(h.host.querySelector('.city-map-toolbar button'), 'click');
  assert.equal(h.host.dataset.cityMode, '3d', '2D/3D is reversible without constructing a second WebGL map');
  assert.equal(h.maps.length, 1);
  h.media.change(true);
  h.api.select('second', {fly: true}); assert.equal(map.moves.at(-1).kind, 'jump', 'live reduced motion performs static camera updates');
  h.flush(); assert.equal(h.frames.size, 0);
  h.event(window, 'pagehide', {persisted: true});
  assert(!map.removed, 'BFCache navigation suspends rather than destroys WebGL');
  h.event(window, 'pageshow', {persisted: true});
  assert.equal(h.host.dataset.cityMode, '3d', 'BFCache restoration retains selected map mode');
  h.event(window, 'pagehide', {persisted: false});
  h.api.destroy(); assert(map.removed, 'real page exit destroys the WebGL context');
  assert.equal(h.host.querySelector('.city-canvas'), null); assert.equal(h.fallbackElement.hidden, false);
  assert.equal(h.frames.size, 0); assert(h.observers.every(o => !o.connected)); assert(h.mutations.every(o => !o.connected));
}
{
  const h = harness({reduced: true, observer: false}); await Promise.resolve();
  const map = h.maps[0]; map.emit('load');
  assert.equal(h.frames.size, 0, 'reduced-motion initial view is complete and static');
  h.event(map.getCanvas(), 'webglcontextlost');
  assert.equal(h.host.dataset.cityMode, '2d'); assert(map.removed);
  assert.match(h.host.querySelector('.city-map-status').textContent, /přerušeno/);
  assert.equal(h.fallbacks.length, 1, 'WebGL loss has visible functional 2D fallback');
  h.api.destroy();
}
{
  const h = harness(); h.observers[0].show(true); h.api.destroy(); await Promise.resolve();
  assert.equal(h.maps.length, 0, 'destroy during asynchronous library load cannot resurrect a map');
}
console.log('PASS city-map: geographic validation/route gaps, lazy initialization, real building layer, accessible stable pins, route clear, explicit geolocation only, native page wheel, reversible 2D/3D, finite RAF, live reduced motion, WebGL fallback and cleanup.');
