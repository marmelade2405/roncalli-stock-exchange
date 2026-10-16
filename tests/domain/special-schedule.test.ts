import { expect, it } from 'vitest';
import { createSpecialSchedule, reorderSpecials, consumeSpecial, nextSpecialAt, assertSchedulePossible } from '../../src/domain/special-schedule.js';
import { makeConfiguration } from '../v2-fixtures.js';
import { midpointRng } from '../fixtures.js';
import type { SpecialSchedule } from '../../src/domain/model.js';
const three = (): SpecialSchedule => ({ startedAt:0,pending:[{specialId:'a',offsetMs:100},{specialId:'b',offsetMs:600},{specialId:'c',offsetMs:900}],done:[],lastSpecialAt:null });
it('schedule_is_reproducible_and_distributed', () => {
  const c = makeConfiguration(); const a = createSpecialSchedule(c.specialOrder,c.parameters,midpointRng);
  expect(a).toEqual(createSpecialSchedule(c.specialOrder,c.parameters,midpointRng));
  expect(a.pending[0].offsetMs).toBeLessThan(1_200_000);
  expect(a.pending.at(-1)!.offsetMs).toBeGreaterThan(15_000_000);
});
it('all_sixteen_slots_fit_evening', () => {
  const c = makeConfiguration();
  for (const sample of [0,.1,.5,.9,.999999]) {
    const s = createSpecialSchedule(c.specialOrder,c.parameters,() => sample);
    expect(s.pending).toHaveLength(16); expect(new Set(s.pending.map(x => x.specialId)).size).toBe(16);
    for (const [i,x] of s.pending.entries()) {
      expect(x.offsetMs).toBeGreaterThan(0); expect(x.offsetMs).toBeLessThan(16_800_000);
      expect(x.offsetMs % 1_200_000).toBeGreaterThanOrEqual(120_000);
      expect(x.offsetMs % 1_200_000).toBeLessThanOrEqual(1_060_000);
      if (i) expect(x.offsetMs - s.pending[i-1].offsetMs).toBeGreaterThanOrEqual(130_000);
    }
  }
});
it('reorder_keeps_offsets', () => {
  const original = three(); const reordered = reorderSpecials(original,['c','a','b'],null);
  expect(reordered.pending).toEqual([{specialId:'c',offsetMs:100},{specialId:'a',offsetMs:600},{specialId:'b',offsetMs:900}]);
  expect(original.pending[0].specialId).toBe('a');
});
it('direct_consumption_removes_only_selected_slot', () => {
  const s = consumeSpecial(three(),'b',200);
  expect(s.pending).toEqual([{specialId:'a',offsetMs:100},{specialId:'c',offsetMs:900}]);
  expect(s.done).toEqual([{specialId:'b',offsetMs:600,publishedAt:200}]);
  expect(() => consumeSpecial(s,'b',300)).toThrow();
});
it('duplicate_and_active_reorders_rejected', () => {
  expect(() => reorderSpecials(three(),['a','a','c'],null)).toThrow();
  expect(() => reorderSpecials(three(),['c','b','a'],'a')).toThrow();
});
it('collision_waits_until_after_regular_round', () => {
  const s = three(); s.pending=[{specialId:'a',offsetMs:1_190_000}];
  expect(nextSpecialAt(s,makeConfiguration().parameters,1_200_000,0)).toBe(1_320_000);
  expect(nextSpecialAt(s,makeConfiguration().parameters,2_400_000,1_200_000)).toBe(1_320_000);
  expect(nextSpecialAt(s,makeConfiguration().parameters,null,0)).toBeNull();
});
it('unplannable_configuration_rejected', () => {
  expect(() => assertSchedulePossible({...makeConfiguration().parameters,eveningMs:1_800_000},16)).toThrow();
});
