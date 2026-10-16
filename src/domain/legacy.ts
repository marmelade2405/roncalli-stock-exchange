import type { DrinkConfig, PriceMap, OverrideMap, ViewMode } from './types.js';
import { validateDrinks, validateOverride } from './prices.js';
export interface LegacyMarketState {
  schemaVersion: 1; revision: number; phase: 'ready'|'normal'|'crash'|'transition'; drinks: DrinkConfig[];
  prices: PriceMap; previousPrices: PriceMap|null; previews: {normal:PriceMap|null;crash:PriceMap|null;recovery:PriceMap|null};
  overrides: {normal:OverrideMap;crash:OverrideMap}; deadline:number|null;
  transition: {kind:'normal'|'crash'|'recovery';publishAt:number;prices:PriceMap}|null;
  viewMode:ViewMode; viewEpoch:number; publishedAt:number;
  history:{revision:number;kind:'normal'|'crash'|'recovery';publishedAt:number;prices:PriceMap}[];
}
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isTimestamp = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0;
export function validateLegacyMarket(value: unknown): asserts value is LegacyMarketState {
  const invalid = () => { throw new Error('Der gespeicherte Marktstand ist ungültig. Die Datei bleibt erhalten.'); };
  if (!isRecord(value)) invalid();
  const state = value as LegacyMarketState;
  if (state.schemaVersion !== 1 || !isTimestamp(state.revision) || !['ready', 'normal', 'crash', 'transition'].includes(state.phase) || !['overview', 'ticker'].includes(state.viewMode)) invalid();
  validateDrinks(state.drinks);
  const drinks = new Map(state.drinks.map(drink => [drink.id, drink]));
  const checkMap = (map: PriceMap | OverrideMap, complete: boolean) => {
    if (!isRecord(map) || (complete && Object.keys(map).length !== drinks.size)) invalid();
    for (const [id, amount] of Object.entries(map)) {
      const drink = drinks.get(id);
      if (!drink || (complete && amount === null)) invalid();
      validateOverride(drink!, amount);
    }
  };
  checkMap(state.prices, true);
  if (state.previousPrices !== null) checkMap(state.previousPrices, true);
  if (!isRecord(state.previews) || !isRecord(state.overrides)) invalid();
  for (const scope of ['normal', 'crash'] as const) checkMap(state.overrides[scope], false);
  for (const kind of ['normal', 'crash', 'recovery'] as const) if (state.previews[kind] !== null) checkMap(state.previews[kind]!, true);
  if (!isTimestamp(state.publishedAt) || !isTimestamp(state.viewEpoch) || (state.deadline !== null && !isTimestamp(state.deadline))) invalid();
  if ((state.phase === 'ready') !== (state.deadline === null) || (state.phase === 'transition') !== (state.transition !== null)) invalid();
  if (state.transition !== null) {
    if (!isRecord(state.transition) || !['normal', 'crash', 'recovery'].includes(state.transition.kind) || state.transition.publishAt !== state.deadline) invalid();
    checkMap(state.transition.prices, true);
  }
  const kind = state.transition?.kind ?? (state.phase === 'crash' ? 'recovery' : 'normal');
  if (kind === 'recovery') {
    if (state.previews.recovery === null || state.previews.normal !== null || state.previews.crash !== null) invalid();
  } else if (kind === 'crash') {
    if (state.previews.crash === null || state.previews.normal !== null || state.previews.recovery !== null) invalid();
  } else if (state.previews.normal === null || state.previews.crash === null || state.previews.recovery !== null) invalid();
  if (!Array.isArray(state.history) || state.history.length > 100) invalid();
  for (const round of state.history) {
    if (!isRecord(round) || !isTimestamp(round.revision) || round.revision > state.revision || !isTimestamp(round.publishedAt) || !['normal', 'crash', 'recovery'].includes(round.kind)) invalid();
    checkMap(round.prices, true);
  }
}

