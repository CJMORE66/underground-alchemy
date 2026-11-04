/* Device-local selections only. Never an order, checkout quote or payment record. */
export const CART_KEY='caisik-shop-cart-v1';
const MAX_LINES=50,MAX_QUANTITY=99,MAX_STORAGE_BYTES=20000;
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(value);
const quantity=value=>Number.isInteger(value)&&value>=1&&value<=MAX_QUANTITY;
export function parseCart(raw){
 if(raw===null||raw===undefined||raw==='')return {version:1,lines:[]};
 if(typeof raw!=='string'||raw.length>MAX_STORAGE_BYTES)throw new Error('Invalid cart');
 const value=JSON.parse(raw);
 if(!value||value.version!==1||!Array.isArray(value.lines)||value.lines.length>MAX_LINES)throw new Error('Invalid cart');
 const seen=new Set(),lines=value.lines.map(line=>{
  if(!line||!validId(line.productId)||!validId(line.variantId)||!quantity(line.quantity))throw new Error('Invalid cart');
  const id=line.productId+'\0'+line.variantId;if(seen.has(id))throw new Error('Invalid cart');seen.add(id);
  return {productId:line.productId,variantId:line.variantId,quantity:line.quantity};
 });
 return {version:1,lines};
}
export function cartView(lines,catalogue){
 const result=lines.map(line=>{const product=catalogue?.products?.find(item=>item.id===line.productId),variant=product?.variants.find(item=>item.id===line.variantId);return {...line,product:product||null,variant:variant||null};});
 // Historical prices are estimates only; totals remain separated by currency.
 const totals=new Map();let incomplete=false;
 for(const line of result){
  const price=line.variant?.sourcePrice;
  if(!price||!Number.isFinite(price.amount)||price.amount<0||price.amount>1000000||!/^[A-Z]{3}$/.test(price.currency)){incomplete=true;continue;}
  let digits;try{digits=new Intl.NumberFormat('en',{style:'currency',currency:price.currency}).resolvedOptions().maximumFractionDigits;}catch{incomplete=true;continue;}
  const scale=10**digits,minor=Math.round(price.amount*scale);
  if(Math.abs(price.amount*scale-minor)>1e-6){incomplete=true;continue;}
  const previous=totals.get(price.currency)||0;
  if(!Number.isSafeInteger(previous+minor*line.quantity)){incomplete=true;continue;}
  totals.set(price.currency,previous+minor*line.quantity);
 }
 return {lines:result,count:lines.reduce((sum,line)=>sum+line.quantity,0),totals:[...totals].map(([currency,minor])=>({currency,minor,digits:new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits})),incomplete,checkoutEnabled:false};
}
// localStorage has no atomic compare-and-swap: simultaneous writes are last-writer-wins.
// Re-reading before a write merges sequential tab edits; this is not transactional order storage.
export function createCart({storage,eventTarget,onChange=()=>{}}={}){
 let state={version:1,lines:[]},persistent=!!storage,error=null,dirty=false,destroyed=false;
 const copy=()=>({version:1,lines:state.lines.map(line=>({...line})),persistent,error});
 function read(){try{state=parseCart(storage?.getItem(CART_KEY));persistent=!!storage;error=null;}catch{persistent=false;error='corrupt';}}
 read();
 const emit=()=>{if(!destroyed)onChange(copy());};
 function mutate(fn){
  if(destroyed)return false;
  // Re-read before mutations to merge sequential edits made in other tabs.
  if(storage&&!dirty){try{state=parseCart(storage.getItem(CART_KEY));}catch{persistent=false;error='corrupt';}}
  const next=state.lines.map(line=>({...line}));if(fn(next)===false)return false;
  state={version:1,lines:next};dirty=true;
  try{if(!storage)throw new Error('Storage unavailable');storage.setItem(CART_KEY,JSON.stringify(state));persistent=true;error=null;dirty=false;}
  catch{persistent=false;error='storage';}
  emit();return true;
 }
 const handler=event=>{
  if(destroyed||dirty||(event.key!==CART_KEY&&event.key!==null)||(event.storageArea&&event.storageArea!==storage))return;
  try{state=parseCart(event.newValue);persistent=!!storage;error=null;emit();}catch{persistent=false;error='corrupt';emit();}
 };
 eventTarget?.addEventListener?.('storage',handler);
 return {
  getState:copy,
  add(productId,variantId,amount=1){if(!validId(productId)||!validId(variantId)||!quantity(amount))return false;return mutate(lines=>{const found=lines.find(line=>line.productId===productId&&line.variantId===variantId);if(found){if(found.quantity+amount>MAX_QUANTITY)return false;found.quantity+=amount;}else{if(lines.length>=MAX_LINES)return false;lines.push({productId,variantId,quantity:amount});}});},
  setQuantity(productId,variantId,amount){if(!quantity(amount))return false;return mutate(lines=>{const found=lines.find(line=>line.productId===productId&&line.variantId===variantId);if(!found)return false;found.quantity=amount;});},
  remove(productId,variantId){return mutate(lines=>{const index=lines.findIndex(line=>line.productId===productId&&line.variantId===variantId);if(index<0)return false;lines.splice(index,1);});},
  destroy(){destroyed=true;eventTarget?.removeEventListener?.('storage',handler);}
 };
}
