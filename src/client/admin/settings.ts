import type { AdminState, DrinkConfig } from '../shared/protocol.js';
import { inputEuro, parseEuro } from '../shared/format.js';
type Editor = { drink: DrinkConfig; row: HTMLTableRowElement; inputs: Map<string, HTMLInputElement> };
export function createSettings(root: HTMLElement, add: HTMLButtonElement, save: HTMLButtonElement, submit: (drinks: DrinkConfig[], revision: number, generation: number) => void) {
  let editors: Editor[] = []; let signature = ''; let dirty = false; let base = 0; let generation = 0; let state: AdminState | null = null;
  const fields = [['name', 'Name'], ['category', 'Kategorie'], ['startCents', 'Start €'], ['minCents', 'Min €'], ['maxCents', 'Max €'], ['amplitudeCents', 'Schwankung €'], ['stepCents', 'Schritt €']];
  const initialize = () => { root.innerHTML = `<table><thead><tr>${fields.map(([, label]) => `<th>${label}</th>`).join('')}<th></th></tr></thead><tbody></tbody></table>`; };
  initialize();
  function addRow(drink: DrinkConfig) {
    const row = document.createElement('tr'); const inputs = new Map<string, HTMLInputElement>();
    for (const [key, label] of fields) {
      const cell = document.createElement('td'); const input = document.createElement('input');
      input.type = 'text'; input.className = key === 'name' || key === 'category' ? 'name-input' : '';
      input.value = key === 'name' || key === 'category' ? drink[key] : inputEuro(drink[key as keyof DrinkConfig] as number);
      input.setAttribute('aria-label', `${label} für ${drink.name}`); input.inputMode = key.endsWith('Cents') ? 'decimal' : 'text';
      input.oninput = () => { if (!dirty) base = state!.revision; dirty = true; generation++; };
      inputs.set(key, input); cell.append(input); row.append(cell);
    }
    const remove = document.createElement('button'); remove.textContent = '×'; remove.setAttribute('aria-label', `${drink.name} entfernen`);
    const editor = { drink, row, inputs };
    remove.onclick = () => { if (!dirty) base = state!.revision; dirty = true; generation++; editors = editors.filter(e => e !== editor); row.remove(); };
    const cell = document.createElement('td'); cell.append(remove); row.append(cell); root.querySelector('tbody')!.append(row); editors.push(editor);
  }
  add.onclick = () => {
    if (!dirty) base = state!.revision; dirty = true; generation++;
    let index = 1; while (editors.some(e => e.drink.id === `getraenk-${index}`)) index++;
    addRow({ id: `getraenk-${index}`, name: 'Neues Getränk', category: 'Sonstige', startCents: 200, minCents: 100, maxCents: 300, amplitudeCents: 30, stepCents: 10 });
  };
  save.onclick = () => {
    try {
      const drinks = editors.map(editor => {
        const drink = { ...editor.drink };
        for (const [key, input] of editor.inputs) {
          if (key === 'name' || key === 'category') drink[key] = input.value.trim();
          else { const amount = parseEuro(input.value); if (amount === null) throw Error('Alle Preisfelder in den Einstellungen ausfüllen.'); (drink as unknown as Record<string, unknown>)[key] = amount; }
        }
        return drink;
      });
      submit(drinks, dirty ? base : state!.revision, generation);
    } catch (error) { document.getElementById('settings-error')!.textContent = (error as Error).message; }
  };
  return {
    update(next: AdminState, connected: boolean) {
      state = next; const nextSignature = JSON.stringify(state.config);
      if (signature !== nextSignature && !dirty) { editors = []; initialize(); for (const drink of state.config) addRow(drink); signature = nextSignature; }
      const locked = !connected || state.phase !== 'ready';
      root.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button').forEach(element => { element.disabled = locked; }); add.disabled = locked; save.disabled = locked;
      document.getElementById('settings-note')!.textContent = state.phase === 'ready' ? 'Vor dem Marktstart anpassbar' : 'Im laufenden Markt gesperrt';
    },
    ownRevision(from: number, to: number) { if (dirty && base === from) base = to; },
    saved(submittedGeneration: number) { if (generation === submittedGeneration) { dirty = false; signature = ''; } document.getElementById('settings-error')!.textContent = ''; },
    conflict(revision: number) { base = revision; },
    reset() { editors = []; dirty = false; signature = ''; state = null; generation++; initialize(); },
  };
}
