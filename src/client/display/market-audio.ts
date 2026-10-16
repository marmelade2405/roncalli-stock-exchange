export function createMarketAudio(button:HTMLButtonElement,slider:HTMLInputElement,controls:HTMLElement){
  let context:AudioContext|null=null,wanted=true,volume=.25;
  const news=createOriginalClip('/media/breaking-news-intro.m4a'),crash=createOriginalClip('/media/crash-intro.m4a');
  try{wanted=localStorage.getItem('market-sounds')!=='off';const stored=localStorage.getItem('market-sound-volume');if(stored!==null&&Number.isFinite(Number(stored)))volume=Math.max(0,Math.min(1,Number(stored)));}catch{}
  const active=()=>wanted&&context?.state==='running';
  function render(){button.textContent=active()?'🔊 Ton an':'🔇 Ton aktivieren';button.setAttribute('aria-pressed',String(active()));button.setAttribute('aria-label',active()?'Ton ausschalten':'Ton aktivieren');controls.hidden=false;slider.value=String(Math.round(volume*100));}
  function save(){try{localStorage.setItem('market-sounds',wanted?'on':'off');localStorage.setItem('market-sound-volume',String(volume));}catch{}}
  function stop(){news.suppress();crash.suppress();}
  function pause(){news.pause();crash.pause();}
  function createOriginalClip(url:string){
    let buffer:AudioBuffer|null=null,loading:Promise<void>|null=null;
    let source:AudioBufferSourceNode|null=null,gain:GainNode|null=null;
    let currentKey:string|null=null,suppressed=false,completed=false;
    function stopClip(){
      const oldSource=source,oldGain=gain;source=null;gain=null;
      if(oldSource){oldSource.onended=null;try{oldSource.stop();}catch{}oldSource.disconnect();}
      oldGain?.disconnect();
    }
    function suppress(){suppressed=true;stopClip();}
    function prepare(){
      if(buffer||loading||!context)return;
      const decoder=context;
      loading=(async()=>{
        const response=await fetch(url);
        if(!response.ok)throw new Error('Intro audio unavailable');
        buffer=await decoder.decodeAudioData(await response.arrayBuffer());
      })().catch(()=>{}).finally(()=>{loading=null;});
    }
    function sync(key:string|null,elapsedMs:number,introMs:number,allowed:boolean){
      if(key!==currentKey){stopClip();currentKey=key;completed=false;suppressed=!active()||volume===0;}
      if(!key){stopClip();return;}
      // Muted events remain consumed when sound is enabled again.
      if(!wanted)suppressed=true;
      if(!Number.isFinite(elapsedMs)||!Number.isFinite(introMs)||introMs<=0||elapsedMs>=introMs){
        stopClip();completed=true;return;
      }
      if(!allowed||!active()||volume===0||suppressed||completed){stopClip();return;}
      if(source||!buffer||!context)return;
      const nextSource=context.createBufferSource(),nextGain=context.createGain();
      nextSource.buffer=buffer;
      // Fit the complete recording to this intro and resume at market time.
      nextSource.playbackRate.value=buffer.duration/(introMs/1000);
      nextGain.gain.setValueAtTime(volume,context.currentTime);
      nextSource.connect(nextGain);nextGain.connect(context.destination);source=nextSource;gain=nextGain;
      nextSource.onended=()=>{
        if(source!==nextSource)return;
        completed=true;source=null;gain=null;nextSource.disconnect();nextGain.disconnect();
      };
      try{nextSource.start(0,Math.max(0,elapsedMs)/introMs*buffer.duration);}
      catch{stopClip();completed=true;}
    }
    function setVolume(){if(volume===0)stopClip();else if(gain&&context)gain.gain.setValueAtTime(volume,context.currentTime);}
    return{prepare,sync,suppress,setVolume,pause:stopClip};
  }
  function activate(){
    button.disabled=true;wanted=true;
    try{context??=new AudioContext();context.onstatechange=()=>{if(context?.state!=='running')stop();render();};news.prepare();crash.prepare();void context.resume().then(()=>{save();render();}).catch(()=>{wanted=false;stop();button.textContent='Ton nicht verfügbar';button.setAttribute('aria-pressed','false');controls.hidden=false;}).finally(()=>{button.disabled=false;});}
    catch{wanted=false;button.disabled=false;button.textContent='Ton nicht verfügbar';button.setAttribute('aria-pressed','false');controls.hidden=false;}
  }
  button.onclick=()=>{if(active()){wanted=false;stop();save();render();return;}activate();};
  slider.oninput=()=>{volume=Math.max(0,Math.min(1,Number(slider.value)/100));news.setVolume();crash.setVolume();save();};
  render();return{active,stop,pause,unlockDefault(){if(wanted&&!active()&&!button.disabled)activate();},syncNews:news.sync,syncCrash:crash.sync};
}
