import {expect,it} from 'vitest';
import {chartScale,chartGeometry} from '../../src/client/display/chart.js';
import type {PricePoint} from '../../src/domain/model.js';
const point=(price:number):PricePoint=>({at:0,price,revision:0,kind:'normal'});
it('visible_history_extremes_fill_the_chart_instead_of_using_sale_limits',()=>{
  const scale=chartScale([point(200),point(220)],{minCents:110,maxCents:500,averageCents:180});expect(scale).toEqual({minCents:198,maxCents:222,lowCents:200,highCents:220});const path=chartGeometry([point(200),point(220)],100,100,{...scale,averageCents:180}).path;expect(path).toMatch(/^M0,91.67/);expect(path).toMatch(/100,8.33$/);
});
it('flat_and_water_prices_have_a_finite_centered_scale',()=>{
  for(const price of[0,200]){const scale=chartScale([point(price)],{minCents:0,maxCents:500,averageCents:180});expect(scale.minCents).toBeLessThan(price);expect(scale.maxCents).toBeGreaterThan(price);expect(scale.lowCents).toBe(price);expect(scale.highCents).toBe(price);expect(chartGeometry([point(price)],100,100,{...scale,averageCents:180}).path).toBe('M50,50');}
});
