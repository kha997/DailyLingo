# Deployment

DailyLingo is a static SPA. Deployment means publishing the `dist/` directory; there
is no server process, database, or runtime secret.

**No workflow in this repository deploys on push.** The only publishing workflow is
`.github/workflows/staging.yml`, which is `workflow_dispatch`-only, requires the
literal confirmation `STAGING`, and runs behind the protected `staging`
environment. Production deployment is out of scope for Beta and needs separate
Owner authorization.

## 1. Build locally

```bash
npm ci
npm run verify                 # typecheck + coverage + build + bundle budget
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

## 2. Manual staging on Cloudflare Pages (owner-gated)

### One-time setup (Owner only)

1. Create a Cloudflare account and a Pages **Direct Upload** project, once:
   `npx wrangler pages project create dailylingo-staging --production-branch staging`.
   The production branch is fixed at creation for Direct Upload projects, so it must be
   `staging`; otherwise the workflow's `--branch=staging` deploy produces a one-off
   `https://<hash>.dailylingo-staging.pages.dev` preview instead of the stable URL.
2. Create an API token with only the account-scoped permission **Cloudflare Pages: Edit**
   and note the account ID.
3. **Settings → Environments → New environment → `staging`.**
   - Add yourself as a **Required reviewer**.
   - Store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as **environment** secrets,
     not repository secrets, so only the deploy job can read them.
4. Confirm this staging project is separate from any Cloudflare project that serves real
   users. Nothing on this branch touches production infrastructure.

Steps 1–4 are Cloudflare and GitHub settings. They are intentionally **not** performed by
this branch and cannot be performed by the agent: they require credentials the agent must
not hold. The `dailylingo-staging` project does not exist yet, so staging is not deployed.

### Run a staging build

1. Actions → **Staging preview (manual, owner-gated)** → **Run workflow**.
2. Select the exact commit (not a branch tip you have not verified).
3. `confirm`: type `STAGING`.
4. `publish`:
   - `false` — typecheck, tests, coverage, build, bundle check, base-path assertion, and
     upload a downloadable `staging-preview-dist` artifact. No Cloudflare credential is
     read and nothing is published. Use this as the default review path.
   - `true` — additionally requires the `publish_phrase` input typed as `DEPLOY-STAGING`,
     then uploads the artifact the build job validated to Cloudflare Pages with
     `cloudflare/wrangler-action`, subject to `staging` environment approval.

The workflow builds with `VITE_BASE_PATH=/`, so the deployment URL is
`https://dailylingo-staging.pages.dev` and the exact URL from the deploy is reported on
the run and in the environment entry.

### What the workflow runs

`guard` (confirmation) → `build` (`npm ci`, typecheck, coverage, root-based build, bundle
budget, base-path assertion, artifact upload) → `deploy` (only when `publish=true`,
environment `staging`; fails immediately if a credential is missing).

A failed guard, typecheck, test, coverage threshold, bundle budget or base-path assertion
stops the pipeline before any deployment is attempted. The deploy job uploads the bytes
the build job validated; it does not rebuild.

## 3. Rollback

Pick the cheapest correct option:

| Situation | Action |
|---|---|
| Bad build, previous artifact still retained (14 days) | Re-run the workflow at the **previous verified commit** with `publish=true`. |
| Bad build, source regression | `git revert <bad-commit>` through the normal PR flow, then deploy the reverted commit. |
| Staging only, need the site offline | Delete the deployment (or the `dailylingo-staging` project) in the Cloudflare Pages dashboard, or `npx wrangler pages deployment delete`. |
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
- workflow run URL
- `publish` value and environment approval
- `npm run verify` result and bundle-budget numbers
- Playwright result
- known BLOCKED items from [`BETA_ACCEPTANCE.md`](BETA_ACCEPTANCE.md)
