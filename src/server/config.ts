import { resolve } from 'node:path';
export interface ServerConfig {
  host: string; port: number; stateFile: string; adminPassword: string; sessionSecret: string;
  publicOrigin: string | null; secureCookies: boolean; clientDir: string; loginIpHeader?: 'cf-connecting-ip' | 'x-real-ip';
}
export function readConfig(env: NodeJS.ProcessEnv): ServerConfig {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8) throw Error('ADMIN_PASSWORD muss mindestens acht Zeichen enthalten. Bitte die lokale .env-Datei ausfüllen.');
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw Error('SESSION_SECRET muss mindestens 32 Zeichen enthalten.');
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('PORT muss zwischen 1 und 65535 liegen.');
  const loginIpHeader=env.LOGIN_IP_HEADER?.trim().toLowerCase()||undefined;
  if(loginIpHeader!==undefined&&loginIpHeader!=='cf-connecting-ip'&&loginIpHeader!=='x-real-ip')throw Error('LOGIN_IP_HEADER muss leer, cf-connecting-ip oder x-real-ip sein.');
  const publicOrigin = env.PUBLIC_ORIGIN?.trim() || null;
  if (publicOrigin && (new URL(publicOrigin).origin !== publicOrigin || !/^https?:\/\//.test(publicOrigin))) throw Error('PUBLIC_ORIGIN muss eine vollständige HTTP- oder HTTPS-Adresse ohne Pfad sein.');
  return { loginIpHeader,host: env.HOST || '0.0.0.0', port, stateFile: resolve(env.STATE_FILE || './data/market.json'), adminPassword: env.ADMIN_PASSWORD, sessionSecret: env.SESSION_SECRET, publicOrigin, secureCookies: publicOrigin?.startsWith('https://') ?? false, clientDir: resolve('dist/client') };
}
