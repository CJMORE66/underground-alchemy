/* Two final plates for the scroll film. The original Alchemist rig performs in both. */
import { createWriterInk, sampleWriterAction, writerCarInk } from './alchemy-writer-strokes.js?v=4';
import { createSprayPlume, sprayPlumeMarkup } from './alchemy-spray-plume.js';
import { createBreakCan } from './alchemy-breaking.js?v=1';
import { createRailProps, sampleRailActing } from './alchemy-rail-acting.js';
import { createWriterDog } from './alchemy-writer-dog.js';

const NS = 'http://www.w3.org/2000/svg';
const clamp = t => Math.min(1, Math.max(0, t));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (a, b, p) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };
const n = v => Number(v.toFixed(3));
const repeat = (count, fn) => Array.from({ length: count }, (_, i) => fn(i)).join('');
let serial = 0;

function car(id, i) {
  const lead = i === 0, end = i === 3;
  const shell = `M${lead?3:8} 700 ${lead?5:8} 565 Q${lead?17:10} 511 ${lead?41:25} 501 Q160 488 315 500 Q335 500 338 526 L${end?348:338} 704Q340 724 326 731H20Q4 728 3 711Z`;
  const windows = repeat(7, j => `<rect x="${21+j*44}" y="527" width="34" height="56" rx="5"/>`);
  const bolts = repeat(24,j=>`M${13+j*13.4} 715h1`);
  return `<g id="${id}-body-${i}" transform="translate(${132+i*354} 0)">
    <defs><clipPath id="${id}-car${i}"><path d="${shell}"/></clipPath></defs>
    <path d="M-18 696H23v15h-41ZM327 698h40v11h-40Z" fill="#3a3026" stroke="#a98748" stroke-width="1.5"/>
    <path d="M11 705H330l-15 37-63 9H56l-35-9Z" fill="#141413" stroke="#775939" stroke-width="3"/>
    ${[58,278].map(x=>`<g transform="translate(${x} 740)">
      <path d="M-33-13h63l11 12-8 10h-63l-9-10Z" fill="#2c2622" stroke="#74573b" stroke-width="3"/>
      ${[-17,17].map(a=>`<circle cx="${a}" cy="8" r="17" fill="#131111" stroke="#967647" stroke-width="3"/><circle cx="${a}" cy="8" r="7" fill="#503e2c" stroke="#c7a169" stroke-width="1.1"/>`).join('')}
      <path d="M-26 0h52m-40-5h28" fill="none" stroke="#a78044" stroke-width="2.6"/></g>`).join('')}
    <path d="${shell}" fill="url(#${id}-steel)" stroke="#d4b471" stroke-width="2.2"/>
    <g clip-path="url(#${id}-car${i})">
      <g fill="#181a19" stroke="#98856d" stroke-width="2">${windows}</g>
      <path d="M2 509q150-15 337-2m-341 85h348m-352 11h356m-353 89h352m-353 12h350" fill="none" stroke="#d0a55b" opacity=".55" stroke-width="2.5"/>
      ${writerCarInk(id,i)}
      <path d="M12 509q148-12 325-3M5 721q135 5 336-3" fill="none" stroke="#ffdc88" stroke-width="2.1" opacity=".8"/>
      <path d="M97 725V534q0-11 9-12h53q9 1 9 12v191m-36-201v201m96 0V532q0-10 9-10h43q8 0 8 10v193" fill="none" stroke="#1e1617" stroke-width="2.3" opacity=".47"/>
      <g fill="none" stroke="#dfc994" stroke-width="1.2" opacity=".26">${windows}</g>
      <path d="${bolts}" fill="none" stroke="#d2bd95" stroke-width="2.3" stroke-linecap="round"/>
      ${lead || end ? `<g transform="${end?'translate(349 0) scale(-1 1)':''}"><path d="M2 569q11-42 24-47l-2 58-22 10Z" fill="#141615" stroke="#ae985f" stroke-width="2"/><path d="m5 644 13-3-2 9-12 1Z" fill="#ffdf90"/></g>` : ''}
    </g>
    ${!end ? '<path d="M340 547h16v162h-16Z" fill="#121111"/><path d="M341 551v150m4-150v151m4-149v150m4-148v149" stroke="#66503e" stroke-width="1.4"/>' : ''}
  </g>`;
}

