/* Original collection. Orders remain blocked while the original store is unavailable. */
import {sourcePrice,sourceProductURL,originalVariantURL} from "./source-commerce.js";
import {createCart,cartView} from "./cart.js";
const CATEGORY_LABELS={all:'Vše',tees:'Trička',hoodies:'Mikiny',accessories:'Doplňky',other:'Další návrhy'};
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text=value=>typeof value==='string'?value.trim():'';
const plainDescription=value=>text(value).replace(/<[^>]*>/g,'').slice(0,6000);
const countLabel=count=>count===1?'1 návrh':count>=2&&count<=4?`${count} návrhy`:`${count} návrhů`;
export function safeShopImage(value){
 if(typeof value!=='string')return null;
 if(/^\/assets\/catalog\/[a-zA-Z0-9_.-]+\.(png|webp|jpe?g)$/i.test(value))return value;
 try{const url=new URL(value);if(url.protocol==='https:'&&url.hostname==='files.cdn.printful.com'&&!url.username&&!url.password&&!url.search&&!url.hash&&/^\/files\/[A-Za-z0-9/_-]+(?:_preview|_thumbnail)\.(?:png|jpe?g|webp)$/i.test(url.pathname))return url.href;}catch{}
 return null;
}
export function normalizePrintfulRetailPrice(value){
 if(!value||typeof value.amount!=='string'||!/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,6})?$/.test(value.amount)||(value.currency!==null&&(typeof value.currency!=='string'||!/^[A-Z]{3}$/.test(value.currency)))||typeof value.checkedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value.checkedAt)||!Number.isFinite(Date.parse(value.checkedAt))||value.checkoutQuote!==false||value.source!=='printful-sync-variant')return null;
 return {amount:value.amount,currency:value.currency,checkedAt:value.checkedAt,source:'printful-sync-variant',checkoutQuote:false};
}
const canSaveVariant=variant=>!!variant&&variant.configurationStatus!=='incomplete'&&!['discontinued','out_of_stock','temporary_out_of_stock'].includes(variant.availability);
export function normalizeShopCatalog(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.products)||raw.products.length>500)throw new Error('Invalid shop catalogue');
 const seen=new Set(),products=[];
 for(const source of raw.products){
  if(!source||typeof source!=='object')continue;
  const id=text(source.id)||text(source.productId),name=text(source.displayName)||text(source.name),primary=safeShopImage(source.localImage)||safeShopImage(source.image);
  if(!id||!name||seen.has(id)||!primary||!Object.hasOwn(CATEGORY_LABELS,source.category)||source.category==='all'||!Array.isArray(source.variants))continue;
  const options=(Array.isArray(source.options)?source.options:[]).slice(0,8).filter(option=>option&&text(option.title)&&Array.isArray(option.values)).map(option=>({title:text(option.title),values:[...new Set(option.values.map(text).filter(Boolean))].slice(0,100)})).filter(option=>option.values.length);
  const variants=[],variantIds=new Set();
  for(const variant of source.variants.slice(0,500)){
   if(!variant||!text(variant.id)||variantIds.has(variant.id)||!text(variant.sku)||!Array.isArray(variant.options))continue;
   const values=variant.options.filter(option=>option&&text(option.title)&&text(option.value)).map(option=>({title:text(option.title),value:text(option.value)}));
   if(options.some(option=>!values.some(value=>value.title===option.title&&option.values.includes(value.value))))continue;
   const availability=['active','discontinued','out_of_stock','temporary_out_of_stock'].includes(variant.availability?.status)?variant.availability.status:'unknown';
   variantIds.add(variant.id);variants.push({id:text(variant.id),sku:text(variant.sku),title:text(variant.title),options:values,sourcePrice:sourcePrice(variant.sourcePrice),printfulRetailPrice:normalizePrintfulRetailPrice(variant.printfulRetailPrice),availability,configurationStatus:['synced','incomplete'].includes(variant.configurationStatus)?variant.configurationStatus:'unverified'});
  }
  if(!variants.length)continue;
  seen.add(id);
  const extra=(Array.isArray(source.images)?source.images:[]).map(safeShopImage).filter(Boolean).filter(url=>url!==source.image&&url!==primary);
  const sourceIdentity={id,productId:text(source.productId)||id,handle:text(source.handle),sourceUrl:text(source.sourceUrl)};
  products.push({...sourceIdentity,sourceUrl:sourceProductURL(sourceIdentity),name,originalName:text(source.name)||name,category:source.category,description:plainDescription(source.description),image:primary,images:[...new Set([primary,...extra])].slice(0,12),options,variants});
 }
 if(raw.products.length&&!products.length)throw new Error('No usable shop products');
 // Historical prices and bounded provider observations remain distinct; neither is a checkout quote.
 return {version:1,checkedAt:text(raw.checkedAt),mode:'preview',checkoutEnabled:false,products};
}
export function findShopVariant(product,selection){
 if(!product||product.options.some(option=>!selection[option.title]))return null;
 const matches=product.variants.filter(variant=>product.options.every(option=>variant.options.some(value=>value.title===option.title&&value.value===selection[option.title])));
 return matches.length===1?matches[0]:null;
}
export function mountShop(host,{document:doc=host?.ownerDocument,fetch:request=globalThis.fetch,catalogUrl='/shop/catalog.json?v=2'}={}){
 if(!host||!doc)return {destroy(){},getState:()=>({destroyed:true})};
 const view=doc.defaultView||globalThis,dialog=doc.querySelector('[data-shop-dialog]'),detail=dialog?.querySelector('[data-shop-detail]'),grid=host.querySelector('[data-shop-grid]'),filters=host.querySelector('[data-shop-filters]'),search=host.querySelector('[data-shop-search]'),count=host.querySelector('[data-shop-count]'),status=host.querySelector('[data-shop-status]');
 if(!dialog||!detail||!grid||!filters||!search||!count||!status)throw new Error('Shop page is incomplete');
 const cartHost=host.querySelector('[data-shop-cart]'),cartLines=cartHost?.querySelector('[data-shop-cart-lines]'),cartSummary=cartHost?.querySelector('[data-shop-cart-summary]'),cartStorage=cartHost?.querySelector('[data-shop-cart-storage]');
 const cleanups=[],controller=typeof AbortController!=='undefined'?new AbortController():null;
 let catalogue=null,category='all',term='',selected=null,opener=null,closeTarget=null,disposed=false,loadEpoch=0;
 const listen=(node,event,fn)=>{node.addEventListener(event,fn);cleanups.push(()=>node.removeEventListener(event,fn));};
 const t=value=>view.CaisikI18n?.t?.(value)||value;
 const rescan=node=>view.CaisikI18n?.rescan?.(node);
 let storage;try{storage=view.localStorage;}catch{}
 const cart=createCart({storage,eventTarget:view,onChange:()=>renderCart()});
 const money=(amount,currency)=>{try{return new Intl.NumberFormat('en-IE',{style:'currency',currency}).format(amount);}catch{return amount+' '+currency;}};
 function renderCart(){
  if(disposed||!cartHost||!cartLines||!cartSummary||!cartStorage)return;
  const saved=cart.getState(),summary=cartView(saved.lines,catalogue);
  for(const node of host.querySelectorAll('[data-shop-cart-count]'))node.textContent=String(summary.count);
  cartStorage.textContent=saved.persistent?t('Košík je uložený v tomto prohlížeči.'):saved.error==='corrupt'?t('Uložený košík nelze načíst. Přidáním varianty uložíš nový košík.'):t('Košík není uložený. Po zavření stránky se může ztratit.');
  cartLines.innerHTML=summary.lines.length?summary.lines.map((line,index)=>`<article class="shop-cart-line" data-cart-line="${index}"><div><h3 id="shop-cart-item-${index}" translate="no">${escape(line.product?.name||line.productId)}</h3><p translate="no">${escape(line.variant?.title||line.variantId)}</p>${line.variant?`<p class="shop-cart-warning">${line.variant.configurationStatus==='incomplete'?'Konfigurace této varianty není dokončená.':line.variant.availability==='discontinued'||line.variant.availability==='out_of_stock'||line.variant.availability==='temporary_out_of_stock'?'Tato varianta je nedostupná.':'Dostupnost před platbou musí ověřit server.'}</p>`:'<p class="shop-cart-warning">Varianta není v načteném katalogu. Odeber ji nebo vyber jinou.</p>'}${line.variant?.sourcePrice?`<p><span>Historická cena za kus:</span> <strong translate="no">${escape(money(line.variant.sourcePrice.amount,line.variant.sourcePrice.currency))}</strong> <time translate="no" datetime="${escape(line.variant.sourcePrice.checkedAt)}">${escape(line.variant.sourcePrice.checkedAt.slice(0,10))}</time></p>`:'<p>Cena této varianty není doložená.</p>'}</div><div class="shop-cart-controls" role="group" aria-labelledby="shop-cart-item-${index}"><button type="button" data-cart-minus="${index}" aria-label="${escape(t('Snížit množství'))}"${line.quantity<=1?' disabled':''}>−</button><label><span>Množství</span><input type="number" min="1" max="99" step="1" inputmode="numeric" data-cart-quantity="${index}" value="${line.quantity}"></label><button type="button" data-cart-plus="${index}" aria-label="${escape(t('Zvýšit množství'))}"${line.quantity>=99?' disabled':''}>+</button><button class="shop-cart-remove" type="button" data-cart-remove="${index}">Odebrat</button></div></article>`).join(''):'<p>Košík je prázdný. Vyber návrh, velikost a barvu.</p>';
  cartSummary.innerHTML=summary.lines.length?`<p><span>Historický mezisoučet:</span> ${summary.totals.length?summary.totals.map(total=>`<strong translate="no">${escape(money(total.minor/(10**total.digits),total.currency))}</strong>`).join(' + '):'<span>Nelze vypočítat.</span>'}</p>${summary.incomplete?'<p>Mezisoučet je neúplný. Některé varianty nemají doloženou cenu.</p>':''}`:'';
  rescan(cartHost);
 }
 function cartLine(index){return cart.getState().lines[Number(index)];}
 function updateCart(event){
  const button=event.target.closest?.('button');if(!button)return;
  const action=button.hasAttribute('data-cart-minus')?'minus':button.hasAttribute('data-cart-plus')?'plus':button.hasAttribute('data-cart-remove')?'remove':null;if(!action)return;
  const index=button.getAttribute('data-cart-'+action),line=cartLine(index);if(!line)return;
  if(action==='remove')cart.remove(line.productId,line.variantId);else cart.setQuantity(line.productId,line.variantId,line.quantity+(action==='plus'?1:-1));
  const candidate=cartHost.querySelector(`[data-cart-${action}="${index}"]`),next=(candidate&&!candidate.disabled?candidate:null)||cartHost.querySelector(`[data-cart-quantity="${index}"]`)||cartHost.querySelector('[data-cart-remove]')||cartHost;
  next.focus?.({preventScroll:true});
 }

 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 const visible=()=>catalogue?.products.filter(product=>(category==='all'||product.category===category)&&(!term||normalize([product.name,product.originalName,...product.variants.map(variant=>variant.sku)].join(' ')).includes(term)))||[];
 function imagesFallback(scope){for(const image of scope.querySelectorAll('img[data-shop-image]')){image.addEventListener('error',()=>{if(disposed)return;image.hidden=true;if(image.nextElementSibling?.classList.contains('shop-image-missing'))return;const label=doc.createElement('p');label.className='shop-image-missing';label.textContent=t('Náhled se nepodařilo načíst. Název a varianty jsou stále dostupné.');image.after(label);rescan(label);});}}
 function renderFilters(){filters.innerHTML=Object.entries(CATEGORY_LABELS).filter(([key])=>key==='all'||catalogue.products.some(product=>product.category===key)).map(([key,label])=>`<button type="button" data-shop-category="${key}" aria-pressed="${category===key}">${label}</button>`).join('');rescan(filters);}
 function render(){
  if(disposed||!catalogue)return;
  const products=visible();count.textContent=t(countLabel(products.length));status.textContent='';
  for(const button of filters.querySelectorAll('[data-shop-category]'))button.setAttribute('aria-pressed',String(button.dataset.shopCategory===category));
  grid.innerHTML=products.length?products.map(product=>{const index=catalogue.products.indexOf(product),title=`shop-product-${index}`,action=`shop-open-${index}`;return `<article class="shop-card"><button class="shop-card-image" type="button" data-shop-product="${escape(product.id)}" aria-labelledby="${action} ${title}"><span class="shop-card-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><img data-shop-image src="${escape(product.image)}" alt="" width="800" height="800" loading="lazy"><span class="shop-card-open"><span id="${action}">Prohlédnout návrh</span><span aria-hidden="true">↗</span></span></button><h3 id="${title}" translate="no">${escape(product.name)}</h3><p class="shop-card-meta"><span>${CATEGORY_LABELS[product.category]}</span><span><span>Varianty:</span> ${product.variants.length}</span></p></article>`;}).join(''):'<div class="shop-empty"><p>Žádný návrh neodpovídá. Zkus kratší dotaz nebo jiný druh produktu.</p><button class="shop-clear" type="button" data-shop-reset>Zobrazit celou kolekci</button></div>';
  imagesFallback(grid);rescan(host);
 }
 function selection(){return Object.fromEntries([...detail.querySelectorAll('[data-shop-option]')].map(select=>[select.dataset.shopOption,select.value]));}
 function updateVariant(){
  if(!selected)return;
  const variant=findShopVariant(selected,selection()),node=detail.querySelector('[data-shop-variant-status]'),price=detail.querySelector('[data-shop-price]'),retail=detail.querySelector('[data-shop-retail-price]'),availability=detail.querySelector('[data-shop-availability]');
  const destination=originalVariantURL(selected,variant);
  if(destination)node.dataset.sourceVariantUrl=destination;else delete node.dataset.sourceVariantUrl;
  if(variant?.sourcePrice){const saved=variant.sourcePrice;let amount;try{amount=new Intl.NumberFormat('en-IE',{style:'currency',currency:saved.currency}).format(saved.amount);}catch{amount=saved.amount+' '+saved.currency;}
   price.innerHTML=`<span>Cena ve zdrojovém katalogu:</span> <strong translate="no">${escape(amount)}</strong><br><span>Cenový snapshot:</span> <time datetime="${escape(saved.checkedAt)}" translate="no">${escape(saved.checkedAt.slice(0,10))}</time>${saved.taxInclusive===false?'<br><span>Zdrojová cena bez daně.</span>':''}`;
  }else price.textContent=variant?t('Cena této varianty není doložená.') : '';
  rescan(price);
  const observed=variant?.printfulRetailPrice;
  if(retail){retail.innerHTML=observed?`<span>Cena v Printful při synchronizaci:</span> <strong translate="no">${escape(observed.amount)}${observed.currency?' '+escape(observed.currency):''}</strong>${observed.currency?'':' <span>Měna není ověřená.</span>'}<br><span>Ověřeno při synchronizaci:</span> <time translate="no" datetime="${escape(observed.checkedAt)}">${escape(observed.checkedAt)}</time><br><span>Údaj z Printful není prodejní nabídka ani konečná cena v pokladně.</span>`:'';rescan(retail);}
  if(availability){availability.textContent=variant?t(variant.configurationStatus==='incomplete'?'Konfigurace této varianty není dokončená.':['discontinued','out_of_stock','temporary_out_of_stock'].includes(variant.availability)?'Tato varianta je nedostupná.':variant.availability==='unknown'?'Dostupnost této varianty není ověřená.':'Dostupnost před platbou musí ověřit server.') : '';rescan(availability);}
  if(variant)node.innerHTML=`<span>Vybraná varianta:</span> <span translate="no">${escape(variant.title||variant.options.map(option=>option.value).join(' / '))}</span><br><span>SKU:</span> <span translate="no">${escape(variant.sku)}</span>`;
  else node.textContent=t(selected.options.every(option=>selection()[option.title])?'Tato kombinace v uložené kolekci není. Zkus jinou variantu.':'Vyber velikost a barvu pro zobrazení přesné varianty.');
  const add=detail.querySelector('[data-shop-add]');if(add)add.disabled=!canSaveVariant(variant);
  rescan(node);
 }
 function open(productId,button){
  const product=catalogue?.products.find(item=>item.id===productId);if(!product)return;
  selected=product;opener=button;closeTarget=null;
  detail.innerHTML=`<div class="shop-detail-grid"><div><img class="shop-detail-image" data-shop-image src="${escape(product.image)}" alt="${escape(product.name)}" translate="no" width="800" height="800">${product.images.length>1?`<div class="shop-detail-gallery" role="group" aria-label="Produktové náhledy">${product.images.map((_,index)=>`<button type="button" data-shop-view="${index}" aria-pressed="${index===0}"><span>Pohled</span> ${index+1}</button>`).join('')}</div>`:''}<p class="shop-detail-image-note">Produktový mockup. Nejde o fotografii fyzického vzorku.</p></div><div class="shop-detail-copy"><p class="shop-eyebrow">CAISIK / ORIGINAL DESIGN</p><h2 id="shop-detail-title" tabindex="-1" translate="no">${escape(product.name)}</h2>${product.description?`<p class="shop-detail-description" translate="no">${escape(product.description)}</p>`:''}<div class="shop-detail-options">${product.options.map((option,index)=>`<label><span>${escape(option.title==='Size'?'Velikost':option.title==='Color'?'Barva':option.title)}</span><select data-shop-option="${escape(option.title)}" id="shop-option-${index}"><option value="">Vyber variantu</option>${option.values.map(value=>`<option value="${escape(value)}"${option.values.length===1?' selected':''}>${escape(value)}</option>`).join('')}</select></label>`).join('')}</div><p class="shop-variant-status" data-shop-variant-status role="status" aria-live="polite"></p><p class="shop-source-price" data-shop-price aria-live="polite"></p><p class="shop-retail-price" data-shop-retail-price aria-live="polite"></p><p class="shop-variant-availability" data-shop-availability role="status"></p><div class="shop-detail-cart"><button type="button" class="shop-primary" data-shop-add disabled>PŘIDAT DO KOŠÍKU</button><p data-shop-cart-feedback role="status" aria-live="polite"></p><a class="shop-cart-link" href="#shop-cart" data-shop-go-cart>Otevřít košík</a><a class="shop-product-link" href="?product=${encodeURIComponent(product.id)}">Odkaz na návrh ↗</a></div><div class="shop-detail-availability"><button type="button" class="shop-primary" disabled aria-describedby="shop-order-status">NÁKUP DOČASNĚ NEDOSTUPNÝ</button><p id="shop-order-status">Objednávání je dočasně nedostupné. Původní obchod se musí obnovit.</p></div><p class="shop-detail-image-note">Uložené ceny nejsou aktuální nabídkou. Doprava, daně a konečná cena se ověřují v původním obchodě.</p><p class="shop-detail-image-note">Zobrazené varianty pocházejí z uložené kolekce. Dnešní dostupnost není potvrzená.</p></div></div>`;
  imagesFallback(detail);updateVariant();rescan(detail);
  if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
  dialog.scrollTop=0;detail.querySelector('#shop-detail-title')?.focus({preventScroll:true});
 }
 function restoreFocus(){
  if(dialog.open)return;
  selected=null;detail.replaceChildren();const target=closeTarget||opener;closeTarget=null;opener=null;
  if(target===cartHost)cartHost.scrollIntoView?.({block:'start'});
  if(target?.isConnected)target.focus({preventScroll:true});
 }
 function close(focusTarget=null){closeTarget=focusTarget;if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');restoreFocus();}}
 async function load(){
  const epoch=++loadEpoch;status.textContent=t('Načítám skutečné návrhy z kolekce.');count.textContent=t('Načítám kolekci…');
  try{const response=await request(catalogUrl,{signal:controller?.signal,credentials:'same-origin'});if(!response.ok)throw new Error('Catalogue unavailable');const data=normalizeShopCatalog(await response.json());if(disposed||epoch!==loadEpoch)return;catalogue=data;renderFilters();render();renderCart();try{const id=new URL(view.location?.href||'https://local.invalid/').searchParams.get('product');if(id)open(id,null);}catch{}}
  catch(error){if(disposed||epoch!==loadEpoch)return;catalogue=null;grid.replaceChildren();filters.replaceChildren();count.textContent='';status.innerHTML='<span>Kolekci se nepodařilo načíst. Zkus to znovu.</span><br><button type="button" data-shop-retry>Načíst znovu</button>';rescan(status);}
 }
 listen(host,'click',event=>{const button=event.target.closest?.('button');if(!button)return;if(button.hasAttribute('data-shop-product'))open(button.dataset.shopProduct,button);else if(button.hasAttribute('data-shop-category')){category=button.dataset.shopCategory;render();}else if(button.hasAttribute('data-shop-reset')){category='all';term='';search.value='';render();search.focus({preventScroll:true});}else if(button.hasAttribute('data-shop-retry'))void load();});
 listen(search,'input',()=>{term=normalize(search.value.trim());render();});
 listen(dialog,'change',event=>{if(event.target.matches('[data-shop-option]'))updateVariant();});
 listen(dialog,'click',event=>{const button=event.target.closest?.('button');if(!button)return;if(button.hasAttribute('data-shop-close'))close();else if(button.hasAttribute('data-shop-add')&&selected){const variant=findShopVariant(selected,selection());if(!canSaveVariant(variant))return;const added=cart.add(selected.id,variant.id),feedback=detail.querySelector('[data-shop-cart-feedback]');feedback.textContent=t(added?'Varianta přidaná do košíku. Nejde o objednávku.':'Košík je plný nebo bylo dosaženo limitu množství.');}else if(button.hasAttribute('data-shop-view')&&selected){const index=Number(button.dataset.shopView),url=selected.images[index];if(!url)return;const image=detail.querySelector('.shop-detail-image');image.src=url;image.hidden=false;detail.querySelector('.shop-image-missing')?.remove();for(const control of detail.querySelectorAll('[data-shop-view]'))control.setAttribute('aria-pressed',String(control===button));}});
 listen(dialog,'close',restoreFocus);
 listen(dialog,'click',event=>{if(event.target.closest?.('[data-shop-go-cart]')){event.preventDefault();close(cartHost);}});
 if(cartHost){listen(cartHost,'click',updateCart);listen(cartHost,'change',event=>{const input=event.target.closest?.('[data-cart-quantity]');if(!input)return;const index=input.dataset.cartQuantity,line=cartLine(index);if(!line)return;const value=Number(input.value);if(!cart.setQuantity(line.productId,line.variantId,value)){input.value=String(line.quantity);input.setAttribute('aria-invalid','true');}else{cartHost.querySelector(`[data-cart-quantity="${index}"]`)?.focus?.({preventScroll:true});}});}
 renderCart();
 listen(view,'caisik:languagechange',()=>{if(catalogue)count.textContent=t(countLabel(visible().length));renderCart();});
 listen(view,'pagehide',event=>{if(!event.persisted)destroy();});
 function destroy(){if(disposed)return;disposed=true;loadEpoch++;controller?.abort();cleanups.forEach(remove=>remove());cart.destroy();if(dialog.open){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}detail.replaceChildren();selected=null;opener=null;}
 const ready=load();
 return {ready,destroy,getState:()=>({destroyed:disposed,category,search:term,count:visible().length,selected:selected?.id||null,checkoutEnabled:false,cartCount:cartView(cart.getState().lines,catalogue).count}),open:id=>open(id,null)};
}
if(typeof document!=='undefined'&&document.querySelector('[data-shop]'))mountShop(document.querySelector('[data-shop]'));
