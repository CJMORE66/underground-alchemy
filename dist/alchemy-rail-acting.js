/* Small keyed performances between paint passes. All contacts are in yard coordinates. */
const SVG = 'http://www.w3.org/2000/svg';
const actorScale = .7;
const floor = 802;
const clamp = p => Math.max(0, Math.min(1, p));
const range = (a,b,p) => clamp((p-a)/(b-a));
const mix = (a,b,p) => a+(b-a)*p;
const blend = (a,b,p) => a.map((v,i)=>mix(v,b[i],p));
const ease = (a,b,p) => {
  const t=range(a,b,p);
  return t*t*(3-2*t);
};
const f = x => Number(x.toFixed(3));

function rotate([x,y], degrees) {
  const a=degrees*Math.PI/180;
  return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
}

function toLocal(point, x, y, angle) {
  return rotate([(point[0]-x)/actorScale,(point[1]-y)/actorScale],-angle);
}

function toWorld(point, pose) {
  const [x,y]=rotate(point,(pose.body??0)+(pose.torso??0));
  return [pose.x+x*actorScale,pose.y+y*actorScale];
}

function limit([x,y], [sx,sy], reach) {
  const d=Math.hypot(x-sx,y-sy);
  return d>reach?[sx+(x-sx)*reach/d,sy+(y-sy)*reach/d]:[x,y];
}

// Row: beat, pelvis, body / torso / head rotations, boot contacts, wrist contacts.
const exchange = [
  [0, [1075,672], [-4,0,-9], [1039,788,-4], [1111,787,2], [996,624], [1111,667]],
  [.07, [1075,674], [-1,0,-19], [1039,788,-4], [1111,787,2], [1003,611], [1107,665]],
  [.125, [1071,674], [-4,1,4], [1039,788,-4], [1111,787,2], [1013,598], [1108,663]],
  [.164, [1071,674], [-4,1,4], [1039,788,-4], [1111,787,2], [1013,603], [1109,664]],
  [.186, [1069,687], [-12,4,-9], [1039,788,-4], [1111,787,2], [997,698], [1109,666]],
  [.31, [1071,685], [0,0,-7], [1039,788,-4], [1111,787,2], [1044,683], [1112,668]],
  [.43, [1072,673], [-2,1,-6], [1039,788,-4], [1111,787,2], [1017,609], [1110,664]],
  [.84, [1073,673], [-2,1,-8], [1039,788,-4], [1111,787,2], [1019,610], [1111,661]],
  [1, [1075,672], [-4,0,-9], [1039,788,-4], [1111,787,2], [996,624], [1111,667]],
];

const encounter = [
  [0, [1075,672], [-4,0,-9], [1039,788,-4], [1111,787,2], [996,624], [1111,667]],
  [.08, [1075,672], [-4,0,-2], [1039,788,-4], [1111,787,2], [996,624], [1111,667]],
  [.115, [1088,660], [7,8,28], [1039,788,-4], [1111,787,2], [1024,593], [1138,615]],
  [.155, [1092,687], [11,6,23], [1056,788,2], [1111,787,2], [1042,611], [1147,640]],
  [.197, [1071,701], [-15,3,23], [1056,788,2], [1120,782,6], [1002,681], [1118,676]],
  [.247, [1031,741], [-54,-4,31], [1069,759,31], [1127,773,37], [947,711], [1071,781]],
  [.31, [996,766], [-81,-1,19], [1070,783,8], [1124,777,-3], [910,768], [1018,793]],
  [.36, [984,770], [-86,0,27], [1068,789,8], [1112,777,-3], [896,783], [996,790]],
  [.423, [986,772], [-83,0,35], [1067,789,8], [1109,779,-3], [897,787], [996,790]],
  [.49, [1012,766], [-68,4,36], [1067,789,8], [1113,779,3], [936,772], [998,785]],
  [.548, [1051,757], [-40,8,28], [1070,788,2], [1124,786,3], [1014,746], [1046,747]],
  [.60, [1085,747], [-8,15,16], [1052,786,-8], [1134,789,2], [1044,750], [1148,748]],
  [.662, [1103,747], [14,13,9], [1052,788,-7], [1134,789,2], [1054,758], [1166,774]],
  [.725, [1101,739], [10,10,13], [1052,788,-7], [1134,789,2], [1051,755], [1143,755]],
  [.78, [1098,706], [6,8,14], [1052,788,-7], [1134,789,2], [1055,735], [1144,716]],
  [.865, [1070,757], [-37,9,14], [1052,788,-7], [1134,789,2], [1034,786], [1136,750]],
  [.904, [1090,699], [-2,4,9], [1052,788,-7], [1134,789,2], [1047,702], [1141,687]],
  [1, [1090,673], [0,2,-2], [1052,788,-7], [1134,789,2], [1048,659], [1137,662]],
];

