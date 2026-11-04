# Access control for the Beta staging site

The staging site is a static SPA with no server-side data. Learner data stays in
each browser's `localStorage`; Cloudflare never receives it. Access control is
still required so the Beta cannot be used, copied, or indexed by anyone outside
the approved tester list, and so every deployment URL — including immutable
`<hash>.<project>.pages.dev` URLs — is protected.

## 1. Design

- Cloudflare Access (Zero Trust) runs at the edge in front of the Pages project.
- Two hostname applications protect every URL that serves the same bundle:
  1. `dailylingo-staging.pages.dev` — the production deployment.
  2. `*.dailylingo-staging.pages.dev` — preview, branch-alias, and immutable
     deployment URLs.
- Login uses the built-in **One-time PIN** identity provider. A tester enters an
  email on the Access login page, receives a PIN, and signs in. No external IdP
  or paid seat is required.
- Each application has one `Allow` policy containing only the explicit tester
  email addresses. There is no "Everyone", no bypass policy, and no service
  token that reaches the browser.
- The GitHub workflow verifies the challenge on the production hostname before
  uploading, then probes the production, immutable deployment, and branch alias
  URLs after uploading. A plain `404`, an unexpected redirect, or a `200` without
  an Access challenge is **not proven protected** and fails closed; a deployment
  that cannot be proven protected is deleted.

Official sources checked on 2026-11-04:

