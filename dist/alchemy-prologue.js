import { createPrologueArt } from './alchemy-prologue-art.js?v=1';
import { createPrologueActor } from './alchemy-prologue-actor.js?v=4';
import { createLegendMic, sampleLegendMicSpeech, sampleLegendMicStow, sampleLegendMc } from './alchemy-legend-mc.js';
import { createLegendDjBreakArt, sampleLegendDj, breakCameraAt, createBreakCan } from './alchemy-legend-dj-break.js?v=3';
import { createLegendWorld } from './alchemy-legend-world.js';
import { createLegendMacros, stylusContactProgress } from './alchemy-legend-macros.js?v=4';
import { createLegendFinale } from './alchemy-legend-finale.js?v=5';
import { writerPhases, writerRefillAt } from './alchemy-writer-strokes.js?v=4';
import { createWriterGlass } from './alchemy-writer-glass.js';
import { sampleWeightedBreak } from './alchemy-break-weight.js';
import { createBreakSkin } from './alchemy-break-skin.js';

const writerStart = 2.05;
const writerSpan = .66;
const writerSeconds = 28;
const refillSpan = .112;
const dogSpan = .247;
const railPause = refillSpan + dogSpan;
const refillStart = writerStart + writerSpan * writerRefillAt;
const dogStart = refillStart + refillSpan;
const resumeStart = dogStart + dogSpan;
const writerEnd = writerStart + writerSpan + railPause;
const glassStart = writerEnd + .105;
const courtStart = glassStart + .175;
const epilogueShift = courtStart - (writerStart + writerSpan);

export function writerFilmClock(progress) {
  return writerStart + progress * writerSpan + (progress >= writerRefillAt ? railPause : 0);
}

function writerCut(name, from, to, preview) {
  return [name, writerFilmClock(from), writerFilmClock(preview), (to - from) * writerSeconds];
}

