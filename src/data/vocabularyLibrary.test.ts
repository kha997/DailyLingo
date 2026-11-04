import { describe, expect, it } from 'vitest';
import { VOCABULARY_LIBRARY } from './vocabularyLibrary.ts';

const TOPICS = ['daily', 'travel', 'work', 'food', 'tech', 'social'];

describe('vocabularyLibrary', () => {
  it('ships exactly 300 words split evenly across A1 and A2', () => {
    expect(VOCABULARY_LIBRARY).toHaveLength(300);
    const a1 = VOCABULARY_LIBRARY.filter((entry) => entry.level === 'A1');
    const a2 = VOCABULARY_LIBRARY.filter((entry) => entry.level === 'A2');
    expect(a1).toHaveLength(150);
    expect(a2).toHaveLength(150);
  });

  it('never repeats a headword', () => {
    const words = VOCABULARY_LIBRARY.map((entry) => entry.word.toLowerCase());
    expect(new Set(words).size).toBe(words.length);
  });

  it('never repeats an id', () => {
    const ids = VOCABULARY_LIBRARY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('fills every card field', () => {
    for (const entry of VOCABULARY_LIBRARY) {
      expect(entry.word.trim(), entry.id).not.toBe('');
      expect(entry.meaningVi.trim(), entry.id).not.toBe('');
      expect(entry.partOfSpeech.trim(), entry.id).not.toBe('');
      expect(entry.exampleEn.trim(), entry.id).not.toBe('');
      expect(entry.exampleVi.trim(), entry.id).not.toBe('');
    }
  });

  it('wraps every IPA transcription in slashes', () => {
    for (const entry of VOCABULARY_LIBRARY) {
      expect(entry.ipa.startsWith('/'), entry.id).toBe(true);
      expect(entry.ipa.endsWith('/'), entry.id).toBe(true);
    }
  });

  it('uses only A1/A2 levels and known topics', () => {
    for (const entry of VOCABULARY_LIBRARY) {
      expect(['A1', 'A2'], entry.id).toContain(entry.level);
      expect(TOPICS, entry.id).toContain(entry.topic);
    }
  });

  it('covers every topic in both levels', () => {
    for (const level of ['A1', 'A2'] as const) {
      const topics = new Set(
        VOCABULARY_LIBRARY.filter((entry) => entry.level === level).map((entry) => entry.topic)
      );
      for (const topic of TOPICS) {
        expect(topics.has(topic as never), `${level} ${topic}`).toBe(true);
      }
    }
  });
});
