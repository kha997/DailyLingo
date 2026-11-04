import { defineConfig } from '@playwright/test';

// Default: fast feedback against the Vite dev server.
// PW_PREVIEW=1: exercise the production bundle in dist/ (assets, hashing, lazy
// chunk URLs). CI downloads the build artifact and uses this mode.
// PW_BASE_URL: run against an already deployed site (the Access-protected
// staging URL). No local server is started. PW_STORAGE_STATE supplies the
// Access cookie captured by `npm run staging:auth`.
const usePreviewServer = process.env.PW_PREVIEW === '1' || process.env.PW_PREVIEW === 'true';
const externalBaseURL = process.env.PW_BASE_URL?.trim();
const storageState = process.env.PW_STORAGE_STATE?.trim();

export default defineConfig({
  testDir: './e2e-tests',
  timeout: 30000,
  fullyParallel: true,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: externalBaseURL || 'http://localhost:3000',
    ...(storageState ? { storageState } : {}),
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Playwright starts (and stops) the app itself so the suite is reproducible
  // both locally and in CI without a pre-running dev server. An external
  // PW_BASE_URL is already served, so no webServer is started.
  webServer: externalBaseURL
    ? undefined
    : {
        command: usePreviewServer
          ? 'npm run preview -- --port 3000 --strictPort'
          : 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
