import { expect, it } from 'vitest';
import { openApp } from './app-fixture.js';
import { createController } from '../../src/server/controller.js';
import { makeDrink, midpointRng } from '../fixtures.js';
import type { MarketState } from '../../src/domain/model.js';
import {validateStoredMarket} from '../../src/server/market-store.js';
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
  for(const speed of [0,121,1.5])expect((await app.command({type:'simulation',enabled:true,speed},app.controller.adminSnapshot().state.revision,cookie)).status).toBe(400);
});
it('exact_fit_special_boundary_keeps_simulation_durable_and_resettable',async()=>{
  let saved:MarketState|null=null,wall=0;
  const repository={load:async()=>saved,save:async(state:MarketState)=>{validateStoredMarket(state);saved=structuredClone(state);}};
  const controller=await createController(repository,{now:()=>wall,rng:()=>5/14,drinks:[makeDrink()]});
  expect(controller.adminSnapshot().state.schedule.pending[0].offsetMs).toBe(3460000);
  await controller.dispatch({type:'simulation',enabled:true,speed:120},0);await controller.dispatch({type:'start'},1);
  for(wall=250;wall<=49000;wall+=250)await controller.tick();
  wall=49000;const transition=controller.adminSnapshot();expect(transition.state.phase).toBe('transition');expect(transition.state.nextKind).toBe('special');expect(transition.clock).toMatchObject({marketNow:3460000,rate:1});
  wall=58999;await controller.tick();expect(controller.adminSnapshot().state.phase).toBe('transition');
  wall=59000;await controller.tick();const published=controller.adminSnapshot();expect(published.state.schedule.done).toHaveLength(1);expect(published.clock.rate).toBe(120);
  const reset=await controller.dispatch({type:'reset',kind:'evening'},published.state.revision);expect(reset.state.phase).toBe('ready');expect(reset.clock.mode).toBe('live');
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
