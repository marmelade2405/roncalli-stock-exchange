import type { RoundKind } from '../shared/protocol.js';
import {pauseNewsIntroVideo,syncNewsIntroVideo} from './news-intro-video.js';
import {renderNewsWords} from './news-reveal.js';

function renderCrash(container:HTMLElement,remainingMs:number,durationMs:number,crashPercent:number|undefined,paused:boolean):void{
  if(container.dataset.kind!=='crash'){
    pauseNewsIntroVideo(container);container.dataset.kind='crash';delete container.dataset.videoFailed;
    container.innerHTML='<div class="crash-video-fallback" aria-hidden="true"></div><video class="news-intro-video crash-intro-video" src="/media/crash-intro.mp4" poster="/media/crash-poster.png" muted playsinline preload="auto" aria-hidden="true"></video><div class="crash-video-shade" aria-hidden="true"></div><div class="crash-video-heading"><div class="eyebrow transition-tag">EVENT / MARKTUNTERBRECHUNG</div><h2 class="transition-title">Börsencrash</h2><p class="transition-detail"></p></div><div class="crash-video-countdown"><button class="transition-count mono" aria-label="Preiswechsel überspringen" disabled></button><div class="eyebrow">SEKUNDEN BIS ZU DEN NEUEN KURSEN</div><div class="transition-skip-hint" hidden>Simulation · Countdown anklicken zum Überspringen</div><div class="transition-progress"><div></div></div></div>';
    const video=container.querySelector<HTMLVideoElement>('.crash-intro-video')!;
    video.muted=true;video.addEventListener('error',()=>{container.dataset.videoFailed='true';});
  }
  const detail=container.querySelector<HTMLElement>('.transition-detail')!,narrative='VERKAUFSPANIK IM HANDELSSAAL · DAS ORDERBUCH KIPPT · NEUE KURSE IM ANFLUG';if(detail.textContent!==narrative)detail.textContent=narrative;
  const remaining=Math.max(0,Math.min(durationMs,remainingMs));
  let impact=container.querySelector<HTMLElement>('.crash-impact-card');
  if(!impact){impact=document.createElement('div');impact.className='crash-impact-card';impact.innerHTML='<div class="eyebrow">BÖRSENCRASH · MARKTIMPULS</div><strong class="mono" data-testid="crash-impact"></strong>';container.append(impact);}
  impact.querySelector('strong')!.textContent=crashPercent===undefined?'CRASH':`−${crashPercent.toLocaleString('de-DE')} %`;
  container.querySelector('.transition-count')!.textContent=String(Math.ceil(remaining/1000)).padStart(2,'0');
  container.querySelector<HTMLElement>('.transition-progress div')!.style.width=`${(1-remaining/durationMs)*100}%`;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=durationMs-remaining,scale=Math.min(1,durationMs/4800);
  container.dataset.reducedMotion=String(reduce);
  renderNewsWords(['.transition-tag','.transition-title','.transition-detail'].map(selector=>container.querySelector<HTMLElement>(selector)!),elapsed,Math.min(3000,durationMs*.4),true,reduce);
  const impactStart=durationMs-Math.min(5000,durationMs*.4),impactProgress=Math.max(0,Math.min(1,(elapsed-impactStart)/Math.min(1000,durationMs*.1))),impactEase=1-(1-impactProgress)**3;
  impact.style.visibility=elapsed>=impactStart?'visible':'hidden';impact.setAttribute('aria-hidden',String(elapsed<impactStart));impact.style.opacity=String(reduce?1:impactEase);impact.style.transform=reduce?'translate(-50%,-50%)':`translate(-50%,calc(-50% + ${40*(1-impactEase)}px)) scale(${.75+.25*impactEase})`;
  for(const [selector,delay,length,x,y,angle]of [['.transition-tag',0,700,0,-26,0],['.transition-title',750,900,100,0,-2],['.transition-detail',1500,1000,-40,20,0]]as const){
    const caption=container.querySelector<HTMLElement>(selector)!,p=Math.max(0,Math.min(1,(elapsed-delay*scale)/(length*scale))),ease=1-(1-p)**3,back=1+2.70158*(p-1)**3+1.70158*(p-1)**2;
    caption.style.opacity=String(reduce?1:ease);caption.style.transform=reduce||p===1?'none':`translate(${x*(1-back)}px,${y*(1-ease)}px) rotate(${angle*(1-ease)}deg) scale(${.96+.04*back})`;caption.style.filter=reduce||p===1?'none':`blur(${5*(1-ease)}px)`;
  }
  const fadeMs=Math.min(reduce?150:900,durationMs*.2),out=Math.max(0,Math.min(1,(fadeMs-remaining)/fadeMs));container.style.opacity=String(1-out*out*out*(out*(out*6-15)+10));
  syncNewsIntroVideo(container,durationMs-remaining,durationMs,!document.hidden,paused);
}

export function renderTransition(container: HTMLElement, kind: RoundKind, remainingMs: number, durationMs=10_000,crashPercent?:number,paused=false): void {
  if(kind==='crash'){renderCrash(container,remainingMs,durationMs,crashPercent,paused);return;}
  container.style.opacity='1';
  if (container.dataset.kind !== kind) {
    pauseNewsIntroVideo(container);delete container.dataset.videoFailed;
    container.dataset.kind = kind;
    const path = kind === 'recovery' ? 'M0 225 L110 190 L185 205 L275 140 L345 155 L435 90 L510 115 L625 45 L800 15' : 'M0 170 L110 100 L185 125 L275 40 L345 95 L435 70 L510 130 L625 65 L800 90';
    container.innerHTML = `<div class="transition-orbit"></div><div class="eyebrow transition-tag"></div><h2 class="transition-title"></h2><p class="transition-detail"></p><svg class="market-illustration" viewBox="0 0 800 250" aria-hidden="true"><path class="illustration-grid" d="M0 50H800 M0 100H800 M0 150H800 M0 200H800 M100 0V250 M200 0V250 M300 0V250 M400 0V250 M500 0V250 M600 0V250 M700 0V250"/><path class="market-line" pathLength="1000" d="${path}"/></svg><button class="transition-count mono" aria-label="Preiswechsel überspringen" disabled></button><div class="eyebrow muted">SEKUNDEN BIS ZU DEN NEUEN KURSEN</div><div class="transition-skip-hint" hidden>Simulation · Countdown anklicken zum Überspringen</div><div class="transition-progress"><div></div></div>`;
    container.querySelector('.transition-tag')!.textContent = kind === 'recovery' ? 'ERHOLUNG / NEUSTART' : 'PREISRUNDE / KURSWECHSEL';
    container.querySelector('.transition-title')!.textContent = kind === 'recovery' ? 'Der Markt erholt sich' : 'Neue Kurse · neue Chancen';
  }
  container.querySelector('.transition-detail')!.textContent=kind==='recovery'?'DAS ORDERBUCH ÖFFNET WIEDER · DER HANDEL NIMMT FAHRT AUF':'Ein neuer Preisstand wird veröffentlicht';
  const remaining = Math.max(0, Math.min(durationMs, remainingMs));
  container.querySelector('.transition-count')!.textContent = String(Math.ceil(remaining / 1000)).padStart(2, '0');
  (container.querySelector('.market-line') as SVGElement).style.strokeDashoffset = String(1000 * remaining / durationMs);
  container.querySelector<HTMLElement>('.transition-progress div')!.style.width = `${(1 - remaining / durationMs) * 100}%`;
  container.dataset.reducedMotion=String(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
