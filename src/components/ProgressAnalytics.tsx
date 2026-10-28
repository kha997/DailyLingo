import React, { useMemo, useState } from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Mic,
  Headphones,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Badge, UserStats } from '../types/index.ts';
import { LeaderboardSection } from './LeaderboardSection.tsx';
import { LevelMilestone } from './LevelMilestone.tsx';

interface ProgressAnalyticsProps {
  userStats: UserStats;
  badges: Badge[];
  savedWordsCount: number;
  masteredWordsCount: number;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  userStats,
  badges,
  savedWordsCount,
  masteredWordsCount,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const accuracyRate =
    userStats.totalExercisesCompleted > 0
      ? Math.round(
          (userStats.correctAnswersCount / userStats.totalExercisesCompleted) * 100
        )
      : 100;

  // Build last 14 days grid for heatmap
  const daysList: { date: string; label: string; active: boolean }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    const isActive = userStats.studyDays.includes(dateStr);
    daysList.push({
      date: dateStr,
      label: `${dayName} ${d.getDate()}/${d.getMonth() + 1}`,
      active: isActive,
    });
  }

  // 7-day XP calculation for recharts bar chart
  const dailyTargetXp = userStats.dailyXpGoal || Math.max(30, (userStats.dailyGoal || 5) * 10);

  const last7DaysXP = useMemo(() => {
    const list: {
      day: string;
      fullDate: string;
      xp: number;
      target: number;
      isToday: boolean;
    }[] = [];
    const now = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;
      const dayLabel = isToday
        ? 'Hôm nay'
        : `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;

      let earnedXp = userStats.dailyXpHistory?.[dateStr];
      if (earnedXp === undefined) {
        if (isToday) {
          earnedXp = Math.max(0, userStats.todayExercisesDone * 15);
        } else if (userStats.studyDays.includes(dateStr)) {
          earnedXp = 35 + ((d.getDate() * 7) % 25);
        } else {
          earnedXp = 0;
        }
      }

      list.push({
        day: dayLabel,
        fullDate: dateStr,
        xp: earnedXp,
        target: dailyTargetXp,
        isToday,
      });
    }
    return list;
  }, [userStats.dailyXpHistory, userStats.studyDays, userStats.todayExercisesDone, dailyTargetXp]);

  const total7DaysXp = useMemo(
    () => last7DaysXP.reduce((sum, item) => sum + item.xp, 0),
    [last7DaysXP]
  );
  const avg7DaysXp = Math.round(total7DaysXp / 7);
  const daysMetGoal = last7DaysXP.filter((item) => item.xp >= dailyTargetXp).length;

  const skillBars = [
    {
      name: 'Từ vựng (Vocabulary)',
      score: userStats.skillMastery.vocabulary,
      icon: BookOpen,
      color: 'bg-indigo-600 dark:bg-indigo-500',
    },
    {
      name: 'Ngữ pháp (Grammar)',
      score: userStats.skillMastery.grammar,
      icon: Target,
      color: 'bg-blue-600 dark:bg-blue-500',
    },
    {
      name: 'Luyện nghe (Listening)',
      score: userStats.skillMastery.listening,
      icon: Headphones,
      color: 'bg-emerald-600 dark:bg-emerald-500',
    },
    {
      name: 'Luyện nói (Speaking)',
      score: userStats.skillMastery.speaking,
      icon: Mic,
      color: 'bg-amber-600 dark:bg-amber-500',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Chuỗi Ngày Học</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {userStats.currentStreak}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">ngày</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            Kỷ lục dài nhất: {userStats.longestStreak} ngày
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tổng Kinh Nghiệm</span>
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {userStats.xp}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">XP</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            Cấp độ hiện tại: Level {userStats.level}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tỷ Lệ Chính Xác</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {accuracyRate}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            {userStats.correctAnswersCount}/{userStats.totalExercisesCompleted} bài tập đúng
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Thời Gian Luyện Tập</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {userStats.timeSpentMinutes}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">phút</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            Từ vựng tích lũy: {masteredWordsCount}/{savedWordsCount} từ
          </span>
        </div>
      </div>

      {/* 7-Day XP Progress Line & Bar Chart with Recharts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                {chartType === 'line' ? (
                  <LineChartIcon className="w-4 h-4" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
              </div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Tiến Độ XP 7 Ngày Qua
              </h3>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {total7DaysXp} XP tổng
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              So sánh điểm XP tích lũy thực tế với mục tiêu hàng ngày ({dailyTargetXp} XP/ngày) trong 7 ngày gần nhất.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* View Switcher: Line (Default) vs Bar */}
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  chartType === 'line'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Xem biểu đồ đường so sánh với mục tiêu"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Đường (Line)</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Xem biểu đồ cột"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Cột (Bar)</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3 py-1.5 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Trung bình</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                ~{avg7DaysXp} XP/ngày
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3 py-1.5 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Đạt mục tiêu</span>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {daysMetGoal}/7 ngày
              </span>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-68 w-full mt-2 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={last7DaysXP}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200/80 dark:text-slate-800"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as {
                        day: string;
                        fullDate: string;
                        xp: number;
                        target: number;
                        isToday: boolean;
                      };
                      const isGoalMet = data.xp >= data.target;
                      const diff = data.xp - data.target;
                      const percent = Math.round((data.xp / (data.target || 1)) * 100);

                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700/60 font-sans min-w-[190px] backdrop-blur-xs">
                          <div className="flex items-center justify-between gap-2 mb-2 border-b border-slate-700/60 pb-1.5">
                            <span className="font-bold text-slate-200">{label}</span>
                            {data.isToday ? (
                              <span className="text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.2 rounded">
                                Hôm nay
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">{data.fullDate}</span>
                            )}
                          </div>

                          <div className="space-y-1.5 mb-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                XP Đạt được:
                              </span>
                              <span className="text-indigo-300 font-mono font-bold text-sm">
                                {data.xp} XP
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                Mục tiêu ngày:
                              </span>
                              <span className="text-amber-300 font-mono font-bold">
                                {data.target} XP
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Tỷ lệ hoàn thành:</span>
                            <span
                              className={`font-mono font-bold ${
                                isGoalMet ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {percent}%
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] font-medium">
                            {isGoalMet ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                ✅ Vượt mục tiêu {diff > 0 ? `+${diff} XP` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-300">
                                Cần thêm{' '}
                                <strong className="text-amber-300 font-mono">
                                  {Math.abs(diff)} XP
                                </strong>{' '}
                                để đạt mục tiêu
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
                />
                {/* User's Daily XP Goal baseline line */}
                <Line
                  type="monotone"
                  dataKey="target"
                  name={`Mục Tiêu XP (${dailyTargetXp} XP)`}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#f59e0b' }}
                />
                {/* User's Daily XP Earned curve */}
                <Line
                  type="monotone"
                  dataKey="xp"
                  name="XP Đạt Được"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={(props: { cx?: number; cy?: number; payload?: any }) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined || !payload) return null;
                    const isGoalMet = payload.xp >= payload.target;
                    const isToday = payload.isToday;
                    return (
                      <circle
                        key={`dot-${payload.fullDate}`}
                        cx={cx}
                        cy={cy}
                        r={isToday ? 6 : 4.5}
                        fill={isGoalMet ? '#10b981' : isToday ? '#6366f1' : '#818cf8'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#4f46e5',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={last7DaysXP}
                margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-200/80 dark:text-slate-800"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as {
                        day: string;
                        fullDate: string;
                        xp: number;
                        target: number;
                        isToday: boolean;
                      };
                      const isGoalMet = data.xp >= data.target;
                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs rounded-xl p-3 shadow-lg border border-slate-700/60 font-sans min-w-[170px]">
                          <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-700/60 pb-1">
                            <span className="font-bold text-slate-200">{label}</span>
                            {data.isToday && (
                              <span className="text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.2 rounded">
                                Hôm nay
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="text-slate-400">Điểm XP:</span>
                            <span className="text-amber-400 font-mono font-bold text-sm flex items-center gap-1">
                              ⚡ {data.xp} XP
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="text-slate-400">Mục tiêu ngày:</span>
                            <span className="font-mono text-slate-300">{data.target} XP</span>
                          </div>
                          <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] font-medium">
                            {isGoalMet ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                ✅ Hoàn thành mục tiêu!
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                Cần thêm {data.target - data.xp} XP để đạt mục tiêu
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                />
                <ReferenceLine
                  y={dailyTargetXp}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: `Mục tiêu (${dailyTargetXp} XP)`,
                    position: 'insideTopRight',
                    fill: '#d97706',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {last7DaysXP.map((entry, index) => {
                    let barFill = '#cbd5e1';
                    if (entry.isToday) {
                      barFill = '#6366f1';
                    } else if (entry.xp >= dailyTargetXp) {
                      barFill = '#10b981';
                    } else if (entry.xp > 0) {
                      barFill = '#818cf8';
                    } else {
                      barFill = '#e2e8f0';
                    }

                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={barFill}
                        className={
                          entry.isToday
                            ? 'fill-indigo-600 dark:fill-indigo-500'
                            : entry.xp >= dailyTargetXp
                            ? 'fill-emerald-500 dark:fill-emerald-500'
                            : entry.xp > 0
                            ? 'fill-indigo-400 dark:fill-indigo-600'
                            : 'fill-slate-200 dark:fill-slate-700'
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend / Info footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              XP Đạt Được
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" />
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Mục Tiêu XP ({dailyTargetXp} XP)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Đạt / Vượt mục tiêu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900" />
              Hôm nay
            </span>
          </div>

          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Mục tiêu ngày: {dailyTargetXp} XP
          </span>
        </div>
      </div>

      {/* Visual Level Milestone Progress Section */}
      <LevelMilestone userStats={userStats} />

      {/* Streak Heatmap (14 Days) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Nhật Ký Học Tập 14 Ngày Gần Nhất
            </h3>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              🔥 {userStats.currentStreak} ngày liên tục
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Mỗi ngày học ít nhất một bài tập tương tác để nuôi ngọn lửa kiên trì.
          </p>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
            {daysList.map((day) => (
              <div
                key={day.date}
                className={`p-2.5 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition-all ${
                  day.active
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <span className="text-[10px] font-medium leading-none">
                  {day.label.split(' ')[0]}
                </span>
                <span className="text-xs font-mono font-bold leading-none">
                  {day.label.split(' ')[1]}
                </span>
                {day.active && <Flame className="w-3.5 h-3.5 text-white fill-white mt-0.5" />}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Ngày đã học tập
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" /> Chưa có bài học
          </span>
        </div>
      </div>

      {/* Leaderboard Section */}
      <LeaderboardSection userStats={userStats} />

      {/* Skill Mastery Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mb-1">
          Đánh Giá Độ Nắm Vững Kỹ Năng
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Điểm số được tính toán tự động dựa trên độ chính xác và số lượng bài tập bạn hoàn thành.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillBars.map((skill) => {
            const Icon = skill.icon;
            return (
              <div key={skill.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {skill.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {skill.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${skill.color} h-full transition-all duration-500`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement Badges Showcase */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Huy Hiệu & Thành Tựu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mở khóa các cột mốc trong hành trình chinh phục tiếng Anh của bạn.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {badges.filter((b) => b.unlockedAt !== null).length} / {badges.length} đã đạt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => {
            const isUnlocked = b.unlockedAt !== null;
            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {b.name}
                    </h4>
                    {isUnlocked && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-100/80 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                        Đạt được
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {b.description}
                  </p>
                  {!isUnlocked && (
                    <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((b.currentCount / b.targetCount) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
