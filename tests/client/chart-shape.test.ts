import {expect,it} from 'vitest';
import {chartGeometry} from '../../src/client/display/chart.js';
import type {PricePoint} from '../../src/domain/model.js';
const point=(at:number,price:number):PricePoint=>({at,price,kind:'normal',revision:0});
it('short_crash_intervals_and_long_normal_intervals_receive_equal_plot_space',()=>{
  const points=[point(0,200),point(1200000,250),point(1210000,220),point(1510000,240)],geometry=chartGeometry(points,90,100,{minCents:100,maxCents:300,averageCents:200});
  expect(geometry.path).toBe('M0,50 C10,41.67 20,25 30,25 C40,25 50,40 60,40 C70,40 80,33.33 90,30');expect(geometry.pointCount).toBe(4);
});
it('line_control_points_never_go_beyond_the_prices_at_either_end_of_a_segment',()=>{
  const points=[point(0,110),point(1,500),point(2,170),point(3,180),point(4,180),point(5,300)],path=chartGeometry(points,100,100,{minCents:100,maxCents:500,averageCents:180}).path;
  const numbers=path.match(/-?\d+(?:\.\d+)?/g)!.map(Number),ys=points.map(p=>100-(p.price-100)/4);
  for(let i=0;i<points.length-1;i++){const segment=numbers.slice(2+i*6,2+(i+1)*6);for(const y of[segment[1],segment[3],segment[5]]){expect(y).toBeGreaterThanOrEqual(Math.min(ys[i],ys[i+1]));expect(y).toBeLessThanOrEqual(Math.max(ys[i],ys[i+1]));}}
});
it('prices_and_dates_are_not_modified_when_the_chart_is_smoothed',()=>{
  const points=[point(0,500),point(10,110),point(100000,500)],copy=structuredClone(points);chartGeometry(points,100,50,{minCents:110,maxCents:500,averageCents:180});expect(points).toEqual(copy);
});
