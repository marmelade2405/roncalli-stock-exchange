import type { AdminState, MarketCommand, Snapshot } from './protocol.js';
import type { createClock } from './clock.js';
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
export async function readJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...options });
  const value = await response.json();
  if (!response.ok) throw new ApiError(response.status, value.code || 'ERROR', value.message || 'Die Anfrage konnte nicht ausgeführt werden.');
  return value as T;
}
export function sendCommand(command: MarketCommand, expectedRevision: number): Promise<Snapshot<AdminState>> {
  return readJson('/api/admin/commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, expectedRevision }) });
}
export async function syncServerClock(clock: ReturnType<typeof createClock>): Promise<void> {
  const start = performance.now(); const value = await readJson<{ serverNow: number }>('/api/time');
  clock.sync(value.serverNow, start, performance.now());
}
export function connectMarket<T>(role: 'public' | 'admin', handlers: { onState(snapshot: Snapshot<T>): void; onConnection(connected: boolean): void }): { close(): void } {
  let stopped = false; let socket: WebSocket | null = null; let retry: number | undefined; let attempts = 0; let revision = -1;
  const connect = () => {
    if (stopped) return;
    socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/${role}`);
    socket.onopen = () => { attempts = 0; handlers.onConnection(true); };
    socket.onmessage = event => {
      let packet: Snapshot<T>;
      try { packet = JSON.parse(event.data); } catch { return; }
      const incoming = (packet?.state as { revision?: number })?.revision;
      if (packet?.type !== 'state' || !Number.isSafeInteger(incoming) || incoming! < revision) return;
      revision = incoming!; handlers.onState(packet);
    };
    socket.onerror = () => socket?.close();
    socket.onclose = () => { handlers.onConnection(false); if (!stopped) retry = window.setTimeout(connect, [1000, 2000, 5000][Math.min(attempts++, 2)]); };
  };
  connect();
  return { close() { stopped = true; if (retry !== undefined) window.clearTimeout(retry); socket?.close(); } };
}
