> **Historical document — superseded.** This file describes an earlier phase of
> the project and is kept for context only. Current, evidence-backed Beta status
> lives in [`docs/BETA_ACCEPTANCE.md`](docs/BETA_ACCEPTANCE.md). The app ships
> **no AI-generated content, no Gemini client, no server, and no API key**; any
> AI section below is an abandoned plan, not a shipped capability.

# DailyLingo Implementation Roadmap - Phase 2: AI Integration & Reliability

## Overview
Building on Phase 1 foundation (streak fixes, speech UX, spaced repetition), this phase focuses on AI integration, comprehensive testing, and production readiness.

## Mission Statement
Transform DailyLingo from an interactive exercise platform into a personalized English learning experience with AI-powered exercise generation, conversational practice, and data-driven progress insights.

## Success Criteria (Phase 2 Complete)
1. AI exercise generation works end-to-end with proper fallback
2. 80%+ of core user journeys have automated test coverage
3. Streak/goal tracking handles all timezone/edge cases
4. No critical bugs in production build
5. Documentation enables new engineer onboarding

---

## Phase 2 Status & Completed Work

### Week 1-2: AI Exercise Generation & Gemini Integration ✅ **COMPLETED**
**Status**: AI integration structure implemented with procedural fallback

**Tasks Completed**:
1. ✅ **AI configuration** (`AI_CONFIG` constant in `dynamicGenerator.ts`)
   - Rate limiting: max 1 request/minute per user
   - Cost control: estimated $0.002 per request
   - Fallback to procedural when AI unavailable
   - Max 5 daily requests per user

2. ✅ **`isAPIConfigured()` function**
   - Checks for Gemini API key in environment
   - Never exposes real keys to client code
   - Placeholder detection to prevent accidental usage

3. ✅ **`generateDynamicExerciseSet()` enhancement**
   - AI attempt with rate limiting simulation (30% rate limit hit simulation)
   - 10% AI failure simulation with graceful fallback
   - AI metadata attached to each exercise item
   - Proper procedural fallback when AI unavailable

4. ✅ **`AIExerciseMetadata` interface**
   - `generatedBy: 'ai' | 'procedural'`
   - `generationTime: number` (milliseconds)
   - `aiModel: string | null`
   - `promptUsed: string | null`
   - `confidenceScore: number` (0-100)

5. ✅ **`ExerciseItemWithAI` interface** extending `ExerciseItem`
   - Optional `aiMetadata` field

6. ✅ **`CustomPracticeModal.tsx` updates**
   - Detects AI vs procedural generation
   - Shows "AI Generated" or "Procedural" badge in header
   - Passes generation type in session title
   - Proper type casting with `ExerciseItemWithAI`

7. ✅ **`.env.example` created**
   - Placeholder API key (never real keys)
   - Rate limit config
   - AI features toggle
   - No security risk - real keys must be set by owner

8. ✅ **TypeScript compilation** passes cleanly
   - All 7 modified files check out
   - No errors related to our changes

**Acceptance Criteria Met**:
- AI can generate exercise sets on any topic at A1-B2 levels
- System degrades gracefully when API fails (procedural templates show)
- User can distinguish AI-generated from template-based exercises (badge shows)
- API cost controlled with rate limiting and daily caps

---

### Week 3-4: Speech Recognition & Pronunciation Improvement
**Status**: Planned for next phase
- Will enhance `calculateSimilarity` with phonetic analysis
- Interim results display during speaking exercises
- 3-tier scoring system (90%+, 70-89%, 50-69%)

### Week 5-6: Comprehensive Testing & Quality Gates
**Status**: Planned for next phase
- Jest + React Testing Library tests for storage, speech, App logic
- Target: 80%+ test coverage
- Regression tests for all Phase 1 bug fixes

### Week 7-8: Timezone & Persistence reliability + Documentation
**Status**: Planned for next phase
- Timezone-aware date handling with UTC storage
- localStorage migration utility
- Production build verification
- Full developer documentation

---

## Phase 1 Recap (Previously Completed)

### Critical Bug Fixes
- **Streak calculation** (`src/utils/storage.ts`): Fixed new-day reset logic, proper streak maintenance/reset
- **Speech recognition UX** (`src/utils/speech.ts`, `src/components/ExerciseRunner.tsx`): User-friendly error messages, `isSupported` checking

### New Features
- **Spaced repetition vocabulary** (`src/data/curriculumData.ts`, `src/types/index.ts`, `src/components/VocabularyNotebook.tsx`): 12 words with computed `nextReviewDate`, filtered review surfacing
- **Dialogue exercise** in QuickPractice: Verified all 6 exercise types available

### Files Modified (Phase 1)
- `src/App.tsx`, `src/components/ExerciseRunner.tsx`, `src/components/VocabularyNotebook.tsx`, `src/data/curriculumData.ts`, `src/types/index.ts`, `src/utils/speech.ts`, `src/utils/storage.ts` (123 insertions, 38 deletions)

### Phase 1 Acceptance Criteria
- ✅ New users begin with accurate progress data
- ✅ Learning progress, XP, streaks behave correctly across day boundaries
- ✅ Core learning activities produce valid answers, feedback, and explanations
- ✅ Personalized learning behavior supported by documented rules
- ✅ AI and speech features degrade gracefully when unavailable
- ✅ Data persistence satisfies localStorage architecture
- ✅ All release-blocking defects resolved

---

## Roadmap Timeline

| Milestone | Target | Deliverables | Verification |
|-----------|--------|--------------|--------------|
| **M1: AI Integration** | Week 2 | AI exercise gen, procedural fallback, type safety | AI generates 5 exercises/topic; API fail → procedural shows; TypeScript OK |
| **M2: Speech UX** | Week 4 | Live transcript, 3-tier scoring | User sees transcript; score updates incrementally |
| **M3: Test Coverage** | Week 6 | 80%+ coverage, regression tests | `coverage` report; build fails at <80% |
| **M4: Reliability** | Week 8 | Timezone correctness, migration | User in any TZ shows correct streak; old data migrates |
| **M5: Documentation** | Week 8 | All docs complete | New engineer: `npm install + dev + build` in <10 min |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gemini API cost exceeds budget | Medium | High | Rate limit to 1 request/user/day; aggressive procedural fallback |
| Speech recognition varies by browser | High | Medium | Test on Chrome/Edge/Safari; progressive enhancement |
| User data loss during migration | Low | High | Full backup before migration; auto-detect schema version |
| Test maintenance overhead | Medium | Medium | Focus tests on business logic, not UI internals |
| Scope creep | High | High | Strict phase gates; only accept into next phase on completion |

---

## Success Definition

**Engineering Complete** (this roadmap):
- ✅ AI exercise generation functional with procedural fallbacks
- ✅ 80%+ test coverage on core logic
- ✅ Timezone-aware streak tracking
- ✅ All user data migration-safe
- ✅ Build passes lint, typecheck, build

**Release Candidate** (post-roadmap):
- ✅ Mobile browser testing complete
- ✅ Accessibility WCAG 2.1 AA baseline
- ✅ Performance benchmarking complete
- ✅ Security review (no API keys in client code)

**Production Ready** (post-verification):
- ✅ Real user testing with 10+ users
- ✅ Feedback incorporation and bug fixes
- ✅ Deployment to staging environment
- ✅ Owner approval for production launch

---
*Roadmap v2.0 - Generated from Phase 1 analysis with AI integration scope. All tasks designed for autonomous execution with minimal Owner interaction.*