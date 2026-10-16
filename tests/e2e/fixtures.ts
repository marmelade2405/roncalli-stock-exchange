import { test as base, expect, type Page } from '@playwright/test';
import type { MarketCommand } from '../../src/domain/types.js';
type TestApp = { baseURL: string; password: string; advanceTo(timestamp: number): Promise<void>; restart(): Promise<void>; attachPage(page: Page): Promise<void>; externalCommand(command: MarketCommand): Promise<void> };
export const test = base.extend<{ testApp: TestApp }>({
  page: async ({ page }, use) => { await page.clock.install({ time: new Date(0) }); await page.clock.pauseAt(new Date(10_000)); await use(page); },
  testApp: async ({ request, context }, use) => {
    const control = 'http://127.0.0.1:4174'; const baseURL = 'http://127.0.0.1:4173'; let now = 0;
    expect((await request.post(`${control}/reset`)).ok()).toBeTruthy();
    const advanceTo = async (timestamp: number) => {
      const response = await request.post(`${control}/advance`, { data: { now: timestamp } });
      expect(response.ok(), await response.text()).toBeTruthy();
      const delta = timestamp - now; now = timestamp;
      // Playwright's clock belongs to the context, not to each individual tab.
      await context.pages()[0]?.clock.fastForward(delta);
    };
    await use({ baseURL, password: 'test-password', advanceTo,
      restart: async () => { expect((await request.post(`${control}/restart`)).ok()).toBeTruthy(); await advanceTo(now + 1000); },
      attachPage: async _page => { /* New tabs inherit the already installed context clock. */ },
      externalCommand: async command => {
        await request.post(`${baseURL}/api/login`, { headers: { Origin: baseURL }, data: { password: 'test-password' } });
        const snapshot = await (await request.get(`${baseURL}/api/state`)).json();
        const result = await request.post(`${baseURL}/api/admin/commands`, { headers: { Origin: baseURL }, data: { command, expectedRevision: snapshot.state.revision } });
        expect(result.ok()).toBeTruthy();
      },
    });
  },
});
export { expect };
export async function signIn(page: Page, app: TestApp) {
  await page.goto('/admin'); await expect(page.getByLabel('Passwort')).toBeVisible({ timeout: 1500 });
  await page.getByLabel('Passwort').fill(app.password); await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByTestId('normal-bier-random')).toContainText('2,00');
}
