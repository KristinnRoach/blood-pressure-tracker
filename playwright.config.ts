import { defineConfig, devices } from '@playwright/test';

const appUrl = 'http://127.0.0.1:4173/blood-pressure-tracker/';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: appUrl,
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 5000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // The app registers its service worker only in production.
    command:
      'pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: appUrl,
    timeout: 120 * 1000,
  },
});
