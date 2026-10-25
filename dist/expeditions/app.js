/* Native scroll is the input. All lesson, route and source text remains in HTML. */
import {validateExpeditionData} from './schema.js?v=1';
import {createExpeditionStore, NOTE_FIELDS, CHAPTER_IDS, buildMarkdownGuide, EXPEDITION_STORAGE_KEY} from './store.js?v=2';

const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export function sampleStory(steps, scrollY, focusOffset = 0) {
  if (!steps.length) return {index: 0, chapterId: null, phase: 0, progress: 0, total: 0, crossfade: 0, nextChapterId: null};
  const probe = scrollY + focusOffset;
  let index = 0;
  for (let i = 1; i < steps.length; i++) if (probe >= steps[i].top) index = i;
  const step = steps[index];
  const local = clamp((probe - step.top) / Math.max(1, step.bottom - step.top));
  const same = steps.filter(item => item.chapterId === step.chapterId);
  const localIndex = same.indexOf(step);
  const progress = same.length > 1 ? (localIndex + local) / same.length : local;
  const phase = same.length > 1 ? Math.max(0, Math.min(2, step.phase)) : Math.min(2, Math.floor(progress * 3));
  const next = steps[index + 1];
  const crossfade = next && next.chapterId !== step.chapterId ? clamp((local - .84) / .16) : 0;
  return {index, chapterId: step.chapterId, phase, progress, total: (index + local) / steps.length, crossfade, nextChapterId: crossfade > 0 ? next.chapterId : null};
}
export function diagramPose(progress) {
  const p = clamp(progress);
  return {rotation: p * 165, dash: 1 - clamp(p / .8), cursor: 35 + 530 * p, breath: p * 500, iris: 30 + 50 * clamp(p / .6), beat: Math.min(7, Math.floor(p * 8)), imageScale: 1 + p * .025};
}
export function routeAdvanceState(stopIds, currentStopId) {
  const currentIndex = Math.max(0, stopIds.indexOf(currentStopId));
  const nextStopId = stopIds[currentIndex + 1] || null;
  return {nextStopId, finished: stopIds.length > 0 && !nextStopId};
}

