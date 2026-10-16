import {test,expect,signIn} from './fixtures.js';
import type {AdminState,Snapshot} from '../../src/domain/model.js';
test('five_hour_simulation_consumes_all_news_and_resets_for_real_evening',async({page,context,testApp})=>{
  test.setTimeout(60000);
  await signIn(page,testApp);await page.getByText('Getränke & Preisgrenzen',{exact:true}).click();
  await page.getByLabel('Name für Bier',{exact:true}).fill('Hausbier');await page.getByLabel('Start € für Bier',{exact:true}).fill('2,10');
  await page.getByTestId('settings-save').click();await expect(page.getByTestId('current-bier-value')).toContainText('2,10');
  await page.getByTestId('normal-bier-input').fill('2,70');await page.getByTestId('normal-bier-input').blur();await expect(page.getByTestId('normal-bier-status')).toContainText('Gespeichert');
  const read=async():Promise<Snapshot<AdminState>>=>{const response=await page.request.get(testApp.baseURL+'/api/admin/state');expect(response.ok(),await response.text()).toBeTruthy();return response.json();};
  const initial=await read(),secondId=initial.state.schedule.pending[1].specialId;
  await page.getByTestId(`special-${secondId}-up`).click();await expect(page.getByTestId('special-queue-pending').locator('[data-special-id]').first()).toHaveAttribute('data-special-id',secondId);
  const ordered=(await read()).state.specialOrder;
  await page.getByTestId('simulation-enabled').check();await expect(page.getByTestId('simulation-state')).toContainText('SIMULATION');
  const screens=[await context.newPage(),await context.newPage()];for(const screen of screens){await screen.goto('/display');await expect(screen.getByTestId('display-price-bier')).toContainText('2,10');}
  await page.getByRole('button',{name:'Markt starten',exact:true}).click();await expect(page.getByTestId('countdown')).toHaveText('20:00');
  let wall=0;const advance=async(delta:number)=>{wall+=delta;await testApp.advanceTo(wall);};
  await page.getByTestId('special-bier-down-trigger').click();for(const screen of screens)await expect(screen.getByTestId('breaking-news')).toBeVisible();
  await advance(5000);await testApp.restart();wall+=1000;
  await page.reload();await expect(page.getByTestId('simulation-state')).toContainText('pausiert');
  for(const screen of screens){await screen.reload();await expect(screen.getByTestId('simulation-badge')).toContainText('PAUSIERT');}
  await page.getByTestId('simulation-pause').click();await expect(page.getByTestId('simulation-state')).toContainText('aktuell 1×');
  await advance(5000);let snapshot=await read();expect(snapshot.state.schedule.done.map(x=>x.specialId)).toEqual(['bier-down']);
  await page.getByTestId('current-bier-input').fill('2,50');await page.getByTestId('current-bier-save').click();await expect(page.getByTestId('current-bier-status')).toContainText('Gespeichert');
  await expect(page.getByTestId('normal-bier-input')).toHaveValue('2,70');
  await page.getByRole('button',{name:'Börsencrash auslösen',exact:true}).click();await expect(page.locator('#phase-label')).toContainText('Preiswechsel');
  await advance(10000);await expect(page.locator('#phase-label')).toContainText('Börsencrash');await page.getByTestId('cancel-crash').click();await expect(page.locator('#countdown-label')).toContainText('ERHOLUNG');await advance(10000);
  await expect(page.getByTestId('countdown')).toHaveText('20:00');snapshot=await read();
  const published=['bier-down'];let consumedOverride=false;
  for(let events=0;events<100&&(snapshot.clock.marketNow<snapshot.state.parameters.eveningMs||snapshot.state.schedule.pending.length>0);events++){
    if(snapshot.state.phase==='transition'){
      for(const screen of screens){await expect(screen.locator('[data-price]:visible')).toHaveCount(0);await expect(screen.locator('[data-chart]:visible')).toHaveCount(0);}
      const news=snapshot.state.news?.id;await advance(snapshot.state.deadline!-snapshot.clock.marketNow);snapshot=await read();
      if(news){published.push(news);expect(snapshot.state.schedule.done.at(-1)?.specialId).toBe(news);}
      if(!consumedOverride&&snapshot.state.overrides.normal.bier===undefined){consumedOverride=true;expect(snapshot.state.prices.bier).toBe(270);}
      for(const screen of screens)await expect(screen.getByTestId('display-countdown')).toHaveText(await page.getByTestId('countdown').textContent()??'');
    }else{await testApp.step();snapshot=await read();}
  }
  expect(consumedOverride).toBe(true);expect(snapshot.clock.marketNow).toBeGreaterThanOrEqual(18000000);
  expect(new Set(published).size).toBe(16);expect(published).toHaveLength(16);expect(snapshot.state.schedule.pending).toHaveLength(0);expect(snapshot.state.schedule.done).toHaveLength(16);
  await page.getByTestId('reset-evening').click();await page.getByTestId('reset-confirm').click();await expect(page.locator('#phase-label')).toHaveText('Marktvorbereitung');
  const reset=await read();expect(reset.state.specialOrder).toEqual(ordered);expect(reset.state.config[0].name).toBe('Hausbier');expect(reset.state.prices.bier).toBe(210);expect(reset.state.overrides).toEqual({normal:{},crash:{}});expect(reset.state.schedule.pending).toHaveLength(16);expect(reset.state.historyByDrink.bier).toHaveLength(1);expect(reset.state.deadline).toBeNull();expect(reset.clock).toMatchObject({mode:'live',rate:1,paused:false});
  for(const screen of screens){await expect(screen.getByTestId('display-price-bier')).toContainText('2,10');await expect(screen.getByTestId('simulation-badge')).toBeHidden();await expect(screen.locator('#overview [data-chart="bier"] svg')).toHaveAttribute('data-point-count','1');}
  await page.getByRole('button',{name:'Markt starten',exact:true}).click();await expect(page.getByTestId('countdown')).toHaveText('20:00');const realStarted=await read();expect(realStarted.state.deadline).toBe(realStarted.clock.marketNow+1200000);
});