function yard(id) {
  return `<g data-finale="writer" display="none">
    <rect width="1536" height="1024" fill="url(#${id}-sky)"/>
    <ellipse cx="1005" cy="550" rx="620" ry="400" fill="url(#${id}-sodium)"/>
    <path d="m0 559 112-59 8 37 95-42v40l99-47v24l87-31 69 25 83-30 104 20 70-38 93 14 64-26 98 17 121-43 69 26 74-40 89 15 86-33 124 17v261H0Z" fill="#26211f"/>
    <path d="M0 603h1536v160H0Z" fill="#211b1a"/><path d="m0 616 1536-58m-1536 73 1536-60" stroke="#8f6940" opacity=".48" stroke-width="2"/>
    <g fill="none" stroke-linejoin="round">
      ${[159,452,758,1085,1391].map(x=>`<g transform="translate(${x} 0)" stroke="#554235" stroke-width="3"><path d="M0 686 7 338l9-4 8 350M4 568l14-61-12-50 10-41-8-39m-38-33 80-7-4 7-77 6Zm30 8-25 34m68-40-26 27"/><path d="m-13 338 3-13m28 13 4-14" stroke="#ad8655"/></g>`).join('')}
      <path d="M0 316q230 54 455 21 145 33 302 1 163 38 327-1 145 35 308 0l144 9M0 334q230 48 454 20 148 32 303 2 168 32 327-2 149 35 309 0l143 7" stroke="#ad8050" opacity=".48" stroke-width="1.6"/>
    </g>
    <path d="M0 751H1536v273H0Z" fill="url(#${id}-ground)"/>
    <g data-finale="railcam">
      <path d="M-3100 761H4700m-7800 8h7800m-7800 52h7800m-7800 11h7800" fill="none" stroke="#866943" stroke-width="5"/>
      <path d="M-3100 764H4700m-7800 60h7800" fill="none" stroke="#c0a176" stroke-width="1.8"/>
      <path d="${repeat(80,j=>`M${-1350+j*57} 771l-29 55`)}" fill="none" stroke="#322a24" stroke-width="14"/>
      ${repeat(4,i=>car(id,i))}
      <g data-finale="air-behind">${sprayPlumeMarkup(id)}</g>
    </g>
    <path d="M0 904q603-68 1536-14m-1536 62q721-74 1536-35" fill="none" stroke="#69503c" stroke-width="2" opacity=".38"/>
  </g>`;
}

function post(id,x,y,w,base) {
  return `<g transform="translate(${x} ${y}) scale(${w/78} 1)">
    <path d="M-38 0Q0 10 38 0l-3 ${base-y}q-30 9-66 0Z" fill="url(#${id}-wood)" stroke="#30201a" stroke-width="2.8"/>
    <path d="M-27 6q5 36 0 67t3 75m14-133q5 14 2 41t3 46m8-72q9 13 3 34t1 44m14-88q5 28 0 75m9-83-1 114" fill="none" stroke="#aa7942" stroke-width="1.5" opacity=".63"/>
    <ellipse rx="39" ry="8.2" fill="#b5894d" stroke="#d8ae65" stroke-width="1.8"/>
    <ellipse rx="30" ry="5.2" fill="none" stroke="#6d492b" stroke-width="1.7"/><ellipse rx="17" ry="3.1" fill="none" stroke="#6d492b" stroke-width="1.1"/>
    <path d="m-11-1-16-4m41 6 16 2" stroke="#483021" stroke-width="1.6"/>
  </g>`;
}

