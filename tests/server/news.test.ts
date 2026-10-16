import { expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { openApp } from './app-fixture.js';
function message(socket: WebSocket, wait=1600): Promise<any> { return new Promise((resolve,reject)=>{ const timer=setTimeout(()=>reject(Error('Missing snapshot')),wait); socket.once('message',data=>{clearTimeout(timer);resolve(JSON.parse(data.toString()));}); socket.once('error',error=>{clearTimeout(timer);reject(error);}); }); }
it('unauthenticated_new_commands_are_rejected', async () => {
  const app=await openApp(); expect((await app.command({type:'correct',drinkId:'bier',value:250},0,'')).status).toBe(401);
});
it('invalid_new_commands_are_rejected', async () => {
  const app=await openApp(); const cookie=await app.cookie();
  expect((await app.command({type:'correct',drinkId:'bier',value:205},0,cookie)).status).toBe(400);
  expect((await app.command({type:'correct',drinkId:'bier',value:250},0,cookie)).status).toBe(200);
});
it('special_publish_failure_keeps_one_use_slot', async () => {
  const app=await openApp(); const cookie=await app.cookie();
  expect((await app.command({type:'start'},0,cookie)).status).toBe(200);
  expect((await app.command({type:'special',specialId:'bier-down'},1,cookie)).status).toBe(200);
  app.time(10_000); app.fault(true); await expect(app.controller.tick()).rejects.toThrow();
  const failed=await (await fetch(app.base+'/api/admin/state',{headers:{Cookie:cookie}})).json();
  expect(failed.state.prices.bier).toBe(200); expect(failed.state.schedule.pending).toHaveLength(2);
  app.fault(false); await app.controller.tick(); await app.controller.tick();
  const published=await (await fetch(app.base+'/api/admin/state',{headers:{Cookie:cookie}})).json();
  expect(published.state.prices.bier).toBe(120); expect(published.state.schedule.done).toHaveLength(1);
});
it('concurrent_direct_special_runs_once', async () => {
  const app=await openApp(); const cookie=await app.cookie(); await app.command({type:'start'},0,cookie);
  const responses=await Promise.all([app.command({type:'special',specialId:'bier-down'},1,cookie),app.command({type:'special',specialId:'bier-down'},1,cookie)]);
  expect(responses.map(x=>x.status).sort()).toEqual([200,409]);
});
it('removed_reorder_commands_cannot_change_pending_news', async () => {
  const app=await openApp(); const cookie=await app.cookie();
  const before=app.controller.adminSnapshot().state.schedule;
  const responses=await Promise.all([app.command({type:'reorder-specials',ids:['bier-up','bier-down']},0,cookie),app.command({type:'reorder-specials',ids:['bier-down','bier-up']},0,cookie)]);
  expect(responses.map(x=>x.status)).toEqual([400,400]);expect(app.controller.adminSnapshot().state.schedule).toEqual(before);
});
it('heartbeat_contains_only_public_projection', async () => {
  const app=await openApp(); const socket=new WebSocket(app.base.replace('http','ws')+'/ws/public');
  await message(socket); const heartbeat=await message(socket,6500);
  expect(heartbeat.clock).toHaveProperty('marketNow'); expect(heartbeat.state).not.toHaveProperty('specials'); expect(heartbeat.state).not.toHaveProperty('previews'); socket.close();
},8000);
it('reset_revision_reaches_connected_displays', async () => {
  const app=await openApp(); const cookie=await app.cookie(); const socket=new WebSocket(app.base.replace('http','ws')+'/ws/public');
  await message(socket); const received=message(socket);
  expect((await app.command({type:'reset',kind:'evening'},0,cookie)).status).toBe(200);
  const snapshot=await received; expect(snapshot.state.runId).toBe(1); expect(snapshot.state.revision).toBeGreaterThan(0); socket.close();
});
it('successful_tick_refreshes_snapshot_after_five_clock_seconds', async () => {
  const app=await openApp(); const socket=new WebSocket(app.base.replace('http','ws')+'/ws/public');
  await message(socket); const received=message(socket); app.time(5000); await app.controller.tick();
  const snapshot=await received; expect(snapshot.serverNow).toBe(5000); expect(snapshot.state.revision).toBe(0); socket.close();
});
