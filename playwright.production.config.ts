// filepath: playwright.production.config.ts
// Production E2E tests — runs against live Netlify deployment
import { defineConfig, devices } from '@playwright/test'

const PRODUCTION_URL =
  process.env.PRODUCTION_URL ?? 'https://missionpulse.netlify.app'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'production-smoke.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,

  use: {
    baseURL: PRODUCTION_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      'x-test-suite': 'missionpulse-e2e',
    },
  },

  projects: [
    {
      name: 'production-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer — we test against the live deployment
})
