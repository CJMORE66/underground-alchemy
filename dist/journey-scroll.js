/* Native scroll writes the scene. Existing content and actions remain intact. */
(() => {
 'use strict';
 if(window.CaisikJourneyScroll)return;
 const doc=document,root=doc.documentElement,NS='http://www.w3.org/2000/svg';
 const chapters=[
  {id:'hidden-city',label:'MĚSTO',word:'STONE',title:'OD SIGNÁLU K MÍSTU.',copy:'Najdi skutečný bod. Všimni si detailu. Teprve potom mu dej význam.',kind:'map'},
  {id:'principles',label:'MYSL',word:'MIND',title:'ZMĚŇ ÚHEL. ZMĚŇ ČTENÍ.',copy:'Stejné město. Jiná otázka. Sleduj, co se změní v tvé pozornosti.',kind:'eye'},
  {id:'frequency',label:'HLAS',word:'SOUND',title:'ULICE DOSTÁVÁ HLAS.',copy:'Pozorovaný detail proměň v rytmus, obraz nebo vlastní větu.',kind:'sound'},
  {id:'living-wall',label:'STOPA',word:'SIGNS',title:'HLAS SE MĚNÍ VE STOPU.',copy:'Zkoušej. Překresli rozhodnutí. Tvůj výstup patří do Blackbooku.',kind:'ink'},
  {id:'manifesto',label:'DÁL',word:'SELFMADE'}
 ];
 const scenes=new Map(),sections=new Map(),seen=new Set(),removers=[];
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const main=doc.querySelector('main');
 let rail,railValue,railLabel,railIdentity,frame=0,disposed=false,sleeping=false,lastY=0,direction='forward',io,resize,mutations,preferences;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const t=source=>{try{const translated=window.CaisikI18n?.t?.(source);return typeof translated==='string'?translated:source;}catch{return source;}};
 const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);removers.push(()=>target.removeEventListener(type,handler,options));};
 const make=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 const node=(tag,attrs={})=>{const el=doc.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;};
 const motionAllowed=()=>!disposed&&!sleeping&&!doc.hidden&&!reduced?.matches&&root.dataset.motion!=='off'&&!['off','quiet','calm','reduced'].includes(root.dataset.selfmadeMotion)&&!doc.body.classList.contains('simple-mode')&&!doc.body.classList.contains('exp-field')&&!doc.querySelector('.culture-board.cb-field');
 const blocked=()=>!!doc.querySelector('dialog[open]');
 function graphics(kind){
  const svg=node('svg',{viewBox:'0 0 1000 360','aria-hidden':'true',focusable:'false',class:`journey-svg journey-svg-${kind}`});
  const line=(parent,d,cls='journey-draw',i=0)=>{const path=node('path',{d,class:cls,pathLength:1,'data-journey-draw':i});parent.append(path);return path;};
  const group=cls=>{const g=node('g',{class:cls});svg.append(g);return g;};
  const grid=group('journey-map-grid');
  for(let i=0;i<8;i++)line(grid,`M${80+i*120} 338 500 ${35+i*15}`,'journey-grid-line',i);
  for(let i=0;i<5;i++)line(grid,`M${60+i*24} ${290-i*37}H${940-i*24}`,'journey-grid-line',i);
  const orbit=group('journey-orbit');orbit.append(node('circle',{cx:500,cy:180,r:137}),node('circle',{cx:500,cy:180,r:157,'stroke-dasharray':'2 13'}));
  line(orbit,'M500 7V38M500 322V353M327 180H357M643 180H673M378 58 401 81M600 280 623 303M379 302 402 279M599 82 622 59','journey-orbit-ticks');
  if(kind==='map'){
   const buildings=group('journey-buildings');
   line(buildings,'M365 290V112l60-34 58 34v178M425 78v212M365 112l60 36 58-36M510 290V68l56-32 56 32v222M566 36v254M510 68l56 32 56-32M652 290V149l46-26 48 26v141M698 123v167','journey-draw',0);
   for(let i=0;i<3;i++)line(buildings,`M${385+i*6} ${145+i*44}l25 14v27l-25-14M${527+i*4} ${109+i*47}l25 14v26l-25-14M${668+i*4} ${174+i*35}l17 10v20l-17-10`,'journey-draw',i+1);
   const path=group('journey-route');line(path,'M91 296 260 252 354 308 531 251 740 307 914 227','journey-route-line',1);for(const[x,y]of[[91,296],[260,252],[531,251],[740,307],[914,227]])path.append(node('circle',{cx:x,cy:y,r:7,class:'journey-route-point'}));
  }else if(kind==='eye'){
   const eye=group('journey-eye');line(eye,'M268 180Q500-34 732 180Q500 394 268 180Z','journey-draw',0);line(eye,'M290 180Q500 13 710 180Q500 347 290 180Z','journey-draw',1);
   const iris=node('g',{class:'journey-iris'});eye.append(iris);iris.append(node('circle',{cx:500,cy:180,r:83}),node('circle',{cx:500,cy:180,r:28,class:'journey-pupil'}));
   for(let i=0;i<12;i++){const a=i*Math.PI/6;line(iris,`M${500+Math.cos(a)*43} ${180+Math.sin(a)*43} ${500+Math.cos(a)*78} ${180+Math.sin(a)*78}`,'journey-iris-ray',i%4);}
   const geometry=group('journey-thought');line(geometry,'M500 20 639 260H361ZM500 340 361 100H639Z','journey-draw',2);line(geometry,'M131 180H267M733 180H869M168 154v52M832 154v52','journey-draw',3);
  }else if(kind==='sound'){
   const city=group('journey-sound-city');line(city,'M80 289V190h47v-61h49v160h32V79h51v210h34V147h57v142h34V105h49v184h34V169h44v120','journey-draw',0);
   const waves=group('journey-wave-bank');for(let i=0;i<17;i++){const height=30+Math.abs(Math.sin(i*.68))*150,x=500+i*23;line(waves,`M${x} ${180-height/2}V${180+height/2}`,'journey-wave-bar',i%5);}
   line(waves,'M418 180H481M883 180H938','journey-draw',1);
   const frequency=group('journey-frequency');for(const r of[45,72,99])line(frequency,`M${500+r*.7} ${180-r*.7}A${r} ${r} 0 0 1 ${500+r*.7} ${180+r*.7}`,'journey-draw',r/45);
  }else{
   const sound=group('journey-letter-sound');line(sound,'M58 180H118l17-44 22 90 25-130 24 166 26-120 24 75 25-37H350','journey-draw',0);
   const ink=group('journey-letters');line(ink,'M339 254 425 82l63 22-47 67 56-14-44 82-59 37Z','journey-letter-face',0);line(ink,'M457 281 535 54l61 18-29 63 82-30-40 82-65 22-21 59Z','journey-letter-face',1);line(ink,'M601 263 652 111l57 20-21 48 63-19-42 85-73 38Z','journey-letter-face',2);line(ink,'M388 236 428 151M504 251 549 119M646 240 669 166','journey-letter-cut',3);line(ink,'M320 304Q556 229 797 286M373 319l317 7','journey-route-line',3);line(ink,'M468 277v46M482 282v56M700 275v39','journey-draw',4);
   const star=group('journey-ink-star');line(star,'m792 74 10 37 38 8-36 13-8 38-13-36-38-8 36-13Z','journey-star-path',0);
  }
  return svg;
 }
 function applyLanguage(){
  if(rail){rail.setAttribute('aria-label',t('Tvoje cesta městem'));railIdentity.textContent=t('CAISIK / TVOJE CESTA');rail.querySelector('[role=progressbar]').setAttribute('aria-label',t('Průchod stránkou'));for(const chapter of chapters){const link=rail.querySelector(`[data-journey-chapter="${chapter.id}"]`);if(link)link.textContent=t(chapter.label);}}
  for(const item of scenes.values()){item.el.setAttribute('aria-label',t(item.chapter.title));item.title.textContent=t(item.chapter.title);item.description.textContent=t(item.chapter.copy);item.label.textContent=`${t('PŘECHOD')} ${String(item.index+1).padStart(2,'0')} / ${t('TY JSI AUTOR')}`;}
 }
 function makeBridge(chapter,index,target){
  const el=make('section',`journey-bridge journey-bridge-${chapter.kind}`);el.dataset.journeyBridge=chapter.id;el.setAttribute('data-text-motion','off');
  const visual=make('div','journey-bridge-visual');visual.append(graphics(chapter.kind));const copy=make('div','journey-bridge-copy'),label=make('p','journey-bridge-index'),title=make('h2','journey-bridge-title'),description=make('p','journey-bridge-description'),word=make('span','journey-bridge-word',chapter.word);copy.append(label,title,description);word.setAttribute('aria-hidden','true');el.append(word,visual,copy);target.before(el);
  const item={el,target,chapter,index,label,title,description,progress:1,draws:[...el.querySelectorAll('[data-journey-draw]')]};scenes.set(chapter.id,item);io?.observe(el);return item;
 }
 function makeRail(){
  const present=chapters.filter(chapter=>doc.getElementById(chapter.id));if(!present.length)return;
  rail=make('nav','journey-rail');rail.setAttribute('data-text-motion','off');railIdentity=make('span','journey-rail-identity');const links=make('div','journey-rail-links');for(const chapter of present){const a=make('a','journey-rail-link');a.href=`#${chapter.id}`;a.dataset.journeyChapter=chapter.id;links.append(a);}
  const progress=make('div','journey-rail-meter');progress.setAttribute('role','progressbar');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow','0');railValue=make('span','journey-rail-meter-value');progress.append(railValue);railLabel=make('span','journey-rail-percent','00');railLabel.setAttribute('aria-hidden','true');rail.append(railIdentity,links,progress,railLabel);const first=[...scenes.values()][0]?.el||doc.getElementById(present[0].id);first.before(rail);
 }
 function scan(){
  if(disposed||!main)return;
  chapters.forEach((chapter,index)=>{const target=doc.getElementById(chapter.id);if(!target||!main.contains(target))return;if(!sections.has(chapter.id)){const ruler=make('span','journey-section-ruler');ruler.setAttribute('aria-hidden','true');target.prepend(ruler);target.dataset.journeySection=chapter.id;sections.set(chapter.id,{el:target,ruler});}if(chapter.kind&&!scenes.has(chapter.id))makeBridge(chapter,index,target);});
  if(!rail)makeRail();applyLanguage();schedule();
 }
 function writeScene(scene,p){
  scene.progress=p;scene.el.style.setProperty('--journey-p',p.toFixed(4));scene.el.style.setProperty('--journey-turn',`${(-32+p*100).toFixed(2)}deg`);scene.el.style.setProperty('--journey-iris',(0.35+p*.65).toFixed(4));scene.el.style.setProperty('--journey-before',(1-clamp((p-.12)/.7)).toFixed(4));scene.el.style.setProperty('--journey-after',clamp((p-.08)/.7).toFixed(4));
  for(const path of scene.draws){const stagger=Math.min(Number(path.dataset.journeyDraw)||0,5)*.035;path.style.strokeDashoffset=(1-clamp((p-stagger)/.66)).toFixed(4);}
 }
 function update(){
  frame=0;if(disposed||sleeping||doc.hidden)return;const vh=window.innerHeight||root.clientHeight||800,y=Math.max(0,window.scrollY||window.pageYOffset||0),allowed=motionAllowed()&&!blocked();if(Math.abs(y-lastY)>1)direction=y>lastY?'forward':'backward';lastY=y;root.dataset.journeyDirection=direction;root.classList.toggle('journey-motion-active',allowed);rail?.classList.toggle('journey-obscured',blocked());
  let active=chapters.find(chapter=>sections.has(chapter.id))?.id;
  for(const chapter of chapters){const item=sections.get(chapter.id);if(!item)continue;const rect=item.el.getBoundingClientRect();if(rect.top<=vh*.35)active=chapter.id;item.el.style.setProperty('--journey-section-p',clamp((vh*.55-rect.top)/Math.max(vh*.4,rect.height)).toFixed(4));}
  for(const scene of scenes.values()){const rect=scene.el.getBoundingClientRect(),p=clamp((vh*.91-rect.top)/(vh*.75+Math.max(rect.height,1)));if(allowed&&(!io||seen.has(scene.el))){scene.el.classList.add('journey-is-live');writeScene(scene,p);}else{scene.el.classList.remove('journey-is-live');writeScene(scene,1);}}
  if(rail){for(const link of rail.querySelectorAll('[data-journey-chapter]')){const current=link.dataset.journeyChapter===active;link.classList.toggle('is-current',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}rail.dataset.activeChapter=active||'';const height=Math.max(root.scrollHeight||0,doc.body.scrollHeight||0)-vh,p=height>0?clamp(y/height):0,percent=Math.round(p*100);railValue.style.transform=`scaleX(${p.toFixed(4)})`;rail.querySelector('[role=progressbar]').setAttribute('aria-valuenow',String(percent));railLabel.textContent=String(percent).padStart(2,'0');}
 }
 function schedule(){if(!disposed&&!sleeping&&!doc.hidden&&!frame)frame=requestAnimationFrame(update);}
 function preferenceChanged(){if(frame){cancelAnimationFrame(frame);frame=0;}if(doc.hidden||sleeping){root.classList.remove('journey-motion-active');for(const scene of scenes.values()){scene.el.classList.remove('journey-is-live');writeScene(scene,1);}return;}schedule();}
 function destroy(){if(disposed)return;disposed=true;if(frame)cancelAnimationFrame(frame);frame=0;io?.disconnect();resize?.disconnect();mutations?.disconnect();preferences?.disconnect();removers.forEach(fn=>fn());rail?.remove();for(const scene of scenes.values())scene.el.remove();for(const item of sections.values()){item.ruler.remove();delete item.el.dataset.journeySection;item.el.style.removeProperty('--journey-section-p');}scenes.clear();sections.clear();seen.clear();root.classList.remove('journey-motion-active','journey-ready');delete root.dataset.journeyDirection;}
 if(typeof IntersectionObserver==='function')io=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)seen.add(entry.target);else seen.delete(entry.target);}schedule();},{rootMargin:'100px 0px',threshold:[0,.1,.5,1]});
 if(typeof ResizeObserver==='function'&&main){resize=new ResizeObserver(schedule);resize.observe(main);}
 if(typeof MutationObserver==='function'){
  mutations=new MutationObserver(records=>{if(records.some(record=>record.type==='attributes'&&((record.target.tagName==='DIALOG'&&record.attributeName==='open')||(record.target.classList?.contains('culture-board')&&record.attributeName==='class'))))preferenceChanged();if(records.some(record=>record.type==='childList'&&[...record.addedNodes,...record.removedNodes].some(n=>n.nodeType===1&&!n.matches?.('.journey-bridge,.journey-rail,.journey-section-ruler')&&(n.matches?.('section,dialog')||n.querySelector?.('section,dialog')))))scan();});mutations.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','class']});preferences=new MutationObserver(preferenceChanged);preferences.observe(root,{attributes:true,attributeFilter:['data-motion','data-selfmade-motion']});preferences.observe(doc.body,{attributes:true,attributeFilter:['class']});
 }
 listen(window,'scroll',schedule,{passive:true});listen(window,'resize',schedule,{passive:true});listen(doc,'visibilitychange',preferenceChanged);if(reduced?.addEventListener)listen(reduced,'change',preferenceChanged);listen(window,'caisik:languagechange',applyLanguage);
 listen(window,'pagehide',event=>{if(event.persisted){sleeping=true;preferenceChanged();}else destroy();});listen(window,'pageshow',()=>{sleeping=false;schedule();});
 window.CaisikJourneyScroll={rescan:scan,destroy,stats:()=>({bridges:scenes.size,sections:sections.size,scheduled:!!frame,direction,allowed:motionAllowed(),active:rail?.dataset.activeChapter||null,progress:Object.fromEntries([...scenes].map(([id,item])=>[id,item.progress]))})};
 if(main){root.classList.add('journey-ready');scan();}
})();
