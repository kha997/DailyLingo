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
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '../utils/motion.ts';
import { ExerciseItem, SavedWord, UserStats, SessionResult, SkillKey, SkillScore } from '../types/index.ts';
import { speakEnglish, calculateSimilarity, SpeechRecognizer } from '../utils/speech.ts';
import { computeNextReviewDate } from '../data/curriculumData.ts';
import { getTodayDateString } from '../utils/storage.ts';
import {
  playPopSound,
  playTadaSound,
  playWrongSound,
  playClickSound,
} from '../utils/audioEffects.ts';

export type { SessionResult, SkillScore, SkillKey } from '../types/index.ts';

interface ExerciseRunnerProps {
  exercises: ExerciseItem[];
  title: string;
  onFinish: (result: SessionResult) => void;
  onClose: () => void;
  savedWords: SavedWord[];
  onToggleSaveWord: (word: SavedWord) => void;
  userStats: UserStats;
}

const SKILL_BY_TYPE: Record<string, SkillKey> = {
  flashcard: 'vocabulary',
  'word-reorder': 'grammar',
  'listening-cloze': 'listening',
  speaking: 'speaking',
  quiz: 'grammar',
  dialogue: 'listening',
};

interface ScoreState {
  correct: number;
  total: number;
  xp: number;
  skills: Partial<Record<SkillKey, SkillScore>>;
}

