import {expect,it} from 'vitest';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
import {harmonizePriceBands} from '../../src/domain/price-bands.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand} from '../../src/domain/market-v2.js';
it('updated_barteam_averages_apply_to_beer_aperol_all_shots_and_soft_drinks',()=>{
 expect(DEFAULT_DRINKS.find(d=>d.id==='bier')).toMatchObject({averageCents:220,minCents:110,maxCents:550});expect(DEFAULT_DRINKS.find(d=>d.id==='aperol')).toMatchObject({averageCents:400,minCents:200,maxCents:1000});
 for(const d of DEFAULT_DRINKS.filter(d=>d.category==='Shots'))expect(d).toMatchObject({averageCents:100,minCents:50,maxCents:250});
 for(const d of DEFAULT_DRINKS.filter(d=>d.category==='Alkoholfrei'))expect(d).toMatchObject({averageCents:200,minCents:100,maxCents:500});
 expect(DEFAULT_DRINKS.find(d=>d.id==='wasser')!.fixedPriceCents).toBe(0);
});
it('wine_and_four_standard_mixed_drinks_share_the_exact_three_fifty_average',()=>{
 for(const id of ['wein','gin-tonic','wodka-energy','rum-cola','lillet-wildberry'])expect(DEFAULT_DRINKS.find(d=>d.id===id)).toMatchObject({averageCents:350,startCents:350,minCents:180,maxCents:880,amplitudeCents:88});
});
it('paid_drinks_use_raised_defaults_and_shared_fifty_to_two_fifty_percent_bounds',()=>{
 for(const drink of DEFAULT_DRINKS.filter(d=>d.fixedPriceCents===undefined)){
  const average=drink.averageCents!;expect(Math.abs(drink.minCents-average*.5)).toBeLessThanOrEqual(5);expect(Math.abs(drink.maxCents-average*2.5)).toBeLessThanOrEqual(5);expect(Math.abs(drink.amplitudeCents/average-.25)).toBeLessThan(.006);
 }
 expect(DEFAULT_DRINKS.find(d=>d.id==='bier')).toMatchObject({averageCents:220,startCents:220,minCents:110,maxCents:550,amplitudeCents:55});expect(DEFAULT_DRINKS.find(d=>d.id==='aperol')).toMatchObject({averageCents:400,minCents:200,maxCents:1000,amplitudeCents:100});expect(DEFAULT_DRINKS.find(d=>d.id==='pfeffi')).toMatchObject({averageCents:100,minCents:50,maxCents:250,amplitudeCents:25});expect(DEFAULT_DRINKS.find(d=>d.id==='wasser')).toMatchObject({averageCents:0,minCents:0,maxCents:0,amplitudeCents:0,fixedPriceCents:0});
});
it('configured_prices_are_derived_from_average_and_factory_defaults_do_not_compound',()=>{
 const rng=()=>.5,config=createDefaultConfiguration(undefined,rng),state=createMarket(config,0,rng);
 const changed=applyCommand(state,{type:'configure',drinks:config.drinks.map(d=>d.id==='bier'?{...d,averageCents:250,startCents:220,minCents:100,maxCents:1000,amplitudeCents:999,reversionPercent:90}:d)},{wallNow:0,marketNow:0},rng);
 expect(changed.drinks.find(d=>d.id==='bier')).toMatchObject({averageCents:250,startCents:250,minCents:130,maxCents:630,amplitudeCents:63,reversionPercent:50,stepCents:10});expect(config.drinks.find(d=>d.id==='bier')!.averageCents).toBe(220);expect(createDefaultConfiguration(undefined,rng).drinks.find(d=>d.id==='bier')!.averageCents).toBe(220);expect(harmonizePriceBands(config.drinks).find(d=>d.id==='bier')!.averageCents).toBe(220);
});
