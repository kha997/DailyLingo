import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Badge, SavedWord, SessionResult, UserStats } from '../types/index.ts';
import { DEFAULT_BADGES } from '../data/curriculumData.ts';
import { INITIAL_USER_STATS } from './storage.ts';
import {
  applySessionResult,
  applyWordMasteryToggle,
  applyWordReview,
  blendSkillMastery,
  calculateLevel,
  getTodayXp,
  updateBadgeProgress,
  XP_PER_LEVEL,
} from './progress.ts';

const TODAY = '2026-05-10';
const YESTERDAY = '2026-05-09';

const makeStats = (overrides: Partial<UserStats> = {}): UserStats => ({
  ...INITIAL_USER_STATS,
  ...overrides,
  skillMastery: { ...INITIAL_USER_STATS.skillMastery, ...(overrides.skillMastery ?? {}) },
  dailyXpHistory: { ...(overrides.dailyXpHistory ?? {}) },
});

const makeResult = (overrides: Partial<SessionResult> = {}): SessionResult => ({
  total: 5,
  correct: 4,
  completed: 5,
  earnedXp: 60,
  exerciseType: 'lesson',
  reviewedWords: [],
  skillBreakdown: {
    vocabulary: { correct: 2, total: 2 },
    grammar: { correct: 2, total: 3 },
  },
  durationSeconds: 120,
  speakingBestScore: null,
  speakingAttempts: 0,
  ...overrides,
});

describe('calculateLevel', () => {
  it('starts at level 1 for zero or negative XP', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(-10)).toBe(1);
  });

  it('advances every full XP_PER_LEVEL', () => {
    expect(calculateLevel(XP_PER_LEVEL - 1)).toBe(1);
    expect(calculateLevel(XP_PER_LEVEL)).toBe(2);
    expect(calculateLevel(XP_PER_LEVEL * 3)).toBe(4);
  });
});

describe('getTodayXp', () => {
  it('returns only recorded XP for the given date', () => {
    expect(getTodayXp(makeStats({ dailyXpHistory: { [TODAY]: 45 } }), TODAY)).toBe(45);
  });

  it('does not estimate from completed exercise count', () => {
    expect(getTodayXp(makeStats({ todayExercisesDone: 10 }), TODAY)).toBe(0);
  });

  it('never returns a negative value', () => {
    expect(getTodayXp(makeStats({ dailyXpHistory: { [TODAY]: -5 } }), TODAY)).toBe(0);
  });
});

describe('blendSkillMastery', () => {
  it('keeps the previous value when nothing was graded', () => {
    expect(blendSkillMastery(42, 0, 0)).toBe(42);
  });

  it('moves toward session accuracy without jumping to it', () => {
    const next = blendSkillMastery(0, 10, 10);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(100);
  });

  it('is bounded to 0..100', () => {
    expect(blendSkillMastery(100, 0, 5)).toBeLessThanOrEqual(100);
    expect(blendSkillMastery(0, 5, 5)).toBeLessThanOrEqual(100);
    expect(blendSkillMastery(5, 0, 5)).toBeGreaterThanOrEqual(0);
  });
});

