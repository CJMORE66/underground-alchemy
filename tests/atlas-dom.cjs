const {parseHTML}=require('linkedom');
const {buildSync}=require('esbuild');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const code=buildSync({entryPoints:[path.join(root,'atlas.js')],bundle:true,write:false,format:'iife'}).outputFiles[0].text;
function boot(blocked=false){
 const {window,document}=parseHTML(fs.readFileSync(path.join(root,'index.html'),'utf8')),memory={};
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(value){this.querySelectorAll('option').forEach(o=>o.toggleAttribute('selected',o.value===value));}});
 window.HTMLElement.prototype.scrollIntoView=function(){};
 for(const d of document.querySelectorAll('dialog')){d.showModal=()=>d.setAttribute('open','');d.close=()=>{d.removeAttribute('open');d.dispatchEvent(new window.Event('close'));};}
 const storage={getItem:k=>memory[k]??null,setItem(k,v){if(blocked)throw Error('blocked');memory[k]=v;},removeItem(k){if(blocked)throw Error('blocked');delete memory[k];}};
 const context={window,document,localStorage:storage,CustomEvent:window.CustomEvent,matchMedia:()=>({matches:false}),URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},fetch(){throw Error('Unexpected request');},console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'freestyle.js'),'utf8'),context);
 vm.runInNewContext(code,context);
 return {window,document,memory,$:id=>document.getElementById(id)};
}
const app=boot(),{$,window,document,memory}=app;
$('menu-toggle').click();assert.equal($('menu-toggle').getAttribute('aria-expanded'),'true');document.querySelector('#main-nav a').click();assert.equal($('menu-toggle').getAttribute('aria-expanded'),'false');
for(let i=0;i<7;i++){$(`principle-tab-${i}`).click();assert.equal(document.querySelector('[data-principle][aria-selected=true]').dataset.principle,String(i));const before=$('principle-drawing').innerHTML;$('principle-control').value='80';$('principle-control').dispatchEvent(new window.Event('input'));assert.notEqual($('principle-drawing').innerHTML,before);$('mark-study').click();}
assert.equal($('learning-progress').textContent,'7 / 7 reflections explored');assert.equal(JSON.parse(memory['caisik-atlas-studies-v1']).length,7);assert.equal(document.querySelectorAll('.connection-tag').length,7);
$('journal').value='<img src=x onerror=alert(1)> private test note';$('journal').dispatchEvent(new window.Event('input'));assert.equal(memory['caisik-atlas-journal-v1'],undefined);$('save-journal').click();assert.equal(JSON.parse(memory['caisik-atlas-journal-v1']),$('journal').value);assert.equal($('journal').querySelectorAll('img').length,0);$('clear-journal').click();assert.equal($('journal').value,'');assert.equal(memory['caisik-atlas-journal-v1'],undefined);
$('challenge-type').value='sketch';$('challenge-type').dispatchEvent(new window.Event('change'));const selectedPrompt=$('ug-prompt').textContent;const exercise=selectedPrompt.slice(selectedPrompt.indexOf('. ')+2);$('ug-shuffle').click();assert.equal($('challenge-type').value,'sketch');assert.notEqual($('ug-prompt').textContent,selectedPrompt);assert($('ug-prompt').textContent.includes(exercise),'shuffle must retain the chosen format exercise');
window.dispatchEvent(new window.CustomEvent('caisik-challenge',{detail:{location:'Flamel',prompt:'Four bars about generosity.'}}));assert.equal($('ug-prompt').textContent,'Four bars about generosity.');$('use-in-notebook').click();assert.match($('journal').value,/generosity/);assert.equal(memory['caisik-atlas-journal-v1'],undefined);
assert.equal(document.querySelectorAll('[data-art]').length,8);document.querySelector('[data-art="1"]').click();assert($('art-dialog').hasAttribute('open'));assert($('art-detail').textContent.includes('TRANSMUTE'));$('art-close').click();assert(!$('art-dialog').hasAttribute('open'));
let resets=0;window.addEventListener('caisik-clear-discoveries',e=>{resets++;e.detail.persistent=false;});$('clear-saved').click();assert.equal(resets,1);assert.match($('clear-saved').textContent,/storage unavailable/i);assert.equal($('learning-progress').textContent,'0 / 7 reflections explored');
const blocked=boot(true);blocked.$('mark-study').click();assert.match(blocked.$('study-status').textContent,/THIS VISIT ONLY/);blocked.$('reset-learning').click();assert.match(blocked.$('study-status').textContent,/STORAGE UNAVAILABLE/);
console.log('PASS: atlas DOM navigation, all seven moving studies, progress, private notebook, safe text, challenge formats, gallery and honest storage/reset failures.');
