import { DomainError, type Cents, type DrinkConfig, type OverrideMap, type PriceMap, type Rng, type RoundKind } from './types.js';

export function randomPrice(drink: DrinkConfig, current: Cents, kind: RoundKind, rng: Rng): Cents {
  const sample = rng();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new DomainError('INVALID_INPUT', 'Ungültiger Zufallswert.');
  const factor = kind === 'crash' ? .9 : kind === 'recovery' ? 1.1 : 1;
  const amplitude = drink.amplitudeCents * (kind === 'crash' ? 2 : 1);
  const rounded = Math.round((current * factor + (sample * 2 - 1) * amplitude) / drink.stepCents) * drink.stepCents;
  return Math.max(drink.minCents, Math.min(drink.maxCents, rounded));
}

export function buildPreview(drinks: DrinkConfig[], prices: PriceMap, kind: RoundKind, rng: Rng): PriceMap {
  return Object.fromEntries(drinks.map(drink => [drink.id, randomPrice(drink, prices[drink.id], kind, rng)]));
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
  }
}

export function validateOverride(drink: DrinkConfig, value: Cents | null): void {
  if (value === null) return;
  if (!Number.isSafeInteger(value) || value < drink.minCents || value > drink.maxCents || value % drink.stepCents !== 0)
    throw new DomainError('INVALID_INPUT', `Preis für ${drink.name}: innerhalb der Grenzen und in ${drink.stepCents}-Cent-Schritten eingeben.`);
}