function courtyard(id) {
  return `<g data-finale="kungfu" display="none">
    <rect width="1536" height="1024" fill="url(#${id}-dawn)"/>
    <ellipse cx="1055" cy="393" rx="417" ry="395" fill="url(#${id}-sodium)"/>
    <circle cx="1070" cy="392" r="95" fill="url(#${id}-moon)"/>
    <path d="M0 596 185 479l66 36 132-65 93 18 141-85 55 22 31-6 111 59 108 16 132 88 144-87 100 29 109-88 130 18v280H0Z" fill="#3e3330"/>
    <path d="m0 508 104 18 102 74 155 27 151-31 68 11 159-76 118 34 116 42 96-8 109-52 96 9 114-79 57 17 91-42v270H0Z" fill="#2c2728"/>
    <path d="M61 600q160 10 360-28m65-23q173-20 337 0m44-59q108 17 212 2m36 14q134-6 233-27M0 662q380-49 626-14m202-49q201 27 439 0" fill="none" stroke="#c0a475" stroke-width="3" opacity=".19"/>
    <path d="M0 754q354-47 689-25t847-21v316H0Z" fill="url(#${id}-ground)"/>
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 442q114 92 287 67l147-72 13 3-125 78-62 9q73 18 134 1l79-44-47 53-97 11q-156-15-234-48L0 485Z" fill="#171617"/>
      <path d="M56 474q96 53 186 49m29-5 55-7 74-47m-74 77 72-5 49-22" fill="none" stroke="#806344" stroke-width="2.1"/>
      ${[[88,470],[191,487],[326,471],[403,445],[431,503]].map(([x,y],i)=>`<path transform="translate(${x} ${y}) scale(${1-i*.08})" d="M-93-5q36-36 78-20-33-22 20-23 35-10 66 17l-28-3q41 12 54 25l-51 1-10-6-42 5-9-4-47 8Z" fill="#201e1d" stroke="#5d4b35" stroke-width="1.6"/>`).join('')}
      <path d="M0 706q120-1 229-56l174-76 32-49 4 26 20 11 115 52q105 47 197 15-63 68-147 66l-387 26-122 16-115 3Z" fill="#211a1a" stroke="#927246" stroke-width="3"/>
      <path d="M23 705q114 1 229-55l161-73m25-23 136 69q96 40 168 22m-497 59 392-29m-409 36 411-27" fill="none" stroke="#bb9358" stroke-width="2.2"/>
      <path d="M191 717v119m47-121v113m365-139v105m29-108v108" stroke="#3f3024" stroke-width="15"/>
      <path d="M197 718v115m46-116v112m364-138v104" stroke="#9d7448" stroke-width="1.8"/>
    </g>
    <path d="M0 852q602-98 1536-45m-1536 162q677-114 1536-81" fill="none" stroke="#81694c" stroke-width="2" opacity=".29"/>
    ${post(id,784,816,49,927)}${post(id,1304,795,58,904)}${post(id,1090,732,87,932)}
    <g data-finale="breath" fill="none" stroke="#f3c968" stroke-width="1.5" stroke-linecap="round">
      <path d="M1018 663c-55-2-80-29-77-58 1-20 12-37 24-48m196 43c16 25 14 52-11 70-11 8-28 16-42 17" opacity=".67"/>
      <path d="M950 592c4-10 9-18 15-23m175 107 14-9" stroke="#fff0b8"/>
    </g>
  </g>`;
}

function defs(id) {
  return `<defs>
    <linearGradient id="${id}-sky" x2=".2" y2="1"><stop stop-color="#0c0c0f"/><stop offset=".5" stop-color="#282223"/><stop offset="1" stop-color="#59402a"/></linearGradient>
    <linearGradient id="${id}-dawn" x2=".5" y2="1"><stop stop-color="#151318"/><stop offset=".45" stop-color="#4a3831"/><stop offset=".7" stop-color="#806242"/><stop offset="1" stop-color="#37312c"/></linearGradient>
    <linearGradient id="${id}-moon" x2=".45" y2="1"><stop stop-color="#ffe7a0"/><stop offset=".72" stop-color="#dab877"/><stop offset="1" stop-color="#a6885f"/></linearGradient>
    <linearGradient id="${id}-ground" x2=".2" y2="1"><stop stop-color="#443a31"/><stop offset=".44" stop-color="#29231f"/><stop offset="1" stop-color="#100e0e"/></linearGradient>
    <linearGradient id="${id}-steel" x2=".12" y2="1"><stop stop-color="#8c8273"/><stop offset=".09" stop-color="#c0ac8a"/><stop offset=".15" stop-color="#494843"/><stop offset=".48" stop-color="#665e50"/><stop offset=".74" stop-color="#ad9f86"/><stop offset="1" stop-color="#4d463a"/></linearGradient>
    <linearGradient id="${id}-wood"><stop stop-color="#29201c"/><stop offset=".28" stop-color="#5e4028"/><stop offset=".65" stop-color="#866039"/><stop offset=".92" stop-color="#403020"/><stop offset="1" stop-color="#b98b4a"/></linearGradient>
    <radialGradient id="${id}-sodium"><stop stop-color="#d59a48" stop-opacity=".48"/><stop offset=".54" stop-color="#9f682e" stop-opacity=".18"/><stop offset="1" stop-color="#925c34" stop-opacity="0"/></radialGradient>
  </defs>`;
}

