import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createRepository } from '../../src/server/repository.js';
import { createMarket, applyCommand } from '../../src/domain/market.js';
import { makeDrink, midpointRng } from '../fixtures.js';
async function file() {
  const root = join(process.cwd(), '.superpowers/sdd/2026-10-08-stock-market-exchange/tests');
  await mkdir(root, { recursive: true });
  return join(await mkdtemp(join(root, 'repository-')), 'market.json');
}
it('reload_keeps_previews_and_overrides', async () => {
  const path = await file();
  const repository = createRepository(path);
  let state = createMarket([makeDrink()], 0, () => .8);
  state = applyCommand(state, { type: 'override', scope: 'normal', drinkId: 'bier', value: 250 }, 1, midpointRng);
  await repository.save(state);
  expect(await createRepository(path).load()).toMatchObject({ prices: { bier: 200 }, previews: { normal: { bier: 220 } }, overrides: { normal: { bier: 250 } } });
});
it('corrupt_file_is_not_replaced', async () => {
  const path = await file();
  await writeFile(path, '{broken}');
  await expect(createRepository(path).load()).rejects.toThrow();
  expect(await readFile(path, 'utf8')).toBe('{broken}');
});
it('rejects_inconsistent_saved_state', async () => {
  const path = await file();
  const state = createMarket([makeDrink()], 0, midpointRng);
  state.prices.bier = 0;
  await writeFile(path, JSON.stringify(state));
  await expect(createRepository(path).load()).rejects.toThrow();
});
it('only_missing_file_returns_null', async () => {
  const path = await file();
  expect(await createRepository(path).load()).toBeNull();
  await mkdir(path);
  await expect(createRepository(path).load()).rejects.toThrow();
});
