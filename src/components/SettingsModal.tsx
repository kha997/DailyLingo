import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  RotateCcw,
  Check,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  AlertTriangle,
  Bell,
  BellOff,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Zap,
  Target
} from 'lucide-react';
import { UserStats } from '../types/index.ts';
import { speakEnglish, soundFX } from '../utils/speech.ts';
import { playPopSound, playTadaSound, playDingSound } from '../utils/audioEffects.ts';
import { applyTheme, AppTheme } from '../utils/theme.ts';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendStudyNotification,
  NotificationPermissionState
} from '../utils/notifications.ts';

interface SettingsModalProps {
  userStats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  userStats,
  onUpdateStats,
  onResetProgress,
  onClose,
}) => {
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>(userStats.audioAccent || 'en-US');
  const [rate, setRate] = useState<number>(userStats.audioRate || 0.95);
  const [dailyGoal, setDailyGoal] = useState<number>(userStats.dailyGoal || 5);
  const [dailyXpGoal, setDailyXpGoal] = useState<number>(userStats.dailyXpGoal || 50);
  const [theme, setTheme] = useState<AppTheme>(userStats.theme || 'light');
  
  // Daily Study Reminder States
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(userStats.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState<string>(userStats.reminderTime || '20:00');
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(getNotificationPermission());
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Sync current browser notification permission
  useEffect(() => {
    setPermissionState(getNotificationPermission());
  }, []);

  const handleThemeChange = (newTheme: AppTheme) => {
    soundFX.playClick();
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleTestVoice = () => {
    soundFX.playClick();
    speakEnglish('Hello! Welcome to DailyLingo. Daily consistent practice makes perfect!', {
      rate,
      accent,
    });
  };

  const handleToggleReminder = async () => {
    soundFX.playClick();
    setTestNotificationFeedback(null);

    if (!reminderEnabled) {
      // Trying to enable
      if (!isNotificationSupported()) {
        alert('Trình duyệt của bạn hiện không hỗ trợ Notification API.');
        return;
      }

      let currentPerm = getNotificationPermission();
      if (currentPerm !== 'granted') {
        currentPerm = await requestNotificationPermission();
        setPermissionState(currentPerm);
      }

      if (currentPerm === 'granted') {
        setReminderEnabled(true);
        // Fire a short confirmation notification
        sendStudyNotification('DailyLingo - Đã bật nhắc nhở hàng ngày! 🎉', {
          body: `Chúng tôi sẽ nhắc bạn học tiếng Anh mỗi ngày vào lúc ${reminderTime}.`,
        });
      } else if (currentPerm === 'denied') {
        setReminderEnabled(false);
      } else {
        setReminderEnabled(false);
      }
    } else {
      // Turning off
      setReminderEnabled(false);
    }
  };

  const handleTestNotification = async () => {
    soundFX.playClick();
    setTestNotificationFeedback(null);

    let perm = getNotificationPermission();
    if (perm !== 'granted') {
      perm = await requestNotificationPermission();
      setPermissionState(perm);
    }

    if (perm === 'granted') {
      const sent = sendStudyNotification('DailyLingo - Nhắc nhở mẫu! 🔔', {
        body: `Thử nghiệm thành công! Bạn sẽ nhận được thông báo học tập vào lúc ${reminderTime} mỗi ngày.`,
      });

      if (sent) {
        setTestNotificationFeedback('Đã gửi thông báo mẫu đến hệ thống của bạn!');
      } else {
        setTestNotificationFeedback('Không thể kích hoạt thông báo trên trình duyệt này.');
      }
    } else if (perm === 'denied') {
      setTestNotificationFeedback('Quyền thông báo đang bị chặn. Vui lòng cho phép thông báo trong cài đặt trình duyệt.');
    } else {
      setTestNotificationFeedback('Chưa cấp quyền thông báo.');
    }

    setTimeout(() => {
      setTestNotificationFeedback(null);
    }, 4500);
  };

  const handleSave = () => {
    soundFX.playCorrect();
    applyTheme(theme);
    const validXpGoal = Math.max(10, Math.min(1000, Number(dailyXpGoal) || 50));
    onUpdateStats({
      audioAccent: accent,
      audioRate: rate,
      dailyGoal,
      dailyXpGoal: validXpGoal,
      theme,
      reminderEnabled,
      reminderTime,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleConfirmReset = () => {
    soundFX.playWrong();
    onResetProgress();
    setShowConfirmReset(false);
    onClose();
  };

  const TIME_PRESETS = [
    { label: '08:00', hint: 'Buổi sáng' },
    { label: '12:30', hint: 'Nghỉ trưa' },
    { label: '19:30', hint: 'Sau bữa tối' },
    { label: '21:00', hint: 'Trước khi ngủ' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
          <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
            Cài Đặt Ứng Dụng
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Đóng cài đặt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* 1. Theme Mode Selector (Dark Mode / Light Mode / System) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              Giao diện hiển thị (Theme)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>Sáng</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400 fill-indigo-400' : 'text-slate-400'}`} />
                <span>Tối (Dark)</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                  theme === 'system'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Laptop className={`w-4 h-4 ${theme === 'system' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Hệ thống</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {theme === 'dark' && '🌙 Giao diện tối bảo vệ mắt khi học ban đêm.'}
              {theme === 'light' && '☀️ Giao diện sáng rõ ràng, độ tương phản cao.'}
              {theme === 'system' && '💻 Tự động chuyển theo cài đặt sáng/tối của thiết bị.'}
            </p>
          </div>

          {/* 2. Daily Study Reminders (Notification API) */}
          <div className="bg-slate-50 dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  reminderEnabled
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {reminderEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer" onClick={handleToggleReminder}>
                    Nhắc nhở học tập hàng ngày
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Báo chuông nhắc nhở qua trình duyệt (Notification API)
                  </p>
                </div>
              </div>

              {/* Toggle switch button */}
              <button
                type="button"
                role="switch"
                aria-checked={reminderEnabled}
                onClick={handleToggleReminder}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  reminderEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Permission feedback badge */}
            <div className="text-[11px]">
              {permissionState === 'granted' && (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Quyền thông báo đã được cấp phép sẵn sàng.</span>
                </div>
              )}
              {permissionState === 'denied' && (
                <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60 leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Thông báo đang bị chặn trong trình duyệt. Vui lòng bấm vào biểu tượng cài đặt/ổ khóa trang web để bật quyền &quot;Thông báo&quot;.</span>
                </div>
              )}
              {permissionState === 'default' && reminderEnabled && (
                <div className="text-slate-500 dark:text-slate-400">
                  Cần sự cho phép của bạn trên hộp thoại trình duyệt khi gửi thông báo.
                </div>
              )}
            </div>

            {/* Preferred Reminder Time Configuration */}
            {reminderEnabled && (
              <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Giờ nhắc nhở ưa thích:</span>
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Quick Time Presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setReminderTime(preset.label)}
                      className={`py-1 px-1.5 rounded-lg border text-[11px] font-mono text-center transition-all ${
                        reminderTime === preset.label
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span className="block font-bold">{preset.label}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">{preset.hint}</span>
                    </button>
                  ))}
                </div>

                {/* Test Notification Trigger */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Thử Gửi Thông Báo Mẫu</span>
                  </button>

                  {testNotificationFeedback && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 text-center mt-1.5 animate-in fade-in">
                      {testNotificationFeedback}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Accent choice */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              Giọng phát âm chuẩn (Text-to-Speech)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccent('en-US')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  accent === 'en-US'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>🇺🇸 Anh - Mỹ (US)</span>
              </button>

              <button
                type="button"
                onClick={() => setAccent('en-GB')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  accent === 'en-GB'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>🇬🇧 Anh - Anh (UK)</span>
              </button>
            </div>
          </div>

          {/* 4. Speech Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Tốc độ phát âm:
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {rate}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.1"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              <span>0.7x (Chậm rõ)</span>
              <span>0.95x (Tự nhiên)</span>
              <span>1.1x (Nhanh)</span>
            </div>
          </div>

          {/* Test Voice & Audio Effects Preview */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleTestVoice}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Thử Giọng Đọc Mẫu (TTS)</span>
            </button>

            {/* Sound Effects Preview */}
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                🎵 Thử hiệu ứng âm thanh (Web Audio API):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => playPopSound()}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 active:scale-95"
                  title="Âm thanh khi trả lời đúng (Pop)"
                >
                  <span>🫧 Pop</span>
                </button>
                <button
                  type="button"
                  onClick={() => playTadaSound()}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 active:scale-95"
                  title="Âm thanh khi hoàn thành bài học (Ta-da!)"
                >
                  <span>🎺 Ta-da!</span>
                </button>
                <button
                  type="button"
                  onClick={() => playDingSound()}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 active:scale-95"
                  title="Âm thanh chuông khi đạt mục tiêu ngày (Ding!)"
                >
                  <span>🔔 Ding!</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Daily XP Goal Setting (Mục tiêu XP mỗi ngày) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Zap className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <label htmlFor="daily-xp-goal-input" className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer">
                    Mục tiêu XP mỗi ngày (Daily XP Goal)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Điểm kinh nghiệm bạn muốn chinh phục mỗi ngày
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 px-2.5 py-1 rounded-lg tabular-nums">
                ⚡ {dailyXpGoal} XP
              </span>
            </div>

            {/* Input field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="daily-xp-goal-input" className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Nhập số XP tùy chỉnh:
              </label>
              <div className="relative">
                <input
                  id="daily-xp-goal-input"
                  type="number"
                  min="10"
                  max="1000"
                  step="5"
                  value={dailyXpGoal || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setDailyXpGoal(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-2xs"
                  placeholder="Ví dụ: 50"
                />
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  XP / ngày
                </span>
              </div>
            </div>

            {/* Quick preset chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                Hoặc chọn nhanh mức mục tiêu phổ biến:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[20, 30, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setDailyXpGoal(preset);
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-xs font-mono text-center transition-all ${
                      dailyXpGoal === preset
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold shadow-2xs ring-1 ring-amber-500/30'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-bold">{preset} XP</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">
                      {preset <= 20 ? 'Khởi động' : preset <= 30 ? 'Cơ bản' : preset <= 50 ? 'Chuẩn' : 'Bứt phá'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Daily Target Exercises */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              Mục tiêu bài tập mỗi ngày:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setDailyGoal(target)}
                  className={`py-2 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    dailyGoal === target
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {target} bài
                </button>
              ))}
            </div>
          </div>

          {/* 6. Reset progress */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {!showConfirmReset ? (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại toàn bộ tiến độ</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Xác nhận xóa tiến độ học tập và XP?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs"
                  >
                    Đồng ý đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>Lưu Cài Đặt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
