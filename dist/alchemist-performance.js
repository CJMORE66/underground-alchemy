import { createAlchemistRig } from './alchemist-performance-rig.js?v=1';

const modes = {
  breath: { duration: 8000, still: .25, href: '#principles', steps: [.35, .58] },
  rhythm: { duration: 4000, still: .22, href: '#frequency', steps: [.25, .5, .75] },
  lettering: { duration: 6000, still: .92, href: '#living-wall', steps: [.10, .83] },
};
const chapters = {
  principles: 'breath',
  frequency: 'rhythm',
  'living-wall': 'lettering',
};

const words = {
  cs: {
    entry: 'Sleduj alchymistu', kicker: 'CAISIK / DÍLNA POHYBU', title: 'Z klidu do tahu.',
    lead: 'Alchymista ti pohyb ukáže. Pak si ho zkus vlastním tempem.',
    choose: 'Vybrat ukázku', pause: 'Pozastavit ukázku', play: 'Přehrát ukázku', still: 'Statická póza',
    breath: ['Dech', 'Nádech a výdech', 'Při nádechu nech dlaně stoupat k hrudi. Při výdechu je nech pomalu klesnout. Zvol si vlastní tempo.', 'Přejít k principům →', ['NÁDECH', 'KLID', 'VÝDECH']],
    rhythm: ['Rytmus', 'Čtyři doby', 'Střídej levou a pravou ruku. Zkus čtyři rovnoměrné údery o stůl a poslední zvýrazni.', 'Přejít k rytmu →', ['DOBA 1', 'DOBA 2', 'DOBA 3', 'DOBA 4']],
    lettering: ['Tah', 'Jeden souvislý tah', 'Sleduj hrot. Začni zlehka, v rozích zpomal a na konci zvedni ruku.', 'Přejít ke kresbě →', ['PŘILOŽ HROT', 'VEĎ TAH', 'ZVEDNI HROT']],
  },
  en: {
    entry: 'Watch the alchemist', kicker: 'CAISIK / MOVEMENT STUDIO', title: 'From stillness to stroke.',
    lead: 'Watch the alchemist demonstrate each movement. Then try it at your own pace.',
    choose: 'Choose a demonstration', pause: 'Pause demonstration', play: 'Play demonstration', still: 'Still pose',
    breath: ['Breath', 'Breathe in and out', 'Let your palms rise toward your chest as you breathe in. Let them lower slowly as you breathe out. Go at your own pace.', 'Explore the principles →', ['BREATHE IN', 'STILLNESS', 'BREATHE OUT']],
    rhythm: ['Rhythm', 'Four beats', 'Alternate left and right hands. Try four evenly spaced taps on a table and put the accent on the last one.', 'Explore rhythm →', ['BEAT 1', 'BEAT 2', 'BEAT 3', 'BEAT 4']],
    lettering: ['Stroke', 'One continuous stroke', 'Follow the tip. Start lightly, slow down at the corners and lift your hand at the end.', 'Explore lettering →', ['SET THE TIP', 'DRAW THE LINE', 'LIFT THE TIP']],
  },
  fr: {
    entry: 'Observe l’alchimiste', kicker: 'CAISIK / ATELIER DU MOUVEMENT', title: 'Du calme au trait.',
    lead: 'Observe les gestes de l’alchimiste. Puis essaie-les à ton rythme.',
    choose: 'Choisir une démonstration', pause: 'Mettre en pause', play: 'Lire la démonstration', still: 'Pose fixe',
    breath: ['Souffle', 'Inspirer et expirer', 'Laisse tes paumes monter vers ta poitrine à l’inspiration. À l’expiration, laisse-les redescendre lentement. Va à ton rythme.', 'Explorer les principes →', ['INSPIRER', 'CALME', 'EXPIRER']],
    rhythm: ['Rythme', 'Quatre temps', 'Alterne la main gauche et la main droite. Tape quatre fois sur une table à intervalles réguliers et accentue le dernier temps.', 'Explorer le rythme →', ['TEMPS 1', 'TEMPS 2', 'TEMPS 3', 'TEMPS 4']],
    lettering: ['Trait', 'Un trait continu', 'Suis la pointe. Commence en douceur, ralentis dans les angles et lève la main à la fin.', 'Explorer le lettrage →', ['POSER LA POINTE', 'TRACER LA LIGNE', 'LEVER LA POINTE']],
  },
};

