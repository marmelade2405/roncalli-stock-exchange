import { expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createMarketStore } from '../../src/server/market-store.js';
import { createMarket, applyCommand, advanceMarket } from '../../src/domain/market-v2.js';
import { makeConfiguration, context } from '../v2-fixtures.js';
import { midpointRng } from '../fixtures.js';
import {combineHistory} from '../../src/domain/startup-history.js';
async function path() { const base=join(process.cwd(),'.superpowers/sdd/2026-10-08-stock-market-exchange-events/tests'); await mkdir(base,{recursive:true}); return join(await mkdtemp(join(base,'store-')),'market.json'); }
const legacyText = () => readFile('tests/fixtures/schema-v1.json','utf8');
it('reload_preserves_schedule_history_and_simulation', async () => {
  const p = await path(); const store=createMarketStore(p);
  const sim=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'simulation',enabled:true,speed:60},context(0),midpointRng);
  const state=applyCommand(sim,{type:'start'},context(0),midpointRng);
  await store.save(state); expect(await store.load()).toEqual(state);
});
it('arbitrary_simulation_speed_survives_storage',async()=>{const p=await path();let state=createMarket(makeConfiguration(),0,midpointRng);state=applyCommand(state,{type:'simulation',enabled:true,speed:37},context(0),midpointRng);state=applyCommand(state,{type:'start'},context(0),midpointRng);const store=createMarketStore(p);await store.save(state);expect((await store.load())!.clock).toMatchObject({speed:37,rate:37});});
it('migration_keeps_prices_previews_and_override', async () => {
  const p=await path(); const text=await legacyText(); await writeFile(p,text);
  const state=await createMarketStore(p,{now:()=>1000,rng:midpointRng}).load();
  expect(state).toMatchObject({schemaVersion:2,prices:{bier:200},previews:{normal:{bier:220},crash:{bier:180},recovery:null},overrides:{normal:{bier:250},crash:{bier:140}},deadline:1_800_000});
  expect(state!.schedule.pending).toHaveLength(2); expect(state!.schedule.startedAt).toBe(1000);
});
it('legacy_startup_simulation_is_anchored_before_the_preserved_real_history',async()=>{
  const p=await path();await writeFile(p,await legacyText());const state=(await createMarketStore(p,{now:()=>100000000,rng:midpointRng}).load())!;const combined=combineHistory(state.historyByDrink.bier,state.startupHistoryByDrink!.bier,14);expect(combined.points).toHaveLength(15);expect(combined.simulatedCount).toBe(14);
});
it('legacy_crash_preview_does_not_receive_an_unrelated_new_percentage',async()=>{
  const p=await path();await writeFile(p,await legacyText());let state=(await createMarketStore(p,{now:()=>1000,rng:()=>.999}).load())!;expect(state.nextCrashPercent).toBeUndefined();state=applyCommand(state,{type:'crash'},context(2000),midpointRng);expect(state.activeCrashPercent).toBeUndefined();state=advanceMarket(state,context(12000),midpointRng);expect(state.prices.bier).toBe(140);expect(state.previews.recovery!.bier).toBe(150);
});
it('migration_preserves_old_deadline_until_publication', async () => {
  const p=await path(); await writeFile(p,await legacyText()); const state=(await createMarketStore(p,{now:()=>1000,rng:midpointRng}).load())!;
  expect(state.deadline).toBe(1_800_000);
  const pub=advanceMarket(state,context(1_800_000),midpointRng);
  expect(pub.prices.bier).toBe(250); expect(pub.deadline).toBe(3_000_000);
});
it('legacy_backup_is_exact_and_not_overwritten', async () => {
  const p=await path(); const original=await legacyText(); await writeFile(p,original); await writeFile(p+'.v1-backup','previous backup');
  await createMarketStore(p,{now:()=>1000,rng:midpointRng}).load();
  expect(await readFile(p+'.v1-backup','utf8')).toBe('previous backup'); expect(await readFile(p+'.v1-backup.1','utf8')).toBe(original);
});
it('migration_write_failure_keeps_original', async () => {
  const p=await path(); const original=await legacyText(); await writeFile(p,original);
  await expect(createMarketStore(p,{now:()=>1000,rng:midpointRng,write:async()=>{throw Error('Write failed');}}).load()).rejects.toThrow('Write failed');
  expect(await readFile(p,'utf8')).toBe(original); expect(await readFile(p+'.v1-backup','utf8')).toBe(original);
});
it('invalid_catalog_clock_or_history_is_not_overwritten', async () => {
  for (const mutate of [
    (s: ReturnType<typeof createMarket>)=>{s.specials[0].drinkId='missing';},
    (s: ReturnType<typeof createMarket>)=>{s.clock.rate=99 as 60;},
    (s: ReturnType<typeof createMarket>)=>{s.historyByDrink.bier[0].price=999;},
  ]) { const p=await path(); const state=createMarket(makeConfiguration(),0,midpointRng); mutate(state); const original=JSON.stringify(state); await writeFile(p,original); await expect(createMarketStore(p).load()).rejects.toThrow(); expect(await readFile(p,'utf8')).toBe(original); }
});
it('migration_near_transition_does_not_redraw_prices', async () => {
  const p=await path(); const legacy=JSON.parse(await legacyText()); legacy.phase='transition'; legacy.transition={kind:'normal',publishAt:1_800_000,prices:{bier:250}};
  await writeFile(p,JSON.stringify(legacy)); const state=(await createMarketStore(p,{now:()=>1_795_000,rng:()=>.01}).load())!;
  expect(state.transition!.prices).toEqual({bier:250}); expect(state.previews.normal).toEqual({bier:220});
  expect(advanceMarket(state,context(1_800_000),midpointRng).prices.bier).toBe(250);
});
it('interior_null_history_is_rejected_without_overwriting_original',async()=>{
  const p=await path();let state=createMarket(makeConfiguration(),0,midpointRng);
  state=applyCommand(state,{type:'correct',drinkId:'bier',value:250},context(1000),midpointRng);state=applyCommand(state,{type:'correct',drinkId:'bier',value:270},context(2000),midpointRng);
  const damaged=JSON.parse(JSON.stringify(state));damaged.historyByDrink.bier[1].price=null;const original=JSON.stringify(damaged);await writeFile(p,original);
  await expect(createMarketStore(p).load()).rejects.toThrow('ungültig');expect(await readFile(p,'utf8')).toBe(original);
});
it('historical_schema_two_fixed_price_with_specials_loads_unchanged',async()=>{
  const p=await path(),state=createMarket(makeConfiguration(),0,midpointRng);
  delete state.startupHistoryByDrink;
  state.drinks[0].minCents=200;state.drinks[0].maxCents=200;state.previews.crash!.bier=200;
  const original=JSON.stringify(state);await writeFile(p,original);const loaded=await createMarketStore(p).load();
  expect(loaded!.specials).toHaveLength(16);expect(loaded!.drinks[0]).toMatchObject({minCents:200,maxCents:200});expect(await readFile(p,'utf8')).toBe(original);
});
