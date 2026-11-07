# Deployment

DailyLingo is a static SPA. Deployment means publishing the `dist/` directory; there
is no server process, database, or runtime secret.

**Active staging platform: Cloudflare Workers Static Assets.** The assets-only Worker
`dailylingo` is built by Workers Builds from branch `staging` and served from
`dist/`; `wrangler.jsonc` supplies the SPA fallback. Production deployment is out of
scope for Beta and needs separate Owner authorization.

The earlier Pages Direct Upload workflow remains in the repository as an inactive
manual fallback only. Do not run it unless the Owner explicitly re-adopts Pages.

## 1. Build locally

```bash
npm ci
npm run verify                 # access probe self-test + typecheck + coverage + build + bundle budget
npm run check:bundle           # reads dist/index.html against dist/
```

- Cloudflare Pages, and any other host that serves the site at the root of a domain,
  needs `VITE_BASE_PATH` unset or `/`. The staging workflow builds this way.
- A project sub-path (`https://example.com/DailyLingo/`) needs `VITE_BASE_PATH` set at
  build time, matching the served path exactly including the trailing slash. That is a
  GitHub Pages project-site convention, not what Cloudflare Pages serves.
- `npm run check:bundle` resolves asset references relative to `dist/`, so it fails on a
  sub-path build. Do not run it after building with a non-root base.
- The build is immutable per commit; do not rebuild from a moving branch when
  validating a release candidate.

`dist/` contains `index.html`, hashed JS/CSS, and three optimized JPEGs. It is
fully self-contained and can be served by any static host.

## 2. Staging on Cloudflare Workers (owner-gated)

DailyLingo is served by the assets-only Worker `dailylingo`. `wrangler.jsonc` uploads
`dist/` as static assets with `not_found_handling: "single-page-application"`, so
client-side routes return `index.html`. There is no Worker script, no server process, and
no runtime secret.

### One-time setup (Owner only)

1. The Worker project `dailylingo` already exists in the Owner's Cloudflare account. Do
   not create a second project or delete it.
2. Put the Worker behind Cloudflare Access **before the first deployment**: Workers &
   Pages → `dailylingo` → **Access** → **Protect this Worker behind Access** → **All
   traffic**. Use an `Allow` policy with explicit tester emails, One-time PIN, and a short
   session (24 hours). Worker-level Access covers the `workers.dev` hostname, preview
   URLs, routes, and custom domains. Details: [`ACCESS_CONTROL.md`](ACCESS_CONTROL.md).
3. Workers Builds → Settings → Build: repository `kha997/DailyLingo`, production branch
   `staging`, root directory `/`, build command `npm run build`, deploy command
   `npx wrangler deploy`. Set `NODE_VERSION=22` if the build image does not already default
   to Node 22.
4. If accounts are enabled, add build variables `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` under Workers Builds → Settings → Build. Both are public
   values; the anon key is safe in the client bundle. A build without them ships in
   guest mode and the account sheet says sign-up is not enabled.
5. Keep the build command on npm. The repository now ships only `package-lock.json`;
   `bun.lock` was removed because the frozen bun install on `main` failed before `vite`
   was installed. Do not switch the build command back to `bun run build`.
6. Confirm no paid plan or service is required. Do not add a custom domain unless a
   separate Access application is configured for it.

Steps 1–5 are Cloudflare settings. They are intentionally **not** performed by the agent:
they require account access the agent does not hold.

### Run a staging build

1. Push the approved commit to branch `staging`, or select **Retry build** on that branch
   in Workers Builds.
2. Cloudflare installs with npm, runs `npm run build`, then `npx wrangler deploy`. The
   build is tied to the commit SHA shown in the Workers Builds run.
3. The deployment URL is `https://dailylingo.<account-subdomain>.workers.dev/`; the exact
   hostname is shown in the Worker overview and the build log.
4. Before sharing the URL, confirm an authorized tester can sign in and a private window
   without a session cannot see the app.

### What the build runs

Workers Builds performs the install from `package-lock.json`, then the build command
(`npm run build`, which is `vite build` with the root base path), then
`npx wrangler deploy`. `wrangler.jsonc` uploads the files in `dist/`.
Hosted GitHub CI independently runs `npm ci`, the Access self-test, typecheck, coverage,
the timezone matrix, the build, the bundle budget, the static-assets dry-run, and the
Playwright journeys.

### Optional accounts (Supabase)

Accounts are optional and do **not** replace Cloudflare Access. The Worker still blocks
unauthenticated visitors; creating an account in the app does not grant access, so
testers must remain in the Access allow policy.

- Create a free Supabase project, then set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` as build variables for the Worker.
- Never add the `service_role` key. It bypasses row-level security and must not reach
  a client bundle.
- The session is kept in `localStorage`. Learning progress stays on the device;
  multi-device sync is not part of this release.
- Supabase's built-in mailer is rate-limited on the free plan. Either disable
  "Confirm email" for a small Beta or configure custom SMTP before inviting testers.
- Without the two variables the account sheet shows a configuration notice and the
  rest of the app works as before.

The inactive Pages workflow (`.github/workflows/staging.yml`) is not part of this path. It
is manual-only and fails closed if run without Pages setup, so it cannot publish by
accident.

## 3. Rollback

Pick the cheapest correct option:

| Situation | Action |
|---|---|
| Bad build, previous version retained | Roll back to the previous Worker version in Workers & Pages → `dailylingo` → Deployments, or with an authorized `npx wrangler rollback`. |
| Bad build, source regression | `git revert <bad-commit>` on `staging`, then let Workers Builds deploy the reverted commit. |
| Staging only, need the site offline | Set the Worker's Access policy to **Block**, or roll back to a known-good version. Do not delete the Worker without Owner approval. |
| Access control broken or not proven | Stop sharing the URL, set the Worker Access policy to **Block**, roll back the version, then follow [`ACCESS_CONTROL.md`](ACCESS_CONTROL.md) before retrying. |
| Learner data problem | Rollback does not touch learner data: it lives in each browser, not on the host. Use the backup/restore procedure in [`OPERATIONS.md`](OPERATIONS.md). |

Never “fix forward” on a deployment that has not passed `npm run verify` and the
Playwright suite.

## 4. Production (not performed)

Production is BLOCKED pending Owner authorization. Before any production deploy:

- Re-run all verification on the exact commit.
- Confirm a real-device matrix (microphone, TTS, permissions, unsupported APIs,
  slow network) has been completed.
- Complete the privacy/feedback review and branch-protection decision.
- Agree an owner, rollback path, and support channel.
- Add a separate, explicitly approved production workflow; do not reuse the
  staging environment.

## 5. Local static hosting (no GitHub)

Any static file server works. For a sub-path deployment, mount `dist/` at the same
path used for `VITE_BASE_PATH`.

```bash
npx serve dist            # root path
npx vite preview          # uses the base path baked into the build
```

Do not serve `dist/` from a path that differs from the build base: asset URLs are
absolute and will 404.

## 6. Release record

For each staging build, record:

- commit SHA
- Workers Builds run and Worker version ID
- `npm run verify` result and bundle-budget numbers
- Access probe result (authorized and unauthorized)
- Playwright result
- known BLOCKED items from [`BETA_ACCEPTANCE.md`](BETA_ACCEPTANCE.md)
