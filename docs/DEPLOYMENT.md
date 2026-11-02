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
VITE_BASE_PATH=/DailyLingo/ npm run build
npx vite preview --port 4173   # smoke-test http://localhost:4173/DailyLingo/
```

- Root hosting (`https://example.com/`): leave `VITE_BASE_PATH` unset.
- Project sub-path (`https://example.com/DailyLingo/`): set `VITE_BASE_PATH` at
  build time. It must match the served path exactly, including the trailing slash.
- The build is immutable per commit; do not rebuild from a moving branch when
  validating a release candidate.

`dist/` contains `index.html`, hashed JS/CSS, and three optimized JPEGs. It is
fully self-contained and can be served by any static host.

## 2. Manual staging on GitHub Pages (owner-gated)

### One-time repository setup (Owner only)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Environments → New environment → `staging`.**
   - Add yourself as a **Required reviewer**.
   - Optionally restrict deployment branches to `main`.
3. Confirm the repository does **not** already publish a production site from
   Pages. A repository has one Pages site; publishing staging replaces whatever
   that site currently serves.

These are repository settings. They are intentionally **not** changed by this
branch and cannot be changed by the agent.

### Run a staging build

1. Actions → **Staging preview (manual, owner-gated)** → **Run workflow**.
2. Select the exact commit (not a branch tip you have not verified).
3. `confirm`: type `STAGING`.
4. `publish`:
   - `false` — typecheck, tests, coverage, build, bundle check, and upload a downloadable
     `staging-preview-dist` artifact. Nothing is published. Use this as the
     default review path.
   - `true` — additionally deploy `dist/` to the `staging` environment, subject to
     its required-reviewer rule.

The workflow builds with `VITE_BASE_PATH=/DailyLingo/`, so the preview URL is
`https://<owner>.github.io/DailyLingo/`.

### What the workflow runs

`guard` (confirmation) → `build` (`npm ci`, typecheck, coverage, build, bundle budget,
artifact upload) → `deploy` (only when `publish=true`, environment `staging`).

A failed guard, typecheck, test, coverage threshold, or bundle budget stops the
pipeline before any artifact is published.

## 3. Rollback

Pick the cheapest correct option:

| Situation | Action |
|---|---|
| Bad build, previous artifact still retained (14 days) | Re-run the workflow at the **previous verified commit** with `publish=true`. |
| Bad build, source regression | `git revert <bad-commit>` through the normal PR flow, then deploy the reverted commit. |
| Staging only, need the site offline | Settings → Pages → unpublish, or deploy an empty/placeholder artifact. |
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
