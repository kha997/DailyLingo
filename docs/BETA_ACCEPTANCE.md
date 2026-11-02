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
| Proposed commit (PR #5 head, final) | `29f844be509a801cde82c4a369c2a595f54649e3` |
| Work location | branch `beta-readiness`, based on the baseline |
| Remote state | `origin/main` still at baseline; `beta-readiness` pushed at the proposed commit; PR #5 open (targeting `main`) |
| Baseline hosted CI | <https://github.com/kha997/DailyLingo/actions/runs/41208027377> (4 jobs green) |
| Proposed commit hosted CI (final) | <https://github.com/kha997/DailyLingo/actions/runs/41373335473> (4 jobs green, conclusion success) |
| Earlier hardening commit hosted CI | <https://github.com/kha997/DailyLingo/actions/runs/41372184104> (4 jobs green, conclusion success) |
| Local verification date | 2026-11-01 (local evidence) / 2026-11-02 (proposed-commit evidence) |
| Owner authorization | commit/push/PR executed 2026-11-02 under Owner instruction; deploy, repo settings, merge not authorized |

The final PR head is `29f844be509a801cde82c4a369c2a595f54649e3`; it contains the hardening commit `4494855aec9e960f8b9ee4f9281aeb1e4c887196`.

## Outcome matrix

### 1. Staging strategy, preview build, rollback, backup/export — IN_PROGRESS

Evidence:

- [`DEPLOYMENT.md`](DEPLOYMENT.md): static build, base-path rules, owner-gated
  staging, rollback table, production gate.
- `.github/workflows/staging.yml`: `workflow_dispatch` only; requires typing
  `STAGING`; `publish` defaults to false; publish job runs behind the `staging`
  environment with required reviewers; build uses `VITE_BASE_PATH=/DailyLingo/`.
- `.github/workflows/ci.yml`: typecheck/test/build/e2e with artifacts; no deploy step.
- Backup/export/import/reset covered by unit tests and an E2E journey
  (export → reset with `XOA` → import → data restored). Corrupt data is copied to
  `dailylingo_recovery_*` before defaults are written.
- Sub-path build proven locally: `VITE_BASE_PATH=/DailyLingo/ npm run build`
  produced `/DailyLingo/assets/...` references; `vite preview` returned HTTP 200
  for both the index and the hashed JS asset at that path.
- All 16 Playwright journeys also pass against the production bundle
  (`npm run test:e2e:preview`), and CI runs them from the uploaded build
  artifact instead of the dev server.

Not yet demonstrated: a hosted staging run and an approved deploy. Requires the
Owner to enable Pages, create/protect the `staging` environment, and authorize a
workflow run. **BLOCKED on Owner.**

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

Current state checked read-only: `main` is **not protected** (`404 Branch not
protected`); the repository is public; Pages is not enabled. No settings were
changed. Applying protection requires the Owner.

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

Missing for a **PASS**: a hosted staging run and an approved deploy. The exact
commit SHA and hosted CI run URL are now recorded above; the remaining missing
evidence for a PASS is the Owner-gated staging environment/Pages setup and a
deploy decision.

### 9. Independent review + green CI, no P0/P1 — BLOCKED

- PR #5 is open from `beta-readiness` → `main` at commit
  `29f844be509a801cde82c4a369c2a595f54649e3` (head), containing hardening commit
  `4494855aec9e960f8b9ee4f9281aeb1e4c887196`, titled “Beta readiness hardening for
  Issue #4 acceptance”.
- Hosted CI run [41373335473](https://github.com/kha997/DailyLingo/actions/runs/41373335473)
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
  41372504556; `9da980a6…` run 41373335473).

  Current run on the PR: hosted CI on the proposed commit = green, no P0/P1.

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

## Reproduce locally

```bash
git switch beta-readiness
npm ci
npm run verify
npx playwright test
npm run test:e2e:preview
```

Expected: typecheck clean; 149/149 unit tests across 10 files; coverage thresholds pass;
54/54 date tests in each of three timezones; build succeeds; bundle budget passes;
16/16 Playwright tests pass (dev), then 16/16 with `npm run test:e2e:preview`.

## Remaining Owner actions

1. ~~Authorize commit on `beta-readiness`, push, and open a PR.~~ **DONE** — commit
   `4494855aec9e960f8b9ee4f9281aeb1e4c887196` pushed; PR #5 open; hosted CI green.
2. Approve creation of the `staging` environment + Pages, then run the staging
   workflow (publish=false first).
3. Provide hardware access/participants for the real-device matrix.
4. Decide on branch protection (recommended rules are ready).
5. Decide whether/when a public production deploy is acceptable; it is out of
   scope for this Beta.

Engineering-side actions (commit, push, PR, hosted CI, independent internal review,
local verification) are complete; the outstanding Owner-gated items are listed in
the outcome matrix above.