// First frame, representative frame for the arrow control, and play time (seconds).
const cuts = [
  ['exterior', 0, 0, 3.6], ['throne', .12, .185, 2.5],
  ['symbols', .228, .29, 2.7], ['serpent', .328, .407, 2.7],
  ['entrance', .43, .505, 3.7], ['quote', .594, .614, 3.1],
  ['dj', .635, .669, 1.9], ['stylus', .695, .764, 3.8], ['scratch', .82, .858, 2.5],
  ['mc', .90, .975, 3.6], ['voice', 1.025, 1.071, 6.5],
  ['footwork', 1.12, 1.265, 8.5], ['handspin', 1.4126, 1.51, 5.3],
  ['headspin', 1.5897, 1.658, 5.4], ['flip', 1.7283, 1.834, 4.8],
  ['pigment', 1.89, 1.975, 5.5],
  writerCut('writer', writerPhases.fill, writerRefillAt, .06),
  ['refill', refillStart, refillStart + refillSpan * .63, 3.6],
  ['dog', dogStart, dogStart + dogSpan * .70, 8],
  writerCut('resume', writerRefillAt, writerPhases.flare, writerRefillAt + .018),
  writerCut('flare', writerPhases.flare, writerPhases.outline, .51),
  writerCut('outline', writerPhases.outline, writerPhases.reveal, .86),
  writerCut('wholetrain', writerPhases.reveal, 1, .99),
  ['railpose', writerEnd, writerEnd + .064, 3.4],
  ['glass', glassStart, glassStart + .169, 5.7],
  ['kungfu', courtStart, 2.847 + epilogueShift, 6.5],
  ['meditation', 2.955 + epilogueShift, 3.047 + epilogueShift, 6.1],
].map(([name, start, stop, seconds]) => ({ name, start, stop, seconds }));
const end = 3.06 + epilogueShift;
const stylusIndex = cuts.findIndex(cut => cut.name === 'stylus');
const stylusStart = cuts[stylusIndex].start;
const stylusEnd = cuts[stylusIndex + 1].start;
const needleDrop = stylusStart + (stylusEnd - stylusStart) * stylusContactProgress;
const breakStart = 1.12;
const stillFrame = .61 / end;
const files = {
  truth: '/assets/alchemy-prologue/pravda-cs.mp3',
  scratch: '/assets/alchemy-prologue/legend-scratch.mp3',
  rap: '/assets/alchemy-prologue/legend-rap-cs.mp3',
  writer: '/assets/alchemy-prologue/writer-spray-wildstyle.mp3',
  refill: '/assets/alchemy-prologue/writer-can-shake.mp3',
  dog: '/assets/alchemy-prologue/writer-rail-dog.mp3',
};
const languages = {
  cs: {
    title: 'Cesta začíná.', speaker: 'Alchymista', name: 'Legenda o druhém otisku', next: 'Další záběr', skip: 'Přeskočit', enter: 'Otevřít atlas', story: 'Hrát první kapitolu', guide: 'Hlasový průvodce',
    play: 'Přehrát film se zvukem', pause: 'Pozastavit film', soundOn: 'Zapnout zvuk', soundOff: 'Ztlumit zvuk', replay: 'Přehrát znovu', captions: 'Titulky',
    art: 'Druhý otisk', truth: '',
    rap: 'Na skle starej otisk, v krku novej hlas, / tři doby držím já, tu čtvrtou nechám na vás.',
  },
  en: {
    title: 'The journey begins.', speaker: 'The alchemist', name: 'Legend of the Second Imprint', next: 'Next shot', skip: 'Skip', enter: 'Open atlas', story: 'Play chapter one', guide: 'Voice guide',
    play: 'Play film with sound', pause: 'Pause film', soundOn: 'Enable sound', soundOff: 'Mute sound', replay: 'Play again', captions: 'Captions',
    art: 'The Second Imprint', truth: 'Truth speaks only to those who understand how to listen.',
    rap: 'Old trace on the glass, new voice in my throat, / I hold the first three beats, the fourth is yours to float.',
  },
  fr: {
    title: 'Le voyage commence.', speaker: 'L’alchimiste', name: 'La légende de la deuxième empreinte', next: 'Plan suivant', skip: 'Passer', enter: 'Ouvrir l’atlas', story: 'Jouer au premier chapitre', guide: 'Guide vocal',
    play: 'Lire le film avec le son', pause: 'Mettre le film en pause', soundOn: 'Activer le son', soundOff: 'Couper le son', replay: 'Réécouter', captions: 'Sous-titres',
    art: 'La deuxième empreinte', truth: 'La vérité ne parle qu’aux oreilles qui savent comprendre.',
    rap: 'Vieille trace sur la vitre, nouvelle voix en moi, / je tiens les trois premiers temps, le quatrième est à toi.',
  },
};

const clamp = value => Math.max(0, Math.min(value, 1));
const mix = (from, to, t) => from + (to - from) * t;
const range = (from, to, value) => clamp((value - from) / (to - from));
const ease = (from, to, value) => {
  const t = range(from, to, value);
  return t * t * (3 - 2 * t);
};

export function sampleLegendTimeline(progress) {
  const p = clamp(progress) * end;
  const shot = cuts.findLastIndex(cut => p >= cut.start);
  const cut = cuts[shot];
  const local = range(cut.start, cuts[shot + 1]?.start ?? end, p);
  const writer = p >= resumeStart ? clamp((p - writerStart - railPause) / writerSpan) :
    p >= refillStart ? writerRefillAt : clamp((p - writerStart) / writerSpan);
  return {
    shot, name: cut.name, p, local,
    exterior: 1 - ease(.062, .137, p),
    street: ease(.614, .667, p),
    symbols: ease(.225, .319, p),
    serpent: ease(.327, .428, p),
    entrance: ease(.43, .55, p),
    speech: range(.55, .637, p),
    route: ease(.607, .664, p) * (1 - ease(.7, .758, p)),
    dj: range(.635, .90, p),
    mc: range(.90, breakStart, p),
    breaking: range(breakStart, 1.89, p),
    writer,
    kungfu: range(courtStart, end, p),
  };
}

