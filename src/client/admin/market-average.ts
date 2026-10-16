import type {AdminState,MarketCommand} from '../shared/protocol.js';
import {formatEuro} from '../shared/format.js';
import {averageTargetCents} from '../../domain/prices.js';

export function createMarketAverage(root:HTMLElement,submit:(command:MarketCommand)=>Promise<unknown>){
  root.classList.add('market-average-control');
  root.innerHTML='<div class="market-average-heading"><label for="market-average-slider">Globaler Average</label><output data-testid="market-average-value" class="mono up" for="market-average-slider">0 %</output><strong data-testid="market-average-summary" id="market-average-summary" class="mono"></strong></div><div class="market-average-track"><span class="muted">−50 %</span><input id="market-average-slider" type="range" min="-50" max="200" step="1" value="0" disabled aria-label="Globaler Average" aria-describedby="market-average-summary market-average-hint" data-testid="market-average"><span class="muted">+200 %</span></div><p id="market-average-hint" class="market-average-hint muted">Wird sofort gespeichert; kein Speichern in den Einstellungen nötig. Wirkt auf künftige normale Zufallsvorschläge. Aktuelle Preise bleiben unverändert. Min- und Max-Preise skalieren mit dem Average. Vorgaben außerhalb der neuen Grenzen werden angepasst.</p><p data-testid="market-average-error" class="market-average-error error-text" role="alert"></p>';
  const slider=root.querySelector('input')!,output=root.querySelector('output')!,summary=root.querySelector('strong')!,error=root.querySelector<HTMLElement>('[role="alert"]')!;
  let state:AdminState|null=null,connected=false,desired:number|null=null,pending=false,epoch=0;
  function render(){
    if(!state)return;
    const percent=desired??state.parameters.marketAveragePercent??0;
    slider.value=String(percent);slider.disabled=!connected;output.className='mono '+(percent<0?'down':'up');output.textContent=`${percent>0?'+':percent<0?'−':''}${Math.abs(percent)} %`;
    const example=state.config.find(drink=>drink.id==='bier')??state.config.find(drink=>drink.fixedPriceCents===undefined&&drink.minCents!==drink.maxCents);
    summary.textContent=example?`Referenzbeispiel: ${example.name} ${formatEuro(example.averageCents??example.startCents)} → ${formatEuro(averageTargetCents(example,percent))}`:'Kein Referenzgetränk verfügbar';
  }
  async function flush(){
    if(pending||desired===null)return;
    const value=desired,generation=epoch;pending=true;
    try{await submit({type:'market-average',percent:value});if(generation===epoch)error.textContent='';}
    catch(reason){if(generation===epoch){error.textContent=reason instanceof Error?reason.message:String(reason);if(desired===value)desired=null;}}
    finally{if(generation===epoch){pending=false;if(desired===value)desired=null;render();if(desired!==null)void flush();}}
  }
  function reset(){
    epoch++;state=null;connected=false;desired=null;pending=false;error.textContent='';slider.value='0';slider.disabled=true;output.textContent='0 %';summary.textContent='';
  }
  slider.oninput=()=>{if(!state||!connected){render();return;}desired=Math.max(-50,Math.min(200,Math.round(Number(slider.value))));render();void flush();};
  return{
    update(next:AdminState,online:boolean){if(state&&state.runId!==next.runId)reset();state=next;connected=online;render();},
    reset
  };
}
