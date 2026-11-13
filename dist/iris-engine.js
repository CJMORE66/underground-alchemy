/* IRIS / 111 · the instrument, its chapter selector and the living index. */
(() => {
  const one = (s, scope = document) => scope.querySelector(s);
  const root = document.documentElement;
  const path = location.pathname;
  const atlas = path === '/' || path === '/index.html' || path.startsWith('/q/');
  const shop = path.startsWith('/shop/');
  const archive = path.startsWith('/archive/');
  const navId = archive ? 'iris-archive-menu' : 'main-nav';
  const language = () => window.CaisikI18n?.getLanguage?.() || root.lang || 'cs';
  const tr = entries => entries[{cs:0,en:1,fr:2}[language()] ?? 0];
  const rootLink = atlas ? '' : '/';
  const entries = [
    ['home', rootLink+'#home', ['Úvod','Home','Accueil'], ['První pohled','First sight','Premier regard'], '#ffd600', 'M7 24Q24 5 41 24Q24 43 7 24ZM24 17a7 7 0 1 0 .01 0Z'],
    ['map', rootLink+'#hidden-city', ['Skryté město','Hidden City','La ville cachée'], ['Terénní atlas','Field atlas','Atlas de terrain'], '#ffd600', 'M7 36 12 13 23 17 35 10 41 32 29 38 19 32ZM23 17l-4 15m16-22-6 28M13 27l5-5 8 4 7-6'],
    ['principles', rootLink+'#principles', ['Sedm principů','Seven Principles','Les sept principes'], ['Vnitřní kompas','Inner compass','Boussole intérieure'], '#ffdf50', 'M24 4 39 13 43 29 32 42H16L5 29 9 13ZM24 11l12 22H12ZM24 39V18'],
    ['frequency', rootLink+'#frequency', ['Frekvence','Frequency','Fréquence'], ['Zvuková laboratoř','Sound laboratory','Laboratoire sonore'], '#ffb300', 'M3 25h6l4-12 5 25 5-32 5 35 5-28 4 12h8'],
    ['selfmade', '/play/', ['Selfmade','Selfmade','Selfmade'], ['Pět tvůrčích dílen','Five workshops','Cinq ateliers'], '#ffcf21', 'M9 32 25 16l7 7-16 16-9 2ZM25 16l6-6 7 7-6 6M11 13l5-5m-2 13-7-7m28 15 7 7-6 6-8-8'],
    ['expeditions', '/expeditions/', ['Expedice','Expeditions','Expéditions'], ['Paříž pěšky','Paris on foot','Paris à pied'], '#ffdc27', 'M24 3 28 15 38 10 33 20 45 24 33 28 38 38 28 33 24 45 20 33 10 38 15 28 3 24 15 20 10 10 20 15ZM24 13l4 15-15 7Z'],
    ['wall', rootLink+'#living-wall', ['Živá zeď','Living Wall','Le mur vivant'], ['Písmo a Blackbook','Letters & Blackbook','Lettres et Blackbook'], '#ffd541', 'M5 36V20l15-10-3 9-6 5v6l10-8-3 9ZM22 35l7-21 8-4-5 13 10-7-9 11 5 9-7 2-4-8-2 7Z'],
    ['shop', '/shop/', ['Obchod','Shop','Boutique'], ['Znak na textilu','The printed mark','Le signe imprimé'], '#ffc439', 'M7 9h32v22H7ZM10 39h29M13 25h18l4-8H17ZM24 18l3-8 5 2-2 6']
  ];
  const extras = {art:'wall',writer:'wall',dj:'frequency',mc:'frequency',breaking:'expeditions',knowledge:'principles',manifesto:'principles',notebook:'wall',sources:'map',mentalism:'principles',correspondence:'principles',vibration:'principles',polarity:'principles',rhythm:'principles','cause-effect':'principles',generation:'principles'};
  const routeKey = path.startsWith('/expeditions/') ? 'expeditions' : path.startsWith('/play/') ? 'selfmade' : path.startsWith('/art/') ? 'wall' : shop ? 'shop' : 'home';
  let active = routeKey, readout = '', preview = null, open = false, pinned = false, closeTimer;
  const legacy = one('[data-primary-header],.site-header,.exp-header,.play-header,.signature-nav,.mw-art-top');
  const head = document.createElement('header');
  head.className = 'iris-dock';
  head.dataset.primaryHeader = '';
  head.dataset.brandRoute = atlas ? 'atlas' : shop ? 'shop' : 'world';
  head.dataset.textMotion = 'off';
  const notebook = one('#notebook-open'), cart = shop && one('[href="#shop-cart"]',legacy || document);
  const local = one('#exp-mode,#motion-control',legacy || document);
  const oldShort = atlas ? one('[data-shop-shortcut]',legacy || document) : null;
  // A glass retort holds each chapter's sign above a tongue of molten gold.
  const grid = '<svg viewBox="0 0 160 157" aria-hidden="true"><g class="iris-instrument-rule"><path d="M58 15h43m-39 4h35m-31 0v18c0 14-13 26-25 40-14 16-18 29-12 43 7 17 28 23 51 23s44-6 51-23c6-14 2-27-12-43-12-14-25-26-25-40V19M40 105q19 5 39 0t40 0"/><path d="M49 75c-13 16-17 27-14 38m68-58 9 12M16 145h128"/></g><g class="iris-instrument-rotor"><path d="M39 116q13 7 41 5t41-6m-71 12q24 11 54 1"/></g><g transform="translate(58 58) scale(.91)" class="iris-route-glyph"><path/></g></svg>';
  const eye = '<span class="iris-symbol"><img src="/assets/logo/caisik-forge-header.webp?v=forge3" width="760" height="304" alt=""></span>';
  head.innerHTML = '<a class="iris-id" href="/logo/" data-i18n="off"><span class="iris-mini">CAISIK</span><b>UNDERGROUND<br>ALCHEMY</b></a>'+
    '<button id="'+(archive?'iris-archive-toggle':'menu-toggle')+'" class="ua-engine iris-switch" data-open="false" aria-controls="'+navId+'" aria-expanded="false" type="button" data-i18n="off">'+eye+'<span class="iris-switch-label">MENU <i></i></span></button>'+
    '<div class="iris-tools"></div><nav id="'+navId+'" class="iris-panel" hidden><div class="iris-eyebrow" data-i18n="off"><span>UNDERGROUND &nbsp; / &nbsp; ALCHEMY</span><span class="iris-index"></span></div>'+
    '<div class="iris-body"><div class="iris-instrument" data-i18n="off"><div class="iris-chart">'+grid+'</div><span class="iris-plate-no"></span><strong class="iris-plate-name"></strong><small class="iris-plate-tag"></small></div>'+
    '<ol class="iris-chapters" data-i18n="off">'+entries.slice(1).map(([key,href],i)=>'<li><a data-route="'+key+'" href="'+href+'"><small>0'+(i+1)+'</small><span></span><i aria-hidden="true">↗</i></a></li>').join('')+'</ol></div>'+
    '<div class="iris-foot"><div class="iris-pages" data-i18n="off"><a data-iris-home href="'+entries[0][1]+'"></a><a href="/art/">Blackbook ↗</a><a href="/logo/">CAISIK 111 ↗</a></div><div data-brand-language></div></div></nav>';
  if (atlas || shop || (!archive && legacy)) legacy ? legacy.replaceWith(head) : document.body.prepend(head);
  else document.body.prepend(head);
  if (path.startsWith('/expeditions/')) head.classList.add('exp-header');
  const tools = one('.iris-tools',head);
  if (oldShort) tools.append(oldShort);
  if (cart) tools.append(cart);
  if (notebook) tools.append(notebook);
  if (local) tools.append(local);
  if (!tools.childElementCount) {
    const status = document.createElement('span'); status.className = 'iris-context';status.dataset.i18n='off';tools.append(status);
  }
  const toggle = one('.iris-switch',head), nav = one('.iris-panel',head), chartPath = one('.iris-route-glyph path',head);
  const sym = one('.iris-symbol',head), links = [...nav.querySelectorAll('[data-route]')];
  const dock = one('[data-language-dock]');
  if (dock) one('[data-brand-language]',nav).append(dock);
  // Both displays use the same moving parts. Keep the showroom's SVG references local.
  fetch('/assets/logo/caisik-iris-motion.svg?v=forge3').then(r => r.ok ? r.text() : '').then(raw => {
    if (!raw) return;
    const install = (target, source) => {
      const graphic = new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
      if (graphic.localName === 'svg') target.replaceChildren(document.importNode(graphic,true));
    };
    install(sym,raw);
    const model = document.querySelector('[data-forge-model]');
    if (model) install(model,raw.replaceAll('forge-part-', 'show-part-').replaceAll('caisik-forge-header.webp','caisik-forge-master.webp'));
  }).catch(()=>{});
  function setScene() {
    const entry = entries.find(e=>e[0]===(preview || active)) || entries[0];
    const n = entries.indexOf(entry);
    head.style.setProperty('--engine-color',entry[4]);
    head.style.setProperty('--iris-phase',(n*31)+'deg');
    head.dataset.engineMode=entry[0];
    chartPath.setAttribute('d',entry[5]);
    one('.iris-plate-no',nav).textContent=n ? String(n).padStart(2,'0')+' / 07' : 'CAISIK';
    one('.iris-plate-name',nav).textContent=tr(entry[2]);
    one('.iris-plate-tag',nav).textContent=tr(entry[3]);
    const status = one('.iris-context',tools);
    if(status) status.textContent=readout || tr(entry[2]);
    for(const link of links) {
      link.toggleAttribute('data-preview',link.dataset.route===preview);
      if(link.dataset.route === active) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  }
  function localized() {
    const label=tr(['Hlavní menu','Main menu','Menu principal']);
    nav.setAttribute('aria-label',label);
    toggle.setAttribute('aria-label','CAISIK 111 · '+label);
    one('.iris-index',nav).textContent=tr(['Rejstřík kapitol','Chapter index','Index des chapitres']);
    one('[data-iris-home]',nav).textContent=tr(entries[0][2])+' ↗';
    links.forEach((link,i)=>one('span',link).textContent=tr(entries[i+1][2]));
    const cartLabel=one('[data-brand-cart]',head);
    if(cartLabel)cartLabel.textContent=tr(['Košík','Cart','Panier']);
    setScene();
  }
  function reveal(value,restore=false) {
    clearTimeout(closeTimer);
    if(open===value)return;
    open=value;
    if(!value){pinned=false;preview=null;}
    toggle.dataset.open=String(value);
    toggle.setAttribute('aria-expanded',String(value));
    nav.hidden=!value;
    if(value) nav.scrollTop=0;
    if(restore) toggle.focus({preventScroll:true});
    setScene();
    window.dispatchEvent(new CustomEvent('caisik:engine',{detail:{open:value}}));
  }
  const fine=matchMedia('(any-hover:hover) and (any-pointer:fine)');
  function leave() {
    clearTimeout(closeTimer);
    if (!pinned && !nav.contains(document.activeElement)) closeTimer=setTimeout(()=>reveal(false),270);
  }
  [toggle,nav].forEach(el=>{
    el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse' && fine.matches)reveal(true);});
    el.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')leave();});
  });
  toggle.addEventListener('click',()=>{if(open && pinned)reveal(false);else{pinned=true;reveal(true);}});
  toggle.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();pinned=true;reveal(true);links[0].focus();}});
  nav.addEventListener('pointerover',e=>{const a=e.target.closest('[data-route]');if(a && a.dataset.route!==preview){preview=a.dataset.route;setScene();}});
  nav.addEventListener('focusin',e=>{const a=e.target.closest('[data-route]');if(a){preview=a.dataset.route;setScene();}});
  nav.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const target=new URL(a.href);
    reveal(false);
    if(target.pathname===location.pathname && target.hash){
      const section=document.getElementById(decodeURIComponent(target.hash.slice(1)));
      if(section){if(!section.hasAttribute('tabindex'))section.setAttribute('tabindex','-1');section.focus({preventScroll:true});}
    }
  });
  document.addEventListener('pointerdown',e=>{if(open&&!nav.contains(e.target)&&!toggle.contains(e.target))reveal(false);});
  document.addEventListener('focusin',e=>{if(open&&!nav.contains(e.target)&&!toggle.contains(e.target)&&!e.target.closest('dialog[open]'))reveal(false);});
  document.addEventListener('keydown',e=>{if(open&&e.key==='Escape'&&!one('dialog[open]')){e.preventDefault();reveal(false,true);}});
  window.addEventListener('pagehide',()=>reveal(false));
  window.addEventListener('caisik:languagechange',localized);
  window.addEventListener('caisik:scene',e=>{
    const key=e.detail?.action;
    active=entries.some(x=>x[0]===key)?key:extras[key]||routeKey;
    if (['dj','mc','writer','breaking','knowledge'].includes(key)) {
      if (path.startsWith('/expeditions/')) active='expeditions';
      if (path.startsWith('/play/')) active='selfmade';
    }
    readout=e.detail?.label || '';
    setScene();
  });
  if(!root.dataset.motion){try{if(['off','"off"'].includes(localStorage.getItem('atlas-motion')))root.dataset.motion='off';}catch{}}
  localized();
})();
