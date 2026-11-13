/* Four planted footfalls and a spoken gesture, drawn over the prologue plate. */
const SVG = 'http://www.w3.org/2000/svg';
const FLOOR = 909;
const UPPER_LEG = 111;
const LOWER_LEG = 107;
const UPPER_ARM = 78;
const LOWER_ARM = 72;
let nextRig = 0;

const clamp = value => Math.max(0, Math.min(value, 1));
const mix = (from, to, ratio) => from + (to - from) * ratio;
const ease = (from, to, value) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const fmt = value => value.toFixed(2);

// A stride ends only after the swinging boot touches down. The other boot keeps
// its exact world-space anchor for the whole stride.
const startingFeet = [1464, 1525];
const footfalls = [
  { side: 1, x: 1355 },
  { side: 0, x: 1226 },
  { side: 1, x: 1093 },
  { side: 0, x: 1018 },
];

function joint(start, end, upper, lower, bend) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const distance = Math.hypot(dx, dy) || .01;
  const reach = Math.min(distance, upper + lower - .1);
  const along = (upper ** 2 - lower ** 2 + reach ** 2) / (2 * reach);
  const off = Math.sqrt(Math.max(0, upper ** 2 - along ** 2)) * bend;
  const ux = dx / distance;
  const uy = dy / distance;
  return [start[0] + ux * along - uy * off, start[1] + uy * along + ux * off];
}

function aim(part, from, to, length) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const angle = Math.atan2(-dx, dy) * 180 / Math.PI;
  part.setAttribute('transform', `translate(${fmt(from[0])} ${fmt(from[1])}) rotate(${fmt(angle)}) scale(1 ${fmt(Math.hypot(dx, dy) / length)})`);
}

