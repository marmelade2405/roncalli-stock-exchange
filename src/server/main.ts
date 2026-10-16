import { readConfig } from './config.js';
import { createRepository } from './repository.js';
import { createController } from './controller.js';
import { createApplication } from './http.js';
import { DEFAULT_DRINKS } from '../domain/defaults.js';
const epoch = Date.now(); const start = performance.now();
const now = () => Math.floor(epoch + performance.now() - start);
try {
  const config = readConfig(process.env);
  const controller = await createController(createRepository(config.stateFile), { now, rng: Math.random, drinks: DEFAULT_DRINKS });
  const app = createApplication(config, controller, now);
  let ticking = false;
  const timer = setInterval(() => { if (ticking) return; ticking = true; void controller.tick().catch(() => console.error('Preiswechsel konnte nicht gespeichert werden. Bitte Server und Speicher prüfen.')).finally(() => { ticking = false; }); }, 250);
  app.server.on('error', error => { console.error(`Serverstart fehlgeschlagen: ${error.message}`); clearInterval(timer); void app.close(); process.exitCode = 1; });
  app.server.listen(config.port, config.host, () => console.log(`Stock Market Exchange läuft auf Port ${config.port}. Steuerung: /admin · Gäste: /display`));
  let closing = false;
  const stop = () => { if (closing) return; closing = true; clearInterval(timer); void app.close(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (error) { console.error(`Start fehlgeschlagen: ${(error as Error).message}`); process.exitCode = 1; }
