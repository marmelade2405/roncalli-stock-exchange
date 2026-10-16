import { DomainError } from './types.js';
import type { MarketParameters } from './model.js';
export const DEFAULT_PARAMETERS: Readonly<MarketParameters> = Object.freeze({ normalMs: 1_200_000, crashMs: 300_000, transitionMs: 10_000, newsMs: 10_000, eveningMs: 18_000_000, minSpecialGapMs: 120_000, crashTrendPercent: -10, recoveryTrendPercent: 10, crashAmplitudeFactor: 2, historyChanges: 10, tickerRowMs: 6000 });
export function validateParameters(p: MarketParameters): void {
  const invalid = (field: string) => { throw new DomainError('INVALID_INPUT', `Ungültiger Marktparameter: ${field}.`); };
  if (!p || typeof p !== 'object' || Object.keys(p).length !== Object.keys(DEFAULT_PARAMETERS).length) invalid('Parameter');
  const times: [keyof MarketParameters, number, number][] = [['normalMs',60_000,10_800_000],['crashMs',30_000,1_800_000],['transitionMs',1000,60_000],['newsMs',1000,60_000],['eveningMs',1_800_000,86_400_000],['minSpecialGapMs',0,600_000],['tickerRowMs',1000,30_000]];
  for (const [field,min,max] of times) if (!Number.isSafeInteger(p[field]) || p[field] % 1000 !== 0 || p[field] < min || p[field] > max) invalid(field);
  for (const [field,min,max] of [['crashTrendPercent',-90,0],['recoveryTrendPercent',0,100],['crashAmplitudeFactor',1,5],['historyChanges',1,50]] as const) if (!Number.isFinite(p[field]) || p[field] < min || p[field] > max) invalid(field);
  if (!Number.isInteger(p.historyChanges)) invalid('historyChanges');
  if (p.normalMs <= p.transitionMs + p.newsMs + p.minSpecialGapMs) invalid('Rundenintervall / Special-Sichtzeit');
  if (p.crashMs <= p.transitionMs) invalid('Crashdauer / Übergang');
}
