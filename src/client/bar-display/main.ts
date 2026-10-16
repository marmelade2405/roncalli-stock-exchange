import './bar-display.css';
import type {DisplayState,Snapshot} from '../shared/protocol.js';
import {connectMarket,syncServerClock} from '../shared/connection.js';
import {createClock} from '../shared/clock.js';
import {createFreshness} from '../shared/freshness.js';
import {formatEuro} from '../shared/format.js';
import {canShowBarPrices} from './price-model.js';
import {groupBarDrinks} from './categories.js';
const root=document.getElementById('bar-prices')!,waiting=document.getElementById('bar-waiting')!,clock=createClock(),freshness=createFreshness();let state:DisplayState|null=null,connected=false,revision=-1;
function render(){
  const visible=state!==null&&canShowBarPrices(state,clock.now(performance.now()),connected,freshness.isFresh(performance.now()));root.hidden=!visible;waiting.hidden=visible;
  if(!visible){waiting.textContent=connected?'Warte auf aktuelle Preise':'Verbindung zum Markt unterbrochen';return;}
  if(state!.revision===revision)return;revision=state!.revision;root.replaceChildren();
  const columns=[document.createElement('div'),document.createElement('div')],weights=[0,0];columns.forEach(column=>{column.className='bar-column';root.append(column);});
  for(const[index,group]of groupBarDrinks(state!.drinks).entries()){const target=weights[0]<=weights[1]?0:1;weights[target]+=group.drinks.length+1;const section=document.createElement('section');section.className='bar-category';section.dataset.barCategory=group.name;section.style.setProperty('--count',String(group.drinks.length));section.style.order=String(index);const heading=document.createElement('h2');heading.className='bar-category-title';heading.textContent=group.name;const items=document.createElement('div');items.className='bar-category-items';items.setAttribute('role','list');items.setAttribute('aria-label',group.name);items.style.setProperty('--count',String(group.drinks.length));section.append(heading,items);columns[target].append(section);
    for(const drink of group.drinks){const row=document.createElement('article');row.className='bar-item';row.setAttribute('role','listitem');const name=document.createElement('h3');name.className='bar-name';name.textContent=drink.name;const price=document.createElement('strong');price.className='bar-price';price.dataset.barPrice=drink.id;price.dataset.testid=`bar-price-${drink.id}`;price.textContent=formatEuro(state!.prices[drink.id]);row.append(name,price);items.append(row);}
  }
}
function open(){connectMarket<DisplayState>('public',{onState:(packet:Snapshot<DisplayState>)=>{if(state&&packet.state.revision<state.revision)return;if(!clock.sync(packet,performance.now(),performance.now()))return;state=packet.state;freshness.received(performance.now());render();},onConnection:online=>{connected=online;if(!online)freshness.reset();render();}});}
void syncServerClock(clock).then(open).catch(open);window.setInterval(render,100);window.setInterval(()=>{if(connected)void syncServerClock(clock).then(render).catch(()=>{});},30000);
