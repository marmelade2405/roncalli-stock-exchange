import type { RoundKind } from '../shared/protocol.js';
export function renderTransition(container: HTMLElement, kind: RoundKind, remainingMs: number, durationMs=10_000,crashPercent?:number): void {
  if (container.dataset.kind !== kind) {
    container.dataset.kind = kind;
    const path = kind === 'crash' ? 'M0 40 L110 70 L180 45 L275 115 L340 100 L435 180 L510 150 L625 210 L800 230' : kind === 'recovery' ? 'M0 225 L110 190 L185 205 L275 140 L345 155 L435 90 L510 115 L625 45 L800 15' : 'M0 170 L110 100 L185 125 L275 40 L345 95 L435 70 L510 130 L625 65 L800 90';
    container.innerHTML = `<div class="transition-orbit"></div><div class="eyebrow transition-tag"></div><h2 class="transition-title"></h2><p class="transition-detail"></p><svg class="market-illustration" viewBox="0 0 800 250" aria-hidden="true"><path class="illustration-grid" d="M0 50H800 M0 100H800 M0 150H800 M0 200H800 M100 0V250 M200 0V250 M300 0V250 M400 0V250 M500 0V250 M600 0V250 M700 0V250"/><path class="market-line" pathLength="1000" d="${path}"/></svg><button class="transition-count mono" aria-label="Preiswechsel überspringen" disabled></button><div class="eyebrow muted">SEKUNDEN BIS ZU DEN NEUEN KURSEN</div><div class="transition-skip-hint" hidden>Simulation · Countdown anklicken zum Überspringen</div><div class="transition-progress"><div></div></div>`;
    container.querySelector('.transition-tag')!.textContent = kind === 'crash' ? 'EVENT / MARKTUNTERBRECHUNG' : kind === 'recovery' ? 'ERHOLUNG / NEUSTART' : 'PREISRUNDE / KURSWECHSEL';
    container.querySelector('.transition-title')!.textContent = kind === 'crash' ? 'Börsencrash' : kind === 'recovery' ? 'Der Markt erholt sich' : 'Neue Kurse · neue Chancen';
    if(kind==='crash'){
      const scene=document.createElement('div');scene.className='crash-scene';scene.setAttribute('aria-hidden','true');scene.innerHTML='<div class="crash-alarm"></div><div class="crash-alert-bar">MARKTSCHOCK · VERKAUFSWELLE · MARKTSCHOCK</div><div class="crash-fallout"></div>';
      for(let i=0;i<12;i++){const arrow=document.createElement('span');arrow.className='crash-arrow';arrow.textContent=i%3?'↓':'↘';arrow.style.left=`${5+i*8}%`;scene.querySelector('.crash-fallout')!.append(arrow);}container.prepend(scene);
    }
  }
  container.querySelector('.transition-detail')!.textContent=crashPercent!==undefined&&(kind==='crash'||kind==='recovery')?`${kind==='crash'?'Marktimpuls −':'Erholung +'}${crashPercent.toLocaleString('de-DE')} % · ${kind==='crash'?'Zufallsschwankungen, ':''}Rundung, Preisgrenzen und manuelle Kurse können abweichen`:'Ein neuer Preisstand wird veröffentlicht';
  const remaining = Math.max(0, Math.min(durationMs, remainingMs));
  container.querySelector('.transition-count')!.textContent = String(Math.ceil(remaining / 1000)).padStart(2, '0');
  (container.querySelector('.market-line') as SVGElement).style.strokeDashoffset = String(1000 * remaining / durationMs);
  container.querySelector<HTMLElement>('.transition-progress div')!.style.width = `${(1 - remaining / durationMs) * 100}%`;
  const progress=1-remaining/durationMs,reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;container.dataset.reducedMotion=String(reduce);
  if(kind==='crash'){
    const alarm=container.querySelector<HTMLElement>('.crash-alarm')!;alarm.style.transform=reduce?'none':`scale(${.98+.035*Math.sin(progress*Math.PI)})`;alarm.style.opacity=reduce?'.85':String(.65+.25*Math.sin(progress*Math.PI));
    container.querySelectorAll<HTMLElement>('.crash-arrow').forEach((arrow,i)=>{arrow.style.top=`${reduce?20+i%4*18:(progress*160+i*13)%140-20}%`;arrow.style.transform=reduce?'none':`translateX(${Math.sin(progress*12+i)*16}px) rotate(${i%3?0:12}deg)`;});
    const impact=reduce||progress>.2?0:Math.sin(progress*180)*(1-progress/.2)*4;container.style.setProperty('--crash-impact',`${impact}px`);
  }
}
