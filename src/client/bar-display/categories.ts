type BarDrink={id:string;name:string;category:string};
export function groupBarDrinks<T extends BarDrink>(drinks:T[]):{name:string;drinks:T[]}[]{
  const grouped=new Map<string,T[]>();for(const drink of drinks){const category=drink.category.toLocaleLowerCase('de-DE');const name=/shot|kurz/.test(category)?'Shots':/bier|radler/.test(category)?'Bier':/alkoholfrei|soft|wasser|gratis/.test(category)?'Alkoholfrei':/wein|aperitif/.test(category)?'Wein & Aperitifs':/longdrink|cocktail/.test(category)?'Longdrinks':drink.category.trim()||'Weitere Getränke';const list=grouped.get(name)??[];list.push(drink);grouped.set(name,list);}
  const order=['Shots','Bier','Longdrinks','Alkoholfrei','Wein & Aperitifs'];return[...order.filter(name=>grouped.has(name)),...[...grouped.keys()].filter(name=>!order.includes(name))].map(name=>({name,drinks:grouped.get(name)!}));
}
