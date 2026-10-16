import { expect, it } from 'vitest';
import { createMarketClock, readMarketTime, rebaseClock, projectClock, advanceClock, restoreClock } from '../../src/domain/market-clock.js';
const simulation = (speed: 60|120 = 60) => rebaseClock(createMarketClock(0),0,0,{mode:'simulation',speed,rate:speed});
it('live_clock_uses_real_monotonic_time', () => {
  const c = createMarketClock(1000);
  expect(readMarketTime(c,2000)).toBe(2000); expect(readMarketTime(c,800)).toBe(1000);
});
it('sixty_times_scales_elapsed_time', () => { expect(readMarketTime(simulation(),1000)).toBe(60_000); });
it('pause_does_not_advance', () => {
  const c = rebaseClock(simulation(),20,1200,{paused:true});
  expect(readMarketTime(c,900_000)).toBe(1200); expect(c.rate).toBe(0);
});
it('one_twenty_times_stops_exactly_at_boundary', () => {
  const result = advanceClock(simulation(120),250,12_345);
  expect(result.marketNow).toBe(12_345); expect(result.reachedBoundary).toBe(true);
  expect(projectClock(simulation(120),250,12_345).marketNow).toBe(12_345);
});
it('transition_rate_is_one', () => {
  const c = advanceClock(simulation(),1000,30_000).clock;
  expect(c.rate).toBe(1); expect(readMarketTime(c,2000)).toBe(31_000);
});
it('generation_increases_on_jump', () => {
  const c = simulation(); const jumped = rebaseClock(c,1000,900_000,{});
  expect(jumped.generation).toBeGreaterThan(c.generation); expect(readMarketTime(jumped,1000)).toBe(900_000);
});
it('restart_simulation_pauses_saved_anchor', () => {
  const c = rebaseClock(simulation(),1000,60_000,{}); const restored = restoreClock(c,18_000_000);
  expect(restored).toMatchObject({paused:true,rate:0,marketAnchor:60_000});
  expect(readMarketTime(restored,18_001_000)).toBe(60_000);
});
