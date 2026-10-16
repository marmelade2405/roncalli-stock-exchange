import type { AdminState, Snapshot } from '../shared/protocol.js';
import { formatEuro, formatChange } from '../shared/format.js';

export function createSpecialQueue(root: HTMLElement, handlers: {trigger(id: string, revision: number): void }) {
  root.innerHTML='<div class="queue-summary"></div><div class="queue-cadence" data-testid="special-cadence"></div><div data-testid="special-queue-pending"></div>';
  const list=root.querySelector<HTMLElement>('[data-testid="special-queue-pending"]')!;
  let signature='';
  function reset(){signature='';list.replaceChildren();}
  return {
    reset,
    update(snapshot:Snapshot<AdminState>,connected:boolean){
      const s=snapshot.state,now=snapshot.clock.marketNow;
      const active=s.news?.id??null;
      const locked=!connected||s.phase!=='normal'||s.deadline===null||now+s.parameters.newsMs+s.parameters.transitionMs+1000>s.deadline;
      const nextSignature=JSON.stringify([s.revision,connected,locked]);
      if(signature===nextSignature)return;signature=nextSignature;list.replaceChildren();
      root.querySelector('.queue-summary')!.textContent=`${s.specials.length} Meldungen · ${s.schedule.done.length} bereits verwendet · beliebig wiederholbar`;
      root.querySelector('.queue-cadence')!.textContent=`Nur manuell · Keine automatischen Meldungen · ${s.specials.length} Specials`;
      for(const id of s.specialOrder){
          const news=s.specials.find(x=>x.id===id)!,preview=s.specialPreviews[news.id];
          const finished=s.schedule.done.find(slot=>slot.specialId===id);
          const running=active===news.id,noMovement=preview.delta===0&&!running,drink=s.drinks.find(d=>d.id===news.drinkId)!;
          const row=document.createElement('article');row.className=`special-row ${news.direction} ${running?'running':''}`;row.dataset.specialId=news.id;
          const content=document.createElement('div'),title=document.createElement('strong');title.textContent=news.headline;
          const meta=document.createElement('div');meta.className='special-meta';meta.textContent=news.targetCents!==undefined?`${drink.name} · Richtpreis ${formatEuro(news.targetCents)} · bei Bedarf extremer`:`${drink.name} · ${news.direction==='up'?'↑ Oberste':'↓ Unterste'} 10 % der Preisspanne`;
          const body=document.createElement('p');body.textContent=news.body;
          const price=document.createElement('div');price.dataset.testid=`special-${news.id}-preview`;price.className='mono';
          const change=formatChange(preview.price,s.prices[news.drinkId]);price.textContent=noMovement?`${formatEuro(preview.price)} · ${news.direction==='up'?'Maximum':'Minimum'} erreicht`:`${formatEuro(preview.price)} · ${change.euro} · ${change.percent}${preview.limited?' · Weiter zugespitzt':''}`;
          const time=document.createElement('span');time.dataset.testid=`special-${news.id}-time`;time.className='muted';
          time.textContent=finished?`Zuletzt veröffentlicht: +${Math.round((finished.publishedAt-(s.schedule.startedAt??0))/60000)} Min. · erneut auslösbar`:'Manuell auslösen · kein automatischer Start';
          content.append(meta,title,body,price,time);
          const actions=document.createElement('div');actions.className='special-actions';
          const status=document.createElement('span');status.dataset.testid=`special-${news.id}-status`;status.textContent=running?'Läuft':noMovement?`${news.direction==='up'?'Maximum':'Minimum'} erreicht`:locked?'Direktstart gesperrt':finished?'Bereits gespielt':'Offen';
          const trigger=document.createElement('button');trigger.textContent=finished?'Erneut auslösen':'Jetzt auslösen';trigger.dataset.testid=`special-${news.id}-trigger`;trigger.disabled=locked||running||noMovement;trigger.title=noMovement?'Keine weitere Änderung innerhalb der Preisgrenzen möglich.':locked?'Markt starten; Direktstarts sind während Crash oder Preiswechsel gesperrt.':'Diese Meldung auslösen – beliebig wiederholbar';trigger.onclick=()=>handlers.trigger(news.id,s.revision);
          actions.append(status,trigger);row.append(content,actions);list.append(row);
      }
    },
  };
}
