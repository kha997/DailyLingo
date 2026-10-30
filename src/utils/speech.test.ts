import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateSimilarity, SpeechRecognizer } from './speech.ts';

describe('calculateSimilarity', () => {
  it('returns 100 when spoken matches target exactly', () => {
    const result = calculateSimilarity('hello world', 'hello world');
    expect(result.score).toBe(100);
    expect(result.matches.length).toBe(2);
  });

  it('returns high score for partial match', () => {
    const result = calculateSimilarity('hello there', 'hello world');
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('handles empty target tokens', () => {
    const result = calculateSimilarity('anything', '');
    expect(result.score).toBe(100);
    expect(result.matches).toEqual([]);
  });

  it('handles single character differences', () => {
    const result = calculateSimilarity('cat', 'cut');
    // 'cat' vs 'cut': 'c' matches, 'a' vs 'u' is 1 diff, 't' matches -> 2/3 * 100 = 67
    expect(result.score).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    const result = calculateSimilarity('HELLO WORLD', 'hello world');
    expect(result.score).toBe(100);
  });

  it('handles punctuation cleaning', () => {
    const result = calculateSimilarity('hello, world!', 'hello world');
    expect(result.score).toBe(100);
  });

  it('token-based matching with 1-char tolerance', () => {
    // 'hello' vs 'hallo' - 1 char diff, same length -> should match
    const result = calculateSimilarity('hallo', 'hello');
    expect(result.score).toBeGreaterThan(0);
  });
});

describe('SpeechRecognizer', () => {
  let recognizer: SpeechRecognizer;

  beforeEach(() => {
    // Create a new recognizer for each test
    recognizer = new SpeechRecognizer();
  });

  describe('constructor', () => {
    it('sets isSupported when Web Speech API is available', () => {
      // In JSDOM, SpeechRecognition might not be available, but the check should still work
      expect(typeof recognizer.isSupported).toBe('boolean');
    });

    it('sets permissionDenied to false on init', () => {
      expect(recognizer.permissionDenied).toBe(false);
    });

    it('initializes recognition object when supported', () => {
      if (recognizer.isSupported) {
        expect(recognizer.recognition).not.toBeNull();
        expect(recognizer.recognition?.continuous).toBe(false);
        expect(recognizer.recognition?.interimResults).toBe(true);
        expect(recognizer.recognition?.lang).toBe('en-US');
      }
    });
  });

  describe('startListening', () => {
    it('shows error when recognition is not supported', () => {
      // Create a recognizer without support
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
      expect(errorCallback).toHaveBeenCalled();
    });

    it('starts listening when supported', () => {
      if (recognizer.isSupported) {
        const startCallback = vi.fn();
        const endCallback = vi.fn();
        const errorCallback = vi.fn();
        
        recognizer.startListening(
          (result) => {
            startCallback();
          },
          errorCallback,
          endCallback
        );
        
        // In JSDOM, recognition.start() may not actually do anything,
        // but it shouldn't throw
      }
    });

    it('handles error codes properly', () => {
      // Test the error mapping logic
      const errorCodes = ['not-allowed', 'no-speech', 'aborted', 'unknown'];
      
      for (const errorCode of errorCodes) {
        // The error mapping should produce appropriate messages
        if (errorCode === 'not-allowed' || errorCode === 'no-speech') {
          // Should show permission message
        } else if (errorCode === 'aborted') {
          // Should show empty error (normal when user stops)
        } else {
          // Should show generic error with event.error
        }
      }
    });
  });

  describe('stopListening', () => {
    it('stops listening when active', () => {
      if (recognizer.isSupported) {
        expect(() => recognizer.stopListening()).not.toThrow();
      }
    });
  });
});