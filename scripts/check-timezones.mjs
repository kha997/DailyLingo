import { spawnSync } from 'node:child_process';

/**
 * Dates are stored as local calendar days ("YYYY-MM-DD"). This gate re-runs the
 * date/review suites in three timezones so a UTC-only assumption cannot pass
 * locally and fail for a learner in Vietnam or California.
 */
const ZONES = ['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles'];
const FILES = ['src/utils/storage.test.ts', 'src/data/curriculumData.test.ts'];

let failed = false;

for (const zone of ZONES) {
  console.log(`\n── TZ=${zone} ──`);
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vitest', 'run', ...FILES],
    {
      stdio: 'inherit',
      env: { ...process.env, TZ: zone },
    }
  );
  if (result.status !== 0) {
    failed = true;
    console.error(`✗ date/review suites failed under TZ=${zone}`);
  }
}

if (failed) {
  console.error('\n✗ Timezone matrix failed.\n');
  process.exit(1);
}

console.log('\n✓ Timezone matrix passed (UTC, Asia/Ho_Chi_Minh, America/Los_Angeles).\n');
