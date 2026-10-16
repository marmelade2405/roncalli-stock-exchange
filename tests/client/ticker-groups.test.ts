import {expect,it} from 'vitest';
import {tickerGroups} from '../../src/client/display/ticker-groups.js';
import {DEFAULT_DRINKS} from '../../src/domain/defaults.js';
it('three_ticker_groups_put_every_drink_in_its_correct_column',()=>{
 const before=structuredClone(DEFAULT_DRINKS),groups=tickerGroups(DEFAULT_DRINKS);
 expect(groups.map(g=>g.name)).toEqual(['Wein · Longdrinks · Bier','Shots','Alkoholfrei']);
 expect(groups.map(g=>g.drinks.length)).toEqual([7,7,6]);
 expect(groups[1].drinks.map(d=>d.id)).toContain('rum');expect(groups[2].drinks.map(d=>d.id)).toContain('wasser');
 expect(groups[0].drinks.map(d=>d.id)).toContain('rum-cola');expect(groups.flatMap(g=>g.drinks)).toHaveLength(DEFAULT_DRINKS.length);expect(DEFAULT_DRINKS).toEqual(before);
});
it('unknown_categories_are_kept_and_empty_groups_are_omitted',()=>{
 const drinks=[{id:'custom',name:'Hausdrink',category:'Hausdrink'}];expect(tickerGroups(drinks)).toEqual([{name:'Wein · Longdrinks · Bier',drinks}]);
});
