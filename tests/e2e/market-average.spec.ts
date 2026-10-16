import {test,expect} from './fixtures.js';
import type {Page,WebSocketRoute} from '@playwright/test';
import type {Snapshot,AdminState} from '../../src/domain/model.js';

async function snapshot(page:Page):Promise<Snapshot<AdminState>>{return(await page.request.get('/api/admin/state')).json();}
async function inputAverage(page:Page,percent:number){
  await page.getByTestId('market-average').evaluate((element,value)=>{(element as HTMLInputElement).value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));},percent);
}
async function setAverage(page:Page,percent:number){
  await inputAverage(page,percent);
  await expect.poll(async()=>(await snapshot(page)).state.parameters.marketAveragePercent).toBe(percent);
  await expect(page.getByTestId('market-average')).toHaveValue(String(percent));
}
async function login(page:Page,password:string){
  await page.goto('/admin');await page.getByLabel('Passwort').fill(password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();await expect(page.locator('#controls')).toBeVisible();
  await expect(page.getByTestId('market-average')).toBeEnabled();
}

test('average_slider_changes_future_targets_without_moving_live_prices_overrides_or_timer',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);
  const slider=page.getByRole('slider',{name:'Globaler Average',exact:true});
  await expect(slider).toHaveAttribute('min','-10');await expect(slider).toHaveAttribute('max','10');await expect(slider).toHaveAttribute('step','1');await expect(slider).toHaveValue('0');
  await testApp.externalCommand({type:'override',scope:'normal',drinkId:'bier',value:200});
  await page.getByRole('button',{name:'Markt starten',exact:true}).click();await expect(page.locator('#phase-label')).toHaveText('Kurse live');
  const before=await snapshot(page);await setAverage(page,10);const after=await snapshot(page);
  expect(after.state.prices).toEqual(before.state.prices);expect(after.state.overrides).toEqual(before.state.overrides);expect(after.state.deadline).toBe(before.state.deadline);expect(after.state.config).toEqual(before.state.config);expect({...after.clock,generation:0}).toEqual({...before.clock,generation:0});
  await expect(page.getByTestId('market-average-value')).toHaveText('+10 %');
  await expect(page.getByTestId('market-average-summary')).toContainText('Bier 2,20 € → 2,42 €');await expect(page.getByTestId('market-average-summary')).toContainText('Wasser bleibt gratis');
  await page.getByRole('button',{name:'Börsencrash auslösen',exact:true}).click();await expect(page.locator('#phase-label')).toHaveText('Preiswechsel läuft');await expect(slider).toBeEnabled();await setAverage(page,-10);
  expect((await snapshot(page)).state.prices.wasser).toBe(0);
  for(const width of[1440,375]){await page.setViewportSize({width,height:900});const panel=page.getByTestId('market-volatility-panel');await panel.scrollIntoViewIfNeeded();const bounds=await panel.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);}
});

test('average_is_saved_immediately_and_reloaded_targets_never_compound',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);
  for(const percent of[10,-10,10])await setAverage(page,percent);
  await testApp.restart();await page.reload();await expect(page.getByTestId('market-average')).toHaveValue('10');
  await expect(page.getByTestId('market-average-summary')).toContainText('Bier 2,20 € → 2,42 €');
  expect((await snapshot(page)).state.config.find(drink=>drink.id==='bier')!.averageCents).toBe(220);
  await setAverage(page,0);await expect(page.getByTestId('market-average-summary')).toContainText('Bier 2,20 € → 2,20 €');
});

test('average_remains_live_during_running_and_paused_simulation',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);await page.getByRole('tab',{name:'Steuerung',exact:true}).click();await page.getByTestId('simulation-enabled').check();
  await page.getByRole('button',{name:'Markt starten',exact:true}).click();await setAverage(page,5);
  await page.getByTestId('simulation-pause').click();await expect.poll(async()=>(await snapshot(page)).clock.paused).toBe(true);
  const before=await snapshot(page);await setAverage(page,-5);const after=await snapshot(page);
  expect({...after.clock,generation:0}).toEqual({...before.clock,generation:0});expect(after.state.prices).toEqual(before.state.prices);expect(after.state.deadline).toBe(before.state.deadline);
});

