import { readFile, writeFile } from 'node:fs/promises';
import type { MarketState, Rng, PriceMap, OverrideMap, PricePoint, PriceHistories } from '../domain/model.js';
import { writeAtomic } from './atomic-file.js';
import { validateConfiguration, createDefaultConfiguration } from '../domain/configuration.js';
import { validateOverride, buildPreview } from '../domain/prices.js';
import { createMarket } from '../domain/market-v2.js';
import { validateLegacyMarket, type LegacyMarketState } from '../domain/legacy.js';
import { initialHistory, recordChanges } from '../domain/history.js';
import {isSimulationSpeed} from '../domain/simulation-speed.js';
import {simulateStartupHistory} from '../domain/startup-history.js';
export interface MarketStore { load(): Promise<MarketState|null>; save(state: MarketState): Promise<void> }
const record=(v:unknown): v is Record<string,unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const stamp=(v:unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const invalid=():never => {throw Error('Der gespeicherte Marktstand ist ungültig. Die Datei bleibt erhalten.');};
export function validateStoredMarket(value: unknown): asserts value is MarketState {
  if (!record(value)) invalid(); const s=value as unknown as MarketState;
  if (s.schemaVersion !== 2 || !stamp(s.revision) || !stamp(s.runId) || !['ready','normal','crash','transition'].includes(s.phase) || !['overview','ticker'].includes(s.viewMode)) invalid();
  validateConfiguration(s);
  if(s.chartMode!==undefined&&!['line','bars','bars-gap'].includes(s.chartMode))invalid();
  if(s.tickerColumns!==undefined&&s.tickerColumns!==2&&s.tickerColumns!==3)invalid();
  for(const field of['nextCrashPercent','activeCrashPercent']as const)if(s[field]!==undefined&&(!Number.isInteger(s[field])||s[field]!<1||s[field]!>90))invalid();
  if(s.tickerOffsetRows!==undefined&&(!Number.isFinite(s.tickerOffsetRows)||s.tickerOffsetRows<0||s.tickerOffsetRows>Number.MAX_SAFE_INTEGER))invalid();
  if(s.tickerWallAt!==undefined&&!stamp(s.tickerWallAt))invalid();
  if(s.publication!==undefined){const p=s.publication;if(!record(p)||!stamp(p.wallAt)||!stamp(p.revision)||p.revision>s.revision||!['normal','crash','recovery','special','correction'].includes(p.kind)||!Array.isArray(p.changedDrinkIds)||new Set(p.changedDrinkIds).size!==p.changedDrinkIds.length||p.changedDrinkIds.some(id=>!s.drinks.some(d=>d.id===id)))invalid();}
  if(s.quoteRevealUntil!==undefined&&!stamp(s.quoteRevealUntil))invalid();
  if(s.roundPublication!==undefined){const p=s.roundPublication;if(!record(p)||!stamp(p.wallAt)||!stamp(p.revision)||p.revision>s.revision||!['normal','crash','recovery'].includes(p.kind)||!Array.isArray(p.changedDrinkIds)||new Set(p.changedDrinkIds).size!==p.changedDrinkIds.length||p.changedDrinkIds.some(id=>!s.drinks.some(d=>d.id===id)))invalid();}
  if(s.quotePublicationOverrides!==undefined){if(!record(s.quotePublicationOverrides))invalid();for(const[id,p]of Object.entries(s.quotePublicationOverrides))if(!s.drinks.some(d=>d.id===id)||!record(p)||!stamp(p.wallAt)||!stamp(p.revision)||p.revision>s.revision)invalid();}
  const drinks=new Map(s.drinks.map(d=>[d.id,d]));
  if(s.startupHistoryByDrink!==undefined){if(!record(s.startupHistoryByDrink)||Object.keys(s.startupHistoryByDrink).length!==drinks.size)invalid();for(const[id,points]of Object.entries(s.startupHistoryByDrink)){const drink=drinks.get(id);if(!drink||!Array.isArray(points)||!points.length||points.length>51)invalid();let previousAt=-1;for(const point of points){if(!record(point)||!stamp(point.at)||point.at<previousAt||!Number.isSafeInteger(point.price)||!stamp(point.revision)||point.revision>s.revision||!['start','normal','crash','recovery'].includes(point.kind))invalid();validateOverride(drink!,point.price);previousAt=point.at;}}}
  const map=(v:PriceMap|OverrideMap,complete:boolean,nullable=false) => {
    if (!record(v) || (complete && Object.keys(v).length !== drinks.size)) invalid();
    for (const [id,price] of Object.entries(v)) { const d=drinks.get(id); if (!d || (complete && !nullable && price === null)) invalid(); validateOverride(d!,price); }
  };
  map(s.prices,true); map(s.previousPrices,true,true);
  if (!record(s.previews) || !record(s.overrides)) invalid();
  for (const scope of ['normal','crash'] as const) map(s.overrides[scope],false);
  for (const kind of ['normal','crash','recovery'] as const) if (s.previews[kind] !== null) map(s.previews[kind]!,true);
  if (!stamp(s.publishedAt) || !stamp(s.viewEpoch) || (s.deadline !== null && !stamp(s.deadline))) invalid();
  if ((s.phase === 'ready') !== (s.deadline === null) || (s.phase === 'transition') !== (s.transition !== null)) invalid();
  if (s.transition !== null) {
    const t=s.transition;
    if (!record(t) || !['normal','crash','recovery','special'].includes(t.kind) || t.publishAt !== s.deadline || (t.normalDeadline !== null && !stamp(t.normalDeadline))) invalid();
    map(t.prices,true);
    if (t.kind === 'crash') map(t.interruptedNormalPreview!,true);
    if ((t.kind === 'normal' || t.kind === 'special') && t.normalDeadline === null) invalid();
  }
  const kind=s.transition?.kind ?? (s.phase === 'crash' ? 'recovery' : 'normal');
  if (kind === 'recovery') { if (s.previews.recovery === null || s.previews.normal !== null || s.previews.crash !== null) invalid(); }
  else if (kind === 'crash') { if (s.previews.crash === null || s.previews.normal !== null || s.previews.recovery !== null) invalid(); }
  else if (s.previews.normal === null || s.previews.crash === null || s.previews.recovery !== null) invalid();
  if (!record(s.clock)) invalid(); const c=s.clock;
  if (!['live','simulation'].includes(c.mode) || !isSimulationSpeed(c.speed) || !(c.rate===0||isSimulationSpeed(c.rate)) || typeof c.paused !== 'boolean' || !stamp(c.marketAnchor) || !stamp(c.wallAnchor) || !stamp(c.generation)) invalid();
  if (c.mode === 'live' && (c.rate !== 1 || c.speed !== 1 || c.paused)) invalid();
  if (c.mode === 'simulation' && (c.paused ? c.rate !== 0 : s.phase === 'ready' ? c.rate !== 0 : s.phase === 'transition'||(s.quoteRevealUntil!==undefined&&c.marketAnchor<s.quoteRevealUntil) ? c.rate !== 1 : c.rate !== c.speed)) invalid();
  if (!record(s.schedule) || !Array.isArray(s.schedule.pending) || !Array.isArray(s.schedule.done)) invalid();
  const q=s.schedule;
  if ((s.phase === 'ready') !== (q.startedAt === null) || (q.startedAt !== null && !stamp(q.startedAt)) || (q.lastSpecialAt !== null && !stamp(q.lastSpecialAt))) invalid();
  const ids=new Set(s.specials.map(x=>x.id)); const seen=new Set<string>(); let offset=-1;
  for (const slot of q.pending) {
    if (!record(slot) || !ids.has(slot.specialId) || seen.has(slot.specialId) || !stamp(slot.offsetMs) || slot.offsetMs <= offset || slot.offsetMs >= s.parameters.eveningMs) invalid();
    seen.add(slot.specialId); offset=slot.offsetMs;
  }
  for (const slot of q.done) {
    if (!record(slot) || !ids.has(slot.specialId) || seen.has(slot.specialId) || !stamp(slot.offsetMs) || !stamp(slot.publishedAt) || (slot.direction!==undefined&&slot.direction!=='up'&&slot.direction!=='down')) invalid(); seen.add(slot.specialId);
  }
  if (seen.size !== ids.size || (q.startedAt === null && q.done.length)) invalid();
  if (s.transition?.kind === 'special' && !q.pending.some(x=>x.specialId === s.transition!.specialId)) invalid();
  if (!record(s.historyByDrink) || Object.keys(s.historyByDrink).length !== drinks.size) invalid();
  for (const [id,points] of Object.entries(s.historyByDrink)) {
    const d=drinks.get(id); if (!d || !Array.isArray(points) || !points.length || points.length > 51) invalid();
    let at=-1; let revision=-1; let price:number|null=null;
    for (const p of points) {
      if (!record(p) || !Number.isSafeInteger(p.price) || !stamp(p.at) || p.at < at || !stamp(p.revision) || p.revision < revision || p.revision > s.revision || !['start','normal','crash','recovery','special','correction'].includes(p.kind) || p.price === price) invalid();
      validateOverride(d!,p.price); at=p.at; revision=p.revision; price=p.price;
    }
    if (price !== s.prices[id]) invalid();
  }
  if (!Array.isArray(s.history) || s.history.length > 100) invalid();
  for (const h of s.history) { if (!record(h) || !stamp(h.revision) || h.revision > s.revision || !stamp(h.publishedAt) || !['normal','crash','recovery','special','correction'].includes(h.kind)) invalid(); map(h.prices,true); }
}
export function migrateLegacy(legacy: LegacyMarketState, wallNow: number, rng: Rng): MarketState {
  validateLegacyMarket(legacy);
  const config=createDefaultConfiguration(legacy.drinks,rng); const state=createMarket(config,wallNow,rng);
  state.revision=legacy.revision; state.phase=legacy.phase; state.prices={...legacy.prices}; state.previews=structuredClone(legacy.previews); state.overrides=structuredClone(legacy.overrides);
  delete state.nextCrashPercent;delete state.activeCrashPercent;
  state.deadline=legacy.deadline; state.viewMode=legacy.viewMode; state.viewEpoch=legacy.viewEpoch; state.publishedAt=legacy.publishedAt; state.history=structuredClone(legacy.history);
  if (legacy.history.length) {
    const first=legacy.history[0]; let histories:PriceHistories=Object.fromEntries(Object.entries(first.prices).map(([id,price])=>[id,[{at:first.publishedAt,price,kind:first.kind,revision:first.revision} as PricePoint]]));
    let prices=first.prices;
    for (const h of legacy.history.slice(1)) { histories=recordChanges(histories,prices,h.prices,h.publishedAt,h.kind,h.revision); prices=h.prices; }
    state.historyByDrink=histories;
  } else state.historyByDrink=initialHistory(legacy.prices,legacy.publishedAt,legacy.revision);
  for (const d of state.drinks) {
    const points=state.historyByDrink[d.id]; const previous=legacy.previousPrices?.[d.id];
    state.previousPrices[d.id]=points.length > 1 ? points.at(-2)!.price : previous !== undefined && previous !== state.prices[d.id] ? previous : null;
  }
  if (legacy.transition) {
    state.transition={...structuredClone(legacy.transition),normalDeadline:legacy.transition.kind === 'normal' ? legacy.deadline : null};
    if (legacy.transition.kind === 'crash') state.transition.interruptedNormalPreview=buildPreview(state.drinks,state.prices,'normal',rng,state.parameters);
  }
  if (legacy.phase !== 'ready') state.schedule.startedAt=wallNow;
  state.startupHistoryByDrink=simulateStartupHistory(state.drinks,state.parameters,Math.min(...Object.values(state.historyByDrink).map(points=>points[0].at)),state.revision);
  validateStoredMarket(state); return state;
}
export function createMarketStore(path: string, options: {write?:typeof writeAtomic;now?:()=>number;rng?:Rng} = {}): MarketStore {
  const save=async(state:MarketState) => {validateStoredMarket(state); await (options.write ?? writeAtomic)(path,JSON.stringify(state));};
  return {
    save,
    async load() {
      let text:string; try {text=await readFile(path,'utf8');} catch(error) {if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error;}
      const value:unknown=JSON.parse(text);
      if (record(value) && value.schemaVersion === 1) {
        validateLegacyMarket(value); const state=migrateLegacy(value,(options.now ?? Date.now)(),options.rng ?? Math.random);
        for (let number=0;;number++) {
          const backup=`${path}.v1-backup${number ? '.'+number : ''}`;
          try {await writeFile(backup,text,{encoding:'utf8',flag:'wx',mode:0o600}); break;} catch(error) {if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;}
        }
        await save(state); return state;
      }
      validateStoredMarket(value); return value;
    },
  };
}
