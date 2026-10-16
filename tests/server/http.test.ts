import { expect, it } from 'vitest';
import { openApp } from './app-fixture.js';
it('anonymous_mutation_is_401', async () => {
  const app = await openApp();
  expect((await app.command({ type: 'start' }, 0, '')).status).toBe(401);
  expect(app.controller.publicSnapshot().state.phase).toBe('ready');
});
it('invalid_input_is_400', async () => {
  const app = await openApp();
  expect((await app.command({ type: 'override', scope: 'normal', drinkId: 'bier', value: '2.30' }, 0, await app.cookie())).status).toBe(400);
});
it('invalid_phase_or_locked_command_is_409', async () => {
  const app = await openApp(); const cookie = await app.cookie();
  expect((await app.command({ type: 'crash' }, 0, cookie)).status).toBe(409);
  await app.controller.dispatch({ type: 'start' }, 0);
  app.time(1_190_000);
  expect((await app.command({ type: 'override', scope: 'normal', drinkId: 'bier', value: 250 }, 1, cookie)).status).toBe(409);
});
it('stale_revision_is_409', async () => {
  const app = await openApp();
  expect((await app.command({ type: 'start' }, 40, await app.cookie())).status).toBe(409);
});
it('failed_storage_is_503', async () => {
  const app = await openApp(); const cookie = await app.cookie(); app.fault(true);
  expect((await app.command({ type: 'start' }, 0, cookie)).status).toBe(503);
  expect(app.controller.publicSnapshot().state.phase).toBe('ready');
});
it('foreign_origin_is_rejected', async () => {
  const app = await openApp();
  expect((await app.command({ type: 'start' }, 0, await app.cookie(), 'https://other.invalid')).status).toBe(403);
});
it('wrong_password_is_rejected_and_private_api_is_protected', async () => {
  const app = await openApp();
  expect((await app.login('wrong-password')).status).toBe(401);
  expect((await fetch(`${app.base}/api/admin/state`)).status).toBe(401);
});
it('public_http_never_exposes_previews', async () => {
  const app = await openApp(); const response = await fetch(`${app.base}/api/state`); const snapshot = await response.json();
  expect(snapshot.state).not.toHaveProperty('previews');
  expect(snapshot.state).not.toHaveProperty('overrides');
});
it('session_capability_and_skip_commands_do_not_grant_guest_market_control',async()=>{
  const app=await openApp();expect(await(await fetch(`${app.base}/api/admin/session`)).json()).toEqual({authenticated:false});const cookie=await app.cookie();expect(await(await fetch(`${app.base}/api/admin/session`,{headers:{Cookie:cookie}})).json()).toEqual({authenticated:true});
  expect((await app.command({type:'skip-transition'},0,'')).status).toBe(401);expect((await app.command({type:'ticker-speed',rowMs:1000},0,'')).status).toBe(401);expect((await app.command({type:'skip-transition'},0,cookie)).status).toBe(409);expect((await app.command({type:'ticker-speed',rowMs:0},0,cookie)).status).toBe(400);
});
it('static_path_cannot_escape_client_directory', async () => {
  const app = await openApp();
  const response = await fetch(`${app.base}/..%2f..%2fpackage.json`);
  expect([403, 404]).toContain(response.status);
  expect(await response.text()).not.toContain('stock-market-exchange');
});
