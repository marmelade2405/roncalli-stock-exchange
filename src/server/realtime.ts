import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { isAllowedOrigin, type AuthService } from './auth.js';
import type { ServerConfig } from './config.js';
import type { MarketController } from './controller.js';
export function attachRealtime(server: Server, controller: MarketController, auth: AuthService, config: ServerConfig) {
  const sockets = new WebSocketServer({ noServer: true, perMessageDeflate: false, maxPayload: 65_536 });
  const peers = new Map<WebSocket, { role: 'public' | 'admin'; cookie?: string; alive: boolean }>();
  function revalidate() { for (const [socket, peer] of peers) if (peer.role === 'admin' && !auth.isAdmin(peer.cookie)) socket.close(4401, 'Anmeldung abgelaufen'); }
  server.on('upgrade', (request, socket, head) => {
    let path: string;
    try { path = new URL(request.url || '/', 'http://localhost').pathname; }
    catch { socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'); return; }
    if (path !== '/ws/public' && path !== '/ws/admin') { socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n'); return; }
    const role = path === '/ws/admin' ? 'admin' : 'public';
    if (role === 'admin' && (!auth.isAdmin(request.headers.cookie) || !isAllowedOrigin(request, config))) { socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); return; }
    sockets.handleUpgrade(request, socket, head, ws => {
      const peer: { role: 'public' | 'admin'; cookie?: string; alive: boolean } = { role, cookie: request.headers.cookie, alive: true };
      peers.set(ws, peer);
      ws.on('pong', () => { peer.alive = true; });
      ws.on('close', () => peers.delete(ws));
      ws.on('error', () => ws.terminate());
      ws.send(JSON.stringify(role === 'admin' ? controller.adminSnapshot() : controller.publicSnapshot()));
    });
  });
  const unsubscribe = controller.subscribe(() => {
    revalidate();
    for (const [socket, peer] of peers) if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(peer.role === 'admin' ? controller.adminSnapshot() : controller.publicSnapshot()));
  });
  const heartbeat = setInterval(() => {
    revalidate();
    for (const [socket, peer] of peers) {
      if (!peer.alive) { socket.terminate(); continue; }
      peer.alive = false; if (socket.readyState === WebSocket.OPEN) socket.ping();
    }
  }, 15_000);
  heartbeat.unref();
  const snapshots = setInterval(() => {
    revalidate();
    for (const [socket,peer] of peers) if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(peer.role === 'admin' ? controller.adminSnapshot() : controller.publicSnapshot()));
  },5000);
  snapshots.unref();
  return { revalidate, async close() { clearInterval(heartbeat); clearInterval(snapshots); unsubscribe(); for (const socket of peers.keys()) socket.terminate(); await new Promise<void>(resolve => sockets.close(() => resolve())); } };
}
