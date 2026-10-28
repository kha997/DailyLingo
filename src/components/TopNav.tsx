import React from 'react';
import {
  Flame,
  Settings,
  BookOpen,
  Dumbbell,
  BookMarked,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
import { UserStats } from '../types/index.ts';
import { AppTheme } from '../utils/theme.ts';

interface TopNavProps {
  activeTab: 'lessons' | 'practice' | 'notebook' | 'analytics';
  onSelectTab: (tab: 'lessons' | 'practice' | 'notebook' | 'analytics') => void;
  userStats: UserStats;
  onOpenSettings: () => void;
  onOpenStreakModal: () => void;
  onToggleTheme?: () => void;
  currentTheme?: AppTheme;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  userStats,
  onOpenSettings,
  onOpenStreakModal,
  onToggleTheme,
  currentTheme = 'light',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <button
          onClick={() => onSelectTab('lessons')}
          className="text-left font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            DL
          </span>
          <span>DailyLingo</span>
        </button>

        {/* Zone 2: Navigation Links (Single-line, clean text with underline active state) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            onClick={() => onSelectTab('lessons')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
              activeTab === 'lessons'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bài Học</span>
          </button>

          <button
            onClick={() => onSelectTab('practice')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
              activeTab === 'practice'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Luyện Tập Nhanh</span>
          </button>

          <button
            onClick={() => onSelectTab('notebook')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
              activeTab === 'notebook'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Sổ Tay Từ Vựng</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tiến Độ & Thống Kê</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Streak, Quick Theme Switcher & Settings) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={currentTheme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
              aria-label="Đổi giao diện sáng/tối"
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>
          )}

          <button
            onClick={onOpenStreakModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 transition-colors border border-amber-200 dark:border-amber-800/60 text-xs font-semibold whitespace-nowrap"
            title="Xem chi tiết chuỗi ngày học"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-mono tabular-nums">{userStats.currentStreak}</span>
            <span className="hidden sm:inline">ngày liên tiếp</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cài đặt phát âm, giao diện & mục tiêu"
            aria-label="Cài đặt"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-1 text-xs transition-colors">
        <button
          onClick={() => onSelectTab('lessons')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'lessons'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bài Học</span>
        </button>

        <button
          onClick={() => onSelectTab('practice')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'practice'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Luyện Nhanh</span>
        </button>

        <button
          onClick={() => onSelectTab('notebook')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'notebook'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Sổ Từ Vựng</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            activeTab === 'analytics'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tiến Độ</span>
        </button>
      </div>
    </header>
  );
};
