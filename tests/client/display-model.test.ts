import { expect, it } from 'vitest';
import { getDisplayModel } from '../../src/client/display/view-model.js';
import { createMarket, applyCommand } from '../../src/domain/market.js';
import { toDisplayState } from '../../src/domain/snapshots.js';
import { makeDrink, midpointRng } from '../fixtures.js';
const running = toDisplayState(applyCommand(createMarket([makeDrink()], 0, midpointRng), { type: 'start' }, 0, midpointRng));
it('prices_hide_at_deadline_minus_10000', () => {
  expect(getDisplayModel(running, 1_189_999, true).showPrices).toBe(true);
  expect(getDisplayModel(running, 1_190_000, true).showPrices).toBe(false);
  expect(getDisplayModel(running, 1_190_000, true).transitionKind).toBe('normal');
});
it('disconnected_display_stays_hidden_after_deadline', () => {
  const model = getDisplayModel(running, 1_200_000, false);
  expect(model.showPrices).toBe(false); expect(model.waitingForPublication).toBe(true);
});
it('mode_revision_does_not_replace_price_publication', () => {
  expect(getDisplayModel({ ...running, revision: 99, viewMode: 'ticker' }, 1_800_001, true).showPrices).toBe(false);
});
it('crash_transition_hides_prices_immediately', () => {
  const state = applyCommand(applyCommand(createMarket([makeDrink()], 0, midpointRng), { type: 'start' }, 0, midpointRng), { type: 'crash' }, 1000, midpointRng);
  expect(getDisplayModel(toDisplayState(state), 1000, true).showPrices).toBe(false);
  expect(getDisplayModel(toDisplayState(state), 1000, true).transitionKind).toBe('crash');
});
it('special_transition_uses_news_kind_and_hides_all_prices',()=>{const state=applyCommand(applyCommand(createMarket([makeDrink()],0,midpointRng),{type:'start'},0,midpointRng),{type:'special',specialId:'bier-down'},1000,midpointRng);expect(getDisplayModel(toDisplayState(state),1000,true)).toMatchObject({showPrices:false,transitionKind:'special',waitingForPublication:false});});
it('due_special_without_new_snapshot_waits_for_authority',()=>{const state={...running,hideAt:1000};expect(getDisplayModel(state,1000,true)).toMatchObject({showPrices:false,waitingForPublication:true});});
