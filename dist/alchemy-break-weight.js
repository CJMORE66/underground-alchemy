/* Stage-space support points for the opening floorwork and one-hand pivot. */
import { breakTrailsAt, sampleLegendBreak } from './alchemy-breaking.js?v=1';

const radians = Math.PI / 180;
const firstSpin = .395;
const pivot = [1008, 907];
const palm = [924, 911];
const interpolate = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t);

function smooth(start, end, progress) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function rotate([x, y], degrees) {
  const c = Math.cos(degrees * radians);
  const s = Math.sin(degrees * radians);
  return [x * c - y * s, x * s + y * c];
}

function local(point, [x, y], angle) {
  return rotate([point[0] - x, point[1] - y], -angle);
}

function world(point, [x, y], angle) {
  const [dx, dy] = rotate(point, angle);
  return [x + dx, y + dy];
}

function at(keys, p) {
  const next = keys.findIndex(([time]) => time >= p);
  if (next < 0) return keys.at(-1)[1];
  if (next === 0) return keys[0][1];
  const [start, first] = keys[next - 1];
  const [end, last] = keys[next];
  return interpolate(first, last, smooth(start, end, p));
}

// The weight sinks after the first step, crosses the planted foot and then
// rises into the handspin. Torso and head follow the pelvis at different times.
const hips = [
  [0, [1055, 711]],
  [.041, [1074, 739]],
  [.086, [1033, 802]],
  [.132, [1046, 813]],
  [.192, [1075, 797]],
  [.237, [1063, 810]],
  [.284, [1082, 788]],
  [.347, [1046, 740]],
];
const posture = [
  [0, [0, 0, 0]],
  [.032, [-14, 9, 6]],
  [.076, [-53, -7, 22]],
  [.117, [-64, -6, 38]],
  [.178, [-55, -3, 28]],
  [.229, [-66, -5, 33]],
  [.279, [-73, -3, 30]],
  [.347, [-124, 3, 15]],
];
const freeHand = [
  [0, [1124, 724]],
  [.046, [1100, 666]],
  [.092, [1065, 712]],
  [.145, [1080, 758]],
  [.208, [1106, 694]],
  [.263, [1071, 742]],
  [.308, [1026, 770]],
  [.347, [1006, 795]],
];

const leftBoot = [
  [.069, [1018, 909, 0]], [.106, [1038, 874, -24]], [.158, [1086, 910, 0]],
  [.238, [1086, 910, 0]], [.272, [1162, 847, -9]], [.325, [1205, 772, -32]],
  [.347, [1198, 729, -39]],
];
const rightBoot = [
  [0, [1093, 902, 0]], [.034, [1154, 874, 20]], [.064, [1140, 906, 0]],
  [.152, [1140, 906, 0]], [.183, [1178, 858, 28]], [.206, [1098, 856, 26]],
  [.238, [1009, 902, 0]], [.262, [1009, 902, 0]], [.301, [1108, 837, 10]],
  [.347, [1113, 688, -68]],
];

function nearKneeBend(p) {
  // The outside knee turns out as the sweeping shoe crosses the body.
  return 1 - .43 * smooth(.088, .136, p) * (1 - smooth(.298, .35, p));
}

function releasePalm(p) {
  return 31 * smooth(.264, .323, p) * (1 - smooth(.339, firstSpin, p));
}

function floorwork(p) {
  const hip = at(hips, p);
  const [body, torso, head] = at(posture, p);
  const spine = body + torso;
  const supported = smooth(.051, .074, p);
  const rising = smooth(.263, .351, p);
  const wrist = interpolate([994 - 50 * smooth(0, .055, p), 724 + 76 * smooth(.029, .066, p)], palm, supported);
  // Keep the palm nailed while the boots sweep. Push off it before changing
  // to the higher handspin pivot.
  wrist[0] += 41 * rising;
  wrist[1] -= 2 * rising;
  const foot = path => {
    const boot = at(path, p);
    return [...local(boot, hip, body), boot[2] - body];
  };
  const yaw = -.16 * supported + .28 * rising;
  return {
    x: hip[0], y: hip[1], body, torso, head,
    nearFoot: foot(leftBoot), farFoot: foot(rightBoot),
    nearHand: local(wrist, hip, spine), farHand: local(at(freeHand, p), hip, spine),
    nearWrist: -spine + (-22 + 103 * supported),
    nearOpen: supported * .96, nearKneeBend: nearKneeBend(p),
    spinYaw: yaw,
    eyes: .92 - .2 * supported + .15 * rising,
    shadowX: hip[0] * (1 - .27 * supported) + wrist[0] * .27 * supported,
    shadowScale: 1.04 - .22 * rising,
    pendant: -spine * .72 + Math.sin(p * 54) * 5 * supported,
  };
}

