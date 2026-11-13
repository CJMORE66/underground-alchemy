import { writerFinishDefs, writerLetterFinish, writerWordAccents } from './alchemy-writer-finish.js';

// All paths use the same rail-yard coordinates for SVG ink, nozzle aim and sound timing.
export const writerPhases = { fill: 0, flare: .46, outline: .59, reveal: .91 };
const clamp = t => Math.min(1,Math.max(0,t));
const mix = (a,b,t) => a+(b-a)*t;
const smooth = t => { const v=clamp(t); return v*v*(3-2*v); };
const n = v => Number(v.toFixed(2));
const carX = car => 132+354*car;
const pointText = points => points.map(([x,y])=>n(x)+' '+n(y)).join(' ');

// Outer cuts, counters and the hand's filling gesture are authored independently.
const glyphs = {
  I: [
    '-9,21 7,3 72,-8 92,2 76,21 54,24 39,77 57,72 66,82 49,103 -8,111 4,97 -4,91 11,79 16,57 27,34 7,36 -4,30 9,20',
    '-1,25 23,17 51,11 77,7|47,15 40,39 31,63 22,89|3,98 25,94 47,90 56,82',
  ],
  N: [
    '-10,102 4,82 15,27 0,31 11,8 39,-5 54,40 56,59 69,15 62,9 83,-7 100,-2 87,11 73,80 85,76 66,103 45,109 34,73 29,61 19,99 -3,110',
    '-1,102 13,85 20,56 28,20 31,9 43,43 56,85 60,98 66,68 74,38 83,5',
  ],
  K: [
    '-7,103 8,82 22,22 8,29 13,8 45,-6 51,4 38,47 66,17 69,9 98,-4 91,11 104,15 73,38 56,54 78,77 88,72 95,78 101,76 81,102 62,110 44,87 34,74 27,99 -6,113 2,102',
    '5,100 16,77 26,49 34,17 39,3|91,7 77,24 59,41 45,54 41,63 57,81 73,97 90,84',
  ],
  F: [
    '-7,20 7,1 73,-9 94,3 77,9 80,20 53,26 39,28 34,47 69,38 60,55 66,60 28,73 21,96 -7,111 0,92 -7,90 7,74 18,34 2,39 10,22',
    '1,24 25,17 54,12 81,4|34,19 28,41 20,67 10,91 4,102|21,63 42,55 61,49',
  ],
  L: [
    '-6,15 9,2 38,-6 47,0 34,23 20,79 47,68 61,63 75,67 99,56 86,75 90,82 67,96 35,97 -7,113 -2,94 -9,93 4,71 16,26 -2,33 4,15',
    '3,21 24,14 20,37 12,64 4,96 22,91 45,82 69,80 86,68',
  ],
  O: [
    '-7,83 1,53 18,12 46,-1 78,-7 91,5 89,20 101,13 89,40 79,75 65,96 36,108 4,107 9,99 -7,99 0,88|27,78 44,75 57,67 69,29 54,29 41,35 35,48',
    '8,92 12,69 21,42 31,22 55,13 76,11 79,21 73,46 64,75 50,90 27,98 8,92',
  ],
  W: [
    '-6,22 6,4 35,-7 29,16 21,66 36,50 47,21 43,17 69,9 59,67 72,48 79,13 73,9 94,-6 102,-1 93,23 83,61 66,97 47,107 35,83 19,103 -8,111 -1,97 -8,97 2,81 8,33 -6,35',
    '5,18 18,11 13,40 7,71 6,97 25,79 42,56 55,25 48,57 54,94 66,80 75,61 83,36 94,3',
  ],
  E: [
    '5,9 79,-5 96,-10 83,17 69,20 75,10 38,26 34,43 65,32 76,36 60,55 29,65 24,84 69,68 82,73 64,94 18,109 -7,109 1,88 7,58 -3,55 11,45 17,24 -1,30',
    '2,21 27,15 58,9 84,0|29,15 24,40 18,63 12,88 7,101 28,96 52,85 73,76|17,57 37,51 64,41',
  ],
  C: [
    '17,15 66,-7 82,-1 96,16 72,30 65,18 39,32 27,68 38,81 62,75 77,65 74,77 94,75 70,99 31,109 5,95 -6,76 4,35',
    '85,14 75,6 62,5 42,13 24,23 15,43 9,65 12,81 23,92 38,95 59,89 76,80',
  ],
  H: [
    '7,13 31,-5 47,5 38,18 32,47 54,43 65,12 59,3 85,-8 102,0 90,11 76,64 69,88 75,91 58,104 35,110 50,67 26,72 19,97 -4,112 0,88 9,65 -5,66 14,50 21,22 -2,31',
    '35,2 28,20 23,43 15,69 8,99|91,1 79,14 70,39 63,63 55,84 47,103|17,60 35,54 59,51 72,44',
  ],
  G: [
    '7,28 34,8 69,-7 85,2 100,17 80,34 65,19 39,33 26,65 29,80 46,86 60,77 63,65 44,69 51,48 96,37 102,44 87,56 76,88 56,105 27,109 5,97 -6,77',
    '86,19 73,6 53,12 34,22 20,34 10,56 6,76 15,91 31,99 50,95 66,83 75,63 85,49 66,56 54,59',
  ],
  D: [
    '3,9 60,-6 83,1 93,19 102,41 94,62 80,82 57,102 29,112 9,107 -7,108 2,92 13,46 -5,51 19,28 22,20 -2,30|44,25 57,20 66,23 72,39 65,58 48,76 32,83',
    '5,20 29,12 56,7 71,10 82,24 87,41 82,57 70,72 56,84 38,95 18,100 9,101|34,15 30,36 24,59 18,81 14,100',
  ],
};
const parse = s => s.split(' ').map(pair=>pair.split(',').map(Number));
function makeStroke(phase,car,points,weight=1) {
  const distances=[0];
  for(let i=1;i<points.length;i++) distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  return {phase,car,points,distances,length:distances.at(-1),weight};
}
function tipAt(stroke,t) {
  const d=clamp(t)*stroke.length, j=stroke.distances.findIndex(distance=>distance>=d);
  const i=Math.max(1,j < 0 ? stroke.points.length-1 : j);
  const q=clamp((d-stroke.distances[i-1])/(stroke.distances[i]-stroke.distances[i-1]||1));
  return stroke.points[i-1].map((v,k)=>mix(v,stroke.points[i][k],q));
}

