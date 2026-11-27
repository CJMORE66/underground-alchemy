/* Select the edition in the published HTML. URL parameters, saved state and provider data cannot enable commerce. */
import {CATEGORY_LABELS, countLabel, escapeHTML as esc, findShopVariant, normalizeShopCatalog} from './catalog-model.js';

const motifs = {
  inner: {
    artwork: '021', title: 'Inner World', principle: 'mentalism', lesson: 'Mentalismus',
    reading: 'Písmo se dere na povrch látky. Uvnitř kresby se stejný pohyb láme do ulic, které vidíš jen ty.',
  },
  pulse: {
    artwork: '025', title: 'Rhythm', principle: 'rhythm', lesson: 'Rytmus',
    reading: 'Kšilt uřízne kus zorného pole. Zbytek ulice čteš po taktech, stejně jako vychýlené kyvadlo v kresbě.',
  },
  contrast: {
    artwork: '024', title: 'Polarity', principle: 'polarity', lesson: 'Polarita',
    reading: 'Z dálky je potisk jediná plocha. Z metru se obraz rozpadne na světlý tah a tmavou mezeru. Obojí drží tvar.',
  },
};

// These are editorial pairings with separate artworks, not claims that a garment carries the gallery print.
function pairing(product) {
  if (product.handle === 'printful-18912189-482088957' || product.handle === 'printful-18912189-482088808') return motifs.pulse;
  if (product.category === 'tees' || product.category === 'accessories') return motifs.contrast;
  return motifs.inner;
}

function card(product) {
  const name = esc(product.name);
  return `<article class="shop-card">
    <button type="button" class="shop-card-image" data-drop-product="${esc(product.id)}" aria-label="Prohlédnout ${name}">
      <img src="${esc(product.image)}" width="800" height="800" alt="" loading="lazy">
      <span class="shop-card-open">Prohlédnout návrh <span aria-hidden="true">↗</span></span>
    </button>
    <h3 translate="no">${name}</h3>
    <p class="shop-card-meta"><span>${CATEGORY_LABELS[product.category]}</span><span>Varianty: ${product.variants.length}</span></p>
  </article>`;
}

function detailMarkup(product) {
  const motif = pairing(product);
  const options = product.options.map(({title, values}) => {
    const label = {Size: 'Velikost', Color: 'Barva'}[title] || title;
    const items = values.map(value => `<option value="${esc(value)}"${values.length === 1 ? ' selected' : ''}>${esc(value)}</option>`).join('');
    return `<label><span>${esc(label)}</span><select data-drop-option="${esc(title)}">${values.length > 1 ? '<option value="">Vyber variantu</option>' : ''}${items}</select></label>`;
  }).join('');
  return `<div class="shop-detail-grid">
    <div><img class="shop-detail-image drop-preview" width="800" height="800" src="${esc(product.image)}" alt="${esc(product.name)} · produktový mockup Printful">
      <p class="shop-detail-image-note">Původní produktový mockup Printful.</p></div>
    <div class="shop-detail-copy"><p class="shop-eyebrow">CAISIK / Připravovaný drop</p>
      <h2 id="shop-detail-title" tabindex="-1" translate="no">${esc(product.name)}</h2>
      <div class="shop-detail-options">${options}</div><p data-drop-variant class="shop-variant-status" role="status"></p>
      <div class="drop-editorial"><h3>Dialog s kresbou</h3><p>${motif.reading}</p>
        <div class="drop-links"><a href="/art/#work-${motif.artwork}">Galerie CAISIK · ${motif.title} ↗</a>
          <a href="/#atlas/principles/${motif.principle}">${motif.lesson} ↗</a></div>
      </div>
      <a class="shop-product-link drop-permalink" href="?product=${encodeURIComponent(product.id)}">Stálý odkaz na návrh ↗</a>
    </div>
  </div>`;
}

const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const rescan = (view, root) => view.CaisikI18n?.rescan?.(root);

