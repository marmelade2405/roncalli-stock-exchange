import {expect,it} from 'vitest';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng} from '../fixtures.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
it('simulation_counter_skip_publishes_once_and_keeps_pause',()=>{
  let state=createMarket(makeConfiguration(),0,midpointRng);state=applyCommand(state,{type:'simulation',enabled:true,speed:500},context(0),midpointRng);state=applyCommand(state,{type:'start'},context(0),midpointRng);state=applyCommand(state,{type:'step'},context(1000),midpointRng);state=applyCommand(state,{type:'pause',paused:true},{wallNow:1000,marketNow:state.clock.marketAnchor},midpointRng);const target=state.deadline!;
  const published=applyCommand(state,{type:'skip-transition'},{wallNow:1000,marketNow:state.clock.marketAnchor},midpointRng);expect(published.phase).toBe('normal');expect(published.history).toHaveLength(1);expect(published.deadline).toBe(target+1200000);expect(published.clock.paused).toBe(true);expect(()=>applyCommand(published,{type:'skip-transition'},context(1000),midpointRng)).toThrow();validateStoredMarket(published);
});
it('live_skip_is_rejected_and_live_ticker_slider_preserves_market_and_position',()=>{
  let state=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);expect(()=>applyCommand(state,{type:'skip-transition'},context(0),midpointRng)).toThrow();state=applyCommand(state,{type:'override',scope:'normal',drinkId:'bier',value:250},context(0),midpointRng);
  const changed=applyCommand(state,{type:'ticker-speed',rowMs:1000},context(1500),midpointRng);expect(changed.parameters.tickerRowMs).toBe(1000);expect(changed.tickerOffsetRows).toBe(.5);for(const key of['prices','previews','overrides','deadline','schedule']as const)expect(changed[key]).toEqual(state[key]);validateStoredMarket(changed);
});
it.each([false,true])('simulation_news_skip_publishes_once_and_preserves_normal_timer_and_pause_%s',paused=>{
  let state=createMarket(makeConfiguration(),0,midpointRng);state=applyCommand(state,{type:'simulation',enabled:true,speed:37},context(0),midpointRng);state=applyCommand(state,{type:'start'},context(0),midpointRng);state=applyCommand(state,{type:'special',specialId:'bier-down'},context(60000),midpointRng);if(paused)state=applyCommand(state,{type:'pause',paused:true},context(66000),midpointRng);
  const prices=state.transition!.prices,published=applyCommand(state,{type:'skip-transition'},context(paused?66000:60000),midpointRng);expect(published.phase).toBe('normal');expect(published.prices).toEqual(prices);expect(published.deadline).toBe(1200000);expect(published.history).toHaveLength(1);expect(published.schedule.done.filter(n=>n.specialId==='bier-down')).toHaveLength(1);expect(published.clock.paused).toBe(paused);expect(published.clock.speed).toBe(37);expect(advanceMarket(published,context(80000),midpointRng).history).toHaveLength(1);expect(()=>applyCommand(published,{type:'skip-transition'},context(80000),midpointRng)).toThrow();validateStoredMarket(published);
});
it('live_news_skip_is_rejected',()=>{
  let state=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);state=applyCommand(state,{type:'special',specialId:'bier-down'},context(60000),midpointRng);expect(()=>applyCommand(state,{type:'skip-transition'},context(60000),midpointRng)).toThrow();
});
