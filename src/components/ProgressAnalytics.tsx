import React, { useMemo, useState } from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Mic,
  Headphones,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
  Lock,
  Info,
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
  ReferenceLine,
  Legend,
} from 'recharts';
import { Badge, UserStats } from '../types/index.ts';
import { getTodayXp } from '../utils/progress.ts';
import { toDateKey } from '../utils/storage.ts';

interface ProgressAnalyticsProps {
  userStats: UserStats;
  badges: Badge[];
  savedWordsCount: number;
  masteredWordsCount: number;
}

const ACCURACY_DISCLAIMER =
  'Chỉ số này được tính từ các câu đã chấm điểm trên thiết bị này. Đây là ước lượng luyện tập, không phải chứng chỉ năng lực.';

const SKILLS = [
  {
    key: 'vocabulary' as const,
    name: 'Từ vựng',
    icon: BookOpen,
    color: 'bg-emerald-500',
    description: 'Từ thẻ ghi nhớ đã chọn "đã nhớ"',
  },
  {
    key: 'grammar' as const,
    name: 'Ngữ pháp',
    icon: Sparkles,
    color: 'bg-indigo-500',
    description: 'Câu sắp xếp và trắc nghiệm',
  },
  {
    key: 'listening' as const,
    name: 'Nghe',
    icon: Headphones,
    color: 'bg-sky-500',
    description: 'Bài nghe điền từ',
  },
  {
    key: 'speaking' as const,
    name: 'Nói',
    icon: Mic,
    color: 'bg-rose-500',
    description: 'Điểm khớp văn bản, không phải chấm phát âm',
  },
];

