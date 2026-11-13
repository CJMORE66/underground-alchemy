/* Transparent engraved plates for the scroll-driven alchemical prologue. */
const SVG = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
let instance = 0;

const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const smooth = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const round = value => Math.round(value * 100) / 100;
const point = (x, y) => `${round(x)} ${round(y)}`;
const center = [1050, 251];

// The neck travels clockwise until the jaws meet the tapered tail.
function spine(t) {
  const angle = (-78 + 342 * t) * Math.PI / 180;
  const x = center[0] + 209 * Math.cos(angle);
  const y = center[1] + 200 * Math.sin(angle);
  const dx = -209 * Math.sin(angle);
  const dy = 200 * Math.cos(angle);
  const length = Math.hypot(dx, dy);
  const radius = 2 + 27 * smooth(0, .24, t) - 8 * smooth(.7, 1, t);
  return { x, y, dx: dx / length, dy: dy / length, radius };
}

function bodyPoint(t, side) {
  const { x, y, dx, dy, radius } = spine(t);
  return point(x + dy * radius * side, y - dx * radius * side);
}

const steps = Array.from({ length: 121 }, (_, index) => index / 120);
const along = (samples, side) => samples.map((t, index) => `${index ? 'L' : 'M'}${bodyPoint(t, side)}`).join('');
const body = `${along(steps, 1)}${along(steps.slice().reverse(), -1).replace('M', 'L')}Z`;
const core = along(steps, 0);
const corePoints = steps.map(spine);
const distances = [0];
for (let index = 1; index < corePoints.length; index++) {
  const a = corePoints[index - 1];
  const b = corePoints[index];
  distances.push(distances.at(-1) + Math.hypot(b.x - a.x, b.y - a.y));
}
const coreLength = distances.at(-1);

function distanceAt(t) {
  const step = t * (steps.length - 1);
  const index = Math.min(steps.length - 2, Math.floor(step));
  return distances[index] + (step - index) * (distances[index + 1] - distances[index]);
}

const traceLengths = {
  'triangle': 352 + 2 * Math.hypot(176, 305),
  'triangle-glow': 352 + 2 * Math.hypot(176, 305),
  'triangle-inset': 322 + 2 * Math.hypot(161, 279),
  'key': 430,
  'wires': 481,
  'coil': coreLength
};
const belly = along(steps, -.76);
const dorsal = along(steps, .86);

function scales(id) {
  const shapes = [];
  for (let row = -2; row <= 2; row++) {
    for (let index = 1; index < 82; index++) {
      const t = (index + (row % 2 ? .5 : 0)) / 82;
      const { x, y, dx, dy, radius } = spine(t);
      const side = row * .34;
      const translate = point(x + dy * radius * side, y - dx * radius * side);
      const angle = round(Math.atan2(dy, dx) * 180 / Math.PI);
      const width = round(7.8 * (.43 + .57 * radius / 29));
      const height = round(radius * .215);
      const fill = Math.abs(row) === 2 ? 'dark-scale' : 'scale';
      shapes.push(`<path transform="translate(${translate}) rotate(${angle}) scale(${width} ${height})" d="M-1.08 0Q-.54-.98 .22-1.02Q.88-.76 1.16 0Q.88.76 .22 1.02Q-.54.98-1.08 0Z" fill="url(#${id}-${fill})" stroke="#30200d" stroke-width=".12"/>`);
    }
  }
  return shapes.join('');
}

function circularTicks(x, y, radius, length, count, className) {
  return `<g class="${className}">${Array.from({ length: count }, (_, index) => {
    const angle = index * TAU / count;
    const tick = index % 4 === 0 ? length * 1.6 : length;
    return `<path d="M${point(x + radius * Math.cos(angle), y + radius * Math.sin(angle))}L${point(x + (radius + tick) * Math.cos(angle), y + (radius + tick) * Math.sin(angle))}"/>`;
  }).join('')}</g>`;
}

function corona(id) {
  return Array.from({ length: 14 }, (_, index) => {
    const length = index % 2 ? -63 : -72;
    return `<path transform="rotate(${index * 360 / 14})" d="M-10-31Q-13-46 0${length}Q2-51 10-31L0-37Z" fill="url(#${id}-gold)" stroke="#60340b" stroke-width="1.5"/>`;
  }).join('');
}

const sparkSeeds = Array.from({ length: 36 }, (_, index) => {
  const shift = (index * 137.508) % 360;
  const x = 654 + (index * 233 % 773);
  const y = 61 + (index * 113 % 620);
  return { x, y, shift, size: index % 5 === 0 ? 3.1 : 1.2 + (index % 4) * .34 };
});

