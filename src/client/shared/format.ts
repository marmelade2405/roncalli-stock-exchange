import type { Cents } from '../../domain/types.js';
const money = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const percent = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export function parseEuro(input: string): Cents | null {
  const text = input.trim(); if (!text) return null;
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text);
  if (!match) throw Error('Bitte einen Preis wie 2,30 eingeben.');
  const value = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (!Number.isSafeInteger(value)) throw Error('Der Preis ist zu groß.');
  return value;
}
export function formatEuro(value: Cents): string { return money.format(value / 100); }
export function formatChange(current: Cents, previous: Cents | null): { euro: string; percent: string; direction: 'up' | 'down' | 'flat' } {
  if (previous === null) return { euro: '—', percent: '—', direction: 'flat' };
  const difference = current - previous; const sign = difference > 0 ? '+' : difference < 0 ? '−' : '±';
  return { euro: sign + formatEuro(Math.abs(difference)), percent: difference===0?`${sign}${percent.format(0)} %`:previous === 0 ? '—' : `${sign}${percent.format(Math.abs(difference / previous * 100))} %`, direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat' };
}
export function inputEuro(value: Cents): string { return (value / 100).toFixed(2).replace('.', ','); }
export function formatCountdown(remaining: number | null): string {
  if (remaining === null) return '—:—';
  const seconds = Math.ceil(Math.max(0, remaining) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