// Four separate pieces. Offset the baseline so the letters lean into each
// other, then fit each composition to the carriage with space at the coupler.
const carStyles = [
  { word: 'INK', step: 70, width: 292, rise: [4, -8, 1], colors: ['#fff1b1', '#ffc43d', '#9b441c', '#59241b'] },
  { word: 'FLOW', step: 72, width: 302, rise: [5, 1, -5, -9], colors: ['#fff48c', '#f9b60c', '#bb641c', '#5d341b'] },
  { word: 'ECHO', step: 73, width: 301, rise: [-5, 3, -8, 0], colors: ['#ffe7ac', '#f4a43a', '#a54324', '#642621'] },
  { word: 'GOLD', step: 73, width: 299, rise: [3, -6, 0, -7], colors: ['#fff6b0', '#ffd629', '#bc6b20', '#603a1d'] },
];
const forms=[], fills=[], outlines=[], flares=[];
carStyles.forEach(({word, step, width, rise}, car) => {
  const letters = [...word].map((letter, index) => {
    const skew = ([x,y]) => [x + index*step - .115*(y-50), y + rise[index]];
    const [edge, gesture] = glyphs[letter];
    return {
      letter,
      contour: edge.split('|').map(path => parse(path).map(skew)),
      gesture: gesture.split('|').map(path => parse(path).map(skew)),
    };
  });
  const edges = letters.flatMap(({contour}) => contour[0].map(([x]) => x));
  const min = Math.min(...edges), max = Math.max(...edges);
  const center = carX(car) + 169;
  const project = ([x,y]) => [center + (x - (min+max)/2)*width/(max-min), 541 + y*1.41];
  for (const {letter, contour, gesture} of letters) {
    const outline = contour.map(points => points.map(project));
    const fill = gesture.map(points => makeStroke('fill', car, points.map(project)));
    const edge = outline.map(points => makeStroke('outline', car, [...points, points[0]]));
    fills.push(...fill);
    outlines.push(...edge);
    forms.push({ car, letter, id: forms.length, outline, fill, contour: edge });
  }
});

