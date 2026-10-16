import type { PreparedConfig, MarketState, MarketCommand, MarketContext, Rng, PriceMap, PriceEventKind, Transition } from './model.js';
import { DomainError } from './types.js';
import { createDefaultConfiguration, validateConfiguration } from './configuration.js';
import { buildPreview, randomPrice, resolvePrices, validateOverride } from './prices.js';
import { createMarketClock, rebaseClock } from './market-clock.js';
import { initialHistory, recordChanges } from './history.js';
import { createSpecialSchedule, consumeSpecial, reorderSpecials, nextSpecialAt } from './special-schedule.js';
import { previewSpecial } from './specials.js';
import { createSpecialCatalog } from './news-catalog.js';

export function createMarket(config: PreparedConfig, wallNow: number, rng: Rng): MarketState {
  validateConfiguration(config);
  const prices = Object.fromEntries(config.drinks.map(d => [d.id,d.startCents]));
  return {
    drinks:structuredClone(config.drinks),parameters:{...config.parameters},specials:structuredClone(config.specials),specialOrder:[...config.specialOrder],
    schemaVersion:2,revision:0,runId:0,phase:'ready',prices,previousPrices:Object.fromEntries(config.drinks.map(d => [d.id,null])),
    previews:{normal:buildPreview(config.drinks,prices,'normal',rng,config.parameters),crash:buildPreview(config.drinks,prices,'crash',rng,config.parameters),recovery:null},
    overrides:{normal:{},crash:{}},deadline:null,transition:null,viewMode:'overview',viewEpoch:wallNow,publishedAt:wallNow,history:[],
    historyByDrink:initialHistory(prices,wallNow,0),clock:createMarketClock(wallNow),schedule:createSpecialSchedule(config.specialOrder,config.parameters,rng),
  };
}
const locked = (message: string): never => { throw new DomainError('LOCKED',message); };
function normalLocked(s: MarketState, now: number) { return s.phase === 'normal' && s.deadline !== null && now >= s.deadline-s.parameters.transitionMs; }
function configuration(s: MarketState): PreparedConfig { return {drinks:s.drinks,parameters:s.parameters,specials:s.specials,specialOrder:s.specialOrder}; }
function syncClock(s: MarketState, t: MarketContext) {
  const rate = s.clock.mode === 'live' ? 1 : s.phase === 'ready' ? 0 : s.phase === 'transition' ? 1 : s.clock.speed;
  s.clock = rebaseClock(s.clock,t.wallNow,t.marketNow,{rate});
}
function writePrices(s: MarketState, prices: PriceMap, kind: Exclude<PriceEventKind,'start'>, t: MarketContext) {
  const before = s.prices; s.revision++;
  for (const [id,price] of Object.entries(prices)) if (price !== before[id]) s.previousPrices[id]=before[id];
  s.historyByDrink=recordChanges(s.historyByDrink,before,prices,t.marketNow,kind,s.revision);
  s.prices={...prices}; s.publishedAt=t.marketNow; s.viewEpoch=t.marketNow;
  s.history=[...s.history,{revision:s.revision,kind,publishedAt:t.marketNow,prices:{...prices}}].slice(-100);
}
function refreshAffectedForecast(s: MarketState, id: string, rng: Rng) {
  const d=s.drinks.find(d => d.id === id)!;
  if (s.phase === 'ready' && s.previews.normal) s.previews.normal[id]=randomPrice(d,s.prices[id],'normal',rng,s.parameters);
  if ((s.phase === 'normal' || s.phase === 'ready') && s.previews.crash) s.previews.crash[id]=randomPrice(d,s.prices[id],'crash',rng,s.parameters);
  if (s.phase === 'crash' && s.previews.recovery) s.previews.recovery[id]=randomPrice(d,s.prices[id],'recovery',rng,s.parameters);
}
function begin(s: MarketState, transition: Transition, t: MarketContext): MarketState {
  const next=structuredClone(s); next.phase='transition'; next.transition=transition; next.deadline=transition.publishAt; next.revision++;
  syncClock(next,t); return next;
}
function beginSpecial(s: MarketState, id: string, t: MarketContext): MarketState {
  const special=s.specials.find(x => x.id === id);
  if (!special || !s.schedule.pending.some(x => x.specialId === id)) throw new DomainError('INVALID_INPUT','Diese Nachricht ist nicht mehr verfügbar.');
  const d=s.drinks.find(d => d.id === special.drinkId)!;
  const price=previewSpecial(d,s.prices[d.id],special).price;
  return begin(s,{kind:'special',publishAt:t.marketNow+s.parameters.newsMs,prices:{...s.prices,[d.id]:price},normalDeadline:s.deadline,specialId:id},t);
}
function publish(s: MarketState, t: MarketContext, rng: Rng): MarketState {
  const next=structuredClone(s); const transition=next.transition!; next.transition=null;
  writePrices(next,transition.prices,transition.kind,t);
  if (transition.kind === 'special') {
    next.phase='normal'; next.deadline=transition.normalDeadline! > t.marketNow ? transition.normalDeadline : t.marketNow+next.parameters.normalMs;
    next.schedule=consumeSpecial(next.schedule,transition.specialId!,t.marketNow);
    refreshAffectedForecast(next,next.specials.find(x => x.id === transition.specialId)!.drinkId,rng);
  } else if (transition.kind === 'crash') {
    next.phase='crash'; next.deadline=t.marketNow+next.parameters.crashMs; next.overrides.crash={};
    next.previews={normal:null,crash:null,recovery:buildPreview(next.drinks,next.prices,'recovery',rng,next.parameters)};
  } else {
    next.phase='normal'; next.deadline=t.marketNow+next.parameters.normalMs;
    if (transition.kind === 'normal') next.overrides.normal={};
    next.previews={normal:buildPreview(next.drinks,next.prices,'normal',rng,next.parameters),crash:buildPreview(next.drinks,next.prices,'crash',rng,next.parameters),recovery:null};
  }
  syncClock(next,t); return next;
}
export function nextBoundary(s: MarketState): number|null {
  if (s.phase === 'ready' || s.deadline === null) return null;
  if (s.phase === 'transition') return s.deadline;
  const roundAt=s.deadline-s.parameters.transitionMs;
  const specialAt=s.phase === 'normal' ? nextSpecialAt(s.schedule,s.parameters,s.deadline,s.publishedAt) : null;
  return specialAt === null ? roundAt : Math.min(roundAt,specialAt);
}
export function advanceMarket(s: MarketState, t: MarketContext, rng: Rng): MarketState {
  if (s.phase === 'ready' || s.deadline === null) return s;
  if (s.phase === 'transition') return t.marketNow >= s.deadline ? publish(s,t,rng) : s;
  if (t.marketNow >= s.deadline-s.parameters.transitionMs) {
    const kind=s.phase === 'crash' ? 'recovery' : 'normal'; const preview=s.previews[kind];
    if (!preview) throw new DomainError('INVALID_PHASE','Die vorbereiteten Preise fehlen.');
    const next=begin(s,{kind,publishAt:s.deadline,prices:kind === 'normal' ? resolvePrices(preview,s.overrides.normal) : {...preview},normalDeadline:kind === 'normal' ? s.deadline : null},t);
    return t.marketNow >= s.deadline ? publish(next,t,rng) : next;
  }
  if (s.phase === 'normal') {
    const at=nextSpecialAt(s.schedule,s.parameters,s.deadline,s.publishedAt);
    if (at !== null && t.marketNow >= at && t.marketNow+s.parameters.newsMs+s.parameters.minSpecialGapMs <= s.deadline-s.parameters.transitionMs) return beginSpecial(s,s.schedule.pending[0].specialId,t);
  }
  return s;
}
export function applyCommand(s: MarketState, c: MarketCommand, t: MarketContext, rng: Rng): MarketState {
  const next=structuredClone(s);
  switch (c.type) {
    case 'start':
      if (s.phase !== 'ready') throw new DomainError('INVALID_PHASE','Der Markt läuft bereits.');
      next.phase='normal'; next.deadline=t.marketNow+s.parameters.normalMs; next.viewEpoch=t.marketNow; next.publishedAt=t.marketNow;
      next.schedule.startedAt=t.marketNow; next.clock=rebaseClock(s.clock,t.wallNow,t.marketNow,{paused:false,rate:s.clock.mode === 'simulation' ? s.clock.speed : 1});
      break;
    case 'configure': {
      if (s.phase !== 'ready') locked('Markteinstellungen sind während des Abends gesperrt.');
      const drinks=c.drinks.map(drink=>{const fixed=s.drinks.find(d=>d.id===drink.id)?.fixedPriceCents;return fixed===undefined?drink:{...drink,fixedPriceCents:fixed};});
      const fallback=createSpecialCatalog(drinks).map(x => s.specials.find(old => old.id === x.id) ?? x);
      const specials=c.specials ?? fallback; const ids=new Set(specials.map(x=>x.id));
      const order=c.specialOrder ?? [...s.specialOrder.filter(id=>ids.has(id)),...specials.map(x=>x.id).filter(id=>!s.specialOrder.includes(id))];
      const fresh=createMarket({drinks,parameters:c.parameters ?? s.parameters,specials,specialOrder:order},t.wallNow,rng); fresh.revision=s.revision+1; fresh.runId=s.runId; fresh.viewMode=s.viewMode;
      fresh.clock=rebaseClock(s.clock,t.wallNow,t.marketNow,{rate:s.clock.mode === 'simulation' ? 0 : 1});
      fresh.publishedAt=t.marketNow; fresh.viewEpoch=t.marketNow; fresh.historyByDrink=initialHistory(fresh.prices,t.marketNow,fresh.revision); return fresh;
    }
    case 'override': {
      const drink=s.drinks.find(d => d.id === c.drinkId); if (!drink) throw new DomainError('UNKNOWN_DRINK','Dieses Getränk ist nicht vorhanden.');
      if (c.scope !== 'normal' && c.scope !== 'crash') throw new DomainError('INVALID_INPUT','Unbekannte Preisrunde.');
      if (c.scope === 'normal' && (normalLocked(s,t.marketNow) || s.transition?.kind === 'normal')) locked('Diese normale Runde ist bereits festgeschrieben.');
      if (c.scope === 'crash' && (s.phase === 'crash' || s.transition?.kind === 'crash' || s.transition?.kind === 'recovery')) locked('Dieser Crash ist bereits festgeschrieben.');
      validateOverride(drink,c.value); if (c.value === null) delete next.overrides[c.scope][c.drinkId]; else next.overrides[c.scope][c.drinkId]=c.value;
      break;
    }
    case 'correct': {
      if (s.phase === 'transition' || normalLocked(s,t.marketNow)) locked('Während des Preiswechsels sind Sofortkorrekturen gesperrt.');
      const drink=s.drinks.find(d => d.id === c.drinkId); if (!drink) throw new DomainError('UNKNOWN_DRINK','Dieses Getränk ist nicht vorhanden.');
      validateOverride(drink,c.value); if (s.prices[c.drinkId] === c.value) return s;
      writePrices(next,{...s.prices,[c.drinkId]:c.value},'correction',t); refreshAffectedForecast(next,c.drinkId,rng); syncClock(next,t); return next;
    }
    case 'special':
      if (s.phase !== 'normal' || normalLocked(s,t.marketNow) || t.marketNow+s.parameters.newsMs+s.parameters.transitionMs+1000 > s.deadline!) locked('Vor dieser Runde ist nicht genügend Zeit für eine Nachricht.');
      return beginSpecial(s,c.specialId,t);
    case 'crash': {
      if (s.phase !== 'normal' || normalLocked(s,t.marketNow)) locked('Ein Crash kann jetzt nicht gestartet werden.');
      if (!s.previews.crash || !s.previews.normal) throw new DomainError('INVALID_PHASE','Die Crashvorschau fehlt.');
      const intro=begin(s,{kind:'crash',publishAt:t.marketNow+s.parameters.transitionMs,prices:resolvePrices(s.previews.crash,s.overrides.crash),normalDeadline:s.deadline,interruptedNormalPreview:{...s.previews.normal}},t);
      intro.previews.normal=null; return intro;
    }
    case 'cancel-crash':
      if (s.transition?.kind === 'crash') {
        next.phase='normal'; next.deadline=t.marketNow+s.parameters.normalMs; next.previews.normal=s.transition.interruptedNormalPreview ?? buildPreview(s.drinks,s.prices,'normal',rng,s.parameters); next.transition=null;
      } else if (s.phase === 'crash' && s.previews.recovery) return begin(s,{kind:'recovery',publishAt:t.marketNow+s.parameters.transitionMs,prices:{...s.previews.recovery},normalDeadline:null},t);
      else locked('Es läuft kein abbrechbarer Crash.');
      break;
    case 'reorder-specials': {
      const active=s.transition?.kind === 'special' ? s.transition.specialId! : null;
      next.schedule=reorderSpecials(s.schedule,c.ids,active);
      const open=new Set(s.schedule.pending.map(x => x.specialId)); let index=0;
      next.specialOrder=s.specialOrder.map(id => open.has(id) ? c.ids[index++] : id); break;
    }
    case 'view':
      if (c.mode !== 'overview' && c.mode !== 'ticker') throw new DomainError('INVALID_INPUT','Unbekannte Gästeansicht.');
      if (c.mode === s.viewMode) return s; next.viewMode=c.mode; next.viewEpoch=t.marketNow; break;
    case 'reset': {
      if (c.kind !== 'evening' && c.kind !== 'factory') throw new DomainError('INVALID_INPUT','Unbekannte Rücksetzung.');
      const fresh=createMarket(c.kind === 'factory' ? createDefaultConfiguration(undefined,rng) : configuration(s),t.wallNow,rng);
      fresh.revision=s.revision+1; fresh.runId=s.runId+1; fresh.clock.generation=s.clock.generation+1;
      fresh.historyByDrink=initialHistory(fresh.prices,t.wallNow,fresh.revision); if (c.kind === 'evening') fresh.viewMode=s.viewMode; return fresh;
    }
    case 'simulation':
      if (s.phase !== 'ready'&&!(s.clock.mode==='simulation'&&c.enabled)) locked('Der Wechsel zwischen Livebetrieb und Simulation erfolgt in der Vorbereitung.');
      {
        const speed=c.speed??(s.clock.mode==='simulation'?s.clock.speed:60);
        const paused=c.enabled&&(s.clock.mode==='simulation'?s.clock.paused:s.phase==='ready');
        const rate=!c.enabled?1:paused||s.phase==='ready'?0:s.phase==='transition'?1:speed;
        next.clock=rebaseClock(s.clock,t.wallNow,c.enabled?t.marketNow:t.wallNow,{mode:c.enabled?'simulation':'live',speed,paused,rate});
      }
      next.revision++; return next;
    case 'pause':
      if (s.clock.mode !== 'simulation') locked('Pause ist nur in der Simulation möglich.');
      next.clock=rebaseClock(s.clock,t.wallNow,t.marketNow,{paused:c.paused,rate:s.phase === 'ready' ? 0 : s.phase === 'transition' ? 1 : s.clock.speed}); next.revision++; return next;
    case 'step': {
      if (s.clock.mode !== 'simulation' || s.phase === 'ready' || s.phase === 'transition') locked('Ein Ereignissprung ist jetzt nicht möglich.');
      const target=Math.max(t.marketNow,nextBoundary(s)!);
      next.clock=rebaseClock(s.clock,t.wallNow,target,{rate:1}); next.revision++;
      return advanceMarket(next,{wallNow:t.wallNow,marketNow:target},rng);
    }
    default: throw new DomainError('INVALID_INPUT','Unbekannter Bedienbefehl.');
  }
  next.revision++; syncClock(next,t); return next;
}
