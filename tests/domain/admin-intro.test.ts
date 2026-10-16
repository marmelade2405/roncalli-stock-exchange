import {expect,it} from 'vitest';
import {createDefaultConfiguration,validateConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
const rng=()=>.5,context=(at:number)=>({wallNow:at,marketNow:at});
it('admin_skips_a_normal_live_price_transition_at_current_time_using_the_frozen_prices',()=>{
 let state=applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'start'},context(0),rng);state=applyCommand(state,{type:'override',scope:'normal',drinkId:'bier',value:250},context(1000),rng);state=advanceMarket(state,context(1190000),rng);
 const published=applyCommand(state,{type:'skip-intro'},context(1192000),rng);expect(published.phase).toBe('normal');expect(published.prices).toEqual(state.transition!.prices);expect(published.prices.bier).toBe(250);expect(published.deadline).toBe(2392000);expect(published.clock.marketAnchor).toBe(1192000);expect(published.overrides.normal).toEqual({});validateStoredMarket(published);
});
it('admin_skips_live_news_video_but_keeps_the_message_price_release_and_normal_deadline',()=>{
 let state=applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'start'},context(0),rng);
 state=applyCommand(state,{type:'special',specialId:'bier-down'},context(60000),rng);
 const skipped=applyCommand(state,{type:'skip-intro'},context(62000),rng);
 expect(skipped.phase).toBe('transition');expect(skipped.prices.bier).toBe(220);expect(skipped.deadline).toBe(77000);expect(skipped.transition?.normalDeadline).toBe(1200000);expect(skipped.clock.marketAnchor).toBe(62000);
 validateStoredMarket(skipped);
 expect(advanceMarket(skipped,context(76999),rng).prices.bier).toBe(220);const published=advanceMarket(skipped,context(77000),rng);expect(published.prices.bier).toBe(150);expect(published.deadline).toBe(1200000);expect(published.schedule.done).toHaveLength(1);
});
it('news_message_skip_publishes_once_at_current_time_without_changing_the_normal_deadline',()=>{
 let state=applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'start'},context(0),rng);state=applyCommand(state,{type:'special',specialId:'bier-down'},context(60000),rng);
 const published=applyCommand(state,{type:'skip-intro'},context(71000),rng);expect(published.phase).toBe('normal');expect(published.prices.bier).toBe(150);expect(published.deadline).toBe(1200000);expect(published.clock.marketAnchor).toBe(71000);expect(published.schedule.done).toHaveLength(1);expect(()=>applyCommand(published,{type:'skip-intro'},context(71000),rng)).toThrow();validateStoredMarket(published);
});
it('recovery_outro_skip_publishes_prepared_prices_and_starts_the_next_round_now',()=>{
 let state=applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'start'},context(0),rng);state=applyCommand(state,{type:'crash'},context(60000),rng);state=applyCommand(state,{type:'skip-intro'},context(62000),rng);state=advanceMarket(state,context(352000),rng);expect(state.transition?.kind).toBe('recovery');
 const published=applyCommand(state,{type:'skip-intro'},context(354000),rng);expect(published.phase).toBe('normal');expect(published.prices).toEqual(state.transition!.prices);expect(published.deadline).toBe(1554000);expect(published.clock.marketAnchor).toBe(354000);validateStoredMarket(published);
});
it('admin_skips_crash_video_without_moving_live_time_into_the_future',()=>{
 let state=applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'start'},context(0),rng);state=applyCommand(state,{type:'crash'},context(60000),rng);
 const skipped=applyCommand(state,{type:'skip-intro'},context(62000),rng);expect(skipped.phase).toBe('crash');expect(skipped.deadline).toBe(362000);expect(skipped.prices).toEqual(state.transition!.prices);expect(skipped.clock.marketAnchor).toBe(62000);validateStoredMarket(skipped);
});
it('crash_cost_is_a_validated_display_hint_and_legacy_markets_default_to_fifteen_euro',()=>{
 const config=createDefaultConfiguration(undefined,rng);Object.assign(config.parameters,{crashCostCents:1750});expect(()=>validateConfiguration(config)).not.toThrow();const state=createMarket(config,0,rng);expect(toDisplayState(state).parameters).toMatchObject({crashCostCents:1750});expect(state.prices.bier).toBe(220);
 delete config.parameters.crashCostCents;expect(toDisplayState(createMarket(config,0,rng)).parameters).toMatchObject({crashCostCents:1500});
 for(const value of [-1,100001,1.5,NaN]){Object.assign(config.parameters,{crashCostCents:value});expect(()=>validateConfiguration(config)).toThrow();}
});
