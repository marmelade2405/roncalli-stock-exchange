import {test,expect} from './fixtures.js';
test('distribution_line_updates_for_unsaved_parameters_without_changing_market',async({page,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  const chart=page.getByTestId('distribution-chart');await expect(chart.locator('path.distribution-line')).toHaveCount(1);await expect.poll(async()=>Math.abs(parseFloat((await page.getByTestId('distribution-mean').innerText()).replace(',','.'))-2.2)).toBeLessThan(.02);
  await expect(page.getByTestId('distribution-shape')).toContainText('+0,83');await expect(page.getByTestId('distribution-shape')).toContainText('−0,28');await chart.focus();await chart.press('End');await expect(page.locator('.distribution-detail')).toContainText('5,50');await expect(page.locator('.distribution-detail')).not.toContainText('0,0 %');
  const before=(await(await page.request.get('/api/admin/state')).json()).state;
  await page.getByLabel('Average € für Bier',{exact:true}).fill('2,50');await expect(page.getByLabel('Average € für Bier',{exact:true})).toHaveValue('2,50');await page.clock.fastForward(250);
  await expect(page.getByTestId('distribution-mean')).toContainText('2,50');await expect(page.getByTestId('distribution-source')).toContainText('Entwurf');await expect(chart).toHaveAttribute('data-average-cents','250');
  const after=(await(await page.request.get('/api/admin/state')).json()).state;expect(after.revision).toBe(before.revision);expect(after.prices).toEqual(before.prices);expect(after.config).toEqual(before.config);
  await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await expect(page.getByTestId('distribution-mean')).toContainText('2,50');
  await page.getByLabel('Average € für Bier',{exact:true}).fill('ungültig');await page.clock.fastForward(250);await expect(page.getByTestId('distribution-error')).not.toBeEmpty();await expect(chart).toBeHidden();
  await page.getByLabel('Average € für Bier',{exact:true}).fill('2,50');await page.clock.fastForward(250);await expect(chart).toBeVisible();await page.getByLabel('Getränk für Verteilung',{exact:true}).selectOption('wasser');await expect(page.getByTestId('distribution-mean')).toContainText('0,00');await expect(chart).toHaveAttribute('data-average-cents','0');
});
test('distribution_is_readable_on_small_screens_and_available_while_market_runs',async({page,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByLabel('Getränk für Verteilung',{exact:true}).selectOption('ouzo');
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByRole('button',{name:'Markt starten',exact:true}).click();await expect(page.getByLabel('Average € für Ouzo',{exact:true})).toBeEnabled();await expect(page.getByLabel('Getränk für Verteilung',{exact:true})).toBeEnabled();
  await expect(page.getByLabel('Average € für Bier',{exact:true})).toBeEnabled();
  for(const width of[1440,375]){await page.setViewportSize({width,height:900});const chart=page.getByTestId('distribution-chart');await chart.scrollIntoViewIfNeeded();await expect(chart).toBeVisible();const bounds=await chart.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);await page.screenshot({path:`.artifacts/previews/distribution-admin-${width}.png`});}
});
test('legacy_saved_rules_and_empty_drink_draft_do_not_show_misleading_distribution',async({page,testApp})=>{
  await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  const chart=page.getByTestId('distribution-chart');await chart.focus();await chart.press('Home');await expect(page.locator('.distribution-detail')).toContainText('1,00');await expect(page.locator('.distribution-detail')).not.toContainText('0,0 %');await expect(page.locator('.distribution-parameters')).toContainText('Rückführung aus');
  while(await page.locator('#settings-table tbody tr').count())await page.locator('#settings-table tbody tr button').first().click();
  await expect(chart).toBeHidden();await expect(page.getByTestId('distribution-mean')).toHaveText('—');await expect(page.getByTestId('distribution-error')).toContainText('Getränk hinzufügen');
});
