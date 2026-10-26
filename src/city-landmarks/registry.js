/* Approximate artistic proportions and headings, not a building survey. */
export const LANDMARKS = [
 {id:'notre-dame',heading:111,width:58,depth:134,cut:true,duration:3600,phases:['plinth|aisle-body','nave|transept|apse','tower.*base|western-facade|portal|gallery','open-bell|bell-mullion|top-ledge|parapet','buttress|pinnacle','rose|clerestory','spire|cross']},
 {id:'sainte-chapelle',heading:99,width:24,depth:55,cut:true,duration:3000,phases:['lower|entrance|portal','upper-glass|upper-buttress','lancet|rose','roof|turret|finial','central-spire']},
 {id:'flamel-house',heading:190,width:15,depth:18,cut:true,duration:2600,phases:['house-main|ground-floor','ground-arch|vertical-stone','facade-window|window-sill','lintel|inscri','roof|chimney']},
 {id:'saint-sulpice',heading:93,width:72,depth:130,cut:true,duration:3300,phases:['body|transept|western-wall','entry|classical-column','entablature','tower.*base','tower.*upper|bell-slot','cornice|cap|roof']},
 {id:'pere-lachaise',heading:55,width:55,depth:48,cut:false,duration:2800,phases:['plinth|base|ground','gate|pier','tomb|chapel|mausoleum','arch|urn|cross|finial']},
 {id:'republique',heading:0,width:25,depth:25,cut:false,duration:2900,phases:['step|base|plinth','pedestal','lion','Marianne|marianne|body|head','arm|branch|tablet|cap']},
 {id:'abbesses',heading:16,width:18,depth:22,cut:false,duration:2700,phases:['stair|base|well','stem|post|support','canopy|glass','rib|arch|finial|sign']},
 {id:'mur-oberkampf',heading:45,width:29,depth:15,cut:false,duration:2600,phases:['facade|building|base','wall|panel','ink|stroke|letter','frame|edge|signature']},
 {id:'la-place',heading:12,width:155,depth:115,cut:true,duration:3200,phases:['base|column|support','wing|roof','rib|beam','glass|edge|canopy']},
 {id:'centquatre',heading:-20,width:97,depth:145,cut:true,duration:3100,phases:['base|brick|entry|wall','hall','truss|beam','roof|glass|glazing','arch|gate|ridge']},
 {id:'philharmonie',heading:14,width:127,depth:137,cut:true,duration:3400,phases:['base|lower|hill','facet|hall|block','ribbon|band','bird|tile|window|edge']},
 {id:'shakespeare-company',heading:12,width:23,depth:19,cut:true,duration:2500,phases:['base|body|wall|building','window|door','awning|canopy','book|crate|sign|frame']}
];
const focusZooms={'notre-dame':17.2,'sainte-chapelle':17.7,'flamel-house':18.3,'saint-sulpice':17.1,'pere-lachaise':17.8,'republique':18,'abbesses':18.3,'mur-oberkampf':18.3,'la-place':16.9,'centquatre':16.8,'philharmonie':17,'shakespeare-company':18.3};
for(const landmark of LANDMARKS)landmark.focusZoom=focusZooms[landmark.id];
export const LANDMARK_IDS=LANDMARKS.map(p=>p.id);
export const registryById=new Map(LANDMARKS.map(p=>[p.id,p]));
export function validPoint(place){return typeof place?.lat==='number'&&typeof place?.lng==='number'&&Number.isFinite(place.lat)&&Number.isFinite(place.lng)&&Math.abs(place.lat)<85&&Math.abs(place.lng)<=180;}
export function localMeters(origin,point,scale){return {x:(point.x-origin.x)/scale,y:-(point.y-origin.y)/scale,z:0};}
export function exclusionPolygons(places){const coords=[];for(const p of places||[]){const entry=registryById.get(p.id);if(!entry?.cut||!validPoint(p))continue;const rad=-entry.heading*Math.PI/180,ring=[];for(const [sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]]){const x=sx*entry.width/2,y=sy*entry.depth/2,east=x*Math.cos(rad)-y*Math.sin(rad),north=x*Math.sin(rad)+y*Math.cos(rad);ring.push([p.lng+east/(111320*Math.cos(p.lat*Math.PI/180)),p.lat+north/111320]);}coords.push([ring]);}return {type:'MultiPolygon',coordinates:coords};}
export function exclusionFilter(places){const items=(places||[]).filter(p=>registryById.get(p.id)?.cut&&validPoint(p));if(!items.length)return ['literal',true];const clauses=[['!', ['within',exclusionPolygons(items)]]];for(const p of items){const distance=['flamel-house','shakespeare-company'].includes(p.id)?4:0;clauses.push(['>', ['distance',{type:'Point',coordinates:[p.lng,p.lat]}],distance]);}return ['all',...clauses];}
