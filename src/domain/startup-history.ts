import type {DrinkConfig,MarketParameters,PriceHistories,PricePoint} from './model.js';
import {buildPreview,validateDrinks} from './prices.js';
import {validateParameters} from './parameters.js';
import {prepareCrash,percentPrices} from './crash-prices.js';
export function simulateStartupHistory(drinks:DrinkConfig[],parameters:MarketParameters,at:number,revision=0):PriceHistories{
  validateDrinks(drinks);validateParameters(parameters);
  let seed=2166136261;for(const char of JSON.stringify([drinks.map(({name,category,...pricing})=>pricing),parameters]))seed=Math.imul(seed^char.charCodeAt(0),16777619);
  const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},normalCount=Math.max(5,parameters.historyChanges-10);
  const events:('normal'|'crash'|'recovery')[]=[];for(let cycle=0;cycle<5;cycle++){for(let n=0;n<Math.floor(normalCount/5)+(cycle<normalCount%5?1:0);n++)events.push('normal');events.push('crash','recovery');}
  const duration=(kind:string)=>kind==='normal'?parameters.normalMs:kind==='crash'?parameters.transitionMs:parameters.crashMs;
  const span=events.reduce((sum,kind)=>sum+duration(kind),parameters.normalMs);let elapsed=0,prices=Object.fromEntries(drinks.map(d=>[d.id,d.startCents])),crashPercent:number|undefined;
  const history:PriceHistories=Object.fromEntries(drinks.map(d=>[d.id,[{at:Math.max(0,at-span),price:d.startCents,revision,kind:'start' as const}]]));
  for(const kind of events){elapsed+=duration(kind);if(kind==='normal')prices=buildPreview(drinks,prices,'normal',rng,parameters);else if(kind==='crash'){const crash=prepareCrash(drinks,prices,parameters,rng);prices=crash.prices;crashPercent=crash.percent;}else prices=crashPercent===undefined?buildPreview(drinks,prices,'recovery',rng,parameters):percentPrices(drinks,prices,crashPercent);
    for(const drink of drinks)history[drink.id].push({at:Math.max(0,at-span+elapsed),price:prices[drink.id],kind,revision});
  }
  return history;
}
export function combineHistory(actual:PricePoint[],simulation:PricePoint[],changes:number):{points:PricePoint[];simulatedCount:number}{
  const real=actual.slice(-(changes+1)),missing=Math.max(0,changes+1-real.length),prefix=simulation.filter(p=>!real.length||p.at<=real[0].at).slice(-missing);
  return{points:missing?[...prefix,...real]:real,simulatedCount:missing?prefix.length:0};
}