// A long arm sweep builds a flare's belly. Snapping in close to the panel leaves a needle tip.
for(let car=carStyles.length-1;car>=0;car--) {
  const points = Array.from({length:53},(_,i)=>{
    const t=i/52;
    return [carX(car)+321-306*t, 657+28*Math.sin(t*Math.PI*.95)+28*t-7*Math.sin(2*Math.PI*t)];
  });
  flares.push(makeStroke('flare',car,points));
}
const strokes=[...fills,...flares,...outlines];
strokes.forEach((stroke,id)=>stroke.id=id);
function assignTiming(list,start,end) {
  const weights=list.map(st=>Math.max(50,Math.sqrt(st.length)*10)*st.weight);
  const total=weights.reduce((a,b)=>a+b,0);
  let t=start;
  list.forEach((st,i)=>{
    st.start=t; t+=weights[i]/total*(end-start); st.end=t;
    st.inkStart=st.start+(st.end-st.start)*(st.phase==='flare'?.18:.12);
  });
  list.at(-1).end=end;
}
assignTiming(fills,0,.46);assignTiming(flares,.46,.59);assignTiming(outlines,.59,.91);
export const writerRefillAt = fills.find(stroke => stroke.car === 2).start;

export function sampleWriterAction(progress) {
  const p=clamp(progress), idx=strokes.findIndex(st=>p<st.end);
  const st=strokes[idx<0?strokes.length-1:idx], prev=strokes[Math.max(0,idx-1)];
  const travel=clamp((p-st.start)/(st.inkStart-st.start)), fraction=clamp((p-st.inkStart)/(st.end-st.inkStart));
  const phase=p>=writerPhases.reveal?'hold':st.phase;
  const local=travel<1 ? prev.points.at(-1).map((v,k)=>mix(idx===0?st.points[0][k]:v,st.points[0][k],smooth(travel))) : tipAt(st,fraction);
  const fan = sprayFan(phase, fraction);
  const paintColor = phase === 'outline' ? '#231419' : carStyles[st.car].colors[1];
  return {
    phase, spray: phase === 'hold' ? 0 : sprayPressure(fraction), fan,
    radius: sprayRadius(phase, fan), paintColor, contact: local,
    car: st.car, stroke: st.id, fraction,
  };
}

const sprayPressure = t => smooth(t/.05)*smooth((1-t)/.035);
function sprayFan(phase, t) {
  return phase === 'flare' ? clamp(flareWidth(t)/25) : phase === 'fill' ? .58 + .15*Math.sin(t*Math.PI) : .10;
}
function sprayRadius(phase, fan) {
  return phase === 'outline' ? 1.8 : phase === 'flare' ? 5 + 33*fan : 25 + 16*fan;
}

