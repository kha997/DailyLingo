/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { TopNav } from './components/TopNav.tsx';
import { DailyHeroSection } from './components/DailyHeroSection.tsx';
import { LessonCatalog } from './components/LessonCatalog.tsx';
import { QuickPractice } from './components/QuickPractice.tsx';
import { VocabularyNotebook } from './components/VocabularyNotebook.tsx';
import { ExerciseRunner } from './components/ExerciseRunner.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { StreakDetailsModal } from './components/StreakDetailsModal.tsx';
import { CustomPracticeModal } from './components/CustomPracticeModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

import { ExerciseItem, LessonUnit, SavedWord, UserStats, Badge, SessionResult } from './types/index.ts';
import { computeNextReviewDate } from './data/curriculumData.ts';
import {
  DEFAULT_BADGES,
  LESSON_UNITS,
  getDailyChallengeExercises,
} from './data/curriculumData.ts';
import {
  loadUserStats,
  saveUserStats,
  loadSavedWords,
  saveSavedWords,
  loadBadges,
  saveBadges,
  getTodayDateString,
  getYesterdayDateString,
  consumeStorageRecoveryNotice,
  clearAllUserData,
  getStorageUsageBytes,
  INITIAL_USER_STATS,
} from './utils/storage.ts';
import {
  applySessionResult,
  applyWordMasteryToggle,
  applyWordReview,
  updateBadgeProgress,
} from './utils/progress.ts';
import { applyTheme, AppTheme, getSystemTheme } from './utils/theme.ts';
import { checkAndTriggerDailyReminder } from './utils/notifications.ts';

// `recharts` is only needed on the analytics tab. Keeping it in a lazy chunk
// removes roughly two thirds of the initial JavaScript payload.
const ProgressAnalytics = lazy(() =>
  import('./components/ProgressAnalytics.tsx').then((module) => ({
    default: module.ProgressAnalytics,
  }))
);

const AnalyticsSkeleton = () => (
  <div
    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400"
    role="status"
    aria-live="polite"
  >
    Đang tải phần thống kê…
  </div>
);

const cloneBadges = (): Badge[] => DEFAULT_BADGES.map((badge) => ({ ...badge }));

