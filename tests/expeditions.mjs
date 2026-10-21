import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateExpeditionData} from '../dist/expeditions/schema.js';

// Run from any working directory: node /absolute/path/to/tests/expeditions.mjs
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(project, 'dist');
const read = relative => fs.readFileSync(path.join(project, relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const clone = value => structuredClone(value);
const normalize = value => String(value || '').normalize('NFC').replace(/\s+/g, ' ').trim();
const order = ['dj', 'mc', 'writer', 'breaking', 'knowledge'];
const data = json('dist/expeditions/data/expeditions.json');
const manifest = json('docs/expeditions/ASSET_IMPORT.json');
const chapters = new Map(data.chapters.map(item => [item.id, item]));
const lessons = new Map(data.lessons.map(item => [item.id, item]));
const places = new Map(data.places.map(item => [item.id, item]));
const sources = new Map(data.sources.map(item => [item.id, item]));
const placements = data.routes.flatMap(route => route.stops);
const origin = 'https://caisik-underground-alchemy.caisik.chatgpt.site';
const parsedPages = new Map();
const htmlParser = String.raw`
import json, sys
from html.parser import HTMLParser
from pathlib import Path
class Tree(HTMLParser):
    void = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.nodes = [{'tag':'#document','attrs':{},'parent':None,'children':[]}]
        self.stack = [0]
    def handle_starttag(self, tag, attrs):
        i = len(self.nodes)
        self.nodes.append({'tag':tag,'attrs':dict(attrs),'parent':self.stack[-1],'children':[]})
        self.nodes[self.stack[-1]]['children'].append(i)
        if tag not in self.void: self.stack.append(i)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.void: self.stack.pop()
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.nodes[self.stack[i]]['tag'] == tag:
                self.stack = self.stack[:i]
                return
    def handle_data(self, data):
        self.nodes[self.stack[-1]]['children'].append(data)
p = Tree()
p.feed(Path(sys.argv[1]).read_text())
print(json.dumps(p.nodes, ensure_ascii=False))
`;

function parsePage(file) {
  if (parsedPages.has(file)) return parsedPages.get(file);
  const result = spawnSync('python', ['-c', htmlParser, file], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  assert.equal(result.status, 0, `HTML parsing succeeds: ${file}: ${result.stderr}`);
  const nodes = JSON.parse(result.stdout);
  const page = {nodes, file};
  for (const [index, node] of nodes.entries()) { node.index = index; node.page = page; }
  parsedPages.set(file, page);
  return page;
}

function elements(page, predicate) { return page.nodes.filter(node => node.tag !== '#document' && predicate(node)); }
function byId(page, id) { return page.nodes.find(node => node.attrs.id === id); }
function descendants(node, predicate) {
  const output = [];
  for (const child of node.children) if (typeof child === 'number') {
    const item = node.page.nodes[child];
    if (predicate(item)) output.push(item);
    output.push(...descendants(item, predicate));
  }
  return output;
}
function nodeText(node) {
  if (!node || ['script', 'style', 'template'].includes(node.tag)) return '';
  return node.children.map(child => typeof child === 'string' ? child : nodeText(node.page.nodes[child])).join(' ');
}
function visibleWithoutScript(node) {
  for (let item = node; item; item = item.parent === null ? null : item.page.nodes[item.parent]) {
    if (Object.hasOwn(item.attrs, 'hidden') || item.attrs['aria-hidden'] === 'true' || /display\s*:\s*none|visibility\s*:\s*hidden/.test(item.attrs.style || '')) return false;
  }
  return true;
}

function includesText(node, expected, label) {
  assert(normalize(nodeText(node)).includes(normalize(expected)), `${label}: authored text is present in static HTML`);
}

function safeExternal(value, label) {
  assert(!value.startsWith('//'), `${label}: no protocol-relative URL`);
  const url = new URL(value);
  assert(['https:', 'http:'].includes(url.protocol), `${label}: HTTP(S) URL`);
  assert(!url.username && !url.password, `${label}: no embedded credentials`);
  return url;
}

function localFile(url, label) {
  const decoded = decodeURIComponent(url.pathname);
  const absolute = path.resolve(dist, `.${decoded}`);
  assert(absolute === dist || absolute.startsWith(`${dist}${path.sep}`), `${label}: inside dist`);
  assert(fs.existsSync(absolute), `${label}: local path exists: ${url.pathname}`);
  const file = fs.statSync(absolute).isDirectory() ? path.join(absolute, 'index.html') : absolute;
  assert(fs.existsSync(file), `${label}: static route has an index.html`);
  return file;
}

function webpDimensions(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4), start = offset + 8;
    assert(start + size <= bytes.length, 'WebP chunk is not truncated');
    if (type === 'VP8X') return [bytes.readUIntLE(start + 4, 3) + 1, bytes.readUIntLE(start + 7, 3) + 1];
    if (type === 'VP8L') {
      assert.equal(bytes[start], 0x2f);
      const packed = bytes.readUInt32LE(start + 1);
      return [(packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1];
    }
    if (type === 'VP8 ') {
      assert.equal(bytes.toString('hex', start + 3, start + 6), '9d012a');
      return [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    }
    offset = start + size + (size % 2);
  }
  assert.fail('WebP dimensions are unavailable');
}

function verifyAsset(relative, expected, label) {
  const bytes = fs.readFileSync(path.join(project, relative));
  assert.equal(bytes.length, expected.bytes, `${label}: recorded file size`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, `${label}: unchanged SHA-256`);
  if (expected.dimensions) assert.deepEqual(webpDimensions(bytes), expected.dimensions, `${label}: actual dimensions`);
}

// Test the editable content contract with real, deliberately broken graph edges.
const before = clone(data);
assert.equal(validateExpeditionData(data), data);
assert.deepEqual(data, before, 'Validation does not mutate the content or coerce unknown positions');
assert.deepEqual([...chapters.keys()], order);
assert.equal(data.lessons.length, 15);
assert.equal(placements.length, 31);
assert.equal(places.size, 23, 'Shared physical places are deduplicated');
assert.equal(new Set(placements.map(item => item.placeId)).size, 23);
assert(data.places.every(place => place.coordinates === null), 'All unverified coordinates remain null, never 0,0');
assert.equal(new Set(placements.map(item => item.id)).size, 31);
assert(data.lessons.every(lesson => lesson.id.startsWith('lesson-')));
assert(placements.every(stop => stop.id.startsWith('stop-') && !lessons.has(stop.id)));
for (const lesson of data.lessons) {
  assert(Array.isArray(lesson.sourceIds));
  for (const id of lesson.sourceIds) assert(sources.has(id), `${lesson.id}: known source ${id}`);
}
for (const source of data.sources) safeExternal(source.url, source.id);
for (const place of data.places) for (const source of place.sources) safeExternal(source.url, `${place.id} source`);
const invalid = [
  ['missing place reference', value => { value.routes[0].stops[0].placeId = 'missing-place'; }],
  ['missing lesson reference', value => { value.routes[0].stops[0].lessonId = 'lesson-does-not-exist'; }],
  ['wrong expedition lesson', value => { value.routes[0].stops[0].lessonId = value.chapters[1].lessonIds[0]; }],
  ['missing cultural source', value => { value.chapters[0].context[0].sourceIds = ['missing-source']; }],
  ['duplicate physical place', value => { value.places[1].id = value.places[0].id; }],
  ['duplicate route placement', value => { value.routes[0].stops[1].id = value.routes[0].stops[0].id; }],
  ['lesson and placement identity collision', value => { value.routes[0].stops[0].id = value.lessons[0].id; }],
  ['missing coordinate state', value => { delete value.places[0].coordinates; }],
  ['string coordinates', value => { value.places[0].coordinates = {lat: '48.8', lng: '2.3'}; }],
  ['out of range coordinates', value => { value.places[0].coordinates = {lat: 91, lng: 181}; }],
  ['unsafe local art path', value => { value.chapters[0].art.poster = '//untrusted.example/art.webp'; }],
  ...['javascript:alert(1)', 'data:text/plain,source', 'file:///etc/passwd', '//untrusted.example/source', 'https://name:secret@example.com/source'].map(url =>
    [`unsafe source ${url.split(':')[0]}`, value => { value.sources[0].url = url; }]),
  ['unsafe venue source', value => { value.places[0].sources[0].url = 'javascript:alert(1)'; }]
];
for (const [label, mutate] of invalid) {
  const broken = clone(data); mutate(broken);
  assert.throws(() => validateExpeditionData(broken), undefined, `Runtime validation rejects ${label}`);
}
console.log(`PASS: 5 chapters, 15 lessons, 31 placements, 23 deduplicated places; null coordinates, separate identities, source graph; ${invalid.length} malformed inputs rejected.`);

// Recovering source art must not silently replace the user's approved artwork.
assert.equal(manifest.recoveryStatus, 'complete');
assert.equal(manifest.masters.length, 5);
assert.equal(manifest.productionArtwork.length, 5);
for (const id of order) {
  const recovered = manifest.masters.find(item => item.id === id);
  const active = manifest.productionArtwork.find(item => item.id === id);
  assert(recovered?.recovered && recovered.importExitCode === 0, `${id}: real master import succeeded`);
  assert.equal(recovered.selectedForProduction, false, `${id}: recovered reference is not active art`);
  assert.equal(recovered.gitBackedReference.status, 'recovered-reference-not-active-art-direction');
  verifyAsset(recovered.gitBackedReference.path, {...recovered.gitBackedReference, dimensions: recovered.optimizedWebP.dimensions}, `${id} recovered master`);
  assert.deepEqual(recovered.optimizedWebP.dimensions, [2752, 1536], `${id}: full master, not a small crop`);
  assert.equal(chapters.get(id).art.poster, active.image, `${id}: approved art path is unchanged`);
  verifyAsset(`dist${active.image}`, active, `${id} approved production art`);
  const layer = manifest.packagedMotionLayers.find(item => item.id === id);
  assert.equal(chapters.get(id).art.layer, layer.productionPath);
  verifyAsset(`dist${layer.productionPath}`, layer, `${id} packaged SVG`);
}
assert.equal(manifest.externalArchive.status, 'recovered-reference-not-active-art-direction');
verifyAsset(manifest.externalArchive.gitBackedPath, manifest.externalArchive, 'Recovered five-scene archive');
const atlas = parsePage(path.join(dist, 'index.html'));
for (const id of ['hidden-city', 'principles', 'frequency', 'living-wall']) assert(byId(atlas, id), `Original ${id} section survives`);
const artworks = json('dist/art/artworks.json');
assert.equal(artworks.length, 100, 'The complete original Blackbook remains');
assert.equal(new Set(artworks.map(item => item.id)).size, 100);
for (const item of artworks) for (const url of [item.image, item.thumbnail]) localFile(new URL(url, origin), `Original art ${item.id}`);
for (const field of ['recordedInterviews', 'licensedAudioExamples', 'qualifiedDanceDemonstration', 'partnerships', 'reservations', 'accountSync', 'realParticipantPilot']) assert.equal(data.mediaStatus[field], false, `${field}: no fictional delivered material`);
console.log('PASS: five approved artwork hashes preserved; five recovered 2752×1536 masters and archive verified as inactive references; original sections and 100-work Blackbook remain.');

// Parse the built HTML without running JavaScript: reading must survive a failed
// script, a denied storage permission, or a missing optional illustration.
const pages = new Map(['overview', ...order].map(id => {
  const url = `/expeditions/${id === 'overview' ? '' : `${id}/`}`;
  return [id, parsePage(localFile(new URL(url, origin), `${id} expedition`))];
}));
let checkedLinks = 0, checkedLessons = 0, checkedStops = 0;
for (const [id, page] of pages) {
  const html = elements(page, node => node.tag === 'html')[0];
  const main = elements(page, node => node.tag === 'main')[0];
  assert.equal(html?.attrs.lang, 'cs', `${id}: Czech language is declared`);
  assert(main && normalize(nodeText(main)).length > 1000, `${id}: complete reading content exists without JS`);
  assert.equal(elements(page, node => node.tag === 'h1').length, 1, `${id}: one main page title`);
  const ids = elements(page, node => Boolean(node.attrs.id)).map(node => node.attrs.id);
  assert.equal(new Set(ids).size, ids.length, `${id}: no duplicate HTML IDs`);
  assert.equal(elements(page, node => ['audio', 'video'].includes(node.tag) && Object.hasOwn(node.attrs, 'autoplay')).length, 0, `${id}: no autoplay media`);
  assert.equal(elements(page, node => node.tag === 'input' && node.attrs.type === 'file').length, 0, `${id}: no undeclared attachment uploads`);
  for (const node of elements(page, () => true)) {
    assert(!Object.keys(node.attrs).some(name => /^on/i.test(name)), `${id}: no inline executable event handler`);
    if (node.tag === 'script') {
      assert(node.attrs.src, `${id}: no hidden inline script`);
      assert.equal(new URL(node.attrs.src, origin).origin, origin, `${id}: local enhancement script`);
    }
    for (const attribute of ['href', 'src', 'poster', 'data-src', 'action']) {
      if (!Object.hasOwn(node.attrs, attribute)) continue;
      const raw = node.attrs[attribute];
      assert(typeof raw === 'string' && raw.trim() && raw !== '#', `${id}: ${attribute} contains a real URL`);
      assert(!raw.startsWith('//'), `${id}: no protocol-relative ${attribute}`);
      const url = new URL(raw, `${origin}/expeditions/${id === 'overview' ? '' : `${id}/`}`);
      assert(['https:', 'http:'].includes(url.protocol), `${id}: safe ${attribute} scheme`);
      assert(!url.username && !url.password, `${id}: URL has no credentials`);
      if (url.origin === origin) {
        const file = localFile(url, `${id} ${attribute}`);
        if (url.hash && file.endsWith('.html')) assert(byId(parsePage(file), decodeURIComponent(url.hash.slice(1))), `${id}: fragment exists: ${raw}`);
      } else {
        safeExternal(raw, `${id} ${attribute}`);
        if (attribute !== 'href') assert.fail(`${id}: automatic external resource or form request: ${raw}`);
      }
      if (['src', 'poster', 'data-src'].includes(attribute)) assert(!url.pathname.startsWith('/expeditions/assets/masters/'), `${id}: recovered reference art is not shown as production`);
      if (node.tag === 'a' && node.attrs.target === '_blank') assert((node.attrs.rel || '').split(/\s+/).includes('noopener'), `${id}: external tab cannot access its opener`);
      checkedLinks++;
    }
  }
  for (const chapterId of order) assert(elements(page, node => node.tag === 'a' && new URL(node.attrs.href || '/', origin).pathname === `/expeditions/${chapterId}/`).length, `${id}: independent ${chapterId} route is discoverable`);
  if (id === 'overview') {
    for (const chapter of data.chapters) includesText(main, chapter.outcome, `Overview ${chapter.id} outcome`);
    continue;
  }
  const chapter = chapters.get(id);
  const route = data.routes.find(item => item.id === chapter.routeId);
  for (const text of [...chapter.goals, ...chapter.preparation, chapter.homeAlternative]) includesText(main, text, `${id} preparation and fallback`);
  for (const context of chapter.context) {
    includesText(main, context.text, `${id} cultural context`);
    for (const sourceId of context.sourceIds) assert(elements(page, node => node.tag === 'a' && node.attrs.href === sources.get(sourceId).url).length, `${id}: cultural context links its actual source`);
  }
  const steps = elements(page, node => Object.hasOwn(node.attrs, 'data-story-step') && node.attrs['data-chapter'] === id);
  assert.equal(steps.length, 3, `${id}: three readable lesson steps`);
  for (const [index, lessonId] of chapter.lessonIds.entries()) {
    const lesson = lessons.get(lessonId);
    const block = steps.find(node => Number(node.attrs['data-phase']) === index);
    assert(block && visibleWithoutScript(block), `${lessonId}: lesson is available without JS`);
    for (const field of ['title', 'objective', 'question', 'why', 'notice', 'example', 'artifact', 'advanced', 'transfer']) includesText(block, lesson[field], `${lessonId}.${field}`);
    for (const text of [...lesson.steps, ...lesson.check]) includesText(block, text, `${lessonId} explained practice and feedback`);
    const plain = normalize(nodeText(block));
    assert(plain.indexOf(normalize(lesson.example)) < plain.indexOf(normalize(lesson.steps[0])), `${lessonId}: example precedes the learner's attempt`);
    assert(plain.indexOf(normalize(lesson.steps.at(-1))) < plain.indexOf(normalize(lesson.check[0])), `${lessonId}: feedback follows the attempt`);
    checkedLessons++;
  }
  const stops = elements(page, node => Object.hasOwn(node.attrs, 'data-stop-id'));
  assert.equal(stops.length, route.stops.length, `${id}: every ordered placement is rendered`);
  assert.deepEqual(stops.map(node => node.attrs['data-stop-id']), route.stops.map(stop => stop.id), `${id}: route order is preserved`);
  for (const stop of route.stops) {
    const block = stops.find(node => node.attrs['data-stop-id'] === stop.id);
    const place = places.get(stop.placeId);
    assert(visibleWithoutScript(block), `${stop.id}: address is available without JS`);
    for (const text of [stop.title, stop.task, stop.transfer, stop.conditions, place.address, place.access.summary, ...place.access.requiresConfirmation]) includesText(block, text, stop.id);
    const links = descendants(block, node => node.tag === 'a').map(node => node.attrs.href);
    for (const source of place.sources) assert(links.includes(source.url), `${stop.id}: source link goes to ${source.url}`);
    assert(links.some(value => {
      const url = new URL(value, origin);
      return url.origin !== origin && [...url.searchParams.values()].some(query => query.includes(place.address));
    }), `${stop.id}: external navigation uses its address, without inventing a coordinate pin`);
    checkedStops++;
  }
}
assert.equal(checkedLessons, 15);
assert.equal(checkedStops, 31);
console.log(`PASS: six independent HTML routes; all 15 complete lessons and 31 ordered addresses/tasks/access records/source links; ${checkedLinks} safe, resolvable HTML URLs; no automatic external resources or media.`);

// Guard the public network boundary, then run the runtime agent's behavioral
// checks for local storage/export, reversible scrolling and scoped offline cache.
const app = read('dist/expeditions/app.js');
assert.doesNotMatch(app, /getUserMedia|watchPosition|sendBeacon|XMLHttpRequest|new\s+WebSocket|navigator\.geolocation/, 'The expedition runtime has no microphone, geolocation, tracking or upload transport');
const registrations = [...app.matchAll(/serviceWorker\.register\(\s*(['"])([^'"]+)\1\s*,\s*\{\s*scope:\s*(['"])([^'"]+)\3/g)];
assert.equal(registrations.length, 1, 'Exactly one explicit offline-worker registration is declared');
assert.equal(registrations[0][2], '/expeditions/sw.js');
assert.equal(registrations[0][4], '/expeditions/', 'The worker cannot claim the original atlas routes');
const runtime = spawnSync(process.execPath, [path.join(project, 'tests/expeditions-runtime.mjs')], {cwd: project, encoding: 'utf8'});
assert.equal(runtime.status, 0, `Runtime behavioral suite succeeds:\n${runtime.stdout}\n${runtime.stderr}`);
process.stdout.write(runtime.stdout);
console.log('Static and Node integration checks passed. Browser layout, permissions, mobile gestures, and factual/editorial review remain separate QA.');