const doc = document;
const root = doc.documentElement;
const main = doc.getElementById('alchemist-practice');
if (main) start();

function start() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [];
  const canTrack = typeof IntersectionObserver === 'function';
  const controls = main.querySelector('.ua-performance-modes');
  const transport = main.querySelector('.ua-performance-transport');
  const lesson = main.querySelector('[data-performance-lesson]');
  const steps = main.querySelector('[data-performance-step]');
  const entry = doc.querySelector('[data-performance-entry]');
  const buttons = [...controls.querySelectorAll('button')];
  const mainScene = addScene(main.querySelector('[data-performance-stage]'), main.querySelector('[data-performance-play]'), 'breath');
  let copy = words[root.lang] || words.cs;
  let frame = null;
  let last = null;
  let sleeping = false;
  let savedPause = readPause();
  let lastAllowed;
  let canAdvance = false;
  const cleanups = [];

  function readPause() {
    try {
      const value = localStorage.getItem('atlas-motion');
      return value === '"off"' || value === 'off';
    } catch { return false; }
  }

  function listen(target, event, handler) {
    target.addEventListener(event, handler);
    cleanups.push(() => target.removeEventListener(event, handler));
  }

  function addScene(stage, button, mode) {
    const scene = { stage, button, mode, rig: null, elapsed: 0, inView: false, playing: true };
    scenes.push(scene);
    return scene;
  }

  function render(scene, phase) {
    if (!scene.rig) return;
    scene.rig.render(scene.mode, phase);
    if (scene !== mainScene) return;
    const current = modes[scene.mode];
    const index = current.steps.filter(boundary => phase >= boundary).length;
    const next = copy[scene.mode][4][index];
    if (next !== steps.textContent) steps.textContent = next;
    main.style.setProperty('--ua-performance-progress', String(phase));
  }

  function mount(scene) {
    if (scene.rig) return;
    scene.rig = createAlchemistRig(doc);
    scene.stage.append(scene.rig.element);
    scene.stage.classList.add('ua-performance-ready');
    const bridge = scene.stage.closest('[data-journey-bridge]');
    if (bridge) bridge.setAttribute('data-performance-bridge', '');
    render(scene, modes[scene.mode].still);
  }

  function allowed() {
    return canTrack && !savedPause && !reduced.matches && root.dataset.motion !== 'off' &&
      !['off', 'quiet', 'calm', 'reduced'].includes(root.dataset.selfmadeMotion) &&
      !doc.body.classList.contains('simple-mode') && !doc.body.classList.contains('exp-field') &&
      !doc.querySelector('.culture-board.cb-field');
  }

  function visible() {
    return !sleeping && !doc.hidden && !doc.querySelector('dialog[open]');
  }

  function updateControl(scene, canAnimate) {
    if (scene.button.disabled === canAnimate) scene.button.disabled = !canAnimate;
    const label = !canAnimate ? copy.still : scene.playing ? copy.pause : copy.play;
    if (scene.button.textContent !== label) scene.button.textContent = label;
  }

  function halt() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    last = null;
  }

  function synchronize() {
    const canAnimate = allowed();
    if (lastAllowed !== canAnimate) {
      lastAllowed = canAnimate;
      for (const scene of scenes) {
        const { duration, still } = modes[scene.mode];
        render(scene, canAnimate ? scene.elapsed / duration : still);
      }
      if (!canAnimate) steps.textContent = copy.still;
    }
    for (const scene of scenes) updateControl(scene, canAnimate);
    canAdvance = canAnimate && visible() && scenes.some(scene => scene.inView && scene.playing);
    if (!canAdvance) {
      halt();
    } else if (frame === null) {
      frame = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    frame = null;
    if (!canAdvance || doc.hidden) {
      halt();
      return;
    }
    const delta = last === null ? 0 : Math.min(now - last, 80);
    last = now;
    for (const scene of scenes) {
      if (!scene.inView || !scene.playing) continue;
      const { duration } = modes[scene.mode];
      scene.elapsed = (scene.elapsed + delta) % duration;
      render(scene, scene.elapsed / duration);
    }
    frame = requestAnimationFrame(tick);
  }

  function modeCopy() {
    const [, title, notes, link] = copy[mainScene.mode];
    main.querySelector('[data-performance-name]').textContent = title;
    main.querySelector('[data-performance-notes]').textContent = notes;
    lesson.textContent = link;
    lesson.href = modes[mainScene.mode].href;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.performanceMode === mainScene.mode));
    }
  }

  function localize() {
    copy = words[window.CaisikI18n?.getLanguage?.() || root.lang] || words.cs;
    if (entry?.firstChild) entry.firstChild.nodeValue = copy.entry + ' ';
    main.querySelector('[data-performance-kicker]').textContent = copy.kicker;
    main.querySelector('h2').textContent = copy.title;
    main.querySelector('[data-performance-lead]').textContent = copy.lead;
    controls.setAttribute('aria-label', copy.choose);
    for (const button of buttons) {
      button.querySelector('[data-mode-name]').textContent = copy[button.dataset.performanceMode][0];
    }
    modeCopy();
    if (allowed()) render(mainScene, mainScene.elapsed / modes[mainScene.mode].duration);
    else steps.textContent = copy.still;
    synchronize();
  }

  for (const [chapter, mode] of Object.entries(chapters)) {
    const bridge = doc.querySelector(`[data-journey-bridge="${chapter}"]`);
    const visual = bridge?.querySelector('.journey-bridge-visual');
    const text = bridge?.querySelector('.journey-bridge-copy');
    if (!visual || !text) continue;
    const stage = doc.createElement('div');
    stage.className = 'ua-performance-bridge-stage';
    stage.setAttribute('aria-hidden', 'true');
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'ua-performance-button ua-performance-bridge-button';
    button.setAttribute('data-i18n', 'off');
    button.setAttribute('data-text-motion', 'off');
    visual.append(stage);
    text.append(button);
    addScene(stage, button, mode);
  }

  for (const scene of scenes) {
    listen(scene.button, 'click', () => {
      scene.playing = !scene.playing;
      synchronize();
    });
  }
  for (const button of buttons) {
    listen(button, 'click', () => {
      const mode = button.dataset.performanceMode;
      if (mode === mainScene.mode) return;
      mainScene.mode = mode;
      mainScene.elapsed = 0;
      modeCopy();
      render(mainScene, allowed() && mainScene.playing ? 0 : modes[mode].still);
      if (!allowed()) steps.textContent = copy.still;
      synchronize();
    });
  }

  mount(mainScene);
  controls.hidden = false;
  transport.hidden = false;

  let observer;
  if (canTrack) {
    const byStage = new Map(scenes.map(scene => [scene.stage, scene]));
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const scene = byStage.get(entry.target);
        scene.inView = entry.isIntersecting;
        if (scene.inView) mount(scene);
      }
      synchronize();
    }, { threshold: .12 });
    for (const scene of scenes) observer.observe(scene.stage);
  } else {
    // Still demonstrations work on browsers without intersection tracking.
    for (const scene of scenes) mount(scene);
  }

  const preference = new MutationObserver(records => {
    if (records.some(record => record.attributeName === 'data-motion')) savedPause = readPause();
    synchronize();
  });
  preference.observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-selfmade-motion'] });
  preference.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
  // Dialogs and field mode can be mounted after this panel.
  const layers = new MutationObserver(records => {
    if (records.some(record => record.target.matches('dialog, .culture-board'))) synchronize();
  });
  layers.observe(doc.body, { attributes: true, subtree: true, attributeFilter: ['open', 'class'] });
  listen(doc, 'visibilitychange', synchronize);
  listen(doc, 'toggle', synchronize);
  listen(reduced, 'change', synchronize);
  listen(window, 'caisik:languagechange', localize);
  listen(window, 'storage', event => {
    if (event.key === 'atlas-motion' || event.key === null) {
      savedPause = readPause();
      synchronize();
    }
  });
  listen(window, 'pagehide', event => {
    sleeping = true;
    halt();
    if (!event.persisted) {
      observer?.disconnect();
      preference.disconnect();
      layers.disconnect();
      for (const cleanup of cleanups) cleanup();
    }
  });
  listen(window, 'pageshow', () => {
    sleeping = false;
    synchronize();
  });
  localize();
}
