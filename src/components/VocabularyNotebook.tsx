import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Volume2,
  CheckCircle2,
  Circle,
  Trash2,
  Play,
  BookmarkCheck,
  X
} from 'lucide-react';
import { SavedWord, CEFRLevel, TopicCategory } from '../types/index.ts';
import { speakEnglish, soundFX } from '../utils/speech.ts';
import { getTodayDateString } from '../utils/storage.ts';
import { computeNextReviewDate } from '../data/curriculumData.ts';

interface VocabularyNotebookProps {
  savedWords: SavedWord[];
  onToggleMastered: (id: string) => void;
  onAddWord: (word: Omit<SavedWord, 'id'>) => void;
  onDeleteWord: (id: string) => void;
  onStartReviewSession: (words: SavedWord[]) => void;
  audioAccent: 'en-US' | 'en-GB';
  audioRate: number;
}

export const VocabularyNotebook: React.FC<VocabularyNotebookProps> = ({
  savedWords,
  onToggleMastered,
  onAddWord,
  onDeleteWord,
  onStartReviewSession,
  audioAccent,
  audioRate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'learning' | 'mastered'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Word Form State
  const [newWord, setNewWord] = useState('');
  const [newIpa, setNewIpa] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState('noun');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExampleEn, setNewExampleEn] = useState('');
  const [newExampleVi, setNewExampleVi] = useState('');
  const [newLevel, setNewLevel] = useState<CEFRLevel>('A2');
  const [newTopic, setNewTopic] = useState<TopicCategory>('daily');

  const todayDateStr = getTodayDateString();
  // The notebook shows every saved word so newly added words are immediately
  // visible. Spaced repetition only controls which words are *due* for review.
  const visibleWords = savedWords.filter((w) => {
    const matchSearch =
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.meaningVi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = selectedLevel === 'all' || w.level === selectedLevel;
    const matchStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'mastered' ? w.mastered : !w.mastered);
    return matchSearch && matchLevel && matchStatus;
  });
  // nextReviewDate is stored as YYYY-MM-DD, so lexical comparison is safe.
  const dueWords = visibleWords.filter((w) => w.nextReviewDate <= todayDateStr);

  const masteredCount = savedWords.filter((w) => w.mastered).length;
  const learningCount = savedWords.length - masteredCount;

  const handlePlayWord = (word: string) => {
    soundFX.playClick();
    speakEnglish(word, { rate: audioRate, accent: audioAccent });
  };

  const handleCreateWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;

    onAddWord({
      word: newWord.trim().toLowerCase(),
      ipa: newIpa.trim() || `/${newWord.trim()}/`,
      partOfSpeech: newPartOfSpeech,
      meaningVi: newMeaning.trim(),
      exampleEn: newExampleEn.trim() || `This is an example for ${newWord}.`,
      exampleVi: newExampleVi.trim() || 'Ví dụ minh họa cho từ vựng này.',
      level: newLevel,
      topic: newTopic,
      mastered: false,
      reviewCount: 0,
      lastReviewedAt: getTodayDateString(),
      nextReviewDate: computeNextReviewDate(getTodayDateString(), 0, 0), // Day 1 review
    });

    // Reset form
    setNewWord('');
    setNewIpa('');
    setNewMeaning('');
    setNewExampleEn('');
    setNewExampleVi('');
    setShowAddModal(false);
    soundFX.playCorrect();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Quick Review Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
            <BookmarkCheck className="w-4 h-4" />
            <span>Sổ Tay Từ Vựng Cá Nhân</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
            Kho từ vựng của bạn
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Tổng cộng: <strong className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">{savedWords.length}</strong> từ</span>
            <span aria-hidden="true">·</span>
            <span>Đã thuộc: <strong className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{masteredCount}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Đang học: <strong className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">{learningCount}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onStartReviewSession(dueWords.length > 0 ? dueWords : savedWords)}
            disabled={savedWords.length === 0}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Ôn Tập Bằng Flashcard</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Từ Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm từ tiếng Anh hoặc nghĩa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Level and Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
            {['all', 'A1', 'A2', 'B1', 'B2'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedLevel === lvl
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lvl === 'all' ? 'Tất cả' : lvl}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'learning', label: 'Đang học' },
              { id: 'mastered', label: 'Đã thuộc' },
            ].map((st) => (
              <button
                key={st.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setSelectedStatus(st.id as any)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedStatus === st.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word Cards Grid */}
      {visibleWords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Không tìm thấy từ vựng phù hợp
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Thêm Từ Mới&quot; để bổ sung vào sổ tay.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleWords.map((word) => (
            <div
              key={word.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 transition-all shadow-2xs flex flex-col justify-between ${
                word.mastered
                  ? 'border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/15 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/60'
              }`}
            >
              <div>
                {/* Header: Level & Actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{word.level}</span>
                    <span aria-hidden="true">·</span>
                    <span className="italic">{word.partOfSpeech}</span>
                    <span aria-hidden="true">·</span>
                    <span>{word.topic}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleMastered(word.id)}
                      className={`p-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                        word.mastered
                          ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title={word.mastered ? 'Đã thuộc (Bấm để chuyển sang đang học)' : 'Đánh dấu đã thuộc'}
                    >
                      {word.mastered ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/50" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteWord(word.id)}
                      className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Xóa từ khỏi sổ tay"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Word & Pronunciation */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                    {word.word}
                  </h3>
                  <button
                    onClick={() => handlePlayWord(word.word)}
                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-3">
                  {word.ipa}
                </p>

                {/* Meaning */}
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  {word.meaningVi}
                </p>

                {/* Example sentence */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 rounded-lg p-3 text-xs transition-colors">
                  <p className="font-medium text-slate-700 dark:text-slate-300 leading-snug">
                    &ldquo;{word.exampleEn}&rdquo;
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                    {word.exampleVi}
                  </p>
                </div>
              </div>

              {/* Card Footer: Review counter & next review date */}
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>Ôn tập: {word.reviewCount} lần</span>
                <span className={word.mastered ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                  {word.mastered ? '● Đã thành thạo' : '○ Cần ôn thêm'}
                </span>
                {(!word.mastered) && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium ml-2">
                    {new Date(word.nextReviewDate).getDate()}/{new Date(word.nextReviewDate).getMonth() + 1} hẹn review
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                Thêm Từ Vựng Mới Vào Sổ Tay
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWord} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                  Từ tiếng Anh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: resilient, serendipity, deadline..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                    Phiên âm IPA (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="/rɪˈzɪl.jənt/"
                    value={newIpa}
                    onChange={(e) => setNewIpa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                    Từ loại
                  </label>
                  <select
                    value={newPartOfSpeech}
                    onChange={(e) => setNewPartOfSpeech(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="noun">noun (danh từ)</option>
                    <option value="verb">verb (động từ)</option>
                    <option value="adjective">adjective (tính từ)</option>
                    <option value="adverb">adverb (trạng từ)</option>
                    <option value="idiom">idiom (thành ngữ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                  Nghĩa tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: kiên cường, bền bỉ..."
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                  Câu ví dụ tiếng Anh
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Language learners must be resilient."
                  value={newExampleEn}
                  onChange={(e) => setNewExampleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                  Dịch nghĩa câu ví dụ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Người học ngôn ngữ phải kiên cường."
                  value={newExampleVi}
                  onChange={(e) => setNewExampleVi(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                    Cấp độ CEFR
                  </label>
                  <select
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={newLevel}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="A1">A1 - Sơ cấp</option>
                    <option value="A2">A2 - Cơ bản</option>
                    <option value="B1">B1 - Trung cấp</option>
                    <option value="B2">B2 - Nâng cao</option>
                    <option value="IELTS_TOEIC">IELTS / TOEIC</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                    Chủ đề
                  </label>
                  <select
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={newTopic}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e) => setNewTopic(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="daily">Hàng ngày</option>
                    <option value="travel">Du lịch</option>
                    <option value="work">Công việc</option>
                    <option value="food">Ẩm thực</option>
                    <option value="tech">Công nghệ</option>
                    <option value="social">Xã hội</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Thêm Vào Sổ Tay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