function groundWrist(pose, contact, stretch) {
  const before = [pose.x, pose.y];
  const spine = pose.body + pose.torso;
  const profile = 1 - .44 * Math.sin(pose.spinYaw ?? 0) ** 2;
  const shoulder = world([-53 * profile, -125], before, spine);
  const dx = shoulder[0] - contact[0];
  const dy = shoulder[1] - contact[1];
  const reach = Math.hypot(dx, dy);
  const preferredReach = Math.max(116, Math.min(145, reach));
  const correction = (preferredReach / Math.max(reach, 1) - 1) * stretch;
  const hip = [pose.x + dx * correction, pose.y + dy * correction];
  const repositionFoot = foot => [...local(world(foot, before, pose.body), hip, pose.body), foot[2]];
  return {
    ...pose,
    x: hip[0], y: hip[1],
    nearFoot: repositionFoot(pose.nearFoot), farFoot: repositionFoot(pose.farFoot),
    nearHand: local(contact, hip, spine), farHand: local(world(pose.farHand, before, spine), hip, spine),
  };
}

export function sampleWeightedBreak(progress = 0) {
  const p = Math.max(0, Math.min(1, progress));
  const original = sampleLegendBreak(p);
  if (p >= .596) return original;
  if (p >= firstSpin) return groundWrist(original, pivot, 1 - smooth(.575, .596, p));
  const contact = floorwork(p);
  const palmLift = releasePalm(p);
  if (p < .302) {
    const hip = [contact.x, contact.y];
    const spine = contact.body + contact.torso;
    const wrist = world(contact.nearHand, hip, spine);
    return { ...contact, nearHand: local([wrist[0], wrist[1] - palmLift], hip, spine) };
  }
  const target = groundWrist(original, world(original.nearHand, [original.x, original.y], original.body + original.torso), 1);
  const handoff = smooth(.302, firstSpin, p);
  const mixValue = (first, last) => first + (last - first) * handoff;
  // The handoff mixes in stage space so the elbow is not flung across the
  // body by the different pelvis rotations of the two sequences.
  const hip = [mixValue(contact.x, target.x), mixValue(contact.y, target.y)];
  const body = mixValue(contact.body, target.body);
  const torso = mixValue(contact.torso, target.torso);
  const mixPoint = (a, b, angleA, angleB, angle) => local(interpolate(
    world(a, [contact.x, contact.y], angleA), world(b, [target.x, target.y], angleB), handoff,
  ), hip, angle);
  const foot = key => [
    ...mixPoint(contact[key], target[key], contact.body, target.body, body),
    mixValue(contact[key][2] + contact.body, target[key][2] + target.body) - body,
  ];
  const nearHand = mixPoint(contact.nearHand, target.nearHand, contact.body + contact.torso, target.body + target.torso, body + torso);
  const wrist = world(nearHand, hip, body + torso);
  return {
    ...target,
    x: hip[0], y: hip[1], body, torso,
    head: mixValue(contact.head, target.head),
    nearFoot: foot('nearFoot'), farFoot: foot('farFoot'),
    nearHand: local([wrist[0], wrist[1] - palmLift], hip, body + torso),
    farHand: mixPoint(contact.farHand, target.farHand, contact.body + contact.torso, target.body + target.torso, body + torso),
    nearWrist: mixValue(contact.nearWrist + contact.body + contact.torso, target.nearWrist + target.body + target.torso) - body - torso,
    nearOpen: mixValue(contact.nearOpen, target.nearOpen),
    nearKneeBend: nearKneeBend(p),
    spinYaw: mixValue(contact.spinYaw, target.spinYaw),
    eyes: mixValue(contact.eyes, target.eyes),
    shadowX: mixValue(contact.shadowX, target.shadowX),
    shadowScale: mixValue(contact.shadowScale, target.shadowScale ?? 1),
    pendant: mixValue(contact.pendant, target.pendant),
  };
}

export function weightedBreakTrailsAt(progress) {
  const { visible, paths } = breakTrailsAt(progress);
  if (!visible || progress >= .615) return { visible, paths };
  const points = [[], []];
  for (let step = 0; step < 8; step++) {
    const pose = sampleWeightedBreak(progress - (7 - step) * .00195);
    [pose.nearFoot, pose.farFoot].forEach((boot, side) => {
      const [x, y] = world(boot, [pose.x, pose.y], pose.body);
      points[side].push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    });
  }
  return { visible, paths: points.map(path => 'M' + path.join(' L')) };
}
