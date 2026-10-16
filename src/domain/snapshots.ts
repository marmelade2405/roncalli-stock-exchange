import type { MarketState, DisplayState, AdminState } from './types.js';
export function toDisplayState(state: MarketState): DisplayState {
  return {
    revision: state.revision, phase: state.phase,
    drinks: state.drinks.map(({ id, name, category }) => ({ id, name, category })),
    prices: { ...state.prices }, previousPrices: state.previousPrices ? { ...state.previousPrices } : null,
    deadline: state.deadline, nextKind: state.transition?.kind ?? (state.phase === 'crash' ? 'recovery' : state.phase === 'normal' ? 'normal' : null),
    publishedAt: state.publishedAt, viewMode: state.viewMode, viewEpoch: state.viewEpoch,
  };
}
export function toAdminState(state: MarketState): AdminState {
  return { ...toDisplayState(state), config: structuredClone(state.drinks), previews: structuredClone(state.previews), overrides: structuredClone(state.overrides), pendingPrices: state.transition ? { ...state.transition.prices } : null };
}
