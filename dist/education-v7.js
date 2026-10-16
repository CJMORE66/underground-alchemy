/* Incremental enrichment of the learning studio. Notes stay in page memory only. */
(() => {
  'use strict';
  const host = document.getElementById('learn');
  if (!host || host.dataset.eduV7Observer === 'on') return;
  host.dataset.eduV7Observer = 'on';
  const notes = Array(7).fill('');
  const workflow = { fabric: true, placement: false, inspection: 'pending' };
  const words = {
    cs: {
      eyebrow: 'Z OBRAZOVKY DO ŽIVOTA', title: 'Co si z toho odneseš?', label: 'Tvoje poznámka (nepovinné)',
      placeholder: 'Jedna situace. Jedna malá věc, kterou můžeš zkusit…',
      privacy: 'Poznámka zůstává jen v paměti otevřené stránky. Neodesílá se; obnovením stránky zmizí.',
      clear: 'Smazat poznámku', count: 'znaků',
      prompts: [
        'Vybav si jeden nedokončený projekt. Jaký jiný popis jeho současného stavu by ti pomohl určit konkrétní další krok, aniž bys popíral fakta?',
        'Který nápad bys chtěl převést z malého projektu na větší? Co je jen podobnost a kterou vlastnost budeš muset znovu ověřit?',
        'Jak můžeš v jednom vlastním návrhu nebo beatu změnit hustotu opakování? Co budeš opravdu pozorovat, místo abys tomu připisoval neověřené účinky?',
        'U které své tvůrčí volby vidíš jen dvě krajnosti? Existuje užitečný mezikrok, který můžeš vyzkoušet a porovnat?',
        'Který opakující se krok své práce můžeš pozorovat nebo zapisovat? Jaké údaje bys potřeboval, než ho začneš označovat za pravidelný cyklus?',
        'Vyber jeden výsledek, který chceš ovlivnit. Které dva různé vstupy k němu přispívají a co dalšího by mohlo vysvětlit nečekaný výsledek?',
        'U jednoho vlastního nápadu: jaký podnět ještě potřebuješ přijmout a jaké konkrétní tvůrčí rozhodnutí potom můžeš udělat ty sám?'
      ],
      graphEyebrow: 'MODELOVÁ DÍLNA / ZÁVISLOSTI A VĚTVENÍ', graphTitle: 'Jeden výsledek. Více vstupů.',
      graphIntro: 'Přepni vstupy a sleduj navazující kroky. Obě přípravy jsou v tomto modelu nutné; samotné schválení kontroly je nenahradí.',
      conditions: 'Změň podmínky modelu', fabric: 'Látka připravena', placement: 'Motiv umístěn', inspection: 'Výsledek kontroly vzorku', pending: 'Ještě nezkontrolováno', revise: 'Vrátit k úpravě', accept: 'Přijato',
      svgTitle: 'Graf závislostí přípravy potisku', svgDesc: 'Příprava látky a umístění motivu se spojují v kroku tisku. Následující kontrola větví postup na úpravu, čekání nebo přijetí. Šipky ukazují zjednodušené závislosti postupu.',
      nodeFabric: 'LÁTKA', nodePlacement: 'UMÍSTĚNÍ', nodePrint: 'TISK', nodeGate: 'KONTROLA', nodeRevise: 'UPRAVIT', nodeAccept: 'PŘIJMOUT', ready: 'připraveno', wait: 'čeká', blocked: 'blokováno', stageReady: 'krok dostupný', doCheck: 'nejdřív tisk', review: 'posouzení', yes: 'přijato', no: 'úprava',
      feedbackMissingBoth: 'Chybí oba vstupy. V modelu je tisk blokovaný přípravou látky i umístěním motivu; výběr kontroly toto pravidlo nezmění.',
      feedbackMissingFabric: 'Chybí příprava látky. Hotové umístění motivu samo nestačí: spojovací krok čeká na druhý vstup.',
      feedbackMissingPlacement: 'Chybí umístění motivu. Připravená látka sama nestačí: spojovací krok čeká na druhý vstup.',
      feedbackPending: 'Oba vstupy jsou připravené, krok tisku je dostupný. Kontrola zatím nemá výsledek, takže přijetí zůstává uzavřené.',
      feedbackRevise: 'Oba vstupy jsou připravené, ale kontrola vede do větve úprav. Změna rozhodnutí kontroly mění následující větev, ne předchozí vstupy.',
      feedbackAccept: 'V modelu jsou splněné obě přípravy a kontrola zvolila přijetí. To je dokončená cesta postupu, nikoli důkaz kvality skutečného potisku.',
      graphNote: 'Vlastní zjednodušený model pracovního postupu. Nepředpovídá kvalitu tisku, neměří materiál a nedokazuje univerzální příčinný zákon.'
    },
    en: {
      eyebrow: 'FROM THE SCREEN INTO YOUR LIFE', title: 'What will you take with you?', label: 'Your note (optional)',
      placeholder: 'One situation. One small thing you could try…',
      privacy: 'Your note stays only in this open page’s memory. It is not sent; reloading the page removes it.',
      clear: 'Clear note', count: 'characters',
      prompts: [
        'Think of one unfinished project. What other description of its current state could help you choose a concrete next step without denying the facts?',
        'Which idea would you like to move from a small project to a larger one? What is only a resemblance, and which property would need a fresh test?',
        'How could you change repetition density in one drawing or beat? What would you actually observe, rather than assign unverified effects to it?',
        'Which creative choice are you treating as only two extremes? Is there a useful intermediate option you could try and compare?',
        'Which repeated step in your work could you observe or record? What evidence would you need before calling it a regular cycle?',
        'Choose one result you want to influence. Which two different inputs contribute to it, and what else could explain an unexpected outcome?',
        'For one idea of your own, what further influence could you receive, and what concrete creative decision could you then make yourself?'
      ],
      graphEyebrow: 'MODEL WORKSHOP / DEPENDENCIES & BRANCHES', graphTitle: 'One outcome. Multiple inputs.',
      graphIntro: 'Change the inputs and follow the next steps. Both preparation steps are required in this model; selecting inspection approval cannot replace them.',
      conditions: 'Change the model conditions', fabric: 'Fabric prepared', placement: 'Artwork positioned', inspection: 'Sample inspection result', pending: 'Not inspected yet', revise: 'Return for revision', accept: 'Accepted',
      svgTitle: 'Print preparation dependency graph', svgDesc: 'Fabric preparation and artwork placement converge at printing. The following inspection branches into revision, waiting or acceptance. Arrows depict simplified workflow dependencies.',
      nodeFabric: 'FABRIC', nodePlacement: 'PLACEMENT', nodePrint: 'PRINT', nodeGate: 'INSPECT', nodeRevise: 'REVISE', nodeAccept: 'ACCEPT', ready: 'ready', wait: 'waiting', blocked: 'blocked', stageReady: 'step available', doCheck: 'print first', review: 'decision', yes: 'accepted', no: 'revision',
      feedbackMissingBoth: 'Both inputs are missing. Printing is blocked by fabric preparation and artwork placement; selecting an inspection result does not override that rule.',
      feedbackMissingFabric: 'Fabric preparation is missing. Finished placement alone is insufficient: the converging step waits for its other input.',
      feedbackMissingPlacement: 'Artwork placement is missing. Prepared fabric alone is insufficient: the converging step waits for its other input.',
      feedbackPending: 'Both inputs are ready, so the printing step is available. Inspection has no result yet, so the acceptance path remains closed.',
      feedbackRevise: 'Both inputs are ready, but inspection leads to the revision branch. Changing that decision changes the next branch, not the earlier inputs.',
      feedbackAccept: 'Both preparation steps are ready and inspection selects acceptance. This completes a workflow path; it does not establish the quality of an actual print.',
      graphNote: 'Our own simplified workflow model. It does not predict print quality, measure fabric or demonstrate a universal causal law.'
    }
  };
  function current() {
    const selected = host.querySelector('[data-lesson][aria-selected="true"]');
    const index = Number(selected?.dataset.lesson);
    return { index: Number.isInteger(index) && index >= 0 && index < 7 ? index : 0, lang: host.lang === 'en' ? 'en' : 'cs' };
  }
  function status(c) {
    if (!workflow.fabric && !workflow.placement) return c.feedbackMissingBoth;
    if (!workflow.fabric) return c.feedbackMissingFabric;
    if (!workflow.placement) return c.feedbackMissingPlacement;
    return workflow.inspection === 'accept' ? c.feedbackAccept : workflow.inspection === 'revise' ? c.feedbackRevise : c.feedbackPending;
  }
  function diagram(c) {
    const ready = workflow.fabric && workflow.placement;
    const accepted = ready && workflow.inspection === 'accept';
    const revising = ready && workflow.inspection === 'revise';
    const edge = (d, active, branch = false) => `<path d="${d}" class="edu-v7-edge${active ? ' is-live' : ''}${branch ? ' is-revision' : ''}" marker-end="url(#edu-v7-arrow)"/>`;
    const box = (x,y,w,h,title,subtitle,active) => `<g class="edu-v7-node${active ? ' is-ready' : ''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><text x="${x+w/2}" y="${y+26}" class="edu-v7-node-title">${title}</text><text x="${x+w/2}" y="${y+45}" class="edu-v7-node-state">${subtitle}</text></g>`;
    return `<svg viewBox="0 0 400 385" role="img" aria-labelledby="edu-v7-svg-title edu-v7-svg-desc"><title id="edu-v7-svg-title">${c.svgTitle}</title><desc id="edu-v7-svg-desc">${c.svgDesc}</desc><defs><marker id="edu-v7-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 8 4 0 8Z" fill="currentColor"/></marker></defs>
      ${edge('M102 77V100H200V116',workflow.fabric)}${edge('M298 77V100H200V116',workflow.placement)}${edge('M200 176V204',ready)}${edge('M174 250H102V300',revising,true)}${edge('M226 250H298V300',accepted)}
      ${box(29,17,146,60,c.nodeFabric,workflow.fabric ? c.ready : c.wait,workflow.fabric)}${box(225,17,146,60,c.nodePlacement,workflow.placement ? c.ready : c.wait,workflow.placement)}${box(126,116,148,60,c.nodePrint,ready ? c.stageReady : c.blocked,ready)}
      <g class="edu-v7-node${ready ? ' is-ready' : ''}"><path d="M200 204 254 250 200 296 146 250Z"/><text x="200" y="247" class="edu-v7-node-title">${c.nodeGate}</text><text x="200" y="266" class="edu-v7-node-state">${!ready ? c.doCheck : workflow.inspection === 'pending' ? c.wait : c.review}</text></g>
      ${box(29,309,146,60,c.nodeRevise,revising ? c.no : c.wait,revising)}${box(225,309,146,60,c.nodeAccept,accepted ? c.yes : c.wait,accepted)}
    </svg>`;
  }
  function graph(c) {
    const section = document.createElement('section');
    section.className = 'edu-v7-graph';
    section.setAttribute('aria-labelledby','edu-v7-graph-heading');
    section.innerHTML = `<div class="edu-v7-heading"><span>${c.graphEyebrow}</span><h3 id="edu-v7-graph-heading">${c.graphTitle}</h3><p>${c.graphIntro}</p></div><div class="edu-v7-graph-layout"><div class="edu-v7-diagram">${diagram(c)}</div><div class="edu-v7-graph-controls"><fieldset><legend>${c.conditions}</legend><div class="edu-v7-check"><input type="checkbox" id="edu-v7-fabric" data-edu-v7-control="fabric" ${workflow.fabric ? 'checked' : ''}><label for="edu-v7-fabric">${c.fabric}</label></div><div class="edu-v7-check"><input type="checkbox" id="edu-v7-placement" data-edu-v7-control="placement" ${workflow.placement ? 'checked' : ''}><label for="edu-v7-placement">${c.placement}</label></div><label class="edu-v7-select-label" for="edu-v7-inspection">${c.inspection}</label><select id="edu-v7-inspection" data-edu-v7-control="inspection"><option value="pending">${c.pending}</option><option value="revise">${c.revise}</option><option value="accept">${c.accept}</option></select></fieldset><p class="edu-v7-workflow-status" role="status" aria-live="polite">${status(c)}</p></div></div><p class="edu-v7-model-note">${c.graphNote}</p>`;
    section.querySelector('select').value = workflow.inspection;
    return section;
  }
  function mount() {
    const layout = host.querySelector('.learn-layout');
    if (!layout || host.querySelector('.edu-v7-reflection')) return;
    const {index,lang} = current(), c = words[lang];
    if (index === 5) layout.after(graph(c));
    const reflection = document.createElement('section');
    reflection.className = 'edu-v7-reflection';
    reflection.dataset.eduV7Lesson = String(index);
    reflection.setAttribute('aria-labelledby','edu-v7-reflect-title');
    reflection.innerHTML = `<div class="edu-v7-reflection-copy"><span class="edu-v7-eyebrow">${c.eyebrow}</span><h3 id="edu-v7-reflect-title">${c.title}</h3><p>${c.prompts[index]}</p></div><div class="edu-v7-note"><label for="edu-v7-note">${c.label}</label><textarea id="edu-v7-note" rows="3" maxlength="1200" autocomplete="off" spellcheck="false" aria-describedby="edu-v7-note-privacy" placeholder="${c.placeholder}"></textarea><div class="edu-v7-note-tools"><span class="edu-v7-note-count">${notes[index].length} / 1200 ${c.count}</span><button type="button" data-edu-v7-clear>${c.clear} ↺</button></div><p id="edu-v7-note-privacy">${c.privacy}</p></div>`;
    reflection.querySelector('textarea').value = notes[index];
    const graphSection = host.querySelector('.edu-v7-graph');
    (graphSection || layout).after(reflection);
  }
  host.addEventListener('input', event => {
    if (event.target.id !== 'edu-v7-note') return;
    const {index,lang} = current();
    notes[index] = event.target.value.slice(0,1200);
    host.querySelector('.edu-v7-note-count').textContent = `${notes[index].length} / 1200 ${words[lang].count}`;
  });
  host.addEventListener('change', event => {
    const control = event.target.dataset.eduV7Control;
    if (!['fabric','placement','inspection'].includes(control)) return;
    workflow[control] = control === 'inspection' ? (['pending','revise','accept'].includes(event.target.value) ? event.target.value : 'pending') : event.target.checked;
    const c = words[current().lang];
    host.querySelector('.edu-v7-diagram').innerHTML = diagram(c);
    host.querySelector('.edu-v7-workflow-status').textContent = status(c);
  });
  host.addEventListener('click', event => {
    if (!event.target.closest('[data-edu-v7-clear]')) return;
    const {index,lang} = current();
    notes[index] = '';
    const textarea = host.querySelector('#edu-v7-note');
    textarea.value = '';
    host.querySelector('.edu-v7-note-count').textContent = `0 / 1200 ${words[lang].count}`;
    textarea.focus({preventScroll:true});
  });
  document.addEventListener('caisik-learning-reset', () => {
    notes.fill(''); workflow.fabric = true; workflow.placement = false; workflow.inspection = 'pending';
    const textarea = host.querySelector('#edu-v7-note');
    if (textarea) { textarea.value = ''; host.querySelector('.edu-v7-note-count').textContent = `0 / 1200 ${words[current().lang].count}`; }
  });
  const observer = new MutationObserver(mount);
  observer.observe(host,{childList:true});
  mount();
})();