const portrait = [
  [0, [1588,668], [0,2,-8], [1551,788,-5], [1625,786,3], [1546,675], [1631,673]],
  [.3, [1587,673], [-3,5,-15], [1551,788,-5], [1625,786,3], [1538,662], [1637,659]],
  [.61, [1595,669], [3,-1,5], [1551,788,-5], [1625,786,3], [1541,656], [1661,622]],
  [1, [1595,668], [3,-1,0], [1551,788,-5], [1625,786,3], [1541,655], [1662,621]],
];

function interpolate(keys,p) {
  const end=keys.findIndex(([at])=>p<=at);
  if(end<1) return keys[end===0?0:keys.length-1].slice(1);
  const [start,...a]=keys[end-1], [stop,...b]=keys[end];
  return a.map((v,i)=>blend(v,b[i],ease(start,stop,p)));
}

function makePose(keys,p) {
  const [[x,y],[body,torso,head],bootA,bootB,wristA,wristB]=interpolate(keys,p);
  const foot=(point,side)=>[
    ...limit(toLocal(point,x,y,body),[side*25,-2],217),point[2]-body,
  ];
  return {
    x,y,scale:actorScale,body,torso,head,
    nearFoot:foot(bootA,-1),farFoot:foot(bootB,1),
    nearHand:limit(toLocal(wristA,x,y,body+torso),[-53,-125],149),
    farHand:limit(toLocal(wristB,x,y,body+torso),[53,-125],149),
    eyes:1,ground:floor,shadowX:x,
  };
}

function shakeState(p) {
  const pose=makePose(exchange,p);
  const oldShake=ease(.065,.09,p)*(1-ease(.151,.178,p))*Math.sin((p-.065)*105);
  const freshShake=ease(.40,.443,p)*(1-ease(.75,.81,p))*Math.cos((p-.45)*2*Math.PI/.0945);
  const shaking=oldShake*.45+freshShake;
  pose.nearHand[1]+=shaking*22;
  pose.nearWrist=-20+shaking*35;
  pose.head+=shaking*4;
  pose.pendant=shaking*13;
  pose.eyes=mix(1,.51,ease(.06,.12,p)*(1-ease(.16,.29,p)));
  const drop=range(.186,.239,p), bounce=ease(.239,.26,p)*(1-ease(.26,.30,p));
  const old=makePose(exchange,.186);
  const [sx,sy]=toWorld(old.nearHand,old);
  const empty=p<.186?null:{
    x:mix(sx,974,ease(0,1,drop))-4*ease(.239,.31,p),
    y:mix(sy,784,drop**1.7)-9*bounce,
    angle:mix(-20,-86,drop)+bounce*17,scale:mix(1.02,.95,drop),
  };
  return {pose,can:p<.186||p>=.29?1:0,under:0,empty};
}

function foodState(p,pose) {
  if(p<.325 || p>.815) return null;
  const paper={x:897,y:789,opacity:ease(.325,.385,p)*(1-ease(.78,.815,p))};
  const near=toWorld(pose.nearHand,pose), far=toWorld(pose.farHand,pose);
  const handoff=ease(.525,.585,p), hand=blend(near,far,handoff);
  const pickup=ease(.418,.471,p);
  const eatenAt=[.718,.75,.784];
  const slices=eatenAt.map((eaten,i)=>{
    const drop=range(.653+i*.008,.692+i*.008,p);
    const ground=[1165+i*12,790+i*2];
    const held=[hand[0]+(i-1)*4,hand[1]+7+i*2];
    const collected=blend([894+i*9,785+(i%2)*4],held,pickup);
    const [x,y]=blend(collected,ground,ease(0,1,drop));
    return {
      x,y,angle:mix(-22+i*18,5+i*13,drop),
      scale:mix(1,.79,drop),opacity:ease(.337,.381,p)*(1-ease(eaten,eaten+.014,p)),
    };
  });
  return {paper,slices};
}

function dogState(p) {
  const pose=makePose(encounter,p);
  pose.nearWrist=mix(-23,-52,ease(.165,.22,p))+ease(.36,.43,p)*35;
  pose.eyes=1-.25*ease(.225,.33,p)+.23*ease(.46,.59,p);
  pose.nearOpen=ease(.19,.26,p)*(1-ease(.413,.468,p));
  pose.farFront=ease(.55,.60,p)*(1-ease(.75,.83,p));
  pose.farWrist=24-62*ease(.56,.648,p)+32*ease(.674,.74,p);
  const under=ease(.25,.321,p)*(1-ease(.515,.58,p));
  const barkPhase = p < .0875 ? .205*range(.065,.0875,p) :
    p < .1375 ? mix(.205,.585,range(.0875,.1375,p)) :
      mix(.585,1,range(.1375,.164,p));
  const dog={
    mode:p<.065?'run':p<.164?'bark':p<.595?'watch':p<.802?'feed':'watch',
    phase:p<.065?range(0,.065,p):p<.164?barkPhase:p<.595?range(.164,.595,p):
      p<.802?range(.595,.802,p):range(.802,1,p),
    x:p<.065?mix(1430,1241,1-(1-range(0,.065,p))**2):1241-5*ease(.59,.71,p)+42*ease(.807,.925,p),
    y:796,scale:.65,facing:p<.854?-1:1,
  };
  let empty;
  if(p>=.215 && p<.904) {
    const roll=range(.215,.325,p);
    const atRelease=makePose(encounter,.215);
    const [x,y]=toWorld(atRelease.nearHand,atRelease);
    const pick=ease(.865,.904,p), hand=toWorld(pose.nearHand,pose);
    empty={
      x:mix(mix(x,1034,ease(0,1,roll)),hand[0],pick),
      y:mix(mix(y,786,roll**1.9),hand[1],pick),
      angle:mix(mix(-41,-94,roll),pose.nearWrist,pick),scale:.96,
    };
  }
  return {pose,can:p<.215||p>=.904?1:0,under,dog,empty,food:foodState(p,pose)};
}

