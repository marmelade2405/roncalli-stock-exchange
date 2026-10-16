import type { DrinkConfig } from './types.js';
export const NORMAL_MS = 1_800_000;
export const CRASH_MS = 300_000;
export const TRANSITION_MS = 10_000;
const drink = (id: string, name: string, category: string, startCents: number, minCents: number, maxCents: number, amplitudeCents: number): DrinkConfig =>
  ({ id, name, category, startCents, minCents, maxCents, amplitudeCents, stepCents: 10 });
export const DEFAULT_DRINKS: DrinkConfig[] = [
  drink('bier', 'Bier', 'Bier & Radler', 200, 100, 300, 30),
  drink('radler', 'Radler', 'Bier & Radler', 200, 100, 300, 30),
  drink('cola', 'Cola', 'Alkoholfrei', 150, 100, 250, 20),
  drink('wasser', 'Wasser', 'Alkoholfrei', 150, 100, 250, 20),
  drink('gin-tonic', 'Gin Tonic', 'Longdrinks', 350, 200, 500, 50),
  drink('cuba-libre', 'Cuba Libre', 'Longdrinks', 350, 200, 500, 50),
  drink('wodka-orange', 'Wodka Orange', 'Longdrinks', 350, 200, 500, 50),
  drink('whisky-cola', 'Whisky Cola', 'Longdrinks', 350, 200, 500, 50),
];
