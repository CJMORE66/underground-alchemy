/* Scroll-scrubbed choreography for the turntable and the breaking circle. */
import { weightedBreakTrailsAt } from './alchemy-break-weight.js';

const SVG = 'http://www.w3.org/2000/svg';
const radians = Math.PI / 180;
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;
const blend = (a, b, t) => a.map((value, index) => mix(value, b[index], t));
const ease = (from, to, value) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const windowed = (start, full, fade, end, value) => ease(start, full, value) * (1 - ease(fade, end, value));
const fmt = value => value.toFixed(2);

const neutral = {
  hip: [1055, 711], tilt: [0, 0, 0], nearBoot: [1018, 909, 0], farBoot: [1093, 902, 0],
  nearHand: [994, 724], farHand: [1124, 724], brace: 0, eyes: .8,
};

// Choreography is authored in stage coordinates so that boots and the planted
// freeze hand retain their contact points as the hips rotate around them.
function local(point, origin, angle) {
  const x = point[0] - origin[0];
  const y = point[1] - origin[1];
  const c = Math.cos(angle * radians);
  const s = Math.sin(angle * radians);
  return [x * c + y * s, -x * s + y * c];
}

function actorPose(frame) {
  const { hip, tilt, nearBoot, farBoot, nearHand, farHand, eyes } = frame;
  const [x, y] = hip;
  const [body, torso, head] = tilt;
  return {
    x, y, body, torso, head, eyes,
    nearFoot: [...local(nearBoot, hip, body), nearBoot[2] - body],
    farFoot: [...local(farBoot, hip, body), farBoot[2] - body],
    nearHand: local(nearHand, hip, body + torso),
    farHand: local(farHand, hip, body + torso),
  };
}

function scratchAt(progress) {
  const cue = windowed(.03, .16, .21, .39, progress);
  const reach = windowed(.1, .29, .89, .995, progress);
  const onFader = windowed(.23, .39, .89, .995, progress);
  const hang = windowed(.31, .39, .43, .51, progress);
  const spin = windowed(.47, .54, .82, .9, progress);
  const scratch = Math.sin((progress - .51) * Math.PI * 15) * spin;
  const fader = Math.sin((progress - .54) * Math.PI * 19) * spin;
  const bob = Math.sin(progress * Math.PI * 18) * spin;
  return { cue, reach, onFader, hang, spin, scratch, fader, bob };
}

export function sampleLegendDj(progress = 0) {
  const { cue, reach, onFader, hang, scratch, fader, bob } = scratchAt(clamp(progress));
  const frame = {
    ...neutral,
    hip: [1055 - 11 * reach + 6 * bob, 711 + 7 * reach - 4 * bob],
    tilt: [-4 * reach + 3 * bob, -4 * reach - 4 * hang, 13 * cue + 18 * hang + 7 * bob],
    nearHand: blend(neutral.nearHand, [932 + 26 * scratch, 713 + 4 * scratch], reach),
    farHand: blend(blend(neutral.farHand, [1110, 559], cue), [1139 + 14 * fader, 715 - 2 * fader], onFader),
    eyes: .8 - .34 * hang + .17 * Math.abs(bob),
  };
  const pose = actorPose(frame);
  pose.nearOpen = ease(.15, .76, reach);
  pose.nearWrist = mix(-22, -87, reach) - pose.body - pose.torso;
  return pose;
}

export { sampleLegendBreak, breakCameraAt, createBreakCan } from './alchemy-breaking.js?v=1';

let nextArtwork = 0;

