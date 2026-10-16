import {animationParameters} from '../shared/animation-parameters.js';
import type { DisplayState, RoundKind } from '../shared/protocol.js';
export function createNewsHold(){
  let event:string|null=null,expiresAt:number|null=null;
  return(key:string|null,eligible:boolean,now:number,deadlineAt:number):boolean=>{
    if(key!==event){event=key;expiresAt=null;}
    if(key===null)return false;
    if(expiresAt===null&&now>=deadlineAt)expiresAt=deadlineAt+2000;
    return eligible&&expiresAt!==null&&now<=expiresAt;
  };
}
export function getDisplayModel(state: DisplayState, serverNow: number, connected: boolean, fresh=true): { showPrices: boolean; remainingMs: number | null; transitionKind: RoundKind | null; waitingForPublication: boolean; holdNews:boolean } {
  const parameters=animationParameters(state);
  const remainingMs = state.deadline === null ? null : state.deadline - serverNow;
  const dueWithoutPacket=state.phase!=='transition'&&state.hideAt!==null&&serverNow>=state.hideAt&&(remainingMs===null||remainingMs>parameters.transitionMs);
  const waitingForPublication = !connected || !fresh || dueWithoutPacket || (remainingMs !== null && remainingMs <= 0);
  const transitionKind = state.phase === 'transition' || (remainingMs !== null && remainingMs <= parameters.transitionMs) || (state.hideAt !== null && serverNow >= state.hideAt) ? state.nextKind : null;
  const holdNews=connected&&fresh&&state.phase==='transition'&&state.nextKind==='special'&&state.news!==null&&remainingMs!==null&&remainingMs<=0&&remainingMs>=-2000;
  return { showPrices: !transitionKind && !waitingForPublication, remainingMs, transitionKind, waitingForPublication,holdNews };
}
