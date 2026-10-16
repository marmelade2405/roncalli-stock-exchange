import type { SpecialSchedule, MarketParameters, Rng } from './model.js';
import { DomainError } from './types.js';
import { validateParameters } from './parameters.js';
function availableStarts(p: MarketParameters): { from: number; to: number }[] {
  const until = p.eveningMs - Math.min(p.normalMs,p.eveningMs/10);
  const ranges: { from: number; to: number }[] = [];
  for (let start = 0; start < until; start += p.normalMs) {
    const from = start + p.minSpecialGapMs;
    const to = Math.min(start+p.normalMs-p.transitionMs-p.newsMs-p.minSpecialGapMs,until-p.newsMs);
    if (to > from) ranges.push({from,to});
  }
  return ranges;
}
export function assertSchedulePossible(p: MarketParameters, count: number): void {
  validateParameters(p);
  const usable = availableStarts(p).reduce((sum,r) => sum+r.to-r.from,0);
  if (!Number.isSafeInteger(count) || count < 1 || usable/count < 2*(p.newsMs+p.minSpecialGapMs)) throw new DomainError('INVALID_INPUT','Die Abenddauer ist für alle Nachrichten zu kurz. Dauer erhöhen oder Specialabstand verkleinern.');
}
export function createSpecialSchedule(order: string[], p: MarketParameters, rng: Rng): SpecialSchedule {
  assertSchedulePossible(p,order.length);
  if (new Set(order).size !== order.length) throw new DomainError('INVALID_INPUT','Nachrichten sind mehrfach eingeplant.');
  const ranges = availableStarts(p); const total = ranges.reduce((sum,r) => sum+r.to-r.from,0); const width = total/order.length;
  const pending = order.map((specialId,i) => {
    const sample = rng(); if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new DomainError('INVALID_INPUT','Ungültiger Zufallswert.');
    let distance = width*(i+.25+.5*sample);
    for (const r of ranges) { const size = r.to-r.from; if (distance <= size) return { specialId,offsetMs:Math.floor(r.from+distance) }; distance -= size; }
    throw new DomainError('INVALID_INPUT','Die Nachrichtenplanung ist ungültig.');
  });
  return {startedAt:null,pending,done:[],lastSpecialAt:null};
}
export function reorderSpecials(s: SpecialSchedule, ids: string[], activeId: string|null): SpecialSchedule {
  const current = s.pending.map(x => x.specialId);
  if (ids.length !== current.length || new Set(ids).size !== current.length || ids.some(id => !current.includes(id))) throw new DomainError('INVALID_INPUT','Die neue Nachrichtenreihenfolge ist unvollständig.');
  if (activeId && ids.indexOf(activeId) !== current.indexOf(activeId)) throw new DomainError('LOCKED','Die laufende Nachricht ist bereits festgeschrieben.');
  return {...s,pending:s.pending.map((slot,i) => ({...slot,specialId:ids[i]}))};
}
export function consumeSpecial(s: SpecialSchedule, id: string, at: number): SpecialSchedule {
  const slot = s.pending.find(x => x.specialId === id);
  if (!slot) throw new DomainError('INVALID_INPUT','Diese Nachricht wurde bereits verwendet.');
  return {...s,pending:s.pending.filter(x => x.specialId !== id),done:[...s.done,{...slot,publishedAt:at}],lastSpecialAt:at};
}
export function nextSpecialAt(s: SpecialSchedule, p: MarketParameters, deadline: number|null, published: number): number|null {
  if (s.startedAt === null || deadline === null || !s.pending.length) return null;
  const planned = s.startedAt+s.pending[0].offsetMs;
  const after = Math.max(published,s.lastSpecialAt ?? 0)+p.minSpecialGapMs;
  const candidate = Math.max(planned,after);
  return candidate+p.newsMs+p.minSpecialGapMs > deadline-p.transitionMs ? deadline+p.minSpecialGapMs : candidate;
}
