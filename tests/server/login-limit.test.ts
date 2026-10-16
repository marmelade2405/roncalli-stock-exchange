import {expect,it} from 'vitest';
import {openApp} from './app-fixture.js';
it('tenth_wrong_password_locks_login_for_one_hour_even_with_the_correct_password',async()=>{
 const app=await openApp();for(let i=0;i<9;i++)expect((await app.login('wrong-password')).status).toBe(401);
 const tenth=await app.login('wrong-password');expect(tenth.status).toBe(429);expect(tenth.headers.get('retry-after')).toBe('3600');expect(await tenth.json()).toMatchObject({code:'LOGIN_RATE_LIMITED'});
 const blocked=await app.login();expect(blocked.status).toBe(429);expect(blocked.headers.get('set-cookie')).toBeNull();
});
it('successful_login_resets_previous_failures_and_existing_sessions_keep_working',async()=>{
 const app=await openApp();for(let i=0;i<9;i++)await app.login('wrong');const cookie=await app.cookie();expect(cookie).not.toBe('');
 for(let i=0;i<9;i++)expect((await app.login('wrong')).status).toBe(401);expect((await app.login('wrong')).status).toBe(429);
 expect((await fetch(app.base+'/api/admin/state',{headers:{Cookie:cookie}})).status).toBe(200);
});
it('spoofed_forwarded_headers_do_not_bypass_local_login_lock',async()=>{
 const app=await openApp();for(let i=0;i<10;i++)await app.login('wrong');
 const response=await fetch(app.base+'/api/login',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json','X-Forwarded-For':'198.51.100.3','X-Real-IP':'198.51.100.4','CF-Connecting-IP':'198.51.100.5'},body:JSON.stringify({password:'test-password'})});expect(response.status).toBe(429);
});
it('concurrent_wrong_logins_cannot_exceed_the_ten_attempt_limit',async()=>{
 const app=await openApp();const results=await Promise.all(Array.from({length:20},()=>app.login('wrong')));expect(results.filter(r=>r.status===401)).toHaveLength(9);expect(results.filter(r=>r.status===429)).toHaveLength(11);
});

it('lock_expires_after_one_real_hour_and_blocked_requests_do_not_extend_it',async()=>{
 let wall=1000;const app=await openApp({loginNow:()=>wall});for(let i=0;i<10;i++)await app.login('wrong');
 app.time(360000000);wall+=3599000;let response=await app.login();expect(response.status).toBe(429);expect(response.headers.get('retry-after')).toBe('1');
 wall+=1000;response=await app.login();expect(response.status).toBe(200);expect(response.headers.get('set-cookie')).toBeTruthy();
});
it('trusted_proxy_clients_have_separate_limits_and_header_spoofing_cannot_rotate_ipv6_addresses',async()=>{
 const app=await openApp({loginIpHeader:'cf-connecting-ip'});
 const login=(address:string,password='wrong')=>fetch(app.base+'/api/login',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json','CF-Connecting-IP':address},body:JSON.stringify({password})});
 for(let i=0;i<10;i++)await login('198.51.100.1');expect((await login('198.51.100.1','test-password')).status).toBe(429);expect((await login('198.51.100.2','test-password')).status).toBe(200);
 for(let i=0;i<10;i++)await login(`2001:db8:abcd:1234::${i+1}`);expect((await login('2001:0db8:abcd:1234:ffff::1','test-password')).status).toBe(429);
 expect((await login('2001:db8:abcd:5678::1','test-password')).status).toBe(200);
});
it('foreign_origin_and_malformed_requests_do_not_lock_out_legitimate_logins',async()=>{
 const app=await openApp();for(let i=0;i<12;i++){expect((await fetch(app.base+'/api/login',{method:'POST',headers:{Origin:'https://foreign.invalid','Content-Type':'application/json'},body:JSON.stringify({password:'wrong'})})).status).toBe(403);expect((await fetch(app.base+'/api/login',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:'{}'})).status).toBe(400);}expect((await app.login()).status).toBe(200);
});
