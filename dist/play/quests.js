/* Selfmade quests describe practice. Progress records evidence, never artistic scores. */
import {createId} from './store.js';
const stepNames = ['Otázka', 'Kontext', 'Všímání', 'Vysvětlená ukázka', 'Vlastní pokus', 'Zpětná vazba a revize', 'Přenos'];
const definitions = {
  writer: {
    label:'WRITER', title:'LETTERS INTO IDENTITY', icon:'✦', color:'#FFD600', location:'DÍLNA / ŽIVÁ ZEĎ',
    question:'Která vlastnost tvých písmen má být rozpoznatelná i bez podpisu?',
    goal:'Vytvoř vlastní návrh, zdůvodni paletu a uchovej první i přepracovanou verzi.',
    output:'Skica + paleta s funkcí barev + plán povolené realizace + procesní Blackbook.',
    skills:['Konstrukce písmene','Negativní prostor','Paleta s funkcí','Vysvětlená revize'],
    prompts:[
      'Vyber vlastní slovo a pojmenuj jednu vlastnost, kterou chceš návrhem sdělit. Jak ji poznáš v hotové práci?',
      'V expedici Writer odděl konstrukci písmene, proporce a povolení konkrétní plochy. Digitální skica sama o sobě není souhlas s malováním.',
      'Prohlédni tři mezery mezi písmeny. Která uzavírá čitelnost? Zapiš konkrétní tvar, ne jen dojem.',
      'Autorský příklad: úzký průhled mezi dvěma hmotami lze zvětšit posunutím spojnice; počet ozdob přitom nemusí růst. Ověř to na jedné vlastní dvojici písmen.',
      'Nakresli kostru, objem a obrys vlastního slova. Přiřaď nejvýše tři dominantní barvy a každé konkrétní funkci. Ulož první verzi.',
      'Zmenši náhled a vyber jedno místo, kde se ztrácí záměr. Uprav ho, ulož druhou verzi a napiš přesně, co se změnilo.',
      'Přenes stejný princip na jiné slovo nebo formát. Před realizací dolož aktuální podmínky konkrétní plochy. Plán není povolení.'
    ],
    hints:['Začni jednou osou a dvěma sousedními písmeny.','Sleduj průhled mezi hmotami při malém náhledu.','Vyzkoušej posun spojnice a porovnej obě verze.'],
    equipment:{phone:'Nakresli jednoduchou skicu prstem a porovnej dva náhledy.',paper:'Použij papír a vlastní proces popiš v Blackbooku; přílohu přidej jen vlastní.',studio:'Připrav formát, materiál a písemně ověřené podmínky plochy.'}
  },
  mc: {
    label:'MC', title:'FIND YOUR OWN VOICE', icon:'◉', color:'#FFD600', location:'STUDIO / MIKROFON',
    question:'Který konkrétní obraz z tvé zkušenosti má posluchač po sloce vidět?',
    goal:'Napiš vlastní sloku, vyzkoušej dva přednesy a vysvětli jednu konkrétní úpravu.',
    output:'Vlastní sloka + dvě verze přednesu + označené pauzy + vysvětlená revize.',
    skills:['Konkrétní obraz','Asociace a metafora','Pauza a důraz','Vysvětlená revize'],
    prompts:[
      'Pojmenuj událost nebo detail, který znáš osobně. Co z něj chceš posluchači předat?',
      'Otevři expedici MC a odliš doložený kulturní kontext od vlastního vyprávění. Cizí příběh nepředstavuj jako svoji zkušenost.',
      'Zapiš jeden viditelný detail, jeden zvuk a jedno gesto. Který unese obraz bez obecného vysvětlování?',
      'Autorský příklad: místo „bylo mi zle“ popiš konkrétní gesto nebo předmět. Potom stejný řádek přečti s pauzou před posledním slovem a bez ní.',
      'Napiš čtyři až šestnáct vlastních řádků. Ručně označ nádechy, pauzy a důraz. Ulož první podobu a vytvoř dva vlastní přednesy.',
      'Poslechni oba přednesy. Vyber přesný řádek, změň jednu věc a vysvětli rozdíl. Skutečnou reakci posluchače označ jako jeho reakci, nikoli AI hodnocení.',
      'Použij stejnou práci s konkrétním detailem v novém čtyřverší z jiného místa nebo vlastního inventáře.'
    ],
    hints:['Nezačínej rýmem: nejprve napiš pozorovaný detail.','Přečti řádek nahlas dvěma způsoby.','Změň jeden důraz nebo jedno obecné slovo a porovnej účinek.'],
    equipment:{phone:'Použij vlastní text a volitelný místní záznam hlasu.',paper:'Označ pauzy a důraz přímo do řádků.',studio:'Nahraj dvě verze stejné sloky při stejném gainu a bez přebuzení.'}
  },
  dj: {
    label:'DJ', title:'SOUND ARCHAEOLOGY', icon:'◎', color:'#FFD600', location:'STUDIO / GRAMOFON',
    question:'Jaký příběh má posluchač poznat z pořadí tří skladeb?',
    goal:'Sestav krátký vlastní mix a dolož jeho tracklist a tři dramaturgická rozhodnutí.',
    output:'Krátký mix + tracklist + tři rozhodnutí + porovnání jednoho přechodu.',
    skills:['Funkční poslech','Dramaturgie','Návaznost','Vysvětlená revize'],
    prompts:[
      'Pojmenuj zamýšlený průběh setu: kde má pozornost růst, zastavit se a vydechnout?',
      'V expedici DJ si přečti kulturní kontext breaku a diggingu. Vlastní mapa energie je pracovní pomůcka, nikoli historické pravidlo nebo automatické měření kvality.',
      'U tří vlastních nebo oprávněně použitých skladeb zapiš rytmickou funkci, basu a prostor. Vyber konkrétní místo nástupu.',
      'Autorský příklad: stejná dvojice skladeb může po krátké pauze otevřít novou kapitolu; dlouhý překryv může zachovat kontinuitu. Ověř oba záměry poslechem.',
      'Navrhni dvě pořadí ze stejných tří skladeb. Vyzkoušej jednu návaznost na vlastním vybavení, zaznamenej vlastní mix a zapiš tracklist.',
      'Vrať se k jednomu přechodu, změň nástup nebo délku překryvu a popiš, co skutečně slyšíš. Zachovej původní i novou verzi.',
      'Stejné rozhodnutí vyzkoušej na jiné dvojici skladeb. Uveď tři důvody výběru a další krok místo číselného skóre.'
    ],
    hints:['Vyber jen tři skladby a jednu zamýšlenou změnu nálady.','Zapiš skutečný cue bod a důvod jeho volby.','Porovnej dvě délky přechodu při stejném záměru.'],
    equipment:{phone:'Připrav tracklist, cue poznámky a mapu energie; mix vytvoř v dostupném oprávněném nástroji.',paper:'Nakresli dvě varianty energie setu a tři rozhodnutí.',studio:'Ponech souvislý čas na poslech, nahrání a export krátkého vlastního mixu.'}
  },
  breaking: {
    label:'B-BOY / B-GIRL', title:'READ THE RHYTHM', icon:'↻', color:'#FFD600', location:'CYPHER / POHYB',
    question:'Na který hudební moment chceš reagovat a jak to poznáš ve své frázi?',
    goal:'Připrav bezpečnou vlastní session odpovídající zkušenosti a skutečnému odbornému vedení.',
    output:'Přiměřená vlastní fráze + skutečná reakce lektora + jeden další krok.',
    skills:['Hudební pozornost','Záměr session','Pozorování prostoru','Reflexe s lektorem'],
    prompts:[
      'Zapiš skutečnou zkušenost a jeden hudební podnět, na který chceš soustředit pozornost.',
      'Otevři expedici Breaking. Ilustrace tanečníka není odborná ukázka techniky; chybějící vedení nenahrazuj animací.',
      'Při skutečném setkání sleduj role, střídání a komunikaci ve sdíleném prostoru. Pozorování není souhlas s nahráváním ostatních.',
      'Vysvětlenou pohybovou ukázku musí dodat kvalifikovaný spoluautor. Dokud ji nemáš, pracuj s poslechem, záměrem a plánem session, nikoli s výukou rizikových prvků.',
      'S lektorem zvol přiměřenou vlastní frázi. Připrav vhodný prostor a skutečné podmínky. Zaznamenej záměr před pokusem a vlastní zkušenost po něm.',
      'Připoj skutečnou reakci lektora ke konkrétnímu momentu. Pokud ji nemáš, nech pole otevřené; vlastní dojem označ jako sebereflexi.',
      'Vyber jeden bezpečně zvolený další krok podle skutečné reakce. Neodvozuj pokrok z počtu odškrtnutých zastávek.'
    ],
    hints:['Nejdřív popiš zkušenost a hudební podnět.','Bez odborné ukázky můžeš zkoumat poslech a přípravu session.','O konkrétní technice rozhodni s kvalifikovaným lektorem.'],
    equipment:{phone:'Použij poslech, plán session a vlastní reflexi.',paper:'Zapiš hudební akcenty, otázku pro lektora a další krok.',studio:'Ověř vhodný prostor, odborné vedení a podmínky vlastní session.'}
  },
  knowledge: {
    label:'KNOWLEDGE OF SELF', title:'QUESTION YOUR OWN MAP', icon:'◇', color:'#FFD600', location:'KNIHOVNA / ZRCADLO',
    question:'Které své tvrzení jsi ochotný zpřesnit po setkání s novým podnětem?',
    goal:'Vytvoř krátký text a vlastní znak; odliš pozorování, doložené informace a interpretaci.',
    output:'Krátký text + vlastní vysvětlený znak + původní a zpřesněná myšlenka.',
    skills:['Rozlišení tvrzení','Práce se zdrojem','Vysvětlený symbol','Revize myšlenky'],
    prompts:[
      'Napiš své tvrzení jednou větou. Co by tě mohlo přesvědčit, že potřebuje úpravu?',
      'V expedici Knowledge odděl doloženou informaci od autorské interpretace. Kybalion je moderní hermeticky inspirovaný text, nikoli ověřený staroegyptský pramen.',
      'U jednoho skutečného místa zapiš přímo pozorovaný detail, ověřenou informaci se zdrojem a vlastní čtení. Každé tvrzení označ.',
      'Autorský příklad: kruhové okno je pozorování; jeho datace vyžaduje zdroj; pocit cykličnosti je interpretace. Stejný tvar může unést různé osobní významy.',
      'Napiš deset řádků a zkrať je na tři. Sestav vlastní znak a každému prvku přiřaď význam, který dokážeš vysvětlit.',
      'Polož znaku protiotázku: jak ho může číst někdo jiný? Zachovej původní i novou myšlenku a napiš důvod změny.',
      'Ověř stejnou myšlenku v jiné disciplíně nebo na jiném místě. Otevřenou otázku ulož jako další vlastní quest.'
    ],
    hints:['Začni jedním tvrzením, nikoli celým manifestem.','Odděl to, co vidíš, od toho, co si vykládáš.','Zkus opačné čtení a napiš, co by rozhodlo mezi variantami.'],
    equipment:{phone:'Zapiš tři typy tvrzení a vlastní znak v lokálním sešitu.',paper:'Napiš deset řádků, vyber tři a vysvětli změnu.',studio:'Porovnej vlastní znak ve více médiích se stejným vysvětleným záměrem.'}
  }
};
export const disciplineConfigs = Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id, definition]) => [id, Object.freeze({id, ...definition, href:`/expeditions/${id}/`, steps:definition.prompts.map((prompt, i) => ({id:['question','context','notice','example','attempt','review','transfer'][i], number:i+1, title:stepNames[i], prompt, text:prompt}))})])));
export function buildQuest(discipline = 'writer', options = {}) {
  if (typeof discipline === 'object' && discipline !== null) { options = discipline; discipline = options.discipline || 'writer'; }
  const config = disciplineConfigs[discipline];
  if (!config && discipline !== 'custom') throw Error('Neznámá disciplína questu.');
  const custom = discipline === 'custom';
  return {id:options.id || createId('quest'), discipline, title:options.title || config?.title || 'Vlastní zadání', goal:options.goal || config?.goal || '', output:options.output || config?.output || '', criteria:options.criteria || '', type:options.type || (custom?'custom':'main'), createdAt:options.createdAt || new Date().toISOString(), status:'open', artifactId:options.artifactId || '', step:0, responses:{}, constraint:options.constraint || '', equipment:options.equipment || 'phone', ...options};
}
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const outputMetadata = value => Object.fromEntries(Object.entries(value || {}).filter(([key]) => !['decision','nextStep','feedback','review','updatedAt','createdAt','savedAt','revisionNote'].includes(key)));
const hasWork = version => !!version && (nonempty(version.text) || nonempty(version.work) || version.strokes?.some(s => s.points?.length > 1));
export function artifactEvidence(artifact) {
  const versions = Array.isArray(artifact?.versions) ? artifact.versions : [];
  const attempts = versions.filter(hasWork);
  const first = attempts[0], latest = attempts.at(-1);
  const changed = attempts.length > 1 && (first.text !== latest.text || first.work !== latest.work || JSON.stringify(first.strokes || []) !== JSON.stringify(latest.strokes || []) || JSON.stringify(first.palette || []) !== JSON.stringify(latest.palette || []) || JSON.stringify(outputMetadata(first.metadata)) !== JSON.stringify(outputMetadata(latest.metadata)));
  const decision = nonempty(latest?.decision) || nonempty(latest?.metadata?.decision);
  const nextStep = nonempty(latest?.nextStep) || nonempty(latest?.metadata?.nextStep);
  return {hasAttempt:attempts.length>0, hasRevision:changed, hasDecision:decision, hasNextStep:nextStep, versionCount:versions.length, status:!attempts.length?'prázdná práce':changed&&decision?'doložená revize':'vlastní pokus', evidenceReady:changed&&decision&&nextStep};
}
export function deriveProgress(state) {
  const artifacts = Array.isArray(state?.artifacts) ? state.artifacts : [];
  const byDiscipline = {};
  for (const [id, config] of Object.entries(disciplineConfigs)) {
    const works = artifacts.filter(a => a.discipline === id);
    const evidence = works.map(a => ({artifactId:a.id,title:a.title,...artifactEvidence(a)}));
    const attempts = evidence.filter(x => x.hasAttempt).length;
    const revisions = evidence.filter(x => x.hasRevision && x.hasDecision).length;
    byDiscipline[id] = {id,label:config.label,artifacts:works.length,attempts,revisions,evidence,skills:config.skills.map((label,index) => ({label,status:index===3&&revisions?'doložená revize':attempts?'vlastní pokus':'čeká na vlastní práci',artifactIds:evidence.filter(e=>index===3?e.hasRevision&&e.hasDecision:e.hasAttempt).map(e=>e.artifactId)}))};
  }
  const allEvidence = artifacts.map(artifactEvidence);
  const attempts = allEvidence.filter(e=>e.hasAttempt).length;
  const revisions = allEvidence.filter(e=>e.hasRevision&&e.hasDecision).length;
  const active = (state?.quests || []).filter(q => q.status !== 'archived');
  return {byDiscipline,disciplines:byDiscipline,artifacts:artifacts.length,attempts,revisions,versionCount:artifacts.reduce((n,a)=>n+(a.versions?.length||0),0),activeQuests:active.length,completedQuests:active.filter(q=>artifacts.some(a=>a.id===q.artifactId&&artifactEvidence(a).evidenceReady)).length,hasWorld:attempts>0,nextStep:attempts===0?'Ulož vlastní první pokus.':revisions===0?'Vrať se k první verzi, uprav jednu věc a vysvětli změnu.':'Vyber otevřenou otázku a přenes ji do další práce.'};
}
