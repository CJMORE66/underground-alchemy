/* CAISIK Street Portals v7. No network requests, analytics SDKs or remote storage.
 * Existing caisik-album stores visited public portal paths as a functional local album.
 * Optional campaign history uses allowlisted UTM fields only after affirmative consent.
 */
(() => {
  'use strict';
  const slug = location.pathname.split('/').filter(Boolean)[1];
  const portals = [
    {slug:'transmute',title:'TRANSMUTE',chapter:'portal',chapterName:'THE PORTAL',color:'#c6aa6c',symbol:'✳',mode:'forge',action:'Dissolve the old form',revealed:'Rebuild the symbol',intro:'A mark on a wall. A pause in the noise. A different way through.',reflection:'What are you ready to stop carrying?',story:'Transformation starts with attention. Take the form apart, keep what matters, and choose what comes next.',meaning:'Dissolution and reconstruction are visual metaphors for examining an inherited identity.',collection:'Explore the pieces',link:'/#drops'},
    {slug:'mentalism',title:'CHANGE THE FRAME',chapter:'principles',chapterName:'THE SEVEN PRINCIPLES',color:'#a9c1cc',symbol:'◉',mode:'perspective',action:'Move your point of view',intro:'The scene stays. Your point of view moves.',reflection:'Which assumption changes when you look from another position?',story:'The Kybalion presents mind as fundamental to reality. Here, a changing frame invites you to examine interpretation. It does not prove that thought controls physical events.',meaning:'Perspective is our modern visual metaphor; the historical principle is a philosophical claim.',learn:true},
    {slug:'correspondence',title:'WITHIN / WITHOUT',chapter:'principles',chapterName:'THE SEVEN PRINCIPLES',color:'#c8b9a0',symbol:'◇',mode:'scale',action:'Move between the scales',intro:'A small detail. A larger pattern. Look twice.',reflection:'Where does a useful analogy stop being evidence?',story:'“As above, so below” describes correspondence between planes in the text. Explore repeating geometry, while remembering that a visual resemblance is an analogy, not a scientific explanation.',meaning:'Nested geometry offers a metaphor for patterns across scales.',learn:true},
    {slug:'vibration',title:'FIND YOUR FREQUENCY',chapter:'city',chapterName:'THE CITY',color:'#b39a82',symbol:'≈',mode:'wave',action:'Change the visual frequency',intro:'Under the city’s noise, a rhythm you can choose.',reflection:'What deserves more of your attention today?',story:'Change the spacing of the lines. The drawing responds to your hand, not to invisible energy. The Kybalion uses vibration within its philosophical account of change.',meaning:'This frequency control changes a drawing; it is not an energy reading or a therapeutic tool.',learn:true},
    {slug:'polarity',title:'BETWEEN THE EXTREMES',chapter:'dissolution',chapterName:'THE DISSOLUTION',color:'#d0c9b9',symbol:'◐',mode:'polarity',action:'Explore the continuum',intro:'Step away from the edge. Notice everything between.',reflection:'Which situation have you reduced to only two choices?',story:'Polarity in The Kybalion describes opposites as degrees of one underlying thing. Try the continuum as a prompt for reflection, not as a rule that every real-world difference must obey.',meaning:'Light and shadow are a visual metaphor for degrees and contrast.',learn:true},
    {slug:'rhythm',title:'KNOW YOUR RETURN',chapter:'principles',chapterName:'THE SEVEN PRINCIPLES',color:'#b7ac92',symbol:'↔',mode:'pendulum',action:'Set the pendulum in motion',revealed:'Pause and begin again',intro:'There is movement in leaving. There is movement in coming back.',reflection:'Which repeatable habit supports you when motivation changes?',story:'The text describes rhythm as a movement between poles. This pendulum is a simple visual model; use it to reflect on patterns in your own life without treating every event as inevitable.',meaning:'A repeating animation illustrates a philosophical metaphor, not a forecast.',learn:true},
    {slug:'cause-effect',title:'MAKE A MOVE',chapter:'forge',chapterName:'THE FORGE',color:'#c09b75',symbol:'→',mode:'causal',action:'Begin the chain',revealed:'Reset the chain',intro:'An intention needs an action. An action opens the next step.',reflection:'What is one small action whose result you can actually check?',story:'The Kybalion stresses cause and effect. This deliberately simple chain has a known sequence. Real situations often involve many causes, uncertainty and incomplete information.',meaning:'Three connected steps illustrate an authored causal model, not a model of all events.',learn:true},
    {slug:'generation',title:'CREATE IN DIALOGUE',chapter:'forge',chapterName:'THE FORGE',color:'#b09cbb',symbol:'⊕',mode:'union',action:'Bring the forms together',revealed:'Give the forms space',intro:'Two forms. One space for something new.',reflection:'Which different approaches could improve what you are making?',story:'The historical text calls its seventh principle “Gender” and describes masculine and feminine principles. This portal interprets complementarity as a creative metaphor. It does not define anyone’s identity, ability or social role.',meaning:'The two shapes represent different creative approaches, not biological sexes or fixed human traits.',learn:true},
    {slug:'shadow-work',title:'MEET THE SHADOW',chapter:'dissolution',chapterName:'THE DISSOLUTION',color:'#a58782',symbol:'◑',mode:'shadow',action:'Let the hidden form emerge',revealed:'Return to the silhouette',intro:'What you avoid can shape the outline.',reflection:'What response are you willing to examine without judging yourself?',story:'A silhouette becomes visible by degrees. Use the image as an invitation to reflect on reactions you usually leave unexplored. This editorial exercise is not therapy or a diagnosis.',meaning:'Shadow is an artistic metaphor for the less examined parts of experience.',collection:'Explore the pieces',link:'/#drops'},
    {slug:'as-above',title:'LOOK ABOVE',chapter:'portal',chapterName:'THE PORTAL',color:'#c5b47a',symbol:'△',mode:'above',action:'Open the upper horizon',revealed:'Return to the horizon',intro:'Lift your gaze. Leave room for the bigger question.',reflection:'How does the broader context change the detail in front of you?',story:'A triangle opens toward a wider field. This is one half of a paired visual meditation on scale, attention and context. The other half begins below.',meaning:'Original geometric artwork, inspired by the language of correspondence.',pair:'so-below',collection:'Explore the pieces',link:'/#drops'},
    {slug:'so-below',title:'NOTICE BELOW',chapter:'city',chapterName:'THE CITY',color:'#b38f72',symbol:'▽',mode:'below',action:'Open the lower horizon',revealed:'Return to the horizon',intro:'Look closer. The ordinary carries its own depth.',reflection:'Which overlooked detail changes your understanding of the whole?',story:'Follow the descending triangle into the detail. This is the companion to Look Above: a prompt to connect broad ideas with ordinary actions, without claiming that one proves the other.',meaning:'Original geometric artwork, inspired by the language of correspondence.',pair:'as-above',collection:'Explore the pieces',link:'/#drops'},
    {slug:'underground',title:'CARRY THE SIGN',chapter:'drop',chapterName:'THE DROP',color:'#b14d3e',symbol:'▥',mode:'city',action:'Light the city grid',revealed:'Return to the quiet',intro:'The story leaves the screen when you make it your own.',reflection:'What do you want the things you wear to say?',story:'Graffiti, music and symbolic thinking meet in an independent visual language. Explore the real catalog, choose what speaks to you, and check options in the original store.',meaning:'An original city grid connects the street series to the clothing.',collection:'Explore the real catalog',link:'/#drops'}
  ];
  const index = portals.findIndex(p => p.slug === slug);
  if (!location.pathname.startsWith('/q/') || index < 0) return;
  const root = document.querySelector('#portal');
  if (!root) return;
  const item = portals[index];
  const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const safeRemove = key => { try { localStorage.removeItem(key); } catch {} };
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = String(index + 1).padStart(2,'0');
  const slider = ['perspective','scale','wave','polarity'].includes(item.mode);
  const shapes = {
    forge:'<g class="p7-fragments"><path d="M200 63 278 200 200 245 122 200Z"/><path d="m200 245 78-45 41 73-119 65-119-65 41-73Z"/></g><g class="p7-core"><circle cx="200" cy="200" r="62"/><path d="M200 88v224M88 200h224m-191-79 158 158m0-158L121 279"/></g>',
    perspective:'<g class="p7-cube"><path d="m200 88 102 59v116l-102 59-102-59V147Z M98 147l102 61 102-61M200 208v114"/><path d="m200 88-55 91 55 29 55-29Z"/></g><circle cx="200" cy="208" r="24"/>',
    scale:'<g class="p7-nested"><path d="M200 52 348 310H52Z"/><path d="m200 111 98 172H102Z"/><path d="m200 169 48 84h-96Z"/><circle cx="200" cy="225" r="12"/></g>',
    wave:'<g class="p7-waves"><path d="M40 140c40-100 40 100 80 0s40 100 80 0 40 100 80 0 40 100 80 0"/><path d="M40 200c40-100 40 100 80 0s40 100 80 0 40 100 80 0 40 100 80 0"/><path d="M40 260c40-100 40 100 80 0s40 100 80 0 40 100 80 0 40 100 80 0"/></g>',
    polarity:'<circle class="p7-polar-disc" cx="200" cy="200" r="118"/><path d="M200 82a59 59 0 0 1 0 118 59 59 0 0 0 0 118"/><circle cx="200" cy="141" r="9"/><circle cx="200" cy="259" r="9"/>',
    pendulum:'<path d="M86 109h228M200 79v31"/><g class="p7-pendulum"><path d="M200 110v157"/><circle cx="200" cy="282" r="20"/></g><path class="p7-track" d="M89 264q111 88 222 0"/>',
    causal:'<path class="p7-chain-line" d="m90 251 110-111 110 111"/><g class="p7-node p7-node-a"><circle cx="90" cy="251" r="23"/><circle cx="90" cy="251" r="7"/></g><g class="p7-node p7-node-b"><circle cx="200" cy="140" r="23"/><circle cx="200" cy="140" r="7"/></g><g class="p7-node p7-node-c"><circle cx="310" cy="251" r="23"/><circle cx="310" cy="251" r="7"/></g>',
    union:'<circle class="p7-union-a" cx="148" cy="200" r="85"/><path class="p7-union-b" d="m252 110 96 166H156Z"/><circle class="p7-union-center" cx="200" cy="200" r="23"/>',
    shadow:'<path class="p7-shadow-back" d="M200 65 311 137v128l-111 70L89 265V137Z"/><path class="p7-shadow-front" d="M200 65v270l111-70V137Z"/><path d="m146 167 27 18m54 0 27-18M169 255h62"/>',
    above:'<g class="p7-horizon"><path d="M52 263h296M89 290h222M128 314h144"/></g><g class="p7-triangle"><path d="M200 81 306 263H94Z"/><circle cx="200" cy="202" r="35"/></g>',
    below:'<g class="p7-horizon"><path d="M52 137h296M89 110h222M128 86h144"/></g><g class="p7-triangle"><path d="M200 319 306 137H94Z"/><circle cx="200" cy="198" r="35"/></g>',
    city:'<g class="p7-buildings"><path d="M66 304V182h55v122m0 0V110h62v194m0 0V64h58v240m0 0V151h58v153m0 0V210h36v94M48 304h304"/><path d="M84 204h18m-18 27h18m-18 27h18m38-120h23m-23 31h23m-23 31h23m-23 31h23m-23 31h23m39-163h22m-22 31h22m-22 31h22m-22 31h22m-22 31h22m-22 31h22m39-85h20m-20 31h20m-20 31h20"/></g>'
  };
  const titleSvg = `${item.title} — symbol ${number}`;
  const emblem = `<svg class="p7-emblem" viewBox="0 0 400 400" role="img" aria-label="${escape(titleSvg)}"><circle class="p7-outer" cx="200" cy="200" r="170"/><circle class="p7-orbit" cx="200" cy="200" r="148"/>${shapes[item.mode]}</svg>`;
  root.hidden = false;
  root.classList.add('portal-v7');
  root.dataset.portal = slug;
  root.dataset.mode = item.mode;
  root.style.setProperty('--p7-accent',item.color);
  root.innerHTML = `<div class="p7-grain" aria-hidden="true"></div><div class="p7-shell"><div class="p7-top"><a href="/" class="p7-brand" aria-label="CAISIK home">CAISIK<span>UNDERGROUND ALCHEMY</span></a><a class="p7-skip" href="/#${'film-'+item.chapter}">SKIP TO THE CHAPTER ↗</a></div><div class="p7-layout"><div class="p7-art"><span class="p7-serial">STREET SIGNAL / ${number} — XII</span><div class="p7-scene" style="--p7-value:0.5">${emblem}<span class="p7-mark" aria-hidden="true">${item.symbol}</span></div><div class="p7-control">${slider ? `<label for="p7-range">${item.action}</label><input id="p7-range" type="range" min="0" max="100" value="50" aria-describedby="p7-effect"><span id="p7-effect">Move the slider to explore the symbol.</span>` : `<button id="p7-reveal" type="button" aria-pressed="false">${item.action} <span aria-hidden="true">↗</span></button><span id="p7-effect">An original visual metaphor. Try it.</span>`}</div></div><div class="p7-copy"><span class="p7-kicker">YOU FOUND A SIGN / CHAPTER ${['portal','city','dissolution','principles','forge','drop'].indexOf(item.chapter)+1}</span><h1 id="portal-title">${item.title}</h1><p class="p7-intro">${item.intro}</p><div class="p7-meaning" id="p7-meaning"><p>${item.story}</p><span class="p7-reflect">A QUESTION TO CARRY</span><p class="p7-question">${item.reflection}</p></div><details class="p7-context"><summary>About this visual</summary><p>${item.meaning}</p></details><div class="p7-actions"><a class="p7-primary" href="/#film-${item.chapter}">ENTER ${item.chapterName} <span aria-hidden="true">↗</span></a>${item.learn?'<a class="p7-secondary" href="/#learn">EXPLORE THE PRINCIPLES ↗</a>':`<a class="p7-secondary" href="${item.link}">${item.collection.toUpperCase()} ↗</a>`}${item.pair?`<a class="p7-secondary" href="/q/${item.pair}/">FIND THE OTHER HALF ↗</a>`:''}</div></div></div><section class="p7-album" aria-labelledby="p7-album-title"><div><span class="p7-kicker">YOUR LOCAL SYMBOL ALBUM</span><h2 id="p7-album-title">A VISIT. A NEW PERSPECTIVE.</h2><p id="p7-album-count"></p><p class="p7-small">These are portal visits in this browser, not verified physical scans. No account is needed.</p></div><div class="p7-album-tools"><button id="p7-download" type="button">DOWNLOAD YOUR SYMBOL ↓</button><a href="/#album">OPEN MY ALBUM ↗</a></div><nav class="p7-symbols" aria-label="The twelve street portals">${portals.map((p,i)=>`<a href="/q/${p.slug}/" data-p7-symbol="${p.slug}" ${p.slug===slug?'aria-current="page"':''}><span aria-hidden="true">${p.symbol}</span><span class="p7-symbol-title">${p.title}</span><small>${String(i+1).padStart(2,'0')}</small></a>`).join('')}</nav></section><details class="p7-privacy"><summary>Campaign information &amp; privacy</summary><p>There is no third-party analytics or conversion tracking in this portal. The symbol album is stored only in this browser. If you choose, you can also save a local campaign history. Nothing in that history is sent to a server.</p><dl id="p7-campaign-data"></dl><div class="p7-consent-actions"><button id="p7-consent-yes" type="button">SAVE CAMPAIGN HISTORY LOCALLY</button><button id="p7-consent-no" type="button">CONTINUE WITHOUT CAMPAIGN HISTORY</button><button id="p7-history-clear" type="button">CLEAR CAMPAIGN HISTORY</button></div><p id="p7-consent-status" role="status"></p></details><p class="p7-footer">INDEPENDENT SPIRIT / RETURN TO THE WORLD CHANGED.</p><div id="p7-status" class="p7-sr" role="status" aria-live="polite"></div></div>`;
  const atlasChapters = {portal:'living-wall',city:'explorer',dissolution:'fieldnotes',principles:'principles',forge:'freestyle',drop:'living-wall'};
  const atlasNames = {portal:'THE LIVING WALL',city:'THE HIDDEN CITY',dissolution:'YOUR FIELDNOTES',principles:'THE SEVEN PRINCIPLES',forge:'THE FREQUENCY',drop:'THE LIVING WALL'};
  for (const link of root.querySelectorAll('a[href^="/#film-"]')) {
    link.setAttribute('href', '/#' + atlasChapters[item.chapter]);
    link.textContent = `EXPLORE ${atlasNames[item.chapter]} ↗`;
  }
  for (const link of root.querySelectorAll('a[href="/#drops"]')) link.setAttribute('href','/collections/underground-originals/');
  for (const link of root.querySelectorAll('a[href="/#album"]')) link.setAttribute('href','#p7-album-title');
  document.title = `${item.title} — CAISIK Street Signal ${number}`;
  root.setAttribute('role','region');
  root.setAttribute('aria-label',`Street portal: ${item.title}`);
  document.body.classList.add('has-portal-v7');
  const scene = root.querySelector('.p7-scene');
  const announce = text => { root.querySelector('#p7-status').textContent = text; };
  let active = false;
  if (slider) {
    const range = root.querySelector('#p7-range');
    const change = () => {
      const value = Number(range.value);
      scene.style.setProperty('--p7-value', String(value / 100));
      scene.style.setProperty('--p7-degrees', `${(value - 50) * 0.6}deg`);
      scene.style.setProperty('--p7-scale', String(0.65 + value / 130));
      scene.style.setProperty('--p7-wave',`${0.4 + (100 - value) / 70}s`);
      scene.classList.add('is-revealed');
      root.querySelector('#p7-effect').textContent = `${item.action}: ${value} / 100. This controls the illustration.`;
    };
    range.addEventListener('input',change);
    change();
  } else {
    root.querySelector('#p7-reveal').addEventListener('click', event => {
      active = !active;
      scene.classList.toggle('is-revealed',active);
      root.querySelector('.p7-meaning').classList.toggle('is-revealed',active);
      event.currentTarget.setAttribute('aria-pressed',String(active));
      event.currentTarget.innerHTML = `${active ? item.revealed : item.action} <span aria-hidden="true">↗</span>`;
      root.querySelector('#p7-effect').textContent = active ? 'The symbol has changed. Carry the question into the chapter.' : 'The symbol is ready to explore again.';
      announce(active ? item.reflection : 'Symbol reset.');
    });
  }
  let album = safeRead('caisik-album',[]);
  if (!Array.isArray(album)) album = [];
  const known = portals.map(p => p.slug);
  album = [...new Set(album.filter(x=>known.includes(x)))];
  if (!album.includes(slug)) { album.push(slug); safeWrite('caisik-album',album); }
  root.querySelector('#p7-album-count').textContent = `${album.length} / 12 portals visited on this browser.`;
  root.querySelectorAll('[data-p7-symbol]').forEach(a=>{
    if (album.includes(a.dataset.p7Symbol)) { a.classList.add('is-visited'); a.setAttribute('title',`${a.textContent.trim()} — visited in this browser`); }
  });
  root.querySelector('#p7-download').addEventListener('click',()=>{
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 760"><rect width="600" height="760" fill="#111211"/><g fill="none" stroke="${item.color}" stroke-width="2" transform="translate(100 100)"><circle cx="200" cy="200" r="170"/><circle cx="200" cy="200" r="148"/>${shapes[item.mode]}</g><g fill="${item.color}" font-family="Arial,sans-serif" text-anchor="middle"><text x="300" y="570" font-size="28" font-weight="bold">${escape(item.title)}</text><text x="300" y="615" font-size="14">CAISIK / STREET SIGNAL ${number} OF XII</text><text x="300" y="653" font-size="12">ORIGINAL DIGITAL SYMBOL / PORTAL VISIT</text></g></svg>`;
    const url = URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    const a = document.createElement('a'); a.href = url; a.download = `caisik-signal-${number}-${slug}.svg`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); announce('Your original digital symbol has been downloaded.');
  });
  // Restrict attribution data to short campaign labels; never store query strings wholesale.
  const params = new URLSearchParams(location.search);
  const attribution = {};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key=>{
    const value = params.get(key);
    if (value && /^[A-Za-z0-9 _./-]{1,80}$/.test(value)) attribution[key] = value;
  });
  root.querySelector('#p7-campaign-data').innerHTML = `<dt>Entry portal</dt><dd>${escape(slug)}</dd>${Object.entries(attribution).map(([k,v])=>`<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('') || '<dt>Campaign labels</dt><dd>None supplied in this address.</dd>'}`;
  const consentKey = 'caisik-campaign-consent-v7';
  const historyKey = 'caisik-campaign-history-v7';
  const consentStatus = root.querySelector('#p7-consent-status');
  const record = () => {
    const previous = safeRead(historyKey,[]);
    const history = Array.isArray(previous) ? previous.filter(h=>h && typeof h.portal==='string').slice(-49) : [];
    history.push({portal:slug, visitedAt:new Date().toISOString(), attribution});
    return safeWrite(historyKey,history);
  };
  const yes = root.querySelector('#p7-consent-yes');
  const updateConsent = saved => {
    yes.disabled = saved;
    consentStatus.textContent = saved ? 'Campaign history is enabled only on this browser. No data is sent. You can remove it below.' : 'Campaign history is off. You can explore every portal without enabling it.';
  };
  let consent = safeRead(consentKey,false) === true;
  if (consent) record();
  updateConsent(consent);
  yes.addEventListener('click',()=>{
    const ok = safeWrite(consentKey,true);
    if (ok && record()) { consent = true; updateConsent(true); }
    else consentStatus.textContent = 'Browser storage is unavailable. Campaign history was not saved.';
  });
  root.querySelector('#p7-consent-no').addEventListener('click',()=>{
    consent = false; safeRemove(consentKey); safeRemove(historyKey); updateConsent(false);
  });
  root.querySelector('#p7-history-clear').addEventListener('click',()=>{
    consent = false; safeRemove(consentKey); safeRemove(historyKey); updateConsent(false); consentStatus.textContent = 'Local campaign history was cleared. Campaign history is off.';
  });
})();
