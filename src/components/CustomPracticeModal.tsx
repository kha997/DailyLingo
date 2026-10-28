import React, { useState } from 'react';
import { X, Sparkles, Wand2, Play } from 'lucide-react';
import { CEFRLevel, ExerciseItem } from '../types/index.ts';
import { generateDynamicExerciseSet } from '../utils/dynamicGenerator.ts';
import { soundFX } from '../utils/speech.ts';

interface CustomPracticeModalProps {
  onStartSession: (title: string, exercises: ExerciseItem[]) => void;
  onClose: () => void;
}

const PRESET_TOPICS = [
  { id: 'cafe', title: 'Gọi Cà Phê & Đồ Uống', icon: '☕' },
  { id: 'it_coding', title: 'IT & Lập Trình Phần Mềm', icon: '💻' },
  { id: 'interview', title: 'Phỏng Vấn Xin Việc & Đàm Phán', icon: '💼' },
  { id: 'travel', title: 'Sân Bay & Nhận Phòng Khách Sạn', icon: '✈️' },
  { id: 'shopping', title: 'Mua Sắm & Trả Hàng Hoàn Tiền', icon: '🛍️' },
  { id: 'health', title: 'Khám Bệnh & Triệu Chứng Sức Khỏe', icon: '🩺' },
];

export const CustomPracticeModal: React.FC<CustomPracticeModalProps> = ({
  onStartSession,
  onClose,
}) => {
  const [selectedTopic, setSelectedTopic] = useState('cafe');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [level, setLevel] = useState<CEFRLevel>('B1');
  const [skillFocus, setSkillFocus] = useState<'all' | 'speaking' | 'reorder' | 'listening' | 'quiz' | 'flashcard'>('all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    soundFX.playClick();
    setIsGenerating(true);

    const topicName = customTopicInput.trim() || selectedTopic;

    setTimeout(() => {
      const generated = generateDynamicExerciseSet({
        topic: topicName,
        level,
        skillFocus,
        questionCount,
      });

      setIsGenerating(false);
      soundFX.playCorrect();
      onStartSession(`Luyện Tập: ${customTopicInput.trim() || PRESET_TOPICS.find((p) => p.id === selectedTopic)?.title || 'Chủ Đề Tùy Chọn'}`, generated);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                Tạo Bài Luyện Mới Theo Chủ Đề
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nội dung học tập phong phú, không lo bị lặp lại
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Preset Topics */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
              1. Chọn chủ đề gợi ý:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(topic.id);
                    setCustomTopicInput('');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-2 transition-all ${
                    selectedTopic === topic.id && !customTopicInput
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs font-semibold'
                      : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <span className="text-base">{topic.icon}</span>
                  <span className="truncate">{topic.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Hoặc nhập chủ đề bạn mong muốn:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Gọi món Starbucks, đàm phán hợp đồng, phỏng vấn IT..."
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* CEFR Level & Skill Focus */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
                2. Cấp độ CEFR:
              </label>
              <select
                value={level}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="A1">A1 - Cơ bản</option>
                <option value="A2">A2 - Sơ cấp</option>
                <option value="B1">B1 - Trung cấp</option>
                <option value="B2">B2 - Nâng cao</option>
                <option value="IELTS_TOEIC">IELTS / TOEIC</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
                3. Trọng tâm kỹ năng:
              </label>
              <select
                value={skillFocus}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setSkillFocus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">Tổng hợp cả 5 kỹ năng</option>
                <option value="speaking">🎙️ Chỉ luyện nói & phát âm</option>
                <option value="reorder">🧩 Chỉ luyện sắp xếp câu</option>
                <option value="listening">🎧 Chỉ luyện nghe điền từ</option>
                <option value="quiz">❓ Chỉ luyện trắc nghiệm</option>
                <option value="flashcard">📖 Chỉ thẻ từ vựng</option>
              </select>
            </div>
          </div>

          {/* Number of exercises */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
              4. Số lượng bài tập:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 8, 10].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    questionCount === cnt
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {cnt} câu hỏi
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
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
            disabled={isGenerating}
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Đang khởi tạo bài học...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt Đầu Luyện Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
