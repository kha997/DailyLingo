/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav.tsx';
import { DailyHeroSection } from './components/DailyHeroSection.tsx';
import { LessonCatalog } from './components/LessonCatalog.tsx';
import { QuickPractice } from './components/QuickPractice.tsx';
import { VocabularyNotebook } from './components/VocabularyNotebook.tsx';
import { ProgressAnalytics } from './components/ProgressAnalytics.tsx';
import { ExerciseRunner } from './components/ExerciseRunner.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { StreakDetailsModal } from './components/StreakDetailsModal.tsx';
import { CustomPracticeModal } from './components/CustomPracticeModal.tsx';

import { ExerciseItem, LessonUnit, SavedWord, UserStats, Badge } from './types/index.ts';
import { computeNextReviewDate } from './data/curriculumData.ts';
import { LESSON_UNITS, getDailyChallengeExercises } from './data/curriculumData.ts';
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
} from './utils/storage.ts';
import { applyTheme, AppTheme, getSystemTheme } from './utils/theme.ts';
import { checkAndTriggerDailyReminder } from './utils/notifications.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'lessons' | 'practice' | 'notebook' | 'analytics'>('lessons');
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats);
  const [savedWords, setSavedWords] = useState<SavedWord[]>(loadSavedWords);
  const [badges, setBadges] = useState<Badge[]>(loadBadges);

  // Active Exercise Session State
  const [activeSession, setActiveSession] = useState<{
    title: string;
    exercises: ExerciseItem[];
  } | null>(null);

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCustomPracticeModal, setShowCustomPracticeModal] = useState(false);

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

    // Check immediately on mount or config change
    checkAndTriggerDailyReminder(userStats, (sentDate) => {
      setUserStats((prev) => ({ ...prev, lastReminderSentDate: sentDate }));
    });

    // Check every 30 seconds
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

  // Sync to storage on state change
  useEffect(() => {
    saveUserStats(userStats);
  }, [userStats]);

  useEffect(() => {
    saveSavedWords(savedWords);
  }, [savedWords]);

  useEffect(() => {
    saveBadges(badges);
  }, [badges]);

  // Handle Finishing an Exercise Session
  const handleFinishExercise = (result: {
    total: number;
    correct: number;
    earnedXp: number;
    exerciseType: string;
  }) => {
    setActiveSession(null);

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    setUserStats((prev) => {
      const newXp = prev.xp + result.earnedXp;
      const newLevel = Math.max(1, Math.floor(newXp / 100) + 1);

      let newStreak = prev.currentStreak;
      const hasStudiedToday = prev.studyDays.includes(today);

      if (!hasStudiedToday) {
        if (prev.lastStudyDate === yesterday) {
          newStreak += 1;
        } else if (prev.lastStudyDate !== today) {
          newStreak = 1;
        }
      }

      const updatedStudyDays = hasStudiedToday
        ? prev.studyDays
        : [...prev.studyDays, today];

      const newTotalDone = prev.totalExercisesCompleted + result.total;
      const newCorrect = prev.correctAnswersCount + result.correct;
      const newTodayDone = prev.todayExercisesDone + result.total;

      // Update skill mastery dynamically
      const newMastery = { ...prev.skillMastery };
      const boost = Math.min(2, Math.round(result.correct * 0.5));
      if (result.exerciseType === 'flashcard') {
        newMastery.vocabulary = Math.min(100, newMastery.vocabulary + boost);
      } else if (result.exerciseType === 'word-reorder') {
        newMastery.grammar = Math.min(100, newMastery.grammar + boost);
      } else if (result.exerciseType === 'listening-cloze') {
        newMastery.listening = Math.min(100, newMastery.listening + boost);
      } else if (result.exerciseType === 'speaking') {
        newMastery.speaking = Math.min(100, newMastery.speaking + boost);
      }

      const prevHistory = prev.dailyXpHistory || {};
      const updatedDailyHistory = {
        ...prevHistory,
        [today]: (prevHistory[today] || 0) + result.earnedXp,
      };

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastStudyDate: today,
        studyDays: updatedStudyDays,
        todayExercisesDone: newTodayDone,
        totalExercisesCompleted: newTotalDone,
        correctAnswersCount: newCorrect,
        timeSpentMinutes: prev.timeSpentMinutes + Math.max(2, Math.round(result.total * 0.8)),
        skillMastery: newMastery,
        dailyXpHistory: updatedDailyHistory,
      };
    });

    // Check Badge Progress
    setBadges((prevBadges) =>
      prevBadges.map((badge) => {
        if (badge.unlockedAt) return badge;

        if (badge.id === 'streak-7' && userStats.currentStreak >= 7) {
          return { ...badge, unlockedAt: today, currentCount: 7 };
        }
        if (badge.id === 'mastery-level-2' && userStats.xp + result.earnedXp >= 300) {
          return {
            ...badge,
            unlockedAt: today,
            currentCount: userStats.xp + result.earnedXp,
          };
        }
        if (badge.id === 'perfect-score' && result.exerciseType === 'speaking' && result.correct >= 1) {
          return { ...badge, unlockedAt: today, currentCount: 1 };
        }

        return badge;
      })
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
    setSavedWords((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              mastered: !w.mastered,
              reviewCount: w.reviewCount + 1,
              lastReviewedAt: getTodayDateString(),
            }
          : w
      )
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
      nextReviewDate: computeNextReviewDate(getTodayDateString(), 0, 0), // Day 1 review
    };
    setSavedWords((prev) => [newWord, ...prev]);

    // Check vocabulary collector badge
    setBadges((prev) =>
      prev.map((b) => {
        if (b.id === 'vocab-collector' && savedWords.length + 1 >= b.targetCount) {
          return {
            ...b,
            currentCount: savedWords.length + 1,
            unlockedAt: b.unlockedAt || getTodayDateString(),
          };
        }
        return b;
      })
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

  // Reset progress handler
  const handleResetProgress = () => {
    setUserStats(INITIAL_USER_STATS);
  };

  const masteredWordsCount = savedWords.filter((w) => w.mastered).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Bar following 3-Zone contract */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userStats={userStats}
        onOpenSettings={() => setShowSettings(true)}
        onOpenStreakModal={() => setShowStreakModal(true)}
        onToggleTheme={handleToggleTheme}
        currentTheme={userStats.theme || 'light'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Daily Motivation & Goal Hero (Shown on lessons & practice tabs) */}
        {(activeTab === 'lessons' || activeTab === 'practice') && (
          <DailyHeroSection
            userStats={userStats}
            onStartDailyChallenge={handleStartDailyChallenge}
            onOpenStreakModal={() => setShowStreakModal(true)}
            onOpenCustomPracticeModal={() => setShowCustomPracticeModal(true)}
          />
        )}

        {/* Tab 1: Comprehensive CEFR Lessons */}
        {activeTab === 'lessons' && (
          <LessonCatalog
            units={LESSON_UNITS}
            onSelectUnit={handleSelectUnit}
            onSelectSpecificExerciseType={handleSelectSpecificExerciseType}
            onOpenCustomPracticeModal={() => setShowCustomPracticeModal(true)}
          />
        )}

        {/* Tab 2: Quick Skill Practice Drills */}
        {activeTab === 'practice' && (
          <QuickPractice
            onStartCustomPractice={handleStartCustomPractice}
            onOpenCustomPracticeModal={() => setShowCustomPracticeModal(true)}
          />
        )}

        {/* Tab 3: Vocabulary Notebook */}
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

        {/* Tab 4: Progress Analytics & Badges */}
        {activeTab === 'analytics' && (
          <ProgressAnalytics
            userStats={userStats}
            badges={badges}
            savedWordsCount={savedWords.length}
            masteredWordsCount={masteredWordsCount}
          />
        )}
      </main>

      {/* Active Exercise Interactive Runner Modal */}
      {activeSession && (
        <ExerciseRunner
          title={activeSession.title}
          exercises={activeSession.exercises}
          onFinish={handleFinishExercise}
          onClose={() => setActiveSession(null)}
          savedWords={savedWords}
          onToggleSaveWord={handleToggleSaveWord}
          userStats={userStats}
        />
      )}

      {/* Custom Topic Generator Modal */}
      {showCustomPracticeModal && (
        <CustomPracticeModal
          onStartSession={(title, exercises) =>
            setActiveSession({ title, exercises })
          }
          onClose={() => setShowCustomPracticeModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          userStats={userStats}
          onUpdateStats={(updates) =>
            setUserStats((prev) => ({ ...prev, ...updates }))
          }
          onResetProgress={handleResetProgress}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Streak Details Modal */}
      {showStreakModal && (
        <StreakDetailsModal
          userStats={userStats}
          onClose={() => setShowStreakModal(false)}
          onStartStudy={handleStartDailyChallenge}
        />
      )}

      {/* Clean Unboxed Footer */}
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
