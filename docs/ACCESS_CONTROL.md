# Access control for the Beta staging site

The staging site is a static SPA with no server-side data. Learner data stays in
each browser's `localStorage`; Cloudflare never receives it. Access control is
still required so the Beta cannot be used, copied, or indexed by anyone outside
the approved tester list, and so the `workers.dev` hostname and preview URLs are
not reachable without sign-in.

## 1. Design

- The site is the assets-only Cloudflare Worker `dailylingo`. It serves `dist/`
  through Workers Static Assets; there is no Worker script and no API.
- Access is enabled at the **Worker** level: Workers & Pages → `dailylingo` →
  **Access** → **Protect this Worker behind Access** → **All traffic**.
  Worker-level Access automatically covers the `workers.dev` hostname, preview
  URLs, routes, and custom domains associated with that Worker.
- Login uses the built-in **One-time PIN** identity provider. A tester enters an
  email on the Access login page, receives a PIN, and signs in. No external IdP
  or paid seat is required.
- The Access policy is an `Allow` policy containing only explicit tester email
  addresses. There is no "Everyone", no bypass policy, and no service token that
  reaches the browser.
- Because Access is enforced at the edge before the static assets are served, an
  unauthenticated request must receive an Access login redirect or block, never
  `index.html`.

Official sources checked on 2026-11-04:

- [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
  — worker-level Access protects every domain associated with the Worker,
  including `workers.dev`, previews, routes, and custom domains.
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
  — assets directory and `not_found_handling: "single-page-application"`.
- [One-time PIN login](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).
- [Cloudflare One free plan](https://developers.cloudflare.com/reference-architecture/architectures/sase/)
  (free for up to 50 users).

## 2. One-time Owner setup (dashboard)

Do this before the first Workers Builds deployment. Do not publish first and
protect afterwards.

1. **Enable Zero Trust** on the Cloudflare account if it is not already on.
2. **Protect the Worker:** Workers & Pages → `dailylingo` → **Access** →
   **Protect this Worker behind Access**.
3. Choose **All traffic** (production and previews), not "Previews only".
4. Create or select an **Allow** policy containing each tester's email address.
   Do not use "Everyone", a broad email domain, or a bypass policy.
5. Confirm the login method is **One-time PIN** and set a short session duration
   (for example 24 hours).
6. Do not add a custom domain for the Beta. Worker-level Access would cover it,
   but there is no need to expand the attack surface.
7. No Cloudflare API token is needed for Workers Builds to deploy. If a token is
   ever added for manual rollback, scope it to Workers Scripts: Edit only.

Never paste a PIN, Access cookie, API token, or account password into chat, an
issue, a commit, or a build log.

## 3. Verify before and after publishing

Run the unauthenticated probe against the Worker hostname (no credentials, no
cookies):

```bash
node scripts/verify-access-control.mjs \
  https://dailylingo.<account-subdomain>.workers.dev/
```

Expected: `PROTECTED`. A `404`, an unexpected redirect, or a `200` without an
Access challenge is `INCONCLUSIVE`; app content returned without Access is
`UNPROTECTED`. Both block publication.

The classifier has a self-test; CI runs it on every build:

```bash
npm run test:access-control
```

Unauthorized browser check:

1. Open a private window with no Cloudflare Access session.
2. Navigate to the Worker URL.
3. Expected: the Cloudflare Access login page; no DailyLingo navigation, no
   lesson content, no JavaScript bundle.
4. `curl -I <worker-url>` should show a redirect to `*.cloudflareaccess.com` or
   a block, not `200` with the app.

Authorized browser check (Owner or an approved tester):

```bash
STAGING_URL=https://dailylingo.<account-subdomain>.workers.dev npm run staging:auth
# Complete the one-time PIN in the window that opens.
STAGING_URL=https://dailylingo.<account-subdomain>.workers.dev npm run test:e2e:staging
```

`staging:auth` saves `.auth/staging.json`, which contains Access session
cookies. It is gitignored and written with mode 0600; delete it when finished and
never share or upload it. `test:e2e:staging` runs the same 16 Playwright
journeys against the deployed site. Playwright is a real browser but not real
hardware: microphone, TTS, permission prompts, and slow networks still require
the [real-device matrix](real-device-matrix.md).

## 4. Deployment gates

The active path is Cloudflare Workers Builds from branch `staging`:

1. Worker Access must be enabled for **All traffic** before the first build.
2. `package-lock.json` is the only lockfile. Workers Builds installs with npm,
   runs `npm run build`, and `npx wrangler deploy` uploads `dist/` as static
   assets.
3. Hosted GitHub CI must be green for the exact commit: typecheck, tests,
   coverage, timezone matrix, Access self-test, build, bundle budget, Wrangler
   static-assets dry-run, and Playwright.
4. After deployment, run the unauthenticated probe and both browser checks
   above. Do not share the URL until all three pass.
5. The inactive Pages Direct Upload workflow is not part of this path. It is
   manual-only and cannot publish without a Pages project and credentials.

## 5. Incident response

If Access is missing after a deployment:

1. Do not share the URL.
2. Set the Worker's Access policy to **Block** immediately.
3. Roll back to the previous Worker version in Workers & Pages → `dailylingo` →
   Deployments, or with an authorized `npx wrangler rollback`.
4. Do not delete the Worker without Owner approval; deletion is not required to
   stop access and would remove the project the Owner created.
5. Rotate any API token that may have leaked, then update the stored secret.
6. Record the incident, Worker version ID, commit SHA, and probe output in the PR
   or acceptance record.

## 6. Cost and limits

- Static asset requests on Workers are included in the Workers Free plan;
  Access is free for up to 50 users, including One-time PIN. Adding a 51st user
  requires a paid plan; do not enable paid services or add seats without Owner
  approval.
- No paid WAF, Load Balancer, or custom-domain feature is required.

## 7. Known limitations

- Access protects the hostname, not the browser's `localStorage`. A tester who
  exports a backup still holds learner content; treat backups as private.
- Access login happens before the static assets load. After login the browser is
  on the normal `workers.dev` origin, so microphone and speech-synthesis
  permissions behave as usual — but this still needs real-device verification.
- The probe is black-box and unauthenticated. It can prove that no app shell is
  served without Access, not that every policy is configured as intended; review
  the Worker Access policy before publishing.
- Real-device microphone, TTS, permission-denied, and slow-network results
  remain `UNTESTED` until executed on the hardware listed in
  [`real-device-matrix.md`](real-device-matrix.md).
