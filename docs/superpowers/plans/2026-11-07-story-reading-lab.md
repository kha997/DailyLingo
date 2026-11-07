# Story Reading Lab Implementation Plan

**Goal:** Implement Issue #7 and its final Owner decision completely in the existing DailyLingo app.
**Authority:** https://github.com/kha997/DailyLingo/issues/7#issuecomment-6705586180 and entire issue.
**Architecture:** Lazy-loaded continuous reader, authored sentence/token identities, cancellable Web Speech queue, additive local storage backup integration, global notebook as saved/mastered authority.
**Baseline:** main and staging verified at 1f24838ceeaef5f9b99454826fcfa3c2ed987c50. Dedicated feat/story-reading-lab checkout. Owner explicitly authorizes autonomous decisions and delegation; no additional design approval gate.

## Constraints
No merge, deploy, Access changes, paid API, backend, sync or XP for reading/lookup. Preserve existing data. Hardware audio remains UNTESTED without hardware evidence.

## Tasks
- [x] Content: src/stories/content.ts + tests. Three original A1/A2/B1 stories, 10–20 sentences, Vietnamese translations and grammar, exact occurrence spans with editorial sense IDs, deterministic segmentation, paragraph/source fidelity.
- [x] Audio: src/utils/storySpeech.ts + tests. Queue play/pause/restart/stop/word pronunciation; generation tokens, stale and duplicate callbacks, unsupported/error cases, no timeout-based completion.
- [x] Persistence: src/stories/progress.ts and src/utils/storage.ts + tests. Stable sentence/word references, defensive revisions, local preferences, recovery, transactional backup/import/reset, legacy backup preservation. Notebook exact sense matching.
- [x] Reader: src/components/StoryReadingLab.tsx + stylesheet + component tests. Continuous passage, yellow spoken sentence, conservative scroll, sentence/word gesture arbitration, long press, keyboard/fallback lookup, study panel, persistent marks and preferences, library/resume, notebook integration.
- [x] Browser: e2e-tests/stories.spec.ts. Mocked Web Speech explicitly labeled; desktop/mobile play, cancellation, dblclick no accidental sentence audio, longpress, keyboard, lookup/save/master marks, reload/no autoplay, translation/grammar, screenshots.
- [ ] Review: independent accessibility/data integrity/audio/pedagogy review, fix substantive findings; run npm ci, npm run verify, npm run test:e2e:preview. PR exact commit, hosted CI green, evidence and hardware checklist.

## Review focus
Double clicks beyond usual timing; long-press scrolling; storage blocked/quota and imported legacy backups; sentence revision invalid references; canceled errors arriving after new playback. Test explicit gestures and queue generation, never infer speech completion from elapsed time.

## Execution record
Content/audio/storage/browser tasks delegated with non-overlapping file ownership; parent owns UI/integration and final verification. npm ci initial sandbox cache failed (home read-only); retry uses /tmp cache.

Review fixes implemented: explicit editorial IDs, occurrence revision guards, strict story imports, mobile study sheet, shared speech cancellation ownership and modal suspension, 550ms word arbitration with measured400ms doubleclick test, responsive navigation and accessible names. Core verify passes253 tests, timezone54 tests in each of3 zones, access14 cases and unchanged bundle budgets. Full production preview passed27/27, including10 story journeys and2 accessibility journeys. Hosted CI on exact PR commit remains final gate.