export function sampleRailActing(kind,p=0) {
  const t=clamp(p);
  if(kind==='shake') return shakeState(t);
  if(kind==='dog') return dogState(t);
  const pose=makePose(portrait,t);
  pose.eyes=.88+.12*ease(.32,.70,t);
  pose.nearWrist=-22;
  pose.farWrist=-29;
  pose.farFront=1;
  return {
    pose,can:1,under:0,
    dog:{mode:'pose',x:1715,y:796,scale:.63,phase:t,facing:-1},
  };
}

export function createRailProps(document) {
  const parser = new document.defaultView.DOMParser();
  const markup = `<svg xmlns="${SVG}"><g aria-hidden="true">
    <g data-rail-empty-can="" display="none">
      <ellipse cy="13" rx="19" ry="4" fill="#130f0f" opacity=".7"/>
      <g data-rail-empty-body="">
        <path d="M-10 20v-34q1-6 7-8h6q6 2 7 8v34q-1 3-10 3t-10-3Z" fill="#6c5b47" stroke="#1b1613" stroke-width="1.8"/>
        <path d="M-9-11q9 3 18 0v26q-9 3-18 0Z" fill="#32291f"/>
        <path d="M-8-7q8 2 16 0m-15 24 12 1" fill="none" stroke="#d0a65a" stroke-width="1.8"/>
        <path d="M-8 20l15-1m-14-32 12-1m-9-8 8 1" fill="none" stroke="#e6c27c" stroke-width="1.1"/>
        <path d="M-3-22v-5q3-2 6 0v5Z" fill="#a5906e" stroke="#2e251c" stroke-width="1"/>
      </g>
    </g>
    <g data-rail-salami="" display="none">
      <g data-rail-salami-paper="">
        <path d="M-17-2l9-7 14 3 12-2 7 6-3 8-16 4-18-3Z" fill="#342723" opacity=".75"/>
        <path d="M-17-5-8-12 6-9 19-11 24-4 20 3 5 7-12 4Z" fill="#b29a7b" stroke="#493832" stroke-width="1"/>
        <path d="m-14-4 9-5 9 3 11-2m-20-1 1 8 10 5" fill="none" stroke="#ead8a2" stroke-width="1" opacity=".57"/>
      </g>
      ${Array.from({length:3},(_,i)=>`<g data-rail-salami-slice="${i}">
        <ellipse cy="1.5" rx="6.6" ry="4.4" fill="#55231f" stroke="#281513" stroke-width="1"/>
        <ellipse rx="6.3" ry="4.1" fill="${['#c66b50','#af5140','#d28060'][i]}" stroke="#69382b" stroke-width=".8"/>
        <path d="M-3-1.6l.8.6m4-.9.6.5M0 1.8l.5.5m2.8-1.2.9.6m-7.1-.1.6.5" stroke="#e3af87" stroke-width=".8" stroke-linecap="round"/>
      </g>`).join('')}
    </g>
  </g></svg>`;
  const source = parser.parseFromString(markup,'image/svg+xml');
  const element = document.importNode(source.documentElement.firstElementChild,true);
  const empty = element.querySelector('[data-rail-empty-can]');
  const emptyBody = element.querySelector('[data-rail-empty-body]');
  const food = element.querySelector('[data-rail-salami]');
  const paper = element.querySelector('[data-rail-salami-paper]');
  const slices = Array.from(element.querySelectorAll('[data-rail-salami-slice]'));
  function place(node,{x,y,angle=0,scale=1,opacity=1}) {
    node.setAttribute('transform',`translate(${f(x)} ${f(y)}) rotate(${f(angle)}) scale(${f(scale)})`);
    node.setAttribute('opacity',f(opacity));
  }
  return {element,render(state={}) {
    empty.setAttribute('display',state.empty?'inline':'none');
    food.setAttribute('display',state.food?'inline':'none');
    if(state.empty) {
      place(empty,{x:state.empty.x,y:state.empty.y,scale:state.empty.scale??.95});
      emptyBody.setAttribute('transform',`rotate(${f(state.empty.angle)})`);
    }
    if(state.food) {
      place(paper,state.food.paper);
      slices.forEach((node,i)=>place(node,state.food.slices[i]));
    }
  }};
}
