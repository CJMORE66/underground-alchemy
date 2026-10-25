/* Text-only expedition notes. This module never uploads data or touches atlas keys. */
export const EXPEDITION_STORAGE_KEY = 'caisik-expeditions-v1';
export const CHAPTER_IDS = Object.freeze(['dj', 'mc', 'writer', 'breaking', 'knowledge']);
export const NOTE_FIELDS = Object.freeze(['work', 'revision', 'decision', 'feedback', 'nextStep', 'tracklist', 'palette', 'symbol']);
const MAX_TEXT = 12000;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));
const empty = () => ({schemaVersion: 1, notes: {}, currentStops: {}, mode: null});

export function normalizeNotebook(value) {
  if (!plain(value) || value.schemaVersion !== 1 || !plain(value.notes) || !plain(value.currentStops)) throw new Error('Notebook format is invalid');
  const output = empty();
  for (const chapterId of CHAPTER_IDS) {
    const note = value.notes[chapterId];
    if (note !== undefined) {
      if (!plain(note)) throw new Error('Notebook note is invalid');
      const fields = {};
      for (const key of NOTE_FIELDS) if (typeof note[key] === 'string') fields[key] = note[key].slice(0, MAX_TEXT);
      if (typeof note.updatedAt === 'string' && Number.isFinite(Date.parse(note.updatedAt))) fields.updatedAt = note.updatedAt;
      output.notes[chapterId] = fields;
    }
    if (typeof value.currentStops[chapterId] === 'string' && /^stop-[a-z0-9-]+$/.test(value.currentStops[chapterId])) output.currentStops[chapterId] = value.currentStops[chapterId];
  }
  output.mode = value.mode === 'field' || value.mode === 'story' ? value.mode : null;
  return output;
}

// Keep a damaged original available for recovery; salvage only known text fields.
function salvageNotebook(value) {
  const candidate = empty();
  if (!plain(value)) return candidate;
  for (const chapterId of CHAPTER_IDS) {
    if (plain(value.notes?.[chapterId])) candidate.notes[chapterId] = value.notes[chapterId];
    if (typeof value.currentStops?.[chapterId] === 'string') candidate.currentStops[chapterId] = value.currentStops[chapterId];
  }
  candidate.mode = value.mode;
  return normalizeNotebook(candidate);
}
const emptyPatch = () => ({notes: {}, currentStops: {}});
function mergeNotebook(base, patch) {
  const output = clone(base);
  for (const chapterId of CHAPTER_IDS) {
    if (patch.notes[chapterId]) output.notes[chapterId] = {...(output.notes[chapterId] || {}), ...patch.notes[chapterId]};
    if (Object.hasOwn(patch.currentStops, chapterId)) output.currentStops[chapterId] = patch.currentStops[chapterId];
  }
  if (Object.hasOwn(patch, 'mode')) output.mode = patch.mode;
  return output;
}

