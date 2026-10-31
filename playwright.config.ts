import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  timeout: 30000,
  fullyParallel: true,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Playwright starts (and stops) the app itself so the suite is reproducible
  // both locally and in CI without a pre-running dev server.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
