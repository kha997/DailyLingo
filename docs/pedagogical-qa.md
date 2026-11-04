# Pedagogical QA — Desk Audit

Scope: all **12 units / 61 exercises** in `src/data/curriculumData.ts`.
Method: line-by-line desk review of prompt, title, answer key, Vietnamese
translation, IPA, distractor set, punctuation, and CEFR fit, plus the automated
curriculum invariants in `src/data/curriculumData.test.ts`.

**This is a desk audit, not native-speaker sign-off and not classroom validation.**
Audio was not listened to on real devices; IPA is a learner aid, not a
pronunciation score; CEFR labels are editorial judgements, not certified
alignment. See “Residual risk” at the end.

## What was checked for every exercise

| Dimension | Check |
|---|---|
| Structure | Unique ID; level matches unit; topic is one of the six known topics |
| Flashcard | Word, IPA, part of speech, Vietnamese meaning, EN example, VI example all present and consistent |
| Word reorder | Scrambled multiset equals the target sentence; one unambiguous word order |
| Listening cloze | Audio text present; blank word appears in options; options unique and plausible |
| Speaking | Target sentence present; transcript-match scoring only (no phoneme claim) |
| Quiz | Exactly four options, exactly one correct, explanation matches the key |
| Dialogue | Lines non-empty, natural turn-taking, translation matches |
| Language | Vietnamese naturalness, punctuation/run-ons, title-to-task alignment, register |

## Unit-by-unit record

| Unit | CEFR | Focus | Exercise IDs reviewed | Desk-audit outcome |
|---|---|---|---|---|
| 1 | A1 | Daily greetings & reflexes | `u1-ex-1` … `u1-ex-6` | Fixed title/word mismatch: “Hào Hứng” → **“Thân Thiện”** for *friendly*. Courtesy replies and dialogue register checked. |
| 2 | A2 | Travel, airport, hotel | `u2-ex-1` … `u2-ex-5` | No text changes required in this pass; answer keys and travel register checked. |
| 3 | B1 | Office, meetings, email | `u3-ex-1` … `u3-ex-5` | Clarified deadline wording: “before the deadline tomorrow” → **“before tomorrow's deadline”**, with matching Vietnamese. |
| 4 | A2 | Food & restaurants | `u4-ex-1` … `u4-ex-5` | Aligned `u4-ex-3` title/prompt/translation with the actual question (“Hỏi Gợi Ý Món Tráng Miệng”). Fixed `u4-ex-5` comma splice: two sentences for the allergy question. |
| 5 | A2 | Shopping & payment | `u5-ex-1` … `u5-ex-5` | `u5-ex-1` *refund* labelled **noun** (example is nominal). `u5-ex-4` contactless IPA stress corrected to **/ˈkɒn.tækt.ləs/** and hint changed to “CON-tact-less / PAY-ments”. |
| 6 | B1 | Technology & AI | `u6-ex-1` … `u6-ex-5` | `u6-ex-2` grammar tip corrected from “cấu trúc giả định” to the actual **“It is + adjective + to + V”** pattern. |
| 7 | B1 | Friendship & relationships | `u7-ex-1` … `u7-ex-5` | `u7-ex-2` was a comma splice; added **“so”**, updated the scrambled set and the target sentence, keeping the multiset invariant. |
| 8 | B1 | Health, appointments, sport | `u8-ex-1` … `u8-ex-5` | No text changes required in this pass; medical register, appointment questions, and answer keys checked. |
| 9 | B2 | IELTS/TOEIC idioms & collocations | `u9-ex-1` … `u9-ex-5` | No text changes required in this pass; idiom meaning, collocation strength, and distractor separation checked. |
| 10 | B2 | Interviews & salary negotiation | `u10-ex-1` … `u10-ex-5` | Vietnamese prompt for `u10-ex-2` restored the missing **“đa chức năng”** (*cross-functional*), so the prompt matches the target. |
| 11 | B2 | Real-life idioms & slang | `u11-ex-1` … `u11-ex-5` | `u11-ex-1` Vietnamese completed: “lỡ miệng làm lộ mất **bí mật**”. `u11-ex-4` run-on split into two sentences for *hit the sack*. |
| 12 | B2 | Presentations & critical thinking | `u12-ex-1` … `u12-ex-5` | No text changes required in this pass; signposting, polite disagreement, and Q&A register checked. |

## Automated invariants

`src/data/curriculumData.test.ts` enforces:

- exactly 12 units; every unit has exercises
- unique unit IDs and unique exercise IDs across all 61 exercises
- every exercise uses its unit's level and a known topic
- type-specific content completeness
- word-reorder scrambled list is exactly the target words, only reordered
- listening-cloze blank is present in a unique option list
- quiz has four options and exactly one correct answer
- new users start with no unlocked badges
- seeded review words have valid dates
- daily challenge is deterministic, covers the five graded types, and only uses
  real curriculum exercises

## Scoring honesty

- Speaking uses **word-level transcript alignment** against the target sentence.
  Missing, inserted, substituted, or reordered words lower the score. It cannot
  detect phoneme quality, accent, or prosody, and the UI must not imply otherwise.
- XP is awarded for graded correctness; wrong answers, “needs review” flashcards,
  and self-verified dialogue completion do not fabricate XP.
- Skill percentages are blended practice estimates, not certificates.

## Residual risk / not covered

1. **No native-speaker or teacher sign-off.** Naturalness and CEFR fit are
   editorial; a qualified reviewer should still sample all 12 units.
2. **No acoustic review.** TTS output depends on the OS/browser voice. Some IPA
   hints are British-leaning; the app also offers `en-US` audio.
3. **No learner pilot.** Comprehension, difficulty curve, and time-on-task are not
   measured. The unit order and 5–6 exercises/unit are a design choice, not a
   validated syllabus.
4. **Distractors are plausible, not psychometrically calibrated.** No item
   analysis (difficulty/discrimination) exists.
5. **Translations are meaning-equivalent, not literary.** Vietnamese is kept
   learner-friendly rather than word-for-word.
6. **Audio device coverage is separate.** Microphone permission, unsupported
   browsers, and slow networks require the real-device matrix in
   [`BETA_ACCEPTANCE.md`](BETA_ACCEPTANCE.md); mocks are not evidence.
