export const revizorKey = 'caisik-metro-mc-v1';
export const revizorEvent = 'caisik:revizor-change';
export const revizorMax = 72;

const invalidEndingCharacters = /[\p{Cc}\p{Cs}\p{Zl}\p{Zp}\p{Bidi_Control}]/u;

export function normalizeEnding(value) {
  if (typeof value !== 'string' || invalidEndingCharacters.test(value)) return '';
  const ending = value.trim();
  return ending.length <= revizorMax ? ending : '';
}

function normalizeVerse(value) {
  if (!Array.isArray(value?.endings) || value.endings.length !== 2) return null;
  if (!['cs', 'en', 'fr'].includes(value.lang)) return null;
  const first = normalizeEnding(value.endings[0]);
  const second = normalizeEnding(value.endings[1]);
  if (!first || !second) return null;
  return {endings: [first, second], lang: value.lang};
}

export function readRevizor(storage) {
  try {
    return normalizeVerse(JSON.parse((storage ?? globalThis.UAStoryState?.storage ?? globalThis.localStorage).getItem(revizorKey)));
  } catch {
    return null;
  }
}

export function writeRevizor(verse, storage) {
  const value = normalizeVerse(verse);
  if (!value) return false;
  try {
    (storage ?? globalThis.UAStoryState?.storage ?? globalThis.localStorage).setItem(revizorKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
