const SVG = 'http://www.w3.org/2000/svg';
const statement = 'real culture and knowledge is for every';
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, p) => a + (b - a) * p;
const fmt = value => value.toFixed(2);
let serial = 0;

// Each path is sampled once. The same distance along it controls both the
// advancing ink and the physical position of the marker tip.
const lettering = [
  {
    letter: 'O', from: .18, to: .37,
    start: [169, 56],
    curves: [
      [[137, 41], [100, 76], [84, 115]],
      [[66, 155], [77, 199], [105, 202]],
      [[140, 208], [178, 162], [188, 108]],
      [[194, 79], [187, 61], [162, 54]],
    ],
  },
  {
    letter: 'N', from: .41, to: .61,
    start: [201, 203],
    curves: [
      [[217, 167], [228, 114], [236, 62]],
      [[244, 53], [257, 157], [268, 182]],
      [[281, 201], [296, 83], [318, 59]],
    ],
  },
  {
    letter: 'E', from: .65, to: .81,
    start: [422, 58],
    curves: [
      [[393, 55], [375, 64], [349, 67]],
      [[343, 108], [328, 160], [321, 200]],
      [[349, 190], [385, 187], [404, 190]],
    ],
  },
  {
    letter: 'E', from: .85, to: .91,
    start: [338, 133],
    curves: [
      [[361, 126], [383, 124], [404, 123]],
    ],
  },
];

