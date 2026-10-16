import { describe, expect, it, vi } from 'vitest';
import { createMarket, applyCommand, advanceMarket } from '../../src/domain/market.js';
import { makeDrink, midpointRng } from '../fixtures.js';
import type { MarketState } from '../../src/domain/types.js';
const ready = () => createMarket([makeDrink()], 0, midpointRng);
const started = () => applyCommand(ready(), { type: 'start' }, 0, midpointRng);
const override = (s: MarketState, scope: 'normal' | 'crash', value: number | null) => applyCommand(s, { type: 'override', scope, drinkId: 'bier', value }, 1000, midpointRng);

describe('Marktablauf', () => {
  it('createMarket_produces_saved_proposals', () => {
    const state = ready();
    expect(state.previews).toEqual({ normal: { bier: 200 }, crash: { bier: 180 }, recovery: null });
  });
  it('start_preserves_initial_prices', () => {
    const state = started();
    expect(state.deadline).toBe(1_200_000);
    expect(state.prices).toEqual({ bier: 200 });
    expect(state.phase).toBe('normal');
  });
  it('normal_round_consumes_only_normal_overrides', () => {
    const state = override(override(started(), 'normal', 250), 'crash', 140);
    const next = advanceMarket(state, 1_200_000, midpointRng);
    expect(next.prices).toEqual({ bier: 250 });
    expect(next.overrides).toEqual({ normal: {}, crash: { bier: 140 } });
    expect(next.previousPrices).toEqual({ bier: 200 });
    expect(next.deadline).toBe(2_400_000);
  });
  it('crash_discards_old_deadline', () => {
    const pending = applyCommand(started(), { type: 'crash' }, 60_000, midpointRng);
    expect(pending.deadline).toBe(70_000);
    expect(pending.phase).toBe('transition');
    const crash = advanceMarket(pending, 70_000, midpointRng);
    expect(crash.prices).toEqual({ bier: 180 });
    expect(crash.deadline).toBe(370_000);
    expect(crash.previews.normal).toBeNull();
  });
  it('recovery_preserves_normal_override_and_restarts_timer', () => {
    let state = override(override(started(), 'normal', 250), 'crash', 140);
    state = applyCommand(state, { type: 'crash' }, 60_000, midpointRng);
    state = advanceMarket(state, 70_000, midpointRng);
    expect(state.overrides.crash).toEqual({});
    state = advanceMarket(state, 370_000, midpointRng);
    expect(state.prices).toEqual({ bier: 150 });
    expect(state.overrides.normal).toEqual({ bier: 250 });
    expect(state.deadline).toBe(1_570_000);
    expect(advanceMarket(state, 1_200_000, midpointRng).prices).toEqual({ bier: 150 });
    state = advanceMarket(state, 1_570_000, midpointRng);
    expect(state.prices).toEqual({ bier: 250 });
    expect(state.overrides.normal).toEqual({});
  });
  it('preview_is_not_redrawn_on_publication', () => {
    let state = createMarket([makeDrink()], 0, () => .8);
    expect(state.previews.normal).toEqual({ bier: 230 });
    state = applyCommand(state, { type: 'start' }, 0, midpointRng);
    state = advanceMarket(state, 1_200_000, () => 0);
    expect(state.prices).toEqual({ bier: 230 });
    expect(state.previews.normal).toEqual({ bier: 180 });
  });
  it('locks_exactly_at_ten_seconds', () => {
    const state = started();
    expect(advanceMarket(state, 1_189_999, midpointRng).phase).toBe('normal');
    expect(advanceMarket(state, 1_190_000, midpointRng).phase).toBe('transition');
    expect(() => applyCommand(state, { type: 'crash' }, 1_190_000, midpointRng)).toThrow();
    expect(() => applyCommand(state, { type: 'override', scope: 'normal', drinkId: 'bier', value: 250 }, 1_190_000, midpointRng)).toThrow();
  });
  it('rejects_second_crash', () => {
    const crash = applyCommand(started(), { type: 'crash' }, 10_000, midpointRng);
    expect(() => applyCommand(crash, { type: 'crash' }, 10_001, midpointRng)).toThrow();
  });
  it('configuration_is_locked_after_start', () => {
    expect(() => applyCommand(started(), { type: 'configure', drinks: [makeDrink()] }, 10, midpointRng)).toThrow();
  });
  it('view_switch_does_not_redraw_prices', () => {
    const rng = vi.fn(midpointRng);
    const state = started();
    const next = applyCommand(state, { type: 'view', mode: 'ticker' }, 1234, rng);
    expect(next.viewMode).toBe('ticker');
    expect(next.previews).toEqual(state.previews);
    expect(rng).not.toHaveBeenCalled();
  });
  it('rejects_unknown_drinks_and_keeps_input_immutable', () => {
    const state = started();
    expect(() => applyCommand(state, { type: 'override', scope: 'normal', drinkId: 'missing', value: 250 }, 10, midpointRng)).toThrow();
    const next = override(state, 'normal', 250);
    expect(next.overrides.normal.bier).toBe(250);
    expect(state.overrides.normal).toEqual({});
  });
});
