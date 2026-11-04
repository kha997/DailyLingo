#!/usr/bin/env node
/**
 * Local-only helper: open the Access-protected staging site in a headed
 * Chromium window, let the Owner complete the Cloudflare Access one-time PIN,
 * then save the browser storage state for the authorized Playwright run.
 *
 * The saved file contains Access session cookies. It is gitignored and must not
 * be shared, uploaded, or committed.
 */
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const url = process.env.STAGING_URL || process.argv[2];
if (!url) {
  console.error('Usage: STAGING_URL=https://dailylingo-staging.pages.dev npm run staging:auth');
  process.exit(1);
}
if (!url.startsWith('https://')) {
  console.error('STAGING_URL must be an https:// URL; refusing to sign in over plaintext.');
  process.exit(1);
}

const output = resolve(process.env.PW_STORAGE_STATE || '.auth/staging.json');
if (existsSync(output)) {
  console.error(`Refusing to overwrite the existing session file: ${output}`);
  console.error('Delete it first if you intend to sign in again.');
  process.exit(1);
}

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log(`Opening ${url}`);
console.log('Complete the Cloudflare Access sign-in in the browser window. Waiting up to 5 minutes...');

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const initialHost = new URL(page.url()).hostname;
  const sawAccessHost = initialHost.endsWith('.cloudflareaccess.com');
  if (!sawAccessHost) {
    console.warn(
      `WARNING: the first navigation landed on ${initialHost}, not a cloudflareaccess.com login page. ` +
        'A fresh browser context has no Access session, so confirm with ' +
        '`node scripts/verify-access-control.mjs ' +
        url +
        '` that the site is actually protected before using this session.'
    );
  }

  await page.waitForSelector('#root', { timeout: 5 * 60 * 1000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  mkdirSync(dirname(output), { recursive: true });
  await context.storageState({ path: output });
  chmodSync(output, 0o600);
  console.log(`Saved the Access session to ${output} (mode 0600).`);
  console.log('This file contains session cookies: keep it out of git and do not share it.');
} finally {
  await browser.close();
}
