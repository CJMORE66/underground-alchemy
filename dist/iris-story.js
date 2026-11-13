/* Short scenes from the alchemist's field notebook. Each drawing stays with the work it introduces. */
(() => {
  'use strict';
  const mount = window.UAGuide?.mount;
  const main = document.querySelector('main');
  if (!mount || !main || window.CaisikStory) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const html = document.documentElement;
  const path = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  const languages = ['cs', 'en', 'fr'];
  // Each plate has one printable name and one original line spoken by the guide.
  const scenes = {
    home: [
      ['První světlo', 'First light', 'Première lueur'],
      ['Sedím, dokud neuslyším město. Pak zvednu lucernu. Tady začíná naše cesta.', 'I sit until I hear the city. Then I lift my lantern. Our walk starts here.', 'Je reste assis jusqu’à entendre la ville. Puis je lève ma lanterne. On part d’ici.']
    ],
    map: [
      ['Čára přes město', 'A line across town', 'Un trait dans la ville'],
      ['Na mapě spojuju dvě značky. Co mezi nimi uvidíš v ulici ty?', 'I join two marks on the map. What will you spot on the street between them?', 'Je relie deux repères sur la carte. Et toi, que verras-tu dans la rue entre les deux ?']
    ],
    principles: [
      ['Sedm pokusů', 'Seven experiments', 'Sept expériences'],
      ['V kapse mám sedm nástrojů. Vyber princip a jeden z nich vytáhnu.', 'I carry seven tools. Pick a principle and I’ll take one out.', 'J’ai sept outils en poche. Choisis un principe et j’en sortirai un.']
    ],
    frequency: [
      ['Kov, ticho, hlas', 'Metal, silence, voice', 'Métal, silence, voix'],
      ['Ťuknu do ladičky a nechám tón doznít. Do té mezery polož první slovo.', 'I strike the tuning fork and let the note fade. Put your first word in that gap.', 'Je frappe le diapason et laisse mourir la note. Pose ton premier mot dans ce silence.']
    ],
    selfmade: [
      ['Otevřená dílna', 'The open workshop', 'L’atelier ouvert'],
      ['Na ponk pokládám první matrici. Co bys zkusil otisknout po svém?', 'I lay the first block on the bench. What mark would you try printing?', 'Je pose la première matrice sur l’établi. Quelle empreinte as-tu envie d’essayer ?']
    ],
    expeditions: [
      ['Kapesní kompas', 'Pocket compass', 'Boussole de poche'],
      ['Ručička se ustálí. Zbytek cesty určí zvuk, pohyb nebo písmo, za kterým půjdeš.', 'The needle settles. Follow a sound, a movement or a letter. That choice sets our route.', 'L’aiguille se fixe. Suis un son, un geste ou une lettre. Ce choix tracera notre route.']
    ],
    dj: [
      ['Zpátky na cue', 'Back to the cue', 'Retour au point cue'],
      ['Přidržím desku na prvním kopáku. Pustím ji až ve chvíli, kdy jí druhá nechá místo.', 'I hold the record on the first kick. I let go when the other track leaves it room.', 'Je retiens le disque sur le premier kick. Je le lâche quand l’autre morceau lui laisse la place.']
    ],
    mc: [
      ['Místo na nádech', 'Room for a breath', 'Place au souffle'],
      ['Čtyři prsty, čtyři doby. Na třetí nechám pauzu. Stejný řádek najednou říká něco jiného.', 'Four fingers, four beats. I leave the third empty. The same line lands differently.', 'Quatre doigts, quatre temps. Je laisse le troisième vide. La même phrase change de sens.']
    ],
    writer: [
      ['Kostra písmene', 'The bones of a letter', 'L’ossature d’une lettre'],
      ['Začnu jedinou osou. Pootočím zápěstím. Mezera vedle tahu dá písmenu tvar.', 'I start with one axis. My wrist turns the nib and the gap beside the stroke becomes a letter.', 'Je pars d’un seul axe. Mon poignet fait pivoter la pointe et le vide près du trait dessine une lettre.']
    ],
    breaking: [
      ['Krok do kruhu', 'Step into the circle', 'Un pas dans le cercle'],
      ['Špička vyklepne kopák, rameno vezme snare. Na poslední dobu zastavím. Teď má místo další.', 'Toe on the kick, shoulder on the snare. I freeze on the last beat and leave room for the next dancer.', 'La pointe suit le kick, l’épaule prend la caisse claire. Je marque un arrêt et laisse entrer le suivant.']
    ],
    knowledge: [
      ['Druhé čtení', 'A second reading', 'Deuxième lecture'],
      ['Na jednu stranu píšu, co jsem viděl. Na druhou, co si o tom myslím. K oběma se zítra vrátím.', 'On one page I write what I saw. On the other, what I think it means. Tomorrow I’ll read both again.', 'Sur une page, je note ce que j’ai vu. Sur l’autre, ce que j’en pense. Demain je relirai les deux.']
    ],
    wall: [
      ['Tah na papíře', 'A stroke on paper', 'Un trait sur le papier'],
      ['Na zdi si prohlídnu roh písmene. Ve skicáku ho zkusím jedním tahem a změním úhel.', 'I study the corner of a letter on the wall. In my book I draw it in one stroke and change the angle.', 'Sur le mur, j’observe l’angle d’une lettre. Dans mon carnet je le trace d’un geste et je change son inclinaison.']
    ],
    art: [
      ['Stránka Blackbooku', 'A Blackbook page', 'Une page du Blackbook'],
      ['Otevřu skicák u starého tahu. Najdi v kresbě jednu mezeru, kterou by sis chtěl vyzkoušet.', 'I open my book at an old stroke. Find a gap in the drawing you’d like to try for yourself.', 'J’ouvre mon carnet sur un ancien trait. Repère un vide dans le dessin que tu aimerais explorer.']
    ],
    manifesto: [
      ['Pod průsvitkou', 'Under the tracing sheet', 'Sous le calque'],
      ['Na spodním listu je obrys ulice. Na průsvitku kreslím, co v ní čtu já. Oba listy můžeš zvednout.', 'The street outline is on the first sheet. I draw my reading on tracing paper. You can lift either page.', 'Le tracé de la rue est sur la première feuille. Sur le calque je dessine ma lecture. Tu peux soulever les deux.']
    ],
    sources: [
      ['Lupa nad zápisem', 'A lens on the record', 'La loupe sur la trace'],
      ['Posunu lupu k okraji stránky. Kdo ten záznam pořídil a kdy?', 'I move my lens to the margin. Who made this record, and when?', 'Je glisse la loupe vers la marge. Qui a laissé cette trace, et quand ?']
    ],
    notebook: [
      ['Inkoust zůstává', 'The ink stays', 'L’encre reste'],
      ['Vkládám mezi listy záložku. Sem se dá vrátit pro vlastní řádek, skicu nebo otázku.', 'I slip a marker between the pages. This is where you can return to a line, a sketch or a question of your own.', 'Je glisse un signet entre les pages. Ici tu pourras retrouver une phrase, un croquis ou une question à toi.']
    ],
    shop: [
      ['Otisk na látce', 'Ink meets cloth', 'L’encre sur le tissu'],
      ['Přitlačím matrici k látce. Po zvednutí ji poznáš podle stejného zlomu v čáře jako ve skicáku.', 'I press the block into the cloth. When I lift it, the same kink from the sketchbook survives in the print.', 'Je presse la matrice contre le tissu. Quand je la soulève, on retrouve dans l’empreinte la cassure du trait du carnet.']
    ],
    close: [
      ['Zavřít kruh', 'Closing the circle', 'Refermer le cercle'],
      ['Zaklapnu skicák a vracím lucernu na práh. Příště přines jednu vlastní stopu.', 'I close my book and leave the lantern at the door. Bring a mark of your own next time.', 'Je referme mon carnet et laisse la lanterne sur le seuil. La prochaine fois, apporte une trace à toi.']
    ],
    mentalism: [['Pozornost', 'Attention', 'Attention'], ['Posadím se. Z celého hluku si vyber jeden jediný zvuk.', 'I sit down. Pick one sound out of all that noise.', 'Je m’assieds. Dans tout ce bruit, choisis un seul son.']],
    correspondence: [['Dvě měřítka', 'Two scales', 'Deux échelles'], ['Přiložím malou kresbu k velké. Kde se vzor přestane shodovat?', 'I bring the small drawing up to the large one. Where does the pattern stop matching?', 'Je rapproche le petit dessin du grand. Où le motif cesse-t-il de coïncider ?']],
    vibration: [['Chvění', 'Tremor', 'Vibration'], ['Brnknu do kovu. Sleduj, jak se rozestup vln mění v čáru.', 'I pluck the metal. Watch the spaces between waves resolve into a line.', 'Je fais vibrer le métal. Regarde les intervalles entre les ondes se fondre en un trait.']],
    polarity: [['Dvě strany', 'Two sides', 'Deux faces'], ['Otočím minci. Který detail jsi předtím neviděl?', 'I turn the coin. Which detail was hidden before?', 'Je retourne la pièce. Quel détail était caché ?']],
    rhythm: [['Návrat', 'Return', 'Retour'], ['Pustím kyvadlo. Zkus zachytit okamžik, kdy se zastaví a vrátí.', 'I release the pendulum. Catch the moment it pauses and returns.', 'Je lâche le pendule. Repère l’instant où il s’arrête avant de repartir.']],
    'cause-effect': [['První pohyb', 'First motion', 'Premier mouvement'], ['Prstem postrčím první kolo. Sleduj dráhu až k poslednímu zubu.', 'I nudge the first gear. Follow the motion to the last tooth.', 'Je pousse le premier engrenage du doigt. Suis le mouvement jusqu’à la dernière dent.']],
    generation: [['Nový tvar', 'A new form', 'Une forme nouvelle'], ['Předám tvar z levé dlaně do pravé. Co mu přidáš při dalším průchodu?', 'I pass a form from my left palm to my right. What would you add on its next pass?', 'Je passe une forme de ma paume gauche à la droite. Qu’y ajouterais-tu au prochain passage ?']]
  };
  const principles = ['mentalism','correspondence','vibration','polarity','rhythm','cause-effect','generation'];
  const disciplines = ['dj','mc','writer','breaking','knowledge'];
  const words = {
    series: ['ALCHYMISTŮV DENÍK','THE ALCHEMIST’S JOURNAL','CARNET DE L’ALCHIMISTE'],
    replay: ['Přehrát gesto','Replay gesture','Rejouer le geste'],
    pause: ['Pozastavit pohyb průvodce','Pause guide motion','Mettre le guide en pause'],
    resume: ['Obnovit pohyb průvodce','Resume guide motion','Animer le guide']
  };
  const element = (tag, css) => Object.assign(document.createElement(tag), {className:css});
  const index = () => {const lang=(window.CaisikI18n?.getLanguage?.() || html.lang || 'en').split('-')[0];return languages.includes(lang)?languages.indexOf(lang):1;};
  const read = list => list[index()];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let manualPause = false;
  try { manualPause = localStorage.getItem('ua-iris-guide-pause') === '1'; } catch {}
  html.toggleAttribute('data-iris-guide-paused', manualPause);
  const disabled = () => manualPause || reduced.matches || html.dataset.motion === 'off' || ['off','calm','quiet','reduced'].includes(html.dataset.selfmadeMotion) || document.body.classList.contains('simple-mode') || document.body.dataset.expMode === 'field' || document.hidden;
  const rigAction = key => key === 'close' ? 'mentalism' : key;
  const slots = [];
  const zones = new Map();
  let lastSignature = '', active = null, raf = 0;
  function emit(key) {
    const label = read(scenes[key][0]);
    const action = rigAction(key);
    const signature = action+'|'+label;
    if (signature === lastSignature) return;
    lastSignature = signature;
    window.CaisikStory.current = {action, label};
    window.dispatchEvent(new CustomEvent('caisik:scene',{detail:{action,label}}));
  }
  function zone(node, key, slot = null) {
    if (!node || !scenes[key]) return;
    zones.set(node, {key, slot});
  }
  const buttons = {
    replay:'<svg viewBox="0 0 24 24"><path d="M5 9a7.5 7.5 0 1 1-.3 5M5 4v5h5"/></svg>',
    pause:'<svg viewBox="0 0 24 24"><path d="M8 5v14m8-14v14"/></svg>',
    resume:'<svg viewBox="0 0 24 24"><path d="m8 5 10 7-10 7Z"/></svg>'
  };
  function make(node, key, layout='panel', where='prepend') {
    if (!node) return;
    const el = element('aside','iris-vignette iris-'+layout);
    el.dataset.i18n = 'off'; el.dataset.textMotion = 'off';
    const visual=element('div','iris-illustration'), actor=element('div','iris-actor');
    visual.setAttribute('aria-hidden','true'); visual.append(actor);
    const story=element('div','iris-caption'), kicker=element('span','iris-kicker'), name=element('strong','iris-name'), line=element('p','iris-line');
    const tools=element('div','iris-playback');
    const replay=element('button','iris-control'), pause=element('button','iris-control');
    replay.type=pause.type='button'; replay.innerHTML=buttons.replay;
    tools.append(replay,pause); story.append(kicker,name,line); el.append(visual,story,tools);
    node[where](el);
    const slot={key,el,actor,kicker,name,line,replay,pause,rig:null,visible:false,awake:false};
    slots.push(slot); zone(el,key,slot);
    replay.addEventListener('click',()=>perform(slot));
    pause.addEventListener('click',()=>{
      manualPause=!manualPause;
      html.toggleAttribute('data-iris-guide-paused', manualPause);
      try {localStorage.setItem('ua-iris-guide-pause',manualPause?'1':'0');}catch{}
      applyMotion();
    });
    paint(slot);
    return slot;
  }
  function paint(slot) {
    const {key,el,kicker,name,line,replay,pause} = slot;
    el.dataset.scene = key; el.lang = languages[index()];
    kicker.textContent=read(words.series); name.textContent=read(scenes[key][0]); line.textContent=read(scenes[key][1]);
    el.setAttribute('aria-label',read(words.series)+' · '+name.textContent);
    replay.title=read(words.replay); replay.setAttribute('aria-label',replay.title);
    const paused=disabled(); pause.title=read(words[paused?'resume':'pause']); pause.setAttribute('aria-label',pause.title); pause.setAttribute('aria-pressed',String(paused));
    pause.innerHTML=buttons[paused?'resume':'pause']; pause.disabled=!manualPause&&disabled(); replay.disabled=disabled();
  }
  function ensure(slot) {
    if (!slot.rig) slot.rig=mount(slot.actor, slot.key==='home'&&!slot.awake?'mentalism':rigAction(slot.key));
  }
  function set(slot,key) {
    if (!slot || !scenes[key] || slot.key===key) return;
    slot.key=key; slot.rig?.setAction(rigAction(key)); paint(slot); zone(slot.el,key,slot);
  }
  function perform(slot) {
    if (!slot || disabled()) return;
    ensure(slot);
    if(slot.key==='home' && !slot.awake){slot.awake=true;slot.rig.setAction('home');}
    slot.rig.gesture(); slot.el.classList.remove('iris-flash'); void slot.el.offsetWidth; slot.el.classList.add('iris-flash');
  }
  function applyMotion() {
    for (const slot of slots){ paint(slot); slot.rig?.setPaused(disabled()||!slot.visible); }
  }
  function update() {
    raf=0;
    const focus=Math.min(innerHeight*.44,350);
    let chosen=null;
    for (const [node,data] of zones) {
      if(!node.isConnected||!node.getClientRects().length) continue;
      const r=node.getBoundingClientRect();
      if(r.top<=focus && r.bottom>focus) chosen=data;
    }
    if(!chosen) {
      let closest=Infinity;
      for(const slot of slots) if(slot.visible){const r=slot.el.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-focus);if(d<closest){chosen={key:slot.key,slot};closest=d;}}
    }
    if(chosen){active=chosen.slot; emit(active?.key||chosen.key);}
  }
  function schedule(){if(!raf) raf=requestAnimationFrame(update);}
  window.CaisikStory={current:null};
  let hero, play, study, chamber, expedition, catalog;
  const primary=$('#home.hero') || $('.play-hero');
  const discipline=disciplines.find(id=>path.endsWith('/'+id));
  if(primary && !primary.hasAttribute('data-film-epilogue')){
    hero=make(primary,path==='/play'?'selfmade':'home','hero','append');
    primary.classList.add('iris-hero-ready');
    zone(primary,hero.key,hero);
    const size = () => {const r=primary.getBoundingClientRect();primary.style.setProperty('--iris-hero-size',Math.round(Math.min(r.width,r.height*1.5))+'px');};
    size(); new ResizeObserver(size).observe(primary);
  }
  if($('#hidden-city')){
    for(const [sel,key] of [['.selfmade-entry','selfmade'],['.expeditions-entry','expeditions'],['#hidden-city','map'],['#principles','principles'],['#frequency','frequency'],['#living-wall','wall'],['#manifesto','manifesto'],['#methodology','sources']]){
      const target=$(sel); if(!target)continue;
      const slot = sel==='.selfmade-entry'||sel==='.expeditions-entry' ? make(target,key,'entry','append') :
        sel==='#principles' || sel==='#frequency' ? make(target,key,'panel','before') :
        make(target,key,sel==='#methodology'?'inline':'panel','before');
      zone(target,key,slot);
      if(key==='principles')study=slot;
      if(key==='frequency')chamber=slot;
    }
  } else if(path.startsWith('/expeditions')){
    const intro=$('.exp-hero-copy'); const lead=$('.exp-lead',intro);
    expedition=make(lead||intro,discipline||'expeditions','panel',lead?'after':'append'); zone($('.exp-hero'),expedition.key,expedition);
    const story=$('#story');
    if (story){
      const expStage=$('#exp-stage'); const storySlot=make($('.exp-stage-inner',expStage)||story,discipline||'expeditions','expstage','after');
      if(expStage)new MutationObserver(()=>{const id=expStage.dataset.activeChapter;if(disciplines.includes(id))set(storySlot,id);}).observe(expStage,{attributes:true,attributeFilter:['data-active-chapter']});
      for(const step of all('.exp-step',story))zone(step,disciplines.includes(step.dataset.chapter)?step.dataset.chapter:discipline||'expeditions');
    }
    for(const [sel,key] of [['#route','map'],['#blackbook','notebook'],['#sources','sources']]){const node=$(sel);const slot=make(node,key,'inline','before');zone(node,key,slot);}
  } else if(path==='/play' && $('#selfmade')){
    play=make($('.play-hud')||$('#selfmade'),'selfmade','panel','after');
    for(const [sel,key] of [['#base','selfmade'],['#quests','expeditions'],['#workshop','writer'],['#field','map'],['#journal','notebook'],['#principle-desk','principles'],['#sound-lab','frequency']])zone($(sel),key);
  } else if(path==='/shop'){
    catalog=make($('.shop-lead'),'shop','panel','after');zone($('.shop-hero'),'shop',catalog); zone($('#shop-collection'),'shop',catalog);zone($('#shop-cart'),'shop');
  } else if(path==='/art' || path==='/logo' || path.startsWith('/collections/')){
    const key=path==='/art'?'art':path==='/logo'?'writer':path.endsWith('the-kybalion')?'principles':path.endsWith('shadow-work')?'knowledge':path.endsWith('as-above-so-below')?'correspondence':'shop';
    const intro=path==='/logo'?$('#original-heading',main)||$('h1',main):$('h1',main);
    const slot=make(intro||main,key,'panel',intro?'after':'prepend');zone(path==='/logo'&&intro?.closest('section')||main,key,slot);
    if(path==='/logo'&&$('.iris-copy'))zone($('.iris-copy').closest('section'),'home');
  } else if(path==='/archive'){
    for(const [sel,key] of [['#start','home'],['#knowledge','knowledge'],['#freestyle','mc'],['#forge','shop'],['#journal','notebook']]){
      const node=$(sel);if(node){const slot=make(node,key,'inline','before');zone(node,key,slot);}
    }
    for(const [sel,key] of [['#cinema','home'],['#concepts','shop'],['#atelier','art'],['#philosophy','manifesto'],['#learn','principles'],['#lab','principles'],['#ritual','wall'],['#album','art'],['#chapters','expeditions'],['#styling','shop'],['#community','mc'],['#essentials','sources']])zone($(sel),key);
  } else if(path==='/play/roadmap'){const slot=make($('h1',main),'notebook','panel','after');zone(main,'notebook',slot);}
  if(!slots.length)return;
  const dialogs = new Map();
  for(const [id,key,anchor] of [['notebook-dialog','notebook','#notebook-title'],['sources-dialog','sources','#sources-title']]){
    const modal=document.getElementById(id);
    if(!modal)continue;
    const slot=make($(anchor,modal),key,'inline','after'); if(slot)dialogs.set(modal,slot);
  }
  document.addEventListener('toggle',e=>{
    const slot=dialogs.get(e.target);
    if(!slot)return;
    if(e.target.open){active=slot;emit(slot.key);}else schedule();
  },true);
  const foot=$('footer'); if(foot){const last=make(foot,'close','outro','before');zone(foot,'close',last);}
  // Use the current guide strip inside the active lesson, next to the action that changes it.
  function seatNear(slot,node,place='before'){if(slot&&node&&node!==slot.el&&node[place==='before'?'previousElementSibling':'nextElementSibling']!==slot.el)node[place](slot.el);}
  function placeLessons(){
    if(study)seatNear(study,$('#principles .ap-tabs'),'after');
    if(chamber)seatNear(chamber,$('#frequency .fl-heading'),'after');
  }
  const practice = $('#alchemist-practice');
  if (practice) {
    const modes = {breath:'principles', rhythm:'frequency', lettering:'wall'};
    zone(practice,'principles');
    practice.addEventListener('click', event => {
      const mode = event.target.closest('[data-performance-mode]')?.dataset.performanceMode;
      if (modes[mode]) { zone(practice,modes[mode]); emit(modes[mode]); }
    });
  }
  placeLessons();
  for(const id of ['principles','frequency']){
    const node=document.getElementById(id);
    if(node)new MutationObserver(placeLessons).observe(node,{childList:true});
  }
  const visibility=new IntersectionObserver(entries=>{
    for(const ent of entries){const slot=slots.find(item=>item.el===ent.target);if(!slot)continue;slot.visible=ent.isIntersecting;if(slot.visible)ensure(slot);slot.rig?.setPaused(!slot.visible||disabled());} schedule();
  },{threshold:0});
  for(const slot of slots)visibility.observe(slot.el);
  const first=slots[0];ensure(first);first.rig?.setPaused(disabled());active=first;emit(first.key);
  function selectedPrinciple(){
    const selected=$('#principles [data-principle][aria-selected=true]');const key=principles[Number(selected?.dataset.principle)];
    if(key && study){set(study,key);emit(key);perform(study);}
  }
  function currentWorkshop(){
    const selected=$('#workshop [data-discipline][aria-pressed=true]');return disciplines.includes(selected?.dataset.discipline)?selected.dataset.discipline:'writer';
  }
  function adjustPanel(id){
    const target=document.getElementById(id);if(!play||!target)return;
    const key=({base:'selfmade',quests:'expeditions',workshop:currentWorkshop(),field:'map',journal:'notebook'})[id];
    if(!key)return;
    const tabs= id==='workshop'?$('.ws-tabs',target):null;
    if(tabs)seatNear(play,tabs,'after');else seatNear(play,$('.play-hud'),'after');
    set(play,key);zone(target,key,play);emit(key);perform(play);
  }
  window.addEventListener('caisik:panel',e=>requestAnimationFrame(()=>adjustPanel(e.detail?.panel)));
  const workshop=$('#workshop');
  if(workshop)new MutationObserver(()=>{if(workshop.querySelector('.ws-tabs')&&!workshop.hidden)adjustPanel('workshop');}).observe(workshop,{childList:true});
  document.addEventListener('click',e=>{
    const el=e.target.closest?.('button,a,select'); if(!el || el.closest('.iris-vignette'))return;
    if(el.matches('[data-principle]')){requestAnimationFrame(selectedPrinciple);return;}
    if(el.matches('[data-discipline]')&&play){requestAnimationFrame(()=>adjustPanel('workshop'));return;}
    if(el.matches('.alchemy-awaken'))perform(hero);
    else if(el.matches('#fl-pulse-start,#fl-record,#fl-stop,#fl-shuffle,[data-fl-mode]'))perform(chamber);
    else if(el.closest('.exp-hero')||el.matches('[data-route-next]'))perform(expedition);
    else if(el.matches('[data-shop-view],[data-shop-product]'))perform(catalog);
    else if(el.matches('[data-open-place],[data-map-place],[data-route],[data-route-stop],[data-art-open],[data-art]'))perform(zones.get(el.closest('section[id]'))?.slot);
    else if(el.closest('#workshop')&&el.hasAttribute('data-action'))perform(play);
  });
  document.addEventListener('keyup',e=>{if(e.target.closest?.('.ap-tabs')&&['ArrowLeft','ArrowRight','End','Home'].includes(e.key))selectedPrinciple();});
  window.addEventListener('caisik:engine',e=>{if(e.detail?.open){const slot=slots.find(s=>s.visible&&s===active)||slots.find(s=>s.visible);perform(slot);}});
  window.addEventListener('caisik:languagechange',()=>{lastSignature='';slots.forEach(paint);emit(active?.key||first.key);schedule();});
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',applyMotion);reduced.addEventListener('change',applyMotion);
  const prefs=new MutationObserver(applyMotion);
  prefs.observe(html,{attributes:true,attributeFilter:['data-motion','data-selfmade-motion']});
  prefs.observe(document.body,{attributes:true,attributeFilter:['class','data-exp-mode']});
})();
