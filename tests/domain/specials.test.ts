import { expect, it } from 'vitest';
import { previewSpecial } from '../../src/domain/specials.js';
import { makeDrink } from '../fixtures.js';
import { createSpecialCatalog } from '../../src/domain/news-catalog.js';
it('special_percent_is_rounded_and_bounded', () => {
  const drink = makeDrink(); const [down,up] = createSpecialCatalog([drink]);
  expect(previewSpecial(drink,200,down)).toMatchObject({ price:120,delta:-80,percent:-40,limited:false });
  expect(previewSpecial(drink,200,up)).toMatchObject({ price:280,delta:80,percent:40,limited:false });
  expect(previewSpecial(drink,300,up)).toMatchObject({ price:300,delta:0,limited:true });
  expect(previewSpecial(drink,210,up).price).toBe(290);
  expect(previewSpecial(drink,100,down)).toMatchObject({ price:100,delta:0,limited:true });
});