const doc = globalThis.document;
const track = doc?.querySelector('[data-film-prologue]');
if (track) mountPrologue();

function mountPrologue() {
  const root = doc.documentElement;
  const params = new URLSearchParams(window.location?.search);
  const entry = cuts.find(cut => cut.name === params.get('cut'));
  const restingFrame = entry ? entry.stop / end : stillFrame;
  const find = name => track.querySelector(`[data-film-${name}]`);
  const frame = track.querySelector('.ua-film-frame');
  const plate = find('plate');
  const image = plate.querySelector('img');
  const quote = find('quote');
  const translation = find('translation');
  const lineTitle = find('line-title');
  const speaker = find('speaker');
  const rapCaption = find('rap');
  const next = find('next');
  const transport = find('transport');
  const sound = find('sound');
  const captions = find('captions');
  const replay = find('replay');
  const skip = find('skip');
  const story = find('story');
  const storyLabel = find('story-label');
  const guide = find('guide');
  const gallery = find('art');
  const reel = find('reel');
  const meters = cuts.map(() => reel.appendChild(doc.createElement('span')));
  const art = createPrologueArt(doc);
  const actor = createPrologueActor(doc);
  const breakSkin = createBreakSkin(doc, actor.element);
  const world = createLegendWorld(doc);
  const props = createLegendDjBreakArt(doc, actor.element);
  const mic = createLegendMic(doc, actor.element);
  const can = createBreakCan(doc, actor.element);
  const macros = createLegendMacros(doc);
  const finale = createLegendFinale(doc, actor.element);
  const glass = createWriterGlass(doc);
  const companion = createPrologueActor(doc);
  const companionMic = createLegendMic(doc, companion.element);
  companion.element.setAttribute('viewBox', '935 435 250 520');
  companion.element.setAttribute('class', 'ua-legend-companion');
  companion.element.setAttribute('hidden', '');
  plate.append(art.element, world.element, props.element, finale.element, actor.element);
  plate.after(macros.element);
  frame.insertBefore(glass.element,frame.querySelector('.ua-film-console'));
  if (props.foreground) plate.append(props.foreground);
  doc.body.append(companion.element);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 510px)');
  const portraitFrame = matchMedia('(max-width: 760px)');
  const audio = createScore();
  let copy = languages.cs;
  let raf = null;
  let sleeping = false;
  let scene = -1;
  let activeAudio = null;
  let heard = null;
  let captioned = false;
  let audible = false;
  let lastProgress = -1;
  let lastNeedleProgress = -1;
  let lastVoice = -1;
  let lastAmbient = -100;
  let playhead = null;
  let previousTime = null;
  let cameraBox;

  function hasMotion() {
    let savedPause = false;
    try { savedPause = ['off', '"off"'].includes(localStorage.getItem('atlas-motion')); } catch {}
    return !reduced.matches && !short.matches && !savedPause && root.dataset.motion !== 'off' &&
      !['off', 'quiet', 'calm', 'reduced'].includes(root.dataset.selfmadeMotion) &&
      !doc.body.classList.contains('simple-mode');
  }

  function fit() {
    cameraBox = null;
    lastProgress = -1;
    const flow = hasMotion() ? 'scroll' : 'still';
    if (track.dataset.filmFlow !== flow) {
      const below = track.getBoundingClientRect().bottom <= 0;
      const surface = track.nextElementSibling;
      const before = below && surface ? surface.getBoundingClientRect().top : null;
      track.dataset.filmFlow = flow;
      if (flow === 'still') pauseFilm();
      if (before !== null) {
        const displacement = surface.getBoundingClientRect().top - before;
        if (displacement) window.scrollBy({ top: displacement, behavior: 'instant' });
      }
      lastProgress = -1;
    }
    paintControls();
    schedule();
  }

  function layout() {
    const stickyTop = Number.parseFloat(getComputedStyle(frame).top) || 0;
    const trackTop = track.getBoundingClientRect().top;
    const travel = Math.max(1, (track.offsetHeight - frame.offsetHeight) * .96);
    const bounds = frame.getBoundingClientRect();
    return {
      p: track.dataset.filmFlow === 'scroll' ? clamp((stickyTop - trackTop) / travel) : restingFrame,
      inView: bounds.bottom > stickyTop + 48 && bounds.top < innerHeight - 45,
      past: bounds.bottom < stickyTop + 78,
      stickyTop, trackTop, travel,
    };
  }

  function paintControls() {
    const scroll = track.dataset.filmFlow === 'scroll';
    const name = cuts[scene]?.name;
    const final = name === 'meditation';
    const quoteScene = name === 'quote';
    const rapScene = name === 'mc' || name === 'voice';
    const showCaption = captioned || !scroll;
    track.dataset.filmShot = String(scene + 1);
    track.dataset.filmCut = name || '';
    transport.hidden = !scroll;
    transport.setAttribute('aria-label', playhead === null ? copy.play : copy.pause);
    transport.setAttribute('aria-pressed', String(playhead !== null));
    quote.hidden = !quoteScene;
    rapCaption.hidden = !rapScene || !showCaption;
    translation.hidden = !copy.truth || !showCaption;
    lineTitle.textContent = copy.title;
    speaker.textContent = copy.speaker;
    translation.textContent = copy.truth;
    rapCaption.textContent = copy.rap;
    reel.hidden = !scroll;
    if ((!scroll || final) && doc.activeElement === next) skip.focus({ preventScroll: true });
    next.hidden = !scroll || final;
    next.setAttribute('aria-label', copy.next);
    if (!quoteScene && !rapScene && doc.activeElement === replay) sound.focus({ preventScroll: true });
    replay.hidden = !quoteScene && !rapScene;
    replay.setAttribute('aria-label', copy.replay);
    captions.hidden = !scroll;
    captions.setAttribute('aria-label', copy.captions);
    captions.setAttribute('aria-pressed', String(captioned));
    sound.setAttribute('aria-label', audible ? copy.soundOff : copy.soundOn);
    sound.setAttribute('aria-pressed', String(audible));
    if (!(final || !scroll) && doc.activeElement === gallery) skip.focus({ preventScroll: true });
    gallery.hidden = !final && scroll;
    gallery.firstChild.nodeValue = copy.art + ' ';
    skip.setAttribute('aria-label', final || !scroll ? copy.enter : copy.skip);
    for (const [i, marker] of meters.entries()) {
      marker.toggleAttribute('data-current', i === scene);
      marker.toggleAttribute('data-past', i < scene);
    }
  }

  function localize() {
    const lang = (window.CaisikI18n?.getLanguage?.() || root.lang || 'cs').split('-')[0];
    copy = languages[lang] || languages.cs;
    track.lang = languages[lang] ? lang : 'cs';
    track.setAttribute('aria-label', copy.name);
    if (storyLabel) storyLabel.textContent = copy.story;
    if (guide) guide.textContent = copy.guide;
    paintControls();
  }

  function render(state, time, voice, inView) {
    const { p, shot, name, local, exterior, street, symbols, serpent, entrance, speech, route, dj, mc, breaking, kungfu } = state;
    const atDeck = p >= .635 && p < .90;
    const atMic = p >= .90 && p < breakStart;
    const dancing = p >= breakStart && p < 1.89;
    const postDance = p >= writerStart;
    const writing = postDance && p < courtStart;
    breakSkin.setActive(dancing || name === 'pigment');
    const scroll = track.dataset.filmFlow === 'scroll';
    if (shot !== scene) {
      scene = shot;
      paintControls();
    }
    if (p !== lastProgress || (inView && scroll && exterior && time - lastAmbient >= .033)) {
      world.render({ exterior, street, route, progress: p, time: scroll ? time : 0 });
      lastAmbient = time;
    }
    if (p === lastProgress && voice === lastVoice) return;
    lastProgress = p;
    lastVoice = voice;

    const dive = ease(.03, .115, p) * (1 - ease(.115, .21, p));
    const warmth = .25 + .21 * Math.sin(Math.PI * symbols) + .24 * Math.sin(Math.PI * serpent);
    frame.style.setProperty('--film-light', (.4 + .52 * ease(.105, .212, p)).toFixed(3));
    const camera = dancing || name === 'pigment' ? breakCameraAt(breaking) : null;
    frame.style.setProperty('--film-lens', (camera?.zoom ?? (1 + dive * .38 + street * .035)).toFixed(4));
    if (camera) {
      // At a close-up, pull the physical contact point away from the lower controls.
      cameraBox ??= {
        width: frame.clientWidth, height: frame.clientHeight, plateWidth: plate.offsetWidth,
        left: plate.offsetLeft - (portraitFrame.matches ? .68 * plate.offsetWidth : 0),
        top: plate.offsetTop,
      };
      const box = cameraBox;
      const amount = ease(1.04, 1.9, camera.zoom);
      const x = box.left + camera.x * box.plateWidth / 1536;
      const y = box.top + camera.y * box.plateWidth / 1536;
      frame.style.setProperty('--film-origin', `${camera.x / 15.36}% ${camera.y / 10.24}%`);
      frame.style.setProperty('--film-pan-x', `${((box.width * (portraitFrame.matches ? .5 : .59) - x) * amount).toFixed(2)}px`);
      frame.style.setProperty('--film-pan-y', `${((box.height * .54 - y) * amount).toFixed(2)}px`);
    } else {
      frame.style.removeProperty('--film-origin');
      frame.style.removeProperty('--film-pan-x');
      frame.style.removeProperty('--film-pan-y');
    }
    frame.style.setProperty('--film-heat', ((1 - exterior) * (warmth + street * .16)).toFixed(3));
    frame.style.setProperty('--film-haze', (.14 + warmth * .47).toFixed(3));
    frame.style.setProperty('--film-sweep', `${(-32 + Math.min(1, p) * 57).toFixed(1)}%`);
    art.element.setAttribute('opacity', (1 - street).toFixed(3));
    art.render({ symbols, serpent, light: warmth, progress: p });
    props.render(atDeck ? 'dj' : dancing ? 'breaking' : '', atDeck ? dj : breaking);
    if (p >= .82 && p < breakStart) macros.prepareVoice();
    macros.render(['stylus', 'voice', 'pigment'].includes(name) ? name : '', local, activeAudio === 'rap' ? voice : undefined);
    const railBeat = name === 'refill' ? 'shake' : name === 'dog' ? 'dog' :
      name === 'railpose' || name === 'glass' ? 'pose' : '';
    const finalPose = finale.render(
      writing ? 'writer' : postDance ? 'kungfu' : '',
      writing ? state.writer : kungfu,
      { beat: railBeat, local: name === 'glass' ? 1 : local, sentry: p >= resumeStart },
    );
    glass.render(name === 'glass' ? local : -1);
    can.render(0);

    if (p < .55) {
      actor.render({ entrance, progress: p });
      mic.render();
      return;
    }
    let pose;
    if (p < .635) {
      pose = sampleLegendMicSpeech(speech, scroll && activeAudio === 'truth' && voice > 0 ? voice : undefined);
      if (scroll && p >= .62 && activeAudio !== 'truth') {
        pose = sampleLegendMicStow(ease(.62, .635, p));
      }
    } else if (atDeck) {
      pose = sampleLegendDj(dj);
    } else if (atMic) {
      pose = sampleLegendMc(activeAudio === 'rap' && voice > 0 ? mix(.567, .923, voice) : mc,
        activeAudio === 'rap' && voice > 0 ? voice : undefined);
    } else if (!postDance) {
      pose = sampleWeightedBreak(breaking);
      can.render(pose.can ?? 0, pose);
    } else {
      pose = finalPose;
    }
    actor.pose(pose);
    if (dancing || name === 'pigment' || postDance) mic.hide();
    else mic.render(pose.mic, pose);
  }

  function pauseFilm() {
    playhead = previousTime = null;
    if (['writer', 'refill', 'dog'].includes(activeAudio)) {
      stopAudio();
      heard = null;
    }
    transport.setAttribute('aria-pressed', 'false');
    transport.setAttribute('aria-label', copy.play);
  }

  function seekTo(progress, bounds = layout()) {
    window.scrollTo({ top: window.scrollY + bounds.trackTop - bounds.stickyTop + clamp(progress) * bounds.travel, behavior: 'instant' });
    schedule();
  }

  const companionHasAudio = () => root.hasAttribute('data-alchymista-audio') &&
    !root.hasAttribute('data-alchymista-film-beat');

  function update(time) {
    raf = null;
    if (sleeping || doc.hidden) return;
    const bounds = layout();
    const { inView, past } = bounds;
    const flow = track.dataset.filmFlow;
    let progress = bounds.p;
    if (playhead !== null) {
      if (flow !== 'scroll' || !inView) pauseFilm();
      else {
        const { shot } = sampleLegendTimeline(playhead);
        const cut = cuts[shot];
        const delta = previousTime === null ? 0 : Math.min(100, time - previousTime) / 1000;
        previousTime = time;
        const span = (cuts[shot + 1]?.start ?? end) - cut.start;
        progress = Math.min(1, playhead + delta * span / (cut.seconds * end));
        playhead = progress;
        seekTo(progress, bounds);
        if (progress === 1) pauseFilm();
      }
    }
    const state = sampleLegendTimeline(progress);
    const { p, name, shot, local } = state;
    const inPlayback = playhead !== null;
    const playingWriter = inPlayback && p >= writerStart && p < writerEnd && name !== 'refill' && name !== 'dog';
    const audioScene = playingWriter ? 'writer' : inPlayback && (name === 'refill' || name === 'dog') ? name :
      name === 'quote' ? 'truth' : name === 'voice' ? 'rap' : name === 'scratch' ? 'scratch' : null;
    const audibleInView = audible && inView && !companionHasAudio();
    const cutSeconds = cuts[shot].seconds;
    const offset = playingWriter ? state.writer * writerSeconds :
      inPlayback && ['refill', 'dog', 'rap'].includes(audioScene) ? local * cutSeconds : 0;
    const expected = audioScene === 'writer' ? state.writer : local;
    const timed = ['writer', 'refill', 'dog'].includes(audioScene);
    if (activeAudio && (!audibleInView || (activeAudio !== audioScene && !(activeAudio === 'rap' && name === 'mc')))) stopAudio();
    if (timed && activeAudio === audioScene && Math.abs(audio.progress() - expected) * (playingWriter ? writerSeconds : cutSeconds) > .2) {
      stopAudio();
      heard = null;
    }
    if (heard && !audioScene && !activeAudio) heard = null;
    if (flow === 'scroll' && audioScene && audibleInView && !activeAudio && heard !== audioScene) {
      play(audioScene, false, offset);
    }
    if (flow === 'scroll' && audibleInView && p > lastProgress && p - lastProgress < .085) {
      const ticks = [.458, .48, .501, .526, .574, .583, .945, .965];
      if (ticks.some(tick => lastProgress < tick && p >= tick)) audio.tap(p < .55 ? 90 : 215);
      const touches = name === 'stylus' ? [stylusContactProgress] : name === 'pigment' ? [.25, .41, .57, .73, .89] : [];
      const previousLocal = range(cuts[shot].start, cuts[shot + 1]?.start ?? end, lastProgress);
      if (touches.some(t => previousLocal < t && local >= t)) audio.contact(name === 'pigment');
    }
    render(state, time / 1000, activeAudio ? audio.progress() : 0, inView);
    if (flow === 'scroll' && lastNeedleProgress < needleDrop && p >= needleDrop) {
      window.dispatchEvent(new window.Event('alchymista:needle-drop'));
    }
    lastNeedleProgress = p;
    const showCompanion = past && flow === 'scroll';
    companion.element.toggleAttribute('hidden', !showCompanion);
    if (showCompanion) {
      const drift = Math.sin(window.scrollY / 250);
      const wave = Math.max(0, drift) ** 4;
      companion.pose({
        head: drift * 8, torso: drift * 2,
        nearHand: [-61 - wave * 47, 13 - wave * 98],
        nearOpen: wave,
      });
      companionMic.render();
    }
    if (playhead !== null || activeAudio || (inView && p < .138 && flow === 'scroll')) schedule();
  }

  function stopAudio() {
    activeAudio = null;
    track.removeAttribute('data-film-audio');
    audio.stop();
  }

  function play(id, direct = false, offset = 0) {
    if (!id || companionHasAudio()) return;
    if (audio.play(id, direct, () => {
      activeAudio = null;
      track.removeAttribute('data-film-audio');
      schedule();
    }, offset)) {
      activeAudio = heard = id;
      track.dataset.filmAudio = id;
      schedule();
    }
  }

  function schedule() {
    if (raf === null && !sleeping && !doc.hidden) raf = requestAnimationFrame(update);
  }

  function armFilmSound(progress = layout().p) {
    audible = true;
    audio.unlock(schedule);
    if (track.dataset.filmFlow !== 'scroll') return;
    window.dispatchEvent(new window.Event('alchymista:needle-arm'));
    if (progress * end >= needleDrop) window.dispatchEvent(new window.Event('alchymista:needle-drop'));
  }

  transport.addEventListener('click', () => {
    if (playhead !== null) pauseFilm();
    else {
      const progress = layout().p;
      playhead = progress >= .999 ? 0 : progress;
      previousTime = null;
      armFilmSound(playhead);
      paintControls();
      schedule();
    }
  });
  next.addEventListener('click', () => {
    pauseFilm();
    const bounds = layout();
    const index = Math.min(sampleLegendTimeline(bounds.p).shot + 1, cuts.length - 1);
    seekTo(cuts[index].stop / end, bounds);
  });
  for (const type of ['wheel', 'touchmove', 'pointerdown']) {
    window.addEventListener(type, event => {
      if (playhead !== null && !track.querySelector('.ua-film-controls').contains(event.target)) pauseFilm();
    }, { passive: true });
  }
  window.addEventListener('keydown', event => {
    if (playhead !== null && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) pauseFilm();
  });
  story?.addEventListener('click', event => {
    if (event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    pauseFilm();
    stopAudio();
    window.dispatchEvent(new window.Event('alchymista:needle-mute'));
    doc.getElementById('needle-street')?.focus({ preventScroll: true });
  });
  skip.addEventListener('click', event => {
    if (event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    pauseFilm();
    window.dispatchEvent(new window.Event('alchymista:needle-skip'));
    doc.getElementById('home')?.focus({ preventScroll: true });
  });
  sound.addEventListener('click', () => {
    if (!audible) {
      armFilmSound();
      if (!replay.hidden) {
        const { name, local, shot } = sampleLegendTimeline(layout().p);
        const offset = name === 'voice' && playhead !== null ? local * cuts[shot].seconds : 0;
        play(name === 'quote' ? 'truth' : 'rap', true, offset);
      }
    } else {
      audible = false;
      window.dispatchEvent(new window.Event('alchymista:needle-mute'));
      stopAudio();
      heard = null;
    }
    paintControls();
    schedule();
  });
  captions.addEventListener('click', () => { captioned = !captioned; paintControls(); });
  replay.addEventListener('click', () => {
    audible = true;
    audio.unlock(schedule);
    paintControls();
    play(cuts[scene].name === 'quote' ? 'truth' : 'rap', true);
  });

  const preferences = new MutationObserver(fit);
  preferences.observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-selfmade-motion'] });
  preferences.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
  reduced.addEventListener('change', fit);
  short.addEventListener('change', fit);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('alchymista:audiochange', () => {
    if (companionHasAudio()) stopAudio();
    schedule();
  });
  window.addEventListener('caisik:languagechange', localize);
  window.addEventListener('storage', event => { if (event.key === 'atlas-motion' || event.key === null) fit(); });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) { pauseFilm(); stopAudio(); } else schedule(); });
  window.addEventListener('pagehide', () => {
    sleeping = true;
    pauseFilm();
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    stopAudio();
  });
  window.addEventListener('pageshow', () => { sleeping = false; fit(); });
  sound.hidden = false;
  image.addEventListener('load', schedule, { once: true });
  localize();
  fit();
  if (entry && track.dataset.filmFlow === 'scroll') {
    const openCut = () => requestAnimationFrame(() => {
      if (track.dataset.filmFlow !== 'scroll') return;
      const playing = params.get('play') === '1';
      const start = (playing ? entry.start : entry.stop) / end + .0002;
      seekTo(start);
      if (playing) {
        playhead = start;
        paintControls();
      }
    });
    if (doc.readyState === 'complete') openCut();
    else window.addEventListener('load', openCut, { once: true });
  }
}

