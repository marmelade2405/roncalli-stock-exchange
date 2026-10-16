import type { RoundKind } from '../shared/protocol.js';
export function renderTransition(container: HTMLElement, kind: RoundKind, remainingMs: number): void {
  if (container.dataset.kind !== kind) {
    container.dataset.kind = kind;
    const path = kind === 'crash' ? 'M0 40 L110 70 L180 45 L275 115 L340 100 L435 180 L510 150 L625 210 L800 230' : kind === 'recovery' ? 'M0 225 L110 190 L185 205 L275 140 L345 155 L435 90 L510 115 L625 45 L800 15' : 'M0 170 L110 100 L185 125 L275 40 L345 95 L435 70 L510 130 L625 65 L800 90';
    container.innerHTML = `<div class="transition-orbit"></div><div class="eyebrow transition-tag"></div><h2 class="transition-title"></h2><p>Ein neuer Preisstand wird veröffentlicht.</p><svg class="market-illustration" viewBox="0 0 800 250" aria-hidden="true"><path class="illustration-grid" d="M0 50H800 M0 100H800 M0 150H800 M0 200H800 M100 0V250 M200 0V250 M300 0V250 M400 0V250 M500 0V250 M600 0V250 M700 0V250"/><path class="market-line" pathLength="1000" d="${path}"/></svg><div class="transition-count mono"></div><div class="eyebrow muted">SEKUNDEN BIS ZU DEN NEUEN KURSEN</div><div class="transition-progress"><div></div></div>`;
    container.querySelector('.transition-tag')!.textContent = kind === 'crash' ? 'EVENT / MARKTUNTERBRECHUNG' : kind === 'recovery' ? 'ERHOLUNG / NEUSTART' : 'PREISRUNDE / KURSWECHSEL';
    container.querySelector('.transition-title')!.textContent = kind === 'crash' ? 'Börsencrash.' : kind === 'recovery' ? 'Der Markt erholt sich.' : 'Neue Kurse. Neue Chancen.';
  }
  const remaining = Math.max(0, Math.min(10_000, remainingMs));
  container.querySelector('.transition-count')!.textContent = String(Math.ceil(remaining / 1000)).padStart(2, '0');
  (container.querySelector('.market-line') as SVGElement).style.strokeDashoffset = String(1000 * remaining / 10_000);
  container.querySelector<HTMLElement>('.transition-progress div')!.style.width = `${(1 - remaining / 10_000) * 100}%`;
}
