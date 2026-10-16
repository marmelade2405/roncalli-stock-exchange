import {expect,it} from 'vitest';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng} from '../fixtures.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
it('fine_ticker_speed_uses_wall_time_instead_of_accelerated_market_time',()=>{
  let state=createMarket(makeConfiguration(),0,midpointRng);state=applyCommand(state,{type:'simulation',enabled:true,speed:500},context(0),midpointRng);state=applyCommand(state,{type:'start'},context(0),midpointRng);
  const changed=applyCommand(state,{type:'ticker-speed',rowMs:1950},{wallNow:1500,marketNow:750000},midpointRng);expect(changed.tickerOffsetRows).toBe(.5);expect(changed.tickerWallAt).toBe(1500);expect(changed.parameters.tickerRowMs).toBe(1950);validateStoredMarket(changed);expect(applyCommand(changed,{type:'ticker-speed',rowMs:4000},context(1500),midpointRng).parameters.tickerRowMs).toBe(4000);expect(()=>applyCommand(changed,{type:'ticker-speed',rowMs:4050},context(1500),midpointRng)).toThrow();
});
it('ticker_round_publication_resets_wall_anchor_without_staggered_simulation_hold',()=>{
  let state=createMarket(makeConfiguration(),0,midpointRng);state=applyCommand(state,{type:'view',mode:'ticker'},context(0),midpointRng);state=applyCommand(state,{type:'simulation',enabled:true,speed:500},context(0),midpointRng);state=applyCommand(state,{type:'start'},context(0),midpointRng);state=advanceMarket(state,{wallNow:2400,marketNow:1200000},midpointRng);expect(state.tickerWallAt).toBe(2400);expect(state.quoteRevealUntil).toBeUndefined();expect(state.clock.rate).toBe(500);validateStoredMarket(state);
});
