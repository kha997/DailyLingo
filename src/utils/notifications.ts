import { UserStats } from '../types/index.ts';
import { soundFX } from './speech.ts';

export type NotificationSupportStatus = 'supported' | 'unsupported';
export type NotificationPermissionState = NotificationPermission | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

export function sendStudyNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
  }
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options?.body || 'Dành 5 phút luyện tập tiếng Anh tương tác hôm nay nhé!',
      icon: options?.icon || '/favicon.ico',
      tag: options?.tag || 'daily-study-reminder',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Play a cheerful chime sound
    soundFX.playCorrect();

    return true;
  } catch (err) {
    console.error('Failed to show notification:', err);
    return false;
  }
}

/**
 * Checks if a daily reminder should be triggered right now based on user settings.
 * Returns true if notification was sent.
 */
export function checkAndTriggerDailyReminder(
  userStats: UserStats,
  onSent: (todayDate: string) => void
): boolean {
  if (!userStats.reminderEnabled) return false;
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  // Already sent today
  if (userStats.lastReminderSentDate === todayDateStr) {
    return false;
  }

  // Already studied today
  if (userStats.studyDays && userStats.studyDays.includes(todayDateStr) && userStats.todayExercisesDone >= (userStats.dailyGoal || 5)) {
    return false;
  }

  const reminderTime = userStats.reminderTime || '20:00';
  const [targetHour, targetMinute] = reminderTime.split(':').map(Number);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Trigger if current time is equal to or past target time
  if (
    currentHour > targetHour ||
    (currentHour === targetHour && currentMinute >= targetMinute)
  ) {
    const streak = userStats.currentStreak || 0;
    const streakMsg = streak > 0 ? ` Duy trì chuỗi ${streak} ngày liên tiếp!` : '';

    const sent = sendStudyNotification('DailyLingo - Đã đến giờ học tiếng Anh! 📚', {
      body: `Hôm nay bạn còn bài tập chưa hoàn thành.${streakMsg} Dành 5 phút tương tác nhé!`,
      tag: `daily-reminder-${todayDateStr}`,
    });

    if (sent) {
      onSent(todayDateStr);
      return true;
    }
  }

  return false;
}
