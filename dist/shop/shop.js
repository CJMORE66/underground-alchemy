/* Actual source designs, deliberately preview-only until a real checkout is connected. */
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
   variantIds.add(variant.id);variants.push({id:text(variant.id),sku:text(variant.sku),title:text(variant.title),options:values});
  }
  if(!variants.length)continue;
  seen.add(id);
  const extra=(Array.isArray(source.images)?source.images:[]).map(safeShopImage).filter(Boolean).filter(url=>url!==source.image&&url!==primary);
  products.push({id,name,originalName:text(source.name)||name,category:source.category,description:plainDescription(source.description),image:primary,images:[...new Set([primary,...extra])].slice(0,12),options,variants});
 }
 if(raw.products.length&&!products.length)throw new Error('No usable shop products');
 // Do not forward prices, private Printful files, checkout URLs or stale availability.
 return {version:1,checkedAt:text(raw.checkedAt),mode:'preview',checkoutEnabled:false,products};
}
export function findShopVariant(product,selection){
 if(!product||product.options.some(option=>!selection[option.title]))return null;
 const matches=product.variants.filter(variant=>product.options.every(option=>variant.options.some(value=>value.title===option.title&&value.value===selection[option.title])));
 return matches.length===1?matches[0]:null;
}
export function mountShop(host,{document:doc=host?.ownerDocument,fetch:request=globalThis.fetch,catalogUrl='/shop/catalog.json?v=1'}={}){
 if(!host||!doc)return {destroy(){},getState:()=>({destroyed:true})};
 const view=doc.defaultView||globalThis,dialog=doc.querySelector('[data-shop-dialog]'),detail=dialog?.querySelector('[data-shop-detail]'),grid=host.querySelector('[data-shop-grid]'),filters=host.querySelector('[data-shop-filters]'),search=host.querySelector('[data-shop-search]'),count=host.querySelector('[data-shop-count]'),status=host.querySelector('[data-shop-status]');
 if(!dialog||!detail||!grid||!filters||!search||!count||!status)throw new Error('Shop page is incomplete');
 const cleanups=[],controller=typeof AbortController!=='undefined'?new AbortController():null;
 let catalogue=null,category='all',term='',selected=null,opener=null,disposed=false,loadEpoch=0;
 const listen=(node,event,fn)=>{node.addEventListener(event,fn);cleanups.push(()=>node.removeEventListener(event,fn));};
 const t=value=>view.CaisikI18n?.t?.(value)||value;
 const rescan=node=>view.CaisikI18n?.rescan?.(node);
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
  const variant=findShopVariant(selected,selection()),node=detail.querySelector('[data-shop-variant-status]');
  if(variant)node.innerHTML=`<span>Vybraná varianta:</span> <span translate="no">${escape(variant.title||variant.options.map(option=>option.value).join(' / '))}</span><br><span>SKU:</span> <span translate="no">${escape(variant.sku)}</span>`;
  else node.textContent=t(selected.options.every(option=>selection()[option.title])?'Tato kombinace v uložené kolekci není. Zkus jinou variantu.':'Vyber velikost a barvu pro zobrazení přesné varianty.');
  rescan(node);
 }
 function open(productId,button){
  const product=catalogue?.products.find(item=>item.id===productId);if(!product)return;
  selected=product;opener=button;
  detail.innerHTML=`<div class="shop-detail-grid"><div><img class="shop-detail-image" data-shop-image src="${escape(product.image)}" alt="${escape(product.name)}" translate="no" width="800" height="800">${product.images.length>1?`<div class="shop-detail-gallery" role="group" aria-label="Produktové náhledy">${product.images.map((_,index)=>`<button type="button" data-shop-view="${index}" aria-pressed="${index===0}"><span>Pohled</span> ${index+1}</button>`).join('')}</div>`:''}<p class="shop-detail-image-note">Produktový mockup. Nejde o fotografii fyzického vzorku.</p></div><div class="shop-detail-copy"><p class="shop-eyebrow">CAISIK / ORIGINAL DESIGN</p><h2 id="shop-detail-title" tabindex="-1" translate="no">${escape(product.name)}</h2>${product.description?`<p class="shop-detail-description" translate="no">${escape(product.description)}</p>`:''}<div class="shop-detail-options">${product.options.map((option,index)=>`<label><span>${escape(option.title==='Size'?'Velikost':option.title==='Color'?'Barva':option.title)}</span><select data-shop-option="${escape(option.title)}" id="shop-option-${index}"><option value="">Vyber variantu</option>${option.values.map(value=>`<option value="${escape(value)}"${option.values.length===1?' selected':''}>${escape(value)}</option>`).join('')}</select></label>`).join('')}</div><p class="shop-variant-status" data-shop-variant-status role="status" aria-live="polite"></p><div class="shop-detail-availability"><p>Kolekce je k prohlédnutí. Prodej zatím není spuštěný.</p></div><p class="shop-detail-image-note">Zobrazené varianty pocházejí z uložené kolekce. Dnešní dostupnost není potvrzená.</p></div></div>`;
  imagesFallback(detail);updateVariant();rescan(detail);
  if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
  dialog.scrollTop=0;detail.querySelector('#shop-detail-title')?.focus({preventScroll:true});
 }
 function restoreFocus(){selected=null;detail.replaceChildren();const button=opener;opener=null;if(button?.isConnected)button.focus({preventScroll:true});}
 function close(){if(typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');restoreFocus();}}
 async function load(){
  const epoch=++loadEpoch;status.textContent=t('Načítám skutečné návrhy z kolekce.');count.textContent=t('Načítám kolekci…');
  try{const response=await request(catalogUrl,{signal:controller?.signal,credentials:'same-origin'});if(!response.ok)throw new Error('Catalogue unavailable');const data=normalizeShopCatalog(await response.json());if(disposed||epoch!==loadEpoch)return;catalogue=data;renderFilters();render();}
  catch(error){if(disposed||epoch!==loadEpoch)return;catalogue=null;grid.replaceChildren();filters.replaceChildren();count.textContent='';status.innerHTML='<span>Kolekci se nepodařilo načíst. Zkus to znovu.</span><br><button type="button" data-shop-retry>Načíst znovu</button>';rescan(status);}
 }
 listen(host,'click',event=>{const button=event.target.closest?.('button');if(!button)return;if(button.hasAttribute('data-shop-product'))open(button.dataset.shopProduct,button);else if(button.hasAttribute('data-shop-category')){category=button.dataset.shopCategory;render();}else if(button.hasAttribute('data-shop-reset')){category='all';term='';search.value='';render();search.focus({preventScroll:true});}else if(button.hasAttribute('data-shop-retry'))void load();});
 listen(search,'input',()=>{term=normalize(search.value.trim());render();});
 listen(dialog,'change',event=>{if(event.target.matches('[data-shop-option]'))updateVariant();});
 listen(dialog,'click',event=>{const button=event.target.closest?.('button');if(!button)return;if(button.hasAttribute('data-shop-close'))close();else if(button.hasAttribute('data-shop-view')&&selected){const index=Number(button.dataset.shopView),url=selected.images[index];if(!url)return;const image=detail.querySelector('.shop-detail-image');image.src=url;image.hidden=false;detail.querySelector('.shop-image-missing')?.remove();for(const control of detail.querySelectorAll('[data-shop-view]'))control.setAttribute('aria-pressed',String(control===button));}});
 listen(dialog,'close',restoreFocus);
 listen(view,'caisik:languagechange',()=>{if(catalogue)count.textContent=t(countLabel(visible().length));});
 listen(view,'pagehide',event=>{if(!event.persisted)destroy();});
 function destroy(){if(disposed)return;disposed=true;loadEpoch++;controller?.abort();cleanups.forEach(remove=>remove());if(dialog.open){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}detail.replaceChildren();selected=null;opener=null;}
 const ready=load();
 return {ready,destroy,getState:()=>({destroyed:disposed,category,search:term,count:visible().length,selected:selected?.id||null,checkoutEnabled:false}),open:id=>open(id,null)};
}
if(typeof document!=='undefined'&&document.querySelector('[data-shop]'))mountShop(document.querySelector('[data-shop]'));
