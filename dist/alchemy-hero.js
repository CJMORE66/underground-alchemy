/* CAISIK living artwork. One source-coordinate scene; the original poster is its fallback. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const stage = hero?.querySelector('.alchemy-stage');
  const button = hero?.querySelector('.alchemy-awaken');
  const status = hero?.querySelector('.alchemy-status');
  if (!hero || !stage || !button) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const assets = ['/assets/alchemy-motion/hero-clean.webp', '/assets/alchemy-motion/sun.webp', '/assets/alchemy-motion/moon.webp'];
  const TAU = Math.PI * 2;
  let svg, nodes, loading, failed = false, ready = false;
  let frame = 0, previousTime = 0, elapsed = 0, visible = true, pageHidden = false;
  let latched = false, hovered = false, focused = false, dreamOverride = false;
  let openness = 0, gazeX = 0, gazeY = 0, targetX = 0, targetY = 0;
  let energy = .45, burstStarted = -10, particles = [];
  let previousState = '', phaseStamp = -1;

  const permitted = () => !reduced.matches && document.documentElement.dataset.motion !== 'off' && !document.body.classList.contains('simple-mode');
  const awake = () => latched || (!dreamOverride && (hovered || focused));
  const active = () => ready && permitted() && visible && !document.hidden && !pageHidden;
  const setTransform = (node, value) => node?.setAttribute('transform', value);

  function updateControls() {
    const allowed = permitted();
    button.disabled = !allowed || failed;
    button.setAttribute('aria-pressed', String(latched));
    button.textContent = !allowed ? 'ANIMATION PAUSED' : latched ? 'LET IT DREAM ↙' : 'AWAKEN THE ALCHEMIST ↗';
    button.setAttribute('aria-label', !allowed ? 'Animation paused' : latched ? 'Let the alchemist dream' : 'Awaken the alchemist');
    const state = !allowed ? 'paused' : awake() ? 'awake' : 'dreaming';
    if (state !== previousState) {
      previousState = state;
      hero.dataset.alchemyState = state;
      if (status) status.textContent = state === 'paused' ? 'Animation paused.' : state === 'awake' ? 'Artwork awake. Energy intensified. Move your pointer to guide its gaze.' : 'Artwork dreaming. The city keeps breathing.';
    }
  }

  function fitScene() {
    if (!svg) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    const mobile = window.innerWidth <= 760;
    const scale = mobile ? Math.max(width / 1536, height / 1024) : Math.min(width / 1536, height / 1024);
    const renderedWidth = 1536 * scale, renderedHeight = 1024 * scale;
    const left = mobile ? (width - renderedWidth) * .72 : width - renderedWidth + (window.innerWidth <= 1100 ? 80 : 0);
    const top = mobile ? (height - renderedHeight) * .5 : height - renderedHeight;
    Object.assign(svg.style, { width: `${renderedWidth}px`, height: `${renderedHeight}px`, left: `${left}px`, top: `${top}px` });
  }

  function render(delta = 0) {
    const phase = elapsed * TAU / 26;
    const easing = 1 - Math.exp(-delta * 9);
    openness += ((awake() ? 1 : 0) - openness) * easing;
    energy += ((awake() ? 1 : .45) - energy) * (1 - Math.exp(-delta * 2.4));
    gazeX += (targetX - gazeX) * easing;
    gazeY += (targetY - gazeY) * easing;
    for (const [node, angle] of [[nodes.sun, phase + Math.PI], [nodes.moon, phase]]) {
      const depth = .92 + Math.sin(angle) * .09;
      const x = 1065 + Math.cos(angle) * 300 + gazeX * 7 * depth, y = 290 + Math.sin(angle) * 150 + gazeY * 4 * depth;
      setTransform(node, `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${(Math.sin(angle) * 7).toFixed(3)}) scale(${depth.toFixed(4)})`);
    }
    setTransform(nodes.ring, `rotate(${(elapsed * 5).toFixed(3)} 1065 290)`);
    renderAtmosphere();
    // A short, deterministic blink every 6.9 seconds. No timers survive a paused scene.
    const blinkPhase = (elapsed + 1.7) % 6.9;
    const blink = blinkPhase < .18 ? Math.sin(Math.PI * blinkPhase / .18) : 0;
    const eyeVisibility = openness * (1 - blink);
    for (const node of nodes.lids) if (node) node.style.opacity = String(1 - eyeVisibility);
    for (const node of nodes.pupils) if (node) {
      node.style.opacity = String(eyeVisibility * .8);
      setTransform(node, `translate(${(gazeX * 3).toFixed(3)} ${(gazeY * 1.5).toFixed(3)})`);
    }
    if (nodes.water) {
      setTransform(nodes.water, `translate(${(Math.sin(elapsed * .7) * 8).toFixed(3)} 0)`);
      nodes.water.style.opacity = String(.3 + (Math.sin(elapsed * .85) + 1) * .17);
    }
    setTransform(nodes.vinyl, `rotate(${(elapsed * 20).toFixed(3)} 1370 525)`);
    const stamp = Math.floor(elapsed * 5);
    if (stamp !== phaseStamp) {
      phaseStamp = stamp;
      svg.dataset.phase = ((elapsed / 26) % 1).toFixed(4);
      svg.dataset.awake = openness.toFixed(3);
      svg.dataset.energy = energy.toFixed(3);
    }
  }

  function renderAtmosphere() {
    // Soft, stationary masks blend this interior cloth motion into the anchored silhouette.
    const breath = (Math.sin(elapsed * TAU / 5.6) + 1) * .5;
    const expansion = breath * (.009 + energy * .009);
    setTransform(nodes.breath, `translate(1020 ${(400 - breath * 1.5).toFixed(3)}) scale(${(1 + expansion).toFixed(5)} ${(1 + expansion * .65).toFixed(5)}) translate(-1020 -400)`);
    setTransform(nodes.haloOuter, `translate(${(gazeX * 3).toFixed(3)} ${(gazeY * 2).toFixed(3)}) rotate(${(elapsed * 8).toFixed(3)} 1050 280)`);
    setTransform(nodes.haloInner, `rotate(${(-elapsed * 13).toFixed(3)} 1050 280)`);
    const pulse = (Math.sin(elapsed * TAU / 3.8) + 1) * .5;
    if (nodes.pendant) {
      const scale = 1 + pulse * .1;
      setTransform(nodes.pendant, `translate(1025 385) scale(${scale.toFixed(4)}) translate(-1025 -385)`);
      nodes.pendant.style.opacity = String(.22 + pulse * .32 + energy * .28);
    }
    if (nodes.star) {
      const scale = .8 + pulse * .4;
      setTransform(nodes.star, `translate(1326 278) rotate(${(elapsed * 9).toFixed(3)}) scale(${scale.toFixed(4)}) translate(-1326 -278)`);
      nodes.star.style.opacity = String(.4 + pulse * .45);
    }
    for (const [node, direction] of [[nodes.energyBack, -1], [nodes.energyFront, 1]]) if (node) {
      node.style.strokeDashoffset = String(direction * elapsed * (9 + energy * 6));
      node.style.opacity = String(.48 + energy * .45);
      setTransform(node, `translate(${(Math.sin(elapsed * .8) * 2).toFixed(3)} ${(Math.cos(elapsed * .6) * 2).toFixed(3)})`);
    }
    if (nodes.ripples) {
      const scale = 1 + Math.sin(elapsed * 1.1) * .075;
      setTransform(nodes.ripples, `translate(1020 966) scale(${scale.toFixed(4)} 1) translate(-1020 -966)`);
      nodes.ripples.style.opacity = String(.22 + pulse * .2 + energy * .12);
    }
    for (let i = 0; i < particles.length; i++) {
      const life = (elapsed * (.07 + (i % 5) * .008) + i * .071) % 1;
      const x = 640 + (i * 97 % 830) + Math.sin(elapsed * .65 + i) * (12 + energy * 14);
      const y = 930 - life * (460 + (i % 4) * 95);
      const size = (.55 + (i % 3) * .2) * (1 + energy * .3);
      setTransform(particles[i], `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(elapsed * 18 + i * 23).toFixed(2)}) scale(${size.toFixed(3)})`);
      particles[i].style.opacity = String(Math.sin(life * Math.PI) * (.25 + energy * .55));
    }
    if (nodes.wave) {
      const age = (elapsed - burstStarted) / 1.8;
      nodes.wave.style.opacity = age >= 0 && age < 1 ? String((1 - age) * .75) : '0';
      nodes.wave.setAttribute('r', String(25 + Math.max(0, Math.min(1, age)) * 240));
    }
  }

  function prepareParticles() {
    if (!nodes.sparks) return;
    for (let i = 0; i < 22; i++) {
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      spark.setAttribute('d', i % 4 ? 'M0 -3 1 0 0 3-1 0Z' : 'M0 -5 1 0 5 1 1 2 0 6-1 2-5 1-1 0Z');
      spark.setAttribute('fill', i % 5 ? '#ffe25b' : '#ed2540');
      spark.setAttribute('stroke', 'none');
      nodes.sparks.append(spark);
      particles.push(spark);
    }
    svg.dataset.particles = String(particles.length);
    svg.dataset.mode = 'cinematic';
  }

  function tick(now) {
    frame = 0;
    if (!active()) { previousTime = 0; return; }
    const delta = previousTime ? Math.min((now - previousTime) / 1000, .1) : 0;
    previousTime = now;
    elapsed += delta;
    render(delta);
    frame = requestAnimationFrame(tick);
  }

  function synchronize() {
    updateControls();
    hero.classList.toggle('alchemy-running', ready && permitted());
    if (active()) {
      if (!frame) { previousTime = 0; frame = requestAnimationFrame(tick); }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
    // Reduced-motion visitors never need to download the animated layers.
    if (permitted() && !ready && !loading && !failed) loadScene();
  }

  function decodeAsset(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.decode ? image.decode().then(resolve, reject) : resolve();
      image.onerror = () => reject(new Error('Artwork layer unavailable'));
      image.src = src;
    });
  }

  async function loadScene() {
    loading = true;
    try {
      const [source] = await Promise.all([
        fetch('/alchemy-hero.svg?v=2').then(response => {
          if (!response.ok) throw new Error('Artwork scene unavailable');
          return response.text();
        }),
        ...assets.map(decodeAsset)
      ]);
      const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
      if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') throw new Error('Artwork scene invalid');
      svg = document.importNode(parsed.documentElement, true);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const byId = id => svg.querySelector(`#alchemy-${id}`);
      nodes = { sun: byId('sun'), moon: byId('moon'), ring: byId('orbit-ring'), water: byId('water'), vinyl: byId('vinyl'), lids: [byId('eyelid-left'), byId('eyelid-right')], pupils: [byId('pupil-left'), byId('pupil-right')] };
      Object.assign(nodes, { breath: byId('breath'), haloOuter: byId('halo-outer'), haloInner: byId('halo-inner'), pendant: byId('pendant'), star: byId('star'), energyBack: byId('energy-back'), energyFront: byId('energy-front'), sparks: byId('sparks'), ripples: byId('water-ripples'), wave: byId('shockwave') });
      if (!nodes.sun || !nodes.moon || nodes.lids.some(node => !node)) throw new Error('Artwork scene incomplete');
      prepareParticles();
      stage.append(svg);
      fitScene();
      render();
      ready = true;
      hero.classList.add('alchemy-ready');
      synchronize();
    } catch (error) {
      failed = true;
      svg?.remove();
      hero.classList.remove('alchemy-ready', 'alchemy-running');
      hero.querySelector('.alchemy-controls')?.setAttribute('hidden', '');
      if (status) status.textContent = '';
      // The original, approved image stays visible when a layer cannot load.
      console.warn('CAISIK artwork: static poster retained.');
    } finally {
      loading = false;
    }
  }

  hero.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch' || !fine.matches) return;
    hovered = true;
    dreamOverride = false;
    burstStarted = elapsed;
    updateControls();
  });
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType === 'touch' || !permitted()) return;
    const rect = hero.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    hovered = false;
    dreamOverride = false;
    targetX = targetY = 0;
    updateControls();
  });
  hero.addEventListener('focusin', () => { focused = true; updateControls(); });
  hero.addEventListener('focusout', event => {
    if (!hero.contains(event.relatedTarget)) { focused = false; dreamOverride = false; updateControls(); }
  });
  button.addEventListener('click', () => {
    latched = !latched;
    dreamOverride = !latched;
    if (latched) burstStarted = elapsed;
    updateControls();
  });

  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    synchronize();
  }, { threshold: 0 }).observe(hero);
  if ('ResizeObserver' in window) new ResizeObserver(fitScene).observe(stage);
  window.addEventListener('resize', fitScene, { passive: true });
  document.addEventListener('visibilitychange', synchronize);
  reduced.addEventListener?.('change', synchronize);
  fine.addEventListener?.('change', () => { if (!fine.matches) { hovered = false; targetX = targetY = 0; updateControls(); } });
  new MutationObserver(synchronize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  new MutationObserver(synchronize).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', () => { pageHidden = true; synchronize(); });
  window.addEventListener('pageshow', () => { pageHidden = false; fitScene(); synchronize(); });
  synchronize();
})();
