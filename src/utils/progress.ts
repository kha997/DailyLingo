import { Badge, SavedWord, SessionResult, SkillKey, UserStats } from '../types/index.ts';
import { computeNextReviewDate } from '../data/curriculumData.ts';

export const XP_PER_LEVEL = 100;

/**
 * Mastery tiers passed to `computeNextReviewDate` for saved words.
 *
 * These come from the learner's own flashcard self-assessment, not from
 * measured retention or pronunciation. They only decide how soon the word is
 * shown again, so the names must not be read as a score.
 */
export const WORD_MASTERY = {
  recalled: 72,
  needsReview: 25,
  mastered: 90,
  unmastered: 50,
} as const;

export type WordReviewOutcome = 'recalled' | 'needs-review';

/** Apply a flashcard self-assessment to a saved word and reschedule it. */
export function applyWordReview(
  word: SavedWord,
  today: string,
  outcome: WordReviewOutcome
): SavedWord {
  const nextReviewCount = Math.max(0, word.reviewCount) + 1;
  const recalled = outcome === 'recalled';

  return {
    ...word,
    reviewCount: nextReviewCount,
    lastReviewedAt: today,
    // Reporting “cần ôn lại” withdraws the mastered mark: the learner just told
    // us the word is not solid yet.
    mastered: recalled ? word.mastered : false,
    // A failed recall keeps the short interval regardless of how many times the
    // word was seen, so a high review count cannot paper over poor recall.
    nextReviewDate: computeNextReviewDate(
      today,
      recalled ? WORD_MASTERY.recalled : WORD_MASTERY.needsReview,
      recalled ? nextReviewCount : 0
    ),
  };
}

/** Apply the notebook's mastered/unmastered toggle and reschedule the word. */
export function applyWordMasteryToggle(word: SavedWord, today: string): SavedWord {
  const mastered = !word.mastered;
  const nextReviewCount = Math.max(0, word.reviewCount) + 1;

  return {
    ...word,
    mastered,
    reviewCount: nextReviewCount,
    lastReviewedAt: today,
    nextReviewDate: computeNextReviewDate(
      today,
      mastered ? WORD_MASTERY.mastered : WORD_MASTERY.unmastered,
      nextReviewCount
    ),
  };
}

export function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1);
}

/** XP shown for today comes only from recorded history; no estimates. */
export function getTodayXp(stats: UserStats, today: string): number {
  return Math.max(0, stats.dailyXpHistory?.[today] ?? 0);
}

/**
 * Blend a session's measured accuracy into the stored skill estimate.
 * The weight grows with the number of graded answers, so one lucky answer
 * cannot jump a skill to 100%. This is a practice estimate, not a certificate.
 */
export function blendSkillMastery(
  previous: number,
  correct: number,
  total: number
): number {
  if (total <= 0) return previous;
  const sessionAccuracy = (correct / total) * 100;
  const weight = Math.min(0.5, Math.max(0.2, total / 10));
  return Math.round(Math.min(100, Math.max(0, previous + (sessionAccuracy - previous) * weight)));
}

/**
 * Apply a finished session to the persisted stats.
 *
 * A session with no completed activity changes nothing: merely opening and
 * skipping a lesson must not extend a streak or count as study time.
 *
 * Streak/study-day evidence requires at least one **graded** answer. Finishing
 * only unscored activities (dialogue, self-verified speaking) still counts
 * toward completion totals, but it cannot extend a streak or claim accuracy.
 */
export function applySessionResult(
  prev: UserStats,
  result: SessionResult,
  today: string,
  yesterday: string
): UserStats {
  if (result.completed <= 0) return prev;

  const earnedXp = Math.max(0, result.earnedXp);
  const newXp = Math.max(0, prev.xp + earnedXp);
  const gradedAnswers = Math.max(0, result.total);
  const gradedCorrect = Math.min(gradedAnswers, Math.max(0, result.correct));

  let newStreak = prev.currentStreak;
  let updatedStudyDays = prev.studyDays;
  let lastStudyDate = prev.lastStudyDate;

  if (gradedAnswers > 0) {
    const hasStudiedToday = prev.studyDays.includes(today);
    if (!hasStudiedToday) {
      if (prev.lastStudyDate === yesterday) {
        newStreak += 1;
      } else if (prev.lastStudyDate !== today) {
        // A gap longer than one day restarts the streak at today.
        newStreak = 1;
      }
      updatedStudyDays = [...prev.studyDays, today];
    }
    lastStudyDate = today;
  }

  const newMastery = { ...prev.skillMastery };

  (Object.keys(result.skillBreakdown) as SkillKey[]).forEach((skill) => {
    const score = result.skillBreakdown[skill];
    if (!score || score.total <= 0) return;
    newMastery[skill] = blendSkillMastery(newMastery[skill], score.correct, score.total);
  });

  const previousHistory = prev.dailyXpHistory || {};
  const updatedHistory =
    earnedXp > 0
      ? { ...previousHistory, [today]: (previousHistory[today] || 0) + earnedXp }
      : previousHistory;

  return {
    ...prev,
    xp: newXp,
    level: calculateLevel(newXp),
    currentStreak: newStreak,
    longestStreak: Math.max(prev.longestStreak, newStreak),
    lastStudyDate,
    studyDays: updatedStudyDays,
    todayExercisesDone: prev.todayExercisesDone + result.completed,
    totalExercisesCompleted: prev.totalExercisesCompleted + result.completed,
    correctAnswersCount: prev.correctAnswersCount + gradedCorrect,
    gradedAnswersCount: (prev.gradedAnswersCount ?? 0) + gradedAnswers,
    gradedCorrectCount: (prev.gradedCorrectCount ?? 0) + gradedCorrect,
    timeSpentMinutes:
      Math.round((prev.timeSpentMinutes + Math.max(0, result.durationSeconds) / 60) * 10) / 10,
    skillMastery: newMastery,
    dailyXpHistory: updatedHistory,
  };
}

interface BadgeContext {
  stats: UserStats;
  savedWordsCount: number;
  /** Best transcript-match score in the just-finished session, if any. */
  speakingBestScore?: number | null;
}

function progressForBadge(badge: Badge, context: BadgeContext): number {
  const { stats, savedWordsCount, speakingBestScore } = context;
  switch (badge.id) {
    case 'first-step':
      return stats.totalExercisesCompleted;
    case 'streak-3':
    case 'streak-7':
      return stats.currentStreak;
    case 'vocab-collector':
      return savedWordsCount;
    case 'perfect-score':
      return speakingBestScore != null && speakingBestScore >= 85 ? 1 : 0;
    case 'mastery-level-2':
      return stats.xp;
    default:
      return badge.currentCount;
  }
}

export function updateBadgeProgress(
  badges: Badge[],
  context: BadgeContext,
  today: string
): Badge[] {
  return badges.map((badge) => {
    const currentCount = Math.max(0, progressForBadge(badge, context));
    const shouldUnlock = currentCount >= badge.targetCount;

    if (badge.unlockedAt) {
      return currentCount === badge.currentCount
        ? badge
        : { ...badge, currentCount: Math.max(badge.currentCount, currentCount) };
    }

    if (shouldUnlock) {
      return { ...badge, currentCount, unlockedAt: today };
    }

    return currentCount === badge.currentCount ? badge : { ...badge, currentCount };
  });
}
