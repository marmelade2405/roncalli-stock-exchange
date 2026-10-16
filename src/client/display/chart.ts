import type {PricePoint} from '../shared/protocol.js';
import {formatEuro} from '../shared/format.js';
export interface ChartRange{minCents:number;maxCents:number;averageCents:number}
const position=(price:number,min:number,max:number,height:number)=>max===min?height/2:height-(price-min)/(max-min)*height;
export function chartGeometry(points:PricePoint[],width:number,height:number,range?:ChartRange):{path:string;pointCount:number}{
  if(!points.length)return{path:'',pointCount:0};
  const first=points[0].at,last=points.at(-1)!.at,prices=points.map(p=>p.price),min=range?.minCents??Math.min(...prices),max=range?.maxCents??Math.max(...prices);
  const rounded=(n:number)=>Number(n.toFixed(2));
  const path=points.map((point,index)=>{const x=last===first?(points.length===1?width/2:index/(points.length-1)*width):(point.at-first)/(last-first)*width;const y=position(point.price,min,max,height);return `${index?'L':'M'}${rounded(x)},${rounded(y)}`;}).join(' ');
  return{path,pointCount:points.length};
}
const svgNS='http://www.w3.org/2000/svg',time=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
export function renderChart(container:HTMLElement,points:PricePoint[],range?:ChartRange):void{
  container.replaceChildren();const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','-5 -10 345 120');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('role','img');svg.dataset.pointCount=String(points.length);
  svg.setAttribute('aria-label',`Kursverlauf: ${Math.max(0,points.length-1)} Preisänderungen${range?`, Minimum ${formatEuro(range.minCents)}, Average ${formatEuro(range.averageCents)}, Maximum ${formatEuro(range.maxCents)}`:''}`);
  const title=document.createElementNS(svgNS,'title');title.textContent=points.map(p=>`${time.format(new Date(p.at))}: ${formatEuro(p.price)}`).join(' · ');svg.append(title);
  if(range){
    const guides=range.minCents===range.maxCents?[['fixed',range.minCents,'Fix']as const]:[['max',range.maxCents,'Max'],['average',range.averageCents,'Avg'],['min',range.minCents,'Min']]as const;
    for(const [kind,value,label]of guides){const y=position(value,range.minCents,range.maxCents,100);const line=document.createElementNS(svgNS,'line');line.dataset.guide=kind;line.setAttribute('x1','0');line.setAttribute('x2','240');line.setAttribute('y1',String(y));line.setAttribute('y2',String(y));line.setAttribute('class',`chart-guide ${kind}`);svg.append(line);const text=document.createElementNS(svgNS,'text');text.setAttribute('x','250');text.setAttribute('y',String(y+4));text.setAttribute('class',`chart-guide-label ${kind}`);text.textContent=`${label} ${(value/100).toFixed(2).replace('.',',')}`;svg.append(text);}
  }
  const geometry=chartGeometry(points,240,100,range),path=document.createElementNS(svgNS,'path');path.setAttribute('d',geometry.path);path.setAttribute('class','price-path');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','2.5');path.setAttribute('vector-effect','non-scaling-stroke');svg.append(path);
  if(points.length){const last=/[ML]([^ ]+)$/.exec(geometry.path)![1].split(',');const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('cx',last[0]);dot.setAttribute('cy',last[1]);dot.setAttribute('r','3');dot.setAttribute('fill','currentColor');svg.append(dot);}
  const labels=document.createElement('div');labels.className='chart-times';labels.textContent=points.length?`${time.format(new Date(points[0].at))} — ${time.format(new Date(points.at(-1)!.at))} · ${Math.max(0,points.length-1)} Änderungen`:'Noch kein Verlauf';container.append(svg,labels);
}
