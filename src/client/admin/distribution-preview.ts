import type {DrinkConfig} from '../shared/protocol.js';
import {formatEuro} from '../shared/format.js';
import {simulatePriceDistribution,type PriceDistribution} from '../../domain/price-distribution.js';
import {normalPriceProfile} from '../../domain/prices.js';
const namespace='http://www.w3.org/2000/svg';
function node<K extends keyof SVGElementTagNameMap>(tag:K,attributes:Record<string,string|number>,text?:string){const element=document.createElementNS(namespace,tag);for(const[key,value]of Object.entries(attributes))element.setAttribute(key,String(value));if(text!==undefined)element.textContent=text;return element;}
const percent=(value:number)=>`${(value*100).toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:2})} %`;
const euro=(cents:number)=>formatEuro(Math.round(cents));
type DistributionEditor={values:(id:string)=>{fields:Record<string,string>;fixed:boolean};change:(id:string,key:string,raw:string)=>void};
const controls=[['averageCents','Average €'],['reversionPercent','Rückführung %'],['amplitudeCents','Schwankung €'],['minCents','Min €'],['maxCents','Max €'],['stepCents','Schritt €'],['startCents','Start €']]as const;
export function createDistributionPreview(root:HTMLElement,editor:DistributionEditor){
  root.innerHTML=`<div class="distribution-heading"><div><h3>Preisverteilung · normale Runden</h3><p class="muted">Vorschau deiner Parameter – ohne Crashs, Breaking News oder manuelle Preise.</p></div><label>Getränk für Verteilung<select aria-label="Getränk für Verteilung"></select></label></div><p class="distribution-parameters mono"></p><p data-testid="distribution-source" class="muted"></p><p data-testid="distribution-error" class="error-text" role="alert"></p><svg data-testid="distribution-chart" class="distribution-chart" role="img" tabindex="0" aria-label="Preisverteilung. Anklicken oder mit Pfeiltasten einzelne Preise auswählen."></svg><div class="distribution-legend"><span class="distribution-average"></span><span>Mittelwert der Vorschau: <strong data-testid="distribution-mean" class="mono"></strong></span></div><p class="distribution-detail mono" aria-live="polite"></p><p class="distribution-method muted"></p>`;
  const controlRoot=document.createElement('div');controlRoot.className='distribution-controls';root.querySelector('.distribution-parameters')!.before(controlRoot);const inputs=new Map<string,HTMLInputElement>();
  const shape=document.createElement('p');shape.className='distribution-shape';shape.dataset.testid='distribution-shape';root.querySelector('.distribution-parameters')!.after(shape);
  const equation=document.createElement('div');equation.className='distribution-equation';equation.dataset.testid='distribution-equation';equation.innerHTML='<strong>So entsteht der nächste Kurs</strong><code>μ = P + r × (A − P)</code><code>Pneu = Preisstufen-Rundung(μ + Δ)</code><p>P = aktueller Preis · A = Average · r = Rückführung / 100 · Δ = ausgeloste Bewegung</p><details><summary>Ausschläge und Spitzen im Detail</summary><code>R = Max − Min</code><code>w− = min(μ − Min, 2s × (A − Min) / R)</code><code>w+ = min(Max − μ, 2s × (Max − A) / R)</code><p>s = Schwankungsbasis. Die gewöhnliche Richtung fällt mit Wahrscheinlichkeit w+ / (w− + w+); sie steigt mit w− / (w− + w+). Die Größe wird gleichverteilt zwischen 0 und der jeweiligen Breite ausgelost.</p><code>q = 0,25 × min(1, s / max(Preisschritt, min(A − Min, Max − A)))</code><code>pMin = q × (Max − μ) / R · pMax = q × (μ − Min) / R</code><p>Mit Wahrscheinlichkeit q gilt direkt Min oder Max. Sonst gilt die gewöhnliche Bewegung. Beim Runden auf benachbarte Preisstufen bleibt der erwartete Preis erhalten. Wasser bleibt fest; ohne Rückführung oder gespeicherten Average gelten die angezeigten Sonderfälle.</p></details>';root.querySelector('.distribution-method')!.after(equation);
  for(const[key,label]of controls){const wrapper=document.createElement('label'),input=document.createElement('input');wrapper.textContent=label;input.inputMode='decimal';input.setAttribute('aria-label',`${label} in Verteilung`);input.oninput=()=>editor.change(select.value,key,input.value);wrapper.append(input);controlRoot.append(wrapper);inputs.set(key,input);}
  const select=root.querySelector('select')!,chart=root.querySelector('svg')!,error=root.querySelector<HTMLElement>('[data-testid="distribution-error"]')!,mean=root.querySelector<HTMLElement>('[data-testid="distribution-mean"]')!,detail=root.querySelector<HTMLElement>('.distribution-detail')!;
  let options:{id:string;name:string}[]=[],read:((id:string)=>DrinkConfig)|null=null,draft=false,signature='',distribution:PriceDistribution|null=null,drink:DrinkConfig|null=null,selected=0;
  let timer:ReturnType<typeof setTimeout>|null=null,plot={left:64,right:64,width:1};
  let locked=true;
  function syncEditor(){const current=select.value?editor.values(select.value):null;for(const[key,input]of inputs){input.value=current?.fields[key]??'';input.disabled=locked||!current||current.fixed;}}
  function clear(message=''){signature='';distribution=null;drink=null;chart.setAttribute('hidden','');chart.replaceChildren();mean.textContent='—';detail.textContent='';shape.textContent='';for(const selector of['.distribution-average','.distribution-parameters','.distribution-method'])root.querySelector(selector)!.textContent='';error.textContent=message;}
  function describe(){if(!distribution)return;const bin=distribution.bins[selected];detail.textContent=`${euro(bin.fromCents)}${bin.toCents!==bin.fromCents?` bis ${euro(bin.toCents)}`:''}: ${percent(bin.probability)} der simulierten Runden`;}
  function draw(){
    if(!distribution||!drink||chart.hasAttribute('hidden'))return;const width=chart.getBoundingClientRect().width;if(width<1)return;
    const height=300,left=64,right=24,top=32,bottom=52,inner=width-left-right,baseline=height-bottom;
    plot={left,right:width-right,width:inner};chart.setAttribute('viewBox',`0 0 ${width} ${height}`);chart.replaceChildren();
    const low=drink.minCents,high=drink.maxCents,range=high-low;
    const x=(price:number)=>range?left+(price-low)/range*inner:left+inner/2;
    const maximum=Math.max(...distribution.bins.map(b=>b.probability));const yMax=Math.min(1,maximum*1.15)||1;
    const y=(probability:number)=>baseline-probability/yMax*(baseline-top);
    chart.append(node('title',{},`${drink.name}: simulierte Preisverteilung, Mittelwert ${euro(distribution.meanCents)}.`));
    for(let i=0;i<=4;i++){const value=yMax*i/4,position=y(value);chart.append(node('line',{x1:left,x2:width-right,y1:position,y2:position,class:'distribution-grid'}),node('text',{x:left-9,y:position+4,'text-anchor':'end',class:'distribution-axis'},`${(value*100).toLocaleString('de-DE',{maximumFractionDigits:1})}`));}
    const ticks=range?(width<500?[low,(low+high)/2,high]:Array.from({length:5},(_,i)=>low+range*i/4)):[low];
    ticks.forEach((price,index)=>chart.append(node('text',{x:x(price),y:baseline+23,'text-anchor':ticks.length===1?'middle':index===0?'start':index===ticks.length-1?'end':'middle',class:'distribution-axis'},(price/100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}))));
    chart.append(node('text',{x:left,y:16,class:'distribution-axis'},'Häufigkeit (%)'),node('text',{x:left+inner/2,y:height-7,'text-anchor':'middle',class:'distribution-axis'},'Preis (€)'));
    if(drink.averageCents!==undefined)chart.append(node('line',{x1:x(drink.averageCents),x2:x(drink.averageCents),y1:top,y2:baseline,class:'distribution-average-line'}));
    const points=distribution.bins.map(bin=>({x:x((bin.fromCents+bin.toCents)/2),y:y(bin.probability)}));
    chart.append(node('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),class:'distribution-line'}));
    const point=points[selected];chart.append(node('circle',{cx:point.x,cy:point.y,r:4,class:'distribution-point'}));describe();
  }
  function calculate(){
    timer=null;syncEditor();if(!read||!select.value){clear('Für die Vorschau bitte ein Getränk hinzufügen.');return;}
    try{const next=read(select.value),key=JSON.stringify(next);if(key!==signature){distribution=simulatePriceDistribution(next);drink=next;signature=key;selected=distribution.bins.reduce((best,bin,index)=>bin.probability>distribution!.bins[best].probability?index:best,0);}
      error.textContent='';chart.removeAttribute('hidden');chart.dataset.averageCents=String(next.averageCents??next.startCents);
      root.querySelector('.distribution-parameters')!.textContent=`${next.averageCents===undefined?'Kein Average gespeichert · Rückführung aus':`Average ${euro(next.averageCents)} · Rückführung ${next.reversionPercent??75} %`} · Schwankungsbasis ${euro(next.amplitudeCents)} · Min ${euro(next.minCents)} · Max ${euro(next.maxCents)} · Schritt ${euro(next.stepCents)} · Start ${euro(next.startCents)}`;
      const profile=normalPriceProfile(next);
      shape.textContent=next.minCents===next.maxCents?`Festpreis: ${euro(next.minCents)}.`:next.averageCents===undefined?'Ältere Konfiguration: symmetrische Zufallswanderung ohne Average-Rückführung.':`Automatisch am Average: gewöhnliche Ausschläge bis −${euro(profile.downCents)} / +${euro(profile.upCents)} vor Rundung. Seltene Min-/Max-Spitzen: ${percent(profile.outlierProbability)} der Runden; am Average davon ${percent(profile.maxProbability)} zum Maximum. Größere Schwankungsbasis erhöht Ausschläge und Spitzenhäufigkeit.${(next.reversionPercent??75)===0?' Rückführung ist aus; der Kurs wandert ohne Zielbindung.':''}`;
      root.querySelector('.distribution-average')!.textContent=next.averageCents===undefined?'Average-Ausfüllwert gilt erst nach Speichern.':`Ziel-Average: ${euro(next.averageCents)}`;mean.textContent=euro(distribution!.meanCents);
      root.querySelector('.distribution-method')!.textContent=`${distribution!.sampleCount.toLocaleString('de-DE')} simulierte normale Runden nach 2.000 Einlaufrunden. Näherung bei gleich langen Runden; keine Umsatzprognose.${distribution!.binStepCents>next.stepCents?` Preise in ${euro(distribution!.binStepCents)} breiten Gruppen zusammengefasst.`:''} Bei geringer Rückführung kann die Verteilung vom Startpreis abhängen.`;
      draw();
    }catch(reason){clear(`Vorschau nicht berechenbar: ${(reason as Error).message}`);}
  }
  select.onchange=()=>{if(timer!==null)clearTimeout(timer);calculate();};
  chart.onclick=event=>{if(!distribution||!drink)return;const local=event.clientX-chart.getBoundingClientRect().left,price=drink.minCents+(local-plot.left)/plot.width*(drink.maxCents-drink.minCents);selected=distribution.bins.reduce((best,bin,index)=>Math.abs((bin.fromCents+bin.toCents)/2-price)<Math.abs((distribution!.bins[best].fromCents+distribution!.bins[best].toCents)/2-price)?index:best,0);draw();};
  chart.onkeydown=event=>{if(!distribution||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();selected=event.key==='Home'?0:event.key==='End'?distribution.bins.length-1:Math.max(0,Math.min(distribution.bins.length-1,selected+(event.key==='ArrowLeft'?-1:1)));draw();};
  new ResizeObserver(draw).observe(chart);
  return{
    update(next:{id:string;name:string}[],reader:(id:string)=>DrinkConfig,isDraft:boolean,deferred=false){read=reader;draft=isDraft;const optionKey=JSON.stringify(next);if(optionKey!==JSON.stringify(options)){const previous=select.value;options=next;select.replaceChildren(...next.map(d=>{const option=document.createElement('option');option.value=d.id;option.textContent=d.name;return option;}));select.value=next.some(d=>d.id===previous)?previous:next[0]?.id??'';}
      root.querySelector('[data-testid="distribution-source"]')!.textContent=draft?'Vorschau: ungespeicherter Entwurf – der Markt bleibt unverändert.':'Vorschau: gespeicherte Parameter – der Markt bleibt unverändert.';
      select.disabled=!next.length;syncEditor();if(timer!==null)clearTimeout(timer);if(deferred)timer=setTimeout(calculate,180);else calculate();
    },
    lock(value:boolean){locked=value;syncEditor();},
    reset(){if(timer!==null)clearTimeout(timer);timer=null;options=[];read=null;select.replaceChildren();syncEditor();clear();}
  };
}
