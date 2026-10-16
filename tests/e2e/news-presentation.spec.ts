import {test,expect} from './fixtures.js';
test('news_intro_hold_publication_and_tape_are_synchronised',async({page,context,testApp})=>{
  await testApp.barList();await page.setViewportSize({width:1920,height:1080});const second=await context.newPage();await page.goto('/display');await second.goto('/display');for(const screen of [page,second])await expect(screen.getByTestId('display-price-bier')).toContainText('1,80');
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});
  for(const screen of [page,second]){await expect(screen.getByTestId('breaking-news')).toHaveAttribute('data-stage','intro');await expect(screen.locator('[data-price]:visible')).toHaveCount(0);}await testApp.advanceTo(2500);await page.screenshot({path:'.artifacts/previews/news-intro-5s.png'});
  await testApp.advanceTo(4999);await expect(page.getByTestId('breaking-news')).toHaveAttribute('data-stage','intro');await testApp.advanceTo(5000);
  for(const screen of [page,second]){await expect(screen.getByTestId('breaking-news')).toHaveAttribute('data-stage','message');await expect(screen.locator('.news-headline')).toBeVisible();await expect(screen.locator('[data-chart]:visible')).toHaveCount(0);}await page.screenshot({path:'.artifacts/previews/news-message-15s.png'});
  await testApp.advanceTo(19999);await expect(page.locator('[data-price]:visible')).toHaveCount(0);await testApp.advanceTo(20000);
  for(const screen of [page,second]){await expect(screen.getByTestId('breaking-news')).toBeHidden();await expect(screen.getByTestId('news-tape')).toBeVisible();await expect(screen.getByTestId('news-tape')).toContainText('RageCage');await expect(screen.getByTestId('display-price-bier')).toContainText('1,50');await expect(screen.locator('#overview [data-special-highlight="true"]')).toHaveCount(1);}await page.screenshot({path:'.artifacts/previews/news-tape-highlight.png'});
  await page.reload();await expect(page.getByTestId('news-tape')).toBeVisible();await testApp.externalCommand({type:'view',mode:'ticker'});await expect(page.locator('#ticker [data-special-highlight="true"]')).toHaveCount(3);
  await testApp.advanceTo(1200000);await expect(page.getByTestId('news-tape')).toBeHidden();await expect(page.locator('[data-special-highlight="true"]')).toHaveCount(0);
});
test('news_tape_does_not_survive_stale_connection_or_reset',async({page,testApp})=>{
  await testApp.barList();let block=false;await page.routeWebSocket('**/ws/public',socket=>{const server=socket.connectToServer();server.onMessage(message=>{if(!block)socket.send(message);});});
  await page.goto('/display');await expect(page.getByTestId('display-price-bier')).toContainText('1,80');await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});await testApp.advanceTo(20000);await expect(page.getByTestId('news-tape')).toBeVisible();
  block=true;await testApp.advanceTo(36000);await expect(page.getByTestId('news-tape')).toBeHidden();block=false;await testApp.externalCommand({type:'reset',kind:'evening'});await expect(page.getByTestId('display-price-bier')).toContainText('1,80');await expect(page.getByTestId('news-tape')).toBeHidden();
});
test('admin_shows_manual_special_mode',async({page,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await expect(page.getByTestId('special-cadence')).toContainText('Nur manuell');await expect(page.getByTestId('special-cadence')).toContainText('38');
});
test('twenty_second_news_keeps_real_duration_during_simulation_speed_change_and_pause',async({page,testApp})=>{
  await testApp.barList();await page.goto('/display');await expect(page.getByTestId('display-price-bier')).toContainText('1,80');
  await testApp.externalCommand({type:'simulation',enabled:true,speed:120});await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});
  await testApp.advanceTo(2500);await testApp.externalCommand({type:'simulation',enabled:true,speed:37});await expect(page.getByTestId('simulation-badge')).toContainText('1×');await expect(page.getByTestId('breaking-news')).toHaveAttribute('data-stage','intro');
  await testApp.advanceTo(5000);await expect(page.getByTestId('breaking-news')).toHaveAttribute('data-stage','message');await testApp.externalCommand({type:'pause',paused:true});await testApp.advanceTo(35000);await expect(page.getByTestId('breaking-news')).toHaveAttribute('data-stage','message');await expect(page.getByTestId('news-tape')).toBeHidden();
  await testApp.externalCommand({type:'pause',paused:false});await testApp.advanceTo(49999);await expect(page.locator('[data-price]:visible')).toHaveCount(0);await testApp.advanceTo(50000);await expect(page.getByTestId('news-tape')).toBeVisible();await expect(page.getByTestId('simulation-badge')).toContainText('37×');
});
test('reduced_motion_news_is_readable_and_motion_setting_can_change_live',async({page,testApp})=>{
  await testApp.barList();await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/display');await expect(page.getByTestId('display-price-bier')).toContainText('1,80');await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-up'});
  await expect(page.locator('.intro-ribbon-one')).toBeVisible();await expect(page.locator('.intro-ribbon-one')).toHaveCSS('transform','none');await testApp.advanceTo(5000);await expect(page.locator('.news-headline')).toBeVisible();await testApp.advanceTo(20000);await expect(page.getByTestId('news-tape')).toHaveClass(/tape-static/);await expect(page.locator('.tape-copy:visible')).toHaveCount(1);await expect(page.locator('.tape-copy').first()).toContainText('Johnny');
  await page.emulateMedia({reducedMotion:'no-preference'});await testApp.advanceTo(20100);await expect(page.getByTestId('news-tape')).not.toHaveClass(/tape-static/);await expect(page.locator('.tape-copy').first()).toContainText('Trichterauftrag');await expect(page.locator('#overview [data-special-direction="up"]')).toHaveCount(1);
});
