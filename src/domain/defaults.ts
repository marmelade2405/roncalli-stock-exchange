import type { DrinkConfig } from './types.js';
import {harmonizePriceBands} from './price-bands.js';
export const NORMAL_MS = 1_200_000;
export const CRASH_MS = 300_000;
export const TRANSITION_MS = 10_000;
const drink = (id: string, name: string, category: string, averageCents: number, minCents: number, maxCents: number, amplitudeCents: number): DrinkConfig =>
  ({ id, name, category, startCents:averageCents,averageCents,reversionPercent:50, minCents, maxCents, amplitudeCents, stepCents: 10 });
export const SHOT_TYPES=[['berentzen','Berentzen'],['pfeffi','Pfeffi'],['tequila','Tequila'],['jaegermeister','Jägermeister'],['ouzo','Ouzo'],['rum','Rum'],['erdbeerlimes','Erdbeerlimes']]as const;
const standardMixedAverage=350;
export const DEFAULT_DRINKS: DrinkConfig[] = harmonizePriceBands([
  drink('bier','Bier','Bier',220,110,500,50),
  drink('wein','Wein / Weinschorle','Wein & Aperitif',standardMixedAverage,170,600,80),
  drink('aperol','Aperol','Wein & Aperitif',400,200,600,100),
  drink('gin-tonic','Gin Tonic','Longdrinks',standardMixedAverage,150,600,70),
  drink('wodka-energy','Wodka Energy','Longdrinks',standardMixedAverage,170,600,40),
  drink('rum-cola','Rum Cola','Longdrinks',standardMixedAverage,120,600,50),
  drink('lillet-wildberry','Lillet Wild Berry','Wein & Aperitif',standardMixedAverage,180,600,80),
  drink('limo','Limo','Alkoholfrei',200,100,400,60),
  drink('cola','Cola','Alkoholfrei',200,100,400,60),
  drink('spezi','Spezi','Alkoholfrei',200,100,400,60),
  drink('mate','Mate','Alkoholfrei',200,80,400,60),
  drink('apfelschorle','Apfelschorle','Alkoholfrei',200,100,400,60),
  ...SHOT_TYPES.map(([id,name])=>drink(id,name,'Shots',100,40,300,30)),
  {...drink('wasser','Wasser','Dauerhaft gratis',0,0,0,0),fixedPriceCents:0},
]);
