import type {DrinkConfig,MarketParameters,PriceMap,Rng} from './model.js';
import {DomainError} from './types.js';
import {buildPreview,normalPriceProfile,volatilityBasisCents,averageTargetCents} from './prices.js';
export function percentPrices(drinks:DrinkConfig[],prices:PriceMap,percent:number):PriceMap{return Object.fromEntries(drinks.map(d=>[d.id,d.fixedPriceCents??Math.max(d.minCents,Math.min(d.maxCents,Math.round(prices[d.id]*(1+percent/100)/d.stepCents)*d.stepCents))]));}
const sample=(rng:Rng)=>{const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw new DomainError('INVALID_INPUT','Ungültiger Zufallswert.');return value;};
export function crashPrices(drinks:DrinkConfig[],prices:PriceMap,percent:number,parameters:MarketParameters,rng:Rng):PriceMap{
 return Object.fromEntries(drinks.map(drink=>{
  if(drink.fixedPriceCents!==undefined||drink.minCents===drink.maxCents)return[drink.id,drink.fixedPriceCents??drink.minCents];
  const basis=volatilityBasisCents(drink,parameters),centre=Math.max(drink.minCents,Math.min(drink.maxCents,prices[drink.id]*(1-percent/100))),profile=normalPriceProfile(drink,centre,parameters.marketVolatility??1,parameters.marketVolatilityPercent===undefined?undefined:averageTargetCents(drink,parameters.marketAveragePercent??0),basis),factor=2;
  if(basis===0)return[drink.id,percentPrices([drink],prices,-percent)[drink.id]];
  const down=Math.min(centre-drink.minCents,profile.downCents*factor),up=Math.min(drink.maxCents-centre,profile.upCents*factor),range=drink.maxCents-drink.minCents;
  const outliers=Math.min(.5,profile.outlierProbability*factor),draw=sample(rng),minProbability=outliers*(drink.maxCents-centre)/range;
  if(draw<minProbability)return[drink.id,drink.minCents];if(draw<outliers)return[drink.id,drink.maxCents];
  const total=down+up,negative=total>0&&(draw-outliers)/(1-outliers)<up/total;
  const value=centre+(negative?-down:up)*Math.abs(sample(rng)*2-1),steps=value/drink.stepCents,lower=Math.floor(steps),fraction=steps-lower;
  const rounded=(lower+(fraction>0&&sample(rng)<=fraction?1:0))*drink.stepCents;
  return[drink.id,Math.max(drink.minCents,Math.min(drink.maxCents,rounded))];
 }));
}
export function prepareCrash(drinks:DrinkConfig[],prices:PriceMap,parameters:MarketParameters,rng:Rng):{prices:PriceMap;percent?:number}{
  if(parameters.crashMinPercent===undefined||parameters.crashMaxPercent===undefined)return {prices:buildPreview(drinks,prices,'crash',rng,parameters)};
  const draw=sample(rng),percent=parameters.crashMinPercent+Math.floor(draw*(parameters.crashMaxPercent-parameters.crashMinPercent+1));return{prices:crashPrices(drinks,prices,percent,parameters,rng),percent};
}
