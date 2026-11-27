import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {mountLookbook} from '../dist/shop/drop.js';

const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = file('dist/shop/index.html');
const catalog = JSON.parse(file('dist/shop/catalog.json'));
const works = JSON.parse(file('dist/art/artworks.json'));
const principles = JSON.parse(file('dist/principles-data.json')).principles;
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(responses = [catalog], url = 'https://example.test/shop/') {
  const {document,window} = parseHTML(html);
  const dialog = document.querySelector('[data-shop-dialog]');
  const events = [], calls = [];
  window.HTMLElement.prototype.focus = function() { events.push(this); };
  Object.defineProperty(dialog,'open',{get:() => dialog.hasAttribute('open')});
  dialog.showModal = () => dialog.setAttribute('open','');
  dialog.close = () => {dialog.removeAttribute('open'); dialog.dispatchEvent(new window.Event('close'));};
  const view = {location:{href:url},addEventListener(){},removeEventListener(){}};
  const host = document.querySelector('[data-shop-mode="lookbook"]');
  assert(host, 'deployed page explicitly selects the static lookbook');
  const api = mountLookbook(host,{document,view,fetch: async (path,opts) => {
    calls.push([path, opts]);
    assert.equal(path,'/shop/catalog.json','lookbook must load through plain static hosting');
    const result = responses.shift();
    return {ok: Boolean(result),json: async () => result};
  }});
  return {document,window,host,dialog,api,events,calls};
}
function recordedVariant(h, selected) {
  for (const [key,value] of Object.entries(selected)) {
    const input = h.dialog.querySelector('[data-drop-option="' + key + '"]');
    Object.defineProperty(input,'value',{value,configurable:true});
    input.dispatchEvent(new h.window.Event('change',{bubbles:true}));
  }
  return h.dialog.querySelector('[data-drop-variant]').textContent;
}

const h = setup();
await h.api.ready;
assert.equal(h.document.querySelectorAll('.shop-card').length,catalog.products.length);
assert(!h.host.querySelector('[data-shop-cart], [data-shop-add], [data-commerce-form]'));
assert(!h.document.querySelector('a[href*=".i234.me"], [href*="/checkout"]'));
for (const product of catalog.products) {
  assert(existsSync(new URL('../dist' + product.localImage,import.meta.url)),'faithful product mockup exists');
  assert(!product.sourceUrl,'retired Synology product links are excluded from the current drop');
}
const search = h.document.querySelector('[data-shop-search]');
search.value = 'omerta'; search.dispatchEvent(new h.window.Event('input'));
assert.equal(h.document.querySelectorAll('.shop-card').length,1);
const button = h.document.querySelector('.shop-card button');
button.click();
assert(h.dialog.open);
assert.match(h.dialog.querySelector('h2').textContent,/OMERTA/);
const firstProduct = catalog.products[0];
assert.equal(recordedVariant(h,{Color:'Black',Size:'M'}),'Katalogová varianta · ' +
  firstProduct.variants.find(v=>v.options.find(o=>o.title==='Size')?.value==='M').title);
assert.match(recordedVariant(h,{Size:'XX-DUMMY'}),/kombinace/);
assert(!h.dialog.querySelector('[data-shop-add], [data-commerce-form], [href*="i234.me"]'));
h.document.querySelector('[data-shop-close]').click();
assert(!h.dialog.open); assert.equal(h.events.at(-1),button);
search.value = 'not-a-garment'; search.dispatchEvent(new h.window.Event('input'));
h.document.querySelector('[data-drop-reset]').click();
h.document.querySelector('[data-drop-category="accessories"]').click();
assert.equal(h.document.querySelectorAll('.shop-card').length,catalog.products.filter(p=>p.category==='accessories').length);

for (const card of h.document.querySelectorAll('.shop-card button')) {
  card.click();
  const art = h.dialog.querySelector('a[href^="/art/#work-"]').getAttribute('href').split('-').at(-1);
  assert(works.some(w=>w.slug===art),'every editorial pairing is a real gallery work');
  const principle = h.dialog.querySelector('a[href^="/#atlas/principles/"]').getAttribute('href').split('/').at(-1);
  assert(principles.some(p=>p.id===principle));
  h.document.querySelector('[data-shop-close]').click();
}
assert.equal(h.calls.length,1);
h.api.destroy();
const deep = setup([catalog], 'https://example.test/shop/?product=' + firstProduct.id);
await deep.api.ready; assert(deep.dialog.open); assert.match(deep.dialog.querySelector('h2').textContent,/OMERTA/);
deep.api.destroy();
const retry = setup([null,catalog]);
await retry.api.ready;
retry.document.querySelector('[data-drop-retry]').click(); await tick();
assert.equal(retry.document.querySelectorAll('.shop-card').length,catalog.products.length);
assert.equal(retry.calls.length,2); retry.api.destroy();
console.log('PASS drop: static catalogue, exact variant selection, active filtering, gallery and lesson links, focus return, direct links and retry; no public cart, order links, payment actions or commerce requests.');