export function mountLookbook(host, {document: doc = host.ownerDocument, fetch: request = globalThis.fetch, view = doc.defaultView} = {}) {
  const grid = host.querySelector('[data-shop-grid]');
  const filters = host.querySelector('[data-shop-filters]');
  const search = host.querySelector('[data-shop-search]');
  const status = host.querySelector('[data-shop-status]');
  const count = host.querySelector('[data-shop-count]');
  const dialog = doc.querySelector('[data-shop-dialog]');
  const detail = dialog.querySelector('[data-shop-detail]');
  const listeners = [];
  const controller = new AbortController();
  let products = [], category = 'all', selected = null, trigger = null, loading = false, disposed = false;

  function listen(node, type, handler) {
    node.addEventListener(type, handler);
    listeners.push(() => node.removeEventListener(type, handler));
  }
  function render() {
    const term = normalize(search.value || '').trim();
    const visible = products.filter(product => (category === 'all' || product.category === category)
      && normalize([product.name, product.originalName, ...product.variants.map(variant => variant.sku)].join(' ')).includes(term));
    count.textContent = countLabel(visible.length);
    grid.innerHTML = visible.map(card).join('') || '<div class="shop-empty"><p>Žádný odpovídající návrh.</p><button type="button" class="shop-clear" data-drop-reset>Zobrazit celou kolekci</button></div>';
    for (const button of filters.querySelectorAll('[data-drop-category]')) button.setAttribute('aria-pressed',String(button.dataset.dropCategory === category));
    rescan(view,host);
  }
  function showVariant() {
    if (!selected) return;
    const selection = Object.fromEntries([...detail.querySelectorAll('[data-drop-option]')].map(select => [select.dataset.dropOption, select.value]));
    const variant = findShopVariant(selected,selection);
    const complete = selected.options.every(option => selection[option.title]);
    const node = detail.querySelector('[data-drop-variant]');
    node.textContent = variant ? `Katalogová varianta · ${variant.title || variant.sku}` : complete ? 'Tahle kombinace v kolekci chybí.' : '';
  }
  function open(id, opener) {
    const product = products.find(item => item.id === id);
    if (!product) return false;
    trigger = opener || doc.activeElement;
    selected = product;
    detail.innerHTML = detailMarkup(product);
    showVariant();
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open','');
    }
    dialog.scrollTop = 0;
    detail.querySelector('h2').focus?.({preventScroll:true});
    rescan(view,detail);
    return true;
  }
  function onClose() {
    selected = null;
    detail.replaceChildren();
    if (trigger?.isConnected) trigger.focus?.({preventScroll:true});
    trigger = null;
  }
  function close() {
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); onClose(); }
  }
  async function load() {
    if (loading || disposed) return;
    loading = true;
    try {
      const reply = await request('/shop/catalog.json',{signal: controller.signal, credentials:'same-origin'});
      if (!reply.ok) throw new Error('catalog unavailable');
      const catalog = normalizeShopCatalog(await reply.json());
      if (disposed) return;
      products = catalog.products;
      const categories = Object.entries(CATEGORY_LABELS).filter(([key]) => key === 'all' || products.some(product => product.category === key));
      filters.innerHTML = categories.map(([key,label]) => `<button type="button" data-drop-category="${key}">${label}</button>`).join('');
      status.textContent = '';
      render();
      const requested = new URL(view.location?.href || 'https://local.invalid/').searchParams.get('product');
      if (requested && !open(requested,null)) status.textContent = 'Tento návrh výběr neobsahuje. Prohlédni si ostatní listy.';
    } catch {
      if (!disposed) status.innerHTML = '<span>Listy kolekce se nepodařilo načíst.</span> <button class="shop-clear" type="button" data-drop-retry>Načíst znovu</button>';
    } finally { loading = false; }
  }

  listen(host,'click',event => {
    const target = event.target.closest('button, a');
    if (!target) return;
    if (target.hasAttribute('data-drop-product')) {
      if (target.tagName === 'A' && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
      if (open(target.dataset.dropProduct,target)) event.preventDefault();
    } else if (target.hasAttribute('data-drop-category')) {
      category = target.dataset.dropCategory;
      render();
    } else if (target.hasAttribute('data-drop-reset')) {
      search.value = ''; category = 'all'; render(); search.focus();
    } else if (target.hasAttribute('data-drop-retry')) void load();
  });
  listen(search,'input',render);
  listen(dialog,'change',event => { if (event.target.matches('[data-drop-option]')) showVariant(); });
  listen(dialog,'click',event => {
    if (event.target.closest('[data-shop-close]')) close();
    else if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }
  });
  listen(dialog,'close',onClose);
  listen(view,'pagehide',event => { if (!event.persisted) destroy(); });
  function destroy() {
    disposed = true;
    controller.abort();
    listeners.forEach(remove => remove());
    if (dialog.open) close();
  }
  const ready = load();
  return {ready, destroy};
}

if (typeof document !== 'undefined') {
  const host = document.querySelector('[data-shop]');
  if (host?.dataset.shopMode === 'commerce') {
    import('./shop.js').then(({mountShop}) => mountShop(host));
  } else if (host) mountLookbook(host);
}
