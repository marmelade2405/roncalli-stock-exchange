import type { WebSocketRoute } from '@playwright/test';
import { test, expect, signIn } from './fixtures.js';
test('all_business_parameters_are_editable_before_start', async ({ page, testApp }) => {
  await signIn(page,testApp); await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  for (const key of ['normalMs','crashMs','transitionMs','newsMs','crashCostCents','newsIntroMs','newsTextRevealMs','newsQuoteRevealMs','crashMinPercent','crashMaxPercent','historyChanges']) await expect(page.getByTestId(`parameter-${key}`)).toBeEnabled();
  await page.getByTestId('parameter-normalMs').fill('15'); await page.getByTestId('parameter-crashMs').fill('6');
  await page.locator('.news-editor').filter({has:page.getByTestId('news-bier-down-headline')}).locator('summary').click();
  await page.getByTestId('news-bier-down-headline').fill('Biermarkt unter Druck'); await expect(page.getByTestId('news-bier-down-percent')).toHaveCount(0);await page.getByTestId('news-bier-down-target').fill('1,10');
  await page.getByTestId('settings-save').click(); await expect(page.locator('#settings-note')).toContainText('Vor dem');
  await page.reload(); await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  await expect(page.getByTestId('parameter-normalMs')).toHaveValue('15'); await expect(page.getByTestId('parameter-crashMs')).toHaveValue('6');
  await expect(page.getByTestId('news-bier-down-headline')).toHaveValue('Biermarkt unter Druck');await expect(page.getByTestId('news-bier-down-target')).toHaveValue('1,10');
  for(const [width,height,label]of [[1440,900,'laptop'],[768,1024,'tablet'],[390,844,'phone']]as const){await page.setViewportSize({width,height});await page.screenshot({path:`.artifacts/previews/admin-${label}.png`,fullPage:true});}
});
test('instant_price_is_independent_of_next_override',async ({page,testApp})=>{
  await signIn(page,testApp); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,70'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-status')).toContainText('Gespeichert');
  await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('current-bier-input').fill('2,50'); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('current-bier-save').click();
  await expect(page.getByTestId('current-bier-value')).toContainText('2,50'); await expect(page.getByTestId('current-bier-status')).toContainText('Gespeichert');
  await expect(page.getByTestId('normal-bier-input')).toHaveValue('2,70');
});
test('instant_price_error_keeps_draft',async ({page,testApp})=>{
  await signIn(page,testApp); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('current-bier-input').fill('2,05'); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('current-bier-save').click();
  await expect(page.getByTestId('current-bier-status')).toHaveAttribute('role','alert'); await expect(page.getByTestId('current-bier-input')).toHaveValue('2,05');
  await expect(page.getByTestId('current-bier-value')).toContainText('2,00');
});
test('instant_price_locked_during_transition',async ({page,testApp})=>{
  await signIn(page,testApp); await page.getByRole('button',{name:'Markt starten',exact:true}).click();
  await page.getByRole('button',{name:'Börsencrash auslösen',exact:true}).click();
  await expect(page.getByTestId('current-bier-input')).toBeDisabled(); await expect(page.getByTestId('current-bier-save')).toBeDisabled();
});
test('reset_while_price_response_pending_does_not_clear_new_draft',async ({page,testApp})=>{
  await signIn(page,testApp); let release!:()=>void, captured!:()=>void;
  const gate=new Promise<void>(r=>{release=r;}); const received=new Promise<void>(r=>{captured=r;}); let held=false;
  await page.route('**/api/admin/commands',async route=>{
    if(held||route.request().postDataJSON().command.type!=='override'){await route.continue();return;} held=true;
    const response=await route.fetch(); captured(); await gate; await route.fulfill({response});
  });
  await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur(); await received;
  await testApp.externalCommand({type:'reset',kind:'evening'}); await expect(page.getByTestId('normal-bier-input')).toHaveValue('');
  await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,40');
  const finished=page.waitForEvent('requestfinished',{predicate:r=>r.url().endsWith('/api/admin/commands')}); release(); await finished;
  await page.getByTestId('normal-bier-input').blur(); await expect(page.getByTestId('normal-bier-effective')).toContainText('2,40');
});
test('stored_preview_survives_reload', async ({ page, testApp }) => {
  await signIn(page, testApp); const value = await page.getByTestId('normal-bier-random').textContent();
  await page.reload(); await expect(page.getByTestId('normal-bier-random')).toHaveText(value!);
});
test('manual_entry_changes_effective_price', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
  await expect(page.getByTestId('normal-bier-status')).toContainText('Gespeichert');
});
test('normal_and_crash_inputs_are_separate', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
  await page.getByRole('tab',{name:'Crash',exact:true}).click();await page.getByTestId('crash-bier-input').fill('1,40'); await page.getByTestId('crash-bier-input').blur();
  await expect(page.getByTestId('crash-bier-effective')).toContainText('1,40');
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
});
test('round_clears_only_used_fields', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
  await page.getByRole('tab',{name:'Crash',exact:true}).click();await page.getByTestId('crash-bier-input').fill('1,40'); await page.getByTestId('crash-bier-input').blur();
  await expect(page.getByTestId('crash-bier-effective')).toContainText('1,40');
  await page.getByRole('button', { name: 'Markt starten', exact: true }).click();
  await page.getByRole('button', { name: 'Börsencrash auslösen', exact: true }).click();
  await testApp.advanceTo(10_000);
  await expect(page.getByTestId('crash-bier-input')).toHaveValue('');
  await expect(page.getByTestId('normal-bier-input')).toHaveValue('2,50');
});
test('conflict_preserves_unsaved_input', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,50');
  await testApp.externalCommand({ type: 'override', scope: 'normal', drinkId: 'bier', value: 240 });
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,40');
  await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-status')).toContainText('inzwischen');
  await expect(page.getByTestId('normal-bier-input')).toHaveValue('2,50');
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,40');
});
test('outdated_socket_message_is_ignored', async ({ page, testApp }) => {
  let oldMessage: string | Buffer = ''; let route!: WebSocketRoute;
  await page.routeWebSocket('**/ws/admin', socket => {
    route = socket; const server = socket.connectToServer();
    server.onMessage(message => { if (!oldMessage) oldMessage = message; socket.send(message); });
  });
  await signIn(page, testApp); await page.getByRole('tab',{name:'Kurse',exact:true}).click();await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
  route.send(oldMessage);
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
});
test('configuration_is_locked_while_running', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByRole('button', { name: 'Markt starten', exact: true }).click();
  await expect(page.getByTestId('settings-save')).toBeDisabled();
});
test('configuration_save_preserves_newer_draft', async ({ page, testApp }) => {
  await signIn(page, testApp);
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  const name = page.getByLabel('Name für Bier', { exact: true });
  await name.fill('Bier gespeichert');
  let release!: () => void; let captured!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const received = new Promise<void>(resolve => { captured = resolve; });
  let held = false;
  await page.route('**/api/admin/commands', async route => {
    if (route.request().postDataJSON().command.type !== 'configure' || held) { await route.continue(); return; }
    held = true;
    const response = await route.fetch(); captured(); await gate; await route.fulfill({ response });
  });
  await page.getByTestId('settings-save').click(); await received;
  await name.fill('Bier neuer Entwurf');
  const saved = page.waitForResponse(response => response.url().endsWith('/api/admin/commands'));
  const finished = page.waitForEvent('requestfinished', { predicate: request => request.url().endsWith('/api/admin/commands') });
  release(); await saved;
  // Wait for the acknowledged response to reach the UI's fetch/JSON continuation.
  await finished;
  await page.getByTestId('settings-save').click();
  await expect(page.locator('#normal-table')).toContainText('Bier neuer Entwurf');
});
test('login_recovers_when_initial_time_request_fails', async ({ page, testApp }) => {
  await page.route('**/api/time', route => route.abort('failed'));
  await signIn(page, testApp);
  await expect(page.getByRole('button', { name: 'Markt starten', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Markt starten', exact: true }).click();
  await expect(page.getByTestId('countdown')).toHaveText('20:00');
  await testApp.advanceTo(1000);
  await expect(page.getByTestId('countdown')).toHaveText('19:59');
});
