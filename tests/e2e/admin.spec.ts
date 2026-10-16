import type { WebSocketRoute } from '@playwright/test';
import { test, expect, signIn } from './fixtures.js';
test('stored_preview_survives_reload', async ({ page, testApp }) => {
  await signIn(page, testApp); const value = await page.getByTestId('normal-bier-random').textContent();
  await page.reload(); await expect(page.getByTestId('normal-bier-random')).toHaveText(value!);
});
test('manual_entry_changes_effective_price', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
  await expect(page.getByTestId('normal-bier-status')).toContainText('Gespeichert');
});
test('normal_and_crash_inputs_are_separate', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
  await page.getByTestId('crash-bier-input').fill('1,40'); await page.getByTestId('crash-bier-input').blur();
  await expect(page.getByTestId('crash-bier-effective')).toContainText('1,40');
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
});
test('round_clears_only_used_fields', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
  await expect(page.getByTestId('normal-bier-effective')).toContainText('2,50');
  await page.getByTestId('crash-bier-input').fill('1,40'); await page.getByTestId('crash-bier-input').blur();
  await expect(page.getByTestId('crash-bier-effective')).toContainText('1,40');
  await page.getByRole('button', { name: 'Markt starten', exact: true }).click();
  await page.getByRole('button', { name: 'Börsencrash auslösen', exact: true }).click();
  await testApp.advanceTo(10_000);
  await expect(page.getByTestId('crash-bier-input')).toHaveValue('');
  await expect(page.getByTestId('normal-bier-input')).toHaveValue('2,50');
});
test('conflict_preserves_unsaved_input', async ({ page, testApp }) => {
  await signIn(page, testApp); await page.getByTestId('normal-bier-input').fill('2,50');
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
  await signIn(page, testApp); await page.getByTestId('normal-bier-input').fill('2,50'); await page.getByTestId('normal-bier-input').blur();
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
  await page.getByText('Getränke & Preisgrenzen', { exact: true }).click();
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
  await expect(page.getByTestId('countdown')).toHaveText('30:00');
  await testApp.advanceTo(1000);
  await expect(page.getByTestId('countdown')).toHaveText('29:59');
});
