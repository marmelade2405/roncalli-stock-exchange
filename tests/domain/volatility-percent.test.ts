import {it,expect} from 'vitest';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
import {DEFAULT_PARAMETERS,validateParameters} from '../../src/domain/parameters.js';
import {volatilityBasisCents,randomPrice} from '../../src/domain/prices.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand} from '../../src/domain/market-v2.js';
import {previewSpecial} from '../../src/domain/specials.js';
import {crashPrices} from '../../src/domain/crash-prices.js';
it('percent_basis_scales_with_each_effective_average_without_cent_rounding',()=>{
 const p={...DEFAULT_PARAMETERS,marketVolatilityPercent:40};
 for(const [id,basis]of[['bier',88],['gin-tonic',140],['pfeffi',40],['wasser',0]]as const)expect(volatilityBasisCents(DEFAULT_DRINKS.find(d=>d.id===id)!,p)).toBeCloseTo(basis);
 expect(volatilityBasisCents(DEFAULT_DRINKS.find(d=>d.id==='gin-tonic')!,{...p,marketAveragePercent:10})).toBeCloseTo(154);
});
it('percent_live_command_preserves_prices_and_manual_overrides_and_leaves_news_independent',()=>{
 const rng=()=>.5,s=createMarket(createDefaultConfiguration(undefined,rng),0,rng),beer=s.drinks.find(d=>d.id==='bier')!,special=s.specials.find(n=>n.id==='bier-up')!;
 const changed=applyCommand(s,{type:'market-volatility',percent:40},{wallNow:1,marketNow:1},rng);
 expect(changed.parameters.marketVolatilityPercent).toBe(40);expect(changed.prices).toEqual(s.prices);expect(changed.overrides).toEqual(s.overrides);expect(previewSpecial(beer,s.prices.bier,special)).toEqual(previewSpecial(beer,changed.prices.bier,special));
});
it('crash_doubles_the_percent_basis_and_zero_percent_preserves_average_reversion',()=>{
 const beer=DEFAULT_DRINKS.find(d=>d.id==='bier')!,p={...DEFAULT_PARAMETERS,marketVolatilityPercent:40};
 expect(randomPrice(beer,200,'crash',()=>.75,p)).toBe(270);
 expect(randomPrice(beer,400,'normal',()=>.75,{...p,marketVolatilityPercent:0})).toBe(310);
 const symmetric={...beer,startCents:200,averageCents:200,minCents:0,maxCents:400},samples=[.8,.999,.5];expect(crashPrices([symmetric],{bier:200},10,{...p,crashAmplitudeFactor:5},()=>samples.shift()??.5).bier).toBe(340);
});
it('percent_parameter_accepts_whole_zero_to_seventy_five_and_keeps_legacy_absolute_basis',()=>{
 for(const percent of[0,25,40,75])expect(()=>validateParameters({...DEFAULT_PARAMETERS,marketVolatilityPercent:percent})).not.toThrow();
 for(const percent of[-1,76,40.5,NaN,Infinity])expect(()=>validateParameters({...DEFAULT_PARAMETERS,marketVolatilityPercent:percent})).toThrow();
 const beer={...DEFAULT_DRINKS.find(d=>d.id==='bier')!,amplitudeCents:37},legacy={...DEFAULT_PARAMETERS,marketVolatilityPercent:undefined,marketVolatility:2};expect(volatilityBasisCents(beer,legacy)).toBe(74);
 expect(volatilityBasisCents({...beer,averageCents:undefined},{...DEFAULT_PARAMETERS,marketVolatilityPercent:0})).toBe(0);
});