function writerFrame(p,narrow) {
  const action=sampleWriterAction(p), [tx,ty]=action.contact;
  const reveal=ease(.9,.972,p), rest=ease(.91,.95,p);
  // A dolly follows the writer's torso. Fast changes of direction stay visible inside the frame.
  const lead=[-.025,-.014,0,.014,.025].map(offset=>sampleWriterAction(clamp(p+offset)).contact[0]);
  const follow=(lead[0]+2*lead[1]+4*lead[2]+2*lead[3]+lead[4])/10;
  const macro=ease(.44,.463,p)*(1-ease(.559,.594,p));
  const focus=ease(.013,.025,p)*(1-ease(.085,.155,p))+ease(.79,.827,p)*(1-ease(.886,.928,p));
  const baseZoom=mix(1.45+.64*focus,narrow?.425:.748,reveal);
  const zoom=mix(baseZoom,4.8,macro);
  const anchor=mix(mix(follow+56,838,reveal),tx+17,macro);
  const cameraX=mix(1030,narrow?1028:793,reveal)-anchor*zoom;
  const cameraY=mix(641,664,reveal)-mix(mix(631,665,reveal),ty+1,macro)*zoom;
  const scale=.7, pulse=Math.sin(action.fraction*Math.PI);
  const angle=mix(-8,action.phase==='flare'?-41:action.phase==='fill'?-19:8,pulse)-rest*7;
  const rad=angle*Math.PI/180;
  // Aperture (-1,-32) inside the can symbol's translate(3,1) scale(1.18).
  const offsetX=(1.82*Math.cos(rad)+36.76*Math.sin(rad))*scale;
  const offsetY=(1.82*Math.sin(rad)-36.76*Math.cos(rad))*scale;
  const standOff=action.phase==='flare'?20+58*action.fan:action.phase==='outline'?16:30+8*pulse;
  const nozzle=[tx+Math.cos(rad)*standOff,ty+Math.sin(rad)*standOff];
  const actorX=Math.max(nozzle[0]-offsetX+scale*93,Math.min(tx+125,follow+113));
  const actorY=Math.max(673,Math.min(744,ty+120));
  const hipX=mix(actorX,1641,rest), hipY=mix(actorY,670,rest);
  const stride=Math.sin(hipX/18)*(1-ease(.94,.958,p));
  const pose={
    x:cameraX+hipX*zoom, y:cameraY+hipY*zoom, scale:scale*zoom,
    nearHand:[mix((nozzle[0]-offsetX-hipX)/scale,-57,rest),mix((nozzle[1]-offsetY-hipY)/scale,6,rest)],
    nearWrist:angle, canAngle:0, head:mix(-14+.045*(ty-620),-17,rest),
    farHand:[60+stride*12,-56+11*stride], torso:0,
    nearFoot:[-49-stride*23,(804-hipY)/scale-24-Math.max(0,stride)*20,-3-stride*7],
    farFoot:[43+stride*23,(801-hipY)/scale-22+Math.min(0,stride)*20,1+stride*6],
    eyes:.96,pendant:stride*6,ground:cameraY+798*zoom,
  };
  return {pose,action,cameraX,cameraY,zoom,nozzle};
}

function railCamera(beat,p,narrow) {
  const targetX = narrow ? 1040 : 895;
  if (beat === 'pose') {
    const zoom = narrow ? 1.03 : 1.36;
    return { x: targetX - 1563*zoom, y: 618 - 665*zoom, zoom };
  }
  const zoom = beat === 'shake' ? 1.42 : mix(1.21,1.35,ease(.42,.75,p));
  const anchor = beat === 'shake' ? 1025 : mix(1060,1129,ease(.38,.65,p));
  return { x: targetX - anchor*zoom, y: 605 - 666*zoom, zoom };
}

function projectRailPose(pose,camera) {
  return {
    ...pose,
    x: camera.x+pose.x*camera.zoom, y: camera.y+pose.y*camera.zoom,
    scale: (pose.scale ?? 1)*camera.zoom,
    ground: camera.y+(pose.ground ?? 797)*camera.zoom,
    shadowX: camera.x+(pose.shadowX ?? pose.x)*camera.zoom,
  };
}

