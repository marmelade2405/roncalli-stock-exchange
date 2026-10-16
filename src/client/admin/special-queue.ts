import type { AdminState, Snapshot } from '../shared/protocol.js';
import { formatEuro, formatChange } from '../shared/format.js';
import { nextSpecialAt } from '../../domain/special-schedule.js';
export function createSpecialQueue(root: HTMLElement, handlers: { reorder(ids: string[], revision: number): void; trigger(id: string, revision: number): void }) {
  root.innerHTML='<div class="queue-summary"></div><div data-testid="special-queue-pending"></div><details class="completed-news"><summary>Erledigte Nachrichten</summary><div class="queue-done"></div></details>';
  const pending=root.querySelector<HTMLElement>('[data-testid]')!, done=root.querySelector<HTMLElement>('.queue-done')!;
  let signature='', dragged:string|null=null;
  function reset(){signature='';dragged=null;pending.replaceChildren();done.replaceChildren();}
  return {
    reset,
    update(snapshot:Snapshot<AdminState>,connected:boolean){
      const s=snapshot.state,now=snapshot.clock.marketNow;
      const active=s.news?.id??null;
      const locked=!connected||s.phase!=='normal'||s.deadline===null||now+s.parameters.newsMs+s.parameters.transitionMs+1000>s.deadline;
      const nextSignature=JSON.stringify([s.revision,connected,locked]);
      if(signature===nextSignature)return;signature=nextSignature;pending.replaceChildren();done.replaceChildren();
      root.querySelector('.queue-summary')!.textContent=`${s.schedule.pending.length} geplant · ${s.schedule.done.length} erledigt · jede Meldung einmal`;
      const ids=s.schedule.pending.map(x=>x.specialId);
      function move(id:string,index:number){const reordered=ids.filter(x=>x!==id);reordered.splice(index,0,id);handlers.reorder(reordered,s.revision);}
      for(const [finished,slots,target]of [[false,s.schedule.pending,pending],[true,s.schedule.done,done]]as const){
        slots.forEach((slot,index)=>{
          const news=s.specials.find(x=>x.id===slot.specialId)!,preview=s.specialPreviews[news.id];
          const running=active===news.id,drink=s.drinks.find(d=>d.id===news.drinkId)!;
          const row=document.createElement('article');row.className=`special-row ${news.direction} ${running?'running':''}`;row.dataset.specialId=news.id;
          const content=document.createElement('div'),title=document.createElement('strong');title.textContent=news.headline;
          const meta=document.createElement('div');meta.className='special-meta';meta.textContent=`${drink.name} · ${news.direction==='up'?'↑':'↓'} ${news.percent>0?'+':''}${news.percent} % Zielwirkung`;
          const body=document.createElement('p');body.textContent=news.body;
          const price=document.createElement('div');price.dataset.testid=`special-${news.id}-preview`;price.className='mono';
          const change=formatChange(preview.price,s.prices[news.drinkId]);price.textContent=finished?'Bereits veröffentlicht':`${formatEuro(preview.price)} · ${change.euro} · ${change.percent}${preview.limited?' · Preisgrenze/Rundung':''}`;
          const time=document.createElement('span');time.dataset.testid=`special-${news.id}-time`;time.className='muted';
          const planned=s.schedule.startedAt===null?null:s.schedule.startedAt+slot.offsetMs;
          const eligible=index===0&&!finished&&s.phase==='normal'?nextSpecialAt(s.schedule,s.parameters,s.deadline,s.publishedAt):planned;
          time.textContent=finished?`Veröffentlicht: +${Math.round(('publishedAt' in slot ? slot.publishedAt as number : 0)-(s.schedule.startedAt??0))/60000} Min.`:planned===null?`+${(slot.offsetMs/60000).toFixed(1).replace('.',',')} Min. nach Start`:`Geplant: +${(slot.offsetMs/60000).toFixed(1).replace('.',',')} Min.${eligible!==planned?' · verschoben':''}`;
          content.append(meta,title,body,price,time);
          const actions=document.createElement('div');actions.className='special-actions';
          const status=document.createElement('span');status.dataset.testid=`special-${news.id}-status`;status.textContent=finished?'Erledigt':running?'Läuft':locked?'Geplant · Direktstart gesperrt':'Geplant';
          actions.append(status);
          if(!finished){
            for(const [offset,label]of [[-1,'↑'],[1,'↓']]as const){const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',`${drink.name}: Nachricht ${offset<0?'nach oben':'nach unten'}`);button.dataset.testid=`special-${news.id}-${offset<0?'up':'down'}`;button.disabled=!connected||running||index+offset<0||index+offset>=ids.length||ids[index+offset]===active;button.onclick=()=>move(news.id,index+offset);actions.append(button);}
            const trigger=document.createElement('button');trigger.textContent='Jetzt auslösen';trigger.dataset.testid=`special-${news.id}-trigger`;trigger.disabled=locked||running;trigger.title=locked?'Markt starten; Direktstarts sind während Crash oder Preiswechsel gesperrt.':'Diese Meldung einmal auslösen';trigger.onclick=()=>handlers.trigger(news.id,s.revision);actions.append(trigger);
            row.draggable=connected&&!running;row.ondragstart=event=>{dragged=news.id;event.dataTransfer?.setData('text/plain',news.id);};row.ondragover=event=>{if(dragged&&!running)event.preventDefault();};row.ondrop=event=>{event.preventDefault();if(dragged&&dragged!==news.id&&!running)move(dragged,index);dragged=null;};row.ondragend=()=>{dragged=null;};
          }
          row.append(content,actions);target.append(row);
        });
      }
    },
  };
}
