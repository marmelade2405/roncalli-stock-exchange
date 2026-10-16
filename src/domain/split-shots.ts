import type {MarketState,Rng,PriceMap,SpecialDefinition} from './model.js';
import {SHOT_TYPES} from './defaults.js';
import {createRoncalliSpecialCatalog} from './news-catalog.js';
import {randomPrice} from './prices.js';
import {priceRevealInterval} from './parameters.js';
import {readMarketTime,rebaseClock} from './market-clock.js';
import {DomainError} from './types.js';
import {simulateStartupHistory} from './startup-history.js';
export function splitShotMarket(state:MarketState,wallNow:number,rng:Rng):MarketState{
  const shot=state.drinks.find(d=>d.id==='shots');if(!shot)return state;
  if(SHOT_TYPES.some(([id])=>state.drinks.some(d=>d.id===id)))throw new DomainError('INVALID_INPUT','Einzelne Shot-IDs sind bereits vorhanden; der Markt wird nicht überschrieben.');
  const next=structuredClone(state),brands=SHOT_TYPES.map(([id,name])=>({...shot,id,name,category:'Shots'})),brandIds=new Set(brands.map(d=>d.id));
  const marketNow=state.clock.mode==='simulation'?state.clock.marketAnchor:readMarketTime(state.clock,wallNow);next.revision++;next.runId++;
  next.drinks=next.drinks.flatMap(d=>d.id==='shots'?brands:[d]);
  function remap(map:Record<string,number|null>):Record<string,number|null>{const copy={...map};delete copy.shots;if(Object.hasOwn(map,'shots'))for(const d of brands)copy[d.id]=map.shots;return copy;}
  next.prices=remap(state.prices)as PriceMap;next.previousPrices=remap(state.previousPrices);for(const d of brands)next.previousPrices[d.id]=null;
  for(const scope of['normal','crash']as const)next.overrides[scope]=remap(state.overrides[scope]);
  for(const kind of['normal','crash','recovery']as const)if(state.previews[kind]){next.previews[kind]=remap(state.previews[kind]!)as PriceMap;for(const d of brands)next.previews[kind]![d.id]=randomPrice(d,next.prices[d.id],kind,rng,next.parameters);}
  delete next.historyByDrink.shots;for(const d of brands)next.historyByDrink[d.id]=[{at:marketNow,price:next.prices[d.id],revision:next.revision,kind:'start'}];
  next.history=next.history.map(h=>({...h,prices:remap(h.prices)as PriceMap}));
  const oldNews=new Map(state.specials.filter(s=>s.drinkId==='shots').map(s=>[s.id,s])),newNews=createRoncalliSpecialCatalog(brands),aliases=new Map([...oldNews].map(([id,s])=>[id,s.direction==='up'?'berentzen-up':'pfeffi-down']));
  next.specials=[...next.specials.filter(s=>s.drinkId!=='shots'),...newNews];
  next.specialOrder=state.specialOrder.flatMap(id=>{const old=oldNews.get(id);if(!old)return[id];const alias=aliases.get(id)!;return[alias,...newNews.filter(s=>s.direction===old.direction&&s.id!==alias).map(s=>s.id)];});
  next.schedule.done=next.schedule.done.map(slot=>({...slot,specialId:aliases.get(slot.specialId)??slot.specialId}));const done=new Set(next.schedule.done.map(s=>s.specialId));
  next.schedule.pending=next.specialOrder.filter(id=>!done.has(id)).map((specialId,offsetMs)=>({specialId,offsetMs}));
  if(next.transition){const old=state.transition!;next.transition.prices=remap(old.prices)as PriceMap;if(old.interruptedNormalPreview)next.transition.interruptedNormalPreview=remap(old.interruptedNormalPreview)as PriceMap;
    if(old.specialId&&aliases.has(old.specialId)){const alias=aliases.get(old.specialId)!,definition=next.specials.find(s=>s.id===alias)!,previous=oldNews.get(old.specialId)!;next.transition.specialId=alias;definition.percent=previous.percent;if(previous.targetCents!==undefined)definition.targetCents=previous.targetCents;for(const d of brands)next.transition.prices[d.id]=next.prices[d.id];next.transition.prices[definition.drinkId]=old.prices.shots;}
  }
  next.parameters.priceRevealMs=priceRevealInterval(next.parameters,next.drinks.length);
  delete next.publication;delete next.roundPublication;delete next.quotePublicationOverrides;delete next.quoteRevealUntil;
  next.clock=rebaseClock(state.clock,wallNow,marketNow,{paused:state.clock.mode==='simulation',rate:state.clock.mode==='live'?1:0});
  if(state.startupHistoryByDrink)next.startupHistoryByDrink=simulateStartupHistory(next.drinks,next.parameters,Math.min(...Object.values(next.historyByDrink).map(points=>points[0].at)),next.revision);
  return next;
}
