const assetDirectory = '/assets/alchymista-beats/';

export const tracks = [
  ['boom-bap-cypher', 'Boom Bap Cypher'],
  ['concrete-midnight', 'Concrete Midnight'],
  ['kung-fu-mystic', 'Kung-Fu Mystic'],
  ['midnight-concrete', 'Midnight Concrete'],
  ['urban-noir', 'Urban Noir'],
  ['dilino', 'dilino'],
].map(([id, title]) => ({ id, title, src: assetDirectory + id + '.mp3' }));

export function createBeat({ onError = () => {} } = {}) {
  let selected = tracks[0].id;
  let session;
  let ducked = false;

  function volume() { return ducked ? 0.13 : 0.34; }

  function setVolume(active) {
    if (active.gain) {
      active.gain.gain.setTargetAtTime(active.primed ? 0 : volume(), active.context.currentTime, 0.04);
    } else active.audio.volume = active.primed ? 0 : volume();
  }

  function stop() {
    const active = session;
    if (!active) return;
    session = undefined;
    active.audio.pause();
    active.audio.removeAttribute('src');
    active.audio.load();
    active.audio.remove();
    if (active.context) void active.context.close().catch(() => {});
  }

  async function play(active, track) {
    const attempt = ++active.attempt;
    active.audio.src = track.src;
    active.audio.muted = !!(active.primed && !active.gain);
    try {
      await Promise.all([active.context?.resume(), active.audio.play()]);
      if (active !== session || attempt !== active.attempt) return;
      active.started = true;
      if (active.primed) {
        active.audio.pause();
        active.audio.currentTime = 0;
      }
    } catch (error) {
      if (active !== session || attempt !== active.attempt) return;
      stop();
      throw error;
    }
  }

  return {
    async start({ prime = false } = {}) {
      if (session) {
        const active = session;
        if (prime || !active.primed) return;
        await active.loading;
        if (active !== session || !active.primed) return;
        active.primed = false;
        active.audio.muted = false;
        setVolume(active);
        try { await active.audio.play(); }
        catch (error) {
          if (active !== session) return;
          stop();
          throw error;
        }
        return;
      }
      const audio = new Audio();
      audio.preload = 'none';
      audio.loop = true;
      audio.hidden = true;
      audio.dataset.alchymistaBeatTrack = '';
      document.body.append(audio);
      const active = { audio, attempt: 0, primed: prime };
      session = active;

      // Web Audio applies the voice mix on browsers with read-only media volume.
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const context = active.context = new AudioContext();
          const gain = active.gain = context.createGain();
          gain.gain.value = prime ? 0 : volume();
          context.createMediaElementSource(audio).connect(gain).connect(context.destination);
        } else setVolume(active);
      } catch (error) {
        stop();
        throw error;
      }
      audio.addEventListener('error', () => {
        if (session !== active || !active.started) return;
        stop();
        onError();
      });
      active.loading = play(active, tracks.find(track => track.id === selected));
      await active.loading;
    },
    stop,
    async select(id) {
      const track = tracks.find(item => item.id === id);
      if (!track || selected === id) return;
      selected = id;
      if (session) {
        session.started = false;
        session.loading = play(session, track);
        await session.loading;
      }
    },
    duck(active) {
      ducked = Boolean(active);
      if (session) setVolume(session);
    },
    get selected() { return selected; },
    get playing() { return Boolean(session && !session.primed && !session.audio.paused); },
  };
}
