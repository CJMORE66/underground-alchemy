import { createPrologueActor } from './alchemy-prologue-actor.js?v=4';
import { createBreakSkin } from './alchemy-break-skin.js';
import { sampleWeightedBreak } from './alchemy-break-weight.js';

const SVG = 'http://www.w3.org/2000/svg';
const clips = {
  step: [0, .046],
  turn: [.626, .735],
  freeze: [.279, .348],
};
const resting = sampleWeightedBreak(0);
let nextShadow = 0;

function localPoint(x, y, angle, point) {
  const radians = angle * Math.PI / 180;
  const dx = point[0] - x;
  const dy = point[1] - y;
  return [dx * Math.cos(radians) + dy * Math.sin(radians), dy * Math.cos(radians) - dx * Math.sin(radians)];
}

function tieBoot(progress, looksUp = false) {
  const x = 1010;
  const y = 804;
  const body = 77;
  const torso = 11;
  const tug = Math.sin(progress * Math.PI) * 6;
  return {
    x, y, body, torso, head: looksUp ? 8 : 27, eyes: .48, pendant: -66,
    nearFoot: [...localPoint(x, y, body, [965, 904]), -body],
    farFoot: [...localPoint(x, y, body, [1130, 907]), -body],
    nearHand: localPoint(x, y, body + torso, [1123 - tug, 886 - tug]),
    farHand: localPoint(x, y, body + torso, [1138 + tug, 885 - tug]),
  };
}

function makeSvg(doc, tag, attributes = {}) {
  const element = doc.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function inkShadow(doc, element) {
  const id = `shadow-quest-ink-${++nextShadow}`;
  const filter = makeSvg(doc, 'filter', { id, x: '-15%', y: '-15%', width: '130%', height: '130%' });
  filter.append(
    makeSvg(doc, 'feFlood', { 'flood-color': '#100b14', result: 'shadowInk' }),
    makeSvg(doc, 'feComposite', { in: 'shadowInk', in2: 'SourceAlpha', operator: 'in', result: 'silhouette' }),
    makeSvg(doc, 'feDropShadow', { in: 'silhouette', dx: '0', dy: '0', stdDeviation: '4', 'flood-color': '#f5ae4f', 'flood-opacity': '.72' }),
  );
  element.querySelector('defs').append(filter);
  element.querySelector('[data-actor-body]').setAttribute('filter', `url(#${id})`);
}

function placeActor(doc, mount, box) {
  const actor = createPrologueActor(doc);
  const { element } = actor;
  for (const [name, value] of Object.entries(box)) element.setAttribute(name, value);
  element.setAttribute('viewBox', '851 418 425 512');
  element.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  for (const layer of ['glow', 'shadow', 'impact']) {
    element.querySelector(`[data-actor-${layer}]`).setAttribute('display', 'none');
  }
  mount.append(element);
  return actor;
}

export function createShadowQuestRig(stage) {
  const performer = stage?.querySelector('[data-shadow-performer]');
  const projection = stage?.querySelector('[data-shadow-dancer]');
  if (!performer || !projection) return null;

  const doc = stage.ownerDocument;
  const foreground = placeActor(doc, performer, { x: 46, y: 24, width: 288, height: 252 });
  const shadow = placeActor(doc, projection, { x: 352, y: 84, width: 244, height: 192 });
  createBreakSkin(doc, foreground.element).setActive(true);
  inkShadow(doc, shadow.element);

  function render(move, progress = 1, performing = false) {
    const time = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 1;
    const clip = Object.hasOwn(clips, move) ? clips[move] : null;
    foreground.pose(tieBoot(performing ? time : 1, !performing && Boolean(clip)));
    if (!clip) {
      shadow.pose(resting);
      return;
    }
    const [start, end] = clip;
    // A freeze reaches its support early and holds it through the end of the beat.
    const phase = move === 'freeze' ? Math.min(1, time / .65) : time;
    shadow.pose(sampleWeightedBreak(start + (end - start) * phase));
  }

  render('idle');
  return { render };
}
