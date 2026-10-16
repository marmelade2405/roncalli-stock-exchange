import type {AdminState,MarketCommand} from '../shared/protocol.js';
import {formatEuro} from '../shared/format.js';
import {volatilityBasisCents,volatilityPercent} from '../../domain/prices.js';

export function createMarketVolatility(root:HTMLElement,submit:(command:MarketCommand)=>Promise<unknown>){
  root.innerHTML='<div class="market-volatility-heading"><label for="market-volatility-slider">Marktvolatilität · % des Average</label><output data-testid="market-volatility-value" class="mono up">25 %</output><strong data-testid="market-volatility-summary" id="market-volatility-summary" class="mono"></strong></div><div class="market-volatility-track"><span class="muted">0 %</span><input id="market-volatility-slider" type="range" min="0" max="75" step="1" value="25" aria-label="Marktvolatilität" aria-describedby="market-volatility-summary market-volatility-hint" data-testid="market-volatility" title="Bei 0 % entfällt die zufällige Schwankung; die Average-Rückführung bleibt aktiv."><span class="muted">75 %</span></div><p id="market-volatility-hint" class="muted">Schwankungsbasis = wirksamer Average × Prozent / 100. Crash immer doppelt so stark · Breaking News unverändert · Wasser bleibt gratis.</p><p data-testid="market-volatility-error" class="error-text" role="alert"></p>';
  const slider=root.querySelector('input')!,output=root.querySelector('output')!,summary=root.querySelector('strong')!,error=root.querySelector<HTMLElement>('[role="alert"]')!;
  let state:AdminState|null=null,connected=false,desired:number|null=null,pending=false,epoch=0;
  function render(){
    if(!state)return;
    const percent=desired??volatilityPercent(state.parameters);
    const parameters=desired===null?state.parameters:{...state.parameters,marketVolatilityPercent:desired},legacy=parameters.marketVolatilityPercent===undefined;
    const drinks=state.config.filter(drink=>drink.fixedPriceCents===undefined&&drink.minCents!==drink.maxCents);
    const basis=drinks.length?drinks.reduce((sum,drink)=>sum+volatilityBasisCents(drink,parameters),0)/drinks.length:0;
    slider.value=String(percent);slider.disabled=!connected;output.textContent=legacy?`Altprofil ${(parameters.marketVolatility??1).toLocaleString('de-DE')}×`:`${percent.toLocaleString('de-DE',{maximumFractionDigits:2})} %`;
    summary.textContent=legacy?`Ø Basis ${formatEuro(Math.round(basis))} · Crash ${formatEuro(Math.round(basis*2))}`:`Normal ${percent.toLocaleString('de-DE')} % · Crash ${(percent*2).toLocaleString('de-DE')} % · Ø Basis ${formatEuro(Math.round(basis))}`;
    root.querySelector('#market-volatility-hint')!.textContent=legacy?'Altprofil: gespeicherte Euro-Basis × Faktor. Regler bewegen, um zur Basis als % des Average zu wechseln. Crash doppelte Basis · Breaking News unverändert.':'Schwankungsbasis = wirksamer Average × Prozent / 100. Crash immer doppelt so stark · Breaking News unverändert · Wasser bleibt gratis.';
  }
  async function flush(){
    if(pending||desired===null)return;
    const value=desired,generation=epoch;pending=true;
    try{await submit({type:'market-volatility',percent:value});if(generation===epoch)error.textContent='';}
    catch(reason){if(generation===epoch){error.textContent=(reason as Error).message;if(desired===value)desired=null;}}
    finally{if(generation===epoch){pending=false;if(desired===value)desired=null;render();if(desired!==null)void flush();}}
  }
  slider.oninput=()=>{if(!connected)return;desired=Math.round(Number(slider.value));render();void flush();};
  return{
    update(next:AdminState,online:boolean){state=next;connected=online;render();},
    reset(){epoch++;state=null;connected=false;desired=null;pending=false;error.textContent='';slider.disabled=true;}
  };
}
