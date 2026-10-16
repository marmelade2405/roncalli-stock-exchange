import type {DisplayState} from '../shared/protocol.js';
export function applyQuoteReveal(root:HTMLElement,state:DisplayState,wallNow:number):void{
  const publication=state.publication,reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const round=state.roundPublication??(publication&&['normal','crash','recovery'].includes(publication.kind)?publication:undefined);
  root.querySelectorAll<HTMLElement>('[data-quote-drink]').forEach(card=>{
    const id=card.dataset.quoteDrink!,index=state.drinks.findIndex(d=>d.id===id),override=state.quotePublicationOverrides?.[id]??(publication&&['special','correction'].includes(publication.kind)&&publication.changedDrinkIds.includes(id)?publication:undefined);
    const direct=override&&(!round||override.revision>round.revision),age=direct?wallNow-override!.wallAt:round?wallNow-round.wallAt-index*(state.parameters.priceRevealMs??500):Infinity,waiting=age<0;
    card.classList.toggle('quote-awaiting',waiting);card.setAttribute('aria-busy',String(waiting));
    const progress=Math.max(0,Math.min(1,age/700)),ease=1-(1-progress)**3;
    card.style.setProperty('--quote-enter-opacity',String(reduce?1:ease));card.style.setProperty('--quote-enter-y',`${reduce?0:18*(1-ease)}px`);card.style.setProperty('--quote-enter-scale',String(reduce?1:1+.12*Math.sin(progress*Math.PI)));card.style.setProperty('--quote-enter-glow',`${reduce?0:12*(1-progress)}px`);
  });
}
