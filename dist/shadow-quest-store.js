export const shadowRoutineKey = 'caisik-shadow-routine-v1';
export const shadowRoutineEvent = 'caisik:shadow-routine-change';
export const shadowMoves = Object.freeze(['step', 'turn', 'freeze']);
export const shadowMoveLabels = {
  cs: { step: 'Krok', turn: 'Otočka', freeze: 'Freeze' },
  en: { step: 'Step', turn: 'Turn', freeze: 'Freeze' },
  fr: { step: 'Pas', turn: 'Tour', freeze: 'Freeze' },
};

function normalizeRoutine(value) {
  if (!Array.isArray(value?.moves) || value.moves.length !== shadowMoves.length) return null;
  const moves = Array.from(value.moves);
  return shadowMoves.every(move => moves.includes(move)) ? { moves } : null;
}

export function readShadowRoutine(storage) {
  try {
    return normalizeRoutine(JSON.parse((storage ?? globalThis.UAStoryState?.storage ?? globalThis.localStorage).getItem(shadowRoutineKey)));
  } catch { return null; }
}

export function writeShadowRoutine(value, storage) {
  const routine = normalizeRoutine(value);
  if (!routine) return false;
  try {
    (storage ?? globalThis.UAStoryState?.storage ?? globalThis.localStorage).setItem(shadowRoutineKey, JSON.stringify(routine));
    return true;
  } catch { return false; }
}
