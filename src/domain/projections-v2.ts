import type { MarketState, DisplayState, AdminState } from './model.js';
import { visibleHistory } from './history.js';
import { nextBoundary } from './market-v2.js';
import {averageTargetCents} from './prices.js';
import { previewSpecial } from './specials.js';
import {crashIntroDuration,newsIntroDuration,priceRevealInterval} from './parameters.js';
export function toDisplayState(s: MarketState): DisplayState {
  const special=s.transition?.kind === 'special' ? s.specials.find(x => x.id === s.transition!.specialId)! : null;
  const quote=special?{priceCents:s.transition!.prices[special.drinkId],deltaCents:s.transition!.prices[special.drinkId]-s.prices[special.drinkId],percent:s.prices[special.drinkId]===0?(s.transition!.prices[special.drinkId]===0?0:null):(s.transition!.prices[special.drinkId]-s.prices[special.drinkId])/s.prices[special.drinkId]*100}:undefined;
  const nextKind=s.transition?.kind ?? (s.phase === 'crash' ? 'recovery' : s.phase === 'normal' ? 'normal' : null);
  const nextNormalAt=s.phase === 'normal' ? s.deadline : s.transition?.kind === 'normal' ? s.deadline : s.transition?.kind === 'special' ? s.transition.normalDeadline : null;
  const lastRound=s.history.findLast(h=>h.kind!=='correction'),lastDone=s.schedule.done.at(-1);
  const recent=s.phase==='normal'&&lastRound?.kind==='special'&&lastDone?.publishedAt===lastRound.publishedAt?s.specials.find(x=>x.id===lastDone.specialId):null;
  const points=recent?s.historyByDrink[recent.drinkId]:[],pointIndex=points.findIndex(p=>p.revision===lastRound?.revision);
  const recentDirection=lastDone?.direction??(recent?.targetCents!==undefined&&pointIndex>0?(points[pointIndex].price>points[pointIndex-1].price?'up':'down'):recent?.direction);
  return {
    chartMode:s.chartMode??'bars-gap',tickerColumns:s.tickerColumns??3,
    ...(s.startupHistoryByDrink?{startupHistoryByDrink:structuredClone(s.startupHistoryByDrink)}:{}),
    ...(s.tickerWallAt===undefined?{}:{tickerWallAt:s.tickerWallAt}),
    ...(s.tickerOffsetRows===undefined?{}:{tickerOffsetRows:s.tickerOffsetRows}),...((s.phase==='crash'||s.transition?.kind==='crash'||s.transition?.kind==='recovery')&&s.activeCrashPercent!==undefined?{crashPercent:s.activeCrashPercent}:{}),
    ...(s.publication?{publication:structuredClone(s.publication)}:{}),
    ...(s.roundPublication?{roundPublication:structuredClone(s.roundPublication)}:{}),...(s.quotePublicationOverrides?{quotePublicationOverrides:structuredClone(s.quotePublicationOverrides)}:{}),
    revision:s.revision,runId:s.runId,phase:s.phase,drinks:s.drinks.map(drink=>({id:drink.id,name:drink.name,category:drink.category,minCents:drink.minCents,maxCents:drink.maxCents,averageCents:averageTargetCents(drink,s.parameters.marketAveragePercent??0)})),prices:{...s.prices},previousPrices:{...s.previousPrices},
    deadline:s.deadline,nextKind,nextNormalAt,hideAt:s.phase === 'transition' ? s.publishedAt : s.deadline===null?null:s.deadline-s.parameters.transitionMs,publishedAt:s.publishedAt,viewMode:s.viewMode,viewEpoch:s.viewEpoch,
    historyByDrink:Object.fromEntries(Object.entries(s.historyByDrink).map(([id,points]) => [id,structuredClone(visibleHistory(points,s.parameters.historyChanges))])),
    parameters:{marketAveragePercent:s.parameters.marketAveragePercent??0,crashCostCents:s.parameters.crashCostCents??1500,transitionMs:s.parameters.transitionMs,crashIntroMs:crashIntroDuration(s.parameters),newsMs:s.parameters.newsMs,newsIntroMs:newsIntroDuration(s.parameters),newsTextRevealMs:s.parameters.newsTextRevealMs??3000,newsQuoteRevealMs:s.parameters.newsQuoteRevealMs??4500,priceRevealMs:priceRevealInterval(s.parameters,s.drinks.length),historyChanges:s.parameters.historyChanges,tickerRowMs:s.parameters.tickerRowMs},
    news:special ? {id:special.id,drinkId:special.drinkId,direction:special.targetCents===undefined?special.direction:s.transition!.prices[special.drinkId]>s.prices[special.drinkId]?'up':s.transition!.prices[special.drinkId]<s.prices[special.drinkId]?'down':special.direction,headline:special.headline,body:special.body,quote} : null,
    recentNews:recent?{id:recent.id,drinkId:recent.drinkId,direction:recentDirection!,headline:recent.headline,body:recent.body,publishedAt:lastDone!.publishedAt}:null,
    showOpeningNews:s.schedule.done.length===0,
  };
}
export function toAdminState(s: MarketState): AdminState {
  return {...toDisplayState(s),...(s.nextCrashPercent===undefined?{}:{nextCrashPercent:s.nextCrashPercent}),config:structuredClone(s.drinks),parameters:{...s.parameters},specials:structuredClone(s.specials),specialOrder:[...s.specialOrder],schedule:structuredClone(s.schedule),
    specialPreviews:Object.fromEntries(s.specials.map(special => {
      const preview=previewSpecial(s.drinks.find(d=>d.id===special.drinkId)!,s.prices[special.drinkId],special);
      if(s.transition?.kind==='special'&&s.transition.specialId===special.id){const price=s.transition.prices[special.drinkId],current=s.prices[special.drinkId];return[special.id,{...preview,price,delta:price-current,percent:current===0?0:(price-current)/current*100,limited:preview.limited||price!==preview.price}];}
      return[special.id,preview];
    })),
    previews:structuredClone(s.previews),overrides:structuredClone(s.overrides),pendingPrices:s.transition ? {...s.transition.prices} : null};
}
