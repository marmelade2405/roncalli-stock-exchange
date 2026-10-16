import {expect,it} from 'vitest';
import {createLoginLimiter,LOGIN_LOCK_MS} from '../../src/server/login-limit.js';
import {readConfig} from '../../src/server/config.js';
it('old_partial_attempt_windows_expire_and_new_clients_cannot_grow_memory_without_limit',()=>{
 let now=0;const limiter=createLoginLimiter(()=>now,2);for(let i=0;i<9;i++)expect(limiter.failure('first')).toBe(0);limiter.failure('second');expect(limiter.retryAfter('third')).toBe(3600);expect(limiter.failure('third')).toBe(3600);
 now=LOGIN_LOCK_MS;expect(limiter.retryAfter('third')).toBe(0);expect(limiter.failure('third')).toBe(0);expect(limiter.retryAfter('first')).toBe(0);
});
it('proxy_header_must_be_explicitly_enabled_and_limited_to_a_single_overwritten_header',()=>{
 const env={ADMIN_PASSWORD:'test-only-password',SESSION_SECRET:'test-only-secret'.repeat(4)};
 expect(readConfig(env).loginIpHeader).toBeUndefined();expect(readConfig({...env,LOGIN_IP_HEADER:'CF-Connecting-IP'}).loginIpHeader).toBe('cf-connecting-ip');expect(readConfig({...env,LOGIN_IP_HEADER:'x-real-ip'}).loginIpHeader).toBe('x-real-ip');expect(()=>readConfig({...env,LOGIN_IP_HEADER:'x-forwarded-for'})).toThrow();
});
