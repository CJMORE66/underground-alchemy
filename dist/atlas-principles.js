const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const romans = ['I','II','III','IV','V','VI','VII'];
const geometry = [
  '<circle cx="50" cy="50" r="34"/><path d="M16 50 50 16 84 50 50 84Z M26 26H74V74H26Z M16 50H84 M50 16V84"/>',
  '<circle cx="37" cy="50" r="28"/><circle cx="63" cy="50" r="28"/>',
  '<path d="M8 31Q29 10 50 31T92 31 M8 44Q29 23 50 44T92 44 M8 57Q29 36 50 57T92 57 M8 70Q29 49 50 70T92 70"/>',
  '<circle cx="35" cy="50" r="27"/><circle cx="65" cy="50" r="27"/><path d="M50 25V75"/>',
  '<circle cx="50" cy="50" r="34"/><circle cx="50" cy="35" r="19"/><path d="M17 50H83"/>',
  '<path d="M50 11 88 79H12Z M18 67H82 M50 11V79"/><circle cx="50" cy="57" r="23"/>',
  '<circle cx="50" cy="32" r="26"/><circle cx="34" cy="58" r="26"/><circle cx="66" cy="58" r="26"/>'
];
const icon = index => `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width=".9" aria-hidden="true">${geometry[index]}</svg>`;
const facade = `<svg class="ap-facade" viewBox="0 0 400 170" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true"><path d="M55 155V40H120V155 M280 155V40H345V155 M120 155V85H280V155 M45 40H130 M270 40H355 M68 40V13H107V40 M293 40V13H332V40 M130 85 200 40 270 85 M45 155H355"/><circle cx="200" cy="97" r="26"/><circle cx="200" cy="97" r="20"/><path d="M174 97H226 M200 71V123 M181 78 219 116 M181 116 219 78 M154 155V132Q169 110 184 132V155 M216 155V132Q231 110 246 132V155 M71 80V57H84V80 M92 80V57H105V80 M296 80V57H309V80 M318 80V57H331V80"/></svg>`;

