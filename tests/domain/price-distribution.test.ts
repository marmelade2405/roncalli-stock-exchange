import {expect,it} from 'vitest';
import {simulatePriceDistribution} from '../../src/domain/price-distribution.js';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
const beer={...DEFAULT_DRINKS.find(d=>d.id==='bier')!,startCents:180,averageCents:180,minCents:110,maxCents:500,amplitudeCents:50,reversionPercent:75};
it('live_global_zero_volatility_preserves_average_reversion_without_random_motion',()=>{
  const distribution=simulatePriceDistribution({...beer,startCents:400,averageCents:250,reversionPercent:100},0);
  expect(distribution.meanCents).toBe(250);expect(distribution.bins.find(b=>b.fromCents===250)?.probability).toBe(1);
});
it('global_volatility_changes_distribution_and_validates_the_same_live_range',()=>{
  expect(simulatePriceDistribution(beer,2).bins).not.toEqual(simulatePriceDistribution(beer,1).bins);
  for(const factor of[-1,3.05,.01,NaN,Infinity])expect(()=>simulatePriceDistribution(beer,factor)).toThrow();
  expect(simulatePriceDistribution(DEFAULT_DRINKS.find(d=>d.id==='wasser')!,3).bins).toEqual([{fromCents:0,toCents:0,probability:1}]);
});
it('normal_beer_distribution_matches_mean_reversion_and_balanced_spikes',()=>{
  const distribution=simulatePriceDistribution(beer);
  expect(distribution.meanCents).toBeCloseTo(180,0);
  const share=(price:number)=>distribution.bins.find(b=>b.fromCents===price)!.probability;
  expect(share(180)).toBeGreaterThan(.10);
  expect(share(500)).toBeGreaterThan(.02);expect(share(500)).toBeLessThan(.05);
  expect(distribution.bins.reduce((sum,b)=>sum+b.probability,0)).toBeCloseTo(1,10);
});
it('full_reversion_without_noise_concentrates_on_the_draft_average',()=>{
  const distribution=simulatePriceDistribution({...beer,averageCents:250,reversionPercent:100,amplitudeCents:0});
  expect(distribution.meanCents).toBe(250);expect(distribution.bins.find(b=>b.fromCents===250)?.probability).toBe(1);
});
it('zero_reversion_without_noise_retains_start_instead_of_claiming_average',()=>{
  const distribution=simulatePriceDistribution({...beer,startCents:400,averageCents:180,reversionPercent:0,amplitudeCents:0});
  expect(distribution.meanCents).toBe(400);expect(distribution.bins.find(b=>b.fromCents===400)?.probability).toBe(1);
});
it('fixed_water_has_a_single_zero_price',()=>{
  const distribution=simulatePriceDistribution(DEFAULT_DRINKS.find(d=>d.id==='wasser')!);
  expect(distribution.meanCents).toBe(0);expect(distribution.bins).toEqual([{fromCents:0,toCents:0,probability:1}]);
});
it('rounded_symmetric_bounds_balance_low_and_high_extremes',()=>{
  const distribution=simulatePriceDistribution({...beer,minCents:170,maxCents:190,startCents:180,averageCents:180,reversionPercent:100,amplitudeCents:10});
  // 25% endpoint events; 75% uniform [-10,+10], rounded to 10.
  for(const [price,probability]of [[170,.3125],[180,.375],[190,.3125]])expect(distribution.bins.find(b=>b.fromCents===price)!.probability).toBeCloseTo(probability,2);
  expect(distribution.meanCents).toBeCloseTo(180,0);
});
it('distribution_is_repeatable_and_rejects_invalid_drafts',()=>{
  expect(simulatePriceDistribution(beer)).toEqual(simulatePriceDistribution(beer));
  expect(()=>simulatePriceDistribution({...beer,stepCents:0})).toThrow();
});
it('wide_price_ranges_use_bounded_histogram_bins_without_losing_samples',()=>{
  const distribution=simulatePriceDistribution({...beer,maxCents:1000000,stepCents:1});
  expect(distribution.bins.length).toBeLessThanOrEqual(200);expect(distribution.binStepCents).toBeGreaterThan(1);
  expect(distribution.bins.reduce((sum,b)=>sum+b.probability,0)).toBeCloseTo(1,10);
});
