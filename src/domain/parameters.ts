import { DomainError } from './types.js';
import type { MarketParameters } from './model.js';
export const DEFAULT_PARAMETERS: Readonly<MarketParameters> = Object.freeze({ normalMs: 1_200_000, marketVolatility:1,marketVolatilityPercent:25,marketAveragePercent:0,marketReversionPercent:50,crashCostCents:1500, crashMs: 300_000, transitionMs: 10_000, crashIntroMs: 15_000, newsMs: 25_000,newsIntroMs:10000,newsTextRevealMs:3000,newsQuoteRevealMs:4500,priceRevealMs:500, eveningMs: 18_000_000, minSpecialGapMs: 120_000,crashMinPercent:5,crashMaxPercent:15, crashTrendPercent: -10, recoveryTrendPercent: 10, crashAmplitudeFactor: 2, historyChanges: 19, tickerRowMs: 3000 });
export function crashIntroDuration(p:Pick<MarketParameters,'transitionMs'|'crashIntroMs'>):number{return p.crashIntroMs??p.transitionMs;}
export function newsIntroDuration(p:Pick<MarketParameters,'newsMs'|'newsIntroMs'>):number{return p.newsIntroMs??Math.min(5000,Math.max(0,p.newsMs-1000));}
export function priceRevealInterval(p:MarketParameters,count:number):number{const cap=count>1?Math.floor(Math.max(0,Math.min(p.normalMs,p.crashMs)-p.transitionMs-701)/(count-1)/50)*50:5000;return Math.min(p.priceRevealMs??500,cap);}
export function validateParameters(p: MarketParameters): void {
  const invalid = (field: string) => { throw new DomainError('INVALID_INPUT', `Ungültiger Marktparameter: ${field}.`); };
  if (!p || typeof p !== 'object' || Object.keys(p).some(k=>!Object.hasOwn(DEFAULT_PARAMETERS,k))||Object.keys(DEFAULT_PARAMETERS).some(k=>!['marketVolatility','marketVolatilityPercent','marketAveragePercent','marketReversionPercent','crashCostCents','crashIntroMs','newsIntroMs','newsTextRevealMs','newsQuoteRevealMs','priceRevealMs','crashMinPercent','crashMaxPercent'].includes(k)&&!Object.hasOwn(p,k))) invalid('Parameter');
  if(p.crashCostCents!==undefined&&(!Number.isSafeInteger(p.crashCostCents)||p.crashCostCents<0||p.crashCostCents>100000))invalid('Börsencrash-Preis: 0 bis 1000 Euro');
  if(p.marketReversionPercent!==undefined&&!isMarketReversionPercent(p.marketReversionPercent))invalid('Rückführung zum Average: ganze Werte von 0 bis 100 Prozent');
  if(p.marketAveragePercent!==undefined&&!isMarketAveragePercent(p.marketAveragePercent))invalid('Globaler Average: ganze Werte von −50 bis +200 Prozent');
  if(p.marketVolatilityPercent!==undefined&&!isMarketVolatilityPercent(p.marketVolatilityPercent))invalid('Marktvolatilität: ganze Prozentwerte von 0 bis 75');
  if(p.marketVolatility!==undefined&&!isMarketVolatility(p.marketVolatility))invalid('Marktvolatilität: 0 bis 3 in Schritten von 0,05');
  if(p.crashMinPercent!==undefined||p.crashMaxPercent!==undefined)if(!Number.isInteger(p.crashMinPercent)||!Number.isInteger(p.crashMaxPercent)||p.crashMinPercent!<1||p.crashMaxPercent!>90||p.crashMinPercent!>p.crashMaxPercent!)invalid('Crash-Range: ganze Prozentwerte von 1 bis 90, Minimum ≤ Maximum');
  const times: [keyof MarketParameters, number, number][] = [['normalMs',60_000,10_800_000],['crashMs',30_000,1_800_000],['transitionMs',1000,60_000],['newsMs',1000,60_000],['eveningMs',1_800_000,86_400_000],['minSpecialGapMs',0,600_000]];
  // Older saved markets may use up to 30s; current live controls allow 1–3s.
  if(!Number.isSafeInteger(p.tickerRowMs)||p.tickerRowMs<1000||p.tickerRowMs>30000||p.tickerRowMs%50!==0)invalid('Lauflistentempo');
  for (const [field,min,max] of times){const value=p[field];if (typeof value!=='number'||!Number.isSafeInteger(value) || value % 1000 !== 0 || value < min || value > max) invalid(field);}
  if(p.crashIntroMs!==undefined&&(!Number.isSafeInteger(p.crashIntroMs)||p.crashIntroMs<1000||p.crashIntroMs>60000||p.crashIntroMs%1000!==0))invalid('Crash-Einspieler: ganze Sekunden von 1 bis 60');
  if(p.newsIntroMs!==undefined&&(!Number.isSafeInteger(p.newsIntroMs)||p.newsIntroMs<0||p.newsIntroMs%1000!==0||p.newsIntroMs>=p.newsMs))invalid('Einspieler muss kürzer als gesamte Newsdauer sein');
  for(const key of ['newsTextRevealMs','newsQuoteRevealMs'] as const){const value=p[key];if(value!==undefined&&(!Number.isSafeInteger(value)||value<0||value>10000||value%50!==0))invalid('News-Einblendung: 0 bis 10 Sekunden in Schritten von 0,05 Sekunden');}
  if(p.priceRevealMs!==undefined&&(!Number.isSafeInteger(p.priceRevealMs)||p.priceRevealMs<0||p.priceRevealMs>5000||p.priceRevealMs%50!==0))invalid('Preis-Einblendung: 0 bis 5 Sekunden in Schritten von 0,05 Sekunden');
  for (const [field,min,max] of [['crashTrendPercent',-90,0],['recoveryTrendPercent',0,100],['crashAmplitudeFactor',1,5],['historyChanges',1,50]] as const) if (!Number.isFinite(p[field]) || p[field] < min || p[field] > max) invalid(field);
  if (!Number.isInteger(p.historyChanges)) invalid('historyChanges');
  if (p.normalMs <= p.transitionMs + p.newsMs + 1000) invalid('Rundenintervall / Special-Sichtzeit');
  if (p.crashMs <= p.transitionMs) invalid('Crashdauer / Übergang');
}
export function isMarketVolatility(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=3&&Math.abs(value*20-Math.round(value*20))<1e-8;}

export function isMarketAveragePercent(value:unknown):value is number{return typeof value==='number'&&Number.isInteger(value)&&value>=-50&&value<=200;}

export function isMarketVolatilityPercent(value:unknown):value is number{return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=75;}

export function isMarketReversionPercent(value:unknown):value is number{return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=100;}
