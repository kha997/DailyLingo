import React from 'react';
import {
  Flame,
  Settings,
  BookOpen,
  Dumbbell,
  BookMarked,
  BarChart3,
  LibraryBig,
  Sun,
  Moon,
  MessageSquare,
  UserRound
} from 'lucide-react';
import { AppTab, UserStats } from '../types/index.ts';
import { AppTheme } from '../utils/theme.ts';
import { AuthSession } from '../utils/auth.ts';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  userStats: UserStats;
  onOpenSettings: () => void;
  onOpenStreakModal: () => void;
  onOpenFeedback: () => void;
  session?: AuthSession | null;
  onOpenAccount?: () => void;
  onToggleTheme?: () => void;
  currentTheme?: AppTheme;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  userStats,
  onOpenSettings,
  onOpenStreakModal,
  onOpenFeedback,
  session = null,
  onOpenAccount,
  onToggleTheme,
  currentTheme = 'light',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 xl:gap-0">
        {/* Zone 1: Single text wordmark */}
        <button
          onClick={() => onSelectTab('lessons')}
          className="text-left font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm">
            DL
          </span>
          <span>DailyLingo</span>
        </button>

        {/* Zone 2: Navigation Links (Single-line, clean text with underline active state) */}
        <nav className="hidden 2xl:flex items-center ml-4 xl:ml-6 gap-3 xl:gap-5 2xl:gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
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
            onClick={() => onSelectTab('library')}
            className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap ${
              activeTab === 'library'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LibraryBig className="w-4 h-4" />
            <span>Thư Viện</span>
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

          <button onClick={() => onSelectTab('stories')} aria-current={activeTab === 'stories' ? 'page' : undefined} className={`flex items-center gap-1.5 py-1 whitespace-nowrap ${activeTab === 'stories' ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600' : 'hover:text-slate-900 dark:hover:text-white'}`}><BookOpen className="w-4 h-4" /><span>Đọc truyện</span></button>

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
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="hidden sm:flex p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 transition-colors border border-amber-200 dark:border-amber-800/60 text-xs font-semibold whitespace-nowrap"
            title="Xem chi tiết chuỗi ngày học"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-mono tabular-nums">{userStats.currentStreak}</span>
            <span className="hidden sm:inline">ngày liên tiếp</span>
          </button>

          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-500/60 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-xs font-semibold whitespace-nowrap"
            title="Báo lỗi hoặc đề xuất tính năng"
            aria-label="Góp ý cho DailyLingo"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Góp ý</span>
          </button>

          {onOpenAccount && (
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 transition-colors text-xs font-semibold whitespace-nowrap"
              title={session ? `Tài khoản ${session.user.email}` : 'Tạo tài khoản DailyLingo'}
              aria-label={session ? 'Tài khoản DailyLingo' : 'Tạo tài khoản DailyLingo'}
            >
              <UserRound className="w-4 h-4" />
              <span className="hidden sm:inline">{session ? 'Tài khoản' : 'Đăng ký'}</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cài đặt phát âm, giao diện & mục tiêu"
            aria-label="Cài đặt"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="2xl:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-1 text-[10px] sm:text-xs transition-colors">
        <button
          onClick={() => onSelectTab('lessons')}
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 sm:px-2 whitespace-nowrap ${
            activeTab === 'lessons'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bài Học</span>
        </button>

        <button
          aria-label="Luyện Tập Nhanh"
          onClick={() => onSelectTab('practice')}
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 sm:px-2 whitespace-nowrap ${
            activeTab === 'practice'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Luyện Nhanh</span>
        </button>

        <button
          onClick={() => onSelectTab('library')}
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 sm:px-2 whitespace-nowrap ${
            activeTab === 'library'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <LibraryBig className="w-4 h-4" />
          <span>Thư Viện</span>
        </button>

        <button
          aria-label="Sổ Tay Từ Vựng"
          onClick={() => onSelectTab('notebook')}
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 sm:px-2 whitespace-nowrap ${
            activeTab === 'notebook'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Sổ Từ Vựng</span>
        </button>

        <button onClick={() => onSelectTab('stories')} aria-current={activeTab === 'stories' ? 'page' : undefined} className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 whitespace-nowrap ${activeTab === 'stories' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}><BookOpen className="w-4 h-4" /><span>Đọc truyện</span></button>

        <button
          aria-label="Tiến Độ & Thống Kê"
          onClick={() => onSelectTab('analytics')}
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-1 px-1 sm:px-2 whitespace-nowrap ${
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
