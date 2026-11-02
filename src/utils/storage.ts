import { Badge, CEFRLevel, SavedWord, TopicCategory, UserStats } from '../types/index.ts';
import { DEFAULT_BADGES, INITIAL_SAVED_WORDS } from '../data/curriculumData.ts';

export const STORAGE_KEYS = {
  stats: 'dailylingo_user_stats',
  words: 'dailylingo_saved_words',
  badges: 'dailylingo_badges',
  soundMuted: 'dailylingo_sound_muted',
} as const;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_KEY = /^([01]\d|2[0-3]):[0-5]\d$/;
const VALID_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'IELTS_TOEIC'];
const VALID_TOPICS: TopicCategory[] = ['daily', 'travel', 'work', 'food', 'tech', 'social'];

type RecoveryKind = 'corrupt' | 'blocked' | 'quota' | 'invalid-backup';
interface RecoveryEvent {
  kind: RecoveryKind;
  key: string;
  backupKey?: string;
}

let recoveryEvents: RecoveryEvent[] = [];

function recordRecovery(event: RecoveryEvent) {
  recoveryEvents.push(event);
}

/** Returns and clears the recovery events collected while loading storage. */
export function consumeStorageRecoveryNotice(): RecoveryEvent[] {
  const events = recoveryEvents;
  recoveryEvents = [];
  return events;
}