export function createLegendDjBreakArt(document, actorElement) {
  const id = `ua-legend-deck-${++nextArtwork}`;
  const parser = new document.defaultView.DOMParser();
  const source = parser.parseFromString(`
    <svg xmlns="${SVG}" viewBox="0 0 1536 1024" aria-hidden="true" focusable="false" class="ua-legend-dj-break-art">
    <defs>
      <radialGradient id="${id}-light">
        <stop stop-color="#ffc02e" stop-opacity=".23"/><stop offset="1" stop-color="#c16612" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <g data-legend-deck="" display="none">
      <ellipse cx="1043" cy="917" rx="312" ry="84" fill="url(#${id}-light)"/>
    </g>
    <g data-legend-circle="" display="none">
      <ellipse cx="1036" cy="921" rx="300" ry="76" fill="url(#${id}-light)"/>
      <ellipse cx="1036" cy="922" rx="236" ry="37" fill="none" stroke="#e6a438" stroke-width="1.5" opacity=".55"/>
      <ellipse data-legend-ring="" cx="1036" cy="922" rx="229" ry="33" fill="none" stroke="#ffd857" stroke-width="2" stroke-dasharray="5 21 9 42 84 25"/>
      <path d="M791 924h48m396 0h50m-257-47 8-6 8 6m-13 88 5 7 6-7" fill="none" stroke="#eab349" stroke-width="1.5" opacity=".6"/>
      <g data-legend-sole-trails="" opacity="0" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="#f6bf46" opacity=".60" stroke-width="3.8"/><path stroke="#cb7d20" opacity=".55" stroke-width="2.5"/>
      </g>
      <g data-legend-brace="" transform="translate(1008 928)" fill="#ffda61">
        <path d="m-6-4-27-13 22 18Zm20 2 24-10-12 11Zm-17-7-9-15 4 17Zm19 1 8-16-13 18Z"/>
        <circle cx="-40" cy="-12" r="2.2"/><circle cx="38" cy="-3" r="1.6"/>
        <path d="M-44 0Q0-11 49 0M-29 6h62" fill="none" stroke="#ffb831" stroke-width="2"/>
      </g>
      <g data-legend-heel="" transform="translate(1032 927)" fill="#ffda61">
        <path d="m0-2-9-21 14 18Zm10 0 22-12-16 15Z"/><path d="M-21 1h50m-42 5h22" fill="none" stroke="#f1a530" stroke-width="2"/>
      </g>
    </g></svg>`, 'image/svg+xml');
  const element = document.importNode(source.documentElement, true);
  const frontSource = parser.parseFromString(`
    <svg xmlns="${SVG}" viewBox="0 0 1536 1024" aria-hidden="true" focusable="false" class="ua-legend-dj-break-front" style="display:none">
      <defs>
        <linearGradient id="${id}-deck" x2="0" y2="1">
          <stop stop-color="#352b22"/><stop offset=".27" stop-color="#1b1613"/><stop offset="1" stop-color="#0b0807"/>
        </linearGradient>
        <linearGradient id="${id}-brass" x1="0" y1="1" x2="1" y2="0">
          <stop stop-color="#613308"/><stop offset=".45" stop-color="#e7a42d"/><stop offset=".6" stop-color="#ffde67"/><stop offset="1" stop-color="#8c5115"/>
        </linearGradient>
        <linearGradient id="${id}-cabinet" x1="0" y1="0" x2=".72" y2="1">
          <stop stop-color="#211910"/><stop offset=".38" stop-color="#130f0b"/><stop offset="1" stop-color="#080706"/>
        </linearGradient>
        <linearGradient id="${id}-trim" x2="0" y2="1">
          <stop stop-color="#cb9248"/><stop offset=".24" stop-color="#76512c"/><stop offset="1" stop-color="#342213"/>
        </linearGradient>
        <clipPath id="${id}-hands"><path data-deck-window="" d="m841 714 377-1 25 54-420 2Z"/></clipPath>
      </defs>
      <g data-deck-edge="">
        <ellipse cx="1035" cy="975" rx="220" ry="16" fill="#080605" opacity=".75"/>
        <path d="m1228 788 15-19-5 173-15 25Z" fill="#0c0907" stroke="#58391c" stroke-width="2.6"/>
        <path d="m846 789 384-2-7 180-370 2Z" fill="url(#${id}-cabinet)" stroke="#322012" stroke-width="4"/>
        <path d="m856 800 363-2-6 158-350 2Z" fill="none" stroke="url(#${id}-trim)" stroke-width="2.8"/>
        <path d="m867 809 342-2-6 140-331 2Z" fill="#0e0b09" stroke="#372719" stroke-width="1.4"/>
        <path d="M869 823h92m153-1h93m-339 114h73m194-1h70" fill="none" stroke="#594022" stroke-width="1.3"/>
        <path d="M1037 829l28 43-28 28-28-28Z" fill="#171109" stroke="#7b552c" stroke-width="1.6"/>
        <path d="m1037 841 18 30-18 16-18-16Zm-9 30h18m-9-17v25" fill="none" stroke="#ca9250" stroke-width="1.4"/>
        <path d="m855 966 22 0 1 9h-21Zm341-2h24l-1 9h-24Z" fill="#100b07" stroke="#56391d" stroke-width="1.8"/>
        <path d="m1227 826 9-13m-10 40 9-13m-10 40 9-13m-10 40 9-13" fill="none" stroke="#6c4c2b" stroke-width="1.6"/>
        <path d="m842 722 373-1 34 48-15 22-390 1-24-19Z" fill="#090706" stroke="#583419" stroke-width="4"/>
        <path d="m844 721 370-1 29 46-420 2Z" fill="url(#${id}-deck)" stroke="url(#${id}-brass)" stroke-width="2.8"/>
        <ellipse cx="925" cy="744" rx="71" ry="20" fill="#090807" stroke="#a87526" stroke-width="2"/>
        <g transform="translate(925 742) scale(1 .26)">
          <g data-legend-record="">
            <circle r="65" fill="#100d0b" stroke="#d8a640" stroke-width="2"/>
            <circle r="58" fill="none" stroke="#644c37" stroke-width="4"/>
            <circle r="49" fill="none" stroke="#79572c" stroke-width="2"/>
            <circle r="41" fill="none" stroke="#3f3128" stroke-width="4"/>
            <circle r="29" fill="#2f2118" stroke="#bb7f25" stroke-width="2"/>
            <path d="M-14 14 0-21 14 14ZM-62-7l14 3m96 16 13 4M18-57l5 13m-38 91-3 14" fill="none" stroke="#ffdf62" stroke-width="4"/>
            <circle r="3.6" fill="#fff4ac"/>
          </g>
        </g>
        <path d="M997 728h19v5l-12 16-18 4m10-27h25" fill="none" stroke="#e5b150" stroke-width="3" stroke-linecap="round"/>
        <path d="m1059 724 130-1 13 37-143 1Z" fill="#0d0b0a" stroke="#795225" stroke-width="2"/>
        <path d="m1121 748 62-.6m-63 3 65-.6m-66-15h55" fill="none" stroke="#8b6936" stroke-width="1"/>
        <g fill="#ffbb3b"><circle cx="1073" cy="731" r="2"/><circle cx="1081" cy="731" r="2"/><circle cx="1089" cy="731" r="2"/></g>
        <g data-legend-meters="" fill="#ffbd3c"><path d="M1069 747h30v2h-30zm1 4h24v2h-24zm1 4h19v2h-19z"/></g>
        <path d="M1123 754v3m11-3v3m11-3v3m11-3v3m11-3v3m11-3v3" stroke="#b07a30"/>
        <rect data-legend-fader="" x="1132" y="743" width="14" height="8" rx="2" fill="#f1c456" stroke="#2a170d" stroke-width="1.3"/>
        <g data-legend-trace="" fill="none" stroke-linecap="round">
          <path d="M852 742q-8-24 29-35m-24 46q-5-17 15-28m123 17q-4 22-28 26m-10 3-14 2" stroke="#ffcf57" stroke-width="2"/>
          <path d="M864 726q19-24 67-22m61 44q-9 14-21 16" stroke="#d76620" stroke-width="3"/>
          <path d="m852 714 5-8m-16 17-8 3m164 35 10-5m-9 11 6 4" stroke="#ffe985" stroke-width="2"/>
        </g>
        <path d="m828 773 412-2-9 18-386 1Z" fill="#120d0a" stroke="#986323" stroke-width="2"/>
        <path d="M833 778h403m-385 8h87m267-1h17" fill="none" stroke="#f1a427" opacity=".58"/>
        <path d="m960 781 8 0-3 3h-8Zm16 0h8l-3 3h-8Zm16 0h8l-3 3h-8Z" fill="#ac782e"/>
        <path d="m1015 777 34 0-7 10h-20Z" fill="#332113" stroke="#bf8a37" stroke-width=".8"/>
        <path d="m1026 780 3 5m3-5 3 5m3-5 3 5" fill="none" stroke="#ffe382" stroke-width=".9"/>
      </g>
      <g clip-path="url(#${id}-hands)"><g data-deck-hand-layer=""></g></g>
      <g data-deck-headset="">
        <path d="M-55-42Q-54-72-27-88 1-109 31-88 55-71 58-43" fill="none" stroke="#110d0a" stroke-width="10"/>
        <path d="M-54-48Q-50-73-25-89 1-107 29-88 52-72 57-48" fill="none" stroke="#a96d27" stroke-width="2"/>
        <path d="m-55-45-9 8 2 23 10 6 6-5-1-24Zm111 0 11 8-2 23-11 8-7-6 1-25Z" fill="#1c1411" stroke="#f1bb54" stroke-width="2.2"/>
        <path d="m61-36 2 13-4 10m-114-21-2 16" fill="none" stroke="#925723" stroke-width="2"/>
        <circle data-deck-headlight="" cx="58" cy="-24" r="2.8" fill="#fff1a3"/>
      </g>
    </svg>`, 'image/svg+xml');
  const foreground = document.importNode(frontSource.documentElement, true);
  const edge = foreground.querySelector('[data-deck-edge]');
  const handWindow = foreground.querySelector('[data-deck-window]');
  const handLayer = foreground.querySelector('[data-deck-hand-layer]');
  // The cabinet occludes the body. Only the portions of the real arms over
  // the controls are composited again, keeping the same hands and transforms.
  for (const side of ['far', 'near']) {
    const arm = actorElement?.querySelector(`[data-actor-arm="${side}"]`);
    if (!arm) continue;
    const ref = `${id}-${side}-arm`;
    arm.setAttribute('id', ref);
    const hand = document.createElementNS(SVG, 'use');
    hand.setAttribute('href', `#${ref}`);
    handLayer.append(hand);
  }
  const headset = foreground.querySelector('[data-deck-headset]');
  const headlight = foreground.querySelector('[data-deck-headlight]');
  const part = name => element.querySelector(`[data-legend-${name}]`);
  const deck = part('deck');
  const record = foreground.querySelector('[data-legend-record]');
  const fader = foreground.querySelector('[data-legend-fader]');
  const meters = foreground.querySelector('[data-legend-meters]');
  const trace = foreground.querySelector('[data-legend-trace]');
  const circle = part('circle');
  const ring = part('ring');
  const trail = part('sole-trails');
  const brace = part('brace');
  const heel = part('heel');
  let lastScene;

  function render(scene, progress = 0) {
    const p = clamp(progress);
    if (lastScene !== scene) {
      deck.setAttribute('display', scene === 'dj' ? 'inline' : 'none');
      foreground.style.display = scene === 'dj' ? 'block' : 'none';
      circle.setAttribute('display', scene === 'breaking' ? 'inline' : 'none');
      lastScene = scene;
    }
    if (scene === 'dj') {
      const { cue, hang, scratch, spin, fader: slider } = scratchAt(p);
      const appear = windowed(0, .09, .91, 1, p);
      const drift = ease(0, .32, p) * 150 + ease(.84, 1, p) * 140;
      const lift = `translate(0 ${fmt(-29 + (1 - appear) * 21)})`;
      const { x, y, body, torso, head } = sampleLegendDj(p);
      deck.setAttribute('opacity', fmt(appear));
      deck.setAttribute('transform', lift);
      foreground.setAttribute('opacity', fmt(appear));
      edge.setAttribute('transform', lift);
      handWindow.setAttribute('transform', lift);
      handLayer.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(body + torso)})`);
      headset.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(body + torso)}) translate(0 -154) rotate(${fmt(head)})`);
      headlight.setAttribute('opacity', fmt(.42 + cue * .58));
      record.setAttribute('transform', `rotate(${fmt(drift + scratch * 58)})`);
      fader.setAttribute('x', fmt(1132 + slider * 14));
      meters.setAttribute('opacity', fmt(.38 + Math.abs(slider) * .62));
      trace.setAttribute('opacity', fmt((.13 + Math.abs(scratch) * .87) * spin * (1 - hang)));
    } else if (scene === 'breaking') {
      circle.setAttribute('opacity', fmt(windowed(0, .14, .92, 1, p)));
      ring.setAttribute('stroke-dashoffset', fmt(-p * 290));
      const { visible, paths } = weightedBreakTrailsAt(p);
      trail.setAttribute('opacity', fmt(visible));
      if (visible) paths.forEach((path, i) => trail.children[i].setAttribute('d',path));
      brace.setAttribute('opacity', fmt(windowed(.39, .401, .42, .449, p)));
      heel.setAttribute('opacity', fmt(windowed(.617, .634, .653, .70, p)));
    }
  }

  return { element, foreground, render };
}
