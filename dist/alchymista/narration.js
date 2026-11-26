import { scenes } from './story.js';

// Fixed, published AI narration. Playback never opens a microphone or calls an API.
export const narrationSources = Object.fromEntries(
  Object.keys(scenes).map(id => [id, '/assets/alchymista-voice/' + id + '-v1.mp3']),
);

export function createNarration({ container, onState = () => {}, createAudio = () => new Audio() }) {
  let session;

  function notify(state, active = session) {
    onState({ state, scene: active?.scene, active: Boolean(session) });
  }

  function stop(state = 'idle') {
    const active = session;
    if (!active) return;
    session = undefined;
    active.audio.pause();
    active.audio.removeAttribute('src');
    active.audio.load();
    active.audio.remove();
    notify(state, active);
  }

  async function play(scene) {
    const src = Object.hasOwn(narrationSources, scene) && narrationSources[scene];
    if (!src) return false;
    stop();
    const audio = createAudio();
    audio.preload = 'none';
    audio.controls = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('aria-label', 'Namluvená stopa Alchymisty');
    audio.dataset.alchymistaNarration = '';
    const active = { audio, scene };
    session = active;
    audio.addEventListener('playing', () => {
      if (session === active) notify('playing');
    });
    audio.addEventListener('pause', () => {
      if (session === active && !audio.ended) notify('paused');
    });
    audio.addEventListener('ended', () => { if (session === active) stop('ended'); });
    audio.addEventListener('error', () => { if (session === active) stop('error'); });
    container.append(audio);
    audio.src = src;
    notify('loading');
    try {
      await audio.play();
      return session === active;
    } catch {
      if (session === active) stop('error');
      return false;
    }
  }

  return { play, stop, get active() { return Boolean(session); }, get playing() { return Boolean(session && !session.audio.paused); }, get scene() { return session?.scene; } };
}
