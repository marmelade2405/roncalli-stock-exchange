import { DomainError, type Cents, type DrinkConfig, type OverrideMap, type PriceMap, type Rng, type RandomRoundKind } from './types.js';
import type { MarketParameters } from './model.js';
import { DEFAULT_PARAMETERS } from './parameters.js';
export function hasVariablePrice(drink:DrinkConfig):boolean{return drink.minCents!==drink.maxCents;}
export function scaledDrinkConfig(drink:DrinkConfig,percent=0):DrinkConfig{
  if(percent===0||drink.fixedPriceCents!==undefined||drink.minCents===drink.maxCents)return drink;
  const step=drink.stepCents,round=(value:number)=>Math.round(value*(100+percent)/(100*step))*step;
  const minCents=round(drink.minCents),maxCents=round(drink.maxCents),average=Math.max(minCents,Math.min(maxCents,round(drink.averageCents??drink.startCents)));
  const result={...drink,minCents,maxCents,startCents:average,averageCents:average,amplitudeCents:Math.round(drink.amplitudeCents*(100+percent)/100)};
  if(![minCents,maxCents,average,result.amplitudeCents].every(Number.isSafeInteger))throw new DomainError('INVALID_INPUT','Die skalierten Preise sind zu groß.');
  return result;
}
export function averageTargetCents(drink:DrinkConfig,percent=0):number{
  const bounds=scaledDrinkConfig(drink,percent);return drink.fixedPriceCents??Math.max(bounds.minCents,Math.min(bounds.maxCents,Math.round((drink.averageCents??drink.startCents)*(1+percent/100))));
}
export function volatilityPercent(parameters:MarketParameters):number{return parameters.marketVolatilityPercent??25*(parameters.marketVolatility??1);}
export function volatilityBasisCents(drink:DrinkConfig,parameters:MarketParameters):number{
  if(drink.fixedPriceCents!==undefined||drink.minCents===drink.maxCents)return 0;
  if(parameters.marketVolatilityPercent===undefined)return drink.amplitudeCents*(parameters.marketVolatility??1);
  return averageTargetCents(drink,parameters.marketAveragePercent??0)*parameters.marketVolatilityPercent/100;
}
export function reversionPercent(drink:DrinkConfig,parameters:Pick<MarketParameters,'marketReversionPercent'>):number{return parameters.marketReversionPercent??drink.reversionPercent??75;}
export interface NormalPriceProfile {downCents:number;upCents:number;outlierProbability:number;minProbability:number;maxProbability:number}
export function normalPriceProfile(drink:DrinkConfig,centre=drink.averageCents??drink.startCents,volatility=1,target?:number,basisCents?:number,reversion?:number):NormalPriceProfile {
  const amplitude=basisCents??drink.amplitudeCents*volatility;
  const range=drink.maxCents-drink.minCents,average=target??drink.averageCents??drink.startCents;
  if(!range||drink.averageCents===undefined&&target===undefined)return {downCents:amplitude,upCents:amplitude,outlierProbability:0,minProbability:0,maxProbability:0};
  const below=average-drink.minCents,above=drink.maxCents-average;
  const outlierProbability=.25*Math.min(1,amplitude/Math.max(drink.stepCents,Math.min(below,above)));
  const base=(reversion??drink.reversionPercent??75)===0;
  return {downCents:Math.min(centre-drink.minCents,base?amplitude:2*amplitude*below/range),upCents:Math.min(drink.maxCents-centre,base?amplitude:2*amplitude*above/range),outlierProbability,minProbability:outlierProbability*(drink.maxCents-centre)/range,maxProbability:outlierProbability*(centre-drink.minCents)/range};
}
function randomSample(rng:Rng):number{const sample=rng();if(!Number.isFinite(sample)||sample<0||sample>=1)throw new DomainError('INVALID_INPUT','Ungültiger Zufallswert.');return sample;}

