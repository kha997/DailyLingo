import { soundEffects } from './audioEffects.ts';

// Web Audio API Sound Synthesizer delegation
export const soundFX = {
  playCorrect: () => soundEffects.pop(),
  playWrong: () => soundEffects.wrong(),
  playComplete: () => soundEffects.tada(),
  playClick: () => soundEffects.click(),
  playDing: () => soundEffects.ding(),
};

// Web Speech Synthesis (Text to Speech)
let availableVoices: SpeechSynthesisVoice[] = [];
let activeUtterance: SpeechSynthesisUtterance | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    availableVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function speakEnglish(
  text: string,
  options: { rate?: number; accent?: 'en-US' | 'en-GB' } = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }

    // Small delay prevents Chromium cancel/speak collision race condition
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        activeUtterance = utterance; // Prevent garbage collection mid-speech

        const accent = options.accent || 'en-US';
        utterance.lang = accent;
        // Strict rate clamping: 0.5x to 1.5x
        const targetRate = typeof options.rate === 'number' && !isNaN(options.rate)
          ? Math.max(0.5, Math.min(1.5, options.rate))
          : 0.95;
        utterance.rate = targetRate;
        utterance.pitch = 1.0;

        // Pick a natural English voice if possible
        if (availableVoices.length === 0) {
          availableVoices = window.speechSynthesis.getVoices();
        }
        const preferredVoice = availableVoices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith(accent.toLowerCase().slice(0, 2)) &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Premium'))
        ) || availableVoices.find((v) => v.lang.toLowerCase().startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        let isFinished = false;
        const finish = () => {
          if (!isFinished) {
            isFinished = true;
            activeUtterance = null;
            resolve();
          }
        };

        utterance.onend = finish;
        utterance.onerror = finish;

        // Safety fallback timeout to prevent frozen state if browser fails to trigger onend
        const wordCount = text.split(/\s+/).length;
        const estimatedMs = Math.max(1500, (wordCount / (targetRate * 2.2)) * 1000 + 2000);
        setTimeout(finish, estimatedMs);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech error', err);
        activeUtterance = null;
        resolve();
      }
    }, 45);
  });
}

// Pronunciation similarity comparison
export function calculateSimilarity(spoken: string, target: string) {
  const cleanSpoken = spoken.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, '').trim();
  const cleanTarget = target.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, '').trim();

  const spokenTokens = cleanSpoken.split(/\s+/).filter(Boolean);
  const targetTokens = cleanTarget.split(/\s+/).filter(Boolean);

  if (targetTokens.length === 0) return { score: 100, matches: [] };

  const matches = targetTokens.map((targetWord) => {
    // Check if spoken contains targetWord or close to it
    return spokenTokens.some((spokenWord) => {
      if (spokenWord === targetWord) return true;
      // Simple 1-char tolerance
      if (Math.abs(spokenWord.length - targetWord.length) <= 1) {
        let diff = 0;
        const minLen = Math.min(spokenWord.length, targetWord.length);
        for (let i = 0; i < minLen; i++) {
          if (spokenWord[i] !== targetWord[i]) diff++;
        }
        return diff <= 1;
      }
      return false;
    });
  });

  const matchedCount = matches.filter(Boolean).length;
  const score = Math.round((matchedCount / targetTokens.length) * 100);

  return {
    score,
    matches,
    targetTokens,
    spokenTokens,
  };
}

// Speech Recognition helper
export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class SpeechRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  public isSupported: boolean = false;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Trình duyệt không hỗ trợ nhận diện giọng nói Web Speech. Bạn có thể sử dụng Chrome/Edge.');
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onResult({
        transcript: finalTranscript || interimTranscript,
        isFinal: !!finalTranscript,
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError(event.error || 'Lỗi nhận diện âm thanh.');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.isListening = true;
      this.recognition.start();
    } catch {
      this.isListening = false;
      onError('Không thể bắt đầu ghi âm. Vui lòng thử lại.');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.isListening = false;
    }
  }
}
