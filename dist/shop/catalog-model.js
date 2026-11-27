/* Normalized catalogue records shared by the drop and the verified commerce client. */
import {sourcePrice} from './source-commerce.js';
export const CATEGORY_LABELS={all:'Vše',tees:'Trička',hoodies:'Mikiny',accessories:'Doplňky',other:'Další návrhy'};
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text=value=>typeof value==='string'?value.trim():'';
const plainDescription=value=>text(value).replace(/<[^>]*>/g,'').slice(0,6000);
export const countLabel=count=>count===1?'1 návrh':count>=2&&count<=4?`${count} návrhy`:`${count} návrhů`;
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
   variantIds.add(variant.id);variants.push({id:text(variant.id),sku:text(variant.sku),title:text(variant.title),options:values,sourceSku:/^PF-18912189-[1-9][0-9]{0,15}$/.test(variant.sourceSku||'')?variant.sourceSku:null,sourcePrice:sourcePrice(variant.sourcePrice),printfulRetailPrice:normalizePrintfulRetailPrice(variant.printfulRetailPrice),availability,configurationStatus:['synced','incomplete'].includes(variant.configurationStatus)?variant.configurationStatus:'unverified'});
  }
  if(!variants.length)continue;
  seen.add(id);
  const extra=(Array.isArray(source.images)?source.images:[]).map(safeShopImage).filter(Boolean).filter(url=>url!==source.image&&url!==primary);
  const sourceIdentity={id,productId:text(source.productId)||id,handle:text(source.handle)};
  products.push({...sourceIdentity,name,originalName:text(source.name)||name,category:source.category,description:plainDescription(source.description),image:primary,images:[...new Set([primary,...extra])].slice(0,12),options,variants});
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
