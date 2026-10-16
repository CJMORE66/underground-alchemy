const {parseHTML}=require('linkedom');
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'../dist')+'/';
const pause=()=>new Promise(resolve=>setImmediate(resolve));
async function boot(){
 const {window}=parseHTML('<!doctype html><html><body><section id="learn"></section></body></html>');
 const document=window.document,memory={};
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){const options=[...this.querySelectorAll('option')];return(options.find(o=>o.hasAttribute('selected'))||options[0])?.getAttribute('value')||''},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.getAttribute('value')===value)}});
 window.matchMedia=()=>({matches:false});window.HTMLElement.prototype.scrollIntoView=function(){};
 const context={window,document,MutationObserver:window.MutationObserver,localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v},console};
 vm.createContext(context);
 for(const file of ['learn.js','education-v7.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),context);
 await pause();return{document,window,memory,context};
}
(async()=>{
 const {document:d,window:w,memory,context}=await boot();
 const host=d.querySelector('#learn');
 assert.equal(d.querySelectorAll('.edu-v7-reflection').length,1);
 assert.equal(d.querySelectorAll('.edu-v7-graph').length,0);
 assert(d.querySelector('.edu-v7-reflection-copy').textContent.includes('nedokončený projekt'));
 const note=d.querySelector('#edu-v7-note');note.value='Můj soukromý nápad';note.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert(d.querySelector('.edu-v7-note-count').textContent.startsWith('Můj soukromý nápad'.length+' / 1200'));
 d.querySelector('[data-language="en"]').click();await pause();
 assert.equal(d.querySelector('#edu-v7-note').value,'Můj soukromý nápad');
 assert(d.querySelector('.edu-v7-reflection-copy').textContent.includes('unfinished project'));
 const seen=new Set();
 for(let i=0;i<7;i++){
  d.querySelector(`[data-lesson="${i}"]`).click();await pause();
  assert.equal(d.querySelectorAll('.edu-v7-reflection').length,1);
  assert.equal(d.querySelectorAll('.edu-v7-graph').length,i===5?1:0);
  seen.add(d.querySelector('.edu-v7-reflection-copy>p').textContent);
 }
 assert.equal(seen.size,7);
 d.querySelector('[data-lesson="0"]').click();await pause();assert.equal(d.querySelector('#edu-v7-note').value,'Můj soukromý nápad');
 d.querySelector('[data-edu-v7-clear]').click();assert.equal(d.querySelector('#edu-v7-note').value,'');
 let states=0;
 for(const language of ['cs','en']){
  d.querySelector(`[data-language="${language}"]`).click();d.querySelector('[data-lesson="5"]').click();await pause();
  for(const fabric of [false,true])for(const placement of [false,true])for(const inspection of ['pending','revise','accept']){
   for(const [id,value] of [['fabric',fabric],['placement',placement],['inspection',inspection]]){
    const control=d.querySelector('#edu-v7-'+id);if(id==='inspection')control.value=value;else control.checked=value;
    control.dispatchEvent(new w.Event('change',{bubbles:true}));
   }
   const status=d.querySelector('.edu-v7-workflow-status').textContent;
   assert.equal(d.querySelectorAll('.edu-v7-diagram svg').length,1);
   assert.equal(d.querySelectorAll('.edu-v7-diagram .edu-v7-node').length,6);
   assert(d.querySelector('#edu-v7-svg-title').textContent.length>10);
   if(!fabric||!placement)assert(!status.includes('This completes')&&!status.includes('To je dokončená'));
   if(fabric&&placement&&inspection==='accept')assert(status.includes(language==='en'?'does not establish the quality':'nikoli důkaz kvality'));
   if(fabric&&placement&&inspection==='revise')assert(status.includes(language==='en'?'revision branch':'větve úprav'));
   states++;
  }
 }
 const note5=d.querySelector('#edu-v7-note');note5.value='Temporary';note5.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert(!JSON.stringify(memory).includes('Temporary'));
 d.dispatchEvent(new w.Event('caisik-learning-reset'));await pause();
 assert.equal(d.querySelector('#edu-v7-note').value,'');assert.equal(d.querySelectorAll('.edu-v7-reflection').length,1);
 d.querySelector('[data-lesson="5"]').click();await pause();assert.equal(d.querySelector('#edu-v7-note').value,'');
 vm.runInContext(fs.readFileSync(root+'education-v7.js','utf8'),context);await pause();assert.equal(d.querySelectorAll('.edu-v7-reflection').length,1);
 const second=await boot();assert.equal(second.document.querySelector('#edu-v7-note').value,'');
 console.log(JSON.stringify({pass:true,DOM:true,reflections:7,languages:2,workflowStates:states,remounts:'unique',noteSwitching:'retained',notesInPersistentStorage:false,privacyReset:'clears',newPage:'empty',duplicateScript:'guarded'}));
})().catch(error=>{console.error(error);process.exitCode=1});
