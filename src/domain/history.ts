import type { PriceHistories, PriceMap, PricePoint, PriceEventKind } from './model.js';
export function initialHistory(prices: PriceMap, at: number, revision: number): PriceHistories {
  return Object.fromEntries(Object.entries(prices).map(([id,price]) => [id,[{ at,price,kind:'start',revision }]]));
}
export function recordChanges(h: PriceHistories, before: PriceMap, after: PriceMap, at: number, kind: PriceEventKind, revision: number): PriceHistories {
  const next = { ...h };
  for (const [id,price] of Object.entries(after)) if (price !== before[id]) next[id] = [...(h[id] ?? []),{ at,price,kind,revision }].slice(-51);
  return next;
}
export function visibleHistory(points: PricePoint[], changes: number): PricePoint[] { return points.slice(-(changes + 1)); }
