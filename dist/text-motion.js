/* CAISIK kinetic ink. Original text, markup and controls remain the source of truth. */
(() => {
  'use strict';
  if (window.CaisikTextMotion) return;
  const doc = document, root = doc.documentElement;
  const semanticHeadingSelector = 'h1,h2,h3,[role="heading"]';
  const titleSelector = 'h1,h2,h3,[data-text-motion="title"],.hero-declaration';
  const actionSelector = '.button,.play-button,.exp-button,.small-button,.text-link,.exp-text-link,.play-nav a,.exp-nav a,.site-header nav a,.quest-paths button,.ws-tabs button,[data-text-motion="action"]';
  const selector = `${titleSelector},${actionSelector}`;
  const excluded = 'script,style,svg,canvas,textarea,input,select,option,pre,code,[contenteditable]:not([contenteditable="false"]),[role="status"],[role="alert"],[aria-live],.sr-only,.visually-hidden,[data-text-motion="off"],.journal-lines,.notebook-note';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const items = new Map(), visible = new Set(), active = new Set(), scanQueue = new Set();
  const controller = new AbortController(), {signal} = controller;
  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined,{granularity:'grapheme'}) : null;
  let frame = 0, scanFrame = 0, disposed = false, pageSleeping = false, geometryDirty = true, mutationObserver, stateObserver, intersectionObserver, nextIndex = 0;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const motionAllowed = () => !disposed && !pageSleeping && !doc.hidden && !reduced.matches && root.dataset.motion !== 'off' && !['off','reduced','quiet','calm'].includes(root.dataset.selfmadeMotion) && !doc.body.classList.contains('simple-mode');
  const hidden = el => !el.isConnected || !!el.closest('[hidden],[inert]') || !!el.closest('dialog:not([open])');
  const openDialog = () => doc.querySelector('dialog[open]');
  const eligible = el => el?.nodeType === 1 && !el.closest(excluded) && !el.closest('button[disabled]') && !el.matches('#motion-control,#motion-toggle,#exp-mode,[aria-live]') && !el.closest('form');
  const pointerAllowed = item => motionAllowed() && fine.matches && item.inside && !hidden(item.el) && (!openDialog() || openDialog().contains(item.el));
  function requestFrame() { if (!frame && !disposed) frame = requestAnimationFrame(tick); }
  function plainLabel(el) {
    const clone = el.cloneNode(true); clone.querySelectorAll('br').forEach(br=>br.replaceWith(doc.createTextNode(' ')));
    return clone.textContent.replace(/\s+/g,' ').trim();
  }
  function label(item) {
    if (item.kind !== 'title' || !item.el.matches(semanticHeadingSelector) || item.el.hasAttribute('aria-labelledby')) return;
    if (!item.el.hasAttribute('aria-label') || (item.ownsLabel && item.el.getAttribute('aria-label') === item.lastLabel)) {
      item.lastLabel = plainLabel(item.el); item.el.setAttribute('aria-label',item.lastLabel); item.ownsLabel = true;
    }
  }
  function splitText(item) {
    const nodes = [];
    const visit = node => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3 && child.textContent.trim()) nodes.push(child);
        else if (child.nodeType === 1 && !child.matches('ctm-word,ctm-ink,ctm-glyph') && !child.matches(excluded) && !child.hasAttribute('aria-hidden')) visit(child);
      }
    };
    visit(item.el);
    for (const textNode of nodes) {
      const fragment = doc.createDocumentFragment();
      for (const part of textNode.textContent.split(/(\s+)/u)) {
        if (!part) continue;
        if (/^\s+$/u.test(part)) { fragment.append(doc.createTextNode(part)); continue; }
        const word = doc.createElement('ctm-word'), ink = doc.createElement('ctm-ink');
        word.className = 'ctm-word'; ink.className = 'ctm-ink';
        if (item.kind === 'title' && item.el.matches(semanticHeadingSelector) && item.el.textContent.length < 180) {
          const chars = segmenter ? Array.from(segmenter.segment(part),p=>p.segment) : Array.from(part);
          for (const char of chars) { const glyph=doc.createElement('ctm-glyph');glyph.className='ctm-glyph';glyph.textContent=char;ink.append(glyph); }
        } else ink.textContent = part;
        word.append(ink); fragment.append(word);
      }
      // Keep a direct flex-button label as one flex item, like its original
      // anonymous text run; separate native arrow/icon elements stay separate.
      if (item.kind === 'action' && textNode.parentNode === item.el) {
        const run=doc.createElement('ctm-run');run.className='ctm-run';run.append(fragment);textNode.replaceWith(run);
      } else textNode.replaceWith(fragment);
    }
    item.words = [...item.el.querySelectorAll('ctm-word')];
    item.inks = [...item.el.querySelectorAll('ctm-ink')];
    item.glyphs = [...item.el.querySelectorAll('ctm-glyph')];
    item.words.forEach((word,index)=>word.style.setProperty('--ctm-order',String(Math.min(index,14))));
    label(item);
  }
  function eligibleRoot(el) { return eligible(el) && el.textContent.trim().length > 1 && el.textContent.trim().length < 1200; }
  function enhance(el) {
    if (!eligibleRoot(el)) return;
    let item = items.get(el);
    if (item) { splitText(item); return; }
    // A heading inside a button/link belongs to its original interactive parent.
    const kind = el.matches(titleSelector) ? 'title' : 'action';
    if (kind === 'action' && (el.querySelector('h1,h2,h3') || el.matches('[data-art],[data-art-replay]'))) return;
    item={el,kind,index:nextIndex++,words:[],inks:[],glyphs:[],inside:false,entered:false,x:0,y:0,targetX:0,targetY:0,power:0,targetPower:0,focused:false,ownsLabel:false,lastLabel:null,point:null,rect:null};
    items.set(el,item);
    try {
      splitText(item); if (!item.words.length) { items.delete(el); return; }
      el.classList.add(kind==='title'?'ctm-title':'ctm-action');
      if(kind==='title'&&!el.matches(semanticHeadingSelector))el.classList.add('ctm-phrase');
      if(kind==='action'&&el.matches('.button,.play-button,.exp-button,.small-button,.text-link,.exp-text-link'))el.classList.add('ctm-wrap');
      if (kind==='title' && (el.matches('h1') || el.closest('.hero,.play-hero,.exp-hero'))) el.classList.add('ctm-display');
      el.dataset.ctmId=String(item.index);
      if (intersectionObserver) intersectionObserver.observe(el); else visible.add(item);
      if (motionAllowed()) el.classList.add('ctm-enabled');
    } catch { restore(item); items.delete(el); }
    geometryDirty=true; requestFrame();
  }
  function scan(node=doc) {
    if (disposed) return;
    if (node.nodeType===1 && node.matches(selector)) enhance(node);
    node.querySelectorAll?.(selector).forEach(enhance);
  }
  function queueScan(node) {
    if (!node || disposed) return;
    scanQueue.add(node);
    if (!scanFrame) scanFrame=requestAnimationFrame(()=>{scanFrame=0;const pending=[...scanQueue];scanQueue.clear();pending.forEach(scan);geometryDirty=true;requestFrame();});
  }
  function resetPointer(item, immediate=false) {
    item.targetX=0;item.targetY=0;item.targetPower=0;item.point=null;item.el.classList.remove('ctm-hover');
    if (immediate) {item.x=item.y=item.power=0;paintPointer(item);active.delete(item);} else {active.add(item);requestFrame();}
  }
  function paintPointer(item) {
    item.el.style.setProperty('--ctm-px',(50+item.x*50).toFixed(2)+'%');
    item.el.style.setProperty('--ctm-py',(50+item.y*50).toFixed(2)+'%');
    item.el.style.setProperty('--ctm-power',item.power.toFixed(3));
    item.el.style.setProperty('--ctm-x',(item.x*3.5*item.power).toFixed(3)+'px');
    item.el.style.setProperty('--ctm-y',(item.y*2*item.power).toFixed(3)+'px');
    const glyphs=item.glyphs.length?item.glyphs:item.inks;
    glyphs.forEach((glyph,index)=>{
      const t=glyphs.length>1?index/(glyphs.length-1)*2-1:0;
      const proximity=Math.max(0,1-Math.abs(t-item.x)*.76);
      const strength=item.kind==='title'?1:0.38;
      glyph.style.setProperty('--ctm-gx',((item.x*2.7+t*1.8)*proximity*item.power*strength).toFixed(3)+'px');
      glyph.style.setProperty('--ctm-gy',((-proximity*6.5+item.y*2)*item.power*strength).toFixed(3)+'px');
      glyph.style.setProperty('--ctm-gr',((t-item.x)*1.9*proximity*item.power*strength).toFixed(3)+'deg');
    });
  }
  function viewport(item) {
    const blocked=hidden(item.el) || (openDialog() && !openDialog().contains(item.el));
    if (blocked) {item.inside=false;item.el.classList.remove('ctm-in','ctm-out');resetPointer(item,true);return;}
    const r=item.el.getBoundingClientRect(); item.rect=r;
    const height=window.innerHeight||root.clientHeight||800;
    const previously=item.inside;
    const focused=item.el.contains(doc.activeElement);
    item.inside=focused || (r.width>0 && r.height>0 && r.top<height*.94 && r.bottom>Math.min(68,height*.09));
    if (!motionAllowed()) {item.el.classList.remove('ctm-enabled','ctm-in','ctm-out');resetPointer(item,true);return;}
    item.el.classList.add('ctm-enabled');
    item.el.style.setProperty('--ctm-exit',r.top>height*.5?'1':'-1');
    if (item.inside) { item.el.classList.add('ctm-in');item.el.classList.remove('ctm-out'); item.entered=true; }
    else if(item.entered) {item.el.classList.add('ctm-out');item.el.classList.remove('ctm-in');if(previously)resetPointer(item);}
    else {item.el.classList.add('ctm-out');item.el.classList.remove('ctm-in');}
  }
  function tick() {
    frame=0; if(disposed)return;
    if(geometryDirty) {
      geometryDirty=false;
      for(const item of [...items.values()]) {
        if(!item.el.isConnected){visible.delete(item);active.delete(item);intersectionObserver?.unobserve(item.el);items.delete(item.el);continue;}
        if(visible.has(item) || item.inside || !intersectionObserver)viewport(item);
      }
    }
    for(const item of [...active]) {
      if(!pointerAllowed(item) && !item.focused){item.targetX=0;item.targetY=0;item.targetPower=0;}
      item.x+=(item.targetX-item.x)*.22;item.y+=(item.targetY-item.y)*.22;item.power+=(item.targetPower-item.power)*.19;
      const settled=Math.abs(item.x-item.targetX)+Math.abs(item.y-item.targetY)+Math.abs(item.power-item.targetPower)<.012;
      if(settled){item.x=item.targetX;item.y=item.targetY;item.power=item.targetPower;active.delete(item);}
      paintPointer(item);
    }
    if(active.size)requestFrame();
  }
  function findItem(target) {const el=target?.closest?.('.ctm-title,.ctm-action');return el?items.get(el):null;}
  function onPointer(event) {
    if(event.pointerType==='touch')return;
    const item=findItem(event.target);if(!item || !pointerAllowed(item))return;
    const r=item.el.getBoundingClientRect();if(!r.width||!r.height)return;
    item.point={x:event.clientX,y:event.clientY};item.targetX=clamp((event.clientX-r.left)/r.width*2-1,-1,1);item.targetY=clamp((event.clientY-r.top)/r.height*2-1,-1,1);item.targetPower=1;
    item.el.classList.add('ctm-hover');active.add(item);requestFrame();
  }
  function onOut(event) {const item=findItem(event.target);if(item&&!item.el.contains(event.relatedTarget))resetPointer(item);}
  function onFocus(event) {const item=findItem(event.target);if(!item||!motionAllowed())return;item.focused=true;item.targetX=.18;item.targetY=0;item.targetPower=.55;item.el.classList.add('ctm-hover');active.add(item);geometryDirty=true;requestFrame();}
  function onBlur(event) {const item=findItem(event.target);if(item&&!item.el.contains(event.relatedTarget)){item.focused=false;resetPointer(item);}}
  function onDown(event) {if(event.pointerType!=='touch')return;const item=findItem(event.target);if(item&&motionAllowed()){item.targetPower=.45;item.targetX=0;item.targetY=.2;active.add(item);requestFrame();}}
  function onUp(event) {if(event.pointerType==='touch'){const item=findItem(event.target);if(item)resetPointer(item);}}
  function suspend() {
    cancelAnimationFrame(frame);frame=0;active.clear();
    for(const item of items.values()){item.focused=false;resetPointer(item,true);if(!motionAllowed())item.el.classList.remove('ctm-enabled','ctm-in','ctm-out');}
  }
  function preferenceChanged() {suspend();geometryDirty=true;if(motionAllowed())requestFrame();}
  function restore(item) {
    resetPointer(item,true);item.el.classList.remove('ctm-title','ctm-action','ctm-display','ctm-phrase','ctm-wrap','ctm-enabled','ctm-in','ctm-out','ctm-hover');delete item.el.dataset.ctmId;
    if(item.ownsLabel&&item.el.getAttribute('aria-label')===item.lastLabel)item.el.removeAttribute('aria-label');
    // Only remove our own wrappers. Native em/span/br, links and handlers stay.
    item.el.querySelectorAll('ctm-word').forEach(word=>word.replaceWith(doc.createTextNode(word.textContent)));
    item.el.querySelectorAll('ctm-run').forEach(run=>run.replaceWith(...run.childNodes));
    for(const name of ['--ctm-px','--ctm-py','--ctm-power','--ctm-x','--ctm-y','--ctm-exit'])item.el.style.removeProperty(name);
  }
  function destroy() {
    if(disposed)return;disposed=true;controller.abort();cancelAnimationFrame(frame);cancelAnimationFrame(scanFrame);frame=scanFrame=0;
    intersectionObserver?.disconnect();mutationObserver?.disconnect();stateObserver?.disconnect();reduced.removeEventListener?.('change',preferenceChanged);fine.removeEventListener?.('change',preferenceChanged);
    for(const item of items.values())restore(item);items.clear();visible.clear();active.clear();scanQueue.clear();
  }
  window.CaisikTextMotion=Object.freeze({rescan:scan,destroy,stats:()=>({titles:[...items.values()].filter(i=>i.kind==='title').length,actions:[...items.values()].filter(i=>i.kind==='action').length,visible:visible.size,active:active.size,raf:!!frame,suspended:!motionAllowed()})});
  if(typeof IntersectionObserver==='function') intersectionObserver=new IntersectionObserver(entries=>{
    for(const e of entries) {
      const item=items.get(e.target);if(!item)continue;
      if(e.isIntersecting)visible.add(item);
      else {
        visible.delete(item);
        if(item.inside) {
          item.inside=false;
          if(motionAllowed()){item.el.classList.remove('ctm-in');item.el.classList.add('ctm-out');}
          resetPointer(item,true);
        }
      }
    }
    geometryDirty=true;requestFrame();
  },{rootMargin:'100px 0px',threshold:[0,.15,.65,1]});
  doc.addEventListener('pointerover',onPointer,{passive:true,signal});doc.addEventListener('pointermove',onPointer,{passive:true,signal});doc.addEventListener('pointerout',onOut,{passive:true,signal});doc.addEventListener('focusin',onFocus,{signal});doc.addEventListener('focusout',onBlur,{signal});doc.addEventListener('pointerdown',onDown,{passive:true,signal});doc.addEventListener('pointerup',onUp,{passive:true,signal});doc.addEventListener('pointercancel',onUp,{passive:true,signal});
  doc.addEventListener('visibilitychange',preferenceChanged,{signal});window.addEventListener('scroll',()=>{geometryDirty=true;requestFrame();},{passive:true,signal});window.addEventListener('resize',()=>{geometryDirty=true;requestFrame();},{passive:true,signal});window.addEventListener('caisik:panel',()=>{geometryDirty=true;requestFrame();},{signal});
  window.addEventListener('pagehide',event=>{pageSleeping=true;suspend();if(!event.persisted)destroy();},{signal});window.addEventListener('pageshow',()=>{pageSleeping=false;preferenceChanged();},{signal});
  reduced.addEventListener?.('change',preferenceChanged);fine.addEventListener?.('change',preferenceChanged);
  if(typeof MutationObserver==='function') {
    mutationObserver=new MutationObserver(records=>{
      for(const record of records) {
        if(record.type==='attributes'){geometryDirty=true;requestFrame();continue;}
        const parent=record.target.nodeType===1?record.target:record.target.parentElement;
        if(parent?.closest?.('ctm-word,ctm-ink,ctm-glyph'))continue;
        const existing=parent?.closest?.('.ctm-title,.ctm-action');
        const added=[...record.addedNodes].filter(node=>node.nodeType===1&&!node.matches('ctm-word,ctm-ink,ctm-glyph'));
        for(const node of added)queueScan(node);
        if(existing && [...record.addedNodes].some(n=>n.nodeType===3||n.nodeType===1&&!n.matches('ctm-word,ctm-ink,ctm-glyph')))queueScan(existing);
      }
    });mutationObserver.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','inert']});
    stateObserver=new MutationObserver(preferenceChanged);stateObserver.observe(root,{attributes:true,attributeFilter:['data-motion','data-selfmade-motion']});stateObserver.observe(doc.body,{attributes:true,attributeFilter:['class']});
  }
  scan();
})();
