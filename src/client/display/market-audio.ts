import type {SoundCue} from './sound-events.js';
export function createMarketAudio(button:HTMLButtonElement,slider:HTMLInputElement,controls:HTMLElement){
  let context:AudioContext|null=null,wanted=false,volume=.25;const nodes=new Set<OscillatorNode>();
  try{wanted=localStorage.getItem('market-sounds')==='on';const stored=localStorage.getItem('market-sound-volume');if(stored!==null&&Number.isFinite(Number(stored)))volume=Math.max(0,Math.min(1,Number(stored)));}catch{}
  const active=()=>wanted&&context?.state==='running';
  function render(){button.textContent=active()?'🔊 Ton an':'🔇 Ton aktivieren';button.setAttribute('aria-pressed',String(active()));button.setAttribute('aria-label',active()?'Ton ausschalten':'Ton aktivieren');controls.hidden=!wanted;slider.value=String(Math.round(volume*100));}
  function save(){try{localStorage.setItem('market-sounds',wanted?'on':'off');localStorage.setItem('market-sound-volume',String(volume));}catch{}}
  function stop(){for(const node of nodes){try{node.stop();}catch{}}nodes.clear();}
  function tone(frequency:number,delay:number,duration:number,type:OscillatorType='sine',end=frequency){
    if(!active()||!context||volume===0)return;const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,at);oscillator.frequency.exponentialRampToValueAtTime(end,at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,.07*volume),at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    oscillator.connect(gain);gain.connect(context.destination);nodes.add(oscillator);oscillator.onended=()=>{nodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(at);oscillator.stop(at+duration+.02);
  }
  function play(cue:SoundCue){
    if(!active())return;
    if(cue==='quote-pop'){tone(1050,0,.055);return;}
    if(cue==='crash-intro'){tone(420,0,.9,'triangle',70);tone(140,.1,.65);return;}
    if(cue==='special-intro'){for(const[i,f]of[520,780,1040,1560].entries())tone(f,i*.11,.24,'triangle');return;}
    if(cue==='normal-intro'){tone(720,0,.1);tone(960,.13,.15);return;}
    if(cue==='recovery-intro'){for(const[i,f]of[330,440,660].entries())tone(f,i*.12,.3);return;}
    if(cue==='crash-published'){tone(165,0,.45,'triangle');tone(220,.08,.4);return;}
    for(const[i,f]of[880,1108,1320].entries())tone(f,i*.05,.45);
  }
  button.onclick=()=>{
    if(active()){wanted=false;stop();save();render();return;}
    button.disabled=true;wanted=true;
    try{context??=new AudioContext();context.onstatechange=render;void context.resume().then(()=>{save();render();play('normal-published');}).catch(()=>{wanted=false;button.textContent='Ton nicht verfügbar';button.setAttribute('aria-pressed','false');controls.hidden=true;}).finally(()=>{button.disabled=false;});}
    catch{wanted=false;button.disabled=false;button.textContent='Ton nicht verfügbar';button.setAttribute('aria-pressed','false');controls.hidden=true;}
  };
  slider.oninput=()=>{volume=Math.max(0,Math.min(1,Number(slider.value)/100));stop();save();};
  render();return{active,play,stop};
}
