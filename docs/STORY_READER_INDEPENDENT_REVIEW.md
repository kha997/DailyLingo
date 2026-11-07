# Story Reading Lab independent review

Reviewed on 2026-11-07 by a fresh reviewer agent that did not implement the feature. Scope: Issue #7 and both Owner refinements; reader interactions, audio ownership, content identity, local data integrity, accessibility and pedagogy. Review used source inspection, targeted tests and an executable migration reproduction. This is an engineering review, not external CEFR certification, professional translation certification or physical-device testing.

## Findings and observed corrections

| Finding | Impact demonstrated or traced | Correction inspected |
|---|---|---|
| Sentence IDs computed from position | Inserting a sentence in a simulated v2 restored “A boy sits on a bench.” to “The sun is warm.” | `content.ts` now accepts explicit durable IDs in sentence drafts; content tests insert and reorder drafts without reassigning IDs. |
| Uncurated occurrence lookup IDs discarded | Reconciliation filtered every `occ:*` ID, removing its mark immediately | `progress.ts` validates whole-token occurrence offsets and retains them for the same content version; unit regressions cover Unicode/contractions and invalid offsets. |
| Occurrence offsets reused across revisions | An edited sentence could associate an old offset with a different word | Occurrence IDs are retained only when stored and current content versions match. Authored sense IDs retain their separate durable semantics. |
| Invalid story backup silently sanitized to empty | A malformed nonempty story record could overwrite legitimate progress | Strict import validation rejects malformed story records before the write transaction. Recovery loading can salvage valid entries while preserving original bytes in a recovery snapshot. |
| Mobile study panel located after entire passage | Selecting an early sentence did not make its explanation discoverable in the viewport | A persistent selected-sentence opener exposes a bounded mobile study sheet; dictionary remains a separate contextual sheet. |
| Desktop click timer shorter than ordinary double-click timing | A valid slower double-click could start sentence speech before lookup | Word-click arbitration is now 550ms. The browser test instruments actual click-event timestamps and exercises an approximately 400ms inter-click interval, checking for unintended sentence speech. See residual limitation below. |
| Saved custom rate absent from selector | A valid restored rate outside the three defaults could display no selected option | Current persisted rate is included alongside 0.8/1/1.2. |
| Settings voice preview did not invalidate a live story queue | Shared cancellation could leave old story callbacks valid, allowing false completion or queue advancement | Shared cancellation subscriptions invalidate queue ownership before native cancel; queue disposes its subscription. Reader also suspends playback before global modal interactions. Regression covers legacy speech interrupting an already-active queue and the reverse direction. |

At the final source checkpoint, these corrections were present. No additional substantive blocker was identified in the reviewed source within the documented V1 constraints. Final acceptance still depends on the final commit's complete verification and hosted CI; this report does not substitute for those gates.

## Audio and data review

Queue callbacks validate generation, active utterance identity, disposal and duplicate completion. Platform cancellation invalidates ownership before potentially synchronous browser callbacks. Only genuine sentence `onend` events record completion; errors, lookup, Play alone and estimated elapsed time do not. Word pronunciation does not advance the sentence queue. Pause/resume intentionally restarts the same sentence, and restored progress requires an explicit playback gesture.

Story data is local and additive to the existing backup format. Legacy backups preserve the story key; new story data joins rollback handling. Saved/mastered marks derive from the existing notebook rather than a second saved-word store. Exact lexical form, normalized POS and contextual Vietnamese sense avoid substring/inflection/homograph conflation. Reset and import unmount the reader to prevent stale in-memory story state from overwriting the result. No paid API, server sync, deployment or Cloudflare Access change was introduced in the reviewed diff.

## Accessibility and pedagogy review

Inspected continuous paragraph rendering, English language annotation, focusable sentence controls, explicit lookup mode, keyboard activation, long-press cancellation on movement, focus restoration for dictionary lookup, non-color-only learning marks, translation toggling, conservative scrolling and reduced-motion CSS. Mobile study and dictionary sheets preserve a reading context rather than replacing the story with cards. Actual screen-reader behavior remains part of the hardware/manual gate.

Reviewed all 36 sentence translations and contextual grammar notes and all 18 glossary entries. No substantive pedagogy correction was found. A1 uses concrete present-simple narrative, A2 uses everyday past narrative, and B1 adds background past perfect, concession and indirect questions. Six curated glossary senses per story are supported; uncurated words honestly offer sentence context and pronunciation without inventing a word definition or saving one.

## Verification evidence and limits

- Independent initial content/progress run: 18 tests passed.
- An independent five-file snapshot run produced 61 passes and one legacy-interruption failure while the ownership fix was still being implemented. That snapshot was reported as failed, not green. The audio implementer subsequently reported a fresh 13/13 run after the fix; the parent runs the final complete pipeline centrally to avoid concurrent inconsistent snapshots.
- Source inspection verified the final corrections listed above. Final unit/browser counts, exact SHA, screenshots/traces and hosted CI must be taken from the PR's final verification evidence, not inferred from this review.
- Playwright speech is mocked for deterministic queue/race assertions. Real browser interaction evidence does not establish audible speech on hardware.

Residual limitations:

1. Desktop word single-click speech waits up to 550ms to distinguish double-click. Sentence whitespace/keyboard activation and ordinary mobile taps use their immediate paths. A custom OS double-click threshold above 550ms can still permit sentence speech before a later lookup. Explicit **Tra từ** mode and keyboard lookup avoid timing dependence. This bound must remain disclosed at Owner review.
2. Physical iOS Safari and Android Chrome audio, native long-press callouts, VoiceOver/TalkBack, desktop Safari/WebKit and Firefox remain **UNTESTED** without linked evidence. Browser voices and pacing vary. The hardware checklist is in `STORY_READER_VERIFICATION.md`.
3. Lookup definitions are curated for the glossary, not a general dictionary service. Other word occurrences provide pronunciation and authored sentence context with an explicit unavailable-definition notice.

Next gate: confirm the final PR commit passes the complete local and hosted pipelines, review screenshot/browser evidence, then Owner review and actual-device checks. Merge and deployment require a separate Owner decision.
