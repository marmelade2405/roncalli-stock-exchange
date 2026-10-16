import { expect, it } from 'vitest';
import { createMarket, applyCommand, advanceMarket, nextBoundary } from '../../src/domain/market-v2.js';
import { makeConfiguration, context } from '../v2-fixtures.js';
import { makeDrink, midpointRng } from '../fixtures.js';
import type { MarketState, MarketCommand } from '../../src/domain/model.js';
const live = () => applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);
const command = (s: MarketState,c: MarketCommand,at=0) => applyCommand(s,c,context(at),midpointRng);
const advance = (s: MarketState,at: number) => advanceMarket(s,context(at),midpointRng);
it('normal_round_is_twenty_minutes', () => {
  const s = live(); expect(s.deadline).toBe(1_200_000);
  expect(advance(s,1_200_000).deadline).toBe(2_400_000);
});
it('correction_preserves_deadline_and_override', () => {
  const s = command(live(),{type:'override',scope:'normal',drinkId:'bier',value:270});
  const corrected = command(s,{type:'correct',drinkId:'bier',value:250},1000);
  expect(corrected.prices.bier).toBe(250); expect(corrected.deadline).toBe(1_200_000);
  expect(corrected.overrides.normal.bier).toBe(270); expect(corrected.previews.normal!.bier).toBe(200);
});
it('correction_changes_only_affected_forecast_and_basis', () => {
  const a = command(live(),{type:'correct',drinkId:'cola',value:160},1000);
  const b = command(a,{type:'correct',drinkId:'bier',value:250},2000);
  expect(b.previousPrices).toMatchObject({cola:150,bier:200,radler:null});
  expect(b.historyByDrink.cola).toEqual(a.historyByDrink.cola);
  expect(b.previews.crash).toMatchObject({bier:230,cola:140,radler:180});
  expect(a.prices.bier).toBe(200);
});
it('unchanged_price_does_not_add_history', () => {
  const s = live(); const next = command(s,{type:'correct',drinkId:'bier',value:200},1000);
  expect(next.historyByDrink.bier).toHaveLength(1); expect(next.previousPrices.bier).toBeNull();
});
it('special_freezes_then_changes_one_drink', () => {
  const s = live(); const intro = command(s,{type:'special',specialId:'bier-down'},60_000);
  expect(intro.transition).toMatchObject({kind:'special',publishAt:70_000,normalDeadline:1_200_000,prices:{bier:120}});
  expect(intro.prices.bier).toBe(200); expect(advance(intro,69_999).prices.bier).toBe(200);
  const published = advance(intro,70_000);
  expect(published.prices).toMatchObject({bier:120,cola:150}); expect(published.deadline).toBe(1_200_000);
  expect(published.historyByDrink.bier).toHaveLength(2); expect(published.historyByDrink.cola).toHaveLength(1);
  expect(published.previews.crash!.bier).toBe(110);
});
it('special_preserves_normal_preview_and_override', () => {
  const s = command(live(),{type:'override',scope:'normal',drinkId:'bier',value:250});
  const published = advance(command(s,{type:'special',specialId:'bier-down'},60_000),70_000);
  expect(published.previews.normal).toEqual(s.previews.normal); expect(published.overrides.normal.bier).toBe(250);
  const round = advance(published,1_200_000); expect(round.prices.bier).toBe(250); expect(round.overrides.normal).toEqual({});
});
it('failed_candidate_does_not_consume_slot', () => {
  const original = live(); const intro = command(original,{type:'special',specialId:'bier-down'},60_000);
  const candidate = advance(intro,70_000);
  expect(intro.schedule.pending.some(x => x.specialId === 'bier-down')).toBe(true);
  expect(candidate.schedule.pending.some(x => x.specialId === 'bier-down')).toBe(false);
  expect(original.prices.bier).toBe(200); expect(original.schedule.done).toEqual([]);
});
it('normal_transition_wins_collision', () => {
  const s = live(); s.schedule.pending[0] = {specialId:'bier-down',offsetMs:1_190_000};
  expect(advance(s,1_190_000).transition!.kind).toBe('normal');
  expect(() => command(s,{type:'special',specialId:'bier-down'},1_180_000)).toThrow();
});
it('crash_defers_special', () => {
  const crash = advance(command(live(),{type:'crash'},60_000),70_000);
  expect(() => command(crash,{type:'special',specialId:'bier-down'},80_000)).toThrow();
  expect(advance(crash,100_000).schedule.pending).toHaveLength(16);
});
it('cancel_crash_uses_saved_recovery', () => {
  const s = command(live(),{type:'override',scope:'normal',drinkId:'bier',value:250});
  const crash = advance(command(s,{type:'crash'},60_000),70_000);
  const cancelled = command(crash,{type:'cancel-crash'},80_000);
  expect(cancelled.transition).toMatchObject({kind:'recovery',publishAt:90_000,prices:crash.previews.recovery});
  const recovered = advance(cancelled,90_000);
  expect(recovered.prices).toEqual(crash.previews.recovery); expect(recovered.deadline).toBe(1_290_000); expect(recovered.overrides.normal.bier).toBe(250);
});
it('cancel_crash_intro_keeps_overrides', () => {
  const s = command(live(),{type:'override',scope:'crash',drinkId:'bier',value:140});
  const intro = command(s,{type:'crash'},60_000); const cancelled = command(intro,{type:'cancel-crash'},65_000);
  expect(cancelled.phase).toBe('normal'); expect(cancelled.prices.bier).toBe(200);
  expect(cancelled.overrides.crash.bier).toBe(140); expect(cancelled.previews.normal).toEqual(s.previews.normal); expect(cancelled.deadline).toBe(1_265_000);
});
it('reset_keeps_or_restores_configuration', () => {
  const cfg = makeConfiguration(); cfg.parameters.normalMs=600_000; cfg.drinks[0].startCents=220; cfg.specials[0].headline='Eigene Meldung';
  const s = command(applyCommand(createMarket(cfg,0,midpointRng),{type:'start'},context(0),midpointRng),{type:'view',mode:'ticker'});
  const reset = command(s,{type:'reset',kind:'evening'},1000);
  expect(reset.phase).toBe('ready'); expect(reset.parameters.normalMs).toBe(600_000); expect(reset.prices.bier).toBe(220); expect(reset.viewMode).toBe('ticker'); expect(reset.specials[0].headline).toBe('Eigene Meldung');
  const factory = command(reset,{type:'reset',kind:'factory'},2000);
  expect(factory.parameters.normalMs).toBe(1_200_000); expect(factory.prices.bier).toBe(180); expect(factory.viewMode).toBe('ticker');
});
it('reset_stops_pending_event_and_increases_ids', () => {
  const intro = command(live(),{type:'special',specialId:'bier-down'},60_000); const reset = command(intro,{type:'reset',kind:'evening'},65_000);
  expect(reset.revision).toBeGreaterThan(intro.revision); expect(reset.runId).toBe(intro.runId+1); expect(reset.clock.generation).toBeGreaterThan(intro.clock.generation);
  expect(advance(reset,70_000).phase).toBe('ready'); expect(reset.schedule.pending).toHaveLength(16); expect(reset.historyByDrink.bier).toHaveLength(1);
});
it('special_at_limit_is_consumed_without_fake_history', () => {
  const s = command(live(),{type:'correct',drinkId:'bier',value:300},1000); const pub = advance(command(s,{type:'special',specialId:'bier-up'},60_000),70_000);
  expect(pub.prices.bier).toBe(300); expect(pub.historyByDrink.bier).toHaveLength(2); expect(pub.schedule.done[0].specialId).toBe('bier-up');
});
it('configured_crash_trends_and_amplitude_are_used', () => {
  const cfg = makeConfiguration([makeDrink()]); cfg.parameters.crashTrendPercent=-20; cfg.parameters.recoveryTrendPercent=50;
  delete cfg.parameters.crashMinPercent;delete cfg.parameters.crashMaxPercent;
  const s = createMarket(cfg,0,midpointRng); expect(s.previews.crash!.bier).toBe(160);
  const crash = advance(command(command(s,{type:'start'}),{type:'crash'}),10_000); expect(crash.previews.recovery!.bier).toBe(240);
});
it('simulation_step_and_pause_preserve_animation', () => {
  const s = command(createMarket(makeConfiguration(),0,midpointRng),{type:'simulation',enabled:true,speed:120});
  const started = command(s,{type:'start'}); const stepped = command(started,{type:'step'},1000);
  expect(stepped.phase).toBe('transition'); expect(stepped.clock.rate).toBe(1); expect(stepped.clock.marketAnchor).toBe(nextBoundary(started));
  const t = {wallNow:1000,marketNow:stepped.clock.marketAnchor};
  const paused = applyCommand(stepped,{type:'pause',paused:true},t,midpointRng); expect(paused.clock.rate).toBe(0);
  const resumed = applyCommand(paused,{type:'pause',paused:false},t,midpointRng); expect(resumed.clock.rate).toBe(1);
});
