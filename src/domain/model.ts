import type { Cents, DrinkConfig, PriceMap, OverrideMap, ViewMode } from './types.js';
export type { Cents, DrinkConfig, PriceMap, OverrideMap, ViewMode, Rng } from './types.js';
export interface MarketParameters { normalMs: number; crashMs: number; transitionMs: number; newsMs: number; newsIntroMs?:number; priceRevealMs?:number; eveningMs: number; minSpecialGapMs: number; crashMinPercent?:number;crashMaxPercent?:number;crashTrendPercent: number; recoveryTrendPercent: number; crashAmplitudeFactor: number; historyChanges: number; tickerRowMs: number }
export interface Publication{wallAt:number;revision:number;kind:Exclude<PriceEventKind,'start'>;changedDrinkIds:string[]}
// percent is legacy metadata for older market files; it does not control prices.
export interface SpecialDefinition { id: string; drinkId: string; direction: 'up' | 'down'; percent?: number; targetCents?:number; headline: string; body: string }
export interface PreparedConfig { drinks: DrinkConfig[]; parameters: MarketParameters; specials: SpecialDefinition[]; specialOrder: string[] }
export type RoundKind = 'normal' | 'crash' | 'recovery' | 'special';
export type RandomRoundKind = Exclude<RoundKind, 'special'>;
export type ChartMode = 'line'|'bars'|'bars-gap';
export type PriceEventKind = 'start' | RoundKind | 'correction';
export interface PricePoint { at: number; price: Cents; kind: PriceEventKind; revision: number }
export type PriceHistories = Record<string, PricePoint[]>;
export type Speed = number;
export interface MarketClockState { mode: 'live' | 'simulation'; speed: Speed; paused: boolean; rate: 0 | Speed; marketAnchor: number; wallAnchor: number; generation: number }
export type ClockSnapshot = Pick<MarketClockState, 'mode' | 'speed' | 'paused' | 'rate' | 'generation'> & { marketNow: number; sampledAt: number; ceilingAt: number | null };
export interface TimeSnapshot { serverNow: number; clock: ClockSnapshot }
export interface SpecialSlot { specialId: string; offsetMs: number }
export interface SpecialSchedule { startedAt: number | null; pending: SpecialSlot[]; done: (SpecialSlot & { publishedAt: number; direction?:'up'|'down' })[]; lastSpecialAt: number | null }
export interface Transition { kind: RoundKind; publishAt: number; prices: PriceMap; normalDeadline: number | null; specialId?: string; interruptedNormalPreview?: PriceMap }
export interface PublishedRound { revision: number; kind: Exclude<PriceEventKind, 'start'>; publishedAt: number; prices: PriceMap }
export interface MarketState extends PreparedConfig {
  schemaVersion: 2; revision: number; runId: number; phase: 'ready' | 'normal' | 'crash' | 'transition';
  prices: PriceMap; previousPrices: Record<string, Cents | null>;
  previews: { normal: PriceMap | null; crash: PriceMap | null; recovery: PriceMap | null }; overrides: { normal: OverrideMap; crash: OverrideMap };
  deadline: number | null; transition: Transition | null; viewMode: ViewMode; viewEpoch: number; publishedAt: number;
  history: PublishedRound[]; historyByDrink: PriceHistories; clock: MarketClockState; schedule: SpecialSchedule; publication?:Publication; roundPublication?:Publication; quotePublicationOverrides?:Record<string,{wallAt:number;revision:number}>; quoteRevealUntil?:number;
  nextCrashPercent?:number;activeCrashPercent?:number;tickerOffsetRows?:number;tickerWallAt?:number;
  startupHistoryByDrink?:PriceHistories;
  chartMode?:ChartMode;
  tickerColumns?:2|3;
}
export interface MarketContext { wallNow: number; marketNow: number }
export type MarketCommand =
  | { type: 'start' } | { type: 'crash' } | { type: 'cancel-crash' } | { type: 'step' }
  | { type: 'override'; scope: 'normal' | 'crash'; drinkId: string; value: Cents | null }
  | { type: 'view'; mode: ViewMode }
  | {type:'chart-mode';mode:ChartMode}
  | {type:'ticker-columns';columns:2|3}
  | {type:'ticker-speed';rowMs:number} | {type:'skip-transition'}
  | { type: 'configure'; drinks: DrinkConfig[]; parameters?: MarketParameters; specials?: SpecialDefinition[]; specialOrder?: string[] }
  | { type: 'correct'; drinkId: string; value: Cents }
  | { type: 'special'; specialId: string }
  | { type: 'reset'; kind: 'evening' | 'factory' }
  | { type: 'simulation'; enabled: boolean; speed?: Speed }
  | { type: 'pause'; paused: boolean };
export interface SpecialPreview { price: Cents; delta: Cents; percent: number; limited: boolean }
export interface DisplayState {
  revision: number; runId: number; phase: MarketState['phase']; drinks: (Pick<DrinkConfig,'id'|'name'|'category'|'minCents'|'maxCents'> & {averageCents:number})[];
  prices: PriceMap; previousPrices: Record<string,Cents|null>; deadline: number|null; nextKind: RoundKind|null; nextNormalAt: number|null; hideAt: number|null;
  publishedAt: number; viewMode: ViewMode; viewEpoch: number; historyByDrink: PriceHistories;
  chartMode?:ChartMode;
  tickerColumns?:2|3;
  startupHistoryByDrink?:PriceHistories;
  parameters: Pick<MarketParameters,'transitionMs'|'newsMs'|'newsIntroMs'|'priceRevealMs'|'historyChanges'|'tickerRowMs'>;
  publication?:Publication;
  crashPercent?:number;tickerOffsetRows?:number;tickerWallAt?:number;
  roundPublication?:Publication;
  quotePublicationOverrides?:Record<string,{wallAt:number;revision:number}>;
  news: Pick<SpecialDefinition,'id'|'drinkId'|'direction'|'headline'|'body'>|null;
  recentNews:(Pick<SpecialDefinition,'id'|'drinkId'|'direction'|'headline'|'body'> & {publishedAt:number})|null;
}
export interface AdminState extends DisplayState {
  nextCrashPercent?:number;
  config: DrinkConfig[]; parameters: MarketParameters; specials: SpecialDefinition[]; specialOrder: string[];
  schedule: SpecialSchedule; specialPreviews: Record<string,SpecialPreview>; previews: MarketState['previews']; overrides: MarketState['overrides']; pendingPrices: PriceMap|null;
}
export interface Snapshot<T> extends TimeSnapshot { type: 'state'; state: T }
export interface CommandRequest { expectedRevision: number; command: MarketCommand }
