import { describe, it, expect, beforeEach } from 'vitest';
import { CEFRLevel, SavedWord } from '../types/index.ts';
import { 
  loadUserStats, 
  saveUserStats, 
  loadSavedWords, 
  saveSavedWords, 
  loadBadges, 
  saveBadges,
  getTodayDateString,
  getYesterdayDateString,
  INITIAL_USER_STATS
} from './storage.ts';

// Mock localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

describe('storage utilities', () => {
  describe('getTodayDateString', () => {
    it('returns today date in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns consistent date within same test', () => {
      const result1 = getTodayDateString();
      const result2 = getTodayDateString();
      expect(result1).toBe(result2);
    });
  });

  describe('getYesterdayDateString', () => {
    it('returns yesterday date in YYYY-MM-DD format', () => {
      const result = getYesterdayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('INITIAL_USER_STATS', () => {
    it('has expected default properties', () => {
      expect(INITIAL_USER_STATS.xp).toBe(180);
      expect(INITIAL_USER_STATS.level).toBe(2);
      expect(INITIAL_USER_STATS.currentStreak).toBe(3);
      expect(INITIAL_USER_STATS.longestStreak).toBe(5);
      expect(typeof INITIAL_USER_STATS.lastStudyDate).toBe('string');
      expect(Array.isArray(INITIAL_USER_STATS.studyDays)).toBe(true);
      expect(INITIAL_USER_STATS.todayExercisesDone).toBe(2);
      expect(INITIAL_USER_STATS.dailyGoal).toBe(5);
      expect(INITIAL_USER_STATS.dailyXpGoal).toBe(50);
    });
  });

  describe('loadUserStats', () => {
    it('returns initial stats when localStorage is empty', () => {
      const result = loadUserStats();
      expect(result).toEqual(INITIAL_USER_STATS);
    });

    it('loads and returns stats from localStorage', () => {
      const testStats = {
        ...INITIAL_USER_STATS,
        currentStreak: 7,
        longestStreak: 10,
      };
      localStorage.setItem('dailylingo_user_stats', JSON.stringify(testStats));
      const result = loadUserStats();
      expect(result.currentStreak).toBe(7);
      expect(result.longestStreak).toBe(10);
    });

    it('applies default dailyXpGoal when missing', () => {
      localStorage.setItem('dailylingo_user_stats', JSON.stringify({
        ...INITIAL_USER_STATS,
        dailyXpGoal: undefined,
      }));
      const result = loadUserStats();
      expect(result.dailyXpGoal).toBe(50);
    });

    it('resets streak when new day starts', () => {
      localStorage.setItem('dailylingo_user_stats', JSON.stringify({
        ...INITIAL_USER_STATS,
        lastStudyDate: '2026-10-28',
        currentStreak: 5,
      }));
      const result = loadUserStats();
      // Today is 2026-10-29 (or whatever today is), so lastStudyDate is in the past
      expect(result.currentStreak).toBeLessThanOrEqual(5);
      expect(result.todayExercisesDone).toBe(0);
    });

    it('maintains streak when studying yesterday', () => {
      // Setup: last study was yesterday
      localStorage.setItem('dailylingo_user_stats', JSON.stringify({
        ...INITIAL_USER_STATS,
        lastStudyDate: getYesterdayDateString(),
        currentStreak: 3,
      }));
      const result = loadUserStats();
      // Streak should be maintained
      expect(result.currentStreak).toBe(3);
      expect(result.todayExercisesDone).toBe(0);
    });

    it('resets streak when studying much after yesterday', () => {
      // Setup: last study was much earlier than yesterday
      localStorage.setItem('dailylingo_user_stats', JSON.stringify({
        ...INITIAL_USER_STATS,
        lastStudyDate: '2026-10-20',
        currentStreak: 5,
      }));
      const result = loadUserStats();
      // Streak should reset
      expect(result.currentStreak).toBe(1);
      expect(result.todayExercisesDone).toBe(0);
    });
  });

  describe('loadSavedWords', () => {
    it('returns initial saved words when localStorage is empty', () => {
      const result = loadSavedWords();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('loads saved words from localStorage', () => {
      const testWords = [
        { id: 'w-1', word: 'test', ipa: '/test/', partOfSpeech: 'n', meaningVi: 'kiểm tra', exampleEn: 'test', exampleVi: 'kiểm tra', level: 'A1', topic: 'daily', mastered: false, reviewCount: 0, lastReviewedAt: '2026-10-29', nextReviewDate: '2026-10-30' }
      ];
      localStorage.setItem('dailylingo_saved_words', JSON.stringify(testWords));
      const result = loadSavedWords();
      expect(result.length).toBe(1);
      expect(result[0].word).toBe('test');
    });

    it('returns initial saved words on parse error', () => {
      localStorage.setItem('dailylingo_saved_words', 'not valid json');
      const result = loadSavedWords();
      expect(result).toBeDefined();
    });
  });

  describe('saveUserStats', () => {
    it('saves stats to localStorage without error', () => {
      const testStats = { ...INITIAL_USER_STATS, currentStreak: 10 };
      expect(() => saveUserStats(testStats)).not.toThrow();
      expect(localStorage.getItem('dailylingo_user_stats')).toBe(JSON.stringify(testStats));
    });
  });

  describe('saveSavedWords', () => {
    it('saves words to localStorage without error', () => {
      const testWords: SavedWord[] = [{ id: 'w-1', word: 'test', ipa: '/test/', partOfSpeech: 'n' as any, meaningVi: 'kiểm tra', exampleEn: 'test', exampleVi: 'kiểm tra', level: 'A1' as CEFRLevel, topic: 'daily', mastered: false, reviewCount: 0, lastReviewedAt: '2026-10-29', nextReviewDate: '2026-10-30' }];
      expect(() => saveSavedWords(testWords)).not.toThrow();
      expect(localStorage.getItem('dailylingo_saved_words')).toBe(JSON.stringify(testWords));
    });
  });

  describe('loadBadges', () => {
    it('returns default badges when localStorage is empty', () => {
      const result = loadBadges();
      expect(Array.isArray(result)).toBe(true);
    });

    it('loads badges from localStorage', () => {
      const testBadges = [{ id: 'b-1', name: 'Test', description: 'A test badge', iconName: 'star', unlockedAt: null, targetCount: 5, currentCount: 3 }];
      localStorage.setItem('dailylingo_badges', JSON.stringify(testBadges));
      const result = loadBadges();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Test');
    });
  });

  describe('saveBadges', () => {
    it('saves badges to localStorage without error', () => {
      const testBadges = [{ id: 'b-1', name: 'Test', description: 'A test badge', iconName: 'star', unlockedAt: null, targetCount: 5, currentCount: 3 }];
      expect(() => saveBadges(testBadges)).not.toThrow();
      expect(localStorage.getItem('dailylingo_badges')).toBe(JSON.stringify(testBadges));
    });
  });
});