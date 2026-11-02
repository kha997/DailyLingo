export type ExerciseType =
  | 'flashcard'
  | 'word-reorder'
  | 'listening-cloze'
  | 'speaking'
  | 'quiz'
  | 'dialogue';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'IELTS_TOEIC';

export type TopicCategory =
  | 'daily'
  | 'travel'
  | 'work'
  | 'food'
  | 'tech'
  | 'social';

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  level: CEFRLevel;
  topic: TopicCategory;
  title: string;
  vietnamesePrompt: string;
  explanation?: string;

  // Flashcard specific
  word?: string;
  ipa?: string;
  partOfSpeech?: string;
  definitionVi?: string;
  exampleEn?: string;
  exampleVi?: string;

  // Word reorder specific
  targetSentence?: string;
  scrambledWords?: string[];
  grammarTip?: string;

  // Listening Cloze specific
  audioText?: string;
  blankWord?: string;
  options?: string[];
  fullSentenceEn?: string;
  fullSentenceVi?: string;

  // Quiz specific
  questionEn?: string;
  questionVi?: string;
  quizOptions?: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];

  // Speaking specific
  speakingTarget?: string;
  speakingPhonetic?: string;
  speakingHint?: string;

  // Dialogue specific
  dialogueContext?: string;
  dialogueLines?: {
    speaker: string;
    avatar: string;
    en: string;
    vi: string;
  }[];
}

export interface SavedWord {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  level: CEFRLevel;
  topic: TopicCategory;
  mastered: boolean;
  reviewCount: number;
  lastReviewedAt: string;
  nextReviewDate: string; // YYYY-MM-DD - spaced repetition schedule
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockedAt: string | null;
  targetCount: number;
  currentCount: number;
}

export interface UserStats {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  studyDays: string[]; // YYYY-MM-DD
  todayExercisesDone: number;
  dailyGoal: number; // e.g. 5, 10, 15
  dailyXpGoal?: number; // e.g. 30, 50, 100 XP
  totalExercisesCompleted: number;
  correctAnswersCount: number;
  /** Answers that were actually graded (excludes dialogue/self-verified speaking). */
  gradedAnswersCount?: number;
  gradedCorrectCount?: number;
  timeSpentMinutes: number;
  skillMastery: {
    vocabulary: number; // 0 - 100
    grammar: number;
    listening: number;
    speaking: number;
  };
  audioAccent: 'en-US' | 'en-GB';
  audioRate: number; // 0.8 - 1.2
  theme?: 'light' | 'dark' | 'system';
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:mm format, e.g. "20:00"
  lastReminderSentDate?: string | null;
  dailyXpHistory?: Record<string, number>; // YYYY-MM-DD -> XP earned
}

export interface LessonUnit {
  id: string;
  title: string;
  subtitle: string;
  level: CEFRLevel;
  topic: TopicCategory;
  image?: string;
  estimatedMinutes: number;
  exercises: ExerciseItem[];
}

export type SkillKey = keyof UserStats['skillMastery'];

export interface SkillScore {
  correct: number;
  total: number;
}

/**
 * The single source of truth for one finished practice session.
 *
 * `total`/`correct` only count graded answers. `completed` also includes
 * unscored activities (dialogue, self-verified speaking) so progress can be
 * honest without inflating accuracy.
 */
export interface SessionResult {
  total: number;
  correct: number;
  completed: number;
  earnedXp: number;
  exerciseType: string;
  /** Saved words the learner marked “đã nhớ”. */
  reviewedWords: string[];
  /** Saved words the learner marked “cần ôn lại”. */
  struggledWords?: string[];
  skillBreakdown: Partial<Record<SkillKey, SkillScore>>;
  durationSeconds: number;
  speakingBestScore: number | null;
  speakingAttempts: number;
}
