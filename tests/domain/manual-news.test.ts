import {it,expect} from 'vitest';
import {createDefaultConfiguration,validateConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket,nextBoundary} from '../../src/domain/market-v2.js';
import {previewSpecial} from '../../src/domain/specials.js';
import {toDisplayState,toAdminState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
const rng=()=>.5,context=(at:number)=>({wallNow:at,marketNow:at});
it('an_already_prepared_special_keeps_its_exact_price_in_admin_preview_and_publication',()=>{
 const config=createDefaultConfiguration(undefined,rng);let state=applyCommand(createMarket(config,0,rng),{type:'start'},context(0),rng);
 state=applyCommand(state,{type:'special',specialId:'wein-up'},context(0),rng);state.transition!.prices.wein=600;validateStoredMarket(state);
 expect(toAdminState(state).specialPreviews['wein-up'].price).toBe(600);expect(advanceMarket(state,context(30000),rng).prices.wein).toBe(600);
});
it('legacy_planned_slots_never_trigger_automatically_or_become_simulation_boundaries',()=>{
  let state=createMarket(createDefaultConfiguration(undefined,rng),0,rng);state.schedule.pending.forEach((slot,i)=>slot.offsetMs=(i+1)*300000);validateStoredMarket(state);
  state=applyCommand(state,{type:'simulation',enabled:true,speed:120},context(0),rng);
  state=applyCommand(state,{type:'start'},context(0),rng);expect(nextBoundary(state)).toBe(1190000);
  const later=advanceMarket(state,context(300000),rng);expect(later.phase).toBe('normal');expect(later.schedule.done).toHaveLength(0);expect(later.prices).toEqual(state.prices);
  const stepped=applyCommand(later,{type:'step'},context(300000),rng);expect(stepped.transition?.kind).toBe('normal');expect(stepped.clock.marketAnchor).toBe(1190000);expect(stepped.schedule.done).toHaveLength(0);
});
it('bene_keeps_cheaper_beer_in_preview_announcement_and_publication_and_runs_only_once',()=>{
  const config=createDefaultConfiguration(undefined,rng);const bier=config.drinks.find(d=>d.id==='bier')!,special=config.specials.find(s=>s.id==='bier-down')!;
  for(const [current,price,delta,limited] of [[110,110,0,true],[140,140,0,true],[150,150,0,false],[180,150,-30,false],[500,150,-350,false]] as const)expect(previewSpecial(bier,current,special)).toMatchObject({price,delta,limited});
  let state=createMarket(config,0,rng);state=applyCommand(state,{type:'correct',drinkId:'bier',value:110},context(0),rng);state=applyCommand(state,{type:'start'},context(0),rng);
  const intro=applyCommand(state,{type:'special',specialId:'bier-down'},context(0),rng);expect(toAdminState(intro).specialPreviews['bier-down']).toMatchObject({price:110,delta:0,percent:0,limited:true});expect(toDisplayState(intro).news).toMatchObject({direction:'down',quote:{priceCents:110,deltaCents:0,percent:0}});
  const published=advanceMarket(intro,context(30000),rng);expect(published.prices.bier).toBe(110);expect(published.prices.wein).toBe(state.prices.wein);expect(published.historyByDrink.bier).toEqual(state.historyByDrink.bier);expect(toDisplayState(published).recentNews?.direction).toBe('down');expect(()=>applyCommand(published,{type:'special',specialId:'bier-down'},context(31000),rng)).toThrow();
});
it('hesham_effect_reaches_the_upper_extreme_band_with_existing_price_bounds',()=>{
  const c=createDefaultConfiguration(undefined,rng),drink=c.drinks.find(d=>d.id==='wein')!,special=c.specials.find(s=>s.id==='wein-up')!;
  expect(previewSpecial(drink,300,special).price).toBe(810);expect(previewSpecial(drink,500,special).price).toBe(810);expect(previewSpecial(drink,850,special).price).toBe(850);
});
it('invalid_fixed_special_prices_are_rejected_before_publication',()=>{
  for(const targetCents of [NaN,null,'150',155,100,560,-1]){const c=createDefaultConfiguration(undefined,rng);Object.assign(c.specials.find(s=>s.id==='bier-down')!,{targetCents});expect(()=>validateConfiguration(c)).toThrow();}
});
it('published_fixed_price_direction_survives_history_trimming_and_reload',()=>{
  let state=createMarket(createDefaultConfiguration(undefined,rng),0,rng);state=applyCommand(state,{type:'correct',drinkId:'bier',value:110},context(0),rng);state=applyCommand(state,{type:'start'},context(0),rng);state=advanceMarket(applyCommand(state,{type:'special',specialId:'bier-down'},context(0),rng),context(30000),rng);
  expect(toDisplayState(state).recentNews?.direction).toBe('down');
  for(let i=0;i<50;i++)state=applyCommand(state,{type:'correct',drinkId:'bier',value:i%2?170:160},context(31000+i),rng);
  state=JSON.parse(JSON.stringify(state));validateStoredMarket(state);expect(toDisplayState(state).recentNews?.direction).toBe('down');
});
