import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Star,
  Zap,
  Target,
  Crown,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { UserStats } from '../types/index.ts';

export interface LevelMilestoneProps {
  userStats: UserStats;
  className?: string;
}

interface LevelTier {
  level: number;
  title: string;
  englishTitle: string;
  minXp: number;
  maxXp: number;
  color: string;
  badgeBg: string;
  reward: string;
}

const LEVEL_TIERS: LevelTier[] = [
  {
    level: 1,
    title: 'Nhập Môn',
    englishTitle: 'Beginner',
    minXp: 0,
    maxXp: 100,
    color: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    reward: 'Mở khóa toàn bộ bài tập cơ bản',
  },
  {
    level: 2,
    title: 'Tập Sự',
    englishTitle: 'Novice',
    minXp: 100,
    maxXp: 200,
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    reward: 'Mở khóa âm thanh đọc chậm 0.7x & Luyện nghe',
  },
  {
    level: 3,
    title: 'Chăm Chỉ',
    englishTitle: 'Dedicated',
    minXp: 200,
    maxXp: 300,
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    reward: 'Mở khóa luyện phát âm AI & Bảng xếp hạng',
  },
  {
    level: 4,
    title: 'Tự Tin',
    englishTitle: 'Confident',
    minXp: 300,
    maxXp: 400,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    reward: 'Tùy chỉnh mục tiêu XP ngày nâng cao',
  },
  {
    level: 5,
    title: 'Tinh Anh',
    englishTitle: 'Proficient',
    minXp: 400,
    maxXp: 500,
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    reward: 'Huy hiệu Vinh danh & Khung hồ sơ Tinh Anh',
  },
  {
    level: 6,
    title: 'Bậc Thầy',
    englishTitle: 'Master',
    minXp: 500,
    maxXp: 600,
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    reward: 'Danh hiệu Huấn Luyện Viên Tiếng Anh',
  },
  {
    level: 7,
    title: 'Huyền Thoại',
    englishTitle: 'Legend',
    minXp: 600,
    maxXp: 1000,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    reward: 'Vương miện Huyền Thoại & Đặc quyền tối thượng',
  },
];

