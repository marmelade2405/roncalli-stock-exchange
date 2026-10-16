import {expect,it} from 'vitest';
import {groupBarDrinks} from '../../src/client/bar-display/categories.js';
it('bar_categories_group_drinks_and_keep_catalog_order_without_losing_water_or_wine',()=>{
  const drinks=[{id:'water',name:'Wasser',category:'Dauerhaft gratis'},{id:'shot2',name:'Pfeffi',category:'Shots'},{id:'beer',name:'Bier',category:'Bier'},{id:'gin',name:'Gin Tonic',category:'Longdrinks'},{id:'shot1',name:'Berentzen',category:'Shots'},{id:'wine',name:'Wein',category:'Wein & Aperitif'}],original=structuredClone(drinks),groups=groupBarDrinks(drinks);
  expect(groups.map(g=>g.name)).toEqual(['Shots','Bier','Longdrinks','Alkoholfrei','Wein & Aperitifs']);expect(groups[0].drinks.map(d=>d.id)).toEqual(['shot2','shot1']);expect(groups[3].drinks.map(d=>d.id)).toEqual(['water']);expect(groups.flatMap(g=>g.drinks)).toHaveLength(6);expect(drinks).toEqual(original);
});
it('custom_drink_categories_are_kept_in_the_staff_menu',()=>{const groups=groupBarDrinks([{id:'coffee',name:'Kaffee',category:'Heißgetränke'}]);expect(groups[0].name).toBe('Heißgetränke');expect(groups[0].drinks[0].id).toBe('coffee');});
