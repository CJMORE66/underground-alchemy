export const writerRepairKey = 'caisik-transmute-repair-v1';
export const writerRepairEvent = 'caisik:writer-repair-change';
export const repairPointLimit = 96;

function normalizeRepair(value) {
  if (!value || !['drawn', 'preset'].includes(value.kind)) return null;
  const { kind, points } = value;
  if (!Array.isArray(points) || points.length < 2 || points.length > repairPointLimit) return null;
  const isCoordinate = coordinate => Number.isInteger(coordinate) && coordinate >= 0 && coordinate <= 100;
  if (!Array.from(points).every(point => Array.isArray(point) && point.length === 2 &&
    isCoordinate(point[0]) && isCoordinate(point[1]))) return null;
  if (!points.some(([x, y]) => x !== points[0][0] || y !== points[0][1])) return null;
  return { kind, points };
}

export function readWriterRepair(storage) {
  try {
    return normalizeRepair(JSON.parse((storage ?? localStorage).getItem(writerRepairKey)));
  } catch { return null; }
}

export function writeWriterRepair(value, storage) {
  const repair = normalizeRepair(value);
  if (!repair) return false;
  try {
    (storage ?? localStorage).setItem(writerRepairKey, JSON.stringify(repair));
    return true;
  } catch { return false; }
}
