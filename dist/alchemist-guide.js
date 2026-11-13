/* CAISIK's illustrated companion shares the atlas's native scroll and places. */
(() => {
  'use strict';
  const doc = document;
  const root = doc.documentElement;
  const hero = doc.querySelector('#home.hero');
  const stage = hero?.querySelector('.alchemy-stage');
  const preview = doc.getElementById('place-preview');
  const city = doc.getElementById('city');
  if (!stage || !preview || !city) return;

  const art = '/assets/alchemy-motion/';
  const pose = art + 'guide-standing.webp';
  const chapters = ['hidden-city', 'principles', 'frequency', 'living-wall'];
  const directions = [
    { from: .13, to: .70, ground: .86, lift: .05, stride: 3 },
    { from: .73, to: .34, ground: .90, lift: .14, stride: 2 },
    { from: .19, to: .78, ground: .83, lift: .02, stride: 4 },
    { from: .76, to: .23, ground: .88, lift: -.05, stride: 3 }
  ];
  const words = {
    cs: {
      guide: 'ALCHYMISTA', city: 'PAŘÍŽ', rise: '01 / PROBUZENÍ', walk: '02 / NA CESTĚ',
      atlas: 'První kroky městem', choose: 'Vyber místo nebo trasu. U každé zastávky ti ukážu, čeho si všimnout.',
      routes: 'Vybrat trasu ↓', detail: 'Otevřít zastávku ↗',
      mastery: 'Teď je řada na tobě.', challenge: 'Vezmi jeden detail z ulice a udělej z něj vlastní rytmus, skicu nebo verš.',
      studio: 'Vstoupit do SELFMADE ↗'
    },
    en: {
      guide: 'THE ALCHEMIST', city: 'PARIS', rise: '01 / AWAKENING', walk: '02 / ON THE ROAD',
      atlas: 'First steps through the city', choose: 'Choose a place or a route. I’ll show you what to look for at each stop.',
      routes: 'Choose a route ↓', detail: 'Open this stop ↗',
      mastery: 'Now it’s your turn.', challenge: 'Take one detail from the street and turn it into a rhythm, sketch or verse of your own.',
      studio: 'Enter SELFMADE ↗'
    },
    fr: {
      guide: 'L’ALCHIMISTE', city: 'PARIS', rise: '01 / L’ÉVEIL', walk: '02 / EN CHEMIN',
      atlas: 'Premiers pas dans la ville', choose: 'Choisis un lieu ou un parcours. À chaque halte, je te montre un détail à observer.',
      routes: 'Choisir un parcours ↓', detail: 'Ouvrir cette halte ↗',
      mastery: 'À toi de jouer.', challenge: 'Prends un détail de la rue et fais-en ton propre rythme, croquis ou couplet.',
      studio: 'Entrer dans SELFMADE ↗'
    }
  };

  const make = (tag, className) => Object.assign(doc.createElement(tag), { className });
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (from, to, value) => {
    const progress = clamp((value - from) / (to - from));
    return progress * progress * (3 - 2 * progress);
  };
  const mix = (from, to, progress) => from + (to - from) * progress;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 760px)');
  const isQuiet = () => ['off', 'quiet', 'calm', 'reduced'].includes(root.dataset.selfmadeMotion);
  const sceneList = [];
  const preferences = new MutationObserver(records => {
    if (records.some(record => record.attributeName === 'data-motion')) savedPause = readPause();
    schedule();
  });
  let frame = 0;
  let sleeping = false;
  let savedPause = readPause();
  let wording = words[root.lang] || words.en;
  let phase = '';

  function readPause() {
    try { return JSON.parse(localStorage.getItem('atlas-motion')) === 'off'; }
    catch { return false; }
  }

  function illustration(className, src = pose, loading = 'lazy') {
    const img = make('img', className);
    img.alt = '';
    img.loading = loading;
    img.decoding = 'async';
    if (loading === 'eager') img.fetchPriority = 'low';
    img.src = src;
    return img;
  }

  function trail() {
    const tracks = make('span', 'ua-guide-tracks');
    for (let i = 0; i < 5; i++) {
      const mark = make('i', 'ua-guide-print');
      mark.style.setProperty('--ua-step', String(i));
      tracks.append(mark);
    }
    return tracks;
  }

  const hasFilm = hero.hasAttribute('data-film-epilogue');
  const plate = hasFilm ? null : illustration('ua-guide-plate', art + 'guide-empty-seat.webp', 'eager');
  plate?.setAttribute('aria-hidden', 'true');
  if (!hasFilm) hero.prepend(plate);
  const animation = make('div', 'ua-guide-rise');
  animation.setAttribute('aria-hidden', 'true');
  const sigil = make('span', 'ua-guide-sigil');
  const heroTrail = trail();
  const actor = hasFilm ? null : illustration('ua-guide-actor', pose, 'eager');
  const phaseCaption = make('span', 'ua-guide-phase');
  phaseCaption.setAttribute('data-i18n', 'off');
  if (!hasFilm) {
    animation.append(sigil, heroTrail, actor, phaseCaption);
    hero.append(animation);
    for (const img of [plate, actor]) img.addEventListener('load', schedule, { once: true });
  }

  for (const [index, id] of chapters.entries()) {
    const bridge = doc.querySelector(`[data-journey-bridge="${id}"]`);
    const visual = bridge?.querySelector('.journey-bridge-visual');
    const copy = bridge?.querySelector('.journey-bridge-description');
    if (!visual || !copy) continue;
    const scene = make('span', 'ua-guide-crossing');
    scene.setAttribute('aria-hidden', 'true');
    const figure = window.UAGuide ? make('span','ua-guide-walker ua-walk-rig') : illustration('ua-guide-walker');
    const rig = window.UAGuide?.mount(figure, 'walk');
    rig?.setProgress?.(0);
    figure.dataset.facing = directions[index].to < directions[index].from ? 'left' : 'right';
    const tracks = trail();
    scene.append(tracks, figure);
    visual.append(scene);
    const speaker = make('p', 'ua-guide-speaker');
    speaker.setAttribute('data-i18n', 'off');
    copy.before(speaker);
    copy.classList.add('ua-guide-voice');
    sceneList.push({ visual, scene, figure, rig, tracks, speaker, path: directions[index] });
  }

  function makeCard() {
    const card = make('aside', 'ua-guide-card');
    card.setAttribute('data-i18n', 'off');
    card.setAttribute('data-text-motion', 'off');
    const portrait = make('span', 'ua-guide-portrait');
    portrait.setAttribute('aria-hidden', 'true');
    portrait.append(illustration(''));
    const text = make('div', 'ua-guide-message');
    const speaker = make('p', 'ua-guide-speaker');
    const title = make('strong', 'ua-guide-stop');
    const body = make('p', 'ua-guide-observation');
    text.append(speaker, title, body);
    const actions = make('div', 'ua-guide-actions');
    card.append(portrait, text, actions);
    return { card, speaker, title, body, actions };
  }

  const cityCard = makeCard();
  cityCard.card.setAttribute('data-alchemist-city', '');
  city.closest('.explorer-top').before(cityCard.card);
  const detail = make('button', 'ua-guide-link');
  detail.type = 'button';
  detail.hidden = true;
  const route = make('a', 'ua-guide-link');
  route.href = '#routes';
  cityCard.actions.append(detail, route);
  const last = makeCard();
  const studio = make('a', 'ua-guide-link');
  studio.href = '/play/';
  last.actions.append(studio);
  doc.querySelector('.manifesto-text')?.after(last.card);

  function showStop() {
    const actual = preview.querySelector('[data-open-place]');
    const option = city.selectedOptions?.[0];
    const name = option?.value === 'Paris' ? wording.city : option?.textContent?.trim() || wording.city;
    const observation = actual && preview.dataset.guideObservation;
    cityCard.speaker.textContent = `${wording.guide} / ${name}`;
    cityCard.title.textContent = actual ? preview.querySelector('h3')?.textContent || wording.atlas : wording.atlas;
    cityCard.body.textContent = observation ? window.CaisikI18n?.t(observation) || observation : wording.choose;
    detail.hidden = !actual;
    if (actual) detail.dataset.openPlace = actual.dataset.openPlace;
    else delete detail.dataset.openPlace;
  }

  function languageChanged() {
    const lang = window.CaisikI18n?.getLanguage?.() || root.lang;
    wording = words[lang] || words.en;
    for (const { speaker } of sceneList) speaker.textContent = wording.guide;
    last.speaker.textContent = wording.guide;
    last.title.textContent = wording.mastery;
    last.body.textContent = wording.challenge;
    studio.textContent = wording.studio;
    route.textContent = wording.routes;
    detail.textContent = wording.detail;
    phaseCaption.textContent = phase === 'walking' ? wording.walk : wording.rise;
    showStop();
    schedule();
  }

  const places = new MutationObserver(showStop);
  places.observe(preview, { childList: true, attributes: true, attributeFilter: ['data-guide-observation'] });
  city.addEventListener('change', showStop);
  window.addEventListener('caisik:languagechange', languageChanged);

  function setPhase(next) {
    if (phase === next) return;
    phase = next;
    hero.dataset.guidePhase = next;
    phaseCaption.textContent = next === 'walking' ? wording.walk : wording.rise;
  }

  function resetHero() {
    hero.classList.remove('ua-guide-scene-live');
    setPhase('seated');
  }

  function heroGeometry() {
    const host = hero.getBoundingClientRect();
    const canvas = stage.getBoundingClientRect();
    const scale = small.matches ? Math.max(canvas.width / 1536, canvas.height / 1024)
      : Math.min(canvas.width / 1536, canvas.height / 1024);
    const width = 1536 * scale;
    const height = 1024 * scale;
    const left = small.matches ? (canvas.width - width) * .72
      : canvas.width - width + (window.innerWidth <= 1100 ? 80 : 0);
    return {
      host, width, height,
      x: canvas.left - host.left + left,
      y: canvas.bottom - host.top - height
    };
  }

  function drawHero(geometry, vh) {
    const { host, width, height, x, y } = geometry;
    const floor = y + height * .90;
    const start = Math.max(18, scrollY + host.top + floor - vh + 16);
    const travel = Math.max(205, Math.min(vh * .34, 340));
    const progress = clamp((scrollY - start) / travel);
    if (!progress || !actor.naturalWidth || !plate.naturalWidth || !height || host.bottom <= 0) {
      resetHero();
      return;
    }
    const lift = smooth(.04, .54, progress);
    const walk = smooth(.51, .98, progress);
    const footfall = Math.abs(Math.sin(walk * 3 * Math.PI));
    const midpoint = Math.min(host.width * .88, Math.max(host.width * (small.matches ? .39 : .59), x + width * .69));
    const finalX = host.width * (small.matches ? .83 : .89);
    const actorX = mix(midpoint, finalX, walk);
    const actorY = mix(y + height * .82, floor, lift) - footfall * height * .023;
    const actorHeight = height * mix(mix(.38, .66, lift), .40, walk);

    Object.assign(plate.style, { width: `${width}px`, height: `${height}px`, left: `${x}px`, top: `${y}px` });
    hero.style.setProperty('--ua-guide-seat', (1 - smooth(.08, .44, progress)).toFixed(3));
    Object.assign(actor.style, {
      height: `${actorHeight}px`,
      transform: `translate3d(${actorX}px,${actorY}px,0) translate(-50%,-100%) scaleY(${mix(.78, 1, lift)}) rotate(${Math.sin(walk * 6 * Math.PI) * 2 + walk * 4}deg)`,
      opacity: (smooth(.04, .28, progress) * (1 - smooth(.84, 1, progress))).toFixed(3)
    });
    Object.assign(sigil.style, {
      transform: `translate3d(${midpoint}px,${floor - height * .10}px,0) translate(-50%,-50%) rotate(${progress * 100}deg) scale(${mix(.5, 1.3, lift)})`,
      opacity: (smooth(0, .21, progress) * (1 - smooth(.41, .87, progress))).toFixed(3)
    });
    Object.assign(heroTrail.style, {
      left: `${Math.min(midpoint, finalX)}px`,
      top: `${floor}px`,
      width: `${Math.max(Math.abs(finalX - midpoint), 40)}px`
    });
    heroTrail.style.setProperty('--ua-walk', (walk * 1.25).toFixed(3));
    heroTrail.style.setProperty('--ua-trail-opacity', (1 - smooth(.84, 1, progress)).toFixed(3));
    setPhase(progress >= 1 ? 'departed' : progress >= .53 ? 'walking' : 'rising');
    hero.classList.add('ua-guide-scene-live');
  }

  function drawCrossing(item, rect, vh, allowed) {
    const { scene, figure, rig, tracks, path } = item;
    const onScreen = rect.top < vh && rect.bottom > 0;
    if (!allowed || !onScreen) {
      scene.classList.remove('ua-guide-crossing-live');
      return;
    }
    const progress = clamp((vh * .91 - rect.top) / (vh * .64 + rect.height * .52));
    const walk = smooth(.02, .99, progress);
    const footfall = Math.abs(Math.sin(walk * path.stride * Math.PI));
    const x = mix(path.from, path.to, walk) * rect.width;
    const y = (path.ground - path.lift * Math.sin(walk * Math.PI)) * rect.height - footfall * 7;
    const lean = Math.sin(walk * 2 * path.stride * Math.PI) * 3;
    figure.style.setProperty('--ua-guide-stride', `translate3d(${x}px,${y}px,0) translate(-50%,-100%) rotate(${lean}deg) scale(${mix(.77, 1.04, Math.sin(walk * Math.PI))})`);
    rig?.setProgress?.((walk * path.stride) % 1);
    tracks.style.left = `${Math.min(path.from, path.to) * 100}%`;
    tracks.style.top = `${path.ground * 100}%`;
    tracks.style.width = `${Math.abs(path.to - path.from) * 100}%`;
    tracks.classList.toggle('ua-guide-tracks-reversed', path.to < path.from);
    tracks.style.setProperty('--ua-walk', walk.toFixed(3));
    scene.classList.add('ua-guide-crossing-live');
  }

  function update() {
    frame = 0;
    const allowed = !sleeping && !doc.hidden && !savedPause && !reduced.matches
      && !root.hasAttribute('data-iris-guide-paused') && root.dataset.motion !== 'off' && !isQuiet() && !doc.body.classList.contains('simple-mode')
      && !doc.body.classList.contains('exp-field') && !doc.querySelector('dialog[open], .culture-board.cb-field');
    const height = window.innerHeight || root.clientHeight;
    // Measure every moving panel before writing its transforms.
    const geometry = allowed && !hasFilm && !hero.classList.contains('iris-hero-ready') ? heroGeometry() : null;
    const rectangles = allowed ? sceneList.map(item => item.visual.getBoundingClientRect()) : [];
    if (geometry) drawHero(geometry, height);
    else resetHero();
    sceneList.forEach((item, index) => drawCrossing(item, rectangles[index] || { top: 0, bottom: 0 }, height, allowed));
  }

  function schedule() {
    if (!frame && !sleeping && !doc.hidden) frame = requestAnimationFrame(update);
  }

  function visibilityChanged() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (sleeping || doc.hidden) update();
    else schedule();
  }

  preferences.observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-selfmade-motion', 'data-iris-guide-paused'] });
  preferences.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  resize?.observe(hero);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('storage', event => {
    if (event.key !== 'atlas-motion' && event.key !== null) return;
    savedPause = readPause();
    schedule();
  });
  doc.addEventListener('toggle', schedule, true);
  doc.addEventListener('visibilitychange', visibilityChanged);
  reduced.addEventListener('change', visibilityChanged);
  window.addEventListener('pagehide', () => { sleeping = true; visibilityChanged(); });
  window.addEventListener('pageshow', () => { sleeping = false; visibilityChanged(); });
  languageChanged();
})();
