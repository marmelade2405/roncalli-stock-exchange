import { expect, it, vi } from 'vitest';
import { createClock } from '../../src/client/shared/clock.js';
import type { TimeSnapshot, Speed } from '../../src/domain/model.js';
const sample = (marketNow: number, rate: 0|Speed = 1, generation=0, sampledAt=0, ceilingAt:number|null=null):TimeSnapshot => ({serverNow:sampledAt,clock:{mode:rate === 1 && ceilingAt === null ? 'live' : 'simulation',speed:rate === 0 ? 60 : rate,paused:rate === 0,rate,generation,marketNow,sampledAt,ceilingAt}});
it('estimates_server_time_from_midpoint_and_performance', () => {
  const clock = createClock(); clock.sync(sample(1_800_000), 100, 120);
  expect(clock.now(130)).toBe(1_800_020);
});
it('device_date_does_not_change_market_time', () => {
  const clock = createClock(); clock.sync(sample(300_000), 100, 100);
  const date = vi.spyOn(Date, 'now').mockReturnValue(9_000_000_000);
  expect(clock.now(110)).toBe(300_010); date.mockRestore();
});
it('scaled_midpoint_clock_projects_market_time', () => {
  const c=createClock(); c.sync(sample(0,60),100,100); expect(c.now(1100)).toBe(60_000);
});
it('arbitrary_slider_rate_projects_market_time',()=>{const clock=createClock();expect(clock.sync(sample(500,37),100,100)).toBe(true);expect(clock.now(1100)).toBe(37500);});
it('clock_clamps_to_boundary', () => {
  const c=createClock(); c.sync(sample(0,120,1,0,120_000),100,100); expect(c.now(10_000)).toBe(120_000);
});
it('pause_freezes_projection', () => {
  const c=createClock(); c.sync(sample(1234,0),100,100); expect(c.now(9_000_000)).toBe(1234);
});
it('stale_generation_cannot_undo_reset', () => {
  const c=createClock(); c.sync(sample(100,1,5,1000),100,100);
  expect(c.sync(sample(9_000_000,120,4,2000),200,200)).toBe(false); expect(c.now(200)).toBe(200);
});
it('old_same_generation_sample_is_ignored', () => {
  const c=createClock(); c.sync(sample(1000,1,5,1000),100,100);
  expect(c.sync(sample(0,1,5,900),200,200)).toBe(false); expect(c.now(200)).toBe(1100);
});