export default function App() {
  const [activeTab, setActiveTab] = useState<'lessons' | 'practice' | 'notebook' | 'analytics'>('lessons');
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats);
  const [savedWords, setSavedWords] = useState<SavedWord[]>(loadSavedWords);
  const [badges, setBadges] = useState<Badge[]>(loadBadges);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [storageWriteFailed, setStorageWriteFailed] = useState(false);

  // Active Exercise Session State
  const [activeSession, setActiveSession] = useState<{
    title: string;
    exercises: ExerciseItem[];
  } | null>(null);

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCustomPracticeModal, setShowCustomPracticeModal] = useState(false);

  // Surface corrupt/blocked storage once, without uploading anything.
  useEffect(() => {
    const events = consumeStorageRecoveryNotice();
    if (events.length === 0) return;

    const corrupt = events.filter((event) => event.kind === 'corrupt');
    const blocked = events.filter((event) => event.kind === 'blocked');
    const quota = events.filter((event) => event.kind === 'quota');

    if (corrupt.length > 0) {
      const backups = corrupt
        .map((event) => event.backupKey)
        .filter((key): key is string => Boolean(key));
      setStorageNotice(
        backups.length > 0
          ? `Dữ liệu lưu trên trình duyệt bị hỏng. Bản gốc đã được sao lưu (${backups.join(', ')}) trước khi dùng dữ liệu mặc định.`
          : 'Dữ liệu lưu trên trình duyệt bị hỏng và không thể sao lưu. Ứng dụng đang dùng dữ liệu mặc định.'
      );
    } else if (blocked.length > 0) {
      setStorageNotice(
        'Trình duyệt đang chặn bộ nhớ cục bộ. Tiến độ sẽ không được lưu cho đến khi bạn cho phép lưu trữ trang này.'
      );
    } else if (quota.length > 0) {
      setStorageNotice('Bộ nhớ trình duyệt đã đầy. Hãy xuất dữ liệu và xóa bớt dữ liệu trang.');
    }
  }, []);

  // Synchronize theme with DOM
  useEffect(() => {
    const currentTheme = userStats.theme || 'light';
    applyTheme(currentTheme);

    if (currentTheme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [userStats.theme]);

  // Quick toggle between light & dark
  const handleToggleTheme = () => {
    const currentTheme = userStats.theme || 'light';
    const effectiveIsDark =
      currentTheme === 'dark' || (currentTheme === 'system' && getSystemTheme() === 'dark');
    const newTheme: AppTheme = effectiveIsDark ? 'light' : 'dark';
    setUserStats((prev) => ({ ...prev, theme: newTheme }));
    applyTheme(newTheme);
  };

  // Periodic check for daily study notification
  useEffect(() => {
    if (!userStats.reminderEnabled) return;

    checkAndTriggerDailyReminder(userStats, (sentDate) => {
      setUserStats((prev) => ({ ...prev, lastReminderSentDate: sentDate }));
    });

    const interval = setInterval(() => {
      checkAndTriggerDailyReminder(userStats, (sentDate) => {
        setUserStats((prev) => ({ ...prev, lastReminderSentDate: sentDate }));
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [
    userStats.reminderEnabled,
    userStats.reminderTime,
    userStats.lastReminderSentDate,
    userStats.studyDays,
    userStats.todayExercisesDone,
    userStats.dailyGoal,
  ]);

  // Calendar rollover: `todayExercisesDone` is reset when stats load, so a tab
  // left open past midnight would otherwise keep showing yesterday's count.
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayDateString();
      setUserStats((prev) => {
        if (prev.lastStudyDate === today || prev.todayExercisesDone === 0) return prev;
        return { ...prev, todayExercisesDone: 0 };
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Persist and surface write failures instead of silently losing progress.
  // One writer keeps the banner truthful: a later successful write clears a
  // previous failure instead of leaving a stale warning on screen forever.
  useEffect(() => {
    const statsSaved = saveUserStats(userStats);
    const wordsSaved = saveSavedWords(savedWords);
    const badgesSaved = saveBadges(badges);
    setStorageWriteFailed(!(statsSaved && wordsSaved && badgesSaved));
  }, [userStats, savedWords, badges]);

  // Handle Finishing an Exercise Session
  const handleFinishExercise = (result: SessionResult) => {
    setActiveSession(null);
    if (result.completed <= 0) return;

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const projectedStats = applySessionResult(userStats, result, today, yesterday);
    setUserStats(projectedStats);

    // Reschedule saved words the learner actually reviewed in this session.
    // "Đã nhớ" lengthens the interval; "Cần ôn lại" shortens it and clears the
    // mastered mark, so the schedule reflects reported recall rather than a
    // fixed constant.
    const reviewedWords = result.reviewedWords ?? [];
    const struggledWords = result.struggledWords ?? [];
    if (reviewedWords.length > 0 || struggledWords.length > 0) {
      const recalled = new Set(reviewedWords.map((word) => word.toLowerCase()));
      const struggled = new Set(struggledWords.map((word) => word.toLowerCase()));
      setSavedWords((prevWords) =>
        prevWords.map((word) => {
          const key = word.word.toLowerCase();
          // If a word shows up both ways, treat it as "needs review".
          if (struggled.has(key)) return applyWordReview(word, today, 'needs-review');
          if (recalled.has(key)) return applyWordReview(word, today, 'recalled');
          return word;
        })
      );
    }

    setBadges((prevBadges) =>
      updateBadgeProgress(
        prevBadges,
        {
          stats: projectedStats,
          savedWordsCount: savedWords.length,
          speakingBestScore: result.speakingBestScore,
        },
        today
      )
    );
  };

  // Launch Daily 5-Minute Challenge
  const handleStartDailyChallenge = () => {
    const challengeItems = getDailyChallengeExercises().map((item) => item.exercise);
    setActiveSession({
      title: 'Thử Thách 5 Phút Hàng Ngày',
      exercises: challengeItems,
    });
  };

  // Launch Full Lesson Unit
  const handleSelectUnit = (unit: LessonUnit) => {
    setActiveSession({
      title: unit.title,
      exercises: unit.exercises,
    });
  };

  // Launch Specific Exercise Type in a Unit
  const handleSelectSpecificExerciseType = (unit: LessonUnit, type: string) => {
    const filtered = unit.exercises.filter((ex) => ex.type === type);
    if (filtered.length > 0) {
      setActiveSession({
        title: `${unit.title} (${type})`,
        exercises: filtered,
      });
    }
  };

  // Launch Quick Practice Mode
  const handleStartCustomPractice = (title: string, exercises: ExerciseItem[]) => {
    if (exercises.length === 0) {
      setStorageNotice('Không tìm thấy bài tập phù hợp với lựa chọn này. Hãy đổi chủ đề hoặc cấp độ.');
      return;
    }
    setActiveSession({
      title,
      exercises,
    });
  };

  // Convert Saved Words into a Flashcard Practice Session
  const handleStartReviewSession = (words: SavedWord[]) => {
    const flashcardExercises: ExerciseItem[] = words.map((w, idx) => ({
      id: `review-${w.id}-${idx}`,
      type: 'flashcard',
      level: w.level,
      topic: w.topic,
      title: 'Ôn Tập Sổ Từ Vựng',
      vietnamesePrompt: 'Chạm để lật thẻ và ôn lại từ này',
      word: w.word,
      ipa: w.ipa,
      partOfSpeech: w.partOfSpeech,
      definitionVi: w.meaningVi,
      exampleEn: w.exampleEn,
      exampleVi: w.exampleVi,
    }));

    setActiveSession({
      title: 'Ôn Tập Thẻ Từ Vựng Đã Lưu',
      exercises: flashcardExercises,
    });
  };

  // Saved Words Handlers
  const handleToggleMastered = (id: string) => {
    const today = getTodayDateString();
    setSavedWords((prev) =>
      prev.map((word) => (word.id === id ? applyWordMasteryToggle(word, today) : word))
    );
  };

  const handleAddWord = (
    wordData: Omit<SavedWord, 'id' | 'reviewCount' | 'lastReviewedAt' | 'mastered' | 'nextReviewDate'>
  ) => {
    const newWord: SavedWord = {
      ...wordData,
      id: `w-${Date.now()}`,
      mastered: false,
      reviewCount: 0,
      lastReviewedAt: getTodayDateString(),
      nextReviewDate: computeNextReviewDate(getTodayDateString(), 0, 0),
    };
    const nextCount = savedWords.length + 1;
    setSavedWords((prev) => [newWord, ...prev]);
    setBadges((prev) =>
      updateBadgeProgress(
        prev,
        {
          stats: userStats,
          savedWordsCount: nextCount,
        },
        getTodayDateString()
      )
    );
  };

  const handleDeleteWord = (id: string) => {
    setSavedWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleSaveWord = (word: SavedWord) => {
    const exists = savedWords.some(
      (w) => w.word.toLowerCase() === word.word.toLowerCase()
    );
    if (exists) {
      setSavedWords((prev) =>
        prev.filter((w) => w.word.toLowerCase() !== word.word.toLowerCase())
      );
    } else {
      handleAddWord(word);
    }
  };

  // Destructive: requires explicit confirmation in Settings and clears every
  // DailyLingo key, including recovery snapshots. Returns false (and leaves the
  // in-memory learner data alone) if the browser refuses to clear storage.
  const handleResetAllData = (): boolean => {
    setActiveSession(null);
    if (!clearAllUserData()) {
      setStorageWriteFailed(true);
      setStorageNotice(
        'Không thể xóa dữ liệu trong trình duyệt này. Dữ liệu hiện tại vẫn còn; hãy xuất bản sao lưu trước khi thử lại.'
      );
      return false;
    }
    setUserStats({ ...INITIAL_USER_STATS, skillMastery: { ...INITIAL_USER_STATS.skillMastery } });
    setSavedWords([]);
    setBadges(cloneBadges());
    setStorageWriteFailed(false);
    setStorageNotice(null);
    applyTheme('light');
    setShowSettings(false);
    return true;
  };

  const handleImportData = (data: { stats: UserStats; words: SavedWord[]; badges: Badge[] }) => {
    setUserStats(data.stats);
    setSavedWords(data.words);
    setBadges(data.badges.length > 0 ? data.badges : cloneBadges());
    setStorageWriteFailed(false);
    setStorageNotice('Đã khôi phục dữ liệu từ tệp sao lưu. Tiến độ sẽ được lưu cục bộ.');
  };

  const masteredWordsCount = savedWords.filter((w) => w.mastered).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userStats={userStats}
        onOpenSettings={() => setShowSettings(true)}
        onOpenStreakModal={() => setShowStreakModal(true)}
        onToggleTheme={handleToggleTheme}
        currentTheme={userStats.theme || 'light'}
      />

      {(storageNotice || storageWriteFailed) && (
        <div
          className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4"
          role="alert"
        >
          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
            <p>
              {storageWriteFailed
                ? 'Không thể ghi tiến độ vào bộ nhớ trình duyệt. Hãy mở Cài đặt để xuất dữ liệu trước khi tiếp tục.'
                : storageNotice}
            </p>
            <button
              type="button"
              onClick={() => {
                setStorageNotice(null);
                setStorageWriteFailed(false);
              }}
              className="font-semibold underline shrink-0"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {(activeTab === 'lessons' || activeTab === 'practice') && (
          <DailyHeroSection
            userStats={userStats}
            onStartDailyChallenge={handleStartDailyChallenge}
            onOpenStreakModal={() => setShowStreakModal(true)}
            onOpenCustomPracticeModal={() => setShowCustomPracticeModal(true)}
          />
        )}

        {activeTab === 'lessons' && (
          <LessonCatalog
            units={LESSON_UNITS}
            onSelectUnit={handleSelectUnit}
            onSelectSpecificExerciseType={handleSelectSpecificExerciseType}
            onOpenCustomPracticeModal={() => setShowCustomPracticeModal(true)}
          />
        )}

        {activeTab === 'practice' && (
          <QuickPractice
            onStartCustomPractice={handleStartCustomPractice}
            onOpenCustomPracticeModal={() => setShowCustomPracticeModal(true)}
          />
        )}

        {activeTab === 'notebook' && (
          <VocabularyNotebook
            savedWords={savedWords}
            onToggleMastered={handleToggleMastered}
            onAddWord={handleAddWord}
            onDeleteWord={handleDeleteWord}
            onStartReviewSession={handleStartReviewSession}
            audioAccent={userStats.audioAccent}
            audioRate={userStats.audioRate}
          />
        )}

        {activeTab === 'analytics' && (
          <ErrorBoundary
            fallbackTitle="Không tải được phần thống kê"
            fallbackMessage="Dữ liệu học tập của bạn vẫn được giữ nguyên. Hãy tải lại trang hoặc thử lại sau."
          >
            <Suspense fallback={<AnalyticsSkeleton />}>
              <ProgressAnalytics
                userStats={userStats}
                badges={badges}
                savedWordsCount={savedWords.length}
                masteredWordsCount={masteredWordsCount}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      {activeSession && (
        <ErrorBoundary
          fallbackTitle="Bài luyện tập gặp lỗi"
          fallbackMessage="Tiến độ đã lưu vẫn an toàn. Hãy đóng bài luyện này và thử lại."
        >
          <ExerciseRunner
            title={activeSession.title}
            exercises={activeSession.exercises}
            onFinish={handleFinishExercise}
            onClose={() => setActiveSession(null)}
            savedWords={savedWords}
            onToggleSaveWord={handleToggleSaveWord}
            userStats={userStats}
          />
        </ErrorBoundary>
      )}

      {showCustomPracticeModal && (
        <CustomPracticeModal
          onStartSession={(title, exercises) => {
            setShowCustomPracticeModal(false);
            handleStartCustomPractice(title, exercises);
          }}
          onClose={() => setShowCustomPracticeModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          userStats={userStats}
          savedWordsCount={savedWords.length}
          storageUsageBytes={getStorageUsageBytes()}
          onUpdateStats={(updates) =>
            setUserStats((prev) => ({ ...prev, ...updates }))
          }
          onImportData={handleImportData}
          onResetAllData={handleResetAllData}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showStreakModal && (
        <StreakDetailsModal
          userStats={userStats}
          onClose={() => setShowStreakModal(false)}
          onStartStudy={handleStartDailyChallenge}
        />
      )}

      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-slate-600 dark:text-slate-400 font-medium">DailyLingo · Học tiếng Anh tương tác mỗi ngày</span>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>Tiến độ lưu trữ cục bộ</span>
            <span aria-hidden="true">·</span>
            <span>Hỗ trợ Web Speech API</span>
            <span aria-hidden="true">·</span>
            <span>Chuẩn khung CEFR A1 - B2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
