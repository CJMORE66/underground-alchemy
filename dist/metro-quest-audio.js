const beatUrl = '/assets/alchemy-prologue/needle-street-bar.mp3';
const samplePreroll = .004;
const maximumAudioWait = 550;
const hits = {
  low: { range: [0, .12], threshold: .04, filter: 'lowpass', frequency: 420, gain: .34 },
  high: { range: [.63, .76], threshold: .04, filter: 'highpass', frequency: 720, gain: .5 },
};

function findAttack(buffer, name) {
  const hit = hits[name];
  const from = Math.max(1, Math.floor(hit.range[0] * buffer.sampleRate));
  let attack = Math.min(buffer.length, Math.floor(hit.range[1] * buffer.sampleRate));
  const searchLimit = attack;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = from; i < attack; i++) {
      const value = name === 'high' ? samples[i] - samples[i - 1] : samples[i];
      if (Math.abs(value) >= hit.threshold) {
        attack = i;
        break;
      }
    }
  }
  const start = attack < searchLimit ? attack / buffer.sampleRate : (name === 'high' ? .68 : 0);
  return Math.max(0, start - samplePreroll);
}

export function createMetroAudio({ soundEnabled, onStep, onDone }) {
  let context;
  let samples;
  let current;

  function cancelSources(playback) {
    for (const source of playback.sources) source.stop();
    playback.sources.clear();
  }

  function stop() {
    if (!current) return;
    const previous = current;
    current = undefined;
    previous.cancelWait?.();
    cancelAnimationFrame(previous.frame);
    cancelSources(previous);
  }

  async function prepareSamples() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    context ??= new Audio();
    // Resume inside the player gesture even when the first asset is still loading.
    const resumed = context.resume();
    samples ??= fetch(beatUrl)
      .then(response => {
        if (!response.ok) throw new Error('Beat sample unavailable');
        return response.arrayBuffer();
      })
      .then(bytes => context.decodeAudioData(bytes))
      .then(buffer => ({ buffer, low: findAttack(buffer, 'low'), high: findAttack(buffer, 'high') }))
      .catch(() => { samples = undefined; });
    const [, clips] = await Promise.all([resumed, samples]);
    return clips;
  }

  function waitForSamples(playback) {
    const deadline = new Promise(resolve => {
      const timer = setTimeout(resolve, maximumAudioWait);
      playback.cancelWait = () => {
        clearTimeout(timer);
        resolve();
      };
    });
    return Promise.race([prepareSamples(), deadline]).finally(() => playback.cancelWait());
  }

  function scheduleHit(playback, clips, note, when, interval) {
    const offset = clips[note];
    const length = Math.min(.16, interval, clips.buffer.duration - offset);
    if (length <= 0) return;
    const hit = hits[note];
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const volume = context.createGain();
    const fadeIn = Math.min(.006, length / 4);
    const fadeOut = Math.min(.024, length / 3);
    source.buffer = clips.buffer;
    filter.type = hit.filter;
    filter.frequency.value = hit.frequency;
    filter.Q.value = -3; // Low-pass and high-pass resonance in dB.
    source.connect(filter).connect(volume).connect(context.destination);
    volume.gain.setValueAtTime(0, when);
    volume.gain.linearRampToValueAtTime(hit.gain, when + fadeIn);
    volume.gain.setValueAtTime(hit.gain, when + length - fadeOut);
    volume.gain.linearRampToValueAtTime(0, when + length);
    source.onended = () => playback.sources.delete(source);
    source.start(when, offset, length);
    playback.sources.add(source);
  }

  function guideOwnsSound() {
    const root = document.documentElement;
    return root.hasAttribute('data-alchymista-audio') && !root.hasAttribute('data-alchymista-film-beat');
  }

  function readAudioClock(now) {
    const timestamp = context.getOutputTimestamp?.();
    if (timestamp?.performanceTime > 0) {
      return timestamp.contextTime + (now - timestamp.performanceTime) / 1000;
    }
    return context.currentTime;
  }

  async function play(sequence, stepMs = 330) {
    stop();
    if (!sequence.length || !Number.isFinite(stepMs) || stepMs <= 0 || document.hidden) return;
    const phrase = [...sequence];
    const interval = stepMs / 1000;
    const playback = { frame: 0, sources: new Set() };
    current = playback;
    let audioStart;
    if (soundEnabled() && !guideOwnsSound()) {
      try {
        const clips = await waitForSamples(playback);
        if (clips && context.state === 'running' && current === playback && soundEnabled() && !guideOwnsSound() && !document.hidden) {
          if (document.documentElement.hasAttribute('data-alchymista-film-beat')) {
            window.dispatchEvent(new Event('alchymista:needle-mute'));
          }
          const start = context.currentTime + .035;
          phrase.forEach((note, index) => {
            if (note === 'low' || note === 'high') scheduleHit(playback, clips, note, start + index * interval, interval);
          });
          audioStart = start + samplePreroll;
        }
      } catch {
        cancelSources(playback);
      }
    }
    if (current !== playback || document.hidden) return;
    let visualStart = performance.now() / 1000;
    let elapsed = 0;
    let previousStep = -1;

    function draw(now) {
      if (document.hidden) { stop(); return; }
      if ((!soundEnabled() || guideOwnsSound()) && playback.sources.size) cancelSources(playback);
      if (audioStart !== undefined && context.state !== 'running') {
        cancelSources(playback);
        visualStart = now / 1000 - Math.max(0, elapsed);
        audioStart = undefined;
      }
      elapsed = audioStart === undefined ? now / 1000 - visualStart : readAudioClock(now) - audioStart;
      const step = Math.floor(elapsed / interval);
      while (previousStep < Math.min(step, phrase.length - 1) && current === playback) {
        previousStep += 1;
        onStep(previousStep, phrase[previousStep]);
      }
      if (current !== playback) return;
      if (step >= phrase.length) {
        stop();
        onDone();
      } else {
        playback.frame = requestAnimationFrame(draw);
      }
    }
    if (audioStart === undefined) draw(visualStart * 1000);
    else playback.frame = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  return { play, stop };
}
