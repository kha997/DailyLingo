import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  INITIAL_USER_STATS,
  STORAGE_KEYS,
  parseDateKey,
  toDateKey,
  addDays,
} from './storage.ts';

beforeEach(() => {
  localStorage.clear();
});

describe('storage utilities', () => {
  describe('getTodayDateString', () => {
    it('returns today date in YYYY-MM-DD format', () => {
      expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns a consistent date within the same test', () => {
      expect(getTodayDateString()).toBe(getTodayDateString());
    });

    it('uses the local calendar day, not UTC', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1, 0, 30, 0));
      expect(getTodayDateString()).toBe('2026-01-01');
      vi.useRealTimers();
    });
  });

  describe('getYesterdayDateString', () => {
    it('returns yesterday in YYYY-MM-DD format', () => {
      expect(getYesterdayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('crosses a month boundary correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 1, 9, 0, 0));
      expect(getYesterdayDateString()).toBe('2026-02-28');
      vi.useRealTimers();
    });
  });

  describe('date helpers', () => {
    it('round-trips a date key through parse', () => {
      expect(toDateKey(parseDateKey('2026-02-28')!)).toBe('2026-02-28');
    });

    it('rejects impossible and malformed dates', () => {
      expect(parseDateKey('2026-02-30')).toBeNull();
      expect(parseDateKey('01-02-2026')).toBeNull();
    });

    it('adds days across a leap day', () => {
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    });
  });

  describe('INITIAL_USER_STATS', () => {
    it('has expected default properties for a new user', () => {
      expect(INITIAL_USER_STATS.xp).toBe(0);
      expect(INITIAL_USER_STATS.level).toBe(1);
      expect(INITIAL_USER_STATS.currentStreak).toBe(0);
      expect(INITIAL_USER_STATS.longestStreak).toBe(0);
      expect(INITIAL_USER_STATS.lastStudyDate).toBeNull();
      expect(Array.isArray(INITIAL_USER_STATS.studyDays)).toBe(true);
      expect(INITIAL_USER_STATS.todayExercisesDone).toBe(0);
      expect(INITIAL_USER_STATS.dailyGoal).toBe(5);
      expect(INITIAL_USER_STATS.dailyXpGoal).toBe(50);
      expect(INITIAL_USER_STATS.dailyXpHistory).toEqual({});
    });
  });

  describe('loadUserStats', () => {
    it('returns initial stats when localStorage is empty', () => {
      expect(loadUserStats()).toEqual(INITIAL_USER_STATS);
    });

    it('loads stats from localStorage', () => {
      localStorage.setItem(
        STORAGE_KEYS.stats,
        JSON.stringify({ ...INITIAL_USER_STATS, currentStreak: 7, longestStreak: 10 })
      );
      const result = loadUserStats();
      expect(result.currentStreak).toBe(7);
      expect(result.longestStreak).toBe(10);
    });

    it('applies the default dailyXpGoal when missing', () => {
      localStorage.setItem(
        STORAGE_KEYS.stats,
        JSON.stringify({ ...INITIAL_USER_STATS, dailyXpGoal: undefined })
      );
      expect(loadUserStats().dailyXpGoal).toBe(50);
    });

    it('resets todayExercisesDone when the stored day is not today', () => {
      localStorage.setItem(
        STORAGE_KEYS.stats,
        JSON.stringify({ ...INITIAL_USER_STATS, lastStudyDate: '2026-10-28', currentStreak: 5 })
      );
      const result = loadUserStats();
      expect(result.currentStreak).toBeLessThanOrEqual(5);
      expect(result.todayExercisesDone).toBe(0);
    });

    it('maintains the streak when studying yesterday', () => {
      localStorage.setItem(
        STORAGE_KEYS.stats,
        JSON.stringify({
          ...INITIAL_USER_STATS,
          lastStudyDate: getYesterdayDateString(),
          currentStreak: 3,
        })
      );
      const result = loadUserStats();
      expect(result.currentStreak).toBe(3);
      expect(result.todayExercisesDone).toBe(0);
    });

    it('resets the streak after a longer gap', () => {
      localStorage.setItem(
        STORAGE_KEYS.stats,
        JSON.stringify({ ...INITIAL_USER_STATS, lastStudyDate: '2026-10-20', currentStreak: 5 })
      );
      const result = loadUserStats();
      expect(result.currentStreak).toBe(0);
      expect(result.todayExercisesDone).toBe(0);
    });

    it('recovers from invalid JSON and keeps a backup of the raw value', () => {
      localStorage.setItem(STORAGE_KEYS.stats, '{not json');
      const result = loadUserStats();
      expect(result).toEqual(INITIAL_USER_STATS);
      const backupKey = Object.keys(localStorage).find((key) =>
        key.startsWith('dailylingo_recovery_user_stats_')
      );
      expect(backupKey).toBeDefined();
      expect(localStorage.getItem(backupKey!)).toBe('{not json');
    });

    it('repairs out-of-range fields instead of crashing', () => {
      localStorage.setItem(
        STORAGE_KEYS.stats,
        JSON.stringify({
          xp: -50,
          level: 0,
          skillMastery: { grammar: 400, listening: 'nope' },
          studyDays: ['2026-01-01', 'bad', '2026-01-01'],
          reminderTime: '99:99',
          dailyXpHistory: { '2026-01-01': 20, 'not-a-date': 5, '2026-01-02': -3 },
        })
      );
      const result = loadUserStats();
      expect(result.xp).toBe(0);
      expect(result.level).toBe(1);
      expect(result.skillMastery.grammar).toBe(100);
      expect(result.skillMastery.listening).toBe(0);
      expect(result.studyDays).toEqual(['2026-01-01']);
      expect(result.reminderTime).toBe('20:00');
      expect(result.dailyXpHistory).toEqual({ '2026-01-01': 20 });
    });
  });

  describe('loadSavedWords', () => {
    it('returns initial saved words when localStorage is empty', () => {
      const result = loadSavedWords();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('loads saved words from localStorage', () => {
      const testWords = [
        {
          id: 'w-1',
          word: 'test',
          ipa: '/test/',
          partOfSpeech: 'n',
          meaningVi: 'kiểm tra',
          exampleEn: 'test',
          exampleVi: 'kiểm tra',
          level: 'A1',
          topic: 'daily',
          mastered: false,
          reviewCount: 0,
          lastReviewedAt: '2026-10-29',
          nextReviewDate: '2026-10-30',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(testWords));
      const result = loadSavedWords();
      expect(result).toHaveLength(1);
      expect(result[0].word).toBe('test');
    });

    it('returns initial saved words on parse error and backs up the raw data', () => {
      localStorage.setItem(STORAGE_KEYS.words, 'not valid json');
      expect(loadSavedWords().length).toBeGreaterThan(0);
      expect(
        Object.keys(localStorage).some((key) => key.startsWith('dailylingo_recovery_saved_words_'))
      ).toBe(true);
    });

    it('drops unusable entries but keeps valid ones', () => {
      localStorage.setItem(
        STORAGE_KEYS.words,
        JSON.stringify([{ id: 'ok', word: 'hello' }, { id: 'bad', word: '' }, 42])
      );
      const result = loadSavedWords();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ok');
      expect(result[0].level).toBe('A1');
    });
  });

  describe('saveUserStats', () => {
    it('saves stats to localStorage and reports success', () => {
      const testStats = { ...INITIAL_USER_STATS, currentStreak: 10 };
      expect(saveUserStats(testStats)).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.stats)).toBe(JSON.stringify(testStats));
    });

    it('returns false when storage rejects the write', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      expect(saveUserStats(INITIAL_USER_STATS)).toBe(false);
      spy.mockRestore();
    });
  });

  describe('saveSavedWords', () => {
    it('saves words to localStorage without error', () => {
      const testWords: SavedWord[] = [
        {
          id: 'w-1',
          word: 'test',
          ipa: '/test/',
          partOfSpeech: 'n' as SavedWord['partOfSpeech'],
          meaningVi: 'kiểm tra',
          exampleEn: 'test',
          exampleVi: 'kiểm tra',
          level: 'A1' as CEFRLevel,
          topic: 'daily',
          mastered: false,
          reviewCount: 0,
          lastReviewedAt: '2026-10-29',
          nextReviewDate: '2026-10-30',
        },
      ];
      expect(saveSavedWords(testWords)).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.words)).toBe(JSON.stringify(testWords));
    });
  });

  describe('loadBadges', () => {
    it('returns locked default badges when localStorage is empty', () => {
      const result = loadBadges();
      expect(Array.isArray(result)).toBe(true);
      expect(result.every((badge) => badge.unlockedAt === null)).toBe(true);
    });

    it('loads badges from localStorage', () => {
      const testBadges = [
        {
          id: 'b-1',
          name: 'Test',
          description: 'A test badge',
          iconName: 'star',
          unlockedAt: null,
          targetCount: 5,
          currentCount: 3,
        },
      ];
      localStorage.setItem(STORAGE_KEYS.badges, JSON.stringify(testBadges));
      const result = loadBadges();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test');
    });
  });

  describe('saveBadges', () => {
    it('saves badges to localStorage without error', () => {
      const testBadges = [
        {
          id: 'b-1',
          name: 'Test',
          description: 'A test badge',
          iconName: 'star',
          unlockedAt: null,
          targetCount: 5,
          currentCount: 3,
        },
      ];
      expect(saveBadges(testBadges)).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.badges)).toBe(JSON.stringify(testBadges));
    });
  });
});

