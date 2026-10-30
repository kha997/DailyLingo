import { Badge, SavedWord, UserStats } from '../types/index.ts';
import { DEFAULT_BADGES, INITIAL_SAVED_WORDS } from '../data/curriculumData.ts';

const STATS_KEY = 'dailylingo_user_stats';
const WORDS_KEY = 'dailylingo_saved_words';
const BADGES_KEY = 'dailylingo_badges';

export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export const INITIAL_USER_STATS: UserStats = {
  xp: 180,
  level: 2,
  currentStreak: 3,
  longestStreak: 5,
  lastStudyDate: getTodayDateString(),
  studyDays: [getYesterdayDateString(), getTodayDateString()],
  todayExercisesDone: 2,
  dailyGoal: 5,
  dailyXpGoal: 50,
  totalExercisesCompleted: 14,
  correctAnswersCount: 12,
  timeSpentMinutes: 28,
  skillMastery: {
    vocabulary: 65,
    grammar: 55,
    listening: 60,
    speaking: 45,
  },
  audioAccent: 'en-US',
  audioRate: 0.95,
  theme: 'light',
  reminderEnabled: false,
  reminderTime: '20:00',
  lastReminderSentDate: null,
  dailyXpHistory: {
    [getYesterdayDateString()]: 45,
    [getTodayDateString()]: 30,
  },
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return INITIAL_USER_STATS;
    const parsed = JSON.parse(raw) as UserStats;
    if (!parsed.dailyXpGoal) {
      parsed.dailyXpGoal = 50;
    }
    // Check if new day
    const today = getTodayDateString();
    if (parsed.lastStudyDate !== today) {
      // It's a new day
      const yesterday = getYesterdayDateString();
      // If last study was yesterday, maintain streak; if older, reset streak
      if (parsed.lastStudyDate === yesterday) {
        // Continued streak - keep current streak count
      } else if (parsed.lastStudyDate === null || parsed.lastStudyDate !== today) {
        // Missed yesterday or first time -> reset streak to 1 (will be set when user studies today)
        parsed.currentStreak = 1;
      }
      // Always reset today's exercise count for the new day
      parsed.todayExercisesDone = 0;
    }
    return parsed;
  } catch {
    return INITIAL_USER_STATS;
  }
}

export function saveUserStats(stats: UserStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save stats', err);
  }
}

export function loadSavedWords(): SavedWord[] {
  try {
    const raw = localStorage.getItem(WORDS_KEY);
    if (!raw) return INITIAL_SAVED_WORDS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAVED_WORDS;
  }
}

export function saveSavedWords(words: SavedWord[]) {
  try {
    localStorage.setItem(WORDS_KEY, JSON.stringify(words));
  } catch (err) {
    console.error('Failed to save words', err);
  }
}

export function loadBadges(): Badge[] {
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    if (!raw) return DEFAULT_BADGES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BADGES;
  }
}

export function saveBadges(badges: Badge[]) {
  try {
    localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
  } catch (err) {
    console.error('Failed to save badges', err);
  }
}
