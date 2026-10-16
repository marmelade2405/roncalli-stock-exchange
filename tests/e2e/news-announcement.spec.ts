import {test,expect} from './fixtures.js';

test('message_announces_the_quote_after_intro_with_a_delay_and_pause_freezes_the_fly_in',async({page,testApp})=>{
  await testApp.barList();await testApp.externalCommand({type:'simulation',enabled:true});
  await page.request.post('/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});
  const state=(await(await page.request.get('/api/admin/state')).json()).state;
  await testApp.externalCommand({type:'configure',drinks:state.config,parameters:{...state.parameters,newsMs:25000,newsIntroMs:10000}});
  await page.setViewportSize({width:1920,height:1080});await page.goto('/display');
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});
  const announcement=page.getByTestId('news-announcement'),drink=page.getByTestId('news-announcement-drink'),change=page.getByTestId('news-announcement-change'),price=page.getByTestId('news-announcement-price');
  await expect(announcement).toBeHidden();await testApp.advanceTo(4000);await expect(announcement).toBeHidden();await expect(page.locator('.news-drink')).toBeHidden();await testApp.advanceTo(9900);await expect(announcement).toBeHidden();await expect(page.locator('.news-headline')).toBeHidden();await testApp.advanceTo(10000);await expect(page.locator('.news-headline')).toBeVisible();await expect(announcement).toBeHidden();await testApp.advanceTo(13200);
  await expect(drink).toBeVisible();await expect(drink).toContainText('Bier');await expect(change).toBeHidden();await expect(price).toBeHidden();
  await testApp.advanceTo(14800);await expect(change).toBeVisible();await expect(change).toContainText('−0,70');await expect(change).toContainText('−31,8 %');await expect(price).toBeHidden();
  await testApp.advanceTo(16200);await expect(price).toBeVisible();await expect(price).toContainText('1,50');await expect(announcement).toHaveAttribute('data-direction','down');
  await testApp.externalCommand({type:'pause',paused:true});
  const frozen=await price.evaluate(e=>({opacity:e.style.opacity,transform:e.style.transform}));
  await testApp.advanceTo(21200);expect(await price.evaluate(e=>({opacity:e.style.opacity,transform:e.style.transform}))).toEqual(frozen);
  await page.screenshot({path:'.artifacts/previews/news-quote-announcement.png'});
  await expect(page.getByRole('button',{name:'Breaking News überspringen',exact:true}).filter({visible:true})).toHaveCount(1);
  await testApp.externalCommand({type:'pause',paused:false});await testApp.advanceTo(24000);await expect(announcement).toBeVisible();
  await expect(page.getByTestId('breaking-news')).toHaveAttribute('data-stage','message');
  await expect(page.getByRole('button',{name:'Breaking News überspringen',exact:true}).filter({visible:true})).toHaveCount(1);
  const before=(await(await page.request.get('/api/state')).json()).state;expect(before.prices.bier).toBe(220);
  await testApp.advanceTo(30000);await expect(page.getByTestId('display-price-bier')).toContainText('1,50');
});

test('cheaper_beer_announces_a_further_price_drop_and_reduced_motion_wraps_the_quote',async({page,testApp})=>{
  await testApp.barList();await testApp.externalCommand({type:'simulation',enabled:true});
  await page.request.post('/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});
  const state=(await(await page.request.get('/api/admin/state')).json()).state;
  await testApp.externalCommand({type:'configure',drinks:state.config.map((drink:{id:string;name:string})=>drink.id==='bier'?{...drink,name:'Bier mit einem ausgesprochen langen Getränkenamen'}:drink),parameters:{...state.parameters,newsMs:25000,newsIntroMs:10000}});
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/display');
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'correct',drinkId:'bier',value:140});await testApp.externalCommand({type:'special',specialId:'bier-down'});await testApp.advanceTo(18200);
  const announcement=page.getByTestId('news-announcement');await expect(announcement).toBeVisible();await expect(announcement).toHaveAttribute('data-direction','down');
  await expect(page.getByTestId('news-announcement-change')).toContainText('−0,20');await expect(page.getByTestId('news-announcement-change')).toContainText('−14,3 %');await expect(page.getByTestId('news-announcement-price')).toContainText('1,20');
  for(const id of ['news-announcement-drink','news-announcement-change','news-announcement-price'])await expect(page.getByTestId(id)).toHaveCSS('transform','none');
  const panel=await announcement.boundingBox(),frame=await page.getByTestId('breaking-news').boundingBox();expect(panel!.x).toBeGreaterThanOrEqual(frame!.x);expect(panel!.x+panel!.width).toBeLessThanOrEqual(frame!.x+frame!.width);
  expect(await announcement.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await page.screenshot({path:'.artifacts/previews/news-quote-announcement-narrow.png'});await testApp.advanceTo(24999);await expect(announcement).toBeVisible();await testApp.advanceTo(25000);await expect(announcement).toBeHidden();
});

test('older_news_packets_without_a_quote_keep_the_video_and_skip_control',async({page,testApp})=>{
  await testApp.barList();await testApp.externalCommand({type:'simulation',enabled:true});
  await page.request.post('/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});
  await page.routeWebSocket('**/ws/public',socket=>{const server=socket.connectToServer();server.onMessage(message=>{
    if(typeof message!=='string'){socket.send(message);return;}
    const packet=JSON.parse(message);if(packet.state?.news)delete packet.state.news.quote;socket.send(JSON.stringify(packet));
  });});
  await page.goto('/display');await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});await testApp.advanceTo(2500);
  await expect(page.getByTestId('news-announcement')).toBeHidden();await expect(page.locator('.news-intro-video')).toBeVisible();
  await expect(page.getByRole('button',{name:'Breaking News überspringen',exact:true}).filter({visible:true})).toHaveCount(1);
});
