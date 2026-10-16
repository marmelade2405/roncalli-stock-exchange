import { expect, it } from 'vitest';
import { createSpecialSchedule, consumeSpecial, assertSchedulePossible } from '../../src/domain/special-schedule.js';
import { makeConfiguration } from '../v2-fixtures.js';
import { midpointRng } from '../fixtures.js';
import type { SpecialSchedule } from '../../src/domain/model.js';
const three = (): SpecialSchedule => ({ startedAt:0,pending:[{specialId:'a',offsetMs:100},{specialId:'b',offsetMs:600},{specialId:'c',offsetMs:900}],done:[],lastSpecialAt:null });
it('manual_queue_preserves_requested_order_without_random_timing', () => {
  const c = makeConfiguration(); const a = createSpecialSchedule(c.specialOrder,c.parameters,midpointRng);
  expect(a).toEqual(createSpecialSchedule(c.specialOrder,c.parameters,midpointRng));
  expect(a.pending.map(slot=>slot.specialId)).toEqual(c.specialOrder);
  expect(a).toEqual(createSpecialSchedule(c.specialOrder,c.parameters,()=>.999999));
});
it('manual_queue_accepts_all_slots_independent_of_evening_duration', () => {
  const c = makeConfiguration();
  for (const sample of [0,.1,.5,.9,.999999]) {
    const s = createSpecialSchedule(c.specialOrder,{...c.parameters,eveningMs:1800000},() => sample);
    expect(s.pending).toHaveLength(16); expect(new Set(s.pending.map(x => x.specialId)).size).toBe(16);
    for (const [i,x] of s.pending.entries()) {
      if (i) expect(x.offsetMs).toBeGreaterThan(s.pending[i-1].offsetMs);
    }
  }
});
it('direct_consumption_removes_only_selected_slot', () => {
  const s = consumeSpecial(three(),'b',200);
  expect(s.pending).toEqual([{specialId:'a',offsetMs:100},{specialId:'c',offsetMs:900}]);
  expect(s.done).toEqual([{specialId:'b',offsetMs:600,publishedAt:200}]);
  expect(consumeSpecial(s,'b',300).done).toEqual([{specialId:'b',offsetMs:600,publishedAt:300}]);
});
it('duplicate_manual_slots_are_rejected', () => {
  expect(()=>createSpecialSchedule(['a','a'],makeConfiguration().parameters,midpointRng)).toThrow();
});
it('manual_queue_requires_at_least_one_special', () => {
  expect(() => assertSchedulePossible(makeConfiguration().parameters,0)).toThrow();
});
