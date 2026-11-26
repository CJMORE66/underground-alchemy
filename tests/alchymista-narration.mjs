import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createNarration, narrationSources } from '../dist/alchymista/narration.js';
import { scenes } from '../dist/alchymista/story.js';

class FakeAudio extends EventTarget {
  dataset = {};
  attributes = new Map();
  paused = true;
  removed = false;
  plays = 0;
  pending = Promise.resolve();
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { if (name === 'src') this.src = ''; this.attributes.delete(name); }
  play() { this.plays++; this.paused = false; this.dispatchEvent(new Event('playing')); return this.pending; }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  load() { this.loaded = true; }
  remove() { this.removed = true; }
}

function fixture(factory = () => new FakeAudio()) {
  const audios = [], states = [];
  const narration = createNarration({
    container: { append: audio => audios.push(audio) },
    createAudio: factory,
    onState: state => states.push(state),
  });
  return { narration, audios, states };
}

test('all scene cues have actual, declared MP3 clips without model instructions', () => {
  const manifest = JSON.parse(readFileSync(new URL('../dist/assets/alchymista-voice/manifest.json', import.meta.url)));
  assert.equal(manifest.aiGenerated, true);
  assert.equal(manifest.language, 'cs');
  assert.deepEqual(Object.keys(narrationSources).sort(), Object.keys(scenes).sort());
  assert.equal(manifest.clips.length, Object.keys(scenes).length);
  for (const clip of manifest.clips) {
    const expected = scenes[clip.scene][2].replaceAll(' / ', '. ');
    assert.equal(clip.text, expected);
    const bytes = readFileSync(new URL('../dist' + narrationSources[clip.scene], import.meta.url));
    assert.equal(bytes.length, clip.bytes);
    assert.ok(bytes.length > 1000);
    assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 0xff);
  }
});

test('nothing loads before explicit play and unknown scene IDs cannot select external audio', async () => {
  const f = fixture();
  assert.equal(f.audios.length, 0);
  assert.equal(f.narration.active, false);
  assert.equal(await f.narration.play('https://other.test/audio'), false);
  assert.equal(await f.narration.play('__proto__'), false);
  assert.equal(f.audios.length, 0);
  assert.equal(await f.narration.play('home'), true);
  assert.equal(f.audios[0].src, narrationSources.home);
  assert.equal(f.audios[0].preload, 'none');
  assert.equal(f.audios[0].controls, true);
  assert.equal(f.narration.scene, 'home');
});

test('stop cancels pending playback and a stale rejection cannot change a newer clip', async () => {
  let rejectFirst;
  const originalFactory = new FakeAudio();
  originalFactory.pending = new Promise((resolve, reject) => { rejectFirst = reject; });
  const audios = [], states = [];
  let first = true;
  const narration = createNarration({ container: { append: audio => audios.push(audio) }, onState: state => states.push(state), createAudio: () => first ? (first = false, originalFactory) : new FakeAudio() });
  const pending = narration.play('home');
  narration.stop();
  assert.equal(audios[0].paused, true);
  assert.equal(audios[0].src, '');
  assert.equal(audios[0].removed, true);
  await narration.play('manifesto');
  const count = states.length;
  rejectFirst(new Error('cancelled'));
  assert.equal(await pending, false);
  audios[0].dispatchEvent(new Event('error'));
  audios[0].dispatchEvent(new Event('ended'));
  assert.equal(states.length, count);
  assert.equal(narration.scene, 'manifesto');
  assert.equal(narration.active, true);
  narration.stop();
});

test('native pause/resume, ended and failed media report real state and release resources', async () => {
  const f = fixture();
  await f.narration.play('home');
  const audio = f.audios[0];
  audio.pause();
  assert.equal(f.states.at(-1).state, 'paused');
  assert.equal(f.narration.active, true);
  await audio.play();
  assert.equal(f.states.at(-1).state, 'playing');
  audio.ended = true;
  audio.dispatchEvent(new Event('ended'));
  assert.equal(f.states.at(-1).state, 'ended');
  assert.equal(f.narration.active, false);
  assert.equal(audio.removed, true);
  await f.narration.play('frequency');
  f.audios[1].dispatchEvent(new Event('error'));
  assert.equal(f.states.at(-1).state, 'error');
  assert.equal(f.narration.active, false);
});
