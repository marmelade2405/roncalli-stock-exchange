import { expect, it } from 'vitest';
import { openApp } from './app-fixture.js';
it('market_volatility_percent_requires_admin_and_rejects_fractional_or_ambiguous_input',async()=>{
 const app=await openApp();expect((await app.command({type:'market-volatility',percent:40},0,'')).status).toBe(401);const cookie=await app.cookie();for(const percent of[-1,76,40.5,'40'])expect((await app.command({type:'market-volatility',percent},0,cookie)).status).toBe(400);expect((await app.command({type:'market-volatility',percent:40,factor:1},0,cookie)).status).toBe(400);expect((await app.command({type:'market-volatility',percent:40},0,cookie)).status).toBe(200);expect(app.controller.adminSnapshot().state.parameters.marketVolatilityPercent).toBe(40);
});
it('market_volatility_requires_admin_and_rejects_invalid_factors',async()=>{
 const app=await openApp();expect((await app.command({type:'market-volatility',factor:.5},0,'')).status).toBe(401);const cookie=await app.cookie();expect((await app.command({type:'market-volatility',factor:3.05},0,cookie)).status).toBe(400);expect((await app.command({type:'market-volatility',factor:.5},0,cookie)).status).toBe(200);expect(app.controller.adminSnapshot().state.parameters.marketVolatility).toBe(.5);expect((await app.command({type:'market-volatility',factor:1},0,cookie)).status).toBe(409);
});
it('local_media_supports_byte_ranges_for_video_seeking',async()=>{
 const app=await openApp(),response=await fetch(app.base+'/media/breaking-news-intro.webm',{headers:{Range:'bytes=0-31'}});expect(response.status).toBe(206);expect(response.headers.get('accept-ranges')).toBe('bytes');expect(response.headers.get('content-range')).toMatch(/^bytes 0-31\/\d+$/);expect((await response.arrayBuffer()).byteLength).toBe(32);
 const invalid=await fetch(app.base+'/media/breaking-news-intro.webm',{headers:{Range:'bytes=999999999-'}});expect(invalid.status).toBe(416);expect(invalid.headers.get('content-range')).toMatch(/^bytes \*\/\d+$/);
});
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
