import type { DrinkConfig, PreparedConfig, Rng, MarketState, MarketCommand, MarketContext } from './model.js';
import { createDefaultConfiguration } from './configuration.js';
import * as market from './market-v2.js';
export { nextBoundary } from './market-v2.js';
export function createMarket(config: PreparedConfig | DrinkConfig[], now: number, rng: Rng): MarketState {
  if(!Array.isArray(config))return market.createMarket(config,now,rng);
  const legacy=createDefaultConfiguration(config,rng);
  legacy.parameters.crashIntroMs=legacy.parameters.transitionMs;
  return market.createMarket(legacy,now,rng);
}
const time = (value: MarketContext|number): MarketContext => typeof value === 'number' ? {wallNow:value,marketNow:value} : value;
export function applyCommand(state: MarketState, command: MarketCommand, context: MarketContext|number, rng: Rng): MarketState { return market.applyCommand(state,command,time(context),rng); }
export function advanceMarket(state: MarketState, context: MarketContext|number, rng: Rng): MarketState { return market.advanceMarket(state,time(context),rng); }