const formatDayLabel = (dateKey: string): string => {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
};

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  userStats,
  badges,
  savedWordsCount,
  masteredWordsCount,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  const dailyTargetXp = userStats.dailyXpGoal || 50;

  const gradedAnswers = userStats.gradedAnswersCount ?? 0;
  const gradedCorrect = userStats.gradedCorrectCount ?? 0;
  const accuracyRate =
    gradedAnswers > 0 ? Math.round((gradedCorrect / gradedAnswers) * 100) : null;

  const chartData = useMemo(() => {
    const days: { dateKey: string; label: string; xp: number; goal: number; isToday: boolean }[] = [];
    for (let offset = rangeDays - 1; offset >= 0; offset--) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const dateKey = toDateKey(date);
      days.push({
        dateKey,
        label: formatDayLabel(dateKey),
        xp: Math.max(0, userStats.dailyXpHistory?.[dateKey] ?? 0),
        goal: dailyTargetXp,
        isToday: offset === 0,
      });
    }
    return days;
  }, [userStats.dailyXpHistory, dailyTargetXp, rangeDays]);

  const totalXpInRange = chartData.reduce((sum, day) => sum + day.xp, 0);
  const activeDaysInRange = chartData.filter((day) => day.xp > 0).length;
  const todayXp = getTodayXp(userStats, toDateKey(new Date()));
  const hasAnyHistory = Object.values(userStats.dailyXpHistory ?? {}).some((xp) => xp > 0);
  const unlockedBadges = badges.filter((badge) => badge.unlockedAt !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
          Thống Kê &amp; Tiến Bộ
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Mọi số liệu dưới đây được tính từ hoạt động đã lưu trên thiết bị này.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Zap className="w-4 h-4 text-amber-500" />
            Tổng XP
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {userStats.xp}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cấp {userStats.level}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Flame className="w-4 h-4 text-orange-500" />
            Chuỗi ngày học
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {userStats.currentStreak}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Kỷ lục: {userStats.longestStreak} ngày
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Target className="w-4 h-4 text-indigo-500" />
            Độ chính xác
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {accuracyRate === null ? '—' : `${accuracyRate}%`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {gradedAnswers === 0
              ? 'Chưa có câu nào được chấm'
              : `${gradedCorrect}/${gradedAnswers} câu đã chấm đúng`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-4 h-4 text-slate-500" />
            Thời gian học
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {Math.round(userStats.timeSpentMinutes)}m
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {savedWordsCount} từ đã lưu · {masteredWordsCount} đã nhớ
          </p>
        </div>
      </div>

      {/* XP chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              XP theo ngày
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {totalXpInRange} XP trong {rangeDays} ngày · {activeDaysInRange} ngày có hoạt động ·
              hôm nay {todayXp}/{dailyTargetXp} XP
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200/80 dark:border-slate-700/80 text-xs">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days as 7 | 14 | 30)}
                  aria-pressed={rangeDays === days}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    rangeDays === days
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {days} ngày
                </button>
              ))}
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setChartType('line')}
                aria-pressed={chartType === 'line'}
                aria-label="Xem biểu đồ đường"
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  chartType === 'line'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                aria-pressed={chartType === 'bar'}
                aria-label="Xem biểu đồ cột"
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {!hasAnyHistory ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Chưa có XP nào được ghi lại. Hoàn thành một bài luyện tập để bắt đầu biểu đồ.
          </div>
        ) : (
          <>
            <div className="w-full h-64" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${Number(value ?? 0)} XP`, 'XP']}
                      labelFormatter={(label) => `Ngày ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine
                      y={dailyTargetXp}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: `Mục tiêu ${dailyTargetXp}`, fontSize: 10, fill: '#f59e0b' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      name="XP đã đạt"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${Number(value ?? 0)} XP`, 'XP']}
                      labelFormatter={(label) => `Ngày ${label}`}
                    />
                    <ReferenceLine y={dailyTargetXp} stroke="#f59e0b" strokeDasharray="4 4" />
                    <Bar dataKey="xp" name="XP đã đạt" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Text equivalent for screen readers and colour-blind users. */}
            <table className="sr-only">
              <caption>XP theo ngày trong {rangeDays} ngày gần nhất</caption>
              <thead>
                <tr>
                  <th scope="col">Ngày</th>
                  <th scope="col">XP</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((day) => (
                  <tr key={day.dateKey}>
                    <th scope="row">{day.dateKey}</th>
                    <td>{day.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mb-1">
          Chỉ số kỹ năng (ước lượng)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{ACCURACY_DISCLAIMER}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SKILLS.map((skill) => {
            const Icon = skill.icon;
            const score = Math.round(userStats.skillMastery[skill.key] ?? 0);
            return (
              <div key={skill.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {skill.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {score}%
                  </span>
                </div>
                <div
                  className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={score}
                  aria-label={`${skill.name}: ${score}%`}
                >
                  <div
                    className={`${skill.color} h-full transition-all duration-500`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{skill.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Huy Hiệu &amp; Thành Tựu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chỉ mở khóa khi điều kiện được ghi nhận trên thiết bị này.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {unlockedBadges} / {badges.length} đã đạt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const isUnlocked = badge.unlockedAt !== null;
            const progress = Math.min(
              100,
              Math.round((badge.currentCount / Math.max(1, badge.targetCount)) * 100)
            );
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {badge.name}
                    </h4>
                    {isUnlocked && badge.unlockedAt && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-100/80 dark:bg-amber-950/60 px-1.5 py-0.5 rounded shrink-0">
                        {badge.unlockedAt}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {badge.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={badge.targetCount}
                      aria-valuenow={Math.min(badge.currentCount, badge.targetCount)}
                      aria-label={`${badge.name}: ${badge.currentCount} trên ${badge.targetCount}`}
                    >
                      <div
                        className={`h-full ${isUnlocked ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {Math.min(badge.currentCount, badge.targetCount)}/{badge.targetCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Limits */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 text-xs text-slate-600 dark:text-slate-300 flex gap-2">
        <Info className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
            Những gì các số liệu này không đo
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Không chấm phát âm theo âm vị; bài nói chỉ so khớp văn bản nhận dạng được.</li>
            <li>Không dùng AI hay mô hình thích ứng để chọn bài; bài luyện lấy từ ngân hàng đã biên soạn.</li>
            <li>Không có xếp hạng hay so sánh với người học khác.</li>
            <li>Dữ liệu chỉ nằm trên thiết bị và trình duyệt này, không được gửi lên máy chủ.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