function buildStroke({ letter, from, to, start, curves }) {
  const points = [start];
  let origin = start;
  for (const [b, c, end] of curves) {
    for (let i = 1; i <= 18; i++) {
      const t = i / 18;
      const u = 1 - t;
      points.push(origin.map((a, j) => u ** 3 * a + 3 * u ** 2 * t * b[j] + 3 * u * t ** 2 * c[j] + t ** 3 * end[j]));
    }
    origin = end;
  }
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    const [a, b] = points[i - 1];
    cumulative.push(cumulative[i - 1] + Math.hypot(x - a, y - b));
  }
  return {
    letter, from, to, start, end: points.at(-1), points, cumulative,
    path: points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`).join(' '),
  };
}
const strokes = lettering.map(buildStroke);

function pointOn({ points, cumulative }, fraction) {
  const distance = clamp(fraction) * cumulative.at(-1);
  const i = cumulative.findIndex((end, index) => index > 0 && distance <= end);
  if (i < 1) return points.at(-1);
  const part = (distance - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]);
  return points[i - 1].map((value, axis) => mix(value, points[i][axis], part));
}

function liftedTip(from, to, fraction) {
  const t = smooth(fraction);
  return [mix(from[0], to[0], t), mix(from[1], to[1], t) + Math.sin(Math.PI * t) * 18];
}

function markerAt(p) {
  let previous = [472, 317];
  let previousTime = .06;
  for (const stroke of strokes) {
    if (p < stroke.from) {
      return {
        tip: liftedTip(previous, stroke.start, (p - previousTime) / (stroke.from - previousTime)),
        contact: false,
      };
    }
    if (p <= stroke.to) {
      return { tip: pointOn(stroke, (p - stroke.from) / (stroke.to - stroke.from)), contact: true };
    }
    previous = stroke.end;
    previousTime = stroke.to;
  }
  return { tip: liftedTip(previous, [520, 314], (p - previousTime) / (1 - previousTime)), contact: false };
}

function markerArt() {
  return `
    <g transform="rotate(51)">
      <path d="M89 23Q110 22 135 9l54 17 40 20 61 27-19 49-95-28-53-37-43-6Z"
        fill="#1f1711" stroke="#0a0806" stroke-width="4" stroke-linejoin="round"/>
      <path d="M135 9l29 13-19 38-33-16zm29 13 25 4 40 20-14 20-29-11z"
        fill="#b77e29" stroke="#65431c" stroke-width="2.4"/>
      <path d="M152 49l29 16 39 21 46 14m-95-72 19 11 29 13"
        fill="none" stroke="#f5bb52" stroke-opacity=".5" stroke-width="3"/>
      <path d="M39 7q8-22 34-30 21-9 41 9 6 5 4 15l-6 17-25 16-30-8-17-11Z"
        fill="#39271b" stroke="#100c09" stroke-width="4" stroke-linejoin="round"/>
      <path d="M55-7q15-11 32-10l17 9 8 16-18 9-32-7Z" fill="#654524"/>
      <path d="M0 0l8-3 10 2-1 5-8 1Z" fill="#fff0be" stroke="#5d4024" stroke-width="1.4"/>
      <path d="M14-4l15-5 90 1 13 5v13l-11 6-91-2-16-8Z"
        fill="#2b2420" stroke="#0e0b09" stroke-width="2.3"/>
      <path d="M30-8l89 1 11 4v4L30 0l-9 3-6-3Z" fill="#c1a46c"/>
      <path d="M32 7l84 1 12-3m-90-8 45 1" fill="none" stroke="#a17c43" stroke-width="1.8"/>
      <path d="M27-7v20m85-20v21" stroke="#f5ce78" stroke-width="2"/>
      <path d="M63 17q-12-7-14-14-2-7 5-8 7-2 10 5l8 6 18 2 15-7q7-4 12 1 4 5-2 11l-15 11-20 5Z"
        fill="#614021" stroke="#1e130c" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M70 17l12 3 13-2m-42-17 7 4m41 8 8-6" fill="none" stroke="#b88743" stroke-width="2.3"/>
      <path d="M68-18q4 5 4 13l-4 7-7-2-4-8 3-8m17-7q6 5 6 12l-2 8-6 2-6-5 3-10m15-3q6 5 6 11l-2 5-6 2-6-4"
        fill="#694a2b" stroke="#20140e" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M60-14l6-1m10-4 4 4m7-5 4 5" stroke="#d09e58" stroke-width="1.65"/>
    </g>`;
}

export function createWriterGlass(document) {
  const id = `ua-writer-glass-ink-${++serial}`;
  const element = document.createElement('div');
  element.className = 'ua-writer-glass';
  element.dataset.writerGlass = '';
  element.hidden = true;
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', `${statement} ONE`);
  element.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
  const panel = document.createElement('div');
  panel.style.cssText = 'position:absolute;top:clamp(23px,8%,75px);left:50%;transform:translateX(-50%);width:min(90%,780px);text-align:center';
  panel.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('p');
  caption.className = 'ua-writer-glass-caption';
  caption.style.cssText = 'margin:0 auto;color:#fff3d4;font:680 clamp(19px,3vw,32px)/1.15 "Barlow Condensed",Arial,sans-serif;letter-spacing:.065em;text-wrap:balance;text-shadow:0 2px 5px #100b08,0 0 17px #100b08';
  caption.textContent = statement;
  const parser = new document.defaultView.DOMParser();
  const source = parser.parseFromString(`<svg xmlns="${SVG}" viewBox="0 0 500 260" width="100%" style="display:block;overflow:visible" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2=".21" y2="1">
        <stop stop-color="#fff8dc"/><stop offset=".6" stop-color="#ffe7a1"/><stop offset="1" stop-color="#ffd27b"/>
      </linearGradient>
    </defs>
    <g data-glass-lines="" fill="none" stroke-linecap="round" stroke-linejoin="round">
      ${strokes.map(stroke => `<g data-glass-letter="${stroke.letter}" opacity="0">
        <path d="${stroke.path}" pathLength="1" stroke="#171009" stroke-width="24" opacity=".6" stroke-dasharray="1 1" stroke-dashoffset="1"/>
        <path d="${stroke.path}" pathLength="1" stroke="url(#${id})" stroke-width="17" stroke-dasharray="1 1" stroke-dashoffset="1"/>
        <path d="${stroke.path}" pathLength="1" stroke="#fffbe9" stroke-width="3" opacity=".41" stroke-dasharray=".075 .06" stroke-dashoffset="1"/>
      </g>`).join('')}
    </g>
    <g data-glass-marker="" opacity="0">${markerArt()}</g>
  </svg>`, 'image/svg+xml');
  const svg = document.importNode(source.documentElement, true);
  const ink = [...svg.querySelectorAll('[data-glass-letter]')].map(group => ({
    group,
    edges: [...group.children].slice(0, 2),
    texture: group.lastElementChild,
  }));
  const marker = svg.querySelector('[data-glass-marker]');
  panel.append(caption, svg);
  element.append(panel);

  function render(p) {
    if (p < 0) {
      element.hidden = true;
      return;
    }
    const progress = clamp(p);
    element.hidden = false;
    const entrance = smooth(progress / .14);
    element.style.background = `radial-gradient(ellipse at 50% 29%, rgba(12,8,4,${fmt(.72 * entrance)}), transparent 68%)`;
    caption.style.opacity = fmt(entrance);
    for (const [index, stroke] of strokes.entries()) {
      const fraction = clamp((progress - stroke.from) / (stroke.to - stroke.from));
      const { group, edges, texture } = ink[index];
      group.setAttribute('opacity', fraction > 0 ? '1' : '0');
      for (const edge of edges) edge.setAttribute('stroke-dashoffset', (1 - fraction).toFixed(4));
      // A short dry streak catches in the middle of the final ink, below its tip.
      texture.setAttribute('stroke-dasharray', `${(fraction * .93).toFixed(4)} 1`);
      texture.setAttribute('stroke-dashoffset', '0');
    }
    const { tip, contact } = markerAt(progress);
    const lean = (tip[0] - 255) / 34 + (contact ? 0 : 4);
    marker.setAttribute('transform', `translate(${fmt(tip[0])} ${fmt(tip[1])}) rotate(${fmt(lean)})`);
    marker.setAttribute('data-marker-contact', contact ? 'down' : 'up');
    marker.setAttribute('opacity', fmt(smooth((progress - .05) / .14) * (1 - smooth((progress - .92) / .08))));
  }

  return { element, render };
}
