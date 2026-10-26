/* CPU projection of the same authored meshes, for study and non-WebGL devices. */
import * as THREE from 'three';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import {primaryBuilders} from './primary.js';
import {secondaryBuilders} from './secondary.js';
import {registryById} from './registry.js';
import {disposeScene} from './helpers.js';
const builders={...primaryBuilders,...secondaryBuilders};

export function mountLandmarkStudy(host,{id='notre-dame',onReady,onError}={}){
 if(!host)throw new TypeError('A study host is required.');
 const doc=host.ownerDocument,win=doc.defaultView||window,abort=new AbortController(),scene=new THREE.Scene();
 let renderer,model,parts=[],fitPoints=[],frame=0,playStart=0,disposed=false,angle=-.72,elevation=.64,distance=120,center=new THREE.Vector3(),progress=1,selectedId=id;
 const camera=new THREE.PerspectiveCamera(38,1,.1,3000);camera.up.set(0,0,1);
 // SVGRenderer sums ambient colors directly and does not use ambient intensity.
 scene.add(new THREE.AmbientLight(new THREE.Color(0xffffff).multiplyScalar(.4),1));const key=new THREE.DirectionalLight(0xfff3c7,.55);key.position.set(-200,-250,400);scene.add(key);
 const region=doc.createElement('div');region.className='landmark-study';region.setAttribute('role','group');region.setAttribute('aria-label','Prostorová studie budovy CAISIK');
 const title=doc.createElement('p');title.className='landmark-study-title';
 const controls=doc.createElement('div');controls.className='landmark-study-controls';
 const note=doc.createElement('p');note.className='landmark-study-note';note.textContent='Autorský prostorový model. Zjednodušené proporce; není to architektonický průzkum. Tažením nebo šipkami měníš pohled.';
 const phase=doc.createElement('p');phase.className='landmark-study-phase';phase.setAttribute('role','status');
 function button(text,label,fn){const b=doc.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.addEventListener('click',fn,{signal:abort.signal});controls.append(b);return b;}
 const replay=button('OŽIVIT BUDOVU ↗','Přehrát samostatnou proměnu budovy',()=>play());
 button('←','Otočit model doleva',()=>{stop();angle-=.32;draw();});button('→','Otočit model doprava',()=>{stop();angle+=.32;draw();});
 button('↑','Zvýšit pohled na model',()=>{stop();elevation=Math.min(1.2,elevation+.15);draw();});button('↓','Snížit pohled na model',()=>{stop();elevation=Math.max(.2,elevation-.15);draw();});
 button('RESET','Obnovit pohled na model',()=>{stop();angle=-.72;elevation=.64;setMotionProgress(1);});
 const range=doc.createElement('input');range.type='range';range.min='0';range.max='100';range.value='100';range.setAttribute('aria-label','Prozkoumat jednotlivé části modelu');range.addEventListener('input',()=>{stop();setMotionProgress(Number(range.value)/100);},{signal:abort.signal});
 region.append(title,controls,range,phase,note);host.append(region);
 const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)');
 const motionAllowed=()=>!doc.hidden&&!reduced?.matches&&doc.documentElement.dataset.motion!=='off'&&!['off','reduced','quiet','calm'].includes(doc.documentElement.dataset.selfmadeMotion)&&!host.closest('[hidden],[aria-hidden="true"]')&&(!host.closest('dialog')||host.closest('dialog').open);
 function stop(){if(frame)win.cancelAnimationFrame(frame);frame=0;}
 function draw(){if(disposed||!renderer||!model)return;const width=Math.max(240,Math.min(1200,host.clientWidth||600)),height=Math.round(Math.min(460,Math.max(290,width*.74)));renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
  const direction=new THREE.Vector3(Math.sin(angle)*Math.cos(elevation),-Math.cos(angle)*Math.cos(elevation),Math.sin(elevation)),right=new THREE.Vector3(Math.cos(angle),Math.sin(angle),0),up=new THREE.Vector3().crossVectors(direction,right),target=center.clone(),projected=new THREE.Vector3();let fitDistance=distance;
  // Full-model points stay fixed during reveal, so framing does not jump as parts appear.
  for(let step=0;step<4;step++){camera.position.copy(target).addScaledVector(direction,fitDistance);camera.lookAt(target);camera.updateMatrixWorld();let left=Infinity,rightEdge=-Infinity,bottom=Infinity,top=-Infinity;for(const point of fitPoints){projected.copy(point).project(camera);left=Math.min(left,projected.x);rightEdge=Math.max(rightEdge,projected.x);bottom=Math.min(bottom,projected.y);top=Math.max(top,projected.y);}const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));target.addScaledVector(right,(left+rightEdge)/2*fitDistance*tan*camera.aspect).addScaledVector(up,(bottom+top)/2*fitDistance*tan);fitDistance*=Math.max(.6,Math.max(rightEdge-left,top-bottom)/1.56);}
  camera.position.copy(target).addScaledVector(direction,fitDistance);camera.lookAt(target);camera.updateMatrixWorld();renderer.render(scene,camera);}
 function setMotionProgress(value){if(disposed||!model)return;progress=Math.max(0,Math.min(1,Number(value)||0));const def=registryById.get(selectedId),count=def.phases.length;for(const item of parts){const start=item.phase/count*.72,v=Math.max(0,Math.min(1,(progress-start)/.28)),e=1-Math.pow(1-v,3);item.node.visible=v>0;item.node.scale.copy(item.scale);item.node.scale.z*=Math.max(.001,e);item.node.position.copy(item.position);item.node.position.z+=(1-e)*item.base;item.node.material.opacity=v;item.node.material.transparent=v<1;}range.value=String(Math.round(progress*100));const label=progress===1?'CELÝ MODEL / VLASTNÍ ČTENÍ MÍSTA':`STAVBA / ${Math.min(count,Math.floor(progress*count)+1)} Z ${count} VRSTEV`;if(phase.textContent!==label)phase.textContent=label;draw();}
 function tick(now){frame=0;if(disposed)return;if(!motionAllowed()){setMotionProgress(1);return;}const duration=registryById.get(selectedId).duration,p=Math.min(1,(now-playStart)/duration);setMotionProgress(p);if(p<1)frame=win.requestAnimationFrame(tick);}
 function play(){stop();if(!motionAllowed()){setMotionProgress(1);return;}playStart=win.performance.now();setMotionProgress(0);frame=win.requestAnimationFrame(tick);}
 function select(next){stop();if(!builders[next])return false;if(model){scene.remove(model);disposeScene(model);}selectedId=next;model=builders[next]();const def=registryById.get(next);parts=[];model.traverse(obj=>{if(!obj.isMesh)return;obj.geometry.computeBoundingBox();obj.material=obj.material.clone();const phase=Math.max(0,def.phases.findIndex(p=>new RegExp(p,'i').test(obj.name)));parts.push({node:obj,phase,position:obj.position.clone(),scale:obj.scale.clone(),base:obj.geometry.boundingBox.min.z});});scene.add(model);model.updateMatrixWorld(true);const unique=new Map();model.traverse(obj=>{if(!obj.isMesh)return;const positions=obj.geometry.getAttribute('position'),point=new THREE.Vector3();for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(obj.matrixWorld);unique.set(point.toArray().map(n=>n.toFixed(3)).join(','),point.clone());}});fitPoints=[...unique.values()];const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());bounds.getCenter(center);distance=Math.max(size.x,size.y,size.z)*1.7;title.textContent=model.userData.title;renderer.domElement.setAttribute('aria-label',`${model.userData.title}. Projekce skutečné trojrozměrné geometrie.`);setMotionProgress(1);return true;}
 let resizeObserver,preferenceObserver,pointer;
 try{renderer=new SVGRenderer();renderer.setQuality('high');renderer.setClearColor(0x080808,1);renderer.domElement.classList.add('landmark-study-scene');renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('tabindex','0');region.insertBefore(renderer.domElement,controls);select(id);
  const svg=renderer.domElement;svg.style.touchAction='pan-y';svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;stop();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,angle,elevation};svg.setPointerCapture?.(e.pointerId);},{signal:abort.signal});
  svg.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;angle=pointer.angle+(e.clientX-pointer.x)*.009;elevation=Math.max(.2,Math.min(1.2,pointer.elevation-(e.clientY-pointer.y)*.005));draw();},{signal:abort.signal});
  const end=()=>{pointer=null;};svg.addEventListener('pointerup',end,{signal:abort.signal});svg.addEventListener('pointercancel',end,{signal:abort.signal});
  svg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();stop();if(e.key==='ArrowLeft')angle-=.24;if(e.key==='ArrowRight')angle+=.24;if(e.key==='ArrowUp')elevation=Math.min(1.2,elevation+.1);if(e.key==='ArrowDown')elevation=Math.max(.2,elevation-.1);if(e.key==='Home'){angle=-.72;elevation=.64;}draw();},{signal:abort.signal});
  if(win.ResizeObserver){resizeObserver=new win.ResizeObserver(draw);resizeObserver.observe(host);}const preference=()=>{if(!motionAllowed()){stop();setMotionProgress(1);}};
  doc.addEventListener('visibilitychange',preference,{signal:abort.signal});reduced?.addEventListener?.('change',preference,{signal:abort.signal});
  if(win.MutationObserver){preferenceObserver=new win.MutationObserver(preference);preferenceObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['data-motion','data-selfmade-motion']});}
  onReady?.({id,renderer:'svg-projection',mesh:true});
 }catch(error){stop();onError?.(error);note.textContent='Model se nepodařilo zobrazit. Ilustrace a zdroje místa zůstávají dostupné.';}
 return {select,setMotionProgress,play,getState:()=>({id:selectedId,progress,playing:!!frame,disposed,renderer:'svg-projection'}),destroy(){if(disposed)return;stop();disposed=true;abort.abort();resizeObserver?.disconnect();preferenceObserver?.disconnect();disposeScene(scene);scene.clear();region.remove();}};
}
