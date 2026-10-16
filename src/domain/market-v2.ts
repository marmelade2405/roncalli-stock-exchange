import {scaledDrinkConfig} from './prices.js';
import type { PreparedConfig, MarketState, MarketCommand, MarketContext, Rng, PriceMap, PriceEventKind, Transition } from './model.js';
import {configureRunningMarket} from './live-configuration.js';
import { DomainError } from './types.js';
import { createDefaultConfiguration, validateConfiguration } from './configuration.js';
import { buildPreview, randomPrice, resolvePrices, validateOverride,validateDrinks } from './prices.js';
import { createMarketClock, rebaseClock } from './market-clock.js';
import { initialHistory, recordChanges } from './history.js';
import { createSpecialSchedule, consumeSpecial } from './special-schedule.js';
import { previewSpecial } from './specials.js';
import { createSpecialCatalog } from './news-catalog.js';
import {crashIntroDuration,newsIntroDuration,priceRevealInterval,isMarketVolatility,isMarketVolatilityPercent,isMarketAveragePercent,isMarketReversionPercent} from './parameters.js';
import {prepareCrash,percentPrices,crashPrices} from './crash-prices.js';
import {simulateStartupHistory} from './startup-history.js';
import {harmonizePriceBands} from './price-bands.js';

export function createMarket(config: PreparedConfig, wallNow: number, rng: Rng): MarketState {
  validateConfiguration(config);
  const prices = Object.fromEntries(config.drinks.map(d => [d.id,d.startCents]));
  const normal=buildPreview(config.drinks,prices,'normal',rng,config.parameters),crash=prepareCrash(config.drinks,prices,config.parameters,rng);
  return {
    drinks:structuredClone(config.drinks),parameters:{...config.parameters,crashAmplitudeFactor:2},specials:structuredClone(config.specials),specialOrder:[...config.specialOrder],
    schemaVersion:2,revision:0,runId:0,phase:'ready',prices,previousPrices:Object.fromEntries(config.drinks.map(d => [d.id,null])),
    previews:{normal,crash:crash.prices,recovery:null},...(crash.percent===undefined?{}:{nextCrashPercent:crash.percent}),
    overrides:{normal:{},crash:{}},deadline:null,transition:null,viewMode:'overview',chartMode:'bars-gap',tickerColumns:3,viewEpoch:wallNow,tickerWallAt:wallNow,publishedAt:wallNow,history:[],
    historyByDrink:initialHistory(prices,wallNow,0),startupHistoryByDrink:simulateStartupHistory(config.drinks,config.parameters,wallNow),clock:createMarketClock(wallNow),schedule:createSpecialSchedule(config.specialOrder,config.parameters,rng),
  };
}
const locked = (message: string): never => { throw new DomainError('LOCKED',message); };
function normalLocked(s: MarketState, now: number) { return s.phase === 'normal' && s.deadline !== null && now >= s.deadline-(s.roundTransitionMs??s.parameters.transitionMs); }
function configuration(s: MarketState): PreparedConfig { return {drinks:s.drinks,parameters:s.parameters,specials:s.specials,specialOrder:s.specialOrder}; }
function syncClock(s: MarketState, t: MarketContext) {
  const rate = s.clock.mode === 'live' ? 1 : s.phase === 'ready' ? 0 : s.phase === 'transition'||(s.quoteRevealUntil!==undefined&&t.marketNow<s.quoteRevealUntil) ? 1 : s.clock.speed;
  s.clock = rebaseClock(s.clock,t.wallNow,t.marketNow,{rate});
}
function writePrices(s: MarketState, prices: PriceMap, kind: Exclude<PriceEventKind,'start'>, t: MarketContext,parameters=s.parameters) {
  const before = s.prices; s.revision++;
  s.publication={revealMs:priceRevealInterval(parameters,s.drinks.length),wallAt:t.wallNow,revision:s.revision,kind,changedDrinkIds:Object.keys(prices).filter(id=>prices[id]!==before[id])};
  if(['normal','crash','recovery'].includes(kind)){s.roundPublication=structuredClone(s.publication);s.quotePublicationOverrides={};}
  else{ s.quotePublicationOverrides??={};for(const id of s.publication.changedDrinkIds)s.quotePublicationOverrides[id]={wallAt:t.wallNow,revision:s.revision};}
  for (const [id,price] of Object.entries(prices)) if (price !== before[id]) s.previousPrices[id]=before[id];
  s.historyByDrink=recordChanges(s.historyByDrink,before,prices,t.marketNow,kind,s.revision);
  s.prices={...prices}; s.publishedAt=t.marketNow; s.viewEpoch=t.marketNow;s.tickerWallAt=t.wallNow;delete s.tickerOffsetRows;
  s.history=[...s.history,{revision:s.revision,kind,publishedAt:t.marketNow,prices:{...prices}}].slice(-100);
}
function refreshAffectedForecast(s: MarketState, id: string, rng: Rng) {
  const d=s.drinks.find(d => d.id === id)!;
  if (s.phase === 'ready' && s.previews.normal) s.previews.normal[id]=randomPrice(d,s.prices[id],'normal',rng,s.parameters);
  if ((s.phase === 'normal' || s.phase === 'ready') && s.previews.crash) s.previews.crash[id]=s.nextCrashPercent===undefined?randomPrice(d,s.prices[id],'crash',rng,s.parameters):crashPrices([d],s.prices,s.nextCrashPercent,s.parameters,rng)[id];
  if (s.phase === 'crash' && s.previews.recovery) s.previews.recovery[id]=s.activeCrashPercent===undefined?randomPrice(d,s.prices[id],'recovery',rng,s.parameters):percentPrices([d],s.prices,s.activeCrashPercent,s.parameters)[id];
}
function begin(s: MarketState, transition: Transition, t: MarketContext): MarketState {
  const next=structuredClone(s); next.phase='transition'; next.transition={...transition,parameters:structuredClone(s.parameters),...(transition.kind==='special'?{specialSnapshot:structuredClone(s.specials.find(n=>n.id===transition.specialId)!)}:{})}; next.deadline=transition.publishAt; next.revision++;
  delete next.quoteRevealUntil;
  syncClock(next,t); return next;
}
function beginSpecial(s: MarketState, id: string, t: MarketContext): MarketState {
  const special=s.specials.find(x => x.id === id);
  if (!special) throw new DomainError('INVALID_INPUT','Diese Nachricht ist nicht mehr verfügbar.');
  const d=s.drinks.find(d => d.id === special.drinkId)!;
  const price=previewSpecial(d,s.prices[d.id],special,s.parameters.marketAveragePercent??0).price;
  if(price===s.prices[d.id])throw new DomainError('LOCKED',special.direction==='up'?'Der Preis ist bereits am Maximum. Die Meldung bleibt offen.':'Der Preis ist bereits am Minimum. Die Meldung bleibt offen.');
  return begin(s,{kind:'special',publishAt:t.marketNow+s.parameters.newsMs,prices:{...s.prices,[d.id]:price},normalDeadline:s.deadline,specialId:id},t);
}
function publish(s: MarketState, t: MarketContext, rng: Rng): MarketState {
  const next=structuredClone(s); const transition=next.transition!; next.transition=null;
  writePrices(next,transition.prices,transition.kind,t,transition.parameters??next.parameters);
  if (transition.kind === 'special') {
    next.phase='normal'; next.deadline=transition.normalDeadline! > t.marketNow ? transition.normalDeadline : t.marketNow+next.parameters.normalMs;
    const special=transition.specialSnapshot??next.specials.find(x=>x.id===transition.specialId)!;
    const direction=special.targetCents===undefined?special.direction:transition.prices[special.drinkId]>s.prices[special.drinkId]?'up':transition.prices[special.drinkId]<s.prices[special.drinkId]?'down':special.direction;
    next.schedule=consumeSpecial(next.schedule,transition.specialId!,t.marketNow,direction);next.lastSpecialSnapshot={...special,publishedAt:t.marketNow};
    if(transition.normalDeadline!<=t.marketNow)next.roundTransitionMs=next.parameters.transitionMs;
    refreshAffectedForecast(next,next.specials.find(x => x.id === transition.specialId)!.drinkId,rng);
  } else if (transition.kind === 'crash') {
    next.phase='crash'; next.roundTransitionMs=(transition.parameters??next.parameters).transitionMs; next.deadline=t.marketNow+(transition.parameters??next.parameters).crashMs; next.overrides.crash={};
    next.previews={normal:null,crash:null,recovery:next.activeCrashPercent===undefined?buildPreview(next.drinks,next.prices,'recovery',rng,next.parameters):percentPrices(next.drinks,next.prices,next.activeCrashPercent,next.parameters)};delete next.nextCrashPercent;
  } else {
    next.phase='normal'; next.roundTransitionMs=next.parameters.transitionMs; next.deadline=t.marketNow+next.parameters.normalMs;
    if (transition.kind === 'normal') next.overrides.normal={};
    const normal=buildPreview(next.drinks,next.prices,'normal',rng,next.parameters),crash=prepareCrash(next.drinks,next.prices,next.parameters,rng);next.previews={normal,crash:crash.prices,recovery:null};delete next.activeCrashPercent;if(crash.percent!==undefined)next.nextCrashPercent=crash.percent;else delete next.nextCrashPercent;
  }
  if(transition.kind!=='special'&&next.clock.mode==='simulation'&&next.viewMode!=='ticker'&&next.drinks.length>1)next.quoteRevealUntil=t.marketNow+(next.drinks.length-1)*priceRevealInterval(transition.parameters??next.parameters,next.drinks.length)+700;
  syncClock(next,t); return next;
}
export function nextBoundary(s: MarketState): number|null {
  if (s.phase === 'ready' || s.deadline === null) return null;
  if (s.phase === 'transition') return s.deadline;
  return Math.min(s.deadline-(s.roundTransitionMs??s.parameters.transitionMs),s.quoteRevealUntil??Infinity);
}
export function advanceMarket(s: MarketState, t: MarketContext, rng: Rng): MarketState {
  if (s.phase === 'ready' || s.deadline === null) return s;
  if (s.phase === 'transition') return t.marketNow >= s.deadline ? publish(s,t,rng) : s;
  if(s.quoteRevealUntil!==undefined&&t.marketNow>=s.quoteRevealUntil){const next=structuredClone(s);delete next.quoteRevealUntil;next.revision++;syncClock(next,t);return advanceMarket(next,t,rng);}
  if (t.marketNow >= s.deadline-(s.roundTransitionMs??s.parameters.transitionMs)) {
    const kind=s.phase === 'crash' ? 'recovery' : 'normal'; const preview=s.previews[kind];
    if (!preview) throw new DomainError('INVALID_PHASE','Die vorbereiteten Preise fehlen.');
    const next=begin(s,{kind,publishAt:s.deadline,prices:kind === 'normal' ? resolvePrices(preview,s.overrides.normal) : {...preview},normalDeadline:kind === 'normal' ? s.deadline : null},t);
    next.transition!.parameters!.transitionMs=s.roundTransitionMs??s.parameters.transitionMs;
    return t.marketNow >= s.deadline ? publish(next,t,rng) : next;
  }
  return s;
}
export function applyCommand(s: MarketState, c: MarketCommand, t: MarketContext, rng: Rng): MarketState {
  const next=structuredClone(s);
  switch (c.type) {
    case 'start':
      if (s.phase !== 'ready') throw new DomainError('INVALID_PHASE','Der Markt läuft bereits.');
      next.phase='normal'; next.roundTransitionMs=s.parameters.transitionMs; next.deadline=t.marketNow+s.parameters.normalMs; next.viewEpoch=t.marketNow; next.publishedAt=t.marketNow;
      delete next.tickerOffsetRows;next.tickerWallAt=t.wallNow;
      next.schedule.startedAt=t.marketNow; next.clock=rebaseClock(s.clock,t.wallNow,t.marketNow,{paused:false,rate:s.clock.mode === 'simulation' ? s.clock.speed : 1});
      break;
    case 'configure': {
      const drinks=c.drinks.map(drink=>{const fixed=s.drinks.find(d=>d.id===drink.id)?.fixedPriceCents;return fixed===undefined?drink:{...drink,fixedPriceCents:fixed};});
      validateDrinks(drinks);
      const derived=harmonizePriceBands(drinks);
      const fallback=createSpecialCatalog(derived).map(x => s.specials.find(old => old.id === x.id) ?? x);
      const specials=c.specials ?? fallback; const ids=new Set(specials.map(x=>x.id));
      const order=c.specialOrder ?? [...s.specialOrder.filter(id=>ids.has(id)),...specials.map(x=>x.id).filter(id=>!s.specialOrder.includes(id))];
      if(s.phase!=='ready')return configureRunningMarket(s,{drinks:derived,parameters:c.parameters??s.parameters,specials,specialOrder:order},t,rng);
      const fresh=createMarket({drinks:derived,parameters:c.parameters ?? s.parameters,specials,specialOrder:order},t.wallNow,rng); fresh.revision=s.revision+1; fresh.runId=s.runId; fresh.viewMode=s.viewMode;fresh.chartMode=s.chartMode??'bars-gap';fresh.tickerColumns=s.tickerColumns??3;
      fresh.clock=rebaseClock(s.clock,t.wallNow,t.marketNow,{rate:s.clock.mode === 'simulation' ? 0 : 1});
      fresh.publishedAt=t.marketNow; fresh.viewEpoch=t.marketNow; fresh.historyByDrink=initialHistory(fresh.prices,t.marketNow,fresh.revision);fresh.startupHistoryByDrink=simulateStartupHistory(fresh.drinks,fresh.parameters,t.marketNow,fresh.revision); return fresh;
    }
    case 'override': {
      const drink=s.drinks.find(d => d.id === c.drinkId); if (!drink) throw new DomainError('UNKNOWN_DRINK','Dieses Getränk ist nicht vorhanden.');
      if (c.scope !== 'normal' && c.scope !== 'crash') throw new DomainError('INVALID_INPUT','Unbekannte Preisrunde.');
      if (c.scope === 'normal' && (normalLocked(s,t.marketNow) || s.transition?.kind === 'normal')) locked('Diese normale Runde ist bereits festgeschrieben.');
      if (c.scope === 'crash' && (s.phase === 'crash' || s.transition?.kind === 'crash' || s.transition?.kind === 'recovery')) locked('Dieser Crash ist bereits festgeschrieben.');
      validateOverride(scaledDrinkConfig(drink,s.parameters.marketAveragePercent??0),c.value); if (c.value === null) delete next.overrides[c.scope][c.drinkId]; else next.overrides[c.scope][c.drinkId]=c.value;
      break;
    }
    case 'correct': {
      if (s.phase === 'transition' || normalLocked(s,t.marketNow)) locked('Während des Preiswechsels sind Sofortkorrekturen gesperrt.');
      const drink=s.drinks.find(d => d.id === c.drinkId); if (!drink) throw new DomainError('UNKNOWN_DRINK','Dieses Getränk ist nicht vorhanden.');
      validateOverride(scaledDrinkConfig(drink,s.parameters.marketAveragePercent??0),c.value); if (s.prices[c.drinkId] === c.value) return s;
      writePrices(next,{...s.prices,[c.drinkId]:c.value},'correction',t); refreshAffectedForecast(next,c.drinkId,rng); syncClock(next,t); return next;
    }
    case 'special':
      if (s.phase !== 'normal' || normalLocked(s,t.marketNow) || t.marketNow+s.parameters.newsMs+s.parameters.transitionMs+200 > s.deadline!) locked('Vor dieser Runde ist nicht genügend Zeit für eine Nachricht.');
      return beginSpecial(s,c.specialId,t);
    case 'crash': {
      if (s.phase !== 'normal' || normalLocked(s,t.marketNow)) locked('Ein Crash kann jetzt nicht gestartet werden.');
      if (!s.previews.crash || !s.previews.normal) throw new DomainError('INVALID_PHASE','Die Crashvorschau fehlt.');
      const intro=begin(s,{kind:'crash',publishAt:t.marketNow+crashIntroDuration(s.parameters),prices:resolvePrices(s.previews.crash,s.overrides.crash),normalDeadline:s.deadline,interruptedNormalPreview:{...s.previews.normal}},t);
      if(s.nextCrashPercent!==undefined)intro.activeCrashPercent=s.nextCrashPercent;
      intro.previews.normal=null; return intro;
    }
    case 'cancel-crash':
      if (s.transition?.kind === 'crash') {
        next.phase='normal'; next.roundTransitionMs=s.parameters.transitionMs; next.deadline=t.marketNow+s.parameters.normalMs; next.previews.normal=s.transition.interruptedNormalPreview ?? buildPreview(s.drinks,s.prices,'normal',rng,s.parameters); next.transition=null;
        delete next.activeCrashPercent;
      } else if (s.phase === 'crash' && s.previews.recovery) return begin(s,{kind:'recovery',publishAt:t.marketNow+s.parameters.transitionMs,prices:{...s.previews.recovery},normalDeadline:null},t);
      else locked('Es läuft kein abbrechbarer Crash.');
      break;
    case 'chart-mode':
      if(c.mode!=='line'&&c.mode!=='bars'&&c.mode!=='bars-gap')throw new DomainError('INVALID_INPUT','Unbekannte Chartdarstellung.');if(c.mode===(s.chartMode??'bars-gap'))return s;next.chartMode=c.mode;break;
    case 'ticker-columns':
      if(c.columns!==2&&c.columns!==3)throw new DomainError('INVALID_INPUT','Laufliste: zwei oder drei Spalten wählen.');if(c.columns===(s.tickerColumns??3))return s;next.tickerColumns=c.columns;break;
    case 'view':
      if (c.mode !== 'overview' && c.mode !== 'ticker') throw new DomainError('INVALID_INPUT','Unbekannte Gästeansicht.');
      if (c.mode === s.viewMode) return s; next.viewMode=c.mode; next.viewEpoch=t.marketNow;next.tickerWallAt=t.wallNow;delete next.tickerOffsetRows;if(c.mode==='ticker')delete next.quoteRevealUntil; break;
    case 'ticker-speed':
      if(!Number.isSafeInteger(c.rowMs)||c.rowMs<1000||c.rowMs>4000||c.rowMs%50!==0)throw new DomainError('INVALID_INPUT','Laufliste: 1 bis 4 Sekunden pro Block in Schritten von 0,05 Sekunden.');
      next.tickerOffsetRows=Math.max(0,(t.wallNow-(s.tickerWallAt??s.publication?.wallAt??s.viewEpoch))/s.parameters.tickerRowMs+(s.tickerOffsetRows??0));next.tickerWallAt=t.wallNow;next.parameters.tickerRowMs=c.rowMs;break;
    case 'market-reversion':{
      if(!isMarketReversionPercent(c.percent))throw new DomainError('INVALID_INPUT','Rückführung zum Average: ganze Prozentwerte von 0 bis 100.');
      if(c.percent===s.parameters.marketReversionPercent)return s;
      next.parameters.marketReversionPercent=c.percent;
      if(s.previews.normal&&s.transition?.kind!=='normal'&&!normalLocked(s,t.marketNow))next.previews.normal=buildPreview(s.drinks,s.prices,'normal',rng,next.parameters);
      if(next.transition?.kind==='crash')next.transition.interruptedNormalPreview=buildPreview(s.drinks,s.prices,'normal',rng,next.parameters);
      if(s.phase==='ready')next.startupHistoryByDrink=simulateStartupHistory(s.drinks,next.parameters,Math.min(...s.drinks.map(d=>s.historyByDrink[d.id][0].at)),s.revision+1);
      break;
    }
    case 'market-average':{
      if(!isMarketAveragePercent(c.percent))throw new DomainError('INVALID_INPUT','Globaler Average: ganze Prozentwerte von −50 bis +200.');
      if(c.percent===(s.parameters.marketAveragePercent??0))return s;
      const changed=configureRunningMarket(s,{...configuration(s),parameters:{...s.parameters,marketAveragePercent:c.percent}},t,rng);
      if(s.phase==='ready')changed.startupHistoryByDrink=simulateStartupHistory(s.drinks,changed.parameters,Math.min(...s.drinks.map(d=>s.historyByDrink[d.id][0].at)),changed.revision);
      return changed;
    }
    case 'market-volatility':{
      if('percent' in c){
        if(!isMarketVolatilityPercent(c.percent))throw new DomainError('INVALID_INPUT','Marktvolatilität: ganze Prozentwerte von 0 bis 75.');
        if(c.percent===s.parameters.marketVolatilityPercent&&s.parameters.crashAmplitudeFactor===2)return s;
        next.parameters.marketVolatilityPercent=c.percent;
      }else{
        if(!isMarketVolatility(c.factor))throw new DomainError('INVALID_INPUT','Marktvolatilität: 0 bis 3 in Schritten von 0,05.');
        if(c.factor===(s.parameters.marketVolatility??1)&&s.parameters.marketVolatilityPercent===undefined&&s.parameters.crashAmplitudeFactor===2)return s;
        next.parameters.marketVolatility=c.factor;delete next.parameters.marketVolatilityPercent;
      }
      next.parameters.crashAmplitudeFactor=2;
      if(s.previews.normal&&s.transition?.kind!=='normal'&&!normalLocked(s,t.marketNow))next.previews.normal=buildPreview(s.drinks,s.prices,'normal',rng,next.parameters);
      if(s.previews.crash){next.previews.crash=s.nextCrashPercent===undefined?buildPreview(s.drinks,s.prices,'crash',rng,next.parameters):crashPrices(s.drinks,s.prices,s.nextCrashPercent,next.parameters,rng);}
      if(s.previews.recovery&&s.activeCrashPercent===undefined&&s.transition?.kind!=='recovery')next.previews.recovery=buildPreview(s.drinks,s.prices,'recovery',rng,next.parameters);
      if(next.transition?.kind==='crash')next.transition.interruptedNormalPreview=buildPreview(s.drinks,s.prices,'normal',rng,next.parameters);
      if(s.phase==='ready')next.startupHistoryByDrink=simulateStartupHistory(s.drinks,next.parameters,Math.min(...s.drinks.map(d=>s.historyByDrink[d.id][0].at)),s.revision+1);
      break;
    }
    case 'skip-intro':{
      if(s.phase!=='transition'||!s.transition)locked('Es läuft kein überspringbarer Einspieler.');
      if(s.transition!.kind==='crash'||s.transition!.kind==='recovery'||s.transition!.kind==='normal')return publish(next,t,rng);
      if(s.transition!.kind!=='special')locked('Es läuft kein überspringbarer Einspieler.');
      const eventParameters=s.transition!.parameters??s.parameters;const messageMs=eventParameters.newsMs-newsIntroDuration(eventParameters);
      if(s.deadline!-t.marketNow<=messageMs)return publish(next,t,rng);
      next.deadline=t.marketNow+messageMs;next.transition!.publishAt=next.deadline;
      break;
    }
    case 'skip-transition':{
      if(s.clock.mode!=='simulation'||s.phase!=='transition')locked('Nur Preiswechsel und Nachrichten der Simulation können übersprungen werden.');
      const target=s.deadline!;next.clock=rebaseClock(s.clock,t.wallNow,target,{rate:1});return publish(next,{wallNow:t.wallNow,marketNow:target},rng);
    }
    case 'reset': {
      if (c.kind !== 'evening' && c.kind !== 'factory') throw new DomainError('INVALID_INPUT','Unbekannte Rücksetzung.');
      const fresh=createMarket(c.kind === 'factory' ? createDefaultConfiguration(undefined,rng) : configuration(s),t.wallNow,rng);
      fresh.revision=s.revision+1; fresh.runId=s.runId+1; fresh.clock.generation=s.clock.generation+1;
      fresh.historyByDrink=initialHistory(fresh.prices,t.wallNow,fresh.revision); if (c.kind === 'evening'){fresh.viewMode=s.viewMode;fresh.chartMode=s.chartMode??'bars-gap';fresh.tickerColumns=s.tickerColumns??3;}else fresh.viewMode='ticker'; return fresh;
    }
    case 'simulation':
      if (s.phase !== 'ready'&&!(s.clock.mode==='simulation'&&c.enabled)) locked('Der Wechsel zwischen Livebetrieb und Simulation erfolgt in der Vorbereitung.');
      {
        const speed=c.speed??(s.clock.mode==='simulation'?s.clock.speed:1);
        const paused=c.enabled&&(s.clock.mode==='simulation'?s.clock.paused:s.phase==='ready');
        const rate=!c.enabled?1:paused||s.phase==='ready'?0:s.phase==='transition'||(s.quoteRevealUntil!==undefined&&t.marketNow<s.quoteRevealUntil)?1:speed;
        next.clock=rebaseClock(s.clock,t.wallNow,c.enabled?t.marketNow:t.wallNow,{mode:c.enabled?'simulation':'live',speed,paused,rate});
      }
      next.revision++; return next;
    case 'pause':
      if (s.clock.mode !== 'simulation') locked('Pause ist nur in der Simulation möglich.');
      next.clock=rebaseClock(s.clock,t.wallNow,t.marketNow,{paused:c.paused,rate:s.phase === 'ready' ? 0 : s.phase === 'transition'||(s.quoteRevealUntil!==undefined&&t.marketNow<s.quoteRevealUntil) ? 1 : s.clock.speed}); next.revision++; return next;
    case 'step': {
      if (s.clock.mode !== 'simulation' || s.phase === 'ready' || s.phase === 'transition') locked('Ein Ereignissprung ist jetzt nicht möglich.');
      const target=Math.max(t.marketNow,s.deadline!-s.parameters.transitionMs);delete next.quoteRevealUntil;
      next.clock=rebaseClock(s.clock,t.wallNow,target,{rate:1}); next.revision++;
      return advanceMarket(next,{wallNow:t.wallNow,marketNow:target},rng);
    }
    default: throw new DomainError('INVALID_INPUT','Unbekannter Bedienbefehl.');
  }
  next.revision++; syncClock(next,t); return next;
}
