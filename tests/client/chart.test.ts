import {expect,it} from 'vitest';
import {chartGeometry} from '../../src/client/display/chart.js';
import type {PricePoint} from '../../src/domain/model.js';
const point=(at:number,price:number):PricePoint=>({at,price,kind:'correction',revision:at});
it('chart_uses_equal_spacing_between_price_rounds',()=>{const geometry=chartGeometry([point(0,200),point(1000,250),point(10000,210)],100,50);expect(geometry.pointCount).toBe(3);expect(geometry.path).toBe('M0,50 C16.67,33.33 33.33,0 50,0 C66.67,0 83.33,26.67 100,40');});
it('configured_price_bounds_keep_chart_scale_stable',()=>{const range={minCents:100,maxCents:500,averageCents:200};expect(chartGeometry([point(0,200),point(10000,300)],100,100,range).path).toBe('M0,75 C33.33,66.67 66.67,58.33 100,50');expect(chartGeometry([point(0,200),point(10000,200)],100,100,range).path).toBe('M0,75 C33.33,75 66.67,75 100,75');});
it('free_water_chart_keeps_zero_range_finite',()=>{const chart=chartGeometry([point(0,0)],100,100,{minCents:0,maxCents:0,averageCents:0});expect(chart.path).toBe('M50,50');});
it('chart_handles_single_flat_and_duplicate_time_points',()=>{expect(chartGeometry([point(0,200)],100,50)).toEqual({path:'M50,25',pointCount:1});expect(chartGeometry([point(0,200),point(1000,200)],100,50).path).toBe('M0,25 C33.33,25 66.67,25 100,25');const same=chartGeometry([point(1000,200),point(1000,250)],100,50);expect(same.pointCount).toBe(2);expect(same.path).not.toMatch(/NaN|Infinity/);expect(chartGeometry([],100,50)).toEqual({path:'',pointCount:0});});
