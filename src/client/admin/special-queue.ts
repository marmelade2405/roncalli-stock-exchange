import type { AdminState, Snapshot } from '../shared/protocol.js';
import { formatEuro, formatChange } from '../shared/format.js';

export function createSpecialQueue(root: HTMLElement, handlers: {trigger(id: string, revision: number): void }) {
  root.innerHTML='<div class="queue-summary"></div><div class="queue-cadence" data-testid="special-cadence"></div><div data-testid="special-queue-pending"></div><details class="completed-news"><summary>Erledigte Nachrichten</summary><div class="queue-done"></div></details>';
  const pending=root.querySelector<HTMLElement>('[data-testid="special-queue-pending"]')!, done=root.querySelector<HTMLElement>('.queue-done')!;
  let signature='';
  function reset(){signature='';pending.replaceChildren();done.replaceChildren();}
  return {
    reset,
    update(snapshot:Snapshot<AdminState>,connected:boolean){
      const s=snapshot.state,now=snapshot.clock.marketNow;
      const active=s.news?.id??null;
      const locked=!connected||s.phase!=='normal'||s.deadline===null||now+s.parameters.newsMs+s.parameters.transitionMs+1000>s.deadline;
      const nextSignature=JSON.stringify([s.revision,connected,locked]);
      if(signature===nextSignature)return;signature=nextSignature;pending.replaceChildren();done.replaceChildren();
      root.querySelector('.queue-summary')!.textContent=`${s.schedule.pending.length} offen · ${s.schedule.done.length} erledigt · jede Meldung einmal`;
      root.querySelector('.queue-cadence')!.textContent=`Nur manuell · Keine automatischen Meldungen · ${s.specials.length} Specials`;
      for(const [finished,slots,target]of [[false,s.schedule.pending,pending],[true,s.schedule.done,done]]as const){
        slots.forEach(slot=>{
          const news=s.specials.find(x=>x.id===slot.specialId)!,preview=s.specialPreviews[news.id];
          const running=active===news.id,drink=s.drinks.find(d=>d.id===news.drinkId)!;
          const row=document.createElement('article');row.className=`special-row ${news.direction} ${running?'running':''}`;row.dataset.specialId=news.id;
          const content=document.createElement('div'),title=document.createElement('strong');title.textContent=news.headline;
          const meta=document.createElement('div');meta.className='special-meta';meta.textContent=news.targetCents!==undefined?`${drink.name} · Festpreis ${formatEuro(news.targetCents)}`:`${drink.name} · ${news.direction==='up'?'↑ Oberste':'↓ Unterste'} 10 % der Preisspanne`;
          const body=document.createElement('p');body.textContent=news.body;
          const price=document.createElement('div');price.dataset.testid=`special-${news.id}-preview`;price.className='mono';
          const change=formatChange(preview.price,s.prices[news.drinkId]);price.textContent=finished?'Bereits veröffentlicht':`${formatEuro(preview.price)} · ${change.euro} · ${change.percent}${preview.limited?' · Extrembereich/Preisgrenze':''}`;
          const time=document.createElement('span');time.dataset.testid=`special-${news.id}-time`;time.className='muted';
          time.textContent=finished?`Veröffentlicht: +${Math.round((('publishedAt' in slot ? slot.publishedAt as number : 0)-(s.schedule.startedAt??0))/60000)} Min.`:'Manuell auslösen · kein automatischer Start';
          content.append(meta,title,body,price,time);
          const actions=document.createElement('div');actions.className='special-actions';
          const status=document.createElement('span');status.dataset.testid=`special-${news.id}-status`;status.textContent=finished?'Erledigt':running?'Läuft':locked?'Offen · Direktstart gesperrt':'Offen';
          actions.append(status);
          if(!finished){
            const trigger=document.createElement('button');trigger.textContent='Jetzt auslösen';trigger.dataset.testid=`special-${news.id}-trigger`;trigger.disabled=locked||running;trigger.title=locked?'Markt starten; Direktstarts sind während Crash oder Preiswechsel gesperrt.':'Diese Meldung einmal auslösen';trigger.onclick=()=>handlers.trigger(news.id,s.revision);actions.append(trigger);
          }
          row.append(content,actions);target.append(row);
        });
      }
    },
  };
}
