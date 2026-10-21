(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  if(!$('freestyle'))return;
  const prompts=['Describe your street after midnight. Let three details become three bars.','Pick an object in the room. Tell its story, then tell yours.','Give a feeling a colour, a place and a sound. Rap the scene.','Make four lines from these words: concrete, breath, mirror, dawn.','Start with “I don’t have the answer…” and let the next line surprise you.'];
  let promptIndex=0;
  if(!$('challenge-type'))$('ug-shuffle').onclick=()=>{promptIndex=(promptIndex+1)%prompts.length;$('ug-prompt').textContent=prompts[promptIndex];};
  let recorder,stream,timer,url,started,busy=false,session=0;
  const status=text=>{$('ug-status').textContent=text;};
  const release=()=>{stream?.getTracks().forEach(track=>track.stop());stream=null;clearInterval(timer);$('ug-booth').classList.remove('is-recording');};
  const clear=()=>{if(url)URL.revokeObjectURL(url);url=null;$('ug-audio').removeAttribute('src');$('ug-audio').load();$('ug-download').removeAttribute('href');$('ug-playback').hidden=true;};
  $('ug-record').onclick=async()=>{
    if(busy||recorder?.state==='recording')return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){status('Recording is unavailable in this browser. Use your phone’s voice recorder instead.');return;}
    busy=true;$('ug-record').disabled=true;status('Waiting for microphone permission…');const requestSession=++session;
    try{
      const acquired=await navigator.mediaDevices.getUserMedia({audio:true});
      if(requestSession!==session){acquired.getTracks().forEach(track=>track.stop());return;}
      stream=acquired;recorder=new MediaRecorder(stream);let chunks=[],failed=false;
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onstop=()=>{
        release();$('ug-stop').disabled=true;$('ug-record').disabled=false;
        if(requestSession!==session||failed)return;
        const type=recorder.mimeType||chunks[0]?.type||'audio/webm',blob=new Blob(chunks,{type});clear();
        if(blob.size){url=URL.createObjectURL(blob);$('ug-audio').src=url;$('ug-download').href=url;$('ug-download').download='caisik-raw-take-'+Date.now()+(/mp4/.test(type)?'.m4a':/ogg/.test(type)?'.ogg':'.webm');$('ug-playback').hidden=false;status('Your take is ready. Listen back, keep one honest line, and download to keep the audio.');}
        else status('No audio was captured. Try again.');
      };
      recorder.onerror=()=>{failed=true;release();status('Recording failed. Try again or use your phone recorder.');$('ug-record').disabled=false;$('ug-stop').disabled=true;};
      recorder.start();started=Date.now();$('ug-time').textContent='00:00';$('ug-stop').disabled=false;$('ug-booth').classList.add('is-recording');status('Recording your microphone. Keep going — silence and imperfect lines belong here too.');
      timer=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000);$('ug-time').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');if(seconds>=300)$('ug-stop').click();},250);
    }catch{release();$('ug-stop').disabled=true;status('Microphone unavailable or permission declined. Check browser permissions or use your phone recorder.');}
    finally{busy=false;$('ug-record').disabled=recorder?.state==='recording';}
  };
  $('ug-stop').onclick=()=>{if(recorder?.state==='recording'){recorder.stop();$('ug-stop').disabled=true;release();}};
  $('ug-clear').onclick=()=>{clear();status('Take deleted from this tab. Ready when you are.');};
  window.addEventListener('pagehide',()=>{session++;if(recorder?.state==='recording')recorder.stop();release();clear();$('ug-stop').disabled=true;});
})();