function art(id) {
  const gold = `url(#${id}-gold)`;
  const dark = `url(#${id}-ink)`;
  const shade = `url(#${id}-shade)`;
  const skin = `url(#${id}-skin)`;
  const braid = `url(#${id}-braid)`;
  return `
    <defs>
      <linearGradient id="${id}-gold" x1="0" x2="1" y2="1">
        <stop stop-color="#5c310a"/><stop offset=".28" stop-color="#bd7817"/><stop offset=".52" stop-color="#ffe254"/>
        <stop offset=".69" stop-color="#ffd324"/><stop offset=".87" stop-color="#8f540f"/><stop offset="1" stop-color="#e7a828"/>
      </linearGradient>
      <linearGradient id="${id}-shade" x2=".85" y2="1">
        <stop stop-color="#fbd13b"/><stop offset=".42" stop-color="#b97716"/><stop offset="1" stop-color="#3f2209"/>
      </linearGradient>
      <linearGradient id="${id}-ink" x2="1" y2=".8">
        <stop stop-color="#080909"/><stop offset=".44" stop-color="#29252a"/><stop offset=".7" stop-color="#151316"/><stop offset="1" stop-color="#070708"/>
      </linearGradient>
      <linearGradient id="${id}-skin" x2="1" y2="1">
        <stop stop-color="#ffcc6b"/><stop offset=".52" stop-color="#a86a2b"/><stop offset="1" stop-color="#512b14"/>
      </linearGradient>
      <radialGradient id="${id}-pool">
        <stop stop-color="#ffb935" stop-opacity=".5"/><stop offset=".38" stop-color="#9b4811" stop-opacity=".19"/><stop offset="1" stop-color="#2f0903" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}-shadow">
        <stop stop-color="#000" stop-opacity=".92"/><stop offset=".7" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${id}-braid" width="6" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 7 6 2M-3 5l6-5m0 10 6-5" fill="none" stroke="#ffea7d" stroke-width=".7" opacity=".6"/>
      </pattern>
      <g id="${id}-thigh" stroke-linejoin="round">
        <path d="M-35-10Q-22-24 25-13L37 9 30 62 28 104 12 122-22 118-33 95-41 34Z" fill="${dark}" stroke="#080605" stroke-width="5"/>
        <path d="M-34-9-15-13l-3 38 5 23-5 26 7 44-13-2-11-27 1-37-6-21Z" fill="${shade}"/>
        <path d="m-20 19 17 16 20 6-30 2-12-13Zm0 43 21 4 19 14-35-8-8 19Zm19 31 27-5-7 12-10 9Z" fill="#554630"/>
        <path d="m-27 1-4 24 8 29-3 29 9 25M24 14l3 29-7 33m-37 32 15 5" fill="none" stroke="#dca223" stroke-width="1.1"/>
      </g>
      <g id="${id}-shin" stroke-linejoin="round">
        <path d="M-28-10Q0-25 24-8L27 40l-4 47 4 21-16 9-32-2-11-15 6-26-5-41Z" fill="${dark}" stroke="#080605" stroke-width="5"/>
        <path d="M-27-4-13 3l2 27-6 24 2 35-5 21-12-9 6-27-3-26Z" fill="${shade}"/>
        <path d="M-14 7 11 13 19 26-12 21Zm-2 30 30 9-15 6-14 2ZM-13 78l30-15-2 14-22 17Z" fill="#564a39"/>
        <path d="M-17 12-21 33-17 65l-3 28m35-63 2 18-8 32m-25 18 28-9" fill="none" stroke="#dca223" stroke-width="1.1"/>
      </g>
      <g id="${id}-boot" stroke-linejoin="round">
        <path d="M-18-29 20-26 24-7 33 6l-2 13-17 6-64-1-7-7 4-11 21-9Z" fill="${dark}" stroke="#070606" stroke-width="4"/>
        <path d="m-50 10 23 4 48 1 11-5-1 9-17 6-63-1-7-7Z" fill="${shade}"/>
        <path d="M-51 15q23 6 69 5l11-3M-40 23l2-5m8 6 1-5m9 5 1-5m10 5 1-4m11 4v-4m11 4 1-5" fill="none" stroke="#ffe36d" stroke-width="1.35"/>
        <path d="m-22-16 26 3 13 13-22-1-26 9m-1-13 20-7m-13 14 21-7m-10 9 18-5" fill="none" stroke="#c99326" stroke-width="2.3"/>
        <path d="m-17-29 38 3 1 8-35-5Z" fill="${braid}" opacity=".7"/>
      </g>
      <g id="${id}-upper-arm" stroke-linejoin="round">
        <path d="M-24 1q10-26 39-17L28 0l-3 33-6 42-14 9-22-5-11-30Z" fill="${dark}" stroke="#0b0705" stroke-width="4"/>
        <path d="M-24 3-9-12l10 8-8 32 8 27-7 27-15-5-5-24Z" fill="${gold}"/>
        <path d="m0 14 19 9-17 4 12 16-17-7Zm-4 36 17 9-1 18-16-6Z" fill="#504334"/>
        <path d="m-17 8-3 28 6 32m31-47-3 38" fill="none" stroke="#ffd466" stroke-width="1.1"/>
      </g>
      <g id="${id}-forearm" stroke-linejoin="round">
        <path d="M-18-7Q3-20 19-4l6 21-9 39-3 21-26-1-10-27-1-29Z" fill="${dark}" stroke="#0b0705" stroke-width="4"/>
        <path d="m-18-2 14 4-1 21-6 13 8 32-10 5-9-26-2-20Z" fill="${shade}"/>
        <path d="M-15 59l31-3-3 21-26-1Z" fill="${gold}"/>
        <path d="M-15 62l31-3m-29 9 28-2m-27 8 24-3" stroke="#633709" stroke-width="1.5"/>
        <path d="m4 8 12 7-1 24-14 13 7-27Z" fill="#423629"/>
      </g>
      <g id="${id}-hand">
        <path d="M-10-5q8-6 20-2l6 13-4 15-8 4-7-2-5-9-4 2-6-4 3-9Z" fill="${skin}" stroke="#120b06" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="m8 3 3 10-5 7M1 5l3 9-4 6m-6-11 2 6m-5-11 5 3" fill="none" stroke="#6b3f1e" stroke-width="1.1"/>
        <path d="m-9-1 17-1m1 17-5 6" fill="none" stroke="#ffdc87" stroke-width="1.1" opacity=".8"/>
      </g>
      <g id="${id}-palm">
        <path d="M-12-3-18-18q-4-9 1-9 2 0 8 10l2-15q1-7 5-6 2 1 1 8l1 10 5-15q3-6 6-4 2 1 1 7l-3 14 7-9q5-5 7-2 1 2-3 8l-7 13 1 14-6 7-15-1-6-5Z" fill="${skin}" stroke="#150c06" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M-10-8Q-1-17 9-14m-15 7 11-3M-5 2Q4-4 10 1" fill="none" stroke="#6b3a19" stroke-width="1.15"/>
      </g>
    </defs>
    <ellipse data-actor-glow="" cy="917" rx="145" ry="38" fill="url(#${id}-pool)"/>
    <ellipse data-actor-shadow="" cy="923" rx="106" ry="17" fill="url(#${id}-shadow)"/>
    <g data-actor-impact="" fill="#ffd454">
      <circle r="2.8" cx="-37" cy="1"/><circle r="1.5" cx="-23" cy="-9"/>
      <circle r="1.3" cx="34" cy="-6"/><path d="m-4-9 3-9 2 9-3 3Zm34-2 9-4-6 7Z" fill="#ff9a3c"/>
      <path d="M-48 0H48" fill="none" stroke="#ffd454" stroke-width="1.2" stroke-dasharray="4 10 14 16 5"/>
    </g>
    <g data-actor-body="">
      <g data-actor-leg="far" opacity=".87">
        <use data-part="thigh" href="#${id}-thigh"/>
        <use data-part="shin" href="#${id}-shin"/>
        <use data-part="boot" href="#${id}-boot"/>
      </g>
      <g data-actor-leg="near">
        <use data-part="thigh" href="#${id}-thigh"/>
        <use data-part="shin" href="#${id}-shin"/>
        <use data-part="boot" href="#${id}-boot"/>
      </g>
      <g data-actor-torso="">
        <g data-actor-arm="far" opacity=".9">
          <use data-part="upper" href="#${id}-upper-arm"/>
          <use data-part="fore" href="#${id}-forearm"/>
          <use data-part="hand" href="#${id}-hand"/>
        </g>
        <g data-actor-coat="" stroke-linejoin="round">
          <path d="M-63-132-42-154l32 6 39-11 33 16 15 25-10 45-13 27 8 55-35 31-34-31-31 34-40-27 10-45-11-46Z" fill="${dark}" stroke="#060505" stroke-width="6"/>
          <path d="M-63-132-45-152l18 18 9 31-9 49 8 46-22 36-30-16 9-39-10-47Z" fill="${gold}" stroke="#5c3209" stroke-width="2"/>
          <path d="m27-153 27 13 19 25-13 44-12 25 9 55-22 20-20-33 6-40-3-36Z" fill="${shade}" stroke="#593208" stroke-width="2"/>
          <path d="M-62-119-40-140l16 23-11 27-13-17-7 36-10-11Z" fill="#f1bf37"/>
          <path d="m30-143 22 7 17 24-16-4-14-16Zm-92 100 19 14-10 12-12-4Zm13 43 16 2-9 20-17-9Z" fill="#ffe16e"/>
          <path d="m-17-121 14 16 12-13 1 29-15 32-12 3 9-32Zm-1 89 37-6-8 15-22 5Zm9 18 16 7 24-8-15 11L0 8Z" fill="#372f2c"/>
          <path d="M-37-138-24-101-32-51-25-11-43 24m69-166-6 46 10 52-6 39 14 24m-41-142 4 41-7 30 2 30" fill="none" stroke="#ffe069" stroke-width="1.8"/>
          <path d="m-59-41 24-11 6 11-24 16Zm92-10 21-7 8 10-25 10Z" fill="#0d0a09" stroke="#a97617" stroke-width="1.5"/>
          <path d="M-38-25 38-27l8 15-7 9-78-1-10-9Z" fill="#17130e" stroke="#805b18" stroke-width="1.5"/>
          <path d="m-5-23 16-1 3 15-20 3-6-8Z" fill="${gold}" stroke="#f4c75c" stroke-width="1.1"/>
          <path d="M-58-123q25 17 35 32m53-56q17 26 38 33m-123 44 8 20m100-29-12 22m-90 67 6-11" fill="none" stroke="${braid}" stroke-width="5"/>
          <path d="M-28-138-21-127-9-116 6-115l14-8 8-17" fill="none" stroke="#1a0f08" stroke-width="6"/>
          <path d="M-28-139-21-129-9-118 6-117l14-8 8-16" fill="none" stroke="#e4b24d" stroke-width="3" stroke-dasharray="2 3"/>
          <g data-actor-pendant="" transform="translate(0 -101)">
            <path d="M0-13 12 9-12 9Z" fill="#0e0a07" stroke="#ffe373" stroke-width="2.3"/>
            <circle cy="2" r="5.4" fill="none" stroke="#f1b842" stroke-width="1.2"/><path d="M-7 5H7M0-7v15" stroke="#f1b842" stroke-width="1.2"/>
          </g>
          <path d="M-68-125-56-105l-7 24 13 17m106-64 10 25-12 24" fill="none" stroke="#ee2536" stroke-width="2" opacity=".72"/>
          <g data-actor-coat-back="" opacity="0">
            <path d="M-44-148-23-153l21 5 29-10 29 15-15 37 7 73-11 56-24-22-19 6-29 20 4-56-12-74Z" fill="${dark}" stroke="#9a6327" stroke-width="2"/>
            <path d="m-41-143 44 10 44-11-11 28-34 12-31-13Z" fill="${shade}"/>
            <path d="M1-96v58m-29 7 6-47m46-7 5 48M-25-38l23-5 27 3" stroke="#a97832" fill="none" stroke-width="2"/>
            <path d="m-17-65 18-30 18 30Z" fill="#171311" stroke="#dca72c" stroke-width="2.2"/><circle cx="1" cy="-73" r="5" fill="none" stroke="#ffe374"/>
          </g>
        </g>
        <g data-actor-arm="near">
          <use data-part="upper" href="#${id}-upper-arm"/>
          <use data-part="fore" href="#${id}-forearm"/>
          <use data-part="hand" href="#${id}-hand"/>
          <use data-part="palm" href="#${id}-palm"/>
        </g>
        <g data-actor-head="">
          <path d="M-61-37-53-64-31-83 2-105l31 19 25 25 10 43-12 29-27 16-35 5-31-11-21-26Z" fill="${dark}" stroke="#070504" stroke-width="6" stroke-linejoin="round"/>
          <path d="m-60-39 8-24 26-24 29-17 9 18-27 14-19 27-7 25 13 34-13-5-14-24Z" fill="${gold}"/>
          <path d="M3-104 32-85l25 24 11 43-12 29-27 16-13 1 21-20 12-33-9-27-24-25Z" fill="${shade}"/>
          <path d="m-49-66 48-36-11 21-21 16-12 27-9 12 2-23Zm63-25 23 14 17 18 9 26-11-11-11-25-18-12Zm25 96 12-23-2 24-19 15Z" fill="#ffde60"/>
          <path d="M-39-38-24-64 3-80l22 13 17 27-1 25-19 34-22 7-23-9-15-25Z" fill="#0a0809" stroke="#966016" stroke-width="2"/>
          <path d="m-34-17 16-10 17 8 19-9 15 7-6 20-13 15-15 5-17-4-12-17Z" fill="${dark}" stroke="#1a1716" stroke-width="1.7"/>
          <path data-actor-mouth="" d="M-26-13-9-5l10-1 17-11m-39 12L0 2l16-11M-16 8 0 13l14-6" fill="none" stroke="#625041" stroke-width="1.45"/>
          <g data-actor-eyes="" fill="#ffe475">
            <path d="m-29-35 15 4 5 6-13-1Zm40 10 5-6 15-4-6 9Z"/>
            <path d="m-26-34 12 4m30 0 12-4" fill="none" stroke="#fff6c7" stroke-width="1.1"/>
          </g>
          <path d="M-42-43-33-64l22-18M46-43l-8-19-20-17m-66 47-4 12 7 19m96-27 5 12-9 18" fill="none" stroke="#ffe27c" stroke-width="1.1"/>
          <path d="M-57-49-61-27l8 22m108-45 6 21-4 24" fill="none" stroke="#e54623" stroke-width="1.7" opacity=".65"/>
          <path d="M-27 21 0 29l26-9-14 12-23 3Z" fill="#423126" stroke="#a46c23" stroke-width="1.1"/>
          <g data-actor-hood-back="" opacity="0">
            <path d="M-49-40-31-68 2-98l30 25 22 27 8 28-11 25-26 16-28 6-29-10-16-25Z" fill="${dark}" stroke="#825217" stroke-width="2"/>
            <path d="M2-97-6-61l6 24-7 32 6 34M10-81 33-58l12 39-3 13m-50-76-24 27-8 26" fill="none" stroke="#bd8b2c" stroke-width="2.2"/>
            <path d="m-19-64 11-15-3 24 8 19-8 20 2-23Z" fill="#625139"/>
          </g>
        </g>
      </g>
    </g>`;
}

