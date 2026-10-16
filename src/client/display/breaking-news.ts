import type {DisplayState} from '../shared/protocol.js';
export function newsStage(totalMs:number,introMs:number,remainingMs:number):'intro'|'message'|'finished'{return remainingMs<=0?'finished':remainingMs>totalMs-introMs?'intro':'message';}
export function renderBreakingNews(container:HTMLElement,news:NonNullable<DisplayState['news']>,remainingMs:number,drinkName=news.drinkId,totalMs=20000,introMs=5000):void{
  if(container.dataset.newsId!==news.id){container.dataset.newsId=news.id;container.innerHTML='<div class="news-intro-scene"><div class="intro-grid"></div><div class="intro-ribbon intro-ribbon-one">BREAKING NEWS</div><div class="intro-orbit">↯</div><div class="intro-ribbon intro-ribbon-two">RONCALLI STOCK MARKET EXCHANGE</div><div class="intro-count mono"></div></div><div class="news-message"><div class="news-label"><span class="news-live-dot"></span> BREAKING NEWS</div><div class="news-direction"></div><div class="news-drink">BETROFFENER KURS · <strong data-testid="breaking-news-drink"></strong></div><h2 class="news-headline"></h2><p class="news-body"></p><div class="news-foot"><span class="news-count mono"></span></div></div><div class="news-glow" aria-hidden="true"></div>';container.querySelector('.news-headline')!.textContent=news.headline.replace(/[.]+\s*$/,'');container.querySelector('.news-body')!.textContent=news.body.replace(/[.]+\s*$/,'');container.querySelector('.news-direction')!.textContent=news.direction==='down'?'↓ VERKAUFSWELLE AM GETRÄNKEMARKT':'↑ KAUFRAUSCH AM GETRÄNKEMARKT';container.dataset.direction=news.direction;}
  const stage=newsStage(totalMs,introMs,remainingMs),elapsed=Math.max(0,totalMs-remainingMs),progress=introMs===0?1:Math.min(1,elapsed/introMs),ease=1-(1-progress)**3;
  container.dataset.stage=stage;
  container.querySelector<HTMLElement>('.news-intro-scene')!.hidden=stage!=='intro';
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const handoff=stage==='message'?1:reduce||introMs===0?0:Math.max(0,Math.min(1,(elapsed-Math.max(0,introMs-700))/Math.min(700,introMs))),smooth=handoff*handoff*(3-2*handoff);
  container.dataset.handoff=String(stage==='intro'&&handoff>0);
  const message=container.querySelector<HTMLElement>('.news-message')!;message.hidden=stage!=='message'&&!(stage==='intro'&&handoff>0);message.style.opacity=String(smooth);const fit=message.hidden?1:Math.min(1,Math.max(.1,(container.clientHeight-48)/Math.max(1,message.scrollHeight)));message.style.zoom=String(fit);message.style.transform=reduce?'none':`translateY(${22*(1-smooth)}px) scale(${.97+.03*smooth})`;
  container.querySelector<HTMLElement>('.news-intro-scene')!.style.opacity=String(1-smooth);
  container.querySelector<HTMLElement>('.intro-ribbon-one')!.style.transform=reduce?'none':`translateX(${-125*(1-ease)-150*smooth}%) rotate(${-5-5*smooth}deg)`;
  container.querySelector<HTMLElement>('.intro-ribbon-two')!.style.transform=reduce?'none':`translateX(${125*(1-ease)+150*smooth}%) rotate(${-5+5*smooth}deg)`;
  container.querySelector<HTMLElement>('.intro-orbit')!.style.transform=reduce?'none':`scale(${.65+.35*ease}) rotate(${360*progress}deg)`;
  container.querySelector('.intro-count')!.textContent=`MARKTMELDUNG IN ${Math.max(0,Math.ceil((introMs-elapsed)/1000))} S`;
  let sweep=container.querySelector<HTMLElement>('.news-sweep');if(!sweep){sweep=document.createElement('div');sweep.className='news-sweep';sweep.setAttribute('aria-hidden','true');container.append(sweep);}sweep.style.opacity=reduce?'0':String(Math.sin(handoff*Math.PI)*.5);sweep.style.transform=`translateX(${-125+250*handoff}%) skew(-15deg)`;
  container.querySelector('[data-testid="breaking-news-drink"]')!.textContent=drinkName;
  container.querySelector('.news-count')!.textContent=`KURSVERÖFFENTLICHUNG IN ${Math.max(0,Math.ceil(remainingMs/1000))} S`;
}
