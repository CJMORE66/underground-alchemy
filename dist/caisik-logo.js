/* CAISIK living signature: shared loader, isolated SVG IDs and one visible-scene clock. */
(() => {
  'use strict';
  const hosts = [...document.querySelectorAll('.caisik-logo')];
  if (!hosts.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let storedMotion;
  try { storedMotion = localStorage.getItem('atlas-motion'); } catch {}
  const clamp = value => Math.max(0, Math.min(1, value));
  const easeOut = value => 1 - (1 - clamp(value)) ** 3;
  const permitted = () => !reduced.matches && (document.documentElement.dataset.motion || storedMotion) !== 'off' && !document.body.classList.contains('simple-mode');
  const transform = (node, value) => node?.setAttribute('transform', value);
  const opacity = (node, value) => { if (node) node.style.opacity = String(value); };
  const states = new Map();
  let sharedSource, frame = 0, previousTime = null, pageHidden = false, serial = 0;

  function decodeArtwork() {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.decode ? image.decode().then(resolve, reject) : resolve();
      image.onerror = () => reject(new Error('Signature image unavailable'));
      image.src = '/assets/logo/caisik-signature.webp';
    });
  }

  function source() {
    if (!sharedSource) sharedSource = Promise.all([
      fetch('/assets/logo/caisik-signature.svg?v=1').then(response => {
        if (!response.ok) throw new Error('Signature scene unavailable');
        return response.text();
      }),
      decodeArtwork()
    ]).then(([svg]) => svg);
    return sharedSource;
  }

  function isolateSvg(text) {
    const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') throw new Error('Signature scene invalid');
    const svg = document.importNode(parsed.documentElement, true);
    const prefix = `caisik-signature-${++serial}-`;
    const ids = new Map();
    const elements = [svg, ...svg.querySelectorAll('*')];
    for (const element of elements) if (element.id) {
      ids.set(element.id, `${prefix}${element.id}`);
      element.id = `${prefix}${element.id}`;
    }
    for (const element of elements) for (const attribute of [...element.attributes]) {
      let value = attribute.value.replace(/url\(\s*(["']?)#([^\s)"']+)\1\s*\)/g, (match, quote, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
      if ((attribute.localName === 'href' || attribute.name === 'href') && value.startsWith('#') && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
      if (attribute.name === 'aria-labelledby' || attribute.name === 'aria-describedby') value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    return svg;
  }

  const active = state => state.ready && state.visible && permitted() && !document.hidden && !pageHidden;
  const interacting = state => state.hover || state.focus;

  function showState(state) {
    const value = state.failed ? 'static' : !permitted() ? 'paused' : !state.ready ? 'loading' : !state.visible || document.hidden || pageHidden ? 'paused' : state.elapsed - state.introStart < 1.1 ? 'intro' : interacting(state) || state.elapsed - state.burstStart < .8 ? 'awake' : 'idle';
    if (state.host.dataset.logoState !== value) state.host.dataset.logoState = value;
  }

  function render(state, delta = 0) {
    const time = state.elapsed;
    const introTime = time - state.introStart;
    const intro = clamp(introTime / 1.1);
    const follow = 1 - Math.exp(-delta * 12);
    state.gazeX += (state.targetX - state.gazeX) * follow;
    state.gazeY += (state.targetY - state.gazeY) * follow;
    state.hoverAmount += ((interacting(state) ? 1 : 0) - state.hoverAmount) * follow;
    state.host.style.setProperty('--logo-x', state.gazeX.toFixed(3));
    state.host.style.setProperty('--logo-y', state.gazeY.toFixed(3));

    state.nodes.letters.forEach((letter, index) => {
      const progress = easeOut((introTime - index * .045) / .66);
      const bob = Math.sin(time * 2.2 + index * .7) * state.hoverAmount * 2.5;
      const turn = Math.sin(time * 1.7 + index * .8) * state.hoverAmount * .1;
      const centerX = Number(letter.dataset.logoCx) || 300 + index * 270;
      const centerY = Number(letter.dataset.logoCy) || 380;
      const offset = Math.max(-4, Math.min(4, 4 * (1 - progress) + bob));
      transform(letter, `translate(0 ${offset.toFixed(3)}) rotate(${turn.toFixed(4)} ${centerX} ${centerY})`);
      opacity(letter, progress);
    });
    opacity(state.nodes.tagline, clamp((introTime - .62) / .38));
    for (const trace of state.nodes.traces) {
      trace.style.strokeDasharray = '100';
      trace.style.strokeDashoffset = String(100 * (1 - intro));
      opacity(trace, (1 - intro) * .95);
    }

    const blinkPhase = (Math.max(0, time - 1.1) + state.index * 1.17) % 8.3;
    const blink = intro >= 1 && blinkPhase > 7.94 && blinkPhase < 8.14 ? Math.sin((blinkPhase - 7.94) / .2 * Math.PI) : 0;
    const open = clamp((introTime - .63) / .22) * (1 - blink);
    transform(state.nodes.eye, `translate(676 377) scale(1 ${Math.max(.001, open).toFixed(4)}) translate(-676 -377)`);
    transform(state.nodes.iris, `translate(${(state.gazeX * 9).toFixed(3)} ${(state.gazeY * 4).toFixed(3)})`);
    opacity(state.nodes.lid, 1 - open);

    const shine = (time - state.shineStart) / .65;
    const shining = shine >= 0 && shine <= 1;
    transform(state.nodes.shine, `translate(${(-350 + clamp(shine) * 2700).toFixed(2)} 0) skewX(-18)`);
    opacity(state.nodes.shine, shining ? Math.sin(shine * Math.PI) * .65 : 0);
    transform(state.nodes.shadow, `translate(${(state.hoverAmount * 6).toFixed(3)} ${(state.hoverAmount * 6).toFixed(3)})`);
    opacity(state.nodes.shadow, state.hoverAmount * .65);

    const burst = (time - state.burstStart) / .8;
    const bursting = burst >= 0 && burst < 1;
    if (state.nodes.wave) {
      const radius = 12 + easeOut(burst) * 260;
      [...state.nodes.wave.children].forEach((circle, index) => circle.setAttribute('r', String(radius * (index ? .8 : 1))));
      opacity(state.nodes.wave, bursting ? (1 - burst) * .75 : 0);
    }
    state.nodes.sparks.forEach((spark, index) => {
      const angle = index / state.nodes.sparks.length * Math.PI * 2 + .17;
      const radius = 65 + easeOut(burst) * (165 + index % 3 * 20);
      const x = 676 + Math.cos(angle) * radius;
      const y = 373 + Math.sin(angle) * radius * .65;
      transform(spark, `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(angle * 180 / Math.PI + clamp(burst) * 70).toFixed(2)}) scale(${(1 - clamp(burst) * .65).toFixed(3)})`);
      opacity(spark, bursting ? Math.sin(burst * Math.PI) * .85 : 0);
    });

    const stamp = Math.floor(time * 5);
    if (stamp !== state.stamp) {
      state.stamp = stamp;
      state.svg.dataset.elapsed = time.toFixed(3);
      state.svg.dataset.open = open.toFixed(3);
      state.svg.dataset.shine = shining ? shine.toFixed(3) : 'off';
      state.svg.dataset.burst = bursting ? burst.toFixed(3) : 'off';
      showState(state);
    }
  }

  function tick(now) {
    frame = 0;
    const running = [...states.values()].filter(active);
    if (!running.length) { previousTime = null; return; }
    const delta = previousTime === null ? 0 : Math.max(0, Math.min((now - previousTime) / 1000, .1));
    previousTime = now;
    for (const state of running) {
      state.elapsed += delta;
      render(state, delta);
    }
    frame = requestAnimationFrame(tick);
  }

  function synchronize() {
    const allowed = permitted();
    for (const state of states.values()) {
      state.host.classList.toggle('logo-running', state.ready && allowed);
      if (!allowed) {
        state.host.style.setProperty('--logo-x', '0');
        state.host.style.setProperty('--logo-y', '0');
      }
      showState(state);
      if (allowed && state.visible && !state.ready && !state.loading && !state.failed) load(state);
    }
    document.querySelectorAll('[data-logo-replay]').forEach(button => { button.disabled = !allowed; });
    if ([...states.values()].some(active)) {
      if (!frame) { previousTime = null; frame = requestAnimationFrame(tick); }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
    }
  }

  async function load(state) {
    state.loading = true;
    try {
      const svg = isolateSvg(await source());
      const one = attribute => svg.querySelector(`[data-logo-${attribute}]`);
      state.nodes = {
        letters: [...svg.querySelectorAll('[data-logo-letter]')],
        tagline: one('tagline'), traces: [...svg.querySelectorAll('[data-logo-trace]')],
        shine: one('shine'), shadow: one('shadow'), eye: one('eye-content'), iris: one('iris'),
        lid: one('closed-lid'), wave: one('wave'), sparks: [...(one('sparks')?.children || [])]
      };
      if (state.nodes.letters.length !== 6 || !state.nodes.eye || !state.nodes.iris) throw new Error('Signature scene incomplete');
      state.svg = svg;
      state.introStart = state.elapsed;
      state.shineStart = state.elapsed + .24;
      state.stage.append(svg);
      render(state);
      state.ready = true;
      state.host.classList.add('logo-ready');
      if (state.pendingReplay) replay(state);
      synchronize();
    } catch (error) {
      state.failed = true;
      state.svg?.remove();
      state.host.classList.remove('logo-ready', 'logo-running');
      showState(state);
      console.warn('CAISIK signature: static artwork retained.');
    } finally { state.loading = false; }
  }

  function awaken(state, burst = false) {
    if (!permitted() || !state.ready) return;
    state.shineStart = state.elapsed;
    if (burst) state.burstStart = state.elapsed;
    showState(state);
    synchronize();
  }

  function replay(state) {
    if (!permitted()) return;
    if (!state.ready) { state.pendingReplay = true; if (!state.loading && !state.failed) load(state); return; }
    state.pendingReplay = false;
    state.introStart = state.elapsed;
    state.shineStart = state.elapsed + .24;
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

  hosts.forEach((host, index) => {
    const stage = host.querySelector('.caisik-logo-stage');
    if (!stage) return;
    const interaction = host.closest('a,button') || host;
    const state = {
      host, stage, interaction, index, ready: false, loading: false, failed: false,
      visible: !observer, elapsed: 0, introStart: 0, shineStart: -10, burstStart: -10,
      hover: false, focus: false, hoverAmount: 0, targetX: 0, targetY: 0, gazeX: 0, gazeY: 0, stamp: -1
    };
    states.set(host, state);
    interaction.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch' || !fine.matches || !permitted()) return;
      state.hover = true;
      awaken(state);
    });
    interaction.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !fine.matches || !permitted()) return;
      const box = host.getBoundingClientRect();
      if (!box.width || !box.height) return;
      state.targetX = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
      state.targetY = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    }, { passive: true });
    interaction.addEventListener('pointerleave', () => {
      state.hover = false;
      state.targetX = state.targetY = 0;
      showState(state);
    });
    interaction.addEventListener('focusin', () => { state.focus = true; awaken(state); });
    interaction.addEventListener('focusout', event => {
      if (!interaction.contains(event.relatedTarget)) {
        state.focus = false;
        state.targetX = state.targetY = 0;
        showState(state);
      }
    });
    interaction.addEventListener('click', () => awaken(state, true));
    if (!['A', 'BUTTON'].includes(interaction.tagName)) interaction.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        if (event.key === ' ') event.preventDefault();
        awaken(state, true);
      }
    });
    observer?.observe(host);
  });

  document.querySelectorAll('[data-logo-replay]').forEach(button => button.addEventListener('click', () => {
    const scope = button.closest('.logo-showcase');
    const host = scope?.querySelector('.caisik-logo') || hosts.find(element => element.hasAttribute('data-logo-interactive')) || hosts[0];
    const state = states.get(host);
    if (state) replay(state);
  }));
  document.addEventListener('visibilitychange', synchronize);
  reduced.addEventListener?.('change', synchronize);
  fine.addEventListener?.('change', () => {
    if (!fine.matches) for (const state of states.values()) {
      state.hover = false;
      state.targetX = state.targetY = 0;
    }
    synchronize();
  });
  new MutationObserver(synchronize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  new MutationObserver(synchronize).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', () => { pageHidden = true; synchronize(); });
  window.addEventListener('pageshow', () => { pageHidden = false; synchronize(); });
  synchronize();
})();
