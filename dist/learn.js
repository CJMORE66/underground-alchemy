/* CAISIK Learning Studio — original bilingual exercises, no external dependencies. */
(() => {
  'use strict';
  const host = document.getElementById('learn');
  if (!host) return;
  const key = 'caisik-learning';
  const source = 'https://www.gutenberg.org/cache/epub/14209/pg14209-images.html';
  const archive = 'https://archive.org/details/kybalionstudyofh00thre';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let language = 'cs', current = 0, completed = [], storageOK = true;
  let exercise = 50, perspective = false, chain = 0, creative = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    language = saved.language === 'en' ? 'en' : 'cs';
    current = Number.isInteger(saved.current) && saved.current >= 0 && saved.current < 7 ? saved.current : 0;
    completed = Array.isArray(saved.completed) ? [...new Set(saved.completed.filter(n => Number.isInteger(n) && n >= 0 && n < 7))] : [];
  } catch (_) { storageOK = false; }
  const copy = {
    cs: {
      kicker: 'THE LEARNING STUDIO / 7 PRINCIPŮ', title: 'NEJEN NOSIT.\nTAKY POCHOPIT.',
      intro: 'Symbol má větší sílu, když víš, co znamená. Vyber princip, vyzkoušej malý experiment a ověř si, čemu rozumíš.',
      historyTitle: 'Nejdřív kontext.',
      history: 'Kybalion vyšel v roce 1908 pod jménem Three Initiates. Je to moderní hermetický text, nikoli dochovaná kniha starověkých Egypťanů. Jeho „univerzální zákony“ čteme jako filozofii, ne jako experimentálně prokázané fyzikální zákony.',
      our: 'Příklady a cvičení níže jsou naše současné interpretace pro tvorbu a každodenní rozhodování.',
      completed: 'pochopeno', progress: 'Postup studiem', saved: 'Postup se ukládá v tomto prohlížeči.', unsaved: 'Ukládání není dostupné. Postup funguje po dobu této návštěvy.', reset: 'Začít znovu',
      lesson: 'LEKCE', book: 'Myšlenka knihy', example: 'V každodenním životě', try: 'Vyzkoušej to', misconception: 'Častý omyl', question: 'OVĚŘ SI POROZUMĚNÍ', prompt: 'Vyber jednu odpověď. Chyba je součást učení.', correct: 'Přesně.', retry: 'Zkus to znovu.', next: 'Další princip', previous: 'Předchozí', allDone: '7 / 7 — VŠECHNY PRINCIPY PROZKOUMÁNY', doneText: 'Teď umíš oddělit metaforu od tvrzení. Vyber si princip, který chceš dál promýšlet.', lab: 'Otevřít vizuální laboratoř ↗',
      sourceTitle: 'Čti zdroje. Udělej si vlastní názor.', sourceBook: 'Původní text · kapitola II', sourceDate: 'Digitalizované vydání · 1908', sourcesNote: 'Vlastní stručné parafráze. Historické názory knihy nepřebíráme jako vědecký důkaz.',
      state: 'Změň pohled', scale: 'Velikost vzoru', frequency: 'Hustota vlny', tone: 'Světlost', phase: 'Poloha kyvadla', start: 'Další krok procesu', restart: 'Zopakovat proces', receive: '1. Sbírat podněty', create: '2. Vytvořit kompozici',
      switchNote: 'Jeden tvar. Dvě interpretace. Obraz se nezměnil, popisek ano.', scaleNote: 'Podobný vzor v jiné velikosti je analogie. Sám o sobě nedokazuje stejný mechanismus.', waveNote: 'Posuvník mění počet vln v kresbě. Neměří energii, emoce ani člověka.', toneNote: 'Mezi černou a bílou leží mnoho odstínů. Ne každý protiklad ale tvoří jednu stupnici.', phaseNote: 'Kyvadlo ovládáš ručně. Je to ilustrace cyklu, nikoli předpověď života.', chainNote: 'Náš zjednodušený postup ukazuje závislost kroků. Reálný výsledek ovlivňují i další podmínky.', creativeNote: 'Střídej přijímání podnětů a rozhodnutí. Obě činnosti jsou dostupné komukoli.',
      square: 'ČTVEREC?', diamond: 'KOSOČTVEREC?', observe: 'Podněty: oblouk / bod / linka', composition: 'Podněty uspořádané do vlastního znaku',
      chain: ['Připrav látku', 'Umísti motiv', 'Proveď tisk', 'Zkontroluj výsledek'], idle: 'Připraveno začít',
      lessons: [
        { name: 'Mentalismus', en: 'MENTALISM', symbol: '◈', insight: 'Kniha chápe základ světa jako mysl.', example: 'Před tebou je návrh potisku. „To je chyba“ a „to je začátek další verze“ jsou dva různé popisy stejného nedokončeného návrhu. Další úprava stále vyžaduje skutečnou práci.', task: 'Přepni popisek stejného geometrického tvaru. Všimni si rozdílu mezi objektem a jeho výkladem.', misconception: 'Pouhá myšlenka nezaručuje výsledek a nedává člověku kontrolu nad okolnostmi.', question: 'Co ukazuje změna popisku u stejného tvaru?', answers: ['Pohled může změnit interpretaci stejného podnětu.', 'Myšlenka fyzicky přestavěla obrázek.', 'Za každou událost může naše nastavení mysli.'], correct: 0, yes: 'Tvar zůstal stejný. Změnil se způsob, jakým jsme ho popsali.', no: 'Porovnej obrys před přepnutím a po něm. Obraz je stejný; mění se výklad, nikoli materiál.' },
        { name: 'Korespondence', en: 'CORRESPONDENCE', symbol: '↕', insight: 'Kniha hledá podobnosti mezi různými úrovněmi existence.', example: 'Rozvržení malého štítku může inspirovat velký plakát. Podobná kompozice ale neznamená, že oba formáty mají stejnou čitelnost nebo výrobní nároky.', task: 'Změň velikost opakovaného vzoru. Rozliš, co zůstalo podobné a co by bylo potřeba ověřit v reálném tisku.', misconception: 'Podobnost dvou věcí není důkaz stejné příčiny, účinku nebo vlastností.', question: 'Co můžeš odvodit z podobnosti dvou vzorů?', answers: ['Všechny jejich vlastnosti musí být stejné.', 'Podobnost je vodítko k otázce, ne hotový důkaz.', 'Menší vzor vždy přesně předpoví výsledek velkého.'], correct: 1, yes: 'Analogie pomůže vytvořit hypotézu. Další vlastnosti je potřeba prověřit.', no: 'Vzhled může být podobný, i když materiál nebo funkce nejsou. Z podobnosti vzniká otázka, kterou ověříš.' },
        { name: 'Vibrace', en: 'VIBRATION', symbol: '≋', insight: 'Kniha popisuje proměnu prostřednictvím metafyzických vibrací.', example: 'Při kreslení změň rozestupy čar. Motiv může působit hustě nebo vzdušně. Tato práce s obrazovým rytmem není měřením duševního stavu.', task: 'Zhušťuj kreslenou vlnu. Sleduj měnící se počet opakování, nikoli domnělou „frekvenci člověka“.', misconception: 'Fyzikální frekvence má definovanou veličinu a jednotky. „Vyšší vibrace“ osobnosti tady neměříme.', question: 'Co skutečně ovládá tento posuvník?', answers: ['Úroveň vědomí návštěvníka.', 'Léčivou energii obrazovky.', 'Počet opakování nakreslené vlny.'], correct: 2, yes: 'Ovládáš vizuální parametr kresby. Z obrázku nelze vyvozovat osobní nebo zdravotní vlastnosti.', no: 'Jde o kreslenou animaci. Ovladač pracuje s počtem vln, neposkytuje údaje o člověku.' },
        { name: 'Polarita', en: 'POLARITY', symbol: '◐', insight: 'Kniha chápe některé protiklady jako stupně společného jevu.', example: 'U černobílého návrhu můžeš plynule měnit odstín. Praktická otázka je, při jaké kombinaci zůstává motiv dobře čitelný.', task: 'Projeď stupnici od tmavé po světlou. Uprostřed hledej přechody, ne okamžitý přepínač.', misconception: 'Není doloženo, že všechny rozdíly a hodnoty tvoří jedinou stupnici. Metafora neomlouvá škodlivé jednání.', question: 'Jaké tvrzení je v této ukázce podložené?', answers: ['Mezi černou a bílou můžeme vykreslit odstíny šedi.', 'Všechny názory jsou stejně pravdivé.', 'Každé dva protiklady mají totožné důsledky.'], correct: 0, yes: 'Vykreslené odstíny lze přímo pozorovat. Silnější tvrzení z nich nevyplývají.', no: 'Zůstaň u toho, co ukázka opravdu obsahuje: přechod odstínů. Nevypovídá o pravdivosti názorů.' },
        { name: 'Rytmus', en: 'RHYTHM', symbol: '⌁', insight: 'Kniha zdůrazňuje cykly a střídání protichůdných pohybů.', example: 'Při práci na kolekci se střídá navrhování, kontrola a úpravy. Můžeš si pro ně vytvořit plán, aniž bys předpokládal přesný univerzální cyklus.', task: 'Posuň kyvadlo od jedné strany ke druhé. Zastav ho v libovolném bodě a popiš, v jaké fázi je.', misconception: 'Život ani historie nemusí kopírovat pravidelnou sinusovku. Tato animace není předpověď.', question: 'Co je rozumné odvodit z kresleného kyvadla?', answers: ['Přesné datum další životní změny.', 'Ilustruje střídání fází; k předpovědi reality nestačí.', 'Každý neúspěch nutně vyváží stejně velký úspěch.'], correct: 1, yes: 'Kyvadlo je srozumitelný model opakování. Skutečný systém by potřeboval vlastní data a ověření.', no: 'Kresba znázorňuje cyklus, ale nemá data o budoucnosti. Rozliš ilustraci a předpověď.' },
        { name: 'Příčina a následek', en: 'CAUSE & EFFECT', symbol: '→', insight: 'Kniha představuje dění jako řetězení příčin a následků.', example: 'Správné umístění motivu je jeden krok před tiskem. O výsledku ale rozhoduje i látka, zařízení a provedení; jediný krok nevysvětluje úplně všechno.', task: 'Postupně spusť čtyři kroky přípravy potisku. Sleduj, jak výstup jednoho kroku vstupuje do dalšího.', misconception: 'To, že dvě věci nastaly po sobě, samo nedokazuje příčinu. Nepříznivý výsledek není důkaz osobního selhání.', question: 'Co potřebuješ k doložení vztahu příčiny a následku?', answers: ['Stačí, že jedna věc nastala dřív.', 'Stačí silné přesvědčení.', 'Důkazy a prověření dalších možných vysvětlení.'], correct: 2, yes: 'Časové pořadí je jen část obrázku. Je potřeba prověřovat mechanismus i jiné vlivy.', no: 'Pořadí událostí samo nestačí. Hledej doklady, mechanismus a další možné příčiny.' },
        { name: 'Tvořivý princip', en: 'GENDER / CREATION', symbol: '✧', insight: 'Kniha popisuje tvoření dobovým „mužským“ a „ženským“ principem (Gender).', example: 'Nejdřív nasbíráš tvary, reference a poznámky. Potom z nich vybereš a složíš vlastní motiv. Příjem podnětů i aktivní tvorba patří všem lidem.', task: 'Přepni mezi sbíráním podnětů a sestavením kompozice. Sleduj dvě části jednoho tvůrčího procesu.', misconception: 'Gender je zde historický termín knihy. Naše tvořivá metafora neurčuje pohlaví, identitu, vlastnosti ani společenské role.', question: 'Jak zde používáme princip tvorby?', answers: ['Jako metaforu přijímání podnětů a aktivního formování pro kohokoli.', 'Jako pravidlo, kdo smí tvořit a kdo musí poslouchat.', 'Jako vědecký test identity člověka.'], correct: 0, yes: 'Obě činnosti může dělat kdokoli. Metafora slouží k přemýšlení o tvorbě, ne k dělení lidí.', no: 'Tato lekce neklasifikuje lidi. Střídá dvě činnosti, které jsou přístupné každému.' }
      ]
    },
    en: {
      kicker: 'THE LEARNING STUDIO / 7 PRINCIPLES', title: 'WEAR THE SYMBOL.\nKNOW THE STORY.',
      intro: 'A symbol means more when you understand it. Explore a principle, try a small experiment and check what you learned.',
      historyTitle: 'Context first.',
      history: 'The Kybalion was published in 1908 as Three Initiates. It is a modern Hermetic text, not a surviving book from ancient Egypt. Its “universal laws” are philosophy, not experimentally established laws of physics.',
      our: 'The examples and exercises below are our contemporary interpretations for creative work and everyday decisions.',
      completed: 'understood', progress: 'Learning progress', saved: 'Progress is saved in this browser.', unsaved: 'Storage is unavailable. Progress works for this visit.', reset: 'Start again',
      lesson: 'LESSON', book: 'The book’s idea', example: 'In everyday life', try: 'Try it', misconception: 'Common misconception', question: 'CHECK YOUR UNDERSTANDING', prompt: 'Choose one answer. Mistakes are part of learning.', correct: 'Exactly.', retry: 'Try again.', next: 'Next principle', previous: 'Previous', allDone: '7 / 7 — ALL PRINCIPLES EXPLORED', doneText: 'You can now separate a metaphor from a claim. Choose a principle to keep exploring.', lab: 'Open the visual laboratory ↗',
      sourceTitle: 'Read the sources. Make up your own mind.', sourceBook: 'Original text · chapter II', sourceDate: 'Digitised edition · 1908', sourcesNote: 'Brief original paraphrases. The historical book’s views are not presented as scientific evidence.',
      state: 'Change perspective', scale: 'Pattern size', frequency: 'Wave density', tone: 'Lightness', phase: 'Pendulum position', start: 'Next process step', restart: 'Repeat the process', receive: '1. Gather influences', create: '2. Make a composition',
      switchNote: 'One shape. Two interpretations. The drawing stayed the same; its label changed.', scaleNote: 'A similar pattern at another scale is an analogy. It does not prove an identical mechanism.', waveNote: 'The slider changes the number of drawn waves. It does not measure energy, emotion or a person.', toneNote: 'Many shades lie between black and white. Not every contrast belongs on one scale.', phaseNote: 'You control the pendulum manually. It illustrates a cycle, not a prediction about life.', chainNote: 'Our simplified workflow shows dependent steps. Other conditions also affect a real result.', creativeNote: 'Alternate receiving influences and making choices. Both activities are open to everyone.',
      square: 'A SQUARE?', diamond: 'A DIAMOND?', observe: 'Influences: arc / dot / line', composition: 'Influences arranged into your own symbol',
      chain: ['Prepare fabric', 'Position artwork', 'Apply print', 'Check the result'], idle: 'Ready to start',
      lessons: [
        { name: 'Mentalism', en: 'MENTALISM', symbol: '◈', insight: 'The book treats mind as the foundation of existence.', example: 'A print sketch sits in front of you. “A mistake” and “the start of another version” describe the same unfinished drawing differently. Improving it still takes actual work.', task: 'Switch the label on the same geometric shape. Notice the difference between an object and its interpretation.', misconception: 'A thought alone does not guarantee results or give someone control over their circumstances.', question: 'What does changing the label on the same shape demonstrate?', answers: ['Perspective can change how we interpret the same input.', 'A thought physically rebuilt the drawing.', 'Our mindset causes every event.'], correct: 0, yes: 'The shape stayed the same. We changed how we described it.', no: 'Compare the outline before and after. The drawing is unchanged; its interpretation changed.' },
        { name: 'Correspondence', en: 'CORRESPONDENCE', symbol: '↕', insight: 'The book proposes similarities between levels of existence.', example: 'A small label layout can inspire a large poster. Similar composition does not imply identical readability or manufacturing requirements.', task: 'Change the size of the repeated pattern. Consider what stays similar and what would need a real print test.', misconception: 'Resemblance is not proof of an identical cause, effect or set of properties.', question: 'What can you infer from two similar patterns?', answers: ['All their properties must be identical.', 'Similarity suggests a question; it does not prove an answer.', 'The smaller always predicts the larger exactly.'], correct: 1, yes: 'An analogy can suggest a hypothesis. Further properties still need testing.', no: 'Appearance may be similar while material or function differ. Similarity gives you something to investigate.' },
        { name: 'Vibration', en: 'VIBRATION', symbol: '≋', insight: 'The book explains change using metaphysical vibrations.', example: 'Adjust the distance between lines in a drawing. The result looks dense or airy. Working with visual rhythm does not measure a state of mind.', task: 'Increase the density of the drawn wave. Observe the repetitions, rather than an imagined “human frequency”.', misconception: 'A physical frequency has a defined quantity and units. This exercise does not measure a person’s “higher vibrations”.', question: 'What does this slider actually control?', answers: ['The visitor’s level of consciousness.', 'Healing energy from the screen.', 'The number of repetitions in a drawn wave.'], correct: 2, yes: 'You control a visual parameter. The drawing tells us no personal or medical facts about someone.', no: 'This is a visual illustration. The control changes drawn waves and provides no information about a person.' },
        { name: 'Polarity', en: 'POLARITY', symbol: '◐', insight: 'The book treats some opposites as degrees of one phenomenon.', example: 'You can adjust the tone of a monochrome design continuously. A useful design question is where the motif remains legible.', task: 'Move from dark to light. Look for gradual shades rather than an instant switch.', misconception: 'Not every distinction or value belongs on a single scale. A metaphor does not justify harmful behaviour.', question: 'Which claim is supported by this demonstration?', answers: ['We can draw shades of grey between black and white.', 'All opinions are equally true.', 'Every pair of opposites has identical consequences.'], correct: 0, yes: 'You can observe the rendered shades directly. They do not establish broader claims.', no: 'Stay with what the example shows: a range of tones. It makes no claim about the truth of opinions.' },
        { name: 'Rhythm', en: 'RHYTHM', symbol: '⌁', insight: 'The book emphasises cycles and alternating movement.', example: 'Developing a collection alternates between drafting, reviewing and revising. You can plan these activities without assuming a universal fixed cycle.', task: 'Move the pendulum from one side to the other. Stop at any point and describe its position.', misconception: 'Life and history do not have to follow a regular sine wave. This animation is not a prediction.', question: 'What is reasonable to conclude from this drawn pendulum?', answers: ['The exact date of your next life change.', 'It illustrates alternating phases but cannot predict reality.', 'Every setback must be balanced by equal success.'], correct: 1, yes: 'A pendulum models repetition. A real system would need its own data and validation.', no: 'The drawing depicts a cycle but has no data about the future. Separate an illustration from a prediction.' },
        { name: 'Cause & effect', en: 'CAUSE & EFFECT', symbol: '→', insight: 'The book presents events as chains of causes and effects.', example: 'Positioning an artwork is one step before printing. Fabric, equipment and execution also affect the result. One step cannot explain everything.', task: 'Advance through four print preparation steps. Watch the output of one become an input to the next.', misconception: 'One event following another does not by itself prove causation. A bad outcome is not proof of personal failure.', question: 'What does establishing cause and effect require?', answers: ['Only that one event happened first.', 'A strong belief.', 'Evidence and examination of other explanations.'], correct: 2, yes: 'Order is only part of the picture. Investigate mechanisms and other influences.', no: 'Sequence alone is insufficient. Look for evidence, a mechanism and alternative explanations.' },
        { name: 'Creative principle', en: 'GENDER / CREATION', symbol: '✧', insight: 'The book describes creation using historical “masculine” and “feminine” principles (Gender).', example: 'First gather shapes, references and notes. Then select and arrange them into your own artwork. Receiving ideas and actively making things are open to everyone.', task: 'Switch between gathering influences and assembling a composition. Observe two activities in one creative process.', misconception: 'Gender is the book’s historical term. Our creative metaphor assigns no sex, identity, traits or social roles.', question: 'How do we use this creative principle here?', answers: ['As receiving and shaping ideas, available to anyone.', 'As a rule about who must lead or obey.', 'As a scientific test of someone’s identity.'], correct: 0, yes: 'Anyone can do both. The metaphor helps discuss creativity rather than classify people.', no: 'This lesson does not classify people. It alternates two activities that are open to everyone.' }
      ]
    }
  };
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ language, current, completed })); }
    catch (_) { storageOK = false; }
  }
  function t() { return copy[language]; }
  function escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function svg(content, label) { return `<svg viewBox="0 0 400 240" role="img" aria-label="${escape(label)}">${content}</svg>`; }
  function scene() {
    const c = t();
    const ink = 'currentColor';
    if (current === 0) return svg(`<path d="M200 35 285 120 200 205 115 120Z" fill="none" stroke="${ink}" stroke-width="3"/><circle cx="200" cy="120" r="108" fill="none" stroke="${ink}" stroke-opacity=".2"/><text x="200" y="128" text-anchor="middle" fill="${ink}" font-size="17" font-family="sans-serif" letter-spacing="2">${perspective ? c.square : c.diamond}</text>`, c.switchNote);
    if (current === 1) {
      const size = 30 + exercise * .35;
      return svg([.5, 1, 1.5].map((s, i) => `<g transform="translate(${70 + i * 130} 120) scale(${s})"><rect x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" transform="rotate(45)" fill="none" stroke="${ink}" stroke-width="2"/><circle r="${size * .28}" fill="none" stroke="${ink}" stroke-width="2"/></g>`).join(''), c.scaleNote);
    }
    if (current === 2) {
      const count = 1 + exercise / 14;
      const points = Array.from({length:201}, (_,i) => `${i * 2},${120 + Math.sin(i / 200 * Math.PI * 2 * count) * 60}`).join(' ');
      return svg(`<path d="M0 120H400 M200 30V210" stroke="${ink}" stroke-opacity=".2"/><polyline points="${points}" stroke="${ink}" stroke-width="3" fill="none"/><text x="200" y="225" text-anchor="middle" fill="${ink}" font-family="sans-serif" font-size="12">${count.toFixed(1)} ×</text>`, c.waveNote);
    }
    if (current === 3) {
      const n = Math.round(exercise * 2.55);
      return svg(`<defs><linearGradient id="learn-tone"><stop stop-color="#111"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect x="35" y="70" width="330" height="85" fill="url(#learn-tone)"/><path d="M${35 + exercise * 3.3} 165v22" stroke="${ink}" stroke-width="3"/><circle cx="200" cy="112" r="30" fill="rgb(${n},${n},${n})" stroke="#bca879" stroke-width="2"/><text x="200" y="218" text-anchor="middle" fill="${ink}" font-family="sans-serif" font-size="12">${exercise}%</text>`, c.toneNote);
    }
    if (current === 4) {
      const angle = (exercise - 50) * .9;
      return svg(`<path d="M70 120a130 100 0 0 0 260 0" fill="none" stroke="${ink}" stroke-opacity=".2" stroke-dasharray="4 6"/><g transform="rotate(${angle} 200 30)"><path d="M200 30v140" stroke="${ink}" stroke-width="3"/><circle cx="200" cy="185" r="20" fill="${ink}"/></g><circle cx="200" cy="30" r="5" fill="${ink}"/>`, c.phaseNote);
    }
    if (current === 5) return `<ol class="learn-process">${c.chain.map((step, i) => `<li class="${i < chain ? 'is-active' : ''}"><span>${i < chain ? '✓' : '0' + (i + 1)}</span>${step}</li>`).join('')}</ol>`;
    return svg(creative ? `<circle cx="200" cy="120" r="80" stroke="${ink}" stroke-width="2" fill="none"/><path d="M145 160 200 65 255 160Z M145 160H255 M200 65V185" stroke="${ink}" stroke-width="2" fill="none"/><circle cx="200" cy="120" r="12" fill="${ink}"/>` : `<path d="M55 145a38 38 0 0 1 75 0" stroke="${ink}" stroke-width="3" fill="none"/><circle cx="200" cy="120" r="12" fill="${ink}"/><path d="M290 90v75" stroke="${ink}" stroke-width="3"/>`, creative ? c.composition : c.observe);
  }
  function controls() {
    const c = t();
    if (current === 0) return `<button type="button" class="learn-action" data-perspective aria-pressed="${perspective}">${c.state} ↔</button><p>${c.switchNote}</p>`;
    if (current === 5) return `<button type="button" class="learn-action" data-chain>${chain === 4 ? c.restart : c.start} →</button><p role="status">${chain ? c.chain[chain - 1] : c.idle}</p><p>${c.chainNote}</p>`;
    if (current === 6) return `<div class="learn-choice"><button type="button" data-creative="0" aria-pressed="${!creative}">${c.receive}</button><button type="button" data-creative="1" aria-pressed="${!!creative}">${c.create}</button></div><p role="status">${creative ? c.composition : c.observe}</p><p>${c.creativeNote}</p>`;
    const labels = {1:c.scale,2:c.frequency,3:c.tone,4:c.phase};
    const notes = {1:c.scaleNote,2:c.waveNote,3:c.toneNote,4:c.phaseNote};
    return `<label class="learn-range" for="learn-slider">${labels[current]}<output id="learn-output" for="learn-slider">${exercise}%</output></label><input id="learn-slider" type="range" min="0" max="100" step="1" value="${exercise}"><p>${notes[current]}</p>`;
  }
  function render(announce = false) {
    const c = t(), l = c.lessons[current];
    host.lang = language;
    host.innerHTML = `<div class="learn-shell">
      <div class="learn-top"><span class="learn-kicker">${c.kicker}</span><div class="learn-language" role="group" aria-label="Language / Jazyk"><button type="button" data-language="cs" aria-pressed="${language === 'cs'}">ČESKY</button><button type="button" data-language="en" aria-pressed="${language === 'en'}">ENGLISH</button></div></div>
      <div class="learn-head"><h2>${c.title.replace('\n','<br>')}</h2><p>${c.intro}</p></div>
      <details class="learn-history"><summary>${c.historyTitle} <span>1908 → NOW</span></summary><p>${c.history}</p><p>${c.our}</p><a href="${archive}" target="_blank" rel="noopener noreferrer">${c.sourceDate} ↗</a></details>
      <div class="learn-context"><span>${language === 'cs' ? 'FILOZOFIE A TVŮRČÍ METAFORY · NE FYZIKÁLNÍ ZÁKONY' : 'PHILOSOPHY & CREATIVE METAPHORS · NOT LAWS OF PHYSICS'}</span></div>
      <div class="learn-progress"><div><strong>${completed.length} / 7</strong><span>${c.completed}</span></div><progress max="7" value="${completed.length}" aria-label="${c.progress}">${completed.length}/7</progress><button type="button" data-reset>${c.reset} ↺</button></div>
      <p class="learn-save-note">${storageOK ? c.saved : c.unsaved}</p>
      <div class="learn-tabs" role="tablist" aria-label="${language === 'cs' ? 'Sedm principů' : 'Seven principles'}">${c.lessons.map((item, index) => `<button type="button" role="tab" id="learn-tab-${index}" aria-controls="learn-panel" aria-selected="${index === current}" tabindex="${index === current ? 0 : -1}" data-lesson="${index}"><span>${completed.includes(index) ? '✓' : '0' + (index + 1)}</span>${item.name}</button>`).join('')}</div>
      <div id="learn-panel" role="tabpanel" aria-labelledby="learn-tab-${current}" tabindex="0" class="learn-layout${announce && !reduced.matches ? ' learn-arrive' : ''}">
        <div class="learn-visual"><div class="learn-visual-top"><span>0${current + 1} / 07</span><span>${l.en}</span></div><div class="learn-scene" id="learn-scene">${scene()}</div><div class="learn-exercise" id="learn-exercise">${controls()}</div></div>
        <article class="learn-lesson"><div class="learn-lesson-label">${c.lesson} 0${current + 1} <span>${l.symbol}</span></div><h3>${l.name}</h3><div class="learn-step"><h4>${c.book}</h4><p>${l.insight}</p></div><div class="learn-step"><h4>${c.example}</h4><p>${l.example}</p></div><div class="learn-step"><h4>${c.try}</h4><p>${l.task}</p></div><div class="learn-misconception"><h4>${c.misconception}</h4><p>${l.misconception}</p></div></article>
      </div>
      <div class="learn-question"><span class="learn-kicker">${c.question}</span><h3>${l.question}</h3><p>${c.prompt}</p><div class="learn-answers">${l.answers.map((answer, index) => `<button type="button" data-learn-answer="${index}"><span>${String.fromCharCode(65 + index)}</span>${answer}</button>`).join('')}</div><div class="learn-feedback" role="status" aria-live="polite" id="learn-feedback">${completed.includes(current) ? `<strong>✓ ${c.correct}</strong> ${l.yes}` : ''}</div></div>
      <div class="learn-footer"><button type="button" data-previous ${current === 0 ? 'disabled' : ''}>← ${c.previous}</button><a href="#lab" data-open-lab>${c.lab}</a><button type="button" data-next ${current === 6 ? 'disabled' : ''}>${c.next} →</button></div>
      ${completed.length === 7 ? `<div class="learn-complete" role="status"><strong>${c.allDone}</strong><p>${c.doneText}</p></div>` : ''}
      <details class="learn-sources"><summary>${c.sourceTitle}</summary><p>${c.sourcesNote}</p><div><a href="${source}" target="_blank" rel="noopener noreferrer">${c.sourceBook} ↗</a><a href="${archive}" target="_blank" rel="noopener noreferrer">${c.sourceDate} ↗</a></div></details>
    </div>`;
  }
  function select(index, focus = false) {
    current = Math.max(0, Math.min(6, index));
    exercise = 50; perspective = false; chain = 0; creative = 0;
    save(); render(true);
    if (focus) { const tab = host.querySelector(`[data-lesson="${current}"]`); tab.focus({preventScroll:true}); tab.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}); }
  }
  host.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.hasAttribute('data-language')) { language = button.dataset.language; save(); render(); host.querySelector(`[data-language="${language}"]`).focus({preventScroll:true}); }
    else if (button?.hasAttribute('data-lesson')) select(Number(button.dataset.lesson), true);
    else if (button?.hasAttribute('data-learn-answer')) {
      const c = t(), l = c.lessons[current], answer = Number(button.dataset.learnAnswer), right = answer === l.correct;
      host.querySelectorAll('[data-learn-answer]').forEach(item => { item.classList.remove('is-correct','is-incorrect'); item.removeAttribute('aria-pressed'); });
      button.classList.add(right ? 'is-correct' : 'is-incorrect'); button.setAttribute('aria-pressed','true');
      const feedback = document.getElementById('learn-feedback');
      feedback.className = 'learn-feedback ' + (right ? 'is-correct' : 'is-incorrect');
      feedback.innerHTML = `<strong>${right ? '✓ ' + c.correct : '↺ ' + c.retry}</strong> ${right ? l.yes : l.no}`;
      if (right && !completed.includes(current)) {
        completed.push(current); save();
        host.querySelector('.learn-progress strong').textContent = `${completed.length} / 7`;
        host.querySelector('progress').value = completed.length;
        host.querySelector(`[data-lesson="${current}"]>span`).textContent = '✓';
        if (completed.length === 7) {
          const banner = document.createElement('div'); banner.className = 'learn-complete'; banner.setAttribute('role','status');
          banner.innerHTML = `<strong>${c.allDone}</strong><p>${c.doneText}</p>`;
          host.querySelector('.learn-footer').after(banner);
        }
      }
    }
    else if (button?.hasAttribute('data-reset')) { completed = []; current = 0; exercise = 50; perspective = false; chain = 0; creative = 0; save(); render(); host.querySelector('[data-reset]').focus({preventScroll:true}); }
    else if (button?.hasAttribute('data-next')) { select(current + 1); host.querySelector('#learn-panel').focus({preventScroll:true}); host.querySelector('.learn-tabs').scrollIntoView({block:'start',behavior:reduced.matches ? 'instant' : 'smooth'}); }
    else if (button?.hasAttribute('data-previous')) { select(current - 1); host.querySelector('#learn-panel').focus({preventScroll:true}); }
    else if (button?.hasAttribute('data-perspective')) { perspective = !perspective; host.querySelector('#learn-scene').innerHTML = scene(); button.setAttribute('aria-pressed',String(perspective)); }
    else if (button?.hasAttribute('data-chain')) { chain = chain === 4 ? 0 : chain + 1; host.querySelector('#learn-scene').innerHTML = scene(); button.textContent = (chain === 4 ? t().restart : t().start) + ' →'; host.querySelector('#learn-exercise [role=status]').textContent = chain ? t().chain[chain - 1] : t().idle; }
    else if (button?.hasAttribute('data-creative')) { creative = Number(button.dataset.creative); host.querySelector('#learn-scene').innerHTML = scene(); host.querySelectorAll('[data-creative]').forEach(item => item.setAttribute('aria-pressed',String(Number(item.dataset.creative) === creative))); host.querySelector('#learn-exercise [role=status]').textContent = creative ? t().composition : t().observe; }
    const labLink = event.target.closest('[data-open-lab]');
    if (labLink) { const labButton = document.querySelector(`[data-lab="${current}"]`); if (labButton) labButton.click(); }
  });
  host.addEventListener('input', event => {
    if (event.target.id !== 'learn-slider') return;
    exercise = Number(event.target.value);
    document.getElementById('learn-output').textContent = exercise + '%';
    host.querySelector('#learn-scene').innerHTML = scene();
  });
  host.addEventListener('keydown', event => {
    if (!event.target.matches('[role=tab]')) return;
    let destination;
    if (event.key === 'ArrowRight') destination = (current + 1) % 7;
    if (event.key === 'ArrowLeft') destination = (current + 6) % 7;
    if (event.key === 'Home') destination = 0;
    if (event.key === 'End') destination = 6;
    if (destination !== undefined) { event.preventDefault(); select(destination, true); }
  });
  document.addEventListener('caisik-learning-reset', () => {
    language = 'cs'; current = 0; completed = [];
    exercise = 50; perspective = false; chain = 0; creative = 0;
    render();
  });
  render();
})();
