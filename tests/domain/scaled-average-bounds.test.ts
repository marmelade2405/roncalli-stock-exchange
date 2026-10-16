import {expect,it} from 'vitest';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {toDisplayState,toAdminState} from '../../src/domain/projections-v2.js';
import {simulatePriceDistribution} from '../../src/domain/price-distribution.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {context} from '../v2-fixtures.js';
const rng=()=>.5;
it('global_average_scales_price_bounds_without_compounding_or_changing_current_quotes',()=>{
 let s=createMarket(createDefaultConfiguration(undefined,rng),0,rng);
 for(const [percent,average,min,max]of [[200,660,330,1650],[-50,110,60,280],[0,220,110,550]]as const){
  s=applyCommand(s,{type:'market-average',percent},context(0),rng);validateStoredMarket(s);
  expect(toDisplayState(s).drinks.find(d=>d.id==='bier')).toMatchObject({averageCents:average,minCents:min,maxCents:max});expect(s.prices.bier).toBe(220);expect(s.prices.wasser).toBe(0);expect(s.drinks.find(d=>d.id==='bier')!.averageCents).toBe(220);
 }
});
it('scaled_quotes_specials_crashes_and_recovery_survive_reloading_and_returning_to_standard',()=>{
 let s=applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'start'},context(0),rng);
 s=applyCommand(s,{type:'market-average',percent:200},context(1),rng);
 s=applyCommand(s,{type:'correct',drinkId:'bier',value:660},context(2),rng);validateStoredMarket(s);
 expect(toAdminState(s).specialPreviews['bier-up'].price).toBeGreaterThan(1400);
 s=applyCommand(s,{type:'crash'},context(1000),rng);const frozen=s.transition!.prices;
 s=applyCommand(s,{type:'market-average',percent:-50},context(2000),rng);expect(s.transition!.prices).toEqual(frozen);validateStoredMarket(s);
 s=advanceMarket(s,context(16000),rng);validateStoredMarket(s);
 s=applyCommand(s,{type:'cancel-crash'},context(17000),rng);validateStoredMarket(s);s=advanceMarket(s,context(27000),rng);validateStoredMarket(s);
 s=applyCommand(s,{type:'market-average',percent:0},context(28000),rng);validateStoredMarket(JSON.parse(JSON.stringify(s)));
});
it('distribution_uses_scaled_bins_and_target_at_both_slider_endpoints',()=>{
 const beer=createDefaultConfiguration(undefined,rng).drinks.find(d=>d.id==='bier')!;
 for(const [percent,target,min,max]of [[200,660,330,1650],[-50,110,60,280]]as const){const result=simulatePriceDistribution(beer,1,percent,25,50);expect(result.bins[0].fromCents).toBe(min);expect(result.bins.at(-1)!.toCents).toBe(max);expect(Math.abs(result.meanCents-target)).toBeLessThan(5);expect(result.bins.reduce((sum,b)=>sum+b.probability,0)).toBeCloseTo(1);}
});