const emptyScore = (): ScoreState => ({ correct: 0, total: 0, xp: 0, skills: {} });

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
  const [sessionScore, setSessionScore] = useState<ScoreState>(emptyScore);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<SessionResult | null>(null);

  const scoreRef = useRef<ScoreState>(emptyScore());
  const resolvedIdsRef = useRef<Set<string>>(new Set());
  const completedIdsRef = useRef<Set<string>>(new Set());
  const completedCountRef = useRef(0);
  const reviewedWordsRef = useRef<string[]>([]);
  const struggledWordsRef = useRef<string[]>([]);
  const startedAtRef = useRef(Date.now());
  const speakingAttemptsRef = useRef(0);
  const speakingBestRef = useRef<number | null>(null);
  const speakingScoredRef = useRef(false);
  const activeSpeechExerciseRef = useRef<string | null>(null);

  // Exercise Specific States
  // Flashcard
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [flashcardHint, setFlashcardHint] = useState(false);

  // Word reorder
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<{ id: string; word: string }[]>([]);
  const [reorderStatus, setReorderStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [reorderAttempts, setReorderAttempts] = useState(0);
  const [reorderRevealed, setReorderRevealed] = useState(false);

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
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentExercise = exercises[currentIndex];

  const handleClose = () => {
    activeSpeechExerciseRef.current = null;
    recognizerRef.current?.abort();
    setIsRecording(false);
    onClose();
  };

  // Closing mid-session throws away every answer in this run (only a finished
  // session is persisted). Warn before doing that silently.
  const requestClose = () => {
    if (completedCountRef.current > 0 || scoreRef.current.total > 0) {
      setShowExitConfirm(true);
      return;
    }
    handleClose();
  };

  const recordAnswer = (skill: SkillKey, correct: boolean, xp: number) => {
    const exerciseId = currentExercise?.id;
    if (exerciseId && resolvedIdsRef.current.has(exerciseId)) return;
    if (exerciseId) resolvedIdsRef.current.add(exerciseId);

    const next = scoreRef.current;
    next.total += 1;
    if (correct) next.correct += 1;
    next.xp += xp;
    const skillScore = next.skills[skill] ?? { correct: 0, total: 0 };
    skillScore.total += 1;
    if (correct) skillScore.correct += 1;
    next.skills[skill] = skillScore;
    setSessionScore({
      correct: next.correct,
      total: next.total,
      xp: next.xp,
      skills: { ...next.skills },
    });
  };

  const markCompleted = () => {
    const exerciseId = currentExercise?.id;
    if (!exerciseId) return;
    // Retrying a wrong answer must not count the exercise twice.
    if (completedIdsRef.current.has(exerciseId)) return;
    completedIdsRef.current.add(exerciseId);
    completedCountRef.current += 1;
  };

  const buildResult = (): SessionResult => {
    const types = new Set(exercises.map((e) => e.type));
    return {
      total: scoreRef.current.total,
      correct: scoreRef.current.correct,
      completed: completedCountRef.current,
      earnedXp: scoreRef.current.xp,
      exerciseType: types.size === 1 ? [...types][0] : 'mixed',
      reviewedWords: [...reviewedWordsRef.current],
      struggledWords: [...struggledWordsRef.current],
      skillBreakdown: { ...scoreRef.current.skills },
      durationSeconds: Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)),
      speakingBestScore: speakingBestRef.current,
      speakingAttempts: speakingAttemptsRef.current,
    };
  };

  // Initialize current exercise
  useEffect(() => {
    if (!currentExercise) return;

    // Any microphone session belongs to the exercise we just left. Reset the
    // per-exercise speaking latch and abort the recogniser so lingering audio
    // cannot score the next item.
    speakingScoredRef.current = false;
    activeSpeechExerciseRef.current = null;
    recognizerRef.current?.abort();
    setIsRecording(false);

    setIsFlipped(false);
    setHasFlipped(false);
    setFlashcardHint(false);
    setSelectedOption(null);
    setClozeStatus('idle');
    setSelectedQuizOpt(null);
    setQuizSubmitted(false);
    setSpokenTranscript('');
    setSpeakingScore(null);
    setSpeakingMatches([]);
    setSpeakingError(null);
    setReorderStatus('idle');
    setReorderAttempts(0);
    setReorderRevealed(false);
    setIsRecording(false);

    if (currentExercise.type === 'word-reorder' && currentExercise.scrambledWords) {
      setSelectedWords([]);
      const wordsWithIds = currentExercise.scrambledWords.map((w, i) => ({
        id: `${w}-${i}-${currentExercise.id}`,
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

  // Stop the microphone when the runner unmounts or the tab closes.
  useEffect(() => {
    return () => {
      recognizerRef.current?.abort();
    };
  }, []);

  // Keep the recognizer accent in sync with settings.
  useEffect(() => {
    recognizerRef.current?.setAccent(userStats.audioAccent);
  }, [userStats.audioAccent]);

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

  const handleFlipCard = () => {
    playClickSound();
    setIsFlipped((prev) => {
      const next = !prev;
      if (next) setHasFlipped(true);
      return next;
    });
    setFlashcardHint(false);
  };

  const handleFlashcardReview = (understood: boolean) => {
    playClickSound();
    if (!hasFlipped) {
      setFlashcardHint(true);
      return;
    }
    const gained = understood ? 15 : 0;
    if (understood) playPopSound();

    recordAnswer('vocabulary', understood, gained);
    if (currentExercise?.word) {
      if (understood) reviewedWordsRef.current.push(currentExercise.word);
      else struggledWordsRef.current.push(currentExercise.word);
    }
    markCompleted();
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
      recordAnswer('grammar', true, 15);
      markCompleted();
    } else {
      playWrongSound();
      const attempt = reorderAttempts + 1;
      setReorderAttempts(attempt);
      setReorderStatus('wrong');
      if (attempt >= 2) {
        // Two failed attempts: show the answer and record the exercise once.
        setReorderRevealed(true);
        recordAnswer('grammar', false, 0);
        markCompleted();
      }
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
      recordAnswer('listening', true, 15);
    } else {
      playWrongSound();
      setClozeStatus('wrong');
      recordAnswer('listening', false, 0);
    }
    markCompleted();
  };

  // Handle Speaking practice
  const handleToggleRecord = () => {
    if (!recognizerRef.current) {
      recognizerRef.current = new SpeechRecognizer(userStats.audioAccent);
    }
    const recognizer = recognizerRef.current;

    // If speech recognition is not supported, show a friendly message and return
    if (!recognizer.isSupported) {
      setSpeakingError(
        'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Hãy dùng Chrome hoặc Edge, hoặc bấm "Tôi đã đọc to" để tiếp tục mà không chấm điểm.'
      );
      setIsRecording(false);
      return;
    }

    if (isRecording) {
      recognizer.stopListening();
      setIsRecording(false);
      return;
    }

    if (speakingScoredRef.current) {
      setSpeakingError('Câu này đã được chấm. Hãy bấm "Tiếp Tục" để sang câu kế tiếp.');
      return;
    }

    setSpeakingError(null);
    setSpokenTranscript('');
    setSpeakingScore(null);
    setIsRecording(true);
    playClickSound();

    // Pin the callback to the exercise that started it. A late `onresult` from
    // an aborted or previous exercise must never score (or write a transcript
    // onto) the item now on screen.
    const startedForId = currentExercise.id;
    activeSpeechExerciseRef.current = startedForId;

    recognizer.startListening(
      (res) => {
        if (activeSpeechExerciseRef.current !== startedForId) return;
        setSpokenTranscript(res.transcript);
        if (
          res.isFinal &&
          res.finalTranscript &&
          currentExercise.speakingTarget &&
          !speakingScoredRef.current
        ) {
          const evalResult = calculateSimilarity(
            res.finalTranscript,
            currentExercise.speakingTarget
          );
          speakingScoredRef.current = true;
          speakingAttemptsRef.current += 1;
          speakingBestRef.current = Math.max(speakingBestRef.current ?? 0, evalResult.score);
          setSpeakingScore(evalResult.score);
          setSpeakingMatches(evalResult.matches);
          setIsRecording(false);

          const passed = evalResult.score >= 70;
          if (passed) playPopSound();
          else playWrongSound();
          recordAnswer('speaking', passed, passed ? 20 : 0);
          markCompleted();
        }
      },
      (err) => {
        if (activeSpeechExerciseRef.current !== startedForId) return;
        if (err) setSpeakingError(err);
        setIsRecording(false);
      },
      () => {
        if (activeSpeechExerciseRef.current !== startedForId) return;
        setIsRecording(false);
      }
    );
  };

  // Honest fallback when a learner cannot or does not want to use the microphone.
  // It advances the session without inventing a score or XP.
  const handleSelfVerifySpeaking = () => {
    playClickSound();
    speakingScoredRef.current = true;
    markCompleted();
    advanceExercise();
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
      recordAnswer('grammar', true, 15);
    } else {
      playWrongSound();
      recordAnswer('grammar', false, 0);
    }
    markCompleted();
  };

  // Advance to next exercise or complete
  const advanceExercise = () => {
    // Never carry a live microphone (or its late result) into the next item.
    activeSpeechExerciseRef.current = null;
    recognizerRef.current?.abort();
    setIsRecording(false);

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all! Snapshot refs so the summary and persisted result agree.
      const result = buildResult();
      setFinalResult(result);
      setIsCompleted(true);
      playTadaSound();

      try {
        if (!prefersReducedMotion()) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch {
        // Ignore
      }
    }
  };

  // If session is completed, show celebration card
  if (isCompleted) {
    const result = finalResult ?? buildResult();
    const accuracy =
      result.total > 0 ? Math.round((result.correct / result.total) * 100) : null;
    const minutes = Math.floor(result.durationSeconds / 60);
    const seconds = result.durationSeconds % 60;
    const durationLabel = minutes > 0 ? `${minutes} phút ${seconds} giây` : `${seconds} giây`;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-xl border border-slate-200 dark:border-slate-800 transition-colors animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">
            Hoàn thành bài luyện tập!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            Bạn đã hoàn tất &quot;{title}&quot; trong {durationLabel}.
          </p>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 rounded-xl p-4 mb-3">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Điểm XP</span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                +{result.earnedXp}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Chính xác</span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                {accuracy === null ? '—' : `${accuracy}%`}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Đã hoàn tất</span>
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                {result.completed}/{exercises.length}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            {result.total > 0 ? (
              <>
                Độ chính xác chỉ tính {result.total} câu được chấm điểm.
                {result.completed > result.total && (
                  <> {result.completed - result.total} câu tự đánh giá hoặc hội thoại không tính điểm.</>
                )}
              </>
            ) : (
              'Bài này không có câu trả lời được chấm điểm, nên không hiển thị độ chính xác.'
            )}
          </p>

          {result.speakingBestScore !== null && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Khớp câu mẫu tốt nhất khi nói: <strong>{result.speakingBestScore}%</strong>
              {result.speakingAttempts > 1 && <> · {result.speakingAttempts} lượt đọc</>}
            </p>
          )}

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
              onFinish(result);
            }}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            Lưu Kết Quả & Tiếp Tục
          </button>
        </div>
      </div>
    );
  }

  // Session config can legitimately produce zero exercises. Never render the
  // exercise UI with an undefined current item.
  if (!currentExercise) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Chưa có bài tập phù hợp
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            Không tìm thấy bài tập nào cho lựa chọn này. Hãy đổi chủ đề hoặc cấp độ rồi thử lại.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / exercises.length) * 100);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 dark:bg-black/80 flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-confirm-title"
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 id="exit-confirm-title" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Thoát khi chưa lưu?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Các câu đã làm trong lượt này chưa được lưu. Nếu thoát bây giờ, XP và kết quả
              của lượt này sẽ bị bỏ.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
              >
                Ở lại làm tiếp
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors"
              >
                Thoát và bỏ lượt này
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        data-testid="exercise-runner"
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto transition-colors"
      >
        {/* Header with Progress */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={requestClose}
              aria-label="Thoát bài tập"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bấm vào thẻ để lật xem nghĩa tiếng Việt và câu ví dụ
                </p>
              </div>

              {/* 3D Flip Card */}
              <div
                role="button"
                tabIndex={0}
                aria-label={isFlipped ? 'Lật lại mặt trước của thẻ' : 'Lật thẻ để xem nghĩa'}
                onClick={handleFlipCard}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFlipCard();
                  }
                }}
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

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-6 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Chạm để lật thẻ
                    </span>
                  </div>
                ) : (
                  // Back Side
                  <div className="flex flex-col justify-between h-full text-left">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Định Nghĩa & Ý Nghĩa
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
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

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
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
                              lastReviewedAt: getTodayDateString(),
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
              {flashcardHint && !hasFlipped && (
                <p className="mt-4 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg px-3 py-2">
                  Hãy lật thẻ để xem nghĩa trước khi tự đánh giá.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-6">
                <button
                  type="button"
                  disabled={!hasFlipped}
                  title={hasFlipped ? 'Đánh dấu từ cần ôn lại' : 'Lật thẻ trước'}
                  onClick={() => handleFlashcardReview(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Cần Ôn Lại</span>
                </button>
                <button
                  type="button"
                  disabled={!hasFlipped}
                  title={hasFlipped ? 'Đánh dấu đã nhớ' : 'Lật thẻ trước'}
                  onClick={() => handleFlashcardReview(true)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Đã Nhớ (+15 XP)</span>
                </button>
              </div>
              <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-md">
                Đây là tự đánh giá của bạn; hệ thống không kiểm tra phát âm hay trí nhớ.
              </p>
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
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Chạm các từ bên dưới theo đúng thứ tự ngữ pháp...
                  </span>
                ) : (
                  selectedWords.map((word, idx) => (
                    <button
                      key={`${word}-${idx}`}
                      type="button"
                      disabled={reorderRevealed}
                      onClick={() => handleDeselectWord(idx)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-medium text-sm shadow-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:border-red-800 dark:hover:text-red-300 transition-colors animate-in fade-in zoom-in-95 duration-150 disabled:cursor-not-allowed"
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
                    disabled={reorderRevealed}
                    onClick={() => handleSelectWord(item)}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 dark:text-slate-200 font-medium text-sm border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs active:scale-95"
                  >
                    {item.word}
                  </button>
                ))}
              </div>

              {/* Grammar Tip or Result Feedback */}
              {reorderStatus === 'correct' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 mb-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1">
                    <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
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
                    <span>{reorderRevealed ? 'Đã hết 2 lượt thử' : 'Chưa chính xác, hãy thử lại!'}</span>
                  </div>
                  {reorderRevealed ? (
                    <p className="text-xs text-rose-800 dark:text-rose-200">
                      Đáp án đúng: <strong>{currentExercise.targetSentence}</strong>
                    </p>
                  ) : (
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      Gợi ý: Hãy chú ý cấu trúc Chủ ngữ + Trạng từ + Động từ + Tân ngữ.
                    </p>
                  )}
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
                      setReorderRevealed(false);
                    }
                  }}
                  disabled={reorderRevealed}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Làm lại từ đầu
                </button>

                {reorderStatus === 'correct' || reorderRevealed ? (
                  <button
                    type="button"
                    onClick={advanceExercise}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                  >
                    <span>Tiếp Tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={selectedWords.length === 0}
                    onClick={handleCheckReorder}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Kiểm Tra
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
                  {(() => {
                    const sentence = currentExercise.fullSentenceEn || '';
                    const blank = currentExercise.blankWord || '';
                    if (!blank) return sentence;
                    const [before, ...rest] = sentence.split(blank);
                    return (
                      <>
                        {before}
                        <span className="inline-block px-3 py-0.5 mx-1 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/80 rounded">
                          {selectedOption || '_______'}
                        </span>
                        {rest.join(blank)}
                      </>
                    );
                  })()}
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
                  Luyện Nói Theo Câu Mẫu
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentExercise.vietnamesePrompt}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Điểm số là mức khớp giữa văn bản nhận diện được và câu mẫu, không phải điểm phát âm.
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
                  disabled={speakingScore !== null}
                  aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu nói'}
                  className={`w-18 h-18 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-800'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={
                    speakingScore !== null
                      ? 'Câu này đã được chấm'
                      : isRecording
                        ? 'Dừng ghi âm'
                        : 'Bắt đầu nói'
                  }
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {speakingScore !== null
                    ? 'Đã chấm xong câu này'
                    : isRecording
                      ? 'Đang lắng nghe giọng bạn...'
                      : 'Bấm mic và đọc to câu trên'}
                </span>
              </div>

              {speakingError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{speakingError}</span>
                </div>
              )}

              {/* Speech Result / Fallback */}
              {spokenTranscript && (
                <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center mb-4">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Giọng nói nhận diện được:</span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                    &ldquo;{spokenTranscript}&rdquo;
                  </p>
                </div>
              )}

              {speakingScore !== null && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 mb-4 text-center">
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mb-1">
                    {speakingScore}% khớp câu mẫu
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    {speakingScore >= 80
                      ? 'Rất khớp! Hệ thống nhận diện được gần như toàn bộ câu mẫu.'
                      : 'Chưa khớp hoàn toàn. Hãy nghe lại câu mẫu và đọc rõ từng từ.'}
                  </p>
                  {speakingMatches.length > 0 && currentExercise.speakingTarget && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {currentExercise.speakingTarget.split(/\s+/).map((word, idx) => (
                        <span
                          key={`${word}-${idx}`}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            speakingMatches[idx]
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                              : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 line-through'
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
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
                  Tôi đã tự đọc to (không chấm điểm)
                </button>

                {speakingScore !== null ? (
                  <button
                    type="button"
                    onClick={advanceExercise}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
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
                    <button
                      key={opt.id}
                      type="button"
                      disabled={quizSubmitted}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectQuizOption(opt.id)}
                      className={`p-4 rounded-xl border text-left text-sm font-medium transition-all disabled:cursor-default ${cardStyle}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{opt.text}</span>
                        {quizSubmitted && opt.isCorrect && (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded shrink-0">
                            Chính xác
                          </span>
                        )}
                        {quizSubmitted && isSelected && !opt.isCorrect && (
                          <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded shrink-0">
                            Bạn chọn
                          </span>
                        )}
                      </div>

                      {quizSubmitted && (isSelected || opt.isCorrect) && (
                        <p className="text-xs mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 leading-relaxed">
                          💡 {opt.explanation}
                        </p>
                      )}
                    </button>
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
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePlayAudio(line.en)}
                    className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-colors"
                    title="Nghe câu này"
                  >
                    <span className="text-2xl select-none" aria-hidden="true">{line.avatar}</span>
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
                  </button>
                ))}
              </div>

              <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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

                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      markCompleted();
                      advanceExercise();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                  >
                    <span>Hoàn Tất Hội Thoại</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Hội thoại không tính điểm hay XP
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
