/** Validate the actual static publish tree; this project has no framework build. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync,readdirSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {normalizeShopCatalog,safeShopImage} from '../dist/shop/shop.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const hosting=JSON.parse(read('.openai/hosting.json'));
assert.equal(hosting.project_id,'appgprj_6ad19e715dcc819185592c61456c5182');
assert.equal(hosting.static.directory,'dist');
const raw=JSON.parse(read('dist/shop/catalog.json'));
const catalog=normalizeShopCatalog(raw);
assert.equal(catalog.products.length,raw.products.length,'No imported product may silently disappear from the UI');
assert.equal(catalog.products.reduce((n,p)=>n+p.variants.length,0),raw.products.reduce((n,p)=>n+p.variants.length,0),'No imported variant may silently disappear from the UI');
assert.equal(catalog.checkoutEnabled,false,'Checkout needs the actual authenticated backend');
let images=0;
for(const product of catalog.products){
 for(const image of product.images){
  assert(safeShopImage(image));
  if(image.startsWith('/'))assert(statSync(resolve(root,'dist'+image)).size>0);
  images++;
 }
}
const syntaxFiles=[];
function scan(dir){for(const entry of readdirSync(resolve(root,dir),{withFileTypes:true})){
 const path=dir+'/'+entry.name;
 if(entry.isDirectory())scan(path);
 else if(extname(path)==='.js'||extname(path)==='.mjs')syntaxFiles.push(path);
}}
scan('dist/shop');scan('server/commerce');
for(const path of syntaxFiles)execFileSync(process.execPath,['--check',resolve(root,path)],{stdio:'pipe'});
for(const file of ['AUDIT','ARCHITECTURE','SETUP','TEST_RESULTS','DEPLOYMENT','PROGRESS'])assert(existsSync(resolve(root,`docs/PRINTFUL_${file}.md`)));
// A deliberately bounded check for common accidentally embedded credential formats.
// This is not a claim that all possible secrets or Git history have been scanned.
const secretPattern=/(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
function publicScan(dir){for(const entry of readdirSync(resolve(root,dir),{withFileTypes:true})){
 const path=dir+'/'+entry.name;
 if(entry.name.startsWith('.'))continue;
 if(entry.isDirectory())publicScan(path);
 else if(/\.(?:json|html|js|mjs|css|txt)$/.test(path)&&statSync(resolve(root,path)).size<2*1024*1024)assert(!secretPattern.test(read(path)),`Potential secret in public file ${path}`);
}}
publicScan('dist');
console.log(`PASS static publish validation: ${catalog.products.length} products, ${catalog.products.reduce((n,p)=>n+p.variants.length,0)} variants, ${images} image references; ${syntaxFiles.length} JS syntax checks; checkout disabled; bounded public secret scan.`);
console.log('This validates static artifacts. It does not verify live prices, API credentials, payments or fulfillment.');
