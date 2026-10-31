import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {sourcePrice,sourceProductURL,originalVariantURL} from '../dist/shop/source-commerce.js';
import {normalizeShopCatalog,safeShopImage,findShopVariant,mountShop} from '../dist/shop/shop.js';

const raw=JSON.parse(fs.readFileSync(new URL('../dist/catalog.json',import.meta.url),'utf8'));
const input=JSON.parse(fs.readFileSync(new URL('../dist/shop/catalog.json',import.meta.url),'utf8'));
assert.equal(input.mode,'snapshot');
const normalized=normalizeShopCatalog(input);
assert.equal(normalized.products.length,20);
assert.equal(normalized.products.flatMap(product=>product.variants).length,86);
assert.equal(normalized.checkoutEnabled,false);
assert(!JSON.stringify(normalized).includes('calculatedAmount'));
assert(!JSON.stringify(normalized).includes('printfulAvailableAtSync'));
assert(normalized.products.every(product=>sourceProductURL(product)?.startsWith('https://hiphop.caisik.i234.me/dk/products/')));
assert(!JSON.stringify(normalized).includes('priceLabel'));
assert.equal(normalizeShopCatalog({...input,checkout:{enabled:true,url:'https://attacker.example/checkout'},token:'private'}).checkoutEnabled,false,'the preview never enables orders from unverified config');
assert.equal(safeShopImage('javascript:alert(1)'),null);
assert.equal(safeShopImage('//attacker.example/fake.png'),null);
assert.equal(safeShopImage('/assets/catalog/../private.png'),null);
assert.equal(safeShopImage('https://files.cdn.printful.com.attacker.example/files/x.png'),null);
assert.equal(safeShopImage('https://private@files.cdn.printful.com/files/x.png'),null);
assert.equal(safeShopImage('https://files.cdn.printful.com/files/x.png'),null);
assert.equal(safeShopImage('https://files.cdn.printful.com/files/x_preview.png'),'https://files.cdn.printful.com/files/x_preview.png');
assert.equal(safeShopImage('https://files.cdn.printful.com/files/x_preview.png?token=secret'),null);
assert.equal(normalizeShopCatalog({...input,products:[{...raw.products[0],category:'other'}]}).products.length,1,'new Printful imports remain visible before editorial category assignment');
assert.equal(safeShopImage('/assets/catalog/printful-18912189-482104768.png'),'/assets/catalog/printful-18912189-482104768.png');
assert.throws(()=>normalizeShopCatalog({products:[]}));
assert.throws(()=>normalizeShopCatalog({...input,products:[{...raw.products[0],localImage:'https://bad.example/x.png',image:'javascript:alert(1)'}]}));
const product=normalized.products.find(product=>product.variants.length>3);
for(const variant of product.variants){const selection=Object.fromEntries(variant.options.map(option=>[option.title,option.value]));assert.equal(findShopVariant(product,selection)?.id,variant.id,'all real option combinations preserve exact source identities');}
assert.equal(findShopVariant(product,{}),null);
assert.equal(findShopVariant(product,{Color:'invented',Size:'999XL'}),null);
const duplicate={...product,variants:[product.variants[0],product.variants[0]]};
assert.equal(findShopVariant(duplicate,Object.fromEntries(duplicate.variants[0].options.map(option=>[option.title,option.value]))),null,'ambiguous variants never produce a guessed match');

