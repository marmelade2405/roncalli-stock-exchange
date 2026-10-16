import type { DrinkConfig, Cents, SpecialDefinition, SpecialPreview } from './model.js';
import { DomainError } from './types.js';
export function previewSpecial(drink: DrinkConfig, current: Cents, special: SpecialDefinition): SpecialPreview {
  if (special.drinkId !== drink.id || !Number.isSafeInteger(current) || !Number.isFinite(special.percent)) throw new DomainError('INVALID_INPUT','Die Nachrichtenwirkung ist ungültig.');
  const rounded = Math.round(current * (1 + special.percent / 100) / drink.stepCents) * drink.stepCents;
  const price = Math.max(drink.minCents,Math.min(drink.maxCents,rounded));
  if (!Number.isSafeInteger(price)) throw new DomainError('INVALID_INPUT','Der berechnete Preis ist ungültig.');
  return { price,delta:price-current,percent:current === 0 ? 0 : (price-current)/current*100,limited:price !== rounded };
}
