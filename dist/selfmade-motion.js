/* CAISIK: authored construction layers over untouched original paintings.
   The overlay is a contemporary visual analysis, never recovered painted layers. */
(() => {
  'use strict';
  const doc = document;
  const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modeFor = item => {
    const text = `${item.category || ''} ${item.title || ''} ${item.description || ''}`.toLowerCase();
    if (/mental|inner world|eye|thyself|perception/.test(text)) return 'perception';
    if (/rhythm|balance|breaking|step|danc/.test(text)) return 'rhythm';
    if (/correspond|above|below|connect|mirror/.test(text)) return 'correspondence';
    if (/letter|writer|graffiti|handstyle|tag|transmute/.test(text)) return 'letters';
    if (/hip-hop|sound|voice|mic|vinyl|beat|vibr|groove|freestyle/.test(text)) return 'frequency';
    return 'geometry';
  };
  const phaseFor = p => Math.min(3, Math.floor(clamp(p) * 4));
  const modes = {
    letters: {name:'KONSTRUKCE PÍSMENE', parts:['Osa a směr','Hmota a negativní prostor','Obrys a spojení','Vlastní rozhodnutí'], notes:['Najdi hlavní směr tahu v původním díle. Žlutá osa je autorská pomůcka, nikoli obkreslený originál.','Porovnej plnou hmotu s průhledy mezi tahy. Který prostor pomáhá čitelnosti?','Sleduj, jak opakování úhlů propojuje jednotlivé části. Zkus je nakreslit zvlášť.','Vyber jednu vazbu a navrhni vlastní variantu ve Writer dílně.']},
    frequency: {name:'ZVUK JAKO STRUKTURA', parts:['Poslech bez zvuku','Puls a pauza','Vrstvy a kontrast','Vlastní rytmus'], notes:['Najdi vizuální opakování. Tato scéna je tichá: neanalyzuje žádnou skutečnou nahrávku.','Kruhy znázorňují puls a mezery mezi ním. Vyber, kam by patřila pauza.','Porovnej pravidelný základ s odlišným akcentem. Co má v kompozici hlavní slovo?','Převeď poměr opakování a pauzy do svého textu nebo rytmu v dílně.']},
    rhythm: {name:'NÁVRAT A ZMĚNA', parts:['Bod opory','Celý pohyb','Akcent při návratu','Vlastní fráze'], notes:['Urči, co v kompozici zůstává oporou a co se mění.','Kyvadlo se pohybuje jako jeden celek kolem pevného bodu. Jde o vizuální analogii rytmu.','Označ v představě jeden návrat a zkus na něj umístit slabiku či vizuální akcent.','Pohybová ilustrace není návod k taneční technice. Vlastní frázi přizpůsob zkušenosti a odbornému vedení.']},
    perception: {name:'OD MYŠLENKY K OBRAZU', parts:['Černé prázdno','První záměr','Rostoucí souvislosti','Celý vlastní svět'], notes:['Prázdno nechává prostor pro záměr. Původní malba zůstává zachovaná pod samostatným autorským diagramem.','Oko se otevírá a z bodu vzniká první konstrukce. Kterou otázkou by začalo tvoje dílo?','Jedno rozhodnutí vytváří vazby k dalším. Diagram je filozofická metafora, ne fyzikální tvrzení.','Vyber jednu věc, kterou chceš proměnit vlastní prací; zapiš první konkrétní pokus.']},
    correspondence: {name:'DETAIL A CELEK', parts:['Jedna jednotka','Zrcadlená vazba','Dvě měřítka','Hranice přirovnání'], notes:['Vyber jeden konkrétní tvar v obraze.','Autorský diagram propojuje dvě zrcadlené konstrukce. Podobnost sama není historický důkaz.','Porovnej rytmus detailu s rytmem celé kompozice.','Pojmenuj užitečnou podobnost a také místo, kde přirovnání přestává fungovat.']},
    geometry: {name:'ČTENÍ KOMPOZICE', parts:['Těžiště','Hlavní směry','Vztahy symbolů','Vlastní čtení'], notes:['Najdi těžiště původního obrazu. Který detail tě přitáhl první?','Překryv ukazuje autorské konstrukční osy; netvrdí, že je autor původně použil.','Sleduj vztah kruhu, úhlu a volné plochy. Odděl pozorování od interpretace.','Zapiš svoje čtení a vyber jeden podnět pro vlastní tvorbu.']}
  };
  const graphic = (mode='geometry') => `<svg class="sm-construction" viewBox="0 0 600 400" aria-hidden="true" focusable="false"><g class="sm-construction-axes"><path d="M35 200H565M300 25V375M90 340 300 40 510 340ZM90 60 510 60 300 360Z"/><circle cx="300" cy="200" r="166"/></g><g class="sm-construction-rings"><circle cx="300" cy="200" r="125"/><circle cx="300" cy="200" r="110" stroke-dasharray="2 10"/><path d="M175 200H425M300 75V325"/></g><g class="sm-construction-links"><path d="M75 285 170 145 300 200 430 145 525 285M75 285 300 200 525 285M170 145 300 65 430 145"/><circle cx="75" cy="285" r="8"/><circle cx="170" cy="145" r="8"/><circle cx="430" cy="145" r="8"/><circle cx="525" cy="285" r="8"/></g><g class="sm-construction-eye"><path class="sm-eye-outline" d="M225 200Q300 120 375 200Q300 280 225 200Z"/><g class="sm-eye-iris"><circle cx="300" cy="200" r="29"/><circle cx="300" cy="200" r="11"/></g></g>${mode==='letters'?'<g class="sm-letter-skeleton"><path d="M170 285 250 115 330 285M212 217H301M315 115 400 115 355 200 420 285M348 200H390"/></g>':''}${mode==='frequency'?'<g class="sm-wave"><path d="M45 200 65 200 78 175 90 228 105 155 120 250 140 175 155 200H190M410 200H440L456 150 473 255 490 175 505 220 520 200H555"/></g>':''}${mode==='rhythm'?'<g class="sm-pendulum"><path d="M300 45V250"/><path class="sm-pendulum-bob" d="M300 240 327 270 300 302 273 270Z"/></g>':''}${mode==='correspondence'?'<g class="sm-mirror"><path d="M180 180v-20h25v-20h25v-20h25M345 280h25v-20h25v-20h25v-20"/></g>':''}<g class="sm-sun-orbit"><g transform="translate(300 35)"><circle r="13"/><path d="M0-23V-17M0 17V23M-23 0H-17M17 0H23M-16-16-12-12M12 12 16 16M-16 16-12 12M12-12 16-16"/></g></g><g class="sm-moon-orbit"><path d="M300 352a15 15 0 1 0 17 19 14 14 0 0 1-17-19Z"/></g></svg>`;

  // Pure helpers are public for diagnostics; no state or personal material is exposed.
  window.CaisikSelfmadeMotion = Object.freeze({modeFor,phaseFor});
  const reduced = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false,addEventListener(){},removeEventListener(){}};
  const lifecycle = new AbortController();
  const {signal} = lifecycle;
  const frames = new Set();
  const worlds = new Set();
  let serial=0, current=null, dialog=null, dialogFrame=0, lastDialogTime=0, dialogPhase=1, dialogPlaying=false, stopped=false;
  function storedMotion(){try{return localStorage.getItem('atlas-motion');}catch{return null;}}
  function permitted(){return !reduced.matches && !doc.hidden && doc.documentElement.dataset.motion!=='off' && !['quiet','reduced','calm','off'].includes(doc.documentElement.dataset.selfmadeMotion) && !doc.body?.classList.contains('simple-mode') && !doc.body?.classList.contains('exp-field') && storedMotion()!=='"off"' && storedMotion()!=='off';}
  function sync(){
    const allowed=permitted(), obscured=Boolean(doc.querySelector('dialog[open]'));
    for(const item of frames) item.frame.classList.toggle('sm-is-moving',allowed&&item.visible&&!obscured);
    for(const world of worlds) world.classList.toggle('sm-is-moving',allowed&&world._visible!==false&&!obscured);
    if(!allowed){stopDialog();for(const world of worlds)world.audioLevel?.(0);}
  }
  const observer = window.IntersectionObserver ? new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target.localName==='selfmade-world'){entry.target._visible=entry.isIntersecting;}else{const item=[...frames].find(x=>x.frame===entry.target);if(item)item.visible=entry.isIntersecting;}}sync();},{rootMargin:'35px'}) : null;
  function descriptor(img){
    const slug=img.closest('[data-slug]')?.dataset.slug;
    const archive=Array.isArray(window.CAISIK_ART)?window.CAISIK_ART.find(x=>x.slug===slug):null;
    const src=archive?.image || img.currentSrc || img.src || img.dataset.src || '';
    const title=archive?.title || img.closest('figure')?.querySelector('figcaption')?.textContent?.slice(0,100) || img.alt || 'CAISIK artwork';
    return {...archive,title,src,mode:modeFor(archive||{title,description:img.alt})};
  }
  function enhance(img){
    if(img.dataset.smMotion==='ready'||img.closest('.living-art,.caisik-logo,.alchemy-stage,.exp-art,.sm-motion-dialog,selfmade-world')||!img.parentNode)return;
    // Documentary/merchandise images are deliberately excluded from symbolic animation.
    const source=img.getAttribute('src')||img.getAttribute('data-src')||'';
    if(!/\/assets\/masterworks-v2\//.test(source)&&!img.hasAttribute('data-selfmade-art'))return;
    const item=descriptor(img), frame=doc.createElement('span');
    frame.className=`sm-scene-frame sm-mode-${item.mode}`;
    frame.setAttribute('aria-hidden','false');
    img.dataset.smMotion='ready';
    img.before(frame);frame.append(img);frame.insertAdjacentHTML('beforeend',graphic(item.mode));
    const record={frame,img,visible:!observer,item}; frames.add(record);observer?.observe(frame);
    frame.addEventListener('pointerenter',()=>frame.classList.add('sm-engaged'),{signal});
    frame.addEventListener('pointerleave',()=>frame.classList.remove('sm-engaged'),{signal});
    frame.parentElement.addEventListener('focusin',()=>frame.classList.add('sm-engaged'),{signal});
    frame.parentElement.addEventListener('focusout',()=>frame.classList.remove('sm-engaged'),{signal});
    // Door links remain single navigation targets; global pause controls their ambient layer.
    if(img.closest('.layer-doors'))return;
    let unit=null;if(frame.parentElement.matches('.expeditions-entry')){unit=doc.createElement('div');unit.className='sm-art-study-unit';frame.before(unit);unit.append(frame);}
    // Study action is a sibling of the existing open-art button, never nested in it.
    const host=unit||img.closest('.mw-art-card,.exp-hero-art,[data-selfmade-art-host]')||img.closest('a,button')?.parentElement||frame.parentElement;
    const action=doc.createElement('button');action.type='button';action.className='sm-study-button';
    action.textContent='◎ STUDOVAT POHYB';action.setAttribute('aria-label',`Studovat pohyb: ${item.title}`);
    action.addEventListener('click',()=>openStudy(descriptor(img),action),{signal});host.append(action);
  }
  function scan(){
    if(stopped)return;
    doc.querySelectorAll('.mw-art-open > img,.exp-hero-art > img,.layer-doors a > img,.expeditions-entry > img,.quest-cover > img,[data-selfmade-art]').forEach(enhance);
    for(const record of frames){if(!record.frame.isConnected){observer?.unobserve(record.frame);frames.delete(record);}}
    sync();
  }
  function makeDialog(){
    if(dialog)return;
    dialog=doc.createElement('dialog');dialog.className='sm-motion-dialog';dialog.setAttribute('aria-labelledby','sm-study-title');
    dialog.innerHTML=`<div class="sm-study-top"><p>AUTORSKÁ KONSTRUKČNÍ VRSTVA</p><button type="button" data-sm-close aria-label="Zavřít studium obrazu">ZAVŘÍT ×</button></div><h2 id="sm-study-title"></h2><div class="sm-study-stage"><img alt="" decoding="async"><div class="sm-study-diagram"></div></div><div class="sm-study-controls"><button type="button" data-sm-play>PŘEHRÁT</button><button type="button" data-sm-replay>ZPĚT NA ZAČÁTEK ↻</button><label>Průběh konstrukce<input data-sm-progress type="range" min="0" max="100" value="100" step="0.1"></label></div><div class="sm-study-phases" aria-label="Fáze konstrukce"></div><p class="sm-study-explanation" aria-live="polite"></p><p class="sm-study-disclosure">Původní malba zůstává beze změny. Pohybují se samostatné vektorové osy, symboly a konstrukční pomůcky; nejde o rozebrané či obnovené prvky původního rastrového obrazu.</p><a class="sm-study-create" href="/play/#workshop">PŘEVÉST DO VLASTNÍ TVORBY ↗</a>`;
    doc.body.append(dialog);
    dialog.querySelector('[data-sm-close]').addEventListener('click',()=>dialog.close(),{signal});
    dialog.addEventListener('close',()=>{stopDialog();sync();current?.opener?.focus();},{signal});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}},{signal});
    dialog.querySelector('[data-sm-progress]').addEventListener('input',e=>{stopDialog();setPhase(Number(e.target.value)/100);},{signal});
    dialog.querySelector('[data-sm-replay]').addEventListener('click',()=>{stopDialog();setPhase(0);if(permitted())playDialog();},{signal});
    dialog.querySelector('[data-sm-play]').addEventListener('click',()=>{if(dialogPlaying)stopDialog();else if(permitted())playDialog();else{setPhase(dialogPhase>=1?0:Math.min(1,dialogPhase+.25));}},{signal});
    dialog.querySelector('.sm-study-phases').addEventListener('click',e=>{const b=e.target.closest('[data-sm-phase]');if(b){stopDialog();setPhase(Number(b.dataset.smPhase));}},{signal});
  }
  function openStudy(item,opener){
    makeDialog();stopDialog();current={...item,opener};
    dialog.querySelector('h2').textContent=item.title;
    const img=dialog.querySelector('.sm-study-stage > img');img.src=item.src;img.alt=`Původní dílo ${item.title}`;
    dialog.querySelector('.sm-study-diagram').innerHTML=graphic(item.mode);
    dialog.querySelector('.sm-study-stage').dataset.mode=item.mode;
    const mode=modes[item.mode];
    dialog.querySelector('.sm-study-phases').innerHTML=mode.parts.map((part,i)=>`<button type="button" data-sm-phase="${i/3}">${String(i+1).padStart(2,'0')} / ${escape(part)}</button>`).join('');
    dialog.querySelector('.sm-study-create').href=`/play/#${item.mode==='letters'?'workshop':item.mode==='frequency'?'workshop':'quests'}`;
    setPhase(1);dialog.showModal();sync();
  }
  function setPhase(value){
    dialogPhase=clamp(value);if(!dialog||!current)return;
    const stage=dialog.querySelector('.sm-study-stage'),p=dialogPhase;
    stage.style.setProperty('--sm-phase',String(p));stage.style.setProperty('--sm-trace',String(1-p));stage.dataset.phase=String(phaseFor(p));
    stage.style.setProperty('--sm-axis',String(clamp(p*4)));
    stage.style.setProperty('--sm-ring',String(clamp((p-.2)*3)));
    stage.style.setProperty('--sm-link',String(clamp((p-.45)*3)));
    stage.style.setProperty('--sm-eye',String(clamp((p-.6)*3)));
    const eye=stage.querySelector('.sm-eye-iris');if(eye)eye.setAttribute('transform',`translate(300 200) scale(1 ${Math.max(.03,clamp((p-.2)*3))}) translate(-300 -200)`);
    stage.querySelector('.sm-sun-orbit')?.setAttribute('transform',`rotate(${p*360} 300 200)`);
    stage.querySelector('.sm-moon-orbit')?.setAttribute('transform',`rotate(${-p*360} 300 200)`);
    stage.querySelector('.sm-pendulum')?.setAttribute('transform',`rotate(${Math.sin(p*Math.PI*4)*32} 300 45)`);
    dialog.querySelector('[data-sm-progress]').value=String(p*100);
    const index=phaseFor(p);dialog.querySelector('.sm-study-explanation').textContent=modes[current.mode].notes[index];
    dialog.querySelectorAll('[data-sm-phase]').forEach((b,i)=>b.setAttribute('aria-pressed',String(index===i)));
  }
  function stopDialog(){dialogPlaying=false;cancelAnimationFrame(dialogFrame);dialogFrame=0;lastDialogTime=0;if(dialog)dialog.querySelector('[data-sm-play]').textContent=permitted()?'PŘEHRÁT':'DALŠÍ STATICKÁ FÁZE';}
  function playDialog(){
    if(!permitted())return;if(dialogPhase>=1)setPhase(0);dialogPlaying=true;lastDialogTime=0;dialog.querySelector('[data-sm-play]').textContent='POZASTAVIT';
    function tick(time){if(!dialogPlaying||!dialog?.open||!permitted()){stopDialog();return;}if(lastDialogTime)setPhase(dialogPhase+Math.min(time-lastDialogTime,100)/12000);lastDialogTime=time;if(dialogPhase>=1){stopDialog();return;}dialogFrame=requestAnimationFrame(tick);}
    dialogFrame=requestAnimationFrame(tick);
  }

  const worldMarkup = (prefix) => `<svg class="sm-world-svg" viewBox="0 0 1000 600" role="img" aria-label="Tvůj vlastní ilustrativní městský svět: vlastní práce rozsvěcí ateliéry, slunce a měsíc obíhají kolem otevřeného oka."><defs><pattern id="${prefix}-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#FFD600" stroke-width=".5" opacity=".13"/></pattern><clipPath id="${prefix}-reveal"><rect data-world-reveal-clip x="0" y="0" width="1000" height="600"/></clipPath></defs><path fill="#080808" d="M0 0H1000V600H0Z"/><path fill="url(#${prefix}-grid)" d="M0 0H1000V600H0Z"/><g class="sm-world-halos" fill="none" stroke="#FFD600"><ellipse cx="500" cy="240" rx="340" ry="170" stroke-width="1"/><circle cx="500" cy="240" r="215" stroke-dasharray="4 12"/><circle cx="500" cy="240" r="190" stroke-width="2"/><path d="M500 35 680 345H320ZM160 240H840M500 25V480" opacity=".45"/></g><g class="sm-world-orbit"><g transform="translate(500 25)" fill="#FFD600" stroke="#080808" stroke-width="3"><circle r="26"/><path d="M0-41V-31M0 31V41M-41 0H-31M31 0H41M-29-29-22-22M22 22 29 29M-29 29-22 22M22-22 29-29" stroke="#FFD600" stroke-width="3"/></g></g><g class="sm-world-lunar"><path d="M500 425a31 31 0 1 0 35 39 29 29 0 0 1-35-39Z" fill="#F5F1E8" stroke="#080808" stroke-width="4"/></g><g class="sm-world-rays" fill="none" stroke="#FFD600" stroke-width="1.5"><path d="M50 470 500 240 950 470M80 550 500 240 920 550M275 590 500 240 725 590M0 525H1000M180 475H820"/></g><circle class="sm-world-audio-ring" cx="500" cy="240" r="230" fill="none" stroke="#FFD600" stroke-width="3" opacity="0"/><g class="sm-world-buildings" stroke="#080808" stroke-width="6" stroke-linejoin="round"><g class="sm-world-tower sm-world-tower-a"><path d="M98 440V265L192 210 260 252V477L192 525Z" fill="#FFD600"/><path d="M192 210V525L260 477V252Z" fill="#8B7200"/><path d="M118 290 174 258M118 335 174 303M118 380 174 348M118 425 174 393" fill="none" stroke="#080808" stroke-width="12"/><path d="M211 270V310M237 287V327M211 340V380M237 357V397" stroke="#F5F1E8" stroke-width="8"/></g><g class="sm-world-tower sm-world-tower-b"><path d="M260 467V175L345 125 404 160V495L345 530Z" fill="#F5F1E8"/><path d="M345 125V530L404 495V160Z" fill="#FFD600"/><path d="M276 205 326 177M276 255 326 227M276 305 326 277M276 355 326 327M276 405 326 377" fill="none" stroke-width="13"/><path d="M368 189V219M368 244V274M368 299V329M368 354V384" stroke="#080808" stroke-width="14"/></g><g class="sm-world-tower sm-world-tower-c"><path d="M608 492V210L679 160 755 203V483L679 530Z" fill="#FFD600"/><path d="M679 160V530L755 483V203Z" fill="#8B7200"/><path d="M626 240 661 214M626 290 661 264M626 340 661 314M626 390 661 364M626 440 661 414" stroke-width="12"/><path d="M703 228V264M730 245V281M703 301V337M730 318V354M703 375V411" stroke="#F5F1E8" stroke-width="9"/></g><g class="sm-world-tower sm-world-tower-d"><path d="M764 477V300L837 256 918 303V449L837 502Z" fill="#F5F1E8"/><path d="M837 256V502L918 449V303Z" fill="#FFD600"/><path d="M784 324 820 302M784 367 820 345M784 410 820 388" stroke-width="13"/><path d="M860 322V349M888 338V365M860 385V412M888 401V428" stroke-width="12"/></g></g><g class="sm-world-heart" stroke="#080808" stroke-width="6"><path d="M405 480 421 302 500 255 578 302 595 480 500 537Z" fill="#FFD600"/><path d="M500 255V537L595 480 578 302Z" fill="#A58700"/><path d="M434 350 480 324M432 399 479 374M429 448 479 423M521 325 559 350M522 375 564 400M523 425 569 451" stroke="#080808" stroke-width="15"/></g><g class="sm-world-eye" fill="#FFD600" stroke="#080808" stroke-width="7"><path d="M373 231Q500 104 627 231Q500 358 373 231Z"/><path d="M401 231Q500 155 599 231Q500 307 401 231Z" fill="#F5F1E8"/><g class="sm-world-iris"><circle cx="500" cy="231" r="48" fill="#FFD600"/><circle cx="500" cy="231" r="23" fill="#080808"/><circle cx="485" cy="216" r="8" fill="#F5F1E8" stroke="none"/></g><path d="M373 231Q500 104 627 231" fill="none" stroke="#FFD600" stroke-width="6"/></g><g class="sm-world-bridges" fill="none" stroke="#FFD600" stroke-width="3"><path d="M177 500 345 560 500 535 679 560 837 500M345 560V580M679 560V580"/><path d="M58 564H275M725 564H945" stroke="#E71932" stroke-width="5"/></g><g class="sm-world-seal" fill="none" stroke="#FFD600" stroke-width="2"><circle cx="500" cy="547" r="38"/><path d="M500 512 529 565H471Z"/><circle cx="500" cy="547" r="16"/></g><g class="sm-world-reveal-diagram" clip-path="url(#${prefix}-reveal)" fill="none" stroke="#FFD600" stroke-width="1.5"><path d="M35 180 500 75 965 180 500 475ZM35 180 500 475 965 180M500 75V475M105 510 500 75 895 510Z"/><circle cx="500" cy="275" r="125" stroke-dasharray="7 9"/><circle cx="500" cy="275" r="80"/><path d="M380 275H620M500 155V395"/></g><g class="sm-world-gateway" stroke="#FFD600" stroke-width="3"><path fill="#080808" d="M450 512V458Q500 407 550 458V512Z"/><g class="sm-world-gate-left"><path fill="#FFD600" stroke="#080808" d="M454 510V459Q470 441 498 435V510Z"/><path d="M478 465V490" stroke="#080808"/></g><g class="sm-world-gate-right"><path fill="#FFD600" stroke="#080808" d="M502 435Q530 441 546 459V510H502Z"/><path d="M522 465V490" stroke="#080808"/></g></g><g class="sm-world-key" transform="rotate(0 80 520)" fill="none" stroke="#FFD600" stroke-width="5"><circle cx="65" cy="520" r="14"/><path d="M80 520H126V529M111 520V532"/></g><g class="sm-world-drops" fill="#FFD600" stroke="#080808" stroke-width="1.5"></g><text class="sm-world-alias" x="500" y="589" text-anchor="middle" fill="#F5F1E8" stroke="none" font-family="monospace" font-size="15" letter-spacing="5">SELFMADE / TVŮJ SVĚT</text></svg><div class="sm-world-legend"><span>VLASTNÍ MĚSTO / <b data-world-count>0 děl</b></span><span data-world-discipline>ZAČNI VLASTNÍM POKUSEM</span></div><div class="sm-world-controls"><button type="button" data-world-gateway aria-pressed="false">OTOČIT KLÍČ / OTEVŘÍT</button><label>Odhalit konstrukci <input data-world-reveal type="range" min="0" max="100" step="1" value="100" aria-label="Odhalit autorskou konstrukci města"></label><button type="button" data-world-guide aria-expanded="false">PRŮVODCE / OTÁZKA</button></div><p class="sm-world-control-status" data-world-status role="status">Klíč drží bránu zavřenou. Tahem po scéně nebo posuvníkem odhalíš její konstrukční vrstvu.</p><div class="sm-world-guide" data-world-guide-panel hidden><p>PRŮVODCE / AUTORSKÁ FIKTIVNÍ POSTAVA</p><p data-world-question>Jaký první vlastní pokus by změnil tvoje město?</p></div><p class="sm-world-audio-state" data-world-audio>Rytmická vrstva čeká na vlastní spuštěný zvuk.</p>`;
  class SelfmadeWorld extends HTMLElement {
    connectedCallback(){
      if(!this.dataset.ready){this.dataset.ready='true';this.innerHTML=worldMarkup(`sm-world-${++serial}`);}this._visible=!observer;worlds.add(this);observer?.observe(this);this.connectControls();sync();
    }
    disconnectedCallback(){worlds.delete(this);observer?.unobserve(this);this._controls?.abort();this._controls=null;}
    connectControls(){
      this._controls?.abort();this._controls=new AbortController();const opts={signal:this._controls.signal};const slider=this.querySelector('[data-world-reveal]'),svg=this.querySelector('.sm-world-svg');let drawing=false;
      this.querySelector('[data-world-gateway]').addEventListener('click',()=>{const open=this.dataset.gate!=='open';this.dataset.gate=open?'open':'closed';const b=this.querySelector('[data-world-gateway]');b.setAttribute('aria-pressed',String(open));b.textContent=open?'OTOČIT KLÍČ / ZAVŘÍT':'OTOČIT KLÍČ / OTEVŘÍT';this.querySelector('.sm-world-key').setAttribute('transform',`rotate(${open?45:0} 80 520)`);this.querySelector('[data-world-status]').textContent=open?'Otočení klíče otevřelo obě křídla brány a zvýraznilo vazby konstrukce.':'Otočení klíče zavřelo bránu; původní konstrukce zůstává čitelná.';this.drop(80,520);},opts);
      slider.addEventListener('input',()=>{this.reveal(slider.value);this.drop(Number(slider.value)*10,480);},opts);
      this.querySelector('[data-world-guide]').addEventListener('click',()=>{const panel=this.querySelector('[data-world-guide-panel]');panel.hidden=!panel.hidden;this.querySelector('[data-world-guide]').setAttribute('aria-expanded',String(!panel.hidden));this.question();},opts);
      const atPointer=e=>{const r=svg.getBoundingClientRect();if(!r.width||!r.height)return;const x=clamp((e.clientX-r.left)/r.width)*1000,y=clamp((e.clientY-r.top)/r.height)*600;slider.value=String(Math.round(x/10));this.reveal(slider.value);if(e.type==='pointerdown')this.drop(x,y);};
      svg.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;drawing=true;svg.setPointerCapture?.(e.pointerId);atPointer(e);},opts);
      svg.addEventListener('pointermove',e=>{if(drawing)atPointer(e);},opts);
      for(const type of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(type,()=>drawing=false,opts);
    }
    reveal(value){const percent=Math.max(0,Math.min(100,Number(value)||0));this.querySelector('[data-world-reveal-clip]').setAttribute('width',String(percent*10));this.querySelector('[data-world-status]').textContent=`Odhaleno ${Math.round(percent)} % autorského konstrukčního diagramu. Jde o přidanou interpretační vrstvu, ne o historický plán města.`;}
    drop(x,y){const group=this.querySelector('.sm-world-drops'),mark=doc.createElementNS('http://www.w3.org/2000/svg','g');mark.setAttribute('class','sm-world-gesture-drops');mark.setAttribute('transform',`translate(${Math.round(x)} ${Math.round(y)})`);mark.innerHTML='<path class="sm-gesture-drop" d="M0-6Q-8 5 0 9Q8 5 0-6Z"/><path class="sm-gesture-drop" d="M-12 2Q-18 12-12 15Q-6 12-12 2Z"/><path class="sm-gesture-drop" d="M12 7Q7 15 12 18Q17 15 12 7Z"/>';group.append(mark);while(group.children.length>4)group.firstElementChild.remove();}
    question(){const discipline=String(this._detail?.discipline||'').toLowerCase(),phase=Number(this._detail?.phase)||0;const prompts={writer:'Který vlastní tah drží tvoje písmeno pohromadě a co můžeš ubrat?',mc:'Který konkrétní detail by změnil obecnou větu v tvůj vlastní obraz?',dj:'Kde má tvůj set změnit energii a proč právě tam?',breaking:'Na který hudební moment reaguje tvoje přiměřená vlastní fráze?',knowledge:'Co z tvého tvrzení opravdu pozoruješ a co si k němu přidáváš?'};const key=Object.keys(prompts).find(k=>discipline.includes(k));this.querySelector('[data-world-question]').textContent=phase>.75?'Vrať se k první verzi. Které vlastní rozhodnutí ji konkrétně změnilo?':prompts[key]||'Jaký první vlastní pokus by změnil tvoje město?';}
    audioLevel(value){const level=permitted()&&this._visible!==false?clamp(value):0;const ring=this.querySelector('.sm-world-audio-ring');if(!ring)return;ring.setAttribute('opacity',String(level*.9));ring.setAttribute('transform',`translate(500 240) scale(${1+level*.12}) translate(-500 -240)`);if((level>.01)!==this._audioActive){this._audioActive=level>.01;this.querySelector('[data-world-audio]').textContent=this._audioActive?'Rytmický kruh reaguje na skutečně přehrávaný zvuk.':'Rytmická vrstva čeká na vlastní spuštěný zvuk.';}}
    update(detail={}){
      this._detail=detail;this.question();
      const alias=String(detail.alias||'SELFMADE').slice(0,32);const count=Math.max(0,Math.min(999,Number(detail.count)||0));
      this.querySelector('.sm-world-alias').textContent=`${alias.toUpperCase()} / TVŮJ SVĚT`;
      this.querySelector('[data-world-count]').textContent=`${count} ${count===1?'dílo':count>1&&count<5?'díla':'děl'}`;
      this.querySelector('[data-world-discipline]').textContent=String(detail.discipline||'ZAČNI VLASTNÍM POKUSEM').toUpperCase().slice(0,50);
      this.style.setProperty('--sm-world-progress',String(clamp(Number(detail.phase)||Math.min(1,.45+count*.06))));
      this.dataset.day=detail.day==='day'?'day':'night';this.dataset.created=count>0?'true':'false';this.querySelectorAll('.sm-world-tower').forEach((tower,i)=>tower.dataset.lit=String(i<count));
    }
  }
  if(window.customElements&&!customElements.get('selfmade-world'))customElements.define('selfmade-world',SelfmadeWorld);
  function init(){
    scan();
    const mutation=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'))sync();if(records.some(r=>r.type==='childList'&&[...r.addedNodes].some(n=>n.nodeType===1&&!n.closest?.('.sm-scene-frame,.sm-motion-dialog'))))scan();});mutation.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
    const prefs=new MutationObserver(sync);prefs.observe(doc.documentElement,{attributes:true,attributeFilter:['data-motion','data-selfmade-motion']});prefs.observe(doc.body,{attributes:true,attributeFilter:['class']});
    reduced.addEventListener('change',sync,{signal});
    doc.addEventListener('visibilitychange',sync,{signal});window.addEventListener('storage',sync,{signal});
    window.addEventListener('caisik:world',event=>{for(const world of worlds)world.update(event.detail);},{signal});
    window.addEventListener('caisik:audiolevel',event=>{for(const world of worlds)world.audioLevel(event.detail?.level);},{signal});
    window.addEventListener('pagehide',()=>{stopped=true;stopDialog();lifecycle.abort();observer?.disconnect();mutation.disconnect();prefs.disconnect();for(const record of frames)record.frame.classList.remove('sm-is-moving');for(const world of worlds)world.classList.remove('sm-is-moving');},{signal,once:true});
    window.addEventListener('pageshow',e=>{if(e.persisted)window.location.reload();},{once:true});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