const html=fs.readFileSync(new URL('../dist/shop/index.html',import.meta.url),'utf8');
function fixture(responses=[input]){
 const {document,window}=parseHTML(html);const requests=[],rescans=[];
 window.HTMLElement.prototype.focus=function(){document._focus=this;};
 const dialog=document.querySelector('[data-shop-dialog]');
 Object.defineProperty(dialog,'open',{get(){return this.hasAttribute('open');}});
 dialog.showModal=function(){this.setAttribute('open','');};
 dialog.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 window.CaisikI18n={t:source=>source,rescan:node=>rescans.push(node)};
 const fetch=async(url,options)=>{requests.push({url,options});const response=responses.shift();if(response instanceof Error)throw response;return {ok:response!==false,json:async()=>response};};
 const host=document.querySelector('[data-shop]'),api=mountShop(host,{document,fetch});
 const click=selector=>{const element=document.querySelector(selector);assert(element,selector);element.click();return element;};
 const setSelect=(select,value)=>{Object.defineProperty(select,'value',{configurable:true,writable:true,value});select.dispatchEvent(new window.Event('change',{bubbles:true}));};
 return {document,window,host,dialog,api,requests,rescans,click,setSelect};
}
{
 const h=fixture();await h.api.ready;
 assert.equal(h.document.querySelectorAll('.shop-card').length,20);
 assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,'/shop/catalog.json?v=2');
 assert(!h.document.querySelector('a[href*="hiphop.caisik"]'));
 assert(!h.document.querySelector('[data-checkout],form'),'no payment form or enabled checkout exists');
 assert(h.document.querySelector('[data-shop-cart]'),'local selection cart is available');
 assert(h.document.querySelector('[aria-describedby="shop-checkout-reason"]').disabled);
 assert(!h.host.textContent.includes('€'),'prices appear only for a fully selected exact variant');
 const search=h.document.querySelector('[data-shop-search]');search.value='OMERTA';search.dispatchEvent(new h.window.Event('input',{bubbles:true}));
 assert.equal(h.api.getState().count,1);assert.match(h.document.querySelector('.shop-card h3').textContent,/OMERTA/);
 const button=h.click('[data-shop-product]');assert(h.dialog.open);assert.equal(h.document._focus.id,'shop-detail-title');
 assert(h.document.querySelector('[data-shop-add]').disabled,'a cart line requires an exact variant selection');
 const omerta=normalized.products.find(product=>product.name==='OMERTA WITH EGO'),variant=omerta.variants.find(variant=>variant.options.some(option=>option.value==='2XL'));
 for(const value of variant.options){const select=h.document.querySelector(`[data-shop-option="${value.title}"]`);h.setSelect(select,value.value);}
 assert.match(h.document.querySelector('[data-shop-variant-status]').textContent,new RegExp(variant.sku));
 assert.match(h.document.querySelector('[data-shop-price]').textContent,/€56.50/);
 assert.match(h.document.querySelector('[data-shop-price]').textContent,/2026-10-16/);
 assert.equal(h.document.querySelector('[data-shop-variant-status]').dataset.sourceVariantUrl,originalVariantURL(omerta,variant));
 assert(h.document.querySelector('.shop-detail-availability button').disabled,'unavailable checkout remains blocked even after a valid selection');
 assert(!h.document.querySelector('[data-shop-add]').disabled,'an exact variant can be saved in the local cart');
 h.click('[data-shop-add]');assert.equal(h.api.getState().cartCount,1);assert.match(h.document.querySelector('[data-shop-cart-lines]').textContent,/OMERTA/);
 assert(h.document.querySelector('[aria-describedby="shop-checkout-reason"]').disabled,'saving a cart selection never enables payment');
 const select=h.document.querySelector('[data-shop-option="Size"]');h.setSelect(select,'invented');assert.match(h.document.querySelector('[data-shop-variant-status]').textContent,/kombinace/);assert(!h.document.querySelector('[data-shop-variant-status]').textContent.includes(variant.sku));
 assert.equal(h.document.querySelector('[data-shop-price]').textContent,'');assert(!h.document.querySelector('[data-shop-variant-status]').dataset.sourceVariantUrl);
 h.setSelect(select,'');assert.match(h.document.querySelector('[data-shop-variant-status]').textContent,/Vyber/);
 h.click('[data-shop-close]');assert(!h.dialog.open);assert.equal(h.document._focus,button,'closing restores focus without a page scroll');
 h.click('[data-shop-product]');assert(!h.document.querySelector('[data-shop-variant-status]').dataset.sourceVariantUrl,'reopening cannot reuse the old variant');h.click('[data-shop-close]');
 search.value='nothing-matches-123';search.dispatchEvent(new h.window.Event('input',{bubbles:true}));assert.equal(h.api.getState().count,0);assert(h.document.querySelector('[data-shop-reset]'));
 h.click('[data-shop-reset]');assert.equal(h.api.getState().count,20);assert.equal(search.value,'');assert.equal(h.document._focus,search);
 h.click('[data-shop-category="hoodies"]');assert.equal(h.api.getState().count,raw.products.filter(product=>product.category==='hoodies').length);
 assert.equal(h.document.querySelector('[data-shop-category="hoodies"]').getAttribute('aria-pressed'),'true');
 const image=h.document.querySelector('.shop-card img');image.dispatchEvent(new h.window.Event('error'));assert(image.hidden);assert.match(h.document.querySelector('.shop-image-missing').textContent,/Náhled/);
 h.api.destroy();const prior=h.api.getState();search.value='OMERTA';search.dispatchEvent(new h.window.Event('input',{bubbles:true}));assert.deepEqual(h.api.getState(),prior,'unmounted handlers do not update the page');assert(h.requests[0].options.signal.aborted);h.api.destroy();
}
{
 const h=fixture([false,input]);await h.api.ready;assert.match(h.document.querySelector('[data-shop-status]').textContent,/nepodařilo/);h.click('[data-shop-retry]');await new Promise(resolve=>setImmediate(resolve));assert.equal(h.api.getState().count,20);assert.equal(h.requests.length,2);h.api.destroy();
}
{
 const hostile=structuredClone(input);hostile.products=[{...hostile.products[0],name:'<img src=x onerror=bad()>',displayName:'<img src=x onerror=bad()>',description:'<script>bad()</script>plain'}];
 const h=fixture([hostile]);await h.api.ready;assert.equal(h.document.querySelectorAll('.shop-grid img').length,1);assert.match(h.document.querySelector('.shop-card h3').textContent,/<img/);h.click('[data-shop-product]');assert(!h.document.querySelector('[data-shop-detail] script'));assert.equal(h.document.querySelector('.shop-detail-description').textContent,'bad()plain');h.api.destroy();
}
{
 let resolve;const {document}=parseHTML(html);const dialog=document.querySelector('dialog');dialog.close=()=>dialog.removeAttribute('open');const api=mountShop(document.querySelector('[data-shop]'),{document,fetch:()=>new Promise(done=>resolve=done)});api.destroy();resolve({ok:true,json:async()=>input});await api.ready;assert.equal(document.querySelectorAll('.shop-card').length,0,'a late response cannot remount a destroyed shop');
}
// Every historical amount, currency, identity and SKU is retained exactly.
for(const source of raw.products){
 const product=normalized.products.find(product=>product.id===source.productId);assert(product);assert.equal(product.handle,source.handle);
 for(const original of source.variants){
  const variant=product.variants.find(variant=>variant.id===original.id);assert(variant);assert.equal(variant.sku,original.sku);
  assert.deepEqual(variant.sourcePrice,{amount:original.calculatedAmount,currency:original.currency.toUpperCase(),taxInclusive:original.priceTaxInclusive,checkedAt:source.checkedAt});
  const url=new URL(originalVariantURL(product,variant));assert.equal(url.origin,'https://hiphop.caisik.i234.me');assert.equal(url.pathname,'/dk/products/'+source.handle);assert.equal(url.searchParams.get('v_id'),original.id);
 }
}
assert.equal(sourcePrice({amount:NaN,currency:'EUR',checkedAt:input.checkedAt}),null);
assert.equal(sourcePrice({amount:-1,currency:'EUR',checkedAt:input.checkedAt}),null);
assert.equal(sourcePrice({amount:1,currency:'BAD!',checkedAt:input.checkedAt}),null);
assert.equal(sourcePrice({amount:1,currency:'EUR',checkedAt:'not a date'}),null);
assert.equal(sourceProductURL({...normalized.products[0],sourceUrl:'https://attacker.example/'}),null);
assert.equal(originalVariantURL(normalized.products[0],{id:'variant_fake',sku:'fake'}),null);
assert.equal(originalVariantURL({...product,sourceUrl:'javascript:bad()'},product.variants[0]),null);
const home=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{document:homeDoc}=parseHTML(home);
assert.equal(homeDoc.querySelectorAll('#main-nav a[href="/shop/"]').length,1);
assert(homeDoc.querySelector('header>a[data-shop-shortcut][href="/shop/"]'),'mobile shortcut is outside the collapsed navigation');
for(const lang of ['cs','en','fr']){const messages=JSON.parse(fs.readFileSync(new URL(`../dist/i18n/${lang}.json`,import.meta.url),'utf8'));for(const key of ['Cena ve zdrojovém katalogu:','Cenový snapshot:','NÁKUP DOČASNĚ NEDOSTUPNÝ','Objednávání je dočasně nedostupné. Původní obchod se musí obnovit.'])assert(messages[key],lang+': '+key);}
console.log('PASS shop: 20 designs/86 exact IDs, SKUs and dated source prices; exact original-store variant URL construction; invalid/ambiguous/reset/reopen; local cart selections with blocked checkout; visible mobile entry; CS/EN/FR; image safety, search/category/detail, escaping, retry/focus and lifecycle.');