describe('applySessionResult', () => {
  it('does nothing when no activity was completed', () => {
    const prev = makeStats({ xp: 100 });
    const next = applySessionResult(
      prev,
      makeResult({ completed: 0, total: 0, correct: 0, earnedXp: 0 }),
      TODAY,
      YESTERDAY
    );
    expect(next).toBe(prev);
  });

  it('starts a streak and records XP and history on the first session', () => {
    const next = applySessionResult(makeStats(), makeResult(), TODAY, YESTERDAY);
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(1);
    expect(next.lastStudyDate).toBe(TODAY);
    expect(next.studyDays).toEqual([TODAY]);
    expect(next.xp).toBe(60);
    expect(next.dailyXpHistory?.[TODAY]).toBe(60);
    expect(next.todayExercisesDone).toBe(5);
    expect(next.totalExercisesCompleted).toBe(5);
    expect(next.correctAnswersCount).toBe(4);
    expect(next.timeSpentMinutes).toBe(2);
  });

  it('does not extend the streak twice on the same day but adds XP', () => {
    const first = applySessionResult(makeStats(), makeResult(), TODAY, YESTERDAY);
    const second = applySessionResult(first, makeResult({ earnedXp: 30 }), TODAY, YESTERDAY);
    expect(second.currentStreak).toBe(1);
    expect(second.studyDays).toEqual([TODAY]);
    expect(second.dailyXpHistory?.[TODAY]).toBe(90);
    expect(second.xp).toBe(90);
    expect(second.todayExercisesDone).toBe(10);
  });

  it('continues a streak when the previous session was yesterday', () => {
    const prev = makeStats({
      currentStreak: 4,
      longestStreak: 4,
      lastStudyDate: YESTERDAY,
      studyDays: ['2026-05-06', '2026-05-07', '2026-05-08', YESTERDAY],
    });
    const next = applySessionResult(prev, makeResult(), TODAY, YESTERDAY);
    expect(next.currentStreak).toBe(5);
    expect(next.longestStreak).toBe(5);
  });

  it('restarts the streak after a gap', () => {
    const prev = makeStats({ currentStreak: 9, longestStreak: 9, lastStudyDate: '2026-05-01' });
    const next = applySessionResult(prev, makeResult(), TODAY, YESTERDAY);
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(9);
  });

  it('keeps the level in sync with total XP', () => {
    const prev = makeStats({ xp: 90, level: 1 });
    const next = applySessionResult(prev, makeResult({ earnedXp: 20 }), TODAY, YESTERDAY);
    expect(next.xp).toBe(110);
    expect(next.level).toBe(2);
  });

  it('ignores negative XP from a malformed result', () => {
    const next = applySessionResult(
      makeStats({ xp: 50 }),
      makeResult({ earnedXp: -500 }),
      TODAY,
      YESTERDAY
    );
    expect(next.xp).toBe(50);
    expect(next.dailyXpHistory?.[TODAY]).toBeUndefined();
  });

  it('counts only graded answers toward accuracy, not dialogue completions', () => {
    const next = applySessionResult(
      makeStats(),
      makeResult({ total: 2, correct: 1, completed: 5, earnedXp: 15 }),
      TODAY,
      YESTERDAY
    );
    expect(next.gradedAnswersCount).toBe(2);
    expect(next.gradedCorrectCount).toBe(1);
    expect(next.totalExercisesCompleted).toBe(5);
  });

  it('does not start or extend a streak from unscored completions alone', () => {
    const prev = makeStats({ currentStreak: 3, longestStreak: 3, lastStudyDate: YESTERDAY });
    const next = applySessionResult(
      prev,
      makeResult({ total: 0, correct: 0, completed: 2, earnedXp: 0 }),
      TODAY,
      YESTERDAY
    );
    expect(next.currentStreak).toBe(3);
    expect(next.lastStudyDate).toBe(YESTERDAY);
    expect(next.studyDays).toEqual([]);
    expect(next.todayExercisesDone).toBe(2);
    expect(next.gradedAnswersCount).toBe(0);
  });

  it('never records more correct answers than graded answers', () => {
    const next = applySessionResult(
      makeStats(),
      makeResult({ total: 2, correct: 99, completed: 2, earnedXp: 15 }),
      TODAY,
      YESTERDAY
    );
    expect(next.gradedCorrectCount).toBe(2);
  });
});

