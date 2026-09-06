import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.DRILLS_BASE_URL || 'http://127.0.0.1:3100'
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
      },
})
