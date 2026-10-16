import type {AdminState,MarketCommand} from '../shared/protocol.js';
import {formatEuro} from '../shared/format.js';
import {averageTargetCents} from '../../domain/prices.js';

export function createMarketReversion(root:HTMLElement,submit:(command:MarketCommand)=>Promise<unknown>){
  root.classList.add('market-reversion-control');
  root.innerHTML='<div class="market-reversion-heading"><label for="market-reversion-slider">Rückführung zum Average</label><output data-testid="market-reversion-value" class="mono up" for="market-reversion-slider">50 %</output><strong data-testid="market-reversion-summary" id="market-reversion-summary" class="mono"></strong></div><div class="market-reversion-track"><span class="muted">0 %</span><input id="market-reversion-slider" type="range" min="0" max="100" step="1" value="50" disabled aria-label="Rückführung zum Average" aria-describedby="market-reversion-summary market-reversion-hint" data-testid="market-reversion"><span class="muted">100 %</span></div><p id="market-reversion-hint" data-testid="market-reversion-hint" class="market-reversion-hint muted"></p><p data-testid="market-reversion-error" class="market-reversion-error error-text" role="alert"></p>';
  const slider=root.querySelector('input')!,output=root.querySelector('output')!,summary=root.querySelector('strong')!,error=root.querySelector<HTMLElement>('[role="alert"]')!;
  let state:AdminState|null=null,connected=false,desired:number|null=null,pending=false,epoch=0;
  function render(){
    if(!state)return;
    const example=state.config.find(drink=>drink.id==='bier'&&drink.fixedPriceCents===undefined)??state.config.find(drink=>drink.fixedPriceCents===undefined&&drink.minCents!==drink.maxCents);
    const percent=desired??state.parameters.marketReversionPercent??example?.reversionPercent??50;
    slider.value=String(percent);slider.disabled=!connected;output.className='mono '+(percent===0?'down':'up');output.textContent=`${percent} %`;
    if(example){const target=averageTargetCents(example,state.parameters.marketAveragePercent??0),centre=(price:number)=>formatEuro(Math.round(price+(target-price)*percent/100));summary.textContent=`Referenzbeispiel: ${example.name} (vor Zufall)\nMin: ${formatEuro(example.minCents)} → ${centre(example.minCents)}\nMax: ${formatEuro(example.maxCents)} → ${centre(example.maxCents)}`;}
    else summary.textContent='Kein Referenzgetränk verfügbar';
    root.querySelector('#market-reversion-hint')!.textContent=percent===0?'0 %: keine Rückführung. Die Kurse bewegen sich ohne Bindung zum Average. Wirkt auf kommende normale Zufallsvorschläge; Crashs und Breaking News bleiben unverändert.':'0 %: keine Rückführung · 50 %: halbe Strecke · 100 %: vollständig zum Average. Die Zufallsschwankung folgt anschließend. Wird sofort gespeichert und wirkt auf kommende normale Zufallsvorschläge.';
  }
  async function flush(){
    if(pending||desired===null)return;
    const value=desired,generation=epoch;pending=true;
    try{await submit({type:'market-reversion',percent:value});if(generation===epoch)error.textContent='';}
    catch(reason){if(generation===epoch){error.textContent=reason instanceof Error?reason.message:String(reason);if(desired===value)desired=null;}}
    finally{if(generation===epoch){pending=false;if(desired===value)desired=null;render();if(desired!==null)void flush();}}
  }
  function reset(){
    epoch++;state=null;connected=false;desired=null;pending=false;error.textContent='';slider.value='50';slider.disabled=true;output.textContent='50 %';summary.textContent='';
  }
  slider.oninput=()=>{if(!state||!connected){render();return;}desired=Math.max(0,Math.min(100,Math.round(Number(slider.value))));render();void flush();};
  return{
    update(next:AdminState,online:boolean){if(state&&state.runId!==next.runId)reset();state=next;connected=online;render();},
    reset
  };
}
