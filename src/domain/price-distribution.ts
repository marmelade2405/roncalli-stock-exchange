import {scaledDrinkConfig} from './prices.js';
import type {DrinkConfig} from './types.js';
import {randomPrice,validateDrinks} from './prices.js';
import {DEFAULT_PARAMETERS,validateParameters} from './parameters.js';
export interface DistributionBin {fromCents:number;toCents:number;probability:number}
export interface PriceDistribution {bins:DistributionBin[];meanCents:number;sampleCount:number;binStepCents:number}
export function simulatePriceDistribution(drink:DrinkConfig,volatility=1,averagePercent=0,volatilityPercent?:number,reversionPercent?:number):PriceDistribution {
  validateDrinks([drink]);
  const parameters={...DEFAULT_PARAMETERS,marketVolatility:volatility,marketAveragePercent:averagePercent,marketVolatilityPercent:volatilityPercent,marketReversionPercent:reversionPercent};validateParameters(parameters);
  const bounds=scaledDrinkConfig(drink,averagePercent);
  const sampleCount=200_000,burnIn=2_000;
  const priceCount=(bounds.maxCents-bounds.minCents)/drink.stepCents+1;
  const binStepCents=drink.stepCents*Math.ceil(priceCount/200);
  const bins:DistributionBin[]=Array.from({length:Math.ceil(priceCount/Math.ceil(priceCount/200))},(_,index)=>{
    const fromCents=bounds.minCents+index*binStepCents;
    return {fromCents,toCents:Math.min(bounds.maxCents,fromCents+binStepCents-drink.stepCents),probability:0};
  });
  let seed=20261009,current=drink.startCents,meanCents=0;
  const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let i=-burnIn;i<sampleCount;i++){
    current=randomPrice(drink,current,'normal',rng,parameters);
    if(i>=0){bins[Math.min(bins.length-1,Math.floor((current-bounds.minCents)/binStepCents))].probability++;meanCents+=(current-meanCents)/(i+1);}
  }
  for(const bin of bins)bin.probability/=sampleCount;
  return {bins,meanCents,sampleCount,binStepCents};
}