function makeLimb(group, names) {
  return Object.fromEntries(names.map(name => [name, group.querySelector(`[data-part="${name}"]`)]));
}

function walkAt(entrance) {
  const clock = Math.min(4, (entrance / .89) * 4);
  const index = Math.min(Math.floor(clock), 3);
  const phase = clock - index;
  const feet = startingFeet.map((x, side) => ({ x, y: FLOOR - side * 7, turn: 0 }));
  for (const completed of footfalls.slice(0, index)) feet[completed.side].x = completed.x;
  const { side, x } = footfalls[index];
  const lift = Math.sin(Math.PI * clamp(phase / .85)) ** 1.4;
  const moving = feet[side];
  moving.x = mix(moving.x, x, ease(0, .84, phase));
  moving.y -= lift * 37;
  moving.turn = (Math.sin(phase * Math.PI * 2) * 15 + ease(.53, .81, phase) * 9) * (1 - ease(.79, .96, phase));
  const roll = Math.sin(phase * Math.PI);
  const xHip = (feet[0].x + feet[1].x) / 2 - 8 * roll;
  const yHip = 711 - lift * 9 + Math.sin(ease(.78, 1, phase) * Math.PI) * 7;
  return { feet, xHip, yHip, roll, phase, index, moving };
}

/** All arguments are normalized 0..1. The controller owns the scroll timeline. */
export function createPrologueActor(document) {
  const parser = new document.defaultView.DOMParser();
  const source = parser.parseFromString(`<svg xmlns="${SVG}">${art(`prologue-actor-${++nextRig}`)}</svg>`, 'image/svg+xml');
  const element = document.importNode(source.documentElement, true);
  element.setAttribute('viewBox', '0 0 1536 1024');
  element.setAttribute('aria-hidden', 'true');
  element.setAttribute('focusable', 'false');
  element.setAttribute('class', 'alchemy-prologue-actor');
  const node = name => element.querySelector(`[data-actor-${name}]`);
  const torso = node('torso');
  const body = node('body');
  const head = node('head');
  const coat = node('coat');
  const coatBack = node('coat-back');
  const hoodBack = node('hood-back');
  let turning = false;
  const eyes = node('eyes');
  const mouth = node('mouth');
  const pendant = node('pendant');
  const glow = node('glow');
  const shadow = node('shadow');
  const impact = node('impact');
  const legs = ['near', 'far'].map(name => makeLimb(node(`leg="${name}"`), ['thigh', 'shin', 'boot']));
  const arms = ['near', 'far'].map(name => makeLimb(node(`arm="${name}"`), ['upper', 'fore', 'hand', 'palm']));
  const nearArm = node('arm="near"');
  const farArm = node('arm="far"');

  function moveFarArm(front) {
    if (front && farArm.nextElementSibling !== nearArm) torso.insertBefore(farArm, nearArm);
    else if (!front && torso.firstElementChild !== farArm) torso.prepend(farArm);
  }
  let visible = null;

  function render({ entrance = 0, speech = 0, progress = 0 } = {}) {
    const entering = entrance > 0;
    if (entering !== visible) {
      visible = entering;
      if (entering) element.style.removeProperty('visibility');
      else element.style.visibility = 'hidden';
    }
    if (!entering) return;

    moveFarArm(false);
    if (turning) {
      coat.removeAttribute('transform');
      coatBack.setAttribute('opacity', '0');
      hoodBack.setAttribute('opacity', '0');
      turning = false;
    }
    const arrival = ease(.86, 1, entrance);
    const emphasis = ease(.05, .63, speech);
    const breathing = Math.sin(progress * Math.PI * 6) * arrival;
    const { feet, xHip, yHip, roll, phase, index, moving } = walkAt(entrance);
    const y = yHip + breathing * 1.4;
    const ink = ease(0, .15, entrance);
    element.setAttribute('opacity', fmt(ink));
    body.setAttribute('transform', `translate(${fmt(xHip)} ${fmt(y)})`);
    glow.setAttribute('cx', fmt(xHip));
    glow.setAttribute('cy', String(FLOOR + 8));
    glow.setAttribute('opacity', fmt(.33 + arrival * .24));
    shadow.setAttribute('cx', fmt(xHip));
    shadow.setAttribute('cy', String(FLOOR + 14));
    shadow.setAttribute('rx', fmt(110 - roll * 13));
    impact.setAttribute('transform', `translate(${fmt(moving.x)} ${fmt(moving.y + 22)})`);
    impact.setAttribute('opacity', fmt(.72 * ease(.78, .84, phase) * (1 - ease(.87, 1, phase))));

    legs.forEach((leg, side) => {
      const signed = side === 0 ? -1 : 1;
      const foot = feet[side];
      const hip = [signed * mix(15, 25, arrival), -2];
      const ankle = [foot.x - xHip, foot.y - y];
      const bend = side === 0 ? 1 : mix(1, -.58, arrival);
      const knee = joint(hip, ankle, UPPER_LEG, LOWER_LEG, bend);
      aim(leg.thigh, hip, knee, UPPER_LEG);
      aim(leg.shin, knee, ankle, LOWER_LEG);
      const facing = side === 0 ? mix(.87, .96, arrival) : mix(.83, -.86, arrival);
      leg.boot.setAttribute('transform', `translate(${fmt(ankle[0])} ${fmt(ankle[1])}) rotate(${fmt(foot.turn)}) scale(${fmt(facing)} ${side === 0 ? 1 : .92})`);
    });

    const walking = (1 - arrival) * Math.sin((index + phase) * Math.PI);
    torso.setAttribute('transform', `rotate(${fmt(-5.5 * (1 - arrival) + walking * 3 + emphasis * 1.4)}) scale(${fmt(mix(.91, 1, arrival))} 1)`);
    head.setAttribute('transform', `translate(${fmt(mix(-15, 0, arrival))} ${fmt(-154 - breathing * 2)}) rotate(${fmt(mix(-7, -1, arrival) - emphasis * 2.7 + walking * 2.6)})`);
    pendant.setAttribute('transform', `translate(0 -101) rotate(${fmt(walking * 10 + breathing * 2)})`);
    eyes.setAttribute('opacity', fmt(.68 + emphasis * .32));
    mouth.setAttribute('transform', `scale(1 ${fmt(1 + emphasis * .14 * Math.sin(progress * 71))})`);

    arms.forEach((arm, side) => {
      const signed = side === 0 ? -1 : 1;
      const shoulder = [signed * 53, -125];
      const wrist = [signed * (61 + emphasis * (side === 0 ? 70 : 8)) + walking * signed * 35, 13 - (side === 0 ? emphasis * 116 : emphasis * 7) - roll * 7];
      const elbow = joint(shoulder, wrist, UPPER_ARM, LOWER_ARM, signed * -.9);
      aim(arm.upper, shoulder, elbow, UPPER_ARM);
      aim(arm.fore, elbow, wrist, LOWER_ARM);
      const angle = Math.atan2(elbow[0] - wrist[0], wrist[1] - elbow[1]) * 180 / Math.PI;
      arm.hand.setAttribute('transform', `translate(${fmt(wrist[0])} ${fmt(wrist[1])}) rotate(${fmt(angle)})`);
      if (arm.palm) {
        const opening = ease(.25, .81, emphasis);
        arm.hand.setAttribute('opacity', fmt(1 - opening));
        arm.palm.setAttribute('opacity', fmt(opening));
        arm.palm.setAttribute('transform', `translate(${fmt(wrist[0])} ${fmt(wrist[1] - 4)}) rotate(${fmt(mix(-23, -10, opening))})`);
      }
    });
  }

  function pose({
    x = 1055, y = 711, scale = 1, body: bodyAngle = 0, torso: torsoAngle = 0,
    head: headAngle = 0, headX = 0, headY = -154,
    nearHand = [-61, 13], farHand = [69, 13],
    nearFoot = [-37, 198, 0], farFoot = [38, 191, 0],
    nearOpen = 0, nearWrist, farWrist, nearKneeBend = 1, farFront = 0, eyes: gaze = .8, mouth: jaw = 1,
    ground = FLOOR, shadowX = x, shadowScale = 1, spinYaw = 0, opacity = 1, pendant: swing = 0,
  } = {}) {
    visible = true;
    const across = Math.sin(spinYaw);
    const face = Math.cos(spinYaw);
    const profile = 1 - .44 * across * across;
    if (spinYaw || turning) {
      const back = fmt(ease(-.12, .72, -face));
      coat.setAttribute('transform', `scale(${fmt(profile)} 1)`);
      hoodBack.setAttribute('opacity', back);
      coatBack.setAttribute('opacity', back);
      turning = Boolean(spinYaw);
    }
    moveFarArm(farFront > .5 || (spinYaw && Math.sin(spinYaw) < -.22));
    element.style.removeProperty('visibility');
    element.setAttribute('opacity', fmt(opacity));
    body.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(bodyAngle)}) scale(${fmt(scale)})`);
    torso.setAttribute('transform', `rotate(${fmt(torsoAngle)})`);
    head.setAttribute('transform', `translate(${fmt(headX + across * 5)} ${fmt(headY)}) rotate(${fmt(headAngle)}) scale(${fmt(profile)} 1)`);
    eyes.setAttribute('opacity', fmt(gaze));
    mouth.setAttribute('transform', `scale(1 ${fmt(jaw)})`);
    pendant.setAttribute('transform', `translate(0 -101) rotate(${fmt(swing)})`);
    impact.setAttribute('opacity', '0');
    glow.setAttribute('cx', fmt(shadowX));
    glow.setAttribute('cy', fmt(ground + 8));
    glow.setAttribute('opacity', '.5');
    shadow.setAttribute('cx', fmt(shadowX));
    shadow.setAttribute('cy', fmt(ground + 14));
    shadow.setAttribute('rx', fmt(110 * scale * shadowScale));

    [nearFoot, farFoot].forEach(([fx, fy, turn = 0], side) => {
      const leg = legs[side];
      const hip = [(side === 0 ? -25 : 25) * profile, -2];
      const ankle = [fx, fy];
      const knee = joint(hip, ankle, UPPER_LEG, LOWER_LEG, side === 0 ? nearKneeBend : -.72);
      aim(leg.thigh, hip, knee, UPPER_LEG);
      aim(leg.shin, knee, ankle, LOWER_LEG);
      leg.boot.setAttribute('transform', `translate(${fmt(fx)} ${fmt(fy)}) rotate(${fmt(turn)}) scale(${side === 0 ? 1 : -.86} ${side === 0 ? 1 : .92})`);
    });

    [nearHand, farHand].forEach((wrist, side) => {
      const arm = arms[side];
      const sign = side === 0 ? -1 : 1;
      const shoulder = [sign * 53 * profile, -125];
      const elbow = joint(shoulder, wrist, UPPER_ARM, LOWER_ARM, -sign * .9);
      const handAngle = (side === 0 ? nearWrist : farWrist) ??
        Math.atan2(elbow[0] - wrist[0], wrist[1] - elbow[1]) * 180 / Math.PI;
      const handTransform = `translate(${fmt(wrist[0])} ${fmt(wrist[1])}) rotate(${fmt(handAngle)})`;
      aim(arm.upper, shoulder, elbow, UPPER_ARM);
      aim(arm.fore, elbow, wrist, LOWER_ARM);
      arm.hand.setAttribute('transform', handTransform);
      if (arm.palm) {
        arm.hand.setAttribute('opacity', fmt(1 - nearOpen));
        arm.palm.setAttribute('opacity', fmt(nearOpen));
        arm.palm.setAttribute('transform', `translate(${fmt(wrist[0])} ${fmt(wrist[1] - 4)}) rotate(${fmt(handAngle - 12)})`);
      }
    });
  }

  render();
  return { element, render, pose };
}
