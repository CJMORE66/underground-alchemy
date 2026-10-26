import * as THREE from 'three';
import {primaryBuilders} from './primary.js';
import {secondaryBuilders} from './secondary.js';
import {LANDMARKS,LANDMARK_IDS,registryById,validPoint,localMeters,exclusionPolygons,exclusionFilter} from './registry.js';
import {disposeScene} from './helpers.js';

export {LANDMARKS,LANDMARK_IDS,localMeters};
export {mountLandmarkStudy} from './study.js';
export const getLandmarkExclusionPolygons=exclusionPolygons;
export const getLandmarkExclusionFilter=exclusionFilter;
export const BUILDERS={...primaryBuilders,...secondaryBuilders};
export function createLandmarkModel(id){if(!BUILDERS[id])throw new RangeError(`Unknown landmark ${id}`);const group=BUILDERS[id]();group.userData.timeline=registryById.get(id);return group;}

/* Native MapLibre v6 custom layer: one shared context, real mesh depth, no idle clock. */
export function mountCityLandmarks(map,maplibregl,{places=[],onReady,onError}={}){
 const scene=new THREE.Scene(),camera=new THREE.Camera(),models=new Map();
 const origin=maplibregl.MercatorCoordinate.fromLngLat([2.355,48.868],0),scale=origin.meterInMercatorCoordinateUnits();
 let renderer,disposed=false,failed=false,selectedId=null,progress=1;
 const visibleIds=new Set();
 const frame=new THREE.Matrix4().makeTranslation(origin.x,origin.y,origin.z).scale(new THREE.Vector3(scale,-scale,scale));
 scene.add(new THREE.AmbientLight(0xffffff,.4));
 const key=new THREE.DirectionalLight(0xfff3c7,.6);key.position.set(-250,-200,400);scene.add(key);
 const fill=new THREE.DirectionalLight(0xe3f0ff,.18);fill.position.set(200,200,120);scene.add(fill);
 function report(error){if(failed||disposed)return;failed=true;queueMicrotask(()=>onError?.(error));}
 function prepare(group){group.userData.animated=[];const def=registryById.get(group.name);group.traverse(obj=>{if(!obj.isMesh)return;const index=Math.max(0,def.phases.findIndex(pattern=>new RegExp(pattern,'i').test(obj.name)));obj.material=obj.material.clone();obj.geometry.computeBoundingBox();group.userData.animated.push({node:obj,phase:index,position:obj.position.clone(),scale:obj.scale.clone(),base:obj.geometry.boundingBox.min.z});});}
 function addPlaces(items){for(const place of items){if(!validPoint(place)||!BUILDERS[place.id]||models.has(place.id))continue;const g=createLandmarkModel(place.id),point=maplibregl.MercatorCoordinate.fromLngLat([place.lng,place.lat],0),offset=localMeters(origin,point,scale);g.position.set(offset.x,offset.y,.7);g.rotation.z=-registryById.get(place.id).heading*Math.PI/180;prepare(g);scene.add(g);models.set(place.id,g);}}
 addPlaces(places);
 function applyReveal(group,p){const def=registryById.get(group.name),count=def.phases.length;for(const item of group.userData.animated){const start=item.phase/count*.72,span=.28;const v=Math.max(0,Math.min(1,(p-start)/span)),e=1-Math.pow(1-v,3);item.node.visible=v>0;item.node.scale.copy(item.scale);item.node.scale.z*=Math.max(.001,e);item.node.position.copy(item.position);item.node.position.z+=(1-e)*item.base;item.node.material.transparent=v<1;item.node.material.opacity=v;item.node.material.depthWrite=v>.45;}group.userData.revealProgress=p;}
 function setPlaces(items,id=selectedId){if(disposed)return;addPlaces(items);visibleIds.clear();for(const p of items||[])if(validPoint(p))visibleIds.add(p.id);for(const [key,g]of models)g.visible=visibleIds.has(key);select(id);}
 function select(id,{animate=false}={}){if(disposed)return;selectedId=models.has(id)?id:null;for(const [key,g]of models){g.userData.selected=key===selectedId;applyReveal(g,key===selectedId&&animate?0:1);}progress=animate?0:1;map.triggerRepaint?.();return selectedId?registryById.get(selectedId):null;}
 function setMotionProgress(value){if(disposed)return;const p=Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;progress=p;const group=models.get(selectedId);if(group)applyReveal(group,p);map.triggerRepaint?.();}
 function dispose(){if(disposed)return;disposed=true;disposeScene(scene);renderer?.dispose();renderer=null;models.clear();scene.clear();}
 const layer={id:'caisik-landmark-models',type:'custom',renderingMode:'3d',onAdd(_map,context){try{renderer=new THREE.WebGLRenderer({canvas:map.getCanvas(),context,antialias:true});renderer.autoClear=false;renderer.outputColorSpace=THREE.SRGBColorSpace;onReady?.({count:models.size,ids:[...models.keys()]});}catch(error){report(error);}},render(_context,args){if(disposed||failed||!renderer)return;try{const matrix=args?.defaultProjectionData?.mainMatrix;if(!matrix||matrix.length!==16)throw new Error('MapLibre projection matrix unavailable.');camera.projectionMatrix.fromArray(matrix).multiply(frame);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();renderer.resetState();renderer.render(scene,camera);renderer.resetState();}catch(error){report(error);}},onRemove(){dispose();}};
 try{map.addLayer(layer);}catch(error){report(error);dispose();}
 setPlaces(places);
 return {setPlaces,select,setMotionProgress,getState:()=>({selectedId,progress,count:models.size,disposed,failed}),getExclusionPolygons:()=>exclusionPolygons(places),destroy(){if(disposed)return;if(map.getLayer?.(layer.id))map.removeLayer(layer.id);if(!disposed)dispose();}};
}
