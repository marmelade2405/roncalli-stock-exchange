export type Cents = number;
export type PriceMap = Record<string, Cents>;
export type OverrideMap = Record<string, Cents | null>;
export type Rng = () => number;
export type ViewMode = 'overview' | 'ticker';
export interface DrinkConfig {
  id: string; name: string; category: string;
  startCents: Cents; minCents: Cents; maxCents: Cents; amplitudeCents: Cents; stepCents: Cents;
  averageCents?:Cents; reversionPercent?:number; fixedPriceCents?:Cents;
}
export class DomainError extends Error {
  constructor(public readonly code: 'INVALID_INPUT' | 'LOCKED' | 'INVALID_PHASE' | 'UNKNOWN_DRINK', message: string) {
    super(message); this.name = 'DomainError';
  }
}
export type { MarketState, MarketParameters, PreparedConfig, MarketContext, MarketCommand, RoundKind, RandomRoundKind, Transition, PublishedRound, DisplayState, AdminState, Snapshot, CommandRequest, PricePoint, PriceHistories, SpecialDefinition, SpecialPreview, SpecialSchedule, MarketClockState, ClockSnapshot, TimeSnapshot, Speed } from './model.js';
