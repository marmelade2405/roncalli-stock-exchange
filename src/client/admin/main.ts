import './admin.css';
import {createAdminNavigation} from './navigation.js';
import type { AdminState, MarketCommand, Snapshot } from '../shared/protocol.js';
import { ApiError, connectMarket, readJson, sendCommand, syncServerClock } from '../shared/connection.js';
import { createClock } from '../shared/clock.js';
import { formatEuro, formatCountdown, parseEuro } from '../shared/format.js';
import { createPriceTable } from './price-table.js';
import { createSettings } from './settings.js';
import { createSpecialQueue } from './special-queue.js';
import { createSimulationPanel } from './simulation-panel.js';
import { createResetDialog } from './reset-dialog.js';
import {createTickerSpeed} from './ticker-speed.js';
import {createChartMode} from './chart-mode.js';
import {createTickerColumns} from './ticker-columns.js';
import {createMarketAudio} from '../display/market-audio.js';
import {createSoundEvents} from '../display/sound-events.js';
import {getDisplayModel} from '../display/view-model.js';
const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
createAdminNavigation(document.getElementById('admin-navigation')!);
const clock = createClock(); let state: AdminState | null = null; let connected = false; let session = 0;
let stream: ReturnType<typeof connectMarket> | null = null; let operations = Promise.resolve(); let actionPending = 0;
let metadata:Snapshot<AdminState>|null=null;
let receivedAt=0;const audio=createMarketAudio(element<HTMLButtonElement>('sound-toggle'),element<HTMLInputElement>('sound-volume'),element('sound-controls')),soundEvents=createSoundEvents();
const report=(error:Error)=>{element('global-error').textContent=error.message;element('global-error').hidden=false;};
const queue=createSpecialQueue(element('special-queue'),{trigger:(specialId,revision)=>{void execute({type:'special',specialId},()=>revision).catch(report);}});
const simulation=createSimulationPanel(element('simulation-panel'),command=>execute(command).catch(error=>{report(error);throw error;}));
const tickerSpeed=createTickerSpeed(element('ticker-speed-control'),command=>execute(command).catch(error=>{report(error);throw error;}));
const chartMode=createChartMode(element('chart-mode-control'),command=>execute(command).catch(error=>{report(error);throw error;}));
const tickerColumns=createTickerColumns(element('ticker-columns-control'),command=>execute(command).catch(error=>{report(error);throw error;}));
const resetDialog=createResetDialog(element('reset-dialog'),async(kind,revision)=>{try{return await execute({type:'reset',kind},()=>revision);}catch(error){if(error instanceof ApiError&&error.status===409)apply(await readJson('/api/admin/state'));throw error;}});
const normal = createPriceTable(element('normal-table'), element('normal-average'), 'normal', (id, raw, generation) => savePrice('normal', id, raw, generation),async(id,value,revision)=>{try{return await execute({type:'correct',drinkId:id,value},()=>revision);}catch(error){if(error instanceof ApiError&&error.status===409)apply(await readJson('/api/admin/state'));throw error;}});
const crash = createPriceTable(element('crash-table'), element('crash-average'), 'crash', (id, raw, generation) => savePrice('crash', id, raw, generation));
const settings = createSettings(element('settings-table'), element('settings-add'), element('settings-save'), (config, revision, generation) => {
  const run=state!.runId,auth=session;
  void execute({ type: 'configure', ...config }, () => revision).then(() => { if(state?.runId!==run||session!==auth)return;settings.saved(generation); render(); }).catch(error => { if(state?.runId!==run||session!==auth)return;settings.conflict(state?.revision ?? revision); element('settings-error').textContent = error.message; });
},render);
function showLogin() {
  audio.stop();tickerSpeed.reset();chartMode.reset();tickerColumns.reset();
  session++; stream?.close(); stream = null; state = null; connected = false;
  normal.reset(); crash.reset(); settings.reset(); queue.reset();simulation.reset();resetDialog.close();operations=Promise.resolve();actionPending=0;metadata=null;element('recovery-table').replaceChildren();
  element('controls').hidden = true; element('logout').hidden = true; element('login-panel').hidden = false;
  element('connection').textContent = 'Bitte anmelden';
}
function apply(snapshot: Snapshot<AdminState>) {
  if (state && snapshot.state.revision < state.revision) return;
  if(state&&snapshot.state.runId!==state.runId){normal.reset();crash.reset();settings.reset();queue.reset();simulation.reset();tickerSpeed.reset();chartMode.reset();tickerColumns.reset();operations=Promise.resolve();actionPending=0;element('global-error').hidden=true;}
  clock.sync(snapshot,performance.now(),performance.now());
  if(state?.runId!==snapshot.state.runId||metadata?.clock.paused===false&&snapshot.clock.paused)audio.stop();receivedAt=performance.now();metadata=snapshot;state = snapshot.state;resetDialog.updateRevision(state.revision); render();
}
function activate(snapshot: Snapshot<AdminState>) {
  const activeSession = ++session; stream?.close(); connected = false;
  element('login-panel').hidden = true; element('controls').hidden = false; element('logout').hidden = false;
  clock.sync(snapshot, performance.now(), performance.now()); apply(snapshot);
  void syncServerClock(clock).catch(() => {});
  stream = connectMarket<AdminState>('admin', {
    onState: snapshot => { if (session === activeSession) apply(snapshot); },
    onConnection: online => {
      if (session !== activeSession) return; connected = online;if(!online)audio.stop(); render();
      if (online) void syncServerClock(clock).catch(() => {});
      else void readJson<Snapshot<AdminState>>('/api/admin/state').catch(error => { if (error instanceof ApiError && error.status === 401 && session === activeSession) showLogin(); });
    },
  });
}
function execute(command: MarketCommand, revision?: () => number): Promise<Snapshot<AdminState>> {
  const activeSession = session,run=state?.runId; const action = command.type === 'start' || command.type === 'crash';
  if (action) { actionPending++; renderStatus(); }
  const request = operations.then(async () => {
    if (!state || !connected || activeSession !== session||state.runId!==run) throw Error('Keine Verbindung oder neuer Abend. Die Eingabe wurde nicht gespeichert.');
    const base = revision ? revision() : state.revision;
    const snapshot = await sendCommand(command, base);
    if (activeSession !== session) throw Error('Bitte erneut anmelden.');
    if(state.runId!==run&&command.type!=='reset')throw Error('Der Abend wurde inzwischen zurückgesetzt.');
    normal.ownRevision(base, snapshot.state.revision); crash.ownRevision(base, snapshot.state.revision); settings.ownRevision(base, snapshot.state.revision);
    apply(snapshot); return snapshot;
  });
  operations = request.then(() => {}, () => {});
  return request.finally(() => { if (action&&state?.runId===run) actionPending--; renderStatus(); });
}
async function savePrice(scope: 'normal' | 'crash', id: string, raw: string, generation: number) {
  const table = scope === 'normal' ? normal : crash;
  const run=state?.runId,auth=session;
  try {
    const value = parseEuro(raw);
    await execute({ type: 'override', scope, drinkId: id, value }, () => table.baseRevision(id));
    if(state?.runId===run&&session===auth){table.saved(id, generation); render();}
  } catch (error) {
    if(state?.runId!==run||session!==auth)return;
    if (error instanceof ApiError && error.status === 409) { try { apply(await readJson('/api/admin/state')); } catch {} }
    table.error(id, generation, (error as Error).message, state?.revision ?? 0);
  }
}
function renderStatus() {
  if (!state) return;
  const now = clock.now(performance.now()); const remaining = state.deadline === null ? null : state.deadline - now;
  if(metadata){const model=getDisplayModel(state,now,connected,performance.now()-receivedAt<15000);for(const cue of soundEvents.update(state,model.transitionKind,metadata.serverNow+performance.now()-receivedAt,connected&&performance.now()-receivedAt<15000&&!metadata.clock.paused&&audio.active()))audio.play(cue);}
  element('connection').textContent = connected ? 'Verbunden' : 'Verbindung unterbrochen'; element('connection').className = `badge ${connected ? 'up' : 'down'}`;
  element('countdown').textContent = formatCountdown(remaining);
  element<HTMLButtonElement>('countdown').disabled=!connected||metadata?.clock.mode!=='simulation'||state.phase!=='transition'||state.nextKind==='special';
  element('countdown-label').textContent = state.nextKind === 'recovery' ? 'BIS ZUR ERHOLUNG' : state.nextKind === 'crash' ? 'BIS ZUM CRASH' : 'NÄCHSTE PREISRUNDE';
  element('phase-label').textContent = state.phase === 'ready' ? 'Marktvorbereitung' : state.phase === 'crash' ? 'Börsencrash' : state.phase === 'transition' ? 'Preiswechsel läuft' : remaining !== null && remaining <= 0 ? 'Warte auf Preisfreigabe' : 'Kurse live';
  element('phase-detail').textContent = state.phase === 'ready' ? 'Startpreise sind sichtbar' : state.phase === 'crash' ? `Danach: neue Kurse mit +${state.crashPercent??state.parameters.recoveryTrendPercent} %` : 'Vorgaben gelten für eine Preisrunde';
  const normalLocked = state.phase === 'normal' && remaining !== null && remaining <= state.parameters.transitionMs;
  element<HTMLButtonElement>('start').disabled = !connected || state.phase !== 'ready' || actionPending > 0||settings.isDirty();
  element<HTMLButtonElement>('crash').disabled = !connected || state.phase !== 'normal' || normalLocked || actionPending > 0;
  element<HTMLButtonElement>('cancel-crash').disabled=!connected||!(state.phase==='crash'||state.nextKind==='crash');
  element<HTMLButtonElement>('reset-evening').disabled=!connected;element<HTMLButtonElement>('reset-factory').disabled=!connected;
  if(metadata){const snapshot={...metadata,state,clock:{...metadata.clock,marketNow:now}};queue.update(snapshot,connected);simulation.update(snapshot,connected);}
  tickerSpeed.update(state,connected);
  chartMode.update(state,connected);tickerColumns.update(state,connected);
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.view === state!.viewMode)); button.disabled = !connected; });
  normal.update(state, connected, now); crash.update(state, connected, now);
}
function render() {
  if (!state) return; renderStatus(); settings.update(state, connected);
  element('normal-note').textContent = state.previews.normal === null ? 'Die normale Zufallsvorschau folgt nach der Erholung. Manuelle Vorgaben bleiben gespeichert.' : 'Zufallsvorschläge stehen fest. Manuelle Vorgaben gelten für eine Runde.';
  element('crash-heading').textContent=`${state.parameters.crashMs/60000} Minuten Ausnahmezustand`;
  const crashPercent=state.crashPercent??state.nextCrashPercent;
  element('crash-note').textContent=crashPercent===undefined?`Crashpreise vorgeben oder Zufall nutzen · Übergang ${state.parameters.transitionMs/1000} Sekunden`:`Ausgeloster Marktimpuls −${crashPercent} % · ${state.parameters.crashAmplitudeFactor}× normale Schwankungsbreite · Erholung +${crashPercent} % · Rundung, Grenzen und manuelle Vorgaben können abweichen`;
  element('recovery-panel').querySelector('.panel-intro')!.textContent=`Gespeicherte Erholung mit +${state.crashPercent??state.parameters.recoveryTrendPercent} %; danach neuer ${state.parameters.normalMs/60000}-Minuten-Timer`;
  element('recovery-panel').querySelector('.mean-badge')!.textContent=`Erholung: +${state.crashPercent??state.parameters.recoveryTrendPercent} %`;
  document.querySelector('.admin-footer span:last-child')!.textContent=`${state.parameters.normalMs/60000} Minuten Markt · ${state.parameters.crashMs/60000} Minuten Crash`;
  const recovery = state.previews.recovery; element('recovery-panel').hidden = recovery === null;
  element('recovery-table').replaceChildren();
  if (recovery) for (const drink of state.drinks) { const item = document.createElement('div'); item.className = 'recovery-item'; const name = document.createElement('span'); name.textContent = drink.name; const price = document.createElement('strong'); price.textContent = formatEuro(recovery[drink.id]); item.append(name, price); element('recovery-table').append(item); }
}
element<HTMLFormElement>('login-form').onsubmit = event => {
  event.preventDefault(); const button = element('login-form').querySelector('button')!; button.disabled = true; element('login-error').textContent = '';
  void readJson<Snapshot<AdminState>>('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: element<HTMLInputElement>('password').value }) })
    .then(activate).catch(error => { element('login-error').textContent = error.message; }).finally(() => { button.disabled = false; });
};
element('countdown').onclick=()=>{void execute({type:'skip-transition'}).catch(report);};
element('logout').onclick = () => { void fetch('/api/logout', { method: 'POST' }).finally(showLogin); };
const marketAction = (type: 'start' | 'crash') => { element('global-error').hidden = true; void execute({ type }).catch(error => { element('global-error').textContent = error.message; element('global-error').hidden = false; }); };
element('start').onclick = () => marketAction('start'); element('crash').onclick = () => marketAction('crash');
element('cancel-crash').onclick=()=>{void execute({type:'cancel-crash'}).catch(report);};
element('reset-evening').onclick=()=>resetDialog.open('evening',state!.revision);element('reset-factory').onclick=()=>resetDialog.open('factory',state!.revision);
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => { button.onclick = () => { void execute({ type: 'view', mode: button.dataset.view as 'overview' | 'ticker' }).catch(error => { element('global-error').textContent = error.message; element('global-error').hidden = false; }); }; });
window.setInterval(renderStatus, 100);
window.setInterval(() => { if (state) void syncServerClock(clock).catch(() => {}); }, 30_000);
void readJson<Snapshot<AdminState>>('/api/admin/state').then(activate).catch(() => showLogin());
