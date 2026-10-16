/* Source-backed variant previews. Purchases stay in the original store. */
(() => {
  'use strict';
  const body = document.querySelector('#detail-body');
  const embedded = document.querySelector('#catalog-data');
  if (!body || !embedded) return;
  let data;
  try { data = JSON.parse(embedded.textContent); } catch { return; }
  const products = Array.isArray(data.products) ? data.products : [];
  const normalURL = value => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' ? url.origin + url.pathname.replace(/\/$/, '') : '';
    } catch { return ''; }
  };
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const money = (variant, product) => {
    const amount = variant.calculatedAmount;
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return 'Confirm price in store';
    const currency = variant.currency || product.currency;
    try { return new Intl.NumberFormat('en-IE', { style: 'currency', currency: currency.toUpperCase() }).format(amount); }
    catch { return `${amount} ${String(currency || '').toUpperCase()}`.trim(); }
  };

  function gallery(grid, product) {
    const photo = grid.querySelector('.real-detail-photo');
    if (!photo) return;
    const images = [...new Set([...(Array.isArray(product.images) ? product.images : []), product.image].filter(Boolean))];
    if (!images.length) return;
    const figure = node('div', 'v7-gallery');
    figure.dataset.v7Gallery = product.productId || product.handle || '';
    photo.parentNode.insertBefore(figure, photo);
    figure.append(photo);
    const controls = node('div', 'v7-gallery-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Original store product previews');
    const status = node('p', 'v7-gallery-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const buttons = [];
    function select(index) {
      const image = normalURL(images[index]);
      if (!image) return;
      photo.src = images[index];
      photo.alt = `${product.name} — source product preview ${index + 1} of ${images.length}`;
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      status.textContent = `Preview ${index + 1} / ${images.length} · Original store / Printful preview`;
      figure.dataset.v7ImageIndex = String(index);
    }
    images.forEach((url, index) => {
      if (!normalURL(url)) return;
      const button = node('button', 'v7-preview-button');
      button.type = 'button';
      button.dataset.v7Preview = String(index);
      button.setAttribute('aria-label', `Show product preview ${index + 1}`);
      button.setAttribute('aria-pressed', String(index === 0));
      const thumbnail = node('img', '');
      thumbnail.src = url;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      thumbnail.width = 64;
      thumbnail.height = 64;
      button.append(thumbnail, node('span', '', `Preview ${index + 1}`));
      button.addEventListener('click', () => select(index));
      buttons.push(button);
      controls.append(button);
    });
    figure.append(controls, status);
    // Retain the locally optimized initial image until the visitor selects another view.
    status.textContent = `Preview 1 / ${images.length} · Original store / Printful preview`;
    figure.dataset.v7ImageIndex = '0';
  }

  function mount() {
    const grid = body.querySelector('.real-detail-grid');
    if (!grid || grid.dataset.v7CommerceMounted === 'true') return;
    const links = [...grid.querySelectorAll('a[href]')].map(a => normalURL(a.href));
    const product = products.find(p => links.includes(normalURL(p.url)));
    if (!product) return;
    grid.dataset.v7CommerceMounted = 'true';
    grid.dataset.v7ProductId = product.productId || '';
    gallery(grid, product);
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const options = (Array.isArray(product.options) ? product.options : [])
      .filter(option => Array.isArray(option.values) && option.values.length);
    if (!variants.length || !options.length) return;
    const side = grid.children[1];
    if (!side) return;
    grid.querySelectorAll('.verified-options').forEach(el => { el.hidden = true; });
    const panel = node('section', 'v7-commerce-panel');
    panel.dataset.v7VariantPreview = '';
    panel.setAttribute('aria-label', 'Source variant preview');
    panel.append(node('h3', '', 'Choose your fit'));
    const mainPrice = side.querySelector('.real-detail-price');
    const resetPrice = () => { if (mainPrice) mainPrice.textContent = `FROM ${product.priceLabel}`; };
    resetPrice();
    const caption = node('p', 'v7-commerce-caption', 'Choose your options to open the matching variant in the original store.');
    panel.append(caption);
    const fields = node('div', 'v7-option-fields');
    const selects = [];
    options.forEach((option, index) => {
      const label = node('label', 'v7-option-label');
      label.append(node('span', '', option.title));
      const select = node('select', 'v7-source-select');
      select.dataset.v7Option = option.title;
      select.id = `v7-source-option-${index}`;
      const placeholder = node('option', '', `Choose ${option.title.toLowerCase()}`);
      placeholder.value = '';
      select.append(placeholder);
      [...new Set(option.values)].forEach(value => {
        const item = node('option', '', String(value));
        item.value = String(value);
        select.append(item);
      });
      if (option.values.length === 1) select.value = String(option.values[0]);
      label.append(select);
      fields.append(label);
      selects.push({ title: option.title, select });
    });
    panel.append(fields);
    const result = node('div', 'v7-variant-result');
    result.dataset.v7VariantResult = '';
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    result.setAttribute('aria-atomic', 'true');
    const title = node('p', 'v7-selected-title');
    const price = node('strong', 'v7-selected-price');
    price.dataset.v7SelectedPrice = '';
    const sku = node('p', 'v7-selected-sku');
    sku.dataset.v7SelectedSku = '';
    const note = node('p', 'v7-source-note');
    result.append(title, price, sku, note);
    const caveat = node('p', 'v7-commerce-caveat', 'Your selected variant opens in the original store. Stock, tax, shipping and the final total are confirmed there.');
    panel.append(result, caveat);
    const anchor = side.querySelector('.fineprint');
    side.insertBefore(panel, anchor || null);
    const buy = side.querySelector('a.button[href]');
    const originalBuy = buy && normalURL(buy.href) === normalURL(product.url) ? buy : null;
    if (originalBuy) {
      buy.textContent = 'SELECT OPTIONS & BUY IN ORIGINAL STORE ↗';
      buy.setAttribute('aria-describedby', 'v7-store-selection-note');
      caveat.id = 'v7-store-selection-note';
      buy.dataset.v7OriginalBuy = '';
      if (anchor) {
        const disclosure = node('details', 'v7-commerce-source');
        disclosure.append(node('summary', '', 'Price & product details'));
        anchor.replaceWith(disclosure);
        disclosure.append(anchor);
        side.insertBefore(buy, disclosure);
      }
    }
    function resetBuy() {
      if (!originalBuy) return;
      originalBuy.href = product.url;
      originalBuy.textContent = 'SELECT OPTIONS & BUY IN ORIGINAL STORE ↗';
      delete originalBuy.dataset.v7VariantId;
    }
    function update() {
      resetPrice();
      resetBuy();
      const ready = selects.every(({ select }) => select.value);
      const variant = ready && variants.find(v => selects.every(({ title, select }) =>
        (v.options || []).some(option => option.title === title && String(option.value) === select.value)));
      if (!ready) {
        title.textContent = 'Choose options to inspect an exact source variant.';
        price.textContent = '';
        sku.textContent = '';
        note.textContent = '';
        caption.textContent = 'Choose your options to open the matching variant in the original store.';
        delete panel.dataset.v7SelectedVariantId;
        return;
      }
      if (!variant) {
        title.textContent = 'This combination is not listed in the saved source data.';
        price.textContent = '';
        sku.textContent = '';
        note.textContent = 'Check the original store for current options.';
        caption.textContent = 'Open the original store to check this combination.';
        delete panel.dataset.v7SelectedVariantId;
        return;
      }
      panel.dataset.v7SelectedVariantId = variant.id || '';
      if (originalBuy && typeof variant.id === 'string' && variant.id) {
        const destination = new URL(product.url);
        destination.searchParams.set('v_id', variant.id);
        originalBuy.href = destination.href;
        originalBuy.dataset.v7VariantId = variant.id;
        originalBuy.textContent = 'OPEN SELECTED VARIANT & BUY ↗';
        caption.textContent = 'Opens this selected variant in the original store. Click Add to cart there to continue.';
      } else {
        caption.textContent = 'Preview selected. Choose the same options in the original store to continue.';
      }
      title.textContent = variant.title;
      price.textContent = money(variant, product);
      if (mainPrice) mainPrice.textContent = money(variant, product);
      sku.textContent = variant.sku ? `SKU: ${variant.sku}` : 'SKU not provided by source';
      note.textContent = `Source price snapshot${product.checkedAt || data.checkedAt ? ` · ${String(product.checkedAt || data.checkedAt).slice(0, 10)}` : ''}${variant.priceTaxInclusive === false ? ' · Tax excluded in source price data' : ''}. Reconfirm current price and availability in store.`;
    }
    selects.forEach(({ select }) => select.addEventListener('change', update));
    update();
  }
  // The existing modal renderer replaces direct children. Internal gallery/select
  // updates are intentionally outside this observer's subtree scope.
  new MutationObserver(mount).observe(body, { childList: true });
  mount();
})();
