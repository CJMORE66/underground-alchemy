export const cornerNoteKey = 'caisik-corner-note-v1';
export const cornerNoteEvent = 'caisik:corner-note-change';
export const cornerWitnesses = Object.freeze(['courier', 'dj', 'inspector']);
export const cornerChoices = Object.freeze(['signal', 'timing', 'memory']);

export const cornerReadings = {
  cs: {
    signal: {
      title: 'Značka ukazovala cestu',
      body: 'Dva kosočtverce se opakovaly na bedně i u průjezdu. Vypadá to, že si podle nich někdo předával zásilku.',
      recall: 'U rohu sis všímal značek. Na tyhle dveře se podívej zblízka. Je na nich něco, co se opakuje i jinde?',
    },
    timing: {
      title: 'Okno odpovědělo na takt',
      body: 'Okna I a III se rozsvítila spolu. Okno II přišlo o dobu později. Možná si takhle někdo řekl o odpověď.',
      recall: 'U rohu sis zapsal, že okno odpovědělo se zpožděním. Počkej ještě jeden takt. Pak uvidíš, jestli ty rány někdo opětuje.',
    },
    memory: {
      title: 'Někdo převzal štafetu',
      body: 'Stříbrné rukavice sevřely bednu, než zmizela po schodech. Zajímá mě, kdo ji převzal a proč.',
      recall: 'U rohu ses ptal, kdo zvedl bednu. Tady bych se nejdřív rozhlédl, kdo k těm dveřím přišel těsně před klepáním.',
    },
  },
  en: {
    signal: {
      title: 'The mark showed the way',
      body: 'The double diamond appeared on the crate and by the passage. It looks like someone used it to pass the delivery along.',
      recall: 'At the corner you looked for marks. Take a closer look at this door. Do you see anything that repeats somewhere else?',
    },
    timing: {
      title: 'The window answered the beat',
      body: 'Windows I and III lit up together. Window II came in a beat late. Maybe someone was asking for an answer.',
      recall: 'You wrote that the window answered a beat late. Give it one more beat. Then see if anyone knocks back.',
    },
    memory: {
      title: 'Someone took over',
      body: 'Silver gloves gripped the crate before it disappeared down the stairs. I want to know who took it and why.',
      recall: 'At the corner you asked who picked up the crate. I would look around and see who got to this door just before the knocking.',
    },
  },
  fr: {
    signal: {
      title: 'Le signe montrait le chemin',
      body: 'Le double losange se répétait sur la caisse et près du passage. On dirait que quelqu’un s’en servait pour faire suivre la livraison.',
      recall: 'Au coin de la rue, tu as suivi les signes. Regarde cette porte de près. Est-ce que tu y vois un motif qui revient ailleurs ?',
    },
    timing: {
      title: 'La fenêtre a répondu en rythme',
      body: 'Les fenêtres I et III se sont allumées ensemble. La II est arrivée un temps plus tard. Quelqu’un attendait peut-être une réponse.',
      recall: 'Tu as noté que la fenêtre répondait un temps plus tard. Attends encore un temps. Tu verras si quelqu’un frappe en retour.',
    },
    memory: {
      title: 'Quelqu’un a pris le relais',
      body: 'Des gants argentés ont saisi la caisse avant qu’elle ne disparaisse dans l’escalier. Qui l’a prise, et pourquoi ?',
      recall: 'Au coin de la rue, tu voulais savoir qui avait soulevé la caisse. Ici, je regarderais d’abord qui est arrivé près de la porte juste avant les coups.',
    },
  },
};

function normalizeProgress(value) {
  if (!Array.isArray(value?.seen) || value.seen.length > cornerWitnesses.length) return null;
  const seen = Array.from(value.seen);
  if (seen.some(witness => !cornerWitnesses.includes(witness)) || new Set(seen).size !== seen.length) return null;
  const reading = value.reading ?? null;
  if (reading !== null && (!cornerChoices.includes(reading) || seen.length !== cornerWitnesses.length)) return null;
  return { seen, reading };
}

export function readCornerProgress(storage) {
  try {
    return normalizeProgress(JSON.parse((storage ?? localStorage).getItem(cornerNoteKey)));
  } catch { return null; }
}

export function readCornerNote(storage) {
  const progress = readCornerProgress(storage);
  return progress?.reading ? progress : null;
}

export function writeCornerProgress(value, storage) {
  const progress = normalizeProgress(value);
  if (!progress) return false;
  try {
    (storage ?? localStorage).setItem(cornerNoteKey, JSON.stringify(progress));
    return true;
  } catch { return false; }
}
