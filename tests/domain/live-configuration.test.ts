import {expect,it} from 'vitest';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {toAdminState,toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
const rng=()=>.5,t=(at:number)=>({marketNow:at,wallNow:at});
const initial=()=>applyCommand(createMarket(createDefaultConfiguration(DEFAULT_DRINKS,rng),0,rng),{type:'start'},t(0),rng);
const change=(s:ReturnType<typeof initial>,parameters={...s.parameters},drinks=s.drinks,specials=s.specials)=>({type:'configure' as const,drinks,parameters,specials,specialOrder:s.specialOrder});
it('running configuration keeps the clock, prices, history and consumed headlines',()=>{
 let s=applyCommand(initial(),{type:'special',specialId:'bier-up'},t(1000),rng);s=advanceMarket(s,t(s.deadline!),rng);
 const next=applyCommand(s,change(s,{...s.parameters,normalMs:900000,crashCostCents:1700}),t(26000),rng);
 for(const key of ['phase','prices','previousPrices','historyByDrink','history','schedule','clock','deadline','runId','overrides','previews']as const)expect(next[key]).toEqual(s[key]);expect(next.parameters.normalMs).toBe(900000);validateStoredMarket(next);
});
it('reduced price bands keep historical and published values but constrain future forecasts',()=>{
 let s=applyCommand(initial(),{type:'correct',drinkId:'bier',value:550},t(1000),rng);s=applyCommand(s,{type:'override',scope:'normal',drinkId:'bier',value:500},t(1100),rng);
 const next=applyCommand(s,change(s,s.parameters,s.drinks.map(d=>d.id==='bier'?{...d,averageCents:100,startCents:100,minCents:50,maxCents:250,amplitudeCents:25}:d)),t(1200),rng);
 expect(next.prices.bier).toBe(550);expect(next.historyByDrink.bier).toEqual(s.historyByDrink.bier);expect(next.previews.normal!.bier).toBeLessThanOrEqual(250);expect(next.overrides.normal.bier).toBe(250);validateStoredMarket(next);
 const published=advanceMarket(next,t(next.deadline!),rng);expect(published.prices.bier).toBe(250);validateStoredMarket(published);
});
it('news edits retain the active message, price and animation timings',()=>{
 const s=applyCommand(initial(),{type:'special',specialId:'bier-down'},t(1000),rng),before=toDisplayState(s);
 const next=applyCommand(s,change(s,{...s.parameters,newsMs:50000,newsIntroMs:5000},s.drinks,s.specials.map(n=>n.id==='bier-down'?{...n,headline:'Neue Meldung'}:n)),t(2000),rng);
 expect(next.deadline).toBe(s.deadline);expect(next.transition!.prices).toEqual(s.transition!.prices);expect(toDisplayState(next).news!.headline).toBe(before.news!.headline);expect(toAdminState(next).parameters.newsMs).toBe(50000);expect(toDisplayState(next).eventParameters?.newsMs).toBe(25000);validateStoredMarket(next);const published=advanceMarket(next,t(next.deadline!),rng);expect(toDisplayState(published).recentNews!.headline).toBe(before.news!.headline);validateStoredMarket(published);
});
it('new round duration applies after publication without moving the running deadline',()=>{
 const s=initial(),next=applyCommand(s,change(s,{...s.parameters,normalMs:900000}),t(1000),rng);expect(next.deadline).toBe(1200000);expect(advanceMarket(next,t(1200000),rng).deadline).toBe(2100000);
});
it('crash already in progress keeps its planned duration and frozen price',()=>{
 const s=applyCommand(initial(),{type:'crash'},t(1000),rng),next=applyCommand(s,change(s,{...s.parameters,crashMs:120000,crashIntroMs:30000}),t(2000),rng);
 expect(next.deadline).toBe(s.deadline);expect(next.transition!.prices).toEqual(s.transition!.prices);const crashed=advanceMarket(next,t(s.deadline!),rng);expect(crashed.deadline).toBe(s.deadline!+300000);validateStoredMarket(crashed);
});
it('normal intro retains its duration and prices across live changes',()=>{
 const s=advanceMarket(initial(),t(1190000),rng),next=applyCommand(s,change(s,{...s.parameters,transitionMs:30000,normalMs:900000}),t(1195000),rng);expect(next.deadline).toBe(s.deadline);expect(next.transition!.prices).toEqual(s.transition!.prices);expect(toDisplayState(next).eventParameters?.transitionMs).toBe(10000);validateStoredMarket(next);
});
it('current animation boundary stays fixed when the next animation length changes',()=>{
 const s=initial(),next=applyCommand(s,change(s,{...s.parameters,transitionMs:60000}),t(1000),rng);expect(toDisplayState(next).hideAt).toBe(1190000);const intro=advanceMarket(next,t(1190000),rng);expect(toDisplayState(intro).eventParameters!.transitionMs).toBe(10000);const published=advanceMarket(intro,t(1200000),rng);expect(toDisplayState(published).hideAt).toBe(published.deadline!-60000);validateStoredMarket(published);
});
it('live history size fills the larger window without rewriting real history',()=>{
 const s=initial(),next=applyCommand(s,change(s,{...s.parameters,historyChanges:49}),t(1000),rng);expect(next.historyByDrink).toEqual(s.historyByDrink);expect(next.startupHistoryByDrink!.bier).toHaveLength(50);validateStoredMarket(next);
});
