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
  },
});
