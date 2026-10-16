import { describe, expect, it } from 'vitest';
import { randomPrice, resolvePrices, validateDrinks, validateOverride } from '../../src/domain/prices.js';

const beer = { id: 'bier', name: 'Bier', category: 'Bier', startCents: 200, minCents: 100, maxCents: 300, amplitudeCents: 30, stepCents: 10 };
describe('Preisberechnung', () => {
  it('normal_midpoint_keeps_200', () => expect(randomPrice(beer, 200, 'normal', () => .5)).toBe(200));
  it('crash_midpoint_is_180', () => expect(randomPrice(beer, 200, 'crash', () => .5)).toBe(180));
  it('recovery_from_140_is_150', () => expect(randomPrice(beer, 140, 'recovery', () => .5)).toBe(150));
  it('crash_zero_rng_from_200_reaches_the_minimum_with_percent_basis', () => expect(randomPrice(beer, 200, 'crash', () => 0)).toBe(100));
  it('clamps_and_rounds', () => {
    expect(randomPrice(beer, 100, 'crash', () => 0)).toBe(100);
    expect(randomPrice(beer, 300, 'recovery', () => .999)).toBe(300);
    expect(randomPrice(beer, 200, 'normal', () => .7)).toBe(220);
  });
  it('manual_price_replaces_preview', () => {
    expect(resolvePrices({ bier: 180, cola: 140 }, { bier: 240, cola: null })).toEqual({ bier: 240, cola: 140 });
  });
  it('rejects_invalid_configuration_and_override', () => {
    for (const value of [205, NaN, 0, 310, Infinity]) expect(() => validateOverride(beer, value)).toThrow();
    expect(() => validateOverride(beer, null)).not.toThrow();
    expect(() => validateDrinks([])).toThrow();
    expect(() => validateDrinks([beer, beer])).toThrow();
    expect(() => validateDrinks([{ ...beer, minCents: 250 }])).toThrow();
  });
});
