import type {DisplayState} from '../shared/protocol.js';
export function canShowBarPrices(state:DisplayState,now:number,connected:boolean,fresh:boolean):boolean{
  if(!connected||!fresh||state.deadline!==null&&now>=state.deadline)return false;
  if(state.phase!=='ready'&&state.phase!=='transition'&&state.hideAt!==null&&now>=state.hideAt)return false;
  return true;
}