describe('updateBadgeProgress', () => {
  const context = (stats: UserStats, savedWordsCount = 0, speakingBestScore: number | null = null) => ({
    stats,
    savedWordsCount,
    speakingBestScore,
  });

  it('unlocks the first-step badge exactly when the first exercise completes', () => {
    const locked = updateBadgeProgress(
      DEFAULT_BADGES.map((badge) => ({ ...badge })),
      context(makeStats({ totalExercisesCompleted: 0 })),
      TODAY
    );
    expect(locked.find((badge) => badge.id === 'first-step')?.unlockedAt).toBeNull();

    const unlocked = updateBadgeProgress(
      DEFAULT_BADGES.map((badge) => ({ ...badge })),
      context(makeStats({ totalExercisesCompleted: 1 })),
      TODAY
    );
    expect(unlocked.find((badge) => badge.id === 'first-step')?.unlockedAt).toBe(TODAY);
  });

  it('only unlocks the speaking badge at 85% or higher', () => {
    const below = updateBadgeProgress(
      DEFAULT_BADGES.map((badge) => ({ ...badge })),
      context(makeStats(), 0, 84),
      TODAY
    );
    const at = updateBadgeProgress(
      DEFAULT_BADGES.map((badge) => ({ ...badge })),
      context(makeStats(), 0, 85),
      TODAY
    );
    expect(below.find((badge) => badge.id === 'perfect-score')?.unlockedAt).toBeNull();
    expect(at.find((badge) => badge.id === 'perfect-score')?.unlockedAt).toBe(TODAY);
  });

  it('keeps an existing unlock date and never lowers progress', () => {
    const badges: Badge[] = [
      {
        id: 'vocab-collector',
        name: 'x',
        description: 'x',
        iconName: 'x',
        unlockedAt: '2026-01-01',
        targetCount: 5,
        currentCount: 7,
      },
    ];
    const next = updateBadgeProgress(badges, context(makeStats(), 2), TODAY);
    expect(next[0].unlockedAt).toBe('2026-01-01');
    expect(next[0].currentCount).toBe(7);
  });

  it('records progress toward a locked badge without unlocking it', () => {
    const next = updateBadgeProgress(
      DEFAULT_BADGES.map((badge) => ({ ...badge })),
      context(makeStats({ currentStreak: 2 })),
      TODAY
    );
    const streak = next.find((badge) => badge.id === 'streak-3');
    expect(streak?.currentCount).toBe(2);
    expect(streak?.unlockedAt).toBeNull();
  });
});

const makeWord = (overrides: Partial<SavedWord> = {}): SavedWord => ({
  id: 'w-1',
  word: 'resilient',
  ipa: '/rɪˈzɪl.i.ənt/',
  partOfSpeech: 'adj',
  meaningVi: 'Kiên cường',
  exampleEn: 'She stayed resilient through the setback.',
  exampleVi: 'Cô ấy vẫn kiên cường sau thất bại.',
  level: 'B1',
  topic: 'daily',
  mastered: false,
  reviewCount: 0,
  lastReviewedAt: TODAY,
  nextReviewDate: TODAY,
  ...overrides,
});

describe('saved word scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 10, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lengthens the interval when the learner reports recalling the word', () => {
    const next = applyWordReview(makeWord({ reviewCount: 2 }), TODAY, 'recalled');
    // mastery 72 -> 14-day base; reviewCount 3 -> factor 1.6 = 22 days.
    expect(next.nextReviewDate).toBe('2026-06-01');
    expect(next.reviewCount).toBe(3);
    expect(next.lastReviewedAt).toBe(TODAY);
  });

  it('schedules a word reported as needing review for tomorrow', () => {
    const next = applyWordReview(
      makeWord({ reviewCount: 9, mastered: true, nextReviewDate: '2026-12-01' }),
      TODAY,
      'needs-review'
    );
    expect(next.nextReviewDate).toBe('2026-05-11');
    expect(next.mastered).toBe(false);
  });

  it('does not let a high review count stretch a failed recall', () => {
    const few = applyWordReview(makeWord({ reviewCount: 0 }), TODAY, 'needs-review');
    const many = applyWordReview(makeWord({ reviewCount: 20 }), TODAY, 'needs-review');
    expect(many.nextReviewDate).toBe(few.nextReviewDate);
  });

  it('keeps the mastered mark on a successful recall', () => {
    const next = applyWordReview(makeWord({ mastered: true }), TODAY, 'recalled');
    expect(next.mastered).toBe(true);
  });

  it('reschedules further out when a word is marked mastered', () => {
    const word = makeWord({ reviewCount: 2 });
    const mastered = applyWordMasteryToggle(word, TODAY);
    const unmastered = applyWordMasteryToggle({ ...word, mastered: true }, TODAY);
    expect(mastered.mastered).toBe(true);
    expect(unmastered.mastered).toBe(false);
    expect(mastered.nextReviewDate > unmastered.nextReviewDate).toBe(true);
  });
});
