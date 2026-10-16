import type { AdminState, DisplayState, DrinkConfig, MarketCommand, Rng, Snapshot, TimeSnapshot } from '../domain/types.js';
import type {PreparedConfig} from '../domain/model.js';
import { createMarket, applyCommand, advanceMarket, nextBoundary } from '../domain/market.js';
import { toAdminState, toDisplayState } from '../domain/snapshots.js';
import { advanceClock, projectClock, restoreClock, rebaseClock } from '../domain/market-clock.js';
import type { MarketRepository } from './repository.js';
export class RevisionConflictError extends Error {
  constructor() { super('Der Markt wurde inzwischen geändert. Bitte die aktuellen Werte prüfen und erneut speichern.'); this.name = 'RevisionConflictError'; }
}
export interface MarketController {
  dispatch(command: MarketCommand, expectedRevision: number): Promise<Snapshot<AdminState>>;
  tick(): Promise<void>; publicSnapshot(): Snapshot<DisplayState>; adminSnapshot(): Snapshot<AdminState>;
  timeSnapshot(): TimeSnapshot;
  subscribe(listener: () => void): () => void;
}
export async function createController(repository: MarketRepository, options: { now: () => number; rng: Rng; drinks: DrinkConfig[];configuration?:PreparedConfig }): Promise<MarketController> {
  const loaded = await repository.load();
  let state = loaded ?? createMarket(options.configuration??options.drinks, options.now(), options.rng);
  const initialWall=options.now();
  if (loaded && state.clock.mode === 'simulation') state={...state,revision:state.revision+1,clock:restoreClock(state.clock,initialWall)};
  const recovered = state.clock.mode === 'simulation' ? state : advanceMarket(state,{wallNow:initialWall,marketNow:projectClock(state.clock,initialWall,null).marketNow},options.rng);
  if (loaded === null || recovered !== loaded) await repository.save(recovered);
  state = recovered;
  const listeners = new Set<() => void>();
  let lastNotified=initialWall;
  let queue = Promise.resolve();
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const result = queue.then(action);
    queue = result.then(() => {}, () => {});
    return result;
  }
  function notify() {
    lastNotified=options.now();
    for (const listener of listeners) { try {listener();} catch {/* A failed connection cannot undo durable state. */} }
  }
  async function commit(candidate: typeof state) {
    if (candidate === state) return;
    await repository.save(candidate);
    state = candidate;
    notify();
  }
  async function advance() {
    const wallNow=options.now(); const moved=advanceClock(state.clock,wallNow,nextBoundary(state));
    const base=moved.clock === state.clock ? state : {...state,clock:moved.clock};
    let candidate=advanceMarket(base,{wallNow,marketNow:moved.marketNow},options.rng);
    if (candidate === state && state.clock.mode === 'simulation' && !state.clock.paused && wallNow-state.clock.wallAnchor >= 5000) candidate={...state,clock:rebaseClock(state.clock,wallNow,moved.marketNow,{})};
    await commit(candidate);
    if (wallNow-lastNotified >= 5000) notify();
  }
  const controller: MarketController = {
    dispatch: (command, revision) => serial(async () => {
      await advance();
      if (revision !== state.revision) throw new RevisionConflictError();
      const wallNow=options.now(); const marketNow=projectClock(state.clock,wallNow,nextBoundary(state)).marketNow;
      await commit(applyCommand(state,command,{wallNow,marketNow},options.rng));
      return controller.adminSnapshot();
    }),
    tick: () => serial(advance),
    timeSnapshot: () => { const serverNow=options.now(); return {serverNow,clock:projectClock(state.clock,serverNow,nextBoundary(state))}; },
    publicSnapshot: () => ({ type: 'state', ...controller.timeSnapshot(), state: toDisplayState(state) }),
    adminSnapshot: () => ({ type: 'state', ...controller.timeSnapshot(), state: toAdminState(state) }),
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
  return controller;
}