let mounted = null;
function mount() {
  if (mounted || !document.body?.dataset.expedition) return;
  const controller = new AbortController();
  const signal = controller.signal;
  const on = (target, type, callback, options = {}) => target?.addEventListener(type, callback, {...options, signal});
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const pageId = document.body.dataset.expedition;
  const overview = pageId === 'overview';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const shortScreen = matchMedia('(max-height: 560px), (max-width: 600px) and (max-height: 700px)');
  const modeButton = $('#exp-mode');
  const stage = $('#exp-stage');
  const status = $('#exp-storage-status');
  const offlineStatus = $('#exp-offline-status');
  const exportStatus = $('#exp-export-status');
  const form = $('#exp-blackbook-form');
  const select = $('#exp-note-chapter');
  const sceneNodes = $$('.exp-scene[data-scene]');
  const stepNodes = $$('[data-story-step][data-chapter]');
  const routeNodes = $$('[data-stop-id]');
  const progressNode = $('#exp-progress');
  const phaseNode = $('#exp-phase');
  let model = null, frame = 0, metrics = [], field = false, disposed = false, resizeObserver = null, mediaObserver = null;
  let current = {chapterId: overview ? 'dj' : pageId, phase: 0, progress: 0, total: 0};
  let noteBaseline = {};
  const trackedTimeouts = new Set(), objectUrls = new Set(), ports = new Set();
  const later = (callback, ms) => { const handle = setTimeout(() => { trackedTimeouts.delete(handle); if (!disposed) callback(); }, ms); trackedTimeouts.add(handle); return handle; };
  const storage = createExpeditionStore({storage: () => window.localStorage, onStatus: value => {
    if (status) { status.textContent = value.message; status.dataset.persistence = value.durable ? 'local' : 'memory'; }
  }});
  const noteChapter = () => CHAPTER_IDS.includes(select?.value) ? select.value : CHAPTER_IDS.includes(pageId) ? pageId : 'writer';
  const existingMotionOff = () => {
    try { const raw = localStorage.getItem('atlas-motion'); return raw === 'off' || JSON.parse(raw || 'null') === 'off'; } catch { return false; }
  };
  const quietRequired = () => reduced.matches || shortScreen.matches || existingMotionOff();
  const artImage = scene => scene.querySelector('img.exp-art,.exp-art img,img[data-src]');
  const showImage = scene => {
    const image = artImage(scene);
    if (!image || image.dataset.failed === 'true') return;
    if (!image.getAttribute('src') && image.dataset.src) image.src = image.dataset.src;
  };
  function missingImage(image) {
    image.dataset.failed = 'true'; image.hidden = true;
    image.closest('.exp-scene')?.classList.add('exp-art-unavailable');
  }
  for (const image of $$('img.exp-art,.exp-art img,.exp-scene img[data-src],.exp-hero-art img')) {
    on(image, 'error', () => missingImage(image));
    if (image.getAttribute('src') && image.complete && image.naturalWidth === 0) missingImage(image);
  }
  if ('IntersectionObserver' in window) {
    mediaObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const chapter = entry.target.dataset.chapter;
        const index = sceneNodes.findIndex(scene => scene.dataset.scene === chapter);
        for (const offset of [0, 1]) if (sceneNodes[index + offset]) showImage(sceneNodes[index + offset]);
        mediaObserver.unobserve(entry.target);
      }
    }, {rootMargin: '250px 0px'});
    stepNodes.forEach(node => mediaObserver.observe(node));
  }
  if (sceneNodes[0]) showImage(sceneNodes[0]);
  function pose(scene, p, opacity = 1, staticFrame = false) {
    const value = diagramPose(staticFrame ? 1 : p);
    scene.style.opacity = String(opacity);
    scene.style.transform = staticFrame ? 'none' : `translate3d(${((1 - opacity) * 16).toFixed(2)}px,0,0)`;
    scene.dataset.progress = (staticFrame ? 1 : p).toFixed(4);
    const image = artImage(scene);
    if (image) image.style.transform = staticFrame ? 'none' : `scale(${value.imageScale.toFixed(4)})`;
    for (const node of scene.querySelectorAll('[data-spin]')) node.setAttribute('transform', `rotate(${value.rotation.toFixed(3)} 300 300)`);
    for (const node of scene.querySelectorAll('[data-draw]')) { node.style.strokeDasharray = '1'; node.style.strokeDashoffset = String(value.dash); }
    for (const node of scene.querySelectorAll('[data-cursor]')) node.setAttribute('cx', String(value.cursor));
    for (const node of scene.querySelectorAll('[data-breath]')) node.setAttribute('transform', `translate(${value.breath.toFixed(2)} 0)`);
    for (const node of scene.querySelectorAll('[data-iris]')) node.setAttribute('r', String(value.iris));
    for (const [index, node] of Array.from(scene.querySelectorAll('[data-beat]')).entries()) node.setAttribute('opacity', index <= value.beat ? '1' : '.2');
  }
  function measure() {
    const y = window.scrollY;
    metrics = stepNodes.map(node => { const rect = node.getBoundingClientRect(); return {node, chapterId: node.dataset.chapter, phase: Number(node.dataset.phase || 0), top: rect.top + y, bottom: rect.bottom + y}; });
  }
  function render() {
    frame = 0;
    if (disposed || document.hidden || field || !metrics.length) return;
    const header = $('.exp-header') || $('header');
    const headerHeight = header?.getBoundingClientRect().height || 80;
    current = sampleStory(metrics, window.scrollY, headerHeight + Math.min(innerHeight * .23, 200));
    for (const scene of sceneNodes) {
      const isCurrent = scene.dataset.scene === current.chapterId;
      const isNext = scene.dataset.scene === current.nextChapterId;
      const opacity = isCurrent ? 1 - current.crossfade : isNext ? current.crossfade : 0;
      if (opacity > 0) { showImage(scene); pose(scene, isCurrent ? current.progress : 0, opacity); }
      else scene.style.opacity = '0';
    }
    if (stage) { stage.dataset.activeChapter = current.chapterId || ''; stage.dataset.phase = String(current.phase); stage.dataset.progress = current.progress.toFixed(4); }
    if (progressNode) progressNode.value = current.total;
    const text = ['01 / POZORUJ', '02 / POCHOP', '03 / VYTVOŘ'][current.phase];
    if (phaseNode && phaseNode.textContent !== text) phaseNode.textContent = text;
    for (const node of stepNodes) node.classList.toggle('exp-step-current', node === metrics[current.index]?.node);
  }
  function schedule() { if (!frame && !field && !disposed && !document.hidden) frame = requestAnimationFrame(render); }
  function applyMode(requested, {persist = false, navigate = false} = {}) {
    field = quietRequired() || requested === 'field';
    document.body.classList.toggle('exp-field', field);
    document.body.dataset.expMode = field ? 'field' : 'story';
    if (modeButton) {
      modeButton.setAttribute('aria-pressed', String(field));
      modeButton.disabled = quietRequired();
      modeButton.textContent = field ? 'Příběhový režim' : 'Terénní / klidný režim';
      if (quietRequired()) { modeButton.textContent = 'Klidný režim'; modeButton.title = 'Pohyb je omezený nastavením zařízení, atlasu nebo výškou obrazovky.'; }
      else modeButton.removeAttribute('title');
    }
    if (persist) storage.setMode(field ? 'field' : 'story');
    if (field) {
      cancelAnimationFrame(frame); frame = 0;
      sceneNodes.forEach(scene => pose(scene, 1, 1, true));
      if (stage) stage.dataset.motion = 'static';
      if (phaseNode) phaseNode.textContent = 'KLIDNÉ ČTENÍ / CELÝ OBSAH';
    } else { if (stage) stage.dataset.motion = 'scroll'; measure(); schedule(); }
    if (navigate) {
      const target = field ? $('#route') || $('.exp-story') : $('.exp-story');
      target?.scrollIntoView({behavior: 'auto', block: 'start'});
      try {
        const url = new URL(location.href);
        if (!field) url.searchParams.delete('mode');
        url.hash = field ? ($('#route') ? 'route' : 'story') : 'story';
        history.replaceState(null, '', url);
      } catch {}
    }
  }
  function loadNote({preserveEditing = false} = {}) {
    const note = storage.getChapter(noteChapter());
    for (const input of form?.querySelectorAll('[data-note-field]') || []) if (NOTE_FIELDS.includes(input.name)) {
      // An active edit wins locally. Other fields can follow another open tab.
      if (preserveEditing && (input === document.activeElement || input.value !== (noteBaseline[input.name] || ''))) continue;
      input.value = note[input.name] || '';
      noteBaseline[input.name] = input.value;
    }
  }
  function saveNote() {
    const fields = {};
    for (const input of form?.querySelectorAll('[data-note-field]') || []) if (NOTE_FIELDS.includes(input.name) && input.value !== (noteBaseline[input.name] || '')) fields[input.name] = input.value;
    const saved = storage.updateChapter(noteChapter(), fields);
    for (const key of Object.keys(fields)) noteBaseline[key] = fields[key];
    return saved;
  }
  function applyStop(chapterId, stopId, focus = false) {
    const nodes = routeNodes.filter(node => (node.dataset.chapter || pageId) === chapterId);
    const target = nodes.find(node => node.dataset.stopId === stopId) || nodes[0];
    for (const node of nodes) {
      const selected = node === target;
      node.classList.toggle('exp-stop-current', selected);
      if (selected) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
    }
    if (target) {
      const advance = routeAdvanceState(nodes.map(node => node.dataset.stopId), target.dataset.stopId);
      for (const button of $$('.exp-field-bar [data-next-stop]')) {
        button.dataset.nextStop = advance.nextStopId || '';
        button.dataset.routeFinished = String(advance.finished);
        button.value = advance.nextStopId || '';
        button.textContent = advance.finished ? 'Do Blackbooku →' : 'Další místo →';
      }
    }
    if (focus && target) { target.tabIndex = -1; target.scrollIntoView({behavior: 'auto', block: 'start'}); target.focus({preventScroll: true}); }
  }
  function download(content, type, filename) {
    // Keep a real link available if a browser declines a scripted download.
    for (const previous of objectUrls) URL.revokeObjectURL(previous);
    objectUrls.clear();
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob); objectUrls.add(url);
    const prepared = $('#exp-export-ready');
    if (prepared) { prepared.href = url; prepared.download = filename; prepared.hidden = false; prepared.textContent = `Stáhnout soubor ${filename} ↓`; }
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
    anchor.hidden = true; document.body.append(anchor); anchor.click(); anchor.remove();
  }
  function exportNotes() {
    try {
      saveNote(); download(JSON.stringify(storage.exportPayload(), null, 2), 'application/json;charset=utf-8', 'CAISIK-Expeditions-Blackbook.json');
      if (exportStatus) exportStatus.textContent = 'Blackbook je připravený ke stažení. Ověř uložený soubor ve stažených souborech prohlížeče.';
    } catch {
      if (exportStatus) exportStatus.textContent = 'Export se nepodařilo připravit. Ponech stránku otevřenou a zkopíruj si vlastní text do souboru.';
    }
  }
  function exportGuide() {
    try {
      saveNote();
      const content = model ? buildMarkdownGuide(model, noteChapter(), storage.snapshot()) : `${document.querySelector('main')?.innerText || document.body.innerText}\n\n# Můj Blackbook\n\n${JSON.stringify(storage.exportPayload(), null, 2)}`;
      download(content, 'text/plain;charset=utf-8', `CAISIK-${noteChapter()}-terenni-pruvodce.txt`);
      if (exportStatus) exportStatus.textContent = 'Textový průvodce je připravený ke stažení. Obsahuje lekce, adresy i tvoje poznámky.';
    } catch {
      if (exportStatus) exportStatus.textContent = 'Průvodce se nepodařilo připravit. Blackbook můžeš exportovat samostatně nebo si text stránky vytisknout.';
    }
  }
  on(form, 'input', event => { if (event.target.matches('[data-note-field]')) saveNote(); });
  on(form, 'focusout', event => { if (event.target.matches('[data-note-field]')) loadNote({preserveEditing: true}); });
  on(form, 'submit', event => { event.preventDefault(); saveNote(); });
  on(select, 'change', () => { noteBaseline = {}; loadNote(); });
  on($('#exp-export'), 'click', exportNotes);
  on($('#exp-export-text'), 'click', exportGuide);
  on(modeButton, 'click', () => applyMode(field ? 'story' : 'field', {persist: true, navigate: true}));
  on(document, 'click', event => {
    const fieldLink = event.target.closest('[data-mode="field"]');
    if (fieldLink) {
      const href = fieldLink.getAttribute('href') || '';
      if (!href || href.startsWith('#') || new URL(href, location.href).pathname === location.pathname) {
        event.preventDefault(); applyMode('field', {persist: true}); $('#route')?.scrollIntoView({behavior: 'auto', block: 'start'});
        try { history.replaceState(null, '', '#route'); } catch {}
        return;
      }
    }
    const next = event.target.closest('[data-next-stop]');
    if (next) {
      if (next.closest('.exp-field-bar') && next.dataset.routeFinished === 'true') {
        const blackbook = $('#blackbook');
        if (blackbook) { blackbook.tabIndex = -1; blackbook.scrollIntoView({behavior: 'auto', block: 'start'}); blackbook.focus({preventScroll: true}); }
        return;
      }
      const currentStop = next.closest('[data-stop-id]');
      const chapterId = currentStop?.dataset.chapter || pageId;
      const siblings = routeNodes.filter(node => (node.dataset.chapter || pageId) === chapterId);
      const target = siblings.find(node => node.dataset.stopId === next.dataset.nextStop) || siblings[siblings.indexOf(currentStop) + 1];
      if (CHAPTER_IDS.includes(chapterId) && target) { storage.setCurrentStop(chapterId, target.dataset.stopId); applyStop(chapterId, target.dataset.stopId, true); }
    }
  });
  const modePreference = () => new URLSearchParams(location.search).get('mode') === 'field' || location.hash === '#route' ? 'field' : storage.getMode() || 'story';
  on(window, 'scroll', schedule, {passive: true});
  on(window, 'resize', () => { applyMode(modePreference()); measure(); schedule(); }, {passive: true});
  on(document, 'toggle', () => { measure(); schedule(); }, {capture: true});
  on(document, 'visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { measure(); schedule(); } });
  on(window, 'storage', event => {
    if (event.key === 'atlas-motion') applyMode(modePreference());
    if (event.key === EXPEDITION_STORAGE_KEY || event.key === null) {
      storage.refresh(); loadNote({preserveEditing: true});
      for (const chapterId of CHAPTER_IDS) applyStop(chapterId, storage.getCurrentStop(chapterId));
    }
  });
  on(reduced, 'change', () => applyMode(modePreference()));
  on(shortScreen, 'change', () => applyMode(modePreference()));
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => { measure(); schedule(); });
    stepNodes.forEach(node => resizeObserver.observe(node));
    if ($('header')) resizeObserver.observe($('header'));
  }
  for (const chapterId of CHAPTER_IDS) applyStop(chapterId, storage.getCurrentStop(chapterId));
  loadNote(); measure(); applyMode(modePreference());
  if (document.fonts?.ready) document.fonts.ready.then(() => { if (!disposed) { measure(); schedule(); } });

  const cacheButton = $('#exp-save-offline');
  on(cacheButton, 'click', async () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      if (offlineStatus) offlineStatus.textContent = 'Offline uložení v prohlížeči není dostupné. Stáhni si textový průvodce a Blackbook.';
      return;
    }
    cacheButton.disabled = true;
    if (offlineStatus) offlineStatus.textContent = 'Ukládám texty expedic pro čtení bez připojení…';
    try {
      const registration = await navigator.serviceWorker.register('/expeditions/sw.js', {scope: '/expeditions/'});
      const worker = registration.active || await new Promise((resolve, reject) => {
        const installing = registration.installing || registration.waiting;
        if (!installing) { reject(new Error('No offline worker')); return; }
        const timeout = later(() => reject(new Error('Offline worker timeout')), 25000);
        const changed = () => {
          if (installing.state === 'activated') { clearTimeout(timeout); trackedTimeouts.delete(timeout); installing.removeEventListener('statechange', changed); resolve(installing); }
          else if (installing.state === 'redundant') { clearTimeout(timeout); trackedTimeouts.delete(timeout); installing.removeEventListener('statechange', changed); reject(new Error('Offline worker installation failed')); }
        };
        installing.addEventListener('statechange', changed, {signal});
        signal.addEventListener('abort', () => reject(new Error('Page closed')), {once: true}); changed();
      });
      const chapter = model?.chapters.find(item => item.id === noteChapter());
      const result = await new Promise((resolve, reject) => {
        const channel = new MessageChannel(); ports.add(channel.port1);
        const timeout = later(() => { channel.port1.close(); ports.delete(channel.port1); reject(new Error('Offline save timeout')); }, 40000);
        channel.port1.onmessage = event => { clearTimeout(timeout); trackedTimeouts.delete(timeout); channel.port1.close(); ports.delete(channel.port1); resolve(event.data); };
        signal.addEventListener('abort', () => reject(new Error('Page closed')), {once: true});
        worker.postMessage({type: 'SAVE_EXPEDITIONS', art: chapter?.art.poster || null}, [channel.port2]);
      });
      if (offlineStatus) offlineStatus.textContent = result.ok ? 'Texty všech pěti expedic jsou uložené offline. Navigace a aktuální program pořadatelů dál potřebují internet.' : result.textReady ? 'Texty jsou uložené offline; část ilustrací se nepodařilo uložit. Externí navigace potřebuje internet.' : 'Offline uložení se nedokončilo. Stáhni si textový průvodce a Blackbook.';
    } catch {
      if (offlineStatus) offlineStatus.textContent = 'Offline uložení se nepodařilo. Stáhni si textový průvodce a Blackbook.';
    } finally { if (!disposed) cacheButton.disabled = false; }
  });
  fetch('/expeditions/data/expeditions.json?v=1', {signal}).then(response => {
    if (!response.ok) throw new Error('Content unavailable');
    return response.json();
  }).then(data => {
    if (disposed) return;
    model = validateExpeditionData(data);
    document.body.dataset.expData = 'ready';
  }).catch(error => {
    if (signal.aborted || disposed) return;
    document.body.dataset.expData = 'unavailable';
    const warning = $('#exp-content-error');
    if (warning) { warning.hidden = false; warning.textContent = 'Doplňková data teď nejsou dostupná. Plné lekce a trasa zůstávají v textu stránky; poznámky lze dál exportovat.'; }
  });
  function dispose() {
    if (disposed) return;
    disposed = true; controller.abort(); cancelAnimationFrame(frame);
    resizeObserver?.disconnect(); mediaObserver?.disconnect();
    trackedTimeouts.forEach(clearTimeout); trackedTimeouts.clear();
    objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls.clear();
    const prepared = $('#exp-export-ready');
    if (prepared) { prepared.hidden = true; prepared.removeAttribute('href'); }
    ports.forEach(port => port.close()); ports.clear();
    if (mounted?.dispose === dispose) mounted = null;
  }
  on(window, 'pagehide', dispose);
  mounted = {dispose, state: () => ({pageId, field, quietRequired: quietRequired(), chapterId: current.chapterId, phase: current.phase, progress: current.progress, dataReady: Boolean(model), persistence: storage.persistence()})};
  window.CAISIK_EXPEDITIONS = Object.freeze({getState: () => mounted?.state() || {mounted: false}});
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true}); else mount();
  window.addEventListener('pageshow', event => { if (event.persisted) mount(); });
}
