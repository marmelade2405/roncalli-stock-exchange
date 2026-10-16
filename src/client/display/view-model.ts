import type { DisplayState, RoundKind } from '../shared/protocol.js';
export function getDisplayModel(state: DisplayState, serverNow: number, connected: boolean, fresh=true): { showPrices: boolean; remainingMs: number | null; transitionKind: RoundKind | null; waitingForPublication: boolean } {
  const remainingMs = state.deadline === null ? null : state.deadline - serverNow;
  const dueWithoutPacket=state.phase!=='transition'&&state.hideAt!==null&&serverNow>=state.hideAt&&(remainingMs===null||remainingMs>state.parameters.transitionMs);
  const waitingForPublication = !connected || !fresh || dueWithoutPacket || (remainingMs !== null && remainingMs <= 0);
  const transitionKind = state.phase === 'transition' || (remainingMs !== null && remainingMs <= state.parameters.transitionMs) || (state.hideAt !== null && serverNow >= state.hideAt) ? state.nextKind : null;
  return { showPrices: !transitionKind && !waitingForPublication, remainingMs, transitionKind, waitingForPublication };
}