- [Protect preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
  — Pages can create an Access policy for previews. By itself it protects only
  preview URLs, not the production `*.pages.dev` hostname.
- [Known issues: Enable Access on your `*.pages.dev` domain](https://developers.cloudflare.com/pages/platform/known-issues/)
  — official steps to extend that policy to the production `*.pages.dev` domain,
  then recreate the preview wildcard policy.
- [One-time PIN login](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).
- [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) and
  [Cloudflare One free plan](https://developers.cloudflare.com/reference-architecture/architectures/sase/)
  (free for up to 50 users).

## 2. One-time Owner setup (dashboard)

Do this before the first `publish: true` run. Do not deploy the application
first and protect it afterwards.

1. **Create the Pages project** (Direct Upload, production branch `staging`):
   `npx wrangler pages project create dailylingo-staging --production-branch staging`.
   The workflow never creates it.
2. **Enable the Pages Access policy:** Workers & Pages → `dailylingo-staging` →
   Settings → General → **Enable access policy**.
3. **Extend it to the production hostname** (Cloudflare known-issues flow):
   1. In the project's Access policy, select **Manage**.
   2. Zero Trust → Access controls → Applications → select the project.
   3. **Configure** → Public hostname → Subdomain: delete the wildcard `*` and
      save. If the dashboard rejects the save, change the application name and
      retry.
   4. Return to the Pages project → Settings → General → **Enable access policy**
      again. This recreates the preview wildcard application.
   5. Confirm there are now two applications: one for
      `dailylingo-staging.pages.dev` and one for
      `*.dailylingo-staging.pages.dev`.
4. **Restrict both applications to explicit testers:**
   - Zero Trust → Access controls → Applications → select each application →
     Policies → edit the `Allow` policy.
   - Include → **Emails** → add each tester's email address. Do not use
     "Everyone", an email domain wide enough to include strangers, or a bypass
     policy.
   - Confirm the login method is **One-time PIN** and set a short session
     duration (for example 24 hours).
5. **Do not add a custom domain.** If one is added later, Cloudflare requires a
   separate self-hosted Access application for it; without that, authentication
   renders but does not work for custom-domain visitors.
6. **Create a least-privilege API token:** My Profile → API Tokens → Create
   Token → Custom token.
   - Permission: **Account → Cloudflare Pages → Edit** only.
   - Account resources: this account only.
   - No zone, DNS, Workers, or Access permissions.
7. **Create the GitHub `staging` environment:** repository Settings →
   Environments → New environment → `staging`.
   - Add the Owner as a **Required reviewer**.
   - Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as **environment
     secrets**, not repository secrets.
   - The account ID is shown in the Cloudflare dashboard; it is not a secret,
     but it is stored with the token so only the deploy job can read it.

Never paste a token, PIN, Access cookie, or account password into chat, an
issue, a commit, or a workflow log.

## 3. Verify before publishing

Run the unauthenticated probe against the production hostname (no credentials,
no cookies):

```bash
node scripts/verify-access-control.mjs https://dailylingo-staging.pages.dev/
```

Expected: `PROTECTED`. A `404`, an unexpected redirect, or a `200` without an
Access challenge is `INCONCLUSIVE` and blocks publication.

Preview, branch-alias, and immutable deployment URLs cannot exist before the
first upload, so they cannot be probed at this point. The workflow probes them
immediately after upload and deletes the deployment if any of them is not
proven protected (section 4).

The classifier has a self-test; CI runs it on every build:

```bash
npm run test:access-control
```

Unauthorized browser check:

1. Open a private window with no Cloudflare Access session.
2. Navigate to `https://dailylingo-staging.pages.dev/`.
3. Expected: the Cloudflare Access login page; no DailyLingo navigation, no
   lesson content, no JavaScript bundle.
4. `curl -I https://dailylingo-staging.pages.dev/` should show a redirect to
   `*.cloudflareaccess.com` or a `401`/`403`, not `200` with the app.

Authorized browser check (Owner or an approved tester):

```bash
STAGING_URL=https://dailylingo-staging.pages.dev npm run staging:auth
# Complete the one-time PIN in the window that opens.
STAGING_URL=https://dailylingo-staging.pages.dev npm run test:e2e:staging
```

`staging:auth` saves `.auth/staging.json`, which contains Access session
cookies. It is gitignored; delete it when finished and never share or upload it.
`test:e2e:staging` runs the same 16 Playwright journeys against the deployed
site. Playwright is a real browser but not real hardware: microphone, TTS,
permission prompts, and slow networks still require the
[real-device matrix](real-device-matrix.md).

## 4. Workflow gates

`.github/workflows/staging.yml` is manual-only and requires `STAGING` plus the
`staging` environment. When `publish=true` and `DEPLOY-STAGING` is typed:

1. The probe must show an Access challenge on the production hostname. **No
   upload happens otherwise.**
2. The validated artifact is uploaded with `--commit-hash=<github.sha>` so the
   deployment is tied to the approved commit. `wrangler-action` is pinned to
   v4.1.3 and Wrangler to `4.157.0`.
3. The production URL, the immutable deployment URL, and the branch alias are
   probed with retries. The probe always writes its outputs and exits zero in CI;
   a separate **Enforce Cloudflare Access verification** step is the single
   failure point, so it also runs after a failed or partial upload.
4. If protection is not proven on every URL — app content is reachable (HTTP 200
   with the app shell), or the probe stays inconclusive after retries — the new
   deployment is deleted, the production hostname is re-probed, and the
   `dailylingo-staging` project is deleted if exposure remains. The run fails
   closed and its summary records each rollback outcome.
5. After publication, an authorized session and an unauthorized session are still
   checked manually (section 3) before the Beta URL is shared with testers.

A `publish: false` run is credential-free and never reaches the deploy job. It
still self-tests the probe and builds the exact commit.

## 5. Incident response

If Access is missing after a deployment:

1. Do not share the URL.
2. The workflow has already attempted a fail-closed rollback on any unproven
   result: delete the new deployment, re-probe production, and delete the
   staging project if exposure remains. Confirm under Workers & Pages → project
   → Deployments and check the run summary for each rollback outcome.
3. Manual deletion:
   `npx wrangler pages deployment delete <deployment-id> --project-name dailylingo-staging --force`
   with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set locally. Never
   paste the token into a command that is logged.
4. If the Access policy itself is broken, set both applications' policies to
   **Block** or delete the staging project; do not leave a public deployment in
   place while investigating.
5. Rotate the Cloudflare API token if it may have leaked, then update the
   `staging` environment secret.
6. Record the incident, the deployment ID, the commit SHA, and the probe output
   in the PR or the acceptance record.

## 6. Cost and limits

- Cloudflare Pages Free: $0. Documented free limits: 500 builds per month,
  20,000 files per site, 25 MiB per file, 100 custom domains. This project uses
  Direct Upload, so Cloudflare does not run the build; the bundle is about
  1.5 MB total.
- Cloudflare One / Access Free: $0 for up to 50 users, including the built-in
  one-time PIN. Adding a 51st user requires a paid plan; do not enable paid
  services or add seats without Owner approval.
- No paid WAF, Load Balancer, or custom-domain feature is required.

## 7. Known limitations

- Access protects the hostname, not the browser's `localStorage`. A tester who
  exports a backup still holds learner content; treat backups as private.
- Access login happens before the app origin loads. After login the browser is
  on the normal Pages origin, so microphone and speech-synthesis permissions
  behave as usual — but this still needs real-device verification.
- The production `pages.dev` protection depends on the Pages-generated Access
  application and the known-issues edit above. Re-run the probe after any Pages
  project, domain, or Access configuration change.
- Preview and immutable deployment URLs are covered only while the wildcard
  application exists. They cannot be probed before upload; the workflow probes
  them immediately afterwards and rolls the deployment back if protection is
  not proven.
- The probe is black-box and unauthenticated. It can prove that no app shell is
  served without Access, not that every Access policy is configured as intended;
  review the two applications and their explicit email policy in the dashboard
  before publishing.
- Real-device microphone, TTS, permission-denied, and slow-network results
  remain `UNTESTED` until executed on the hardware listed in
  [`real-device-matrix.md`](real-device-matrix.md).
