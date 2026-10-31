import { Badge, SavedWord, UserStats } from '../types/index.ts';
import { DEFAULT_BADGES, INITIAL_SAVED_WORDS } from '../data/curriculumData.ts';

const STATS_KEY = 'dailylingo_user_stats';
const WORDS_KEY = 'dailylingo_saved_words';
const BADGES_KEY = 'dailylingo_badges';

export function getTodayDateString(): string {
  const today = new Date();
  return today.toLocaleDateString('en-CA');
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toLocaleDateString('en-CA');
}

export const INITIAL_USER_STATS: UserStats = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  studyDays: [],
  todayExercisesDone: 0,
  dailyGoal: 5,
  dailyXpGoal: 50,
  totalExercisesCompleted: 0,
  correctAnswersCount: 0,
  timeSpentMinutes: 0,
  skillMastery: {
    vocabulary: 0,
    grammar: 0,
    listening: 0,
    speaking: 0,
  },
  audioAccent: 'en-US',
  audioRate: 0.95,
  theme: 'light',
  reminderEnabled: false,
  reminderTime: '20:00',
  lastReminderSentDate: null,
  dailyXpHistory: {},
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
      // If last study was yesterday, maintain streak; if older or never studied, reset streak
      if (parsed.lastStudyDate === yesterday) {
        // Continued streak - keep current streak count
      } else if (parsed.lastStudyDate !== null) {
        // Missed yesterday (studied before but not yesterday) -> reset streak to 0
        parsed.currentStreak = 0;
      }
      // If lastStudyDate is null (brand new user), streak stays 0
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
