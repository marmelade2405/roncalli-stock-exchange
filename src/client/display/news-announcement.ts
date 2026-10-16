import type {DisplayState} from '../shared/protocol.js';
import {formatChange,formatEuro} from '../shared/format.js';

type Quote=NonNullable<DisplayState['news']>['quote'];
const clamp=(value:number)=>Math.max(0,Math.min(1,value));

/** Each frame derives from market time, so pause, reload and another screen agree. */
export function renderNewsAnnouncement(scene:HTMLElement,quote:Quote,drinkName:string,elapsedMs:number,message:boolean,reducedMotion:boolean,durationMs=4500):void{
  let panel=scene.querySelector<HTMLElement>('.news-announcement');
  if(!panel){
    panel=document.createElement('div');panel.className='news-announcement';panel.dataset.testid='news-announcement';
    panel.innerHTML='<div class="news-announcement-drink" data-testid="news-announcement-drink"></div><div class="news-announcement-change" data-testid="news-announcement-change"><span class="news-announcement-label">VERÄNDERUNG</span><strong><span class="news-announcement-arrow" aria-hidden="true"></span><span class="news-announcement-euro"></span></strong><span class="news-announcement-percent"></span></div><div class="news-announcement-price" data-testid="news-announcement-price"><span class="news-announcement-label">NEUER KURS · BEI FREIGABE</span><strong></strong></div>';
    scene.insertBefore(panel,scene.querySelector('.news-foot'));
  }
  const step=durationMs/3,visible=Boolean(quote)&&message&&elapsedMs>=0;
  panel.hidden=!quote||!message;panel.style.visibility=visible?'visible':'hidden';panel.setAttribute('aria-hidden',String(!visible));
  if(!quote)return;

  const change=formatChange(quote.priceCents,quote.priceCents-quote.deltaCents);
  panel.dataset.direction=change.direction;
  panel.style.opacity='1';
  panel.querySelector('.news-announcement-drink')!.textContent=drinkName;
  panel.querySelector('.news-announcement-arrow')!.textContent=change.direction==='up'?'↑':change.direction==='down'?'↓':'↔';
  panel.querySelector('.news-announcement-euro')!.textContent=change.euro;
  panel.querySelector('.news-announcement-percent')!.textContent=quote.percent===null?'—':change.percent;
  panel.querySelector('.news-announcement-price strong')!.textContent=formatEuro(quote.priceCents);

  for(const [selector,index,offset] of [['.news-announcement-drink',0,-110],['.news-announcement-change',1,90],['.news-announcement-price',2,130]] as const){
    const element=panel.querySelector<HTMLElement>(selector)!,fraction=step===0?1:clamp((elapsedMs-index*step)/step),ease=1-(1-fraction)**3;
    element.hidden=false;element.style.visibility=message&&elapsedMs>=index*step?'visible':'hidden';
    element.style.opacity=reducedMotion?'1':String(ease);
    element.style.transform=reducedMotion?'none':`translateX(${offset*(1-ease)}px) scale(${.94+.06*ease})`;
  }
}
