/* The pivot is a point on the floor, so a scrub in either direction has the same contacts. */
const clamp = v => Math.max(0, Math.min(1, v));
const rad = Math.PI / 180;
const tau = 2 * Math.PI;
const mix = (a, b, t) => a + (b - a) * t;
const lerp = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
const range = (a, b, p) => clamp((p - a) / (b - a));
function ease(a, b, p) {
  const t = range(a, b, p);
  return t * t * (3 - 2 * t);
}
const pulse = (a, b, c, d, p) => ease(a, b, p) * (1 - ease(c, d, p));
function turn([x, y], degrees) {
  const angle = degrees * rad;
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
}
function pointLocal([x, y], [hx, hy], angle) { return turn([x - hx, y - hy], -angle); }
function frame(hip, body, torso, head, leftBoot, rightBoot, leftHand, rightHand) {
  return { hip, body, torso, head, leftBoot, rightBoot, leftHand, rightHand };
}
function blendFrame(a, b, t) {
  return frame(lerp(a.hip, b.hip, t), mix(a.body, b.body, t), mix(a.torso, b.torso, t), mix(a.head, b.head, t),
    lerp(a.leftBoot, b.leftBoot, t), lerp(a.rightBoot, b.rightBoot, t), lerp(a.leftHand, b.leftHand, t), lerp(a.rightHand, b.rightHand, t));
}
const upright = frame([1055,711], 0,0,0, [1018,909,0],[1093,902,0], [994,724],[1124,724]);
// Sweep, hook, retract, switch the supporting arm, cross and kick through.
const steps = [
  [0, upright],
  [.034, frame([1040,738],-16,4,9, [1018,909,0],[1131,868,20], [928,740],[1098,697])],
  [.070, frame([1043,809],-72,-4,31, [965,901,-17],[1111,907,6], [890,907],[1040,732])],
  [.105, frame([1048,813],-78,-3,33, [1011,863,-28],[1171,902,19], [890,907],[1018,718])],
  [.140, frame([1044,802],-63,-5,27, [1105,903,11],[1171,902,19], [890,907],[1077,728])],
  [.175, frame([1061,813],-92,-5,26, [1105,903,11],[968,864,-33], [908,908],[978,880])],
  [.207, frame([1054,817],-99,-5,31, [1189,878,-8],[980,902,-8], [936,800],[947,909])],
  [.238, frame([1044,813],-95,-9,26, [1043,869,-28],[980,902,-8], [913,884],[947,909])],
  [.268, frame([1046,812],-79,2,29, [1003,908,-2],[1203,857,26], [919,908],[955,889])],
  [.298, frame([1059,795],-87,-4,28, [1116,903,12],[1191,784,18], [919,908],[1021,770])],
  [.332, frame([1031,770],-122,0,17, [1171,807,-19],[1190,708,-38], [939,910],[972,819])],
  [.354, frame([1037,748],-133,0,14, [1185,801,-27],[1159,638,-57], [963,909],[1005,853])],
];

function fromStage(f) {
  const foot = b => [...pointLocal(b, f.hip, f.body), b[2] - f.body];
  return { x:f.hip[0], y:f.hip[1], body:f.body, torso:f.torso, head:f.head,
    nearFoot:foot(f.leftBoot), farFoot:foot(f.rightBoot),
    nearHand:pointLocal(f.leftHand,f.hip,f.body+f.torso), farHand:pointLocal(f.rightHand,f.hip,f.body+f.torso), eyes:.92 };
}
// Constrain targets in actor space after projection so a far limb never stretches.
function limitReach(target, sx, sy, radius) {
  const dx=target[0]-sx, dy=target[1]-sy, distance=Math.hypot(dx,dy);
  if (distance <= radius) return;
  target[0]=sx+dx*radius/distance;
  target[1]=sy+dy*radius/distance;
}
function between(keys, p) {
  const i = keys.findIndex(([at]) => at >= p);
  if (i <= 0) return keys[i === 0 ? 0 : keys.length - 1][1];
  const [a, start] = keys[i-1], [b, end] = keys[i];
  return blendFrame(start, end, ease(a,b,p));
}