function star(x, y, radius) {
  const r = radius;
  return `<path d="M${point(x, y - r)}l${point(r * .15, r * .85)} ${point(r * .85, r * .15)} ${point(-r * .85, r * .15)} ${point(-r * .15, r * .85)} ${point(-r * .15, -r * .85)} ${point(-r * .85, -r * .15)} ${point(r * .85, -r * .15)}Z"/>`;
}

function artwork(id) {
  return `
    <defs>
      <linearGradient id="${id}-gold" x1=".12" y1="0" x2=".83" y2="1">
        <stop stop-color="#fff9c1"/><stop offset=".24" stop-color="#ffe56b"/>
        <stop offset=".58" stop-color="#ffc12d"/><stop offset=".84" stop-color="#d47c10"/><stop offset="1" stop-color="#71330a"/>
      </linearGradient>
      <linearGradient id="${id}-serpent" gradientUnits="userSpaceOnUse" x1="880" y1="45" x2="1160" y2="490">
        <stop stop-color="#fff3a0"/><stop offset=".3" stop-color="#e9a72b"/>
        <stop offset=".63" stop-color="#aa5312"/><stop offset=".84" stop-color="#e8a62e"/><stop offset="1" stop-color="#71310e"/>
      </linearGradient>
      <linearGradient id="${id}-scale" x1=".15" x2=".8" y1="0" y2="1">
        <stop stop-color="#fff2aa"/><stop offset=".23" stop-color="#ffdc66"/>
        <stop offset=".58" stop-color="#d99928"/><stop offset=".92" stop-color="#855017"/><stop offset="1" stop-color="#462710"/>
      </linearGradient>
      <linearGradient id="${id}-dark-scale" x1="0" x2=".85" y1="0" y2="1">
        <stop stop-color="#cf9d43"/><stop offset=".35" stop-color="#aa6b1d"/>
        <stop offset="1" stop-color="#45250e"/>
      </linearGradient>
      <radialGradient id="${id}-aura">
        <stop stop-color="#ffc138" stop-opacity=".39"/><stop offset=".38" stop-color="#ed8a14" stop-opacity=".15"/>
        <stop offset="1" stop-color="#e5610c" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}-flash">
        <stop stop-color="#fff5ba" stop-opacity=".66"/><stop offset=".2" stop-color="#ffd757" stop-opacity=".27"/>
        <stop offset="1" stop-color="#ffd757" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}-seals">
        <stop stop-color="#2d160a" stop-opacity=".94"/><stop offset=".88" stop-color="#120b05" stop-opacity=".99"/>
        <stop offset="1" stop-color="#55320d"/>
      </radialGradient>
      <mask id="${id}-coil" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024">
        <path data-etch="coil" d="${core}" fill="none" stroke="#fff" stroke-width="70" stroke-dasharray="0 ${round(coreLength)}"/>
      </mask>
      <mask id="${id}-throne" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024">
        <rect width="1536" height="1024" fill="#fff"/>
        <path d="M1046 287C1035 314 981 323 952 352Q936 373 935 408v24h-83v24l-8 41H760v154h565V496h-83l-8-41v-23h-89v-28q-1-43-31-70c-22-18-52-23-68-47Z" fill="#000"/>
      </mask>
    </defs>

    <g mask="url(#${id}-throne)">
    <g data-layer="symbols" opacity="0" transform="translate(6 -54)">
      <ellipse cx="1040" cy="322" rx="325" ry="325" fill="url(#${id}-aura)"/>
      <g data-layer="rings" fill="none" stroke="#ffc941" opacity=".58">
        <circle cx="1040" cy="323" r="192" stroke-width="1.7"/>
        <circle cx="1040" cy="323" r="181" stroke-width="1.3" stroke-dasharray="1 6"/>
        <circle cx="1040" cy="323" r="159" stroke-width="2.1" stroke-opacity=".8"/>
        <circle cx="1040" cy="323" r="126" stroke-width=".8" stroke-dasharray="2 6"/>
        ${circularTicks(1040, 323, 176, 6, 64, 'prologue-ring-ticks')}
        <path d="M848 323h384M1040 131v384M905 188l270 270m0-270L905 458" stroke-width=".82" stroke-opacity=".67"/>
        <path d="M1040 156l145 84v167l-145 84-145-84V240Z" stroke-width="1.15" stroke-opacity=".65"/>
        <path d="M1040 134v23m0 332v23M852 323h22m332 0h22" stroke-width="2.4"/>
        <circle cx="1040" cy="323" r="76" stroke-width="1.3" stroke-opacity=".72"/>
        <circle cx="1040" cy="323" r="48" stroke-width="1" stroke-opacity=".8"/>
        ${Array.from({ length: 12 }, (_, index) => `<path transform="rotate(${30 * index} 1040 323)" d="M1040 210v66" stroke-width=".95" stroke-opacity=".5"/>`).join('')}
      </g>
      <g fill="none" stroke-linejoin="round">
        <path data-etch="triangle-glow" d="M1040 143 1216 448H864Z" stroke="#ffa917" stroke-opacity=".28" stroke-width="15"/>
        <path data-etch="triangle" d="M1040 143 1216 448H864Z" stroke="url(#${id}-gold)" stroke-width="5"/>
        <path data-etch="triangle-inset" d="M1040 162 1201 441H879Z" stroke="#ffe795" stroke-width="1.6"/>
        <path data-etch="key" d="M1040 208v229m-55-97h110M1004 275h72m-29-35-7-8-7 8 7 8Z" stroke="#ecad2a" stroke-width="1.6" stroke-opacity=".8"/>
      </g>
      <g data-layer="triangle-tips" fill="#fff1b1" opacity="0">
        <circle cx="1040" cy="143" r="5"/><circle cx="864" cy="448" r="4"/><circle cx="1216" cy="448" r="4"/>
      </g>

      <g data-layer="sun" transform="translate(764 340) scale(1.43)" opacity="0">
        <g data-layer="sun-corona">${corona(id)}</g>
        <circle r="63" fill="none" stroke="#b9761b" stroke-width="1" stroke-dasharray="2 5"/>
        <circle r="51" fill="none" stroke="#ecad2f" stroke-width="1.7"/>
        <circle r="36" fill="url(#${id}-gold)" stroke="#41230b" stroke-width="3.2"/>
        <circle r="31" fill="none" stroke="#ffe17b" stroke-width="1.1" stroke-dasharray="1 3" opacity=".9"/>
        <path d="M-26-9q12-10 23-1m6 0q11-9 23 1m-48 3q8-5 16 0-8 6-16 0Zm28 0q8-5 16 0-8 6-16 0Z" fill="#6e410c" stroke="#502a09" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M0-8q-3 10-2 14 2 2 5 0m-11 8q8-2 16 0m-12 4q4 1 8 0" fill="none" stroke="#77470e" stroke-width="1.25" stroke-linecap="round"/>
        <circle cx="-14" cy="-6" r="2.15" fill="#211007"/><circle cx="14" cy="-6" r="2.15" fill="#211007"/>
      </g>

      <g data-layer="moon" transform="translate(1323 340) scale(1.54)" opacity="0">
        <circle r="62" fill="none" stroke="#a76119" stroke-width="1" stroke-dasharray="1 6"/>
        <circle r="50" fill="url(#${id}-seals)" stroke="#e0a436" stroke-width="2"/>
        <path d="M-13-43a46 46 0 1 1-9 86c22-3 37-19 38-43 0-20-9-34-29-43Z" fill="url(#${id}-gold)" stroke="#6e3d0b" stroke-width="2.4"/>
        <path d="M13-28q28 18 22 40-5 17-25 26M23-24l3 6m6 8 2 4m0 8-1 4m-4 8-3 5m-7 7-3 2" fill="none" stroke="#fff0a3" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M16-12q6-3 11 1m-8 6 4 5-4 3m0 6 6 1-5 3" fill="none" stroke="#75430b" stroke-width="1.2" stroke-linecap="round"/>
        <g fill="#ffe898">${star(-14, -11, 13)}${star(-31, 12, 4.5)}<circle cx="-24" cy="-23" r="1.8"/><circle cx="-5" cy="15" r="2"/></g>
      </g>

      <g data-layer="minor" fill="none" stroke="#d88b22" stroke-width="1.35" opacity="0">
        <path data-etch="wires" d="M648 314h49m127-1h45m345-2h56m118-1h74M701 236h31m605 161h73M795 391l46 60 26 1m342 0 48-21 35-52"/>
        <path d="M685 314l6-6 6 6-6 6ZM1423 311l6-6 6 6-6 6ZM702 236l4-4 4 4-4 4ZM1402 396l4-4 4 4-4 4Z" fill="#ffcd4e"/>
        <path d="M830 467v21m-9-10h18m-14-6 10 12m0-12-10 12M1252 475l11 6-11 6-11-6Zm0-11v34m-16-17h32" stroke="#ffcc56"/>
        <path d="M927 512q17 19 34 0m-17-11v22m-6-11h12M1114 514l16-8 16 8-16 8Zm16-15v30" stroke="#f1a22e"/>
        <path d="M739 223v15m-7-8h14M1364 417v15m-7-7h14M1233 200v16m-8-8h16M858 172v16m-8-8h16" stroke="#fbc143" stroke-opacity=".75"/>
      </g>
      <g data-layer="core-light" opacity="0">
        <circle cx="1040" cy="323" r="106" fill="url(#${id}-flash)"/>
        <g fill="#ffcf55" opacity=".72">${star(1040, 323, 38)}</g>
        <g fill="#fff3b6">${star(1040, 323, 15)}</g>
        <path d="M1005 288l70 70m0-70-70 70" stroke="#ffdc76" stroke-width="1.4" opacity=".68"/>
        <circle cx="1040" cy="323" r="5" fill="#fff9d4"/>
      </g>
    </g>

    <g data-layer="serpent" opacity="0">
      <g mask="url(#${id}-coil)">
        <path d="${body}" fill="url(#${id}-serpent)" stroke="#080502" stroke-width="9" stroke-linejoin="round"/>
        <path d="${body}" fill="none" stroke="#cd8d24" stroke-width="3.1"/>
        ${scales(id)}
        <path d="${belly}" fill="none" stroke="#170d06" stroke-width="4.3" stroke-opacity=".86"/>
        <path d="${belly}" fill="none" stroke="#df991e" stroke-width="1.6"/>
        <path d="${dorsal}" fill="none" stroke="#fff1a0" stroke-width="2" stroke-opacity=".72"/>
      </g>
      <g data-layer="head">
        <path d="M-37-12C-31-31-9-34 12-31L37-32 62-24 71-17 73-6 59 2 44 4 29-1 20 7 38 17 58 14 65 20 53 26 31 33 11 29-11 18-30 17Z" fill="#160b05" stroke="#100905" stroke-width="9" stroke-linejoin="round"/>
        <path d="M-36-12C-29-29-8-35 12-30l25-2 24 8 11 10-1 8-15 8-17-2-12-5-12 4-16 8-17 7-13-2Z" fill="url(#${id}-gold)" stroke="#b26f20" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M-16-12-7-27 12-30l9 7-10 15-16 4Zm34-9 17-8 18 5 12 9-11 4-16-6-10 4Z" fill="#fff1a7" opacity=".77"/>
        <path d="M-28-11q15-9 29-5l-8 9-14 6m1-15L-8-29m-1 11 20-7 12 4m-2 6 11-11m15 13 8-8" fill="none" stroke="#6e3b0d" stroke-width="2" stroke-linecap="round"/>
        <path d="M-17 7 7-3 25-10 38-8 52-3 67-9l-7 8-14 5-14-3-15 4 5 9 17 8 18-5 7 2-14 8-22 5-17-5-16-13Z" fill="#280e07" stroke="#61300c" stroke-width="2.1" stroke-linejoin="round"/>
        <path d="M17 6 28 4 44 7l11-3-5 11-13 2-14-4Z" fill="#a72d19"/>
        <path d="m31 3 4 9 5-8m12 0 3 5 4-8M29 21l3-6 4 7" fill="#fff0b1" stroke="#9e6824" stroke-width=".7" stroke-linejoin="round"/>
        <g data-layer="jaw"><path d="M-22 10l15-3 13 7 14 11 15 4 20-6 8-3-1 5-13 8-24 4-22-8-11-10-14-2Z" fill="url(#${id}-gold)" stroke="#8f5213" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M1 18l17 12 14 3 21-7" fill="none" stroke="#fff0a0" stroke-width="1.4" stroke-linecap="round"/></g>
        <path d="M6-11q11-11 25-6-4 12-17 12Z" fill="#231006" stroke="#6c360b" stroke-width="2.3"/>
        <g data-layer="eye">
          <path d="M9-11q10-7 19-4-4 9-14 8Z" fill="#f0b238"/>
          <ellipse cx="19" cy="-12" rx="2.1" ry="4.5" fill="#230e05"/>
          <circle cx="17.8" cy="-13.5" r="1.05" fill="#fff4bd"/>
        </g>
        <path d="M57-14q4-3 9 1l-6 2Z" fill="#301406"/>
        <path d="M2-19q9-6 18-6m16 9 13 3m-78 0 10-11" fill="none" stroke="#fff2aa" stroke-width="1.9" stroke-linecap="round"/>
      </g>
      <g data-layer="bite-glint" opacity="0" fill="#ffe99b">${star(1097, 56, 21)}<circle cx="1097" cy="56" r="40" fill="url(#${id}-flash)"/></g>
    </g>
    </g>

    <g data-layer="embers" opacity="0">
      ${sparkSeeds.map(({ x, y, size }, index) => `<g data-ember="${index}">${index % 7 === 0 ? `<path d="M${point(x - 1, y + 9)}l6-18" stroke="#d84822" stroke-width="1.1" stroke-linecap="round"/>` : ''}<circle cx="${x}" cy="${y}" r="${size}" fill="${index % 4 === 0 ? '#e14a22' : '#ffd262'}"/></g>`).join('')}
    </g>`;
}

