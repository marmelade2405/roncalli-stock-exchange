import { test, expect } from './fixtures.js';
async function ready(page: import('@playwright/test').Page) { await page.goto('/display'); await expect(page.getByTestId('display-price-bier')).toContainText('2,00', { timeout: 1500 }); }
test('two_displays_share_prices_and_countdown', async ({ page, context, testApp }) => {
  await ready(page); const second = await context.newPage(); await testApp.attachPage(second); await ready(second);
  await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-countdown')).toHaveText('30:00');
  await expect(second.getByTestId('display-countdown')).toHaveText('30:00');
  await expect(second.getByTestId('display-price-bier')).toHaveText(await page.getByTestId('display-price-bier').textContent() ?? '');
});
test('admin_mode_switch_updates_both_displays', async ({ page, context, testApp }) => {
  await ready(page); const second = await context.newPage(); await testApp.attachPage(second); await ready(second);
  await testApp.externalCommand({ type: 'view', mode: 'ticker' });
  await expect(page.getByTestId('display-ticker')).toBeVisible(); await expect(second.getByTestId('display-ticker')).toBeVisible();
  await expect(page.getByTestId('display-overview')).toBeHidden();
});
test('transition_contains_no_visible_price_or_delta', async ({ page, testApp }) => {
  await ready(page); await testApp.externalCommand({ type: 'start' });
  await testApp.advanceTo(1_790_000);
  await expect(page.getByTestId('display-transition')).toBeVisible();
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
  await expect(page.locator('[data-delta]:visible')).toHaveCount(0);
  await testApp.advanceTo(1_800_000);
  await expect(page.getByTestId('display-overview')).toBeVisible();
});
test('ticker_duplicates_never_leak_old_prices', async ({ page, testApp }) => {
  await ready(page); await testApp.externalCommand({ type: 'view', mode: 'ticker' }); await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-ticker')).toBeVisible();
  await testApp.advanceTo(1_790_000);
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
  await expect(page.getByTestId('display-transition')).toBeVisible();
});
test('device_date_does_not_change_market_time', async ({ page, testApp }) => {
  await ready(page); await testApp.externalCommand({ type: 'start' }); await page.clock.setSystemTime(new Date('2099-01-01T00:00:00Z'));
  await testApp.advanceTo(1000); await expect(page.getByTestId('display-countdown')).toHaveText('29:59');
});
test('first_round_has_neutral_change', async ({ page, testApp: _testApp }) => {
  await ready(page); await expect(page.getByTestId('display-change-bier')).toHaveText('—');
});
test('disconnected_display_stays_hidden_after_deadline', async ({ page, testApp }) => {
  let block = false;
  await page.routeWebSocket('**/ws/public', socket => { const server = socket.connectToServer(); server.onMessage(message => { if (!block) socket.send(message); }); });
  await ready(page); await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-countdown')).toHaveText('30:00'); block = true;
  await testApp.advanceTo(1_800_000);
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
  await expect(page.getByTestId('display-waiting')).toBeVisible();
});
test('reduced_motion_ticker_shows_all_drinks_and_hides_prices', async ({ page, testApp }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await testApp.externalCommand({ type: 'view', mode: 'ticker' });
  await testApp.externalCommand({ type: 'start' });
  await expect(page.getByTestId('display-ticker')).toBeVisible();
  const visibleNames = () => page.locator('.ticker-viewport').evaluate(viewport => {
    const box = viewport.getBoundingClientRect();
    return Array.from(viewport.querySelectorAll('.ticker-row')).filter(row => {
      const rect = row.getBoundingClientRect(); return rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1;
    }).map(row => row.querySelector('.ticker-name')!.textContent);
  });
  const first = await visibleNames();
  await testApp.advanceTo(18_000);
  await expect.poll(visibleNames).toContain('Whisky Cola');
  const later = await visibleNames();
  expect(new Set([...first, ...later]).size).toBe(8);
  await testApp.advanceTo(1_790_000);
  await expect(page.getByTestId('display-transition')).toBeVisible();
  await expect(page.locator('[data-price]:visible')).toHaveCount(0);
});
