/* CAISIK living artworks. Scene-specific SVG craft, one clock, exact static fallbacks. */
(() => {
  'use strict';
  const selector = '.living-art[data-art-scene]';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const states = new Map(), scenes = new Map(), bitmaps = new Map();
  const supported = new Set(['rotate','swing','float','pulse','scale','trace','shine','gaze','blink','lid','wave','spark']);
  let manifest, frame = 0, serial = 0, pageHidden = false, storedMotion;
  try { storedMotion = localStorage.getItem('atlas-motion'); if (storedMotion !== 'off' && storedMotion !== 'on') storedMotion = JSON.parse(storedMotion); } catch {}
  const clamp = value => Math.max(0, Math.min(1, value));
  const easeOut = value => 1 - (1 - clamp(value)) ** 3;
  const number = (node, key, fallback) => {
    const value = node.dataset[key];
    return value !== undefined && Number.isFinite(Number(value)) ? Number(value) : fallback;
  };
  const transform = (node, value) => node.setAttribute('transform', value);
  const opacity = (node, value) => { node.style.opacity = String(value); };
  const permitted = () => !reduced.matches && (document.documentElement.dataset.motion || storedMotion) !== 'off' && !document.body.classList.contains('simple-mode');
  const obscured = state => {
    const dialog = document.querySelector('#art-dialog[open]');
    return Boolean(dialog && !dialog.contains(state.host));
  };
  const active = state => state.ready && state.visible && state.host.isConnected && permitted() && !document.hidden && !pageHidden && !obscured(state);
  const interacting = state => state.hover || state.focus;

  function descriptors() {
    if (!manifest) manifest = fetch('/assets/art-motion/scenes.json?v=1').then(response => {
      if (!response.ok) throw new Error('Artwork index unavailable');
      return response.json();
    }).then(items => {
      if (!Array.isArray(items)) throw new Error('Artwork index invalid');
      return new Map(items.map(item => [item.id, item]));
    });
    return manifest;
  }

  function decode(poster) {
    if (!bitmaps.has(poster)) bitmaps.set(poster, new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.decode ? image.decode().then(resolve, reject) : resolve();
      image.onerror = () => reject(new Error('Artwork bitmap unavailable'));
      image.src = poster;
    }));
    return bitmaps.get(poster);
  }

  function source(item) {
    if (!scenes.has(item.id)) scenes.set(item.id, Promise.all([
      fetch(`${item.svg}?v=1`).then(response => {
        if (!response.ok) throw new Error('Artwork scene unavailable');
        return response.text();
      }),
      decode(item.poster)
    ]).then(([svg]) => svg));
    return scenes.get(item.id);
  }

  function isolateSvg(text) {
    const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') throw new Error('Artwork scene invalid');
    const svg = document.importNode(parsed.documentElement, true);
    const prefix = `caisik-art-${++serial}-`, ids = new Map();
    const elements = [svg, ...svg.querySelectorAll('*')];
    for (const element of elements) if (element.id) {
      ids.set(element.id, `${prefix}${element.id}`);
      element.id = `${prefix}${element.id}`;
    }
    for (const element of elements) for (const attribute of [...element.attributes]) {
      let value = attribute.value.replace(/url\(\s*(["']?)#([^\s)"']+)\1\s*\)/g, (match, quote, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
      if (attribute.localName === 'href' && value.startsWith('#') && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
      if (attribute.name === 'aria-labelledby' || attribute.name === 'aria-describedby') value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    return svg;
  }

  function showState(state) {
    const value = state.failed ? 'static' : !permitted() || !state.visible || document.hidden || pageHidden || obscured(state) ? 'paused' : !state.ready ? 'loading' : state.elapsed - state.introStart < 1.1 ? 'intro' : interacting(state) || state.elapsed - state.burstStart < .8 ? 'awake' : 'idle';
    if (state.host.dataset.artState !== value) state.host.dataset.artState = value;
  }

  function opening(node, time, introTime) {
    const period = Math.max(.8, number(node, 'period', 8));
    const phase = number(node, 'phase', 0) / (Math.PI * 2) * period;
    const position = ((Math.max(0, time - 1.1) + phase) % period + period) % period;
    const blink = position > period - .28 && position < period - .08 ? Math.sin((position - period + .28) / .2 * Math.PI) : 0;
    return clamp((introTime - .2) / .22) * (1 - blink);
  }

  function render(state, delta = 0) {
    const time = state.elapsed, introTime = time - state.introStart;
    const follow = 1 - Math.exp(-delta * 12);
    state.gazeX += (state.targetX - state.gazeX) * follow;
    state.gazeY += (state.targetY - state.gazeY) * follow;
    state.host.style.setProperty('--art-x', state.gazeX.toFixed(3));
    state.host.style.setProperty('--art-y', state.gazeY.toFixed(3));
    const burst = (time - state.burstStart) / .8, bursting = burst >= 0 && burst < 1;
    const shine = (time - state.shineStart) / .65;
    let eyeOpen = 1;
    for (const node of state.nodes) {
      const type = node.dataset.am;
      const cx = number(node, 'cx', state.item.width / 2), cy = number(node, 'cy', state.item.height / 2);
      const period = Math.max(.1, number(node, 'period', 6));
      const phase = number(node, 'phase', 0), q = time / period * Math.PI * 2 + phase;
      switch (type) {
        case 'rotate': transform(node, `rotate(${(time * number(node, 'speed', 6)).toFixed(3)} ${cx} ${cy})`); break;
        case 'swing': transform(node, `rotate(${(number(node, 'amp', 1) * Math.sin(q)).toFixed(4)} ${cx} ${cy})`); break;
        case 'float': transform(node, `translate(${(number(node, 'x', 0) * Math.sin(q)).toFixed(3)} ${(number(node, 'y', 3) * Math.cos(q)).toFixed(3)})`); break;
        case 'pulse': {
          const low = number(node, 'min', .3), high = number(node, 'max', 1);
          opacity(node, low + (high - low) * (.5 + Math.sin(q) * .5));
          break;
        }
        case 'scale': {
          const scale = 1 + number(node, 'amp', .02) * Math.sin(q);
          transform(node, `translate(${cx} ${cy}) scale(${scale.toFixed(5)}) translate(${-cx} ${-cy})`);
          break;
        }
        case 'trace': node.style.strokeDashoffset = String(-time * number(node, 'speed', 15)); break;
        case 'shine': {
          const progress = shine >= 0 && shine <= 1 ? shine : ((time / Math.max(.1, number(node, 'period', 8)) + phase / (Math.PI * 2)) % 1 + 1) % 1;
          const start = number(node, 'start', -state.item.width * .3), end = number(node, 'end', state.item.width * 1.4);
          transform(node, `translate(${(start + progress * (end - start)).toFixed(3)} 0)`);
          opacity(node, Math.sin(progress * Math.PI) * .7);
          break;
        }
        case 'gaze': transform(node, `translate(${(state.gazeX * number(node, 'x', 9)).toFixed(3)} ${(state.gazeY * number(node, 'y', 4)).toFixed(3)})`); break;
        case 'blink': {
          const open = opening(node, time, introTime);
          eyeOpen = Math.min(eyeOpen, open);
          transform(node, `translate(${cx} ${cy}) scale(1 ${Math.max(.001, open).toFixed(4)}) translate(${-cx} ${-cy})`);
          break;
        }
        case 'lid': opacity(node, 1 - opening(node, time, introTime)); break;
        case 'wave': {
          const radius = easeOut(burst) * number(node, 'radius', state.item.width * .3);
          [...node.children].forEach((circle, index) => circle.setAttribute('r', String(radius * (index ? .82 : 1))));
          opacity(node, bursting ? (1 - burst) * .8 : 0);
          break;
        }
        case 'spark': {
          const angle = number(node, 'angle', 0) / 180 * Math.PI;
          const radius = 10 + easeOut(burst) * number(node, 'radius', state.item.width * .25);
          const scale = 1 - clamp(burst) * .7;
          transform(node, `translate(${(cx + Math.cos(angle) * radius).toFixed(3)} ${(cy + Math.sin(angle) * radius).toFixed(3)}) rotate(${(number(node, 'angle', 0) + clamp(burst) * 60).toFixed(3)}) scale(${scale.toFixed(3)})`);
          opacity(node, bursting ? Math.sin(burst * Math.PI) * .9 : 0);
          break;
        }
      }
    }
    const stamp = Math.floor(time * 5);
    if (stamp !== state.stamp) {
      state.stamp = stamp;
      state.svg.dataset.elapsed = time.toFixed(3);
      state.svg.dataset.open = eyeOpen.toFixed(3);
      state.svg.dataset.burst = bursting ? burst.toFixed(3) : 'off';
      state.svg.dataset.shine = shine >= 0 && shine <= 1 ? shine.toFixed(3) : 'auto';
      showState(state);
    }
  }

  function tick(now) {
    frame = 0;
    let running = false;
    for (const state of states.values()) {
      if (!active(state)) { state.lastTime = null; continue; }
      running = true;
      const delta = state.lastTime === null ? 0 : Math.max(0, Math.min((now - state.lastTime) / 1000, .1));
      state.lastTime = now;
      state.elapsed += delta;
      render(state, delta);
    }
    if (running) frame = requestAnimationFrame(tick);
  }

  function synchronize() {
    const allowed = permitted();
    for (const state of states.values()) {
      state.host.classList.toggle('art-running', state.ready && allowed && !obscured(state));
      if (!active(state)) state.lastTime = null;
      if (!allowed) {
        state.host.style.setProperty('--art-x', '0');
        state.host.style.setProperty('--art-y', '0');
      }
      showState(state);
      if (allowed && state.host.isConnected && state.visible && !obscured(state) && !state.ready && !state.loading && !state.failed) load(state);
    }
    document.querySelectorAll('[data-art-replay]').forEach(button => { button.disabled = !allowed; });
    if ([...states.values()].some(active)) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  async function load(state) {
    state.loading = true;
    try {
      const item = (await descriptors()).get(state.id);
      if (!item || !item.poster?.startsWith('/assets/') || !item.svg?.startsWith('/assets/art-motion/') || !Number.isFinite(item.width) || !Number.isFinite(item.height)) throw new Error('Artwork metadata invalid');
      const svg = isolateSvg(await source(item));
      if (!states.has(state.host) || !state.host.isConnected) return;
      state.item = item;
      state.nodes = [...svg.querySelectorAll('[data-am]')];
      if (!state.nodes.length || state.nodes.some(node => !supported.has(node.dataset.am))) throw new Error('Artwork channels invalid');
      state.svg = svg;
      state.introStart = state.elapsed;
      state.shineStart = state.elapsed + .15;
      state.stage.append(svg);
      render(state);
      state.ready = true;
      state.host.classList.add('art-ready');
      if (state.pendingReplay) replay(state);
    } catch (error) {
      if (states.has(state.host)) {
        state.failed = true;
        state.svg?.remove();
        state.host.classList.remove('art-ready', 'art-running');
        console.warn('CAISIK artwork: approved static image retained.');
      }
    } finally {
      state.loading = false;
      if (states.has(state.host)) synchronize();
    }
  }

  function awaken(state, burst = false) {
    if (!permitted() || !state.ready) return;
    state.shineStart = state.elapsed;
    if (burst) state.burstStart = state.elapsed;
    state.stamp = -1;
    render(state);
    synchronize();
  }

  function replay(state) {
    if (!permitted()) return;
    if (!state.ready) { state.pendingReplay = true; if (!state.loading && !state.failed) load(state); return; }
    state.pendingReplay = false;
    state.introStart = state.elapsed;
    state.shineStart = state.elapsed + .15;
    state.burstStart = state.elapsed + .3;
    state.stamp = -1;
    render(state);
    synchronize();
  }

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = states.get(entry.target);
      if (state) state.visible = entry.isIntersecting;
    }
    synchronize();
  }, { threshold: 0 }) : null;

  function register(host) {
    if (states.has(host)) return;
    const stage = host.querySelector('.living-art-stage');
    if (!stage) return;
    const interaction = host.closest('button,a') || host;
    const state = { host, stage, interaction, id: host.dataset.artScene, visible: !observer, ready: false, loading: false, failed: false, elapsed: 0, introStart: 0, shineStart: -10, burstStart: -10, lastTime: null, stamp: -1, targetX: 0, targetY: 0, gazeX: 0, gazeY: 0, hover: false, focus: false, listeners: [] };
    states.set(host, state);
    const on = (type, handler, options) => { interaction.addEventListener(type, handler, options); state.listeners.push([type, handler, options]); };
    on('pointerenter', event => {
      if (event.pointerType === 'touch' || !fine.matches || !permitted()) return;
      state.hover = true;
      awaken(state);
    });
    on('pointermove', event => {
      if (event.pointerType === 'touch' || !fine.matches || !permitted()) return;
      const box = host.getBoundingClientRect();
      if (!box.width || !box.height) return;
      state.targetX = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
      state.targetY = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    }, { passive: true });
    on('pointerleave', () => { state.hover = false; state.targetX = state.targetY = 0; showState(state); });
    on('focusin', () => { state.focus = true; awaken(state); });
    on('focusout', event => { if (!interaction.contains(event.relatedTarget)) { state.focus = false; state.targetX = state.targetY = 0; showState(state); } });
    on('click', () => awaken(state, true));
    observer?.observe(host);
  }

  function scan() {
    for (const [host, state] of states) if (!host.isConnected) {
      observer?.unobserve(host);
      state.listeners.forEach(([type, handler, options]) => state.interaction.removeEventListener(type, handler, options));
      states.delete(host);
    }
    document.querySelectorAll(selector).forEach(register);
    synchronize();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-art-replay]');
    if (!button) return;
    const host = button.closest('.art-motion-scope')?.querySelector(selector);
    const state = states.get(host);
    if (state) replay(state);
  });
  document.addEventListener('visibilitychange', synchronize);
  document.addEventListener('close', synchronize, true);
  reduced.addEventListener?.('change', synchronize);
  fine.addEventListener?.('change', () => {
    if (!fine.matches) for (const state of states.values()) { state.hover = false; state.targetX = state.targetY = 0; }
    synchronize();
  });
  new MutationObserver(synchronize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  new MutationObserver(synchronize).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  window.addEventListener('pagehide', () => { pageHidden = true; synchronize(); });
  window.addEventListener('pageshow', () => { pageHidden = false; synchronize(); });
  scan();
})();
