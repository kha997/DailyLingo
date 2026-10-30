import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  RotateCcw,
  Check,
  X,
  Mic,
  MicOff,
  Sparkles,
  BookMarked,
  HelpCircle,
  ArrowRight,
  BookmarkCheck,
  Info,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExerciseItem, SavedWord, UserStats } from '../types/index.ts';
import { speakEnglish, calculateSimilarity, SpeechRecognizer } from '../utils/speech.ts';
import { isNotificationSupported } from '../utils/notifications.ts';
import { computeNextReviewDate } from '../data/curriculumData.ts';
import { getTodayDateString } from '../utils/storage.ts';
import {
  playPopSound,
  playTadaSound,
  playDingSound,
  playWrongSound,
  playClickSound,
} from '../utils/audioEffects.ts';

interface ExerciseRunnerProps {
  exercises: ExerciseItem[];
  title: string;
  onFinish: (result: {
    total: number;
    correct: number;
    earnedXp: number;
    exerciseType: string;
  }) => void;
  onClose: () => void;
  savedWords: SavedWord[];
  onToggleSaveWord: (word: SavedWord) => void;
  userStats: UserStats;
}

export const ExerciseRunner: React.FC<ExerciseRunnerProps> = ({
  exercises,
  title,
  onFinish,
  onClose,
  savedWords,
  onToggleSaveWord,
  userStats,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0, xp: 0 });
  const [isCompleted, setIsCompleted] = useState(false);

  // Exercise Specific States
  // Flashcard
  const [isFlipped, setIsFlipped] = useState(false);

  // Word reorder
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<{ id: string; word: string }[]>([]);
  const [reorderStatus, setReorderStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Listening Cloze
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [clozeStatus, setClozeStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Speaking
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);
  const [speakingMatches, setSpeakingMatches] = useState<boolean[]>([]);
  const [speakingError, setSpeakingError] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  // Quiz
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Audio playing
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState<number | null>(null);

  const currentExercise = exercises[currentIndex];

  // Initialize current exercise
  useEffect(() => {
    if (!currentExercise) return;
    setIsFlipped(false);
    setSelectedOption(null);
    setClozeStatus('idle');
    setSelectedQuizOpt(null);
    setQuizSubmitted(false);
    setSpokenTranscript('');
    setSpeakingScore(null);
    setSpeakingMatches([]);
    setSpeakingError(null);
    setReorderStatus('idle');

    if (currentExercise.type === 'word-reorder' && currentExercise.scrambledWords) {
      setSelectedWords([]);
      // Shuffle words slightly to make it engaging
      const wordsWithIds = currentExercise.scrambledWords.map((w, i) => ({
        id: `${w}-${i}-${Date.now()}`,
        word: w,
      }));
      setAvailableWords(wordsWithIds);
    }

    if (currentExercise.type === 'listening-cloze' && currentExercise.audioText) {
      // Auto play audio once on start
      const timer = setTimeout(() => {
        handlePlayAudio(currentExercise.audioText || '');
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentExercise]);

  const handlePlayAudio = async (text: string, rate?: number) => {
    if (!text) return;
    const targetRate = typeof rate === 'number' ? rate : (userStats.audioRate || 0.95);

    // Stop any existing utterance immediately so user can switch to 0.7x without delay
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    setIsPlayingAudio(true);
    setActiveSpeed(targetRate);
    playClickSound();

    try {
      await speakEnglish(text, { rate: targetRate, accent: userStats.audioAccent });
    } finally {
      setIsPlayingAudio(false);
      setActiveSpeed(null);
    }
  };

  const isWordSaved = (wordStr?: string) => {
    if (!wordStr) return false;
    return savedWords.some((w) => w.word.toLowerCase() === wordStr.toLowerCase());
  };

  const handleFlashcardReview = (understood: boolean) => {
    playClickSound();
    const gained = understood ? 15 : 5;
    if (understood) playPopSound();

    setSessionScore((prev) => ({
      correct: prev.correct + (understood ? 1 : 0),
      total: prev.total + 1,
      xp: prev.xp + gained,
    }));

    advanceExercise();
  };

  // Handle word reorder interaction
  const handleSelectWord = (item: { id: string; word: string }) => {
    playClickSound();
    setSelectedWords((prev) => [...prev, item.word]);
    setAvailableWords((prev) => prev.filter((w) => w.id !== item.id));
    setReorderStatus('idle');
  };

  const handleDeselectWord = (index: number) => {
    playClickSound();
    const wordToReturn = selectedWords[index];
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
    setAvailableWords((prev) => [
      ...prev,
      { id: `${wordToReturn}-${Date.now()}-${Math.random()}`, word: wordToReturn },
    ]);
    setReorderStatus('idle');
  };

  const handleCheckReorder = () => {
    if (!currentExercise.targetSentence) return;
    const reconstructed = selectedWords.join(' ').trim();
    const target = currentExercise.targetSentence.trim();

    // Relaxed punctuation matching
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, '').replace(/\s+/g, ' ').trim();

    const isMatch = normalize(reconstructed) === normalize(target);
    if (isMatch) {
      playPopSound();
      setReorderStatus('correct');
      handlePlayAudio(currentExercise.targetSentence);
      setSessionScore((prev) => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
        xp: prev.xp + 15,
      }));
    } else {
      playWrongSound();
      setReorderStatus('wrong');
    }
  };

  // Handle Listening Cloze
  const handleSelectClozeOption = (opt: string) => {
    if (clozeStatus !== 'idle') return;
    setSelectedOption(opt);
    const isCorrect = opt.toLowerCase() === (currentExercise.blankWord || '').toLowerCase();

    if (isCorrect) {
      playPopSound();
      setClozeStatus('correct');
      setSessionScore((prev) => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
        xp: prev.xp + 15,
      }));
    } else {
      playWrongSound();
      setClozeStatus('wrong');
      setSessionScore((prev) => ({
        correct: prev.correct,
        total: prev.total + 1,
        xp: prev.xp + 5,
      }));
    }
  };

  // Handle Speaking practice
  const handleToggleRecord = () => {
    if (!recognizerRef.current) {
      recognizerRef.current = new SpeechRecognizer();
    }
    const recognizer = recognizerRef.current;

    // If speech recognition is not supported, show a friendly message and return
    if (!recognizer.isSupported) {
      setSpeakingError('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói Web Speech API. Vui lòng sử dụng Chrome hoặc Edge để sử dụng tính năng luyện nói.');
      setIsRecording(false);
      return;
    }

    if (isRecording) {
      recognizer.stopListening();
      setIsRecording(false);
      return;
    }

    setSpeakingError(null);
    setSpokenTranscript('');
    setSpeakingScore(null);
    setIsRecording(true);
    playClickSound();

    recognizer.startListening(
      (res) => {
        setSpokenTranscript(res.transcript);
        if (res.isFinal && currentExercise.speakingTarget) {
          const evalResult = calculateSimilarity(res.transcript, currentExercise.speakingTarget);
          setSpeakingScore(evalResult.score);
          setSpeakingMatches(evalResult.matches);
          setIsRecording(false);

          if (evalResult.score >= 70) {
            playPopSound();
            setSessionScore((prev) => ({
              correct: prev.correct + 1,
              total: prev.total + 1,
              xp: prev.xp + 20,
            }));
          } else {
            playWrongSound();
            setSessionScore((prev) => ({
              correct: prev.correct,
              total: prev.total + 1,
              xp: prev.xp + 5,
            }));
          }
        }
      },
      (err) => {
        setSpeakingError(err);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );
  };

  const handleSelfVerifySpeaking = () => {
    playPopSound();
    setSpeakingScore(90);
    setSpeakingMatches([true, true, true, true]);
    setSessionScore((prev) => ({
      correct: prev.correct + 1,
      total: prev.total + 1,
      xp: prev.xp + 15,
    }));
  };

  // Handle Quiz
  const handleSelectQuizOption = (optId: string) => {
    if (quizSubmitted) return;
    setSelectedQuizOpt(optId);
    setQuizSubmitted(true);

    const chosen = currentExercise.quizOptions?.find((o) => o.id === optId);
    const isCorrect = !!chosen?.isCorrect;

    if (isCorrect) {
      playPopSound();
      setSessionScore((prev) => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
        xp: prev.xp + 15,
      }));
    } else {
      playWrongSound();
      setSessionScore((prev) => ({
        correct: prev.correct,
        total: prev.total + 1,
        xp: prev.xp + 5,
      }));
    }
  };

  // Advance to next exercise or complete
  const advanceExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all!
      setIsCompleted(true);
      playTadaSound();

      // Check if session XP reaches or completes daily XP goal
      const todayDateStr = new Date().toISOString().split('T')[0];
      const dailyXpGoal = userStats.dailyXpGoal || 50;
      const currentTodayXp =
        userStats.dailyXpHistory?.[todayDateStr] ??
        Math.max(0, userStats.todayExercisesDone * 15);
      const newTodayXp = currentTodayXp + sessionScore.xp;
      const reachedGoalNow = newTodayXp >= dailyXpGoal;

      if (reachedGoalNow) {
        setTimeout(() => {
          playDingSound();
        }, 650);
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }
    }
  };

  // If session is completed, show celebration card
  if (isCompleted) {
    const accuracy =
      sessionScore.total > 0
        ? Math.round((sessionScore.correct / sessionScore.total) * 100)
        : 100;

    const todayDateStr = new Date().toISOString().split('T')[0];
    const dailyXpGoal = userStats.dailyXpGoal || 50;
    const currentTodayXp =
      userStats.dailyXpHistory?.[todayDateStr] ??
      Math.max(0, userStats.todayExercisesDone * 15);
    const hasMetDailyGoal = currentTodayXp + sessionScore.xp >= dailyXpGoal;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-xl border border-slate-200 dark:border-slate-800 transition-colors animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">
            Tuyệt vời! Hoàn thành xuất sắc!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            Bạn đã nỗ lực hoàn thành bài luyện tập &quot;{title}&quot; hôm nay.
          </p>

          {/* Daily Goal Reached Celebratory Card if achieved */}
          {hasMetDailyGoal && (
            <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/80 text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2 text-left">
                <Trophy className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-800 dark:text-emerald-200 block">
                    Daily Goal Reached! 🎉
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Đã cán mốc {dailyXpGoal} XP mục tiêu hôm nay
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => playDingSound()}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
                title="Nghe tiếng chuông ăn mừng! 🔔"
              >
                <Volume2 className="w-3 h-3" /> Ding!
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 rounded-xl p-4 mb-4">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Điểm XP</span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                +{sessionScore.xp}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Chính xác</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {accuracy}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Đã hoàn tất</span>
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                {sessionScore.total} câu
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => playTadaSound()}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Nghe lại âm thanh chiến thắng (Ta-da!)"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Phát lại âm thanh hoàn thành (Ta-da!)</span>
            </button>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onFinish({
                total: sessionScore.total,
                correct: sessionScore.correct,
                earnedXp: sessionScore.xp,
                exerciseType: currentExercise?.type || 'mixed',
              });
            }}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            Lưu Kết Quả & Tiếp Tục
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / exercises.length) * 100);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto transition-colors">
        {/* Header with Progress */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Thoát bài tập"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider block">
                {title}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Câu {currentIndex + 1} / {exercises.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 rounded-md font-mono tabular-nums">
              +{sessionScore.xp} XP
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Exercise Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col">
          {/* 1. FLASHCARD MODE */}
          {currentExercise.type === 'flashcard' && (
            <div className="flex flex-col items-center justify-center flex-1 py-4">
              <div className="text-center mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Thẻ Từ Vựng Tương Tác
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Bấm vào thẻ để lật xem nghĩa tiếng Việt và câu ví dụ
                </p>
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-md h-64 sm:h-72 rounded-2xl p-6 sm:p-8 cursor-pointer select-none transition-all duration-300 flex flex-col justify-between relative shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-linear-to-b from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900"
              >
                {!isFlipped ? (
                  // Front Side
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                      {currentExercise.partOfSpeech}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                      {currentExercise.word}
                    </h3>
                    <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-4">
                      {currentExercise.ipa}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(currentExercise.word || '', 0.95);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                          activeSpeed === 0.95
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900'
                        }`}
                      >
                        <Volume2 className={`w-4 h-4 ${activeSpeed === 0.95 ? 'animate-pulse' : ''}`} />
                        <span>{activeSpeed === 0.95 ? 'Đang đọc...' : 'Nghe chuẩn'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(currentExercise.word || '', 0.7);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                          activeSpeed === 0.7
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-200 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${activeSpeed === 0.7 ? 'animate-pulse' : ''}`} />
                        <span>{activeSpeed === 0.7 ? 'Đang đọc 0.7x...' : '0.7x Chậm'}</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-6 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Chạm để lật thẻ
                    </span>
                  </div>
                ) : (
                  // Back Side
                  <div className="flex flex-col justify-between h-full text-left">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Định Nghĩa & Ý Nghĩa
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                          {currentExercise.word}
                        </span>
                      </div>
                      <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        {currentExercise.definitionVi}
                      </h4>

                      <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700 mt-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                            &ldquo;{currentExercise.exampleEn}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAudio(currentExercise.exampleEn || '', 0.9);
                            }}
                            className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 shrink-0"
                            title="Nghe câu ví dụ"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          {currentExercise.exampleVi}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
                      <span>Bấm lại để xem mặt trước</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentExercise.word) {
                            onToggleSaveWord({
                              id: `word-${currentExercise.word}`,
                              word: currentExercise.word,
                              ipa: currentExercise.ipa || '',
                              partOfSpeech: currentExercise.partOfSpeech || 'n',
                              meaningVi: currentExercise.definitionVi || '',
                              exampleEn: currentExercise.exampleEn || '',
                              exampleVi: currentExercise.exampleVi || '',
                              level: currentExercise.level,
                              topic: currentExercise.topic,
                              mastered: false,
                              reviewCount: 1,
                              lastReviewedAt: new Date().toISOString().split('T')[0],
                              nextReviewDate: computeNextReviewDate(getTodayDateString(), 0, 0), // Day 1 review
                            });
                          }
                        }}
                        className={`flex items-center gap-1 font-semibold ${
                          isWordSaved(currentExercise.word)
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        {isWordSaved(currentExercise.word) ? (
                          <>
                            <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                            <span>Đã lưu sổ tay</span>
                          </>
                        ) : (
                          <>
                            <BookMarked className="w-4 h-4" />
                            <span>Lưu từ này</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Flashcard */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-6">
                <button
                  type="button"
                  onClick={() => handleFlashcardReview(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Cần Ôn Lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFlashcardReview(true)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Đã Nhớ (+15 XP)</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. WORD REORDER MODE */}
          {currentExercise.type === 'word-reorder' && (
            <div className="flex flex-col flex-1">
              <div className="mb-4">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Sắp Xếp Từ Tạo Thành Câu Đúng
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {currentExercise.vietnamesePrompt}
                </p>
              </div>

              {/* Construction Zone */}
              <div className="min-h-24 sm:min-h-28 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850/60 mb-5 flex flex-wrap items-center gap-2 content-start">
                {selectedWords.length === 0 ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Chạm các từ bên dưới theo đúng thứ tự ngữ pháp...
                  </span>
                ) : (
                  selectedWords.map((word, idx) => (
                    <button
                      key={`${word}-${idx}`}
                      type="button"
                      onClick={() => handleDeselectWord(idx)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-medium text-sm shadow-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:border-red-800 dark:hover:text-red-300 transition-colors animate-in fade-in zoom-in-95 duration-150"
                    >
                      {word}
                    </button>
                  ))
                )}
              </div>

              {/* Word Pool */}
              <div className="flex flex-wrap gap-2 mb-6">
                {availableWords.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectWord(item)}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-medium text-sm border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs active:scale-95"
                  >
                    {item.word}
                  </button>
                ))}
              </div>

              {/* Grammar Tip or Result Feedback */}
              {reorderStatus === 'correct' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 mb-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Chính xác tuyệt vời! (+15 XP)</span>
                  </div>
                  {currentExercise.grammarTip && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      💡 <strong>Mẹo ngữ pháp:</strong> {currentExercise.grammarTip}
                    </p>
                  )}
                </div>
              )}

              {reorderStatus === 'wrong' && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 mb-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm mb-1">
                    <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Chưa chính xác, hãy thử lại!</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    Gợi ý: Hãy chú ý cấu trúc Chủ ngữ + Trạng từ + Động từ + Tân ngữ.
                  </p>
                </div>
              )}

              {/* Footer Controls */}
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (currentExercise.scrambledWords) {
                      setSelectedWords([]);
                      setAvailableWords(
                        currentExercise.scrambledWords.map((w, i) => ({
                          id: `${w}-${i}-${Date.now()}`,
                          word: w,
                        }))
                      );
                      setReorderStatus('idle');
                    }
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Làm lại từ đầu
                </button>

                {reorderStatus !== 'correct' ? (
                  <button
                    type="button"
                    disabled={selectedWords.length === 0}
                    onClick={handleCheckReorder}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Kiểm Tra
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={advanceExercise}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                  >
                    <span>Tiếp Tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. LISTENING CLOZE MODE */}
          {currentExercise.type === 'listening-cloze' && (
            <div className="flex flex-col flex-1">
              <div className="mb-4">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Luyện Nghe & Điền Từ
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentExercise.vietnamesePrompt}
                </p>
              </div>

              {/* Audio Playback Controls */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 mb-6 transition-colors">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentExercise.audioText || '', 0.95)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 ${
                      activeSpeed === 0.95
                        ? 'bg-indigo-700 text-white ring-4 ring-indigo-300 dark:ring-indigo-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    title="Phát âm thanh tốc độ chuẩn 1.0x"
                  >
                    <Volume2 className={`w-7 h-7 ${activeSpeed === 0.95 ? 'animate-pulse' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentExercise.audioText || '', 0.7)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                      activeSpeed === 0.7
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-200 font-bold'
                        : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-750'
                    }`}
                    title="Phát chậm 0.7x để bắt rõ từng âm"
                  >
                    <Volume2 className={`w-4 h-4 ${activeSpeed === 0.7 ? 'animate-pulse' : ''}`} />
                    <span>{activeSpeed === 0.7 ? 'Đang đọc 0.7x...' : '0.7x Tốc độ chậm'}</span>
                  </button>
                </div>
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  {isPlayingAudio
                    ? activeSpeed === 0.7
                      ? '🔊 Đang phát chậm 0.7x...'
                      : '🔊 Đang phát tốc độ chuẩn...'
                    : 'Chạm nút để nghe lại câu'}
                </span>
              </div>

              {/* Sentence with blank */}
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl mb-6">
                <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentExercise.fullSentenceEn?.split(currentExercise.blankWord || '')[0]}
                  <span className="inline-block px-3 py-0.5 mx-1 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/80 rounded">
                    {selectedOption || '_______'}
                  </span>
                  {currentExercise.fullSentenceEn?.split(currentExercise.blankWord || '')[1]}
                </p>
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {currentExercise.options?.map((opt) => {
                  const isSelected = selectedOption === opt;
                  const isAnswer = opt.toLowerCase() === (currentExercise.blankWord || '').toLowerCase();

                  let style = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-200';
                  if (clozeStatus !== 'idle') {
                    if (isAnswer) {
                      style = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold';
                    } else if (isSelected && !isAnswer) {
                      style = 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 text-rose-800 dark:text-rose-300 line-through';
                    } else {
                      style = 'opacity-50 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={clozeStatus !== 'idle'}
                      onClick={() => handleSelectClozeOption(opt)}
                      className={`p-3.5 rounded-xl border text-sm font-semibold transition-all text-center ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback & Translation */}
              {clozeStatus !== 'idle' && (
                <div
                  className={`p-4 rounded-xl border mb-4 animate-in fade-in ${
                    clozeStatus === 'correct'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <p className="text-xs font-bold mb-1">
                    {clozeStatus === 'correct' ? '✓ Chính xác (+15 XP)' : '✕ Chưa đúng'}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <strong>Dịch nghĩa:</strong> &ldquo;{currentExercise.fullSentenceVi}&rdquo;
                  </p>
                </div>
              )}

              {/* Bottom Advance button */}
              {clozeStatus !== 'idle' && (
                <div className="mt-auto flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={advanceExercise}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                  >
                    <span>Tiếp Tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. SPEAKING MODE */}
          {currentExercise.type === 'speaking' && (
            <div className="flex flex-col flex-1">
              <div className="mb-4">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Luyện Phát Âm Trực Tiếp
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentExercise.vietnamesePrompt}
                </p>
              </div>

              {/* Target Phrase Box */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center mb-6">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  &ldquo;{currentExercise.speakingTarget}&rdquo;
                </p>
                {currentExercise.speakingPhonetic && (
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
                    {currentExercise.speakingPhonetic}
                  </p>
                )}

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentExercise.speakingTarget || '', 0.95)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      activeSpeed === 0.95
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900'
                    }`}
                  >
                    <Volume2 className={`w-4 h-4 ${activeSpeed === 0.95 ? 'animate-pulse' : ''}`} />
                    <span>{activeSpeed === 0.95 ? 'Đang đọc...' : 'Nghe câu mẫu'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentExercise.speakingTarget || '', 0.7)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      activeSpeed === 0.7
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750'
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${activeSpeed === 0.7 ? 'animate-pulse' : ''}`} />
                    <span>{activeSpeed === 0.7 ? 'Đang đọc 0.7x...' : '0.7x Nghe chậm'}</span>
                  </button>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex flex-col items-center justify-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleToggleRecord}
                  className={`w-18 h-18 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-800'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={isRecording ? 'Dừng ghi âm' : 'Bắt đầu nói'}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isRecording ? 'Đang lắng nghe giọng bạn...' : 'Bấm mic và đọc to câu trên'}
                </span>
              </div>

              {/* Speech Result / Fallback */}
              {spokenTranscript && (
                <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center mb-4">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Giọng nói nhận diện được:</span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                    &ldquo;{spokenTranscript}&rdquo;
                  </p>
                </div>
              )}

              {speakingScore !== null && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 mb-4 text-center">
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mb-1">
                    {speakingScore}% Chuẩn Xác
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    {speakingScore >= 80
                      ? 'Xuất sắc! Phát âm rất tự nhiên và rõ ràng.'
                      : 'Khá tốt! Hãy chú ý ngữ điệu và trọng âm câu.'}
                  </p>
                </div>
              )}

              {/* Speaking Hint */}
              {currentExercise.speakingHint && (
                <div className="flex items-start gap-2 p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-850 rounded-xl text-xs text-amber-900 dark:text-amber-200 mb-4">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>{currentExercise.speakingHint}</span>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSelfVerifySpeaking}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                >
                  Tôi đã tự đọc to (+15 XP)
                </button>

                {speakingScore !== null ? (
                  <button
                    type="button"
                    onClick={advanceExercise}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                  >
                    <span>Tiếp Tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={advanceExercise}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    Bỏ qua câu này
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. QUIZ MODE */}
          {currentExercise.type === 'quiz' && (
            <div className="flex flex-col flex-1">
              <div className="mb-4">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Trắc Nghiệm Tình Huống
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {currentExercise.questionEn}
                </h3>
                {currentExercise.questionVi && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                    {currentExercise.questionVi}
                  </p>
                )}
              </div>

              {/* 4 Quiz Options with explanatory breakdown */}
              <div className="flex flex-col gap-3 mb-6">
                {currentExercise.quizOptions?.map((opt) => {
                  const isSelected = selectedQuizOpt === opt.id;
                  let cardStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-200';

                  if (quizSubmitted) {
                    if (opt.isCorrect) {
                      cardStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200';
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200';
                    } else {
                      cardStyle = 'opacity-60 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';
                    }
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectQuizOption(opt.id)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${cardStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{opt.text}</span>
                        {quizSubmitted && opt.isCorrect && (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            Chính xác
                          </span>
                        )}
                      </div>

                      {quizSubmitted && isSelected && (
                        <p className="text-xs mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 leading-relaxed">
                          💡 {opt.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Advance Button */}
              {quizSubmitted && (
                <div className="mt-auto flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={advanceExercise}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                  >
                    <span>Tiếp Tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. DIALOGUE MODE */}
          {currentExercise.type === 'dialogue' && (
            <div className="flex flex-col flex-1">
              <div className="mb-4">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Hội Thoại Tương Tác
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentExercise.dialogueContext}
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-6 overflow-y-auto max-h-80 p-2">
                {currentExercise.dialogueLines?.map((line, idx) => (
                  <div
                    key={idx}
                    onClick={() => handlePlayAudio(line.en)}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-colors"
                  >
                    <span className="text-2xl select-none">{line.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{line.speaker}</span>
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {line.en}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                        {line.vi}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const fullText = currentExercise.dialogueLines?.map((l) => l.en).join('. ');
                    if (fullText) handlePlayAudio(fullText);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe Toàn Bộ Hội Thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setSessionScore((prev) => ({
                      correct: prev.correct + 1,
                      total: prev.total + 1,
                      xp: prev.xp + 20,
                    }));
                    advanceExercise();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  <span>Hoàn Tất (+20 XP)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
