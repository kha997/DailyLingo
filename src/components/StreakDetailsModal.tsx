import React from 'react';
import { X, Flame, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { UserStats } from '../types/index.ts';

interface StreakDetailsModalProps {
  userStats: UserStats;
  onClose: () => void;
  onStartStudy: () => void;
}

export const StreakDetailsModal: React.FC<StreakDetailsModalProps> = ({
  userStats,
  onClose,
  onStartStudy,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Flame Icon */}
        <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Flame className="w-12 h-12 text-amber-500 fill-amber-500 animate-bounce" />
        </div>

        <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">
          {userStats.currentStreak} Ngày Liên Tiếp!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Bạn đang giữ thói quen học tập rất tuyệt vời. Đừng để ngọn lửa vụt tắt!
        </p>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 mb-6 text-left transition-colors">
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Chuỗi dài nhất</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {userStats.longestStreak} ngày
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Hôm nay</span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã duy trì
            </span>
          </div>
        </div>

        {/* Motivational Tip */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-4 text-left text-xs text-amber-900 dark:text-amber-200 mb-6 transition-colors">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Quy luật 5 phút mỗi ngày</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
            Học 5 phút mỗi ngày hiệu quả hơn gấp 10 lần việc học dồn 2 tiếng vào cuối tuần. Bộ não tiếp thu và lưu giữ ngữ pháp tốt nhất qua sự lặp lại ngắt quãng liên tục.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartStudy();
            }}
            className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Học Tiếp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
