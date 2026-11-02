import React from 'react';
import { Play, CheckCircle2, Zap, Target, Wand2, Trophy, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '../utils/motion.ts';
import { UserStats } from '../types/index.ts';
import { getTodayDateString, toDateKey } from '../utils/storage.ts';
import { getTodayXp } from '../utils/progress.ts';
import { playDingSound, playPopSound, playClickSound } from '../utils/audioEffects.ts';
import { IMAGES } from '../assets/images/index.ts';

interface DailyHeroSectionProps {
  userStats: UserStats;
  onStartDailyChallenge: () => void;
  onOpenStreakModal: () => void;
  onOpenCustomPracticeModal?: () => void;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const DailyHeroSection: React.FC<DailyHeroSectionProps> = ({
  userStats,
  onStartDailyChallenge,
  onOpenStreakModal,
  onOpenCustomPracticeModal,
}) => {
  const todayDateStr = getTodayDateString();
  const dailyXpGoal = userStats.dailyXpGoal || 50;
  // Only XP that was actually recorded for today counts. No estimates.
  const todayXp = getTodayXp(userStats, todayDateStr);
  const xpPercentage = Math.min(100, Math.round((todayXp / dailyXpGoal) * 100));
  const isXpGoalMet = todayXp >= dailyXpGoal;

  const isExerciseGoalMet = userStats.todayExercisesDone >= userStats.dailyGoal;

  // Real calendar dates for the current Monday-first week.
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIndex);

  const weekDays = WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateKey = toDateKey(date);
    return {
      label,
      dateKey,
      isToday: index === todayIndex,
      isFuture: index > todayIndex,
      studied: userStats.studyDays.includes(dateKey),
    };
  });

  const handleCelebrateGoal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playDingSound();
    if (prefersReducedMotion()) return;
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.3 },
      });
    } catch {
      // Ignore: confetti is decorative.
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs mb-8 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span>Học tiếng Anh mỗi ngày · Phương pháp tương tác</span>
              </div>
              {isXpGoalMet && (
                <button
                  type="button"
                  onClick={handleCelebrateGoal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Nhấn để nghe chuông ăn mừng đạt mục tiêu ngày"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Đạt mục tiêu hôm nay</span>
                  <span className="text-[10px] font-mono font-medium text-emerald-700 dark:text-emerald-400">
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
              Chỉ 5-10 phút luyện tập phản xạ, ghi nhớ từ vựng và ngữ pháp thực chiến sẽ giúp bạn
              nói tiếng Anh tự tin hơn từng ngày.
            </p>
          </div>

          {/* Daily goal */}
          <div
            className={`border rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 transition-all shadow-2xs ${
              isXpGoalMet
                ? 'bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/40 dark:from-emerald-950/30 dark:via-slate-800/80 dark:to-teal-950/20 border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isXpGoalMet
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
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
              <span
                className={`text-xs font-bold font-mono tabular-nums ${
                  isXpGoalMet
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {xpPercentage}%
              </span>
            </div>

            <div
              className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5 shadow-inner"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={dailyXpGoal}
              aria-valuenow={Math.min(todayXp, dailyXpGoal)}
              aria-label={`Tiến độ XP hôm nay: ${todayXp} trên ${dailyXpGoal} XP`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isXpGoalMet
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 via-indigo-500 to-indigo-600'
                }`}
                style={{ width: `${xpPercentage}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-1.5 pt-0.5">
              <span className="text-[11px]">
                {isXpGoalMet ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    Bạn đã hoàn thành mục tiêu XP hôm nay!
                  </span>
                ) : (
                  <span>
                    Còn thiếu{' '}
                    <strong className="text-amber-700 dark:text-amber-300 font-mono font-bold">
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ tuần:</span>
                {isExerciseGoalMet && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-300/70 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                    Đủ mục tiêu bài tập hôm nay
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-center sm:self-auto">
                {weekDays.map((day) => {
                  return (
                    <button
                      type="button"
                      key={day.label}
                      className="flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => {
                        playClickSound();
                        onOpenStreakModal();
                      }}
                      aria-label={`${day.label}: ${
                        day.isFuture ? 'chưa tới' : day.studied ? 'đã học' : 'chưa học'
                      }`}
                      title={
                        day.isFuture
                          ? `${day.label}: chưa tới`
                          : day.studied
                          ? `${day.label}: đã có hoạt động học`
                          : `${day.label}: chưa học`
                      }
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative ${
                          day.studied
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs'
                            : day.isToday
                            ? 'border-2 border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {day.studied ? <CheckCircle2 className="w-3.5 h-3.5" /> : day.label}
                      </div>
                      <span
                        className={`text-[10px] font-mono leading-none ${
                          day.isToday
                            ? 'font-bold text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {day.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                playPopSound();
                onStartDailyChallenge();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Thử Thách 5 Phút Hôm Nay</span>
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
              <span>
                Đã tích lũy{' '}
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  {userStats.xp} XP
                </strong>{' '}
                · Cấp độ {userStats.level}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-tr from-indigo-900 via-slate-800 to-indigo-950 border border-slate-200 dark:border-slate-700 shadow-sm">
            <img
              src={IMAGES.hero}
              alt="Góc học tập tiếng Anh mỗi ngày"
              className="w-full h-full object-cover"
              width={1200}
              height={350}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent flex flex-col justify-end p-4 text-white">
              {isXpGoalMet && (
                <button
                  type="button"
                  onClick={handleCelebrateGoal}
                  className="absolute top-3 right-3 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-xs border border-emerald-500/70 hover:border-emerald-400 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Nhấn để nghe chuông ăn mừng đạt mục tiêu ngày"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-emerald-300 text-[11px]">Đạt mục tiêu ngày</span>
                  <Volume2 className="w-3 h-3 text-emerald-400 opacity-80" />
                </button>
              )}
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                Câu truyền cảm hứng hôm nay
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