function createScore() {
  let context, source, started, duration;
  const buffers = new Map();
  const media = new Audio();
  media.preload = 'none';
  const stop = () => {
    if (source) {
      source.onended = null;
      source.stop();
      source.disconnect();
      source = null;
    }
    media.onended = null;
    media.pause();
  };
  return {
    unlock(onLoad) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      try {
        context ||= new Context();
        context.resume().then(onLoad).catch(() => {});
        for (const [id, path] of Object.entries(files)) {
          if (buffers.has(id)) continue;
          buffers.set(id, null);
          fetch(path).then(response => {
            if (!response.ok) throw new Error('Audio unavailable');
            return response.arrayBuffer();
          }).then(data => context.decodeAudioData(data)).then(buffer => {
            buffers.set(id, buffer);
            onLoad();
          }).catch(() => buffers.delete(id));
        }
      } catch {}
    },
    play(id, direct, onEnd, offset) {
      const buffer = buffers.get(id);
      if (buffer && context?.state === 'running') {
        stop();
        const playing = context.createBufferSource();
        playing.buffer = buffer;
        playing.connect(context.destination);
        playing.onended = () => {
          if (source === playing) source = null;
          playing.disconnect();
          onEnd();
        };
        source = playing;
        duration = buffer.duration;
        const position = Math.min(offset, Math.max(0, duration - .01));
        started = context.currentTime - position;
        playing.start(0, position);
        return true;
      }
      if (!direct) return false;
      stop();
      media.src = files[id];
      if (offset) media.currentTime = offset;
      media.onended = onEnd;
      media.play().catch(() => { if (media.onended === onEnd) onEnd(); });
      return true;
    },
    progress() {
      if (source) return clamp((context.currentTime - started) / duration);
      return media.duration && !media.paused ? clamp(media.currentTime / media.duration) : 0;
    },
    contact(metal) {
      if (context?.state !== 'running') return;
      const now = context.currentTime;
      const length = metal ? .065 : .021;
      const hit = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
      const wave = hit.getChannelData(0);
      for (let i = 0; i < wave.length; i++) {
        const t = i / context.sampleRate;
        const noise = (Math.random() * 2 - 1) * (metal ? .08 : .14);
        const ring = metal ? .09 * Math.sin(t * 12370) + .05 * Math.sin(t * 19170) : 0;
        wave[i] = (noise + ring) * Math.exp(-t * (metal ? 86 : 270));
      }
      const node = context.createBufferSource();
      node.buffer = hit;
      node.connect(context.destination);
      node.onended = () => node.disconnect();
      node.start(now);
    },
    tap(frequency) {
      if (context?.state !== 'running') return;
      const now = context.currentTime;
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(frequency, now);
      tone.frequency.exponentialRampToValueAtTime(frequency * .47, now + .09);
      gain.gain.setValueAtTime(.03, now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .12);
      tone.connect(gain).connect(context.destination);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
      tone.start(now);
      tone.stop(now + .13);
    },
    stop,
  };
}
