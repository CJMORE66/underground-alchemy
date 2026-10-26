/* CAISIK building studies. Original painted posters remain the static source. */
(() => {
  'use strict';
  if (window.CaisikPlaceArtMotion) return;
  const doc=document,root=doc.documentElement,NS='http://www.w3.org/2000/svg';
  const selector='.place-artwork[data-place-art]';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia?.('(hover: hover) and (pointer: fine)');
  const items=new Map(),visible=new Set(),cleanup=[];
  let nextId=0,frame=0,scanFrame=0,disposed=false,sleeping=false,last=0,io,mutation,preferences;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ramp=(t,a,b)=>clamp((t-a)/(b-a));
  const arc=(x,y,rx,ry)=>`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0`;
  const box=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
  /* Coordinates are traced from the actual 1536 × 1024 generated compositions.
     These are artistic light/ink studies, never measured architectural geometry. */
  const scenes={
    'notre-dame':{title:'Rozety / portály / věže / věžička',duration:16,
      patches:[{x:394,y:555,rx:42,ry:60,angle:5},{x:1165,y:611,rx:29,ry:55,angle:-4},{x:779,y:195,rx:56,ry:56,angle:10}],
      traces:['M191 358 203 204 385 167 444 190 443 316','M455 308 461 121 558 45 675 105 698 291','M163 943 171 826 218 744 266 822 265 944','M292 946 299 811 377 715 453 806 454 949','M486 947 485 813 537 749 586 811 587 943','M919 419 926 30 941 421','M671 359 822 411 1052 498 1235 584'],
      lights:[box(217,251,40,85),box(297,223,36,100),box(494,150,45,127),box(586,137,42,132),arc(394,555,40,59),arc(1165,611,30,56)]},
    'sainte-chapelle':{title:'Světlo v rozetě / skleněné stěny / střecha',duration:18,
      patches:[{x:508,y:513,rx:96,ry:143,angle:3},{x:766,y:205,rx:114,ry:116,angle:-6}],
      traces:['M315 972 397 360 540 106 646 282 651 953','M648 257 982 443 1297 716','M896 326 910 17 931 342','M690 831 687 437 704 391 727 431 732 824','M843 878 841 525 856 486 879 532 882 885','M951 908 949 590 970 555 991 602 992 919','M1063 925 1059 648 1077 617 1090 659 1096 936','M1173 942 1167 708 1184 680 1195 719 1200 945'],
      lights:['M700 423 713 412 724 435 731 818 699 838Z','M850 519 861 504 873 535 879 881 852 870Z','M959 586 969 573 981 605 987 907 963 893Z','M1070 651 1079 633 1087 666 1092 928 1072 918Z','M1176 712 1186 696 1193 729 1197 937 1180 933Z']},
    'flamel-house':{title:'Okna / rytina / alchymistické slunce',duration:15,
      patches:[{x:768,y:119,rx:76,ry:73,angle:6},{x:1164,y:300,rx:76,ry:103,angle:-3}],
      traces:['M430 953 449 288 491 89 527 100 513 151 622 159 1067 258 1120 949','M454 595 1102 686','M459 668 1098 749','M553 555 555 389 687 390 682 569','M752 574 747 396 862 411 867 583','M924 589 920 433 1015 446 1027 604'],
      lights:[box(596,242,45,65),box(832,260,37,64),box(576,415,74,136),box(769,432,64,138),box(942,459,54,127),box(524,714,120,157),box(907,734,109,156)]},
    'saint-sulpice':{title:'Nestejné věže / kolonáda / světelná osa',duration:17,
      patches:[{x:769,y:196,rx:38,ry:38,angle:12}],
      traces:['M354 413 393 226 445 42 536 23 593 111 595 387','M882 386 904 229 942 175 998 156 1052 215 1094 391','M330 638 1116 651','M327 681 1124 687','M382 611 394 458','M481 612 490 455','M590 615 596 455','M705 619 708 456','M817 622 820 457','M929 624 930 459','M1043 628 1041 460','M770 242 770 344'],
      lights:[box(450,111,70,77),box(424,276,70,86),box(959,207,39,67),box(735,459,69,139),box(516,735,111,161),box(717,741,116,165),box(902,743,104,166)]},
    'abbesses':{title:'Žebra přístřešku / světla / křivky železa',duration:16,
      patches:[{x:767,y:77,rx:29,ry:29,angle:9}],
      traces:['M340 305Q740 -90 1201 292','M379 344Q763 142 1193 354','M480 755Q477 379 481 260','M582 776Q594 475 698 449','M918 779Q917 514 1049 378','M1109 785Q1101 540 1152 393','M581 759Q766 546 1014 752','M589 431 421 171','M647 414 557 137','M716 416 664 135','M782 416 764 165','M845 434 908 160','M914 457 1034 200','M987 493 1135 262'],
      lights:[arc(434,485,20,22),arc(616,581,15,16),arc(1042,555,18,19),arc(666,824,12,12),arc(834,824,12,12),'M431 197 456 188 610 293 592 311Z','M665 142 706 144 735 272 696 270Z','M909 178 947 171 886 312 858 299Z']},
    'pere-lachaise':{title:'Paměť kamene / kaple / cesta světla',duration:18,
      patches:[{x:794,y:165,rx:26,ry:26,angle:6},{x:662,y:827,rx:17,ry:18,angle:-5}],
      traces:['M389 538 389 343Q440 242 490 332V543','M1178 597 1177 403Q1224 322 1288 395','M790 487 790 399Q842 329 894 406V486','M815 391Q837 312 844 281Q849 313 873 394','M690 686H925','M677 714H949','M667 749H977','M647 785H1005','M619 833H1056','M606 878H1100','M155 405Q201 248 269 289Q313 245 355 291'],
      lights:[box(399,369,31,109),box(826,416,28,66),box(1186,426,34,109),'M698 690H909L916 698H693Z','M674 728H950L958 735H668Z','M646 770H995L1004 779H639Z','M619 818H1050L1061 828H610Z']},
    'republique':{title:'Marianne / reliéfy / větev / podstavec',duration:17,
      patches:[{x:766,y:47,rx:22,ry:28,angle:10},{x:630,y:43,rx:33,ry:32,angle:3}],
      traces:['M646 417Q767 391 865 436','M610 483Q765 433 916 483','M616 519 642 689','M914 511 887 691','M365 803Q760 667 1170 797','M359 881Q764 791 1167 883','M642 97 664 145 700 186 724 205','M733 147Q770 114 799 165L838 276 832 390','M740 539Q769 497 804 532V570Q773 605 741 570Z'],
      lights:[arc(766,551,29,32),'M633 444Q765 408 882 453L880 465Q760 435 632 456Z','M397 843Q751 747 1134 843L1133 860Q746 774 396 861Z',box(735,923,72,29)]},
    'mur-oberkampf':{title:'Tah písmene / linka zdi / vlastní světlo',duration:15,
      patches:[{x:907,y:463,rx:36,ry:35,angle:8},{x:766,y:117,rx:14,ry:14,angle:-8}],
      traces:['M310 314 1482 516','M325 837 1468 902','M353 475 471 398 582 503 444 535 539 581','M500 660 603 533 671 576 620 635 717 714','M713 568 783 466 852 537 805 611 905 587','M928 623 1045 515 1106 569 1051 656 1154 625','M1171 672 1301 574 1369 633 1286 712 1417 735','M428 299 450 287','M805 355 826 344','M1032 412 1055 397','M1274 464 1296 452'],
      lights:['M426 312 474 322 528 407 384 382Z','M794 369 844 378 885 471 750 435Z','M1024 422 1077 430 1119 514 976 481Z','M1272 477 1318 484 1359 566 1223 530Z',arc(907,463,31,31)]},
    'la-place':{title:'Žebra Canopée / křídla střechy / kulturní průchod',duration:18,
      patches:[{x:767,y:195,rx:76,ry:76,angle:5}],
      traces:['M68 333Q160 175 479 266Q680 318 766 409Q1029 214 1284 288Q1499 329 1480 410','M90 383Q422 576 764 433Q1131 581 1467 419','M379 652Q386 446 193 323','M499 655Q503 458 365 305','M610 658Q615 491 559 361','M1004 655Q991 427 1255 316','M1208 654Q1194 434 1415 367','M1097 652Q1086 437 1342 334','M692 592Q769 557 860 591','M706 574Q771 537 875 568','M683 555Q775 511 903 548','M654 527Q780 482 937 523'],
      lights:['M182 301 239 276 357 310 332 326Z','M350 272 401 274 511 316 477 324Z','M1045 315 1094 298 1170 308 1134 327Z','M1249 316 1295 324 1363 343 1327 353Z',box(651,688,42,29),box(709,694,43,28),box(771,696,46,27),box(839,693,47,30)]},
    'centquatre':{title:'Haly / ocelové vazníky / skleněná střecha',duration:18,
      patches:[{x:767,y:200,rx:36,ry:36,angle:8},{x:528,y:235,rx:27,ry:34,angle:2}],
      traces:['M409 48 410 731','M417 72 641 202 661 229','M435 336Q516 276 581 354V505','M669 283 955 168 1169 359','M771 565 887 489 1025 549','M783 533 887 461 1043 525','M784 493 893 421 1066 499','M783 446 902 373 1086 464','M781 397 908 326 1114 427','M770 340 921 275 1137 391','M765 294 932 226 1160 358'],
      lights:['M876 258 920 244 907 314 867 328Z','M864 348 898 334 888 397 849 410Z','M847 437 877 425 868 483 832 495Z',box(447,354,130,132),box(1247,499,73,119),arc(869,635,9,10),arc(827,350,12,11),arc(1100,392,10,10),arc(745,351,8,9),arc(1038,451,7,8)]},
    'philharmonie':{title:'Fasádní ptáci / fazety / stoupající pás',duration:17,
      patches:[{x:768,y:42,rx:16,ry:24,angle:8},{x:1000,y:309,rx:14,ry:16,angle:-6}],
      traces:['M346 321 825 120 1445 409 1415 620 771 358 346 399Z','M248 388 346 323 297 480','M141 479 872 516 881 625','M438 811Q663 752 823 703Q977 633 617 548','M495 820Q716 791 893 697Q988 614 716 564','M665 801 1010 674','M1016 676 1378 723','M817 153 1050 262 1028 309 805 205Z','M1049 282 1275 383 1248 429 1033 335Z','M1277 403 1413 466 1395 514 1262 453Z'],
      lights:['M540 451 570 438 574 489 544 490Z','M598 434 626 431 628 493 601 491Z','M660 440 687 444 690 497 665 496Z','M900 572 931 593 935 632 906 622Z','M1075 622 1114 632 1116 678 1078 669Z','M1226 647 1268 658 1271 712 1230 700Z',box(555,671,55,42),box(688,677,48,37)]},
    'shakespeare-company':{title:'Knihy / výlohy / markýza / pouliční světlo',duration:16,
      patches:[{x:284,y:184,rx:46,ry:46,angle:5},{x:770,y:48,rx:23,ry:35,angle:-6}],
      traces:['M326 450 1194 312 1480 531','M347 511 416 483 419 788','M453 491 654 460 651 800 455 813Z','M684 451 861 433 856 806 684 816Z','M925 428 1147 405 1146 802 924 820Z','M469 542 636 521','M468 581 636 564','M473 623 636 605','M938 527 1133 512','M939 574 1133 560','M943 621 1131 610','M467 730 640 696','M956 743 1140 724'],
      lights:['M476 476 519 468 516 502 475 508Z','M535 466 576 459 574 494 533 499Z','M591 458 633 452 630 489 589 493Z','M940 435 983 430 983 469 940 472Z','M997 427 1041 422 1040 467 997 468Z','M1056 420 1106 416 1105 464 1055 465Z',arc(521,554,12,14),arc(795,533,12,14),arc(989,543,14,17),'M324 283 350 260 370 281 364 322 332 329Z']}

  };
  function node(tag,attrs={}){const el=doc.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;}
  function listen(target,type,fn,options){target.addEventListener(type,fn,options);cleanup.push(()=>target.removeEventListener(type,fn,options));}
  function preferenceReason(){
    if(reduced?.matches)return 'Systém požaduje omezený pohyb. Ilustrace zůstává statická.';
    if(root.dataset.motion==='off')return 'Animace jsou vypnuté. Zavři profil a použij ZAPNOUT ANIMACE u mapy; stejný přepínač RESUME MOTION je i v patičce.';
    if(['off','reduced','quiet','calm'].includes(root.dataset.selfmadeMotion)||doc.body.classList.contains('simple-mode'))return 'Je zapnutý klidný režim. Ilustrace zůstává statická.';
    return '';
  }
  function allowed(){return !disposed&&!sleeping&&!doc.hidden&&!preferenceReason();}
  function isAvailable(item){if(!item.host.isConnected||item.failed||!item.loaded||item.host.closest('[hidden],[inert],dialog:not([open])'))return false;const dialog=doc.querySelector('dialog[open]');return !dialog||dialog.contains(item.host);}
  function shouldRun(item){return visible.has(item)&&allowed()&&isAvailable(item);}
  function ensureFrame(){if(!frame&&!disposed&&[...visible].some(shouldRun))frame=requestAnimationFrame(tick);}
  // `hidden` is not a reflected SVGElement property in browsers. The attribute
  // is the cross-browser contract, including when a poster enters a dialog.
  function setOverlayVisible(item,show){if(item.overlay.hasAttribute('hidden')===show)item.overlay.toggleAttribute('hidden',!show);}
  function setPhase(item,text){if(item.phase.textContent!==text)item.phase.textContent=text;}
  function clearMotion(item){setOverlayVisible(item,false);item.host.classList.remove('place-art-playing','place-art-hover');item.host.style.removeProperty('--place-art-energy');item.inside=false;setPhase(item,preferenceReason()?'ANIMACE VYPNUTY':io?'ŽIVÁ ILUSTRACE':'STATICKÁ ILUSTRACE');}
  function refresh(){let running=false;for(const item of items.values()){if(shouldRun(item)){setOverlayVisible(item,true);item.host.classList.add('place-art-playing');if(item.status.classList.contains('is-feedback')){item.status.classList.remove('is-feedback');item.status.textContent='Animace pokračuje.';}running=true;}else clearMotion(item);}if(!running&&frame){cancelAnimationFrame(frame);frame=0;last=0;}else if(running)ensureFrame();}
  function update(item,t){
    const cycle=(t%(item.scene.duration*.58))/(item.scene.duration*.58),breath=(1-Math.cos(cycle*Math.PI*2))/2;
    const energy=item.inside?1.18:1;
    for(let i=0;i<item.patches.length;i++){
      const patch=item.patches[i],angle=patch.spin?cycle*360:Math.sin(cycle*Math.PI*2+i*.4)*patch.data.angle*1.8*energy;
      patch.move.setAttribute('transform',`rotate(${angle.toFixed(3)} ${patch.data.x} ${patch.data.y})`);
    }
    for(let i=0;i<item.traces.length;i++){
      const age=t/(item.scene.duration*.58)-i*.018,phase=age<0?0:age%1,p=ramp(phase,.015,.34),fade=1-ramp(phase,.78,.98),line=item.traces[i];
      const opacity=(Math.sin(Math.PI*p/2)*fade*.92).toFixed(4),dash=(1-p).toFixed(4);
      line.style.strokeDashoffset=dash;line.style.opacity=opacity;
      item.underlays[i].style.strokeDashoffset=dash;item.underlays[i].style.opacity=opacity;
      const runner=item.runners[i];runner.style.strokeDashoffset=(1-phase).toFixed(4);runner.style.opacity=(ramp(phase,.02,.08)*(1-ramp(phase,.78,.98))*.95).toFixed(4);
    }
    for(let i=0;i<item.lights.length;i++){
      const age=t/(item.scene.duration*.58)-i*.055,phase=age<0?0:age%1,p=Math.sin(Math.PI*clamp((phase-.03)/.58));
      item.lights[i].style.opacity=(Math.max(0,p)*.48*energy).toFixed(4);
    }
    item.host.style.setProperty('--place-art-energy',(breath*energy).toFixed(4));
    setPhase(item,cycle<.34?'KRESBA / OBRYSY':cycle<.72?'SVĚTLO / VNITŘNÍ DETAILY':'PROMĚNA / DALŠÍ VRSTVA');
  }
  function tick(now){frame=0;if(disposed)return;const delta=last?Math.min((now-last)/1000,.08):0;last=now;let running=false;
    for(const item of [...visible]){if(!shouldRun(item)){clearMotion(item);continue;}running=true;item.elapsed+=delta;setOverlayVisible(item,true);item.host.classList.add('place-art-playing');update(item,item.elapsed);}
    if(running)frame=requestAnimationFrame(tick);else last=0;
  }
  function enhance(host){
    if(items.has(host))return;
    const id=host.dataset.placeArt,scene=scenes[id],img=host.querySelector('img[data-place-illustration]');
    if(!scene||!img)return;
    const item={id,scene,host,img,elapsed:0,inside:false,loaded:img.complete&&img.naturalWidth>0,failed:false,patches:[],traces:[],underlays:[],runners:[],lights:[]};
    const svg=node('svg',{class:'place-art-motion-overlay',viewBox:'0 0 1536 1024',preserveAspectRatio:'xMidYMid slice','aria-hidden':'true',focusable:'false'});
    svg.setAttribute('hidden','');const defs=node('defs');svg.append(defs);item.overlay=svg;
    for(let i=0;i<(scene.patches||[]).length;i++){
      const data=scene.patches[i],clip=node('clipPath',{id:`place-paint-${++nextId}`});clip.append(node('ellipse',{cx:data.x,cy:data.y,rx:data.rx,ry:data.ry}));defs.append(clip);
      const fixed=node('g',{'clip-path':`url(#${clip.id})`}),move=node('g');
      move.append(node('image',{href:img.getAttribute('src'),x:0,y:0,width:1536,height:1024,preserveAspectRatio:'none'}));fixed.append(move);svg.append(fixed);const ratio=data.rx/data.ry;item.patches.push({data,move,spin:i===(id==='notre-dame'?2:0)&&ratio>.8&&ratio<1.2});
    }
    scene.traces.forEach(d=>{const under=node('path',{d,class:'place-art-ink-underlay',pathLength:1}),path=node('path',{d,class:'place-art-ink-trace',pathLength:1}),runner=node('path',{d,class:'place-art-ink-runner',pathLength:1});svg.append(under,path,runner);item.underlays.push(under);item.traces.push(path);item.runners.push(runner);});
    scene.lights.forEach(d=>{const path=node('path',{d,class:'place-art-window-light'});svg.append(path);item.lights.push(path);});
    const phase=doc.createElement('span');phase.className='place-art-motion-phase';phase.setAttribute('aria-hidden','true');item.phase=phase;
    const status=doc.createElement('span');status.className='place-art-motion-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');item.status=status;
    host.append(svg,phase,status);host.classList.add('place-art-enhanced');host.dataset.placeMotion=scene.title;
    const replay=host.querySelector('[data-place-replay]');
    const replayHandler=()=>{if(!isAvailable(item))return;item.elapsed=0;item.inside=false;if(allowed()&&io){visible.add(item);setOverlayVisible(item,true);update(item,0);status.classList.remove('is-feedback');status.textContent=`Přehrávám: ${scene.title}.`;ensureFrame();}else{clearMotion(item);status.classList.add('is-feedback');status.textContent=preferenceReason()||'Tento prohlížeč zobrazuje statickou ilustraci.';}};
    const enter=e=>{if(e.pointerType&&e.pointerType!=='mouse')return;if(fine&&!fine.matches)return;item.inside=true;host.classList.add('place-art-hover');ensureFrame();};
    const leave=()=>{item.inside=false;host.classList.remove('place-art-hover');};
    const load=()=>{item.loaded=true;item.failed=false;refresh();};
    const error=()=>{item.failed=true;clearMotion(item);refresh();};
    img.addEventListener('load',load);img.addEventListener('error',error);host.addEventListener('pointerenter',enter);host.addEventListener('pointerleave',leave);host.addEventListener('focusin',enter);host.addEventListener('focusout',leave);replay?.addEventListener('click',replayHandler);
    item.removeListeners=()=>{img.removeEventListener('load',load);img.removeEventListener('error',error);host.removeEventListener('pointerenter',enter);host.removeEventListener('pointerleave',leave);host.removeEventListener('focusin',enter);host.removeEventListener('focusout',leave);replay?.removeEventListener('click',replayHandler);};
    items.set(host,item);if(io)io.observe(host);
    refresh();
  }
  function remove(item){io?.unobserve(item.host);visible.delete(item);item.removeListeners();item.overlay.remove();item.phase.remove();item.status.remove();item.host.classList.remove('place-art-enhanced','place-art-playing','place-art-hover');delete item.host.dataset.placeMotion;item.host.style.removeProperty('--place-art-energy');items.delete(item.host);}
  function scan(){scanFrame=0;if(disposed)return;for(const item of items.values())if(!item.host.isConnected||!item.host.contains(item.img)||item.host.dataset.placeArt!==item.id)remove(item);doc.querySelectorAll(selector).forEach(enhance);refresh();}
  function queueScan(){if(!scanFrame&&!disposed)scanFrame=requestAnimationFrame(scan);}
  if(typeof IntersectionObserver!=='undefined'){io=new IntersectionObserver(entries=>{for(const entry of entries){const item=items.get(entry.target);if(item){if(entry.isIntersecting)visible.add(item);else visible.delete(item);}}refresh();},{threshold:.04});}
  if(typeof MutationObserver!=='undefined'){
    mutation=new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&([...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.(selector)||n.matches?.('img[data-place-illustration]')||n.querySelector?.(selector)))))||records.some(r=>r.type==='attributes'))queueScan();});
    mutation.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','inert','data-place-art']});
    preferences=new MutationObserver(refresh);preferences.observe(root,{attributes:true,attributeFilter:['data-motion','data-selfmade-motion']});preferences.observe(doc.body,{attributes:true,attributeFilter:['class']});
  }
  listen(doc,'visibilitychange',()=>{last=0;refresh();});
  if(reduced?.addEventListener)listen(reduced,'change',refresh);
  if(fine?.addEventListener)listen(fine,'change',refresh);
  listen(window,'pagehide',event=>{if(event.persisted){sleeping=true;refresh();}else destroy();});
  listen(window,'pageshow',()=>{sleeping=false;last=0;queueScan();});
  function destroy(){if(disposed)return;disposed=true;if(frame)cancelAnimationFrame(frame);if(scanFrame)cancelAnimationFrame(scanFrame);frame=scanFrame=0;io?.disconnect();mutation?.disconnect();preferences?.disconnect();cleanup.forEach(fn=>fn());for(const item of [...items.values()])remove(item);}
  window.CaisikPlaceArtMotion={rescan:queueScan,destroy,stats:()=>({items:items.size,visible:visible.size,running:!!frame,scenes:Object.keys(scenes)})};
  scan();
})();
