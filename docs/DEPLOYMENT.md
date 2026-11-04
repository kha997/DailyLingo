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

## 2. Manual staging on Cloudflare Pages (owner-gated)

### One-time setup (Owner only)

1. Create a Cloudflare account and a Pages **Direct Upload** project, once:
   `npx wrangler pages project create dailylingo-staging --production-branch staging`.
   The workflow never creates the project itself. The production branch is fixed at
   creation for Direct Upload projects: if it is not `staging`, the deploy lands on a
   preview deployment, which still refreshes in place under its branch alias URL but not
   at the project root URL `https://dailylingo-staging.pages.dev`.
2. Put the project behind Cloudflare Access **before any deployment**, with one
   application for `dailylingo-staging.pages.dev` and one for
   `*.dailylingo-staging.pages.dev`, each restricted to explicit tester emails. Follow
   [`ACCESS_CONTROL.md`](ACCESS_CONTROL.md) for the exact Pages
   "Enable access policy" / known-issues steps and the One-time PIN setup. Verify with
   `node scripts/verify-access-control.mjs` before publishing.
3. Create an API token with only the account-scoped permission **Cloudflare Pages: Edit**
   and note the account ID.
4. **Settings → Environments → New environment → `staging`.**
   - Add yourself as a **Required reviewer**.
   - Store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as **environment** secrets,
     not repository secrets, so only the deploy job can read them.
5. Confirm this staging project is separate from any Cloudflare project that serves real
   users. Nothing on this branch touches production infrastructure.

Steps 1–5 are Cloudflare and GitHub settings. They are intentionally **not** performed by
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
   - `true` — additionally requires the `publish_phrase` input typed as `DEPLOY-STAGING`.
     Before any upload, the workflow proves that Cloudflare Access challenges the
     production hostname. It then uploads the artifact the build job validated with
     `cloudflare/wrangler-action`, subject to `staging` environment approval, and probes
     the production, immutable deployment, and branch alias URLs with retries. If
     protection is not proven on every URL — confirmed exposure or an inconclusive probe
     — the new deployment is deleted, production is re-probed, and the project is deleted
     if exposure remains; the run fails closed.

The workflow builds with `VITE_BASE_PATH=/`, so the deployment URL is
`https://dailylingo-staging.pages.dev` and the exact URL from the deploy is reported on
the run and in the environment entry. The upload carries `--commit-hash=<github.sha>`.

### What the workflow runs

`guard` (confirmation) → `build` (`npm ci`, Access-probe self-test, typecheck, coverage,
root-based build, bundle budget, base-path assertion, artifact upload) → `deploy` (only
when `publish=true`, environment `staging`; fails immediately if a credential is missing,
then requires an Access challenge on the production hostname before upload, and probes the
production, immutable deployment, and branch alias URLs afterwards).

A failed guard, self-test, typecheck, test, coverage threshold, bundle budget, base-path
assertion, or Access preflight stops the pipeline before any deployment is attempted. The
deploy job uploads the bytes the build job validated; it does not rebuild. The post-upload
probe always writes its outputs and exits zero, and a separate enforcement step fails the
run when protection is not proven, so a failed or partial upload cannot bypass the gate.

## 3. Rollback

Pick the cheapest correct option:

| Situation | Action |
|---|---|
| Bad build, previous artifact still retained (14 days) | Re-run the workflow at the **previous verified commit** with `publish=true`. |
| Bad build, source regression | `git revert <bad-commit>` through the normal PR flow, then deploy the reverted commit. |
| Staging only, need the site offline | Delete the deployment (or the `dailylingo-staging` project) in the Cloudflare Pages dashboard, or `npx wrangler pages deployment delete <deployment-id> --project-name dailylingo-staging --force`. |
| Access control broken or not proven | Stop sharing the URL. The workflow deletes the new deployment, re-probes production, and deletes the project if exposure remains; if a rollback could not be confirmed, do it manually, then set both Access applications to **Block**; follow [`ACCESS_CONTROL.md`](ACCESS_CONTROL.md) before retrying. |
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
- Access preflight and post-deploy probe result (authorized and unauthorized)
- Playwright result
- known BLOCKED items from [`BETA_ACCEPTANCE.md`](BETA_ACCEPTANCE.md)
