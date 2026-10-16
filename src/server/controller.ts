import type { AdminState, DisplayState, DrinkConfig, MarketCommand, Rng, Snapshot } from '../domain/types.js';
import { createMarket, applyCommand, advanceMarket } from '../domain/market.js';
import { toAdminState, toDisplayState } from '../domain/snapshots.js';
import type { MarketRepository } from './repository.js';
export class RevisionConflictError extends Error {
  constructor() { super('Der Markt wurde inzwischen geändert. Bitte die aktuellen Werte prüfen und erneut speichern.'); this.name = 'RevisionConflictError'; }
}
export interface MarketController {
  dispatch(command: MarketCommand, expectedRevision: number): Promise<Snapshot<AdminState>>;
  tick(): Promise<void>; publicSnapshot(): Snapshot<DisplayState>; adminSnapshot(): Snapshot<AdminState>;
  subscribe(listener: () => void): () => void;
}
export async function createController(repository: MarketRepository, options: { now: () => number; rng: Rng; drinks: DrinkConfig[] }): Promise<MarketController> {
  const loaded = await repository.load();
  let state = loaded ?? createMarket(options.drinks, options.now(), options.rng);
  const recovered = advanceMarket(state, options.now(), options.rng);
  if (loaded === null || recovered !== state) await repository.save(recovered);
  state = recovered;
  const listeners = new Set<() => void>();
  let queue = Promise.resolve();
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const result = queue.then(action);
    queue = result.then(() => {}, () => {});
    return result;
  }
  async function commit(candidate: typeof state) {
    if (candidate === state) return;
    await repository.save(candidate);
    state = candidate;
    for (const listener of listeners) {
      try { listener(); }
      catch { /* A failed connection must not roll back a durable price round. */ }
    }
  }
  const controller: MarketController = {
    dispatch: (command, revision) => serial(async () => {
      await commit(advanceMarket(state, options.now(), options.rng));
      if (revision !== state.revision) throw new RevisionConflictError();
      await commit(applyCommand(state, command, options.now(), options.rng));
      return controller.adminSnapshot();
    }),
    tick: () => serial(async () => { await commit(advanceMarket(state, options.now(), options.rng)); }),
    publicSnapshot: () => ({ type: 'state', serverNow: options.now(), state: toDisplayState(state) }),
    adminSnapshot: () => ({ type: 'state', serverNow: options.now(), state: toAdminState(state) }),
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
  return controller;
}
