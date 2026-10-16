import {expect,it} from 'vitest';
import {createDefaultConfiguration,validateConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {randomPrice} from '../../src/domain/prices.js';
import {simulatePriceDistribution} from '../../src/domain/price-distribution.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {createSpecialCatalog} from '../../src/domain/news-catalog.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {makeDrink,midpointRng as rng} from '../fixtures.js';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
const context=(at:number)=>({wallNow:at,marketNow:at});
const drink=()=>makeDrink({startCents:1000,averageCents:1000,minCents:500,maxCents:2000,amplitudeCents:250,reversionPercent:50});
const config=()=>{const c=createDefaultConfiguration([drink(),{...drink(),id:'wasser',name:'Wasser',startCents:0,averageCents:0,minCents:0,maxCents:0,amplitudeCents:0,fixedPriceCents:0}],rng);c.parameters.marketVolatility=0;c.specials=createSpecialCatalog(c.drinks);c.specialOrder=c.specials.map(s=>s.id);return c;};
it('global_average_changes_the_target_from_its_standard_without_compounding',()=>{
 const c=config();expect(randomPrice(drink(),1000,'normal',rng,{...c.parameters,marketAveragePercent:10})).toBe(1050);expect(randomPrice(drink(),1000,'normal',rng,{...c.parameters,marketAveragePercent:-10})).toBe(950);
 let s=createMarket(c,0,rng);s=applyCommand(s,{type:'market-average',percent:10},context(0),rng);expect(toDisplayState(s).drinks[0].averageCents).toBe(1100);s=applyCommand(s,{type:'market-average',percent:5},context(1),rng);expect(toDisplayState(s).drinks[0].averageCents).toBe(1050);expect(s.drinks[0].averageCents).toBe(1000);expect(s.prices.wasser).toBe(0);validateStoredMarket(s);
});
it('live_average_refreshes_normal_previews_but_preserves_prices_history_overrides_and_event_forecasts',()=>{
 let s=applyCommand(createMarket(config(),0,rng),{type:'start'},context(0),rng);s=applyCommand(s,{type:'override',scope:'normal',drinkId:'bier',value:1120},context(100),rng);const changed=applyCommand(s,{type:'market-average',percent:10},context(1000),rng);expect(changed.previews.normal!.bier).toBe(1050);
 for(const key of ['prices','previousPrices','history','historyByDrink','deadline','overrides','schedule','specials','drinks']as const)expect(changed[key]).toEqual(s[key]);expect(changed.previews.crash).toEqual(s.previews.crash);expect(changed.nextCrashPercent).toBe(s.nextCrashPercent);validateStoredMarket(changed);
});
it.each(['normal','special','crash','recovery']as const)('average_change_preserves_frozen_%s_prices',kind=>{
 let s=applyCommand(createMarket(config(),0,rng),{type:'start'},context(0),rng),at=1000;
 if(kind==='normal'){at=1190000;s=advanceMarket(s,context(at),rng);}else if(kind==='special')s=applyCommand(s,{type:'special',specialId:'bier-up'},context(at),rng);else{s=applyCommand(s,{type:'crash'},context(at),rng);if(kind==='recovery'){s=advanceMarket(s,context(16000),rng);at=17000;s=applyCommand(s,{type:'cancel-crash'},context(at),rng);}}
 const changed=applyCommand(s,{type:'market-average',percent:-10},context(at+100),rng);expect(changed.transition!.prices).toEqual(s.transition!.prices);expect(changed.deadline).toBe(s.deadline);validateStoredMarket(changed);
});
it('average_range_and_legacy_defaults_are_validated_and_noop_does_not_redraw',()=>{
 const c=config();const s=createMarket(c,0,rng);for(const percent of [-51,201,.5,NaN,Infinity])expect(()=>applyCommand(s,{type:'market-average',percent},context(0),rng)).toThrow();for(const percent of [-50,-10,0,10,200])validateStoredMarket(applyCommand(s,{type:'market-average',percent},context(0),rng));expect(applyCommand(s,{type:'market-average',percent:0},context(0),()=>{throw Error('RNG should not run');})).toBe(s);delete c.parameters.marketAveragePercent;expect(()=>validateConfiguration(c)).not.toThrow();
});
it('simulated_distribution_uses_the_shifted_average_and_fixed_water_stays_free',()=>{
 const shifted=simulatePriceDistribution(drink(),0,10);expect(shifted.meanCents).toBeCloseTo(1100,0);expect(simulatePriceDistribution(config().drinks[1],3,-10).meanCents).toBe(0);
});
it.each([-10,10])('noisy_harmonized_drinks_remain_centred_on_the_shifted_standard_%s',percent=>{
 for(const drink of DEFAULT_DRINKS.filter(d=>d.fixedPriceCents===undefined)){const distribution=simulatePriceDistribution(drink,1,percent);expect(Math.abs(distribution.meanCents-Math.round(drink.averageCents!*(1+percent/100)))).toBeLessThan(2);}
});