export function createExpeditionStore({storage = () => globalThis.localStorage, onStatus = () => {}, now = () => new Date().toISOString()} = {}) {
  let state = empty(), pending = emptyPatch(), durable = false, problem = null, recovery = null, lastNotice = null;
  const hasPending = () => Object.keys(pending.notes).length > 0 || Object.keys(pending.currentStops).length > 0 || Object.hasOwn(pending, 'mode');
  const report = message => {
    const notice = {durable, problem, message};
    const serialized = JSON.stringify(notice);
    if (serialized !== lastNotice) { lastNotice = serialized; onStatus(notice); }
  };
  function readCurrent() {
    let target, raw, parsed;
    try {
      target = storage();
      if (!target || typeof target.getItem !== 'function') throw new Error('Storage unavailable');
      raw = target.getItem(EXPEDITION_STORAGE_KEY);
    } catch { return {ok: false, problem: 'unavailable'}; }
    try {
      parsed = raw === null || raw === undefined || raw === '' ? empty() : JSON.parse(raw);
      return {ok: true, target, value: normalizeNotebook(parsed)};
    } catch {
      // Never replace the original corrupt record with an empty notebook.
      recovery = {rawNotebook: typeof raw === 'string' ? raw : String(raw), reason: 'corrupt'};
      return {ok: false, problem: 'corrupt', value: salvageNotebook(parsed)};
    }
  }
  function refreshInternal() {
    const current = readCurrent();
    const oldProblem = problem;
    if (current.ok) {
      state = mergeNotebook(current.value, pending);
      if (!hasPending()) {
        durable = true; problem = null;
        if (oldProblem) report('Místní Blackbook je opět dostupný. Export je tvoje záloha.');
      }
    } else {
      if (current.value) state = mergeNotebook(state, current.value);
      state = mergeNotebook(state, pending);
      durable = false; problem = current.problem;
      report(problem === 'corrupt'
        ? 'Uložený Blackbook je poškozený. Původní data zůstávají zachovaná; nové poznámky jsou jen v paměti. Export obsahuje i data pro obnovu.'
        : 'Úložiště není dostupné. Poznámky jsou jen v paměti této stránky; použij export.');
    }
    return current;
  }
  const initial = refreshInternal();
  if (initial.ok) report('Místní Blackbook je připravený. Export je tvoje záloha.');
  function persist() {
    // Re-read before every write so another expedition tab is never replaced
    // by this tab's older full snapshot. Only explicit field patches win.
    const current = refreshInternal();
    if (!current.ok) return false;
    try {
      if (typeof current.target.setItem !== 'function') throw new Error('Storage unavailable');
      current.target.setItem(EXPEDITION_STORAGE_KEY, JSON.stringify(state));
      pending = emptyPatch(); durable = true; problem = null;
      report('Uloženo v tomto prohlížeči.');
      return true;
    } catch {
      durable = false; problem = 'unavailable';
      report('Jen v paměti této stránky. Pro zachování poznámek použij export.');
      return false;
    }
  }
  const known = id => { if (!CHAPTER_IDS.includes(id)) throw new Error('Unknown expedition'); };
  function snapshot() { refreshInternal(); return clone(state); }
  return {
    refresh: snapshot,
    getChapter(id) { known(id); refreshInternal(); return clone(state.notes[id] || {}); },
    updateChapter(id, fields) {
      known(id);
      const patch = {};
      for (const key of NOTE_FIELDS) if (Object.hasOwn(fields, key) && typeof fields[key] === 'string') patch[key] = fields[key].slice(0, MAX_TEXT);
      if (!Object.keys(patch).length) { if (hasPending()) return persist(); refreshInternal(); return durable; }
      pending.notes[id] = {...(pending.notes[id] || {}), ...patch, updatedAt: now()};
      return persist();
    },
    getCurrentStop(id) { known(id); refreshInternal(); return state.currentStops[id] || null; },
    setCurrentStop(id, stopId) {
      known(id);
      if (typeof stopId !== 'string' || !/^stop-[a-z0-9-]+$/.test(stopId)) throw new Error('Invalid route placement');
      pending.currentStops[id] = stopId;
      return persist();
    },
    getMode() { refreshInternal(); return state.mode; },
    setMode(mode) {
      if (mode !== 'field' && mode !== 'story') throw new Error('Invalid reading mode');
      pending.mode = mode;
      return persist();
    },
    snapshot,
    persistence() { return {durable, problem}; },
    exportPayload() {
      return {...snapshot(), exportedAt: now(), format: 'CAISIK-Expeditions-Blackbook', privacy: 'Local text only; no audio or photo attachments.', ...(recovery ? {recovery: clone(recovery)} : {})};
    }
  };
}

