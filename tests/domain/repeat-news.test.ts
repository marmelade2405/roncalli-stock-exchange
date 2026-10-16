import {expect,it} from 'vitest';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng as rng} from '../fixtures.js';
it('used_news_can_repeat_after_publication_and_reloading_without_duplicate_schedule_entries',()=>{
 let state=applyCommand(createMarket(makeConfiguration(),0,rng),{type:'start'},context(0),rng);
 for(let i=0;i<4;i++){
  const at=1000+i*20000;
  state=applyCommand(state,{type:'correct',drinkId:'bier',value:200},context(at),rng);
  state=applyCommand(state,{type:'special',specialId:'bier-down'},context(at),rng);
  validateStoredMarket(state);state=JSON.parse(JSON.stringify(state));validateStoredMarket(state);
  expect(()=>applyCommand(state,{type:'special',specialId:'bier-down'},context(at+1),rng)).toThrow();
  state=advanceMarket(state,context(at+10000),rng);validateStoredMarket(state);
  expect(state.prices.bier).toBe(120);
  expect(state.schedule.done.filter(n=>n.specialId==='bier-down')).toHaveLength(1);
  expect(state.schedule.done.find(n=>n.specialId==='bier-down')!.publishedAt).toBe(at+10000);
  expect(toDisplayState(state).recentNews?.id).toBe('bier-down');
 }
});
