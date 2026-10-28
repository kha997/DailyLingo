import React from 'react';
import {
  Mic,
  Headphones,
  RotateCcw,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Play,
  Wand2
} from 'lucide-react';
import { ExerciseItem, ExerciseType } from '../types/index.ts';
import { LESSON_UNITS } from '../data/curriculumData.ts';

interface QuickPracticeProps {
  onStartCustomPractice: (title: string, exercises: ExerciseItem[]) => void;
  onOpenCustomPracticeModal?: () => void;
}

export const QuickPractice: React.FC<QuickPracticeProps> = ({
  onStartCustomPractice,
  onOpenCustomPracticeModal,
}) => {
  // Aggregate exercises by type across all units
  const getAllExercisesOfType = (type: ExerciseType): ExerciseItem[] => {
    const list: ExerciseItem[] = [];
    LESSON_UNITS.forEach((unit) => {
      unit.exercises.forEach((ex) => {
        if (ex.type === type) list.push(ex);
      });
    });
    return list;
  };

  const handleStartShuffledMode = (title: string, rawExercises: ExerciseItem[]) => {
    // Shuffle so it is never identical
    const shuffled = [...rawExercises].sort(() => 0.5 - Math.random());
    onStartCustomPractice(title, shuffled);
  };

  const practiceModes = [
    {
      id: 'speaking',
      title: 'Luyện Nói & Chấm Điểm Phát Âm',
      desc: 'Đọc to các mẫu câu giao tiếp, sử dụng micro để nhận diện giọng nói và chấm điểm độ chuẩn xác, kèm chế độ nghe chậm 0.7x.',
      icon: Mic,
      color: 'bg-rose-500',
      badge: 'Web Speech API',
      type: 'speaking' as ExerciseType,
    },
    {
      id: 'word-reorder',
      title: 'Sắp Xếp Câu & Phản Xạ Ngữ Pháp',
      desc: 'Tự tay ghép các khối từ thành câu hoàn chỉnh theo quy tắc ngữ pháp chuẩn, kèm giải thích chi tiết.',
      icon: RotateCcw,
      color: 'bg-indigo-600',
      badge: 'Ngữ pháp thực chiến',
      type: 'word-reorder' as ExerciseType,
    },
    {
      id: 'listening-cloze',
      title: 'Luyện Nghe & Điền Từ (Listening)',
      desc: 'Luyện tai bắt âm thanh tốc độ chuẩn và 0.7x chậm, tìm từ khóa then chốt trong câu đàm thoại.',
      icon: Headphones,
      color: 'bg-emerald-600',
      badge: 'Âm thanh tự nhiên & 0.7x',
      type: 'listening-cloze' as ExerciseType,
    },
    {
      id: 'quiz',
      title: 'Trắc Nghiệm Phản Xạ & Collocations',
      desc: 'Chọn câu đáp lại tự nhiên trong các tình huống thực tế thường nhật, du lịch và công sở.',
      icon: HelpCircle,
      color: 'bg-blue-600',
      badge: 'Tình huống giao tiếp',
      type: 'quiz' as ExerciseType,
    },
    {
      id: 'flashcard',
      title: 'Thẻ Từ Vựng & Lặp Lại Ngắt Quãng',
      desc: 'Ôn tập thẻ từ vựng với phiên âm quốc tế IPA, nghĩa tiếng Việt và câu ví dụ song ngữ.',
      icon: Sparkles,
      color: 'bg-amber-500',
      badge: 'Ghi nhớ nhanh',
      type: 'flashcard' as ExerciseType,
    },
    {
      id: 'dialogue',
      title: 'Hội Thoại Đóng Vai Giao Tiếp',
      desc: 'Luyện nghe và nói từng lời thoại qua các cuộc đối thoại 2 người sống động.',
      icon: MessageSquare,
      color: 'bg-purple-600',
      badge: 'Đàm thoại thực tế',
      type: 'dialogue' as ExerciseType,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Generator Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
            Chế Độ Luyện Tập Chuyên Sâu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Luyện tập tập trung theo kỹ năng với kho bài tập liên tục được xáo trộn ngẫu nhiên.
          </p>
        </div>

        {onOpenCustomPracticeModal && (
          <button
            onClick={onOpenCustomPracticeModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Wand2 className="w-4 h-4" />
            <span>Tạo Bài Theo Chủ Đề Mới</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {practiceModes.map((mode) => {
          const Icon = mode.icon;
          const exercises = getAllExercisesOfType(mode.type);

          return (
            <div
              key={mode.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-500/60 transition-all shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${mode.color} text-white flex items-center justify-center shadow-xs`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono tabular-nums">
                    {exercises.length} bài tập phong phú
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {mode.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {mode.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  {mode.badge}
                </span>

                <button
                  type="button"
                  onClick={() => handleStartShuffledMode(mode.title, exercises)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Bắt đầu</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
