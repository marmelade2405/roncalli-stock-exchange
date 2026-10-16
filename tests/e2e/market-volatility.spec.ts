import {test,expect} from './fixtures.js';
import type {Page} from '@playwright/test';
test('percent_basis_follows_each_average_and_global_adjustment',async({page,testApp})=>{
 await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await setVolatility(page,40);await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByLabel('Getränk für Verteilung',{exact:true}).selectOption('gin-tonic');await expect(page.locator('.distribution-parameters')).toContainText('40 % des Average = wirksam 1,40 €');
 await testApp.externalCommand({type:'market-average',percent:10});await expect(page.locator('.distribution-parameters')).toContainText('40 % des Average = wirksam 1,54 €');const state=(await(await page.request.get('/api/admin/state')).json()).state;expect(state.prices['gin-tonic']).toBe(350);expect(state.parameters.marketVolatilityPercent).toBe(40);
});
test('legacy_factor_summary_uses_saved_absolute_basis_until_percent_selection',async({page,testApp})=>{
 await testApp.barList();await testApp.externalCommand({type:'market-volatility',factor:2});await testApp.externalCommand({type:'market-average',percent:10});await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();const state=(await(await page.request.get('/api/admin/state')).json()).state,beer=state.config.find((d:{id:string})=>d.id==='bier'),basis=beer.amplitudeCents*2;const euro=(basis/100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});await expect(page.getByTestId('market-volatility-value')).toHaveText('Altprofil 2×');await expect(page.getByTestId('market-volatility-summary')).toContainText(`Referenzbeispiel: Bier · Normal: Schwankung ${euro} €`);await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await expect(page.locator('.distribution-parameters')).toContainText('Altprofil: Euro-Basis × 2');await expect(page.getByTestId('distribution-volatility-equation')).toHaveText('s = gespeicherte Euro-Basis × Alt-Faktor');await setVolatility(page,40);await expect(page.getByTestId('market-volatility-value')).toHaveText('40 %');await expect(page.getByTestId('distribution-volatility-equation')).toHaveText('s = Aeff × Marktvolatilität / 100');
});

async function setVolatility(page:Page,percent:number){
  await page.getByRole('slider',{name:'Marktvolatilität',exact:true}).evaluate((element,value)=>{(element as HTMLInputElement).value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));},percent);
  await expect.poll(async()=>(await(await page.request.get('/api/admin/state')).json()).state.parameters.marketVolatilityPercent).toBe(percent);
}

test('global_volatility_is_live_in_every_phase_and_shows_normal_and_fixed_double_crash_basis',async({page,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await expect(page.locator('#controls')).toBeVisible();
  const slider=page.getByRole('slider',{name:'Marktvolatilität',exact:true});
  await expect(slider).toHaveAttribute('min','0');await expect(slider).toHaveAttribute('max','75');await expect(slider).toHaveAttribute('step','1');await expect(slider).toHaveValue('25');
  await setVolatility(page,40);await expect(page.getByTestId('market-volatility-value')).toHaveText('40 %');
  const state=(await(await page.request.get('/api/admin/state')).json()).state;
  const beer=state.config.find((drink:{id:string})=>drink.id==='bier');
  const cents=beer.averageCents*.4;
  const euro=(value:number)=>`${(Math.round(value)/100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} €`;
  await expect(page.getByTestId('market-volatility-summary')).toHaveText(`Referenzbeispiel: Bier · Normal: Schwankung 40 % = ${euro(cents)} · Crash: Schwankung 80 % = ${euro(cents*2)}`);
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('simulation-enabled').check();
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByRole('button',{name:'Markt starten',exact:true}).click();await setVolatility(page,50);
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('simulation-pause').click();await setVolatility(page,12);
  await page.getByRole('button',{name:'Börsencrash auslösen',exact:true}).click();await expect(page.locator('#phase-label')).toHaveText('Preiswechsel läuft');await setVolatility(page,75);
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('simulation-pause').click();await testApp.advanceTo(15000);await expect(page.locator('#phase-label')).toHaveText('Börsencrash');await setVolatility(page,0);
  await expect(slider).toHaveAttribute('title',/Average-Rückführung/);await expect(page.getByTestId('market-volatility-summary')).toContainText('Crash: Schwankung 0 %');
  expect((await(await page.request.get('/api/admin/state')).json()).state.prices.wasser).toBe(0);
  for(const width of[1440,375]){await page.setViewportSize({width,height:900});const panel=page.getByTestId('market-volatility-panel');await panel.scrollIntoViewIfNeeded();const bounds=await panel.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);await page.screenshot({path:`.artifacts/previews/market-volatility-${width}.png`});}
});

test('volatility_updates_dirty_distribution_and_unrelated_settings_save_preserves_live_factor',async({page,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await expect(page.locator('#controls')).toBeVisible();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  await expect(page.getByTestId('parameter-crashAmplitudeFactor')).toHaveCount(0);
  await page.getByLabel('Average € für Bier',{exact:true}).fill('2,50');await page.clock.fastForward(250);
  const curve=page.getByTestId('distribution-chart').locator('path.distribution-line');const initial=await curve.getAttribute('d');
  await setVolatility(page,0);await expect(page.getByTestId('distribution-source')).toContainText('Entwurf');await expect(page.getByLabel('Average € für Bier',{exact:true})).toHaveValue('2,50');
  await expect(page.locator('.distribution-parameters')).toContainText('wirksam 0,00 €');await expect(page.getByTestId('distribution-mean')).toContainText('2,50');await expect(curve).not.toHaveAttribute('d',initial!);
  await expect(page.getByTestId('distribution-equation')).toContainText('s = Aeff × Marktvolatilität / 100');
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('settings-save').click();await expect(page.locator('#settings-note')).toContainText('Vor dem');
  const state=(await(await page.request.get('/api/admin/state')).json()).state;expect(state.parameters.marketVolatilityPercent).toBe(0);expect(state.config.find((drink:{id:string})=>drink.id==='bier').averageCents).toBe(250);
  await page.getByLabel('Getränk für Verteilung',{exact:true}).selectOption('ouzo');await setVolatility(page,50);
  await expect(page.getByLabel('Getränk für Verteilung',{exact:true})).toHaveValue('ouzo');await expect(page.locator('.distribution-parameters')).toContainText('wirksam 0,50 €');
});

test('rapid_volatility_inputs_coalesce_to_latest_factor_and_factory_reset_restores_default',async({page,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await expect(page.locator('#controls')).toBeVisible();
  const requests:number[]=[];page.on('request',request=>{if(request.url().endsWith('/api/admin/commands')){const command=request.postDataJSON()?.command;if(command?.type==='market-volatility')requests.push(command.percent);}});
  await page.getByRole('slider',{name:'Marktvolatilität',exact:true}).evaluate(element=>{for(const value of[26,27,28,29,30,32,35]){(element as HTMLInputElement).value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));}});
  await expect.poll(async()=>(await(await page.request.get('/api/admin/state')).json()).state.parameters.marketVolatilityPercent).toBe(35);
  expect(requests.length).toBeLessThanOrEqual(2);expect(requests.at(-1)).toBe(35);
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('reset-factory').click();await page.getByTestId('reset-confirm').click();
  await expect(page.getByRole('slider',{name:'Marktvolatilität',exact:true})).toHaveValue('25');await expect(page.getByTestId('market-volatility-error')).toBeEmpty();
});
