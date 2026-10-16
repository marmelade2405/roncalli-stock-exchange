import { expect, it } from 'vitest';
import { createDefaultConfiguration, validateConfiguration } from '../../src/domain/configuration.js';
import { createSpecialCatalog } from '../../src/domain/news-catalog.js';
import { DEFAULT_DRINKS } from '../../src/domain/defaults.js';
import { makeDrink, midpointRng } from '../fixtures.js';
it('default_parameters_are_exact', () => {
  const config = createDefaultConfiguration(undefined, midpointRng);
  expect(() => validateConfiguration(config)).not.toThrow();
  expect(config.parameters).toMatchObject({ normalMs: 1_200_000, crashMs: 300_000, transitionMs: 10_000, newsMs: 10_000, eveningMs: 18_000_000, minSpecialGapMs: 120_000, crashTrendPercent: -10, recoveryTrendPercent: 10, crashAmplitudeFactor: 2, historyChanges: 10, tickerRowMs: 6000 });
  config.parameters.normalMs = 60_000;
  expect(createDefaultConfiguration(undefined, midpointRng).parameters.normalMs).toBe(1_200_000);
});
it('catalog_has_two_opposite_specials_per_drink', () => {
  const catalog = createSpecialCatalog(DEFAULT_DRINKS);
  expect(catalog).toHaveLength(26);
  expect(new Set(catalog.map(x => x.id)).size).toBe(26);
  for (const drink of DEFAULT_DRINKS.filter(d=>d.minCents!==d.maxCents)) expect(catalog.filter(x => x.drinkId === drink.id).map(x => x.percent).sort((a,b) => a-b)).toEqual([-40, 40]);
  expect(createDefaultConfiguration([makeDrink({ id: 'limonade', name: 'Limonade' })], midpointRng).specials.map(x => x.drinkId)).toEqual(['limonade', 'limonade']);
});
it('invalid_parameters_and_catalog_are_rejected', () => {
  for (const mutate of [
    (c: ReturnType<typeof createDefaultConfiguration>) => { c.parameters.normalMs = 1000; },
    (c: ReturnType<typeof createDefaultConfiguration>) => { c.parameters.newsMs = NaN; },
    (c: ReturnType<typeof createDefaultConfiguration>) => { c.specials[0].percent = 0; },
    (c: ReturnType<typeof createDefaultConfiguration>) => { c.specials[0].headline = ''; },
    (c: ReturnType<typeof createDefaultConfiguration>) => { c.specialOrder[1] = c.specialOrder[0]; },
    (c: ReturnType<typeof createDefaultConfiguration>) => { c.specials.pop(); },
  ]) { const config = createDefaultConfiguration(undefined, midpointRng); mutate(config); expect(() => validateConfiguration(config)).toThrow(); }
});
