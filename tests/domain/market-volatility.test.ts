import {expect,it} from 'vitest';
import {createDefaultConfiguration,validateConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {normalPriceProfile,randomPrice} from '../../src/domain/prices.js';
import {crashPrices} from '../../src/domain/crash-prices.js';
import {toAdminState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {makeDrink,midpointRng} from '../fixtures.js';
import {context} from '../v2-fixtures.js';
const drink=()=>makeDrink({startCents:1000,averageCents:1000,minCents:0,maxCents:2000,amplitudeCents:100,reversionPercent:50});
// These regression cases exercise the legacy factor/absolute-basis protocol.
const config=()=>{const c=createDefaultConfiguration([drink(),{...drink(),id:'wasser',name:'Wasser',startCents:0,averageCents:0,minCents:0,maxCents:0,amplitudeCents:0,fixedPriceCents:0}],midpointRng);delete c.parameters.marketVolatilityPercent;return c;};
it('global_volatility_scales_normal_noise_and_outliers_while_zero_keeps_average_reversion',()=>{
 expect(normalPriceProfile(drink(),1000,.5)).toMatchObject({downCents:50,upCents:50,outlierProbability:.0125});expect(normalPriceProfile(drink(),1000,0)).toMatchObject({downCents:0,upCents:0,outlierProbability:0});
 const p={...config().parameters,marketVolatility:0};expect(randomPrice(drink(),1400,'normal',()=>.75,p)).toBe(1200);
});
it('crash_noise_is_always_double_even_if_legacy_crash_factor_was_changed',()=>{
 const p={...config().parameters,marketVolatility:.5,crashAmplitudeFactor:5};expect(crashPrices([drink()],{bier:1000},10,p,()=>.75).bier).toBe(950);expect(crashPrices([drink()],{bier:1000},10,{...p,crashAmplitudeFactor:1},()=>.75).bier).toBe(950);
});
it('live_volatility_refreshes_future_quotes_and_keeps_overrides_prices_history_timer_and_crash_trend',()=>{
 let s=applyCommand(createMarket(config(),0,midpointRng),{type:'start'},context(0),midpointRng);s=applyCommand(s,{type:'override',scope:'normal',drinkId:'bier',value:1100},context(100),midpointRng);const changed=applyCommand(s,{type:'market-volatility',factor:.5},context(1000),()=>.75);
 expect(changed.parameters.marketVolatility).toBe(.5);expect(changed.parameters.crashAmplitudeFactor).toBe(2);expect(changed.previews.normal!.bier).toBe(1020);expect(changed.previews.crash!.bier).toBe(950);expect(changed.previews.normal!.wasser).toBe(0);expect(changed.nextCrashPercent).toBe(s.nextCrashPercent);
 for(const key of ['prices','previousPrices','history','historyByDrink','deadline','overrides','schedule','specials']as const)expect(changed[key]).toEqual(s[key]);expect(toAdminState(changed).specialPreviews).toEqual(toAdminState(s).specialPreviews);validateStoredMarket(changed);
});
it.each(['normal','special','crash','recovery']as const)('changing_volatility_keeps_frozen_%s_publication_prices',kind=>{
 let s=applyCommand(createMarket(config(),0,midpointRng),{type:'start'},context(0),midpointRng),at=1000;
 if(kind==='normal'){at=1190000;s=advanceMarket(s,context(at),midpointRng);}else if(kind==='special')s=applyCommand(s,{type:'special',specialId:'bier-up'},context(at),midpointRng);else{s=applyCommand(s,{type:'crash'},context(at),midpointRng);if(kind==='recovery'){s=advanceMarket(s,context(16000),midpointRng);at=17000;s=applyCommand(s,{type:'cancel-crash'},context(at),midpointRng);}}
 const changed=applyCommand(s,{type:'market-volatility',factor:0},context(at+100),()=>.75);expect(changed.transition!.prices).toEqual(s.transition!.prices);expect(changed.deadline).toBe(s.deadline);expect(changed.overrides).toEqual(s.overrides);expect(advanceMarket(changed,context(changed.deadline!),midpointRng).prices).toEqual(s.transition!.prices);validateStoredMarket(changed);
});
it('crash_intro_cancellation_uses_the_new_volatility_for_its_interrupted_normal_preview',()=>{
 let s=applyCommand(createMarket(config(),0,()=>.75),{type:'start'},context(0),midpointRng);s=applyCommand(s,{type:'crash'},context(1000),midpointRng);const changed=applyCommand(s,{type:'market-volatility',factor:0},context(1100),midpointRng),cancelled=applyCommand(changed,{type:'cancel-crash'},context(1200),midpointRng);expect(cancelled.previews.normal!.bier).toBe(1000);expect(cancelled.previews.crash!.bier).toBe(870);expect(changed.transition!.prices).toEqual(s.transition!.prices);
});
it('locked_normal_preview_is_not_replaced_and_legacy_parameters_load_at_one',()=>{
 const c=config();delete c.parameters.marketVolatility;expect(()=>validateConfiguration(c)).not.toThrow();const s=applyCommand(createMarket(c,0,midpointRng),{type:'start'},context(0),midpointRng),changed=applyCommand(s,{type:'market-volatility',factor:2},context(1195000),()=>.75);expect(changed.previews.normal).toEqual(s.previews.normal);validateStoredMarket(changed);
});
it('zero_volatility_never_changes_breaking_news_or_fixed_prices',()=>{
 const c=config();c.parameters.marketVolatility=0;const s=applyCommand(createMarket(c,0,midpointRng),{type:'start'},context(0),midpointRng),special=applyCommand(s,{type:'special',specialId:'bier-up'},context(1000),midpointRng);expect(special.transition!.prices.bier).toBe(1800);expect(special.transition!.prices.wasser).toBe(0);
});
it('legacy_random_recovery_refreshes_with_volatility_until_its_prices_are_frozen',()=>{
 const c=config();delete c.parameters.crashMinPercent;delete c.parameters.crashMaxPercent;let s=applyCommand(createMarket(c,0,()=>.75),{type:'start'},context(0),()=>.75);s=applyCommand(s,{type:'crash'},context(1000),()=>.75);s=advanceMarket(s,context(16000),()=>.75);expect(s.prices.bier).toBe(1000);expect(s.previews.recovery!.bier).toBe(1150);
 const changed=applyCommand(s,{type:'market-volatility',factor:0},context(17000),()=>.75);expect(changed.previews.recovery!.bier).toBe(1100);expect(changed.prices).toEqual(s.prices);expect(changed.deadline).toBe(s.deadline);const frozen=applyCommand(s,{type:'cancel-crash'},context(17000),()=>.75),adjusted=applyCommand(frozen,{type:'market-volatility',factor:0},context(17100),()=>.75);expect(adjusted.transition!.prices.bier).toBe(1150);validateStoredMarket(changed);
});
it('volatility_range_rejects_invalid_steps_and_accepts_bounds_with_noop_repeats',()=>{
 const s=createMarket(config(),0,midpointRng);for(const factor of [-.05,3.05,.123,NaN,Infinity])expect(()=>applyCommand(s,{type:'market-volatility',factor},context(0),midpointRng)).toThrow();for(const factor of [0,.05,1.25,3])validateStoredMarket(applyCommand(s,{type:'market-volatility',factor},context(0),midpointRng));expect(applyCommand(s,{type:'market-volatility',factor:1},context(0),()=>{throw Error('RNG should not run');})).toBe(s);
});
