export const imprintKey = 'caisik-needle-imprint-v1';
export const imprintEvent = 'caisik:needle-imprint-change';
export const imprintLength = 8;

function normalizeImprint(value) {
  if (!Array.isArray(value?.steps) || value.steps.length !== imprintLength) return null;
  const steps = Array.from(value.steps);
  if (!steps.every(step => typeof step === 'boolean') || !steps.includes(true)) return null;
  return { steps, returned: value.returned === true };
}

export function readImprint(storage) {
  try {
    return normalizeImprint(JSON.parse((storage ?? globalThis.UAStoryState?.storage ?? globalThis.localStorage).getItem(imprintKey)));
  } catch {
    return null;
  }
}

export function writeImprint(imprint, storage) {
  const value = normalizeImprint(imprint);
  if (!value) return false;
  try {
    (storage ?? globalThis.UAStoryState?.storage ?? globalThis.localStorage).setItem(imprintKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
