/* Shared contents, chapter navigation and the articulated CAISIK signature. */
(() => {
  const one = (s, scope = document) => scope.querySelector(s);
  const root = document.documentElement;
  const path = location.pathname;
  const atlas = path === '/' || path === '/index.html' || path.startsWith('/q/');
  const shop = path.startsWith('/shop/');
  const archive = path.startsWith('/archive/');
  const navId = archive ? 'iris-archive-menu' : 'main-nav';
  const language = () => (window.CaisikI18n?.getLanguage?.() || root.lang || 'cs').split('-')[0];
  const tr = entries => entries[{cs:0,en:1,fr:2}[language()] ?? 0];
  const rootLink = path === '/' || path === '/index.html' ? '' : '/';
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

  entries.splice(1, 0, [
    'story', rootLink + '#needle-street',
    ['Jehla přeskočila', 'The needle skipped', 'Le diamant a sauté'],
    ['Hratelný příběh, deska a kurýr.', 'A playable story, a record and a courier.', 'Une histoire à jouer, un disque et un coursier.'],
    '#ffd600', entries[0][5],
  ]);
  entries.push([
    'blackbook', '/art/', ['Blackbook', 'Blackbook', 'Blackbook'],
    ['Prohlížej celou sbírku graffiti CAISIK.', 'Browse the CAISIK graffiti collection.', 'Feuillette la collection de graffiti CAISIK.'],
    '#ffd600', entries.find(entry => entry[0] === 'wall')[5],
  ]);
  const groups = [
    ['all', ['Vše', 'All', 'Tout']],
    ['story', ['Příběh', 'Story', 'Histoire']],
    ['city', ['Místa', 'Places', 'Lieux']],
    ['learn', ['Učení', 'Learning', 'Apprendre']],
    ['create', ['Tvorba', 'Create', 'Créer']],
    ['archive', ['Archiv', 'Archive', 'Archives']],
    ['shop', ['Obchod', 'Shop', 'Boutique']],
  ];
  const groupFor = {
    home: 'story', story: 'story', map: 'city', expeditions: 'learn',
    principles: 'learn', frequency: 'create', selfmade: 'create',
    wall: 'archive', blackbook: 'archive', shop: 'shop',
  };
  const descriptions = {
    home: ['Úvod do světa a animovaný Alchymista.', 'Enter the world with the animated Alchemist.', 'Entre dans le monde avec l’Alchimiste animé.'],
    map: ['Najdi místa, otevři mapu a vyber trasu.', 'Find places, open the map and choose a route.', 'Trouve des lieux, ouvre la carte et choisis un parcours.'],
    principles: ['Sedm principů, ukázky a vlastní pozorování.', 'Seven principles, demonstrations and observations.', 'Sept principes, des démonstrations et tes observations.'],
    frequency: ['Piš sloky, nahraj hlas a zkoušej rytmus.', 'Write verses, record your voice and explore rhythm.', 'Écris des couplets, enregistre ta voix et explore le rythme.'],
    selfmade: ['Otevři vlastní questy a tvůrčí dílny.', 'Open your quests and creative workshops.', 'Ouvre tes quêtes et tes ateliers créatifs.'],
    expeditions: ['Vyber disciplínu a pokračuj do lekcí.', 'Choose a discipline and continue to the lessons.', 'Choisis une discipline et passe aux leçons.'],
    wall: ['Prohlížej kompozice a jejich pohyblivé detaily.', 'Explore compositions and their moving details.', 'Explore les compositions et leurs détails animés.'],
    shop: ['Prohlédni kolekce a motivy na oblečení.', 'Browse collections and printed designs.', 'Parcours les collections et les motifs sur vêtements.'],
  };
  const catalog = entries.map(entry => ({
    id: entry[0], href: entry[1], title: entry[2],
    description: descriptions[entry[0]] || entry[3],
    group: groupFor[entry[0]], parent: entry[0],
  }));
  const disciplines = [
    ['dj', ['DJ', 'DJ', 'DJ'], ['Deska, scratch a rytmus.', 'Records, scratching and rhythm.', 'Disque, scratch et rythme.']],
    ['mc', ['MC', 'MC', 'MC'], ['Flow, rýmy a vlastní sloka.', 'Flow, rhymes and your own verse.', 'Flow, rimes et ton couplet.']],
    ['writer', ['Writer', 'Writer', 'Writer'], ['Kostra písmene a vlastní tah.', 'Letter structure and your own stroke.', 'Structure de la lettre et ton trait.']],
    ['breaking', ['Breaking', 'Breaking', 'Breaking'], ['Pohyb, sestava a rytmus těla.', 'Movement, sequences and body rhythm.', 'Mouvement, enchaînement et rythme du corps.']],
    ['knowledge', ['Knowledge of Self', 'Knowledge of Self', 'Knowledge of Self'], ['Pozorování, otázky a vlastní pohled.', 'Observations, questions and your perspective.', 'Observations, questions et ton point de vue.']],
  ];
  for (const [id, title, description] of disciplines) {
    catalog.push({ id, title, description, href: '/expeditions/' + id + '/', group: 'learn', parent: 'expeditions' });
  }
  const principles = [
    ['mentalism', ['Mentalismus', 'Mentalism', 'Mentalisme'], ['Pozornost a úhel pohledu.', 'Attention and perspective.', 'Attention et point de vue.']],
    ['correspondence', ['Korespondence', 'Correspondence', 'Correspondance'], ['Vzory a vztahy mezi měřítky.', 'Patterns across different scales.', 'Motifs entre différentes échelles.']],
    ['vibration', ['Vibrace', 'Vibration', 'Vibration'], ['Chvění, zvuk a změna.', 'Tremor, sound and change.', 'Vibration, son et changement.']],
    ['polarity', ['Polarita', 'Polarity', 'Polarité'], ['Dvě strany a prostor mezi nimi.', 'Two sides and the space between them.', 'Deux côtés et l’espace entre eux.']],
    ['rhythm', ['Rytmus', 'Rhythm', 'Rythme'], ['Návrat, pauza a opakování.', 'Return, pause and repetition.', 'Retour, pause et répétition.']],
    ['cause-effect', ['Příčina a následek', 'Cause and Effect', 'Cause et effet'], ['Sleduj důsledky prvního pohybu.', 'Follow the consequences of the first move.', 'Suis les conséquences du premier geste.']],
    ['generation', ['Tvoření', 'Generation', 'Génération'], ['Z podnětu vzniká vlastní výstup.', 'Turn an input into your own creation.', 'Transforme une impulsion en création.']],
  ];
  for (const [id, title, description] of principles) {
    catalog.push({ id, title, description, href: '/q/' + id + '/', group: 'learn', parent: 'principles' });
  }
  const words = {
    contents: ['Obsah a průvodce', 'Contents and guide', 'Sommaire et guide'],
    open: ['Otevřít obsah', 'Open contents', 'Ouvrir le sommaire'],
    close: ['Zavřít', 'Close', 'Fermer'],
    search: ['Hledat v obsahu', 'Search the contents', 'Chercher dans le sommaire'],
    placeholder: ['Kapitola, disciplína, princip…', 'Chapter, discipline, principle…', 'Chapitre, discipline, principe…'],
    filters: ['Kategorie obsahu', 'Content categories', 'Catégories du sommaire'],
    results: ['Výsledky', 'Results', 'Résultats'],
    empty: ['Nic nenalezeno. Zkus jiný výraz nebo kategorii.', 'No matches. Try another term or category.', 'Aucun résultat. Essaie un autre terme ou une autre catégorie.'],
    reset: ['Zobrazit vše', 'Show everything', 'Tout afficher'],
    continue: ['Pokračovat v příběhu', 'Continue the story', 'Continuer l’histoire'],
    objective: ['Další úkol', 'Next objective', 'Prochain objectif'],
    findWindow: ['Pusť takt a najdi opožděné okno.', 'Play the bar and find the late window.', 'Lance la mesure et repère la fenêtre en retard.'],
    rewind: ['Vrať desku a odhal kurýra.', 'Rewind the record and reveal the courier.', 'Remonte le disque et découvre le coursier.'],
    trail: ['Vyber stopu a najdi cestu na dvůr.', 'Choose a lead and reach the courtyard.', 'Choisis une piste et rejoins la cour.'],
    yard: ['Slož na dvoře vlastní rytmus.', 'Make your own rhythm in the courtyard.', 'Compose ton rythme dans la cour.'],
    returnImprint: ['Vrať se s rytmem k oknu II.', 'Take your rhythm back to window II.', 'Rapporte ton rythme à la fenêtre II.'],
    replayImprint: ['Přehraj svůj rytmus v okně II.', 'Replay your rhythm at window II.', 'Rejoue ton rythme à la fenêtre II.'],
    home: ['Úvod', 'Home', 'Accueil'],
    cart: ['Košík', 'Cart', 'Panier'],
    count: ['témat', 'topics', 'sujets'],
    clear: ['Vymazat hledání', 'Clear search', 'Effacer la recherche'],
  };
  const text = key => tr(words[key]);
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  let category = 'all';
  const extras = {art:'blackbook',writer:'wall',dj:'frequency',mc:'frequency',breaking:'expeditions',knowledge:'principles',manifesto:'principles',notebook:'wall',sources:'map',mentalism:'principles',correspondence:'principles',vibration:'principles',polarity:'principles',rhythm:'principles','cause-effect':'principles',generation:'principles'};
  const routeKey = path.startsWith('/expeditions/') ? 'expeditions' : path.startsWith('/play/') ? 'selfmade' : path.startsWith('/art/') ? 'blackbook' : shop ? 'shop' : 'home';
  let active = routeKey, readout = '', preview = null, open = false;
  const legacy = one('[data-primary-header],.site-header,.exp-header,.play-header,.signature-nav,.mw-art-top');
  const head = document.createElement('header');
  head.className = 'iris-dock';
  head.dataset.primaryHeader = '';
  head.dataset.brandRoute = atlas ? 'atlas' : shop ? 'shop' : 'world';
  head.dataset.textMotion = 'off';
  const notebook = one('#notebook-open'), cart = shop && one('[href="#shop-cart"]',legacy || document);
  const local = one('#exp-mode,#motion-control',legacy || document);
  const oldShort = atlas ? one('[data-shop-shortcut]',legacy || document) : null;
  const eye = '<span class="iris-symbol"><img src="/assets/logo/caisik-forge-header.webp?v=forge3" width="760" height="304" alt=""></span>';
  head.innerHTML = `
    <a class="iris-id" href="/logo/" data-i18n="off"><span class="iris-mini">CAISIK</span><b>UNDERGROUND<br>ALCHEMY</b></a>
    <button id="${archive ? 'iris-archive-toggle' : 'menu-toggle'}" class="ua-engine iris-switch" data-open="false" aria-controls="${navId}" aria-expanded="false" type="button" data-i18n="off">
      ${eye}<span class="iris-switch-label"><span data-index-caption></span><i></i></span>
    </button>
    <div class="iris-tools"></div>
    <nav id="${navId}" class="iris-panel" hidden data-i18n="off">
      <div class="iris-index-heading">
        <div><span class="iris-eyebrow">CAISIK / UNDERGROUND ALCHEMY</span><h2 data-index-title></h2></div>
        <button type="button" class="iris-close" data-index-close><span data-index-close-label></span> ×</button>
      </div>
      <div class="iris-resume">
        <div><small data-objective-label></small><p data-story-objective></p></div>
        <a href="${rootLink}#needle-street" data-story-continue></a>
      </div>
      <form class="iris-search" role="search">
        <label for="iris-search" data-search-label></label>
        <div><input id="iris-search" type="search" autocomplete="off" enterkeyhint="go"><button type="button" data-search-clear hidden>×</button></div>
      </form>
      <div class="iris-index-body">
        <div class="iris-categories" role="group">
          ${groups.map(([id]) => `<button type="button" data-index-group="${id}" aria-pressed="${id === 'all'}"><span></span><small></small></button>`).join('')}
        </div>
        <div class="iris-results">
          <p class="iris-result-count" role="status" aria-live="polite"></p>
          <ol class="iris-chapters">
            ${catalog.map(item => `<li data-index-item="${item.id}"><a data-route="${item.id}" href="${item.href}"><div><span class="iris-entry-title"></span><p class="iris-entry-description"></p></div><i aria-hidden="true">↗</i></a></li>`).join('')}
          </ol>
          <div class="iris-empty" hidden><p></p><button type="button" data-search-reset></button></div>
        </div>
      </div>
      <div class="iris-foot"><div class="iris-pages"><a data-iris-home href="${entries[0][1]}"></a><a href="/logo/">CAISIK 111 ↗</a></div><div data-brand-language></div></div>
    </nav>`;
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
  const toggle = one('.iris-switch', head);
  const nav = one('.iris-panel', head);
  const search = one('#iris-search', nav);
  const clearSearch = one('[data-search-clear]', nav);
  const groupButtons = [...nav.querySelectorAll('[data-index-group]')];
  const items = [...nav.querySelectorAll('[data-index-item]')];
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
    const key = preview || active;
    const parent = catalog.find(item => item.id === key)?.parent || key;
    const entry = entries.find(item => item[0] === parent) || entries[0];
    head.style.setProperty('--engine-color', entry[4]);
    head.style.setProperty('--iris-phase', (entries.indexOf(entry) * 31) + 'deg');
    head.dataset.engineMode = entry[0];
    const status = one('.iris-context', tools);
    if (status) status.textContent = readout || tr(entry[2]);
    for (const link of links) {
      link.toggleAttribute('data-preview', link.dataset.route === preview);
      if (link.dataset.route === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function updateObjective() {
    let objective = 'findWindow';
    let progress;
    const read = key => {
      try { return localStorage.getItem(key); } catch { return null; }
    };
    try { progress = JSON.parse(read('caisik-needle-fork-v1')); } catch {}
    if (Array.isArray(progress?.completed) && progress.completed.some(route => ['stairs', 'wall'].includes(route))) {
      let imprint;
      try { imprint = JSON.parse(read('caisik-needle-imprint-v1')); } catch {}
      const steps = imprint?.steps;
      const hasRhythm = Array.isArray(steps) && steps.length === 8 &&
        steps.every(step => typeof step === 'boolean') && steps.includes(true);
      objective = hasRhythm ? (imprint.returned === true ? 'replayImprint' : 'returnImprint') : 'yard';
    } else if (read('caisik-needle-carrier-v1') === 'silver-gloves') objective = 'trail';
    else if (read('caisik-needle-street-v1') === 'diamond') objective = 'rewind';
    one('[data-story-objective]', nav).textContent = text(objective);
  }

  function filterIndex() {
    const query = normalize(search.value);
    let count = 0;
    items.forEach((element, index) => {
      const item = catalog[index];
      const haystack = [...item.title, ...item.description].map(normalize).join(' ');
      const matches = (category === 'all' || item.group === category) && query.split(/\s+/).every(word => haystack.includes(word));
      element.hidden = !matches;
      if (matches) count++;
    });
    clearSearch.hidden = !search.value;
    one('.iris-empty', nav).hidden = count > 0;
    one('.iris-result-count', nav).textContent = text('results') + ' · ' + count + ' / ' + catalog.length;
    groupButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.indexGroup === category)));
  }

  function localized() {
    nav.setAttribute('aria-label', text('contents'));
    toggle.setAttribute('aria-label', text('open'));
    one('[data-index-caption]', head).textContent = tr(['OBSAH', 'CONTENTS', 'SOMMAIRE']);
    one('[data-index-title]', nav).textContent = text('contents');
    one('[data-index-close-label]', nav).textContent = text('close');
    one('[data-index-close]', nav).setAttribute('aria-label', text('close'));
    one('[data-objective-label]', nav).textContent = text('objective') + ' · ' + tr(entries.find(entry => entry[0] === 'story')[2]);
    one('[data-story-continue]', nav).textContent = text('continue') + ' →';
    one('[data-search-label]', nav).textContent = text('search');
    search.placeholder = text('placeholder');
    clearSearch.setAttribute('aria-label', text('clear'));
    one('.iris-categories', nav).setAttribute('aria-label', text('filters'));
    one('.iris-empty p', nav).textContent = text('empty');
    one('[data-search-reset]', nav).textContent = text('reset');
    one('[data-iris-home]', nav).textContent = text('home') + ' ↗';
    groupButtons.forEach((button, index) => {
      const id = groups[index][0];
      one('span', button).textContent = tr(groups[index][1]);
      one('small', button).textContent = id === 'all' ? catalog.length : catalog.filter(item => item.group === id).length;
    });
    links.forEach((link, index) => {
      one('.iris-entry-title', link).textContent = tr(catalog[index].title);
      one('.iris-entry-description', link).textContent = tr(catalog[index].description);
    });
    const cartLabel = one('[data-brand-cart]', head);
    if (cartLabel) cartLabel.textContent = text('cart');
    updateObjective();
    filterIndex();
    setScene();
  }

  function reveal(value, restore = false) {
    if (open === value) return;
    open = value;
    if (!value) preview = null;
    toggle.dataset.open = String(value);
    toggle.setAttribute('aria-expanded', String(value));
    nav.hidden = !value;
    if (value) {
      nav.scrollTop = 0;
      updateObjective();
    }
    if (restore) toggle.focus({ preventScroll: true });
    setScene();
    window.dispatchEvent(new CustomEvent('caisik:engine', { detail: { open: value } }));
  }

  toggle.addEventListener('click', () => reveal(!open));
  toggle.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      reveal(true);
      search.focus();
    }
  });
  one('[data-index-close]', nav).addEventListener('click', () => reveal(false, true));
  search.addEventListener('input', filterIndex);
  one('.iris-search', nav).addEventListener('submit', event => {
    event.preventDefault();
    const first = items.find(item => !item.hidden)?.querySelector('a');
    first?.click();
  });
  clearSearch.addEventListener('click', () => {
    search.value = '';
    filterIndex();
    search.focus();
  });
  one('[data-search-reset]', nav).addEventListener('click', () => {
    search.value = '';
    category = 'all';
    filterIndex();
    search.focus();
  });
  groupButtons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.indexGroup;
    filterIndex();
  }));
  nav.addEventListener('pointerover', event => {
    const link = event.target.closest('[data-route]');
    if (link && link.dataset.route !== preview) {
      preview = link.dataset.route;
      setScene();
    }
  });
  nav.addEventListener('focusin', event => {
    const link = event.target.closest('[data-route]');
    if (link) {
      preview = link.dataset.route;
      setScene();
    }
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = new URL(link.href);
    reveal(false);
    if (target.pathname === location.pathname && target.hash) {
      const section = document.getElementById(decodeURIComponent(target.hash.slice(1)));
      if (section) {
        if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
      }
    }
  });
  window.addEventListener('caisik:open-index', () => {
    reveal(true);
    search.focus();
  });
  document.addEventListener('pointerdown',e=>{if(open&&!nav.contains(e.target)&&!toggle.contains(e.target))reveal(false);});
  document.addEventListener('focusin',e=>{if(open&&!nav.contains(e.target)&&!toggle.contains(e.target)&&!e.target.closest('dialog[open]'))reveal(false);});
  document.addEventListener('keydown',e=>{if(open&&e.key==='Escape'&&!one('dialog[open]')){e.preventDefault();reveal(false,true);}});
  window.addEventListener('pagehide', () => reveal(false));
  let positionFrame = 0;
  function trackPosition() {
    positionFrame = 0;
    if (!atlas || document.hidden) return;
    const line = head.getBoundingClientRect().bottom + 28;
    const local = entries.flatMap(entry => {
      if (!entry[1].startsWith('#')) return [];
      const target = document.getElementById(entry[1].slice(1));
      return target ? [{ key: entry[0], bounds: target.getBoundingClientRect() }] : [];
    });
    const current = local.find(item => item.bounds.top <= line && item.bounds.bottom > line);
    if (current && active !== current.key) {
      active = current.key;
      readout = '';
      setScene();
    }
  }
  function schedulePosition() {
    if (!positionFrame && atlas && !document.hidden) positionFrame = requestAnimationFrame(trackPosition);
  }
  window.addEventListener('scroll', schedulePosition, { passive: true });
  window.addEventListener('resize', schedulePosition);
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
  schedulePosition();
})();
