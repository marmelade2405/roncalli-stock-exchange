import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { MarketState, PriceMap, OverrideMap } from '../domain/types.js';
import { validateDrinks, validateOverride } from '../domain/prices.js';
export interface MarketRepository { load(): Promise<MarketState | null>; save(state: MarketState): Promise<void> }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isTimestamp = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0;
function validateSaved(value: unknown): asserts value is MarketState {
  const invalid = () => { throw new Error('Der gespeicherte Marktstand ist ungültig. Die Datei bleibt erhalten.'); };
  if (!isRecord(value)) invalid();
  const state = value as MarketState;
  if (state.schemaVersion !== 1 || !isTimestamp(state.revision) || !['ready', 'normal', 'crash', 'transition'].includes(state.phase) || !['overview', 'ticker'].includes(state.viewMode)) invalid();
  validateDrinks(state.drinks);
  const drinks = new Map(state.drinks.map(drink => [drink.id, drink]));
  const checkMap = (map: PriceMap | OverrideMap, complete: boolean) => {
    if (!isRecord(map) || (complete && Object.keys(map).length !== drinks.size)) invalid();
    for (const [id, amount] of Object.entries(map)) {
      const drink = drinks.get(id);
      if (!drink || (complete && amount === null)) invalid();
      validateOverride(drink!, amount);
    }
  };
  checkMap(state.prices, true);
  if (state.previousPrices !== null) checkMap(state.previousPrices, true);
  if (!isRecord(state.previews) || !isRecord(state.overrides)) invalid();
  for (const scope of ['normal', 'crash'] as const) checkMap(state.overrides[scope], false);
  for (const kind of ['normal', 'crash', 'recovery'] as const) if (state.previews[kind] !== null) checkMap(state.previews[kind]!, true);
  if (!isTimestamp(state.publishedAt) || !isTimestamp(state.viewEpoch) || (state.deadline !== null && !isTimestamp(state.deadline))) invalid();
  if ((state.phase === 'ready') !== (state.deadline === null) || (state.phase === 'transition') !== (state.transition !== null)) invalid();
  if (state.transition !== null) {
    if (!isRecord(state.transition) || !['normal', 'crash', 'recovery'].includes(state.transition.kind) || state.transition.publishAt !== state.deadline) invalid();
    checkMap(state.transition.prices, true);
  }
  const kind = state.transition?.kind ?? (state.phase === 'crash' ? 'recovery' : 'normal');
  if (kind === 'recovery') {
    if (state.previews.recovery === null || state.previews.normal !== null || state.previews.crash !== null) invalid();
  } else if (kind === 'crash') {
    if (state.previews.crash === null || state.previews.normal !== null || state.previews.recovery !== null) invalid();
  } else if (state.previews.normal === null || state.previews.crash === null || state.previews.recovery !== null) invalid();
  if (!Array.isArray(state.history) || state.history.length > 100) invalid();
  for (const round of state.history) {
    if (!isRecord(round) || !isTimestamp(round.revision) || round.revision > state.revision || !isTimestamp(round.publishedAt) || !['normal', 'crash', 'recovery'].includes(round.kind)) invalid();
    checkMap(round.prices, true);
  }
}

export function createRepository(filePath: string): MarketRepository {
  return {
    async load() {
      let text: string;
      try { text = await readFile(filePath, 'utf8'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
      const state: unknown = JSON.parse(text);
      validateSaved(state);
      return state;
    },
    async save(state) {
      validateSaved(state);
      await mkdir(dirname(filePath), { recursive: true });
      const temporary = `${filePath}.${process.pid}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(state), { encoding: 'utf8', mode: 0o600 });
        await rename(temporary, filePath);
      } catch (error) {
        await unlink(temporary).catch(() => {});
        throw error;
      }
    },
  };
}
