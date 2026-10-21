const {parseHTML}=require('linkedom'),vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
function boot(permission){
 const {window,document}=parseHTML(fs.readFileSync(path.join(root,'index.html'),'utf8'));let stopped=0,created=0,revoked=0;
 const stream={getTracks:()=>[{stop(){stopped++;}}]};
 class Recorder{constructor(){this.state='inactive';this.mimeType='audio/webm';}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['test'])});this.onstop?.();}}
 window.MediaRecorder=Recorder;document.getElementById('ug-audio').load=()=>{};
 vm.runInNewContext(fs.readFileSync(path.join(root,'freestyle.js'),'utf8'),{window,document,navigator:{mediaDevices:{getUserMedia:()=>permission?permission(stream):Promise.resolve(stream)}},MediaRecorder:Recorder,Blob,URL:{createObjectURL(){created++;return 'blob:local';},revokeObjectURL(){revoked++;}},setInterval:()=>1,clearInterval(){},Date,Math,console});
 return {$:id=>document.getElementById(id),window,counts:()=>({stopped,created,revoked})};
}
(async()=>{
 let resolve;const pending=boot(()=>new Promise(r=>resolve=r));const request=pending.$('ug-record').onclick();pending.window.dispatchEvent(new pending.window.Event('pagehide'));resolve({getTracks:()=>[{stop(){pending.cancelled=true;}}]});await request;assert.equal(pending.$('ug-stop').disabled,true);assert.equal(pending.cancelled,true,'a late permission result must release the microphone after leaving the page');assert.equal(pending.counts().created,0);
 const denied=boot(()=>Promise.reject(Error('denied')));await denied.$('ug-record').onclick();assert.equal(denied.$('ug-record').disabled,false);assert.match(denied.$('ug-status').textContent,/permission|unavailable/i);
 const ok=boot();await ok.$('ug-record').onclick();assert.equal(ok.$('ug-stop').disabled,false);ok.$('ug-stop').onclick();assert.equal(ok.counts().stopped,1);assert.equal(ok.counts().created,1);assert.equal(ok.$('ug-playback').hidden,false);ok.$('ug-clear').onclick();assert.equal(ok.$('ug-playback').hidden,true);assert.equal(ok.counts().revoked,1);
 console.log('PASS: recorder permission rejection, late permission cancellation, stop/track release, local playback, deletion and object URL cleanup. Simulated audio, no hardware claim.');
})().catch(e=>{console.error(e);process.exitCode=1;});
