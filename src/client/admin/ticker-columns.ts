import type {AdminState,MarketCommand} from '../shared/protocol.js';
export function createTickerColumns(root:HTMLElement,submit:(command:MarketCommand)=>Promise<unknown>){
  root.innerHTML='<label>Laufliste: Spalten <select data-testid="ticker-columns"><option value="2">2 Spalten</option><option value="3">3 Spalten</option></select></label>';
  const input=root.querySelector('select')!;let state:AdminState|null=null,connected=false,pending=false,desired:2|3|null=null,epoch=0;
  function render(){input.value=String(desired??state?.tickerColumns??3);input.disabled=!connected||pending;}
  input.onchange=()=>{const generation=epoch;desired=Number(input.value)as 2|3;pending=true;render();void submit({type:'ticker-columns',columns:desired}).catch(()=>{}).finally(()=>{if(generation===epoch){pending=false;desired=null;render();}});};
  return{update(next:AdminState,online:boolean){state=next;connected=online;render();},reset(){epoch++;pending=false;desired=null;state=null;connected=false;render();}};
}
