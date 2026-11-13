/* MAJK 111 and the guide's scroll-scrubbed mic performance. */
const SVG = 'http://www.w3.org/2000/svg';
const clip = { x: -31, y: -91, angle: -15, grip: 0, tap: 0, signal: 0 };
const voiceGrip = { x: -34, y: -126, angle: 25, grip: 1, tap: 0, signal: 0 };
const rest = {
  x: 1055, y: 711, torso: 0, head: 0, nearHand: [-61, 13], farHand: [69, 13],
  nearWrist: 0, farWrist: 0, nearOpen: 0, farFront: 0, eyes: .8, mouth: 1, pendant: 0, mic: clip,
};
const reach = { ...rest, torso: -3, head: 8, nearHand: [-35, -77], nearWrist: 162 };
const lift = {
  ...rest, y: 709, torso: 2, head: -4, nearHand: [-35, -114], nearWrist: 169,
  farHand: [49, -26], farWrist: -42, mic: voiceGrip,
};
const readyToTap = { ...lift, farHand: [8, -108], farWrist: 152, farFront: 1 };
const touch = { ...lift, head: 4, farHand: [-16, -137], farWrist: 151, farFront: 1 };

const clamp = value => Math.max(0, Math.min(value, 1));
const mix = (a, b, amount) => a + (b - a) * amount;
const smooth = value => value * value * (3 - 2 * value);
const ease = (from, to, value) => smooth(clamp((value - from) / (to - from)));
const fmt = value => value.toFixed(2);

function groundFeet(pose) {
  pose.nearFoot = [-37, 909 - pose.y, 0];
  pose.farFoot = [38, 902 - pose.y, 0];
  return pose;
}

function sample(frames, progress) {
  const next = frames.findIndex(([at]) => at > progress);
  const upper = next < 0 ? frames.length - 1 : next;
  const [start, from] = frames[upper - 1];
  const [end, to] = frames[upper];
  const t = ease(start, end, progress);
  const pose = {};
  for (const key of Object.keys(rest)) {
    if (key === 'mic') {
      pose.mic = Object.fromEntries(Object.keys(clip).map(field => [field, mix(from.mic[field], to.mic[field], t)]));
    } else if (Array.isArray(rest[key])) {
      pose[key] = from[key].map((value, axis) => mix(value, to[key][axis], t));
    } else {
      pose[key] = mix(from[key], to[key], t);
    }
  }
  return pose;
}

const impact = (progress, time, duration) => ease(time - .012, time, progress) * (1 - ease(time, time + duration, progress));

const speech = { ...lift, y: 711, torso: 1.5, head: -2, farHand: [57, -25], farWrist: -10, eyes: 1 };
const speechFrames = [
  [0, rest], [.12, reach], [.23, readyToTap], [.28, touch], [.32, readyToTap],
  [.38, touch], [.45, lift], [.53, speech], [1, speech],
];

/** First line. If present, voicePhase follows the optional voice track. */
export function sampleLegendMicSpeech(progress = 0, voicePhase) {
  const p = clamp(progress);
  const pose = sample(speechFrames, p);
  const speaking = ease(.51, .6, p) * (1 - ease(.93, 1, p));
  const phase = voicePhase ?? p * 2.4;
  const syllable = (.55 + Math.sin(phase * 82) * .45) * speaking;
  pose.head -= Math.sin(phase * 17) * speaking * 2.4;
  pose.farHand[0] += speaking * (17 + Math.sin(phase * 11) * 8);
  pose.farHand[1] -= speaking * (22 + Math.sin(phase * 19) * 10);
  pose.mouth += syllable * .41;
  pose.mic.tap = Math.max(impact(p, .28, .065), impact(p, .38, .07));
  pose.mic.angle += pose.mic.tap * 2;
  pose.mic.signal = syllable;
  return groundFeet(pose);
}

const call = {
  ...lift, y: 712, torso: 6, head: 12, nearHand: [0, -112], nearWrist: 104,
  farHand: [79, -42], farWrist: -32, eyes: .6,
  mic: { ...voiceGrip, x: 13, y: -116, angle: 76 },
};
const deadpan = { ...call, torso: 9, head: 17, eyes: .38, farHand: [84, -32], farWrist: -24 };
const flinch = {
  ...call, y: 698, torso: -11, head: -18, eyes: 1, nearHand: [-18, -111], nearWrist: 135,
  farHand: [98, -93], farWrist: -92, mic: { ...voiceGrip, x: -7, y: -120, angle: 49 },
};
const flow = { ...speech, y: 706, torso: -3, farHand: [97, -58], farWrist: -74 };
const lower = { ...reach, nearHand: [-34, -79], nearWrist: 171, mic: { ...clip, grip: 1 } };
const stowFrames = [[0, speech], [.62, lower], [.72, reach], [1, rest]];

