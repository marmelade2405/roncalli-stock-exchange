import type { DisplayState } from '../shared/protocol.js';
import { formatChange } from '../shared/format.js';
export function renderOverview(container: HTMLElement, state: DisplayState): void {
  const columns = state.drinks.length > 8 ? 3 : 2;
  container.style.setProperty('--columns', String(columns)); container.style.setProperty('--rows', String(Math.ceil(state.drinks.length / columns)));
  container.replaceChildren();
  for (const [index, drink] of state.drinks.entries()) {
    const card = document.createElement('article'); card.className = 'quote-card';
    card.innerHTML = '<div class="quote-meta"><span class="quote-symbol mono"></span><span class="quote-category"></span><span class="quote-number mono"></span></div><div class="quote-main"><h2></h2><div class="quote-price mono" data-price><span class="amount"></span><span class="currency">€</span></div></div><div class="quote-bottom"><span class="quote-change mono" data-delta></span><span class="quote-rule"></span></div>';
    card.querySelector('.quote-symbol')!.textContent = drink.id.replaceAll('-', '').slice(0, 5).toUpperCase();
    card.querySelector('.quote-category')!.textContent = drink.category;
    card.querySelector('.quote-number')!.textContent = String(index + 1).padStart(2, '0');
    card.querySelector('h2')!.textContent = drink.name;
    const price = card.querySelector('.quote-price')!; price.setAttribute('data-testid', `display-price-${drink.id}`);
    card.querySelector('.amount')!.textContent = (state.prices[drink.id] / 100).toFixed(2).replace('.', ',');
    const change = formatChange(state.prices[drink.id], state.previousPrices?.[drink.id] ?? null);
    const delta = card.querySelector('.quote-change')!; delta.setAttribute('data-testid', `display-change-${drink.id}`); delta.className = `quote-change mono ${change.direction}`;
    delta.textContent = state.previousPrices === null ? '—' : `${change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '→'} ${change.euro}  ·  ${change.percent}`;
    container.append(card);
  }
}
