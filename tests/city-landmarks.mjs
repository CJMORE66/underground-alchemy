import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {LANDMARKS,LANDMARK_IDS,BUILDERS,createLandmarkModel,localMeters,getLandmarkExclusionPolygons,getLandmarkExclusionFilter,mountLandmarkStudy} from '../src/city-landmarks/index.js';
import {validateStyleMin} from '@maplibre/maplibre-gl-style-spec';
import {parseHTML} from 'linkedom';
const places=JSON.parse(fs.readFileSync(new URL('../dist/locations-data.json',import.meta.url),'utf8')).locations;
assert.deepEqual(LANDMARK_IDS,places.map(p=>p.id),'Every real atlas discovery has its own model identity');
assert.equal(new Set(Object.values(BUILDERS)).size,12,'Twelve distinct builders, not one reused generic block');
const metrics=[];
for(const entry of LANDMARKS){
 const g=createLandmarkModel(entry.id);g.updateMatrixWorld(true);
 assert.equal(g.name,entry.id);assert(g.userData.illustrative);assert(g.userData.features.length>=3,`${entry.id} has named architectural features`);
 let meshes=0,vertices=0;g.traverse(o=>{if(!o.isMesh)return;meshes++;const pos=o.geometry.getAttribute('position');vertices+=pos.count;for(const number of pos.array)assert(Number.isFinite(number),`${entry.id}: finite mesh coordinate`);assert(o.material);});
 assert(meshes>=20,`${entry.id}: a composed building rather than an icon`);assert(meshes<500,'Mesh count remains bounded');
 const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());
 assert(size.x>3&&size.y>3&&size.z>3);assert(size.x<210&&size.y<210&&size.z<110,`${entry.id} has neighbourhood-scale bounds`);
 assert(entry.duration>=2000&&entry.duration<=4000);assert(entry.phases.length>=4);assert(entry.focusZoom>=16&&entry.focusZoom<=19);
 metrics.push({id:entry.id,meshes,vertices,size:size.toArray().map(n=>+n.toFixed(1)),features:g.userData.features.length});
}
const nd=createLandmarkModel('notre-dame');
for(const needle of ['north-tower-open-bell-pier','south-tower-open-bell-pier','western-rose','flying-buttress','crossing-spire','portal'])assert(nd.getObjectsByProperty('isMesh',true).some(o=>o.name.includes(needle)),`Notre-Dame exposes recognizable ${needle}`);
const sulpice=createLandmarkModel('saint-sulpice');assert(!sulpice.getObjectByName('western-rose'),'Classical Saint-Sulpice is not given a Gothic rose');
const pere=createLandmarkModel('pere-lachaise');assert(!pere.getObjectsByProperty('isMesh',true).some(o=>o.name.includes('cross-above-gate')),'Do not restore the removed gate cross');
const polys=getLandmarkExclusionPolygons(places);assert.equal(polys.type,'MultiPolygon');assert.equal(polys.coordinates.length,8,'Only actual building context gets a tight extrusion exclusion');
assert.equal(getLandmarkExclusionPolygons([{id:'notre-dame',lat:null,lng:null}]).coordinates.length,0,'Null coordinates never become a geographic model');
for(const [polygon]of polys.coordinates){assert.deepEqual(polygon[0],polygon.at(-1));for(const [lng,lat]of polygon){assert(lng>2.2&&lng<2.5&&lat>48.7&&lat<49);}}
const style=JSON.parse(fs.readFileSync(new URL('../dist/map-data/caisik-style.json',import.meta.url),'utf8'));style.layers.find(l=>l.id==='caisik-buildings').filter=getLandmarkExclusionFilter(places);assert.deepEqual(validateStyleMin(style),[],'Actual MapLibre specification accepts the geometric exclusion filter');
const offset=localMeters({x:.5,y:.5},{x:.500002,y:.499997},1e-7);assert(Math.abs(offset.x-20)<1e-6&&Math.abs(offset.y-30)<1e-6);assert(offset.x>0&&offset.y>0,'Map east and north match local authored axes');
assert(fs.statSync(new URL('../dist/city-landmarks.js',import.meta.url)).size<800000,'Lazy model bundle remains bounded');
{
 const previous=globalThis.document,{document,window}=parseHTML('<html><body><div id="study"></div></body></html>');globalThis.document=document;
 const frames=new Map();let serial=0;window.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};window.cancelAnimationFrame=id=>frames.delete(id);window.matchMedia=()=>({matches:false,addEventListener(){}});
 const viewer=mountLandmarkStudy(document.getElementById('study'),{id:'notre-dame'});assert(document.querySelectorAll('svg path').length>100,'Fallback projects actual model faces into SVG');
 viewer.setMotionProgress(.2);assert.equal(viewer.getState().progress,.2);viewer.setMotionProgress(1);assert.equal(viewer.getState().progress,1);
 assert(viewer.select('abbesses'));assert.match(document.querySelector('svg').getAttribute('aria-label'),/Guimard/);assert(document.querySelectorAll('svg path').length>20);
 viewer.play();assert.equal(frames.size,1,'Only explicit replay schedules a finite clock');document.documentElement.dataset.motion='off';document.dispatchEvent(new window.Event('visibilitychange'));assert.equal(frames.size,0);assert.equal(viewer.getState().progress,1);
 viewer.destroy();assert.equal(document.getElementById('study').children.length,0);assert.equal(frames.size,0);globalThis.document=previous;
}
console.log('PASS city landmarks: twelve distinct mesh models, recognizable architecture, finite bounded geometry, independent phase timelines, geographic identity/exclusions and local coordinate signs.');
console.log(JSON.stringify(metrics));