// Curves between keyed contacts compose the salute, parry, heel kick, step up and crane stance.
// x/y are pelvis coordinates. Each foot is positioned in stage space so a planted boot stays planted.
const stance = [
  //  t      hips          left sole      right sole     leading palm    rear hand      torso, head, palm, left boot
  [0,    921,704,         860,893,        995,891,      -63,-51,       42,-63,        -2,-4,.30,0],
  [.08,  925,731,         849,893,       1003,891,      -32,-95,        8,-100,       -4,-8,.95,-3],
  [.16,  934,740,         849,893,       1003,891,     -162,-112,      36,-41,       -11,-12,1,-3],
  [.205, 944,731,         849,893,       1003,891,      -83,-83,       64,-131,       -3,-10,.76,-3],
  [.245, 927,735,         849,893,       1003,891,      -89,-185,    -100,-143,      -11,-15,.53,-3],
  [.32,  955,730,         901,858,       1003,891,      -47,-155,      83,-149,        9,-8,.24,-17],
  [.38,  982,706,         918,705,       1003,891,      -77,-162,     115,-92,        15,-13,.34,-29],
  [.425, 980,707,         792,659,       1003,891,      -64,-102,     154,-116,       20,-17,.28,32],
  [.485, 983,711,         925,719,       1003,891,     -115,-134,      67,-108,        9,-5,.72,-29],
  [.55,  994,727,         968,893,       1043,885,      -50,-97,       87,-61,         0,9,.47,0],
  [.615,1031,708,         968,893,       1087,732,      -91,-115,      78,-126,        4,8,.88,0],
  [.70, 1078,583,        1030,744,       1087,732,     -121,-114,     108,-108,        0,1,.89,-20],
  [.775,1081,548,        1059,617,       1087,732,     -122,-96,      97,-107,       -2,-4,.89,-35],
  [.865,1080,547,        1068,607,       1087,732,      -13,-108,      12,-111,        0,-7,.98,-39],
  [1,   1080,547,        1068,607,       1087,732,      -13,-108,      12,-111,        0,-7,.98,-39],
];

export function sampleLegendKungFu(progress) {
  const p = clamp(progress);
  const k = Math.max(1, stance.findIndex(row=>row[0]>=p));
  const a = stance[k-1], b=stance[k];
  const blend = ease(a[0], b[0], p), v=i=>mix(a[i],b[i],blend);
  const breath = Math.sin(ease(.775,1,p)*Math.PI*3) * 1.8;
  const scale=.91, x=v(1), y=v(2)+breath;
  return {
    x,y,scale, torso:v(11)+breath*.43, head:v(12), nearOpen:v(13),
    nearHand:[v(7),v(8)], farHand:[v(9),v(10)], nearWrist:mix(-7,9,ease(.78,.89,p)),
    nearFoot:[(v(3)-x)/scale,(v(4)-y)/scale-24,v(14)],
    farFoot:[(v(5)-x)/scale,(v(6)-y)/scale-22,0],
    eyes:1-ease(.8,.89,p)*.96, farFront:ease(.18,.21,p)*(1-ease(.28,.32,p)),
    pendant:Math.sin(p*Math.PI*13)*(1-ease(.49,.8,p))*5,
    ground: mix(886,727,ease(.61,.73,p)), shadowX:mix(x,1090,ease(.6,.72,p)),
  };
}

