import { test, expect } from './fixtures.js';
async function ready(page: import('@playwright/test').Page) { await page.goto('/display'); await expect(page.getByTestId('display-price-bier')).toContainText('2,00', { timeout: 1500 }); }
test('two_displays_share_prices_and_countdown', async ({ page, context, testApp }) => {
  await ready(page); const second = await context.newPage(); await testApp.attachPage(second); await ready(second);
  await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-countdown')).toHaveText('20:00');
  await expect(second.getByTestId('display-countdown')).toHaveText('20:00');
  await expect(second.getByTestId('display-price-bier')).toHaveText(await page.getByTestId('display-price-bier').textContent() ?? '');
});
test('admin_mode_switch_updates_both_displays', async ({ page, context, testApp }) => {
  await ready(page); const second = await context.newPage(); await testApp.attachPage(second); await ready(second);
  await testApp.externalCommand({ type: 'view', mode: 'ticker' });
  await expect(page.getByTestId('display-ticker')).toBeVisible(); await expect(second.getByTestId('display-ticker')).toBeVisible();
  await expect(page.getByTestId('display-overview')).toBeHidden();
});
test('transition_contains_no_visible_price_or_delta', async ({ page, testApp }) => {
  await ready(page); await testApp.externalCommand({ type: 'start' });
  await testApp.advanceTo(1_190_000);
  await expect(page.getByTestId('display-transition')).toBeVisible();
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
  await expect(page.locator('[data-delta]:visible')).toHaveCount(0);
  await testApp.advanceTo(1_200_000);
  await expect(page.getByTestId('display-overview')).toBeVisible();
});
test('ticker_duplicates_never_leak_old_prices', async ({ page, testApp }) => {
  await ready(page); await testApp.externalCommand({ type: 'view', mode: 'ticker' }); await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-ticker')).toBeVisible();
  await testApp.advanceTo(1_190_000);
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
  await expect(page.getByTestId('display-transition')).toBeVisible();
});
test('device_date_does_not_change_market_time', async ({ page, testApp }) => {
  await ready(page); await testApp.externalCommand({ type: 'start' }); await page.clock.setSystemTime(new Date('2099-01-01T00:00:00Z'));
  await testApp.advanceTo(1000); await expect(page.getByTestId('display-countdown')).toHaveText('19:59');
});
test('first_round_has_neutral_change', async ({ page, testApp: _testApp }) => {
  await ready(page); await expect(page.getByTestId('display-change-bier')).toHaveText('—');
});
test('disconnected_display_stays_hidden_after_deadline', async ({ page, testApp }) => {
  let block = false;
  await page.routeWebSocket('**/ws/public', socket => { const server = socket.connectToServer(); server.onMessage(message => { if (!block) socket.send(message); }); });
  await ready(page); await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-countdown')).toHaveText('20:00'); block = true;
  await testApp.advanceTo(1_200_000);
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
  await expect(page.getByTestId('display-waiting')).toBeVisible();
});
test('reduced_motion_ticker_shows_all_drinks_and_hides_prices', async ({ page, testApp }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await testApp.externalCommand({ type: 'view', mode: 'ticker' });
  await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-ticker')).toBeVisible();
  const visibleNames = () => page.locator('.ticker-viewport').evaluate(viewport => {
    const box = viewport.getBoundingClientRect();
    return Array.from(viewport.querySelectorAll('.ticker-row')).filter(row => {
      const rect = row.getBoundingClientRect(); return rect.height>0 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1;
    }).map(row => row.querySelector('.ticker-name')!.textContent);
  });
  const first = await visibleNames();
  await testApp.advanceTo(18_000);
  await expect.poll(visibleNames).toContain('Whisky Cola');
  const later = await visibleNames();
  expect(new Set([...first, ...later]).size).toBe(8);
  await testApp.advanceTo(1_190_000);
  await expect(page.getByTestId('display-transition')).toBeVisible();
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
});
test('ten_changes_visible_in_both_modes',async({page,testApp})=>{
  await ready(page);for(let i=1;i<=10;i++){await testApp.advanceTo(i*1000);await testApp.externalCommand({type:'correct',drinkId:'bier',value:i%2?230:240});}
  await expect(page.locator('#overview [data-chart] svg')).toHaveCount(8);await expect(page.locator('#overview [data-chart="bier"] svg')).toHaveAttribute('data-point-count','11');
  await testApp.externalCommand({type:'view',mode:'ticker'});await expect(page.locator('#ticker [data-chart="bier"] svg')).toHaveCount(3);for(const chart of await page.locator('#ticker [data-chart="bier"] svg').all())await expect(chart).toHaveAttribute('data-point-count','11');
});
test('special_shows_news_then_one_changed_price',async({page,testApp})=>{
  await ready(page);await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});
  await expect(page.getByTestId('breaking-news')).toContainText('BREAKING NEWS');await expect(page.getByTestId('breaking-news')).toContainText('SATIRE');
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);await expect(page.locator('[data-delta]:visible')).toHaveCount(0);await expect(page.locator('[data-chart]:visible')).toHaveCount(0);
  await testApp.advanceTo(10000);await expect(page.getByTestId('display-price-bier')).toContainText('1,20');await expect(page.getByTestId('display-price-radler')).toContainText('2,00');await expect(page.getByTestId('display-countdown')).toHaveText('19:50');
});
test('transition_hides_chart_price_and_delta',async({page,testApp})=>{await ready(page);await expect(page.locator('#overview [data-chart] svg')).toHaveCount(8);await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'crash'});await expect(page.getByTestId('display-transition')).toBeVisible();for(const marker of ['price','delta','chart'])await expect(page.locator(`[data-${marker}]:visible`)).toHaveCount(0);});
test('larger_delta_is_readable',async({page,testApp})=>{await page.setViewportSize({width:1920,height:1080});await ready(page);await testApp.externalCommand({type:'correct',drinkId:'bier',value:250});await expect(page.getByTestId('display-change-bier')).toContainText('25,0');expect(await page.getByTestId('display-change-bier').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(30);});
test('simulation_badge_and_rate_match_two_displays',async({page,context,testApp})=>{await ready(page);const second=await context.newPage();await ready(second);await testApp.externalCommand({type:'simulation',enabled:true,speed:60});await testApp.externalCommand({type:'start'});for(const screen of [page,second])await expect(screen.getByTestId('simulation-badge')).toContainText('60×');await testApp.externalCommand({type:'special',specialId:'bier-down'});for(const screen of [page,second])await expect(screen.getByTestId('simulation-badge')).toContainText('1×');});
test('offline_and_silent_frames_hide_values',async({page,testApp})=>{let silent=false;await page.routeWebSocket('**/ws/public',socket=>{const server=socket.connectToServer();server.onMessage(message=>{if(!silent)socket.send(message);});});await ready(page);silent=true;await testApp.advanceTo(16000);for(const marker of ['price','delta','chart'])await expect(page.locator(`[data-${marker}]:visible`)).toHaveCount(0);await expect(page.getByTestId('display-waiting')).toBeVisible();});
test('late_pre_reset_snapshot_does_not_restore_chart',async({page,testApp})=>{let replay:(message:string|Buffer)=>void=()=>{},old:string|Buffer='';await page.routeWebSocket('**/ws/public',socket=>{replay=m=>socket.send(m);const server=socket.connectToServer();server.onMessage(m=>{old=m;socket.send(m);});});await ready(page);await testApp.externalCommand({type:'correct',drinkId:'bier',value:250});await expect(page.locator('#overview [data-chart="bier"] svg')).toHaveAttribute('data-point-count','2');const stale=old;await testApp.externalCommand({type:'reset',kind:'evening'});await expect(page.locator('#overview [data-chart="bier"] svg')).toHaveAttribute('data-point-count','1');replay(stale);await expect(page.getByTestId('display-price-bier')).toContainText('2,00');await expect(page.locator('#overview [data-chart="bier"] svg')).toHaveAttribute('data-point-count','1');});
test('reduced_motion_shows_all_drinks_and_news',async({page,testApp})=>{await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});await expect(page.getByTestId('breaking-news')).toBeVisible();await expect(page.getByTestId('breaking-news')).toContainText('Söder');await testApp.advanceTo(10000);await expect(page.getByTestId('display-price-bier')).toContainText('1,20');});
test('guest_visual_states_at_1080p',async({page,testApp})=>{
  await page.setViewportSize({width:1920,height:1080});await ready(page);
  await testApp.externalCommand({type:'correct',drinkId:'bier',value:250});await expect(page.getByTestId('display-price-bier')).toContainText('2,50');
  await page.screenshot({path:'.artifacts/previews/events-overview.png'});
  await testApp.externalCommand({type:'view',mode:'ticker'});await expect(page.getByTestId('display-ticker')).toBeVisible();await page.screenshot({path:'.artifacts/previews/events-ticker.png'});
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});await expect(page.getByTestId('breaking-news')).toBeVisible();await page.screenshot({path:'.artifacts/previews/events-news.png'});
  await testApp.advanceTo(10000);await testApp.externalCommand({type:'crash'});await testApp.advanceTo(20000);await expect(page.locator('body')).toHaveClass('crash-active');await expect(page.getByTestId('display-ticker')).toBeVisible();await page.screenshot({path:'.artifacts/previews/events-crash.png'});
  await testApp.externalCommand({type:'cancel-crash'});await expect(page.getByTestId('display-transition')).toContainText('erholt');await page.screenshot({path:'.artifacts/previews/events-recovery.png'});
  await testApp.externalCommand({type:'reset',kind:'evening'});await testApp.externalCommand({type:'simulation',enabled:true,speed:60});await testApp.externalCommand({type:'start'});await expect(page.getByTestId('simulation-badge')).toContainText('60×');await page.screenshot({path:'.artifacts/previews/events-simulation.png'});
});
test('generic_news_identifies_the_renamed_affected_drink',async({page,testApp})=>{
  await ready(page);const response=await page.request.post(testApp.baseURL+'/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});expect(response.ok()).toBeTruthy();
  const snapshot=await response.json();const drinks=snapshot.state.config.map((d:import('../../src/domain/model.js').DrinkConfig)=>d.id==='bier'?{...d,name:'Hausbier'}:d);
  const specials=snapshot.state.specials.map((s:import('../../src/domain/model.js').SpecialDefinition)=>s.id==='bier-down'?{...s,headline:'Überraschender Marktschock',body:'Ein unerwartetes Ereignis verändert die Nachfrage.'}:s);
  await testApp.externalCommand({type:'configure',drinks,specials,parameters:snapshot.state.parameters,specialOrder:snapshot.state.specialOrder});await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});
  await expect(page.getByTestId('breaking-news')).toContainText('Überraschender Marktschock');await expect(page.getByTestId('breaking-news-drink')).toHaveText('Hausbier');
});
