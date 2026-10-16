import type {DrinkConfig} from './types.js';
import {DomainError} from './types.js';
/** The standard average is the sole individual price parameter. */
export function harmonizePriceBands(drinks:DrinkConfig[]):DrinkConfig[]{
  return drinks.map(drink=>{
    if(drink.fixedPriceCents!==undefined)return{...drink};
    const average=drink.averageCents??drink.startCents;
    const step=10;
    if(!Number.isSafeInteger(average)||average<=0||average%step!==0)throw new DomainError('INVALID_INPUT',`Standard-Average für ${drink.name}: positive 10-Cent-Schritte verwenden.`);
    const min=Math.min(average,Math.round(average*.5/step)*step),max=Math.max(average,Math.round(average*2.5/step)*step);
    return{...drink,averageCents:average,minCents:min,maxCents:max,amplitudeCents:Math.round(average*.25),startCents:average,stepCents:step,reversionPercent:50};
  });
}
/** Apply once to the original defaults; the live offset never changes this base. */
export function raiseStandardAverages(drinks:DrinkConfig[]):DrinkConfig[]{
  return harmonizePriceBands(drinks.map(drink=>drink.fixedPriceCents!==undefined?{...drink}:{...drink,averageCents:Math.round((drink.averageCents??drink.startCents)*1.1/10)*10}));
}
