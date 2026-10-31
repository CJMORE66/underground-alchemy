/* Source prices and identities are historical evidence, never a checkout quote. */
export function sourcePrice(value){
 if(!value||typeof value.amount!=='number'||!Number.isFinite(value.amount)||value.amount<0||typeof value.currency!=='string'||!/^[A-Z]{3}$/.test(value.currency)||typeof value.checkedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value.checkedAt)||!Number.isFinite(Date.parse(value.checkedAt)))return null;
 return {amount:value.amount,currency:value.currency,taxInclusive:typeof value.taxInclusive==='boolean'?value.taxInclusive:null,checkedAt:value.checkedAt};
}
export function sourceProductURL(product){
 if(!/^prod_[A-Za-z0-9]+$/.test(product?.productId||product?.id||'')||!/^printful-18912189-[0-9]+$/.test(product?.handle||''))return null;
 const expected='https://hiphop.caisik.i234.me/dk/products/'+product.handle;
 return product.sourceUrl===expected?expected:null;
}
export function originalVariantURL(product,variant){
 const base=sourceProductURL(product);
 if(!base||!/^variant_[A-Za-z0-9]+$/.test(variant?.id||'')||product.variants?.filter(item=>item.id===variant.id&&item.sku===variant.sku).length!==1)return null;
 const url=new URL(base);url.searchParams.set('v_id',variant.id);return url.href;
}
