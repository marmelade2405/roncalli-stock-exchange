import {test,expect} from './fixtures.js';

test('local_crash_video_tracks_fifteen_seconds_pause_and_publication',async({page,testApp})=>{
  await testApp.barList();await page.request.post('/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});await testApp.externalCommand({type:'simulation',enabled:true,speed:8});
  const state=(await(await page.request.get('/api/admin/state')).json()).state;
  await testApp.externalCommand({type:'configure',drinks:state.config,parameters:{...state.parameters,crashIntroMs:15000}});
  await page.setViewportSize({width:1920,height:1080});await page.goto('/display');
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'crash'});
  const intro=page.locator('#transition'),video=intro.locator('.crash-intro-video');
  await expect(video).toBeVisible();await expect(intro.locator('.transition-count')).toHaveText('15');
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(2);
  expect(await video.evaluate((v:HTMLVideoElement)=>v.muted)).toBe(true);
  await testApp.advanceTo(3000);await expect(intro.locator('.transition-count')).toHaveText('12');
  await page.screenshot({path:'.artifacts/previews/crash-original-video.png'});
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(2.5);
  await testApp.externalCommand({type:'pause',paused:true});
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  const position=await video.evaluate((v:HTMLVideoElement)=>v.currentTime);
  await testApp.advanceTo(4000);expect(await video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeCloseTo(position,1);
  await testApp.externalCommand({type:'pause',paused:false});await testApp.advanceTo(11000);
  await expect(intro).toBeVisible();await expect(intro.locator('.transition-count')).toHaveText('05');
  await testApp.advanceTo(16000);await expect(intro).toBeHidden();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  const snapshot=(await(await page.request.get('/api/state')).json()).state;
  expect(snapshot.phase).toBe('crash');expect(snapshot.prices.bier).toBeLessThan(state.prices.bier);
  const media=await page.request.get('/media/crash-intro.mp4');expect(media.headers()['content-type']).toContain('video/mp4');
});

test('crash_video_stops_on_skip_cancel_and_reduced_motion_keeps_the_countdown',async({page,testApp})=>{
  await page.request.post('/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});
  await testApp.externalCommand({type:'simulation',enabled:true});
  const state=(await(await page.request.get('/api/admin/state')).json()).state;
  await testApp.externalCommand({type:'configure',drinks:state.config,parameters:{...state.parameters,crashIntroMs:15000}});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/display');
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'crash'});
  const intro=page.locator('#transition'),video=intro.locator('.crash-intro-video');
  await expect(video).toBeVisible();await expect(intro.locator('.transition-count')).toHaveText('15');
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(2);const still=await video.evaluate((v:HTMLVideoElement)=>v.currentTime);await testApp.advanceTo(3000);await page.clock.runFor(300);await expect(intro.locator('.transition-count')).toHaveText('12');expect(await video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeCloseTo(still,2);
  await testApp.externalCommand({type:'cancel-crash'});await expect(intro).toBeHidden();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  await testApp.externalCommand({type:'crash'});await expect(intro).toBeVisible();
  await intro.getByRole('button',{name:'Preiswechsel überspringen'}).click();
  await expect(intro).toBeHidden();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
});

test('failed_crash_video_leaves_a_readable_title_countdown_and_publication',async({page,testApp})=>{
  await page.request.post('/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});
  await page.route('**/media/crash-intro.mp4',route=>route.abort());
  const state=(await(await page.request.get('/api/admin/state')).json()).state;
  await testApp.externalCommand({type:'configure',drinks:state.config,parameters:{...state.parameters,crashIntroMs:15000}});
  await page.goto('/display');await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'crash'});
  const intro=page.locator('#transition');await expect(intro).toHaveAttribute('data-video-failed','true');
  await expect(intro.locator('.transition-title')).toHaveText('Börsencrash');
  await expect(intro.locator('.transition-count')).toHaveText('15');await expect(intro.locator('.crash-intro-video')).toBeHidden();
  await testApp.advanceTo(15000);await expect(intro).toBeHidden();
});
