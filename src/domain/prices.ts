import { DomainError, type Cents, type DrinkConfig, type OverrideMap, type PriceMap, type Rng, type RandomRoundKind } from './types.js';
import type { MarketParameters } from './model.js';
import { DEFAULT_PARAMETERS } from './parameters.js';
export function hasVariablePrice(drink:DrinkConfig):boolean{return drink.minCents!==drink.maxCents;}

export function randomPrice(drink: DrinkConfig, current: Cents, kind: RandomRoundKind, rng: Rng, parameters: MarketParameters = DEFAULT_PARAMETERS): Cents {
  if(drink.fixedPriceCents!==undefined)return drink.fixedPriceCents;
  const sample = rng();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new DomainError('INVALID_INPUT', 'Ungültiger Zufallswert.');
  const factor = kind === 'crash' ? 1 + parameters.crashTrendPercent/100 : kind === 'recovery' ? 1 + parameters.recoveryTrendPercent/100 : 1;
  const amplitude = drink.amplitudeCents * (kind === 'crash' ? parameters.crashAmplitudeFactor : 1);
  const centre=kind==='normal'&&drink.averageCents!==undefined?current+(drink.averageCents-current)*(drink.reversionPercent??75)/100:current*factor;
  const rounded = Math.round((centre + (sample * 2 - 1) * amplitude) / drink.stepCents) * drink.stepCents;
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
