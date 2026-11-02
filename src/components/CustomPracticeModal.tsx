import React, { useMemo, useRef, useState } from 'react';
import { X, Wand2, Play, Info } from 'lucide-react';
import { CEFRLevel, ExerciseItem } from '../types/index.ts';
import {
  generatePracticeSet,
  resolveTopic,
  PRACTICE_SKILL_OPTIONS,
  SkillFocus,
} from '../utils/dynamicGenerator.ts';
import { soundFX } from '../utils/speech.ts';
import { useDialogA11y } from '../utils/useDialogA11y.ts';

interface CustomPracticeModalProps {
  onStartSession: (title: string, exercises: ExerciseItem[]) => void;
  onClose: () => void;
}

const PRESET_TOPICS = [
  { id: 'cafe', title: 'Gọi Cà Phê & Đồ Uống', icon: '☕' },
  { id: 'it_coding', title: 'IT & Lập Trình Phần Mềm', icon: '💻' },
  { id: 'interview', title: 'Phỏng Vấn Xin Việc', icon: '💼' },
  { id: 'travel', title: 'Sân Bay & Khách Sạn', icon: '✈️' },
  { id: 'shopping', title: 'Mua Sắm & Đổi Trả', icon: '🛍️' },
  { id: 'health', title: 'Khám Bệnh & Sức Khỏe', icon: '🩺' },
];

const LEVELS: { id: CEFRLevel; label: string }[] = [
  { id: 'A1', label: 'A1 - Cơ bản' },
  { id: 'A2', label: 'A2 - Sơ cấp' },
  { id: 'B1', label: 'B1 - Trung cấp' },
  { id: 'B2', label: 'B2 - Nâng cao' },
];

export const CustomPracticeModal: React.FC<CustomPracticeModalProps> = ({
  onStartSession,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, onClose);

  const [selectedTopic, setSelectedTopic] = useState('cafe');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('B1');
  const [skillFocus, setSkillFocus] = useState<SkillFocus>('all');
  const [questionCount, setQuestionCount] = useState<number>(5);

  const topicName = customTopicInput.trim() || selectedTopic;
  const preview = useMemo(
    () =>
      generatePracticeSet({
        topic: topicName,
        level,
        skillFocus,
        questionCount,
        // Stable preview seed while the modal is open.
        seed: 20260101,
      }),
    [topicName, level, skillFocus, questionCount]
  );

  const handleStart = () => {
    soundFX.playClick();
    if (preview.exercises.length === 0) return;
    onStartSession(`Luyện Tập: ${topicName}`, preview.exercises);
    onClose();
  };

  const requestedTopic = resolveTopic(topicName);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-practice-title"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto focus:outline-none"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="custom-practice-title" className="text-base font-bold font-display text-slate-900 dark:text-white">
                Luyện Tập Theo Chủ Đề
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chọn từ ngân hàng bài học đã được biên soạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Đóng tạo bài luyện"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              1. Chọn chủ đề gợi ý:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_TOPICS.map((topic) => {
                const selected = selectedTopic === topic.id && !customTopicInput;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setCustomTopicInput('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-2 transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs font-semibold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">{topic.icon}</span>
                    <span className="truncate">{topic.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-topic"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1"
            >
              Hoặc nhập chủ đề mong muốn:
            </label>
            <input
              id="custom-topic"
              type="text"
              placeholder="Ví dụ: gọi cà phê, phỏng vấn, sân bay..."
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {customTopicInput.trim() && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {requestedTopic
                  ? `Chủ đề được hiểu là: ${requestedTopic}.`
                  : 'Chưa nhận diện được chủ đề này; bài luyện sẽ ưu tiên đúng cấp độ.'}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              2. Cấp độ CEFR:
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LEVELS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={level === option.id}
                  onClick={() => setLevel(option.id)}
                  className={`py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                    level === option.id
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              3. Trọng tâm kỹ năng:
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {PRACTICE_SKILL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={skillFocus === option.id}
                  onClick={() => setSkillFocus(option.id)}
                  className={`py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                    skillFocus === option.id
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              4. Số lượng bài tập:
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {[5, 8, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={questionCount === count}
                  onClick={() => setQuestionCount(count)}
                  className={`py-2 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    questionCount === count
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {count} bài
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-[11px] text-slate-600 dark:text-slate-300">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-500" />
            <div>
              <p role="status">
                Có <strong>{preview.exercises.length}</strong> bài phù hợp. {preview.note}
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Bài luyện không dùng AI để sinh nội dung; mọi câu đều lấy từ 12 bài học đã biên soạn.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={preview.exercises.length === 0}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Bắt Đầu Luyện Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