export function createLegendFinale(doc, actor) {
  const id = 'legend-finale-' + ++serial;
  const parser = new doc.defaultView.DOMParser();
  const svg = markup => doc.importNode(parser.parseFromString(markup,'image/svg+xml').documentElement,true);
  const element = svg(`<svg xmlns="${NS}" viewBox="0 0 1536 1024" aria-hidden="true" focusable="false" style="display:none">${defs(id)}${yard(id)}${courtyard(id)}</svg>`);
  const can = createBreakCan(doc,actor);
  const finger=svg(`<g xmlns="${NS}" aria-hidden="true" display="none">
    <path d="M-1-33v-5q1-4 8-4h3q5 0 6 4v6q-7 4-17-1Z" fill="#f0dcaa" stroke="#3e3024" stroke-width="1.1"/>
    <path d="M1-39q3-2 7-1l-1 6-6 1Z" fill="#a44d31" stroke="#63351f" stroke-width=".8"/>
    <ellipse cx="1.82" cy="-36.76" rx="1.3" ry="1.8" fill="#171316"/>
    <path d="M7-4q6-7 6-16l-1-8 1-5-7-2q-4-1-3-4 1-3 5-3l7 1 5 4 2 11-1 12-4 12-8 5Z" fill="#af7949" stroke="#281910" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M4-40q3-2 6-1l3 2-4 1-5-1Z" fill="#f7ce8c"/>
    <path d="m13-31 5 2m-6-6 6 2m-4 10 6 1m-8 7 5 2m-6 3 4 1" fill="none" stroke="#684328" stroke-linecap="round" stroke-width="1.05"/>
    <path d="m14-37 4 2 1 3m-4 10 3 1m-5 11 3 1" fill="none" stroke="#edc183" stroke-width=".9"/>
  </g>`);
  actor.querySelector('[data-actor-arm="near"]').append(finger);
  const foregroundMist=svg(`<g xmlns="${NS}" aria-hidden="true" display="none"><use href="#${id}-aerosol"/></g>`);
  const occlusion=svg(`<g xmlns="${NS}" data-rail-occlusion="" display="none"><use href="#${id}-body-2"/></g>`);
  const foregroundFood=svg(`<g xmlns="${NS}" aria-hidden="true"/>`);
  actor.append(foregroundMist,foregroundFood,occlusion);
  const get = name => element.querySelector(`[data-finale="${name}"]`);
  const yardGroup=get('writer'), court=get('kungfu'), cam=get('railcam'), breath=get('breath');
  const backMist=get('air-behind');
  const paint=createWriterInk(element);
  const plume=createSprayPlume(element);
  const dog=createWriterDog(doc);
  const railProps=createRailProps(doc);
  foregroundFood.append(railProps.element.querySelector('[data-rail-salami]'));
  cam.append(railProps.element,dog.element);
  let previous;
  function render(kind,progress=0,{beat='',local=0,sentry=false}={}) {
    const writer = kind==='writer', kungfu=kind==='kungfu', p=clamp(progress);
    if (kind!==previous) {
      element.style.display=writer||kungfu?'block':'none';
      yardGroup.setAttribute('display',writer?'inline':'none');
      court.setAttribute('display',kungfu?'inline':'none');
      if (!writer) {
        can.render(0);
        finger.setAttribute('display','none');
        foregroundMist.setAttribute('display','none');
        occlusion.setAttribute('display','none');
        railProps.render({});
      }
      previous=kind;
    }
    if (writer) {
      const narrow=doc.defaultView.matchMedia('(max-width: 760px)').matches;
      const state=writerFrame(p,narrow);
      const {pose,action,cameraX,cameraY,zoom,nozzle}=state;
      const camera=beat ? railCamera(beat,local,narrow) : {x:cameraX,y:cameraY,zoom};
      const transform=`translate(${n(camera.x)} ${n(camera.y)}) scale(${camera.zoom.toFixed(6)})`;
      cam.setAttribute('transform',transform);
      paint(action,p);
      if (beat) {
        const acting=sampleRailActing(beat,local);
        const projected=projectRailPose(acting.pose,camera);
        railProps.render(acting);
        foregroundFood.setAttribute('transform',transform);
        dog.render(acting.dog ?? {mode:'hide'});
        occlusion.setAttribute('display',acting.under > .08 ? 'inline' : 'none');
        occlusion.setAttribute('transform',transform);
        foregroundMist.setAttribute('display','none');
        finger.setAttribute('display','none');
        plume();
        can.render(acting.can,projected);
        return projected;
      }
      railProps.render({});
      const joins=ease(.90,.99,p);
      dog.render(sentry ? {x:mix(1234,1740,joins),y:798,scale:.72,phase:p,mode:joins > .9 ? 'pose' : 'watch'} : {mode:'hide'});
      occlusion.setAttribute('display','none');
      can.render(1,pose);
      const fat = action.phase === 'flare';
      backMist.setAttribute('display',fat?'none':'inline');
      foregroundMist.setAttribute('display',fat?'inline':'none');
      if (fat) foregroundMist.setAttribute('transform',cam.getAttribute('transform'));
      const painting = action.phase !== 'hold';
      finger.setAttribute('display',painting?'inline':'none');
      if (painting) {
        finger.setAttribute('transform',`translate(${n(pose.nearHand[0])} ${n(pose.nearHand[1])}) rotate(${n(pose.nearWrist)}) translate(0 ${n(1.5*action.spray)})`);
      }
      plume({p,action,nozzle,sampleAction:sampleWriterAction});
      return pose;
    }
    if (kungfu) {
      const cycle=ease(.78,1,p), inhale=Math.sin(cycle*Math.PI*3);
      breath.setAttribute('opacity',n(cycle ? (.32+.18*inhale)*ease(.77,.85,p) : 0));
      breath.setAttribute('transform',`translate(1078 585) scale(${n(1+.09*inhale)}) translate(-1078 -585)`);
      return sampleLegendKungFu(p);
    }
  }
  return {element,render};
}
