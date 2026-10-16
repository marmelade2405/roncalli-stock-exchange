import type { DisplayState } from '../shared/protocol.js';
import { formatEuro, formatChange } from '../shared/format.js';
import {renderChart,clearCharts} from './chart.js';
import {combineHistory} from '../../domain/startup-history.js';
import {tickerGroups} from './ticker-groups.js';
interface Column{track:HTMLElement;viewport:HTMLElement;count:number;heading:HTMLElement|null;headingWidth:number}
let headingContext:CanvasRenderingContext2D|null|undefined;
function fitGroupHeading(column:Column){
 const heading=column.heading;if(!heading||heading.clientWidth===column.headingWidth)return;
 column.headingWidth=heading.clientWidth;const style=getComputedStyle(heading),available=heading.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-2;
 if(headingContext===undefined)headingContext=document.createElement('canvas').getContext('2d');
 const reference='WEIN · LONGDRINKS · BIER';if(headingContext)headingContext.font=`${style.fontWeight} 100px ${style.fontFamily}`;
 const measured=headingContext?.measureText(reference).width??reference.length*60,spacing=(parseFloat(style.letterSpacing)||0)/(parseFloat(style.fontSize)||24);
 heading.style.setProperty('--ticker-heading-size',`${Math.max(12,available*100/(measured+(reference.length-1)*spacing*100))}px`);
}
const cache = new WeakMap<HTMLElement, { revision:number;runId:number;columns:Column[];columnCount:number;height:number }>();
export function clearTicker(container:HTMLElement){clearCharts(container);cache.delete(container);container.replaceChildren();}
export function renderTicker(container: HTMLElement, state: DisplayState, wallNow: number): void {
  const requested=state.tickerColumns??3,multiple=window.innerWidth>=1000;
  const groups=multiple&&requested===3?tickerGroups(state.drinks):multiple&&state.drinks.length>1?[0,1].map(index=>({name:'',drinks:state.drinks.slice(Math.floor(index*state.drinks.length/2),Math.floor((index+1)*state.drinks.length/2))})):[{name:'',drinks:state.drinks}];
  const columnCount=groups.length;container.dataset.columns=String(columnCount);
  let current = cache.get(container);
  if (!current || current.revision !== state.revision||current.runId!==state.runId||current.columnCount!==columnCount) {
    clearCharts(container);container.innerHTML='<div class="ticker-columns"></div>';
    const root=container.querySelector<HTMLElement>('.ticker-columns')!;root.style.setProperty('--ticker-columns',String(columnCount));
    const columns:Column[]=[];
    for(let index=0;index<columnCount;index++){
    const {drinks,name}=groups[index],column=document.createElement('div');column.className='ticker-column';column.dataset.group=name;
    column.innerHTML='<div class="ticker-head">KURSVERLAUF · ÄNDERUNG · GETRÄNKE / PREIS</div><div class="ticker-viewport"><div class="ticker-track"></div></div>';
    if(name){const heading=column.querySelector<HTMLElement>('.ticker-head')!;heading.textContent=name;heading.classList.add('ticker-group-head');}
    const track=column.querySelector<HTMLElement>('.ticker-track')!,viewport=column.querySelector<HTMLElement>('.ticker-viewport')!;
    root.append(column);
    const copies=Math.max(3,Math.ceil(4/drinks.length)+2);
    for (let copy = 0; copy < copies; copy++) for (const drink of drinks) {
      const row = document.createElement('article'); row.className = 'ticker-row';row.dataset.quoteDrink=drink.id;
      if(state.recentNews?.drinkId===drink.id){row.dataset.specialHighlight='true';row.dataset.specialDirection=state.recentNews.direction;}
      row.innerHTML = '<div class="quote-placeholder" aria-hidden="true">…</div><div class="ticker-quote-area"><div class="ticker-chart"></div><span class="ticker-change mono" data-delta></span><div class="ticker-identity"><strong class="ticker-name"></strong><div class="ticker-values"><span class="price-signal" aria-hidden="true"></span><strong class="ticker-price mono" data-price></strong></div></div></div>';
      row.querySelector('.ticker-name')!.textContent=drink.name;
      row.querySelector('.ticker-price')!.textContent = formatEuro(state.prices[drink.id]);
      const delta = row.querySelector('.ticker-change')!; const change = formatChange(state.prices[drink.id], state.previousPrices?.[drink.id] ?? state.prices[drink.id]);
      delta.className = `ticker-change mono ${change.direction}`; delta.textContent = `${change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '→'} ${change.euro}\n${change.percent}`;
      row.querySelector('.price-signal')!.className=`price-signal ${change.direction==='down'?'down':'up'}`;track.append(row);
      const chart=row.querySelector<HTMLElement>('.ticker-chart')!;chart.dataset.chart=drink.id;const series=combineHistory(state.historyByDrink[drink.id]??[],state.startupHistoryByDrink?.[drink.id]??[],state.parameters.historyChanges);renderChart(chart,series.points,drink,series.simulatedCount,state.chartMode??'bars-gap',state.drinks);
      if (copy > 0) row.setAttribute('aria-hidden', 'true'); track.append(row);
    }
    columns.push({track,viewport,count:drinks.length,heading:name?column.querySelector<HTMLElement>('.ticker-group-head'):null,headingWidth:0});
    }
    current = { revision: state.revision, runId:state.runId, columns,columnCount, height: 0 }; cache.set(container, current);
  }
  for(const column of current.columns)fitGroupHeading(column);
  const height = Math.max(window.innerWidth<650?180:columnCount===3?150:120, current.columns[0].viewport.clientHeight / 4);
  if (current.height !== height) { container.style.setProperty('--ticker-row-height', `${height}px`); current.height = height; }
  for(const column of current.columns){
  const elapsedRows=Math.max(0,(wallNow-(state.tickerWallAt??state.publication?.wallAt??state.viewEpoch))/state.parameters.tickerRowMs+(state.tickerOffsetRows??0)),entryRows=column.viewport.clientHeight/height;
  const rows=window.matchMedia('(prefers-reduced-motion: reduce)').matches?Math.floor(elapsedRows):elapsedRows;
  const translation=rows<entryRows?column.viewport.clientHeight-rows*height:-((rows-entryRows)%column.count)*height;
  column.track.style.transform = `translateY(${translation}px)`;
  }
}
