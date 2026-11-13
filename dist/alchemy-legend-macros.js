/* Contact, articulation and suspension. Each insert can be scrubbed in either direction. */
const SVG = 'http://www.w3.org/2000/svg';
const clamp = value => Math.min(1, Math.max(0, value));
const ease = (a, b, p) => {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const f = x => Number(x.toFixed(2));
const repeat = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
let sequence = 0;

// 144 RMS windows from the existing six-second Czech rap take.
const rapEnvelope = [...'1100439a7628fb651ddcfcaaa2279545423111149512798959a9646776323332211105566caee9cc8d978bbbabcbb9613754525a514daa9953987888779864233321100000000000'].map(c => parseInt(c, 16) / 15);
function loudness(p) {
  const at = clamp(p) * (rapEnvelope.length - 1);
  const i = Math.floor(at);
  return rapEnvelope[i] + ((rapEnvelope[i + 1] ?? rapEnvelope[i]) - rapEnvelope[i]) * (at - i);
}

function materials(id) {
  return `<defs>
    <radialGradient id="${id}-air"><stop stop-color="#35251a"/><stop offset=".52" stop-color="#17120e"/><stop offset="1" stop-color="#080706"/></radialGradient>
    <linearGradient id="${id}-gold" x2=".87" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#fff19d"/><stop offset=".17" stop-color="#d79c38"/><stop offset=".39" stop-color="#674018"/><stop offset=".54" stop-color="#e5ad50"/><stop offset=".62" stop-color="#a16826"/><stop offset="1" stop-color="#352519"/></linearGradient>
    <linearGradient id="${id}-steel" x1="0" x2=".88" y1="0" y2="1"><stop stop-color="#171a18"/><stop offset=".23" stop-color="#b7ab8a"/><stop offset=".32" stop-color="#f8e9b3"/><stop offset=".44" stop-color="#4f5048"/><stop offset=".68" stop-color="#141613"/><stop offset=".83" stop-color="#968666"/><stop offset="1" stop-color="#29271e"/></linearGradient>
    <radialGradient id="${id}-ball" cx=".36" cy=".22" r=".83"><stop stop-color="#fffce7"/><stop offset=".1" stop-color="#d9cfa4"/><stop offset=".3" stop-color="#56584b"/><stop offset=".42" stop-color="#252a25"/><stop offset=".51" stop-color="#1e1c18"/><stop offset=".55" stop-color="#9b6828"/><stop offset=".72" stop-color="#e3b84e"/><stop offset=".84" stop-color="#514527"/><stop offset="1" stop-color="#161810"/></radialGradient>
    <linearGradient id="${id}-vinyl" x2=".52" y2="1"><stop stop-color="#090a0a"/><stop offset=".32" stop-color="#282924"/><stop offset=".59" stop-color="#10120f"/><stop offset=".79" stop-color="#24231e"/><stop offset="1" stop-color="#080908"/></linearGradient>
    <linearGradient id="${id}-skin" x1="0" x2=".78" y1="1" y2="0"><stop stop-color="#211411"/><stop offset=".58" stop-color="#513420"/><stop offset=".87" stop-color="#9f7043"/><stop offset="1" stop-color="#d69e5d"/></linearGradient>
    <linearGradient id="${id}-paint" x1="0" x2=".46" y1="1" y2="0"><stop stop-color="#3b1a0b"/><stop offset=".35" stop-color="#a74b16"/><stop offset=".7" stop-color="#b77926"/><stop offset="1" stop-color="#fac65b"/></linearGradient>
    <pattern id="${id}-mesh" width="7" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
      <rect width="7" height="8" fill="#302b22"/><path d="m-2-2 12 12m-19-12 12 12M9-2-2 10M2-2-9 10" stroke="#ad8a50" stroke-width="1.35"/>
      <path d="m-1 1 4 4m4-4 4 4M5 6 3 8" stroke="#e7cc83" stroke-width=".8"/>
    </pattern>
    <pattern id="${id}-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="m-2 7 9-9m0 9 5-5" fill="none" stroke="#140f0c" stroke-width="1.3"/></pattern>
    <clipPath id="${id}-can"><path d="M413 231Q413 211 432 200H568Q587 211 587 231V482Q586 497 573 501H427Q412 496 413 481Z"/></clipPath>
  </defs>`;
}

function stylusArt(id) {
  return `<g data-insert="stylus">
    <path d="M-700 305Q190 80 1320 265L1900 620H-800Z" fill="#171710" stroke="#6e4f29" stroke-width="2"/>
    <ellipse cx="115" cy="325" rx="733" ry="154" fill="#11120f" stroke="#695e42" stroke-width="3"/>
    <ellipse cx="115" cy="316" rx="732" ry="151" fill="url(#${id}-steel)"/>
    <g transform="translate(115 310) scale(1 .2)">
      <circle r="728" fill="url(#${id}-vinyl)" stroke="#c29955" stroke-width="5"/>
      ${repeat(86, i => `<circle r="${204 + 6.3 * i}" fill="none" stroke="${['#93856b','#4e5248','#58574a','#a09070'][i % 4]}" stroke-opacity="${i % 6 === 0 ? '.72' : '.52'}" stroke-width="${i % 7 === 0 ? 2.5 : 1.5}"/>`)}
      <circle r="622" fill="none" stroke="#c8ae77" stroke-width="3"/>
      <g data-part="record-turn">
        ${repeat(12, i => `<path d="M-41-223-72-720-35-722-13-223Z" transform="rotate(${i * 30 + (i % 4)*3})" fill="#fbe4a0" opacity="${i % 4 === 0 ? '.09' : '.034'}"/>`)}
        <circle r="198" fill="#6b431d" stroke="#d6a64d" stroke-width="5"/><circle r="179" fill="#211912" stroke="#80582e" stroke-width="3"/>
        <path d="M0-110 100 73H-100ZM0-65l62 112H-62Z" fill="none" stroke="#e9b65d" stroke-width="7"/>
        <circle r="14" fill="#e6d19b"/>
      </g>
    </g>
    <g data-part="needle-shadow"><ellipse cx="542" cy="402" rx="41" ry="3.4" fill="#070805" opacity=".66"/></g>
    <g data-part="arm">
      <path d="M1126 -22 1098 10 824 208 751 234 734 211 789 181Z" fill="url(#${id}-steel)" stroke="#1a1915" stroke-width="4"/>
      <path d="M812 192 854 163l13 18-44 30-33 12-9-15Z" fill="url(#${id}-gold)" stroke="#292014" stroke-width="3"/>
      ${repeat(7,i => `<path d="m${807+i*5} ${197-i*3.2} 9 15" stroke="#33271a" stroke-width="2"/>`)}
      <path d="m789 186 27 15-11 20-191 90-58 2-27-24 14-21 78-17Z" fill="url(#${id}-gold)" stroke="#241d14" stroke-width="4" stroke-linejoin="round"/>
      <path d="m551 274 66-18 170-66-10 12-163 76-58 9Z" fill="#1b1914" stroke="#c1924d" stroke-width="1.5"/>
      <path d="m548 294 59-7 30-15 14 15-26 35-78 22-23-15Z" fill="#36241a" stroke="#0e0d0b" stroke-width="4"/>
      <path d="m540 315 61-17 22 4-10 27-62 20-16-10Z" fill="#b76d28" stroke="#51351b" stroke-width="2"/>
      <path d="m543 319 63-18-6 5-58 19Z" fill="#f6bf64"/>
      <path d="m565 343 22-6 2 10-24 7Z" fill="#1a1711" stroke="#ad9154" stroke-width="1.4"/>
      <path d="M615 259c-21-2-37-15-24-29 11-14 15-18 11-30" fill="none" stroke="#aa8955" stroke-width="5"/>
      <path d="M600 275c-9-8-2-19 6-22s19 1 18 8-15 15-24 14Z" fill="#39352b" stroke="#dbc892" stroke-width="2"/>
      <path d="m604 269 14-10" stroke="#100f0c" stroke-width="2.5"/>
      <g data-part="cantilever">
        <path d="m575 346 5 1-40 42-6 5-2-4Z" fill="url(#${id}-steel)" stroke="#ddd3a9" stroke-width="1.1"/>
        <path d="m533 388 8 2-3 7-3 5-2-6-2-4Z" fill="#eedfa9" stroke="#544829" stroke-width="1.3"/>
        <path d="m535 391 3 1-3 9Z" fill="#fff9df"/>
      </g>
    </g>
    <ellipse data-part="contact" cx="535" cy="402" rx="14" ry="1.6" fill="#fff2b6"/>
  </g>`;
}

function voiceArt(id) {
  return `<g data-insert="voice">
    <svg width="1000" height="650" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="${id}-voice-blend">
          <stop offset=".45" stop-color="white"/><stop offset="1" stop-color="black"/>
        </radialGradient>
        <radialGradient id="${id}-voice-glint">
          <stop stop-color="#ffde7a" stop-opacity=".7"/><stop offset="1" stop-color="#ffbe46" stop-opacity="0"/>
        </radialGradient>
        <mask id="${id}-voice-jaw-mask" maskUnits="userSpaceOnUse" x="544" y="510" width="188" height="154">
          <ellipse cx="638" cy="586" rx="92" ry="75" fill="url(#${id}-voice-blend)"/>
        </mask>
        <mask id="${id}-voice-eye-mask" maskUnits="userSpaceOnUse" x="537" y="270" width="137" height="67">
          <ellipse cx="606" cy="303" rx="68" ry="33" fill="url(#${id}-voice-blend)"/>
        </mask>
      </defs>
      <image id="${id}-voice-art" data-part="voice-plate" width="1536" height="1024"/>
      <g mask="url(#${id}-voice-jaw-mask)">
        <use data-part="voice-jaw" href="#${id}-voice-art"/>
      </g>
      <g mask="url(#${id}-voice-eye-mask)">
        <use data-part="voice-eye" href="#${id}-voice-art"/>
      </g>
      <g data-part="voice-signal" fill="none" stroke-linecap="round">
        <path data-part="wave" stroke="#fada80" stroke-width="1.4"/>
        ${repeat(3, () => '<path data-pulse="" stroke="#fac663" stroke-width="1"/>')}
      </g>
      <ellipse data-part="grille-glint" cx="747" cy="552" rx="17" ry="24" fill="url(#${id}-voice-glint)"/>
      <circle data-part="fourth-beat" cx="757" cy="536" r="4" fill="url(#${id}-voice-glint)"/>
    </svg>
  </g>`;
}

function pigmentArt(id) {
  return `<g data-insert="pigment">
    <g data-part="vessel">
      <path d="M474 183v-15q1-6 7-8h35q8 2 9 9v14Z" fill="#d4bf92" stroke="#312b20" stroke-width="3"/>
      <path d="M478 171q18-5 39-1" fill="none" stroke="#f4e5b7" stroke-width="2"/>
      <ellipse cx="484" cy="172" rx="4" ry="3.4" fill="#25231c" stroke="#a18b61" stroke-width="1.4"/>
      <path d="M413 228q0-13 12-20l32-13 10-11h66l11 11 31 13q12 7 12 20v253q0 18-12 23-76 8-149 0-13-5-13-23Z" fill="url(#${id}-steel)" stroke="#b8ab86" stroke-width="2.8"/>
      <path d="M411 217q84-10 176 0v8q-85-10-176-1Zm1 269q84 12 176-1v8q-82 15-176 1Z" fill="url(#${id}-gold)" stroke="#352a1c" stroke-width="1.1"/>
      <path d="M456 196q46-10 88-1m-77-11q33-7 66 0" fill="none" stroke="#e1d4b1" stroke-width="2.3"/>
      <g clip-path="url(#${id}-can)">
        <rect x="414" y="208" width="174" height="301" fill="#282016"/>
        <path d="M500 202Q488 272 499 356l5 128" fill="none" stroke="#c5ad73" stroke-width="4.2" opacity=".57"/>
        <g data-part="fluid">
          <path data-part="liquid" fill="url(#${id}-paint)"/>
          <path data-part="meniscus" fill="none" stroke="#ffe09c" stroke-width="1.9"/>
          <g data-part="swirls" fill="none" stroke-linecap="round">
            ${['#592a17','#edac38','#894619','#ffce5d','#914226','#f2b34d','#773822'].map((c,i) => `<path stroke="${c}" stroke-width="${[11,6,7,2.8,4,3,1.8][i]}"/>`).join('')}
          </g>
          <g data-part="pigment-wake" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="#9a4b18" stroke-width="9"/><path stroke="#f6c963" stroke-width="2"/><path stroke="#ce822c" stroke-width="4"/>
          </g>
          <path data-part="sediment" fill="#69351b"/>
          <g fill="#ffe4a5" opacity=".66">${repeat(20,i=>`<circle data-fleck="" r="${f(.65+(i%4)*.24)}"/>`)}</g>
          <g data-part="pearl">
            <circle r="18" fill="url(#${id}-ball)" stroke="#624021" stroke-width="1.1"/>
            <path d="M-12-7q3-7 11-7m6.5 26 4-2.5" fill="none" stroke="#f9edb8" stroke-width="1.4" stroke-linecap="round"/>
          </g>
        </g>
        <g data-part="label">
          <rect x="413" y="214" width="175" height="290" fill="#191815"/>
          <path d="M413 216h174v62l-174 24Zm0 259 174-35v62H413Z" fill="url(#${id}-gold)"/>
          <path d="m414 303 172-25v8l-172 26Zm0 161 172-34v4l-172 35Z" fill="#f8cb65"/>
          <path d="m459 383 21-58 21 20 14-30 26 56-17 3-10-27-10 26-18-18-9 24Z" fill="#f6d370"/>
          <text x="500" y="410" text-anchor="middle" fill="#ead7a1" font-family="Arial,sans-serif" font-weight="900" font-style="italic" font-size="23" letter-spacing="-.9">MOLOTOW</text>
          <path d="M419 226q8 110-1 241m157-239q5 100-1 236" fill="none" stroke="#fdf2bc" stroke-width="3" opacity=".26"/>
        </g>
      </g>
      <path d="M413 233v248m174-248v248" stroke="#ccbb8b" stroke-width="3.2"/>
      <path d="M418 232v247m164-247v247" stroke="#795c3b" stroke-width="1.1"/>
    </g>
  </g>`;
}

export function createLegendMacros(document) {
  const id = 'ua-contact-' + ++sequence;
  const parser = new document.defaultView.DOMParser();
  const parsed = parser.parseFromString(`<svg xmlns="${SVG}" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice"
    aria-hidden="true" focusable="false" class="ua-film-macros"
    style="position:absolute;inset:0;width:100%;height:100%;max-width:none;pointer-events:none;display:none">
    ${materials(id)}<rect x="-1100" y="-800" width="3400" height="2400" fill="#090807"/>
    <ellipse cx="500" cy="310" rx="800" ry="490" fill="url(#${id}-air)"/>
    <g data-part="lens">${stylusArt(id)}${voiceArt(id)}${pigmentArt(id)}</g></svg>`, 'image/svg+xml');
  const element = document.importNode(parsed.documentElement, true);
  const parts = Object.fromEntries([...element.querySelectorAll('[data-part]')].map(n => [n.dataset.part,n]));
  const scenes = Object.fromEntries([...element.querySelectorAll('[data-insert]')].map(n => [n.dataset.insert,n]));
  const pulses = [...element.querySelectorAll('[data-pulse]')];
  const ribbons = [...parts.swirls.children];
  const wakeLines = [...parts['pigment-wake'].children];
  const flecks = [...element.querySelectorAll('[data-fleck]')];
  const set = (key, attr, value) => parts[key].setAttribute(attr, value);
  const lens = (x,y,z) => set('lens','transform',`translate(500 325) scale(${f(z)}) translate(${f(-x)} ${f(-y)})`);

  function drawStylus(p) {
    const landed = ease(.15,.46,p);
    const tracking = ease(.46,.55,p);
    const slide = Math.sin(p*39) * tracking;
    lens(560-25*landed, 320+67*landed, .84+.82*ease(.05,.72,p));
    set('arm','transform',`translate(0 ${f(-74*(1-landed))})`);
    set('cantilever','transform',`rotate(${f(-.7*slide)} 535 402)`);
    set('record-turn','transform',`rotate(${f(p*280+tracking*Math.sin(p*31)*12)})`);
    set('needle-shadow','opacity',f(.16+.78*landed));
    set('contact','opacity',f(Math.sin(Math.PI*ease(.46,.59,p))*.95+tracking*(.09+.06*slide)));
  }

  function drawVoice(p, voicePhase) {
    const phase = voicePhase ?? (.039 + .835 * p);
    const strength = loudness(phase);
    const syllable = strength * (.56 + .44 * Math.sin(phase * 117) ** 2);
    const lean = ease(.04, .82, p);
    const look = ease(.33, .48, phase) * (1 - ease(.82, .95, phase));
    lens(471 + lean * 4, 324 + lean * 6, 1.02 + lean * .11);
    // Local articulation borrows the original ink and shadows from the plate.
    set('voice-jaw', 'transform', `translate(0 ${f(-5 + syllable * 9)}) rotate(${f(syllable * 1.1)} 578 545)`);
    set('voice-eye', 'transform', `translate(${f(-look * 1.6)} ${f(strength * 2.5 - look * 1.5)})`);
    let wave = '';
    for (let i = 0; i <= 32; i++) {
      const u = i / 32;
      const crest = Math.sin(Math.PI * u) * Math.sin(u * 16 - phase * 220) * strength;
      wave += (i ? 'L' : 'M') + f(710 + 35 * u) + ' ' + f(550 + 4 * u + crest * 8);
    }
    set('wave', 'd', wave);
    set('voice-signal', 'opacity', f(strength * .93));
    pulses.forEach((pulse, i) => {
      const u = (phase * 17 + i / 3) % 1;
      const x = 710 + u * 31;
      const height = 2 + u * 11;
      pulse.setAttribute('d', `M${f(x)} ${f(551 - height)}q${f(height * .7)} ${f(height)} 0 ${f(height * 2)}`);
      pulse.setAttribute('opacity', f(Math.sin(Math.PI * u) * .68));
    });
    set('grille-glint', 'opacity', f(strength * .68));
    set('fourth-beat', 'opacity', f(ease(.70, .77, phase) * (1 - ease(.90, .97, phase))));
  }

  function drawPigment(p) {
    const open = ease(.074,.3,p);
    const mixed = ease(.23,.94,p);
    const beat = (p-.25)*Math.PI/.16;
    const travel = 2*Math.asin(Math.min(1,Math.max(-1,Math.cos(beat))))/Math.PI;
    const ballX = 500+68*travel;
    const ballY = 409 - 38*Math.sin(beat+.3) + 6*Math.cos(beat*2);
    const shake = Math.sin(beat);
    // Zoom through the printed sleeve while the cut edge and rolled metal seam retain depth.
    lens(500+(ballX-500)*.44*open, 329+62*open, .95+1.32*open+.14*mixed);
    set('vessel','transform',`rotate(${f(-12*(1-open)+3.5*shake)} 500 366) translate(${f(shake*3)} ${f(1.7*Math.cos(beat))})`);
    set('label','opacity',f(1-open));
    const top = 269 + 6*Math.sin(beat*.7);
    const tilt = 16*shake;
    const surface = `M407 ${f(top+tilt)}Q454 ${f(top-9-tilt)} 501 ${f(top+4*shake)}T593 ${f(top-tilt)}`;
    set('liquid','d',surface+'V512H407Z');
    set('meniscus','d',surface);
    set('sediment','d',`M408 ${f(454+mixed*37)}Q448 ${f(438+mixed*53)} 498 ${f(470+mixed*20)}T593 ${f(464+mixed*28)}V513H408Z`);
    set('sediment','opacity',f(.88-.76*mixed));
    ribbons.forEach((ribbon,i)=>{
      const base=311+i*24;
      let d='';
      for(let j=0;j<=45;j++) {
        const u=j/45, initialX=389+u*225;
        const wave=Math.sin(u*8+i*.6-beat*.8)*11+Math.sin(u*12+beat*.5+i*.5)*5;
        const dx=initialX-ballX, dy=base+wave-ballY;
        const swirl=3.25*Math.exp(-(dx*dx+dy*dy)/2200)*Math.sin(beat+.7)*open;
        const x=ballX+dx*Math.cos(swirl)-dy*Math.sin(swirl);
        const y=ballY+dx*Math.sin(swirl)+dy*Math.cos(swirl);
        d+=(j?'L':'M')+f(x)+' '+f(y);
      }
      ribbon.setAttribute('d',d);
      ribbon.setAttribute('opacity',f((.82-.48*mixed)*(i%2===1?.92:.75)));
    });
    // Pigment caught by the sphere peels into a winding trail after each strike.
    const direction=Math.tanh(4*Math.sin(beat));
    wakeLines.forEach((stroke,i)=>{
      let d='';
      for(let j=0;j<=34;j++) {
        const u=j/34, r=(8+i*2)*(1-u);
        const curl=7.5*u+beat+i*.75;
        const x=ballX+direction*(12+u*(57+i*5))+Math.cos(curl)*r;
        const y=ballY+7+Math.sin(curl)*r+u*(Math.cos(beat)*24+12)+Math.sin(u*6)*9;
        d+=(j?'L':'M')+f(x)+' '+f(y);
      }
      stroke.setAttribute('d',d);
      stroke.setAttribute('opacity',f((.58-.26*mixed)*Math.abs(direction)));
    });
    flecks.forEach((dot,i)=>{
      const u=(i*.61803398875)%1, layer=(i*.38196601125+i%3*.21)%1;
      dot.setAttribute('cx',f(422+155*u+6*Math.sin(beat+i)));
      dot.setAttribute('cy',f(300+173*layer+10*Math.cos(beat+u*7)));
      dot.setAttribute('opacity',f(.76-.37*mixed));
    });
    set('pearl','transform',`translate(${f(ballX)} ${f(ballY)})`);
  }

  let shown;
  let visibility = 0;
  let voiceReady = false;
  const updateOpacity = () => { element.style.opacity = shown === 'voice' && !voiceReady ? 0 : visibility; };
  parts['voice-plate'].addEventListener('load', () => {
    voiceReady = true;
    updateOpacity();
  }, { once: true });
  function prepareVoice() {
    const plate = parts['voice-plate'];
    if (!plate.hasAttribute('href')) plate.setAttribute('href', '/assets/alchemy-prologue/voice-portrait.webp');
  }

  function render(kind='', progress=0, voicePhase) {
    const selected=Object.hasOwn(scenes,kind)?kind:'';
    const p=clamp(progress);
    if (shown!==selected) {
      Object.entries(scenes).forEach(([name,scene])=>scene.setAttribute('display',name===selected?'inline':'none'));
      element.style.display=selected?'block':'none';
      shown=selected;
    }
    if(!selected) return;
    visibility = f(ease(0,.095,p)*(1-ease(.92,1,p)));
    if (selected === 'voice') prepareVoice();
    updateOpacity();
    if(selected==='stylus') drawStylus(p);
    else if(selected==='voice') drawVoice(p,voicePhase);
    else drawPigment(p);
  }

  render();
  return {element, render, prepareVoice};
}
