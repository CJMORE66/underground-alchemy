import { createBeat, tracks } from './beat.js?v=2';
import { greeting, scenes } from './story.js';
import { createNarration } from './narration.js?v=1';

const endpoint = '/api/alchymista/live';
const startButtons = [...document.querySelectorAll('[data-live-start]')];
const panel = document.querySelector('[data-live-panel]');
const launcher = document.querySelector('[data-live-open]');
const status = panel.querySelector('[data-live-status]');
const mute = panel.querySelector('[data-live-mute]');
const end = panel.querySelector('[data-live-end]');
const turn = panel.querySelector('[data-live-turn]');
const beatButton = panel.querySelector('[data-live-beat]');
const signIn = panel.querySelector('[data-live-sign-in]');
const sceneLabel = panel.querySelector('[data-live-scene]');
const audio = panel.querySelector('[data-live-audio]');
const narrationButton = panel.querySelector('[data-narration-play]');
const narration = createNarration({ container: panel.querySelector('[data-narration-player]'), onState: ({ state, active }) => {
  narrationButton.setAttribute('aria-pressed', String(active));
  narrationButton.textContent = active ? 'Zastavit namluvený hlas' : 'Přehrát hlas Alchymisty';
  beat.duck(state === 'playing');
  end.disabled = !active && !connection && !beat.playing;
  setSound(state === 'playing' || Boolean(connection?.ready) || beat.playing);
  if (connection) return;
  setState('idle');
  const messages = {
    loading: 'Načítám namluvenou stopu…',
    playing: 'Alchymista mluví. Mikrofon je vypnutý.',
    paused: 'Namluvená stopa je pozastavená.',
    ended: 'Teď je řada na tobě. Stopu můžeš přehrát znovu.',
    error: 'Stopu se nepodařilo přehrát. Zkus ji spustit znovu.',
    idle: 'Namluvený hlas je vypnutý.',
  };
  announce(messages[state]);
} });
const beat = createBeat({ onError: () => {
  stopBeat();
  if (!connection?.ready) setSound(narration.playing);
  end.disabled = !connection && !narration.active;
  announce('Přehrávání beatu se přerušilo. Zkus jiný track.');
} });
const cue = panel.querySelector('[data-live-cue]');
const trackSelect = panel.querySelector('[data-live-track]');
for (const track of tracks) {
  trackSelect.add(new Option(track.title, track.id));
}
trackSelect.value = beat.selected;
trackSelect.addEventListener('change', async () => {
  try { await beat.select(trackSelect.value); }
  catch {
    stopBeat();
    if (!connection?.ready) setSound(narration.playing);
    end.disabled = !connection && !narration.active;
    announce('Tenhle beat se nepodařilo přehrát. Vyber další.');
  }
});

let connection;
let scene = document.querySelector('[data-film-prologue]') ? 'alchemy-prologue' : 'alchymista-entry';
let scrollTimer;
let needleArmed = false;
let filmBeat = false;

function announce(message) { status.textContent = message; }
function setState(state) {
  panel.dataset.liveState = state;
  const labels = {
    connecting: 'ALCHYMISTA · PŘIPOJUJI',
    connected: 'ALCHYMISTA · MIKROFON ZAPNUTÝ',
    muted: 'ALCHYMISTA · MIKROFON ZTIŠENÝ',
  };
  launcher.textContent = labels[state] || 'ALCHYMISTA';
}
function showPanel(visible) {
  if (!visible) narration.stop();
  panel.hidden = !visible;
  launcher.setAttribute('aria-expanded', String(visible));
}
function send(session, type, fields = {}) {
  if (!session.ready || session.events.readyState !== 'open') return false;
  try { session.events.send(JSON.stringify({ type, event_id: crypto.randomUUID(), ...fields })); return true; }
  catch { return false; }
}

function setSound(active) {
  document.documentElement.toggleAttribute('data-alchymista-audio', active);
  document.documentElement.toggleAttribute('data-alchymista-film-beat', active && filmBeat && !connection?.ready);
  window.dispatchEvent(new Event('alchymista:audiochange'));
}

function stopBeat() {
  needleArmed = false;
  filmBeat = false;
  beat.stop();
  beatButton.setAttribute('aria-pressed', 'false');
}

async function startBeat(fromFilm = false) {
  if (beatButton.getAttribute('aria-pressed') === 'true') return;
  beatButton.setAttribute('aria-pressed', 'true');
  filmBeat = fromFilm;
  try {
    await beat.start();
    if (!beat.playing) return;
    setSound(true);
    end.disabled = false;
  } catch {
    stopBeat();
    announce('Beat se nepodařilo spustit.');
  }
}

