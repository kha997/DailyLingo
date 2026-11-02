# DailyLingo Beta Readiness Plan

Baseline: `f6c113fc87a8c859b4f5f64a87c3d360b65fb125` (green local typecheck, 39 unit tests, build, 6 E2E).

## Goal

Make the verified release candidate dependable for real Beta learners without inventing
capabilities, losing local learning data, or requiring paid infrastructure.

## Scope

1. **Release blockers** — production image 404s, corrupt-storage crashes/data loss,
   timezone-dependent review scheduling, silent microphone failures.
2. **Learning integrity** — honest scoring/XP, per-skill progress, reorder retry counting,
   quiz/cloze feedback, deterministic daily challenge, topic/level-correct custom practice.
3. **Pedagogy** — audit and correct the 12 units' CEFR fit, translations, IPA, answer keys,
   ambiguous distractors, and misleading labels.
4. **Resilience** — schema validation, recovery backups, storage-failure banner, export/import,
   error boundary, local-only diagnostics, Beta feedback path.
5. **Mobile/accessibility/performance** — responsive header/modals, keyboard operation,
   dialog semantics, labels, reduced motion, chart alternatives, lazy analytics chunk.
6. **Verification** — curriculum invariants, timezone matrix, corruption/quota tests,
   first-run and unsupported-API E2E, production-build E2E, bundle budget.
7. **Operations** — reproducible static staging workflow (manual, owner-gated), rollback,
   backup guidance, branch-protection recommendations, objective acceptance report.

## Out of scope

- Paid hosting, paid AI, remote accounts, telemetry SaaS.
- Public production deployment without Owner approval.
- Claiming real pronunciation/phoneme scoring; the Web Speech API only supplies a transcript.
- Rewriting the product into a backend service.

## Decisions

| Decision | Rationale |
|---|---|
| Static SPA remains local-first | No backend/secrets needed; preserves existing data model. |
| GitHub Pages staging via manual `workflow_dispatch` + `staging` environment | Free, built into the repo, owner-gated; no credentials in this session. |
| Grading is transcript/answer based | Web Speech API cannot provide phoneme-level pronunciation scores. Labels must say so. |
| Corrupt localStorage is backed up before defaults are written | Protects legitimate user data and makes recovery auditable. |
| Analytics is lazy-loaded | `recharts` is ~67% of the current JS bundle; it is only needed on one tab. |
| No automatic error upload | Privacy-first; diagnostics stay local and are copied by the user. |

## Acceptance criteria

- Clean `npm ci`, typecheck, unit/coverage, build, production-preview E2E, and bundle budget pass.
- Corrupt/blocked/quota storage never white-screens; data is backed up, surfaced, and exportable.
- Review scheduling is identical in UTC, Asia/Ho_Chi_Minh, and America/Los_Angeles.
- All 61 exercises pass structural/answer-key/CEFR validation tests; known content defects fixed.
- Full units update all four skill dimensions; no repeated XP farming; no fabricated scores/XP.
- 360 px and 768 px layouts have no horizontal overflow; quiz/flashcard/modals are keyboard usable.
- `dist` works at `/` and at a project-subpath base; initial JS is materially below baseline.
- Staging deployment, rollback, backup, diagnostics, and branch protection are documented and
  reproducible; deployment remains owner-gated.
- `docs/BETA_ACCEPTANCE.md` records only evidence actually produced in this environment.
