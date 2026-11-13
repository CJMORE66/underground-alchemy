/* The approved ink artwork follows the same articulated rig during breaking. */
const SVG = 'http://www.w3.org/2000/svg';
const atlas = '/assets/alchemy-motion/iris-guide-detail.webp';
let nextSkin = 0;
let nextCrop = 0;

const crops = {
  hood: [0, 0, 156, 181], coat: [160, 0, 219, 306],
  upper: [383, 0, 101, 130], fore: [488, 0, 94, 132],
  thigh: [0, 310, 152, 222], shin: [156, 310, 131, 192],
  boot: [291, 310, 84, 157], hand: [379, 310, 53, 82],
};

// Source joint coordinates are local to each crop. Straightening the two
// anchors along the bone keeps the illustrated cuffs and knees attached.
const joints = {
  upper: { from: [43, 19], to: [42, 113], length: 78, width: .7 },
  fore: { from: [68, 18], to: [49, 118], length: 72, width: .64 },
  thigh: { from: [108, 19], to: [65, 187], length: 111, width: .56 },
  shin: { from: [81, 22], to: [54, 175], length: 107, width: .53 },
  boot: { from: [46, 53], to: [38, 137], length: 37, width: .92, toe: -29, top: -19 },
  hand: { from: [34, 7], to: [19, 72], length: 25, width: .53, toe: -4 },
};

function make(document, name, attributes) {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

function panel(document, part, x, y, width, height) {
  const [sourceX, sourceY, sourceWidth, sourceHeight] = crops[part];
  const id = `break-ink-crop-${++nextCrop}`;
  const node = make(document, 'g', {
    transform: `translate(${x} ${y}) scale(${width / sourceWidth} ${height / sourceHeight})`,
  });
  const clip = make(document, 'clipPath', { id });
  clip.append(make(document, 'rect', { width: sourceWidth, height: sourceHeight }));
  const image = make(document, 'g', { 'clip-path': `url(#${id})` });
  image.append(make(document, 'image', {
    href: atlas, x: -sourceX, y: -sourceY, width: 600, height: 532, preserveAspectRatio: 'none',
  }));
  node.append(clip, image);
  return node;
}

function jointPanel(document, part, { from, to, length, width, toe = 0, top = 0 }) {
  const dy = to[1] - from[1];
  const yScale = length / dy;
  const shear = (toe - width * (to[0] - from[0])) / dy;
  const xOffset = -width * from[0] - shear * from[1];
  const yOffset = top - yScale * from[1];
  const group = make(document, 'g', {
    transform: `matrix(${width} 0 ${shear} ${yScale} ${xOffset} ${yOffset})`,
  });
  group.append(panel(document, part, 0, 0, crops[part][2], crops[part][3]));
  return group;
}

function openHand(document, id) {
  const group = make(document, 'g', {});
  const shade = make(document, 'linearGradient', { id: `${id}-hand-light`, x2: 1, y2: .84 });
  for (const [offset, color] of [[0, '#d7a05b'], [.35, '#996031'], [.75, '#603b24'], [1, '#3a2418']]) {
    shade.append(make(document, 'stop', { offset, 'stop-color': color }));
  }
  group.append(shade, make(document, 'path', {
    d: 'M-9-3q-4-7-7-11l-6-10q-2-6 2-7 3-1 7 6l6 9 2-16q1-6 5-5 3 1 3 6l-1 12 4-15q2-5 5-4 3 1 2 6l-3 15 6-12q2-4 5-2 3 2 1 6l-7 15 5-4q5-4 7-1 2 3-2 7l-10 9-5 10-13 2-5-6Z',
    fill: `url(#${id}-hand-light)`, stroke: '#28180e', 'stroke-width': 1.7, 'stroke-linejoin': 'round',
  }), make(document, 'path', {
    d: 'M-11-7q5-5 11-3m-9 6q4-2 8 0m-2 7q3-6 11-9m-10-8 6-2m-14 8 4-4',
    fill: 'none', stroke: '#4d2e1a', 'stroke-width': 1.3, 'stroke-linecap': 'round',
  }), make(document, 'path', {
    d: 'm-4-30 1-4m9 7 2-5m8 10 2-4M-9 2l2 4', fill: 'none',
    stroke: '#e5ad62', 'stroke-width': 1.15, 'stroke-linecap': 'round', opacity: .64,
  }));
  return group;
}

function surface(actor, target, back, texture) {
  const group = actor.querySelector(`[data-actor-${target}]`);
  const reverse = group.querySelector(`[data-actor-${back}]`);
  const artwork = [...group.children].filter(child => child !== reverse);
  group.insertBefore(texture, reverse);
  texture.setAttribute('display', 'none');
  return active => {
    texture.setAttribute('display', active ? 'inline' : 'none');
    for (const child of artwork) {
      if (active) child.setAttribute('display', 'none');
      else child.removeAttribute('display');
    }
  };
}

export function createBreakSkin(document, actorElement) {
  const id = `break-ink-${++nextSkin}`;
  const defs = actorElement.querySelector('defs');
  const swaps = [];
  for (const part of [...Object.keys(joints), 'palm']) {
    const drawing = part === 'palm' ? openHand(document, id) : jointPanel(document, part, joints[part]);
    const variant = make(document, 'g', { id: `${id}-${part}` });
    variant.append(drawing);
    defs.append(variant);
    for (const use of actorElement.querySelectorAll(`use[data-part="${part}"]`)) {
      swaps.push([use, use.getAttribute('href'), `#${id}-${part}`]);
    }
  }
  const coat = surface(actorElement, 'coat', 'coat-back', panel(document, 'coat', -76, -163, 152, 204));
  const hood = surface(actorElement, 'head', 'hood-back', panel(document, 'hood', -67, -106, 134, 138));
  const preload = typeof Image === 'function' ? new Image() : null;
  let ready = !preload;
  let requested = false;
  let applied = false;

  function setActive(active) {
    requested = active;
    const next = active && ready;
    if (next === applied) return;
    applied = next;
    actorElement.toggleAttribute('data-break-skin', next);
    coat(next);
    hood(next);
    for (const [use, regular, inked] of swaps) use.setAttribute('href', next ? inked : regular);
  }
  if (preload) {
    preload.addEventListener('load', () => { ready = true; setActive(requested); }, { once: true });
    preload.src = atlas;
  }
  return { setActive };
}
