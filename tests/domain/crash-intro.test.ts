import {expect,it} from 'vitest';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {makeDrink,midpointRng} from '../fixtures.js';
import {context} from '../v2-fixtures.js';

const configuration=()=>createDefaultConfiguration([makeDrink({startCents:1000,averageCents:1000,minCents:0,maxCents:2000,amplitudeCents:0})],midpointRng);
const start=(cfg=configuration())=>applyCommand(createMarket(cfg,0,midpointRng),{type:'start'},context(0),midpointRng);

it('default_crash_keeps_current_prices_until_the_full_fifteen_second_intro_finishes',()=>{
  const state=applyCommand(start(),{type:'crash'},context(1000),midpointRng);
  expect(state.transition?.publishAt).toBe(16000);
  expect(advanceMarket(state,context(15999),midpointRng).prices.bier).toBe(1000);
  const published=advanceMarket(state,context(16000),midpointRng);
  expect(published.phase).toBe('crash');expect(published.prices.bier).toBe(900);
  expect(published.deadline).toBe(316000);
});

it('custom_crash_intro_changes_only_crash_publication_and_preserves_normal_and_recovery_timing',()=>{
  const cfg=configuration();Object.assign(cfg.parameters,{crashIntroMs:2000});
  let state=start(cfg);state=applyCommand(state,{type:'crash'},context(1000),midpointRng);
  expect(state.deadline).toBe(3000);state=advanceMarket(state,context(3000),midpointRng);
  state=applyCommand(state,{type:'cancel-crash'},context(4000),midpointRng);
  expect(state.transition).toMatchObject({kind:'recovery',publishAt:14000});
  state=advanceMarket(state,context(14000),midpointRng);
  expect(state.deadline).toBe(1214000);
  state=advanceMarket(state,context(1204000),midpointRng);
  expect(state.transition).toMatchObject({kind:'normal',publishAt:1214000});
});

it('legacy_saved_parameters_without_crash_intro_keep_their_existing_transition_duration',()=>{
  const cfg=configuration();Reflect.deleteProperty(cfg.parameters,'crashIntroMs');cfg.parameters.transitionMs=7000;
  let state=start(cfg);validateStoredMarket(state);
  state=applyCommand(JSON.parse(JSON.stringify(state)),{type:'crash'},context(1000),midpointRng);
  expect(state.deadline).toBe(8000);validateStoredMarket(state);
  expect(toDisplayState(state).parameters).toMatchObject({crashIntroMs:7000,transitionMs:7000});
});

it('crash_intro_validation_accepts_whole_seconds_from_one_to_sixty',()=>{
  for(const crashIntroMs of [1000,60000]){const cfg=configuration();Object.assign(cfg.parameters,{crashIntroMs});expect(()=>createMarket(cfg,0,midpointRng)).not.toThrow();}
});

it('crash_intro_validation_rejects_zero_fractional_seconds_and_out_of_range_values',()=>{
  for(const crashIntroMs of [0,999,1500,61000,NaN]){const cfg=configuration();Object.assign(cfg.parameters,{crashIntroMs});expect(()=>createMarket(cfg,0,midpointRng)).toThrow();}
});

it('crash_intro_public_projection_exposes_its_duration_for_video_synchronization',()=>{
  const state=applyCommand(start(),{type:'crash'},context(1000),midpointRng);
  expect(toDisplayState(state).parameters).toMatchObject({crashIntroMs:15000,transitionMs:10000});
});

it('simulation_skip_and_cancel_keep_existing_crash_semantics_during_the_longer_intro',()=>{
  let state=createMarket(configuration(),0,midpointRng);
  state=applyCommand(state,{type:'simulation',enabled:true,speed:8},context(0),midpointRng);
  state=applyCommand(state,{type:'start'},context(0),midpointRng);
  const intro=applyCommand(state,{type:'crash'},context(1000),midpointRng);
  expect(intro.clock.rate).toBe(1);
  const cancelled=applyCommand(intro,{type:'cancel-crash'},context(2000),midpointRng);
  expect(cancelled.phase).toBe('normal');expect(cancelled.prices.bier).toBe(1000);
  const skipped=applyCommand(intro,{type:'skip-transition'},context(2000),midpointRng);
  expect(skipped.phase).toBe('crash');expect(skipped.prices.bier).toBe(900);
});
