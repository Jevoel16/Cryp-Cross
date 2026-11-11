import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);

// One smoke test of the main flow, against the in-memory API and the Vite dev server.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // PW_CHANNEL=chrome runs the installed Chrome instead of Playwright's download.
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:memory --prefix server',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      command: 'npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !CI,
      timeout: 60_000,
    },
  ],
});