test('live_average_refreshes_dirty_distribution_and_unrelated_save_preserves_percent',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  await page.getByLabel('Average € in Verteilung',{exact:true}).fill('2,50');await page.clock.fastForward(250);
  await setAverage(page,10);await expect(page.getByTestId('distribution-source')).toContainText('Entwurf');await expect(page.getByLabel('Average € in Verteilung',{exact:true})).toHaveValue('2,50');
  await expect(page.getByTestId('distribution-chart')).toHaveAttribute('data-average-cents','275');
  await expect(page.locator('.distribution-average')).toContainText('2,75 €');
  await page.getByTestId('settings-save').click();await expect(page.locator('#settings-note')).toContainText('Vor dem');
  const state=(await snapshot(page)).state;expect(state.parameters.marketAveragePercent).toBe(10);expect(state.config.find(drink=>drink.id==='bier')!.averageCents).toBe(250);
  await expect(page.getByTestId('market-average-summary')).toContainText('Bier 2,50 € → 2,75 €');
});

test('rapid_average_inputs_keep_the_latest_desire_while_streaming_and_coalesce_requests',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);
  const commands:number[]=[];let release!:()=>void,captured!:()=>void,held=false;
  const gate=new Promise<void>(resolve=>{release=resolve;}),received=new Promise<void>(resolve=>{captured=resolve;});
  await page.route('**/api/admin/commands',async route=>{
    const command=route.request().postDataJSON().command;if(command.type!=='market-average'){await route.continue();return;}commands.push(command.percent);
    if(held){await route.continue();return;}held=true;const response=await route.fetch();captured();await gate;await route.fulfill({response});
  });
  await page.getByTestId('market-average').evaluate(element=>{for(const value of[1,2,3,4,5,6,7]){(element as HTMLInputElement).value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));}});
  await received;await expect.poll(async()=>(await snapshot(page)).state.parameters.marketAveragePercent).toBe(1);
  await page.clock.fastForward(1000);await expect(page.getByTestId('market-average')).toHaveValue('7');await expect(page.getByTestId('market-average-value')).toHaveText('+7 %');
  release();await expect.poll(async()=>(await snapshot(page)).state.parameters.marketAveragePercent).toBe(7);expect(commands).toEqual([1,7]);
});

test('failed_average_command_rolls_back_and_factory_reset_clears_the_error',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);await setAverage(page,3);
  await page.route('**/api/admin/commands',async route=>{if(route.request().postDataJSON().command.type==='market-average')await route.fulfill({status:400,json:{code:'INVALID_INPUT',message:'Average wurde abgelehnt.'}});else await route.continue();});
  await inputAverage(page,9);await expect(page.getByTestId('market-average-error')).toHaveText('Average wurde abgelehnt.');await expect(page.getByTestId('market-average')).toHaveValue('3');
  await page.getByRole('tab',{name:'Steuerung',exact:true}).click();await page.getByTestId('reset-factory').click();await page.getByTestId('reset-confirm').click();
  await expect(page.getByTestId('market-average')).toHaveValue('0');await expect(page.getByTestId('market-average-error')).toBeEmpty();
});

test('average_is_disabled_offline_and_cannot_submit_an_offline_input',async({page,testApp})=>{
  let socket!:WebSocketRoute;
  await page.routeWebSocket('**/ws/admin',route=>{socket=route;route.connectToServer();});
  await testApp.barList();await login(page,testApp.password);await setAverage(page,3);await socket.close();
  await expect(page.locator('#connection')).toHaveText('Verbindung unterbrochen');await expect(page.getByTestId('market-average')).toBeDisabled();
  await inputAverage(page,9);await expect(page.getByTestId('market-average')).toHaveValue('3');expect((await snapshot(page)).state.parameters.marketAveragePercent).toBe(3);
});

test('reset_during_average_response_discards_old_desire_and_preserves_new_input',async({page,testApp})=>{
  await testApp.barList();await login(page,testApp.password);let release!:()=>void,captured!:()=>void,held=false;
  const gate=new Promise<void>(resolve=>{release=resolve;}),received=new Promise<void>(resolve=>{captured=resolve;});
  await page.route('**/api/admin/commands',async route=>{
    if(held||route.request().postDataJSON().command.type!=='market-average'){await route.continue();return;}held=true;
    const response=await route.fetch();captured();await gate;await route.fulfill({response});
  });
  await inputAverage(page,9);await received;await testApp.externalCommand({type:'reset',kind:'factory'});await expect(page.getByTestId('market-average')).toHaveValue('0');
  await inputAverage(page,-3);await expect(page.getByTestId('market-average')).toHaveValue('-3');release();
  await expect.poll(async()=>(await snapshot(page)).state.parameters.marketAveragePercent).toBe(-3);await expect(page.getByTestId('market-average')).toHaveValue('-3');await expect(page.getByTestId('market-average-error')).toBeEmpty();
});
