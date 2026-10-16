import {expect,it} from 'vitest';
import {simulateStartupHistory,combineHistory} from '../../src/domain/startup-history.js';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
import {DEFAULT_PARAMETERS} from '../../src/domain/parameters.js';
import {createMarket} from '../../src/domain/market-v2.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
const beer=DEFAULT_DRINKS.find(d=>d.id==='bier')!,water=DEFAULT_DRINKS.find(d=>d.id==='wasser')!,parameters={...DEFAULT_PARAMETERS};
it('startup_simulation_uses_the_configured_normal_crash_and_recovery_rules_five_times',()=>{
  const drink={...beer,startCents:1000,averageCents:1000,minCents:0,maxCents:2000,amplitudeCents:0,reversionPercent:0};const history=simulateStartupHistory([drink,water],{...parameters,historyChanges:14,crashMinPercent:10,crashMaxPercent:10},100000000).bier;
  expect(history.filter(p=>p.kind==='crash')).toHaveLength(5);expect(history.filter(p=>p.kind==='recovery')).toHaveLength(5);expect(history[1]).toMatchObject({kind:'normal',price:1000});expect(history[2]).toMatchObject({kind:'crash',price:900});expect(history[3]).toMatchObject({kind:'recovery',price:990});expect(history.at(-1)!.price).toBe(950);
  expect(history.every(p=>p.at>=0&&p.at<100000000&&p.price%10===0)).toBe(true);expect(simulateStartupHistory([drink,water],parameters,100000000).wasser.every(p=>p.price===0)).toBe(true);
});
it('startup_history_is_repeatable_and_changes_with_selected_parameters',()=>{
  const first=simulateStartupHistory([beer],parameters,100000000);expect(first).toEqual(simulateStartupHistory([beer],parameters,100000000));expect(first).not.toEqual(simulateStartupHistory([{...beer,amplitudeCents:0}],parameters,100000000));
});
it('simulated_history_fills_only_missing_slots_and_never_modifies_actual_history',()=>{
  const simulated=simulateStartupHistory([beer],parameters,100000000).bier,actual=[{at:100000000,price:180,revision:0,kind:'start' as const}],copy=structuredClone(actual);const combined=combineHistory(actual,simulated,parameters.historyChanges);expect(combined.points).toHaveLength(20);expect(combined.simulatedCount).toBe(19);expect(combined.points.slice(0,19).filter(p=>p.kind==='crash')).toHaveLength(5);expect(combined.points.at(-1)).toEqual(actual[0]);expect(actual).toEqual(copy);
});
it('startup_simulation_is_persisted_without_changing_current_prices_or_real_history',()=>{
  const state=createMarket(createDefaultConfiguration([beer,water],()=>.5),100000000,()=>.5);expect(state.startupHistoryByDrink!.bier.filter(p=>p.kind==='crash')).toHaveLength(5);expect(state.prices).toEqual({bier:180,wasser:0});expect(state.historyByDrink.bier).toHaveLength(1);validateStoredMarket(state);
});
