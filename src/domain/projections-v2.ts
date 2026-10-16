import type { MarketState, DisplayState, AdminState } from './model.js';
import { visibleHistory } from './history.js';
import { nextBoundary } from './market-v2.js';
import { previewSpecial } from './specials.js';
export function toDisplayState(s: MarketState): DisplayState {
  const special=s.transition?.kind === 'special' ? s.specials.find(x => x.id === s.transition!.specialId)! : null;
  const nextKind=s.transition?.kind ?? (s.phase === 'crash' ? 'recovery' : s.phase === 'normal' ? 'normal' : null);
  const nextNormalAt=s.phase === 'normal' ? s.deadline : s.transition?.kind === 'normal' ? s.deadline : s.transition?.kind === 'special' ? s.transition.normalDeadline : null;
  return {
    revision:s.revision,runId:s.runId,phase:s.phase,drinks:s.drinks.map(({id,name,category,minCents,maxCents,averageCents,startCents}) => ({id,name,category,minCents,maxCents,averageCents:averageCents??startCents})),prices:{...s.prices},previousPrices:{...s.previousPrices},
    deadline:s.deadline,nextKind,nextNormalAt,hideAt:s.phase === 'transition' ? s.publishedAt : nextBoundary(s),publishedAt:s.publishedAt,viewMode:s.viewMode,viewEpoch:s.viewEpoch,
    historyByDrink:Object.fromEntries(Object.entries(s.historyByDrink).map(([id,points]) => [id,structuredClone(visibleHistory(points,s.parameters.historyChanges))])),
    parameters:{transitionMs:s.parameters.transitionMs,newsMs:s.parameters.newsMs,historyChanges:s.parameters.historyChanges,tickerRowMs:s.parameters.tickerRowMs},
    news:special ? {id:special.id,drinkId:special.drinkId,direction:special.direction,headline:special.headline,body:special.body} : null,
  };
}
export function toAdminState(s: MarketState): AdminState {
  return {...toDisplayState(s),config:structuredClone(s.drinks),parameters:{...s.parameters},specials:structuredClone(s.specials),specialOrder:[...s.specialOrder],schedule:structuredClone(s.schedule),
    specialPreviews:Object.fromEntries(s.specials.map(special => [special.id,previewSpecial(s.drinks.find(d => d.id === special.drinkId)!,s.prices[special.drinkId],special)])),
    previews:structuredClone(s.previews),overrides:structuredClone(s.overrides),pendingPrices:s.transition ? {...s.transition.prices} : null};
}
