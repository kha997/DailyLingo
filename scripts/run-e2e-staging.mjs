#!/usr/bin/env node
/**
 * Run the Playwright journeys against the Access-protected staging URL.
 * Requires a storage state captured after the Owner completes the one-time PIN.
 * Playwright still runs in a real browser, but this is not real-device hardware.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const url = process.env.STAGING_URL;
const state = resolve(process.env.PW_STORAGE_STATE || '.auth/staging.json');

if (!url) {
  console.error('Set STAGING_URL to the Access-protected staging URL.');
  console.error('Example: STAGING_URL=https://dailylingo-staging.pages.dev npm run test:e2e:staging');
  process.exit(1);
}

if (!existsSync(state)) {
  console.error(`No Access session found at ${state}.`);
  console.error('Run `npm run staging:auth` first and complete the one-time PIN.');
  process.exit(1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npx, ['playwright', 'test'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PW_BASE_URL: url,
    PW_STORAGE_STATE: state,
  },
});

process.exit(result.status ?? 1);
