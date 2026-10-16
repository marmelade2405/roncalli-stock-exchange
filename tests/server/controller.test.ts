import { expect, it } from 'vitest';
import { createController } from '../../src/server/controller.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import type { MarketRepository } from '../../src/server/repository.js';
import { createMarket, applyCommand, advanceMarket } from '../../src/domain/market.js';
import type { MarketState } from '../../src/domain/types.js';
import { makeDrink, midpointRng } from '../fixtures.js';
function memory(initial: MarketState | null = null) {
  let saved = initial; let fault = false;
  const repository: MarketRepository = { load: async () => structuredClone(saved), save: async state => { if (fault) throw Error('Disk unavailable'); saved = structuredClone(state); } };
  return { repository, fault: (enabled: boolean) => { fault = enabled; }, state: () => saved };
}
it('a_fresh_server_uses_prepared_crash_timing_without_shortening_its_intro',async()=>{
  let now=0;const configuration=createDefaultConfiguration([makeDrink()],midpointRng),controller=await createController(memory().repository,{now:()=>now,rng:midpointRng,drinks:configuration.drinks,configuration});
  await controller.dispatch({type:'start'},controller.adminSnapshot().state.revision);await controller.dispatch({type:'crash'},controller.adminSnapshot().state.revision);
  expect(controller.adminSnapshot().state.deadline).toBe(15000);now=10000;await controller.tick();expect(controller.publicSnapshot().state.phase).toBe('transition');now=15000;await controller.tick();expect(controller.publicSnapshot().state.phase).toBe('crash');
});
it('failed_save_preserves_memory_and_inputs', async () => {
  let now = 0; const storage = memory();
  const controller = await createController(storage.repository, { now: () => now, rng: midpointRng, drinks: [makeDrink()] });
  await controller.dispatch({ type: 'start' }, 0);
  await controller.dispatch({ type: 'override', scope: 'crash', drinkId: 'bier', value: 140 }, 1);
  const before = controller.adminSnapshot(); storage.fault(true);
  await expect(controller.dispatch({ type: 'crash' }, 2)).rejects.toThrow();
  expect(controller.adminSnapshot()).toEqual(before);
  storage.fault(false);
  await controller.dispatch({ type: 'crash' }, 2);
  now = 10_000; await controller.tick();
  expect(controller.publicSnapshot().state.prices).toEqual({ bier: 140 });
  expect(controller.adminSnapshot().state.overrides.crash).toEqual({});
});
it('two_commands_with_same_revision_only_one_succeeds', async () => {
  const controller = await createController(memory().repository, { now: () => 0, rng: midpointRng, drinks: [makeDrink()] });
  const results = await Promise.allSettled([
    controller.dispatch({ type: 'override', scope: 'normal', drinkId: 'bier', value: 250 }, 0),
    controller.dispatch({ type: 'override', scope: 'normal', drinkId: 'bier', value: 240 }, 0),
  ]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(controller.adminSnapshot().state.overrides.normal).toEqual({ bier: 250 });
});
it('overdue_normal_round_is_recovered_once', async () => {
  let state = applyCommand(createMarket([makeDrink()], 0, midpointRng), { type: 'start' }, 0, midpointRng);
  state = applyCommand(state, { type: 'override', scope: 'normal', drinkId: 'bier', value: 250 }, 1, midpointRng);
  const storage = memory(state); const options = { now: () => 7_200_000, rng: midpointRng, drinks: [makeDrink()] };
  const first = await createController(storage.repository, options);
  expect(first.publicSnapshot().state.prices).toEqual({ bier: 250 });
  expect(first.publicSnapshot().state.deadline).toBe(8_400_000);
  expect(storage.state()?.history).toHaveLength(1);
  const second = await createController(storage.repository, { ...options, rng: () => 0 });
  expect(second.adminSnapshot()).toEqual(first.adminSnapshot());
});
it('expired_crash_publishes_saved_recovery_once', async () => {
  let state = applyCommand(createMarket([makeDrink()], 0, midpointRng), { type: 'start' }, 0, midpointRng);
  state = applyCommand(state, { type: 'override', scope: 'crash', drinkId: 'bier', value: 140 }, 0, midpointRng);
  state = applyCommand(state, { type: 'crash' }, 1000, midpointRng);
  state = advanceMarket(state, 11_000, midpointRng);
  const storage = memory(state);
  const controller = await createController(storage.repository, { now: () => 500_000, rng: midpointRng, drinks: [makeDrink()] });
  expect(controller.publicSnapshot().state.prices).toEqual({ bier: 150 });
  expect(controller.publicSnapshot().state.deadline).toBe(1_700_000);
  await controller.tick();
  expect(storage.state()?.history).toHaveLength(2);
});
it('subscriber_fires_only_after_save', async () => {
  const storage = memory(); const controller = await createController(storage.repository, { now: () => 0, rng: midpointRng, drinks: [makeDrink()] });
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  const save = storage.repository.save;
  storage.repository.save = async state => { await gate; await save(state); };
  let observed: number | null | undefined;
  controller.subscribe(() => { observed = controller.adminSnapshot().state.overrides.normal.bier; });
  const pending = controller.dispatch({ type: 'override', scope: 'normal', drinkId: 'bier', value: 250 }, 0);
  await new Promise(resolve => setImmediate(resolve));
  expect(observed).toBeUndefined();
  expect(controller.adminSnapshot().state.overrides.normal).toEqual({});
  release(); await pending;
  expect(observed).toBe(250);
});
it('failed_publication_retries_once_without_consuming_inputs', async () => {
  let now = 0; const storage = memory();
  const controller = await createController(storage.repository, { now: () => now, rng: midpointRng, drinks: [makeDrink()] });
  await controller.dispatch({ type: 'start' }, 0);
  await controller.dispatch({ type: 'override', scope: 'normal', drinkId: 'bier', value: 250 }, 1);
  now = 1_200_000; storage.fault(true);
  await expect(controller.tick()).rejects.toThrow();
  expect(controller.publicSnapshot().state.prices).toEqual({ bier: 200 });
  expect(controller.adminSnapshot().state.overrides.normal).toEqual({ bier: 250 });
  storage.fault(false); await controller.tick();
  const published = controller.adminSnapshot();
  await controller.tick();
  expect(controller.adminSnapshot()).toEqual(published);
  expect(published.state.prices).toEqual({ bier: 250 });
  expect(storage.state()?.history).toHaveLength(1);
});
