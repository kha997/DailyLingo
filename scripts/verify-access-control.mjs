#!/usr/bin/env node
/**
 * Black-box check that a Cloudflare Pages URL is behind Cloudflare Access.
 *
 * Sends an unauthenticated request with redirects disabled and requires an
 * Access login redirect, an Access login page, or 401/403 without the app shell.
 * It never reads credentials, cookies, or learner data.
 *
 * Exit codes: 0 = every URL protected, 2 = app content exposed,
 * 1 = inconclusive (missing project, 404, network error, unexpected redirect).
 * ACCESS_PROBE_ALWAYS_EXIT_ZERO=1 makes the CI wrapper capture outputs and lets
 * a later workflow step fail; the default CLI behavior remains fail-closed.
 */
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const APP_MARKERS = [
  '<div id="root">',
  'DailyLingo - Học Tiếng Anh Mỗi Ngày',
  'Lộ Trình Học Tập Chuẩn Khung CEFR',
  '/assets/index-',
];

const ACCESS_BODY_MARKERS = ['cloudflareaccess.com', '/cdn-cgi/access/', 'cf-access'];

const ACCESS_LOGIN_PATH = /\/cdn-cgi\/access\//i;

const resolveLocation = (location, base) => {
  try {
    return new URL(location, base);
  } catch {
    return null;
  }
};

const isAccessLoginLocation = (location, base) => {
  const resolved = resolveLocation(location, base);
  if (!resolved) return false;
  if (resolved.hostname.endsWith('.cloudflareaccess.com')) return true;
  const baseUrl = new URL(base);
  return resolved.origin === baseUrl.origin && ACCESS_LOGIN_PATH.test(resolved.pathname);
};

export function classifyProbe({ status, location = '', body = '', url }) {
  const hasAppShell = APP_MARKERS.some((marker) => body.includes(marker));

  if (status >= 300 && status < 400) {
    if (!location) {
      return { verdict: 'inconclusive', reason: `HTTP ${status} without a Location header` };
    }
    if (isAccessLoginLocation(location, url)) {
      return { verdict: 'protected', reason: `HTTP ${status} to Cloudflare Access login` };
    }
    return { verdict: 'inconclusive', reason: `HTTP ${status} to an unexpected location` };
  }

  if (status === 401 || status === 403) {
    if (hasAppShell) {
      return { verdict: 'unprotected', reason: `HTTP ${status} but the app shell is present` };
    }
    if (ACCESS_BODY_MARKERS.some((marker) => body.includes(marker))) {
      return { verdict: 'protected', reason: `HTTP ${status} with positive Access evidence` };
    }
    return { verdict: 'inconclusive', reason: `HTTP ${status} without positive Access evidence` };
  }

  if (status === 200) {
    if (hasAppShell) {
      return { verdict: 'unprotected', reason: 'HTTP 200 with the app shell' };
    }
    if (ACCESS_BODY_MARKERS.some((marker) => body.includes(marker))) {
      return { verdict: 'protected', reason: 'HTTP 200 Access login page' };
    }
    return { verdict: 'inconclusive', reason: 'HTTP 200 without app or Access markers' };
  }

  return { verdict: 'inconclusive', reason: `HTTP ${status}` };
}

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

async function readSnippet(response, maxBytes = 64 * 1024) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      const remaining = maxBytes - total;
      chunks.push(chunk.subarray(0, remaining));
      total += Math.min(chunk.length, remaining);
      if (chunk.length > remaining) break;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The body is already complete or the stream is closed.
    }
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function probeUrl(url, { timeoutMs = 15_000, fetchImpl = fetch } = {}) {
  const target = new URL(url);
  if (target.protocol !== 'https:') {
    throw new Error(`Refusing non-HTTPS URL: ${url}`);
  }

  const response = await fetchImpl(target, {
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'User-Agent': 'DailyLingo-Access-Probe/1.0',
      Accept: 'text/html,application/xhtml+xml',
      'Cache-Control': 'no-cache',
    },
  });

  const body = [200, 401, 403].includes(response.status)
    ? await readSnippet(response)
    : '';
  if (![200, 401, 403].includes(response.status)) {
    response.body?.cancel().catch(() => {});
  }

  return {
    url: target.href,
    status: response.status,
    location: response.headers.get('location') ?? '',
    ...classifyProbe({
      status: response.status,
      location: response.headers.get('location') ?? '',
      body,
      url: target.href,
    }),
  };
}

function writeGithubOutputs(results) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  const unprotected = results.some((result) => result.verdict === 'unprotected');
  const inconclusive = results.some((result) => result.verdict === 'inconclusive');
  const allProtected =
    results.length > 0 && results.every((result) => result.verdict === 'protected');
  appendFileSync(
    output,
    `unprotected=${unprotected}\ninconclusive=${inconclusive}\nprotected=${allProtected}\n`
  );
}

