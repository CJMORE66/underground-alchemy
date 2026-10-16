export const CHAPTERS=[
 {id:'portal',title:'THE PORTAL',camera:[0,.3,8.5],target:[.65,.05,0],emblem:[1.1,.2,0],dissolve:0},
 {id:'city',title:'THE CITY',camera:[-.7,.4,5.3],target:[.4,0,-3],emblem:[1.5,.35,-1.2],dissolve:0},
 {id:'dissolution',title:'THE DISSOLUTION',camera:[1.1,.55,3.8],target:[.5,.15,-2.4],emblem:[1,.25,-2],dissolve:1},
 {id:'principles',title:'THE SEVEN PRINCIPLES',camera:[-.3,.7,6.2],target:[.6,.15,-2],emblem:[1,.25,-3],dissolve:1},
 {id:'forge',title:'THE FORGE',camera:[.4,.4,6.3],target:[1,.1,-1.2],emblem:[1.1,.2,-2],dissolve:0},
 {id:'drop',title:'THE DROP',camera:[0,.25,7.7],target:[.8,.2,-.6],emblem:[1.1,.2,-2],dissolve:0}
];
export const smooth=t=>t*t*(3-2*t);
export function segment(progress){const p=Math.max(0,Math.min(5,progress));const a=Math.min(4,Math.floor(p));return {a,b:a+1,t:smooth(p-a)}}
export function lerp3(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}
export function qualityProfile({width=1280,reduced=false,saveData=false,cores=8,memory=8}={}){const mobile=width<=700,low=saveData||cores<=4||memory<=4;return{mobile,reduced,enabled:!reduced&&!saveData&&!mobile,dpr:mobile?1:low?1:1.5,particles:low?550:1200,columns:low?10:18,antialias:!low,fps:low?30:60}}
