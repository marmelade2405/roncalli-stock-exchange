const words=new WeakMap<HTMLElement,HTMLSpanElement[]>();
export function newsRevealDurations(messageMs:number,textMs:number,quoteMs:number):{text:number;quote:number}{
  // Preserve a reading window even when an operator configures a short message.
  const scale=Math.min(1,Math.max(1,messageMs)/(textMs+quoteMs+1000));
  return{text:textMs*scale,quote:quoteMs*scale};
}
export function renderNewsWords(elements:HTMLElement[],elapsedMs:number,durationMs:number,active:boolean,reducedMotion:boolean):void{
  const all=elements.flatMap(element=>{
    let spans=words.get(element);
    if(!spans){
      spans=(element.textContent?.match(/\S+\s*/g)??[]).map(token=>{const span=document.createElement('span');span.className='news-word';span.textContent=token;return span;});
      element.replaceChildren(...spans);words.set(element,spans);
    }
    return spans;
  });
  const step=durationMs/Math.max(1,all.length);
  all.forEach((span,index)=>{
    const visible=active&&(durationMs===0||elapsedMs>=index*step),fade=step===0?1:Math.max(0,Math.min(1,(elapsedMs-index*step)/step));
    span.style.visibility=visible?'visible':'hidden';span.style.opacity=reducedMotion?'1':String(fade);span.setAttribute('aria-hidden',String(!visible));
  });
}
