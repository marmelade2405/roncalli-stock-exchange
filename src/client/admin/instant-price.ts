import type { AdminState, Cents } from '../shared/protocol.js';
import { formatEuro, parseEuro } from '../shared/format.js';
export function createInstantPriceEditor(root:HTMLElement,drinkId:string,submit:(value:Cents,revision:number,generation:number)=>Promise<unknown>){
  root.innerHTML='<strong class="current-value"></strong><div class="instant-controls"><input type="text" inputmode="decimal" placeholder="Sofortpreis"><button type="button">Jetzt setzen</button></div><div class="price-status" role="status"></div>';
  const value=root.querySelector('strong')!,input=root.querySelector('input')!,button=root.querySelector('button')!,status=root.querySelector<HTMLElement>('.price-status')!;
  for(const [node,suffix]of [[value,'value'],[input,'input'],[button,'save'],[status,'status']]as const)node.dataset.testid=`current-${drinkId}-${suffix}`;
  let state:AdminState|null=null,draft=false,base=0,generation=0,pending=false;
  input.oninput=()=>{if(!draft)base=state!.revision;draft=true;generation++;status.textContent='Noch nicht gespeichert';status.setAttribute('role','status');};
  button.onclick=()=>{const submitted=generation,run=state!.runId;let cents:Cents|null;
    try{cents=parseEuro(input.value);if(cents===null)throw Error('Bitte einen Sofortpreis eingeben.');}catch(error){status.textContent=(error as Error).message;status.setAttribute('role','alert');return;}
    pending=true;button.disabled=true;status.textContent='Wird gespeichert …';
    void submit(cents,draft?base:state!.revision,submitted).then(()=>{if(state?.runId!==run||generation!==submitted)return;draft=false;input.value='';status.setAttribute('role','status');status.textContent='Gespeichert';}).catch(error=>{if(state?.runId!==run||generation!==submitted)return;base=state.revision;status.setAttribute('role','alert');status.textContent=error.message;}).finally(()=>{pending=false;});
  };
  return{update(next:AdminState,connected:boolean,now:number){state=next;value.textContent=formatEuro(next.prices[drinkId]);input.setAttribute('aria-label',`Sofortpreis für ${next.drinks.find(d=>d.id===drinkId)?.name}`);const locked=!connected||next.phase==='transition'||(next.phase==='normal'&&next.deadline!==null&&now>=next.deadline-next.parameters.transitionMs);input.disabled=locked;button.disabled=locked||pending;},ownRevision(from:number,to:number){if(draft&&base===from)base=to;},reset(){state=null;draft=false;generation++;input.value='';status.textContent='';}};
}
