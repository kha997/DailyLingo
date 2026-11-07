# Story Reading Lab — engineering evidence

Authority: Issue #7, both Owner comments, final decision dated 2026-11-07.
Baseline: remote main and staging both `1f24838ceeaef5f9b99454826fcfa3c2ed987c50`.
Branch: `feat/story-reading-lab`. No merge, deployment, Access change, paid service or data synchronization.

## Architecture and learning semantics

The reader is a lazy React route within DailyLingo's existing navigation. Authored story paragraphs render inline sentence spans; sentence selection is independent of completion. Progress increments on genuine sentence speech completion or an explicit learner confirmation, never on Play alone, and grants no XP.

Curated glossary entries have editorial sense IDs and exact character ranges. Repeated occurrences of the same authored lexical sense share lookup marks within a story. Different forms and meanings are not inferred by lowercase substring matching. Saved/mastered states derive from the existing global notebook, matching normalized exact lexical form, POS (including equivalent abbreviations), and Vietnamese sense. Existing different senses remain separate entries. Uncurated words support pronunciation and sentence context, with an honest notice that no authored word definition is available; they cannot save an invented definition. Their occurrence marks are local to a content version.

Story storage is an additive optional field in the existing v1 backup. Legacy imports preserve current story storage; new imports participate in the existing rollback transaction. Reset removes all DailyLingo storage. Unknown story records survive sanitization; revision reconciliation retains only valid sentence and sense IDs. Original malformed bytes are retained in recovery snapshots when storage permits. No cloud sync is implied by signing in.

## Audio and gesture semantics

Sentence highlighting follows the cancellable utterance queue, never `onboundary` or estimated elapsed time. Pause/resume restarts the active sentence because browser pause behavior is inconsistent. Resume/reload never autoplays. Visibility loss pauses playback; returning requires an explicit gesture. Empty voice lists allow browser-selected English fallback; unsupported/error states are surfaced.

Desktop word clicks need a bounded disambiguation interval to distinguish a sentence click from a double click. Word single-click speech waits 550ms; the browser regression measures an actual approximately 400ms click-event interval with zero sentence speech. The tested interval covers ordinary system double-click timing; explicit Tra từ mode and keyboard lookup avoid timing dependence. Mobile supports long press and explicit Tra từ mode; scrolling cancels long press. Text selection remains enabled. Mobile sentence study uses a discoverable selected-sentence sheet; dictionary uses a separate contextual sheet.

## Independent review

A fresh reviewer inspected all 36 Vietnamese translations/grammar notes and 18 glossary entries, plus persistence, identity, reader gestures, accessibility and deployment scope. Findings and fixes:

- Positional sentence IDs: replaced with explicit durable editorial IDs and insertion/reorder test.
- Uncurated marks discarded by reconciliation: validate occurrence IDs and retain within version.
- Occurrence IDs across text revisions: discard version-bound occurrences while retaining editorial sense IDs.
- Malformed story import could replace data with empty state: reject malformed records before writes.
- Mobile explanation below passage: add visible opener and selected-sentence bottom sheet.
- Slow desktop double clicks: test 400ms interclick and extend arbitration window.
- Imported custom rates: display the current rate as an option.

## Reproducible checks

Run `npm ci`, `npm run verify`, `npm run test:e2e:preview`.
The Playwright story suite uses real Chromium interaction with **mocked Web Speech events** for deterministic timing and race testing. Screenshots are saved in the test output directories; hosted CI uploads evidence on successful runs as well as failures. Passing these tests establishes browser interaction behavior, not audible hardware output.

Local production verification: `npm ci --cache /tmp/dailylingo-npm-cache` succeeded; `npm run verify` passed 253 unit tests, 54 timezone tests in each of three timezones, 14 Access probe cases, production build and unchanged bundle budgets. `npm run test:e2e:preview` passed all 27 browser tests, including ten Story Reading Lab journeys and light/dark story contrast. Browser executable storage was directed to `/tmp/dailylingo-browsers` in this read-only-home cloud environment.

The final exact PR SHA and hosted CI result are recorded in the PR after remote verification. This document makes no claim of physical-device testing.

## Hardware checklist — all UNTESTED

On an actual iPhone/iPad using Safari and an actual Android phone using Chrome:

- [ ] Start sentence and full-story speech from a user gesture; confirm real audible English and the selected voice/accent.
- [ ] Interrupt sentence M with N; hear only N, with no stale yellow highlight or queue restart.
- [ ] Pause/resume/stop, change speed, lock/unlock, background/foreground, navigate away.
- [ ] Long press words without unwanted sentence audio; cancel by scrolling; use Tra từ fallback with touch and assistive technology.
- [ ] Listen to a word only, save it, mark mastered in notebook, refresh and verify the same marks.
- [ ] Restore last active sentence and preferences without autoplay.
- [ ] VoiceOver/TalkBack: navigate sentence controls, switch lookup mode, open/close sheets, restore focus.

Desktop Firefox, desktop Safari/WebKit and physical mobile audio are UNTESTED unless additional evidence is linked in the PR. Browser voice availability, engine pacing and native text-selection callouts vary.

## Next Owner Gate

Review the PR and hosted CI evidence; perform real-device audio/accessibility checks and approve merge/release separately. The protected Cloudflare Beta remains unchanged.