function dispose(session, message) {
  if (session !== connection) return;
  connection = undefined;
  session.abort.abort();
  clearTimeout(session.timeout);
  clearTimeout(session.deadline);
  clearTimeout(session.duckTimer);
  clearTimeout(session.sceneTimer);
  beat.duck(false);
  session.stream?.getTracks().forEach(track => track.stop());
  session.peer?.close();
  audio.srcObject = null;
  audio.controls = false;
  startButtons.forEach(button => { button.disabled = false; });
  narrationButton.disabled = false;
  mute.disabled = true;
  mute.setAttribute('aria-pressed', 'false');
  mute.textContent = 'Ztišit mikrofon';
  turn.disabled = true;
  end.disabled = beatButton.getAttribute('aria-pressed') !== 'true';
  setSound(!end.disabled);
  setState(session.closing ? 'idle' : 'unavailable');
  announce(message);
}

function stop(message = 'Hlas vypnutý.') {
  const session = connection;
  narration.stop();
  stopBeat();
  if (!session) {
    setState('idle');
    setSound(false);
    end.disabled = true;
    announce(message);
    return;
  }
  session.stream?.getTracks().forEach(track => track.stop());
  audio.pause();
  if (!session.closing && send(session, 'session.close')) {
    clearTimeout(session.deadline);
    session.closing = true;
    setState('idle');
    session.closeMessage = message;
    mute.disabled = true;
    turn.disabled = true;
    end.disabled = true;
    announce(message);
    session.timeout = setTimeout(() => dispose(session, message), 3000);
  } else if (!session.closing) dispose(session, message);
}

function addScene(session) {
  if (session !== connection || session.closing || session.lastScene === scene) return;
  const [title, prompt] = scenes[scene];
  if (send(session, 'session.thinking.append', {
    delegation_id: null, content: 'Návštěvník právě prochází sekcí ' + title + '. Motiv: ' + prompt + ' Použij při příštím tahu.',
  })) session.lastScene = scene;
}

function updateScene() {
  const middle = innerHeight * 0.52;
  const visible = Object.keys(scenes).find(id => {
    const rect = document.getElementById(id)?.getBoundingClientRect();
    return rect && rect.top <= middle && rect.bottom > middle;
  });
  if (visible) scene = visible;
  if (narration.active && narration.scene !== scene) narration.stop();
  sceneLabel.textContent = scenes[scene][0];
  cue.textContent = scenes[scene][2];
  if (connection && !connection.closing) addScene(connection);
}

function gatherIce(peer, signal) {
  if (peer.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      peer.removeEventListener('icegatheringstatechange', check);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const check = () => { if (peer.iceGatheringState === 'complete') finish(); };
    const timer = setTimeout(finish, 3500);
    peer.addEventListener('icegatheringstatechange', check);
    signal.addEventListener('abort', finish, { once: true });
    check();
  });
}

async function start() {
  if (connection) return;
  narration.stop();
  showPanel(true);
  if (!panel.contains(document.activeElement)) launcher.focus({ preventScroll: true });
  signIn.hidden = true;
  updateScene();
  const session = { abort: new AbortController(), ready: false };
  connection = session;
  startButtons.forEach(button => { button.disabled = true; });
  narrationButton.disabled = true;
  end.disabled = false;
  setState('connecting');
  announce('Ověřuji hlasové připojení…');
  try {
    const check = await fetch(endpoint + '/status', { signal: AbortSignal.any([session.abort.signal, AbortSignal.timeout(10_000)]) });
    if (!check.ok) throw new Error();
    const availability = await check.json();
    if (session !== connection) return;
    if (!availability.configured) {
      dispose(session, 'GPT-Live čeká na připojení API. Beat a text jsou dostupné.');
      return;
    }
    if (!availability.signedIn) {
      signIn.href = '/signin-with-chatgpt?return_to=' + encodeURIComponent(location.pathname + location.search + location.hash);
      signIn.hidden = false;
      dispose(session, 'Pro spuštění hlasu se přihlas přes ChatGPT.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      dispose(session, 'Tenhle prohlížeč nemá potřebný přístup k mikrofonu.');
      return;
    }

    announce('Povol mikrofon pro dvojhlas.');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    if (session !== connection) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    session.stream = stream;
    const peer = new RTCPeerConnection();
    session.peer = peer;
    const events = peer.createDataChannel('oai-events');
    session.events = events;
    session.timeout = setTimeout(() => dispose(session, 'Připojení vypršelo. Zkus ho spustit znovu.'), 24_000);
    peer.ontrack = event => {
      if (session !== connection || session.closing) return;
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      audio.play().catch(() => { if (session === connection) audio.controls = true; });
    };
    peer.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(peer.connectionState)) dispose(session, 'Hlasové spojení skončilo.');
    };
    events.onclose = () => dispose(session, 'Hlasové spojení skončilo.');
    events.onmessage = ({ data }) => {
      if (session !== connection) return;
      let event;
      try { event = JSON.parse(data); } catch { return; }
      if (event.type === 'session.output_transcript.delta' && !session.closing) {
        beat.duck(true);
        clearTimeout(session.duckTimer);
        session.duckTimer = setTimeout(() => beat.duck(false), 1250);
      }
      if (event.type === 'session.closed') dispose(session, session.closeMessage || 'Hlasové spojení skončilo.');
      if (event.type !== 'session.started' || session.ready || session.closing) return;
      session.ready = true;
      clearTimeout(session.timeout);
      session.deadline = setTimeout(() => stop('Pětiminutové kolo skončilo.'), 300_000);
      mute.disabled = false;
      turn.disabled = false;
      setState('connected');
      send(session, 'session.commentary.append', {
        event_id: 'alchymista-greeting', delegation_id: null,
        content: greeting,
      });
      announce('GPT-Live připojený. Dej svoje první dva řádky.');
      setSound(true);
      session.sceneTimer = setTimeout(() => addScene(session), 1700);
    };

    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    await peer.setLocalDescription(await peer.createOffer());
    await gatherIce(peer, session.abort.signal);
    if (session !== connection) return;
    const result = await fetch(endpoint + '/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdp: peer.localDescription.sdp }), signal: session.abort.signal,
    });
    if (result.status === 429) {
      dispose(session, 'Denní limit hlasových kol je vyčerpaný. Beat a text zůstávají dostupné.');
      return;
    }
    if (!result.ok) throw new Error();
    const { sdp } = await result.json();
    if (session === connection) await peer.setRemoteDescription({ type: 'answer', sdp });
  } catch (error) {
    const permissionDenied = error.name === 'NotAllowedError';
    dispose(session, permissionDenied ? 'Mikrofon je vypnutý. Beat a text jsou dostupné.' : 'Hlas se nepřipojil. Zkus to znovu nebo pokračuj s beatem.');
  }
}

