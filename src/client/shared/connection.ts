import type { AdminState, MarketCommand, Snapshot, TimeSnapshot } from './protocol.js';
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
  const start = performance.now(); const value = await readJson<TimeSnapshot>('/api/time');
  clock.sync(value, start, performance.now());
}
export function connectMarket<T>(role: 'public' | 'admin', handlers: { onState(snapshot: Snapshot<T>): void; onConnection(connected: boolean): void }): { close(): void } {
  let stopped = false; let socket: WebSocket | null = null; let retry: number | undefined; let attempts = 0; let revision = -1; let generation=-1; let sampledAt=-1;
  const connect = () => {
    if (stopped) return;
    const current = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/${role}`); socket=current;
    current.onopen = () => { attempts = 0; handlers.onConnection(true); };
    current.onmessage = event => {
      let packet: Snapshot<T>;
      try { packet = JSON.parse(event.data); } catch { return; }
      const incoming = (packet?.state as { revision?: number })?.revision;
      if (packet?.type !== 'state' || !Number.isSafeInteger(incoming) || incoming! < revision || !packet.clock || !Number.isSafeInteger(packet.clock.generation)) return;
      if (packet.clock.generation < generation || (packet.clock.generation === generation && packet.clock.sampledAt < sampledAt)) return;
      revision = incoming!; generation=packet.clock.generation; sampledAt=packet.clock.sampledAt; handlers.onState(packet);
    };
    current.onerror = () => current.close();
    current.onclose = () => { handlers.onConnection(false); if (!stopped) retry = window.setTimeout(connect, [1000, 2000, 5000][Math.min(attempts++, 2)]); };
  };
  connect();
  return { close() { stopped = true; if (retry !== undefined) window.clearTimeout(retry); socket?.close(); } };
}
