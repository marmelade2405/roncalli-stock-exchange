import type { DisplayState } from '../shared/protocol.js';
import { formatChange } from '../shared/format.js';
import {renderChart,clearCharts} from './chart.js';
import {combineHistory} from '../../domain/startup-history.js';
export function renderOverview(container: HTMLElement, state: DisplayState): void {
  const columns = state.drinks.length > 16 ? 5 : state.drinks.length > 12 ? 4 : state.drinks.length>8?3:2;
  container.classList.toggle('compact-quotes',state.drinks.length>8);
  container.style.setProperty('--columns', String(columns)); container.style.setProperty('--rows', String(Math.ceil(state.drinks.length / columns)));
  clearCharts(container);container.replaceChildren();
  for (const [index, drink] of state.drinks.entries()) {
    const card = document.createElement('article'); card.className = 'quote-card';
    card.dataset.quoteDrink=drink.id;
    if(state.recentNews?.drinkId===drink.id){card.dataset.specialHighlight='true';card.dataset.specialDirection=state.recentNews.direction;}
    card.innerHTML = '<h2 class="quote-name"></h2><div class="quote-placeholder" aria-hidden="true">…</div><div class="quote-main"><div class="quote-price-stack"><span class="price-signal" aria-hidden="true"></span><div class="quote-price mono" data-price><span class="amount"></span><span class="currency">€</span></div></div><div class="quote-chart"></div><div class="quote-values"><span class="quote-change mono" data-delta></span></div></div>';
    card.querySelector('h2')!.textContent = drink.name;
    const price = card.querySelector('.quote-price')!; price.setAttribute('data-testid', `display-price-${drink.id}`);
    card.querySelector('.amount')!.textContent = (state.prices[drink.id] / 100).toFixed(2).replace('.', ',');
    const change = formatChange(state.prices[drink.id], state.previousPrices?.[drink.id] ?? state.prices[drink.id]);
    card.querySelector('.price-signal')!.className=`price-signal ${change.direction==='down'?'down':'up'}`;
    const delta = card.querySelector('.quote-change')!; delta.setAttribute('data-testid', `display-change-${drink.id}`); delta.className = `quote-change mono ${change.direction}`;
    delta.textContent = `${change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '→'} ${change.euro}\n${change.percent}`;
    container.append(card);
    const chart=card.querySelector<HTMLElement>('.quote-chart')!;chart.dataset.chart=drink.id;const series=combineHistory(state.historyByDrink[drink.id]??[],state.startupHistoryByDrink?.[drink.id]??[],state.parameters.historyChanges);renderChart(chart,series.points,drink,series.simulatedCount,state.chartMode??'bars-gap');
  }
}
