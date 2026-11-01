/* Isolated DOM/fetch fixtures. These do not prove live API or Stripe operation. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {mountCheckout,safeCheckoutURL,normalizeShipping,normalizeQuote,commerceText} from '../dist/shop/checkout.js';
import {mountShop,normalizeShopCatalog} from '../dist/shop/shop.js';
import {originalVariantURL} from '../dist/shop/source-commerce.js';
import {historicalShopFixture} from './shop-fixture.mjs';
const CLOCK=Date.UTC(2026,10,1),tick=()=>new Promise(resolve=>setImmediate(resolve));
const requested=[{variantId:'variant_fixture1',quantity:2}];
const status={catalogAvailable:true,shippingAvailable:true,checkoutAvailable:true,mode:'test',allowedCountries:['CZ','FR','US','CA','AU']};
const shipping={status:'shipping_required',currency:'EUR',currencyExponent:2,shippingOptions:[{id:'STANDARD',name:'Standard tracked',amountMinor:500,currency:'EUR'}]};
const quote={...shipping,status:'quoted',subtotalMinor:5000,orderId:'ua_order_fixture1',selectedShippingId:'STANDARD',shippingMinor:500,taxMinor:1100,totalMinor:6600,expiresAt:Math.floor(CLOCK/1000)+600,lines:[{variantId:'variant_fixture1',productId:'product_fixture1',name:'Fixture product',title:'Black / XL',quantity:2,unitAmountMinor:2500,lineAmountMinor:5000}]};
const sessionId='cs_test_abcdef123456',checkout={id:sessionId,url:'https://checkout.stripe.com/c/pay/'+sessionId+'#fixture'};
const response=(body,code=200)=>new Response(JSON.stringify(body),{status:code,headers:{'content-type':'application/json'}});
function fixture({live=true,lines=requested,serverStatus=status,handlers={},url='https://example.test/shop/',language='cs',navigate,validateLines}={}){
 const {document,window}=parseHTML(`<html lang="${language}"><head></head><body><div id="host"><button aria-describedby="shop-checkout-reason" disabled>old</button><p id="shop-checkout-reason">old reason</p></div></body></html>`);
 window.location={href:url};let storageValue=null;window.sessionStorage={getItem:()=>storageValue,setItem:(_key,value)=>storageValue=value};
 const state={live,lines:structuredClone(lines),language},calls=[],destinations=[];
 const fetch=async(path,options)=>{calls.push({path,options,body:options.body?JSON.parse(options.body):undefined});const handler=handlers[path];if(handler)return typeof handler==='function'?handler(options,calls.at(-1)):response(handler);if(path==='/api/commerce/status')return response(serverStatus);if(path==='/api/commerce/shipping')return response(shipping);if(path==='/api/commerce/quote')return response(quote);if(path==='/api/commerce/checkout')return response(checkout);return response({error:'NOT_FOUND'},404);};
 const api=mountCheckout(document.querySelector('#host'),{document,fetch,getCatalogState:()=>({live:state.live,validateLines}),getLines:()=>state.lines,getLanguage:()=>state.language,navigate:navigate||((url)=>destinations.push(url)),now:()=>CLOCK,poll:false});
 const click=selector=>{const node=document.querySelector(selector);assert(node,selector);node.click();return node;};
 const field=(name,value)=>{const node=document.querySelector(`[name="${name}"]`);assert(node,name);if(name==='country_code')Object.defineProperty(node,'value',{configurable:true,writable:true,value});else node.value=value;return node;};
 const address=()=>{for(const [name,value]of Object.entries({name:'Fixture Customer',email:'fixture@example.test',address1:'1 Fixture Street',city:'Paris',zip:'75001',country_code:'FR'}))field(name,value);};
 const submit=()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 const choose=()=>{const radio=document.querySelector('input[name="commerce-shipping"]');assert(radio);radio.checked=true;radio.dispatchEvent(new window.Event('change',{bubbles:true}));};
 return {document,window,state,calls,destinations,api,click,field,address,submit,choose};
}
for(const value of ['javascript:alert(1)','/api/checkout','https://checkout.stripe.com.evil.test/c/pay/cs_test_1234','https://attacker@checkout.stripe.com/c/pay/cs_test_1234','https://checkout.stripe.com:444/c/pay/cs_test_1234','https://checkout.stripe.com/redirect','https://checkout.stripe.com/c/pay/../evil'])assert.equal(safeCheckoutURL(value),null);
assert.equal(safeCheckoutURL(checkout.url),checkout.url);
assert.deepEqual(normalizeShipping(shipping),{currency:'EUR',currencyExponent:2,shippingOptions:shipping.shippingOptions});
for(const value of [{...shipping,currencyExponent:4},{...shipping,shippingOptions:[{...shipping.shippingOptions[0],amountMinor:'5'}]},{...shipping,shippingOptions:[shipping.shippingOptions[0],shipping.shippingOptions[0]]}])assert.throws(()=>normalizeShipping(value));
assert.equal(normalizeQuote(quote,requested,CLOCK).totalMinor,6600);
for(const value of [{...quote,totalMinor:1},{...quote,expiresAt:Math.floor(CLOCK/1000)},{...quote,lines:[{...quote.lines[0],quantity:1}]},{...quote,selectedShippingId:'MISSING'}])assert.throws(()=>normalizeQuote(value,requested,CLOCK));
{
 const h=fixture();await h.api.ready;assert(h.api.getState().enabled);assert.equal(h.calls.length,1);assert.match(h.document.querySelector('[data-commerce-test]').textContent,/TESTOVACÍ/);assert(h.document.querySelector('[aria-describedby="shop-checkout-reason"]').hidden);
 h.address();h.submit();await tick();assert(h.api.getState().hasShipping);assert.equal(h.calls.at(-1).path,'/api/commerce/shipping');assert.deepEqual(h.calls.at(-1).body.lines,requested);assert(!('price'in h.calls.at(-1).body));assert.equal(h.calls.at(-1).options.credentials,'same-origin');assert.equal(h.calls.at(-1).options.redirect,'error');
 h.choose();h.click('[data-commerce-quote]');await tick();assert(h.api.getState().hasQuote);assert.equal(h.calls.at(-1).body.shippingId,'STANDARD');assert.deepEqual(Object.keys(h.calls.at(-1).body).sort(),['lines','recipient','shippingId']);assert.match(h.document.querySelector('[data-commerce-summary]').textContent,/66,00/);assert(!h.document.querySelector('[data-commerce-pay]').disabled);
 h.click('[data-commerce-pay]');await tick();assert.deepEqual(h.calls.at(-1).body,{orderId:'ua_order_fixture1'});assert.deepEqual(h.destinations,[checkout.url]);h.api.destroy();
}
{
 const h=fixture({live:false});await h.api.ready;assert(!h.api.getState().enabled);assert(h.document.querySelector('form').hidden);assert.match(h.document.querySelector('[data-commerce-status]').textContent,/uložená kolekce/);h.submit();await tick();assert.equal(h.calls.length,1,'snapshot cannot reach shipping or checkout');h.api.destroy();
}
{
 const h=fixture({serverStatus:{...status,checkoutAvailable:false}});await h.api.ready;h.address();h.submit();await tick();h.choose();assert(h.api.getState().hasShipping);assert(h.document.querySelector('[data-commerce-quote]').disabled);h.click('[data-commerce-quote]');await tick();assert(!h.api.getState().hasQuote);assert(h.document.querySelector('[data-commerce-pay]').disabled);h.click('[data-commerce-pay]');await tick();assert(!h.calls.some(call=>call.path.endsWith('/quote')||call.path.endsWith('/checkout')),'Shipping-only readiness must not open a payment-dependent quote or checkout');h.api.destroy();
}
{
 const h=fixture({lines:[]});await h.api.ready;assert(!h.api.getState().enabled);assert(h.document.querySelector('[data-commerce-shipping]').disabled);h.api.destroy();
 const missing=fixture({validateLines:()=>false});await missing.api.ready;assert(!missing.api.getState().enabled);assert.match(missing.document.querySelector('[data-commerce-status]').textContent,/varianta/);missing.api.destroy();
}
{
 const h=fixture();await h.api.ready;h.submit();await tick();assert.equal(h.calls.length,1);assert.match(h.document.querySelector('[data-commerce-status]').textContent,/Doplň/);h.address();h.field('country_code','US');h.submit();await tick();assert.equal(h.calls.length,1,'US requires a state');h.api.destroy();
}
{
 const h=fixture({handlers:{'/api/commerce/shipping':()=>response({error:'DO_NOT_RENDER_<script>secret</script>'},503)}});await h.api.ready;h.address();h.submit();await tick();assert.match(h.document.querySelector('[data-commerce-status]').textContent,/nepodařilo/);assert(!h.document.body.innerHTML.includes('DO_NOT_RENDER'));h.api.destroy();
}
{
 const h=fixture({handlers:{'/api/commerce/checkout':{id:sessionId,url:'https://evil.test/steal'}}});await h.api.ready;h.address();h.submit();await tick();h.choose();h.click('[data-commerce-quote]');await tick();h.click('[data-commerce-pay]');await tick();assert.equal(h.destinations.length,0);assert.match(h.document.querySelector('[data-commerce-status]').textContent,/neplatnou/);h.api.destroy();
}
{
 const h=fixture();await h.api.ready;h.address();h.submit();await tick();h.choose();h.click('[data-commerce-quote]');await tick();assert(h.api.getState().hasQuote);h.field('zip','75002').dispatchEvent(new h.window.Event('input',{bubbles:true}));assert(!h.api.getState().hasQuote);assert(!h.api.getState().hasShipping);assert(h.document.querySelector('[data-commerce-pay]').hidden);h.api.destroy();
}
{
 let finish;const h=fixture({handlers:{'/api/commerce/shipping':()=>new Promise(resolve=>finish=resolve)}});await h.api.ready;h.address();h.submit();await tick();h.state.lines=[{variantId:'variant_fixture1',quantity:3}];h.api.refresh();finish(response(shipping));await tick();assert(!h.api.getState().hasShipping,'late shipping cannot overwrite changed cart');assert(!h.api.getState().busy);h.api.destroy();
}
{
 let finish;const h=fixture({live:false,handlers:{'/api/commerce/status':()=>new Promise(resolve=>finish=resolve)}});h.state.live=true;h.api.refresh();finish(response(status));await h.api.ready;assert(h.api.getState().enabled,'catalogue becoming live must not cancel the initial status request');h.api.destroy();
}
{
 const h=fixture({url:'https://example.test/shop/?checkout=return&session_id='+sessionId,handlers:{['/api/commerce/orders/by-session/'+sessionId]:{orderId:'ua_order_fixture1',status:'draft_created',currency:'EUR',totalMinor:6600,draftId:123}}});await h.api.ready;assert(h.calls.some(call=>call.path==='/api/commerce/orders/by-session/'+sessionId));assert.match(h.document.querySelector('[data-commerce-order-state]').textContent,/koncept/);assert(!h.calls.some(call=>call.options.method!=='GET'));h.api.destroy();
 const blocked=fixture({url:'https://example.test/shop/?checkout=return&session_id='+sessionId,handlers:{['/api/commerce/orders/by-session/'+sessionId]:()=>response({error:'NOT_YOUR_ORDER'},403)}});await blocked.api.ready;assert.match(blocked.document.querySelector('[data-commerce-order-state]').textContent,/není dostupný/);assert(!blocked.document.querySelector('[data-commerce-order-state]').textContent.includes('Platba byla'));blocked.api.destroy();
}
for(const language of ['cs','en','fr']){const h=fixture({language});await h.api.ready;assert.equal(h.document.querySelector('#commerce-title').textContent,commerceText('title',language));assert.equal(h.document.querySelector('.shop-checkout').lang,language);h.state.language=language==='fr'?'en':'fr';h.window.dispatchEvent(new h.window.Event('caisik:languagechange'));assert.equal(h.document.querySelector('#commerce-title').textContent,commerceText('title',h.state.language));h.api.destroy();}
{
 const snapshot=historicalShopFixture();const original=structuredClone(snapshot);snapshot.products[0].variants[0].sourceSku=snapshot.products[0].variants[0].sku;snapshot.products[0].variants[0].sku='REALPRINTFULSKU';const migrated=normalizeShopCatalog(snapshot).products[0];assert.equal(originalVariantURL(migrated,migrated.variants[0]),originalVariantURL(normalizeShopCatalog(original).products[0],normalizeShopCatalog(original).products[0].variants[0]),'real SKU migration preserves exact historical external variant link');
 const html=fs.readFileSync(new URL('../dist/shop/index.html',import.meta.url),'utf8'),{document,window}=parseHTML(html);window.localStorage={getItem:()=>null,setItem:()=>{}};window.CaisikI18n={t:key=>key,getLanguage:()=> 'cs',rescan:()=>{}};const calls=[];const api=mountShop(document.querySelector('[data-shop]'),{document,fetch:async(path)=>{calls.push(path);if(path==='/api/commerce/status')return response(status);if(path==='/api/commerce/catalog')return response({error:'UPSTREAM_DOWN'},503);if(path.startsWith('/shop/catalog.json'))return response(original);return response({},404);}});await api.ready;await tick();assert(!api.getState().catalogueLive);assert(!api.getState().checkoutEnabled);assert.match(document.querySelector('[data-shop-catalog-notice]').textContent,/uložená kolekce/);assert(calls.includes('/api/commerce/catalog'));assert(calls.some(path=>path.startsWith('/shop/catalog.json')));api.destroy();
}
{
 const live=historicalShopFixture();live.mode='printful-readonly';live.catalogueVerifiedLive=true;for(const product of live.products)for(const variant of product.variants){variant.configurationStatus='synced';variant.availability={status:'active'};}
 const html=fs.readFileSync(new URL('../dist/shop/index.html',import.meta.url),'utf8'),{document,window}=parseHTML(html);window.localStorage={getItem:()=>null,setItem:()=>{}};window.CaisikI18n={t:key=>key,getLanguage:()=> 'en',rescan:()=>{}};const calls=[];const api=mountShop(document.querySelector('[data-shop]'),{document,fetch:async(path)=>{calls.push(path);if(path==='/api/commerce/status')return response(status);if(path==='/api/commerce/catalog')return response(live);return response({},404);}});await api.ready;await tick();assert(api.getState().catalogueLive);assert(!calls.some(path=>path.startsWith('/shop/catalog.json')),'successful verified live data never silently falls back to a saved snapshot');assert.match(document.querySelector('[data-shop-catalog-notice]').textContent,/server Printful catalogue/);assert.match(document.querySelector('.shop-availability').textContent,/TEST MODE/);api.destroy();
}
{
 const h=fixture({url:'https://example.test/shop/?checkout=return&session_id='+sessionId,handlers:{['/api/commerce/orders/by-session/'+sessionId]:{orderId:'ua_order_fixture1',status:'draft_created',fulfillment:{version:1,storeId:18912189,status:'partial',shipments:[{reportedInLatest:true,trackingUrl:'https://www.ups.com/track?tracknum=isolated'},{reportedInLatest:true,trackingUrl:'javascript:alert(1)'},{reportedInLatest:false,trackingUrl:'https://www.ups.com/track?tracknum=historical'}]}}}});
 await h.api.ready;assert.match(h.document.querySelector('[data-commerce-order-state]').textContent,/Část objednávky/);const links=h.document.querySelectorAll('[data-commerce-tracking] a');assert.equal(links.length,1);assert.equal(links[0].getAttribute('rel'),'noopener noreferrer');assert(!h.document.querySelector('[data-commerce-order-state]').textContent.includes('Platba byla'));h.api.destroy();
}

// Current catalogue copy must describe native server checks, even when payment
// configuration is still blocked; saved fallback keeps an explicit stale boundary.
for(const lang of ['cs','en','fr']){
 const messages=JSON.parse(fs.readFileSync(new URL(`../dist/i18n/${lang}.json`,import.meta.url),'utf8'));
 const policy='Cena, dostupnost, doprava a daně se před platbou znovu ověří na serveru.',checked='Dostupnost variant byla ověřena při načtení katalogu. Před platbou se ověří znovu.',fallbackPolicy='Uložené ceny nejsou aktuální nabídkou. Konečnou cenu, dopravu a daně musí ověřit server před platbou.',fallbackReason='Pokladna je dočasně nedostupná. Vybrané varianty si můžeš uložit do košíku.';
 for(const key of [policy,checked,fallbackPolicy,fallbackReason,'Načítám katalog a ověřuji dostupnost pokladny.'])assert(messages[key],lang+': '+key);
 for(const liveMode of [true,false]){
  const payload=historicalShopFixture();if(liveMode){payload.mode='printful-readonly';payload.catalogueVerifiedLive=true;for(const product of payload.products)for(const variant of product.variants){variant.configurationStatus='synced';variant.availability={status:'active'};}}
  const html=fs.readFileSync(new URL('../dist/shop/index.html',import.meta.url),'utf8'),{document,window}=parseHTML(html);assert(!html.includes('Původní obchod se musí obnovit.'),'initial header cannot require restoring the old store');window.localStorage={getItem:()=>null,setItem:()=>{}};window.CaisikI18n={t:key=>messages[key]||key,getLanguage:()=>lang,rescan:()=>{}};const dialog=document.querySelector('[data-shop-dialog]');Object.defineProperty(dialog,'open',{get(){return this.hasAttribute('open');}});dialog.showModal=function(){this.setAttribute('open','');};dialog.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
  const api=mountShop(document.querySelector('[data-shop]'),{document,fetch:async(path)=>path==='/api/commerce/status'?response({...status,checkoutAvailable:false}):path==='/api/commerce/catalog'?(liveMode?response(payload):response({error:'LIVE_UNAVAILABLE'},503)):path.startsWith('/shop/catalog.json')?response(payload):response({},404)});await api.ready;await tick();api.open(payload.products[0].id);
  const detail=document.querySelector('[data-shop-detail]');assert.equal(detail.querySelector('[data-shop-detail-policy]').textContent,messages[liveMode?policy:fallbackPolicy]);assert(!detail.textContent.includes('Původní obchod se musí obnovit.'));assert(!detail.textContent.includes('v původním obchodě'));
  if(liveMode){assert.equal(detail.querySelector('.shop-detail-availability'),null,'live detail must not retain an obsolete disabled external-store CTA');assert.equal(detail.querySelector('[data-shop-detail-catalog-status]').textContent,messages[checked]);assert(detail.querySelector('[data-shop-go-cart]'),'native cart remains the next action');}
  else{assert.equal(detail.querySelector('#shop-order-status').textContent,messages[fallbackReason]);assert(detail.querySelector('.shop-detail-availability button').disabled);assert.match(document.querySelector('[data-shop-catalog-notice]').textContent,new RegExp(commerceText('stale',lang).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));}
  const variant=payload.products[0].variants[0];for(const option of variant.options){const select=detail.querySelector(`[data-shop-option="${option.title}"]`);Object.defineProperty(select,'value',{configurable:true,writable:true,value:option.value});select.dispatchEvent(new window.Event('change',{bubbles:true}));}assert.equal(detail.querySelector('[data-shop-price] time').getAttribute('datetime'),variant.sourcePrice.checkedAt,'historical price evidence and date remain intact');api.destroy();
 }
}
console.log('PASS checkout UI: isolated same-origin catalog/status/shipping/quote/Stripe fixtures; server-only amounts, stale fallback disabled, errors/late responses/cart changes, malformed redirects, protected return status, CZ/EN/FR and historical SKU aliases. No live payment or fulfillment verification.');
