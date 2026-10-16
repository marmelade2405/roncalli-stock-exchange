import {expect,it} from 'vitest';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createMarket,applyCommand} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {getDisplayModel,createNewsHold} from '../../src/client/display/view-model.js';
const rng=()=>.5,context=(at:number)=>({wallNow:at,marketNow:at});
const news=()=>toDisplayState(applyCommand(applyCommand(createMarket(createDefaultConfiguration(undefined,rng),0,rng),{type:'start'},context(0),rng),{type:'special',specialId:'bier-down'},context(0),rng));
it('final_news_stays_visible_during_a_brief_publication_gap_without_showing_unconfirmed_prices',()=>{
 const state=news();for(const now of [25000,25100,26999])expect(getDisplayModel(state,now,true)).toMatchObject({holdNews:true,showPrices:false,waitingForPublication:true});
});
it('news_hold_ends_when_publication_is_late_or_connection_is_stale',()=>{
 const state=news();expect(getDisplayModel(state,27001,true)).toMatchObject({holdNews:false,showPrices:false});expect(getDisplayModel(state,25000,false)).toMatchObject({holdNews:false,showPrices:false});expect(getDisplayModel(state,25000,true,false)).toMatchObject({holdNews:false,showPrices:false});
});
it('repeated_deadline_snapshots_cannot_restart_an_expired_hold',()=>{
 const hold=createNewsHold();expect(hold('news-a',true,100,100)).toBe(true);expect(hold('news-a',true,2101,100)).toBe(false);expect(hold('news-a',true,5000,5000)).toBe(false);expect(hold('news-b',true,5000,5000)).toBe(true);
});
it('early_snapshots_and_connection_changes_do_not_extend_the_known_deadline',()=>{
 const hold=createNewsHold();expect(hold('news-a',false,0,10000)).toBe(false);expect(hold('news-a',true,11000,10000)).toBe(true);expect(hold('news-a',false,11100,11100)).toBe(false);expect(hold('news-a',true,11101,11101)).toBe(true);expect(hold('news-a',true,12001,12001)).toBe(false);expect(hold(null,false,13000,13000)).toBe(false);
});
