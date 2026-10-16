import {expect,it} from 'vitest';
import {canShowBarPrices} from '../../src/client/bar-display/price-model.js';
import {createMarket,applyCommand} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng} from '../fixtures.js';
it('bar_prices_stay_visible_during_a_confirmed_intro_until_publication',()=>{
  let state=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);state=applyCommand(state,{type:'crash'},context(0),midpointRng);const view=toDisplayState(state);expect(canShowBarPrices(view,5000,true,true)).toBe(true);expect(canShowBarPrices(view,10000,true,true)).toBe(false);
});
it('bar_prices_hide_for_stale_disconnected_or_unconfirmed_due_state',()=>{
  const state=toDisplayState(applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng));expect(canShowBarPrices(state,1000,false,true)).toBe(false);expect(canShowBarPrices(state,1000,true,false)).toBe(false);expect(canShowBarPrices(state,1190000,true,true)).toBe(false);expect(canShowBarPrices(state,1000,true,true)).toBe(true);
});
