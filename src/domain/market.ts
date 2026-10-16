import { DomainError, type DrinkConfig, type MarketState, type MarketCommand, type Rng } from './types.js';
import { NORMAL_MS, CRASH_MS, TRANSITION_MS } from './defaults.js';
import { buildPreview, resolvePrices, validateDrinks, validateOverride } from './prices.js';

export function createMarket(drinks: DrinkConfig[], now: number, rng: Rng): MarketState {
  validateDrinks(drinks);
  const prices = Object.fromEntries(drinks.map(d => [d.id, d.startCents]));
  return { schemaVersion: 1, revision: 0, phase: 'ready', drinks: structuredClone(drinks), prices, previousPrices: null,
    previews: { normal: buildPreview(drinks, prices, 'normal', rng), crash: buildPreview(drinks, prices, 'crash', rng), recovery: null }, overrides: { normal: {}, crash: {} },
    deadline: null, transition: null, viewMode: 'overview', viewEpoch: now, publishedAt: now, history: [] };
}

export function applyCommand(state: MarketState, command: MarketCommand, now: number, rng: Rng): MarketState {
  const next = structuredClone(state);
  const normalLocked = state.phase === 'normal' && state.deadline !== null && now >= state.deadline - TRANSITION_MS;
  switch (command.type) {
    case 'start':
      if (state.phase !== 'ready') throw new DomainError('INVALID_PHASE', 'Der Markt läuft bereits.');
      next.phase = 'normal'; next.deadline = now + NORMAL_MS; next.viewEpoch = now;
      break;
    case 'configure': {
      if (state.phase !== 'ready') throw new DomainError('LOCKED', 'Getränkeeinstellungen sind während des Markts gesperrt.');
      const configured = createMarket(command.drinks, now, rng);
      return { ...configured, revision: state.revision + 1, viewMode: state.viewMode };
    }
    case 'view':
      if (command.mode !== 'overview' && command.mode !== 'ticker') throw new DomainError('INVALID_INPUT', 'Unbekannte Gästeansicht.');
      if (command.mode === state.viewMode) return state;
      next.viewMode = command.mode; next.viewEpoch = now;
      break;
    case 'override': {
      if (command.scope !== 'normal' && command.scope !== 'crash') throw new DomainError('INVALID_INPUT', 'Unbekannte Preisrunde.');
      const drink = state.drinks.find(d => d.id === command.drinkId);
      if (!drink) throw new DomainError('UNKNOWN_DRINK', 'Dieses Getränk ist nicht vorhanden.');
      if ((command.scope === 'normal' && (normalLocked || state.transition?.kind === 'normal')) || (command.scope === 'crash' && (state.phase === 'crash' || state.transition?.kind === 'crash' || state.transition?.kind === 'recovery')))
        throw new DomainError('LOCKED', 'Diese Preisrunde ist bereits festgeschrieben.');
      validateOverride(drink, command.value);
      if (command.value === null) delete next.overrides[command.scope][drink.id];
      else next.overrides[command.scope][drink.id] = command.value;
      break;
    }
    case 'crash':
      if (state.phase !== 'normal' || normalLocked) throw new DomainError('LOCKED', 'Ein Crash kann jetzt nicht gestartet werden.');
      if (!state.previews.crash) throw new DomainError('INVALID_PHASE', 'Die Crashvorschau ist nicht verfügbar.');
      next.phase = 'transition'; next.deadline = now + TRANSITION_MS;
      next.transition = { kind: 'crash', publishAt: next.deadline, prices: resolvePrices(state.previews.crash, state.overrides.crash) };
      next.previews.normal = null;
      break;
    default:
      throw new DomainError('INVALID_INPUT', 'Unbekannter Bedienbefehl.');
  }
  next.revision++;
  return next;
}

export function advanceMarket(state: MarketState, now: number, rng: Rng): MarketState {
  if (state.deadline === null || state.phase === 'ready' || now < state.deadline - TRANSITION_MS) return state;
  let next = state;
  if (state.phase !== 'transition') {
    next = structuredClone(state);
    const kind = state.phase === 'crash' ? 'recovery' : 'normal';
    const preview = state.previews[kind];
    if (!preview) throw new DomainError('INVALID_PHASE', 'Die nächste Preisvorschau fehlt.');
    next.transition = { kind, publishAt: state.deadline, prices: kind === 'normal' ? resolvePrices(preview, state.overrides.normal) : { ...preview } };
    next.phase = 'transition'; next.revision++;
  }
  if (now < next.deadline!) return next;
  const published = structuredClone(next);
  const kind = published.transition!.kind;
  published.previousPrices = { ...published.prices };
  published.prices = { ...published.transition!.prices };
  published.transition = null;
  published.publishedAt = now; published.viewEpoch = now; published.revision++;
  published.history = [...published.history, { revision: published.revision, kind, publishedAt: now, prices: { ...published.prices } }].slice(-100);
  if (kind === 'crash') {
    published.phase = 'crash'; published.deadline = now + CRASH_MS;
    published.overrides.crash = {};
    published.previews = { normal: null, crash: null, recovery: buildPreview(published.drinks, published.prices, 'recovery', rng) };
  } else {
    published.phase = 'normal'; published.deadline = now + NORMAL_MS;
    if (kind === 'normal') published.overrides.normal = {};
    published.previews = { normal: buildPreview(published.drinks, published.prices, 'normal', rng), crash: buildPreview(published.drinks, published.prices, 'crash', rng), recovery: null };
  }
  return published;
}
