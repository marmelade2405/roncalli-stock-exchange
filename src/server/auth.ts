import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { ServerConfig } from './config.js';
export interface AuthService { login(password: string): string | null; isAdmin(cookieHeader: string | undefined): boolean; clearCookie(cookieHeader?: string): string }
const cookieValue = (header?: string) => header?.split(';').map(part => part.trim()).find(part => part.startsWith('market_admin='))?.slice('market_admin='.length);
export function isAllowedOrigin(request: IncomingMessage, config: ServerConfig): boolean {
  return request.headers.origin === (config.publicOrigin ?? `${config.secureCookies ? 'https' : 'http'}://${request.headers.host}`);
}
export function createAuth(config: Pick<ServerConfig, 'adminPassword' | 'sessionSecret' | 'secureCookies'>): AuthService {
  const digest = (text: string) => createHash('sha256').update(text).digest();
  const passwordHash = digest(config.adminPassword);
  const sign = (payload: string) => createHmac('sha256', config.sessionSecret).update(payload).digest('hex');
  const revoked = new Map<string, number>();
  const flags = `Path=/; HttpOnly; SameSite=Strict${config.secureCookies ? '; Secure' : ''}`;
  const prune = () => { const now = Date.now(); for (const [token, expiry] of revoked) if (expiry <= now) revoked.delete(token); };
  return {
    login(password) {
      if (typeof password !== 'string' || !timingSafeEqual(digest(password), passwordHash)) return null;
      prune();
      const payload = `${Date.now() + 43_200_000}.${randomBytes(16).toString('hex')}`;
      return `market_admin=${payload}.${sign(payload)}; Max-Age=43200; ${flags}`;
    },
    isAdmin(header) {
      prune(); const token = cookieValue(header);
      if (!token || token.length > 200 || revoked.has(token)) return false;
      const match = /^(\d+)\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token);
      if (!match || !Number.isSafeInteger(Number(match[1])) || Number(match[1]) <= Date.now()) return false;
      return timingSafeEqual(Buffer.from(sign(`${match[1]}.${match[2]}`), 'hex'), Buffer.from(match[3], 'hex'));
    },
    clearCookie(header) {
      const token = cookieValue(header);
      if (token) revoked.set(token, Number(token.split('.')[0]) || Date.now());
      return `market_admin=; Max-Age=0; ${flags}`;
    },
  };
}
