# DailyLingo

DailyLingo is a local-first Vietnamese→English practice app. It ships as a static
single-page app: there is no account, no server, no analytics service, and no API
key. Everything a learner does — XP, streaks, saved words, review dates, badges,
settings — is stored in that browser's `localStorage` and can be exported as a
JSON backup.

**Status:** Beta candidate. See [`docs/BETA_ACCEPTANCE.md`](docs/BETA_ACCEPTANCE.md)
for evidence-backed PASS / IN_PROGRESS / BLOCKED status against Issue #4, and
[`docs/beta-readiness-plan.md`](docs/beta-readiness-plan.md) for the plan and
out-of-scope boundaries.

## What it does

- 12 CEFR-tagged units (A1–B2) with 61 exercises: flashcards, word reordering,
  listening cloze, read-aloud speaking, multiple choice, and dialogues.
- A daily challenge, quick practice, and deterministic custom practice by level
  and topic (curriculum selection, not generated content).
- Spaced review: new words are scheduled for tomorrow. Each flashcard review
  reschedules them from your own answer — “đã nhớ” lengthens the interval,
  “cần ôn lại” brings it back to tomorrow and clears the mastered mark. Marking a
  word as mastered in the notebook schedules it further out. This is
  self-assessment, not measured retention; “mastered” words can still be reviewed
  manually.
- Progress that is computed from recorded activity: XP, level, streak, per-skill
  estimates, daily XP history, and badges.
- Local-only diagnostics and an opt-in feedback draft, both copy/download only.

### Honest limits

- Read-aloud scoring compares the **speech-to-text transcript** with the target
  sentence (word edit distance). It is **not** phoneme-level pronunciation
  assessment and must not be presented as one.
- Per-skill percentages are practice estimates from recent answers, not
  certificates or exam predictions.
- There is no leaderboard, no invented class ranking, and no AI-generated lesson
  content.
- Browser speech support varies; unsupported APIs are reported and the exercise
  remains usable with typed/keyboard alternatives where provided.
- Real-device microphone, TTS, and permission behaviour is device/browser
  dependent and is tracked separately in the acceptance report.
- Static checks are `tsc --noEmit` plus the unit/browser suites. No ESLint
  configuration ships yet: `typescript-eslint` has no peer range for the
  TypeScript 7 compiler this repo builds with, so `npm run typecheck` is not a
  linter and the docs do not call it one.

## Quick start

Requirements: Node.js 22 (CI uses 22) and npm.

```bash
npm ci
npm run dev          # http://localhost:3000
```

```bash
npm run typecheck     # tsc --noEmit (no ESLint config yet)
npm test              # 149 unit tests, 10 files
npm run test:coverage # unit tests + per-file coverage thresholds
npm run test:timezones # date/review suites in UTC, Vietnam, US-Pacific
npm run build         # production bundle in dist/
npm run check:bundle  # bundle budgets + lazy analytics guard
npm run verify        # typecheck + coverage + build + bundle check
npx playwright test   # 16 browser journeys (Chromium, dev server)
npm run test:e2e:preview # build, then the same journeys against dist/
```

Playwright starts its own dev server on port 3000. `npm run test:e2e:preview`
builds `dist/` first and runs the identical suite against the production bundle
(`vite preview`), which is also what CI does with the uploaded build artifact.

### Build-time base path

`VITE_BASE_PATH` sets the asset base so one commit can serve from `/` or a
project sub-path:

```bash
VITE_BASE_PATH=/DailyLingo/ npm run build
```

## Project layout

```
src/
  App.tsx                 shell, tabs, session orchestration, persistence wiring
  components/             UI (runner, catalog, notebook, analytics, settings, …)
  data/curriculumData.ts  12 units / 61 exercises / badge definitions
  utils/
    storage.ts            schema validation, migration, recovery, backup/import
    progress.ts           XP, streak, level, skill blending, badge progress
    speech.ts             TTS + transcript-match scoring
    dynamicGenerator.ts   deterministic custom-practice selection
    diagnostics.ts        privacy-scoped local diagnostics
e2e-tests/
  app.test.ts             learner journeys (storage, review, backup, keyboard, …)
  accessibility.test.ts   rendered WCAG AA text-contrast audit, light + dark
scripts/check-bundle-budget.mjs
docs/                     acceptance, deployment, operations, pedagogy, a11y
```

## Data and privacy

- Keys are namespaced `dailylingo_*`. Reset-all removes every such key and
  requires typing `XOA`.
- Corrupt values are copied to a timestamped backup key before defaults are
  written; the app shows a banner and Settings diagnostics report the recovery
  count. Raw values stay in `localStorage` for manual export (see
  [`docs/OPERATIONS.md`](docs/OPERATIONS.md)).
- Backups are user-initiated JSON downloads. Import validates the file; invalid
  files are rejected without overwriting current data.
- Diagnostics contain device/browser capabilities, storage usage **counts**, and
  build mode. They exclude saved words, typed answers, audio, free text, XP
  values, and study dates. Nothing is uploaded automatically.

## Documentation

| Document | Purpose |
|---|---|
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Static build, sub-path hosting, manual staging, rollback |
| [`docs/OPERATIONS.md`](docs/OPERATIONS.md) | Backup/restore, recovery, support triage, release checklist |
| [`docs/BRANCH_PROTECTION.md`](docs/BRANCH_PROTECTION.md) | Recommended protections (not yet applied) |
| [`docs/pedagogical-qa.md`](docs/pedagogical-qa.md) | Desk audit of all 61 exercises and applied fixes |
| [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md) | Contrast audit method, results, manual-test gaps |
| [`docs/real-device-matrix.md`](docs/real-device-matrix.md) | Blank matrix for the required hardware runs |
| [`docs/BETA_ACCEPTANCE.md`](docs/BETA_ACCEPTANCE.md) | Issue #4 outcome matrix with evidence |

## License / ownership

Private project (`"private": true` in `package.json`). Do not deploy publicly or
change repository settings without the Owner's explicit authorization.
