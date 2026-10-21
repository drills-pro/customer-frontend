import { defineConfig, devices } from '@playwright/test';
import { API_URL, TENANT_ID } from './tests/fixtures/api';

const baseURL = process.env.DRILLS_BASE_URL || 'http://127.0.0.1:3100';
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.DRILLS_BASE_URL
    ? undefined
    : {
        command: 'pnpm exec vite dev --host 127.0.0.1 --port 3100',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
        // Mock auth plus an API origin nothing listens on: tests answer
        // core-api calls with `page.route`, never a real backend.
        // Every other call is answered by the in-app mock, with no delay,
        // including the ones core-api now serves (VITE_API_MOCK=all).
        env: {
          VITE_API_MOCK: 'all',
          VITE_API_URL: API_URL,
          VITE_DEV_TENANT_ID: TENANT_ID,
          VITE_API_MOCK_DELAY_MS: '0',
        },
      },
});
