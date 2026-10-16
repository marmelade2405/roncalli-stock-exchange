import {expect,it} from 'vitest';
import {createMarket,applyCommand} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng} from '../fixtures.js';
it('three_columns_can_change_live_and_survive_configuration_and_evening_reset',()=>{
  const config=makeConfiguration(),base=applyCommand(createMarket(config,0,midpointRng),{type:'ticker-columns',columns:2},context(0),midpointRng),state=applyCommand(base,{type:'start'},context(0),midpointRng);
  const changed=applyCommand(state,{type:'ticker-columns',columns:3},context(1000),midpointRng);
  expect(toDisplayState(changed).tickerColumns).toBe(3);validateStoredMarket(changed);
  for(const key of ['prices','previews','overrides','deadline','historyByDrink','tickerWallAt']as const)expect(changed[key]).toEqual(state[key]);
  const ready=applyCommand(createMarket(config,0,midpointRng),{type:'ticker-columns',columns:2},context(0),midpointRng);
  const configured=applyCommand(ready,{type:'configure',...config},context(1000),midpointRng);
  expect(configured.tickerColumns).toBe(2);expect(applyCommand(configured,{type:'reset',kind:'evening'},context(1000),midpointRng).tickerColumns).toBe(2);
  expect(toDisplayState(applyCommand(configured,{type:'reset',kind:'factory'},context(1000),midpointRng)).tickerColumns).toBe(3);
  expect(applyCommand(configured,{type:'reset',kind:'factory'},context(1000),midpointRng).viewMode).toBe('ticker');
});
it('invalid_column_counts_are_rejected_and_old_files_default_to_three',()=>{
  const state=createMarket(makeConfiguration(),0,midpointRng);delete state.tickerColumns;validateStoredMarket(state);expect(toDisplayState(state).tickerColumns).toBe(3);
  expect(()=>validateStoredMarket({...state,tickerColumns:4})).toThrow();
});
it('simulation_starts_at_one_when_no_speed_is_supplied',()=>{
 const state=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'simulation',enabled:true},context(0),midpointRng);
 expect(state.clock.speed).toBe(1);
});