export function randomPrice(drink: DrinkConfig, current: Cents, kind: RandomRoundKind, rng: Rng, parameters: MarketParameters = DEFAULT_PARAMETERS): Cents {
  const standard=drink;drink=scaledDrinkConfig(drink,parameters.marketAveragePercent??0);
  if(drink.fixedPriceCents!==undefined)return drink.fixedPriceCents;
  const sample = randomSample(rng);
  const factor = kind === 'crash' ? 1 + parameters.crashTrendPercent/100 : kind === 'recovery' ? 1 + parameters.recoveryTrendPercent/100 : 1;
  const basis=volatilityBasisCents(standard,parameters),amplitude = basis * (kind === 'crash' ? 2 : 1);
  const hasAverage=drink.averageCents!==undefined||(parameters.marketAveragePercent??0)!==0,target=averageTargetCents(standard,parameters.marketAveragePercent??0);
  const reversion=reversionPercent(drink,parameters);
  const centre=kind==='normal'&&hasAverage?Math.max(drink.minCents,Math.min(drink.maxCents,current+(target-current)*reversion/100)):current*factor;
  let value=centre+(sample*2-1)*amplitude;
  if(kind==='normal'&&hasAverage){
    const profile=normalPriceProfile(drink,centre,parameters.marketVolatility??1,target,basis,reversion);
    if(sample<profile.minProbability)return drink.minCents;
    if(sample<profile.outlierProbability)return drink.maxCents;
    const magnitude=randomSample(rng);
    if(reversion===0)value=centre+(magnitude*2-1)*amplitude;
    else{
      const total=profile.downCents+profile.upCents;
      const negative=total>0&&(sample-profile.outlierProbability)/(1-profile.outlierProbability)<profile.upCents/total;
      value=centre+(negative?-profile.downCents:profile.upCents)*Math.abs(magnitude*2-1);
    }
  }
  const steps=value/drink.stepCents,lower=Math.floor(steps),fraction=steps-lower;
  // Preserve the expected normal price on the discrete grid: small reversion
  // must not disappear permanently when it is smaller than half a price step.
  const rounded=kind==='normal'&&hasAverage&&reversion>0&&fraction>0
    ?(lower+(randomSample(rng)<=fraction?1:0))*drink.stepCents
    :Math.round(steps)*drink.stepCents;
  return Math.max(drink.minCents, Math.min(drink.maxCents, rounded));
}

export function buildPreview(drinks: DrinkConfig[], prices: PriceMap, kind: RandomRoundKind, rng: Rng, parameters: MarketParameters = DEFAULT_PARAMETERS): PriceMap {
  return Object.fromEntries(drinks.map(drink => [drink.id, randomPrice(drink, prices[drink.id], kind, rng, parameters)]));
}

export function resolvePrices(preview: PriceMap, overrides: OverrideMap): PriceMap {
  return Object.fromEntries(Object.entries(preview).map(([id, value]) => [id, overrides[id] ?? value]));
}

export function validateDrinks(drinks: DrinkConfig[]): void {
  if (!Array.isArray(drinks) || drinks.length === 0) throw new DomainError('INVALID_INPUT', 'Mindestens ein Getränk ist erforderlich.');
  const ids = new Set<string>();
  for (const drink of drinks) {
    if (!drink || typeof drink !== 'object' || typeof drink.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,47}$/.test(drink.id) || ['constructor', 'prototype'].includes(drink.id) || ids.has(drink.id))
      throw new DomainError('INVALID_INPUT', 'Getränke brauchen eindeutige Kürzel aus Buchstaben, Zahlen und Bindestrichen.');
    ids.add(drink.id);
    if (typeof drink.name !== 'string' || !drink.name.trim() || drink.name.length > 80 || typeof drink.category !== 'string' || drink.category.length > 80)
      throw new DomainError('INVALID_INPUT', 'Bitte gültige Getränkenamen und Kategorien eintragen.');
    const values = [drink.startCents, drink.minCents, drink.maxCents, drink.amplitudeCents, drink.stepCents];
    if (!values.every(Number.isSafeInteger) || drink.stepCents <= 0 || drink.amplitudeCents < 0 || drink.minCents < 0 || drink.minCents > drink.startCents || drink.startCents > drink.maxCents || [drink.startCents, drink.minCents, drink.maxCents].some(v => v % drink.stepCents !== 0))
      throw new DomainError('INVALID_INPUT', `Preisgrenzen, Startpreis oder Rundung für ${drink.name} sind ungültig.`);
    if(drink.averageCents!==undefined&&(!Number.isSafeInteger(drink.averageCents)||drink.averageCents<drink.minCents||drink.averageCents>drink.maxCents||drink.averageCents%drink.stepCents!==0))throw new DomainError('INVALID_INPUT',`Average für ${drink.name} muss innerhalb der Grenzen und auf dem Preisschritt liegen.`);
    if(drink.reversionPercent!==undefined&&(!Number.isFinite(drink.reversionPercent)||drink.reversionPercent<0||drink.reversionPercent>100))throw new DomainError('INVALID_INPUT',`Rückführung für ${drink.name}: 0 bis 100 % eingeben.`);
    if(drink.fixedPriceCents!==undefined&&(!Number.isSafeInteger(drink.fixedPriceCents)||[drink.startCents,drink.minCents,drink.maxCents,drink.averageCents??drink.startCents].some(v=>v!==drink.fixedPriceCents)||drink.amplitudeCents!==0))throw new DomainError('INVALID_INPUT',`Der feste Preis für ${drink.name} darf nicht verändert werden.`);
  }
}

export function validateOverride(drink: DrinkConfig, value: Cents | null): void {
  if (value === null) return;
  if (!Number.isSafeInteger(value) || value < drink.minCents || value > drink.maxCents || value % drink.stepCents !== 0)
    throw new DomainError('INVALID_INPUT', `Preis für ${drink.name}: innerhalb der Grenzen und in ${drink.stepCents}-Cent-Schritten eingeben.`);
}
