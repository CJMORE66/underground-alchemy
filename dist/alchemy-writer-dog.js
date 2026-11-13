/* An articulated, inked German shepherd in railway-scene coordinates. */
const SVG = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
let instance = 0;
const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = (a, b, p) => {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const n = value => Number(value.toFixed(2));

function shepherd(id) {
  const fill = name => `url(#${id}-${name})`;
  const gradient = (name, stops, direction = 'x2="0%" y2="100%"') =>
    `<linearGradient id="${id}-${name}" ${direction}>${stops.map(([at, color]) =>
      `<stop offset="${at}" stop-color="${color}"/>`).join('')}</linearGradient>`;
  const outline = 'stroke="#140e0c" stroke-width="2.6" stroke-linejoin="round"';
  const limb = (name, main, facets, lighting) => `<g id="${id}-${name}" ${outline}>
    <path d="${main}" fill="${fill('tan')}"/><path d="${facets}" fill="#51301f" stroke="none"/>
    <path d="${lighting}" fill="none" stroke="#e5aa58" stroke-width=".9" opacity=".72" stroke-linecap="round"/>
  </g>`;
  const legs = (side, opacity) => `<g opacity="${opacity}">
    ${['front','back'].map(key => `<g data-dog-leg="${side}-${key}">
      <use data-part="upper" href="#${id}-${key}-upper" xlink:href="#${id}-${key}-upper"/>
      <use data-part="lower" href="#${id}-${key}-lower" xlink:href="#${id}-${key}-lower"/>
      <use data-part="paw" href="#${id}-paw" xlink:href="#${id}-paw"/>
    </g>`).join('')}
  </g>`;

  return `<g xmlns="${SVG}" xmlns:xlink="${XLINK}" data-writer-dog="" aria-hidden="true" display="none">
    <defs>
      ${gradient('tan', [[0,'#5a3523'],[.29,'#a26839'],[.60,'#c68a47'],[.83,'#795032'],[1,'#523323']])}
      ${gradient('flank', [[0,'#211919'],[.32,'#432a23'],[.63,'#975d34'],[.82,'#bd8245'],[1,'#5b3727']], 'x2="32%" y2="100%"')}
      ${gradient('saddle', [[0,'#e5aa62'],[.13,'#453027'],[.37,'#221b1c'],[.74,'#292124'],[1,'#4f3328']], 'x2="12%" y2="100%"')}
      ${gradient('muzzle', [[0,'#84604b'],[.30,'#392728'],[.62,'#1b1619'],[1,'#352421']], 'x2="20%" y2="100%"')}
      <radialGradient id="${id}-shadow"><stop stop-color="#080606" stop-opacity=".75"/><stop offset="1" stop-color="#080606" stop-opacity="0"/></radialGradient>
      ${limb('front-upper','M-10-9Q0-14 13-8l5 17-7 19-1 20-14 2-8-14-2-23Z',
        'M-11 7l8 4 3 16-4 21-8-15Zm16-13 9 4 1 16-8 17 2-17Z','M-7 0l-3 15 3 20m14-35 6 8-2 12')}
      ${limb('front-lower','M-9-5l17 1 3 14-4 17 1 21-15 2-3-21 2-12Z',
        'M-8 7l5 10-1 13 2 17-5 1-3-19Zm11 0 6 4-4 15-3 4Z','M-5 12v13l2 16m7-10 1 12')}
      ${limb('back-upper','M-13-10q12-10 28-3l8 10 1 18-9 20-9 9-15-3-5-10-2-17Z',
        'M-9 0 0-9l14 4 4 11-10 10-2 12-10 6 1-18-8-6Zm5 35 12-5-2 13-9-1Z','M-8 1l-4 10 2 16m18-30 8 4 2 11-5 10')}
      ${limb('back-lower','M-10-5 8-6l4 11-3 18-5 10 2 12-14 2-3-13 4-15-4-12Z',
        'M-7 2l9 6-3 14-4 11 2 12-6 1-2-12 4-15Zm9 13 7-4-2 16-5 7Z','M-3 7l2 12-4 15m7-1 1 9')}
      <g id="${id}-paw" ${outline}>
        <path d="M-7-7h13l5 6 1 5-8 3h-17q-5 0-5-4l3-6Z" fill="${fill('tan')}"/>
        <path d="M-18 3h30l-3 4-22 1Z" fill="#36221a" stroke="none"/>
        <path d="M-12 0l-1 4m8-5-1 4M1-1 0 3" stroke="#613e28" stroke-width="1"/>
      </g>
    </defs>
    <ellipse data-dog-shadow="" cx="0" cy="0" rx="119" ry="10" fill="${fill('shadow')}"/>
    <g data-dog-tail="">
      <path d="M-6-10Q15-12 33 13l23 32 15 17 17 9-5 8-15 1-17-9-19-18-13-16L4 17-7 9Z" fill="${fill('saddle')}" ${outline}/>
      <path d="M0-6Q22-3 33 17l23 32 18 18 10 4-6 4-17-8-18-18-20-29L2 7Z" fill="#8e5937"/>
      <path d="M14 0q15 10 27 33l15 21m7 11 13 8" fill="none" stroke="#d8a06a" stroke-width="1.1" opacity=".58"/>
    </g>
    ${legs('far',.75)}
    <g data-dog-body="" ${outline}>
      <path d="M-64-111q10-14 25-14l32 8 25 4 26-1 19 6 17 14 2 19-7 21-14 16-10-1-9-12-12-13-20-4-18 3-12 8-16 7-15-1-13-12-9-19 1-17Z" fill="${fill('flank')}"/>
      <path d="M-65-110q8-13 24-14l31 7 29 4 25-1 20 6 13 12-7 8-11 2-10-6-16 4-15 14-19 3-22-7-14-3-10 8-12-6-8-14Z" fill="${fill('saddle')}" stroke="none"/>
      <path d="m-43-115 22 3 25 8 20 2 20-2 15 3-17 1-20 8-19-1-24-8-17-1-14 9Z" fill="#18171a" stroke="none" opacity=".77"/>
      <path d="m-65-95 8-7 12 2-8 17 5 20-6 6-14-20Zm15 38 13-9 17-8 10 1-13 8-10 13-13 3Zm87-11 9-15 11-3 10 7 7 13-5 14-11 9-11-13Z" fill="#ae713e" stroke="none" opacity=".79"/>
      <path d="m-58-89 4 15 11 10m5-39 14 1 18 7m8-8 25 5 19-2m16 4 10 8m-17 10 7 8-2 13m-33-9-16 3-13 6m-30-2-11 4m71-10 13 5" fill="none" stroke="#2b2223" stroke-width="1.45" stroke-linecap="round" opacity=".73"/>
      <path d="M-60-116q13-9 24-6l28 7 28 4 24-1 17 5 15 12m-141 1 1 17 7 14m76-7 12-1 11 4m17-18 9 7 1 10" fill="none" stroke="#f2b972" stroke-width="1.3" stroke-linecap="round" opacity=".75"/>
      <path d="m-62-93 6 3-2 8 6-5 3 11 5 4-3 6-8-5-4-10Z" fill="#d99d5b" stroke="none"/>
    </g>
    ${legs('near',1)}
    <g data-dog-head="" ${outline}>
      <g data-dog-ear="far">
        <path d="M-14-20-5-49 8-56 11-44 11-25 2-12Z" fill="#302124"/>
        <path d="m-4-25 5-22 4-4 1 24-7 6Z" fill="#ad7552" stroke="none"/>
        <path d="m-5-47 9-7 3 6" fill="none" stroke="#c48956" stroke-width="1"/>
      </g>
      <path d="M18-18 17 4 10 27-4 32-13 23-30 23-31 11-44 5-44-3-29-10-18-21-4-25 9-22Z" fill="${fill('tan')}"/>
      <path d="M12-16 16-8l-2 14-9 11-13 8-9-2 5-10-7-10 7-7-8-5 7-9 10-5Z" fill="#8d5532" stroke="none"/>
      <path d="m-1 3 10-5 4 3-4 9-9 8-10 4 5-8Zm-13 14-9 2-5-6-1-8 8 4Z" fill="#d29b63" stroke="none"/>
      <path data-dog-mouth="" d="M-62 4q15-3 37-3l5 11-7 10-22-1-14-10Z" fill="#171012" stroke="none" opacity="0"/>
      <g data-dog-jaw="">
        <path d="M-66 4-45 7l15-1 9 3-4 7-8 3-20-3-11-5Z" fill="#3d2824"/>
        <path d="m-62 9 17 4 12 1 5-2-5 4-21-2Z" fill="#8c5635" stroke="none"/>
        <path data-dog-tongue="" d="M-52 9q-4-4 1-5l16 2 5 3-3 4Z" fill="#b87164" stroke="none" opacity="0"/>
      </g>
      <path d="M-23-16q-6 1-13 9l-16 5-13 2-5 5 3 5 10 1 14-3 19 1 10-8-3-8Z" fill="${fill('muzzle')}"/>
      <path d="m-65 0-6 1-2 4 2 5 6 1 4-4-1-5Z" fill="#100d10" stroke-width="1.4"/>
      <path d="m-70 3 4-1 2 1" fill="none" stroke="#a4978e" stroke-width=".8"/>
      <path d="M-54-1-43-4l11-6m-16 15 6-2m-15 4 3-1" fill="none" stroke="#bf936f" stroke-width="1.1" opacity=".72"/>
      <path d="M-30-12q6-6 13-4l6 4-5 5-9 1-6-2Z" fill="#2a201c" stroke="none"/>
      <path d="M-27-11q6-4 12-1-2 4-8 4Z" fill="#ebad68" stroke="none"/>
      <ellipse data-dog-eye="" cx="-22" cy="-11" rx="1.7" ry="2.1" fill="#211515" stroke="none"/>
      <circle cx="-22.5" cy="-12.1" r=".56" fill="#fff1bc" stroke="none"/>
      <path d="m-30-15 6-4 9 1m3 3 4 2m-9 19 8-4 4-4m-4 19-6 6" fill="none" stroke="#57372b" stroke-width="1.2" stroke-linecap="round"/>
      <g data-dog-ear="near">
        <path d="M-17-19-22-54l7-9 7 8 10 30-4 10Z" fill="#693e2d"/>
        <path d="m-16-22-1-30 3-5 4 6 8 24-5 8Z" fill="#9f624e" stroke="none"/>
        <path d="m-13-48 3 9 2 12" fill="none" stroke="#39232a" stroke-width="2"/>
        <path d="m-21-53 6-9 4 7 9 28" fill="none" stroke="#f0b76c" stroke-width="1.25" opacity=".79"/>
      </g>
      <path d="m-5-15 8-4 8 3 5 9m-7 12-5 9-7 5" fill="none" stroke="#edb67d" stroke-width="1.05" stroke-linecap="round" opacity=".69"/>
      <path d="m-26 6 4 4 5-2" fill="none" stroke="#241b1c" stroke-width="1"/>
    </g>
  </g>`;
}

function limbTransform(from, to, originalLength) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  return `translate(${n(from[0])} ${n(from[1])}) rotate(${n(Math.atan2(-dx,dy) * 180 / Math.PI)}) scale(1 ${n(Math.hypot(dx,dy) / originalLength)})`;
}

