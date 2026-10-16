import { expect, it } from 'vitest';
import { createFreshness } from '../../src/client/shared/freshness.js';
it('freshness_expires_after_fifteen_real_seconds', () => {
  const f=createFreshness(); expect(f.isFresh(0)).toBe(false); f.received(100);
  expect(f.isFresh(15_100)).toBe(true); expect(f.isFresh(15_101)).toBe(false);
  f.received(16_000); expect(f.isFresh(16_001)).toBe(true); f.reset(); expect(f.isFresh(16_001)).toBe(false);
});
