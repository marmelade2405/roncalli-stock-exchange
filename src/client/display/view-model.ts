import type { DisplayState, RoundKind } from '../shared/protocol.js';
export function getDisplayModel(state: DisplayState, serverNow: number, _connected: boolean): { showPrices: boolean; remainingMs: number | null; transitionKind: RoundKind | null; waitingForPublication: boolean } {
  const remainingMs = state.deadline === null ? null : state.deadline - serverNow;
  const waitingForPublication = remainingMs !== null && remainingMs <= 0;
  const transitionKind = state.phase === 'transition' || (remainingMs !== null && remainingMs <= 10_000) ? state.nextKind : null;
  return { showPrices: !transitionKind && !waitingForPublication, remainingMs, transitionKind, waitingForPublication };
}
