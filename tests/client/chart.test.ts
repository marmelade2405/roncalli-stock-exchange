import {expect,it} from 'vitest';
import {chartGeometry} from '../../src/client/display/chart.js';
import type {PricePoint} from '../../src/domain/model.js';
const point=(at:number,price:number):PricePoint=>({at,price,kind:'correction',revision:at});
it('chart_uses_real_time_spacing',()=>{const geometry=chartGeometry([point(0,200),point(1000,250),point(10000,210)],100,50);expect(geometry.pointCount).toBe(3);expect(geometry.path).toBe('M0,50 L10,0 L100,40');});
it('configured_price_bounds_keep_chart_scale_stable',()=>{const range={minCents:100,maxCents:500,averageCents:200};expect(chartGeometry([point(0,200),point(10000,300)],100,100,range).path).toBe('M0,75 L100,50');expect(chartGeometry([point(0,200),point(10000,200)],100,100,range).path).toBe('M0,75 L100,75');});
it('free_water_chart_keeps_zero_range_finite',()=>{const chart=chartGeometry([point(0,0)],100,100,{minCents:0,maxCents:0,averageCents:0});expect(chart.path).toBe('M50,50');});
it('chart_handles_single_flat_and_duplicate_time_points',()=>{expect(chartGeometry([point(0,200)],100,50)).toEqual({path:'M50,25',pointCount:1});expect(chartGeometry([point(0,200),point(1000,200)],100,50).path).toBe('M0,25 L100,25');const same=chartGeometry([point(1000,200),point(1000,250)],100,50);expect(same.pointCount).toBe(2);expect(same.path).not.toMatch(/NaN|Infinity/);expect(chartGeometry([],100,50)).toEqual({path:'',pointCount:0});});
