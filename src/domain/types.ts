export type Cents = number;
export type PriceMap = Record<string, Cents>;
export type OverrideMap = Record<string, Cents | null>;
export type Rng = () => number;
export type RoundKind = 'normal' | 'crash' | 'recovery';
export type ViewMode = 'overview' | 'ticker';
export interface DrinkConfig {
  id: string; name: string; category: string;
  startCents: Cents; minCents: Cents; maxCents: Cents; amplitudeCents: Cents; stepCents: Cents;
}
export interface Transition { kind: RoundKind; publishAt: number; prices: PriceMap }
export interface PublishedRound { revision: number; kind: RoundKind; publishedAt: number; prices: PriceMap }
export interface MarketState {
  schemaVersion: 1; revision: number; phase: 'ready' | 'normal' | 'crash' | 'transition';
  drinks: DrinkConfig[]; prices: PriceMap; previousPrices: PriceMap | null;
  previews: { normal: PriceMap | null; crash: PriceMap | null; recovery: PriceMap | null };
  overrides: { normal: OverrideMap; crash: OverrideMap };
  deadline: number | null; transition: Transition | null;
  viewMode: ViewMode; viewEpoch: number; publishedAt: number; history: PublishedRound[];
}
export type MarketCommand =
  | { type: 'start' } | { type: 'crash' }
  | { type: 'override'; scope: 'normal' | 'crash'; drinkId: string; value: Cents | null }
  | { type: 'view'; mode: ViewMode }
  | { type: 'configure'; drinks: DrinkConfig[] };
export class DomainError extends Error {
  constructor(public readonly code: 'INVALID_INPUT' | 'LOCKED' | 'INVALID_PHASE' | 'UNKNOWN_DRINK', message: string) {
    super(message); this.name = 'DomainError';
  }
}
export interface DisplayState {
  revision: number; phase: MarketState['phase']; drinks: Pick<DrinkConfig, 'id' | 'name' | 'category'>[];
  prices: PriceMap; previousPrices: PriceMap | null; deadline: number | null;
  nextKind: RoundKind | null; publishedAt: number; viewMode: ViewMode; viewEpoch: number;
}
export interface AdminState extends DisplayState {
  config: DrinkConfig[]; previews: MarketState['previews']; overrides: MarketState['overrides']; pendingPrices: PriceMap | null;
}
export interface Snapshot<T> { type: 'state'; serverNow: number; state: T }
export interface CommandRequest { expectedRevision: number; command: MarketCommand }
