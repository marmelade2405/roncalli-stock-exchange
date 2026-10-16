import { expect, it } from 'vitest';
import { initialHistory, recordChanges, visibleHistory } from '../../src/domain/history.js';
import type { PricePoint } from '../../src/domain/model.js';
it('history_records_only_changed_drink', () => {
  const before = initialHistory({ bier: 200, cola: 150 }, 0, 0);
  const after = recordChanges(before, { bier: 200, cola: 150 }, { bier: 250, cola: 150 }, 1000, 'correction', 1);
  expect(after.bier).toEqual([{ at: 0, price: 200, kind: 'start', revision: 0 }, { at: 1000, price: 250, kind: 'correction', revision: 1 }]);
  expect(after.cola).toEqual([{ at: 0, price: 150, kind: 'start', revision: 0 }]);
  expect(before.bier).toHaveLength(1);
});
it('same_timestamp_keeps_publication_order', () => {
  const a = recordChanges(initialHistory({ bier: 200 }, 0, 0), { bier: 200 }, { bier: 250 }, 1000, 'correction', 1);
  const b = recordChanges(a, { bier: 250 }, { bier: 180 }, 1000, 'special', 2);
  expect(b.bier.map(x => [x.at, x.price])).toEqual([[0, 200], [1000, 250], [1000, 180]]);
});
it('ten_changes_have_eleven_points', () => {
  const points: PricePoint[] = Array.from({ length: 15 }, (_, i) => ({ at: i * 1000, price: 100 + i * 10, kind: 'normal', revision: i }));
  expect(visibleHistory(points, 10).map(x => x.price)).toEqual([140,150,160,170,180,190,200,210,220,230,240]);
});
it('storage_keeps_fifty_changes', () => {
  let h = initialHistory({ bier: 100 }, 0, 0);
  for (let i = 1; i <= 60; i++) h = recordChanges(h, { bier: 100 + (i-1)*10 }, { bier: 100+i*10 }, i*1000, 'normal', i);
  expect(h.bier).toHaveLength(51); expect(h.bier[0].price).toBe(200); expect(h.bier.at(-1)?.price).toBe(700);
});
