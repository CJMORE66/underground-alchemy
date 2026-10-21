/* Pure, dependency-free validation for the editable expedition content contract. */
const CHAPTER_IDS = ['dj', 'mc', 'writer', 'breaking', 'knowledge'];
const fail = (path, message) => { throw new Error(`Expedition data: ${path} ${message}`); };
const object = (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object.');
  return value;
};
const text = (value, path) => {
  if (typeof value !== 'string' || !value.trim()) fail(path, 'must be a non-empty string.');
  return value;
};
const array = (value, path, length) => {
  if (!Array.isArray(value)) fail(path, 'must be an array.');
  if (length !== undefined && value.length !== length) fail(path, `must contain ${length} items.`);
  return value;
};
const strings = (value, path, length) => array(value, path, length).forEach((v, i) => text(v, `${path}[${i}]`));
const safeUrl = (value, path) => {
  text(value, path);
  let parsed;
  try { parsed = new URL(value); } catch { fail(path, 'must be an absolute HTTP(S) URL.'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) fail(path, 'must be a safe HTTP(S) URL without credentials.');
};
const assetPath = (value, path) => {
  text(value, path);
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('..') || /[<>"'\\\s]/.test(value)) fail(path, 'must be a safe root-relative local asset path.');
};
const index = (values, path) => {
  const map = new Map();
  values.forEach((value, i) => {
    object(value, `${path}[${i}]`); text(value.id, `${path}[${i}].id`);
    if (map.has(value.id)) fail(path, `contains duplicate ID ${value.id}.`);
    map.set(value.id, value);
  });
  return map;
};
const reference = (value, map, path) => {
  text(value, path);
  if (!map.has(value)) fail(path, `references unknown ID ${value}.`);
};
const sourceLink = (value, path) => {
  object(value, path); text(value.label, `${path}.label`); safeUrl(value.url, `${path}.url`);
};

export function validateExpeditionData(data) {
  object(data, 'root');
  if (data.schemaVersion !== 1) fail('schemaVersion', 'must equal 1.');
  const chapters = index(array(data.chapters, 'chapters', 5), 'chapters');
  const lessons = index(array(data.lessons, 'lessons', 15), 'lessons');
  const places = index(array(data.places, 'places'), 'places');
  const routes = index(array(data.routes, 'routes', 5), 'routes');
  const sources = index(array(data.sources, 'sources'), 'sources');
  const contracts = index(array(data.sceneContracts, 'sceneContracts', 5), 'sceneContracts');
  if (!places.size) fail('places', 'must not be empty.');
  for (const id of CHAPTER_IDS) if (!chapters.has(id)) fail('chapters', `is missing ${id}.`);
  for (const [id, source] of sources) {
    sourceLink(source, `sources.${id}`); text(source.kind, `sources.${id}.kind`);
  }
  for (const [id, chapter] of chapters) {
    const p = `chapters.${id}`;
    if (!CHAPTER_IDS.includes(id)) fail(p, 'has an unsupported chapter ID.');
    for (const name of ['label','title','subtitle','teaser','outcome','homeAlternative']) text(chapter[name], `${p}.${name}`);
    if (!Number.isInteger(chapter.number) || chapter.number !== CHAPTER_IDS.indexOf(id) + 1) fail(`${p}.number`, 'does not match the canonical chapter order.');
    strings(chapter.goals, `${p}.goals`, 3); strings(chapter.lessonIds, `${p}.lessonIds`, 3);
    if (new Set(chapter.lessonIds).size !== 3) fail(`${p}.lessonIds`, 'must reference three different lessons.');
    array(chapter.preparation, `${p}.preparation`); strings(chapter.preparation, `${p}.preparation`);
    if (!chapter.preparation.length) fail(`${p}.preparation`, 'must not be empty.');
    reference(chapter.routeId, routes, `${p}.routeId`);
    if (routes.get(chapter.routeId).chapterId !== id) fail(`${p}.routeId`, 'belongs to another chapter.');
    chapter.lessonIds.forEach((lessonId, i) => {
      reference(lessonId, lessons, `${p}.lessonIds[${i}]`);
      if (lessons.get(lessonId).chapterId !== id) fail(`${p}.lessonIds[${i}]`, 'belongs to another chapter.');
    });
    array(chapter.context, `${p}.context`).forEach((item, i) => {
      const q = `${p}.context[${i}]`; object(item, q); text(item.text, `${q}.text`);
      if (!['documented-fact','artistic-interpretation'].includes(item.kind)) fail(`${q}.kind`, 'must distinguish fact from interpretation.');
      strings(item.sourceIds, `${q}.sourceIds`);
      item.sourceIds.forEach(sourceId => reference(sourceId, sources, `${q}.sourceIds`));
      if (item.kind === 'documented-fact' && !item.sourceIds.length) fail(q, 'documented facts require a source.');
    });
    if (!chapter.context.length) fail(`${p}.context`, 'must not be empty.');
    object(chapter.art, `${p}.art`); assetPath(chapter.art.poster, `${p}.art.poster`);
    assetPath(chapter.art.layer, `${p}.art.layer`); text(chapter.art.alt, `${p}.art.alt`);
  }
  for (const [id, lesson] of lessons) {
    const p = `lessons.${id}`;
    if (!id.startsWith('lesson-')) fail(p, 'must use the lesson- namespace.');
    reference(lesson.chapterId, chapters, `${p}.chapterId`);
    for (const name of ['sourceId','title','objective','question','why','notice','example','artifact','advanced','transfer','kind','reviewStatus']) text(lesson[name], `${p}.${name}`);
    for (const name of ['steps','check']) {
      strings(lesson[name], `${p}.${name}`);
      if (!lesson[name].length) fail(`${p}.${name}`, 'must not be empty.');
    }
    if (!chapters.get(lesson.chapterId).lessonIds.includes(id)) fail(p, 'is not assigned to its chapter.');
  }
  for (const [id, place] of places) {
    const p = `places.${id}`;
    for (const name of ['name','address']) text(place[name], `${p}.${name}`);
    if (place.coordinates !== null) {
      object(place.coordinates, `${p}.coordinates`);
      const {lat, lng} = place.coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) fail(`${p}.coordinates`, 'must be null or finite valid latitude/longitude.');
    }
    array(place.sources, `${p}.sources`).forEach((s, i) => sourceLink(s, `${p}.sources[${i}]`));
    if (!place.sources.length) fail(`${p}.sources`, 'must contain a venue source.');
    object(place.access, `${p}.access`);
    if (!['verified','partial','unverified'].includes(place.access.status)) fail(`${p}.access.status`, 'has an unsupported verification state.');
    if (place.access.checkedAt !== null && (typeof place.access.checkedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(place.access.checkedAt))) fail(`${p}.access.checkedAt`, 'must be null or YYYY-MM-DD.');
    if (place.access.status === 'verified' && !place.access.checkedAt) fail(`${p}.access`, 'a verified record requires a check date.');
    text(place.access.summary, `${p}.access.summary`); strings(place.access.requiresConfirmation, `${p}.access.requiresConfirmation`);
  }
  const stopIds = new Set(); let count = 0;
  for (const [id, route] of routes) {
    const p = `routes.${id}`;
    if (!id.startsWith('route-')) fail(p, 'must use the route- namespace.');
    reference(route.chapterId, chapters, `${p}.chapterId`); text(route.title, `${p}.title`); text(route.summary, `${p}.summary`);
    array(route.stops, `${p}.stops`).forEach((stop, i) => {
      const q = `${p}.stops[${i}]`; object(stop, q); text(stop.id, `${q}.id`);
      if (!stop.id.startsWith('stop-') || stopIds.has(stop.id) || lessons.has(stop.id)) fail(`${q}.id`, 'must be a unique stop- ID separate from lesson IDs.');
      stopIds.add(stop.id); count++;
      for (const name of ['sourceId','title','task','transfer','conditions','proposedTime']) text(stop[name], `${q}.${name}`);
      reference(stop.placeId, places, `${q}.placeId`); reference(stop.lessonId, lessons, `${q}.lessonId`);
      if (lessons.get(stop.lessonId).chapterId !== route.chapterId) fail(`${q}.lessonId`, 'belongs to another expedition.');
      if (!Number.isFinite(stop.durationMinutes) || stop.durationMinutes <= 0) fail(`${q}.durationMinutes`, 'must be a positive number.');
      if (typeof stop.optional !== 'boolean') fail(`${q}.optional`, 'must be a boolean.');
    });
    if (chapters.get(route.chapterId).routeId !== id) fail(p, 'is not assigned to its chapter.');
  }
  if (count !== 31) fail('routes.stops', 'must contain 31 route placements.');
  for (const [id, contract] of contracts) {
    const p = `sceneContracts.${id}`; reference(id, chapters, `${p}.id`);
    if (contract.nativeScroll !== true) fail(`${p}.nativeScroll`, 'must use native scroll.');
    if (!Number.isFinite(contract.durationScrollViewport) || contract.durationScrollViewport <= 0) fail(`${p}.durationScrollViewport`, 'must be positive.');
    for (const name of ['semanticMotion','reducedMotion','staticFrame','mobile','note']) text(contract[name], `${p}.${name}`);
    array(contract.states, `${p}.states`).forEach((state, i) => {
      const q = `${p}.states[${i}]`; object(state, q); text(state.role, `${q}.role`); text(state.visual, `${q}.visual`);
      array(state.range, `${q}.range`, 2);
      if (!state.range.every(Number.isFinite) || state.range[0] < 0 || state.range[1] > 1 || state.range[0] >= state.range[1]) fail(`${q}.range`, 'must be a valid increasing range between 0 and 1.');
      if (state.lessonId) reference(state.lessonId, lessons, `${q}.lessonId`);
    });
    strings(contract.assets, `${p}.assets`); contract.assets.forEach((asset, i) => assetPath(asset, `${p}.assets[${i}]`));
  }
  object(data.mediaStatus, 'mediaStatus');
  strings(data.mediaStatus.missing, 'mediaStatus.missing'); strings(data.mediaStatus.notes, 'mediaStatus.notes');
  return data;
}
