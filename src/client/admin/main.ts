import './admin.css';
import type { AdminState, MarketCommand, Snapshot } from '../shared/protocol.js';
import { ApiError, connectMarket, readJson, sendCommand, syncServerClock } from '../shared/connection.js';
import { createClock } from '../shared/clock.js';
import { formatEuro, formatCountdown, parseEuro } from '../shared/format.js';
import { createPriceTable } from './price-table.js';
import { createSettings } from './settings.js';
const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const clock = createClock(); let state: AdminState | null = null; let connected = false; let session = 0;
let stream: ReturnType<typeof connectMarket> | null = null; let operations = Promise.resolve(); let actionPending = 0;
const normal = createPriceTable(element('normal-table'), element('normal-average'), 'normal', (id, raw, generation) => savePrice('normal', id, raw, generation));
const crash = createPriceTable(element('crash-table'), element('crash-average'), 'crash', (id, raw, generation) => savePrice('crash', id, raw, generation));
const settings = createSettings(element('settings-table'), element('settings-add'), element('settings-save'), (drinks, revision, generation) => {
  void execute({ type: 'configure', drinks }, () => revision).then(() => { settings.saved(generation); render(); }).catch(error => { settings.conflict(state?.revision ?? revision); element('settings-error').textContent = error.message; });
});
function showLogin() {
  session++; stream?.close(); stream = null; state = null; connected = false;
  normal.reset(); crash.reset(); settings.reset(); element('recovery-table').replaceChildren();
  element('controls').hidden = true; element('logout').hidden = true; element('login-panel').hidden = false;
  element('connection').textContent = 'Bitte anmelden';
}
function apply(snapshot: Snapshot<AdminState>) {
  if (state && snapshot.state.revision < state.revision) return;
  state = snapshot.state; render();
}
function activate(snapshot: Snapshot<AdminState>) {
  const activeSession = ++session; stream?.close(); connected = false;
  element('login-panel').hidden = true; element('controls').hidden = false; element('logout').hidden = false;
  clock.sync(snapshot.serverNow, performance.now(), performance.now()); apply(snapshot);
  void syncServerClock(clock).catch(() => {});
  stream = connectMarket<AdminState>('admin', {
    onState: snapshot => { if (session === activeSession) apply(snapshot); },
    onConnection: online => {
      if (session !== activeSession) return; connected = online; render();
      if (online) void syncServerClock(clock).catch(() => {});
      else void readJson<Snapshot<AdminState>>('/api/admin/state').catch(error => { if (error instanceof ApiError && error.status === 401 && session === activeSession) showLogin(); });
    },
  });
}
function execute(command: MarketCommand, revision?: () => number): Promise<Snapshot<AdminState>> {
  const activeSession = session; const action = command.type === 'start' || command.type === 'crash';
  if (action) { actionPending++; renderStatus(); }
  const request = operations.then(async () => {
    if (!state || !connected || activeSession !== session) throw Error('Keine Verbindung. Die Eingabe wurde nicht gespeichert.');
    const base = revision ? revision() : state.revision;
    const snapshot = await sendCommand(command, base);
    if (activeSession !== session) throw Error('Bitte erneut anmelden.');
    normal.ownRevision(base, snapshot.state.revision); crash.ownRevision(base, snapshot.state.revision); settings.ownRevision(base, snapshot.state.revision);
    apply(snapshot); return snapshot;
  });
  operations = request.then(() => {}, () => {});
  return request.finally(() => { if (action) actionPending--; renderStatus(); });
}
async function savePrice(scope: 'normal' | 'crash', id: string, raw: string, generation: number) {
  const table = scope === 'normal' ? normal : crash;
  try {
    const value = parseEuro(raw);
    await execute({ type: 'override', scope, drinkId: id, value }, () => table.baseRevision(id));
    table.saved(id, generation); render();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) { try { apply(await readJson('/api/admin/state')); } catch {} }
    table.error(id, generation, (error as Error).message, state?.revision ?? 0);
  }
}
function renderStatus() {
  if (!state) return;
  const now = clock.now(performance.now()); const remaining = state.deadline === null ? null : state.deadline - now;
  element('connection').textContent = connected ? 'Verbunden' : 'Verbindung unterbrochen'; element('connection').className = `badge ${connected ? 'up' : 'down'}`;
  element('countdown').textContent = formatCountdown(remaining);
  element('countdown-label').textContent = state.nextKind === 'recovery' ? 'BIS ZUR ERHOLUNG' : state.nextKind === 'crash' ? 'BIS ZUM CRASH' : 'NÄCHSTE PREISRUNDE';
  element('phase-label').textContent = state.phase === 'ready' ? 'Marktvorbereitung' : state.phase === 'crash' ? 'Börsencrash' : state.phase === 'transition' ? 'Preiswechsel läuft' : remaining !== null && remaining <= 0 ? 'Warte auf Preisfreigabe' : 'Kurse live';
  element('phase-detail').textContent = state.phase === 'ready' ? 'Startpreise sind sichtbar' : state.phase === 'crash' ? 'Danach: neue Kurse mit +10 % Tendenz' : 'Vorgaben gelten für eine Preisrunde';
  const normalLocked = state.phase === 'normal' && remaining !== null && remaining <= 10_000;
  element<HTMLButtonElement>('start').disabled = !connected || state.phase !== 'ready' || actionPending > 0;
  element<HTMLButtonElement>('crash').disabled = !connected || state.phase !== 'normal' || normalLocked || actionPending > 0;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.view === state!.viewMode)); button.disabled = !connected; });
  normal.update(state, connected, now); crash.update(state, connected, now);
}
function render() {
  if (!state) return; renderStatus(); settings.update(state, connected);
  element('normal-note').textContent = state.previews.normal === null ? 'Die normale Zufallsvorschau folgt nach der Erholung. Manuelle Vorgaben bleiben gespeichert.' : 'Zufallsvorschläge stehen fest. Manuelle Vorgaben gelten für eine Runde.';
  const recovery = state.previews.recovery; element('recovery-panel').hidden = recovery === null;
  element('recovery-table').replaceChildren();
  if (recovery) for (const drink of state.drinks) { const item = document.createElement('div'); item.className = 'recovery-item'; const name = document.createElement('span'); name.textContent = drink.name; const price = document.createElement('strong'); price.textContent = formatEuro(recovery[drink.id]); item.append(name, price); element('recovery-table').append(item); }
}
element<HTMLFormElement>('login-form').onsubmit = event => {
  event.preventDefault(); const button = element('login-form').querySelector('button')!; button.disabled = true; element('login-error').textContent = '';
  void readJson<Snapshot<AdminState>>('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: element<HTMLInputElement>('password').value }) })
    .then(activate).catch(error => { element('login-error').textContent = error.message; }).finally(() => { button.disabled = false; });
};
element('logout').onclick = () => { void fetch('/api/logout', { method: 'POST' }).finally(showLogin); };
const marketAction = (type: 'start' | 'crash') => { element('global-error').hidden = true; void execute({ type }).catch(error => { element('global-error').textContent = error.message; element('global-error').hidden = false; }); };
element('start').onclick = () => marketAction('start'); element('crash').onclick = () => marketAction('crash');
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => { button.onclick = () => { void execute({ type: 'view', mode: button.dataset.view as 'overview' | 'ticker' }).catch(error => { element('global-error').textContent = error.message; element('global-error').hidden = false; }); }; });
window.setInterval(renderStatus, 100);
window.setInterval(() => { if (state) void syncServerClock(clock).catch(() => {}); }, 30_000);
void readJson<Snapshot<AdminState>>('/api/admin/state').then(activate).catch(() => showLogin());
