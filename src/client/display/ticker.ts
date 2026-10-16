import type { DisplayState } from '../shared/protocol.js';
import { formatEuro, formatChange } from '../shared/format.js';
import {renderChart} from './chart.js';
const cache = new WeakMap<HTMLElement, { revision: number; runId:number; track: HTMLElement; viewport: HTMLElement; height: number }>();
export function clearTicker(container:HTMLElement){cache.delete(container);container.replaceChildren();}
export function renderTicker(container: HTMLElement, state: DisplayState, serverNow: number): void {
  let current = cache.get(container);
  if (!current || current.revision !== state.revision||current.runId!==state.runId) {
    container.innerHTML = '<div class="ticker-head"><span>SYMBOL</span><span>GETRÄNK</span><span>VERLAUF</span><span>AKTUELLER KURS</span><span>VERÄNDERUNG</span></div><div class="ticker-viewport"><div class="ticker-track"></div></div>';
    const track = container.querySelector<HTMLElement>('.ticker-track')!; const viewport = container.querySelector<HTMLElement>('.ticker-viewport')!;
    for (let copy = 0; copy < 3; copy++) for (const drink of state.drinks) {
      const row = document.createElement('article'); row.className = 'ticker-row';
      row.innerHTML = '<span class="ticker-symbol mono"></span><div><strong class="ticker-name"></strong><span class="ticker-category"></span></div><div class="ticker-chart"></div><strong class="ticker-price mono" data-price></strong><span class="ticker-change mono" data-delta></span>';
      row.querySelector('.ticker-symbol')!.textContent = drink.id.replaceAll('-', '').slice(0, 5).toUpperCase(); row.querySelector('.ticker-name')!.textContent = drink.name; row.querySelector('.ticker-category')!.textContent = drink.category;
      row.querySelector('.ticker-price')!.textContent = formatEuro(state.prices[drink.id]);
      const delta = row.querySelector('.ticker-change')!; const change = formatChange(state.prices[drink.id], state.previousPrices?.[drink.id] ?? null);
      delta.className = `ticker-change mono ${change.direction}`; delta.textContent = state.previousPrices[drink.id] == null ? '—' : `${change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '→'} ${change.euro}\n${change.percent}`;
      const chart=row.querySelector<HTMLElement>('.ticker-chart')!;chart.dataset.chart=drink.id;renderChart(chart,state.historyByDrink[drink.id]??[],drink);
      if (copy > 0) row.setAttribute('aria-hidden', 'true'); track.append(row);
    }
    current = { revision: state.revision, runId:state.runId, track, viewport, height: 0 }; cache.set(container, current);
  }
  const height = Math.max(90, current.viewport.clientHeight / 5);
  if (current.height !== height) { container.style.setProperty('--ticker-row-height', `${height}px`); current.height = height; }
  const duration = state.drinks.length * state.parameters.tickerRowMs;
  const elapsed = ((serverNow - state.viewEpoch) % duration + duration) % duration;
  const position = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? Math.floor(elapsed / state.parameters.tickerRowMs) : elapsed / state.parameters.tickerRowMs;
  current.track.style.transform = `translateY(${-position * height}px)`;
}