export function sampleLegendMicStow(progress = 0) {
  return groundFeet(sample(stowFrames, clamp(progress)));
}

const mcFrames = [
  [0, rest], [.075, reach], [.15, readyToTap], [.205, touch], [.24, readyToTap],
  [.295, touch], [.333, lift], [.375, call], [.465, deadpan], [.488, deadpan], [.516, flinch],
  [.558, lift], [.607, flow], [.855, flow], [.913, lift], [.965, lower], [1, rest],
];

/** Two checks, a held reaction shot, four-count body accents, then the clip. */
export function sampleLegendMc(progress = 0, voicePhase) {
  const p = clamp(progress);
  const pose = sample(mcFrames, p);
  const flowAmount = ease(.566, .616, p) * (1 - ease(.845, .924, p));
  const count = (p - .607) / .064;
  const cycle = count * Math.PI * 2;
  const downbeat = (.5 + Math.cos(cycle) * .5) ** 4;
  const offbeat = (.5 - Math.cos(cycle) * .5) ** 3;
  const answering = impact(p, .503, .065);
  const vocalClock = voicePhase == null ? cycle * 2.4 : voicePhase * 88;
  const syllable = (.52 + Math.sin(vocalClock) * .48) * flowAmount;
  pose.y += (downbeat * 6 - offbeat * 3) * flowAmount;
  pose.torso += Math.sin(cycle) * 4.5 * flowAmount;
  pose.head += (downbeat * 8 - offbeat * 3) * flowAmount;
  pose.eyes *= 1 - impact(p, .453, .014) * .94;
  pose.farHand[0] += (downbeat * 24 - offbeat * 35) * flowAmount;
  pose.farHand[1] += (downbeat * 17 - offbeat * 39) * flowAmount;
  pose.farWrist += Math.sin(cycle) * 25 * flowAmount;
  pose.pendant += Math.sin(cycle - .7) * 7.5 * flowAmount + answering * 15;
  pose.mouth += syllable * .43;
  pose.mic.tap = Math.max(impact(p, .205, .066), impact(p, .295, .071));
  pose.mic.angle += pose.mic.tap * 2;
  pose.mic.signal = syllable;
  pose.mcBeat = Math.max(answering, downbeat * flowAmount);
  pose.mcPhase = p < .15 ? 'unclip' : p < .333 ? 'tap' : p < .488 ? 'wait' : p < .58 ? 'answer' : p < .913 ? 'flow' : 'clip';
  return groundFeet(pose);
}

function micArt() {
  return `
    <g data-legend-mic-clip="" transform="translate(-32 -81) rotate(-15)">
      <path d="M-12-10-8-15H9l4 7-2 21-7 5H-9l-4-5Z" fill="#130e0a" stroke="#9e621f" stroke-width="2"/>
      <path d="M-10-6v17l4 3M8-9l2 4-2 16" fill="none" stroke="#e6b452" stroke-width="1.7"/>
      <path d="M-9 1H9v7H-9Z" fill="#664118"/><path d="M-8 2H8" stroke="#edc16f" stroke-width="1.1"/>
    </g>
    <path data-legend-mic-cable-shadow="" fill="none" stroke="#0a0604" stroke-width="5" stroke-linecap="round"/>
    <path data-legend-mic-cable="" fill="none" stroke="#e8a936" stroke-width="2" stroke-linecap="round"/>
    <path data-legend-mic-cable-trace="" fill="none" stroke="#fff0a0" stroke-width=".8" stroke-linecap="round" stroke-dasharray="1 7"/>
    <g data-legend-mic-shell="">
      <path d="M-9-26 9-26 8 14 5 24H-5l-3-9Z" fill="#191516" stroke="#070505" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M-8-20h4l2 38-4 1Zm11 0h4l-1 36H4Z" fill="#3d3030"/>
      <path d="M-8-20H8m-7 37h5M-4 21h8" fill="none" stroke="#d8a74a" stroke-width="1.3"/>
      <path d="m-4 23 7 1-1 9-4-1Z" fill="#755021" stroke="#070505" stroke-width="1.9"/>
      <path d="M-11-23-15-31l1-11 4-7 8-3 7 1 4 4 4 2 2 10-3 8-5 4Z" fill="#a57128" stroke="#110c08" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="m-13-36 5-10 6-3 6 1 4 6 5-1 1 9-4 6-5 2h-13Z" fill="#d4a04b"/>
      <path d="m-10-45 8-4 6 1m-15 3 19 17m-21-14 15 16m-16-12 10 12m-4-21 21 18m-17-20 19 15m-1-9-17 17m14-20-20 20m15-21-17 16m10-17-12 12m27-2-13 14" fill="none" stroke="#5e3a16" stroke-width="1.05"/>
      <path d="M-12-40-7-47-2-49m4 1 3 1 4 5 3-1m-23 15 4 2H6l4-2" fill="none" stroke="#ffe08a" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M-10-26H10l-2 4H-8Z" fill="#edbc64" stroke="#573916" stroke-width="1.15"/>
      <path d="M-5-13l2-2v7m2-5 2-2v7m2-5 2-2v7" fill="none" stroke="#ffc757" stroke-width="1.15" stroke-linecap="round"/>
      <g data-legend-mic-grip="">
        <path d="m-9-2 3-2L4-2 7 1 4 3l-7-1 8 2 1 3-3 2-8-2 8 3 1 3-4 2-8-3-3-4Z" fill="#bb8049" stroke="#3e2315" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="m-8-2 7 1m-5 5 8 1m-8 4 7 2" fill="none" stroke="#ffce7a" stroke-width="1.05"/>
      </g>
      <g data-legend-mic-pulse="" fill="none" stroke="#ffd758" stroke-width="1.5" stroke-linecap="round">
        <path d="M-15-54q15-13 30 0M-23-59q23-18 46 0M-4-58l-2-8m15 9 4-9"/>
      </g>
    </g>`;
}

