import { afterEach } from 'vitest';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { createController } from '../../src/server/controller.js';
import { createApplication } from '../../src/server/http.js';
import type { MarketState, MarketCommand } from '../../src/domain/types.js';
import { makeDrink, midpointRng } from '../fixtures.js';
import {createMarket} from '../../src/domain/market-v2.js';
import {makeConfiguration} from '../v2-fixtures.js';
const opened: ReturnType<typeof createApplication>[] = [];
afterEach(async () => { await Promise.all(opened.splice(0).map(app => app.close())); });
export async function openApp(options:{loginNow?:()=>number;loginIpHeader?:'cf-connecting-ip'|'x-real-ip'}={}) {
  let saved: MarketState | null = createMarket(makeConfiguration([makeDrink()]),0,midpointRng); let fault = false; let now = 0;
  const repository = { load: async () => structuredClone(saved), save: async (state: MarketState) => { if (fault) throw Error('Storage failed'); saved = structuredClone(state); } };
  const controller = await createController(repository, { now: () => now, rng: midpointRng, drinks: [makeDrink()] });
  const app = createApplication({ loginIpHeader:options.loginIpHeader,host: '127.0.0.1', port: 0, stateFile: 'unused', adminPassword: 'test-password', sessionSecret: 'test-only-secret-'.repeat(4), publicOrigin: null, secureCookies: false, clientDir: resolve('dist/client') }, controller, () => now,options.loginNow);
  opened.push(app);
  await new Promise<void>((resolveListen, reject) => { app.server.once('error', reject); app.server.listen(0, '127.0.0.1', () => resolveListen()); });
  const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  const login = async (password = 'test-password') => fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ password }) });
  const cookie = async () => (await login()).headers.get('set-cookie')?.split(';')[0] ?? '';
  const command = async (command: MarketCommand | Record<string, unknown>, revision: number, token: string, origin = base) => fetch(`${base}/api/admin/commands`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: token, Origin: origin }, body: JSON.stringify({ command, expectedRevision: revision }) });
  return { base, controller, cookie, login, command, fault: (value: boolean) => { fault = value; }, time: (value: number) => { now = value; } };
}
