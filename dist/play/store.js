/* CAISIK Selfmade: private browser state. No network, upload or legacy-key writes. */
export const STORAGE_KEY = 'caisik-selfmade-v1';
export const DISCIPLINES = Object.freeze(['dj', 'mc', 'writer', 'breaking', 'knowledge']);
const COLLECTIONS = ['artifacts', 'inventory', 'quests', 'observations', 'routes', 'events'];
const MAX_BYTES = 8_000_000;
const MAX_ITEMS = 1000;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const plain = x => !!x && typeof x === 'object' && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const clone = x => JSON.parse(JSON.stringify(x));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const text = (x, limit = 12000) => typeof x === 'string' ? x.slice(0, limit) : '';
const enumValue = (x, options, fallback) => options.includes(x) ? x : fallback;
const idValid = x => typeof x === 'string' && /^[a-zA-Z0-9_.:-]{1,160}$/.test(x) && !BAD_KEYS.has(x);
export const createId = (prefix = 'item') => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
export function emptyState() {
  return {schemaVersion: 1, revision: 0,
    profile: {alias: '', disciplines: [], intent: '', minutes: 30, mode: 'experiment', codex: [], future: '', symbol: ''},
    settings: {motion: 'full', day: 'night', atmosphere: 'focus', audio: false},
    artifacts: [], inventory: [], quests: [], observations: [], routes: [], drafts: {}, events: []};
}
// Keep arbitrary workshop fields while rejecting non-JSON values and prototype keys.
function safeJSON(value, depth = 0) {
  if (depth > 14) throw Error('Data mají příliš hluboké vnoření.');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw Error('Neplatné číslo v datech.'); return value; }
  if (typeof value === 'string') return value.slice(0, 120000);
  if (Array.isArray(value)) {
    if (value.length > 16000) throw Error('Příliš mnoho prvků v jednom záznamu.');
    return value.map(x => safeJSON(x, depth + 1));
  }
  if (!plain(value)) throw Error('Data musí být běžný JSON.');
  const out = {};
  if (Object.keys(value).length > 1000) throw Error('Příliš mnoho polí v záznamu.');
  for (const [key, item] of Object.entries(value)) {
    if (BAD_KEYS.has(key)) throw Error('Nebezpečný název pole v datech.');
    if (item !== undefined) out[key] = safeJSON(item, depth + 1);
  }
  return out;
}
function records(value, name) {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) throw Error(`Neplatná kolekce ${name}.`);
  const seen = new Set();
  return value.map(item => {
    if (!plain(item) || !idValid(item.id) || seen.has(item.id)) throw Error(`Neplatné nebo duplicitní ID v ${name}.`);
    seen.add(item.id);
    return safeJSON(item);
  });
}
export function normalizeState(input) {
  if (!plain(input) || input.schemaVersion !== 1 || !plain(input.profile) || !plain(input.settings) || !plain(input.drafts)) throw Error('Neplatný formát CAISIK Selfmade v1.');
  const out = emptyState(), p = input.profile, s = input.settings;
  out.revision = Number.isSafeInteger(input.revision) && input.revision >= 0 ? input.revision : 0;
  out.profile = {...safeJSON(p), alias: text(p.alias, 64), disciplines: [...new Set((Array.isArray(p.disciplines) ? p.disciplines : []).filter(d => DISCIPLINES.includes(d)))], intent: text(p.intent), minutes: Math.max(5, Math.min(480, Number(p.minutes) || 30)), mode: enumValue(p.mode, ['observe','experiment','study','create','observation','intensive'], 'experiment'), codex: (Array.isArray(p.codex) ? p.codex : []).filter(x => typeof x === 'string').slice(0, 3).map(x => text(x, 500)), future: text(p.future), symbol: text(p.symbol, 120000)};
  out.settings = {...safeJSON(s), motion: enumValue(s.motion, ['full','reduced','off','calm'], 'full'), day: enumValue(s.day, ['day','night'], 'night'), atmosphere: enumValue(s.atmosphere, ['focus','tension','calm'], 'focus'), audio: s.audio === true};
  for (const name of COLLECTIONS) out[name] = records(input[name], name);
  for (const artifact of out.artifacts) {
    if (!DISCIPLINES.includes(artifact.discipline) && artifact.discipline !== 'custom' && artifact.discipline !== 'cross') throw Error('Neplatná disciplína díla.');
    artifact.title = text(artifact.title, 180);
    artifact.versions = records(artifact.versions, 'verze');
    if (artifact.versions.length > 200) throw Error('Dílo překročilo 200 verzí. Nejprve exportuj archiv.');
  }
  out.drafts = safeJSON(input.drafts);
  if (JSON.stringify(out).length > MAX_BYTES) throw Error('Textový sešit je příliš velký. Exportuj a rozděl projekty.');
  return out;
}
function alternateId(id, entries) {
  let n = 1, candidate;
  do { candidate = `${id.slice(0,145)}-import-${n++}`; } while (entries.some(x => x.id === candidate));
  return candidate;
}
function mergeRecords(current, incoming, preserveConflicts = false) {
  const out = clone(current);
  for (const item of incoming) {
    const index = out.findIndex(x => x.id === item.id);
    if (index === -1) out.push(clone(item));
    else if (preserveConflicts && !same(out[index], item)) {
      const already = out.some(x => same({...x, id: item.id}, item));
      if (!already) out.push({...clone(item), id: alternateId(item.id, out)});
    } else out[index] = {...out[index], ...clone(item)};
  }
  return out;
}
function mergeDrafts(current, incoming) {
  const out = clone(current);
  for (const [key, value] of Object.entries(incoming)) {
    if (!Object.hasOwn(out, key)) out[key] = clone(value);
    else if (plain(out[key]) && plain(value)) out[key] = mergeDrafts(out[key], value);
    else if (Array.isArray(out[key]) && Array.isArray(value)) {
      if (!out[key].length) out[key] = clone(value);
      else if ([...out[key], ...value].every(item => plain(item) && idValid(item.id))) out[key] = mergeRecords(out[key], value, true);
      else if ([...out[key], ...value].every(item => item === null || ['string', 'number', 'boolean'].includes(typeof item))) out[key] = [...new Set([...out[key], ...value])];
    }
  }
  return out;
}
function mergeImports(current, incoming) {
  const out = clone(current);
  // Existing profile and drafts win; an import never silently replaces current work.
  for (const [key, value] of Object.entries(incoming.profile)) if (out.profile[key] === '' || (Array.isArray(out.profile[key]) && !out.profile[key].length)) out.profile[key] = clone(value);
  out.drafts = mergeDrafts(out.drafts, incoming.drafts);
  for (const name of COLLECTIONS) {
    if (name !== 'artifacts') out[name] = mergeRecords(out[name], incoming[name], true);
  }
  for (const incomingArtifact of incoming.artifacts) {
    const existing = out.artifacts.find(a => a.id === incomingArtifact.id);
    if (!existing) out.artifacts.push(clone(incomingArtifact));
    else if (existing.discipline !== incomingArtifact.discipline) out.artifacts.push({...clone(incomingArtifact), id: alternateId(incomingArtifact.id, out.artifacts)});
    else {
      existing.versions = mergeRecords(existing.versions, incomingArtifact.versions, true);
      if (String(incomingArtifact.updatedAt || '') > String(existing.updatedAt || '')) existing.updatedAt = incomingArtifact.updatedAt;
    }
  }
  return normalizeState(out);
}
// Only changed keys are applied to the latest storage read. Concurrent additions
// and untouched fields survive; edits to the very same field use last writer wins.
function applyObjectDiff(latest, before, after) {
  const out = plain(latest) ? clone(latest) : {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (same(before[key], after[key])) continue;
    if (after[key] === undefined) delete out[key];
    else if (plain(before[key]) && plain(after[key])) out[key] = applyObjectDiff(out[key], before[key], after[key]);
    else out[key] = clone(after[key]);
  }
  return out;
}
function applyDiff(latest, before, after) {
  const out = clone(latest);
  for (const section of ['profile', 'settings', 'drafts']) out[section] = applyObjectDiff(latest[section], before[section], after[section]);
  for (const section of COLLECTIONS) {
    const previous = new Map(before[section].map(x => [x.id, x]));
    const next = new Map(after[section].map(x => [x.id, x]));
    out[section] = out[section].filter(x => !previous.has(x.id) || next.has(x.id));
    for (const item of after[section]) {
      if (same(previous.get(item.id), item)) continue;
      const index = out[section].findIndex(x => x.id === item.id);
      if (index === -1) out[section].push(clone(item));
      else if (section === 'artifacts') {
        const old = previous.get(item.id), live = out[section][index];
        const changed = {...live};
        for (const key of Object.keys(item)) if (key !== 'versions' && !same(old?.[key], item[key])) changed[key] = clone(item[key]);
        changed.versions = mergeRecords(live.versions, item.versions.filter(v => !same(old?.versions?.find(x => x.id === v.id), v)), true);
        out[section][index] = changed;
      } else out[section][index] = clone(item);
    }
  }
  return out;
}
export function createStore({onStatus = () => {}, storage = () => globalThis.localStorage, eventTarget = globalThis.window, now = () => new Date().toISOString()} = {}) {
  let state = emptyState(), durable = false, problem = null, recovery = null, pendingBase = null, pendingState = null;
  const subscribers = new Set();
  const status = message => { try { onStatus({durable, problem, message}); } catch {} };
  const emit = () => { for (const fn of subscribers) try { fn(clone(state)); } catch {} };
  function read() {
    let target, raw;
    try { target = typeof storage === 'function' ? storage() : storage; if (!target?.getItem || !target?.setItem) throw Error(); raw = target.getItem(STORAGE_KEY); }
    catch { return {ok:false, problem:'unavailable'}; }
    if (raw === null || raw === undefined || raw === '') return {ok:true, target, value:emptyState(), raw:null};
    try { if (raw.length > MAX_BYTES * 2) throw Error(); return {ok:true, target, value:normalizeState(JSON.parse(raw)), raw}; }
    catch { recovery = {raw: String(raw), reason:'corrupt', capturedAt:now()}; return {ok:false, problem:'corrupt'}; }
  }
  function sync() {
    const current = read();
    if (current.ok) {
      state = pendingBase ? normalizeState(applyDiff(current.value, pendingBase, pendingState)) : current.value;
      durable = !pendingBase; problem = pendingBase ? 'unsaved' : null;
    } else { durable = false; problem = current.problem; }
    return current;
  }
  const initial = sync();
  status(initial.ok ? 'Sešit je uložený pouze v tomto prohlížeči.' : problem === 'corrupt' ? 'Poškozený originál je zachován. Nové změny jsou jen v paměti; exportuj záchrannou kopii.' : 'Úložiště není dostupné. Změny zůstávají jen v paměti; exportuj je.');
  function update(mutator) {
    sync();
    const before = clone(state);
    let candidate;
    try { const draft = clone(state); const result = mutator(draft); candidate = normalizeState(result && plain(result) ? result : draft); }
    catch (error) { status(`Změna nebyla přijata: ${error.message}`); return false; }
    if (!pendingBase) pendingBase = before;
    pendingState = candidate;
    state = candidate;
    // A second read protects against a different tab writing while the mutator ran.
    const latest = read();
    if (!latest.ok) {
      durable = false; problem = latest.problem; emit();
      status(problem === 'corrupt' ? 'Poškozený originál nepřepisuji. Změna je jen v paměti; exportuj ji.' : 'Uložení selhalo. Změna zůstává jen v paměti; exportuj ji.'); return false;
    }
    try {
      const merged = normalizeState(applyDiff(latest.value, pendingBase, candidate));
      merged.revision = Math.max(latest.value.revision, before.revision) + 1;
      const serialized = JSON.stringify(merged);
      latest.target.setItem(STORAGE_KEY, serialized);
      if (latest.target.getItem(STORAGE_KEY) !== serialized) throw Error('Zápis nebyl potvrzen.');
      state = merged; pendingBase = pendingState = null; durable = true; problem = null;
      emit(); status('Uloženo v tomto prohlížeči. Pravidelně exportuj vlastní zálohu.'); return true;
    } catch {
      durable = false; problem = 'quota'; emit(); status('Uložení nebylo potvrzeno (například plné úložiště). Změna zůstává v paměti; exportuj ji.'); return false;
    }
  }
  const onStorage = e => { if (e?.key === STORAGE_KEY || e?.key === null) { sync(); emit(); status(durable ? 'Sešit byl obnoven podle změny v jiné kartě.' : 'Změny z jiné karty byly sloučeny; vlastní neuloženou práci exportuj.'); } };
  eventTarget?.addEventListener?.('storage', onStorage);
  return {
    get() { return clone(state); },
    update,
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    exportData() { return {...clone(state), exportedAt:now(), ...(recovery ? {recovery:clone(recovery)} : {})}; },
    previewImport(input) {
      const imported = normalizeState(input);
      const merged = mergeImports(state, imported);
      return {artifacts:imported.artifacts.length, versions:imported.artifacts.reduce((n,a) => n+a.versions.length,0), inventory:imported.inventory.length, quests:imported.quests.length, observations:imported.observations.length, routes:imported.routes.length, additions:merged.artifacts.length-state.artifacts.length, preservesExisting:true};
    },
    importData(input) { const imported = normalizeState(input); return update(current => mergeImports(current, imported)); },
    status() { return {durable, problem, hasRecovery:!!recovery}; },
    destroy() { eventTarget?.removeEventListener?.('storage',onStorage); subscribers.clear(); }
  };
}
