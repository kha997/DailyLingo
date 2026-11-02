import React, { useMemo, useRef, useState, useEffect } from 'react';
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
  Download,
  Upload,
  ShieldCheck,
  HardDrive,
  Copy,
  MessageSquare,
  FileJson,
} from 'lucide-react';
import { UserStats, SavedWord, Badge } from '../types/index.ts';
import { speakEnglish, soundFX, isSpeechRecognitionSupported } from '../utils/speech.ts';
import { playPopSound, playTadaSound, playDingSound } from '../utils/audioEffects.ts';
import { applyTheme, AppTheme } from '../utils/theme.ts';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendStudyNotification,
  NotificationPermissionState,
} from '../utils/notifications.ts';
import {
  createUserDataBackup,
  importUserDataBackup,
  STORAGE_KEYS,
} from '../utils/storage.ts';
import { useDialogA11y } from '../utils/useDialogA11y.ts';
import {
  buildDiagnosticsReport,
  checkLocalStorage,
  copyTextToClipboard,
  formatDiagnosticsReport,
} from '../utils/diagnostics.ts';

interface ImportedData {
  stats: UserStats;
  words: SavedWord[];
  badges: Badge[];
}

interface SettingsModalProps {
  userStats: UserStats;
  savedWordsCount: number;
  storageUsageBytes: number;
  onUpdateStats: (updates: Partial<UserStats>) => void;
  onImportData: (data: ImportedData) => void;
  /** Returns false when storage could not be cleared; the UI must not claim success. */
  onResetAllData: () => boolean;
  onClose: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  userStats,
  savedWordsCount,
  storageUsageBytes,
  onUpdateStats,
  onImportData,
  onResetAllData,
  onClose,
}) => {
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>(userStats.audioAccent || 'en-US');
  const [rate, setRate] = useState<number>(userStats.audioRate || 0.95);
  const [dailyGoal, setDailyGoal] = useState<number>(userStats.dailyGoal || 5);
  const [dailyXpGoal, setDailyXpGoal] = useState<number>(userStats.dailyXpGoal || 50);
  const [theme, setTheme] = useState<AppTheme>(userStats.theme || 'light');

  // Daily study reminder
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(userStats.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState<string>(userStats.reminderTime || '20:00');
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(getNotificationPermission());
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [backupError, setBackupError] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [diagnosticsFeedback, setDiagnosticsFeedback] = useState<string | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialThemeRef = useRef<AppTheme>(userStats.theme ?? 'light');
  const themeSavedRef = useRef(false);

  useEffect(() => {
    setPermissionState(getNotificationPermission());
  }, []);

  const handleThemeChange = (newTheme: AppTheme) => {
    soundFX.playClick();
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Theme changes preview live. Closing without saving must not leave the app
  // in a theme the learner never committed.
  const handleClose = () => {
    if (!themeSavedRef.current) {
      applyTheme(initialThemeRef.current);
    }
    onClose();
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
      if (!isNotificationSupported()) {
        setTestNotificationFeedback(
          'Trình duyệt này không hỗ trợ Notification API. Nhắc nhở sẽ không hoạt động.'
        );
        return;
      }

      let currentPerm = getNotificationPermission();
      if (currentPerm !== 'granted') {
        currentPerm = await requestNotificationPermission();
        setPermissionState(currentPerm);
      }
      setReminderEnabled(currentPerm === 'granted');
    } else {
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
      const sent = sendStudyNotification('DailyLingo - Nhắc nhở mẫu!', {
        body: `Thử nghiệm thành công! Khi tab DailyLingo đang mở vào lúc ${reminderTime}, bạn sẽ nhận được nhắc nhở.`,
      });
      setTestNotificationFeedback(
        sent
          ? 'Đã gửi thông báo mẫu đến hệ thống của bạn!'
          : 'Không thể kích hoạt thông báo trên trình duyệt này.'
      );
    } else if (perm === 'denied') {
      setTestNotificationFeedback(
        'Quyền thông báo đang bị chặn. Vui lòng cho phép thông báo trong cài đặt trình duyệt.'
      );
    } else {
      setTestNotificationFeedback('Chưa cấp quyền thông báo.');
    }

    setTimeout(() => {
      setTestNotificationFeedback(null);
    }, 6000);
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
    themeSavedRef.current = true;
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleConfirmReset = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'XOA') return;
    soundFX.playWrong();
    setResetError(null);
    const cleared = onResetAllData();
    if (!cleared) {
      setResetError(
        'Không thể xóa dữ liệu trong trình duyệt này. Dữ liệu hiện tại vẫn còn. Hãy xuất bản sao lưu rồi thử lại, hoặc xóa dữ liệu trang trong cài đặt trình duyệt.'
      );
      return;
    }
    setShowConfirmReset(false);
    setResetConfirmText('');
  };

  const handleExport = () => {
    soundFX.playClick();
    try {
      const backup = createUserDataBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `dailylingo-backup-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBackupError(false);
      setBackupFeedback('Đã tạo tệp sao lưu. Hãy giữ tệp này ở nơi an toàn.');
    } catch {
      setBackupError(true);
      setBackupFeedback('Không thể tạo tệp sao lưu trên trình duyệt này.');
    }
  };

  const handleCopyDiagnostics = async () => {
    soundFX.playClick();
    const ok = await copyTextToClipboard(
      formatDiagnosticsReport(buildDiagnosticsReport())
    );
    setDiagnosticsError(!ok);
    setDiagnosticsFeedback(
      ok
        ? 'Đã sao chép chẩn đoán. Báo cáo không chứa từ vựng, câu trả lời hay âm thanh của bạn.'
        : 'Trình duyệt chặn sao chép. Hãy tải tệp chẩn đoán thay thế.'
    );
  };

  const handleDownloadDiagnostics = () => {
    soundFX.playClick();
    try {
      const report = buildDiagnosticsReport();
      const blob = new Blob([formatDiagnosticsReport(report)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `dailylingo-diagnostics-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDiagnosticsError(false);
      setDiagnosticsFeedback(
        'Đã tải tệp chẩn đoán cục bộ. Bạn là người quyết định có chia sẻ tệp này hay không.'
      );
    } catch {
      setDiagnosticsError(true);
      setDiagnosticsFeedback('Không thể tạo tệp chẩn đoán trên trình duyệt này.');
    }
  };

  const handleCopyFeedback = async () => {
    soundFX.playClick();
    const feedback = feedbackText.trim();
    if (!feedback) {
      setDiagnosticsError(true);
      setDiagnosticsFeedback('Hãy nhập nội dung góp ý trước khi sao chép.');
      return;
    }

    const payload = {
      app: 'DailyLingo',
      kind: 'beta-feedback',
      feedback,
      diagnostics: buildDiagnosticsReport(),
    };
    const ok = await copyTextToClipboard(JSON.stringify(payload, null, 2));
    setDiagnosticsError(!ok);
    setDiagnosticsFeedback(
      ok
        ? 'Đã sao chép góp ý kèm chẩn đoán. DailyLingo không tự gửi đi đâu; hãy dán nội dung vào kênh bạn tin tưởng.'
        : 'Trình duyệt chặn sao chép. Bạn có thể tự chép nội dung góp ý và tải tệp chẩn đoán.'
    );
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBackupFeedback(null);
    try {
      const text = await file.text();
      const result = importUserDataBackup(text);
      if (!result.ok || !result.stats || !result.words || !result.badges) {
        setBackupError(true);
        setBackupFeedback(result.message);
        return;
      }
      onImportData({
        stats: result.stats,
        words: result.words,
        badges: result.badges,
      });
      setBackupError(false);
      setBackupFeedback(result.message);
    } catch {
      setBackupError(true);
      setBackupFeedback('Không đọc được tệp sao lưu đã chọn.');
    }
  };

  useDialogA11y(dialogRef, handleClose);

  const localStorageStatus = useMemo(() => checkLocalStorage(), []);
  const diagnostics = useMemo(
    () => ({
      storage: localStorageStatus,
      usage: formatBytes(storageUsageBytes),
      savedWords: savedWordsCount,
      speechRecognition: isSpeechRecognitionSupported(),
      speechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
      notifications: isNotificationSupported(),
      notificationPermission: permissionState,
      schema: 'dailylingo v1',
    }),
    [localStorageStatus, storageUsageBytes, savedWordsCount, permissionState]
  );

  const TIME_PRESETS = [
    { label: '08:00', hint: 'Buổi sáng' },
    { label: '12:30', hint: 'Nghỉ trưa' },
    { label: '19:30', hint: 'Sau bữa tối' },
    { label: '21:00', hint: 'Trước khi ngủ' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors focus:outline-none"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
          <h3 id="settings-title" className="text-lg font-bold font-display text-slate-900 dark:text-white">
            Cài Đặt Ứng Dụng
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Đóng cài đặt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Theme */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              Giao diện hiển thị (Theme)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'light', label: 'Sáng', icon: Sun },
                { id: 'dark', label: 'Tối', icon: Moon },
                { id: 'system', label: 'Hệ thống', icon: Laptop },
              ] as const).map((option) => {
                const Icon = option.icon;
                const selected = theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleThemeChange(option.id)}
                    aria-pressed={selected}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${selected ? 'text-indigo-500' : 'text-slate-500'}`} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    reminderEnabled
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {reminderEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Nhắc nhở học tập hàng ngày
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chỉ hoạt động khi trang đang mở và đã cấp quyền thông báo
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={reminderEnabled}
                aria-label="Bật nhắc nhở học tập hàng ngày"
                onClick={handleToggleReminder}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
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

            <div className="text-[11px]">
              {permissionState === 'granted' && (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Quyền thông báo đã được cấp.</span>
                </div>
              )}
              {permissionState === 'denied' && (
                <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60 leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Thông báo đang bị chặn. Mở cài đặt trang web trong trình duyệt để bật quyền
                    &quot;Thông báo&quot;.
                  </span>
                </div>
              )}
              {permissionState === 'unsupported' && (
                <div className="text-amber-700 dark:text-amber-400">
                  Trình duyệt này không hỗ trợ Notification API.
                </div>
              )}
            </div>

            {reminderEnabled && (
              <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="reminder-time"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Giờ nhắc nhở:</span>
                  </label>
                  <input
                    id="reminder-time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setReminderTime(preset.label)}
                      className={`py-1 px-1.5 rounded-lg border text-[11px] font-mono text-center transition-all ${
                        reminderTime === preset.label
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="block font-bold">{preset.label}</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">
                        {preset.hint}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Thử Gửi Thông Báo Mẫu</span>
                </button>

                {testNotificationFeedback && (
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 text-center">
                    {testNotificationFeedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Accent */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              Giọng phát âm (Text-to-Speech)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'en-US', label: 'Anh - Mỹ (US)' },
                { id: 'en-GB', label: 'Anh - Anh (UK)' },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccent(option.id)}
                  aria-pressed={accent === option.id}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    accent === option.id
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speech rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="speech-rate" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Tốc độ phát âm:
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {rate.toFixed(2)}x
              </span>
            </div>
            <input
              id="speech-rate"
              type="range"
              min="0.7"
              max="1.1"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              <span>0.7x chậm rõ</span>
              <span>0.95x tự nhiên</span>
              <span>1.1x nhanh</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleTestVoice}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200/60 dark:border-slate-700/60"
            >
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Thử Giọng Đọc Mẫu (TTS)</span>
            </button>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Thử hiệu ứng âm thanh (Web Audio API):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => playPopSound()}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-2xs"
                >
                  Pop
                </button>
                <button
                  type="button"
                  onClick={() => playTadaSound()}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-2xs"
                >
                  Ta-da
                </button>
                <button
                  type="button"
                  onClick={() => playDingSound()}
                  className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 transition-all shadow-2xs"
                >
                  Ding
                </button>
              </div>
            </div>
          </div>

          {/* XP goal */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Zap className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <label
                    htmlFor="daily-xp-goal-input"
                    className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer"
                  >
                    Mục tiêu XP mỗi ngày
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    XP chỉ cộng từ câu trả lời đúng trong bài đã chấm điểm
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 px-2.5 py-1 rounded-lg tabular-nums">
                {dailyXpGoal} XP
              </span>
            </div>

            <div className="relative">
              <label htmlFor="daily-xp-goal-input" className="sr-only">
                Số XP mục tiêu mỗi ngày
              </label>
              <input
                id="daily-xp-goal-input"
                type="number"
                min="10"
                max="1000"
                step="5"
                value={dailyXpGoal || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                  setDailyXpGoal(Number.isNaN(val) ? 0 : Math.max(0, val));
                }}
                className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-2xs"
                placeholder="Ví dụ: 50"
              />
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[20, 30, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setDailyXpGoal(preset);
                  }}
                  aria-pressed={dailyXpGoal === preset}
                  className={`py-2 px-1.5 rounded-xl border text-xs font-mono text-center transition-all ${
                    dailyXpGoal === preset
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold shadow-2xs ring-1 ring-amber-500/30'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset} XP
                </button>
              ))}
            </div>
          </div>

          {/* Daily target exercises */}
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              Mục tiêu bài tập mỗi ngày:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setDailyGoal(target)}
                  aria-pressed={dailyGoal === target}
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

          {/* Backup & data */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Sao lưu &amp; khôi phục dữ liệu
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Toàn bộ tiến độ chỉ nằm trên thiết bị này. Hãy xuất tệp sao lưu trước khi xóa dữ liệu
              trình duyệt hoặc đổi thiết bị.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất tệp sao lưu
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Nhập từ tệp sao lưu
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleImportFile}
            />

            {backupFeedback && (
              <p
                role="status"
                className={`mt-2 text-[11px] font-medium ${
                  backupError
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {backupFeedback}
              </p>
            )}

            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Đang dùng {formatBytes(storageUsageBytes)} bộ nhớ cục bộ cho {savedWordsCount} từ đã lưu.
            </p>
          </div>

          {/* Diagnostics */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDiagnostics((open) => !open)}
              aria-expanded={showDiagnostics}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <HardDrive className="w-3.5 h-3.5" />
              {showDiagnostics ? 'Ẩn chẩn đoán cục bộ' : 'Xem chẩn đoán cục bộ'}
            </button>

            {showDiagnostics && (
              <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 p-3">
                <dl className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex justify-between gap-3">
                  <dt>Bộ nhớ cục bộ</dt>
                  <dd className="text-right font-medium">
                    {diagnostics.storage.available ? 'hoạt động' : 'bị chặn/đầy'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Dung lượng DailyLingo</dt>
                  <dd className="text-right font-medium">{diagnostics.usage}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Từ đã lưu</dt>
                  <dd className="text-right font-medium">{diagnostics.savedWords}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Nhận giọng nói</dt>
                  <dd className="text-right font-medium">
                    {diagnostics.speechRecognition ? 'hỗ trợ' : 'không hỗ trợ'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Đọc văn bản (TTS)</dt>
                  <dd className="text-right font-medium">
                    {diagnostics.speechSynthesis ? 'hỗ trợ' : 'không hỗ trợ'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Thông báo</dt>
                  <dd className="text-right font-medium">
                    {diagnostics.notifications
                      ? `hỗ trợ (${diagnostics.notificationPermission})`
                      : 'không hỗ trợ'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Định dạng dữ liệu</dt>
                  <dd className="text-right font-medium">{diagnostics.schema}</dd>
                </div>
                </dl>

                <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  Chẩn đoán chỉ nằm trên thiết bị: không có từ vựng, câu trả lời, âm thanh hay
                  mã định danh cá nhân. Không có gì được tự động gửi đi.
                  {!diagnostics.storage.available && ` ${diagnostics.storage.detail}`}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyDiagnostics}
                    className="py-2 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép chẩn đoán
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDiagnostics}
                    className="py-2 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    Tải tệp chẩn đoán
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <label
                    htmlFor="beta-feedback"
                    className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Góp ý cho bản Beta (không bắt buộc)
                  </label>
                  <textarea
                    id="beta-feedback"
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Điều gì rõ ràng, điều gì còn khó hiểu?"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-[11px] text-slate-700 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleCopyFeedback}
                    className="mt-1.5 w-full py-2 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Sao chép góp ý + chẩn đoán
                  </button>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    DailyLingo không có máy chủ nhận góp ý. Nút này chỉ sao chép vào bộ nhớ tạm để
                    bạn tự kiểm tra và gửi qua kênh bạn chọn.
                  </p>
                </div>

                {diagnosticsFeedback && (
                  <p
                    role="status"
                    className={`mt-2 text-[11px] font-medium ${
                      diagnosticsError
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {diagnosticsFeedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Reset all data */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {!showConfirmReset ? (
              <button
                type="button"
                onClick={() => {
                  setResetError(null);
                  setShowConfirmReset(true);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại toàn bộ dữ liệu</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-2">
                <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Xóa vĩnh viễn XP, chuỗi ngày học, từ vựng, huy hiệu và bản sao lưu trên trình
                    duyệt này. Không thể hoàn tác.
                  </span>
                </div>
                <label htmlFor="reset-confirm" className="text-[11px] text-rose-700 dark:text-rose-300">
                  Nhập <strong>XOA</strong> để xác nhận:
                </label>
                <input
                  id="reset-confirm"
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  autoComplete="off"
                  className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    disabled={resetConfirmText.trim().toUpperCase() !== 'XOA'}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-2xs"
                  >
                    Đồng ý xóa tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmReset(false);
                      setResetConfirmText('');
                      setResetError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    Hủy
                  </button>
                </div>
                {resetError && (
                  <p role="alert" className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed">
                    {resetError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
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
