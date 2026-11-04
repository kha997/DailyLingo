import {
  CEFRLevel,
  ExerciseItem,
  ExerciseType,
  TopicCategory,
} from '../types/index.ts';
import { LESSON_UNITS } from '../data/curriculumData.ts';

/**
 * Custom practice is assembled from the same reviewed curriculum bank that
 * powers the lessons. There is no model call, no generated content and no
 * inference at runtime — only deterministic selection, so every exercise a
 * learner sees has been reviewed as part of the 12 units.
 */

export type SkillFocus = 'all' | 'speaking' | 'reorder' | 'listening' | 'quiz' | 'flashcard';

export interface PracticeRequest {
  topic: string;
  level: CEFRLevel;
  skillFocus: SkillFocus;
  questionCount: number;
  seed?: number;
}

export interface PracticeSet {
  exercises: ExerciseItem[];
  /** True when every exercise matches both requested level and topic. */
  exactMatch: boolean;
  usedLevels: CEFRLevel[];
  usedTopics: TopicCategory[];
  note: string;
}

const LEVEL_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'IELTS_TOEIC'];

const SKILL_TO_TYPE: Record<Exclude<SkillFocus, 'all'>, ExerciseType> = {
  speaking: 'speaking',
  reorder: 'word-reorder',
  listening: 'listening-cloze',
  quiz: 'quiz',
  flashcard: 'flashcard',
};

/** Keyword → curriculum topic. Longer keys are checked first. */
const TOPIC_KEYWORDS: { topic: TopicCategory; keywords: string[] }[] = [
  { topic: 'food', keywords: ['cafe', 'cà phê', 'ca phe', 'food', 'ẩm thực', 'nha hang', 'nhà hàng', 'restaurant', 'đồ uống', 'do uong'] },
  { topic: 'tech', keywords: ['it', 'code', 'coding', 'tech', 'công nghệ', 'cong nghe', 'software', 'lập trình', 'lap trinh'] },
  { topic: 'work', keywords: ['interview', 'phỏng vấn', 'phong van', 'job', 'việc', 'work', 'công sở', 'cong so', 'email', 'meeting'] },
  { topic: 'travel', keywords: ['travel', 'du lịch', 'du lich', 'airport', 'sân bay', 'san bay', 'hotel', 'khách sạn', 'khach san'] },
  { topic: 'social', keywords: ['health', 'sức khỏe', 'suc khoe', 'bệnh', 'benh', 'friend', 'bạn bè', 'ban be', 'social', 'relationship'] },
  { topic: 'daily', keywords: ['shopping', 'mua sắm', 'mua sam', 'daily', 'hàng ngày', 'hang ngay', 'routine', 'thói quen', 'thoi quen'] },
];

