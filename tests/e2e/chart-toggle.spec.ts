import {test,expect} from './fixtures.js';
test('three_chart_modes_switch_both_displays_and_remain_saved',async({page,context,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();
  const choice=page.getByRole('combobox',{name:'Chartdarstellung',exact:true});await expect(choice).toHaveValue('bars-gap');await choice.selectOption('line');
  const displays=[await context.newPage(),await context.newPage()];for(const screen of displays){await screen.setViewportSize({width:1920,height:1080});await screen.goto('/display');await expect(screen.locator('#overview .price-path')).toHaveCount(20);}
  const before=(await(await page.request.get('/api/admin/state')).json()).state;
  for(const mode of ['bars','bars-gap']as const){
    await choice.selectOption(mode);
    for(const screen of displays){
      await expect(screen.locator('#overview .change-bar.up').first()).toBeVisible();await expect(screen.locator('#overview .change-bar.down').first()).toBeVisible();await expect(screen.locator('#overview .price-path')).toHaveCount(0);
      const chart=screen.locator('#overview [data-chart="bier"] svg');await expect(chart).toHaveAttribute('data-mode',mode);await expect(chart.locator('.change-bar')).toHaveCount(20);
      const gaps=await chart.locator('.change-bar').evaluateAll(rects=>rects.slice(1).map((r,i)=>Number(r.getAttribute('x'))-Number(rects[i].getAttribute('x'))-Number(rects[i].getAttribute('width'))));
      expect(gaps.every(gap=>mode==='bars'?Math.abs(gap)<.001:gap>0&&gap<=3.001)).toBe(true);
    }
  }
  const after=(await(await page.request.get('/api/admin/state')).json()).state;expect(after.prices).toEqual(before.prices);expect(after.previews).toEqual(before.previews);
  await page.reload();await expect(page.getByRole('combobox',{name:'Chartdarstellung',exact:true})).toHaveValue('bars-gap');
  await testApp.externalCommand({type:'view',mode:'ticker'});await testApp.advanceTo(12000);for(const screen of displays)await expect(screen.locator('#ticker .change-bar')).toHaveCount(1200);
  await displays[0].screenshot({path:'.artifacts/previews/gapped-bars-ticker.png'});
  await page.getByRole('combobox',{name:'Chartdarstellung',exact:true}).selectOption('line');for(const screen of displays)await expect(screen.locator('#ticker .price-path')).toHaveCount(60);
});
test('staff_menu_has_clear_categories_and_no_drink_is_missing',async({page,testApp})=>{
  await testApp.barList();await page.setViewportSize({width:1920,height:1080});await page.goto('/bar-display');await expect(page.locator('.bar-item')).toHaveCount(20);for(const name of['Shots','Bier','Longdrinks','Alkoholfrei'])await expect(page.getByRole('heading',{name,exact:true,level:2})).toBeVisible();await expect(page.getByTestId('bar-price-wasser')).toContainText('0,00');await expect(page.locator('[data-bar-category="Shots"] .bar-item')).toHaveCount(7);await page.screenshot({path:'.artifacts/previews/staff-menu-categories.png'});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await expect(page.locator('.bar-item')).toHaveCount(20);
});
