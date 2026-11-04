# Beta Acceptance — Issue #4

Tracking issue: <https://github.com/kha997/DailyLingo/issues/4>

**Overall status: IN_PROGRESS.** The local Beta candidate is verified, and the
proposed commit has now passed hosted CI. Four outcomes still require the Owner,
real hardware, or an independent party. Nothing here is reported as PASS without
evidence produced in this environment.

**Final engineering sign-off state for the proposed commit: ENGINEERING_VERIFIED —
OWNER_GATE_PENDING.** The proposed commit passed local verification and hosted CI
(all four jobs green on PR #5); the remaining Owner-gated items are listed below.

## Snapshot

| Item | Value |
|---|---|
| Baseline commit | `f6c113fc87a8c859b4f5f64a87c3d360b65fb125` |
| Proposed commit (PR #5 head, final) | `28c909b4910184f93ad1ec9ab7a0d88a017d5e61` — fail-closed Access implementation |
| Work location | branch `beta-readiness`, based on the baseline |
| Remote state | `origin/main` still at baseline; `beta-readiness` pushed at the proposed commit; PR #5 open (targeting `main`) |
| Baseline hosted CI | <https://github.com/kha997/DailyLingo/actions/runs/41208027377> (4 jobs green) |
| Proposed commit hosted CI (final) | <https://github.com/kha997/DailyLingo/actions/runs/41842604703> on `28c909b…` (4 jobs green, conclusion success) |
| Build-only staging run (final) | <https://github.com/kha997/DailyLingo/actions/runs/41842938243> on `28c909b…` (deploy skipped, artifact uploaded) |
| Earlier hardening commit hosted CI | <https://github.com/kha997/DailyLingo/actions/runs/41372184104> (4 jobs green, conclusion success) |
| Cloudflare workflow correction | `fbaf7f4` (rewrite) then `d9ab23a` (GitHub context fix); `fbaf7f4` CI run 41798087809 green |
| Local verification date | 2026-11-01 (local evidence) / 2026-11-02 (proposed-commit evidence) / 2026-11-04 (workflow + Access audit) |
| Owner authorization | commit/push/PR executed 2026-11-02 under Owner instruction; Access-control implementation and build-only run executed 2026-11-04 under the deployment mission brief. Publication, repo settings, and merge remain unauthorized |

The current head is `28c909b4910184f93ad1ec9ab7a0d88a017d5e61`; it contains the hardening
commit `4494855aec9e960f8b9ee4f9281aeb1e4c887196`, the Cloudflare staging-workflow
correction (`fbaf7f4` rewrite, `d9ab23a` context fix, `1ca7115` review findings), and the
fail-closed Access implementation described below. The previously recorded heads `afeb5f9` /
`ee89b84` / `d9ab23a` / `1ca7115` are superseded.

## Outcome matrix

### 1. Staging strategy, preview build, rollback, backup/export — IN_PROGRESS

Evidence:

- [`DEPLOYMENT.md`](DEPLOYMENT.md): static build, base-path rules, owner-gated
  staging, rollback table, production gate.
- `.github/workflows/staging.yml`: `workflow_dispatch` only; requires typing
  `STAGING`; `publish` defaults to false; deploy job runs behind the `staging`
  environment with required reviewers; deploys with
  `cloudflare/wrangler-action` (`pages deploy dist --project-name=... --branch=staging
  --commit-hash=<sha>`), pinned to v4.1.3 and Wrangler 4.157.0; build uses
  `VITE_BASE_PATH=/`.
- Access is fail-closed: the production hostname must answer with a Cloudflare Access
  challenge before upload; after upload the production, immutable deployment, and branch
  alias URLs are probed with retries. An unproven result deletes the new deployment,
  re-probes production, and deletes the staging project if exposure remains. A separate
  enforcement step is the single failure point. See [`ACCESS_CONTROL.md`](ACCESS_CONTROL.md).
- `.github/workflows/ci.yml`: typecheck/test/build/e2e with artifacts; no deploy step; the
  14-case Access-probe self-test runs in the build job.
- Backup/export/import/reset covered by unit tests and an E2E journey
  (export → reset with `XOA` → import → data restored). Corrupt data is copied to
  `dailylingo_recovery_*` before defaults are written.
- Root build proven locally: `VITE_BASE_PATH=/ npm run build` produced
  `/assets/index-*.js` references and `npm run check:bundle` passed. The earlier
  `VITE_BASE_PATH=/DailyLingo/` build passed `vite preview` at that sub-path but makes
  `npm run check:bundle` fail with `ENOENT ... dist/DailyLingo/assets/*` and would 404
  every asset on `pages.dev`; see the audit below.
- All 16 Playwright journeys also pass against the production bundle
  (`npm run test:e2e:preview`), and CI runs them from the uploaded build
  artifact instead of the dev server.

Build-only path proven on hosted runners at the final head: run
[41842938243](https://github.com/kha997/DailyLingo/actions/runs/41842938243) —
`guard` success, build success through the Access self-test, typecheck, coverage, root
build, bundle budget, base-path assertion and artifact upload; deploy **skipped**;
artifact `staging-preview-dist` is 807,042 bytes with root-absolute `/assets/*` paths.
The staging hostname does not resolve, so no public deployment exists.

Not yet demonstrated: a hosted publishing run and the authorized/unauthorized browser
checks. Requires the Owner to create the Cloudflare Pages project, create the two Access
applications and tester emails, store the two `staging` environment secrets, protect the
`staging` environment, and authorize a publication. **BLOCKED on Owner.**

### 2. Real-device / browser matrix — BLOCKED

Required: mobile and desktop microphone, TTS, permission denied, unsupported API,
slow network, with device names and outcomes.

Status: **no real-device evidence has been produced.** Chromium automation is not
hardware validation and is not presented as such. No mocks are counted.

Use [`real-device-matrix.md`](real-device-matrix.md) to record runs; all rows are
currently `UNTESTED`.

| Scenario | Device | Result |
|---|---|---|
| Mobile microphone permission (grant/deny) | none recorded | BLOCKED |
| Desktop microphone permission | none recorded | BLOCKED |
| TTS voice availability/quality | none recorded | BLOCKED |
| Unsupported API fallback | desktop Chromium code path only | IN_PROGRESS |
| Slow network / offline transition | none recorded | BLOCKED |
| iOS Safari / Android Chrome | none recorded | BLOCKED |

Owner action: run the matrix on at least one iOS device, one Android device, and
desktop Chrome/Safari/Firefox; record OS/browser versions and outcomes here.

### 3. Pedagogical QA of 12 units — IN_PROGRESS

Evidence:

- [`pedagogical-qa.md`](pedagogical-qa.md): all 12 units / 61 exercise IDs
  reviewed, with the specific corrections listed.
- 11 content corrections applied, including title/word mismatch, run-ons, an
  incomplete Vietnamese idiom translation, missing “đa chức năng”, contactless
  IPA stress, a mislabelled grammar pattern, and a deadline phrase.
- Automated invariants cover IDs, level/topic consistency, type-specific content,
  word-reorder multisets, cloze options, quiz answer keys, and daily-challenge
  determinism (`src/data/curriculumData.test.ts`, 96.92% statements).

Not yet demonstrated: independent native-speaker/teacher review and learner
pilot. The audit is explicitly a desk audit.

### 4. Review schedules and progress consistency — PASS (automated)

Evidence:

- `computeNextReviewDate` tests cover mastery/review-count intervals, local-date
  parsing, never scheduling in the past, invalid input, and output format.
- `applyWordReview` / `applyWordMasteryToggle` tests cover the actual callers: a
  reported recall lengthens the interval, “cần ôn lại” schedules tomorrow and
  clears `mastered`, and a failed recall ignores a high review count. Callers no
  longer pass a hard-coded mastery constant.
- Storage tests cover streak continuation/reset, daily XP history, and local
  calendar day boundaries with fake timers.
- `npm run test:timezones` re-runs the date/review suites under **UTC,
  Asia/Ho_Chi_Minh, and America/Los_Angeles**: 54/54 tests pass in each zone.
- E2E: saving a word schedules it for tomorrow; a due review extends the streak,
  awards XP, and reschedules; marking mastered persists; only due words appear in
  a review session.
- The interval is driven by the learner's self-reported flashcard answer and the
  mastered toggle. It is not a measured retention model, and the UI does not
  claim one.
- Progress is computed from recorded activity. Skill percentages are blended
  practice estimates and the UI says so; there are no adaptive-learning claims.

Not measured: longitudinal retention or learning effectiveness. That is a learner
study, not a unit test, and is not claimed.

### 5. Component tests, accessibility, bundle footprint — PASS

Tests and coverage:

- **149 unit tests / 10 files pass.** Coverage: statements 66.07%, branches 70.61%,
  functions 73.33%, lines 66.99%, with per-file floors; core modules
  (`curriculumData`, `progress`, `storage`, `dynamicGenerator`, `diagnostics`,
  `notifications`) are 80–97%. `npm run test:coverage` exits 0.
- **6 isolated component tests** render real React components in jsdom:
  `ErrorBoundary` (fallback, details, optional reset) and `SettingsModal`
  (diagnostics copy, reset gated by `XOA`, wrong text does nothing). Screen-level
  behaviour is owned by Playwright, so UI files are excluded from the unit
  coverage gate; their pure logic lives in thresholded `src/utils` / `src/data`.
- **16 Playwright journeys pass** against both the dev server and the production
  bundle (`npm run test:e2e:preview` → `dist/` + `vite preview`). They cover
  corrupt-storage recovery, backup restore, keyboard quiz, dialog focus
  trap/Escape/restore, the mid-session exit warning, mobile 390×844 overflow,
  and diagnostics privacy. CI downloads the `production-build` artifact and sets
  `PW_PREVIEW=1`, so the hosted run uses the built bundle rather than dev.
- [`ACCESSIBILITY.md`](ACCESSIBILITY.md): rendered WCAG AA contrast audit across
  catalog, notebook, analytics, settings, flashcard runner, quiz feedback, and
  the speaking screen in light/dark — **zero findings** for the scanned states.
  Gradient surfaces and screens not listed there are not machine-checked.
  Keyboard and dialog semantics tested. Remaining gaps are listed in that
  document (screen reader, 200% zoom, full WCAG 2.2, real devices).

Bundle before/after (production build):

| Metric | Baseline | Beta | Change |
|---|---|---|---|
| Initial JS raw | 867,022 B (867.0 kB) | 442.1 kB | −49.0% |
| Initial JS gzip | 244.70 kB | 127.0 kB | −48.1% |
| Analytics JS | inside entry | 405.57 kB / 115.14 kB gzip, lazy | off initial path |
| CSS gzip | — | 11.2 kB | gated at 16,000 B |
| `dist` total | — | 1459.7 kB | gated at 2,000,000 B |

`npm run check:bundle` enforces raw/gzip/CSS/dist budgets and fails if the
analytics chunk becomes eager. Images were reduced from ~2.27 MB to ~560 KB.

### 6. Privacy-conscious opt-in feedback and diagnostics — PASS

Evidence:

- `src/utils/diagnostics.ts` + 9 unit tests. The report contains browser
  capability booleans, viewport, storage **counts**, recovery-event count, and
  build mode. It excludes saved-word text, typed answers, audio, free text, XP
  values, and study dates; the privacy flags are explicit.
- Settings offers “Sao chép chẩn đoán” and “Tải tệp chẩn đoán”, with copy fallback
  for blocked clipboard.
- Feedback is a learner-written draft; “Sao chép góp ý + chẩn đoán” only copies
  to the clipboard. There is no server endpoint and no automatic upload.
- E2E downloads the diagnostics file, asserts learner content/XP are absent, and
  asserts the opt-in feedback flow and clipboard payload.

Note: the report includes the browser user-agent string, language, and
`navigator.onLine`; these are device facts, not learner content, and are needed
for device triage.

### 7. Branch protection recommendation — PASS (recommendation only)

Evidence: [`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md) with rules, exact `gh api`
commands, a ruleset alternative, and post-enable verification steps.

Current state checked read-only on 2026-11-04: `main` is **not protected** (`404 Branch
not protected`); the repository is public; GitHub Pages is not enabled (`/pages` → 404);
no `staging` environment exists and no repository Actions secrets exist (both lists
empty). No settings were changed and no credential was created or requested. Applying
protection requires the Owner.

### 8. Reproducible build/install/recovery/test docs on exact commit — IN_PROGRESS

Evidence:

- [`README.md`](../README.md): install, scripts, layout, privacy model, limits.
- [`DEPLOYMENT.md`](DEPLOYMENT.md), [`OPERATIONS.md`](OPERATIONS.md): build,
  sub-path, staging, rollback, backup/restore, triage, release checklist.
- One-shot gate: `npm run verify` (typecheck → coverage thresholds → timezone matrix →
  build → bundle budget), then `npx playwright test`.
- Fresh `npm ci` against the final `package-lock.json` succeeds on Node 22.22+;
  `npm audit` reports **0 vulnerabilities** after the esbuild advisory was cleared
  by the Vite 8.3.5 / esbuild 0.28.2 patch release. `bun.lock` was regenerated so
  the alternative manager does not resolve the removed dependencies.
- Local result: verify exit 0; 149 unit tests; 16 Playwright tests in both dev and preview modes.

Missing for a **PASS**: a publishing run and the authorized/unauthorized browser checks
against it. The hosted build-only run is recorded above; the remaining missing evidence is
the Owner-gated Pages/Access setup and a publish decision.

### 9. Independent review + green CI, no P0/P1 — BLOCKED

- PR #5 is open from `beta-readiness` → `main` at commit
  `28c909b4910184f93ad1ec9ab7a0d88a017d5e61` (head), containing hardening commit
  `4494855aec9e960f8b9ee4f9281aeb1e4c887196`, titled “Beta readiness hardening for
  Issue #4 acceptance”.
- Hosted CI run [41842604703](https://github.com/kha997/DailyLingo/actions/runs/41842604703)
  on that final commit: **conclusion success**, all four jobs green — `typecheck`, `test`,
  `build`, `e2e` (e2e ran the production build via the uploaded artifact).
- Local typecheck, unit/coverage, timezone matrix, build, bundle budget, and Playwright
  all pass. That is maintainer-side evidence, not independence.
- An internal independent-review pass (two subagents: security+data integrity, logic+
  regression) was run on the working diff; it found no blockers, only low-severity
  residual items (VITE_ AI env naming footgun — remediated; CSP — not added;
  persist-effect partial-write window — design-scoped; non-standard metadata key —
  mitigated). All applied and re-verified.
- All fixed findings from that pass were re-verified with a fresh local gate run
  (`npm run verify` → 149 unit tests; Playwright 16/16 dev + preview).
- Hosted CI re-ran green on the docs-only follow-up commits (`740276767…` run
  41372504556; `afeb5f91…` run 41373657995), on `fbaf7f4…` (run 41798087809), on `d9ab23a…`
  (run 41798651274) and on the workflow-final `1ca7115…` (run 41799378313).

  The final `28c909b…` head re-ran green in [41842604703](https://github.com/kha997/DailyLingo/actions/runs/41842604703).
  Current run on the PR: hosted CI on the proposed commit = green, no P0/P1.

  Two additional independent reviews of the Access-control and deployment changes were run
  this session. Findings — inconclusive probes leaving a deployment live, synthetic preview
  preflight deadlock, partial-deploy verification gaps, error-output survival, unretried
  probes, floating Wrangler major, and a blind spot in the session-capture helper — were all
  remediated and re-verified.

  | Finding | Resolution | Regression test |
  |---|---|---|
  | Speaking score latched across exercises; late mic results could score the next item | Per-exercise latch reset; callbacks bound to the starting exercise id; mic aborted on advance/exit | `buildTranscriptUpdate` tests + manual E2E speaking path |
  | Accuracy divided by all completions, including unscored dialogue | Separate graded counters in `UserStats`; analytics uses them | `progress.test.ts` graded-counter test |
  | Dialogue-only sessions extended the streak | Streak/study days require ≥1 graded answer | `progress.test.ts` unscored-completion test |
  | Reset claimed success when storage refused | `clearAllUserData()` result surfaced; on failure in-memory data is kept and an alert is shown | `SettingsModal.test.tsx` reset-failure test |
  | Import was not transactional; snapshot was sanitized | Raw pre-import snapshot (newest 3), all-or-nothing writes with rollback | storage rollback + pruning tests |
  | Interim speech tail was dropped | Final + interim transcript joined; only final text is scored | `buildTranscriptUpdate` tests |
  | “Production E2E” claim was not implemented | `PW_PREVIEW=1` preview mode, `test:e2e:preview`, CI runs against the build artifact | 16/16 preview run |
  | Contrast audit scope was overstated | Audit extended to quiz feedback + speaking; docs state unscanned states | 16/16 audit |
  | Exit discarded progress silently | Confirmation dialog when progress exists | E2E exit-warning journey |
  | Reminder copy over-promised | Copy now says “while the tab is open”; test notification says the same | manual copy review |

- Remaining known gaps are the BLOCKED / IN_PROGRESS items above (hardware,
  native-speaker review, hosted staging, truly external review). No known P0/P1
  defects remain in the local evidence.
Post-review hardening (found by the final consistency pass, not by the reviewer):

| Finding | Resolution |
|---|---|
| Docs said reviews are “rescheduled by performance”, but every caller passed a constant mastery of 50 | Scheduling now uses the learner's own answer: “đã nhớ” lengthens the interval, “cần ôn lại” schedules tomorrow and clears `mastered`, mastered toggle schedules further out; callers no longer pass a constant. 5 unit tests added. |
| Storage-write banner never cleared after a later successful write | One persistence effect writes all three datasets and sets the flag from the combined result |
| `npm run lint` ran only `tsc --noEmit` | Script and CI job renamed to `typecheck`; docs updated; ESLint gap documented below |
| Eight dependencies were declared but unused (`@google/genai`, `express`, `@types/express`, `dotenv`, `motion`, `tsx`, `autoprefixer`, `esbuild`) | Removed; 132 packages dropped from the lockfile; verified by full `verify` + both Playwright modes |

- No ESLint config ships: `typescript-eslint` (8.x) declares
  `typescript >=4.8.4 <6.1.0`, and this repo compiles with TypeScript 7.0.2, so
  `npm i -D eslint typescript-eslint` fails peer resolution. The CI gate is
  `tsc --noEmit`; it is named `typecheck`, not `lint`, so nothing claims a
  linter ran.

## Owner Gate package — final deliverable (this session)

One consolidated checklist for the Owner-gated real-world Beta gate. This section
is the stable summary of the state reached at the end of the engineering phase.

### Completed engineering work (verified — no further code action required)

- Local gates green at final state: typecheck clean; **149 unit tests / 10 files**
  pass; coverage thresholds pass; timezone matrix **54/54 ×3 zones** pass; Access-probe
  self-test **14/14**; build OK; bundle budget OK; **`npm run verify` exit 0**.
- Playwright **16/16** journeys on dev server and **16/16** via production preview;
  WCAG AA contrast audit included; accessibility journeys green.
- Independent internal reviews (two subagents on the Beta changes, two on the Access and
  deployment changes): **no blockers**; findings remediated or design-scoped; no known
  **P0/P1** remain.
- Hosted CI on final proposed commit **`28c909b4910184f93ad1ec9ab7a0d88a017d5e61`**
  (PR #5 head): **run `41842604703` → conclusion `success`**; all four jobs
  (`typecheck`, `test`, `build`, `e2e`) green. Earlier green runs on superseded heads:
  `41372184104`, `41372504556`, `41372782186`, `41373100885`, `41373657995`, `41373777355`,
  `41798087809`, `41799378313`.
- Build-only staging run on the final head: **`41842938243` → success**, deploy skipped,
  artifact uploaded.
- PR #5 open (`beta-readiness` → `main`); **not merged**. No staging deployment exists;
  `dailylingo-staging.pages.dev` does not resolve.

### Pending deployment tasks (Owner-gated; nothing published)

- Create the Cloudflare Pages project and **both Access applications** (production hostname
  and wildcard preview/alias) with One-time PIN and explicit tester emails, before any
  upload. Exact dashboard steps: [`ACCESS_CONTROL.md`](ACCESS_CONTROL.md).
- Store `CLOUDFLARE_API_TOKEN` (Cloudflare Pages: Edit only) and `CLOUDFLARE_ACCOUNT_ID` as
  `staging` environment secrets, with the Owner as required reviewer.
- Verify build output / configuration / rollback and data-recovery procedures against
  the final commit — **already verified locally** (root build + bundle budget green;
  backup/restore/reset/import tests green); **publish remains Owner-gated**.
- Do not publish staging or production without separate Owner approval.

### Pending physical-device tasks (Owner must execute; not marked PASS here)

- Real-device checklist: Android, iOS, Windows, macOS — microphone permission grant/
  deny, TTS availability, unsupported-API fallback, slow-network behaviour, with device
  names/OS versions recorded. All rows currently `UNTESTED`.

### Outstanding Owner decisions / actions

1. Enable branch protection (recommended `typecheck`, `test`, `build`, `e2e`) on `main`.
2. Create the Cloudflare Pages project, both Access applications, and explicit tester
   emails; then create the `staging` environment (required reviewer + the two environment
   secrets). The `publish=false` proof is already green at the final head.
3. Approve exactly one `publish=true` run with `DEPLOY-STAGING`; then verify an authorized
   tester session and an unauthorized private window before sharing the URL.
4. Provide physical hardware for real-device matrix execution.
5. Decide on PR #5 merge.
6. Decide on production deploy timing/content.

## Staging workflow audit and correction — Cloudflare Pages (2026-11-04)

Prepared autonomously under Owner authorization for the controlled staging gate.
**No public deployment was performed. No Cloudflare credential exists in this
repository, and none was requested.**

### 1. Defect found

`.github/workflows/staging.yml` claimed to deploy to Cloudflare Pages but was built
entirely on GitHub Pages tooling:

| Used before | What it actually is |
|---|---|
| `actions/upload-pages-artifact@v3` | GitHub action: "packaging and uploading an artifact that can be deployed to **GitHub Pages**" |
| `actions/deploy-pages@v4` | GitHub action: deploys a packaged artifact to **GitHub Pages** |
| `permissions: pages: write`, `id-token: write` | GitHub Pages deployment permissions |
| `steps.deployment.outputs.page_url` | GitHub Pages action output |
| `VITE_BASE_PATH=/DailyLingo/` | GitHub Pages *project site* sub-path |

Neither action can reach the Cloudflare API; no Cloudflare credentials were referenced
anywhere in the workflow. Commit `17c29cb` changed only the comments, still asserting the
GitHub Pages actions were "the Cloudflare-official actions", which is false.

A second, independent defect: with `VITE_BASE_PATH=/DailyLingo/` the workflow's own
`npm run check:bundle` step fails. Reproduced locally on this branch:

```text
VITE_BASE_PATH=/DailyLingo/ npm run build && npm run check:bundle
-> ENOENT: no such file or directory, open 'dist/DailyLingo/assets/index-4CHMCD-t.js'   (exit 1)

VITE_BASE_PATH=/ npm run build && npm run check:bundle
-> Bundle budget passed.   (exit 0)   index.html references /assets/index-*.js
```

So the build job could never have gone green, and even if it had, the deployed bundle
would request `/DailyLingo/assets/*` from a host that serves at the root of
`<project>.pages.dev` and 404 on every asset.

### 2. Corrected mechanism

The workflow now uses Cloudflare's own GitHub Action, pinned to the commit behind release
`v4.1.3` (2026-09-24, latest at audit time):

```yaml
- uses: cloudflare/wrangler-action@953926a2e2182532811c01a25e53647d93bf07c0 # v4.1.3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy dist --project-name=$CLOUDFLARE_PAGES_PROJECT --branch=$STAGING_BRANCH
    packageManager: npm
```

Sources verified on 2026-11-04:
- Cloudflare "Use Direct Upload with continuous integration" — the recommended workflow is
  `cloudflare/wrangler-action@v4` with `apiToken`, `accountId`, a
  `pages deploy <dir> --project-name=<p>` command, and job permissions
  `contents: read` + `deployments: write`.
- `cloudflare/wrangler-action` README and `action.yml` at the pinned commit — inputs
  `apiToken`/`accountId`/`command`/`gitHubToken`/`packageManager`, outputs `deployment-url`,
  `pages-deployment-alias-url`, `command-output`; default Wrangler major `4`. The action
  detects the package manager from lockfiles, checking `package-lock.json` first, so this
  repo resolves to `npm` at the pin; `packageManager: npm` is still stated explicitly
  because the repo also carries `bun.lock`.
- Cloudflare "Direct Upload" — the guide creates the Pages project with
  `wrangler pages project create` before deploying, and a Direct Upload project's
  production branch is fixed at creation. The guide does not state what wrangler does when
  the project is absent, so this workflow treats project creation as an Owner prerequisite
  rather than assuming wrangler will create it.
- Cloudflare "Preview deployments" — production is `<project>.pages.dev`, previews are
  `<hash>.<project>.pages.dev`, both at the root path, which is why the base is `/`. A
  per-deployment hash URL is atomic; a branch alias URL is updated in place by later
  deploys of that branch. So a `--branch` that is not the production branch still yields a
  refreshable staging URL, just not the project root URL.
- Cloudflare API token permissions — `Cloudflare Pages: Edit` is the account-scoped
  permission that creates/edits/deletes Pages projects; that single permission is the
  minimum for this workflow and the token needs nothing else.
- `actions/upload-pages-artifact` and `actions/deploy-pages` READMEs — GitHub Pages only.
- GitHub Actions context availability table — `secrets` is allowed in
  `jobs.<job_id>.steps.env`, `.with` and `.run`, but **not** in `jobs.<job_id>.if` or
  `jobs.<job_id>.steps.if`. The credential guard therefore maps a derived presence flag
  into step `env` and tests it in the shell; a `secrets` reference in a step condition is
  rejected by GitHub's workflow parser. (Caught by a hosted run: the first push of this
  workflow produced a zero-job "workflow file issue" failure.)

### 3. Gates kept, and what each run does

| Trigger | Effect |
|---|---|
| push / pull request | none — the workflow is `workflow_dispatch` only |
| manual run, `confirm` != `STAGING` | `guard` fails immediately |
| manual run, `publish: false` (default) | build + typecheck + coverage + bundle budget + base-path assertion, downloadable artifact, **no credential read, nothing deployed** |
| manual run, `publish: true` without `publish_phrase` = `DEPLOY-STAGING` | deploy job fails on its first step |
| manual run, `publish: true` and the phrase typed, credentials missing | deploy job fails on the credential check |
| manual run, `publish: true`, phrase typed, credentials present | uploads the *same validated artifact* the build job checked, to Cloudflare Pages |

A second typed phrase is required because a read-only check of this repository on
2026-11-04 found **no `staging` environment and no Actions secrets configured**, so
environment approval was not yet enforcing anything by itself; the workflow carries its
own publish gate until the Owner creates it.

Permissions are now `contents: read` workflow-wide plus `deployments: write` on the deploy
job only. `pages: write` and `id-token: write` are removed. Secret values are passed only
through `with:` and are never echoed or interpolated into a shell command; the deployed
bundle is static build output, so no credential can ship inside it.

Rollback: re-run at the previous verified commit, or delete the deployment in the Cloudflare
Pages dashboard. Learner data is unaffected — it stays in each browser.

### 4. Verified vs not verified (stated honestly)

Verified in this session: workflow YAML parses and passes the GitHub Actions JSON Schema
(negative control confirms the validator rejects malformed workflows); every `secrets`,
`inputs`, `env` and `steps` reference was checked programmatically against GitHub's
context availability table; every action input and output used exists in `action.yml` at
the pinned commit; root build, bundle budget and base-path assertion pass locally;
typecheck and the unit/coverage suite pass locally; the old configuration provably fails
the bundle check.

Hosted feedback was used, not skipped. The first push of this workflow (`fbaf7f4`)
produced a zero-job run ([41798081726](https://github.com/kha997/DailyLingo/actions/runs/41798081726))
that GitHub reports for an invalid workflow file; it traced to the `secrets` reference in a
step condition, removed in `d9ab23a`.

The build-only path has since been executed on a hosted runner: run
[41799390782](https://github.com/kha997/DailyLingo/actions/runs/41799390782), dispatched
against `1ca71151e72e63a52c1b25f12991ebc27c01bee9` with `confirm=STAGING`,
`publish=false` — **conclusion `success`**, `Require explicit confirmation` green,
`Build and validate (no Cloudflare credentials)` green through `npm ci`, typecheck,
coverage, the root-based build, `check:bundle`, the root-asset assertion and the artifact
upload, and `Deploy to Cloudflare Pages (staging)` **`skipped`**. No credential was
available to that run and nothing was published. The same build-only path was repeated on
the final Access-control head as run
[41842938243](https://github.com/kha997/DailyLingo/actions/runs/41842938243): guard and
build green, deploy skipped, `staging-preview-dist` artifact present and root-absolute.

Not verified, and not claimed: a publishing run. It is impossible until the Owner creates
the Cloudflare Pages project and stores the secrets, so
**`STAGING_DEPLOYED` is not the status of this repository.** The deploy job's wrangler call
itself has therefore never executed, and the `pages deploy` behaviour against a real
account remains untested here by design.

### 5. Remaining Owner actions (deployment gate)

1. Create the Cloudflare Pages project once:
   `npx wrangler pages project create dailylingo-staging --production-branch staging`.
2. Put it behind Cloudflare Access **before any upload**: production hostname and wildcard
   preview/alias applications, One-time PIN, explicit tester emails. Exact steps:
   [`ACCESS_CONTROL.md`](ACCESS_CONTROL.md).
3. Create an API token holding only `Cloudflare Pages: Edit`, scoped to that account.
4. In GitHub: create the `staging` environment, add the Owner as a required reviewer, and
   store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as *environment* secrets.
5. Reproduce the hosted build-only path at any time (Actions → this workflow → Run
   workflow → `confirm: STAGING`, `publish: false`) — already green at the final head, see
   run 41842938243 above; it deploys nothing and uses no credentials.
6. Authorize a `publish: true` run only when steps 1–4 are done, then verify an authorized
   tester session and an unauthorized private window, and smoke-test on real devices for
   the matrix in §2 above.

If the Owner prefers a different project name or branch, those are the two `env:` values at
the top of `.github/workflows/staging.yml`.

### 6. Independent review record

`INDEPENDENT_REVIEW` — a different agent context, given no implementation narrative, asked
to falsify the change against primary sources. Reviewed heads: `fbaf7f4`, and it observed
the follow-up `d9ab23a` mid-audit.

Findings and disposition:

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | blocker | `secrets` referenced in a step-level `if` is not a valid context position; the pushed file did not compile (zero-job failed run 41798081726) | Confirmed independently — same cause this session found. Fixed in `d9ab23a` (presence flags mapped through `steps.env`), proven by the successful dispatch on `1ca7115` |
| 2 | minor | "one-off hash preview instead of the stable URL" understates that branch aliases update in place | Accepted; workflow comment and `DEPLOYMENT.md` reworded |
| 3 | minor | "the Pages project must exist before the first deploy" exceeds what the Direct Upload guide states | Accepted; recorded as an Owner prerequisite rather than wrangler behaviour |
| 4 | minor | package-manager inference is ambiguous because both `package-lock.json` and `bun.lock` exist | Accepted; `packageManager: npm` stated explicitly |

Confirmed correct by the reviewer, against sources it fetched itself: the pinned SHA is the
commit behind tag `v4.1.3` and is `releases/latest`; every action input and output used
exists in `action.yml` at that pin; `pages deploy [DIR] --project-name --branch` is valid
wrangler v4 syntax; `inputs` in `jobs.<id>.if` and `steps` in `environment.url` are allowed
contexts; the `dist/` artifact round-trip restores `dist/index.html` (also proven by this
repo's own passing `e2e` job); the two secrets are confined to the deploy job; typed inputs
reach the shell only through `env`, so there is no script-injection path; `bash -e` defaults
mean no step can fail silently; no GitHub Pages permission, action or output remains; and
`upload-pages-artifact` / `deploy-pages` are genuinely GitHub-Pages-only, which was the
central claim of this task.

Reviewer's open items (all credential- or account-bound, i.e. Owner-gate territory, not
workflow defects): behaviour of `--branch` against a missing or unauthorized project, and
end-to-end environment-secret scoping.

Status of this change set:
`CLOUDFLARE_WORKFLOW_VERIFIED — DEPLOYMENT_OWNER_GATE_PENDING`. Not `STAGING_DEPLOYED`.

## Reproduce locally

```bash
git switch beta-readiness
npm ci
npm run verify
npx playwright test
npm run test:e2e:preview
```

Expected: typecheck clean; 149/149 unit tests across 10 files; coverage thresholds pass;
54/54 date tests in each of three timezones; 14/14 Access-probe self-test cases; build
succeeds; bundle budget passes; 16/16 Playwright tests pass (dev), then 16/16 with
`npm run test:e2e:preview`.

## Remaining Owner actions

1. ~~Authorize commit on `beta-readiness`, push, and open a PR.~~ **DONE** — commit
   `4494855aec9e960f8b9ee4f9281aeb1e4c887196` pushed; PR #5 open; hosted CI green.
2. Create the Pages project, both Access applications and explicit tester emails, and
   the `staging` environment (required reviewer + two environment secrets). The
   `publish=false` build-only run is already green at the final head.
3. Approve one `publish=true` run with `DEPLOY-STAGING`; verify authorized and
   unauthorized browser sessions before sharing the URL.
4. Provide hardware access/participants for the real-device matrix.
5. Decide on branch protection (recommended rules are ready).
6. Decide whether/when a public production deploy is acceptable; it is out of
   scope for this Beta.

Engineering-side actions (commit, push, PR, hosted CI, independent internal review,
local verification) are complete; the outstanding Owner-gated items are listed in
the outcome matrix above.
