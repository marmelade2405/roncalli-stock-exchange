import { createDefaultConfiguration } from '../src/domain/configuration.js';
import type { DrinkConfig, MarketContext, PreparedConfig } from '../src/domain/model.js';
import { midpointRng,LEGACY_DRINKS } from './fixtures.js';
export const makeConfiguration = (drinks?: DrinkConfig[]): PreparedConfig => createDefaultConfiguration(drinks??LEGACY_DRINKS, midpointRng);
export const context = (time: number): MarketContext => ({ wallNow: time, marketNow: time });
