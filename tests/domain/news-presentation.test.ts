import {expect,it} from 'vitest';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {createSpecialSchedule} from '../../src/domain/special-schedule.js';
import {DEFAULT_PARAMETERS} from '../../src/domain/parameters.js';
import {makeDrink,midpointRng} from '../fixtures.js';
const context=(at:number)=>({wallNow:at,marketNow:at});
const start=()=>applyCommand(createMarket(createDefaultConfiguration(undefined,midpointRng),0,midpointRng),{type:'start'},context(0),midpointRng);
it('news_publishes_after_twenty_seconds_then_exposes_only_published_message',()=>{
  const state=applyCommand(start(),{type:'special',specialId:'bier-down'},context(0),midpointRng);expect(state.deadline).toBe(20000);expect(toDisplayState(state).parameters.newsIntroMs).toBe(5000);expect(toDisplayState(state).recentNews).toBeNull();
  expect(advanceMarket(state,context(19999),midpointRng).prices.bier).toBe(180);const published=advanceMarket(state,context(20000),midpointRng);
  expect(published.prices.bier).toBe(150);expect(toDisplayState(published).recentNews).toMatchObject({id:'bier-down',drinkId:'bier',publishedAt:20000});expect(published.deadline).toBe(1200000);
  expect(toDisplayState(advanceMarket(published,context(1200000),midpointRng)).recentNews).toBeNull();
});
it('published_news_survives_reload_and_view_change_but_not_reset',()=>{
  let state=advanceMarket(applyCommand(start(),{type:'special',specialId:'bier-down'},context(0),midpointRng),context(20000),midpointRng);
  state=applyCommand(JSON.parse(JSON.stringify(state)),{type:'view',mode:'ticker'},context(21000),midpointRng);
  expect(toDisplayState(state).recentNews?.drinkId).toBe('bier');expect(toDisplayState(applyCommand(state,{type:'reset',kind:'evening'},context(22000),midpointRng)).recentNews).toBeNull();
});
it('new_timing_keeps_legacy_configuration_valid',()=>{
  const old={...DEFAULT_PARAMETERS,newsMs:10000};delete old.newsIntroMs;
  const config={...createDefaultConfiguration([makeDrink()],midpointRng),parameters:old};expect(()=>createMarket(config,0,midpointRng)).not.toThrow();
});
