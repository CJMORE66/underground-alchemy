/* Portable DOM regression suite: npm install; node tests/portals.cjs.
 * DOM simulation is not a substitute for visual/browser accessibility QA.
 */
const { parseHTML } = require('linkedom');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dist = path.resolve(__dirname, '../dist');
const code = fs.readFileSync(path.join(dist, 'portals-v7.js'), 'utf8');
const main = parseHTML(fs.readFileSync(path.join(dist, 'index.html'), 'utf8')).document;
const slugs = ['transmute','mentalism','correspondence','vibration','polarity','rhythm','cause-effect','generation','shadow-work','as-above','so-below','underground'];
const chapters = ['portal','principles','principles','city','dissolution','principles','forge','forge','dissolution','portal','city','drop'];
const titles = new Set();
const emblems = new Set();
let assertions = 0;
function check(value, message) { assert(value, message); assertions++; }
function boot(slug, options = {}) {
  const { window, document } = parseHTML('<!doctype html><html><body><div id="portal" hidden></div></body></html>');
  const memory = options.memory || {};
  let requests = 0;
  const storage = {
    getItem: key => { if (options.blockStorage) throw Error('Storage blocked'); return memory[key] ?? null; },
    setItem: (key, value) => { if (options.blockStorage) throw Error('Storage blocked'); memory[key] = value; },
    removeItem: key => { if (options.blockStorage) throw Error('Storage blocked'); delete memory[key]; }
  };
  const context = {
    window, document, localStorage: storage,
    location: { pathname: `/q/${slug}/`, search: options.search ?? '?utm_source=sticker&utm_medium=qr&utm_campaign=street-01&utm_content=signal&utm_term=chapter&email=private%40example.com&gclid=ignored' },
    URLSearchParams, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, Blob,
    setTimeout() {}, fetch() { requests++; throw Error('Unexpected network request'); }, console
  };
  window.HTMLElement.prototype.click = function() { this.dispatchEvent(new window.Event('click', { bubbles: true })); };
  vm.runInNewContext(code, context, { filename: 'portals-v7.js' });
  return { document, window, memory, requests: () => requests, click: selector => {
    const button = document.querySelector(selector); assert(button, selector); button.dispatchEvent(new window.Event('click', { bubbles: true }));
  } };
}
for (let index = 0; index < slugs.length; index++) {
  const slug = slugs[index];
  const state = boot(slug);
  const { document: d, memory, click } = state;
  check(d.querySelector('#portal').dataset.portal === slug, `${slug}: allowlisted route activated`);
  check(!d.querySelector('#portal').hidden, `${slug}: portal visible`);
  check(fs.existsSync(path.join(dist, 'q', slug, 'index.html')), `${slug}: entry HTML exists`);
  const title = d.querySelector('h1').textContent;
  titles.add(title);
  check(d.title.includes(title), `${slug}: descriptive title`);
  const svg = d.querySelector('.p7-emblem');
  emblems.add(svg.innerHTML);
  check(svg.getAttribute('role') === 'img' && svg.getAttribute('aria-label'), `${slug}: symbol accessible name`);
  const chapterHref = d.querySelector('.p7-primary').getAttribute('href');
  check(chapterHref === `/#film-${chapters[index]}`, `${slug}: expected chapter mapping`);
  check(main.getElementById(chapterHref.slice(2)), `${slug}: chapter target exists in current index`);
  for (const a of d.querySelectorAll('a[href^="/#"]')) check(main.getElementById(a.getAttribute('href').slice(2)), `${slug}: internal link target ${a.getAttribute('href')}`);
  check(d.querySelectorAll('.p7-symbols a').length === 12, `${slug}: 12 album navigation links`);
  check(d.querySelector('.p7-symbols a[aria-current="page"]').dataset.p7Symbol === slug, `${slug}: active album entry`);
  check(JSON.parse(memory['caisik-album']).includes(slug), `${slug}: functional local visit album`);
  check(d.querySelector('#p7-album-count').textContent.includes('1 / 12'), `${slug}: visited count`);
  check(!memory['caisik-campaign-history-v7'], `${slug}: no default campaign history`);
  check(!memory['caisik-campaign-consent-v7'], `${slug}: no inferred consent`);
  check(d.querySelector('#p7-consent-status').textContent.includes('off'), `${slug}: off status communicated`);
  const range = d.querySelector('#p7-range');
  if (range) {
    range.value = '75'; range.dispatchEvent(new state.window.Event('input', { bubbles: true }));
    check(d.querySelector('#p7-effect').textContent.includes('75 / 100'), `${slug}: slider changes explanation`);
    check(d.querySelector('.p7-scene').style.getPropertyValue('--p7-value') === '0.75', `${slug}: slider changes drawing state`);
  } else {
    click('#p7-reveal');
    check(d.querySelector('#p7-reveal').getAttribute('aria-pressed') === 'true', `${slug}: pressed state`);
    check(d.querySelector('.p7-scene').classList.contains('is-revealed'), `${slug}: visual state enabled`);
    click('#p7-reveal');
    check(d.querySelector('#p7-reveal').getAttribute('aria-pressed') === 'false', `${slug}: reset state`);
  }
  click('#p7-consent-yes');
  const history = JSON.parse(memory['caisik-campaign-history-v7']);
  check(history.length === 1 && history[0].portal === slug, `${slug}: opt-in records selected portal`);
  check(Object.keys(history[0].attribution).length === 5, `${slug}: only five UTM keys persisted`);
  check(!history[0].attribution.email && !history[0].attribution.gclid, `${slug}: unrelated parameters ignored`);
  check(d.querySelector('#p7-consent-yes').disabled, `${slug}: duplicate affirmative action disabled`);
  click('#p7-history-clear');
  check(!memory['caisik-campaign-history-v7'] && !memory['caisik-campaign-consent-v7'], `${slug}: history and permission cleared`);
  click('#p7-consent-yes'); click('#p7-consent-no');
  check(!memory['caisik-campaign-history-v7'], `${slug}: opt-out revokes history`);
  check(state.requests() === 0, `${slug}: no fetch request`);
}
check(titles.size === 12, '12 unique page titles');
check(emblems.size === 12, '12 unique authored SVG scenes');
const malicious = boot('transmute', { search: '?utm_source=%3Cscript%3E&utm_campaign=valid-01&utm_content=' + 'a'.repeat(81) });
malicious.click('#p7-consent-yes');
const attribution = JSON.parse(malicious.memory['caisik-campaign-history-v7'])[0].attribution;
check(Object.keys(attribution).length === 1 && attribution.utm_campaign === 'valid-01', 'unsafe/overlong UTM labels excluded');
const prior = { 'caisik-campaign-consent-v7': 'true', 'caisik-album': '["transmute"]', 'caisik-campaign-history-v7': '[]' };
const returning = boot('underground', { memory: prior });
check(JSON.parse(prior['caisik-campaign-history-v7']).length === 1, 'return visit honors prior affirmative local-history choice');
check(returning.document.querySelector('#p7-album-count').textContent.includes('2 / 12'), 'return visit progression counts distinct portals');
const blocked = boot('transmute', { blockStorage: true });
blocked.click('#p7-consent-yes');
check(blocked.document.querySelector('#p7-consent-status').textContent.includes('unavailable'), 'blocked browser storage fails safely');
const unknown = boot('unknown');
check(unknown.document.querySelector('#portal').hidden, 'unknown portal is not intercepted');
console.log(`PASS: ${assertions} portal DOM assertions across 12 routes, scene/interaction states, real chapter targets, album progression and consent handling. No browser rendering, keyboard navigation or performance measurement implied.`);
