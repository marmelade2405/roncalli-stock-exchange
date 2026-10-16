import { expect, it } from 'vitest';
import { openApp } from './app-fixture.js';
import { createController } from '../../src/server/controller.js';
import { makeDrink, midpointRng } from '../fixtures.js';
import type { MarketState } from '../../src/domain/model.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
import {createMarket} from '../../src/domain/market-v2.js';
import {makeConfiguration} from '../v2-fixtures.js';
it('simulation_tempo_changes_live_paused_crash_and_transition_without_time_jump',async()=>{
  const app=await openApp();const cookie=await app.cookie();
  await app.command({type:'simulation',enabled:true,speed:60},0,cookie);await app.command({type:'start'},1,cookie);
  app.time(1000);await app.controller.tick();let snapshot=app.controller.adminSnapshot();expect(snapshot.clock.marketNow).toBe(60000);
  const change=await app.command({type:'simulation',enabled:true,speed:37},snapshot.state.revision,cookie);expect(change.status).toBe(200);snapshot=app.controller.adminSnapshot();expect(snapshot.clock).toMatchObject({marketNow:60000,speed:37,rate:37,paused:false});expect(snapshot.state.deadline).toBe(1200000);
  app.time(2000);await app.controller.tick();snapshot=app.controller.adminSnapshot();expect(snapshot.clock.marketNow).toBe(97000);
  await app.command({type:'pause',paused:true},snapshot.state.revision,cookie);snapshot=app.controller.adminSnapshot();
  expect((await app.command({type:'simulation',enabled:true,speed:80},snapshot.state.revision,cookie)).status).toBe(200);snapshot=app.controller.adminSnapshot();expect(snapshot.clock).toMatchObject({marketNow:97000,paused:true,rate:0,speed:80});
  await app.command({type:'pause',paused:false},snapshot.state.revision,cookie);snapshot=app.controller.adminSnapshot();await app.command({type:'crash'},snapshot.state.revision,cookie);snapshot=app.controller.adminSnapshot();const prices=snapshot.state.prices;
  expect((await app.command({type:'simulation',enabled:true,speed:43},snapshot.state.revision,cookie)).status).toBe(200);snapshot=app.controller.adminSnapshot();expect(snapshot.clock).toMatchObject({rate:1,speed:43});expect(snapshot.state.prices).toEqual(prices);
  app.time(12000);await app.controller.tick();snapshot=app.controller.adminSnapshot();expect(snapshot.state.phase).toBe('crash');expect(snapshot.clock.rate).toBe(43);
  expect((await app.command({type:'simulation',enabled:true,speed:19},snapshot.state.revision,cookie)).status).toBe(200);expect(app.controller.adminSnapshot().clock.rate).toBe(19);
  for(const speed of [0,501,1.5])expect((await app.command({type:'simulation',enabled:true,speed},app.controller.adminSnapshot().state.revision,cookie)).status).toBe(400);
});
it('legacy_timed_slots_remain_durable_but_publish_only_on_admin_command',async()=>{
  let saved:MarketState|null=createMarket(makeConfiguration([makeDrink()]),0,()=>5/14),wall=0;
  saved.schedule.pending.forEach((slot,i)=>slot.offsetMs=3460000+i*1000000);
  const repository={load:async()=>saved,save:async(state:MarketState)=>{validateStoredMarket(state);saved=structuredClone(state);}};
  const controller=await createController(repository,{now:()=>wall,rng:()=>5/14,drinks:[makeDrink()]});
  await controller.dispatch({type:'simulation',enabled:true,speed:120},0);await controller.dispatch({type:'start'},1);
  wall=2000;await controller.tick();let snapshot=controller.adminSnapshot();expect(snapshot.state.phase).toBe('normal');expect(snapshot.state.schedule.done).toHaveLength(0);
  snapshot=await controller.dispatch({type:'step'},snapshot.state.revision);expect(snapshot.state.nextKind).toBe('normal');expect(snapshot.clock.marketNow).toBe(1190000);
  wall=12000;await controller.tick();snapshot=controller.adminSnapshot();expect(snapshot.state.phase).toBe('normal');expect(snapshot.state.schedule.done).toHaveLength(0);
  snapshot=await controller.dispatch({type:'special',specialId:'bier-down'},snapshot.state.revision);expect(snapshot.state.nextKind).toBe('special');
  wall=22000;await controller.tick();snapshot=controller.adminSnapshot();expect(snapshot.state.schedule.done).toHaveLength(1);expect(snapshot.clock.rate).toBe(120);
  const reset=await controller.dispatch({type:'reset',kind:'evening'},snapshot.state.revision);expect(reset.state.phase).toBe('ready');expect(reset.clock.mode).toBe('live');
});
it('simulation_boundary_between_ticks_shows_full_transition', async () => {
  const app=await openApp(); const cookie=await app.cookie();
  expect((await app.command({type:'simulation',enabled:true,speed:120},0,cookie)).status).toBe(200);
  await app.command({type:'start'},1,cookie); app.time(9917); await app.controller.tick();
  const time=await (await fetch(app.base+'/api/time')).json();
  expect(time.clock).toMatchObject({mode:'simulation',rate:1,marketNow:1_190_000});
  app.time(19_916); await app.controller.tick(); expect(app.controller.publicSnapshot().state.phase).toBe('transition');
  app.time(19_917); await app.controller.tick(); expect(app.controller.publicSnapshot().state.deadline).toBe(2_400_000);
});
it('simulation_five_hours_does_not_expire_login', async () => {
  const app=await openApp(); const cookie=await app.cookie();
  expect((await app.command({type:'simulation',enabled:true,speed:120},0,cookie)).status).toBe(200);
  await app.command({type:'start'},1,cookie);
  let wall=0; let snapshot:any=app.controller.adminSnapshot();
  for (let i=0; i<60 && snapshot.clock.marketNow<18_000_000; i++) {
    if (snapshot.state.phase === 'transition') { wall+=10_000; app.time(wall); await app.controller.tick(); }
    else expect((await app.command({type:'step'},snapshot.state.revision,cookie)).status).toBe(200);
    snapshot=app.controller.adminSnapshot();
  }
  expect(snapshot.clock.marketNow).toBeGreaterThanOrEqual(18_000_000);
  expect((await fetch(app.base+'/api/admin/state',{headers:{Cookie:cookie}})).status).toBe(200);
});
it('simulation_restart_pauses_durable_anchor', async () => {
  let saved:MarketState|null=null; let now=0;
  const store={load:async():Promise<MarketState|null>=>structuredClone(saved),save:async(s:MarketState)=>{saved=structuredClone(s);}};
  const options={now:()=>now,rng:midpointRng,drinks:[makeDrink()]};
  const first=await createController(store,options);
  await first.dispatch({type:'simulation',enabled:true,speed:60},0); await first.dispatch({type:'start'},1);
  now=5000; await first.tick(); const anchor=(await store.load())!.clock.marketAnchor; now=900_000;
  await createController(store,options);
  expect((await store.load())!.clock).toMatchObject({paused:true,rate:0,marketAnchor:anchor});
});
