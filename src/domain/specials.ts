import type { DrinkConfig, Cents, SpecialDefinition, SpecialPreview } from './model.js';
import { DomainError } from './types.js';
import {validateOverride} from './prices.js';
export function previewSpecial(drink: DrinkConfig, current: Cents, special: SpecialDefinition): SpecialPreview {
  if (special.drinkId !== drink.id || !Number.isSafeInteger(current) || !['up','down'].includes(special.direction)) throw new DomainError('INVALID_INPUT','Die Nachrichtenwirkung ist ungültig.');
  if(special.targetCents!==undefined){
    if(!Number.isSafeInteger(special.targetCents))throw new DomainError('INVALID_INPUT','Der Special-Festpreis ist ungültig.');
    validateOverride(drink,special.targetCents);
    const price=special.direction==='down'?Math.min(current,special.targetCents):special.targetCents;
    return{price,delta:price-current,percent:current===0?0:(price-current)/current*100,limited:price!==special.targetCents};
  }
  const steps=(drink.maxCents-drink.minCents)/drink.stepCents;
  const target=drink.minCents+(special.direction==='up'?Math.ceil(steps*.9):Math.floor(steps*.1))*drink.stepCents;
  const directed=special.direction==='up'?Math.max(current,target):Math.min(current,target);
  const price = Math.max(drink.minCents,Math.min(drink.maxCents,directed));
  if (!Number.isSafeInteger(price)) throw new DomainError('INVALID_INPUT','Der berechnete Preis ist ungültig.');
  return { price,delta:price-current,percent:current === 0 ? 0 : (price-current)/current*100,limited:price !== target };
}