export function initPrinciples(container, {data, read = (_,fallback)=>fallback, write = ()=>false, notify = ()=>{}}) {
  if (!container || !data?.principles?.length) return;
  const items = data.principles;
  let current = 0;
  let notes = read('atlas-principle-notes', {});
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) notes = {};
  let timer, audioContext, oscillator, gain, currentBeat = 0, audioEpoch = 0, audioPending = false;
  const stops = [];
  const stopSound = () => {
    audioEpoch++; audioPending = false;
    clearInterval(timer); timer = undefined;
    if (oscillator) {try {oscillator.stop();} catch {} oscillator = undefined;}
    if (audioContext) {audioContext.close().catch(()=>{}); audioContext = undefined;}
    container.querySelectorAll('.ap-beat').forEach(el=>el.classList.remove('ap-now'));
    const toneButton = container.querySelector('[data-tone]');
    if (toneButton) {toneButton.textContent='Play tone'; toneButton.setAttribute('aria-pressed','false');}
    const rhythmButton = container.querySelector('[data-rhythm]');
    if (rhythmButton) {rhythmButton.textContent='Start rhythm'; rhythmButton.setAttribute('aria-pressed','false');}
  };
  const makeContext = async () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error('Audio synthesis is unavailable. The visual experiment still works.');
    audioContext = new Ctx();
    await audioContext.resume();
    return audioContext;
  };
  container.innerHTML = `<div class="ap-heading"><div><p class="ap-label">AN INNER MAP FOR AN OUTER CITY</p><h2>The Seven Principles</h2></div><p>Read an idea.<br>Take it into the street.</p></div>
    <p class="ap-context">A modern Hermetic-inspired lens. First published in 1908; not authenticated ancient Egyptian teaching.</p>
    <details class="ap-provenance"><summary>Read the context & sources <span>+</span></summary><p>${escape(data.provenance)}</p><ul>${data.sources.slice(0,3).map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a></li>`).join('')}</ul></details>
    <div class="ap-tabs" role="tablist" aria-label="Seven principles">${items.map((p,i)=>`<button type="button" class="ap-tab" role="tab" id="ap-tab-${i}" aria-controls="ap-lesson" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-principle="${i}"><span class="ap-roman">${romans[i]}</span><strong>${escape(p.name)}</strong>${icon(i)}<small>${escape(p.subtitle)}</small><span class="ap-saved-mark" aria-hidden="true">${notes[p.id]?.unlocked?'•':''}</span></button>`).join('')}</div>
    <div id="ap-lesson" class="ap-lesson" role="tabpanel" aria-labelledby="ap-tab-0"></div>`;
  const panel = container.querySelector('#ap-lesson');
  const render = () => {
    stopSound();
    const p = items[current];
    const saved = notes[p.id] || {};
    panel.setAttribute('aria-labelledby',`ap-tab-${current}`);
    container.querySelectorAll('.ap-tab').forEach((el,i)=>{el.setAttribute('aria-selected',String(i===current));el.tabIndex=i===current?0:-1;});
    panel.innerHTML = `<div class="ap-visual-column"><div class="ap-art"><div class="ap-art-orbit" aria-hidden="true"></div><img src="/assets/masterworks/${String(current+21).padStart(3,'0')}.webp" loading="lazy" width="420" height="420" alt="Original CAISIK sculptural artwork for ${escape(p.name)}"><span class="ap-art-caption">${romans[current]} / ${escape(p.name)} · ORIGINAL CAISIK ART</span></div><div class="ap-experiment"><p class="ap-label">EXPERIMENT / ${current===2||current===4?'SOUND & COMPOSITION':'VISUAL ANALOGY'}</p><h4>${escape(p.subtitle)}</h4><div class="ap-demo" data-demo></div><p class="ap-demo-disclosure">Contemporary creative experiment. This does not demonstrate a metaphysical law.</p></div></div>
      <div class="ap-copy"><p class="ap-label">${String(current+1).padStart(2,'0')} / 07 · PHILOSOPHY INTO PRACTICE</p><h3>${escape(p.name)}</h3><div class="ap-book"><span class="ap-label">THE KYBALION'S POSITION</span><p>${escape(p.doctrine)} ${escape(p.context)}</p></div><p class="ap-explanation">${escape(p.explanation)}</p><div class="ap-urban"><h4>Read the city</h4><p>${escape(p.urban)}</p><p class="ap-question">${escape(p.observe)}</p></div><div class="ap-practice"><h4>Try it in the street</h4><p>${escape(p.exercise)}</p><h4>Put it in a verse</h4><p>${escape(p.freestyle)}</p></div><p class="ap-related">CONNECTED IDEAS <span>${p.related.map(escape).join(' / ')}</span></p><form class="ap-observation"><label for="ap-note">Your observation</label><textarea id="ap-note" rows="3" maxlength="1600" placeholder="What did the city make you notice?">${escape(saved.text||'')}</textarea><label class="ap-tried"><input id="ap-tried" type="checkbox" ${saved.tried?'checked':''}> I tried the exercise</label><div class="ap-save-line"><button type="submit" class="ap-save">Save observation ↗</button><span class="ap-note-status" role="status">${saved.unlocked?'Deeper reflection unlocked.':'Save a note of at least 12 characters and try the exercise to reveal a deeper question.'}</span></div><div class="ap-deeper" ${saved.unlocked?'':'hidden'}><span class="ap-label">A DEEPER QUESTION</span><p>${escape(p.deeper)}</p></div><p class="ap-local">Notes stay in this browser. No account or upload.</p></form></div>`;
    wireDemo(p);
    panel.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();
      const text = panel.querySelector('#ap-note').value.trim();
      const tried = panel.querySelector('#ap-tried').checked;
      const status = panel.querySelector('.ap-note-status');
      if (!text) {status.textContent='Write an observation before saving.'; panel.querySelector('#ap-note').focus(); return;}
      const unlocked = Boolean(notes[p.id]?.unlocked || (text.length>=12 && tried));
      notes[p.id] = {text,tried,unlocked,updatedAt:new Date().toISOString()};
      const persisted = write('atlas-principle-notes', notes);
      panel.querySelector('.ap-deeper').hidden = !unlocked;
      status.textContent = persisted===false ? 'Your note is available for this visit. Browser storage could not save it.' : unlocked ? 'Saved in this browser. Deeper reflection unlocked.' : 'Saved. Try the exercise and add at least 12 characters to open the deeper question.';
      if(unlocked) container.querySelector(`[data-principle="${current}"] .ap-saved-mark`).textContent='•';
      notify(persisted===false?'Browser storage unavailable; export your notes before leaving.':'Observation saved.');
    });
  };
  const wireDemo = p => {
    const demo = panel.querySelector('[data-demo]');
    if (p.id==='mentalism') {
      demo.innerHTML=`${facade}<div class="ap-demo-options"><button type="button" data-lens="0" aria-pressed="true">Architect</button><button type="button" data-lens="1" aria-pressed="false">Resident</button><button type="button" data-lens="2" aria-pressed="false">Writer</button></div><p class="ap-demo-output" role="status">Architecture: openings, structure, repetition.</p><p class="ap-small">The drawing stays the same; your attention changes.</p>`;
      const captions=['Architecture: openings, structure, repetition.','Memory: a threshold, a familiar route, a place to return.','Possibility: a frame for a new story or letter structure.'];
      demo.querySelectorAll('[data-lens]').forEach(button=>button.addEventListener('click',()=>{demo.querySelectorAll('[data-lens]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));demo.querySelector('.ap-demo-output').textContent=captions[+button.dataset.lens];}));
    } else if (p.id==='correspondence') {
      demo.innerHTML=`<div class="ap-patterns"><div>${icon(0)}<span>Window pattern</span></div><div class="ap-scaled-pattern">${icon(5)}<span>Abstract city network</span></div></div><label for="ap-scale">Compare the scale <output id="ap-scale-value">100%</output></label><input id="ap-scale" type="range" min="60" max="140" value="100"><p class="ap-small">Visual analogy. A resemblance does not establish a shared hidden cause.</p>`;
      demo.querySelector('input').addEventListener('input',e=>{demo.querySelector('.ap-scaled-pattern svg').style.transform=`scale(${e.target.value/100})`;demo.querySelector('output').textContent=e.target.value+'%';});
    } else if (p.id==='vibration') {
      demo.innerHTML=`<svg class="ap-wave" viewBox="0 0 400 110" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.3"/></svg><label for="ap-frequency">Oscillator frequency <output>220 Hz</output></label><input id="ap-frequency" type="range" min="110" max="880" step="1" value="220"><div class="ap-demo-options"><button type="button" data-tone aria-pressed="false">Play tone</button><button type="button" data-tone-stop>Stop sound</button></div><p class="ap-small">Soft sine tone. Adjust your device volume before playing.</p>`;
      const range=demo.querySelector('input');
      const update=()=>{const f=+range.value;demo.querySelector('output').textContent=f+' Hz';let path='';for(let x=0;x<=400;x+=2)path+=(x?'L':'M')+x+','+(55+Math.sin(x/400*Math.PI*2*f/110)*31).toFixed(1);demo.querySelector('path').setAttribute('d',path);if(oscillator&&audioContext)oscillator.frequency.setTargetAtTime(f,audioContext.currentTime,.04);};
      range.addEventListener('input',update);update();
      demo.querySelector('[data-tone]').addEventListener('click',async e=>{
        if(oscillator){stopSound();return;}
        if(audioPending)return; audioPending=true; const epoch=audioEpoch;
        try {const ctx=await makeContext();audioPending=false;if(current!==2||epoch!==audioEpoch){stopSound();return;}oscillator=ctx.createOscillator();gain=ctx.createGain();gain.gain.value=.035;oscillator.type='sine';oscillator.frequency.value=+range.value;oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();e.target.textContent='Pause tone';e.target.setAttribute('aria-pressed','true');}catch(error){stopSound();notify(error.message);}
      });
      demo.querySelector('[data-tone-stop]').addEventListener('click',stopSound);
    } else if (p.id==='polarity') {
      demo.innerHTML=`<div class="ap-contrast-image">${facade}</div><label for="ap-contrast">Visual contrast <output>Layered</output></label><input id="ap-contrast" type="range" min="0" max="100" value="50"><p class="ap-small">A descriptive spectrum: rough → layered → composed. No moral score.</p>`;
      demo.querySelector('input').addEventListener('input',e=>{const v=+e.target.value;demo.querySelector('.ap-contrast-image').style.filter=`contrast(${.6+v/40}) brightness(${.6+v/160})`;demo.querySelector('output').textContent=v<34?'Rough':v<67?'Layered':'Composed';});
    } else if (p.id==='rhythm') {
      demo.innerHTML=`<div class="ap-beats" aria-label="Four beat pattern">${[0,1,2,3].map(i=>`<button type="button" class="ap-beat" data-step="${i}" aria-pressed="true" aria-label="Beat ${i+1} enabled; click to mute">${i+1}</button>`).join('')}</div><label for="ap-rhythm-bpm">Tempo <output>88 BPM</output></label><input id="ap-rhythm-bpm" type="range" min="60" max="140" value="88"><label class="ap-tried"><input type="checkbox" id="ap-silent" checked> Silent visual mode</label><div class="ap-demo-options"><button type="button" data-rhythm aria-pressed="false">Start rhythm</button><button type="button" data-rhythm-stop>Stop</button></div><p class="ap-small">Click any beat to leave a rest. This is a compositional exercise.</p>`;
      const steps=[true,true,true,true];
      demo.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{const i=+button.dataset.step;steps[i]=!steps[i];button.setAttribute('aria-pressed',String(steps[i]));button.setAttribute('aria-label',`Beat ${i+1} ${steps[i]?'enabled; click to mute':'muted; click to enable'}`);}));
      const pulse=()=>{demo.querySelectorAll('.ap-beat').forEach((el,i)=>el.classList.toggle('ap-now',i===currentBeat));if(steps[currentBeat]&&audioContext&&!demo.querySelector('#ap-silent').checked){const osc=audioContext.createOscillator(),g=audioContext.createGain();osc.frequency.value=currentBeat===0?660:440;g.gain.setValueAtTime(.0001,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.06,audioContext.currentTime+.004);g.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.06);osc.connect(g);g.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.07);}currentBeat=(currentBeat+1)%4;};
      const range=demo.querySelector('#ap-rhythm-bpm');
      range.addEventListener('input',()=>{demo.querySelector('output').textContent=range.value+' BPM';if(timer){clearInterval(timer);timer=setInterval(pulse,60000/+range.value);}});
      demo.querySelector('[data-rhythm]').addEventListener('click',async e=>{if(timer){stopSound();return;}if(audioPending)return;audioPending=true;const epoch=audioEpoch;try{if(!demo.querySelector('#ap-silent').checked)await makeContext();audioPending=false;if(current!==4||epoch!==audioEpoch){stopSound();return;}currentBeat=0;pulse();timer=setInterval(pulse,60000/+range.value);e.target.textContent='Pause rhythm';e.target.setAttribute('aria-pressed','true');}catch(error){stopSound();notify(error.message);}});
      demo.querySelector('#ap-silent').addEventListener('change',async e=>{if(!e.target.checked&&timer&&!audioContext){const epoch=audioEpoch;try{await makeContext();if(!timer||current!==4||epoch!==audioEpoch)stopSound();}catch(error){e.target.checked=true;notify(error.message);}}});
      demo.querySelector('[data-rhythm-stop]').addEventListener('click',stopSound);
    } else if (p.id==='cause-effect') {
      demo.innerHTML=`<p class="ap-small">Fictional entrance model</p><label for="ap-arrivals">Arrivals per minute <output>30</output></label><input id="ap-arrivals" type="range" min="0" max="60" value="30"><div class="ap-demo-options"><button type="button" data-doors="1" aria-pressed="true">1 entrance</button><button type="button" data-doors="2" aria-pressed="false">2 entrances</button></div><div class="ap-model"><span>Queue added / minute</span><strong class="ap-model-result">10</strong><div class="ap-model-meter"><i style="width:25%"></i></div></div><p class="ap-small">Assumptions: each entrance admits exactly 20 people/minute; arrivals are steady; no other constraints. Queue added = max(0, arrivals − capacity). This is not a crowd-safety model.</p>`;
      let doors=1;const range=demo.querySelector('input');const update=()=>{const queue=Math.max(0,+range.value-doors*20);demo.querySelector('output').textContent=range.value;demo.querySelector('.ap-model-result').textContent=queue;demo.querySelector('.ap-model-meter i').style.width=queue/40*100+'%';};
      range.addEventListener('input',update);demo.querySelectorAll('[data-doors]').forEach(button=>button.addEventListener('click',()=>{doors=+button.dataset.doors;demo.querySelectorAll('[data-doors]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));update();}));
    } else {
      demo.innerHTML=`<svg class="ap-combine" viewBox="0 0 400 130" fill="none" stroke="currentColor" aria-hidden="true"><path data-receive/><path data-initiate/><path data-combined stroke-width="2"/></svg><label for="ap-receive">Receive <output data-receive-value>50</output></label><input id="ap-receive" type="range" min="0" max="100" value="50"><label for="ap-initiate">Initiate <output data-initiate-value>50</output></label><input id="ap-initiate" type="range" min="0" max="100" value="50"><p class="ap-small">Two creative modes, available to everyone. The central line combines the two patterns.</p>`;
      const a=demo.querySelector('#ap-receive'),b=demo.querySelector('#ap-initiate');const update=()=>{demo.querySelector('[data-receive-value]').textContent=a.value;demo.querySelector('[data-initiate-value]').textContent=b.value;let one='',two='',combined='';for(let x=0;x<=400;x+=3){const y1=Math.sin(x/400*Math.PI*4)*(+a.value*.4),y2=Math.cos(x/400*Math.PI*6)*(+b.value*.4);const op=x?'L':'M';one+=op+x+','+(65+y1).toFixed(1);two+=op+x+','+(65+y2).toFixed(1);combined+=op+x+','+(65+(y1+y2)/2).toFixed(1);}demo.querySelector('[data-receive]').setAttribute('d',one);demo.querySelector('[data-initiate]').setAttribute('d',two);demo.querySelector('[data-combined]').setAttribute('d',combined);};a.addEventListener('input',update);b.addEventListener('input',update);update();
    }
  };
  container.querySelectorAll('[data-principle]').forEach(button=>button.addEventListener('click',()=>{current=+button.dataset.principle;render();}));
  container.querySelector('.ap-tabs').addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();current=event.key==='Home'?0:event.key==='End'?6:(current+(event.key==='ArrowRight'?1:6))%7;render();container.querySelector(`[data-principle="${current}"]`).focus();});
  const hide=()=>{if(document.hidden)stopSound();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stopSound);stops.push(()=>document.removeEventListener('visibilitychange',hide),()=>window.removeEventListener('pagehide',stopSound));
  render();
  return {select(id){const i=items.findIndex(p=>p.id===id);if(i>=0){current=i;render();}},destroy(){stopSound();stops.forEach(fn=>fn());}};
}
