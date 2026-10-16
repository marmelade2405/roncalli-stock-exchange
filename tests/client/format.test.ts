import { expect, it } from 'vitest';
import { parseEuro, formatEuro, formatChange } from '../../src/client/shared/format.js';
it('parses_comma_and_dot_without_float_money', () => {
  expect(parseEuro('2,30')).toBe(230); expect(parseEuro('2.30')).toBe(230); expect(parseEuro('')).toBeNull(); expect(parseEuro('0,10')).toBe(10);
});
it('rejects_incomplete_and_overprecise_values', () => { for (const text of ['2,', '2.300', 'abc', '-1', 'Infinity']) expect(() => parseEuro(text)).toThrow(); });
it('formats_real_changes_and_handles_zero_baseline', () => {
  expect(formatEuro(230).replaceAll('\u00a0', ' ')).toBe('2,30 €');
  expect(formatChange(180, 200).direction).toBe('down');
  expect(formatChange(180, 200).percent).toContain('10,0');
  expect(formatChange(180, 200).euro).toContain('0,20');
  expect(formatChange(200, 0).percent).toBe('—');
  expect(formatChange(200, null).euro).toBe('—');
});
