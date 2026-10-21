/* CAISIK living artworks. Scene-specific SVG craft, one clock, exact static fallbacks. */
(() => {
  'use strict';
  const selector = '.living-art[data-art-scene]';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const states = new Map(), scenes = new Map(), bitmaps = new Map();
  const supported = new Set(['rotate','swing','float','pulse','scale','trace','shine','gaze','blink','lid','wave','spark','story','pendulum']);
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
  const active = state => state.ready && !state.localPaused && state.visible && state.host.isConnected && permitted() && !document.hidden && !pageHidden && !obscured(state);
  const interacting = state => state.hover || state.focus;

  function descriptors() {
    if (!manifest) manifest = fetch('/assets/art-motion/scenes.json?v=3').then(response => {
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
      fetch(`${item.svg}?v=${item.sceneSha256 || 2}`).then(response => {
        if (!response.ok) throw new Error('Artwork scene unavailable');
        return response.text();
      }),
      decode(item.poster),
      ...((item.assets || []).map(asset => {
        if (typeof asset !== 'string' || !asset.startsWith('/assets/')) throw new Error('Artwork image metadata invalid');
        return decode(asset);
      }))
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
    const value = state.failed ? 'static' : !permitted() || state.localPaused || !state.visible || document.hidden || pageHidden || obscured(state) ? 'paused' : !state.ready ? 'loading' : state.elapsed - state.introStart < 1.1 ? 'intro' : interacting(state) || state.elapsed - state.burstStart < .8 ? 'awake' : 'idle';
    if (state.host.dataset.artState !== value) state.host.dataset.artState = value;
  }

  function opening(node, time, introTime) {
    const period = Math.max(.8, number(node, 'period', 8));
    const phase = number(node, 'phase', 0) / (Math.PI * 2) * period;
    const position = ((Math.max(0, time - 1.1) + phase) % period + period) % period;
    const blink = position > period - .28 && position < period - .08 ? Math.sin((position - period + .28) / .2 * Math.PI) : 0;
    return clamp((introTime - .2) / .22) * (1 - blink);
  }

  const trackKeys = new Set(['opacity','x','y','scale','rotate','dash','r']);
  function authoredTracks(node) {
    const tracks = JSON.parse(node.dataset.frames || '{}');
    if (!tracks || typeof tracks !== 'object' || Array.isArray(tracks)) throw new Error('Artwork story tracks invalid');
    for (const [name, keys] of Object.entries(tracks)) {
      if (!trackKeys.has(name) || !Array.isArray(keys) || !keys.length) throw new Error('Artwork story track invalid');
      let previous = -Infinity;
      for (const key of keys) {
        if (!Array.isArray(key) || key.length !== 2 || !key.every(Number.isFinite) || key[0] < 0 || key[0] < previous) throw new Error('Artwork story key invalid');
        previous = key[0];
      }
    }
    return tracks;
  }
  function sample(keys, time, fallback, smooth) {
    if (!keys?.length) return fallback;
    if (time < keys[0][0]) return keys[0][1];
    for (let index = 1; index < keys.length; index++) {
      if (time < keys[index][0]) {
        const [start, from] = keys[index - 1], [end, to] = keys[index];
        let progress = end > start ? clamp((time - start) / (end - start)) : 1;
        if (smooth) progress = progress * progress * (3 - 2 * progress);
        return from + (to - from) * progress;
      }
    }
    return keys.at(-1)[1];
  }
  function storyTime(state) {
    if (!state.storyDuration) return 0;
    return state.storySeekEnd ? state.storyDuration : state.storyElapsed % state.storyDuration;
  }
  function storyControls(state) {
    const scope = state.host.closest('.art-motion-scope');
    if (!scope) return;
    const label = scope.querySelector('[data-art-story-phase]');
    const range = scope.querySelector('[data-art-story-progress]');
    const pause = scope.querySelector('[data-art-story-pause]');
    const available = state.ready && state.storyDuration > 0 && !state.failed;
    const enabled = permitted() && available;
    const time = storyTime(state);
    let phase = state.storyPhases?.[0]?.label || state.item?.title || 'THE LIVING STORY';
    for (const item of state.storyPhases || []) if (time >= item.at) phase = item.label;
    if (!permitted()) phase = 'STATIC ARTWORK';
    if (state.failed) phase = 'ORIGINAL ARTWORK';
    if (label && label.textContent !== phase) label.textContent = phase;
    if (range) {
      range.disabled = !enabled;
      range.value = state.storyDuration ? String(time / state.storyDuration * 100) : '0';
      range.setAttribute('aria-valuetext', `${phase} · ${time.toFixed(1)} of ${state.storyDuration || 0} seconds`);
    }
    if (pause) {
      pause.disabled = !enabled;
      const text = state.localPaused ? 'PLAY STORY ▷' : 'PAUSE STORY Ⅱ';
      if (pause.textContent !== text) pause.textContent = text;
      pause.setAttribute('aria-pressed', String(state.localPaused));
      pause.setAttribute('aria-label', `${state.localPaused ? 'Play' : 'Pause'} ${state.item?.title || 'artwork'} animation`);
    }
    state.host.dataset.artStoryPaused = String(state.localPaused);
  }

  function render(state, delta = 0) {
    const age = state.elapsed;
    const sceneTime = storyTime(state);
    const time = state.storyDuration ? sceneTime : age;
    const introTime = state.storyDuration ? sceneTime : age - state.introStart;
    const follow = 1 - Math.exp(-delta * 12);
    state.gazeX += (state.targetX - state.gazeX) * follow;
    state.gazeY += (state.targetY - state.gazeY) * follow;
    state.host.style.setProperty('--art-x', state.gazeX.toFixed(3));
    state.host.style.setProperty('--art-y', state.gazeY.toFixed(3));
    const burst = (age - state.burstStart) / .8, bursting = burst >= 0 && burst < 1;
    const shine = (age - state.shineStart) / .65;
    let eyeOpen = 1;
    for (const node of state.nodes) {
      const type = node.dataset.am;
      const cx = number(node, 'cx', state.item.width / 2), cy = number(node, 'cy', state.item.height / 2);
      const period = Math.max(.1, number(node, 'period', 6));
      const phase = number(node, 'phase', 0), q = time / period * Math.PI * 2 + phase;
      switch (type) {
        case 'story': {
          const tracks = state.storyTracks.get(node), smooth = node.dataset.ease === 'smooth';
          const value = (key, fallback) => sample(tracks[key], sceneTime, fallback, smooth);
          if (tracks.opacity) opacity(node, value('opacity', 1));
          if (tracks.x || tracks.y || tracks.scale || tracks.rotate) transform(node, `translate(${value('x', 0).toFixed(4)} ${value('y', 0).toFixed(4)}) translate(${cx} ${cy}) rotate(${value('rotate', 0).toFixed(4)}) scale(${value('scale', 1).toFixed(5)}) translate(${-cx} ${-cy})`);
          if (tracks.dash) node.style.strokeDashoffset = String(value('dash', 0));
          if (tracks.r) node.setAttribute('r', String(Math.max(0, value('r', 0))));
          break;
        }
        case 'pendulum': transform(node, `rotate(${(number(node, 'offset', 0) + number(node, 'amp', 23) * Math.sin(sceneTime / period * Math.PI * 2 + phase)).toFixed(4)} ${cx} ${cy})`); break;
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
    const stamp = Math.floor(age * 5);
    if (stamp !== state.stamp) {
      state.stamp = stamp;
      state.svg.dataset.elapsed = age.toFixed(3);
      state.svg.dataset.storyTime = sceneTime.toFixed(3);
      state.svg.dataset.storyDuration = String(state.storyDuration || 0);
      state.svg.dataset.open = eyeOpen.toFixed(3);
      state.svg.dataset.burst = bursting ? burst.toFixed(3) : 'off';
      state.svg.dataset.shine = shine >= 0 && shine <= 1 ? shine.toFixed(3) : 'auto';
      showState(state);
      storyControls(state);
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
      state.storyElapsed += delta;
      state.storySeekEnd = false;
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
      storyControls(state);
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
      const duration = Number(item.story?.duration || svg.dataset.storyDuration || 0);
      if (!Number.isFinite(duration) || duration < 0) throw new Error('Artwork story duration invalid');
      state.storyDuration = duration;
      state.storyPhases = Array.isArray(item.story?.phases) ? item.story.phases.filter(phase => Number.isFinite(phase.at) && phase.at >= 0 && phase.at <= duration && typeof phase.label === 'string').sort((a, b) => a.at - b.at) : [];
      state.storyTracks = new Map(state.nodes.filter(node => node.dataset.am === 'story').map(node => [node, authoredTracks(node)]));
      if (state.storyTracks.size && !duration) throw new Error('Artwork story duration missing');
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
    if (!permitted() || !state.ready || state.localPaused) return;
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
    state.localPaused = false;
    state.storyElapsed = 0;
    state.storySeekEnd = false;
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
    const state = { host, stage, interaction, id: host.dataset.artScene, visible: !observer, ready: false, loading: false, failed: false, elapsed: 0, storyElapsed: 0, storyDuration: 0, storyPhases: [], storyTracks: new Map(), storySeekEnd: false, localPaused: false, introStart: 0, shineStart: -10, burstStart: -10, lastTime: null, stamp: -1, targetX: 0, targetY: 0, gazeX: 0, gazeY: 0, hover: false, focus: false, listeners: [] };
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

  const controlState = control => states.get(control?.closest('.art-motion-scope')?.querySelector(selector));
  document.addEventListener('click', event => {
    const replayButton = event.target.closest?.('[data-art-replay]');
    if (replayButton) {
      const state = controlState(replayButton);
      if (state) replay(state);
      return;
    }
    const pause = event.target.closest?.('[data-art-story-pause]');
    const state = controlState(pause);
    if (!pause || !state?.ready || !state.storyDuration || !permitted()) return;
    state.localPaused = !state.localPaused;
    state.lastTime = null;
    if (!state.localPaused) state.storySeekEnd = false;
    state.stamp = -1;
    render(state);
    synchronize();
  });
  document.addEventListener('input', event => {
    const range = event.target.closest?.('[data-art-story-progress]');
    const state = controlState(range);
    if (!range || !state?.ready || !state.storyDuration || !permitted()) return;
    const value = Number(range.value);
    if (!Number.isFinite(value)) return;
    state.localPaused = true;
    state.storyElapsed = clamp(value / 100) * state.storyDuration;
    state.storySeekEnd = value >= 100;
    state.lastTime = null;
    state.stamp = -1;
    render(state);
    synchronize();
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