const noteLabels = {work: 'Vlastní výstup', revision: 'Druhá verze', decision: 'Rozhodnutí a důvod', feedback: 'Zpětná vazba', nextStep: 'Další krok', tracklist: 'Tracklist', palette: 'Paleta', symbol: 'Vlastní znak — slovní popis'};
export function buildMarkdownGuide(data, chapterId, notebook = {}) {
  const chapter = data.chapters.find(item => item.id === chapterId);
  if (!chapter) throw new Error('Unknown guide');
  const route = data.routes.find(item => item.id === chapter.routeId);
  const places = new Map(data.places.map(item => [item.id, item]));
  const lessons = new Map(data.lessons.map(item => [item.id, item]));
  const sources = new Map((data.sources || []).map(item => [item.id, item]));
  const lines = [`# CAISIK / ${chapter.label} — ${chapter.title.replace(/\n/g, ' ')}`, '', chapter.subtitle, '', `Výsledek: ${chapter.outcome}`, '', 'Textový průvodce pro čtení bez připojení. Navigace a stránky pořadatelů potřebují internet.', 'Žádná služba ani kapacita není rezervovaná. Tvůrčí zadání není hodnocení umělecké kvality.', '', '## Tři cíle', ...chapter.goals.map(text => `- ${text}`), '', '## Příprava', ...chapter.preparation.map(text => `- ${text}`), '', '## Kulturní kontext'];
  for (const context of chapter.context || []) {
    lines.push('', `[${context.kind === 'documented-fact' ? 'Doložený kontext' : 'Autorská interpretace'}] ${context.text}`);
    for (const id of context.sourceIds || []) { const source = sources.get(id); if (source) lines.push(`${source.label}: ${source.url}`); }
  }
  for (const id of chapter.lessonIds) {
    const lesson = lessons.get(id);
    lines.push('', `## ${lesson.title}`, '', `Cíl: ${lesson.objective}`, '', `Otázka: ${lesson.question}`, '', '### Kontext', lesson.why, '', '### Čeho si všimnout', lesson.notice, '', '### Vysvětlená autorská ukázka', lesson.example, '', '### Vlastní pokus', ...lesson.steps.map((text, index) => `${index + 1}. ${text}`), '', '### Zpětná vazba', ...lesson.check.map(text => `- ${text}`), '', `Výstup: ${lesson.artifact}`, '', `Přenos: ${lesson.transfer}`, '', `Pokročilá varianta: ${lesson.advanced}`);
  }
  lines.push('', '## Praktická trasa', route?.summary || '', '', 'Časy a přesuny jsou návrh práce, nikoli rezervace nebo živá informace o dopravě.');
  for (const [index, stop] of (route?.stops || []).entries()) {
    const place = places.get(stop.placeId);
    if (!place) continue;
    lines.push('', `### ${index + 1}. ${stop.title}`, '', `Adresa: ${place.address}`, `Navržený blok: ${stop.proposedTime || 'Podle vlastního tempa'}`, '', `Úkol: ${stop.task}`, '', `Přesun: ${stop.transfer}`, '', `Podmínky: ${stop.conditions}`, '', `Provozní informace (${place.access.status}${place.access.checkedAt ? `; kontrola ${place.access.checkedAt}` : ''}): ${place.access.summary}`);
    for (const item of place.access.requiresConfirmation || []) lines.push(`- Ověř předem: ${item}`);
    for (const source of place.sources) lines.push(`Zdroj — ${source.label}: ${source.url}`);
    lines.push(`Adresní navigace (nejde o ověřený vstup): https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`);
  }
  lines.push('', '## Varianta bez dostupné aktivity', chapter.homeAlternative || '', '', '## Můj Blackbook');
  const note = notebook.notes?.[chapterId] || {};
  for (const key of NOTE_FIELDS) if (typeof note[key] === 'string' && note[key]) lines.push('', `### ${noteLabels[key]}`, note[key]);
  if (!NOTE_FIELDS.some(key => note[key])) lines.push('', 'Zatím bez vlastních poznámek.');
  lines.push('', 'Záznam zastávky není důkaz získané dovednosti. Přenos a revizi posuzuj podle vlastní práce a konkrétní zpětné vazby.', '');
  return lines.join('\n');
}
