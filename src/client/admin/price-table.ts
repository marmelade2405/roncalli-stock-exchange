import {scaledDrinkConfig} from '../../domain/prices.js';
import type { AdminState, DrinkConfig } from '../shared/protocol.js';
import { formatEuro, formatChange, inputEuro } from '../shared/format.js';
import { createInstantPriceEditor } from './instant-price.js';
type Row = { tr: HTMLTableRowElement; input: HTMLInputElement; status: HTMLElement; draft: string | null; base: number; generation: number; previous: number | null | undefined; instant?: ReturnType<typeof createInstantPriceEditor> };
export function createPriceTable(root: HTMLElement, average: HTMLElement, scope: 'normal' | 'crash', save: (id: string, raw: string, generation: number) => void, correct?: (id: string, value: number, revision: number, generation: number) => Promise<unknown>) {
  root.innerHTML = '<table><thead><tr><th>Getränk</th><th>Aktuell</th><th>Zufallsvorschlag</th><th>Manueller Preis</th><th>Wirksamer Preis</th><th>Änderung</th></tr></thead><tbody></tbody></table>';
  const body = root.querySelector('tbody')!; const rows = new Map<string, Row>(); let state: AdminState | null = null;
  function createRow(drink: DrinkConfig) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td><span class="drink-name"></span><span class="drink-category"></span></td><td class="current mono"></td><td class="random mono"></td><td><input class="price-input" type="text" inputmode="decimal" placeholder="Zufall"><div class="price-status" role="status"></div></td><td><span class="effective mono"></span><span class="source"></span></td><td><div class="delta"></div><div class="price-limits"></div></td>';
    const input = tr.querySelector('input')!; const status = tr.querySelector<HTMLElement>('.price-status')!;
    const row: Row = { tr, input, status, draft: null, base: 0, generation: 0, previous: undefined };
    for (const [selector, suffix] of [['.random', 'random'], ['input', 'input'], ['.effective', 'effective'], ['.price-status', 'status']]) tr.querySelector(selector)!.setAttribute('data-testid', `${scope}-${drink.id}-${suffix}`);
    if(correct) row.instant=createInstantPriceEditor(tr.querySelector('.current')!,drink.id,(value,revision,generation)=>correct(drink.id,value,revision,generation));
    input.oninput = () => { if (row.draft === null) row.base = state!.revision; row.draft = input.value; row.generation++; input.removeAttribute('aria-invalid'); status.setAttribute('role', 'status'); status.textContent = 'Noch nicht gespeichert'; };
    input.onblur = () => { if (row.draft !== null && !input.disabled) { status.setAttribute('role', 'status'); status.textContent = 'Wird gespeichert …'; save(drink.id, row.draft, row.generation); } };
    input.onkeydown = event => { if (event.key === 'Enter') input.blur(); };
    rows.set(drink.id, row); body.append(tr);
    return row;
  }
  return {
    update(next: AdminState, connected: boolean, now: number) {
      state = next;
      for (const [id, row] of rows) if (!state.config.some(d => d.id === id)) { row.tr.remove(); rows.delete(id); }
      const isPending = state.phase === 'transition' && state.nextKind === scope;
      const preview = isPending ? state.pendingPrices : state.previews[scope];
      let sum = 0; let count=0; let complete = true;
      for (const standard of state.config) {
        const drink=scaledDrinkConfig(standard,state.parameters.marketAveragePercent??0);
        const row = rows.get(drink.id) ?? createRow(drink);
        row.tr.querySelector('.drink-name')!.textContent = drink.name;
        row.tr.querySelector('.drink-category')!.textContent = drink.category;
        row.input.setAttribute('aria-label', `${scope === 'normal' ? 'Normaler' : 'Crash'} Preis für ${drink.name}`);
        const manual = state.overrides[scope][drink.id]; const proposed = state.previews[scope]?.[drink.id];
        const effective = isPending ? preview?.[drink.id] : manual ?? proposed;
        if(row.instant)row.instant.update(state,connected,now);else row.tr.querySelector('.current')!.textContent = formatEuro(state.prices[drink.id]);
        row.tr.querySelector('.random')!.textContent = proposed === undefined ? '—' : formatEuro(proposed);
        row.tr.querySelector('.effective')!.textContent = effective === undefined ? '—' : formatEuro(effective);
        row.tr.querySelector('.source')!.textContent = manual != null ? 'MANUELL' : effective === undefined ? 'AUSGESETZT' : 'ZUFALL';
        const delta = row.tr.querySelector<HTMLElement>('.delta')!;
        const change = effective === undefined ? null : formatChange(effective, state.prices[drink.id]);
        delta.textContent = change ? `${change.euro} · ${change.percent}` : '—'; delta.className = `delta ${change?.direction ?? 'flat'}`;
        row.tr.querySelector('.price-limits')!.textContent = `${formatEuro(drink.minCents)}–${formatEuro(drink.maxCents)}`;
        if (row.draft === null) {
          row.input.value = manual == null ? '' : inputEuro(manual);
          if (row.previous != null && manual == null) row.status.textContent = 'Vorgabe geleert';
        }
        row.previous = manual;
        const normalLocked = state.phase === 'normal' && state.deadline !== null && now >= state.deadline - state.parameters.transitionMs;
        row.input.disabled = !connected || (scope === 'normal' ? normalLocked || isPending : state.phase === 'crash' || state.nextKind === 'recovery' || isPending);
        if (effective === undefined) complete = false;
        else if(state.prices[drink.id]>0){sum += (effective - state.prices[drink.id]) / state.prices[drink.id] * 100;count++;}
      }
      const label=scope==='normal'?'Ø nächste Preisänderung: ':'Ø Crash-Preisänderung: ';
      average.textContent = label+(complete ? count?`${sum >= 0 ? '+' : '−'}${Math.abs(sum / count).toFixed(1).replace('.', ',')} %`:'Feste Preise' : 'Vorschau ausgesetzt');
    },
    baseRevision(id: string) { return rows.get(id)?.base ?? state!.revision; },
    ownRevision(from: number, to: number) { for (const row of rows.values()){row.instant?.ownRevision(from,to);if (row.draft !== null && row.base === from) row.base = to;} },
    saved(id: string, generation: number) { const row = rows.get(id); if (!row || row.generation !== generation) return; row.draft = null; row.status.setAttribute('role', 'status'); row.status.textContent = 'Gespeichert'; row.input.removeAttribute('aria-invalid'); },
    error(id: string, generation: number, message: string, revision: number) { const row = rows.get(id); if (!row || row.generation !== generation) return; row.base = revision; row.status.setAttribute('role', 'alert'); row.status.textContent = message; row.input.setAttribute('aria-invalid', 'true'); },
    reset() { for(const row of rows.values())row.instant?.reset();rows.clear(); body.replaceChildren(); state = null; },
  };
}
