import { expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { request } from 'node:http';
import { openApp } from './app-fixture.js';
import type { Snapshot, DisplayState } from '../../src/domain/types.js';
function next(socket: WebSocket): Promise<Snapshot<DisplayState>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Keine Zustandsnachricht empfangen.')), 1500);
    socket.once('message', data => { clearTimeout(timer); resolve(JSON.parse(data.toString())); });
    socket.once('error', error => { clearTimeout(timer); reject(error); });
  });
}
it('public_socket_with_admin_cookie_has_no_preview', async () => {
  const app = await openApp();
  const socket = new WebSocket(`${app.base.replace('http', 'ws')}/ws/public`, { headers: { Cookie: await app.cookie(), Origin: app.base } });
  const snapshot = await next(socket);
  expect(snapshot.state).not.toHaveProperty('previews');
  expect(snapshot.state).not.toHaveProperty('pendingPrices');
  socket.close();
});
it('two_displays_receive_same_revision', async () => {
  const app = await openApp();
  const a = new WebSocket(`${app.base.replace('http', 'ws')}/ws/public`); const b = new WebSocket(`${app.base.replace('http', 'ws')}/ws/public`);
  await Promise.all([next(a), next(b)]);
  const updates = Promise.all([next(a), next(b)]);
  await app.controller.dispatch({ type: 'view', mode: 'ticker' }, 0);
  const snapshots = await updates;
  expect(snapshots.map(s => s.state.revision)).toEqual([1, 1]);
  expect(snapshots.map(s => s.state.viewMode)).toEqual(['ticker', 'ticker']);
  a.close(); b.close();
});
it('admin_socket_requires_session', async () => {
  const app = await openApp();
  const socket = new WebSocket(`${app.base.replace('http', 'ws')}/ws/admin`, { headers: { Origin: app.base } });
  const accepted = await new Promise<boolean>(resolve => { socket.once('open', () => resolve(true)); socket.once('error', () => resolve(false)); });
  socket.close();
  expect(accepted).toBe(false);
});
it('malformed_upgrade_target_is_rejected_without_stopping_server', async () => {
  const app = await openApp();
  const status = await new Promise<number | undefined>((resolve, reject) => {
    const req = request(app.base, {
      path: 'http://[',
      headers: { Connection: 'Upgrade', Upgrade: 'websocket' },
    }, response => { response.resume(); resolve(response.statusCode); });
    req.setTimeout(1000, () => req.destroy(Error('Upgrade request did not finish.')));
    req.on('error', reject);
    req.end();
  });
  expect(status).toBe(400);
  expect((await fetch(`${app.base}/health`)).status).toBe(200);
});
