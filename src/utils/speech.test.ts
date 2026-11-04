import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateSimilarity,
  SpeechRecognizer,
  isSpeechRecognitionSupported,
  buildTranscriptUpdate,
} from './speech.ts';

describe('calculateSimilarity', () => {
  it('returns 100 when spoken matches target exactly', () => {
    const result = calculateSimilarity('hello world', 'hello world');
    expect(result.score).toBe(100);
    expect(result.matches).toEqual([true, true]);
  });

  it('is case-insensitive', () => {
    expect(calculateSimilarity('HELLO WORLD', 'hello world').score).toBe(100);
  });

  it('ignores punctuation and extra whitespace', () => {
    expect(calculateSimilarity('hello,   world!', 'hello world').score).toBe(100);
  });

  it('handles an empty target', () => {
    const result = calculateSimilarity('anything', '');
    expect(result.score).toBe(100);
    expect(result.matches).toEqual([]);
  });

  it('scores 0 when nothing was heard', () => {
    const result = calculateSimilarity('', 'hello world');
    expect(result.score).toBe(0);
    expect(result.matches).toEqual([false, false]);
  });

  it('scores a one-word substitution in a two-word sentence at 50', () => {
    // Word-level edit distance: 1 substitution / 2 words = 50%.
    expect(calculateSimilarity('hello there', 'hello world').score).toBe(50);
  });

  it('does not award partial credit for a different single word', () => {
    // This is transcript matching, not phoneme scoring. A listener that hears
    // "cat" instead of "cut" gets no credit, and the UI says so.
    expect(calculateSimilarity('cat', 'cut').score).toBe(0);
  });

  it('penalises missing and extra words', () => {
    expect(calculateSimilarity('hello', 'hello world').score).toBe(50);
    expect(calculateSimilarity('hello big world', 'hello world').score).toBe(67);
  });

  it('penalises reordered words', () => {
    expect(calculateSimilarity('world hello', 'hello world').score).toBe(0);
  });

  it('marks only words that appeared in order', () => {
    const result = calculateSimilarity('world hello', 'hello world');
    // Only one word can be part of the longest ordered subsequence.
    expect(result.matches.filter(Boolean)).toHaveLength(1);
    expect(result.score).toBe(0);
  });

  it('clamps the score between 0 and 100', () => {
    const result = calculateSimilarity('a b c d e f', 'a');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('buildTranscriptUpdate', () => {
  const result = (transcript: string, isFinal: boolean) => ({ isFinal, 0: { transcript } });

  it('keeps a trailing interim tail instead of dropping it', () => {
    const update = buildTranscriptUpdate([result('hello', true), result('wor', false)]);
    expect(update.transcript).toBe('hello wor');
    expect(update.finalTranscript).toBe('hello');
    expect(update.isFinal).toBe(true);
  });

  it('joins every final segment in order', () => {
    const update = buildTranscriptUpdate([result('good ', true), result('morning', true)]);
    expect(update.finalTranscript).toBe('good morning');
    expect(update.transcript).toBe('good morning');
  });

  it('reports an interim-only result as displayable but not scorable', () => {
    const update = buildTranscriptUpdate([result('hel', false)]);
    expect(update.transcript).toBe('hel');
    expect(update.finalTranscript).toBe('');
    expect(update.isFinal).toBe(false);
  });

  it('handles empty results without inventing text', () => {
    const update = buildTranscriptUpdate([]);
    expect(update.transcript).toBe('');
    expect(update.finalTranscript).toBe('');
    expect(update.isFinal).toBe(false);
  });
});

describe('isSpeechRecognitionSupported', () => {  it('returns a boolean and does not throw when the API is absent', () => {
    expect(typeof isSpeechRecognitionSupported()).toBe('boolean');
  });
});

describe('SpeechRecognizer', () => {
  let recognizer: SpeechRecognizer;

  beforeEach(() => {
    recognizer = new SpeechRecognizer();
  });

  describe('constructor', () => {
    it('sets isSupported to a boolean', () => {
      expect(typeof recognizer.isSupported).toBe('boolean');
    });

    it('sets permissionDenied to false on init', () => {
      expect(recognizer.permissionDenied).toBe(false);
    });

    it('configures recognition when supported', () => {
      if (recognizer.isSupported) {
        expect(recognizer.recognition).not.toBeNull();
        expect(recognizer.recognition?.continuous).toBe(false);
        expect(recognizer.recognition?.interimResults).toBe(true);
        expect(recognizer.recognition?.lang).toBe('en-US');
      }
    });
  });

  describe('startListening', () => {
    it('reports an error when recognition is not supported', () => {
      const unsupportedRecognizer = new (class extends SpeechRecognizer {
        constructor() {
          super();
          this.isSupported = false;
        }
      })();

      const errorCallback = vi.fn();
      unsupportedRecognizer.startListening(
        () => {},
        errorCallback,
        () => {}
      );
      expect(errorCallback).toHaveBeenCalledOnce();
    });

    it('does not throw when started in JSDOM', () => {
      if (!recognizer.isSupported) return;
      expect(() =>
        recognizer.startListening(
          () => {},
          () => {},
          () => {}
        )
      ).not.toThrow();
    });
  });

  describe('stopListening / abort', () => {
    it('stops without throwing when inactive', () => {
      expect(() => recognizer.stopListening()).not.toThrow();
    });

    it('aborts without throwing when inactive', () => {
      expect(() => recognizer.abort()).not.toThrow();
    });
  });
});
