import type {DisplayState} from '../shared/protocol.js';
import {syncNewsIntroVideo} from './news-intro-video.js';
import {renderNewsAnnouncement} from './news-announcement.js';
import {newsRevealDurations,renderNewsWords} from './news-reveal.js';
const fits=new WeakMap<HTMLElement,{width:number;height:number;layout:string;fit:number}>();
function fitNewsMessage(container:HTMLElement,message:HTMLElement):number{
  if(message.hidden)return 1;
  const width=container.clientWidth,height=container.clientHeight,layout=message.dataset.layout??'',cached=fits.get(message);
  if(cached?.width===width&&cached.height===height&&cached.layout===layout)return cached.fit;
  message.style.zoom='1';const style=getComputedStyle(container),available=height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  const fit=Math.min(1,Math.max(.1,available/Math.max(1,message.scrollHeight)));fits.set(message,{width,height,layout,fit});return fit;
}
export function newsStage(totalMs:number,introMs:number,remainingMs:number):'intro'|'message'|'finished'{return remainingMs<=0?'finished':remainingMs>totalMs-introMs?'intro':'message';}
export function renderBreakingNews(container:HTMLElement,news:NonNullable<DisplayState['news']>,remainingMs:number,drinkName=news.drinkId,totalMs=25000,introMs=10000,paused=false,textRevealMs=3000,quoteRevealMs=4500,showSkip=false):void{
  if(container.dataset.newsId!==news.id){container.dataset.newsId=news.id;container.innerHTML='<div class="news-intro-scene"><video class="news-intro-video" src="/media/breaking-news-intro.webm" poster="/media/breaking-news-poster.png" muted playsinline preload="auto" aria-hidden="true"></video><div class="intro-grid"></div><div class="intro-ribbon intro-ribbon-one">BREAKING NEWS</div><div class="intro-orbit">↯</div><div class="intro-ribbon intro-ribbon-two">RONCALLI STOCK MARKET EXCHANGE</div><button class="intro-count mono news-skip-count" aria-label="Breaking News überspringen" disabled></button></div><div class="news-message"><div class="news-network">RONCALLI BUSINESS NETWORK · LIVE AUS DEM HANDELSSAAL</div><div class="news-label"><span class="news-live-dot"></span> BREAKING NEWS</div><div class="news-direction"></div><div class="news-drink">BETROFFENER KURS · <strong data-testid="breaking-news-drink"></strong></div><h2 class="news-headline"></h2><p class="news-body"></p><div class="news-foot"><button class="news-count mono news-skip-count" aria-label="Breaking News überspringen" disabled></button></div></div><div class="news-glow" aria-hidden="true"></div>';container.querySelector('.news-headline')!.textContent=news.headline.replace(/[.]+\s*$/,'');container.querySelector('.news-body')!.textContent=news.body.replace(/[.]+\s*$/,'');container.querySelector('.news-direction')!.textContent=news.direction==='down'?'↓ MARKTALARM · VERKAUFSPANIK IM ORDERBUCH':'↑ MARKTALARM · KAUFPANIK IM ORDERBUCH';container.dataset.direction=news.direction;}
  const video=container.querySelector<HTMLVideoElement>('.news-intro-video')!;if(!video.onloadeddata){container.dataset.videoReady='false';delete container.dataset.videoFailed;video.onloadeddata=()=>{container.dataset.videoReady='true';};video.onerror=()=>{container.dataset.videoFailed='true';};}
  const stage=newsStage(totalMs,introMs,remainingMs),elapsed=Math.max(0,totalMs-remainingMs),progress=introMs===0?1:Math.min(1,elapsed/introMs),ease=1-(1-progress)**3;
  container.dataset.stage=stage;
  syncNewsIntroVideo(container,elapsed,introMs,stage==='intro'&&!document.hidden,paused);
  container.querySelector<HTMLElement>('.news-intro-scene')!.hidden=stage!=='intro';
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const handoff=stage==='message'?1:reduce||introMs===0?0:Math.max(0,Math.min(1,(elapsed-Math.max(0,introMs-700))/Math.min(700,introMs))),smooth=handoff*handoff*(3-2*handoff);
  container.dataset.handoff=String(stage==='intro'&&handoff>0);
  const behindVideo=stage==='intro'&&container.dataset.videoReady==='true'&&container.dataset.videoFailed!=='true'&&!reduce;
  const introMessageControl=stage==='intro'&&progress>=.9;
  const message=container.querySelector<HTMLElement>('.news-message')!;message.dataset.layout=(stage==='intro'?'intro':news.quote?'message-quote':'message')+(showSkip?'-skip':'-guest');message.classList.toggle('has-quote',Boolean(news.quote));message.querySelector<HTMLElement>('.news-foot')!.hidden=!showSkip;
  for(const selector of ['.news-direction','.news-headline','.news-body'])message.querySelector<HTMLElement>(selector)!.hidden=stage!=='message';message.querySelector<HTMLElement>('.news-drink')!.hidden=stage!=='message'||Boolean(news.quote);
  container.querySelector('[data-testid="breaking-news-drink"]')!.textContent=drinkName;container.querySelector('.news-count')!.textContent='Breaking News überspringen';
  const timing=newsRevealDurations(totalMs-introMs,textRevealMs,news.quote?quoteRevealMs:0),messageElapsed=elapsed-introMs;
  renderNewsWords([message.querySelector<HTMLElement>('.news-headline')!,message.querySelector<HTMLElement>('.news-body')!],messageElapsed,timing.text,stage==='message',reduce);
  renderNewsAnnouncement(message,news.quote,drinkName,messageElapsed-timing.text,stage==='message',reduce,timing.quote);
  message.hidden=stage!=='message'&&!behindVideo&&!introMessageControl&&!(stage==='intro'&&handoff>0);message.style.opacity=String(behindVideo||introMessageControl?1:smooth);message.style.zoom=String(fitNewsMessage(container,message));message.style.transform=reduce||behindVideo||introMessageControl?'none':`translateY(${22*(1-smooth)}px) scale(${.97+.03*smooth})`;
  const introControl=stage==='intro'&&progress<.9;
  message.style.zIndex=introMessageControl&&!behindVideo?'3':'1';
  message.setAttribute('aria-hidden',String(stage==='intro'&&progress<.9));container.querySelector<HTMLElement>('.news-count')!.style.visibility=introControl?'hidden':'visible';container.querySelector<HTMLElement>('.intro-count')!.hidden=!showSkip||!introControl;
  container.querySelector<HTMLElement>('.news-intro-scene')!.style.opacity=String(1-smooth);
  container.querySelector<HTMLElement>('.intro-ribbon-one')!.style.transform=reduce?'none':`translateX(${-125*(1-ease)-150*smooth}%) rotate(${-5-5*smooth}deg)`;
  container.querySelector<HTMLElement>('.intro-ribbon-two')!.style.transform=reduce?'none':`translateX(${125*(1-ease)+150*smooth}%) rotate(${-5+5*smooth}deg)`;
  container.querySelector<HTMLElement>('.intro-orbit')!.style.transform=reduce?'none':`scale(${.65+.35*ease}) rotate(${360*progress}deg)`;
  container.querySelector('.intro-count')!.textContent='Überspringen';
  let sweep=container.querySelector<HTMLElement>('.news-sweep');if(!sweep){sweep=document.createElement('div');sweep.className='news-sweep';sweep.setAttribute('aria-hidden','true');container.append(sweep);}sweep.style.opacity=reduce?'0':String(Math.sin(handoff*Math.PI)*.5);sweep.style.transform=`translateX(${-125+250*handoff}%) skew(-15deg)`;
}
