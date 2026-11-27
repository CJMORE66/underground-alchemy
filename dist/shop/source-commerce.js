/* Source prices and identities are historical evidence, never a checkout quote. */
export function sourcePrice(value){
 if(!value||typeof value.amount!=='number'||!Number.isFinite(value.amount)||value.amount<0||typeof value.currency!=='string'||!/^[A-Z]{3}$/.test(value.currency)||typeof value.checkedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value.checkedAt)||!Number.isFinite(Date.parse(value.checkedAt)))return null;
 return {amount:value.amount,currency:value.currency,taxInclusive:typeof value.taxInclusive==='boolean'?value.taxInclusive:null,checkedAt:value.checkedAt};
}
