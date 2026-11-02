import {
  getStorageRecoveryEvents,
  getStorageUsageBytes,
  loadBadges,
  loadSavedWords,
  loadUserStats,
} from './storage.ts';
import { isSpeechRecognitionSupported } from './speech.ts';
import { getNotificationPermission, isNotificationSupported } from './notifications.ts';

/**
 * Local-only diagnostics. These values describe the device and the shape of the
 * stored data, never the learner's content (no saved words, no typed answers,
 * no audio, no free-text feedback). Nothing is uploaded automatically; the
 * learner has to copy or download the report themselves.
 */
export const DIAGNOSTICS_SCHEMA = 1;
export const USER_DATA_SCHEMA = 1;

export interface DiagnosticsReport {
  app: 'DailyLingo';
  reportSchema: number;
  userDataSchema: number;
  generatedAt: string;
  browser: {
    userAgent: string;
    language: string;
    viewport: string;
    devicePixelRatio: number;
    online: boolean;
  };
  capabilities: {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    notifications: boolean;
    notificationPermission: string;
  };
  storage: {
    available: boolean;
    usageBytes: number;
    savedWords: number;
    unlockedBadges: number;
    hasStudyHistory: boolean;
    recoveryEvents: number;
  };
  build: {
    mode: string;
    production: boolean;
    baseUrl: string;
  };
  privacy: {
    includesSavedWordText: false;
    includesTypedAnswers: false;
    includesAudio: false;
    automaticallyUploaded: false;
  };
}

export interface LocalStorageCheck {
  available: boolean;
  detail: string;
}

/** Probe localStorage without keeping the probe key behind. */
export function checkLocalStorage(): LocalStorageCheck {
  try {
    const probeKey = 'dailylingo_probe';
    localStorage.setItem(probeKey, '1');
    localStorage.removeItem(probeKey);
    return { available: true, detail: 'Bộ nhớ cục bộ đang hoạt động.' };
  } catch {
    return {
      available: false,
      detail: 'Bộ nhớ cục bộ bị chặn hoặc đã đầy. Tiến độ có thể không được lưu.',
    };
  }
}

export function buildDiagnosticsReport(): DiagnosticsReport {
  const stats = loadUserStats();
  const words = loadSavedWords();
  const badges = loadBadges();
  const storageCheck = checkLocalStorage();
  const hasWindow = typeof window !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';

  return {
    app: 'DailyLingo',
    reportSchema: DIAGNOSTICS_SCHEMA,
    userDataSchema: USER_DATA_SCHEMA,
    generatedAt: new Date().toISOString(),
    browser: {
      userAgent: hasNavigator ? navigator.userAgent : 'unknown',
      language: hasNavigator ? navigator.language : 'unknown',
      viewport: hasWindow ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      devicePixelRatio: hasWindow ? window.devicePixelRatio : 1,
      online: hasNavigator ? navigator.onLine : false,
    },
    capabilities: {
      speechRecognition: isSpeechRecognitionSupported(),
      speechSynthesis: hasWindow && 'speechSynthesis' in window,
      notifications: isNotificationSupported(),
      notificationPermission: getNotificationPermission(),
    },
    storage: {
      available: storageCheck.available,
      usageBytes: getStorageUsageBytes(),
      savedWords: words.length,
      unlockedBadges: badges.filter((badge) => badge.unlockedAt !== null).length,
      hasStudyHistory: stats.studyDays.length > 0 || stats.totalExercisesCompleted > 0,
      recoveryEvents: getStorageRecoveryEvents().length,
    },
    build: {
      mode: import.meta.env.MODE,
      production: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL,
    },
    privacy: {
      includesSavedWordText: false,
      includesTypedAnswers: false,
      includesAudio: false,
      automaticallyUploaded: false,
    },
  };
}

export function formatDiagnosticsReport(report: DiagnosticsReport): string {
  return JSON.stringify(report, null, 2);
}

/** Copy helper with a fallback for browsers that block the async clipboard. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path.
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied =
      typeof document.execCommand === 'function' && document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}
