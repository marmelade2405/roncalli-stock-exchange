import './display.css';
import {animationParameters} from '../shared/animation-parameters.js';
import './quote-layout.css';
import {applyQuoteReveal} from './quote-reveal.js';
import {clearCharts} from './chart.js';
import type { DisplayState, Snapshot } from '../shared/protocol.js';
import { connectMarket, syncServerClock,sendCommand,readJson } from '../shared/connection.js';
import { createClock } from '../shared/clock.js';
import { createFreshness } from '../shared/freshness.js';
import { formatCountdown,formatEuro } from '../shared/format.js';
import { getDisplayModel,createNewsHold } from './view-model.js';
import { renderOverview } from './overview.js';
import { renderTicker,clearTicker } from './ticker.js';
import { renderTransition } from './transition.js';
import {renderBreakingNews} from './breaking-news.js';
import {pauseNewsIntroVideo} from './news-intro-video.js';
import {crashIntroDuration} from '../../domain/parameters.js';
import {renderNewsTape,clearNewsTape,openingNews} from './news-tape.js';
const element = (id: string) => document.getElementById(id)!;
const clock = createClock(); let state: DisplayState | null = null; let connected = false; let synced = false; let hadConnection = false; let rendered = -1;
const freshness=createFreshness();
const newsHold=createNewsHold();
let metadata:Snapshot<DisplayState>|null=null;
let receivedAt=0;
let authenticated=false,skipPending=false;
async function readSession(){try{authenticated=(await readJson<{authenticated:boolean}>('/api/admin/session')).authenticated;}catch{authenticated=false;}}
void readSession();window.setInterval(()=>{void readSession();},5000);
async function skipTransition(){if(!state||!authenticated||skipPending||metadata?.clock.mode!=='simulation'||state.phase!=='transition')return;skipPending=true;try{await sendCommand({type:'skip-transition'},state.revision);}catch{}finally{skipPending=false;}}
function bindSkipButtons(container:HTMLElement,selector:string){const disabled=!authenticated||!connected||!freshness.isFresh(performance.now())||metadata?.clock.mode!=='simulation'||state?.phase!=='transition'||skipPending;for(const button of container.querySelectorAll<HTMLButtonElement>(selector)){button.disabled=disabled;button.onclick=()=>{void skipTransition();};}const hint=container.querySelector<HTMLElement>('.transition-skip-hint');if(hint)hint.hidden=disabled;}
function frame() {
  if (!state) return;
  const parameters=animationParameters(state);
  const now = clock.now(performance.now()); const model = getDisplayModel(state, now, connected,freshness.isFresh(performance.now()));
  const newsKey=state.phase==='transition'&&state.news&&state.deadline!==null?`${state.runId}:${state.news.id}:${state.deadline}`:null;
  const newsDeadlineAt=metadata&&state.deadline!==null&&metadata.clock.rate>0?receivedAt+(state.deadline-metadata.clock.marketNow)/metadata.clock.rate:Infinity;
  const holdNews=newsHold(newsKey,model.holdNews,performance.now(),newsDeadlineAt);
  const crash = state.phase === 'crash' || (state.phase === 'transition' && state.nextKind === 'recovery');
  document.body.classList.toggle('crash-active', crash);
  element('market-status').textContent = !connected ? 'VERBINDUNG UNTERBROCHEN' : crash ? 'BÖRSENCRASH' : state.phase === 'ready' ? 'MARKT ÖFFNET BALD' : 'MARKT LIVE';
  element('market-status').className = `badge ${!connected || crash ? 'down' : 'up'}`;
  element('market-status').dataset.live=String(connected&&freshness.isFresh(performance.now())&&model.showPrices&&state.phase==='normal'&&metadata?.clock.paused!==true);
  element('timer-label').textContent = state.nextKind==='special'?'BREAKING NEWS ENDET IN':state.nextKind === 'recovery' ? 'ERHOLUNG IN' : state.nextKind === 'crash' ? 'CRASH STARTET IN' : 'NÄCHSTE PREISRUNDE';
  element('crash-price-hint').textContent='Börsencrash: '+formatEuro(state.parameters.crashCostCents??1500);
  element('timer').textContent = formatCountdown(model.remainingMs);
  element('simulation-badge').hidden=metadata?.clock.mode!=='simulation';
  if(metadata?.clock.mode==='simulation')element('simulation-badge').textContent=`SIMULATION · ${metadata.clock.paused?'PAUSIERT':`${metadata.clock.rate}×`}`;
  element('price-zone').hidden = !model.showPrices;
  element('price-zone').classList.toggle('after-news',model.showPrices&&state.publication?.kind==='special'&&metadata!==null&&metadata.serverNow+performance.now()-receivedAt-state.publication.wallAt<600);
  element('overview').hidden = state.viewMode !== 'overview'; element('ticker').hidden = state.viewMode !== 'ticker';
  if (rendered !== state.revision) { renderOverview(element('overview'), state); rendered = state.revision; }
  if (state.viewMode === 'ticker' && model.showPrices&&metadata) renderTicker(element('ticker'), state, metadata.serverNow+performance.now()-receivedAt);
  if(metadata&&model.showPrices){const wallNow=metadata.serverNow+performance.now()-receivedAt;applyQuoteReveal(element('overview'),state,wallNow);}
  element('waiting').hidden = !model.waitingForPublication||holdNews;
  if (model.waitingForPublication) { element('waiting-title').textContent = 'Warte auf aktuelle Preise'; element('waiting-detail').textContent = connected ? 'Der nächste Preisstand wird freigegeben' : 'Die Verbindung zum Markt wird wiederhergestellt'; }
  const news=model.transitionKind==='special'&&state.news!==null&&(!model.waitingForPublication||holdNews);
  element('breaking-news').hidden=!news;
  if(news&&element('breaking-news').dataset.eventKey!==newsKey){pauseNewsIntroVideo(element('breaking-news'));delete element('breaking-news').dataset.newsId;element('breaking-news').dataset.eventKey=newsKey!;}
  if(news){renderBreakingNews(element('breaking-news'),state.news!,holdNews?1:model.remainingMs??0,state.drinks.find(d=>d.id===state!.news!.drinkId)?.name??state.news!.drinkId,parameters.newsMs,parameters.newsIntroMs??Math.min(5000,parameters.newsMs-1000),metadata?.clock.paused===true,parameters.newsTextRevealMs??3000,parameters.newsQuoteRevealMs??4500,authenticated&&metadata?.clock.mode==='simulation'&&!holdNews);bindSkipButtons(element('breaking-news'),'.news-skip-count');}else pauseNewsIntroVideo(element('breaking-news'));
  const tape=state.recentNews??(state.showOpeningNews?openingNews:null);
  element('news-tape').hidden=!model.showPrices||!tape;
  if(model.showPrices&&metadata&&tape)renderNewsTape(element('news-tape'),tape,state.recentNews?(state.drinks.find(d=>d.id===tape.drinkId)?.name??tape.drinkId):'',metadata.serverNow+performance.now()-receivedAt);
  element('transition').hidden = !model.transitionKind || model.waitingForPublication||news;
  if (model.transitionKind && !model.waitingForPublication&&!news){renderTransition(element('transition'), model.transitionKind, model.remainingMs ?? 0,model.transitionKind==='crash'?crashIntroDuration(parameters):parameters.transitionMs,state.crashPercent,metadata?.clock.paused===true);bindSkipButtons(element('transition'),'.transition-count');}else pauseNewsIntroVideo(element('transition'));
}
function open() {
  connectMarket<DisplayState>('public', {
    onState: (packet: Snapshot<DisplayState>) => { if(state&&packet.state.revision<state.revision)return;if(!clock.sync(packet,performance.now(),performance.now()))return;if(state&&state.runId!==packet.state.runId){rendered=-1;pauseNewsIntroVideo(element('breaking-news'));pauseNewsIntroVideo(element('transition'));clearCharts(element('overview'));element('overview').replaceChildren();clearTicker(element('ticker'));clearNewsTape(element('news-tape'));element('breaking-news').replaceChildren();delete element('breaking-news').dataset.newsId;delete element('transition').dataset.kind;}synced=true;freshness.received(performance.now());receivedAt=performance.now();metadata=packet;state = packet.state; frame(); },
    onConnection: online => { connected = online; if (!online){freshness.reset();} if (online && hadConnection) void syncServerClock(clock).then(frame).catch(() => {}); hadConnection ||= online; frame(); },
  });
}
void syncServerClock(clock).then(() => { synced = true; open(); }).catch(open);
function loop() { frame(); window.requestAnimationFrame(loop); } window.requestAnimationFrame(loop);
window.setInterval(() => { if (connected) void syncServerClock(clock).then(frame).catch(() => {}); }, 30_000);
element('fullscreen').onclick = () => { void document.documentElement.requestFullscreen().catch(() => {}); };
document.onfullscreenchange = () => { element('fullscreen').hidden = document.fullscreenElement !== null; };

 document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseNewsIntroVideo(element('breaking-news'));pauseNewsIntroVideo(element('transition'));}else frame();});
