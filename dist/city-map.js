/* Geographic atlas enhancement. The existing Leaflet map remains the 2D fallback. */
const HOME = [2.3522, 48.8566];
const HEIGHT = ['max', 0, ['to-number', ['get', 'render_height'], 12]];
const BASE = ['max', 0, ['to-number', ['get', 'render_min_height'], 0]];
let libraryPromise;
let serial = 0;

export function validCityPoint(place) {
  return !!place && typeof place.lat === 'number' && typeof place.lng === 'number'
    && Number.isFinite(place.lat) && Number.isFinite(place.lng)
    && Math.abs(place.lat) <= 90 && Math.abs(place.lng) <= 180;
}

export function cityRouteData(stops = []) {
  // A missing coordinate interrupts a sequence: never invent a connecting leg.
  const features = [];
  for (let i = 1; i < stops.length; i++) {
    if (validCityPoint(stops[i - 1]) && validCityPoint(stops[i])) {
      features.push({type: 'Feature', properties: {order: i}, geometry: {
        type: 'LineString', coordinates: [stops[i - 1], stops[i]].map(p => [p.lng, p.lat])
      }});
    }
  }
  return {type: 'FeatureCollection', features};
}

function loadLibrary() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (libraryPromise) return libraryPromise;
  libraryPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-city-map-vendor]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = '/vendor/maplibre-gl.css';
      link.dataset.cityMapVendor = ''; document.head.append(link);
    }
    const script = document.createElement('script');
    script.src = '/vendor/maplibre-gl.js'; script.async = true;
    script.dataset.cityMapVendor = '';
    const timer = setTimeout(() => finish(new Error('Mapový modul neodpověděl.')), 12000);
    function finish(error) {
      clearTimeout(timer); script.onload = script.onerror = null;
      if (error) { script.remove(); libraryPromise = undefined; reject(error); }
      else if (window.maplibregl) resolve(window.maplibregl);
      else { libraryPromise = undefined; reject(new Error('Mapový modul není dostupný.')); }
    }
    script.onload = () => finish();
    script.onerror = () => finish(new Error('Mapový modul nelze načíst.'));
    document.head.append(script);
  });
  return libraryPromise;
}

