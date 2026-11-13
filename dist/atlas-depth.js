/* Decorative ink layers share the atlas motion controls. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motifs = {
    stone: {
      engraving: 'M35 181V84L112 40l77 44v97l-77 40Zm77-141v181M35 84l77 44 77-44M59 194v-73l30 17v73m45 0v-73l31-18v75M49 74l77-44 77 44v98M21 157v-39m0 53v13m177-71v51',
      trace: 'M24 195h47l19 18h77l31-31v-26h24',
      node: [198, 156],
    },
    sound: {
      engraving: 'M34 114a87 87 0 1 0 174 0 87 87 0 1 0-174 0Zm17 0a70 70 0 1 0 140 0 70 70 0 1 0-140 0Zm26 0a44 44 0 1 0 88 0 44 44 0 1 0-88 0ZM33 63l22-22m130 168 22-22M121 17v20m0 154v27',
      trace: 'M19 114h33l12-23 15 48 16-68 19 84 18-72 15 52 13-31 12 10h48',
      node: [208, 114],
    },
    signs: {
      engraving: 'M24 145 61 73l25 11-14 26 30-7-29 57-25 13 10-28Zm66 25 46-105 29 10-20 33 28-7-24 48-35 17 10-24Zm58-6 37-76 22 8-13 24 25-7-17 38-34 14 10-20ZM32 190l171-28M55 201l91-14m24-123 17-24m-9 31 30-11',
      trace: 'M18 176l35-16 14-19 35-12 23-32 22 1 22-25 31-6 20-24',
      node: [200, 67],
    },
    selfmade: {
      engraving: 'M120 15 222 72v95l-102 57-102-57V72Zm0 0v209M18 72l102 57 102-57M18 167l102-57 102 57M43 86v65l77 43 77-43V86M43 86l77-43 77 43-77 43ZM74 103v33l46 26 46-26v-33m-46-72v27M85 69l-10-17m79 16 10-17',
      trace: 'M28 181h28l29-26h30l18-32h42l19-27h24',
      node: [175, 123],
    },
    expeditions: {
      engraving: 'M31 69 90 41l59 26 60-28v132l-60 28-59-26-59 28Zm59-28v132m59-106v132M44 87l33-16m-33 34 33-16m25 24 31 14m32 17 30-14M49 176l23-11m94 12 29-14',
      trace: 'M48 153l21-25 23 11 29-45 32 11 27-33 22-9',
      node: [153, 105],
    },
  };

  const doorTypes = { '#hidden-city': 'stone', '#frequency': 'sound', '#living-wall': 'signs' };
  const placements = [...document.querySelectorAll('.layer-doors > a')]
    .map(link => [link, doorTypes[link.getAttribute('href')]])
    .filter(([, type]) => type);
  placements.push(
    [document.querySelector('.selfmade-entry'), 'selfmade'],
    [document.querySelector('.expeditions-entry-copy'), 'expeditions'],
  );

  const namespace = 'http://www.w3.org/2000/svg';
  function shape(tag, attributes) {
    const node = document.createElementNS(namespace, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }

  function placeInk(host, type) {
    const motif = motifs[type];
    host.classList.add('ua-depth-scene', `ua-depth-${type}`);
    const frame = document.createElement('span');
    frame.className = 'ua-depth-frame';
    frame.setAttribute('aria-hidden', 'true');
    const art = shape('svg', {
      class: 'ua-depth-art', viewBox: '0 0 240 240',
      'aria-hidden': 'true', focusable: 'false',
    });
    art.append(
      shape('path', { class: 'ua-depth-marks', d: 'M12 43V16h28m160 0h28v27M12 197v27h28m160 0h28v-27M12 120h12m192 0h12M120 16v10m0 188v10' }),
      shape('path', { class: 'ua-depth-engraving', d: motif.engraving }),
      shape('path', { class: 'ua-depth-trace', d: motif.trace, pathLength: '1' }),
      shape('circle', { class: 'ua-depth-pin', cx: motif.node[0], cy: motif.node[1], r: '3.4' }),
    );
    host.append(frame);
    (host.querySelector(':scope > .door-visual') || host).append(art);
  }

  const hosts = [];
  function readPause() {
    try {
      return localStorage.getItem('atlas-motion') === 'off';
    } catch {
      return false;
    }
  }

  let savedPause = readPause();
  const allowed = () => !document.hidden && !reduced.matches && !savedPause &&
    root.dataset.motion !== 'off' &&
    !['quiet', 'reduced', 'calm', 'off'].includes(root.dataset.selfmadeMotion) &&
    !document.body.classList.contains('simple-mode');

  let frame = 0;
  let target = null;
  let point = null;

  function clearPointer() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (target) {
      target.style.removeProperty('--ua-depth-x');
      target.style.removeProperty('--ua-depth-y');
      target.classList.remove('ua-depth-tracking');
    }
    target = null;
    point = null;
  }

  function followPointer(event) {
    if (!allowed() || !pointer.matches || event.pointerType === 'touch') return;
    if (target !== event.currentTarget) clearPointer();
    target = event.currentTarget;
    point = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!target || !allowed() || !pointer.matches) return;
      const bounds = target.getBoundingClientRect();
      const offset = (value, start, length) =>
        Math.max(-8, Math.min(8, 16 * ((value - start) / Math.max(length, 1) - 0.5)));
      target.style.setProperty('--ua-depth-x', `${offset(point.x, bounds.left, bounds.width)}px`);
      target.style.setProperty('--ua-depth-y', `${offset(point.y, bounds.top, bounds.height)}px`);
      target.classList.add('ua-depth-tracking');
    });
  }

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (allowed()) entry.target.classList.add('ua-depth-arriving');
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.18 })
    : null;

  for (const [host, type] of placements) {
    if (!host) continue;
    placeInk(host, type);
    hosts.push(host);
    observer?.observe(host);
    host.addEventListener('pointermove', followPointer, { passive: true });
    host.addEventListener('pointerleave', clearPointer);
    host.addEventListener('pointercancel', clearPointer);
  }

  function stopMotion() {
    clearPointer();
    for (const host of hosts) host.classList.remove('ua-depth-arriving');
  }

  function syncMotion() {
    savedPause = readPause();
    if (!allowed()) stopMotion();
    else if (!pointer.matches) clearPointer();
  }

  const preferences = new MutationObserver(syncMotion);
  preferences.observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-selfmade-motion'] });
  preferences.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  reduced.addEventListener('change', syncMotion);
  pointer.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('storage', event => {
    if (event.key === 'atlas-motion' || event.key === null) syncMotion();
  });
  window.addEventListener('pagehide', stopMotion);
})();
