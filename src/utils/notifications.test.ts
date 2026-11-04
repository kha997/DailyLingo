import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserStats } from '../types/index.ts';
import { INITIAL_USER_STATS } from './storage.ts';
import {
  checkAndTriggerDailyReminder,
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  sendStudyNotification,
} from './notifications.ts';

type FakeNotificationInstance = {
  title: string;
  options?: NotificationOptions;
  onclick: (() => void) | null;
  close: () => void;
};

class FakeNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn(async (): Promise<NotificationPermission> => 'granted');
  static instances: FakeNotificationInstance[] = [];

  onclick: (() => void) | null = null;
  close = vi.fn();

  constructor(
    public title: string,
    public options?: NotificationOptions
  ) {
    FakeNotification.instances.push(this);
  }
}

const originalNotification = (globalThis as { Notification?: unknown }).Notification;

const installNotification = (permission: NotificationPermission = 'granted') => {
  FakeNotification.permission = permission;
  FakeNotification.instances = [];
  FakeNotification.requestPermission.mockClear();
  vi.stubGlobal('Notification', FakeNotification);
};

const removeNotification = () => {
  if (originalNotification === undefined) {
    delete (globalThis as { Notification?: unknown }).Notification;
  } else {
    vi.stubGlobal('Notification', originalNotification);
  }
};

const makeStats = (overrides: Partial<UserStats> = {}): UserStats => ({
  ...INITIAL_USER_STATS,
  ...overrides,
});

beforeEach(() => {
  installNotification('granted');
});

afterEach(() => {
  vi.useRealTimers();
  removeNotification();
});

describe('notification support detection', () => {
  it('reports support when the API exists', () => {
    expect(isNotificationSupported()).toBe(true);
    expect(getNotificationPermission()).toBe('granted');
  });

  it('reports unsupported when the API is absent', () => {
    removeNotification();
    expect(isNotificationSupported()).toBe(false);
    expect(getNotificationPermission()).toBe('unsupported');
    expect(sendStudyNotification('x')).toBe(false);
  });

  it('returns unsupported from requestPermission when the API is absent', async () => {
    removeNotification();
    await expect(requestNotificationPermission()).resolves.toBe('unsupported');
  });

  it('returns the browser permission after a successful request', async () => {
    await expect(requestNotificationPermission()).resolves.toBe('granted');
    expect(FakeNotification.requestPermission).toHaveBeenCalledOnce();
  });
});

describe('sendStudyNotification', () => {
  it('does not send without granted permission', () => {
    installNotification('denied');
    expect(sendStudyNotification('hello')).toBe(false);
    expect(FakeNotification.instances).toHaveLength(0);
  });

  it('sends with a default body and tag when granted', () => {
    expect(sendStudyNotification('hello')).toBe(true);
    expect(FakeNotification.instances).toHaveLength(1);
    expect(FakeNotification.instances[0].title).toBe('hello');
    expect(FakeNotification.instances[0].options?.body).toContain('5 phút');
    expect(FakeNotification.instances[0].options?.tag).toBe('daily-study-reminder');
  });

  it('focuses the window and closes the notification on click', () => {
    const focus = vi.spyOn(window, 'focus').mockImplementation(() => {});
    sendStudyNotification('hello');
    const instance = FakeNotification.instances[0];
    instance.onclick?.();
    expect(focus).toHaveBeenCalled();
    expect(instance.close).toHaveBeenCalled();
    focus.mockRestore();
  });

  it('returns false when the constructor throws', () => {
    vi.stubGlobal(
      'Notification',
      class {
        static permission = 'granted';
        constructor() {
          throw new Error('blocked');
        }
      }
    );
    expect(sendStudyNotification('hello')).toBe(false);
  });
});

describe('checkAndTriggerDailyReminder', () => {
  const setClock = (hour: number, minute: number) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 10, hour, minute, 0));
  };

  it('does nothing when reminders are disabled', () => {
    setClock(21, 0);
    const onSent = vi.fn();
    expect(checkAndTriggerDailyReminder(makeStats({ reminderEnabled: false }), onSent)).toBe(false);
    expect(onSent).not.toHaveBeenCalled();
  });

  it('does nothing when notifications are not granted', () => {
    setClock(21, 0);
    installNotification('default');
    const onSent = vi.fn();
    expect(checkAndTriggerDailyReminder(makeStats({ reminderEnabled: true }), onSent)).toBe(false);
    expect(onSent).not.toHaveBeenCalled();
  });

  it('does not send before the configured time', () => {
    setClock(19, 59);
    const onSent = vi.fn();
    expect(
      checkAndTriggerDailyReminder(
        makeStats({ reminderEnabled: true, reminderTime: '20:00' }),
        onSent
      )
    ).toBe(false);
    expect(onSent).not.toHaveBeenCalled();
  });

  it('sends at or after the configured time and records the date', () => {
    setClock(20, 0);
    const onSent = vi.fn();
    expect(
      checkAndTriggerDailyReminder(
        makeStats({ reminderEnabled: true, reminderTime: '20:00', currentStreak: 4 }),
        onSent
      )
    ).toBe(true);
    expect(onSent).toHaveBeenCalledWith('2026-05-10');
    expect(FakeNotification.instances[0].options?.body).toContain('chuỗi 4 ngày');
  });

  it('does not send twice on the same day', () => {
    setClock(21, 0);
    const onSent = vi.fn();
    expect(
      checkAndTriggerDailyReminder(
        makeStats({
          reminderEnabled: true,
          reminderTime: '20:00',
          lastReminderSentDate: '2026-05-10',
        }),
        onSent
      )
    ).toBe(false);
    expect(onSent).not.toHaveBeenCalled();
  });

  it('does not send once the daily exercise goal is met', () => {
    setClock(21, 0);
    const onSent = vi.fn();
    expect(
      checkAndTriggerDailyReminder(
        makeStats({
          reminderEnabled: true,
          reminderTime: '20:00',
          studyDays: ['2026-05-10'],
          todayExercisesDone: 5,
          dailyGoal: 5,
        }),
        onSent
      )
    ).toBe(false);
    expect(onSent).not.toHaveBeenCalled();
  });

  it('still reminds a learner who studied but has not met the goal', () => {
    setClock(21, 0);
    const onSent = vi.fn();
    expect(
      checkAndTriggerDailyReminder(
        makeStats({
          reminderEnabled: true,
          reminderTime: '20:00',
          studyDays: ['2026-05-10'],
          todayExercisesDone: 2,
          dailyGoal: 5,
        }),
        onSent
      )
    ).toBe(true);
  });
});
