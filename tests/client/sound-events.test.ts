import {it,expect} from 'vitest';
import {createSoundEvents} from '../../src/client/display/sound-events.js';
import {createMarket,applyCommand,advanceMarket} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
import {makeConfiguration,context} from '../v2-fixtures.js';
import {midpointRng} from '../fixtures.js';
it('events_play_once_and_loading_or_enabling_does_not_replay_old_events',()=>{
  const tracker=createSoundEvents();let s=createMarket(makeConfiguration(),0,midpointRng);expect(tracker.update(toDisplayState(s),null,0,true)).toEqual([]);
  s=applyCommand(s,{type:'start'},context(0),midpointRng);s=applyCommand(s,{type:'special',specialId:'bier-down'},context(0),midpointRng);
  expect(tracker.update(toDisplayState(s),'special',0,true)).toEqual(['special-intro']);expect(tracker.update(toDisplayState(s),'special',0,true)).toEqual([]);
  s=advanceMarket(s,context(10000),midpointRng);expect(tracker.update(toDisplayState(s),null,10000,true)).toEqual(['special-published']);expect(tracker.update(toDisplayState(s),null,10000,true)).toEqual([]);
  const fresh=createSoundEvents();expect(fresh.update(toDisplayState(s),null,10000,true)).toEqual([]);
});
it('muted_or_disconnected_events_are_consumed_without_a_later_backlog',()=>{
  const tracker=createSoundEvents();let s=createMarket(makeConfiguration(),0,midpointRng);tracker.update(toDisplayState(s),null,0,false);s=applyCommand(applyCommand(s,{type:'start'},context(0),midpointRng),{type:'crash'},context(0),midpointRng);
  expect(tracker.update(toDisplayState(s),'crash',0,false)).toEqual([]);expect(tracker.update(toDisplayState(s),'crash',1,true)).toEqual([]);
});
it('quote_pop_is_emitted_once_per_new_visible_slot_and_reset_seeds_a_new_run',()=>{
  const tracker=createSoundEvents();let s=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);tracker.update(toDisplayState(s),null,0,true);s=advanceMarket(s,context(1200000),midpointRng);
  expect(tracker.update(toDisplayState(s),null,1200000,true)).toEqual(['normal-published']);expect(tracker.update(toDisplayState(s),null,1200500,true)).toEqual(['quote-pop']);expect(tracker.update(toDisplayState(s),null,1200500,true)).toEqual([]);
  s=applyCommand(s,{type:'reset',kind:'evening'},context(1200600),midpointRng);expect(tracker.update(toDisplayState(s),null,1200600,true)).toEqual([]);
});
it('quote_ticks_stop_during_a_new_transition_while_its_intro_sound_remains',()=>{
  const tracker=createSoundEvents();let s=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'start'},context(0),midpointRng);tracker.update(toDisplayState(s),null,0,true);s=advanceMarket(s,context(1200000),midpointRng);tracker.update(toDisplayState(s),null,1200000,true);
  s=applyCommand(s,{type:'special',specialId:'bier-down'},context(1200100),midpointRng);expect(tracker.update(toDisplayState(s),'special',1200500,true)).toEqual(['special-intro']);expect(tracker.update(toDisplayState(s),'special',1201000,true)).toEqual([]);
});
it('ticker_reentry_does_not_emit_staggered_quote_pop_sounds',()=>{
  const tracker=createSoundEvents();let s=applyCommand(createMarket(makeConfiguration(),0,midpointRng),{type:'view',mode:'ticker'},context(0),midpointRng);s=applyCommand(s,{type:'start'},context(0),midpointRng);tracker.update(toDisplayState(s),null,0,true);s=advanceMarket(s,context(1200000),midpointRng);expect(tracker.update(toDisplayState(s),null,1200000,true)).toEqual(['normal-published']);expect(tracker.update(toDisplayState(s),null,1200500,true)).toEqual([]);
});
