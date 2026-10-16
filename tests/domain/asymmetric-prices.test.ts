import {expect,it} from 'vitest';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
import {randomPrice as engineRandomPrice} from '../../src/domain/prices.js';
import {simulatePriceDistribution} from '../../src/domain/price-distribution.js';
import {DEFAULT_PARAMETERS} from '../../src/domain/parameters.js';
// Preserve explicit absolute widths and individual reversion for legacy coverage.
const randomPrice:typeof engineRandomPrice=(d,c,k,r,p)=>engineRandomPrice(d,c,k,r,{...(p??DEFAULT_PARAMETERS),marketVolatilityPercent:undefined,marketReversionPercent:undefined});
const defaultBeer=DEFAULT_DRINKS.find(d=>d.id==='bier')!,beer={...defaultBeer,startCents:180,averageCents:180,minCents:110,maxCents:500,amplitudeCents:50,reversionPercent:75};
it('halved_defaults_reduce_variance_without_moving_the_price_average',()=>{
  const old=simulatePriceDistribution({...defaultBeer,amplitudeCents:100,reversionPercent:50}),next=simulatePriceDistribution(defaultBeer);
  const variance=(distribution:typeof old)=>distribution.bins.reduce((sum,bin)=>sum+(bin.fromCents-distribution.meanCents)**2*bin.probability,0);
  expect(variance(next)).toBeLessThan(variance(old)*.9);expect(Math.abs(next.meanCents-defaultBeer.averageCents!)).toBeLessThan(2);
});
it('normal_beer_rounds_can_reach_both_bounds_without_a_special',()=>{
  expect(randomPrice(beer,180,'normal',()=>0)).toBe(110);
  expect(randomPrice(beer,180,'normal',()=>.17)).toBe(500);
});
it('ordinary_upward_movements_use_the_larger_space_above_average',()=>{
  const next=(sign:number)=>{let call=0;return randomPrice(beer,180,'normal',()=>call++===0?sign:.999);};
  expect(next(.99)).toBe(260);expect(next(.3)).toBe(160);
});
it('beer_extreme_prices_occur_but_long_run_stays_near_average',()=>{
  const distribution=simulatePriceDistribution(beer),at=(price:number)=>distribution.bins.find(b=>b.fromCents===price)!.probability;
  expect(distribution.meanCents).toBeCloseTo(180,0);
  expect(at(500)).toBeGreaterThan(.02);expect(at(500)).toBeLessThan(.05);
  expect(at(110)).toBeGreaterThan(at(500));
});
it('every_paid_default_drink_reaches_its_maximum_and_stays_near_its_target',()=>{
  for(const drink of DEFAULT_DRINKS.filter(d=>d.minCents!==d.maxCents)){
    const distribution=simulatePriceDistribution(drink);
    expect(distribution.bins.find(b=>b.fromCents===drink.maxCents)!.probability).toBeGreaterThan(.01);
    expect(Math.abs(distribution.meanCents-drink.averageCents!)).toBeLessThan(2);
  }
});
it('zero_noise_keeps_reversion_and_zero_reversion_does_not_trap_at_a_bound',()=>{
  expect(randomPrice({...beer,amplitudeCents:0},500,'normal',()=>.5)).toBe(260);
  expect(randomPrice({...beer,reversionPercent:0},110,'normal',()=>.9)).toBeGreaterThan(110);
  expect(randomPrice({...beer,reversionPercent:0},500,'normal',()=>.4)).toBeLessThan(500);
});
it('crash_and_recovery_still_use_their_configured_trends_and_width',()=>{
  expect(randomPrice(beer,200,'crash',()=>.5)).toBe(180);
  expect(randomPrice(beer,200,'recovery',()=>.5)).toBe(220);
  expect(randomPrice(beer,200,'crash',()=>0)).toBe(110);
});
it('random_source_validation_covers_both_normal_draws',()=>{
  let calls=0;expect(()=>randomPrice(beer,180,'normal',()=>calls++?NaN:.5)).toThrow();
});
it('weak_positive_reversion_with_sub_step_noise_can_leave_the_maximum',()=>{
  const samples=[.5,.5,.99];
  expect(randomPrice({...beer,reversionPercent:1,amplitudeCents:5},500,'normal',()=>samples.shift()!)).toBe(490);
  const distribution=simulatePriceDistribution({...beer,reversionPercent:1,amplitudeCents:5});
  expect(Math.abs(distribution.meanCents-180)).toBeLessThan(10);
  expect(distribution.bins.find(b=>b.fromCents===500)!.probability).toBeLessThan(.1);
});
it('coarse_price_steps_keep_the_average_instead_of_biasing_asymmetric_rounds',()=>{
  const distribution=simulatePriceDistribution({...beer,minCents:100,startCents:200,averageCents:200,stepCents:100});
  expect(Math.abs(distribution.meanCents-200)).toBeLessThan(2);
});
