const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Browser-local creative workspace. Microphone is requested only by Record. */
export function initFrequency(container, {data, read, write, notify = () => {}, getLocation = () => null}) {
  const exercises = data.freestyleExercises || [];
  const modes = [
    ['four','Four bars','Four bars. One observed detail per line. Let the last line change the meaning of the first.'],
    ['sixteen','Sixteen bars','Build four scenes of four bars: arrival, encounter, friction, transformation.'],
    ['spoken','Spoken word','Speak one minute as if the street could answer. Rhyme is optional; leave space between thoughts.'],
    ['soundscape','Soundscape','List three ambient sounds. Where recording is permitted, collect their textures without recording private conversations.'],
    ['sketch','Graffiti sketch','On paper, build a readable letter skeleton from one architectural detail. Explore negative space before extensions.'],
    ['photo','Photo study','Frame a visual contrast: public/private, light/shadow, old/new. Follow the site’s photography rules and respect people.']
  ];
  const restored = read('atlas-frequency-draft', {});
  const stored = restored && typeof restored === 'object' ? restored : {};
  let inspiration = getLocation();
  let mode = modes.some(m => m[0] === stored.mode) ? stored.mode : 'four';
  let exerciseIndex = Math.max(0, Math.min(exercises.length - 1, Number(stored.exercise) || 0));
  let variant = 0;
  const waves = Array.from({length:105}, (_,i) => {
    const height = 4 + (Math.sin(i * 1.39) ** 2) * (12 + Math.sin(i / 13) ** 2 * 38);
    return `<path d="M${i*5+3} ${52-height/2}v${height.toFixed(2)}"/>`;
  }).join('');
  container.innerHTML = `
    <div class="fl-heading"><div><span class="fl-label">HIP-HOP AS INNER ALCHEMY</span><h2>THE FREQUENCY<span>.</span></h2></div><p>The street becomes a verse.<br>Give your inner dialogue a little room.</p></div>
    <div class="fl-signal" aria-hidden="true"><span>CAISIK / LOCAL SESSION</span><svg viewBox="0 0 530 104" preserveAspectRatio="none">${waves}</svg><span>LISTEN → MAKE → REFLECT</span></div>
    <div class="fl-layout">
      <div class="fl-workshop">
        <div class="fl-index"><span>01 / STREET TO SOUND</span><span>YOUR CREATIVE PRACTICE</span></div>
        <div class="fl-inspiration"><div><span class="fl-label">YOUR POINT OF DEPARTURE</span><p id="fl-place">The city around you</p></div><button type="button" class="fl-text-button" id="fl-use-place">Use selected discovery ↗</button></div>
        <div class="fl-mode-row" role="group" aria-label="Choose a creative format">${modes.map(m => `<button type="button" data-fl-mode="${m[0]}" aria-pressed="${m[0]===mode}">${m[1]}</button>`).join('')}</div>
        <div class="fl-prompt-wrap"><p class="fl-label">YOUR CHALLENGE</p><p id="fl-prompt" class="fl-prompt"></p><button type="button" class="fl-text-button" id="fl-shuffle">Another angle ↻</button></div>
        <label for="fl-exercise">Practice focus</label><select id="fl-exercise">${exercises.map((e,i) => `<option value="${i}">${String(i+1).padStart(2,'0')} / ${escapeHTML(e.title)} · ${escapeHTML(e.duration)}</option>`).join('')}</select>
        <p id="fl-exercise-copy" class="fl-exercise-copy"></p>
        <label for="fl-words">Word chain <span>Three details, one unexpected connection</span></label><input id="fl-words" type="text" maxlength="300" placeholder="concrete → memory → dawn" autocomplete="off"><p class="fl-microcopy">Start with an object you can see. Follow an association. Turn the third word into a metaphor.</p>
        <label for="fl-draft">Your blackbook <span id="fl-count">0 / 8000</span></label><textarea id="fl-draft" rows="7" maxlength="8000" placeholder="First thought. First line. Keep going."></textarea>
        <div class="fl-draft-actions"><button type="button" id="fl-download-draft" class="fl-outline">Download the draft ↓</button><button type="button" id="fl-clear-draft" class="fl-text-button">Clear writing</button></div><p id="fl-save-status" class="fl-microcopy" role="status">Writing is saved in this browser. No account or upload.</p>
      </div>
      <div class="fl-booth">
        <div class="fl-index"><span>02 / THE POCKET BOOTH</span><span id="fl-rec-light">MIC OFF</span></div>
        <h3>One take.<br><em>All you.</em></h3><p class="fl-booth-intro">Speak before you polish. Catch a phrase, a pause, a change in energy. Keep one honest line.</p>
        <div class="fl-recorder" id="fl-recorder"><div class="fl-recorder-top"><span>CAISIK / RAW TAPE</span><span>MICROPHONE ONLY</span></div><div class="fl-reels" aria-hidden="true"><div><i></i></div><span>LOCAL<br>RECORDING</span><div><i></i></div></div><div class="fl-tape-label"><span>REC TIME</span><output id="fl-time" aria-label="Recording duration">00:00</output><span>MAX 05:00</span></div><svg class="fl-monitor" viewBox="0 0 500 90" role="img" aria-label="Microphone input monitor, active while recording"><path id="fl-live-wave" d="M0 45H500"/></svg></div>
        <div class="fl-record-buttons"><button type="button" class="fl-record" id="fl-record"><span aria-hidden="true">●</span> Record a take</button><button type="button" class="fl-outline" id="fl-stop" disabled>■ Stop</button></div>
        <p id="fl-record-status" class="fl-record-status" role="status">Press Record to request microphone access. Nothing starts automatically.</p><p class="fl-microcopy">Audio stays in this tab and is never uploaded. Download to keep it before leaving. A hidden tab stops recording. Maximum five minutes per take.</p>
        <div id="fl-playback" class="fl-playback" hidden><label for="fl-audio">Your raw take</label><audio id="fl-audio" controls preload="metadata"></audio><div><a id="fl-download-audio" class="fl-text-button" download>Download audio ↓</a><button type="button" id="fl-delete-audio" class="fl-text-button">Delete take</button></div></div>
        <div class="fl-pulse"><div class="fl-index"><span>FIND YOUR POCKET</span><span>4 / 4</span></div><label for="fl-bpm">Tempo <output id="fl-bpm-out">90 BPM</output></label><input id="fl-bpm" type="range" min="50" max="160" value="90" step="1"><div class="fl-beats" role="img" aria-label="Four beat visual pulse, stopped"><i></i><i></i><i></i><i></i></div><div class="fl-pulse-options"><label><input id="fl-silent" type="checkbox" checked> Silent pulse</label><button type="button" id="fl-pulse-start" class="fl-text-button">Start pulse ▶</button><button type="button" id="fl-pulse-stop" class="fl-text-button" disabled>Stop ■</button></div><p id="fl-pulse-status" class="fl-microcopy" role="status">A timing tool, not a backing track. Sound begins only when you choose an audible pulse and press Start.</p></div>
        <details class="fl-review"><summary>Listen like a collaborator <span>+</span></summary><ol><li>Notice one vivid image. What makes it yours?</li><li>Find one clear rhythm or a pause that carries meaning.</li><li>Keep one line. Revise one phrase. Try a second take.</li></ol><p>Emotional language is material for reflection, not a diagnosis.</p></details>
      </div>
    </div>
    <details class="fl-sources"><summary>Practice notes & sources <span>↗</span></summary><p>These exercises are original CAISIK practice prompts. Explore freestyle challenges and rhythm learning from the sources below.</p><ul>${(data.sources||[]).filter(s => /Smithsonian|Ableton/.test(s.title)).map(s => `<li><a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)} ↗</a></li>`).join('')}</ul></details>`;
  const $ = id => container.querySelector(`#${id}`);
  const draft = $('fl-draft'), words = $('fl-words'), exercise = $('fl-exercise');
  draft.value = typeof stored.draft === 'string' ? stored.draft.slice(0,8000) : '';
  words.value = typeof stored.words === 'string' ? stored.words.slice(0,300) : '';
  exercise.value = String(exerciseIndex);
  const persist = () => {
    $('fl-count').textContent = `${draft.value.length} / 8000`;
    const ok = write('atlas-frequency-draft', {draft:draft.value, words:words.value, mode, exercise:exerciseIndex});
    $('fl-save-status').textContent = ok === false ? 'Browser storage is unavailable. Download your draft before leaving.' : 'Writing saved in this browser. No account or upload.';
  };
  const angles = [
    'Describe the visible thing before you name what it means.',
    'Let the place speak first. Answer it in your own voice.',
    'Find a contrast. Make the transition your central image.',
    'Use three concrete details. Leave the explanation unfinished.'
  ];
  const updatePrompt = () => {
    $('fl-place').textContent = inspiration?.name || 'The city around you';
    const selected = modes.find(m => m[0] === mode);
    const locationPrompt = inspiration?.challenge ? ` ${inspiration.challenge}` : '';
    $('fl-prompt').textContent = variant === 0 ? selected[2] + locationPrompt : `${selected[1]}. ${angles[(variant-1)%angles.length]}${inspiration ? ` Begin at ${inspiration.name}.` : ''}`;
    container.querySelectorAll('[data-fl-mode]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.flMode===mode)));
  };
  const updateExercise = () => { $('fl-exercise-copy').textContent = exercises[exerciseIndex]?.instruction || ''; };
  const setInspiration = location => { inspiration = location; variant = 0; updatePrompt(); };
  $('fl-use-place').addEventListener('click', () => {
    const location = getLocation();
    if (location) {setInspiration(location); notify('Selected discovery added to your creative prompt.');}
    else notify('Choose a discovery in the Hidden City explorer first.');
  });
  container.querySelectorAll('[data-fl-mode]').forEach(b => b.addEventListener('click', () => {mode = b.dataset.flMode; variant=0; updatePrompt();persist();}));
  $('fl-shuffle').addEventListener('click', () => {variant++;updatePrompt();});
  exercise.addEventListener('change', () => {exerciseIndex=Number(exercise.value);updateExercise();persist();});
  draft.addEventListener('input',persist);words.addEventListener('input',persist);
  $('fl-clear-draft').addEventListener('click', () => {draft.value='';persist();draft.focus();});
  $('fl-download-draft').addEventListener('click', () => {
    const text = `CAISIK / THE FREQUENCY\n${inspiration?.name||'City observation'}\n${modes.find(m=>m[0]===mode)[1]}\n\n${$('fl-prompt').textContent}\n\nPractice: ${exercises[exerciseIndex]?.title||''}\n${exercises[exerciseIndex]?.instruction||''}\n\nWord chain: ${words.value}\n\n${draft.value}\n`;
    const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a');a.href=url;a.download='caisik-frequency-draft.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify('Your draft is ready to download.');
  });
  updatePrompt();updateExercise();$('fl-count').textContent=`${draft.value.length} / 8000`;

  // Microphone and audio graph lifetime are separate from the timing tool.
  let recorder=null, stream=null, chunks=[], audioURL=null, micContext=null, analyser=null;
  let recInterval=null, raf=null, started=0, pending=false, permissionGeneration=0;
  const status = text => { $('fl-record-status').textContent=text; };
  const disposeGraph = () => {
    stream?.getTracks().forEach(t=>t.stop());stream=null;
    clearInterval(recInterval);recInterval=null;
    if(raf)cancelAnimationFrame(raf);raf=null;analyser=null;
    if(micContext){micContext.close().catch(()=>{});micContext=null;}
    $('fl-recorder').classList.remove('fl-recording');
    $('fl-rec-light').textContent='MIC OFF';
    $('fl-live-wave').setAttribute('d','M0 45H500');
  };
  const removeAudio = () => {
    $('fl-audio').pause();$('fl-audio').removeAttribute('src');$('fl-audio').load();
    if(audioURL)URL.revokeObjectURL(audioURL);audioURL=null;
    $('fl-download-audio').removeAttribute('href');$('fl-playback').hidden=true;
  };
  const monitor = () => {
    if(!analyser || recorder?.state!=='recording')return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion==='off';
    if(!reduced){
      const a=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(a);
      let path='';for(let i=0;i<100;i++){const x=i*500/99;const y=45+(a[Math.floor(i*a.length/100)]-128)/128*38;path+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}
      $('fl-live-wave').setAttribute('d',path);
    }
    raf=requestAnimationFrame(monitor);
  };
  const stopRecording = reason => {
    if(pending){permissionGeneration++;pending=false;$('fl-record').disabled=false;status(reason||'Microphone request cancelled.');}
    if(recorder && recorder.state!=='inactive'){
      try{recorder.stop();}catch{disposeGraph();}
      if(reason)status(reason);
    }
    disposeGraph();$('fl-stop').disabled=true;
  };
  $('fl-record').addEventListener('click',async()=>{
    if(pending || recorder?.state==='recording')return;
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){status('Microphone recording is unavailable here. Use your device recorder alongside these prompts.');return;}
    pending=true;const generation=++permissionGeneration;$('fl-record').disabled=true;$('fl-stop').disabled=false;status('Waiting for your microphone permission…');
    try{
      const acquired=await navigator.mediaDevices.getUserMedia({audio:true});
      if(generation!==permissionGeneration || document.hidden){acquired.getTracks().forEach(t=>t.stop());if(generation===permissionGeneration){pending=false;$('fl-record').disabled=false;$('fl-stop').disabled=true;}return;}
      stream=acquired;
      const types=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'];
      const mime=types.find(t=>MediaRecorder.isTypeSupported?.(t));
      recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onerror=()=>{disposeGraph();pending=false;$('fl-record').disabled=false;$('fl-stop').disabled=true;status('Recording failed. No audio was uploaded. Try again or use your device recorder.');};
      recorder.onstop=()=>{
        const type=recorder.mimeType || chunks[0]?.type || 'audio/webm';
        const blob=new Blob(chunks,{type});removeAudio();
        if(blob.size){audioURL=URL.createObjectURL(blob);$('fl-audio').src=audioURL;$('fl-download-audio').href=audioURL;$('fl-download-audio').download=`caisik-raw-take-${Date.now()}.${/mp4/.test(type)?'m4a':/ogg/.test(type)?'ogg':'webm'}`;$('fl-playback').hidden=false;status('Take ready. Listen back, keep one line, and download to save the audio.');}
        else status('No audio was captured. Try a short test take.');
        chunks=[];disposeGraph();pending=false;$('fl-record').disabled=false;$('fl-stop').disabled=true;
      };
      recorder.start(250);pending=false;started=Date.now();$('fl-time').textContent='00:00';$('fl-rec-light').textContent='● RECORDING';$('fl-recorder').classList.add('fl-recording');status('Recording your microphone. Pauses count too.');
      try{
        const AudioCtor=window.AudioContext||window.webkitAudioContext;
        if(AudioCtor){micContext=new AudioCtor();micContext.resume().catch(()=>{});const source=micContext.createMediaStreamSource(stream);analyser=micContext.createAnalyser();analyser.fftSize=256;source.connect(analyser);monitor();}
      }catch{/* Recording remains available without a monitor. */}
      recInterval=setInterval(()=>{
        const sec=Math.floor((Date.now()-started)/1000);$('fl-time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
        if(sec>=300)stopRecording('Five-minute limit reached. Preparing your take…');
      },250);
    }catch(error){if(generation!==permissionGeneration)return;disposeGraph();pending=false;$('fl-record').disabled=false;$('fl-stop').disabled=true;status(error?.name==='NotAllowedError'?'Microphone access was not granted. You can keep writing, or enable it in your browser and try again.':'The microphone could not start. Check that it is connected and available to this browser.');}
  });
  $('fl-stop').addEventListener('click',()=>stopRecording('Preparing your take…'));
  $('fl-delete-audio').addEventListener('click',()=>{removeAudio();$('fl-time').textContent='00:00';status('Take deleted from this tab. Any earlier downloaded copy remains on your device.');});

  // Four-beat pulse. No audio on page load, and silent mode is the default.
  let pulseInterval=null, beat=-1, pulseContext=null, pulseGeneration=0, pulsePending=false;
  const beatEls=[...container.querySelectorAll('.fl-beats i')];
  const pulseTick=()=>{
    beat=(beat+1)%4;beatEls.forEach((b,i)=>b.classList.toggle('fl-beat-active',i===beat));
    container.querySelector('.fl-beats').setAttribute('aria-label',`Four beat visual pulse, beat ${beat+1}`);
    if(!$('fl-silent').checked && pulseContext){
      const o=pulseContext.createOscillator(),g=pulseContext.createGain(),now=pulseContext.currentTime;
      o.frequency.value=beat===0?880:600;g.gain.setValueAtTime(0.035,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.05);o.connect(g);g.connect(pulseContext.destination);o.start(now);o.stop(now+0.055);
    }
  };
  const stopPulse=()=>{pulseGeneration++;pulsePending=false;clearInterval(pulseInterval);pulseInterval=null;beat=-1;beatEls.forEach(b=>b.classList.remove('fl-beat-active'));$('fl-pulse-start').disabled=false;$('fl-pulse-stop').disabled=true;container.querySelector('.fl-beats').setAttribute('aria-label','Four beat visual pulse, stopped');if(pulseContext){pulseContext.close().catch(()=>{});pulseContext=null;}$('fl-pulse-status').textContent='Pulse stopped.';};
  $('fl-pulse-start').addEventListener('click',async()=>{
    if(pulseInterval||pulsePending)return;
    pulsePending=true;const generation=++pulseGeneration;$('fl-pulse-start').disabled=true;$('fl-pulse-stop').disabled=false;
    if(!$('fl-silent').checked){try{const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)throw new Error('unsupported');pulseContext=new AudioCtor();await pulseContext.resume();}catch{$('fl-silent').checked=true;$('fl-pulse-status').textContent='Audio is unavailable; using a silent visual pulse.';}}
    if(generation!==pulseGeneration||document.hidden)return;
    pulsePending=false;pulseTick();pulseInterval=setInterval(pulseTick,60000/Number($('fl-bpm').value));$('fl-pulse-start').disabled=true;$('fl-pulse-stop').disabled=false;$('fl-pulse-status').textContent=$('fl-silent').checked?'Silent visual pulse running.':'Audible pulse running. Use headphones while recording; the recorder captures your microphone only.';
  });
  $('fl-pulse-stop').addEventListener('click',stopPulse);
  $('fl-bpm').addEventListener('input',()=>{$('fl-bpm-out').textContent=$('fl-bpm').value+' BPM';if(pulseInterval){clearInterval(pulseInterval);pulseInterval=setInterval(pulseTick,60000/Number($('fl-bpm').value));}});
  $('fl-silent').addEventListener('change',()=>{if(pulseInterval){stopPulse();$('fl-pulse-status').textContent='Pulse mode changed. Press Start to use the new setting.';}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRecording('Recording stopped because this tab is hidden.');stopPulse();}});
  window.addEventListener('pagehide',()=>{stopRecording();stopPulse();removeAudio();});
  return {setInspiration};
}