export function createPrologueArt(document) {
  const id = `prologue-art-${++instance}`;
  const parser = new document.defaultView.DOMParser();
  const source = parser.parseFromString(`<svg xmlns="${SVG}">${artwork(id)}</svg>`, 'image/svg+xml');
  const element = document.importNode(source.documentElement, true);
  element.setAttribute('viewBox', '0 0 1536 1024');
  element.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  element.setAttribute('aria-hidden', 'true');
  element.setAttribute('focusable', 'false');
  element.setAttribute('class', 'alchemy-prologue-art');

  const layer = name => element.querySelector(`[data-layer="${name}"]`);
  const etch = name => element.querySelector(`[data-etch="${name}"]`);
  const names = ['symbols', 'rings', 'triangle-tips', 'sun', 'sun-corona', 'moon', 'minor', 'core-light', 'serpent', 'head', 'jaw', 'eye', 'bite-glint', 'embers'];
  const layers = Object.fromEntries(names.map(name => [name, layer(name)]));
  const drawings = Object.fromEntries(['triangle-glow', 'triangle', 'triangle-inset', 'key', 'wires', 'coil'].map(name => [name, etch(name)]));
  const sparks = Array.from(element.querySelectorAll('[data-ember]'));
  const opacity = (target, value) => target.setAttribute('opacity', round(clamp(value)));
  const transform = (target, value) => target.setAttribute('transform', value);
  const reveal = (name, value) => {
    const length = traceLengths[name];
    const draw = name === 'coil' ? distanceAt(value) : clamp(value) * length;
    drawings[name].setAttribute('stroke-dasharray', `${round(draw)} ${round(length)}`);
  };

  function render({ symbols = 0, serpent = 0, light = 0, progress = 0 } = {}) {
    const glyphs = clamp(symbols);
    const snake = clamp(serpent);
    const scene = clamp(progress);
    const glow = clamp(light);
    opacity(layers.symbols, smooth(0, .13, glyphs));
    const triangle = smooth(.05, .72, glyphs);
    reveal('triangle', triangle);
    reveal('triangle-glow', triangle);
    reveal('triangle-inset', smooth(.11, .84, glyphs));
    reveal('key', smooth(.5, 1, glyphs));
    reveal('wires', smooth(.22, .93, glyphs));
    opacity(layers['triangle-tips'], smooth(.4, .84, glyphs));
    opacity(layers.rings, smooth(.02, .65, glyphs) * .67);
    opacity(layers.sun, smooth(.27, .75, glyphs));
    opacity(layers.moon, smooth(.36, .9, glyphs));
    opacity(layers.minor, smooth(.4, .96, glyphs) * .83);
    opacity(layers['core-light'], smooth(.55, .95, glyphs) * (.47 + glow * .38));
    transform(layers.rings, `rotate(${round((glyphs - 1) * 36 + scene * 9)} 1040 323)`);
    transform(layers['sun-corona'], `rotate(${round((glyphs - 1) * 62 + scene * 14)})`);

    opacity(layers.serpent, smooth(0, .065, snake));
    const coil = smooth(.01, .985, snake);
    reveal('coil', coil);
    const { x, y, dx, dy } = spine(coil);
    const angle = round(Math.atan2(dy, dx) * 180 / Math.PI);
    transform(layers.head, `translate(${point(x, y)}) rotate(${angle}) scale(${round(.77 + .23 * smooth(.13, .74, snake))})`);
    const close = smooth(.8, .97, snake);
    transform(layers.jaw, `rotate(${round(13 * (1 - close))} -21 8)`);
    opacity(layers.eye, .67 + .33 * glow);
    opacity(layers['bite-glint'], smooth(.88, .995, snake) * (.27 + glow * .61));

    opacity(layers.embers, .33 * smooth(.2, .76, glyphs) + .54 * glow);
    for (const [index, spark] of sparks.entries()) {
      const { shift } = sparkSeeds[index];
      const phase = scene * TAU * 1.6 + shift * Math.PI / 180;
      transform(spark, `translate(${point(Math.sin(phase) * 14, -(scene * 80 + 9 * Math.cos(phase)))})`);
      opacity(spark, .25 + .72 * (.5 + Math.sin(phase) * .5));
    }
  }

  render();
  return { element, render };
}
