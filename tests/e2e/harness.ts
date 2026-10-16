import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createRepository } from '../../src/server/repository.js';
import { createController, type MarketController } from '../../src/server/controller.js';
import { createApplication } from '../../src/server/http.js';
import { createMarket } from '../../src/domain/market.js';
import { LEGACY_DRINKS as DEFAULT_DRINKS } from '../fixtures.js';
import {DEFAULT_DRINKS as BAR_DRINKS} from '../../src/domain/defaults.js';
import {createDefaultConfiguration} from '../../src/domain/configuration.js';
import {createSpecialCatalog} from '../../src/domain/news-catalog.js';
const repository = createRepository(resolve('.superpowers/sdd/2026-10-08-stock-market-exchange-events/e2e/market.json'));
let now = 0; let controller!: MarketController; let application: ReturnType<typeof createApplication> | null = null;
async function start(reset: boolean,bar=false) {
  if (application) await application.close();
  if (reset) { now = 0;const config=createDefaultConfiguration(bar?BAR_DRINKS:DEFAULT_DRINKS,()=>.5);if(!bar){config.parameters.newsMs=10000;config.specials=createSpecialCatalog(config.drinks);}await repository.save(createMarket(config, now, () => .5)); }
  controller = await createController({load:()=>repository.load(),save:async state=>{try{await repository.save(state);}catch(error){console.error('Test-store:',(error as Error).message);throw error;}}}, { now: () => now, rng: () => .5, drinks: DEFAULT_DRINKS });
  application = createApplication({ host: '127.0.0.1', port: 4173, stateFile: 'unused', adminPassword: 'test-password', sessionSecret: 'test-only-session-secret'.repeat(3), publicOrigin: null, secureCookies: false, clientDir: resolve('dist/client') }, controller, () => now);
  await new Promise<void>((done, reject) => { application!.server.once('error', reject); application!.server.listen(4173, '127.0.0.1', done); });
}
await start(true);
const controls = createServer((request, response) => { void (async () => {
  if (request.url === '/health') { response.end('ok'); return; }
  const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const input = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  if (request.url === '/reset') await start(true,input.bar===true);
  else if (request.url === '/restart') await start(false);
  else if (request.url === '/advance') { if (!Number.isSafeInteger(input.now) || input.now < now) throw Error('Invalid test time'); now = input.now; await controller.tick(); }
  else { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ now }));
})().catch(error => { response.writeHead(500); response.end(String(error)); }); });
controls.listen(4174, '127.0.0.1');
let stopping = false;
const stop = () => { if (stopping) return; stopping = true; void application?.close().then(() => controls.close()); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
