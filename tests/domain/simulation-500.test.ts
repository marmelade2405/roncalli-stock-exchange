import {it,expect} from 'vitest';
import {createMarket,applyCommand,advanceMarket,nextBoundary} from '../../src/domain/market-v2.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng} from '../fixtures.js';
import {readMarketTime,advanceClock} from '../../src/domain/market-clock.js';
it('simulation_can_run_at_five_hundred_and_preserves_real_transition_duration',()=>{
  let state=createMarket(makeConfiguration(),0,midpointRng);state=applyCommand(state,{type:'simulation',enabled:true,speed:500},context(0),midpointRng);state=applyCommand(state,{type:'start'},context(0),midpointRng);
  expect(readMarketTime(state.clock,1000)).toBe(500000);const boundary=advanceClock(state.clock,3000,nextBoundary(state)!);expect(boundary.marketNow).toBe(1190000);
  state=advanceMarket(state,{wallNow:3000,marketNow:boundary.marketNow},midpointRng);expect(state.clock.rate).toBe(1);
  expect(()=>applyCommand(state,{type:'simulation',enabled:true,speed:501},{wallNow:3000,marketNow:1190000},midpointRng)).toThrow();
});
