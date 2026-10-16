import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { DomainError, type CommandRequest, type MarketCommand } from '../domain/types.js';
import { RevisionConflictError, type MarketController } from './controller.js';
import { createAuth, isAllowedOrigin } from './auth.js';
import {createLoginLimiter,loginClientKey} from './login-limit.js';
import { attachRealtime } from './realtime.js';
import {isSimulationSpeed} from '../domain/simulation-speed.js';
import {isMarketVolatility,isMarketVolatilityPercent,isMarketAveragePercent,isMarketReversionPercent} from '../domain/parameters.js';
import type { ServerConfig } from './config.js';
class HttpError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function json(response: ServerResponse, status: number, value: unknown) { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(value)); }
function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolveBody, reject) => {
    let length = 0; const chunks: Buffer[] = []; let oversized = false;
    request.on('data', (chunk: Buffer) => { length += chunk.length; if (length > 65_536) { oversized = true; chunks.length = 0; } else if (!oversized) chunks.push(chunk); });
    request.on('error', reject);
    request.on('end', () => {
      if (oversized) { reject(new HttpError(413, 'BODY_TOO_LARGE', 'Die Eingabe ist zu groß.')); return; }
      try { const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!record(value)) throw Error(); resolveBody(value); }
      catch { reject(new HttpError(400, 'INVALID_INPUT', 'Bitte gültige Eingabedaten senden.')); }
    });
  });
}
function parseCommand(value: Record<string, unknown>): CommandRequest {
  if (!Number.isSafeInteger(value.expectedRevision) || (value.expectedRevision as number) < 0 || !record(value.command) || typeof value.command.type !== 'string') throw new HttpError(400, 'INVALID_INPUT', 'Der Bedienbefehl ist ungültig.');
  const command = value.command;
  const invalid = () => { throw new HttpError(400, 'INVALID_INPUT', 'Der Bedienbefehl ist ungültig.'); };
  switch (command.type) {
    case 'start': case 'crash': case 'cancel-crash': case 'step':case 'skip-transition':case 'skip-intro': break;
    case 'ticker-speed':if(!Number.isSafeInteger(command.rowMs))invalid();break;
    case 'market-reversion':if(!isMarketReversionPercent(command.percent))invalid();break;
    case 'market-average':if(!isMarketAveragePercent(command.percent))invalid();break;
    case 'market-volatility':if('percent' in command ? !isMarketVolatilityPercent(command.percent)||'factor' in command : !isMarketVolatility(command.factor))invalid();break;
    case 'chart-mode':if(!['line','bars','bars-gap'].includes(String(command.mode)))invalid();break;
    case 'ticker-columns':if(command.columns!==2&&command.columns!==3)invalid();break;
    case 'view': if (command.mode !== 'overview' && command.mode !== 'ticker') invalid(); break;
    case 'override': if (!['normal', 'crash'].includes(String(command.scope)) || typeof command.drinkId !== 'string' || (command.value !== null && (typeof command.value !== 'number' || !Number.isSafeInteger(command.value)))) invalid(); break;
    case 'configure': if (!Array.isArray(command.drinks) || (command.parameters !== undefined && !record(command.parameters)) || (command.specials !== undefined && !Array.isArray(command.specials)) || (command.specialOrder !== undefined && !Array.isArray(command.specialOrder))) invalid(); break;
    case 'correct': if (typeof command.drinkId !== 'string' || !Number.isSafeInteger(command.value)) invalid(); break;
    case 'special': if (typeof command.specialId !== 'string') invalid(); break;
    case 'reset': if (command.kind !== 'evening' && command.kind !== 'factory') invalid(); break;
    case 'simulation': if (typeof command.enabled !== 'boolean' || (command.speed !== undefined && !isSimulationSpeed(command.speed))) invalid(); break;
    case 'pause': if (typeof command.paused !== 'boolean') invalid(); break;
    default: invalid();
  }
  return { expectedRevision: value.expectedRevision as number, command: command as unknown as MarketCommand };
}
export function createApplication(config: ServerConfig, controller: MarketController, now: () => number,loginNow:()=>number=Date.now) {
  const auth = createAuth(config),loginLimiter=createLoginLimiter(loginNow);
  function checkLoginLimit(key:string,retryAfter=loginLimiter.retryAfter(key),response:ServerResponse){if(retryAfter>0){response.setHeader('Retry-After',String(retryAfter));throw new HttpError(429,'LOGIN_RATE_LIMITED',`Zu viele falsche Anmeldeversuche. Bitte in ${Math.ceil(retryAfter/60)} Minuten erneut versuchen.`);}}
  let checkSessions = () => {};
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('X-Content-Type-Options', 'nosniff');
    void handle(request, response).catch(error => {
      if (response.headersSent) { response.end(); return; }
      const status = error instanceof HttpError ? error.status : error instanceof RevisionConflictError ? 409 : error instanceof DomainError ? (error.code === 'LOCKED' || error.code === 'INVALID_PHASE' ? 409 : 400) : 503;
      const code = error instanceof HttpError || error instanceof DomainError ? error.code : error instanceof RevisionConflictError ? 'REVISION_CONFLICT' : 'STORAGE_ERROR';
      json(response, status, { code, message: status === 503 ? 'Der Markt konnte nicht gespeichert werden. Die bisherigen Werte bleiben erhalten. Bitte erneut versuchen.' : error.message });
    });
  });
  async function handle(request: IncomingMessage, response: ServerResponse) {
    let path: string;
    try { path = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname); }
    catch { throw new HttpError(400, 'INVALID_INPUT', 'Ungültige Adresse.'); }
    const method = request.method || 'GET';
    if (method === 'GET' && path === '/health') { json(response, 200, { status: 'ok' }); return; }
    if (method === 'GET' && path === '/api/time') { json(response, 200, controller.timeSnapshot()); return; }
    if (method === 'GET' && path === '/api/state') { json(response, 200, controller.publicSnapshot()); return; }
    if(method==='GET'&&path==='/api/admin/session'){json(response,200,{authenticated:auth.isAdmin(request.headers.cookie)});return;}
    if (method === 'GET' && path === '/api/admin/state') { requireAdmin(request); json(response, 200, controller.adminSnapshot()); return; }
    if (method === 'POST' && path === '/api/login') {
      requireOrigin(request);const client=loginClientKey(request,config);checkLoginLimit(client,undefined,response);const input=await body(request);
      if (typeof input.password !== 'string') throw new HttpError(400, 'INVALID_INPUT', 'Bitte ein Passwort eingeben.');
      checkLoginLimit(client,undefined,response);const cookie=auth.login(input.password);
      if(!cookie){checkLoginLimit(client,loginLimiter.failure(client),response);throw new HttpError(401,'UNAUTHORIZED','Das Passwort ist nicht korrekt.');}
      loginLimiter.success(client);
      response.setHeader('Set-Cookie', cookie); json(response, 200, controller.adminSnapshot()); return;
    }
    if (method === 'POST' && path === '/api/logout') {
      requireAdmin(request); requireOrigin(request); response.setHeader('Set-Cookie', auth.clearCookie(request.headers.cookie)); checkSessions(); response.writeHead(204); response.end(); return;
    }
    if (method === 'POST' && path === '/api/admin/commands') {
      requireAdmin(request); requireOrigin(request); const input = parseCommand(await body(request));
      const snapshot = await controller.dispatch(input.command, input.expectedRevision); json(response, 200, snapshot); return;
    }
    if (method !== 'GET' || path.startsWith('/api/') || path.startsWith('/ws/') || path.startsWith('/__test/')) throw new HttpError(404, 'NOT_FOUND', 'Diese Seite ist nicht vorhanden.');
    if (path === '/') { response.writeHead(302, { Location: '/display' }); response.end(); return; }
    const document = path === '/admin' || path === '/admin/' ? '/admin/index.html' : path === '/display' || path === '/display/' ? '/display/index.html' : path==='/bar-display'||path==='/bar-display/'?'/bar-display/index.html':path;
    const root = resolve(config.clientDir); const target = resolve(root, `.${document}`);
    if (!target.startsWith(root + sep)) throw new HttpError(403, 'FORBIDDEN', 'Zugriff auf diese Datei ist nicht erlaubt.');
    try {
      const [canonicalRoot, canonicalFile] = await Promise.all([realpath(root), realpath(target)]);
      if (!canonicalFile.startsWith(canonicalRoot + sep)) throw new HttpError(403, 'FORBIDDEN', 'Zugriff auf diese Datei ist nicht erlaubt.');
      const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2','.webm':'video/webm','.mp4':'video/mp4','.m4a':'audio/mp4','.png':'image/png' };
      const data=await readFile(canonicalFile),type=mime[extname(canonicalFile)]||'application/octet-stream',media=['.mp4','.webm','.m4a'].includes(extname(canonicalFile));
      if(media){
        const range=request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
        if(range&&(range[1]||range[2])){
          const suffix=range[1]==='',requestedStart=suffix?Math.max(0,data.length-Number(range[2])):Number(range[1]),requestedEnd=suffix||range[2]===''?data.length-1:Number(range[2]);
          if(!Number.isSafeInteger(requestedStart)||!Number.isSafeInteger(requestedEnd)||suffix&&(!Number.isSafeInteger(Number(range[2]))||Number(range[2])<=0)||requestedStart>=data.length||requestedStart>requestedEnd){response.writeHead(416,{'Content-Range':`bytes */${data.length}`,'Accept-Ranges':'bytes'});response.end();return;}
          const end=Math.min(requestedEnd,data.length-1);response.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':end-requestedStart+1,'Content-Range':`bytes ${requestedStart}-${end}/${data.length}`});response.end(data.subarray(requestedStart,end+1));return;
        }
      }
      response.writeHead(200,{'Content-Type':type,'Content-Length':data.length,...(media?{'Accept-Ranges':'bytes'}:{})});response.end(data);
    } catch (error) {
      if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes((error as NodeJS.ErrnoException).code || '')) throw new HttpError(404, 'NOT_FOUND', 'Diese Seite ist nicht vorhanden.');
      throw error;
    }
  }
  function requireAdmin(request: IncomingMessage) { if (!auth.isAdmin(request.headers.cookie)) throw new HttpError(401, 'UNAUTHORIZED', 'Bitte zuerst anmelden.'); }
  function requireOrigin(request: IncomingMessage) { if (!isAllowedOrigin(request, config)) throw new HttpError(403, 'FORBIDDEN', 'Diese Anfrage kommt nicht von der Steueroberfläche.'); }
  const realtime = attachRealtime(server, controller, auth, config);
  checkSessions = realtime.revalidate;
  return { server, async close() { await realtime.close(); if (server.listening) await new Promise<void>(resolveClose => server.close(() => resolveClose())); } };
}
