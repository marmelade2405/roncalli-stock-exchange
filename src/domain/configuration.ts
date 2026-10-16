import type { DrinkConfig, PreparedConfig, Rng } from './model.js';
import { DEFAULT_DRINKS } from './defaults.js';
import { DEFAULT_PARAMETERS, validateParameters,priceRevealInterval } from './parameters.js';
import { createRoncalliSpecialCatalog } from './news-catalog.js';
import { validateDrinks,hasVariablePrice,validateOverride } from './prices.js';
import { DomainError } from './types.js';
import { assertSchedulePossible } from './special-schedule.js';
export function createDefaultConfiguration(drinks: DrinkConfig[] = DEFAULT_DRINKS, rng: Rng = Math.random): PreparedConfig {
  const specials = createRoncalliSpecialCatalog(drinks); const specialOrder = specials.map(s => s.id);
  for (let i = specialOrder.length - 1; i > 0; i--) {
    const sample = rng(); if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new DomainError('INVALID_INPUT','Ungültiger Zufallswert.');
    const j = Math.floor(sample * (i + 1)); [specialOrder[i],specialOrder[j]] = [specialOrder[j],specialOrder[i]];
  }
  return { drinks: structuredClone(drinks), parameters: { ...DEFAULT_PARAMETERS }, specials, specialOrder };
}
export function validateConfiguration(config: PreparedConfig): void {
  const invalid = (message: string) => { throw new DomainError('INVALID_INPUT',message); };
  if (!config || typeof config !== 'object') invalid('Markteinstellungen fehlen.');
  validateDrinks(config.drinks); validateParameters(config.parameters);
  if(config.parameters.priceRevealMs!==undefined&&config.parameters.priceRevealMs>priceRevealInterval(config.parameters,config.drinks.length))invalid('Der Einblendungsabstand ist für diese Runden-/Crashdauer zu groß. Abstand verkleinern oder Dauer erhöhen.');
  // Schema-2 configurations created before target/fixed-price fields legitimately
  // included two news entries for equal bounds. Keep those stored catalogs valid.
  const variableDrinks=config.drinks.filter(d=>hasVariablePrice(d)||(d.averageCents===undefined&&d.fixedPriceCents===undefined&&Array.isArray(config.specials)&&config.specials.some(s=>s?.drinkId===d.id)));
  if (!Array.isArray(config.specials) || config.specials.length !== variableDrinks.length * 2) invalid('Jedes Getränk mit variablem Preis benötigt zwei Nachrichten; feste Preise haben keine Specials.');
  const ids = new Set<string>(); const drinks = new Set(variableDrinks.map(d => d.id));
  for (const s of config.specials) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(s.id) || ids.has(s.id) || ['constructor','prototype'].includes(s.id) || !drinks.has(s.drinkId)) invalid('Nachrichten benötigen eindeutige IDs und gültige Getränke.');
    ids.add(s.id);
    if (s.direction !== 'up' && s.direction !== 'down') invalid('Die Nachrichtenrichtung ist ungültig.');
    if (s.percent!==undefined&&(!Number.isFinite(s.percent) || (s.direction === 'up' ? s.percent < 1 || s.percent > 200 : s.percent < -90 || s.percent > -1))) invalid('Die alte Nachrichtenwirkung ist ungültig.');
    if(s.targetCents!==undefined){if(!Number.isSafeInteger(s.targetCents))invalid('Der Special-Festpreis ist ungültig.');validateOverride(config.drinks.find(d=>d.id===s.drinkId)!,s.targetCents);}
    if (typeof s.headline !== 'string' || !s.headline.trim() || s.headline.length > 160 || typeof s.body !== 'string' || !s.body.trim() || s.body.length > 500) invalid('Nachrichtentexte fehlen oder sind zu lang.');
  }
  for (const id of drinks) for (const direction of ['up','down']) if (config.specials.filter(s => s.drinkId === id && s.direction === direction).length !== 1) invalid('Jedes Getränk benötigt genau einen Anstieg und einen Fall.');
  if (!Array.isArray(config.specialOrder) || config.specialOrder.length !== ids.size || new Set(config.specialOrder).size !== ids.size || config.specialOrder.some(id => !ids.has(id))) invalid('Die Nachrichtenreihenfolge ist unvollständig.');
  assertSchedulePossible(config.parameters,config.specials.length);
}
