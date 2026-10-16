import type { TimeSnapshot } from './protocol.js';
import {isSimulationSpeed} from '../../domain/simulation-speed.js';
export function createClock() {
  let serverAnchor=0; let performanceAnchor=0; let rate=1; let ceiling:number|null=null; let generation=-1; let sampledAt=-1;
  return {
    sync(sample: TimeSnapshot, requestStart: number, responseEnd: number): boolean {
      const c=sample?.clock;
      if (!c || !Number.isSafeInteger(c.generation) || !Number.isSafeInteger(c.marketNow) || !Number.isSafeInteger(c.sampledAt) || !(c.rate===0||isSimulationSpeed(c.rate)) || (c.ceilingAt !== null && !Number.isSafeInteger(c.ceilingAt))) return false;
      if (c.generation < generation || (c.generation === generation && c.sampledAt < sampledAt)) return false;
      generation=c.generation; sampledAt=c.sampledAt; serverAnchor=c.marketNow; performanceAnchor=(requestStart+responseEnd)/2; rate=c.rate; ceiling=c.ceilingAt; return true;
    },
    now(performanceNow: number): number { const now=Math.floor(serverAnchor+Math.max(0,performanceNow-performanceAnchor)*rate); return ceiling === null ? now : Math.min(now,Math.max(serverAnchor,ceiling)); },
  };
}
