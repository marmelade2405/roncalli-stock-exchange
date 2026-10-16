import type { DrinkConfig } from './types.js';
export const NORMAL_MS = 1_200_000;
export const CRASH_MS = 300_000;
export const TRANSITION_MS = 10_000;
const drink = (id: string, name: string, category: string, averageCents: number, minCents: number, maxCents: number, amplitudeCents: number): DrinkConfig =>
  ({ id, name, category, startCents:averageCents,averageCents,reversionPercent:50, minCents, maxCents, amplitudeCents, stepCents: 10 });
export const SHOT_TYPES=[['berentzen','Berentzen'],['pfeffi','Pfeffi'],['tequila','Tequila'],['jaegermeister','Jägermeister'],['ouzo','Ouzo'],['rum','Rum'],['erdbeerlimes','Erdbeerlimes']]as const;
export const DEFAULT_DRINKS: DrinkConfig[] = [
  drink('bier','Bier','Bier',180,110,500,50),
  drink('wein','Wein / Weinschorle','Wein & Aperitif',300,170,600,80),
  drink('aperol','Aperol','Wein & Aperitif',350,200,600,100),
  drink('gin-tonic','Gin Tonic','Longdrinks',250,150,600,70),
  drink('wodka-energy','Wodka Energy','Longdrinks',230,170,600,40),
  drink('rum-cola','Rum Cola','Longdrinks',200,120,600,50),
  drink('lillet-wildberry','Lillet Wild Berry','Wein & Aperitif',300,180,600,80),
  drink('limo','Limo','Alkoholfrei',200,100,400,60),
  drink('cola','Cola','Alkoholfrei',200,100,400,60),
  drink('spezi','Spezi','Alkoholfrei',200,100,400,60),
  drink('mate','Mate','Alkoholfrei',200,80,400,60),
  drink('apfelschorle','Apfelschorle','Alkoholfrei',200,100,400,60),
  ...SHOT_TYPES.map(([id,name])=>drink(id,name,'Shots',100,40,300,30)),
  {...drink('wasser','Wasser','Dauerhaft gratis',0,0,0,0),fixedPriceCents:0},
];