function rotate(x, y, angle) {
  const a = angle * Math.PI / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** Mount in the original actor's torso so hands and prop share coordinates. */
export function createLegendMic(document, actorElement) {
  const parser = new document.defaultView.DOMParser();
  const source = parser.parseFromString(`<svg xmlns="${SVG}"><g data-legend-mic="">${micArt()}</g></svg>`, 'text/html');
  const element = document.importNode(source.querySelector('[data-legend-mic]'), true);
  actorElement.querySelector('[data-actor-torso]').append(element);
  const find = name => element.querySelector(`[data-legend-mic-${name}]`);
  const shell = find('shell');
  const grip = find('grip');
  const pulse = find('pulse');
  const cable = ['cable-shadow', 'cable', 'cable-trace'].map(find);

  function render(mic = clip, pose = {}) {
    const { x, y, angle, grip: holding, tap, signal } = { ...clip, ...mic };
    const [jackDx, jackDy] = rotate(0, 32, angle);
    const jackX = x + jackDx;
    const jackY = y + jackDy;
    const torso = pose.torso ?? 0;
    const tilt = (pose.body ?? 0) + torso;
    const floor = ((pose.ground ?? 909) - (pose.y ?? 711)) / (pose.scale ?? 1);
    const snag = clamp(pose.micSnag ?? 0);
    const [footX, footY, turn = 0] = pose.nearFoot ?? [-37, floor, 0];
    const [toeX, toeY] = rotate(-42, 14, turn);
    const [hookX, hookY] = rotate(footX + toeX, footY + toeY, -torso);
    const [tailX, tailY] = rotate(-115, floor + 6, -tilt);
    const [hangX, hangY] = rotate(-32 - holding * 12, 84, -tilt);
    const [slackX, slackY] = rotate(59 - snag * 35, 8 + snag * 24, -tilt);
    const [wrapX, wrapY] = rotate(-27 * snag, 6 * snag, -tilt);
    const endX = mix(tailX, hookX, snag);
    const endY = mix(tailY, hookY, snag);
    const chord = `M${fmt(jackX)} ${fmt(jackY)}C${fmt(jackX + hangX)} ${fmt(jackY + hangY)} ${fmt(endX + slackX)} ${fmt(endY + slackY)} ${fmt(endX)} ${fmt(endY)}q${fmt(wrapX * .45)} ${fmt(-wrapY)} ${fmt(wrapX)} ${fmt(wrapY)}`;
    element.removeAttribute('visibility');
    shell.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(angle)})`);
    grip.setAttribute('opacity', fmt(holding));
    pulse.setAttribute('opacity', fmt(Math.max(tap * .9, signal * .53)));
    pulse.setAttribute('transform', `translate(0 ${fmt(-tap * 15 - signal * 4)})`);
    for (const path of cable) path.setAttribute('d', chord);
    cable[2].setAttribute('stroke-dashoffset', fmt(-tap * 9 - signal * 8));
  }

  render();
  return { element, render, hide: () => element.setAttribute('visibility', 'hidden') };
}
