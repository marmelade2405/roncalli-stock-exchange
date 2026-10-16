import {it,expect} from 'vitest';
import {createDefaultConfiguration,validateConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
const rng=()=>.5,context=(marketNow:number,wallNow=marketNow)=>({marketNow,wallNow});
it('published_round_has_real_wall_anchor_for_staggered_simulation_display',()=>{
  let s=createMarket(createDefaultConfiguration(undefined,rng),0,rng);s=applyCommand(s,{type:'start'},context(0),rng);s=advanceMarket(s,context(1200000,10000),rng);
  expect(toDisplayState(s)).toMatchObject({publication:{wallAt:10000,kind:'normal',revision:s.revision},parameters:{priceRevealMs:500,historyChanges:19}});
  const restored=JSON.parse(JSON.stringify(s));validateStoredMarket(restored);expect(toDisplayState(restored).publication).toEqual(toDisplayState(s).publication);
});
it('manual_correction_identifies_only_the_published_drink',()=>{
  const s=applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'correct',drinkId:'bier',value:240},context(1),rng);
  expect(toDisplayState(s).publication).toMatchObject({kind:'correction',changedDrinkIds:['bier']});
});
it('reveal_parameter_accepts_half_seconds_and_keeps_legacy_configurations_valid',()=>{
  const c=createDefaultConfiguration(undefined,rng);Object.assign(c.parameters,{priceRevealMs:500});expect(()=>validateConfiguration(c)).not.toThrow();delete c.parameters.priceRevealMs;expect(()=>validateConfiguration(c)).not.toThrow();
  for(const value of[-1,NaN,501,5050]){Object.assign(c.parameters,{priceRevealMs:value});expect(()=>validateConfiguration(c)).toThrow();}
});
it('fast_simulation_finishes_the_quote_sequence_before_accelerating_again',()=>{
  let s=createMarket(createDefaultConfiguration(undefined,rng),0,rng);s=applyCommand(s,{type:'simulation',enabled:true,speed:500},context(0),rng);s=applyCommand(s,{type:'start'},context(0),rng);s=advanceMarket(s,context(1200000,3000),rng);
  expect(s.clock.rate).toBe(1);validateStoredMarket(s);const resumed=advanceMarket(s,context(1210200,13200),rng);expect(resumed.clock.rate).toBe(500);expect(resumed.prices).toEqual(s.prices);expect(resumed.deadline).toBe(2400000);
});
it('new_incompatible_reveal_settings_are_rejected_but_legacy_timing_remains_loadable',()=>{
  const c=createDefaultConfiguration(undefined,rng);c.parameters.crashMs=30000;c.parameters.priceRevealMs=5000;expect(()=>validateConfiguration(c)).toThrow();delete c.parameters.priceRevealMs;c.parameters.transitionMs=29000;expect(()=>validateConfiguration(c)).not.toThrow();const s=createMarket(c,0,rng);expect(toDisplayState(s).parameters.priceRevealMs).toBe(0);
});
