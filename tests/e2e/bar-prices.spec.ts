import {test,expect} from './fixtures.js';
async function login(page:import('@playwright/test').Page,password:string){await page.goto('/admin');await page.getByLabel('Passwort').fill(password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await expect(page.getByTestId('current-bier-value')).toContainText('2,20');}
test('higher_charts_left_of_prices_with_range_guides_and_free_water',async({page,testApp})=>{
  await testApp.barList();await page.setViewportSize({width:1920,height:1080});await page.goto('/display');await expect(page.getByTestId('display-price-bier')).toContainText('2,20');
  await expect(page.locator('#overview .quote-card')).toHaveCount(20);await expect(page.getByTestId('display-price-wasser')).toContainText('0,00');
  const chart=page.locator('#overview [data-chart="bier"] svg');await expect(chart.locator('.chart-guide-label')).toHaveCount(3);await expect(chart).toContainText('Avg 2,20');await expect(chart).toContainText('Min');await expect(chart).toContainText('Max');
  const box=await chart.boundingBox(),price=await page.getByTestId('display-price-bier').boundingBox();expect(box!.height).toBeGreaterThanOrEqual(80);expect(box!.x+box!.width).toBeLessThanOrEqual(price!.x);
  await page.screenshot({path:'.artifacts/previews/bar-overview.png'});await testApp.externalCommand({type:'view',mode:'ticker'});await expect(page.getByTestId('display-ticker')).toBeVisible();await expect(page.locator('#ticker [data-chart="bier"] svg').first()).toContainText('Avg 2,20');expect((await page.locator('#ticker [data-chart="bier"] svg').first().boundingBox())!.height).toBeGreaterThanOrEqual(80);await page.screenshot({path:'.artifacts/previews/bar-ticker.png'});
});
test('average_fields_and_locked_water_work_in_admin',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  await expect(page.getByLabel('Average € für Bier',{exact:true})).toHaveValue('2,20');await expect(page.getByLabel('Average € für Wasser',{exact:true})).toBeDisabled();await expect(page.getByLabel('Min € für Wasser',{exact:true})).toHaveValue('0,00');await expect(page.getByLabel('Max € für Bier',{exact:true})).not.toBeEditable();
  await page.getByLabel('Average € für Bier',{exact:true}).fill('2,00');await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('settings-save').click();await expect(page.locator('#settings-note')).toContainText('Vor dem');
  await page.reload();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await expect(page.getByLabel('Average € für Bier',{exact:true})).toHaveValue('2,00');await expect(page.locator('#normal-average')).not.toHaveText('Vorschau ausgesetzt');await expect(page.getByTestId('special-queue-pending').locator('[data-special-id]')).toHaveCount(38);
});
test('new_bar_list_plays_thirty_eight_manual_specials_with_water_always_free',async({page,testApp})=>{
  test.setTimeout(60000);await testApp.barList();await login(page,testApp.password);
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('simulation-enabled').check();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByRole('button',{name:'Markt starten',exact:true}).click();await expect(page.getByTestId('countdown')).toHaveText('20:00');
  let wall=0;const read=async()=>{const response=await page.request.get(testApp.baseURL+'/api/admin/state');expect(response.ok()).toBeTruthy();return response.json();};let state=await read();
  for(let i=0;i<120&&(state.clock.marketNow<18000000||state.state.schedule.pending.length);i++){if(state.state.phase==='transition'){wall+=state.state.deadline-state.clock.marketNow;await testApp.advanceTo(wall);}else if(state.state.schedule.pending.length)await testApp.externalCommand({type:'special',specialId:state.state.schedule.pending[0].specialId});else await testApp.step();state=await read();expect(state.state.prices.wasser).toBe(0);}
  expect(state.state.schedule.done).toHaveLength(38);expect(new Set(state.state.schedule.done.map((x:{specialId:string})=>x.specialId)).size).toBe(38);expect(state.state.schedule.pending).toHaveLength(0);expect(state.state.historyByDrink.wasser).toHaveLength(1);expect(state.clock.marketNow).toBeGreaterThanOrEqual(18000000);
});
test('admin_average_changes_keep_paid_drinks_variable',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  await page.getByLabel('Average € für Bier',{exact:true}).fill('2,40');await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('settings-save').click();await expect(page.getByTestId('special-queue-pending').locator('[data-special-id]')).toHaveCount(38);
  await page.getByLabel('Average € für Bier',{exact:true}).fill('2,00');await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('settings-save').click();await expect(page.getByTestId('special-queue-pending').locator('[data-special-id]')).toHaveCount(38);await expect(page.locator('#settings-error')).toBeEmpty();
  await page.reload();await page.getByRole('tab',{name:'Breaking News',exact:true}).click();await expect(page.getByTestId('special-bier-down-trigger')).toBeVisible();
});
