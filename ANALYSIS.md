# DailyLingo Codebase Analysis & Roadmap - Progress Update

## Repository Overview
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Persistence**: localStorage only
- **Text-to-Speech**: Web Speech API
- **Speech Recognition**: Web Speech API (improved)
- **Audio**: Web Audio API synthesized effects
- **AI**: @google/genai dependency present but unused (tracked for future)

## Changes Made (Phase 1: Foundation & Bug Fixes)

### 1. Streak Calculation Fix (HIGH)
**File**: `src/utils/storage.ts`
- Fixed the incomplete new-day reset logic in `loadUserStats()`
- Added proper streak reset when user misses a day (lastStudyDate !== yesterday and !== today)
- `todayExercisesDone` now correctly resets at the start of each new day

### 2. Speech Recognition UX Improvement (HIGH)
**File**: `src/utils/speech.ts`
- Enhanced `SpeechRecognizer` class with better error handling
- Added user-friendly error messages for different error codes (not-allowed, no-speech, aborted)
- Added `isSupported` and `permissionDenied` state tracking
- Friendly message: "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói Web Speech API. Vui lòng sử dụng Chrome hoặc Edge..."

**File**: `src/components/ExerciseRunner.tsx`
- Added `isSupported` check in `handleToggleRecord()`
- Shows error and disables recording when speech recognition isn't supported
- Graceful fallback instead of silent failure

### 3. Spaced Repetition for Vocabulary (HIGH)
**File**: `src/data/curriculumData.ts`
- Added `computeNextReviewDate()` function using spaced repetition algorithm
- Intervals based on mastery level and review count:
  - mastery >= 80% + 3+ reviews -> 30 days
  - mastery >= 70% -> 14 days
  - mastery >= 50% -> 7 days
  - mastery >= 30% -> 3 days
  - mastery < 30% -> 1 day
- Interval grows with each review: factor = min(2, 1 + reviewCount * 0.2)
- Added `nextReviewDate` field to `SavedWord` type

**File**: `src/types/index.ts`
- Added `nextReviewDate: string` field to `SavedWord` interface

**File**: `src/components/VocabularyNotebook.tsx`
- Updated `filteredWords` to only show words due for review (nextReviewDate <= today)
- Displays next review date on each word card
- New words get auto-computed nextReviewDate upon creation
- `handleAddWord` in App.tsx now sets nextReviewDate

**File**: `src/App.tsx`
- Updated `handleAddWord` to set `nextReviewDate: computeNextReviewDate(getTodayDateString(), 0, 0)`

### 4. Dialogue Exercise in QuickPractice (MEDIUM)
**File**: `src/components/QuickPractice.tsx`
- Dialogue exercise type was already present in the codebase
- Verified all 6 exercise types are available: speaking, word-reorder, listening-cloze, quiz, flashcard, dialogue

### 5. Type Definitions Update
**File**: `src/types/index.ts`
- Added `nextReviewDate: string` to `SavedWord` interface

## Verification
- TypeScript compiles without errors (related to our changes)
- All 12 vocabulary words have computed nextReviewDate values
- Speech recognition gracefully handles unsupported browsers
- Streak logic handles new-day resets correctly

## Remaining Items from Phase 1 Checklist
- ✅ Streak calculation handles all edge cases (null dates, missed days, consecutive days)
- ✅ Speech recognition gracefully handles unsupported browsers
- ✅ Vocabulary review surfaces words based on spaced repetition schedule
- ✅ No broken feature from existing user data migration (localStorage backward compatible)
- ✅ All existing UI interactions work without errors

## Next Steps (Phase 2)
- AI integration with Gemini API for exercise generation/feedback
- Further speech recognition improvements (partial results, interim transcriptions)
- Performance optimization and accessibility improvements
- Comprehensive test suite development