function flareWidth(t) {
  // Pushing the fat cap out, then flicking it back into the surface, changes the deposited width.
  return 1.15+23*(Math.sin(Math.PI*Math.min(1,t/.98))**.85)*((1-t)**.62);
}
function flareShape(st,t) {
  if(t<=.00001) return '';
  const count=Math.max(2,Math.ceil(t*42)), left=[], right=[];
  for(let i=0;i<=count;i++) {
    const u=t*i/count, [x,y]=tipAt(st,u), a=tipAt(st,u-.002), b=tipAt(st,u+.002);
    const dx=b[0]-a[0], dy=b[1]-a[1], h=Math.hypot(dx,dy)||1, r=flareWidth(u);
    left.push([x-dy/h*r,y+dx/h*r]);right.push([x+dy/h*r,y-dx/h*r]);
  }
  return 'M'+pointText([...left,...right.reverse()])+'Z';
}

const pathFor=points=>'M'+pointText(points);
const animatedPath=(stroke,extra='')=>`<path data-writer-stroke="${stroke.id}" d="${pathFor(stroke.points)}" stroke-dasharray="${n(stroke.length+.04)} ${n(stroke.length+2)}" stroke-dashoffset="${n(stroke.length+.04)}" visibility="hidden" ${extra}/>`;

function pieceBounds(points) {
  const xs = points.map(([x]) => x), ys = points.map(([,y]) => y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs)-x, height: Math.max(...ys)-y };
}

function sprayKernel(id) {
  return `<radialGradient id="${id}-kernel-fade">
    <stop stop-color="white"/><stop offset=".5" stop-color="white" stop-opacity=".86"/>
    <stop offset=".76" stop-color="white" stop-opacity=".51"/><stop offset="1" stop-color="white" stop-opacity="0"/>
  </radialGradient>
  <g id="${id}-kernel">
    <ellipse rx="1" ry=".83" fill="url(#${id}-kernel-fade)"/>
    <path d="M-.95.13h.03m.92.37h.025M-.46-.87h.025M.52-.76h.025M.83-.38h.018M-.73.72h.024M.12.95h.019M-.34-.96h.014"
      stroke="white" stroke-width=".026" stroke-linecap="round" opacity=".53"/>
  </g>`;
}

function depositPass(id, stroke) {
  const count = Math.max(2, Math.ceil(stroke.length / (stroke.phase === 'fill' ? 7 : 6)));
  const marks = Array.from({ length: count }, (_, i) => {
    const t = (i+.5)/count;
    const [x,y] = tipAt(stroke, t);
    const radius = sprayRadius(stroke.phase, sprayFan(stroke.phase,t));
    const seed = stroke.id*17.3 + i*9.7;
    const angle = n(seed % 180);
    const amount = n(sprayPressure(t)*(.56+.13*Math.sin(seed)));
    return `<use href="#${id}-kernel" data-load="${amount}" opacity="0"
      transform="translate(${n(x)} ${n(y)}) rotate(${angle}) scale(${n(radius)})"/>`;
  }).join('');
  return `<g data-writer-deposit="${stroke.id}">${marks}</g>`;
}