export function createCityExperience({host, fallbackElement, places = [], onSelect, onOpen, onFallback, onReady} = {}) {
  if (!host || !fallbackElement) throw new TypeError('Map host and 2D fallback are required.');
  const doc = host.ownerDocument;
  const root = doc.documentElement;
  const instance = ++serial;
  const abort = new AbortController();
  const removers = [];
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const pins = new Map();
  let map, gl, userMarker, route = null, selectedId = null, disposed = false;
  let mode = 'waiting', requestedMode = '3d', loading = false, ready = false;
  let nearby = false, visible = typeof IntersectionObserver === 'undefined', frame = 0, tween = null, loadTimer = 0, routeTimer = 0;
  let routeOrder = new Map(), pointerFrame = 0, resizeObserver, observer, viewportObserver, preferences;
  let userPosition = null, currentPlaces = cleanPlaces(places), introPlayed = false;
  const placeNumbers = new Map(currentPlaces.map((place, index) => [place.id, index + 1]));
  const fallbackWasHidden = fallbackElement.hidden;
  const fallbackWasInert = !!fallbackElement.inert;
  const hostHadClass = host.classList.contains('city-map-experience');
  host.classList.add('city-map-experience');

  function element(tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function listen(target, name, fn, options) {
    target.addEventListener(name, fn, options);
    removers.push(() => target.removeEventListener(name, fn, options));
  }
  function button(label, text, fn, className = '') {
    const node = element('button', `city-map-button ${className}`, text);
    node.type = 'button'; node.setAttribute('aria-label', label); node.title = label;
    listen(node, 'click', fn); return node;
  }
  const canvas = element('div', 'city-canvas');
  canvas.id = `city-3d-${instance}`;
  canvas.setAttribute('role', 'region');
  canvas.setAttribute('aria-label', 'Prostorová mapa Paříže. Tažením měníte pohled, kolečko posouvá stránku.');
  canvas.hidden = true;
  const toolbar = element('div', 'city-map-toolbar');
  toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', 'Pohled na město');
  const mode3D = button('Prostorová mapa 3D', '3D', () => show3D(true), 'city-map-mode');
  const mode2D = button('Klasická mapa 2D', '2D', () => show2D('Klasická 2D mapa.'), 'city-map-mode');
  mode3D.setAttribute('aria-controls', canvas.id);
  mode2D.setAttribute('aria-controls', fallbackElement.id);
  const controls = element('div', 'city-map-camera');
  controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', 'Ovládání 3D kamery');
  const center = button('Zobrazit všechna místa', '⌖', () => fitPlaces());
  const tilt = button('Přepnout sklon mapy', '◩', () => {
    if (!map || !ready) return;
    camera({pitch: map.getPitch() > 20 ? 0 : 58, duration: 700});
  });
  const rotate = button('Otočit mapu o 45 stupňů', '↻', () => {
    if (map && ready) camera({bearing: map.getBearing() + 45, duration: 700});
  });
  const zoomIn = button('Přiblížit mapu', '+', () => map && ready && camera({zoom: map.getZoom() + 1, duration: 450}));
  const zoomOut = button('Oddálit mapu', '−', () => map && ready && camera({zoom: map.getZoom() - 1, duration: 450}));
  controls.append(center, tilt, rotate, zoomIn, zoomOut);
  const replay = button('Přehrát krátké odhalení města', 'ODHALIT MĚSTO ↗', () => intro(true), 'city-map-replay');
  const skip = button('Přeskočit odhalení města', 'PŘESKOČIT →', () => finishMotion(), 'city-map-skip');
  skip.hidden = true;
  toolbar.append(mode3D, mode2D, controls, replay, skip);
  const status = element('p', 'city-map-status', '3D atlas se načte při přiblížení k mapě.');
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const note = element('p', 'city-map-note', '3D: ilustrativní výšky. Piny označují místa, ne přesné vstupy.');
  const hint = element('span', 'city-map-hint', 'TAŽENÍ = POHLED · CTRL + KOLEČKO = ZOOM');
  const selected = element('div', 'city-map-selected');
  const selectedLabel = element('span', 'city-map-selected-label', 'PAŘÍŽ / TVŮJ PRŮZKUM');
  const open = button('Otevřít vybrané místo', 'PROZKOUMAT ↗', () => selectedId && onOpen?.(selectedId));
  selected.append(selectedLabel, open); open.hidden = true;
  host.append(canvas, toolbar, status, selected, note, hint);

  function cleanPlaces(items) {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter(p => {
      if (!validCityPoint(p) || typeof p.id !== 'string' || seen.has(p.id)) return false;
      seen.add(p.id); return true;
    });
  }
  function motionAllowed() {
    return !disposed && visible && !doc.hidden && !reduced?.matches && root.dataset.motion !== 'off'
      && !['off', 'reduced', 'quiet', 'calm'].includes(root.dataset.selfmadeMotion)
      && !doc.body.classList.contains('simple-mode') && !doc.body.classList.contains('exp-field');
  }
  function updateModeUI() {
    host.dataset.cityMode = mode;
    host.classList.toggle('city-motion-paused', !motionAllowed());
    mode3D.setAttribute('aria-pressed', String(mode === '3d'));
    mode2D.setAttribute('aria-pressed', String(mode === '2d'));
    for (const b of controls.querySelectorAll('button')) b.disabled = mode !== '3d' || !ready;
    replay.hidden = mode !== '3d' || !motionAllowed();
    note.hidden = mode !== '3d'; hint.hidden = mode !== '3d';
    selected.hidden = mode !== '3d';
  }
  function show2D(message = '2D mapa je připravená.', error = false) {
    if (disposed) return;
    requestedMode = '2d'; mode = '2d';
    finishMotion(false); map?.stop();
    canvas.hidden = true; fallbackElement.hidden = false; fallbackElement.inert = false;
    status.textContent = message; status.classList.toggle('is-error', error);
    updateModeUI(); onFallback?.({reason: message, error});
  }
  async function show3D(explicit = false) {
    if (disposed) return;
    requestedMode = '3d';
    if (ready && map) {
      mode = '3d'; canvas.hidden = false; fallbackElement.hidden = true; fallbackElement.inert = true;
      status.textContent = 'PROSTOROVÝ ATLAS / PARIS'; status.classList.remove('is-error');
      updateModeUI(); map.resize(); return;
    }
    if (loading || (!nearby && !explicit)) return;
    loading = true; mode = 'loading'; canvas.hidden = false;
    fallbackElement.hidden = true; fallbackElement.inert = true;
    status.textContent = 'Načítám prostorové město… 2D mapa je kdykoliv dostupná.';
    updateModeUI();
    try {
      gl = await loadLibrary();
      if (disposed || requestedMode !== '3d') { loading = false; canvas.hidden = true; return; }
      if (typeof gl.supported === 'function' && !gl.supported()) throw new Error('Zařízení nepodporuje WebGL.');
      map = new gl.Map({container: canvas, style: '/map-data/caisik-style.json',
        center: HOME, zoom: 13.1, pitch: 48, bearing: -23, minZoom: 10, maxZoom: 19,
        maxPitch: 68, scrollZoom: false, attributionControl: true,
        cooperativeGestures: true, fadeDuration: motionAllowed() ? 180 : 0,
        canvasContextAttributes: {antialias: true},
        renderWorldCopies: false});
      map.scrollZoom?.disable();
      map.touchPitch?.disable();
      map.getCanvas().setAttribute('aria-label', '3D mapa Paříže. Posun šipkami, přiblížení tlačítky.');
      map.getCanvas().setAttribute('tabindex', '0');
      listen(map.getCanvas(), 'pointerdown', () => {
        if (tween) { map.stop(); finishMotion(false); }
      });
      listen(map.getCanvas(), 'webglcontextlost', event => {
        event.preventDefault(); fallback('3D zobrazení bylo přerušeno. Pokračuj ve 2D mapě.');
      });
      // A wheel without Ctrl remains entirely native page scrolling.
      listen(canvas, 'wheel', event => {
        if (!event.ctrlKey || !ready || mode !== '3d') return;
        event.preventDefault();
        const delta = Math.max(-1, Math.min(1, -event.deltaY / 240));
        camera({zoom: map.getZoom() + delta, duration: 120});
      }, {passive: false});
      let errors = 0;
      map.on('error', event => {
        if (disposed || requestedMode !== '3d') return;
        errors++;
        if (!ready && (!event.sourceId || errors >= 3)) fallback('3D podklady nelze načíst. K dispozici je 2D mapa a seznam míst.');
        else if (ready && errors >= 6) fallback('Část 3D podkladů není dostupná. Pokračuj ve 2D mapě.');
      });
      map.once('load', mapLoaded);
      loadTimer = setTimeout(() => {
        if (!ready && !disposed) fallback('3D mapa se nenačetla včas. Přepnuto na 2D mapu.');
      }, 18000);
    } catch (error) {
      loading = false;
      const message = /webgl|context/i.test(error?.message || '')
        ? 'Zařízení nepodporuje WebGL 2. Použij 2D mapu.'
        : '3D mapu nelze načíst. Použij 2D mapu.';
      fallback(message);
    }
  }
  function fallback(message) {
    clearTimeout(loadTimer); loading = false; ready = false;
    show2D(message, true);
    for (const {marker} of pins.values()) marker.remove(); pins.clear();
    userMarker?.remove(); userMarker = null;
    map?.remove(); map = null;
  }
  function mapLoaded() {
    if (disposed || !map) return;
    clearTimeout(loadTimer); loading = false; ready = true;
    installBuildings(); installRoute(); syncPins(); setUserLocation(userPosition);
    if (requestedMode !== '3d') { show2D(); return; }
    mode = '3d'; canvas.hidden = false; fallbackElement.hidden = true; fallbackElement.inert = true;
    status.textContent = 'PROSTOROVÝ ATLAS / PARIS'; status.classList.remove('is-error');
    updateModeUI(); map.resize();
    if (!introPlayed && visible) intro();
    onReady?.({mode: '3d'});
  }
  function installBuildings() {
    if (map.getLayer('caisik-buildings')) return;
    // Source-layer is an actual OpenMapTiles building footprint, not generated geometry.
    const style = map.getStyle();
    const footprint = style.layers.find(layer => layer['source-layer'] === 'building' && layer.source);
    if (!footprint) { status.textContent = '3D mapa: vrstva budov není dostupná.'; return; }
    const before = style.layers.find(layer => layer.type === 'symbol')?.id;
    map.addLayer({id: 'caisik-buildings', type: 'fill-extrusion', source: footprint.source,
      'source-layer': 'building', minzoom: 13, filter: ['!', ['has', 'hide_3d']],
      paint: {'fill-extrusion-color': '#d8c995', 'fill-extrusion-height': HEIGHT,
        'fill-extrusion-base': BASE, 'fill-extrusion-opacity': 0.88,
        'fill-extrusion-vertical-gradient': true}}, before);
  }
  function buildingAmount(amount) {
    if (!map?.getLayer('caisik-buildings')) return;
    map.setPaintProperty('caisik-buildings', 'fill-extrusion-height', ['*', HEIGHT, amount]);
    map.setPaintProperty('caisik-buildings', 'fill-extrusion-base', ['*', BASE, amount]);
  }
  function camera(options) {
    if (!map || !ready || mode !== '3d') return;
    if (tween) finishMotion(false);
    map.stop();
    if (!motionAllowed()) map.jumpTo({...options, duration: 0});
    else map.easeTo({...options, essential: false});
  }
  function fitPlaces() {
    if (!map || !ready || !currentPlaces.length) return;
    finishMotion(false);
    if (currentPlaces.length === 1) { select(currentPlaces[0].id, {fly: true}); return; }
    const bounds = new gl.LngLatBounds(); currentPlaces.forEach(p => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, {padding: 75, maxZoom: 14.7, pitch: 45, bearing: -23,
      duration: motionAllowed() ? 1000 : 0, essential: false});
  }
  function intro(replayIntro = false) {
    if (!map || !ready || mode !== '3d') return;
    introPlayed = true;
    finishMotion();
    const focus = currentPlaces.find(p => p.id === selectedId) || currentPlaces[0];
    if (!focus) { fitPlaces(); return; }
    const end = {center: [focus.lng, focus.lat], zoom: 15.65, pitch: 58, bearing: -23};
    if (!motionAllowed()) { map.jumpTo(end); buildingAmount(1); return; }
    if (replayIntro) map.jumpTo({center: [focus.lng, focus.lat], zoom: 13.3, pitch: 35, bearing: -38});
    buildingAmount(0.03); host.classList.add('city-intro-running'); skip.hidden = false;
    map.easeTo({...end, duration: 2400, easing: t => 1 - Math.pow(1 - t, 3), essential: false});
    tween = {start: performance.now(), duration: 2400, end};
    frame = requestAnimationFrame(animate);
  }
  function animate(now) {
    frame = 0;
    if (!tween || !motionAllowed() || mode !== '3d') { finishMotion(); return; }
    const t = Math.min(1, Math.max(0, (now - tween.start) / tween.duration));
    buildingAmount(1 - Math.pow(1 - t, 3));
    host.style.setProperty('--city-reveal', t.toFixed(4));
    if (t < 1) frame = requestAnimationFrame(animate);
    else finishMotion(false);
  }
  function finishMotion(jump = true) {
    if (frame) cancelAnimationFrame(frame); frame = 0;
    if (pointerFrame) cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    if (tween && jump && map) { map.stop(); map.jumpTo(tween.end); }
    tween = null; skip.hidden = true; host.classList.remove('city-intro-running');
    host.style.setProperty('--city-reveal', '1'); buildingAmount(1);
    host.style.removeProperty('--city-pointer-x'); host.style.removeProperty('--city-pointer-y');
  }
  function syncPins() {
    if (!ready || !map) return;
    const ids = new Set(currentPlaces.map(p => p.id));
    for (const [id, item] of pins) if (!ids.has(id)) { item.marker.remove(); pins.delete(id); }
    currentPlaces.forEach(place => {
      let item = pins.get(place.id);
      if (!item) {
        const pin = element('button', 'city-pin'); pin.type = 'button';
        const number = element('span', 'city-pin-number');
        const label = element('span', 'city-pin-label');
        pin.append(number, label);
        pin.addEventListener('click', event => { event.stopPropagation(); onSelect?.(place.id, true); }, {signal: abort.signal});
        const marker = new gl.Marker({element: pin, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport'})
          .setLngLat([place.lng, place.lat]).addTo(map);
        item = {pin, marker, number, label}; pins.set(place.id, item);
      }
      item.marker.setLngLat([place.lng, place.lat]);
      item.number.textContent = String(routeOrder.get(place.id) || placeNumbers.get(place.id)).padStart(2, '0');
      item.label.textContent = place.name;
      item.pin.setAttribute('aria-label', `${place.name}${routeOrder.has(place.id) ? `, zastávka ${routeOrder.get(place.id)}` : ''}`);
      item.pin.setAttribute('aria-pressed', String(place.id === selectedId));
      item.pin.classList.toggle('is-selected', place.id === selectedId);
      item.pin.classList.toggle('is-route-stop', routeOrder.has(place.id));
    });
  }
  function select(id, {fly = false} = {}) {
    const place = currentPlaces.find(p => p.id === id);
    selectedId = place?.id || null;
    selectedLabel.textContent = place ? place.name : 'PAŘÍŽ / TVŮJ PRŮZKUM'; open.hidden = !place;
    if (place) open.setAttribute('aria-label', `Otevřít ${place.name}`);
    for (const [pinId, {pin}] of pins) {
      pin.classList.toggle('is-selected', pinId === selectedId);
      pin.setAttribute('aria-pressed', String(pinId === selectedId));
    }
    if (place && fly && ready && mode === '3d') {
      finishMotion(false);
      camera({center: [place.lng, place.lat], zoom: 16.1, pitch: 58, duration: 1350});
      if (motionAllowed()) {
        host.classList.remove('city-focus-enter');
        void selected.offsetWidth; host.classList.add('city-focus-enter');
        clearTimeout(routeTimer); routeTimer = setTimeout(() => host.classList.remove('city-focus-enter'), 1400);
      }
    }
  }
  function setPlaces(items, id = selectedId) {
    currentPlaces = cleanPlaces(items);
    currentPlaces.forEach(place => {
      if (!placeNumbers.has(place.id)) placeNumbers.set(place.id, placeNumbers.size + 1);
    });
    syncPins(); select(id);
  }
  function installRoute() {
    if (!map || !ready) return;
    const data = cityRouteData(route?.stops || []);
    if (map.getSource('caisik-route')) map.getSource('caisik-route').setData(data);
    else {
      map.addSource('caisik-route', {type: 'geojson', data});
      map.addLayer({id: 'caisik-route-glow', type: 'line', source: 'caisik-route',
        paint: {'line-color': '#ffd600', 'line-width': 9, 'line-opacity': 0.12}});
      map.addLayer({id: 'caisik-route-line', type: 'line', source: 'caisik-route',
        layout: {'line-cap': 'round', 'line-join': 'round'},
        paint: {'line-color': '#ffd600', 'line-width': 2.4, 'line-dasharray': [1, 2], 'line-opacity': 0.9}});
    }
  }
  function setRoute(nextRoute) {
    route = nextRoute || null; routeOrder = new Map();
    (route?.stops || []).forEach((p, index) => { if (p?.id) routeOrder.set(p.id, index + 1); });
    installRoute(); syncPins();
    host.classList.toggle('city-has-route', !!route);
    note.textContent = route
      ? 'Spojnice ukazuje pořadí zastávek, nikoliv pěší trasu. 3D výšky jsou ilustrativní.'
      : '3D: ilustrativní výšky. Piny označují místa, ne přesné vstupy.';
    const stops = (route?.stops || []).filter(validCityPoint);
    if (stops.length > 1 && ready && mode === '3d') {
      finishMotion(false); const bounds = new gl.LngLatBounds(); stops.forEach(p => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, {padding: 80, maxZoom: 15.2, pitch: 48, duration: motionAllowed() ? 1000 : 0});
    }
  }
  function setUserLocation(position) {
    userPosition = validCityPoint(position) ? {lat: position.lat, lng: position.lng} : null;
    userMarker?.remove(); userMarker = null;
    if (!ready || !map || !userPosition) return;
    const node = element('div', 'city-user-location');
    node.setAttribute('role', 'img'); node.setAttribute('aria-label', 'Tvoje přibližná poloha');
    userMarker = new gl.Marker({element: node}).setLngLat([userPosition.lng, userPosition.lat]).addTo(map);
  }
  function preferenceChanged() {
    updateModeUI(); if (!motionAllowed()) { finishMotion(); map?.stop(); }
  }
  listen(doc, 'visibilitychange', preferenceChanged);
  listen(window, 'pagehide', event => {
    if (!event.persisted) { destroy(); return; }
    visible = false; preferenceChanged();
  });
  listen(window, 'pageshow', () => { visible = true; preferenceChanged(); map?.resize(); });
  if (reduced?.addEventListener) listen(reduced, 'change', preferenceChanged);
  if (typeof MutationObserver !== 'undefined') {
    preferences = new MutationObserver(preferenceChanged);
    preferences.observe(root, {attributes: true, attributeFilter: ['data-motion', 'data-selfmade-motion']});
    preferences.observe(doc.body, {attributes: true, attributeFilter: ['class']});
  }
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => map?.resize()); resizeObserver.observe(host);
  }
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        nearby = entry.isIntersecting;
        if (nearby && requestedMode === '3d') show3D();
      }
    }, {rootMargin: '240px 0px', threshold: 0}); observer.observe(host);
    viewportObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        visible = entry.isIntersecting;
        preferenceChanged();
        if (visible && ready && mode === '3d' && !introPlayed) intro();
      }
    }, {threshold: 0}); viewportObserver.observe(host);
  } else { nearby = true; show3D(); }
  listen(host, 'pointermove', event => {
    if (event.pointerType !== 'mouse' || !motionAllowed() || mode !== '3d' || pointerFrame) return;
    const x = event.clientX, y = event.clientY;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0; if (disposed || !motionAllowed()) return;
      const box = host.getBoundingClientRect();
      host.style.setProperty('--city-pointer-x', `${x - box.left}px`);
      host.style.setProperty('--city-pointer-y', `${y - box.top}px`);
    });
  });
  listen(host, 'pointerleave', () => {
    host.style.removeProperty('--city-pointer-x'); host.style.removeProperty('--city-pointer-y');
  });
  updateModeUI(); select(null);
  function destroy() {
    if (disposed) return;
    finishMotion(); disposed = true; abort.abort();
    clearTimeout(loadTimer); clearTimeout(routeTimer);
    removers.forEach(remove => remove()); observer?.disconnect(); viewportObserver?.disconnect(); preferences?.disconnect(); resizeObserver?.disconnect();
    for (const {marker} of pins.values()) marker.remove(); pins.clear(); userMarker?.remove();
    map?.remove(); map = null;
    [canvas, toolbar, status, selected, note, hint].forEach(node => node.remove());
    fallbackElement.hidden = fallbackWasHidden; fallbackElement.inert = fallbackWasInert;
    if (!hostHadClass) host.classList.remove('city-map-experience');
    host.classList.remove('city-intro-running', 'city-focus-enter', 'city-has-route', 'city-motion-paused');
    delete host.dataset.cityMode;
    ['--city-reveal', '--city-pointer-x', '--city-pointer-y'].forEach(key => host.style.removeProperty(key));
  }
  return {setPlaces, select, setRoute, setUserLocation, destroy};
}