const spinStart = .395, headStart = .626, headEnd = .761, handPivot = [1008,907], crown = [1032,925];
// Project a straddled leg circle into the picture plane. Boots pass in front of one
// another twice per revolution while the supporting wrist or crown stays planted.
function spinFrame(p, onHead) {
  const t = onHead ? range(headStart,headEnd,p) : range(spinStart,.596,p);
  const phase = onHead ? tau * (2.6 * t - .6 * t * t + .06) : tau * (1.1 * t + .6 * t * t);
  const s = Math.sin(phase), c = Math.cos(phase);
  const body = onHead ? -180 + 5.5 * c : -145 - 9 * s;
  const head = onHead ? -2 * c : -4 * c;
  const torso = onHead ? 1.8 * s : 2 * s;
  let hip;
  if (onHead) {
    const top = turn([2,-105], head);
    const tip = turn([top[0],top[1]-154],body+torso);
    hip = [crown[0]-tip[0], crown[1]-tip[1]];
  } else {
    // Straight supporting arm at the high point of each rotation.
    hip = [handPivot[0]+57+25*c,649+7*c];
  }
  const spread = onHead ? 135 + 40 * Math.cos(tau*t) : 152;
  const boot = side => [hip[0]+side*spread*c,hip[1]-117 + side*(78*s+13),180+side*(40*c+16*s)];
  const near = onHead ? [hip[0]-96*c-10, hip[1]+65+21*s] : handPivot;
  const far = onHead ? [hip[0]+96*c+10, hip[1]+65-21*s] : [hip[0]+85*c+26,hip[1]+136-49*s];
  return { f:frame(hip,body,torso,head,boot(-1),boot(1),near,far), phase };
}
const handFirst = spinFrame(spinStart,false).f, handLast = spinFrame(.596,false).f;
const headFirst = spinFrame(headStart,true).f, headLast = spinFrame(headEnd,true).f;
steps.push([spinStart,handFirst]);
const recovery = [
  [headEnd,headLast],
  [.781,frame([1043,740],-138,0,5, [1170,693,150],[1159,802,99], [991,909],[1068,909])],
  [.801,frame([1053,806],-81,0,14, [1155,903,15],[1188,844,44], [960,909],[982,891])],
  [.819,frame([1108,782],-16,1,7, [1071,907,0],[1151,904,1], [1003,815],[1171,802])],
];

function flip(p) {
  const air = range(.825,.981,p);
  // Let the peak breathe long enough to read the draw and the two wrist snaps.
  const ascent = ease(.825,.894,p), descent = ease(.925,.981,p);
  const height = ascent * (1-descent);
  const load = pulse(.819,.825,.981,1,p);
  const tuck = pulse(.839,.874,.937,.967,p);
  const draw = ease(.855,.899,p);
  const shake = Math.sin(range(.902,.959,p)*tau*2) * pulse(.899,.910,.951,.963,p);
  const carry = ease(.953,.982,p);
  const x = 1108 - ease(.825,.981,p)*57;
  const y = 782 + 9 * load - height*300 - ease(.981,1,p)*64;
  const hands = lerp([-101,3],[-47,-15],ease(.819,.855,p));
  const grip = lerp(hands,[-108,-135],draw);
  const pose = {
    x,y, body:mix(-16,-360,ease(.83,.969,p)), torso:(1-tuck)*1.5, head:7-tuck*28,
    nearHand:[grip[0]-shake*21-carry*22,grip[1]+shake*24+carry*25],
    farHand:lerp([63,20],[64,-153],tuck),
    nearFoot:[-37-tuck*33, mix(907-y-height*300,90,tuck), -tuck*47],
    farFoot:[43+tuck*26,mix(904-y-height*300,49,tuck),tuck*41],
    nearWrist:-18-22*draw+shake*21+carry*15,
    can:ease(.865,.883,p), canAngle: -5+shake*12,
    shadowX:x, shadowScale:1-.52*height, eyes:.92, pendant:-12*Math.sin(air*Math.PI*2),
  };
  if (p < .85) {
    // Both boots push off from their actual stage contacts before the tuck.
    const left = pointLocal([1071,907], [x,y], pose.body), right = pointLocal([1151,904],[x,y],pose.body);
    const push=ease(.83,.85,p);
    pose.nearFoot=lerp([...left,-pose.body],pose.nearFoot,push);
    pose.farFoot=lerp([...right,1-pose.body],pose.farFoot,push);
    const prep = fromStage(recovery.at(-1)[1]);
    const a = ease(.819,.83,p);
    pose.nearHand=lerp(prep.nearHand,pose.nearHand,a); pose.farHand=lerp(prep.farHand,pose.farHand,a);
  }
  limitReach(pose.farHand,53,-125,150);
  return pose;
}

export function sampleLegendBreak(progress=0) {
  const p=clamp(progress);
  if (p>=.819) return flip(p);
  let f, yaw=0;
  if (p<spinStart) f=between(steps,p);
  else if (p<=.596) { const spin=spinFrame(p,false); f=spin.f; yaw=spin.phase; }
  else if (p<headStart) {
    const t=ease(.596,headStart,p);
    f=blendFrame(handLast,headFirst,t); yaw=mix(tau*1.7,tau*2.06,t);
  } else if (p<=headEnd) { const spin=spinFrame(p,true); f=spin.f; yaw=spin.phase; }
  else { f=between(recovery,p); yaw=tau*.06*(1-ease(headEnd,.801,p)); }
  const pose=fromStage(f);
  const support=pulse(.022,.07,.60,.626,p);
  pose.nearWrist=-pose.body-pose.torso+mix(-22,84,support);
  pose.nearOpen=.96*support;
  pose.spinYaw=yaw;
  const profile=1-.44*Math.sin(yaw)**2;
  limitReach(pose.nearHand,-53*profile,-125,150);
  limitReach(pose.farHand,53*profile,-125,150);
  limitReach(pose.nearFoot,-25*profile,-2,218);
  limitReach(pose.farFoot,25*profile,-2,218);
  pose.shadowX=mix(pose.x,p>=headStart?crown[0]:handPivot[0],pulse(.354,.416,headEnd,.819,p)*.65);
  pose.pendant=9*Math.sin(yaw);
  return pose;
}
export function breakTrailsAt(p) {
  const visible = Math.max(pulse(.075,.105,.29,.325,p)*.46, pulse(.39,.413,.75,.771,p));
  if (!visible) return { visible:0 };
  const points = [[],[]];
  for (let i=0; i<8; i++) {
    const pose=sampleLegendBreak(p - (7-i)*.00195);
    [pose.nearFoot,pose.farFoot].forEach(([fx,fy],side) => {
      const [x,y]=turn([fx,fy],pose.body);
      points[side].push(`${(pose.x+x).toFixed(1)} ${(pose.y+y).toFixed(1)}`);
    });
  }
  return { visible, paths:points.map(list=>'M'+list.join(' L')) };
}

