/* Original illustrated cutout rig. Motion is driven by the caller's clock. */
const SVG = 'http://www.w3.org/2000/svg';
let sequence = 0;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (from, to, value) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const round = value => Math.round(value * 100) / 100;

// One continuous marker gesture. The visible stroke and wrist use the same points.
const stroke = [
  [347, 220], [356, 201], [378, 141], [385, 134], [390, 146], [399, 216],
  [394, 222], [393, 193], [362, 187], [350, 194], [371, 191], [410, 179],
];
const distances = [0];
for (let i = 1; i < stroke.length; i++) {
  distances.push(distances[i - 1] + Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1]));
}
const strokeLength = distances.at(-1);
const strokePath = stroke.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.join(' ')}`).join(' ');

function inkPoint(progress) {
  const distance = progress * strokeLength;
  const end = distances.findIndex(value => value > distance);
  if (end < 0) return stroke.at(-1);
  const fraction = (distance - distances[end - 1]) / (distances[end] - distances[end - 1]);
  return [
    lerp(stroke[end - 1][0], stroke[end][0], fraction),
    lerp(stroke[end - 1][1], stroke[end][1], fraction),
  ];
}

function artwork(id) {
  return `
    <defs>
      <linearGradient id="${id}-gold" x2=".82" y2="1" gradientUnits="objectBoundingBox">
        <stop stop-color="#fff5ad"/><stop offset=".28" stop-color="#ffd634"/>
        <stop offset=".68" stop-color="#ed9d0e"/><stop offset="1" stop-color="#784500"/>
      </linearGradient>
      <linearGradient id="${id}-cloth" x2="1" y2="1">
        <stop stop-color="#353237"/><stop offset=".48" stop-color="#18171b"/><stop offset="1" stop-color="#07080a"/>
      </linearGradient>
      <radialGradient id="${id}-air">
        <stop stop-color="#4d2c11"/><stop offset=".57" stop-color="#21140d"/><stop offset="1" stop-color="#0b0a09"/>
      </radialGradient>
      <radialGradient id="${id}-pool">
        <stop stop-color="#ffd63a" stop-opacity=".4"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${id}-grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M28 0H0v28" fill="none" stroke="#a88032" stroke-opacity=".12"/>
      </pattern>

      <g id="${id}-hood" stroke-linejoin="round">
        <path d="M-45-53-41-74-28-92-4-108l20 10 22 17 12 26-4 40-16 22-22 7-34-10-21-25Z" fill="#08080a" stroke="#100d08" stroke-width="5"/>
        <path d="m-45-51 9-30 30-24 12 21-19 8-16 21-6 31 13 22-18-12Z" fill="url(#${id}-gold)"/>
        <path d="m-6-105 25 13 19 15 11 26-7 35-15 19-17 4 19-23 5-25-8-28-20-15Z" fill="#e7a30e"/>
        <path d="m-5-104 23 12 12 13-24-5Zm-30 42 11-25 19-12-7 19-12 9Zm75 7 6 11-7 27-12 18 6-27Z" fill="#fff098"/>
        <path d="M-30-51-16-75 5-81l20 12 9 23-4 22L14-2-9 2-25-12-35-33Z" fill="#080709" stroke="#976013" stroke-width="1.5"/>
        <path d="m-24-37 11-8 13 5 13-5 12 8-8 24L0 0l-20-12Z" fill="#222027"/>
        <path d="m-23-33 22 8 23-9-6 12-17 9-17-8Zm5 13 17 9 16-8-4 8L0-4l-12-8Z" fill="#343137"/>
        <path d="m-22-46 12 3 3 5-13-3Zm28 8 4-5 11-4-1 6Z" fill="#ffc52a"/>
        <path d="m-22-44 11 3m22 0 10-4" stroke="#fff1b2" stroke-width="1.1" opacity=".8"/>
        <path d="m-43-50 7-25 14-17m56 16 12 27-5 19m-67 22 13 8" fill="none" stroke="#ffe173" stroke-width="1.3"/>
        <path d="m-41-18 9 9-3 5-7-6m62 12 9-8-2 8-8 4Z" fill="#a72830"/>
      </g>

      <g id="${id}-body" stroke-linejoin="round">
        <path d="m-53-4 21-12 19-4 12 18 15-18 19 3 22 13-5 29-12 59 6 15-21 9-22-3-20 3-23-8 5-21-9-57Z" fill="url(#${id}-cloth)" stroke="#080709" stroke-width="5"/>
        <path d="m-51 0 23-12 15 9-15 11 2 20-11 24-10-25Zm103 0L29-12 13-3 25 8l-1 23 12 20 10-27Z" fill="url(#${id}-gold)"/>
        <path d="m-27-10 14 8 14 14-15-1-8 14-4-20Zm54 0L15-2 1 12l17 1 8 13 2-17Z" fill="#6e4310"/>
        <path d="m-26 37 12-9-4 18-15 17 13-8 3 17-17 17m57-46-11-12 1 19 15 17-15-7-6 18 17 10" fill="none" stroke="#545053" stroke-width="2"/>
        <path d="m-38 47 7-6-1 24-7 20m78-38-9-8 3 25 6 20M-40 94l16 5m63-5-16 5" fill="none" stroke="#d89416" stroke-width="2"/>
        <path d="m-25 73-3 14-9 3m61-15 4 12 8 3" fill="none" stroke="#ab302c" stroke-width="2.5"/>
        <path d="M0 32v60" fill="none" stroke="#d2a949" stroke-dasharray="2 2"/>
        <path d="M-19 0Q-17 31 0 45 19 29 20 1" fill="none" stroke="#fbc538" stroke-width="2.5"/>
        <path d="M-19 0Q-17 31 0 45 19 29 20 1" fill="none" stroke="#fff0a9" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 7"/>
        <g data-joint="pendant">
          <path d="M0 38 14 61h-28Z" fill="#131014" stroke="#ffcf4c" stroke-width="2"/>
          <circle cx="0" cy="54" r="4.3" fill="none" stroke="#ffdb73" stroke-width="1.1"/>
          <path d="M0 48v12m-5-5h10" fill="none" stroke="#ffdb73" stroke-width=".9"/>
        </g>
      </g>

      <g id="${id}-upper">
        <path d="M-13 1Q-11-10 1-10L14-3 16 15 11 47Q2 54-10 47l-8-28Z" fill="url(#${id}-cloth)" stroke="#070709" stroke-width="3.8"/>
        <path d="m-14 0 9-8 9 1-1 13-5 17 3 17-10 8-8-29Z" fill="url(#${id}-gold)"/>
        <path d="m-10 3 10-6-4 12-10 10Zm10 23 11-7-2 17-8 5Z" fill="#ffdb67" opacity=".76"/>
        <path d="m10 0 3 11-4 13 1 10-5 9" fill="none" stroke="#53504e" stroke-width="1.4"/>
      </g>
      <g id="${id}-fore">
        <path d="M-11 0 10-2 14 12l-4 26-2 7-16 1-5-9-2-20Z" fill="url(#${id}-cloth)" stroke="#08080a" stroke-width="3.5"/>
        <path d="M-10 4 2 1l-6 14 1 13-7 8-4-17Z" fill="url(#${id}-gold)"/>
        <path d="m-12 32 23 1-1 6-21 1Zm2 8 20-1-2 6-16 1Z" fill="#e5a92b"/>
        <path d="m-9 7 3-1-4 14 3 9m15-15-5 18" fill="none" stroke="#ffe180" stroke-opacity=".7" stroke-width="1.3"/>
      </g>
      <g id="${id}-hand">
        <path d="m-6 2-4-5-3-8 1-2 4 3 1-8 2-6 2 1v8l2-12 3-1 1 12 2-10 3 1v11l2-6 3 2-1 12-6 7Z" fill="#a46b42" stroke="#231410" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="m-6-15 2 7 4 2 6-2m1-10-1 7" fill="none" stroke="#efb78a" stroke-width="1.2" stroke-linecap="round"/>
      </g>
      <g id="${id}-marker">
        <path d="m-6-5 8-3 10 3 2 4-4 9-9 1-7-4Z" fill="#a46b42" stroke="#21110d" stroke-width="2"/>
        <path d="m1 0 18-3 6 1-5 4L2 5Z" fill="#f0c344" stroke="#140f0a" stroke-width="1.7"/>
        <path d="m18-3 7 1-6 4Z" fill="#ffed9b"/><path d="m4-5 4 2m-5 9 4-2" fill="none" stroke="#ebae76" stroke-width="1.2"/>
      </g>

      <g id="${id}-fold">
        <path d="M-5 1-28-10-52-4-92 10-113 28-110 49-87 59-49 53-13 33 15 20Z" fill="url(#${id}-cloth)" stroke="#08080a" stroke-width="5" stroke-linejoin="round"/>
        <path d="m-23-8-30 5-39 13-20 19 13 4 28-16 34 2 19-13Z" fill="url(#${id}-gold)"/>
        <path d="m-100 35 20-12 21-2-17 15 25-6 18-8-13 17-27 12-23-4Z" fill="#3a3538"/>
        <path d="m-108 34 20-8 18-9 25 3m-39 23 28-9 22-14" fill="none" stroke="#ffce4e" stroke-opacity=".75" stroke-width="1.7"/>
        <path d="m-91 47 12 4 14-3" fill="none" stroke="#852930" stroke-width="2"/>
      </g>
      <g id="${id}-trouser">
        <path d="M-12-8 13-8l14 22-2 49-12 31-21 4-10-21 4-28-8-29Z" fill="url(#${id}-cloth)" stroke="#08080a" stroke-width="4" stroke-linejoin="round"/>
        <path d="m-11-5-7 22 8 28-5 32 8 13 8-33-3-30 9-23Z" fill="url(#${id}-gold)"/>
        <path d="m15 17 3 19-12 19 13 3-9 27" fill="none" stroke="#575050" stroke-width="2"/>
        <path d="m-12 18 7 17m-5 27-3 12" fill="none" stroke="#fff0a0" stroke-width="1.4"/>
      </g>
      <g id="${id}-shoe" stroke-linejoin="round">
        <path d="m-11-12 17-3 14 7 10 10 13 7 3 11-6 6H-14l-7-6 3-20Z" fill="#18161a" stroke="#080709" stroke-width="4"/>
        <path d="m-10-11 12-2 11 4 9 8-9 4-5-10-13 3Zm32 12 14 8 5 8-12 1-11-10Z" fill="url(#${id}-gold)"/>
        <path d="m-12 17 21 3 33-3 1 6-8 2h-47l-5-4Z" fill="#ffca38"/>
        <path d="m-2-7 12 1m-9 3 13 1m-8 4 12 1M-12 21h7m10 2h11m8 0 9-1" fill="none" stroke="#fff09b" stroke-width="1.4" stroke-linecap="round"/>
      </g>
    </defs>

    <rect width="640" height="460" rx="6" fill="#0b0a09"/>
    <rect x="7" y="7" width="626" height="446" rx="2" fill="url(#${id}-air)"/>
    <rect x="7" y="7" width="626" height="446" fill="url(#${id}-grid)"/>
    <path d="M10 48V10h65m490 0h65v38M10 412v38h65m490 0h65v-38" fill="none" stroke="#9d6f32"/>
    <path d="M28 363h584m-569 24h554m-568 32h582M132 453l99-118m-20 118 48-118m63 118V335m105 118-54-118m135 118-99-118" fill="none" stroke="#f7bc42" stroke-opacity=".12"/>
    <path d="M24 132v-20h27m565 20v-20h-27M24 342v22h27m565-22v22h-27" fill="none" stroke="#ffd169" stroke-opacity=".52"/>
    <path d="M35 124h32m506 0h32M28 350h44m495 0h44" stroke="#e24837" stroke-opacity=".8"/>
    <path d="M42 136h14m526 0h14M42 338h14m526 0h14" stroke="#ffd169" stroke-opacity=".44"/>
    <path d="m86 311 50-46 38 12 35-26m236 26 34-25 41 20 31-25 35-3" fill="none" stroke="#e66436" stroke-opacity=".22"/>
    <ellipse data-layer="floor-pool" cx="320" cy="363" rx="225" ry="48" fill="url(#${id}-pool)"/>
    <ellipse data-layer="shadow" cx="320" cy="372" rx="118" ry="16" fill="#080709" opacity=".8"/>

    <g data-scene="breath" fill="none">
      <circle cx="320" cy="223" r="129" stroke="#d89839" stroke-opacity=".2"/>
      <circle data-layer="breath-ring" cx="320" cy="223" r="119" stroke="#f7bb4d" stroke-width="1.2" stroke-opacity=".55" stroke-dasharray="5 8"/>
      <path d="m320 81 141 142-141 142-141-142Z" stroke="#d99a3f" stroke-opacity=".32"/>
      <path d="M186 222h-19m286 0h20M319 81V62m1 311v19" stroke="#ffd36b" stroke-opacity=".73"/>
      <path d="M124 198h27v49h-27m392-49h-27v49h27" stroke="#eaa94e" stroke-opacity=".38"/>
      <circle cx="167" cy="223" r="3" fill="#eb493c"/>
      <circle cx="473" cy="223" r="3" fill="#eb493c"/>
    </g>

    <g data-scene="lettering">
      <path d="M323 103h166l30 32v143l-20 19H325Z" fill="#0b0a0c" stroke="#d19d4f" stroke-width="1.2"/>
      <path d="M330 111h153l27 27v135l-18 15H332Z" fill="#2d2220" stroke="#62482c"/>
      <path d="M339 122h139l23 23v120l-15 13H341Z" fill="url(#${id}-grid)"/>
      <path d="M342 153v-25h28m91 0h19l17 20v15M345 253v19h22m101 0h13l14-14v-9" fill="none" stroke="#a8743a" stroke-opacity=".65"/>
      <path d="m415 226 16-37 6 26 16-48m-9 80 13-37 12 19 17-35" fill="none" stroke="#eeb456" stroke-opacity=".2" stroke-width="1.4"/>
      <path d="${strokePath}" fill="none" stroke="#c48a32" stroke-opacity=".24" stroke-width="1.3" stroke-dasharray="3 4"/>
      <g data-layer="ink" fill="none" stroke-linejoin="round" stroke-linecap="round">
        <path d="${strokePath}" stroke="#a83c2b" stroke-width="12" transform="translate(1 2)"/>
        <path d="${strokePath}" stroke="#ffc040" stroke-width="8"/>
        <path d="${strokePath}" stroke="#fff5b1" stroke-width="1.8" transform="translate(0 -1.6)"/>
      </g>
      <path d="M331 296h183l-13 8H340Z" fill="#5c3e26"/>
      <path d="M479 296v83m-86-81-25 79m100 2h22m-132 0h24" fill="none" stroke="#79512b" stroke-width="4"/>
    </g>

    <g data-scene="rhythm">
      <path d="M152 152v-42h336v42m-336 43v50m336-50v50" fill="none" stroke="#c38e45" stroke-opacity=".36"/>
      <path d="M166 124h308m-308 10h308m-308 10h308" stroke="#d19845" stroke-opacity=".2"/>
      <path d="m167 185 28-12 8 10 19-23 10 14 17-25 13 16m125-5 14 19 13-24 17 15 13-10 28 23" fill="none" stroke="#d89343" stroke-opacity=".48"/>
    </g>

    <g data-joint="seated-legs">
      <g data-joint="left-knee"><use href="#${id}-fold"/></g>
      <g data-joint="right-knee"><use href="#${id}-fold"/></g>
      <g data-joint="left-foot"><use href="#${id}-shoe"/></g>
      <g data-joint="right-foot"><use href="#${id}-shoe"/></g>
    </g>
    <g data-joint="standing-legs">
      <g data-joint="back-leg">
        <use href="#${id}-trouser"/><use href="#${id}-shoe" transform="translate(0 91) scale(.89)"/>
      </g>
      <g data-joint="front-leg">
        <use href="#${id}-trouser"/><use href="#${id}-shoe" transform="translate(-3 89)"/>
      </g>
    </g>

    <g data-scene="drums">
      <g data-drum="left">
        <path d="M-43 0-30 68 0 75l30-7L43 0" fill="url(#${id}-cloth)" stroke="#8f5b2a" stroke-width="2"/>
        <path d="M-33 8-22 66m-8-52 12 55M34 8 22 66M10 15l-4 56m-5-57v56m-41-53 80 1" stroke="#c48b3c" stroke-opacity=".6" fill="none"/>
        <path d="M-31 69Q0 80 31 69l-2 8Q0 88-29 77Z" fill="#7b3b2c"/>
        <ellipse cx="0" cy="0" rx="44" ry="16" fill="#7f4024" stroke="#ffd16a" stroke-width="2.4"/>
        <ellipse cx="0" cy="-1" rx="37" ry="11" fill="#b6783c" stroke="#e9ad51" stroke-width="1.2"/>
        <ellipse data-pulse="left" cx="0" cy="-1" rx="35" ry="10" fill="none" stroke="#fff29c" stroke-width="2.4"/>
      </g>
      <g data-drum="right">
        <path d="M-39 0-27 62 0 69l27-7L39 0" fill="url(#${id}-cloth)" stroke="#8f5b2a" stroke-width="2"/>
        <path d="M-28 8-20 61m-8-46 12 48M29 8 20 61M8 13l-2 53m-5-53v52m-37-50 72 1" stroke="#c48b3c" stroke-opacity=".6" fill="none"/>
        <path d="M-28 62Q0 73 28 62l-2 8Q0 81-26 70Z" fill="#7b3b2c"/>
        <ellipse cx="0" cy="0" rx="40" ry="14" fill="#7f4024" stroke="#ffd16a" stroke-width="2.4"/>
        <ellipse cx="0" cy="-1" rx="34" ry="10" fill="#b6783c" stroke="#e9ad51" stroke-width="1.2"/>
        <ellipse data-pulse="right" cx="0" cy="-1" rx="32" ry="9" fill="none" stroke="#fff29c" stroke-width="2.4"/>
        <ellipse data-pulse="accent" cx="0" cy="-1" rx="45" ry="15" fill="none" stroke="#ffdd71" stroke-width="2.7" opacity="0"/>
      </g>
    </g>

    <g data-joint="torso">
      <use href="#${id}-body"/>
      <g data-joint="head"><use href="#${id}-hood"/></g>
    </g>
    <g data-joint="left-shoulder"><use href="#${id}-upper" transform="scale(-1 1)"/></g>
    <g data-joint="right-shoulder"><use href="#${id}-upper"/></g>
    <g data-joint="left-elbow"><use href="#${id}-fore" transform="scale(-1 1)"/></g>
    <g data-joint="right-elbow"><use href="#${id}-fore"/></g>
    <g data-joint="left-wrist"><use href="#${id}-hand" transform="scale(-1 1)"/></g>
    <g data-joint="right-wrist">
      <use data-layer="right-hand" href="#${id}-hand"/>
      <use data-layer="drawing-hand" href="#${id}-marker"/>
    </g>

    <g fill="none" stroke-width=".85">
      <path d="M22 22h86m424 0h86m-596 415h86m424 0h86" stroke="#ffcf6e" stroke-opacity=".4"/>
      <path d="M116 22h22m364 0h22M116 437h22m364 0h22" stroke="#e86149" stroke-opacity=".65"/>
    </g>`;
}

function translate(x, y) {
  return `translate(${round(x)} ${round(y)})`;
}

function bone(from, to, length) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const angle = Math.atan2(-dx, dy) * 180 / Math.PI;
  return `${translate(...from)} rotate(${round(angle)}) scale(1 ${round(Math.hypot(dx, dy) / length)})`;
}

// Two-bone inverse kinematics keep shoulder, elbow and wrist connected.
function joints(shoulder, wanted, bend) {
  const upper = 49;
  const fore = 44;
  const dx = wanted[0] - shoulder[0];
  const dy = wanted[1] - shoulder[1];
  const reach = Math.max(Math.hypot(dx, dy), .001);
  const distance = clamp(reach, Math.abs(upper - fore) + .1, upper + fore - .1);
  const ax = dx / reach;
  const ay = dy / reach;
  const run = (upper ** 2 - fore ** 2 + distance ** 2) / (2 * distance);
  const rise = Math.sqrt(Math.max(0, upper ** 2 - run ** 2)) * bend;
  return {
    elbow: [shoulder[0] + ax * run + ay * rise, shoulder[1] + ay * run - ax * rise],
    wrist: [shoulder[0] + ax * distance, shoulder[1] + ay * distance],
  };
}

function beat(phase, centers) {
  const time = centers.reduce((nearest, center) => {
    const delta = ((phase - center + 1.5) % 1) - .5;
    return Math.abs(delta) < Math.abs(nearest) ? delta : nearest;
  }, 1);
  const lift = ease(-.16, -.065, time) * (1 - ease(-.058, 0, time));
  const strike = ease(-.051, 0, time) * (1 - ease(0, .11, time));
  const echo = time < 0 ? 0 : 1 - ease(0, .15, time);
  return { lift, strike, echo };
}

export function createAlchemistRig(document) {
  const id = `caisik-actor-${++sequence}`;
  const parser = new document.defaultView.DOMParser();
  const source = parser.parseFromString(`<svg xmlns="${SVG}">${artwork(id)}</svg>`, 'image/svg+xml');
  const element = document.importNode(source.documentElement, true);
  element.setAttribute('viewBox', '0 0 640 460');
  element.setAttribute('aria-hidden', 'true');
  element.setAttribute('focusable', 'false');
  element.setAttribute('class', 'alchemist-performance-rig');

  const node = (group, name) => element.querySelector(`[data-${group}="${name}"]`);
  const scenes = Object.fromEntries(['breath', 'rhythm', 'drums', 'lettering'].map(name => [name, node('scene', name)]));
  const body = Object.fromEntries([
    'torso', 'head', 'pendant', 'seated-legs', 'standing-legs',
    'left-knee', 'right-knee', 'left-foot', 'right-foot', 'back-leg', 'front-leg',
  ].map(name => [name, node('joint', name)]));
  const arms = [-1, 1].map(side => {
    const name = side < 0 ? 'left' : 'right';
    return {
      side,
      shoulder: node('joint', `${name}-shoulder`),
      elbow: node('joint', `${name}-elbow`),
      wrist: node('joint', `${name}-wrist`),
      drum: node('drum', name),
      pulse: node('pulse', name),
    };
  });
  const ink = node('layer', 'ink');
  const accentRing = node('pulse', 'accent');
  const ring = node('layer', 'breath-ring');
  const pool = node('layer', 'floor-pool');
  const shadow = node('layer', 'shadow');
  const hand = node('layer', 'right-hand');
  const marker = node('layer', 'drawing-hand');
  let currentMode;

  const transform = (target, value) => target.setAttribute('transform', value);
  const show = (target, enabled) => target.setAttribute('display', enabled ? 'inline' : 'none');
  const alpha = (target, value) => target.setAttribute('opacity', round(clamp(value)));

  function render(mode, phase) {
    if (mode !== 'rhythm' && mode !== 'lettering') mode = 'breath';
    phase = clamp(Number.isFinite(phase) ? phase : 0);
    const breathing = mode === 'breath';
    const rhythm = mode === 'rhythm';
    const drawing = mode === 'lettering';
    if (mode !== currentMode) {
      currentMode = mode;
      element.setAttribute('data-actor-mode', mode);
      show(scenes.breath, breathing);
      show(scenes.rhythm, rhythm);
      show(scenes.drums, rhythm);
      show(scenes.lettering, drawing);
      show(body['seated-legs'], !drawing);
      show(body['standing-legs'], drawing);
      show(hand, !drawing);
      show(marker, drawing);
    }

    const gather = breathing ? ease(.03, .35, phase) * (1 - ease(.58, .97, phase)) : 0;
    const leftHit = rhythm ? beat(phase, [.17, .67]) : null;
    const rightHit = rhythm ? beat(phase, [.42, .92]) : null;
    const accent = rhythm ? 1 - ease(0, .12, Math.abs(phase - .92)) : 0;
    const progress = drawing ? clamp((phase - .10) / .71) : 0;
    const trace = drawing ? inkPoint(progress) : null;
    const reach = drawing ? ease(.01, .10, phase) * (1 - ease(.83, .97, phase)) : 0;
    const lean = rhythm
      ? (rightHit.strike - leftHit.strike) * 4 + rightHit.strike * accent * 3
      : drawing ? 5 + 5 * reach : 0;
    const x = drawing ? 263 : 320;
    const y = drawing ? 178 : rhythm ? 221 : 218;
    const torsoX = x + lean;
    const torsoY = y - gather * 5 + (rhythm ? (leftHit.strike + rightHit.strike) * 3 : 0);
    const chest = 1 + gather * .045;
    const hipY = y + 88;
    transform(body.torso, `${translate(torsoX, torsoY)} scale(1 ${round(chest)})`);
    transform(body.head, `${translate(drawing ? reach * 4 : 0, -1 - gather * 3)} rotate(${round(drawing ? -7 * reach : gather * 5 + lean * .55)})`);
    transform(body.pendant, `rotate(${round(lean * 1.15 + gather * 2)} 0 40)`);
    pool.setAttribute('cx', x);
    shadow.setAttribute('cx', x);
    shadow.setAttribute('cy', drawing ? 382 : 367);

    if (drawing) {
      transform(body['back-leg'], `${translate(x - 13, hipY + 6)} rotate(9)`);
      transform(body['front-leg'], `${translate(x + 21, hipY + 2)} rotate(-10)`);
      ink.setAttribute('stroke-dasharray', `${round(strokeLength * progress)} ${round(strokeLength)}`);
      alpha(ink, progress > 0 ? 1 - ease(.93, 1, phase) : 0);
    } else {
      transform(body['left-knee'], `${translate(x - 13, hipY)} rotate(${round(gather * 1.8)})`);
      transform(body['right-knee'], `${translate(x + 12, hipY + 3)} rotate(${round(-gather * 1.8)}) scale(-1 1)`);
      transform(body['left-foot'], `${translate(x - 26, hipY + 38)} rotate(${round(-6 + gather * 3)}) scale(.9)`);
      transform(body['right-foot'], `${translate(x + 28, hipY + 39)} rotate(${round(7 - gather * 3)}) scale(-.9 .9)`);
    }

    if (rhythm) {
      alpha(accentRing, rightHit.echo * accent);
      accentRing.setAttribute('rx', round(46 + (1 - rightHit.echo) * 19));
      accentRing.setAttribute('ry', round(16 + (1 - rightHit.echo) * 8));
    }

    if (breathing) {
      ring.setAttribute('r', round(116 + gather * 14));
      alpha(ring, .32 + gather * .65);
    }

    for (const arm of arms) {
      const { side } = arm;
      const shoulder = [torsoX + side * 51, torsoY + 1];
      let wanted = [x + side * lerp(102, 12, gather), y + lerp(76, 20, gather)];
      let angle = side * lerp(38, -8, gather);
      let bend = side;
      if (rhythm) {
        const hit = side < 0 ? leftHit : rightHit;
        const emphasis = side > 0 ? accent : 0;
        wanted = [x + side * (78 + hit.lift * 13), y + 64 - 36 * hit.lift + (17 + 4 * emphasis) * hit.strike];
        angle = side * (117 + (23 + 8 * emphasis) * hit.strike - 53 * hit.lift);
        const drumX = x + side * 82;
        const drumY = y + 99 + (side < 0 ? 0 : 3);
        transform(arm.drum, translate(drumX, drumY));
        alpha(arm.pulse, hit.echo);
        arm.pulse.setAttribute('rx', round(18 + (1 - hit.echo) * 21));
      } else if (drawing) {
        wanted = side < 0
          ? [x - 52, y + 84 - 6 * reach]
          : [lerp(x + 74, trace[0] - 24, reach), lerp(y + 53, trace[1] + 2, reach)];
        angle = side < 0 ? -132 : 0;
        bend = side < 0 ? side : -1;
      }
      const { elbow, wrist } = joints(shoulder, wanted, bend);
      transform(arm.shoulder, bone(shoulder, elbow, 49));
      transform(arm.elbow, bone(elbow, wrist, 44));
      transform(arm.wrist, `${translate(...wrist)} rotate(${round(angle)})`);
    }
  }

  render('breath', 0);
  return { element, render };
}
