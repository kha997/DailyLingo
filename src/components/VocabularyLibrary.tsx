import React, { useMemo, useState } from 'react';
import { BookMarked, Check, Search, Volume2 } from 'lucide-react';
import { SavedWord, TopicCategory } from '../types/index.ts';
import { LibraryWord, VOCABULARY_LIBRARY } from '../data/vocabularyLibrary.ts';
import { speakEnglish, soundFX } from '../utils/speech.ts';

type AddWordInput = Omit<
  SavedWord,
  'id' | 'reviewCount' | 'lastReviewedAt' | 'mastered' | 'nextReviewDate'
>;

interface VocabularyLibraryProps {
  savedWords: SavedWord[];
  onAddWord: (word: AddWordInput) => void;
  onGoToNotebook: () => void;
  audioAccent: 'en-US' | 'en-GB';
  audioRate: number;
}

const TOPIC_LABELS: Record<TopicCategory, string> = {
  daily: 'Hàng ngày',
  travel: 'Du lịch',
  work: 'Công việc',
  food: 'Ẩm thực',
  tech: 'Công nghệ',
  social: 'Xã hội',
};

const TOPIC_ORDER = Object.keys(TOPIC_LABELS) as TopicCategory[];
const PAGE_SIZE = 24;

export const VocabularyLibrary: React.FC<VocabularyLibraryProps> = ({
  savedWords,
  onAddWord,
  onGoToNotebook,
  audioAccent,
  audioRate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'A1' | 'A2'>('all');
  const [topicFilter, setTopicFilter] = useState<'all' | TopicCategory>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const savedLookup = useMemo(
    () => new Set(savedWords.map((word) => word.word.toLowerCase())),
    [savedWords]
  );

  const filteredWords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return VOCABULARY_LIBRARY.filter((entry) => {
      const matchesSearch =
        query === '' ||
        entry.word.toLowerCase().includes(query) ||
        entry.meaningVi.toLowerCase().includes(query);
      const matchesLevel = levelFilter === 'all' || entry.level === levelFilter;
      const matchesTopic = topicFilter === 'all' || entry.topic === topicFilter;
      return matchesSearch && matchesLevel && matchesTopic;
    });
  }, [searchTerm, levelFilter, topicFilter]);

  const visibleWords = filteredWords.slice(0, visibleCount);
  const remaining = filteredWords.length - visibleWords.length;

  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPaging();
  };

  const handleLevelFilter = (level: 'all' | 'A1' | 'A2') => {
    setLevelFilter(level);
    resetPaging();
  };

  const handleTopicFilter = (topic: 'all' | TopicCategory) => {
    setTopicFilter(topic);
    resetPaging();
  };

  const handlePlay = (entry: LibraryWord) => {
    soundFX.playClick();
    speakEnglish(entry.word, { rate: audioRate, accent: audioAccent });
  };

  const handleAdd = (entry: LibraryWord) => {
    if (savedLookup.has(entry.word.toLowerCase())) return;
    onAddWord({
      word: entry.word,
      ipa: entry.ipa,
      partOfSpeech: entry.partOfSpeech,
      meaningVi: entry.meaningVi,
      exampleEn: entry.exampleEn,
      exampleVi: entry.exampleVi,
      level: entry.level,
      topic: entry.topic,
    });
    soundFX.playCorrect();
  };

  const filtersActive = searchTerm.trim() !== '' || levelFilter !== 'all' || topicFilter !== 'all';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
            <BookMarked className="w-4 h-4" />
            <span>Thư Viện Từ Vựng Mở</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
            300 từ nền tảng A1 – A2
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Chọn từ bạn cần rồi thêm vào sổ tay. Từ đã thêm sẽ đi vào lịch ôn tập và được tính
            trong tiến độ học của bạn.
          </p>
        </div>

        <button
          onClick={onGoToNotebook}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <BookMarked className="w-4 h-4" />
          <span>Sổ tay của bạn ({savedWords.length})</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 transition-colors">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <label htmlFor="library-search" className="sr-only">
              Tìm từ trong thư viện
            </label>
            <input
              id="library-search"
              type="text"
              placeholder="Tìm từ tiếng Anh hoặc nghĩa..."
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-slate-500 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start md:self-auto">
            {(['all', 'A1', 'A2'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleLevelFilter(level)}
                aria-pressed={levelFilter === level}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  levelFilter === level
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {level === 'all' ? 'Tất cả' : level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTopicFilter('all')}
            aria-pressed={topicFilter === 'all'}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              topicFilter === 'all'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            Mọi chủ đề
          </button>
          {TOPIC_ORDER.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicFilter(topic)}
              aria-pressed={topicFilter === topic}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                topicFilter === topic
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {TOPIC_LABELS[topic]}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          Hiển thị <strong className="font-mono tabular-nums">{visibleWords.length}</strong> /{' '}
          <strong className="font-mono tabular-nums">{filteredWords.length}</strong> từ phù hợp
        </p>
      </div>

      {/* Cards */}
      {filteredWords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Không có từ nào khớp bộ lọc
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Thử từ khóa khác hoặc bỏ bớt bộ lọc cấp độ / chủ đề.
          </p>
          {filtersActive && (
            <button
              onClick={() => {
                setSearchTerm('');
                setLevelFilter('all');
                setTopicFilter('all');
                resetPaging();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleWords.map((entry) => {
              const isSaved = savedLookup.has(entry.word.toLowerCase());
              return (
                <div
                  key={entry.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-500/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {entry.level}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="italic">{entry.partOfSpeech}</span>
                        <span aria-hidden="true">·</span>
                        <span>{TOPIC_LABELS[entry.topic]}</span>
                      </div>
                      <button
                        onClick={() => handlePlay(entry)}
                        className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition-colors"
                        title={`Nghe phát âm "${entry.word}"`}
                        aria-label={`Nghe phát âm ${entry.word}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                      {entry.word}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                      {entry.ipa}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      {entry.meaningVi}
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 rounded-lg p-3 text-xs transition-colors">
                      <p className="font-medium text-slate-700 dark:text-slate-300 leading-snug">
                        &ldquo;{entry.exampleEn}&rdquo;
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 italic">
                        {entry.exampleVi}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(entry)}
                    disabled={isSaved}
                    className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isSaved
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã thêm vào sổ tay</span>
                      </>
                    ) : (
                      <span>Thêm vào sổ tay</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {remaining > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Xem thêm {Math.min(remaining, PAGE_SIZE)} từ (còn {remaining})
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Nội dung được biên soạn nội bộ cho bản Beta, tham khảo các danh sách tần suất từ vựng
        công khai; không sao chép nguyên văn danh sách có bản quyền. Nghĩa tiếng Việt và phiên âm
        đang được rà soát thủ công — nếu thấy sai, hãy dùng mục &ldquo;Góp ý&rdquo;.
      </p>
    </div>
  );
};
