import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMetroAudio } from '../dist/metro-quest-audio.js';

function setup(t, { audible = true, stallFetch = false } = {}) {
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const attributes = new Set();
  doc.documentElement = { hasAttribute: name => attributes.has(name) };
  const win = new EventTarget();
  const frames = new Map();
  const timers = new Map();
  const steps = [];
  const scheduled = [];
  let now = 1000;
  let nextId = 1;
  let finished = 0;
  let resumes = 0;
  let fetches = 0;
  const samples = new Float32Array(1360);
  samples[20] = .15;
  samples[684] = .45;

  win.AudioContext = class {
    state = 'running';
    currentTime = 3;
    destination = {};
    resume() { resumes += 1; return Promise.resolve(); }
    decodeAudioData() {
      return Promise.resolve({ length: 1360, duration: 1.36, sampleRate: 1000, numberOfChannels: 1, getChannelData: () => samples });
    }
    getOutputTimestamp() { return { performanceTime: 1000, contextTime: 3.039 }; }
    createBiquadFilter() { return { frequency: {}, Q: {}, connect: node => node }; }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect: node => node }; }
    createBufferSource() {
      const entry = { stopped: false };
      return {
        connect(filter) { entry.type = filter.type; return filter; },
        start(...args) { entry.args = args; scheduled.push(entry); },
        stop() { entry.stopped = true; },
      };
    }
  };

  const overrides = {
    window: win, document: doc, performance: { now: () => now },
    fetch: async url => {
      fetches += 1;
      assert.equal(url, '/assets/alchemy-prologue/needle-street-bar.mp3');
      if (stallFetch) await new Promise(() => {});
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) };
    },
    requestAnimationFrame(fn) { const id = nextId++; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn) { const id = nextId++; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  for (const [key, value] of Object.entries(overrides)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    });
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
  const audio = createMetroAudio({ soundEnabled: () => audible, onStep: (...event) => steps.push(event), onDone: () => finished++ });
  return {
    audio, steps, scheduled, doc, win, attributes,
    get resumes() { return resumes; },
    get fetches() { return fetches; },
    get finished() { return finished; },
    tick(time) {
      now = time;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(draw => draw(now));
    },
    finishWaiting() { [...timers.values()].forEach(callback => callback()); },
  };
}

test('two transients trim decoded padding, share one clock, and leave rests silent', async t => {
  const clock = setup(t);
  const playing = clock.audio.play(['low', null, 'high']);
  assert.equal(clock.resumes, 1, 'AudioContext resumes inside the gesture');
  await playing;
  assert.deepEqual(clock.scheduled.map(s => [s.type, ...s.args.map(n => +n.toFixed(3))]), [
    ['lowpass', 3.035, .016, .16], ['highpass', 3.695, .680, .16],
  ]);
  clock.tick(1001);
  clock.tick(1331);
  clock.tick(1661);
  clock.tick(1991);
  assert.deepEqual(clock.steps, [[0, 'low'], [1, null], [2, 'high']]);
  assert.equal(clock.finished, 1);
});

test('silent play, guide ownership, and slow decoding keep an immediate or bounded visual fallback', async t => {
  const clock = setup(t, { audible: true, stallFetch: true });
  clock.attributes.add('data-alchymista-audio');
  await clock.audio.play(['low']);
  assert.equal(clock.fetches, 0);
  assert.deepEqual(clock.steps, [[0, 'low']]);
  clock.attributes.clear();
  const pending = clock.audio.play(['high']);
  clock.finishWaiting();
  await pending;
  assert.deepEqual(clock.steps, [[0, 'low'], [0, 'high']]);
  assert.equal(clock.scheduled.length, 0);
  clock.tick(1400);
  assert.equal(clock.finished, 1);
});

test('rapid replacement and leaving the page cancel queued sounds and completion callbacks', async t => {
  const clock = setup(t);
  await clock.audio.play(['low', 'high']);
  await clock.audio.play(['high']);
  assert.deepEqual(clock.scheduled.map(voice => voice.stopped), [true, true, false]);
  clock.win.dispatchEvent(new Event('pagehide'));
  assert.equal(clock.scheduled[2].stopped, true);
  clock.tick(3000);
  assert.equal(clock.finished, 0);
});
