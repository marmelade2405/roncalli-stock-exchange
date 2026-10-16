import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { DomainError, type CommandRequest, type MarketCommand } from '../domain/types.js';
import { RevisionConflictError, type MarketController } from './controller.js';
import { createAuth, isAllowedOrigin } from './auth.js';
import { attachRealtime } from './realtime.js';
import {isSimulationSpeed} from '../domain/simulation-speed.js';
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
    case 'start': case 'crash': case 'cancel-crash': case 'step':case 'skip-transition': break;
    case 'ticker-speed':if(!Number.isSafeInteger(command.rowMs))invalid();break;
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
export function createApplication(config: ServerConfig, controller: MarketController, now: () => number) {
  const auth = createAuth(config);
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
      requireOrigin(request); const input = await body(request);
      if (typeof input.password !== 'string') throw new HttpError(400, 'INVALID_INPUT', 'Bitte ein Passwort eingeben.');
      const cookie = auth.login(input.password);
      if (!cookie) throw new HttpError(401, 'UNAUTHORIZED', 'Das Passwort ist nicht korrekt.');
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
      const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
      const data = await readFile(canonicalFile); response.writeHead(200, { 'Content-Type': mime[extname(canonicalFile)] || 'application/octet-stream' }); response.end(data);
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
