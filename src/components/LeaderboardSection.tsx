import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Crown, Flame, Zap, Clock, Sparkles, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { UserStats } from '../types';

interface LeaderboardSectionProps {
  userStats: UserStats;
}

interface Competitor {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
  weeklyXp: number;
  allTimeXp: number;
  level: number;
  streak: number;
  trend: 'up' | 'down' | 'same';
  league: 'Kim Cương' | 'Bạch Kim' | 'Vàng';
}

const MOCK_PEERS: Competitor[] = [
  {
    id: 'peer-1',
    name: 'Minh Anh',
    avatarColor: 'from-amber-500 to-orange-500',
    initials: 'MA',
    weeklyXp: 820,
    allTimeXp: 4850,
    level: 7,
    streak: 21,
    trend: 'up',
    league: 'Kim Cương',
  },
  {
    id: 'peer-2',
    name: 'Tuấn Kiệt',
    avatarColor: 'from-blue-500 to-cyan-500',
    initials: 'TK',
    weeklyXp: 640,
    allTimeXp: 3920,
    level: 6,
    streak: 15,
    trend: 'same',
    league: 'Kim Cương',
  },
  {
    id: 'peer-3',
    name: 'Sarah Miller',
    avatarColor: 'from-emerald-500 to-teal-500',
    initials: 'SM',
    weeklyXp: 530,
    allTimeXp: 3100,
    level: 5,
    streak: 12,
    trend: 'up',
    league: 'Kim Cương',
  },
  {
    id: 'peer-4',
    name: 'Hải Đăng',
    avatarColor: 'from-purple-500 to-indigo-500',
    initials: 'HĐ',
    weeklyXp: 390,
    allTimeXp: 2450,
    level: 4,
    streak: 9,
    trend: 'down',
    league: 'Kim Cương',
  },
  {
    id: 'peer-5',
    name: 'Bảo Ngọc',
    avatarColor: 'from-rose-500 to-pink-500',
    initials: 'BN',
    weeklyXp: 310,
    allTimeXp: 1890,
    level: 3,
    streak: 6,
    trend: 'up',
    league: 'Kim Cương',
  },
  {
    id: 'peer-6',
    name: 'Alex Chen',
    avatarColor: 'from-violet-500 to-purple-600',
    initials: 'AC',
    weeklyXp: 260,
    allTimeXp: 1650,
    level: 3,
    streak: 4,
    trend: 'down',
    league: 'Kim Cương',
  },
  {
    id: 'peer-7',
    name: 'Phương Linh',
    avatarColor: 'from-teal-500 to-green-600',
    initials: 'PL',
    weeklyXp: 190,
    allTimeXp: 1220,
    level: 2,
    streak: 5,
    trend: 'same',
    league: 'Kim Cương',
  },
  {
    id: 'peer-8',
    name: 'Kenji Sato',
    avatarColor: 'from-amber-600 to-yellow-500',
    initials: 'KS',
    weeklyXp: 120,
    allTimeXp: 940,
    level: 2,
    streak: 2,
    trend: 'down',
    league: 'Kim Cương',
  },
];

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ userStats }) => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'allTime'>('weekly');

  // Estimate user's weekly XP proportionally (minimum ~60% of current XP or up to full XP for newer learners)
  const userWeeklyXp = useMemo(() => {
    // If user has low total XP, their weekly is basically total XP.
    // Otherwise calculate a sensible weekly fraction based on current streak
    if (userStats.xp <= 500) return userStats.xp;
    const factor = Math.min(1, Math.max(0.3, userStats.currentStreak / 10));
    return Math.round(userStats.xp * factor);
  }, [userStats.xp, userStats.currentStreak]);

  // Combine mock peers with current user and sort
  const rankedList = useMemo(() => {
    const currentUserItem = {
      id: 'current-user',
      name: 'Bạn (Học viên)',
      avatarColor: 'from-indigo-600 to-violet-600',
      initials: 'ME',
      weeklyXp: userWeeklyXp,
      allTimeXp: userStats.xp,
      level: userStats.level,
      streak: userStats.currentStreak,
      trend: 'up' as const,
      league: 'Kim Cương' as const,
      isCurrentUser: true,
    };

    const all = [
      ...MOCK_PEERS.map((p) => ({ ...p, isCurrentUser: false })),
      currentUserItem,
    ];

    // Sort descending by selected timeframe
    return all.sort((a, b) => {
      const xpA = timeframe === 'weekly' ? a.weeklyXp : a.allTimeXp;
      const xpB = timeframe === 'weekly' ? b.weeklyXp : b.allTimeXp;
      return xpB - xpA;
    });
  }, [timeframe, userWeeklyXp, userStats.xp, userStats.level, userStats.currentStreak]);

  // Find user's current rank
  const userRankIndex = rankedList.findIndex((item) => item.isCurrentUser);
  const userRank = userRankIndex + 1;
  const userAhead = userRankIndex > 0 ? rankedList[userRankIndex - 1] : null;
  const xpDifferenceToNext = userAhead
    ? (timeframe === 'weekly' ? userAhead.weeklyXp : userAhead.allTimeXp) -
      (timeframe === 'weekly' ? userWeeklyXp : userStats.xp) +
      10
    : 0;

  // Top 3 leaders
  const topThree = rankedList.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
              Bảng Xếp Hạng Học Tập
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Giải Kim Cương
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Mùa giải kết thúc sau: <strong>2 ngày 14 giờ</strong> · Top 3 nhận huy hiệu vinh danh</span>
          </p>
        </div>

        {/* Timeframe Filter Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframe === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('allTime')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframe === 'allTime'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Toàn thời gian
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 pt-2">
        {/* Rank 2 (Silver) */}
        {topThree[1] && (
          <div className="flex flex-col items-center justify-end">
            <div className="relative mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 dark:from-slate-600 dark:to-slate-400 p-0.5 shadow-xs">
                <div className="w-full h-full rounded-[14px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm">
                  {topThree[1].initials}
                </div>
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white text-[11px] font-mono font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                2
              </span>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full text-center mt-2">
              {topThree[1].name}
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {(timeframe === 'weekly' ? topThree[1].weeklyXp : topThree[1].allTimeXp).toLocaleString()} XP
            </span>
            <div className="w-full mt-2 h-14 bg-slate-100 dark:bg-slate-800/80 rounded-t-xl border-t-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
              <Medal className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        )}

        {/* Rank 1 (Gold) */}
        {topThree[0] && (
          <div className="flex flex-col items-center justify-end -mt-3">
            <div className="relative mb-2">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-500">
                <Crown className="w-5 h-5 fill-amber-500 animate-pulse" />
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[14px] bg-amber-50 dark:bg-slate-800 flex items-center justify-center font-bold text-amber-700 dark:text-amber-300 text-base">
                  {topThree[0].initials}
                </div>
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-mono font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                1
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full text-center mt-2 flex items-center gap-1">
              {topThree[0].name}
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {(timeframe === 'weekly' ? topThree[0].weeklyXp : topThree[0].allTimeXp).toLocaleString()} XP
            </span>
            <div className="w-full mt-2 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-t-xl border-t-2 border-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {topThree[2] && (
          <div className="flex flex-col items-center justify-end">
            <div className="relative mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-400 p-0.5 shadow-xs">
                <div className="w-full h-full rounded-[14px] bg-orange-50 dark:bg-slate-800 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 text-sm">
                  {topThree[2].initials}
                </div>
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-amber-700 text-white text-[11px] font-mono font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                3
              </span>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full text-center mt-2">
              {topThree[2].name}
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {(timeframe === 'weekly' ? topThree[2].weeklyXp : topThree[2].allTimeXp).toLocaleString()} XP
            </span>
            <div className="w-full mt-2 h-10 bg-orange-50/50 dark:bg-slate-800/60 rounded-t-xl border-t-2 border-amber-600 flex items-center justify-center">
              <Medal className="w-4 h-4 text-amber-700 dark:text-amber-500" />
            </div>
          </div>
        )}
      </div>

      {/* User Progress Callout */}
      <div className="mb-4 p-3.5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl flex items-center justify-between text-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs">
            #{userRank}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              Vị trí hiện tại: Hạng #{userRank} / {rankedList.length}
            </span>
            <span className="block text-[11px] text-slate-600 dark:text-slate-300">
              {userAhead
                ? `Cần thêm ${xpDifferenceToNext.toLocaleString()} XP để vượt ${userAhead.name}!`
                : '🎉 Bạn đang dẫn đầu bảng xếp hạng! Tiếp tục giữ vững phong độ.'}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/50 px-2 py-1 rounded-md">
            ⚡ {(timeframe === 'weekly' ? userWeeklyXp : userStats.xp).toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Full Leaderboard List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {rankedList.map((item, index) => {
          const rank = index + 1;
          const xp = timeframe === 'weekly' ? item.weeklyXp : item.allTimeXp;
          const isTopThree = rank <= 3;

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between px-3.5 py-3 transition-colors ${
                item.isCurrentUser
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 dark:border-l-indigo-500 font-medium'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
              }`}
            >
              {/* Rank & Profile Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 text-center font-mono font-bold text-xs shrink-0">
                  {rank === 1 ? (
                    <span className="text-amber-500 font-extrabold">1</span>
                  ) : rank === 2 ? (
                    <span className="text-slate-400 font-extrabold">2</span>
                  ) : rank === 3 ? (
                    <span className="text-amber-700 dark:text-amber-500 font-extrabold">3</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  {item.initials}
                </div>

                {/* Name & Indicators */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs truncate ${
                        item.isCurrentUser
                          ? 'font-bold text-indigo-900 dark:text-indigo-200'
                          : 'font-semibold text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.isCurrentUser && (
                      <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded shrink-0">
                        Bạn
                      </span>
                    )}
                    {isTopThree && !item.isCurrentUser && (
                      <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1 rounded shrink-0">
                        Top {rank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>Lv.{item.level}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-mono">
                      <Flame className="w-3 h-3 fill-amber-500" />
                      {item.streak} ngày
                    </span>
                  </div>
                </div>
              </div>

              {/* XP and Trend */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Movement trend */}
                <div className="hidden sm:flex items-center justify-center w-5">
                  {item.trend === 'up' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-emerald-500" />
                  ) : item.trend === 'down' ? (
                    <ChevronDown className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                {/* XP badge */}
                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-xs tabular-nums flex items-center justify-end gap-1 ${
                      item.isCurrentUser
                        ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    {xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Motivation */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Mỗi bài học hoàn thành đem lại từ <strong>+10 đến +30 XP</strong>
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Cập nhật tức thời theo bài học đã làm
        </span>
      </div>
    </div>
  );
};
