import type { DrinkConfig, Cents, SpecialDefinition, SpecialPreview } from './model.js';
import { DomainError } from './types.js';
import {validateOverride,scaledDrinkConfig} from './prices.js';
export function previewSpecial(drink: DrinkConfig, current: Cents, special: SpecialDefinition,averagePercent=0): SpecialPreview {
  if(special.drinkId!==drink.id||!Number.isSafeInteger(current)||current<0||!['up','down'].includes(special.direction))throw new DomainError('INVALID_INPUT','Die Nachrichtenwirkung ist ungültig.');
  if(special.targetCents!==undefined){if(!Number.isSafeInteger(special.targetCents))throw new DomainError('INVALID_INPUT','Der Special-Richtpreis ist ungültig.');validateOverride(drink,special.targetCents);}
  drink=scaledDrinkConfig(drink,averagePercent);
  const steps=(drink.maxCents-drink.minCents)/drink.stepCents,up=special.direction==='up';
  const edge=drink.minCents+(up?Math.ceil(steps*.9):Math.floor(steps*.1))*drink.stepCents;
  const target=special.targetCents===undefined?edge:Math.max(drink.minCents,Math.min(drink.maxCents,special.targetCents));
  let price=current;
  if(up?current<drink.maxCents:current>drink.minCents){
    if(up?target>current:target<current)price=target;
    else{
      // Move halfway through the remaining absolute price range, rounding
      // toward the boundary so even the final available price step moves.
      price=up?Math.max(edge,drink.maxCents-Math.floor((drink.maxCents-current)/drink.stepCents/2)*drink.stepCents):Math.min(edge,drink.minCents+Math.floor((current-drink.minCents)/drink.stepCents/2)*drink.stepCents);
    }
  }
  if(!Number.isSafeInteger(price))throw new DomainError('INVALID_INPUT','Der berechnete Preis ist ungültig.');
  return{price,delta:price-current,percent:current===0?0:(price-current)/current*100,limited:price!==(special.targetCents??target)};
}
