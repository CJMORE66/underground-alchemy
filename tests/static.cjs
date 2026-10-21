const {parseHTML}=require('linkedom');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist');let documents=0;
const homepage=parseHTML(fs.readFileSync(path.join(dist,'index.html'),'utf8')).document;
for(const file of [path.join(dist,'index.html'),...fs.readdirSync(path.join(dist,'q')).map(x=>path.join(dist,'q',x,'index.html')),...fs.readdirSync(path.join(dist,'collections')).map(x=>path.join(dist,'collections',x,'index.html')),path.join(dist,'implementation.html')]){
 const {document}=parseHTML(fs.readFileSync(file,'utf8'));const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,`duplicate IDs ${file}`);
 for(const el of document.querySelectorAll('[src],[href]')){const value=el.getAttribute('src')||el.getAttribute('href');if(!value)continue;if(value.startsWith('#')&&value.length>1)assert(document.getElementById(value.slice(1)),`fragment ${value}`);if(value.startsWith('/')&&!value.startsWith('//')){const local=path.join(dist,value.split(/[?#]/)[0]);assert(fs.existsSync(local),`missing ${value}`);}}
 for(const link of document.querySelectorAll('a[href^="/#"]'))assert(homepage.getElementById(link.getAttribute('href').slice(2)),`missing homepage destination ${link.getAttribute('href')}`);
 for(const img of document.querySelectorAll('img'))assert(img.hasAttribute('alt'),'missing alt');
 for(const block of document.querySelectorAll('script[type="application/json"],script[type="application/ld+json"]'))JSON.parse(block.textContent);
 documents++;
}
const data=JSON.parse(fs.readFileSync(path.join(dist,'catalog.json')));assert.equal(data.products.length,20);assert.equal(data.products.flatMap(p=>p.variants).length,86);assert(data.products.every(p=>p.productId&&p.variants.every(v=>v.id&&v.sku&&typeof v.calculatedAmount==='number')));
console.log(`PASS: ${documents} HTML documents, unique IDs, local assets, fragments, ALT, embedded JSON and20products/86completevariants.`);