// Zoom to a physical feature, then widen between tricks to restore the silhouette.
export function breakCameraAt(p) {
  const keys=[
    [0,1,1053,705],[.06,1.24,1035,778],[.13,2.22,1064,867],[.19,2.22,1064,867],
    [.27,1.25,1050,792],[.36,1.22,1040,769],[.423,2.16,1013,885],[.451,2.16,1013,885],
    [.492,1.32,1062,730],[.587,1.37,1050,730],[.642,1.85,1036,847],[.684,1.85,1036,847],
    [.742,1.21,1043,703],[.823,1.12,1056,682],[.868,1.12,1080,625],
    [.911,1.41,1090,520],[.944,1.5,1048,552],[.977,1.55,967,623],[1,1.68,938,612],
  ];
  const i=keys.findIndex(k=>p<=k[0]);
  const a=keys[Math.max(0,i-1)], b=keys[i<0 ? keys.length-1 : i];
  const t=i<1 ? 1 : ease(a[0],b[0],p);
  return {zoom:mix(a[1],b[1],t),x:mix(a[2],b[2],t),y:mix(a[3],b[3],t)};
}

let nextCan=0;
export function createBreakCan(doc, actor) {
  const ns='http://www.w3.org/2000/svg';
  const id=`ua-pocket-can-${++nextCan}`;
  const arm=actor.querySelector('[data-actor-arm="near"]');
  const hand=arm.querySelector('[data-part="hand"]');
  const source = new doc.defaultView.DOMParser().parseFromString(`<svg xmlns="${ns}"><g data-break-can="" display="none"><defs><linearGradient id="${id}-metal"><stop stop-color="#2d251b"/><stop offset=".18" stop-color="#b5a890"/><stop offset=".37" stop-color="#fff0be"/><stop offset=".51" stop-color="#a28e72"/><stop offset=".83" stop-color="#69594a"/><stop offset="1" stop-color="#171513"/></linearGradient></defs>
  <g transform="translate(3 1) scale(1.18)">
    <path d="M-15 33v-50q0-7 11-12h8q11 5 11 12v50q-1 5-15 5t-15-5Z" fill="url(#${id}-metal)" stroke="#1c100a" stroke-width="2.2"/>
    <path d="M-14-16q14 4 28 0v45q-14 4-28 0Z" fill="#292726"/>
    <path d="M-12-15q6 2 12 2v42l-12-1Z" fill="#49402f"/><path d="M-14-9q13 4 28 0v6q-15 4-28 0Z" fill="#fbc72f"/>
    <path d="M-11 12V1l4 7 4-6v12m4 0V3l4 7 4-6v9" fill="none" stroke="#fff0b7" stroke-width="1.8"/>
    <text x="0" y="22" text-anchor="middle" fill="#fff4c9" font-family="Arial, sans-serif" font-size="4.3" font-weight="bold">MOLOTOW</text>
    <path d="M-13 32q13 3 26 0M-11-20q11 2 22 0" fill="none" stroke="#ffe9ad" stroke-width="1.2"/>
    <ellipse cy="-27" rx="7.8" ry="2.2" fill="#ffbc27" stroke="#826127" stroke-width="1"/>
    <path d="M-4-28v-6q3-2 7 0v6Z" fill="#d0bc96" stroke="#332920" stroke-width="1"/><circle cx="-1" cy="-32" r="1.1" fill="#1c1b15"/>
  </g></g></svg>`, 'image/svg+xml');
  const shell = doc.importNode(source.documentElement.firstElementChild, true);
  arm.insertBefore(shell,hand);
  return {render(visibility=0,pose={}) {
    shell.setAttribute('display',visibility>0?'inline':'none');
    if (visibility<=0) return;
    const [x,y]=pose.nearHand??[-61,13];
    shell.setAttribute('opacity',String(visibility));
    shell.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((pose.nearWrist??0)+(pose.canAngle??-5)).toFixed(2)})`);
  }};
}