function legPosition(key, far, phase, gait, hipShift, bob, sit) {
  const front = key === 'front';
  const start = front ? [-43 + far*10, -94 + bob] : [55 + hipShift + far*7, -79 + bob + sit*29];
  const t = (phase * 5 + (front ? .43 : 0) + far * .5) % 1;
  const sweep = t < .58 ? mix(-24,26,t/.58) : mix(26,-24,(t-.58)/.42);
  const lift = t < .58 ? 0 : Math.sin((t-.58)/.42 * Math.PI) * (front ? 29 : 23);
  const stance = front ? -46 + far*18 : mix(57,40,sit) + far*12;
  const end = [stance + gait*sweep, -7 - gait*lift];
  const bend = front ? 10 + .17*gait*sweep : mix(-19,-36,sit) + .09*gait*sweep;
  const joint = [mix(start[0],end[0],front ? .45 : .57) + bend, mix(start[1],end[1],front ? .50 : .46)];
  return { start, joint, end, tilt: (t > .58 ? -15 : 0) * gait };
}

export function createWriterDog(document) {
  const parser = new document.defaultView.DOMParser();
  const source = parser.parseFromString(shepherd(`writer-dog-${++instance}`), 'image/svg+xml');
  const element = document.importNode(source.documentElement, true);
  const find = part => element.querySelector(`[data-dog-${part}]`);
  const body = find('body'), head = find('head'), tail = find('tail'), shadow = find('shadow');
  const jaw = find('jaw'), mouth = find('mouth'), tongue = find('tongue'), eye = find('eye');
  const nearEar = find('ear="near"'), farEar = find('ear="far"');
  const legs = ['far','near'].flatMap(side => ['front','back'].map(key => {
    const group = find(`leg="${side}-${key}"`);
    const part = name => group.querySelector(`[data-part="${name}"]`);
    return { key, far: side === 'far' ? 1 : 0, upper: part('upper'), lower: part('lower'), paw: part('paw') };
  }));

  function render({x=0, y=0, scale=1, phase=0, mode='pose', facing=-1, opacity=1}={}) {
    const p = clamp(phase);
    const shown = mode !== 'hide' && opacity > 0;
    element.setAttribute('display',shown?'inline':'none');
    if (!shown) return;
    element.setAttribute('data-dog-mode',mode);
    element.setAttribute('opacity',n(clamp(opacity)));
    element.setAttribute('transform',`translate(${n(x)} ${n(y)}) scale(${n(facing > 0 ? -scale : scale)} ${n(scale)})`);

    const gait = mode === 'run' ? ease(0,.15,p) * (1-ease(.82,1,p)) : 0;
    const sit = mode === 'pose' ? ease(0,.64,p) : 0;
    const sniff = mode === 'feed' ? ease(.025,.26,p) * (1-ease(.88,1,p)) : 0;
    const chew = mode === 'feed' ? Math.max(0,Math.sin(TAU*(p-.22)*6)) * sniff : 0;
    const search = mode === 'watch' ? Math.sin(TAU*p*1.35) * (.4+.6*ease(0,.15,p)) : 0;
    const bark = mode === 'bark' ? Math.max(
      ease(.06,.20,p) * (1-ease(.21,.36,p)),
      .91*ease(.44,.57,p) * (1-ease(.60,.75,p)),
    ) : 0;
    const bounce = gait*Math.sin(TAU*p*10);
    const bob = -4*bounce + 3*sniff - 1.8*bark;
    const hips = -9*sit;
    const wag = mode === 'feed' ? 8*Math.sin(TAU*p*5) : mode === 'watch' ? 2.5*search : 0;

    body.setAttribute('transform',`translate(0 ${n(bob)}) rotate(${n(15*sit+3*bounce)} -44 -94)`);
    tail.setAttribute('transform',`translate(${n(69+hips)} ${n(-90+bob+30*sit)}) rotate(${n(-10*sit+9*bounce+wag)})`);
    shadow.setAttribute('rx',n(119 - 14*sit - 5*bounce));
    shadow.setAttribute('cx',n(8 - 8*sit));
    shadow.setAttribute('opacity',n(.85 - .15*Math.max(0,bounce)));

    for (const {key,far,upper,lower,paw} of legs) {
      const {start,joint,end,tilt} = legPosition(key,far,p,gait,hips,bob,sit);
      upper.setAttribute('transform',limbTransform(start,joint,key === 'front' ? 48 : 44));
      lower.setAttribute('transform',limbTransform(joint,end,key === 'front' ? 48 : 45));
      paw.setAttribute('transform',`translate(${n(end[0])} ${n(end[1])}) rotate(${n(tilt)})`);
    }

    const headX = -57 - 6*sniff - 7*bark + 5*search;
    const headY = -107 + bob + 22*sniff - 3*bark - 1.8*sit;
    const headAngle = -52*sniff - 6*bark + 6.5*search - 4*sit + 4*bounce;
    head.setAttribute('transform',`translate(${n(headX)} ${n(headY)}) rotate(${n(headAngle)})`);
    const opening = Math.max(24*bark,11*chew);
    jaw.setAttribute('transform',`rotate(${n(-opening)} -23 8)`);
    mouth.setAttribute('opacity',n(clamp(opening/12)));
    tongue.setAttribute('opacity',n(.82*chew));
    nearEar.setAttribute('transform',`rotate(${n(-11*sniff-14*bark-11*search+8*bounce)} -11 -21)`);
    farEar.setAttribute('transform',`rotate(${n(9*sniff-8*bark+16*search+4*bounce)} 3 -20)`);
    eye.setAttribute('transform',`translate(${n(-1.5*search)} ${n(.65*sniff)})`);
  }
  return {element, render};
}