export function writerCarInk(id,car) {
  const { word, colors: [shine, gold, shade, dark] } = carStyles[car];
  const pieces = forms.filter(form => form.car === car);
  const x = carX(car)-12;
  const patch = `x="${x}" y="482" width="380" height="262"`;
  const carId = `${id}-car-ink-${car}`;
  const masks = pieces.map(form => `<mask id="${carId}-${form.id}" maskUnits="userSpaceOnUse" ${patch}>
    ${form.fill.map(st=>depositPass(carId,st)).join('')}</mask>`).join('');
  // The accumulation is visible both as dense pigment in the letters and
  // as stray droplets on bare metal beside their edges.
  const overspray = pieces.map(form =>
    `<rect ${patch} mask="url(#${carId}-${form.id})" fill="${gold}" opacity=".23"/>`).join('');
  const glyph = pieces.map(form => {
    const shape = form.outline.map(points => pathFor(points)+'Z').join('');
    return `<g data-writer-letter="${form.letter}" mask="url(#${carId}-${form.id})">
      ${writerLetterFinish(id,car,shape,pieceBounds(form.outline[0]),form.id)}</g>`;
  }).join('');
  const fl = flares.find(st => st.car === car);
  const flareMask = `${carId}-flare`;
  const edges = pieces.flatMap(form => form.contour).map(st =>
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
      ${animatedPath(st,'stroke="#432526" stroke-width="4.5" stroke-opacity=".25"')}
      ${animatedPath(st,'stroke="#201017" stroke-width="2.2" stroke-opacity=".94"')}
    </g>`).join('');
  const drips = pieces.filter((_,i) => i === 0 || i === 2).map((form,i) => {
    const [dx,dy] = form.outline[0].reduce((low, point) => point[1] > low[1] ? point : low);
    const length = 10 + (car*7+i*5)%12;
    return `<path data-writer-drip="${n(form.fill.at(-1).end+.05)}"
      d="M${n(dx+2)} ${n(dy-2)}q-1 4 1 ${length/2}t0 ${length/2}" pathLength="1"
      fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1" opacity="0"/>`;
  }).join('');
  const bounds = pieceBounds(pieces.flatMap(form => form.outline[0]));
  return `<g data-writer-word="${word}" transform="translate(-${carX(car)} 0)">
    <defs>${writerFinishDefs(id,car)}${sprayKernel(carId)}${masks}
      <mask id="${flareMask}" maskUnits="userSpaceOnUse" ${patch}>${depositPass(carId,fl)}</mask>
    </defs>
    ${overspray}${drips}${glyph}
    <g mask="url(#${flareMask})">
      <rect ${patch} fill="${gold}" opacity=".30"/>
      <path d="${flareShape(fl,1)}" transform="translate(1.2 2.5)" fill="${dark}" opacity=".77"/>
      <path d="${flareShape(fl,1)}" fill="${shine}" stroke="${shade}" stroke-width="1" opacity=".91"/>
    </g>
    ${edges}
    <g data-writer-glints="" opacity="0">${writerWordAccents(id,car,bounds)}</g></g>`;
}

export function createWriterInk(element) {
  const groups = Array.from({ length: strokes.length }, () => []);
  for (const node of element.querySelectorAll('[data-writer-stroke]')) {
    groups[Number(node.getAttribute('data-writer-stroke'))].push(node);
  }
  const deposits = new Map([...element.querySelectorAll('[data-writer-deposit]')].map(group => [
    Number(group.getAttribute('data-writer-deposit')),
    [...group.children].map(node => ({node, weight: Number(node.getAttribute('data-load'))})),
  ]));
  const glints = [...element.querySelectorAll('[data-writer-glints]')];
  const drips = [...element.querySelectorAll('[data-writer-drip]')].map(node => [
    node, Number(node.getAttribute('data-writer-drip')),
  ]);
  const cached = Array(strokes.length).fill(0);

  return (action, progress) => {
    strokes.forEach((st,i) => {
      const t = i < action.stroke ? 1 : i > action.stroke ? 0 : action.fraction;
      const before = cached[i];
      if (before === t) return;
      cached[i] = t;
      for (const el of groups[i]) {
        el.setAttribute('visibility',t>0?'visible':'hidden');
        el.setAttribute('stroke-dashoffset',n((1-t)*(st.length+.04)));
      }
      const marks = deposits.get(i);
      if (!marks) return;
      const now = t*marks.length, then = before*marks.length;
      const from = Math.floor(Math.min(now,then)), to = Math.ceil(Math.max(now,then));
      for (let j=from; j<to; j++) {
        const {node,weight} = marks[j];
        node.setAttribute('opacity',n(weight*smooth(now-j)));
      }
    });
    for (const [drip,start] of drips) {
      const run = smooth((progress-start)/.17);
      drip.setAttribute('stroke-dashoffset',n(1-run));
      drip.setAttribute('opacity',n(.87*Math.min(1,run*3)));
    }
    for (const glint of glints) {
      glint.setAttribute('opacity',n(smooth((progress-.926)/.052)));
    }
  };
}
