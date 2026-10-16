import { expect, it } from 'vitest';
import { createMarket, applyCommand } from '../../src/domain/market-v2.js';
import { toDisplayState, toAdminState } from '../../src/domain/projections-v2.js';
import { makeConfiguration, context } from '../v2-fixtures.js';
import { midpointRng } from '../fixtures.js';
it('public_projection_excludes_future_news_and_prices', () => {
  const s = createMarket(makeConfiguration(),0,midpointRng); const guest = toDisplayState(s);
  for (const key of ['specials','specialOrder','schedule','specialPreviews','previews','overrides','transition']) expect(guest).not.toHaveProperty(key);
  expect(guest.news).toBeNull(); expect(guest.historyByDrink.bier).toHaveLength(1);
  expect(toAdminState(s).specialPreviews['bier-down'].price).toBe(120);
});
it('active_news_does_not_expose_target_price', () => {
  const start = applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);
  const intro = applyCommand(start,{type:'special',specialId:'bier-down'},context(60_000),midpointRng); const guest = toDisplayState(intro);
  expect(guest.news!.id).toBe('bier-down'); expect(guest.news).not.toHaveProperty('percent'); expect(guest.prices.bier).toBe(200);
  guest.historyByDrink.bier[0].price=0; expect(intro.historyByDrink.bier[0].price).toBe(200);
});
