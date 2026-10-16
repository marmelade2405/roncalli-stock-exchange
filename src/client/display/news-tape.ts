import type {DisplayState} from '../shared/protocol.js';
const cache=new WeakMap<HTMLElement,string>();
export function clearNewsTape(container:HTMLElement):void{cache.delete(container);container.replaceChildren();}
export function renderNewsTape(container:HTMLElement,news:NonNullable<DisplayState['recentNews']>,drinkName:string,realNow:number):void{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const key=`${news.id}:${news.publishedAt}:${drinkName}:${reduce}`;
  if(cache.get(container)!==key){cache.set(container,key);container.innerHTML='<div class="tape-label">BREAKING<br>NEWS</div><div class="tape-viewport"><div class="tape-track"></div></div>';container.dataset.direction=news.direction;const track=container.querySelector('.tape-track')!;for(let i=0;i<3;i++){const text=document.createElement('span');text.className='tape-copy';text.textContent=`${drinkName.toUpperCase()} ${news.direction==='up'?'↑':'↓'} · ${news.headline} — ${news.body}     +++     `;if(i>0)text.setAttribute('aria-hidden','true');track.append(text);}}
  const track=container.querySelector<HTMLElement>('.tape-track')!,width=container.querySelector<HTMLElement>('.tape-copy')!.offsetWidth;
  container.classList.toggle('tape-static',reduce);
  if(reduce){container.querySelector<HTMLElement>('.tape-copy')!.textContent=`${drinkName} · ${news.headline}`;track.style.transform='none';}
  else track.style.transform=`translateX(-${width?(realNow/1000*85)%width:0}px)`;
}
