import { describe, it, expect } from 'vitest';
import { LESSON_UNITS } from '../data/curriculumData.ts';
import {
  generatePracticeSet,
  generateDynamicExerciseSet,
  resolveTopic,
  PRACTICE_SKILL_OPTIONS,
} from './dynamicGenerator.ts';

const allExercises = LESSON_UNITS.flatMap((unit) => unit.exercises);

describe('resolveTopic', () => {
  it('maps preset ids and Vietnamese/English keywords to curriculum topics', () => {
    expect(resolveTopic('cafe')).toBe('food');
    expect(resolveTopic('Gọi Cà Phê & Đồ Uống')).toBe('food');
    expect(resolveTopic('IT & Lập Trình Phần Mềm')).toBe('tech');
    expect(resolveTopic('Phỏng Vấn Xin Việc')).toBe('work');
    expect(resolveTopic('Sân Bay & Khách Sạn')).toBe('travel');
    expect(resolveTopic('Khám Bệnh & Sức Khỏe')).toBe('social');
    expect(resolveTopic('Mua Sắm & Đổi Trả')).toBe('daily');
  });

  it('returns null for blank or unrecognised topics', () => {
    expect(resolveTopic('')).toBeNull();
    expect(resolveTopic('   ')).toBeNull();
    expect(resolveTopic('quantum basket weaving')).toBeNull();
  });
});

describe('generatePracticeSet', () => {
  it('returns an exact level + topic + skill match when available', () => {
    const set = generatePracticeSet({
      topic: 'travel',
      level: 'A2',
      skillFocus: 'quiz',
      questionCount: 1,
      seed: 1,
    });
    expect(set.exactMatch).toBe(true);
    expect(set.exercises).toHaveLength(1);
    expect(set.exercises[0].level).toBe('A2');
    expect(set.exercises[0].topic).toBe('travel');
    expect(set.exercises[0].type).toBe('quiz');
    expect(set.note).toContain('đúng cấp độ A2');
  });

  it('is deterministic for the same seed', () => {
    const request = {
      topic: 'interview',
      level: 'B1' as const,
      skillFocus: 'all' as const,
      questionCount: 5,
      seed: 42,
    };
    const first = generatePracticeSet(request).exercises.map((exercise) => exercise.id);
    const second = generatePracticeSet(request).exercises.map((exercise) => exercise.id);
    expect(first).toEqual(second);
  });

  it('never returns more exercises than the request', () => {
    const set = generatePracticeSet({
      topic: 'daily',
      level: 'B1',
      skillFocus: 'all',
      questionCount: 3,
      seed: 5,
    });
    expect(set.exercises).toHaveLength(3);
    expect(new Set(set.exercises.map((exercise) => exercise.id)).size).toBe(3);
  });

  it('honestly reports an unrecognised topic instead of claiming a match', () => {
    const set = generatePracticeSet({
      topic: 'quantum basket weaving',
      level: 'B1',
      skillFocus: 'all',
      questionCount: 3,
      seed: 3,
    });
    expect(set.exercises.length).toBe(3);
    expect(set.exercises.every((exercise) => exercise.level === 'B1')).toBe(true);
    expect(set.note).toContain('Chưa nhận diện được chủ đề');
    expect(set.note).not.toContain('đúng cấp độ B1 và chủ đề bạn yêu cầu');
  });

  it('reports when it stays at the requested level but changes topic', () => {
    const set = generatePracticeSet({
      topic: 'food',
      level: 'B1',
      skillFocus: 'quiz',
      questionCount: 1,
      seed: 9,
    });
    expect(set.exactMatch).toBe(false);
    expect(set.usedLevels).toEqual(['B1']);
    expect(set.note).toContain('cùng cấp độ ở chủ đề khác');
  });

  it('falls back to the nearest available level when the level has no data', () => {
    const set = generatePracticeSet({
      topic: 'daily',
      level: 'IELTS_TOEIC',
      skillFocus: 'speaking',
      questionCount: 1,
      seed: 11,
    });
    expect(set.exactMatch).toBe(false);
    expect(set.exercises).toHaveLength(1);
    expect(set.exercises[0].type).toBe('speaking');
    expect(set.exercises[0].level).toBe('B2');
    expect(set.note).toContain('bài gần nhất');
  });

  it('returns only curriculum exercises, with fresh ids for repeats', () => {
    const set = generatePracticeSet({
      topic: 'cafe',
      level: 'A2',
      skillFocus: 'all',
      questionCount: 4,
      seed: 100,
    });
    const sourceIds = new Set(allExercises.map((exercise) => exercise.id));
    set.exercises.forEach((exercise) => {
      expect(sourceIds.has(exercise.id.replace(/-practice-\d+-\d+$/, ''))).toBe(true);
      expect(exercise.id).toMatch(/-practice-\d+-\d+$/);
    });
    expect(new Set(set.exercises.map((exercise) => exercise.id)).size).toBe(
      set.exercises.length
    );
  });

  it('exposes generateDynamicExerciseSet as a thin wrapper', () => {
    const exercises = generateDynamicExerciseSet({
      topic: 'travel',
      level: 'A2',
      skillFocus: 'flashcard',
      questionCount: 1,
      seed: 2,
    });
    expect(exercises).toHaveLength(1);
    expect(exercises[0].type).toBe('flashcard');
  });

  it('offers a non-AI skill list that matches exercise types', () => {
    expect(PRACTICE_SKILL_OPTIONS.map((option) => option.id)).toEqual([
      'all',
      'flashcard',
      'reorder',
      'listening',
      'speaking',
      'quiz',
    ]);
  });
});
