import type {AdminState,MarketCommand,Snapshot} from '../shared/protocol.js';
export function createSimulationPanel(root:HTMLElement,submit:(command:MarketCommand)=>Promise<unknown>){
  root.innerHTML='<div class="simulation-controls"><label><input type="checkbox" data-testid="simulation-enabled"> Generalprobe / Simulation</label><label class="simulation-speed-control">Tempo <input type="range" min="1" max="120" step="1" value="60" aria-label="Simulationsgeschwindigkeit" data-testid="simulation-speed"><output data-testid="simulation-speed-value">60×</output></label><button data-testid="simulation-pause">Pause</button><button data-testid="simulation-step">Zum nächsten Ereignis</button></div><p data-testid="simulation-state" class="muted"></p><p class="muted">Tempo jederzeit ändern, auch bei Pause oder Crash. Einblendungen bleiben bei 1×. Nach der Generalprobe „Abend neu starten“.</p>';
  const enabled=root.querySelector<HTMLInputElement>('[data-testid="simulation-enabled"]')!,speed=root.querySelector<HTMLInputElement>('[data-testid="simulation-speed"]')!,output=root.querySelector('output')!,pause=root.querySelector<HTMLButtonElement>('[data-testid="simulation-pause"]')!,step=root.querySelector<HTMLButtonElement>('[data-testid="simulation-step"]')!;
  let snapshot:Snapshot<AdminState>|null=null,desired:number|null=null,pending=false,epoch=0;
  const command=(value:MarketCommand)=>{void submit(value).catch(()=>{});};
  enabled.onchange=()=>command({type:'simulation',enabled:enabled.checked,speed:Number(speed.value)});
  async function flush(){
    if(pending||desired===null)return;
    const value=desired,activeEpoch=epoch;pending=true;
    try{await submit({type:'simulation',enabled:true,speed:value});}
    catch{if(epoch===activeEpoch&&desired===value)desired=null;}
    finally{
      if(epoch===activeEpoch){pending=false;if(desired===value)desired=null;if(desired!==null)void flush();}
    }
  }
  speed.oninput=()=>{desired=Number(speed.value);output.textContent=`${desired}×`;void flush();};
  pause.onclick=()=>command({type:'pause',paused:!snapshot!.clock.paused});step.onclick=()=>command({type:'step'});
  return{
    update(next:Snapshot<AdminState>,connected:boolean){
      snapshot=next;const c=next.clock,s=next.state;
      enabled.checked=c.mode==='simulation';enabled.disabled=!connected||s.phase!=='ready';
      const value=desired??(c.mode==='simulation'?c.speed:60);speed.value=String(value);output.textContent=`${value}×`;speed.disabled=!connected||c.mode!=='simulation';
      pause.disabled=!connected||c.mode!=='simulation'||s.phase==='ready';pause.textContent=c.paused?'Fortsetzen':'Pause';step.disabled=!connected||c.mode!=='simulation'||s.phase==='ready'||s.phase==='transition';
      root.querySelector('[data-testid="simulation-state"]')!.textContent=c.mode==='simulation'?`SIMULATION · ${c.paused?'pausiert':`aktuell ${c.rate}×`} · gewähltes Tempo ${c.speed}×`:'Livebetrieb · Echtzeit 1×';
    },
    reset(){snapshot=null;desired=null;pending=false;epoch++;},
  };
}
