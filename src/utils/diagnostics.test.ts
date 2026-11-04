import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { INITIAL_USER_STATS, STORAGE_KEYS } from './storage.ts';
import {
  DIAGNOSTICS_SCHEMA,
  USER_DATA_SCHEMA,
  buildDiagnosticsReport,
  checkLocalStorage,
  copyTextToClipboard,
  formatDiagnosticsReport,
} from './diagnostics.ts';

const seedWord = {
  id: 'w-secret',
  word: 'topsecret',
  ipa: '/topsecret/',
  partOfSpeech: 'n',
  meaningVi: 'bí mật',
  exampleEn: 'This is topsecret.',
  exampleVi: 'Đây là bí mật.',
  level: 'A1',
  topic: 'daily',
  mastered: false,
  reviewCount: 0,
  lastReviewedAt: '2026-01-01',
  nextReviewDate: '2026-01-02',
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('checkLocalStorage', () => {
  it('reports an available store and leaves no probe key behind', () => {
    const result = checkLocalStorage();
    expect(result.available).toBe(true);
    expect(localStorage.getItem('dailylingo_probe')).toBeNull();
  });

  it('reports a blocked store instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const result = checkLocalStorage();
    expect(result.available).toBe(false);
    expect(result.detail).toContain('bị chặn');
  });
});

describe('buildDiagnosticsReport', () => {
  it('describes the device without copying user content', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T08:00:00.000Z'));
    localStorage.setItem(STORAGE_KEYS.words, JSON.stringify([seedWord]));
    localStorage.setItem(
      STORAGE_KEYS.stats,
      JSON.stringify({
        ...INITIAL_USER_STATS,
        xp: 9876,
        studyDays: ['2026-05-09'],
        totalExercisesCompleted: 12,
      })
    );

    const report = buildDiagnosticsReport();
    expect(report.app).toBe('DailyLingo');
    expect(report.reportSchema).toBe(DIAGNOSTICS_SCHEMA);
    expect(report.userDataSchema).toBe(USER_DATA_SCHEMA);
    expect(report.generatedAt).toBe('2026-05-10T08:00:00.000Z');
    expect(report.storage.savedWords).toBe(1);
    expect(report.storage.hasStudyHistory).toBe(true);
    expect(report.storage.usageBytes).toBeGreaterThan(0);

    const serialised = formatDiagnosticsReport(report);
    expect(serialised).not.toContain('topsecret');
    expect(serialised).not.toContain('9876');
    expect(serialised).not.toContain('2026-05-09');
    expect(serialised).toContain('"automaticallyUploaded": false');
    expect(serialised).toContain('"includesAudio": false');
  });

  it('reports no study history on a fresh device', () => {
    const report = buildDiagnosticsReport();
    expect(report.storage.hasStudyHistory).toBe(false);
    expect(report.storage.unlockedBadges).toBe(0);
    expect(report.storage.savedWords).toBeGreaterThan(0);
  });

  it('counts unlocked badges without listing them', () => {
    localStorage.setItem(
      STORAGE_KEYS.badges,
      JSON.stringify([
        {
          id: 'b-1',
          name: 'secret badge name',
          description: 'x',
          iconName: 'x',
          unlockedAt: '2026-01-01',
          targetCount: 1,
          currentCount: 1,
        },
      ])
    );
    const report = buildDiagnosticsReport();
    expect(report.storage.unlockedBadges).toBe(1);
    expect(formatDiagnosticsReport(report)).not.toContain('secret badge name');
  });

  it('exposes only boolean capability flags and the permission state', () => {
    const report = buildDiagnosticsReport();
    expect(typeof report.capabilities.speechRecognition).toBe('boolean');
    expect(typeof report.capabilities.speechSynthesis).toBe('boolean');
    expect(typeof report.capabilities.notifications).toBe('boolean');
    expect(['default', 'granted', 'denied', 'unsupported']).toContain(
      report.capabilities.notificationPermission
    );
  });
});

describe('copyTextToClipboard', () => {
  it('uses the async clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(copyTextToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
  });

  it('falls back to execCommand when the async clipboard rejects', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    await expect(copyTextToClipboard('hello')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelectorAll('textarea')).toHaveLength(0);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
  });

  it('returns false when every copy path is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: undefined,
    });

    await expect(copyTextToClipboard('hello')).resolves.toBe(false);
  });
});
