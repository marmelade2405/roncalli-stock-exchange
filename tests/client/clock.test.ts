import { expect, it, vi } from 'vitest';
import { createClock } from '../../src/client/shared/clock.js';
it('estimates_server_time_from_midpoint_and_performance', () => {
  const clock = createClock(); clock.sync(1_800_000, 100, 120);
  expect(clock.now(130)).toBe(1_800_020);
});
it('device_date_does_not_change_market_time', () => {
  const clock = createClock(); clock.sync(300_000, 100, 100);
  const date = vi.spyOn(Date, 'now').mockReturnValue(9_000_000_000);
  expect(clock.now(110)).toBe(300_010); date.mockRestore();
});
