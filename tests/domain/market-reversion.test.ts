import {expect,it} from 'vitest';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
import {DEFAULT_PARAMETERS,validateParameters} from '../../src/domain/parameters.js';
import {randomPrice} from '../../src/domain/prices.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {simulatePriceDistribution} from '../../src/domain/price-distribution.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import type {MarketParameters,MarketCommand} from '../../src/domain/model.js';
const beer=DEFAULT_DRINKS.find(d=>d.id==='bier')!,water=DEFAULT_DRINKS.find(d=>d.id==='wasser')!;
const rng=()=>.5,context=(at:number)=>({marketNow:at,wallNow:at});
const parameters=(percent:number)=>({...DEFAULT_PARAMETERS,marketVolatilityPercent:0,marketReversionPercent:percent} as MarketParameters);
const command=(percent:number)=>({type:'market-reversion',percent} as MarketCommand);
const config=()=>createDefaultConfiguration([beer,water],rng);
it.each([[0,420],[20,380],[50,320],[80,260],[100,220]])('global reversion %s moves the normal centre to %s before noise', (percent,expected)=>{
 expect(randomPrice({...beer,reversionPercent:75},420,'normal',rng,parameters(percent))).toBe(expected);
 expect(randomPrice(water,0,'normal',rng,parameters(percent))).toBe(0);
});
it('live reversion refreshes normal forecasts without moving published prices, overrides, crash forecasts or timer',()=>{
 let s=applyCommand(createMarket(config(),0,rng),{type:'start'},context(0),rng);
 s=applyCommand(s,{type:'correct',drinkId:'bier',value:420},context(100),rng);
 s=applyCommand(s,{type:'override',scope:'normal',drinkId:'bier',value:350},context(200),rng);
 s.parameters.marketVolatilityPercent=0;
 const next=applyCommand(s,command(20),context(1000),rng);
 expect((next.parameters as MarketParameters&{marketReversionPercent:number}).marketReversionPercent).toBe(20);
 expect(next.previews.normal!.bier).toBe(380);
 for(const key of ['prices','previousPrices','historyByDrink','overrides','deadline','previews']as const){if(key==='previews')expect(next.previews.crash).toEqual(s.previews.crash);else expect(next[key]).toEqual(s[key]);}
 validateStoredMarket(next);
});
it.each(['normal','crash','recovery','special']as const)('reversion retains frozen %s prices and publication time',kind=>{
 let s=applyCommand(createMarket(config(),0,rng),{type:'start'},context(0),rng),at=1000;
 if(kind==='normal'){at=1190000;s=advanceMarket(s,context(at),rng);}
 else if(kind==='special')s=applyCommand(s,{type:'special',specialId:'bier-up'},context(at),rng);
 else{s=applyCommand(s,{type:'crash'},context(at),rng);if(kind==='recovery'){s=advanceMarket(s,context(16000),rng);at=17000;s=applyCommand(s,{type:'cancel-crash'},context(at),rng);}}
 const next=applyCommand(s,command(80),context(at+100),rng);
 expect(next.transition!.prices).toEqual(s.transition!.prices);expect(next.deadline).toBe(s.deadline);expect(next.previews.crash).toEqual(s.previews.crash);expect(next.previews.recovery).toEqual(s.previews.recovery);validateStoredMarket(next);
});
it('crash and recovery random motion do not depend on global reversion',()=>{
 for(const kind of ['crash','recovery']as const)expect(randomPrice(beer,420,kind,rng,parameters(0))).toBe(randomPrice(beer,420,kind,rng,parameters(100)));
});
it('global reversion validates whole percentages, preserves legacy rules and resets to 50',()=>{
 for(const value of [-1,101,20.5,NaN,Infinity])expect(()=>validateParameters(parameters(value))).toThrow();
 const legacy={...DEFAULT_PARAMETERS,marketVolatilityPercent:0} as MarketParameters&{marketReversionPercent?:number};delete legacy.marketReversionPercent;
 expect(()=>validateParameters(legacy)).not.toThrow();expect(randomPrice({...beer,reversionPercent:20},420,'normal',rng,legacy)).toBe(380);
 const s=createMarket(config(),0,rng),next=applyCommand(s,command(20),context(1),rng);
 expect(applyCommand(next,command(20),context(2),()=>{throw Error('No redraw expected');})).toBe(next);
 const reset=applyCommand(next,{type:'reset',kind:'factory'},context(3),rng);expect((reset.parameters as MarketParameters&{marketReversionPercent:number}).marketReversionPercent).toBe(50);
});
it('distribution uses the global value instead of the old individual reversion',()=>{
 const d={...beer,startCents:420,reversionPercent:75};
 const simulate=simulatePriceDistribution as (...args:[typeof d,number,number,number,number])=>ReturnType<typeof simulatePriceDistribution>;
 expect(simulate(d,1,0,0,0).meanCents).toBe(420);expect(simulate(d,1,0,0,100).meanCents).toBe(220);
 expect(simulate(d,1,0,40,20).bins).not.toEqual(simulate(d,1,0,40,80).bins);
});
