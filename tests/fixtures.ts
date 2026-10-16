import type { DrinkConfig, Rng } from '../src/domain/types.js';
export const makeDrink = (overrides: Partial<DrinkConfig> = {}): DrinkConfig => ({ id: 'bier', name: 'Bier', category: 'Bier', startCents: 200, minCents: 100, maxCents: 300, amplitudeCents: 30, stepCents: 10, ...overrides });
export const midpointRng: Rng = () => .5;
// Historical eight-drink market remains a deliberate compatibility fixture.
export const LEGACY_DRINKS:DrinkConfig[]=[
  makeDrink({category:'Bier & Radler'}),makeDrink({id:'radler',name:'Radler',category:'Bier & Radler'}),
  makeDrink({id:'cola',name:'Cola',category:'Alkoholfrei',startCents:150,minCents:100,maxCents:250,amplitudeCents:20}),
  makeDrink({id:'wasser',name:'Wasser',category:'Alkoholfrei',startCents:150,minCents:100,maxCents:250,amplitudeCents:20}),
  ...[['gin-tonic','Gin Tonic'],['cuba-libre','Cuba Libre'],['wodka-orange','Wodka Orange'],['whisky-cola','Whisky Cola']].map(([id,name])=>makeDrink({id,name,category:'Longdrinks',startCents:350,minCents:200,maxCents:500,amplitudeCents:50})),
];
