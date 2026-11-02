import { defineConfig } from '@playwright/test';

// Default: fast feedback against the Vite dev server.
// PW_PREVIEW=1: exercise the production bundle in dist/ (assets, hashing, lazy
// chunk URLs). CI downloads the build artifact and uses this mode.
const usePreviewServer = process.env.PW_PREVIEW === '1' || process.env.PW_PREVIEW === 'true';

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
    command: usePreviewServer
      ? 'npm run preview -- --port 3000 --strictPort'
      : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
