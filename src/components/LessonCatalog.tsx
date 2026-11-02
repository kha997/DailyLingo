import React, { useState } from 'react';
import { Play, Clock, Sparkles } from 'lucide-react';
import { LessonUnit } from '../types/index.ts';

interface LessonCatalogProps {
  units: LessonUnit[];
  onSelectUnit: (unit: LessonUnit) => void;
  onSelectSpecificExerciseType: (unit: LessonUnit, type: string) => void;
  onOpenCustomPracticeModal?: () => void;
}

export const LessonCatalog: React.FC<LessonCatalogProps> = ({
  units,
  onSelectUnit,
  onSelectSpecificExerciseType,
  onOpenCustomPracticeModal,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const totalExercises = units.reduce((sum, unit) => sum + unit.exercises.length, 0);

  const filteredUnits = units.filter((u) => {
    if (selectedLevel === 'all') return true;
    return u.level === selectedLevel;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
            Lộ Trình Học Tập Chuẩn Khung CEFR
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            12 bài học từ A1 đến B2 với {totalExercises} bài tập tương tác đã biên soạn.
          </p>
        </div>

        {/* Level filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start md:self-auto transition-colors">
          {['all', 'A1', 'A2', 'B1', 'B2'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedLevel === lvl
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lvl === 'all' ? `Tất cả (${units.length} bài)` : lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredUnits.map((unit) => {
          return (
            <div
              key={unit.id}
              data-testid="lesson-unit-card"
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/60 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Unit Artwork Banner */}
                {unit.image && (
                  <div className="relative aspect-21/9 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={unit.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={1200}
                      height={514}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                      <span className="text-xs font-semibold text-white/90">
                        {unit.exercises.length} bài tập tương tác đa dạng
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Clean unboxed metadata with dot separators */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{unit.level}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{unit.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5" /> {unit.estimatedMinutes} phút
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white mb-2 leading-snug">
                    {unit.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {unit.subtitle}
                  </p>

                  {/* Exercise types list quick links */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                      Kỹ năng trong bài học này:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {unit.exercises.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => onSelectSpecificExerciseType(unit, ex.type)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
                        >
                          {ex.type === 'flashcard' && '📖 Từ vựng'}
                          {ex.type === 'word-reorder' && '🧩 Sắp xếp câu'}
                          {ex.type === 'listening-cloze' && '🎧 Luyện nghe'}
                          {ex.type === 'speaking' && '🎙️ Luyện nói'}
                          {ex.type === 'quiz' && '❓ Trắc nghiệm'}
                          {ex.type === 'dialogue' && '💬 Hội thoại'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="p-6 pt-0 mt-4">
                <button
                  type="button"
                  onClick={() => onSelectUnit(unit)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt Đầu Bài Học ({unit.exercises.length} bài)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Bottom Box with Custom Practice CTA */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Muốn luyện tập chủ đề theo ý muốn?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Bạn có thể tự tạo bài học theo các chủ đề chuyên sâu như IT, Nhà Hàng, Mua Sắm, Phỏng Vấn...
            </p>
          </div>
        </div>

        {onOpenCustomPracticeModal && (
          <button
            onClick={onOpenCustomPracticeModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors shrink-0"
          >
            Tạo Bài Luyện Mới
          </button>
        )}
      </div>
    </div>
  );
};
