import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Fails the build when the shipped JavaScript grows past the Beta budget or
 * when the analytics chunk (which carries recharts) stops being lazy.
 *
 * Budgets are deliberately set just above the measured Beta build so a real
 * regression fails CI, not every dependency patch.
 */
const BUDGET = {
  initialJsGzipBytes: 140_000,
  initialJsRawBytes: 470_000,
  cssGzipBytes: 16_000,
  distTotalBytes: 2_000_000,
};

const DIST = 'dist';

const fail = (message) => {
  console.error(`\n✗ Bundle budget: ${message}\n`);
  process.exit(1);
};

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
  fail('dist/ is missing. Run `npm run build` first.');
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const assetRefs = (pattern) =>
  [...html.matchAll(pattern)].map((match) => match[1]).filter(Boolean);

const initialScripts = assetRefs(/<script[^>]+src="([^"]+\.js)"/g);
const modulePreloads = assetRefs(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+\.js)"/g);
const initialRefs = [...new Set([...initialScripts, ...modulePreloads])];

if (initialRefs.length === 0) {
  fail('no initial JavaScript found in dist/index.html.');
}

const readAsset = (ref) => {
  const file = ref.replace(/^\//, '');
  return readFileSync(join(DIST, file));
};

const initialRaw = initialRefs.reduce((total, ref) => total + readAsset(ref).length, 0);
const initialGzip = initialRefs.reduce(
  (total, ref) => total + gzipSync(readAsset(ref)).length,
  0
);

const cssRefs = assetRefs(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g);
const cssGzip = cssRefs.reduce((total, ref) => total + gzipSync(readAsset(ref)).length, 0);

const allFiles = readdirSync(DIST, { recursive: true })
  .map((entry) => join(DIST, entry.toString()))
  .filter((file) => statSync(file).isFile());
const distTotal = allFiles.reduce((total, file) => total + statSync(file).size, 0);

const analyticsChunks = allFiles.filter((file) =>
  /ProgressAnalytics-[^/]+\.js$/.test(file)
);
const analyticsIsEager = analyticsChunks.some((file) => {
  const name = file.split('/').pop();
  return initialRefs.some((ref) => ref.includes(name));
});

const analyticsGzip = analyticsChunks.reduce(
  (total, file) => total + gzipSync(readFileSync(file)).length,
  0
);

const rows = [
  ['initial JS (raw)', initialRaw, BUDGET.initialJsRawBytes],
  ['initial JS (gzip)', initialGzip, BUDGET.initialJsGzipBytes],
  ['CSS (gzip)', cssGzip, BUDGET.cssGzipBytes],
  ['dist total', distTotal, BUDGET.distTotalBytes],
];

console.log('\nBundle budget');
for (const [label, actual, budget] of rows) {
  const status = actual <= budget ? '✓' : '✗';
  console.log(
    `  ${status} ${label.padEnd(20)} ${formatKb(actual).padStart(10)} / ${formatKb(budget)}`
  );
}
console.log(
  `  ${analyticsChunks.length > 0 ? '✓' : '✗'} lazy analytics chunk  ` +
    `${formatKb(analyticsGzip)} gzip` +
    (analyticsChunks.length > 0 && !analyticsIsEager ? ' (not referenced by index.html)' : '')
);

const violations = [];
if (initialRaw > BUDGET.initialJsRawBytes) {
  violations.push(`initial JS raw ${formatKb(initialRaw)} > ${formatKb(BUDGET.initialJsRawBytes)}`);
}
if (initialGzip > BUDGET.initialJsGzipBytes) {
  violations.push(
    `initial JS gzip ${formatKb(initialGzip)} > ${formatKb(BUDGET.initialJsGzipBytes)}`
  );
}
if (cssGzip > BUDGET.cssGzipBytes) {
  violations.push(`CSS gzip ${formatKb(cssGzip)} > ${formatKb(BUDGET.cssGzipBytes)}`);
}
if (distTotal > BUDGET.distTotalBytes) {
  violations.push(`dist total ${formatKb(distTotal)} > ${formatKb(BUDGET.distTotalBytes)}`);
}
if (analyticsChunks.length === 0) {
  violations.push('analytics chunk is missing; recharts may have been folded back into the entry');
}
if (analyticsIsEager) {
  violations.push('analytics chunk is referenced by index.html; it must stay lazy');
}

if (violations.length > 0) {
  fail(violations.join('; '));
}

console.log('\n✓ Bundle budget passed.\n');