/** Read-only access for diagnostics. */
export function getStorageRecoveryEvents(): RecoveryEvent[] {
  return [...recoveryEvents];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function asNonNegativeInt(value: unknown, fallback = 0): number {
  return Math.round(asFiniteNumber(value, fallback, 0, Number.MAX_SAFE_INTEGER));
}

function asDateKey(value: unknown, fallback: string | null): string | null {
  return typeof value === 'string' && DATE_KEY.test(value) ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function safeReadRaw(key: string): { raw: string | null; blocked: boolean } {
  try {
    return { raw: localStorage.getItem(key), blocked: false };
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    recordRecovery({ kind: 'blocked', key });
    return { raw: null, blocked: true };
  }
}

function backupRaw(key: string, raw: string): string | undefined {
  const backupKey = `dailylingo_recovery_${key.replace('dailylingo_', '')}_${Date.now()}`;
  try {
    localStorage.setItem(backupKey, raw);
    return backupKey;
  } catch (error) {
    console.error('Failed to back up corrupt storage', error);
    return undefined;
  }
}

function backupCorrupt(key: string, raw: string) {
  const backupKey = backupRaw(key, raw);
  recordRecovery({ kind: 'corrupt', key, backupKey });
}

function parseStoredValue(key: string, raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    backupCorrupt(key, raw);
    return undefined;
  }
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toDateKey(yesterday);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD as a local calendar date (never UTC). */
export function parseDateKey(dateKey: string): Date | null {
  if (!DATE_KEY.test(dateKey)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function addDays(dateKey: string, days: number): string {
  const base = parseDateKey(dateKey) ?? new Date();
  base.setDate(base.getDate() + days);
  return toDateKey(base);
}

function sanitizeSkillMastery(input: unknown): UserStats['skillMastery'] {
  const defaults = INITIAL_USER_STATS.skillMastery;
  if (!isRecord(input)) return { ...defaults };
  return {
    vocabulary: asFiniteNumber(input.vocabulary, defaults.vocabulary, 0, 100),
    grammar: asFiniteNumber(input.grammar, defaults.grammar, 0, 100),
    listening: asFiniteNumber(input.listening, defaults.listening, 0, 100),
    speaking: asFiniteNumber(input.speaking, defaults.speaking, 0, 100),
  };
}

function sanitizeStudyDays(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(input.filter((day): day is string => typeof day === 'string' && DATE_KEY.test(day)))
  );
}

function sanitizeXpHistory(input: unknown): Record<string, number> {
  if (!isRecord(input)) return {};
  const history: Record<string, number> = {};
  for (const [date, xp] of Object.entries(input)) {
    if (!DATE_KEY.test(date)) continue;
    if (typeof xp === 'number' && Number.isFinite(xp) && xp >= 0) {
      history[date] = Math.round(xp);
    }
  }
  return history;
}

export function sanitizeUserStats(input: unknown): UserStats {
  const defaults = clone(INITIAL_USER_STATS);
  if (!isRecord(input)) return defaults;

  const theme = input.theme;
  const accent = input.audioAccent;
  const reminderTime = input.reminderTime;

  return {
    ...defaults,
    xp: asNonNegativeInt(input.xp, defaults.xp),
    level: Math.max(1, asNonNegativeInt(input.level, defaults.level)),
    currentStreak: asNonNegativeInt(input.currentStreak, defaults.currentStreak),
    longestStreak: asNonNegativeInt(input.longestStreak, defaults.longestStreak),
    lastStudyDate: asDateKey(input.lastStudyDate, null),
    studyDays: sanitizeStudyDays(input.studyDays),
    todayExercisesDone: asNonNegativeInt(input.todayExercisesDone, defaults.todayExercisesDone),
    dailyGoal: asNonNegativeInt(input.dailyGoal, defaults.dailyGoal),
    dailyXpGoal: asNonNegativeInt(input.dailyXpGoal, defaults.dailyXpGoal ?? 50),
    totalExercisesCompleted: asNonNegativeInt(
      input.totalExercisesCompleted,
      defaults.totalExercisesCompleted
    ),
    correctAnswersCount: asNonNegativeInt(input.correctAnswersCount, defaults.correctAnswersCount),
    gradedAnswersCount: asNonNegativeInt(
      input.gradedAnswersCount,
      defaults.gradedAnswersCount ?? 0
    ),
    gradedCorrectCount: asNonNegativeInt(
      input.gradedCorrectCount,
      defaults.gradedCorrectCount ?? 0
    ),
    timeSpentMinutes: asNonNegativeInt(input.timeSpentMinutes, defaults.timeSpentMinutes),
    skillMastery: sanitizeSkillMastery(input.skillMastery),
    audioAccent: accent === 'en-GB' ? 'en-GB' : 'en-US',
    audioRate: asFiniteNumber(input.audioRate, defaults.audioRate, 0.5, 1.5),
    theme: theme === 'dark' || theme === 'system' || theme === 'light' ? theme : defaults.theme,
    reminderEnabled: input.reminderEnabled === true,
    reminderTime:
      typeof reminderTime === 'string' && TIME_KEY.test(reminderTime)
        ? reminderTime
        : defaults.reminderTime,
    lastReminderSentDate: asDateKey(input.lastReminderSentDate, null),
    dailyXpHistory: sanitizeXpHistory(input.dailyXpHistory),
  };
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
  gradedAnswersCount: 0,
  gradedCorrectCount: 0,
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
  const { raw, blocked } = safeReadRaw(STORAGE_KEYS.stats);
  if (blocked) return clone(INITIAL_USER_STATS);
  if (!raw) return clone(INITIAL_USER_STATS);

  const parsed = parseStoredValue(STORAGE_KEYS.stats, raw);
  if (!isRecord(parsed)) {
    if (parsed !== undefined) backupCorrupt(STORAGE_KEYS.stats, raw);
    return clone(INITIAL_USER_STATS);
  }

  const parsedStats = sanitizeUserStats(parsed);
  const today = getTodayDateString();

  if (parsedStats.lastStudyDate !== today) {
    const yesterday = getYesterdayDateString();
    if (parsedStats.lastStudyDate === yesterday) {
      // Continue the streak.
    } else if (parsedStats.lastStudyDate !== null) {
      parsedStats.currentStreak = 0;
    }
    parsedStats.todayExercisesDone = 0;
  }

  return parsedStats;
}

export function saveUserStats(stats: UserStats): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
    return true;
  } catch (error) {
    console.error('Failed to save stats', error);
    recordRecovery({ kind: 'quota', key: STORAGE_KEYS.stats });
    return false;
  }
}

function sanitizeSavedWord(input: unknown, index: number): SavedWord | null {
  if (!isRecord(input)) return null;
  const word = asString(input.word).trim();
  if (!word) return null;

  const level = VALID_LEVELS.includes(input.level as CEFRLevel)
    ? (input.level as CEFRLevel)
    : 'A1';
  const topic = VALID_TOPICS.includes(input.topic as TopicCategory)
    ? (input.topic as TopicCategory)
    : 'daily';
  const lastReviewedAt = asDateKey(input.lastReviewedAt, getTodayDateString()) as string;
  const nextReviewDate =
    asDateKey(input.nextReviewDate, addDays(getTodayDateString(), 1)) ?? addDays(getTodayDateString(), 1);

  return {
    id: asString(input.id, `w-recovered-${index}`),
    word,
    ipa: asString(input.ipa),
    partOfSpeech: asString(input.partOfSpeech, 'n'),
    meaningVi: asString(input.meaningVi),
    exampleEn: asString(input.exampleEn),
    exampleVi: asString(input.exampleVi),
    level,
    topic,
    mastered: input.mastered === true,
    reviewCount: asNonNegativeInt(input.reviewCount),
    lastReviewedAt,
    nextReviewDate,
  };
}

export function loadSavedWords(): SavedWord[] {
  const { raw, blocked } = safeReadRaw(STORAGE_KEYS.words);
  if (blocked) return clone(INITIAL_SAVED_WORDS);
  if (!raw) return clone(INITIAL_SAVED_WORDS);

  const parsed = parseStoredValue(STORAGE_KEYS.words, raw);
  if (!Array.isArray(parsed)) {
    if (parsed !== undefined) backupCorrupt(STORAGE_KEYS.words, raw);
    return clone(INITIAL_SAVED_WORDS);
  }

  const valid = parsed
    .map((item, index) => sanitizeSavedWord(item, index))
    .filter((item): item is SavedWord => item !== null);

  if (parsed.length > 0 && valid.length === 0) {
    backupCorrupt(STORAGE_KEYS.words, raw);
    return clone(INITIAL_SAVED_WORDS);
  }
  if (valid.length < parsed.length) {
    backupCorrupt(STORAGE_KEYS.words, raw);
  }

  return valid;
}

export function saveSavedWords(words: SavedWord[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(words));
    return true;
  } catch (error) {
    console.error('Failed to save words', error);
    recordRecovery({ kind: 'quota', key: STORAGE_KEYS.words });
    return false;
  }
}

