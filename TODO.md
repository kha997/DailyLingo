> **Historical document — superseded.** This file describes an earlier phase of
> the project and is kept for context only. Current, evidence-backed Beta status
> lives in [`docs/BETA_ACCEPTANCE.md`](docs/BETA_ACCEPTANCE.md). The app ships
> **no AI-generated content, no Gemini client, no server, and no API key**; any
> AI section below is an abandoned plan, not a shipped capability.

# DailyLingo Verification & Completion Plan

## Phase 1: Git Reconciliation
- [x] Confirm local working tree is at commit 01862cd with Phase 1 modifications
- [ ] Commit all Phase 1 modifications to main branch
- [ ] Verify commit SHAs match expected values

## Phase 2: Test Infrastructure
- [ ] Initialize Vitest configuration
- [ ] Add test scripts to package.json
- [ ] Write unit tests for storage.ts (streak calculation, load/save user stats)
- [ ] Write unit tests for speech.ts (SpeechRecognizer, calculateSimilarity)
- [ ] Write unit tests for curriculumData.ts (computeNextReviewDate, INITIAL_SAVED_WORDS)
- [ ] Write unit tests for types/index.ts (type definitions)

## Phase 3: Core User Journey Tests
- [ ] First launch / persistence test
- [ ] Lessons navigation test
- [ ] All six exercise types (flashcard, word-reorder, listening-cloze, speaking, quiz, dialogue)
- [ ] Vocabulary notebook review with spaced repetition
- [ ] Progress tracking and streak tests
- [ ] Settings modal and theme switching
- [ ] LocalStorage persistence and refresh recovery
- [ ] Page refresh recovery

## Phase 4: Edge Case Tests
- [ ] Timezone/day boundary boundary conditions
- [ ] Microphone denied/unsupported scenarios
- [ ] Invalid storage recovery
- [ ] Repeated interactions stability

## Phase 5: AI Integration Verification
- [ ] Differentiate genuine Gemini requests from procedural templates
- [ ] Verify AI metadata badges in CustomPracticeModal
- [ ] Test dynamicGenerator.ts AI fallback behavior

## Phase 6: Quality Review
- [ ] Curriculum accuracy review
- [ ] Exercise scoring verification
- [ ] Accessibility markers
- [ ] Security considerations (no API keys in client code)
- [ ] Performance benchmarks

## Phase 7: Finalization
- [ ] Reproducible build verification
- [ ] Commit all changes with exact SHAs
- [ ] Produce build/test/deployment evidence
- [ ] Report final status with evidence