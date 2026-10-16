import { expect, it } from 'vitest';
import { createMarket, applyCommand } from '../../src/domain/market-v2.js';
import { toDisplayState, toAdminState } from '../../src/domain/projections-v2.js';
import { makeConfiguration, context } from '../v2-fixtures.js';
import { midpointRng } from '../fixtures.js';
import {makeDrink} from '../fixtures.js';
it('public_projection_excludes_future_news_and_prices', () => {
  const s = createMarket(makeConfiguration(),0,midpointRng); const guest = toDisplayState(s);
  for (const key of ['specials','specialOrder','schedule','specialPreviews','previews','overrides','transition']) expect(guest).not.toHaveProperty(key);
  expect(guest.news).toBeNull(); expect(guest.historyByDrink.bier).toHaveLength(1);
  expect(toAdminState(s).specialPreviews['bier-down'].price).toBe(120);
});
it('active_news_exposes_only_its_frozen_quote_for_the_intro_announcement', () => {
  const start = applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);
  const intro = applyCommand(start,{type:'special',specialId:'bier-down'},context(60_000),midpointRng); const guest = toDisplayState(intro);
  expect(guest.news!.id).toBe('bier-down');expect(guest.news!.quote).toEqual({priceCents:120,deltaCents:-80,percent:-40});expect(guest.prices.bier).toBe(200);expect(guest).not.toHaveProperty('previews');expect(guest).not.toHaveProperty('pendingPrices');
  guest.historyByDrink.bier[0].price=0; expect(intro.historyByDrink.bier[0].price).toBe(200);
});
it('announcement_uses_prepared_price_after_configuration_or_volatility_changes',()=>{
 let s=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);s=applyCommand(s,{type:'special',specialId:'bier-up'},context(1000),midpointRng);s.transition!.prices.bier=290;s=applyCommand(s,{type:'market-volatility',factor:0},context(2000),midpointRng);expect(toDisplayState(s).news!.quote).toEqual({priceCents:290,deltaCents:90,percent:45});
});
it('announcement_from_zero_price_has_no_infinite_percentage',()=>{
 let s=applyCommand(createMarket(makeConfiguration([makeDrink({minCents:0,startCents:0})]),0,midpointRng),{type:'start'},context(0),midpointRng);s=applyCommand(s,{type:'special',specialId:'bier-up'},context(1000),midpointRng);expect(toDisplayState(s).news!.quote).toEqual({priceCents:270,deltaCents:270,percent:null});
});
