import type { SpecialSchedule, MarketParameters, Rng } from './model.js';
import { DomainError } from './types.js';
import { validateParameters } from './parameters.js';
export function assertSchedulePossible(p: MarketParameters, count: number): void {
  validateParameters(p);
  if(!Number.isSafeInteger(count)||count<1)throw new DomainError('INVALID_INPUT','Die Nachrichtenliste ist leer oder ungültig.');
}
export function createSpecialSchedule(order: string[], p: MarketParameters, _rng: Rng): SpecialSchedule {
  assertSchedulePossible(p,order.length);
  if(new Set(order).size!==order.length)throw new DomainError('INVALID_INPUT','Nachrichten sind mehrfach eingeplant.');
  // Retain schema-2 slot structure. Offsets now identify queue positions only;
  // old persisted time offsets remain accepted but never trigger publications.
  return{startedAt:null,pending:order.map((specialId,offsetMs)=>({specialId,offsetMs})),done:[],lastSpecialAt:null};
}
export function consumeSpecial(s: SpecialSchedule, id: string, at: number,direction?:'up'|'down'): SpecialSchedule {
  const slot = s.pending.find(x => x.specialId === id) ?? s.done.find(x => x.specialId === id);
  if (!slot) throw new DomainError('INVALID_INPUT','Diese Nachricht ist nicht verfügbar.');
  return {...s,pending:s.pending.filter(x => x.specialId !== id),done:[...s.done.filter(x => x.specialId !== id),{...slot,publishedAt:at,...(direction===undefined?{}:{direction})}],lastSpecialAt:at};
}