function sanitizeBadge(input: unknown, index: number): Badge | null {
  if (!isRecord(input)) return null;
  const id = asString(input.id);
  if (!id) return null;
  return {
    id,
    name: asString(input.name, `Huy hiệu ${index + 1}`),
    description: asString(input.description),
    iconName: asString(input.iconName, 'Award'),
    unlockedAt:
      typeof input.unlockedAt === 'string' && DATE_KEY.test(input.unlockedAt)
        ? input.unlockedAt
        : null,
    targetCount: Math.max(1, asNonNegativeInt(input.targetCount, 1)),
    currentCount: asNonNegativeInt(input.currentCount),
  };
}

export function loadBadges(): Badge[] {
  const { raw, blocked } = safeReadRaw(STORAGE_KEYS.badges);
  if (blocked) return clone(DEFAULT_BADGES);
  if (!raw) return clone(DEFAULT_BADGES);

  const parsed = parseStoredValue(STORAGE_KEYS.badges, raw);
  if (!Array.isArray(parsed)) {
    if (parsed !== undefined) backupCorrupt(STORAGE_KEYS.badges, raw);
    return clone(DEFAULT_BADGES);
  }

  const valid = parsed
    .map((item, index) => sanitizeBadge(item, index))
    .filter((item): item is Badge => item !== null);

  if (parsed.length > 0 && valid.length === 0) {
    backupCorrupt(STORAGE_KEYS.badges, raw);
    return clone(DEFAULT_BADGES);
  }
  if (valid.length < parsed.length) {
    backupCorrupt(STORAGE_KEYS.badges, raw);
  }

  return valid;
}

export function saveBadges(badges: Badge[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.badges, JSON.stringify(badges));
    return true;
  } catch (error) {
    console.error('Failed to save badges', error);
    recordRecovery({ kind: 'quota', key: STORAGE_KEYS.badges });
    return false;
  }
}

function setRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to write ${key}`, error);
    recordRecovery({ kind: 'quota', key });
    return false;
  }
}

const PRE_IMPORT_PREFIX = 'dailylingo_recovery_pre_import_';

/**
 * Recovery snapshots are timestamped and would otherwise grow without bound in
 * a long-lived browser profile. Keep the newest `keep` entries for a prefix.
 */
export function pruneRecoverySnapshots(prefix: string, keep: number): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => !!key && key.startsWith(prefix))
      .sort();
    keys.slice(0, Math.max(0, keys.length - keep)).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // Pruning is housekeeping; never let it break an import or load.
  }
}

/**
 * Destructive operation. Callers must confirm with the user and should offer an
 * export first. Removes every DailyLingo key, including recovery snapshots.
 */
export function clearAllUserData(): boolean {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => !!key && key.startsWith('dailylingo_'));
    keys.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Failed to clear user data', error);
    recordRecovery({ kind: 'blocked', key: 'dailylingo_all' });
    return false;
  }
}

export interface UserDataBackup {
  schemaVersion: 1;
  app: 'DailyLingo';
  exportedAt: string;
  stats: UserStats;
  words: SavedWord[];
  badges: Badge[];
  preferences: {
    soundMuted: boolean;
  };
}

export function createUserDataBackup(): UserDataBackup {
  return {
    schemaVersion: 1,
    app: 'DailyLingo',
    exportedAt: new Date().toISOString(),
    stats: loadUserStats(),
    words: loadSavedWords(),
    badges: loadBadges(),
    preferences: {
      soundMuted: localStorage.getItem(STORAGE_KEYS.soundMuted) === 'true',
    },
  };
}

export interface ImportResult {
  ok: boolean;
  message: string;
  stats?: UserStats;
  words?: SavedWord[];
  badges?: Badge[];
}

/**
 * Strict, add-only schema validation. Unknown top-level keys are ignored; data
 * is sanitized through the same loaders used by the app.
 */
export function importUserDataBackup(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'Tệp sao lưu không phải JSON hợp lệ.' };
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || parsed.app !== 'DailyLingo') {
    recordRecovery({ kind: 'invalid-backup', key: 'import' });
    return { ok: false, message: 'Tệp không đúng định dạng sao lưu DailyLingo phiên bản 1.' };
  }

  if (!isRecord(parsed.stats) || !Array.isArray(parsed.words) || !Array.isArray(parsed.badges)) {
    recordRecovery({ kind: 'invalid-backup', key: 'import' });
    return { ok: false, message: 'Tệp sao lưu thiếu dữ liệu bắt buộc.' };
  }

  const words = parsed.words
    .map((item, index) => sanitizeSavedWord(item, index))
    .filter((item): item is SavedWord => item !== null);
  const badges = parsed.badges
    .map((item, index) => sanitizeBadge(item, index))
    .filter((item): item is Badge => item !== null);

  if (parsed.words.length > 0 && words.length === 0) {
    recordRecovery({ kind: 'invalid-backup', key: 'import' });
    return { ok: false, message: 'Danh sách từ vựng trong tệp không hợp lệ.' };
  }
  if (parsed.badges.length > 0 && badges.length === 0) {
    recordRecovery({ kind: 'invalid-backup', key: 'import' });
    return { ok: false, message: 'Danh sách huy hiệu trong tệp không hợp lệ.' };
  }

  const stats = sanitizeUserStats(parsed.stats);
  const soundMuted =
    isRecord(parsed.preferences) && parsed.preferences.soundMuted === true;

  // Capture the raw values so a partial write can be rolled back and a mistaken
  // import can be inspected later. A sanitized "view" would lose the byte-level
  // truth of what the browser actually held.
  const targetKeys = [
    STORAGE_KEYS.stats,
    STORAGE_KEYS.words,
    STORAGE_KEYS.badges,
    STORAGE_KEYS.soundMuted,
  ];
  const beforeImport = new Map<string, string | null>();
  targetKeys.forEach((key) => {
    try {
      beforeImport.set(key, localStorage.getItem(key));
    } catch {
      beforeImport.set(key, null);
    }
  });

  try {
    const rawSnapshot: Record<string, string | null> = {};
    beforeImport.forEach((value, key) => {
      rawSnapshot[key] = value;
    });
    localStorage.setItem(
      `${PRE_IMPORT_PREFIX}${Date.now()}`,
      JSON.stringify({
        kind: 'pre-import-raw',
        capturedAt: new Date().toISOString(),
        raw: rawSnapshot,
      })
    );
    pruneRecoverySnapshots(PRE_IMPORT_PREFIX, 3);
  } catch {
    // A quota/blocked failure must not prevent a small import from being validated.
  }

  const writeSucceeded =
    saveUserStats(stats) &&
    saveSavedWords(words) &&
    saveBadges(badges) &&
    setRaw(STORAGE_KEYS.soundMuted, String(soundMuted));

  if (!writeSucceeded) {
    // Import is all-or-nothing: put the previous bytes back rather than leaving
    // stats from the file next to words from the old profile.
    beforeImport.forEach((value, key) => {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        // Best effort: the original failure means storage is already unhealthy.
      }
    });
    recordRecovery({ kind: 'quota', key: 'import' });
    return {
      ok: false,
      message:
        'Không thể ghi bản sao lưu vào bộ nhớ trình duyệt. Dữ liệu trước khi nhập vẫn được giữ nguyên.',
    };
  }

  return {
    ok: true,
    message: `Đã khôi phục ${words.length} từ vựng và ${badges.length} huy hiệu.`,
    stats,
    words,
    badges,
  };
}

export function getStorageUsageBytes(): number {
  try {
    let total = 0;
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith('dailylingo_')) continue;
      total += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
    return total * 2; // UTF-16 code units to bytes (approximate)
  } catch {
    return 0;
  }
}
