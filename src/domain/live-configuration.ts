import {scaledDrinkConfig} from './prices.js';
import type {MarketState,PreparedConfig,MarketContext,Rng,DrinkConfig} from './model.js';
import {DomainError} from './types.js';
import {validateConfiguration} from './configuration.js';
import {buildPreview,validateOverride} from './prices.js';
import {simulateStartupHistory} from './startup-history.js';
import {prepareCrash,percentPrices} from './crash-prices.js';
const pricing=(c:PreparedConfig)=>JSON.stringify([c.drinks.map(({name,category,...d})=>d),c.parameters.marketAveragePercent,c.parameters.marketVolatilityPercent,c.parameters.marketVolatility,c.parameters.marketReversionPercent,c.parameters.crashMinPercent,c.parameters.crashMaxPercent,c.parameters.crashTrendPercent,c.parameters.recoveryTrendPercent]);
export function configureRunningMarket(s:MarketState,config:PreparedConfig,_t:MarketContext,rng:Rng):MarketState{
 validateConfiguration(config);
 if(config.drinks.length!==s.drinks.length||config.drinks.some(d=>!s.drinks.some(old=>old.id===d.id))||config.specials.length!==s.specials.length||config.specials.some(n=>!s.specials.some(old=>old.id===n.id)))throw new DomainError('LOCKED','Getränke hinzufügen oder entfernen ist in der Vorbereitung möglich; Parameter sind jederzeit anpassbar.');
 const next=structuredClone(s);next.roundTransitionMs??=s.parameters.transitionMs;
 if(next.transition){next.transition.parameters??=structuredClone(s.parameters);if(next.transition.kind==='special')next.transition.specialSnapshot??=structuredClone(s.specials.find(n=>n.id===next.transition!.specialId)!);}
 for(const original of s.drinks){const d=scaledDrinkConfig(original,s.parameters.marketAveragePercent??0),replacement=scaledDrinkConfig(config.drinks.find(n=>n.id===d.id)!,config.parameters.marketAveragePercent??0);if(d.minCents!==replacement.minCents||d.maxCents!==replacement.maxCents||d.stepCents!==replacement.stepCents){next.historicalPriceConfigs??={};const old=next.historicalPriceConfigs[d.id]??[];if(!old.some(n=>n.minCents===d.minCents&&n.maxCents===d.maxCents&&n.stepCents===d.stepCents))old.push(structuredClone(d));next.historicalPriceConfigs[d.id]=old;}}
 next.drinks=structuredClone(config.drinks);next.parameters={...config.parameters,crashAmplitudeFactor:2};next.specials=structuredClone(config.specials);next.specialOrder=[...config.specialOrder];
 if(pricing(config)!==pricing(s)){
  for(const scope of ['normal','crash']as const)for(const[id,value]of Object.entries(next.overrides[scope])){if(value===null)continue;const d=scaledDrinkConfig(next.drinks.find(d=>d.id===id)!,next.parameters.marketAveragePercent??0);next.overrides[scope][id]=Math.max(d.minCents,Math.min(d.maxCents,Math.round(value/d.stepCents)*d.stepCents));}
  if(next.previews.normal&&next.transition?.kind!=='normal')next.previews.normal=buildPreview(next.drinks,next.prices,'normal',rng,next.parameters);
  if(next.previews.crash&&next.transition?.kind!=='crash'){const crash=prepareCrash(next.drinks,next.prices,next.parameters,rng);next.previews.crash=crash.prices;if(crash.percent!==undefined)next.nextCrashPercent=crash.percent;else delete next.nextCrashPercent;}
  if(next.previews.recovery&&next.transition?.kind!=='recovery')next.previews.recovery=next.activeCrashPercent===undefined?buildPreview(next.drinks,next.prices,'recovery',rng,next.parameters):percentPrices(next.drinks,next.prices,next.activeCrashPercent,next.parameters);
  if(next.transition?.kind==='crash')next.transition.interruptedNormalPreview=buildPreview(next.drinks,next.prices,'normal',rng,next.parameters);
 }
 if(next.parameters.historyChanges!==s.parameters.historyChanges)next.startupHistoryByDrink=simulateStartupHistory(next.drinks,next.parameters,Math.min(...Object.values(s.historyByDrink).map(points=>points[0].at)),s.revision+1);
 next.revision++;return next;
}
export function validateRecordedPrice(drink:DrinkConfig,value:number|null,past:DrinkConfig[]=[]):void{
 for(const bounds of [drink,...past]){try{validateOverride(bounds,value);return;}catch{/* Earlier publications retain their own configured bounds. */}}
 validateOverride(drink,value);
}
