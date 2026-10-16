import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', workers: 1, timeout: 20_000,
  expect: { timeout: 4000 },
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, channel: process.platform === 'win32' ? 'msedge' : undefined, viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node --import tsx tests/e2e/harness.ts', url: 'http://127.0.0.1:4174/health', timeout: 30_000, reuseExistingServer: false },
});
