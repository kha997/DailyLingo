import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  LESSON_UNITS,
  DEFAULT_BADGES,
  INITIAL_SAVED_WORDS,
  computeNextReviewDate,
  getDailyChallengeExercises,
} from './curriculumData.ts';

const setToday = (year: number, month: number, day: number) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, month - 1, day, 12, 0, 0));
};

afterEach(() => {
  vi.useRealTimers();
});

describe('computeNextReviewDate', () => {
  it('schedules 60 days ahead for high mastery and 3+ reviews', () => {
    setToday(2026, 1, 15);
    expect(computeNextReviewDate('2026-01-15', 90, 5)).toBe('2026-03-16');
  });

  it('schedules 20 days ahead for medium mastery', () => {
    setToday(2026, 1, 15);
    expect(computeNextReviewDate('2026-01-15', 75, 2)).toBe('2026-02-04');
  });

  it('schedules 8 days ahead for baseline mastery', () => {
    setToday(2026, 1, 15);
    expect(computeNextReviewDate('2026-01-15', 60, 1)).toBe('2026-01-23');
  });

  it('schedules 4 days for lower mastery', () => {
    setToday(2026, 1, 15);
    expect(computeNextReviewDate('2026-01-15', 40, 1)).toBe('2026-01-19');
  });

  it('schedules 1 day for very low mastery', () => {
    setToday(2026, 1, 15);
    expect(computeNextReviewDate('2026-01-15', 20, 1)).toBe('2026-01-16');
  });

  it('increases the interval with review count', () => {
    setToday(2026, 1, 15);
    expect(computeNextReviewDate('2026-01-15', 60, 3)).toBe('2026-01-26');
  });

  it('parses YYYY-MM-DD as a local date, not UTC', () => {
    setToday(2026, 1, 15);
    // If the date were parsed as UTC and read back locally, negative-offset
    // timezones would lose a day and produce 2026-01-22 here.
    expect(computeNextReviewDate('2026-01-15', 60, 1)).toBe('2026-01-23');
  });

  it('never schedules in the past or today', () => {
    setToday(2026, 5, 1);
    expect(computeNextReviewDate('2020-01-01', 20, 0)).toBe('2026-05-02');
  });

  it('falls back to today for an invalid date string', () => {
    setToday(2026, 5, 1);
    expect(computeNextReviewDate('not-a-date', 90, 5)).toBe('2026-06-30');
  });

  it('returns YYYY-MM-DD format', () => {
    setToday(2026, 1, 15);
    expect(computeNextReviewDate('2026-01-15', 50, 1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('curriculum integrity', () => {
  const allExercises = LESSON_UNITS.flatMap((unit) => unit.exercises);

  it('ships twelve units with exercises', () => {
    expect(LESSON_UNITS).toHaveLength(12);
    LESSON_UNITS.forEach((unit) => {
      expect(unit.title.length).toBeGreaterThan(0);
      expect(unit.exercises.length).toBeGreaterThan(0);
    });
  });

  it('has unique unit and exercise ids', () => {
    const unitIds = LESSON_UNITS.map((unit) => unit.id);
    expect(new Set(unitIds).size).toBe(unitIds.length);
    const exerciseIds = allExercises.map((exercise) => exercise.id);
    expect(new Set(exerciseIds).size).toBe(exerciseIds.length);
  });

  it('keeps every exercise at its unit level and a known topic', () => {
    const topics = ['daily', 'travel', 'work', 'food', 'tech', 'social'];
    LESSON_UNITS.forEach((unit) => {
      unit.exercises.forEach((exercise) => {
        expect(exercise.level).toBe(unit.level);
        expect(topics).toContain(exercise.topic);
      });
    });
  });

  it('has usable content for every exercise type', () => {
    allExercises.forEach((exercise) => {
      switch (exercise.type) {
        case 'flashcard':
          expect(exercise.word?.trim()).toBeTruthy();
          expect(exercise.definitionVi?.trim()).toBeTruthy();
          expect(exercise.exampleEn?.trim()).toBeTruthy();
          break;
        case 'word-reorder': {
          expect(exercise.targetSentence?.trim()).toBeTruthy();
          // Same words as the target, only reordered.
          const target = (exercise.targetSentence ?? '').trim().split(/\s+/).sort();
          const scrambled = [...(exercise.scrambledWords ?? [])].sort();
          expect(scrambled).toEqual(target);
          break;
        }
        case 'listening-cloze':
          expect(exercise.audioText?.trim()).toBeTruthy();
          expect(exercise.options ?? []).toContain(exercise.blankWord);
          expect(new Set(exercise.options ?? []).size).toBe(exercise.options?.length);
          break;
        case 'speaking':
          expect(exercise.speakingTarget?.trim()).toBeTruthy();
          break;
        case 'quiz': {
          const options = exercise.quizOptions ?? [];
          expect(options).toHaveLength(4);
          expect(options.filter((option) => option.isCorrect)).toHaveLength(1);
          break;
        }
        case 'dialogue':
          expect(exercise.dialogueLines?.length ?? 0).toBeGreaterThan(0);
          break;
        default:
          throw new Error(`Unhandled exercise type: ${exercise.type}`);
      }
    });
  });

  it('starts new users with no unlocked badges', () => {
    DEFAULT_BADGES.forEach((badge) => {
      expect(badge.unlockedAt).toBeNull();
      expect(badge.currentCount).toBe(0);
      expect(badge.targetCount).toBeGreaterThan(0);
    });
  });

  it('seeds saved words with valid review dates', () => {
    INITIAL_SAVED_WORDS.forEach((word) => {
      expect(word.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(word.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

describe('getDailyChallengeExercises', () => {
  it('is deterministic for the same seed', () => {
    const first = getDailyChallengeExercises(20260101).map((item) => item.exercise.id);
    const second = getDailyChallengeExercises(20260101).map((item) => item.exercise.id);
    expect(first).toEqual(second);
  });

  it('returns one exercise for each of the five graded types', () => {
    const types = getDailyChallengeExercises(20260101).map((item) => item.exercise.type);
    expect(types.sort()).toEqual(
      ['flashcard', 'listening-cloze', 'quiz', 'speaking', 'word-reorder'].sort()
    );
  });

  it('only proposes exercises that exist in the curriculum', () => {
    const ids = new Set(LESSON_UNITS.flatMap((unit) => unit.exercises.map((e) => e.id)));
    getDailyChallengeExercises(7).forEach((item) => {
      expect(ids.has(item.exercise.id)).toBe(true);
      expect(item.unitTitle.length).toBeGreaterThan(0);
    });
  });
});
