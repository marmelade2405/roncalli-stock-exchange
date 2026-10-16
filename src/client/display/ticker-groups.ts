import {groupBarDrinks} from '../bar-display/categories.js';
type TickerDrink={id:string;name:string;category:string};
export function tickerGroups<T extends TickerDrink>(drinks:T[]):{name:string;drinks:T[]}[]{
 const categories=groupBarDrinks(drinks),shots=new Set(categories.find(g=>g.name==='Shots')?.drinks.map(d=>d.id)),free=new Set(categories.find(g=>g.name==='Alkoholfrei')?.drinks.map(d=>d.id));
 return [{name:'Wein · Longdrinks · Bier',drinks:drinks.filter(d=>!shots.has(d.id)&&!free.has(d.id))},{name:'Shots',drinks:drinks.filter(d=>shots.has(d.id))},{name:'Alkoholfrei',drinks:drinks.filter(d=>free.has(d.id))}].filter(group=>group.drinks.length>0);
}
