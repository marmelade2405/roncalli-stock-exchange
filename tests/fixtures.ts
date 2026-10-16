import type { DrinkConfig, Rng } from '../src/domain/types.js';
export const makeDrink = (overrides: Partial<DrinkConfig> = {}): DrinkConfig => ({ id: 'bier', name: 'Bier', category: 'Bier', startCents: 200, minCents: 100, maxCents: 300, amplitudeCents: 30, stepCents: 10, ...overrides });
export const midpointRng: Rng = () => .5;
