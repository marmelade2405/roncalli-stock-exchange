import './display.css';
import type { DisplayState, Snapshot } from '../shared/protocol.js';
import { connectMarket, syncServerClock } from '../shared/connection.js';
import { createClock } from '../shared/clock.js';
import { createFreshness } from '../shared/freshness.js';
import { formatCountdown } from '../shared/format.js';
import { getDisplayModel } from './view-model.js';
import { renderOverview } from './overview.js';
import { renderTicker,clearTicker } from './ticker.js';
import { renderTransition } from './transition.js';
import {renderBreakingNews} from './breaking-news.js';
const element = (id: string) => document.getElementById(id)!;
const clock = createClock(); let state: DisplayState | null = null; let connected = false; let synced = false; let hadConnection = false; let rendered = -1;
const freshness=createFreshness();
let metadata:Snapshot<DisplayState>|null=null;
const wallClock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
function frame() {
  if (!state) return;
  const now = clock.now(performance.now()); const model = getDisplayModel(state, now, connected,freshness.isFresh(performance.now()));
  const crash = state.phase === 'crash' || (state.phase === 'transition' && state.nextKind === 'recovery');
  document.body.classList.toggle('crash-active', crash);
  element('market-status').textContent = !connected ? 'VERBINDUNG UNTERBROCHEN' : crash ? 'BÖRSENCRASH' : state.phase === 'ready' ? 'MARKT ÖFFNET BALD' : 'MARKT LIVE';
  element('market-status').className = `badge ${!connected || crash ? 'down' : 'up'}`;
  element('timer-label').textContent = state.nextKind === 'recovery' ? 'ERHOLUNG IN' : state.nextKind === 'crash' ? 'CRASH STARTET IN' : 'NÄCHSTE PREISRUNDE';
  element('timer').textContent = formatCountdown(model.remainingMs);
  element('market-clock').textContent = wallClock.format(new Date(now));
  element('footer-status').textContent = !connected ? 'PREISE AUSGEBLENDET · VERBINDUNG WIRD HERGESTELLT' : state.phase === 'ready' ? 'STARTPREISE · MARKT ÖFFNET BALD' : crash ? 'CRASHPREISE · GETRÄNKEBÖRSE' : 'LIVE-KURSE · GETRÄNKEBÖRSE';
  element('simulation-badge').hidden=metadata?.clock.mode!=='simulation';
  if(metadata?.clock.mode==='simulation')element('simulation-badge').textContent=`SIMULATION · ${metadata.clock.paused?'PAUSIERT':`${metadata.clock.rate}×`}`;
  element('price-zone').hidden = !model.showPrices;
  element('overview').hidden = state.viewMode !== 'overview'; element('ticker').hidden = state.viewMode !== 'ticker';
  if (rendered !== state.revision) { renderOverview(element('overview'), state); rendered = state.revision; }
  if (state.viewMode === 'ticker' && model.showPrices) renderTicker(element('ticker'), state, now);
  element('waiting').hidden = !model.waitingForPublication;
  if (model.waitingForPublication) { element('waiting-title').textContent = 'Warte auf aktuelle Preise'; element('waiting-detail').textContent = connected ? 'Der nächste Preisstand wird freigegeben.' : 'Die Verbindung zum Markt wird wiederhergestellt.'; }
  const news=model.transitionKind==='special'&&state.news!==null&&!model.waitingForPublication;
  element('breaking-news').hidden=!news;
  if(news)renderBreakingNews(element('breaking-news'),state.news!,model.remainingMs??0,state.drinks.find(d=>d.id===state!.news!.drinkId)?.name??state.news!.drinkId);
  element('transition').hidden = !model.transitionKind || model.waitingForPublication||news;
  if (model.transitionKind && !model.waitingForPublication&&!news) renderTransition(element('transition'), model.transitionKind, model.remainingMs ?? 0,state.parameters.transitionMs);
}
function open() {
  connectMarket<DisplayState>('public', {
    onState: (packet: Snapshot<DisplayState>) => { if(state&&packet.state.revision<state.revision)return;if(!clock.sync(packet,performance.now(),performance.now()))return;if(state&&state.runId!==packet.state.runId){rendered=-1;element('overview').replaceChildren();clearTicker(element('ticker'));element('breaking-news').replaceChildren();delete element('breaking-news').dataset.newsId;delete element('transition').dataset.kind;}synced=true;freshness.received(performance.now());metadata=packet;state = packet.state; frame(); },
    onConnection: online => { connected = online; if (!online) freshness.reset(); if (online && hadConnection) void syncServerClock(clock).then(frame).catch(() => {}); hadConnection ||= online; frame(); },
  });
}
void syncServerClock(clock).then(() => { synced = true; open(); }).catch(open);
function loop() { frame(); window.requestAnimationFrame(loop); } window.requestAnimationFrame(loop);
window.setInterval(() => { if (connected) void syncServerClock(clock).then(frame).catch(() => {}); }, 30_000);
element('fullscreen').onclick = () => { void document.documentElement.requestFullscreen().catch(() => {}); };
document.onfullscreenchange = () => { element('fullscreen').hidden = document.fullscreenElement !== null; };
