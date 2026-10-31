import React from 'react';
import { Play, CheckCircle2, Zap, Target, Wand2, Trophy, Sparkles, Star, Award, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types/index.ts';
import { getTodayDateString } from '../utils/storage.ts';
import { playDingSound, playPopSound, playClickSound } from '../utils/audioEffects.ts';

interface DailyHeroSectionProps {
  userStats: UserStats;
  onStartDailyChallenge: () => void;
  onOpenStreakModal: () => void;
  onOpenCustomPracticeModal?: () => void;
}

export const DailyHeroSection: React.FC<DailyHeroSectionProps> = ({
  userStats,
  onStartDailyChallenge,
  onOpenStreakModal,
  onOpenCustomPracticeModal,
}) => {
  const todayDateStr = getTodayDateString();
  const dailyXpGoal = userStats.dailyXpGoal || 50;
  const todayXp = userStats.dailyXpHistory?.[todayDateStr] ?? Math.max(0, userStats.todayExercisesDone * 15);
  const xpPercentage = Math.min(100, Math.round((todayXp / dailyXpGoal) * 100));
  const isXpGoalMet = todayXp >= dailyXpGoal;

  const isExerciseGoalMet = userStats.todayExercisesDone >= userStats.dailyGoal;

  // Generate 7 days labels for current week
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  const handleCelebrateGoal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playDingSound();
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.3 },
      });
    } catch {
      // Ignore
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs mb-8 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
        {/* Left Column: Greeting, Daily Goal & Action */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Học tiếng Anh mỗi ngày · Phương pháp tương tác</span>
              </div>
              {isXpGoalMet && (
                <button
                  type="button"
                  onClick={handleCelebrateGoal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in"
                  title="Nhấn để nghe chuông ăn mừng đạt mục tiêu ngày 🔔"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Daily Goal Reached! 🎉</span>
                  <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    ({todayXp}/{dailyXpGoal} XP)
                  </span>
                  <Volume2 className="w-3 h-3 text-emerald-500 ml-0.5 opacity-70" />
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              Chào bạn, hãy hoàn thành mục tiêu hôm nay!
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Chỉ 5-10 phút luyện tập phản xạ, ghi nhớ từ vựng và ngữ pháp thực chiến sẽ giúp bạn nói tiếng Anh tự tin hơn từng ngày.
            </p>
          </div>

          {/* Daily Goal Card */}
          <div
            className={`border rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 transition-all shadow-2xs ${
              isXpGoalMet
                ? 'bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/40 dark:from-emerald-950/30 dark:via-slate-800/80 dark:to-teal-950/20 border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            {/* Header: Daily XP Goal & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isXpGoalMet
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-500'
                  }`}
                >
                  {isXpGoalMet ? (
                    <Trophy className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 fill-amber-500" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Mục tiêu XP hôm nay:
                </span>
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {todayXp} / {dailyXpGoal} XP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isXpGoalMet && (
                  <button
                    type="button"
                    onClick={handleCelebrateGoal}
                    className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 border border-emerald-300/80 dark:border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Nhấn để nghe chuông ăn mừng! 🔔"
                  >
                    <Trophy className="w-3 h-3 text-amber-500 fill-amber-400" /> Daily Goal Reached
                  </button>
                )}
                <span
                  className={`text-xs font-bold font-mono tabular-nums ${
                    isXpGoalMet
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {xpPercentage}%
                </span>
              </div>
            </div>

            {/* Daily XP Goal Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isXpGoalMet
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 via-indigo-500 to-indigo-600'
                }`}
                style={{ width: `${xpPercentage}%` }}
              />
            </div>

            {/* Sub-status & Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-1.5 pt-0.5">
              <span className="text-[11px]">
                {isXpGoalMet ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    Tuyệt vời! Bạn đã hoàn thành mục tiêu XP hôm nay (+{todayXp - dailyXpGoal} XP thưởng)!
                  </span>
                ) : (
                  <span>
                    Còn thiếu{' '}
                    <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                      {dailyXpGoal - todayXp} XP
                    </strong>{' '}
                    nữa để đạt mục tiêu ngày.
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Đã làm:{' '}
                  <strong className="font-mono">
                    {userStats.todayExercisesDone}/{userStats.dailyGoal}
                  </strong>{' '}
                  bài tập
                </span>
              </div>
            </div>

            {/* Week Streak Dots */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ tuần:</span>
                {isXpGoalMet && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-300/70 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                    Hôm nay: Daily Goal Reached!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                {weekDays.map((day, idx) => {
                  const isCurrentDay = idx === todayIndex;
                  const isDone =
                    idx <= todayIndex &&
                    (idx < todayIndex ||
                      isXpGoalMet ||
                      isExerciseGoalMet ||
                      userStats.todayExercisesDone > 0);
                  const isTodayGoalReached = isCurrentDay && isXpGoalMet;

                  return (
                    <div
                      key={day}
                      className="flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => {
                        if (isTodayGoalReached) {
                          handleCelebrateGoal();
                        } else {
                          playClickSound();
                        }
                        onOpenStreakModal();
                      }}
                      title={
                        isTodayGoalReached
                          ? 'Hôm nay: Đã hoàn thành mục tiêu XP (Daily Goal Reached)!'
                          : isCurrentDay
                          ? 'Hôm nay'
                          : `Thứ ${day}`
                      }
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative ${
                          isTodayGoalReached
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900 scale-105'
                            : isDone
                            ? 'bg-amber-500 text-white shadow-xs'
                            : isCurrentDay
                            ? 'border-2 border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {isTodayGoalReached ? (
                          <Trophy className="w-3.5 h-3.5 fill-current" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          day
                        )}
                        {isTodayGoalReached && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white dark:border-slate-800 animate-pulse" />
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] font-mono leading-none ${
                            isCurrentDay
                              ? 'font-bold text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {day}
                        </span>
                        {isTodayGoalReached && (
                          <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 leading-none whitespace-nowrap mt-0.5">
                            ⭐ Đạt
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick CTA buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                playPopSound();
                onStartDailyChallenge();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Thử Thách 5 Phút Hôm Nay (+30 XP)</span>
            </button>

            {onOpenCustomPracticeModal && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenCustomPracticeModal();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Tạo Bài Theo Chủ Đề Mới</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium ml-auto sm:ml-0">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Đã tích lũy <strong className="font-mono text-slate-800 dark:text-slate-200">{userStats.xp} XP</strong> · Cấp độ {userStats.level}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Asset */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-tr from-indigo-900 via-slate-800 to-indigo-950 border border-slate-200 dark:border-slate-750 shadow-sm">
            <img
              src="/src/assets/images/english_learning_hero_1790648876420.jpg"
              alt="Góc học tập tiếng Anh mỗi ngày"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Graceful fallback
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent flex flex-col justify-end p-4 text-white">
              {isXpGoalMet && (
                <button
                  type="button"
                  onClick={handleCelebrateGoal}
                  className="absolute top-3 right-3 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-xs border border-emerald-500/70 hover:border-emerald-400 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Nhấn để nghe chuông ăn mừng đạt mục tiêu ngày 🔔"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-emerald-300 text-[11px]">Daily Goal Reached</span>
                  <Volume2 className="w-3 h-3 text-emerald-400 opacity-80" />
                </button>
              )}
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                Bài Học Tiêu Biểu Hôm Nay
              </span>
              <p className="text-sm font-bold mt-1">
                &ldquo;Small daily improvements over time lead to stunning results.&rdquo;
              </p>
              <span className="text-xs text-slate-300 mt-1">
                Luyện tập đều đặn tạo nên sự trôi chảy vượt bậc.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
