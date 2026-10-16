import type {AdminState,MarketCommand} from '../shared/protocol.js';
import type {ChartMode} from '../../domain/model.js';
export function createChartMode(root:HTMLElement,submit:(command:MarketCommand)=>Promise<unknown>){
  root.innerHTML='<label>Chartdarstellung <select data-testid="chart-mode"><option value="line">Linie</option><option value="bars">Balken ohne Abstand</option><option value="bars-gap">Balken mit Abstand</option></select></label>';const input=root.querySelector('select')!;let state:AdminState|null=null,connected=false,pending=false,desired:ChartMode|null=null,epoch=0;
  function render(){input.value=desired??state?.chartMode??'bars-gap';input.disabled=!connected||pending;}
  input.onchange=()=>{const activeEpoch=epoch;desired=input.value as ChartMode;pending=true;render();void submit({type:'chart-mode',mode:desired}).catch(()=>{}).finally(()=>{if(activeEpoch===epoch){pending=false;desired=null;render();}});};
  return{update(next:AdminState,online:boolean){state=next;connected=online;render();},reset(){epoch++;pending=false;desired=null;state=null;connected=false;render();}};
}
