import {expect,it} from 'vitest';
import {createMarket,applyCommand} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket,createMarketStore} from '../../src/server/market-store.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng} from '../fixtures.js';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
it.each(['bars','bars-gap']as const)('chart_style_%s_can_change_live_without_changing_prices_forecasts_or_timers',mode=>{
  const state=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng),changed=applyCommand(state,{type:'chart-mode',mode},context(1000),midpointRng);
  expect(changed.chartMode).toBe(mode);expect(toDisplayState(changed).chartMode).toBe(mode);for(const field of['prices','previews','overrides','historyByDrink','startupHistoryByDrink','deadline','schedule','viewMode','tickerWallAt']as const)expect(changed[field]).toEqual(state[field]);validateStoredMarket(changed);
});
it.each(['bars','bars-gap']as const)('chart_style_%s_survives_save_reload_configuration_and_evening_reset',async mode=>{
  const config=makeConfiguration(),state=applyCommand(createMarket(config,0,midpointRng),{type:'chart-mode',mode},context(0),midpointRng);await mkdir('.artifacts/verification/chart-mode-tests',{recursive:true});const dir=await mkdtemp(join(process.cwd(),'.artifacts/verification/chart-mode-tests/store-')),store=createMarketStore(join(dir,'market.json'));await store.save(state);expect((await store.load())!.chartMode).toBe(mode);
  const configured=applyCommand(state,{type:'configure',...config},context(1000),midpointRng);expect(configured.chartMode).toBe(mode);expect(applyCommand(configured,{type:'reset',kind:'evening'},context(2000),midpointRng).chartMode).toBe(mode);expect(toDisplayState(applyCommand(configured,{type:'reset',kind:'factory'},context(3000),midpointRng)).chartMode).toBe('bars-gap');
});
it('legacy_states_use_the_chart_default_and_unknown_modes_are_rejected',()=>{
  const state=createMarket(makeConfiguration(),0,midpointRng);delete state.chartMode;validateStoredMarket(state);expect(toDisplayState(state).chartMode).toBe('bars-gap');expect(()=>validateStoredMarket({...state,chartMode:'unknown'})).toThrow();
});
