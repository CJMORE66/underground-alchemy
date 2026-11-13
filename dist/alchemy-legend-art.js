import { createPrologueActor } from './alchemy-prologue-actor.js?v=2';
import { createLegendMic } from './alchemy-legend-mc.js?v=1';

const clamp = value => Math.max(0, Math.min(1, value));
const mix = (start, end, amount) => start + (end - start) * amount;
const ease = (start, end, progress) => {
  const amount = clamp((progress - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
};
const round = value => Number(value.toFixed(3));

const poses = {
  watch: { x: 1091, y: 710, torso: -3, head: -15, nearHand: [-64, 6], farHand: [68, 12], nearOpen: 0 },
  unlock: { x: 1061, y: 711, torso: -11, head: -17, nearHand: [-176, -128], farHand: [56, -18], nearOpen: .83 },
  reflect: { x: 1061, y: 727, torso: -12, head: 7, nearHand: [-144, -39], farHand: [65, -11], nearOpen: .89 },
  knock: { x: 1052, y: 709, torso: -8, head: -15, nearHand: [-164, -128], farHand: [66, -39], nearOpen: 0 },
  listen: { x: 1069, y: 711, torso: 3, head: -17, nearHand: [-51, -179], farHand: [70, 8], nearOpen: .68 },
  hold: { x: 1062, y: 713, torso: -2, head: 10, nearHand: [-90, -56], farHand: [23, -60], nearOpen: .24 },
  press: { x: 1046, y: 719, torso: -13, head: -14, nearHand: [-146, -104], farHand: [-19, -99], nearOpen: .2 },
};

function blendPose(start, end, amount) {
  return Object.fromEntries(Object.keys(start).map(key => [key, Array.isArray(start[key])
    ? start[key].map((value, index) => mix(value, end[key][index], amount))
    : mix(start[key], end[key], amount)]));
}

/** Cut positions are tied to page distance so they also work when scrolling backwards. */
export function galleryFrameAt(value) {
  const progress = clamp(value);
  const opening = ease(.09, .23, progress);
  const reflect = ease(.16, .28, progress) * (1 - ease(.36, .49, progress));
  const echo = ease(.36, .49, progress);
  const print = ease(.66, .75, progress);
  const stamps = [.424, .458, .548].map(beat => clamp((progress - beat) / .11));
  const knocks = [.413, .447].map(beat => ease(beat, beat + .011, progress) * (1 - ease(beat + .011, beat + .028, progress)));
  let pose;
  if (progress < .16) pose = blendPose(poses.watch, poses.unlock, ease(.025, .113, progress));
  else if (progress < .36) pose = blendPose(poses.unlock, poses.reflect, ease(.16, .26, progress));
  else if (progress < .48) {
    pose = blendPose(poses.reflect, poses.knock, ease(.36, .421, progress));
    pose.nearHand[0] -= 19 * Math.max(...knocks);
  } else if (progress < .64) {
    pose = blendPose(poses.knock, poses.listen, ease(.48, .56, progress));
    pose.head += Math.sin(ease(.548, .62, progress) * Math.PI) * 12;
  } else if (progress < .82) pose = blendPose(poses.listen, poses.hold, ease(.64, .733, progress));
  else if (progress < .943) pose = blendPose(poses.hold, poses.press, ease(.82, .893, progress));
  else pose = blendPose(poses.press, poses.hold, ease(.943, 1, progress));
  pose.nearFoot = [1028 - pose.x, 909 - pose.y, 0];
  pose.farFoot = [1123 - pose.x, 902 - pose.y, 0];

  return {
    opening, reflect, echo, print, stamps, pose,
    thread: ease(.035, .21, progress),
    imprint: ease(.887, .986, progress),
    book: ease(.683, .761, progress),
    press: ease(.82, .91, progress),
    chapter: progress < .36 ? 0 : progress < .66 ? 1 : 2,
  };
}

const words = {
  en: ['The second imprint', 'Next shot', 'To the collection', 'The Alchemist opens a brass door. An image awakens in its own reflection. He knocks twice, listens to the city’s reply, then presses his Blackbook to the frame. Golden streets spread from the page.'],
  cs: ['Druhý otisk', 'Další záběr', 'Do galerie', 'Alchymista otevírá mosazné dveře. Obraz se probouzí ve vlastním odrazu. Alchymista dvakrát zaklepe, poslouchá odpověď města a přitiskne Blackbook k rámu. Ze stránky se rozběhnou zlaté ulice.'],
  fr: ['La seconde empreinte', 'Plan suivant', 'Voir la collection', 'L’alchimiste ouvre une porte en laiton. Une image s’éveille dans son propre reflet. Il frappe deux fois, écoute la réponse de la ville, puis applique son Blackbook sur le cadre. Des rues dorées se déploient depuis la page.'],
};

function makeBook(document, torso) {
  const ns = 'http://www.w3.org/2000/svg';
  const book = document.createElementNS(ns, 'g');
  book.setAttribute('aria-hidden', 'true');
  book.innerHTML = `
    <path d="M-69-33Q-38-41-3-23 28-43 68-34l-7 58Q23 17 0 34-32 17-64 26Z" fill="#17100b" stroke="#e4a63e" stroke-width="4"/>
    <path d="M-63-36Q-33-43-3-25L0 28Q-29 10-58 18Z M-3-25Q26-43 62-36l-7 54Q24 12 0 28Z" fill="#d7ae62" stroke="#372014" stroke-width="2"/>
    <path d="M-3-25 0 28m-48-53q17 1 29 8m-28-2 24 7m-23-1 27 8m33 12 9-23 18 15Zm-2 2 11-8 10 3 8-5" fill="none" stroke="#683b1b" stroke-width="2"/>
    <path d="M-58 19q31-7 58 10Q22 12 55 18" fill="none" stroke="#fff09a" stroke-width="1.5"/>
    <path d="M16 4l7-18 16 13-14-2Z" fill="none" stroke="#fff09a" stroke-width="1.1"/>
  `;
  torso.append(book);
  return book;
}

function mountGallery(track) {
  const find = name => track.querySelector(`[data-gallery-${name}]`);
  const frame = find('frame');
  const next = find('next');
  const skip = find('skip');
  const collection = document.getElementById('blackbook-collection');
  const actor = createPrologueActor(document);
  actor.element.setAttribute('viewBox', '805 409 465 530');
  actor.element.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  find('actor').append(actor.element);
  const mic = createLegendMic(document, actor.element);
  const book = makeBook(document, actor.element.querySelector('[data-actor-torso]'));
  const left = find('door="left"');
  const right = find('door="right"');
  const lock = find('lock');
  const seam = find('seam');
  const aura = find('aura');
  const reflection = find('reflection');
  const echo = [...find('echo').children];
  const plates = [...track.querySelectorAll('[data-gallery-plate]')];
  const thread = find('thread');
  const print = find('print');
  const meters = [...track.querySelectorAll('.ua-gallery-meters i')];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 510px)');
  const stops = [.26, .545, .96];
  let previous = -1;
  let pending = 0;

  function localize() {
    const lang = (window.CaisikI18n?.getLanguage?.() || root.lang).split('-')[0];
    const copy = words[lang] || words.en;
    track.lang = words[lang] ? lang : 'en';
    track.setAttribute('aria-label', copy[0]);
    next.firstChild.nodeValue = `${copy[1]} `;
    skip.firstChild.nodeValue = `${copy[2]} `;
    find('description').textContent = copy[3];
  }

  function motionAllowed() {
    let atlasOff = false;
    try { atlasOff = ['off', '"off"'].includes(localStorage.getItem('atlas-motion')); } catch {}
    return !reduced.matches && !short.matches && !atlasOff && root.dataset.motion !== 'off'
      && !['off', 'quiet', 'calm', 'reduced'].includes(root.dataset.selfmadeMotion)
      && !root.hasAttribute('data-iris-guide-paused') && !document.body.classList.contains('simple-mode');
  }

  function distance() {
    return Math.max(1, track.offsetHeight - frame.offsetHeight);
  }

  function relativeTop(rect) {
    const dock = root.querySelector('.iris-dock')?.offsetHeight || 0;
    return rect.top - dock;
  }

  function paint(progress, still) {
    const state = galleryFrameAt(progress);
    left.style.transform = `translateX(${-round(state.opening * 103)}%)`;
    right.style.transform = `translateX(${round(state.opening * 103)}%)`;
    lock.style.transform = `translate(-50%, -50%) rotate(${round(state.opening * 45)}deg)`;
    lock.style.opacity = round(1 - state.opening);
    seam.style.opacity = round(.2 + Math.sin(state.opening * Math.PI) * .76);
    aura.style.opacity = round(.19 + state.opening * .42 + state.imprint * .25);
    reflection.style.opacity = round(still ? .23 : state.reflect * .56);
    reflection.style.transform = `scaleY(-1) skewX(${round(state.reflect * 7)}deg)`;
    plates[1].style.opacity = round(state.echo);
    plates[2].style.opacity = round(state.print);
    state.stamps.forEach((spread, index) => {
      echo[index].style.transform = `scale(${round(1 + 20 * spread)})`;
      echo[index].style.opacity = round(Math.sin(spread * Math.PI) * (index === 2 ? .83 : .47));
    });
    thread.style.strokeDashoffset = round(1 - state.thread);
    thread.style.opacity = round(state.thread * (1 - state.imprint * .56));
    print.style.strokeDashoffset = round(1 - state.imprint);
    print.style.opacity = round(state.imprint * .9);
    meters.forEach((meter, index) => meter.toggleAttribute('data-current', index === state.chapter));

    actor.pose(state.pose);
    mic.render(undefined, state.pose);
    const { nearHand, farHand } = state.pose;
    const bookX = (nearHand[0] + farHand[0]) / 2;
    const bookY = (nearHand[1] + farHand[1]) / 2 - 13;
    book.setAttribute('transform', `translate(${round(bookX)} ${round(bookY)}) rotate(${round(-4 - state.press * 16)}) scale(1 ${round(.78 + state.press * .22)})`);
    book.setAttribute('opacity', round(state.book));
  }

  function update() {
    pending = 0;
    const rect = track.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < innerHeight;
    if (visible !== track.hasAttribute('data-gallery-visible')) track.toggleAttribute('data-gallery-visible', visible);
    const still = track.dataset.galleryFlow === 'still';
    const progress = still ? .29 : clamp(-relativeTop(rect) / distance());
    if (Math.abs(progress - previous) < .0005) return;
    previous = progress;
    paint(progress, still);
  }

  function schedule() {
    if (!pending) pending = requestAnimationFrame(update);
  }

  function syncMotion() {
    const flow = motionAllowed() ? 'scroll' : 'still';
    if (flow !== track.dataset.galleryFlow) {
      const oldTop = track.getBoundingClientRect().bottom <= 0 ? collection.getBoundingClientRect().top : null;
      track.dataset.galleryFlow = flow;
      if (oldTop !== null) {
        const delta = collection.getBoundingClientRect().top - oldTop;
        if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
      }
      previous = -1;
    }
    if (flow === 'still' && document.activeElement === next) skip.focus({ preventScroll: true });
    next.hidden = flow === 'still';
    schedule();
  }

  next.addEventListener('click', () => {
    const position = relativeTop(track.getBoundingClientRect());
    const target = stops.find(stop => stop > clamp(-position / distance()) + .025);
    if (target === undefined) skip.click();
    else window.scrollTo({ top: window.scrollY + position + target * distance(), behavior: 'smooth' });
  });
  skip.addEventListener('click', () => collection.focus({ preventScroll: true }));

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', syncMotion, { passive: true });
  window.addEventListener('caisik:languagechange', localize);
  window.addEventListener('storage', syncMotion);
  reduced.addEventListener('change', syncMotion);
  short.addEventListener('change', syncMotion);
  const preferences = new MutationObserver(syncMotion);
  preferences.observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-selfmade-motion', 'data-iris-guide-paused'] });
  preferences.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  localize();
  syncMotion();
}

if (typeof document !== 'undefined') {
  const chapter = document.querySelector('[data-legend-art]');
  if (chapter) mountGallery(chapter);
}
