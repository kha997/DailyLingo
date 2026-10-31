# DailyLingo — Release Candidate Evidence

This document supersedes any earlier version of `RELEASE_SUMMARY.md`. Every
claim below is tied to a commit that exists on GitHub and to hosted CI runs that
ran on that exact commit.

## Verified remote state

| Item | Value |
| --- | --- |
| Repository | https://github.com/kha997/DailyLingo |
| Default branch | `main` |
| Main commit at verification | `072e547bda7629eb920d183c38e12b1fcb4c97ea` |
| Code commit (release gates) | `d0f9b1155335bfb25f8558be94ca0ce21942a3d2` |
| Test-config commit | `42912bfcb85cd5253385a8debdcc67f36d8affa6` |
| Previous main (broken) | `813a2bef01c3cadbcdd777bbb0167505299ffa96` |

## Hosted CI (GitHub Actions, `DailyLingo CI`)

| Run | Commit | Event | Result |
| --- | --- | --- | --- |
| [41207053265](https://github.com/kha997/DailyLingo/actions/runs/41207053265) | `d0f9b11` | pull_request | **success** (lint, test, build, e2e) |
| [41207222840](https://github.com/kha997/DailyLingo/actions/runs/41207222840) | `fb5929c` (merge of #1) | push → main | **success** (lint, test, build, e2e) |
| [41207446522](https://github.com/kha997/DailyLingo/actions/runs/41207446522) | `42912bf` | pull_request | **success** (lint, test, build, e2e) |
| [41207641792](https://github.com/kha997/DailyLingo/actions/runs/41207641792) | `072e547` (merge of #2) | push → main | **success** (lint, test, build, e2e) |

Hosted logs for run `41207446522` report:

- `Test Files 3 passed (3)`, `Tests 39 passed (39)` for both `npm test` and
  `npm run test:coverage`
- `6 passed (18.1s)` for `npx playwright test`

The earlier failing run [41187476143](https://github.com/kha997/DailyLingo/actions/runs/41187476143)
on `813a2be` failed at `npm ci`; it is **not** evidence for this release.

## What was actually broken and fixed

1. **`npm ci` was impossible on main.** The repository had no
   `package-lock.json`, and `esbuild@^0.25` conflicted with `vite@8`'s peer
   range (`^0.27 || ^0.28`). Added a lockfile and bumped `esbuild` to `^0.27.0`.
2. **UTC date keys caused off-by-one days.** `new Date().toISOString().split('T')[0]`
   produced UTC dates in `storage.ts`, `notifications.ts`, `DailyHeroSection`,
   `ExerciseRunner`, `ProgressAnalytics`, `VocabularyNotebook` and
   `computeNextReviewDate`. All now use local-day `toLocaleDateString('en-CA')`.
3. **New vocabulary disappeared.** The notebook only rendered words whose
   `nextReviewDate <= today`; every new word is scheduled for tomorrow, so it
   was hidden immediately. The notebook now shows all saved words; the due list
   only selects the review session.
4. **Reviewing never rescheduled words.** Completing a flashcard session did not
   update `reviewCount` / `lastReviewedAt` / `nextReviewDate`. `ExerciseRunner`
   now reports reviewed words and `App.handleFinishExercise` reschedules them.
5. **Coverage script failed.** `npm run test:coverage` lacked
   `@vitest/coverage-v8`; added at the matching `5.0.5` version.
6. **The test count was inflated.** Vitest's custom `exclude` replaced the
   default, so 314 tests from `node_modules/fraction.js` were counted. The
   suite is now the app's real 39 tests across 3 files.
7. **E2E were smoke checks, not journeys.** Rewrote `e2e-tests/app.test.ts` as
   6 real browser journeys, added `webServer` startup to
   `playwright.config.ts`, and added a chromium E2E job to CI on Node 22.
8. **Generated Playwright artifacts were committed.** `test-results/` is now
   untracked and gitignored.

## Critical journeys verified in a real browser

All of these run against the app served by Vite, in Chromium, with state
persisted through `localStorage`:

1. Lesson catalog renders all 12 CEFR units and the A1 filter narrows the list.
2. Navigation across all four tabs renders each section.
3. Adding a vocabulary word shows it immediately, stores `nextReviewDate =
   tomorrow`, `reviewCount = 0`, `lastReviewedAt = today`, and survives reload.
4. Completing a flashcard review moves a 3-day streak to 4, awards 15 XP,
   records today in `studyDays`/`dailyXpHistory`, increments `reviewCount` and
   pushes `nextReviewDate` past today; the streak survives reload.
5. Marking a word mastered sets `mastered`, increments `reviewCount`, advances
   the schedule, and persists after reload.
6. A review session contains only words due today and excludes future words.

## Local verification on `072e547` (same tree as hosted CI)

- `npm ci` from a clean `node_modules`: pass
- `npm run lint` (`tsc --noEmit`): pass
- `npm test`: 39/39 pass (3 files)
- `npm run test:coverage`: pass
- `npm run build`: pass
- `npx playwright test`: 6/6 pass

## Residual risks / notes

- Statement coverage is ~29% (no threshold is enforced in CI). The browser
  journeys cover the release-critical paths, but component-level coverage is
  thin.
- The production bundle is ~867 kB (244 kB gzip); Vite emits a chunk-size
  warning. Not a release blocker.
- Local Node `v22.15.0` emits engine warnings (`jsdom@30` wants `^22.22.2`);
  CI runs the latest Node 22.x and passes. Local tests also pass.
- `main` currently has no branch protection. Enabling required status checks is
  recommended before the next release.
- No production deployment was performed.

## Assessment

Release candidate for `072e547`: hosted CI green on the exact commit, 6/6 real
browser journeys green, 39/39 app unit tests green, and no known P0/P1 defect
outstanding at the time of writing.