startButtons.forEach(button => button.addEventListener('click', start));
narrationButton.addEventListener('click', () => {
  if (connection) return;
  if (narration.active) { narration.stop(); return; }
  updateScene();
  signIn.hidden = true;
  void narration.play(scene);
});
document.querySelectorAll('.live-intro, [data-live-show]').forEach(button => button.addEventListener('click', () => {
  showPanel(true);
  updateScene();
  narrationButton.focus({ preventScroll: true });
}));
launcher.addEventListener('click', () => {
  showPanel(panel.hidden);
  updateScene();
});
end.addEventListener('click', () => stop());
mute.addEventListener('click', () => {
  const tracks = connection?.stream?.getAudioTracks();
  if (!tracks?.length) return;
  const muted = tracks[0].enabled;
  tracks.forEach(track => { track.enabled = !muted; });
  mute.setAttribute('aria-pressed', String(muted));
  setState(muted ? 'muted' : 'connected');
  mute.textContent = muted ? 'Zapnout mikrofon' : 'Ztišit mikrofon';
});
turn.addEventListener('click', () => {
  if (connection) send(connection, 'session.commentary.append', {
    delegation_id: null, content: 'Uživatel ti předal mikrofon v sekci ' + scenes[scene][0] + '. Navaž dvěma krátkými původními řádky na jeho poslední obraz. ' + scenes[scene][1],
  });
});
beatButton.addEventListener('click', () => {
  needleArmed = false;
  if (beatButton.getAttribute('aria-pressed') === 'true') {
    stopBeat();
    setSound(Boolean(connection?.ready) || narration.playing);
    end.disabled = !connection && !narration.active;
  } else void startBeat();
});
window.addEventListener('alchymista:needle-arm', () => {
  if (needleArmed || beatButton.getAttribute('aria-pressed') === 'true') return;
  needleArmed = true;
  void beat.start({ prime: true }).catch(() => { needleArmed = false; });
});
window.addEventListener('alchymista:needle-drop', () => {
  if (!needleArmed) return;
  needleArmed = false;
  void startBeat(true);
});
window.addEventListener('alchymista:needle-skip', () => {
  if (needleArmed) stopBeat();
});
window.addEventListener('alchymista:needle-mute', () => {
  if (!needleArmed && !filmBeat) return;
  stopBeat();
  setSound(Boolean(connection?.ready) || narration.playing);
  end.disabled = !connection && !narration.active;
});
window.addEventListener('scroll', () => {
  if (panel.hidden && !connection && !narration.active) return;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(updateScene, 550);
}, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && (connection || narration.active || needleArmed || beatButton.getAttribute('aria-pressed') === 'true')) stop('Zvuk vypnutý po opuštění karty.'); });
document.getElementById('end')?.addEventListener('click', () => stop());
window.addEventListener('pagehide', () => {
  narration.stop();
  stopBeat();
  if (connection) dispose(connection, 'Hlas vypnutý.');
  if (!end.disabled) end.disabled = true;
  setSound(false);
});
