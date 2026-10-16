import type {AdminState,MarketCommand} from '../shared/protocol.js';
export function createTickerSpeed(root:HTMLElement,submit:(command:MarketCommand)=>Promise<unknown>){
  root.innerHTML='<label>Laufliste: Tempo <input type="range" min="1" max="4" step="0.05" value="2" aria-label="Lauflistengeschwindigkeit" data-testid="ticker-speed"><output data-testid="ticker-speed-value">3 s / Block</output></label><p class="error-text" role="alert"></p>';
  const label=(value:number)=>`${(value/1000).toLocaleString('de-DE',{maximumFractionDigits:2})} s / Block`;
  const slider=root.querySelector('input')!,output=root.querySelector('output')!,error=root.querySelector('p')!;let pending=false,desired:number|null=null,epoch=0;
  async function flush(){if(pending||desired===null)return;const value=desired,generation=epoch;pending=true;try{await submit({type:'ticker-speed',rowMs:value});error.textContent='';}catch(reason){if(generation===epoch){error.textContent=(reason as Error).message;if(desired===value)desired=null;}}finally{if(generation===epoch){pending=false;if(desired===value)desired=null;if(desired!==null)void flush();}}}
  slider.oninput=()=>{desired=Math.round((5-Number(slider.value))*1000/50)*50;output.textContent=label(desired);void flush();};
  return{update(state:AdminState,connected:boolean){const value=desired??state.parameters.tickerRowMs;slider.value=String(5-Math.max(1000,Math.min(4000,value))/1000);output.textContent=label(value);slider.disabled=!connected;},reset(){desired=null;pending=false;epoch++;error.textContent='';}};
}