export const LevelMilestone: React.FC<LevelMilestoneProps> = ({
  userStats,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'roadmap'>('current');

  const currentLevel = userStats.level;
  const currentXp = userStats.xp;

  // Calculation for current level progression
  const baseLevelXp = (currentLevel - 1) * 100;
  const nextLevelTargetXp = currentLevel * 100;
  const xpInCurrentLevel = Math.max(0, currentXp - baseLevelXp);
  const xpNeededForNextLevel = Math.max(0, nextLevelTargetXp - currentXp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / 100) * 100))
  );

  // Sub-milestones inside the current level (25%, 50%, 75%, 100%)
  const subMilestones = [
    {
      id: 1,
      percent: 25,
      xpTarget: baseLevelXp + 25,
      label: 'Khởi Động',
      desc: 'Bước chạy đà cấp độ',
      reward: '+10 XP Thưởng động lực',
      isReached: currentXp >= baseLevelXp + 25,
      isCurrentTarget: currentXp < baseLevelXp + 25,
      icon: Flame,
    },
    {
      id: 2,
      percent: 50,
      xpTarget: baseLevelXp + 50,
      label: 'Nửa Chặng',
      desc: 'Giữ vững nhịp học',
      reward: 'Huy hiệu Kiên Trì',
      isReached: currentXp >= baseLevelXp + 50,
      isCurrentTarget: currentXp >= baseLevelXp + 25 && currentXp < baseLevelXp + 50,
      icon: Target,
    },
    {
      id: 3,
      percent: 75,
      xpTarget: baseLevelXp + 75,
      label: 'Tăng Tốc',
      desc: 'Tiến sát vạch đích',
      reward: 'Gia tăng điểm Streak',
      isReached: currentXp >= baseLevelXp + 75,
      isCurrentTarget: currentXp >= baseLevelXp + 50 && currentXp < baseLevelXp + 75,
      icon: Zap,
    },
    {
      id: 4,
      percent: 100,
      xpTarget: nextLevelTargetXp,
      label: `Cấp ${currentLevel + 1}`,
      desc: 'Vượt ngưỡng thăng hạng',
      reward: `Danh hiệu Cấp ${currentLevel + 1} & Mở khóa thưởng`,
      isReached: currentXp >= nextLevelTargetXp,
      isCurrentTarget: currentXp >= baseLevelXp + 75 && currentXp < nextLevelTargetXp,
      icon: Crown,
    },
  ];

  // Active target milestone
  const nextMilestone =
    subMilestones.find((m) => m.isCurrentTarget) || subMilestones[subMilestones.length - 1];
  const xpNeededForNextMilestone = Math.max(0, nextMilestone.xpTarget - currentXp);
  const estimatedExercises = Math.max(1, Math.ceil(xpNeededForNextMilestone / 15));

  // Current Level info from tiers
  const currentTier =
    LEVEL_TIERS.find((t) => t.level === currentLevel) || LEVEL_TIERS[0];
  const nextTier =
    LEVEL_TIERS.find((t) => t.level === currentLevel + 1) || {
      level: currentLevel + 1,
      title: `Cấp Độ ${currentLevel + 1}`,
      englishTitle: 'Master',
      minXp: nextLevelTargetXp,
      maxXp: nextLevelTargetXp + 100,
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      reward: 'Danh hiệu cao cấp & Biểu tượng vinh danh',
    };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Cột Mốc Cấp Độ (Level Milestone)
            </h3>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" /> Cấp {currentLevel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi các mốc kinh nghiệm (XP) cụ thể để thăng hạng lên Cấp {currentLevel + 1}.
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200/80 dark:border-slate-700/80 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'current'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mốc Cấp {currentLevel}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'roadmap'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lộ Trình Cấp Bậc
          </button>
        </div>
      </div>

      {activeTab === 'current' ? (
        <div>
          {/* Level Header Banner */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-amber-50/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-amber-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-xl font-black font-display text-indigo-600 dark:text-indigo-400">
                  {currentLevel}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentTier.title} ({currentTier.englishTitle})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Hiện tại
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Đã tích lũy <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{currentXp} XP</strong> · Cần thêm <strong className="text-amber-600 dark:text-amber-400 font-mono">{xpNeededForNextLevel} XP</strong> để lên Cấp {currentLevel + 1}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-indigo-100/80 dark:border-indigo-900/50 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Tiến trình lên Cấp {currentLevel + 1}</span>
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Visual Milestone Progress Bar Track */}
          <div className="px-3 sm:px-6 pt-3 pb-8">
            <div className="relative">
              {/* Main Progress Bar Track */}
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-full transition-all duration-700 relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/40 animate-pulse" />
                </div>
              </div>

              {/* Milestone Checkpoints positioned on the track */}
              <div className="absolute -top-3 left-0 right-0 w-full pointer-events-none">
                {subMilestones.map((m) => {
                  const IconComponent = m.icon;
                  return (
                    <div
                      key={m.id}
                      className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-auto"
                      style={{ left: `${m.percent}%` }}
                    >
                      {/* Checkpoint Node Bubble */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                          m.isReached
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/80 scale-100'
                            : m.isCurrentTarget
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900 animate-bounce scale-110'
                            : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-300 dark:border-slate-700'
                        }`}
                        title={`${m.label}: ${m.xpTarget} XP`}
                      >
                        {m.isReached ? (
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        ) : m.isCurrentTarget ? (
                          <IconComponent className="w-4 h-4 fill-current" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Checkpoint Label below node */}
                      <div className="absolute top-10 flex flex-col items-center text-center w-24">
                        <span
                          className={`text-[11px] font-bold whitespace-nowrap leading-tight ${
                            m.isReached
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : m.isCurrentTarget
                              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {m.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {m.xpTarget} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Next Immediate Target Card */}
          <div className="mt-8 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-indigo-600 dark:fill-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Mục tiêu kế tiếp: Mốc {nextMilestone.label}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                      Mốc {nextMilestone.percent}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Phần thưởng: <strong className="text-slate-700 dark:text-slate-300">{nextMilestone.reward}</strong>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Còn thiếu</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {xpNeededForNextMilestone} XP
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  (~{estimatedExercises} bài tập)
                </span>
              </div>
            </div>
          </div>

          {/* Sub-milestone Detail Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {subMilestones.map((milestone) => {
              const IconComp = milestone.icon;
              return (
                <div
                  key={milestone.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    milestone.isReached
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : milestone.isCurrentTarget
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-200 dark:ring-indigo-900/50'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        milestone.isReached
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : milestone.isCurrentTarget
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Mốc {milestone.percent}%
                    </span>
                    <IconComp
                      className={`w-4 h-4 ${
                        milestone.isReached
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : milestone.isCurrentTarget
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {milestone.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {milestone.xpTarget} XP
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 leading-snug">
                    🎁 {milestone.reward}
                  </p>
                  <div className="mt-2 text-[10px] font-semibold">
                    {milestone.isReached ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                      </span>
                    ) : milestone.isCurrentTarget ? (
                      <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Đang chinh phục
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Chưa mở khóa
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Level Roadmap View */
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Hành trình thăng cấp tổng thể: Mỗi cấp độ tương ứng với 100 XP tích lũy và mở khóa những đặc quyền học tập mới.
          </p>

          <div className="space-y-2.5">
            {LEVEL_TIERS.map((tier) => {
              const isPast = tier.level < currentLevel;
              const isCurrent = tier.level === currentLevel;
              const isFuture = tier.level > currentLevel;

              return (
                <div
                  key={tier.level}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-2xs ring-2 ring-indigo-200 dark:ring-indigo-900/60'
                      : isPast
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-display text-sm shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : isPast
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : tier.level}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Cấp {tier.level}: {tier.title} ({tier.englishTitle})
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            Bạn đang ở đây
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            Đã chinh phục
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Phần thưởng: <span className="text-slate-700 dark:text-slate-300">{tier.reward}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col items-start sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-800 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {tier.minXp} - {tier.maxXp} XP
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {isCurrent
                        ? `Còn ${nextLevelTargetXp - currentXp} XP để lên cấp kế`
                        : isPast
                        ? 'Đã hoàn thành'
                        : `Cần đạt ${tier.minXp} XP`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
