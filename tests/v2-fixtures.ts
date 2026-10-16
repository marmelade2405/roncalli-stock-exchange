import { createDefaultConfiguration } from '../src/domain/configuration.js';
import {createSpecialCatalog} from '../src/domain/news-catalog.js';
import type { DrinkConfig, MarketContext, PreparedConfig } from '../src/domain/model.js';
import { midpointRng,LEGACY_DRINKS } from './fixtures.js';
export const makeConfiguration = (drinks?: DrinkConfig[]): PreparedConfig => {const config=createDefaultConfiguration(drinks??LEGACY_DRINKS, midpointRng);return{...config,specials:createSpecialCatalog(config.drinks),parameters:{...config.parameters,newsMs:10000}};};
export const context = (time: number): MarketContext => ({ wallNow: time, marketNow: time });
