import type {PricePoint} from '../shared/protocol.js';
import type {ChartMode} from '../../domain/model.js';
import {formatEuro} from '../shared/format.js';
export interface ChartRange{minCents:number;maxCents:number;averageCents:number}
export function chartScale(points:PricePoint[],range?:ChartRange){const values=points.length?points.map(p=>p.price):[range?.averageCents??0],lowCents=Math.min(...values),highCents=Math.max(...values),padding=highCents===lowCents?Math.max(10,Math.abs(lowCents)*.05):(highCents-lowCents)*.1;return{minCents:lowCents-padding,maxCents:highCents+padding,lowCents,highCents};}
const position=(price:number,min:number,max:number,height:number)=>max===min?height/2:height-(price-min)/(max-min)*height;
export function chartGeometry(points:PricePoint[],width:number,height:number,range?:ChartRange):{path:string;pointCount:number}{
  if(!points.length)return{path:'',pointCount:0};
  const prices=points.map(p=>p.price),min=range?.minCents??Math.min(...prices),max=range?.maxCents??Math.max(...prices);
  const rounded=(n:number)=>Number(n.toFixed(2));
  const ys=points.map(p=>position(p.price,min,max,height));if(points.length===1)return{path:`M${rounded(width/2)},${rounded(ys[0])}`,pointCount:1};
  const step=width/(points.length-1),slopes=ys.slice(1).map((y,i)=>y-ys[i]);
  // Zero tangents at reversals keep every real peak/valley. Harmonic tangents
  // on continuing slopes soften corners without inventing new extremes.
  const tangents=ys.map((_,i)=>i===0?slopes[0]:i===ys.length-1?slopes.at(-1)!:slopes[i-1]*slopes[i]<=0?0:2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i]));
  let path=`M0,${rounded(ys[0])}`;
  for(let i=0;i<points.length-1;i++)path+=` C${rounded((i+1/3)*step)},${rounded(ys[i]+tangents[i]/3)} ${rounded((i+2/3)*step)},${rounded(ys[i+1]-tangents[i+1]/3)} ${rounded((i+1)*step)},${rounded(ys[i+1])}`;
  return{path,pointCount:points.length};
}
const svgNS='http://www.w3.org/2000/svg',time=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
let guideContext:CanvasRenderingContext2D|null|undefined;
function guideTextWidth(text:string,size:number):number{if(guideContext===undefined)guideContext=document.createElement('canvas').getContext('2d');if(!guideContext)return text.length*size*.65;guideContext.font=`${size}px Consolas, monospace`;return guideContext.measureText(text).width;}
interface ChartEntry{points:PricePoint[];range?:ChartRange;simulatedCount:number;observer?:ResizeObserver;width:number;height:number}
const entries=new WeakMap<HTMLElement,ChartEntry>();
export function clearCharts(root:HTMLElement):void{for(const chart of root.querySelectorAll<HTMLElement>('[data-chart]')){entries.get(chart)?.observer?.disconnect();entries.delete(chart);}}
export function renderChart(container:HTMLElement,points:PricePoint[],range?:ChartRange,simulatedCount=0,mode:ChartMode='bars-gap',sharedGuideRanges?:readonly ChartRange[]):void{
  entries.get(container)?.observer?.disconnect();const entry:ChartEntry={points,range,simulatedCount,width:0,height:0};entries.set(container,entry);
  const draw=()=>{
  container.replaceChildren();const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('preserveAspectRatio','xMinYMid meet');svg.setAttribute('role','img');svg.dataset.pointCount=String(points.length);container.append(svg);
  const width=container.clientWidth||320,height=parseFloat(getComputedStyle(svg).height)||96,pad=6,plotHeight=Math.max(1,height-pad*2);let plotWidth=Math.max(1,width-(width<140?40:70)-pad*2);entry.width=width;entry.height=height;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  svg.dataset.mode=mode;
  const scale=chartScale(points,range);svg.dataset.scaleMin=String(scale.minCents);svg.dataset.scaleMax=String(scale.maxCents);svg.dataset.observedLow=String(scale.lowCents);svg.dataset.observedHigh=String(scale.highCents);
  svg.dataset.realPointCount=String(points.length-simulatedCount);svg.dataset.simulatedPointCount=String(simulatedCount);svg.dataset.simulatedCrashCount=String(points.slice(0,simulatedCount).filter(p=>p.kind==='crash').length);
  svg.setAttribute('aria-label',`Kursverlauf: ${Math.max(0,points.length-simulatedCount-1)} echte Preisänderungen${simulatedCount?`, ${simulatedCount} simulierte Verlaufspunkte`:''}, sichtbares Tief ${formatEuro(scale.lowCents)}, sichtbares Hoch ${formatEuro(scale.highCents)}${range?`, Average ${formatEuro(range.averageCents)}`:''}`);
  const title=document.createElementNS(svgNS,'title');title.textContent=points.map(p=>`${time.format(new Date(p.at))}: ${formatEuro(p.price)}`).join(' · ');svg.append(title);
  if(range){
    const fixed=range.minCents===range.maxCents;
    const reference=(kind:string,value:number,label:string)=>({kind,value,label:value>scale.maxCents?`${label} ↑`:value<scale.minCents?`${label} ↓`:label,draw:value>=scale.minCents&&value<=scale.maxCents});
    const guides=fixed?[reference('fixed',range.minCents,'Fix')]:[reference('max',range.maxCents,'Max'),reference('min',range.minCents,'Min'),reference('average',range.averageCents,'Avg')];
    const small=width<140||height<70,fontSize=small?7:10,labelGap=fontSize+2;
    const sharedLabels=sharedGuideRanges?.flatMap(r=>[`Max ↑ ${(r.maxCents/100).toFixed(2).replace('.',',')}`,`Min ↓ ${(r.minCents/100).toFixed(2).replace('.',',')}`,`Avg ↑ ${(r.averageCents/100).toFixed(2).replace('.',',')}`])??[];
    const widest=Math.max(...guides.map(guide=>guideTextWidth(`${guide.label} ${(guide.value/100).toFixed(2).replace('.',',')}`,fontSize)),...sharedLabels.map(label=>guideTextWidth(label,fontSize)));plotWidth=Math.max(1,width-Math.ceil(widest+8)-pad*2);
    const labels=guides.map(guide=>({...guide,y:Math.max(pad,Math.min(height-pad,position(guide.value,scale.minCents,scale.maxCents,plotHeight)+pad))})).sort((a,b)=>a.y-b.y);let previous=fontSize;
    const labelYs=labels.map(guide=>{const y=Math.max(guide.y+3,previous);previous=y+labelGap;return y;});if(labelYs.length&&labelYs.at(-1)!>height-2){labelYs[labelYs.length-1]=height-2;for(let i=labelYs.length-2;i>=0;i--)labelYs[i]=Math.min(labelYs[i],labelYs[i+1]-labelGap);}
    labels.forEach((guide,index)=>{if(guide.draw){const line=document.createElementNS(svgNS,'line');line.dataset.guide=guide.kind;line.setAttribute('x1',String(pad));line.setAttribute('x2',String(plotWidth+pad));line.setAttribute('y1',String(guide.y));line.setAttribute('y2',String(guide.y));line.setAttribute('class',`chart-guide ${guide.kind}`);svg.append(line);}const text=document.createElementNS(svgNS,'text');text.setAttribute('x',String(plotWidth+pad+4));text.setAttribute('y',String(labelYs[index]));text.setAttribute('class',`chart-guide-label ${guide.kind}`);text.style.fontSize=`${fontSize}px`;text.textContent=`${guide.label} ${(guide.value/100).toFixed(2).replace('.',',')}`;svg.append(text);});
  }
  svg.dataset.plotWidth=String(plotWidth);const group=document.createElementNS(svgNS,'g');group.setAttribute('transform',`translate(${pad},${pad})`);svg.append(group);
  if(mode==='bars'||mode==='bars-gap'){
    const slot=plotWidth/Math.max(1,points.length),gap=mode==='bars-gap'?Math.min(3,slot*.18):0;
    points.forEach((point,index)=>{const previous=points[Math.max(0,index-1)].price,delta=point.price-previous,a=position(previous,scale.minCents,scale.maxCents,plotHeight),b=position(point.price,scale.minCents,scale.maxCents,plotHeight),rect=document.createElementNS(svgNS,'rect');rect.setAttribute('class',`change-bar ${delta>0?'up':delta<0?'down':'flat'}`);rect.setAttribute('x',String(index*slot+gap/2));rect.setAttribute('width',String(slot-gap));rect.setAttribute('y',String(Math.max(0,Math.min(plotHeight-2,Math.min(a,b)))));rect.setAttribute('height',String(Math.max(2,Math.abs(a-b))));rect.dataset.simulated=String(index<simulatedCount);rect.dataset.delta=String(delta);const label=document.createElementNS(svgNS,'title');label.textContent=`${time.format(new Date(point.at))}: ${formatEuro(point.price)} · ${delta>0?'+':''}${formatEuro(delta)}`;rect.append(label);group.append(rect);});
  }else{
    const geometry=chartGeometry(points,plotWidth,plotHeight,{...scale,averageCents:range?.averageCents??0}),path=document.createElementNS(svgNS,'path');path.setAttribute('class','price-path');path.setAttribute('d',geometry.pointCount===1?`M0,${geometry.path.split(',')[1]} L${plotWidth},${geometry.path.split(',')[1]}`:geometry.path);path.setAttribute('vector-effect','non-scaling-stroke');group.append(path);
  }
  };draw();
  if(typeof ResizeObserver!=='undefined'){entry.observer=new ResizeObserver(()=>{const svg=container.querySelector('svg'),width=container.clientWidth,height=svg?parseFloat(getComputedStyle(svg).height)||96:96;if(width>0&&(Math.abs(width-entry.width)>.5||Math.abs(height-entry.height)>.5))draw();});entry.observer.observe(container);}
}
