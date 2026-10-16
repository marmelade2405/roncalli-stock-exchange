import './display.css';
import type { DisplayState, Snapshot } from '../shared/protocol.js';
import { connectMarket, syncServerClock } from '../shared/connection.js';
import { createClock } from '../shared/clock.js';
import { formatCountdown } from '../shared/format.js';
import { getDisplayModel } from './view-model.js';
import { renderOverview } from './overview.js';
import { renderTicker } from './ticker.js';
import { renderTransition } from './transition.js';
const element = (id: string) => document.getElementById(id)!;
const clock = createClock(); let state: DisplayState | null = null; let connected = false; let synced = false; let hadConnection = false; let rendered = -1;
const wallClock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
function frame() {
  if (!state) return;
  const now = clock.now(performance.now()); const model = getDisplayModel(state, now, connected);
  const crash = state.phase === 'crash' || (state.phase === 'transition' && state.nextKind === 'recovery');
  document.body.classList.toggle('crash-active', crash);
  element('market-status').textContent = !connected ? 'VERBINDUNG UNTERBROCHEN' : crash ? 'BÖRSENCRASH' : state.phase === 'ready' ? 'MARKT ÖFFNET BALD' : 'MARKT LIVE';
  element('market-status').className = `badge ${!connected || crash ? 'down' : 'up'}`;
  element('timer-label').textContent = state.nextKind === 'recovery' ? 'ERHOLUNG IN' : state.nextKind === 'crash' ? 'CRASH STARTET IN' : 'NÄCHSTE PREISRUNDE';
  element('timer').textContent = formatCountdown(model.remainingMs);
  element('market-clock').textContent = wallClock.format(new Date(now));
  element('footer-status').textContent = !connected ? 'LETZTER EMPFANGENER PREISSTAND' : state.phase === 'ready' ? 'STARTPREISE · MARKT ÖFFNET BALD' : crash ? 'CRASHPREISE · 5 MINUTEN' : 'LIVE-KURSE · GETRÄNKEBÖRSE';
  element('price-zone').hidden = !model.showPrices;
  element('overview').hidden = state.viewMode !== 'overview'; element('ticker').hidden = state.viewMode !== 'ticker';
  if (rendered !== state.revision) { renderOverview(element('overview'), state); rendered = state.revision; }
  if (state.viewMode === 'ticker' && model.showPrices) renderTicker(element('ticker'), state, now);
  element('waiting').hidden = !model.waitingForPublication;
  if (model.waitingForPublication) { element('waiting-title').textContent = 'Warte auf aktuelle Preise'; element('waiting-detail').textContent = connected ? 'Der nächste Preisstand wird freigegeben.' : 'Die Verbindung zum Markt wird wiederhergestellt.'; }
  element('transition').hidden = !model.transitionKind || model.waitingForPublication;
  if (model.transitionKind && !model.waitingForPublication) renderTransition(element('transition'), model.transitionKind, model.remainingMs ?? 0);
}
function open() {
  connectMarket<DisplayState>('public', {
    onState: (packet: Snapshot<DisplayState>) => { if (!synced) { clock.sync(packet.serverNow, performance.now(), performance.now()); synced = true; } state = packet.state; frame(); },
    onConnection: online => { connected = online; if (online && hadConnection) void syncServerClock(clock).then(frame).catch(() => {}); hadConnection ||= online; frame(); },
  });
}
void syncServerClock(clock).then(() => { synced = true; open(); }).catch(open);
function loop() { frame(); window.requestAnimationFrame(loop); } window.requestAnimationFrame(loop);
window.setInterval(() => { if (connected) void syncServerClock(clock).then(frame).catch(() => {}); }, 30_000);
element('fullscreen').onclick = () => { void document.documentElement.requestFullscreen().catch(() => {}); };
document.onfullscreenchange = () => { element('fullscreen').hidden = document.fullscreenElement !== null; };
