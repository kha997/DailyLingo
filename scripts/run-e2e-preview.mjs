/**
 * Run the Playwright journeys against the *production* bundle instead of the
 * Vite dev server. The dev server is fine for fast feedback, but it hides
 * build-only failures (asset base path, minification, lazy-chunk URLs). CI uses
 * the same path by downloading the `production-build` artifact and setting
 * PW_PREVIEW.
 */
import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const build = spawnSync(npm, ['run', 'build'], { stdio: 'inherit' });
if (build.status !== 0) {
  console.error('Production build failed; not running browser journeys.');
  process.exit(build.status ?? 1);
}

const tests = spawnSync(npx, ['playwright', 'test'], {
  stdio: 'inherit',
  env: { ...process.env, PW_PREVIEW: '1' },
});

process.exit(tests.status ?? 1);
