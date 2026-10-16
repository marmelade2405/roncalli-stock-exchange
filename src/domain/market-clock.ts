import type { MarketClockState, ClockSnapshot } from './model.js';
import { DomainError } from './types.js';
import {isSimulationSpeed} from './simulation-speed.js';
function timestamp(value: number) { if (!Number.isSafeInteger(value) || value < 0) throw new DomainError('INVALID_INPUT','Ungültige Marktzeit.'); return value; }
export function createMarketClock(now: number): MarketClockState { return {mode:'live',speed:1,paused:false,rate:1,marketAnchor:timestamp(now),wallAnchor:now,generation:0}; }
export function readMarketTime(c: MarketClockState, now: number): number { return timestamp(Math.floor(c.marketAnchor+Math.max(0,timestamp(now)-c.wallAnchor)*c.rate)); }
export function projectClock(c: MarketClockState, now: number, ceilingAt: number|null): ClockSnapshot {
  const time = readMarketTime(c,now);
  const marketNow = c.mode === 'simulation' && ceilingAt !== null ? Math.max(c.marketAnchor,Math.min(time,ceilingAt)) : time;
  return {mode:c.mode,speed:c.speed,paused:c.paused,rate:c.rate,generation:c.generation,marketNow,sampledAt:now,ceilingAt:c.mode === 'simulation' ? ceilingAt : null};
}
export function rebaseClock(c: MarketClockState, wall: number, market: number, patch: Partial<Pick<MarketClockState,'mode'|'speed'|'paused'|'rate'>>): MarketClockState {
  const next = {...c,...patch,wallAnchor:timestamp(wall),marketAnchor:timestamp(market),generation:c.generation+1};
  if (!isSimulationSpeed(next.speed) || !(next.rate===0||isSimulationSpeed(next.rate))) throw new DomainError('INVALID_INPUT','Simulationsgeschwindigkeit: ganze Werte von 1× bis 500× wählen.');
  if (next.mode === 'live') { next.speed=1; next.paused=false; next.rate=1; }
  else if (next.paused) next.rate=0;
  else if (patch.rate === undefined && (patch.speed !== undefined || patch.mode !== undefined || (patch.paused === false && c.paused))) next.rate=next.speed;
  return next;
}
export function advanceClock(c: MarketClockState, now: number, boundary: number|null): { clock: MarketClockState; marketNow: number; reachedBoundary: boolean } {
  const projected = readMarketTime(c,now);
  const reachedBoundary = !c.paused && boundary !== null && projected >= boundary;
  if (c.mode === 'simulation' && reachedBoundary) {
    const marketNow = Math.max(c.marketAnchor,boundary!);
    return {clock:rebaseClock(c,now,marketNow,{rate:1}),marketNow,reachedBoundary:true};
  }
  return {clock:c,marketNow:projected,reachedBoundary};
}
export function restoreClock(c: MarketClockState, now: number): MarketClockState {
  return c.mode === 'simulation' ? rebaseClock(c,now,c.marketAnchor,{paused:true,rate:0}) : rebaseClock(c,now,now,{mode:'live'});
}
