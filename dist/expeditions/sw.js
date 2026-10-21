/* Opt-in text cache. This worker is scoped to /expeditions/ only. */
const CACHE = 'caisik-expeditions-v1-20261021';
const CORE = ['/expeditions/expeditions.css?v=1', '/expeditions/app.js?v=1', '/expeditions/store.js?v=1', '/expeditions/schema.js?v=1', '/expeditions/data/expeditions.json?v=1'];
const PAGES = ['/expeditions/', ...['dj','mc','writer','breaking','knowledge'].map(id => `/expeditions/${id}/`)];
const LAYERS = ['dj','mc','writer','breaking','knowledge'].map(id => `/expeditions/assets/layers/${id}.svg`);
const allowed = url => url.origin === self.location.origin && (url.pathname.startsWith('/expeditions/') || /^\/assets\/masterworks-v2\/[0-9]{3}\.webp$/.test(url.pathname));
async function openCache() { try { return await caches.open(CACHE); } catch { return null; } }
async function readCache(cache, request) { try { return await cache?.match(request, {ignoreSearch: true}); } catch { return undefined; } }
async function cacheFiles(paths) {
  const cache = await openCache();
  if (!cache) return {ok: false, textReady: false, saved: 0, failed: [...paths]};
  const failed = [], saved = [];
  await Promise.all(paths.map(async path => {
    const url = new URL(path, self.location.origin);
    if (!allowed(url)) { failed.push(path); return; }
    try {
      const response = await fetch(url.href, {cache: 'reload', credentials: 'same-origin'});
      if (!response.ok || response.type === 'opaque') throw new Error('File unavailable');
      if (!url.pathname.endsWith('/') && /text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('Unexpected document in asset response');
      await cache.put(url.href, response); saved.push(path);
    } catch {
      if (await readCache(cache, url.href)) saved.push(path); else failed.push(path);
    }
  }));
  return {ok: failed.length === 0, textReady: [...CORE,...PAGES].every(path => saved.includes(path)), saved: saved.length, failed};
}
self.addEventListener('install', event => { event.waitUntil(cacheFiles(CORE).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('caisik-expeditions-') && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()); });
self.addEventListener('message', event => {
  if (event.data?.type !== 'SAVE_EXPEDITIONS') return;
  const paths = [...CORE,...PAGES,...LAYERS];
  if (typeof event.data.art === 'string' && allowed(new URL(event.data.art, self.location.origin))) paths.push(event.data.art);
  event.waitUntil(cacheFiles(paths).then(result => event.ports[0]?.postMessage(result)).catch(() => event.ports[0]?.postMessage({ok: false, textReady: false})));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || !allowed(url)) return;
  event.respondWith((async () => {
    let response;
    try {
      response = await fetch(request);
    } catch {}
    const cache = await openCache();
    if (response) {
      // Cache failures must never replace a successful live response.
      if (response.ok && cache) { try { await cache.put(request, response.clone()); } catch {} }
      return response;
    }
    const cached = await readCache(cache, request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const overview = await readCache(cache, '/expeditions/');
      if (overview) return overview;
    }
    return new Response('Tento soubor není dostupný offline. Textový průvodce lze uložit při připojení.', {status: 503, headers: {'Content-Type': 'text/plain;charset=utf-8'}});
  })());
});
