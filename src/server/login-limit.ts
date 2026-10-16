import {isIP} from 'node:net';
import type {IncomingMessage} from 'node:http';
import type {ServerConfig} from './config.js';
export const LOGIN_FAILURE_LIMIT=10;
export const LOGIN_LOCK_MS=60*60*1000;
function addressKey(address:string):string|null{
  if(isIP(address)===4)return address;
  if(isIP(address)!==6)return null;
  const canonical=new URL(`http://[${address.split('%')[0]}]`).hostname.slice(1,-1);
  if(canonical.startsWith('::ffff:')){
    const parts=canonical.slice(7).split(':');
    if(parts.length===2){const high=parseInt(parts[0],16),low=parseInt(parts[1],16);return `${high>>8}.${high&255}.${low>>8}.${low&255}`;}
  }
  // IPv6 privacy addresses within one /64 share a limit, like devices behind IPv4 NAT.
  const [left,right='']=canonical.split('::'),a=left?left.split(':'):[],b=right?right.split(':'):[];
  const groups=canonical.includes('::')?[...a,...Array(8-a.length-b.length).fill('0'),...b]:a;
  return groups.slice(0,4).map(part=>parseInt(part,16).toString(16)).join(':')+'::/64';
}
export function loginClientKey(request:Pick<IncomingMessage,'headers'|'socket'>,config:Pick<ServerConfig,'loginIpHeader'>):string{
  const header=config.loginIpHeader?request.headers[config.loginIpHeader]:undefined;
  const forwarded=typeof header==='string'?addressKey(header.trim()):null;
  return forwarded??addressKey(request.socket.remoteAddress??'')??'unknown';
}
export function createLoginLimiter(now:()=>number=Date.now,maxEntries=10000){
  const attempts=new Map<string,{failures:number;expiresAt:number;blockedUntil:number}>();
  let nextPrune=0;
  function current(key:string){
    const time=now();
    if(time>=nextPrune){for(const[id,entry]of attempts)if(entry.expiresAt<=time)attempts.delete(id);nextPrune=time+60000;}
    const entry=attempts.get(key);if(entry&&entry.expiresAt<=time){attempts.delete(key);return undefined;}return entry;
  }
  return{
    retryAfter(key:string){const entry=current(key);if(entry?.blockedUntil)return Math.max(0,Math.ceil((entry.blockedUntil-now())/1000));return !entry&&attempts.size>=maxEntries?3600:0;},
    failure(key:string){const old=current(key),time=now();if(old?.blockedUntil)return Math.max(0,Math.ceil((old.blockedUntil-time)/1000));if(!old&&attempts.size>=maxEntries)return 3600;
      const entry=old??{failures:0,expiresAt:time+LOGIN_LOCK_MS,blockedUntil:0};entry.failures++;
      if(entry.failures>=LOGIN_FAILURE_LIMIT){entry.blockedUntil=time+LOGIN_LOCK_MS;entry.expiresAt=entry.blockedUntil;}
      attempts.set(key,entry);return entry.blockedUntil?3600:0;
    },
    success(key:string){attempts.delete(key);}
  };
}
