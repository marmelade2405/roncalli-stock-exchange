import { expect, it } from 'vitest';
import { createMarket, applyCommand } from '../../src/domain/market.js';
import { toDisplayState, toAdminState } from '../../src/domain/snapshots.js';
import { makeDrink, midpointRng } from '../fixtures.js';
it('public_projection_excludes_private_values', () => {
  const state = createMarket([makeDrink()], 0, midpointRng);
  const display = toDisplayState(state);
  expect(display).not.toHaveProperty('previews');
  expect(display).not.toHaveProperty('overrides');
  expect(display).not.toHaveProperty('transition');
  expect(display.drinks).toEqual([{ id: 'bier', name: 'Bier', category: 'Bier' }]);
});
it('admin_sees_pending_prices_but_guest_does_not', () => {
  let state = createMarket([makeDrink()], 0, midpointRng);
  state = applyCommand(state, { type: 'start' }, 0, midpointRng);
  state = applyCommand(state, { type: 'crash' }, 1000, midpointRng);
  expect(toAdminState(state).pendingPrices).toEqual({ bier: 180 });
  expect(toDisplayState(state).prices).toEqual({ bier: 200 });
  expect(toDisplayState(state).nextKind).toBe('crash');
});
