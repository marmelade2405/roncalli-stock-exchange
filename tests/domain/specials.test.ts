import { expect, it } from 'vitest';
import { previewSpecial } from '../../src/domain/specials.js';
import { makeDrink } from '../fixtures.js';
import { createSpecialCatalog } from '../../src/domain/news-catalog.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
it('absolute_extreme_targets_move_further_when_already_inside_the_extreme_band', () => {
  const drink = makeDrink(); const [down,up] = createSpecialCatalog([drink]);
  expect(previewSpecial(drink,200,down)).toMatchObject({ price:120,delta:-80,percent:-40,limited:false });
  expect(previewSpecial(drink,200,up)).toMatchObject({ price:280,delta:80,percent:40,limited:false });
  expect(previewSpecial(drink,300,up)).toMatchObject({ price:300,delta:0,limited:true });
  expect(previewSpecial(drink,210,up).price).toBe(280);expect(previewSpecial(drink,290,up).price).toBe(300);
  expect(previewSpecial(drink,100,down)).toMatchObject({ price:100,delta:0,limited:true });
});
it('legacy_percent_metadata_no_longer_controls_the_price_target',()=>{
 const drink=makeDrink(),[down,up]=createSpecialCatalog([drink]);
 for(const percent of [1,40,200])expect(previewSpecial(drink,200,{...up,percent}).price).toBe(280);
 for(const percent of [-1,-40,-90])expect(previewSpecial(drink,200,{...down,percent}).price).toBe(120);
});
it('every_non_fixed_news_result_lands_in_its_outer_ten_percent_on_the_price_grid',()=>{
 const config=createDefaultConfiguration(undefined,()=>.5);
 for(const special of config.specials.filter(s=>s.targetCents===undefined)){
  const drink=config.drinks.find(d=>d.id===special.drinkId)!,span=drink.maxCents-drink.minCents;
  for(let current=drink.minCents;current<=drink.maxCents;current+=drink.stepCents){
   const preview=previewSpecial(drink,current,special);expect(preview.price%drink.stepCents).toBe(0);expect(preview.price).toBeGreaterThanOrEqual(drink.minCents);expect(preview.price).toBeLessThanOrEqual(drink.maxCents);
   if(special.direction==='up'){expect(preview.price).toBeGreaterThanOrEqual(drink.minCents+span*.9);expect(preview.delta)[current<drink.maxCents?'toBeGreaterThan':'toBe'](0);}else{expect(preview.price).toBeLessThanOrEqual(drink.minCents+span*.1);expect(preview.delta)[current>drink.minCents?'toBeLessThan':'toBe'](0);}
  }
 }
});
it('awkward_band_boundaries_round_inwards_and_a_single_step_range_uses_its_endpoints',()=>{
 const beer=makeDrink({minCents:110,maxCents:500,startCents:180}),[down,up]=createSpecialCatalog([beer]);
 expect(previewSpecial(beer,110,{...up,percent:1}).price).toBe(470);expect(previewSpecial(beer,500,{...down,percent:-1}).price).toBe(140);
 const coarse=makeDrink({minCents:100,maxCents:200,startCents:100,stepCents:100});expect(previewSpecial(coarse,100,up).price).toBe(200);expect(previewSpecial(coarse,200,down).price).toBe(100);
});
it('lillet_at_two_fifty_drops_again_and_fixed_beer_offers_do_not_stall',()=>{
 const c=createDefaultConfiguration(undefined,()=>.5),lillet=c.drinks.find(d=>d.id==='lillet-wildberry')!,news=c.specials.find(n=>n.drinkId===lillet.id&&n.direction==='down')!;expect(previewSpecial(lillet,250,news)).toMatchObject({price:210,delta:-40,percent:-16});const beer=c.drinks.find(d=>d.id==='bier')!,offer=c.specials.find(n=>n.id==='bier-down')!;expect(previewSpecial(beer,140,offer)).toMatchObject({price:120,delta:-20});expect(previewSpecial(beer,150,offer)).toMatchObject({price:130,delta:-20});
});
