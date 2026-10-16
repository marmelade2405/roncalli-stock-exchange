import {expect,it} from 'vitest';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {makeDrink,midpointRng} from '../fixtures.js';
import {context} from '../v2-fixtures.js';
import {prepareCrash} from '../../src/domain/crash-prices.js';
const config=()=>{const c=createDefaultConfiguration([makeDrink({startCents:1000,averageCents:1000,minCents:0,maxCents:2000,amplitudeCents:30})],midpointRng);delete c.parameters.marketVolatilityPercent;return c;};
it('crash_selects_one_saved_percentage_with_inclusive_configured_bounds',()=>{
  for(const[rngValue,percent,price]of[[0,5,950],[.5,10,900],[.999,15,850]]){let calls=0;const state=createMarket(config(),0,()=>++calls===3?rngValue:.5);expect(state.nextCrashPercent).toBe(percent);expect(state.previews.crash!.bier).toBe(price);expect(toDisplayState(state)).not.toHaveProperty('nextCrashPercent');validateStoredMarket(state);}
});
it('crash_ordinary_noise_is_twice_the_normal_width_around_the_saved_downward_trend',()=>{
 const cfg=config();cfg.drinks[0].amplitudeCents=100;cfg.parameters.crashMinPercent=10;cfg.parameters.crashMaxPercent=10;
 const draw=(sign:number)=>{const values=[.5,sign,.999];return prepareCrash(cfg.drinks,{bier:1000},cfg.parameters,()=>values.shift()??.5).prices.bier;};
 expect(draw(.1)).toBeLessThan(900);expect(draw(.8)).toBe(1100);
});
it('crash_randomness_stays_in_bounds_has_downward_mean_and_keeps_water_free',()=>{
 const cfg=config();cfg.drinks[0].amplitudeCents=100;cfg.parameters.crashMinPercent=10;cfg.parameters.crashMaxPercent=10;
 const water={...cfg.drinks[0],id:'wasser',name:'Wasser',startCents:0,minCents:0,maxCents:0,averageCents:0,amplitudeCents:0,fixedPriceCents:0};
 let seed=12345;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};let sum=0,min=Infinity,max=-Infinity;
 for(let i=0;i<50000;i++){const prices=prepareCrash([...cfg.drinks,water],{bier:1000,wasser:0},cfg.parameters,rng).prices;expect(prices.wasser).toBe(0);sum+=prices.bier;min=Math.min(min,prices.bier);max=Math.max(max,prices.bier);}
 expect(sum/50000).toBeGreaterThan(895);expect(sum/50000).toBeLessThan(905);expect(min).toBeGreaterThanOrEqual(0);expect(max).toBeLessThanOrEqual(2000);expect(max-min).toBeGreaterThan(400);
});
it('recovery_reuses_the_same_draw_after_reload_instead_of_drawing_again',()=>{
  const cfg=config();cfg.parameters.crashIntroMs=10000;cfg.parameters.crashMinPercent=13;cfg.parameters.crashMaxPercent=13;
  let state=applyCommand(createMarket(cfg,0,midpointRng),{type:'start'},context(0),midpointRng);state=applyCommand(state,{type:'crash'},context(1000),midpointRng);expect(toDisplayState(state).crashPercent).toBe(13);
  state=advanceMarket(state,context(11000),midpointRng);expect(state.prices.bier).toBe(870);expect(state.previews.recovery!.bier).toBe(980);expect(state.activeCrashPercent).toBe(13);
  state=JSON.parse(JSON.stringify(state));validateStoredMarket(state);state=advanceMarket(state,context(301000),()=>.999);expect(toDisplayState(state).crashPercent).toBe(13);state=advanceMarket(state,context(311000),()=>.999);expect(state.prices.bier).toBe(980);expect(state.deadline).toBe(1511000);expect(state.activeCrashPercent).toBeUndefined();
});
it('manual_crash_override_is_preserved_and_does_not_change_the_recovery_percentage',()=>{
  const cfg=config();cfg.parameters.crashIntroMs=10000;let state=createMarket(cfg,0,midpointRng);state=applyCommand(state,{type:'start'},context(0),midpointRng);state=applyCommand(state,{type:'override',scope:'crash',drinkId:'bier',value:700},context(0),midpointRng);state=applyCommand(state,{type:'crash'},context(0),midpointRng);state=advanceMarket(state,context(10000),midpointRng);expect(state.prices.bier).toBe(700);expect(state.previews.recovery!.bier).toBe(770);expect(state.activeCrashPercent).toBe(10);
});
it('invalid_crash_range_is_rejected_and_legacy_parameters_remain_readable',()=>{
  const cfg=config();cfg.parameters.crashMinPercent=16;cfg.parameters.crashMaxPercent=5;expect(()=>createMarket(cfg,0,midpointRng)).toThrow();delete cfg.parameters.crashMinPercent;delete cfg.parameters.crashMaxPercent;validateStoredMarket(createMarket(cfg,0,midpointRng));
});