export function resolveTopic(input: string): TopicCategory | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  for (const entry of TOPIC_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.topic;
    }
  }
  return null;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(array: T[], random: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ALL_EXERCISES: ExerciseItem[] = LESSON_UNITS.flatMap((unit) => unit.exercises);

interface CandidateOptions {
  level: CEFRLevel | null;
  topic: TopicCategory | null;
  type: ExerciseType | null;
}

function candidates(options: CandidateOptions): ExerciseItem[] {
  return ALL_EXERCISES.filter((exercise) => {
    if (options.level && exercise.level !== options.level) return false;
    if (options.topic && exercise.topic !== options.topic) return false;
    if (options.type && exercise.type !== options.type) return false;
    return true;
  });
}

/**
 * Build a practice set with explicit, honest fallback:
 *   1. exact level + topic (+ skill)
 *   2. exact level, any topic (+ skill)
 *   3. neighbouring levels, same topic (+ skill)
 *   4. neighbouring levels, any topic (+ skill)
 *   5. all levels, any topic (+ skill)
 * Every step except the first is reported back to the UI.
 */
export function generatePracticeSet(request: PracticeRequest): PracticeSet {
  const random = createSeededRandom(
    request.seed ?? Number(`${Date.now()}`.slice(-9))
  );
  const level = request.level;
  const topic = resolveTopic(request.topic);
  const type = request.skillFocus === 'all' ? null : SKILL_TO_TYPE[request.skillFocus];
  const want = Math.max(1, Math.min(20, request.questionCount));

  const levelIndex = LEVEL_ORDER.indexOf(level);
  const neighbours = [...LEVEL_ORDER]
    .filter((candidate) => candidate !== level)
    .sort(
      (a, b) =>
        Math.abs(LEVEL_ORDER.indexOf(a) - levelIndex) -
        Math.abs(LEVEL_ORDER.indexOf(b) - levelIndex)
    );

  const tiers: { items: ExerciseItem[] }[] = [];
  tiers.push({ items: candidates({ level, topic, type }) });
  tiers.push({ items: candidates({ level, topic: null, type }) });

  neighbours.forEach((otherLevel) => {
    tiers.push({ items: candidates({ level: otherLevel, topic, type }) });
    tiers.push({ items: candidates({ level: otherLevel, topic: null, type }) });
  });

  const picked: ExerciseItem[] = [];
  const seen = new Set<string>();

  for (let tierIndex = 0; tierIndex < tiers.length && picked.length < want; tierIndex++) {
    const tier = tiers[tierIndex];
    if (tier.items.length === 0) continue;

    for (const item of seededShuffle(tier.items, random)) {
      if (picked.length >= want) break;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      picked.push(item);
    }
  }

  const usedLevels = Array.from(new Set(picked.map((item) => item.level)));
  const usedTopics = Array.from(new Set(picked.map((item) => item.topic)));
  // Honest check: does every chosen exercise actually match the request?
  const exactMatch = picked.every(
    (item) => item.level === level && (topic === null || item.topic === topic)
  );

  let note: string;
  if (picked.length === 0) {
    note = 'Không có bài tập nào phù hợp trong ngân hàng bài học hiện tại.';
  } else if (topic === null) {
    note = `Chưa nhận diện được chủ đề "${request.topic}", nên bài luyện dùng ${picked.length} bài đúng cấp độ ${level} từ ngân hàng bài học.`;
  } else if (exactMatch) {
    note = `Đã chọn ${picked.length} bài đúng cấp độ ${level} và chủ đề bạn yêu cầu từ ngân hàng bài học.`;
  } else if (usedLevels.includes(level)) {
    note = `Ngân hàng bài học chưa đủ bài cấp độ ${level} cho chủ đề này; bài luyện dùng ${picked.length} bài cùng cấp độ ở chủ đề khác.`;
  } else {
    note = `Ngân hàng bài học chưa đủ bài cấp độ ${level} cho chủ đề này; bài luyện dùng ${picked.length} bài gần nhất (cấp độ ${usedLevels.join(', ')}).`;
  }
  if (type && picked.length < want) {
    note += ' Một số kỹ năng được chọn có ít bài hơn số lượng yêu cầu.';
  }

  return {
    // Fresh IDs so a repeated practice session never collides with a saved one.
    exercises: picked.map((item, index) => ({
      ...item,
      id: `${item.id}-practice-${index}-${Math.floor(random() * 1e6)}`,
    })),
    exactMatch,
    usedLevels,
    usedTopics,
    note,
  };
}

/** Kept for callers that only need the exercises. */
export function generateDynamicExerciseSet(request: PracticeRequest): ExerciseItem[] {
  return generatePracticeSet(request).exercises;
}

export const PRACTICE_SKILL_OPTIONS: { id: SkillFocus; label: string }[] = [
  { id: 'all', label: 'Tổng hợp' },
  { id: 'flashcard', label: 'Từ vựng' },
  { id: 'reorder', label: 'Sắp xếp câu' },
  { id: 'listening', label: 'Nghe' },
  { id: 'speaking', label: 'Nói' },
  { id: 'quiz', label: 'Trắc nghiệm' },
];