function parseArgs(argv) {
  const options = {
    selfTest: false,
    json: false,
    urls: [],
    timeoutMs: Number(process.env.ACCESS_PROBE_TIMEOUT_MS ?? 15_000),
    retries: Number(process.env.ACCESS_PROBE_RETRIES ?? 0),
    retryDelayMs: Number(process.env.ACCESS_PROBE_RETRY_DELAY_MS ?? 2_000),
    alwaysZero: process.env.ACCESS_PROBE_ALWAYS_EXIT_ZERO === '1',
  };

  for (const arg of argv) {
    if (arg === '--self-test') options.selfTest = true;
    else if (arg === '--json') options.json = true;
    else if (arg.startsWith('--timeout=')) {
      options.timeoutMs = Number(arg.slice('--timeout='.length));
    } else if (arg.startsWith('--retries=')) {
      options.retries = Number(arg.slice('--retries='.length));
    } else if (arg.startsWith('--retry-delay=')) {
      options.retryDelayMs = Number(arg.slice('--retry-delay='.length));
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.urls.push(arg);
    }
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error('Access probe timeout must be a positive number of milliseconds.');
  }
  if (!Number.isInteger(options.retries) || options.retries < 0) {
    throw new Error('Access probe retries must be a non-negative integer.');
  }
  if (!Number.isFinite(options.retryDelayMs) || options.retryDelayMs < 0) {
    throw new Error('Access probe retry delay must be a non-negative number of milliseconds.');
  }
  return options;
}

async function probeWithRetries(url, options) {
  let result;
  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    try {
      result = await probeUrl(url, { timeoutMs: options.timeoutMs });
    } catch (error) {
      result = {
        url,
        status: null,
        verdict: 'inconclusive',
        reason: error instanceof Error ? error.message : String(error),
      };
    }
    if (result.verdict !== 'inconclusive' || attempt === options.retries) {
      return result;
    }
    await delay(options.retryDelayMs);
  }
  return result;
}

export function runSelfTest() {
  const base = 'https://dailylingo-staging.pages.dev/';
  const cases = [
    {
      name: '302 to the Access team login',
      input: {
        status: 302,
        location: 'https://daily.cloudflareaccess.com/cdn-cgi/access/login/staging?redirect_url=x',
        url: base,
      },
      expected: 'protected',
    },
    {
      name: '302 to a relative Access login path',
      input: { status: 302, location: '/cdn-cgi/access/login/staging', url: base },
      expected: 'protected',
    },
    {
      name: '307 to the Access login',
      input: {
        status: 307,
        location: 'https://daily.cloudflareaccess.com/cdn-cgi/access/login',
        url: base,
      },
      expected: 'protected',
    },
    {
      name: '302 to an unrelated host',
      input: { status: 302, location: 'https://example.com/', url: base },
      expected: 'inconclusive',
    },
    {
      name: '302 to an unrelated host with an Access-looking path',
      input: { status: 302, location: 'https://example.com/cdn-cgi/access/login', url: base },
      expected: 'inconclusive',
    },
    {
      name: '302 without Location',
      input: { status: 302, url: base },
      expected: 'inconclusive',
    },
    {
      name: '200 with the app shell',
      input: {
        status: 200,
        body: '<!doctype html><div id="root"></div><script src="/assets/index-abc.js">',
        url: base,
      },
      expected: 'unprotected',
    },
    {
      name: '200 Access login page',
      input: {
        status: 200,
        body: '<html><script src="https://daily.cloudflareaccess.com/cdn-cgi/access/login"></script></html>',
        url: base,
      },
      expected: 'protected',
    },
    {
      name: '200 unknown content',
      input: { status: 200, body: '<html>Not found</html>', url: base },
      expected: 'inconclusive',
    },
    {
      name: '403 without positive Access evidence',
      input: { status: 403, body: 'Forbidden', url: base },
      expected: 'inconclusive',
    },
    {
      name: '403 with positive Access evidence',
      input: { status: 403, body: '<html>cloudflareaccess.com</html>', url: base },
      expected: 'protected',
    },
    {
      name: '403 with app content',
      input: { status: 403, body: '<div id="root"></div>', url: base },
      expected: 'unprotected',
    },
    {
      name: '404 from a missing project',
      input: { status: 404, body: 'Not found', url: base },
      expected: 'inconclusive',
    },
    {
      name: '500 from the edge',
      input: { status: 500, body: 'error', url: base },
      expected: 'inconclusive',
    },
  ];

  for (const testCase of cases) {
    const result = classifyProbe(testCase.input);
    if (result.verdict !== testCase.expected) {
      throw new Error(
        `Self-test "${testCase.name}": expected ${testCase.expected}, got ${result.verdict} (${result.reason})`
      );
    }
  }

  console.log(`Access-control probe self-test passed (${cases.length} cases).`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.selfTest) {
    runSelfTest();
    return;
  }

  if (options.urls.length === 0) {
    console.error('Usage: node scripts/verify-access-control.mjs <https-url> [...]');
    console.error('       node scripts/verify-access-control.mjs --self-test');
    process.exit(1);
  }

  const results = [];
  for (const url of options.urls) {
    results.push(await probeWithRetries(url, options));
  }

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const result of results) {
      console.log(`${result.verdict.toUpperCase().padEnd(13)} ${result.url} (${result.reason})`);
    }
  }

  writeGithubOutputs(results);

  if (options.alwaysZero) {
    return;
  }
  if (results.some((result) => result.verdict === 'unprotected')) {
    process.exit(2);
  }
  if (results.some((result) => result.verdict === 'inconclusive')) {
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`Access-control probe failed: ${error.message}`);
    process.exit(1);
  });
}
