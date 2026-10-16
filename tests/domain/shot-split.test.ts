import {it,expect} from 'vitest';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {splitShotMarket} from '../../src/domain/split-shots.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {midpointRng} from '../fixtures.js';
const ids=['berentzen','pfeffi','tequila','jaegermeister','ouzo','rum','erdbeerlimes'];
it('each_shot_has_two_own_news_and_can_change_without_changing_other_shots',()=>{
  const c=createDefaultConfiguration(undefined,midpointRng);expect(c.drinks).toHaveLength(20);expect(c.drinks.some(d=>d.id==='shots')).toBe(false);expect(c.specials).toHaveLength(38);for(const id of ids)expect(c.specials.filter(s=>s.drinkId===id)).toHaveLength(2);
  let state=createMarket(c,0,midpointRng);state=applyCommand(state,{type:'start'},{marketNow:0,wallNow:0},midpointRng);state=applyCommand(state,{type:'special',specialId:'berentzen-up'},{marketNow:0,wallNow:0},midpointRng);state=advanceMarket(state,{marketNow:20000,wallNow:20000},midpointRng);expect(state.prices.berentzen).toBe(280);for(const id of ids.filter(id=>id!=='berentzen'))expect(state.prices[id]).toBe(100);expect(state.prices['rum-cola']).toBe(200);
});
it('splitting_legacy_market_preserves_other_prices_and_consumed_news',()=>{
  const c=createDefaultConfiguration(undefined,midpointRng);const oldShot={id:'shots',name:'Shots',category:'Shots',startCents:100,averageCents:100,minCents:40,maxCents:300,amplitudeCents:30,stepCents:10};c.drinks=c.drinks.filter(d=>!ids.includes(d.id));c.drinks.splice(c.drinks.length-1,0,oldShot);
  const legacy=createDefaultConfiguration(c.drinks,midpointRng);let s=createMarket(legacy,0,midpointRng);s=applyCommand(s,{type:'override',scope:'normal',drinkId:'shots',value:120},{marketNow:0,wallNow:0},midpointRng);s=applyCommand(s,{type:'start'},{marketNow:0,wallNow:0},midpointRng);s=advanceMarket(applyCommand(s,{type:'special',specialId:'shots-up'},{marketNow:0,wallNow:0},midpointRng),{marketNow:20000,wallNow:20000},midpointRng);
  const split=splitShotMarket(s,21000,midpointRng);validateStoredMarket(split);expect(split.drinks).toHaveLength(20);expect(split.prices.shots).toBeUndefined();for(const id of ids){expect(split.prices[id]).toBe(280);expect(split.overrides.normal[id]).toBe(120);expect(split.historyByDrink[id]).toHaveLength(1);}expect(split.prices.bier).toBe(s.prices.bier);expect(split.historyByDrink.bier).toEqual(s.historyByDrink.bier);expect(split.deadline).toBe(s.deadline);expect(split.schedule.done.map(x=>x.specialId)).toEqual(['berentzen-up']);expect(split.schedule.pending).toHaveLength(37);expect(splitShotMarket(split,22000,midpointRng)).toEqual(split);
});