describe('backup and recovery', () => {
  it('exports every user dataset', async () => {
    const { createUserDataBackup } = await import('./storage.ts');
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({ ...INITIAL_USER_STATS, xp: 120 }));
    localStorage.setItem(STORAGE_KEYS.soundMuted, 'true');

    const backup = createUserDataBackup();
    expect(backup.schemaVersion).toBe(1);
    expect(backup.app).toBe('DailyLingo');
    expect(backup.stats.xp).toBe(120);
    expect(backup.words.length).toBeGreaterThan(0);
    expect(backup.badges.length).toBeGreaterThan(0);
    expect(backup.preferences.soundMuted).toBe(true);
    expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('imports a valid backup and stores it', async () => {
    const { importUserDataBackup } = await import('./storage.ts');
    const backup = {
      schemaVersion: 1,
      app: 'DailyLingo',
      exportedAt: new Date().toISOString(),
      stats: { ...INITIAL_USER_STATS, xp: 250, currentStreak: 4 },
      words: [],
      badges: [],
      preferences: { soundMuted: false },
    };

    const result = importUserDataBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    expect(result.stats?.xp).toBe(250);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.stats)!).xp).toBe(250);
    expect(localStorage.getItem(STORAGE_KEYS.soundMuted)).toBe('false');
  });

  it('rejects invalid JSON, wrong app and missing data', async () => {
    const { importUserDataBackup } = await import('./storage.ts');
    expect(importUserDataBackup('{').ok).toBe(false);
    expect(importUserDataBackup(JSON.stringify({ schemaVersion: 1, app: 'Other' })).ok).toBe(false);
    expect(
      importUserDataBackup(
        JSON.stringify({ schemaVersion: 1, app: 'DailyLingo', stats: {}, words: 'no', badges: [] })
      ).ok
    ).toBe(false);
  });

  it('rejects a backup whose word list is entirely unusable', async () => {
    const { importUserDataBackup } = await import('./storage.ts');
    const backup = {
      schemaVersion: 1,
      app: 'DailyLingo',
      exportedAt: new Date().toISOString(),
      stats: INITIAL_USER_STATS,
      words: [{ id: 'bad', word: '' }],
      badges: [],
    };
    expect(importUserDataBackup(JSON.stringify(backup)).ok).toBe(false);
  });

  it('keeps a pre-import snapshot so a mistaken import can be undone', async () => {
    const { importUserDataBackup } = await import('./storage.ts');
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({ ...INITIAL_USER_STATS, xp: 999 }));
    const backup = {
      schemaVersion: 1,
      app: 'DailyLingo',
      exportedAt: new Date().toISOString(),
      stats: INITIAL_USER_STATS,
      words: [],
      badges: [],
    };
    importUserDataBackup(JSON.stringify(backup));
    const snapshotKey = Object.keys(localStorage).find((key) =>
      key.startsWith('dailylingo_recovery_pre_import_')
    );
    expect(snapshotKey).toBeDefined();
    const snapshot = JSON.parse(localStorage.getItem(snapshotKey!)!);
    expect(snapshot.kind).toBe('pre-import-raw');
    // Raw bytes, not a sanitized view: the old XP is still there.
    expect(JSON.parse(snapshot.raw[STORAGE_KEYS.stats]).xp).toBe(999);
  });

  it('rolls back a partial import instead of mixing two profiles', async () => {
    const { importUserDataBackup } = await import('./storage.ts');
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({ ...INITIAL_USER_STATS, xp: 999 }));
    localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(loadSavedWords()));

    const originalSetItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string
    ) {
      if (key === STORAGE_KEYS.words) throw new Error('quota exceeded');
      return originalSetItem.call(this, key, value);
    });

    try {
      const backup = {
        schemaVersion: 1,
        app: 'DailyLingo',
        exportedAt: new Date().toISOString(),
        stats: { ...INITIAL_USER_STATS, xp: 1 },
        words: [],
        badges: [],
      };
      const result = importUserDataBackup(JSON.stringify(backup));
      expect(result.ok).toBe(false);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.stats)!).xp).toBe(999);
    } finally {
      spy.mockRestore();
    }
  });

  it('prunes old pre-import snapshots so they cannot grow forever', async () => {
    const { importUserDataBackup } = await import('./storage.ts');
    for (let index = 0; index < 6; index += 1) {
      localStorage.setItem(`dailylingo_recovery_pre_import_${1000 + index}`, '{}');
    }
    const backup = {
      schemaVersion: 1,
      app: 'DailyLingo',
      exportedAt: new Date().toISOString(),
      stats: INITIAL_USER_STATS,
      words: [],
      badges: [],
    };
    expect(importUserDataBackup(JSON.stringify(backup)).ok).toBe(true);
    const snapshots = Object.keys(localStorage).filter((key) =>
      key.startsWith('dailylingo_recovery_pre_import_')
    );
    expect(snapshots.length).toBeLessThanOrEqual(3);
  });

  it('clears only DailyLingo keys and resets to defaults', async () => {
    const { clearAllUserData } = await import('./storage.ts');
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({ ...INITIAL_USER_STATS, xp: 10 }));
    localStorage.setItem('dailylingo_recovery_user_stats_1', 'raw');
    localStorage.setItem('unrelated_key', 'keep me');

    expect(clearAllUserData()).toBe(true);
    expect(localStorage.getItem('unrelated_key')).toBe('keep me');
    expect(
      Object.keys(localStorage).filter((key) => key.startsWith('dailylingo_'))
    ).toEqual([]);
    expect(loadUserStats()).toEqual(INITIAL_USER_STATS);
    expect(loadBadges().every((badge) => badge.unlockedAt === null)).toBe(true);
  });
});
