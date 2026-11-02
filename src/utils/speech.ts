import { soundEffects } from './audioEffects.ts';

// Web Audio API Sound Synthesizer delegation
export const soundFX = {
  playCorrect: () => soundEffects.pop(),
  playWrong: () => soundEffects.wrong(),
  playComplete: () => soundEffects.tada(),
  playClick: () => soundEffects.click(),
};

// Web Speech Synthesis (Text to Speech)
let availableVoices: SpeechSynthesisVoice[] = [];
let activeUtterance: SpeechSynthesisUtterance | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    availableVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
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

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Transcript alignment score for read-aloud practice.
 *
 * This is intentionally a word-order-sensitive comparison, not a pronunciation
 * score. The Web Speech API returns text only; it cannot measure phonemes.
 * The score is 1 - word edit distance / longer sentence length, so missing,
 * inserted, substituted, or reordered words all reduce the result.
 */
export function calculateSimilarity(spoken: string, target: string) {
  const spokenTokens = tokenize(spoken);
  const targetTokens = tokenize(target);

  if (targetTokens.length === 0) {
    return { score: 100, matches: [] as boolean[], targetTokens, spokenTokens };
  }
  if (spokenTokens.length === 0) {
    return { score: 0, matches: targetTokens.map(() => false), targetTokens, spokenTokens };
  }

  // Levenshtein distance over word tokens.
  const rows = targetTokens.length + 1;
  const cols = spokenTokens.length + 1;
  const distance = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) distance[i][0] = i;
  for (let j = 0; j < cols; j++) distance[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const substitutionCost = targetTokens[i - 1] === spokenTokens[j - 1] ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + substitutionCost
      );
    }
  }

  const maxLength = Math.max(targetTokens.length, spokenTokens.length);
  const score = Math.max(0, Math.min(100, Math.round((1 - distance[rows - 1][cols - 1] / maxLength) * 100)));

  // Longest common subsequence marks which target words appeared in order.
  const lcs = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      lcs[i][j] =
        targetTokens[i - 1] === spokenTokens[j - 1]
          ? lcs[i - 1][j - 1] + 1
          : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
    }
  }
  const matches = targetTokens.map(() => false);
  let i = targetTokens.length;
  let j = spokenTokens.length;
  while (i > 0 && j > 0) {
    if (targetTokens[i - 1] === spokenTokens[j - 1]) {
      matches[i - 1] = true;
      i--;
      j--;
    } else if (lcs[i - 1][j] >= lcs[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return { score, matches, targetTokens, spokenTokens };
}

// Speech Recognition helper
export interface SpeechRecognitionResult {
  /** Final text plus any still-interim tail, for display. */
  transcript: string;
  /** Final text only. Only this is safe to score. */
  finalTranscript: string;
  isFinal: boolean;
}

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResultLike {
  isFinal: boolean;
  0?: RecognitionAlternative;
}

/**
 * Build one transcript update from a Web Speech `event.results` list.
 *
 * The API grows the list while the user speaks, so both final and interim
 * segments are joined rather than replaced. Returning the interim tail keeps
 * the on-screen text complete; callers score `finalTranscript` only so a
 * half-finished word can never inflate or deflate a score.
 */
export function buildTranscriptUpdate(
  results: ArrayLike<RecognitionResultLike>
): SpeechRecognitionResult {
  const finalParts: string[] = [];
  const interimParts: string[] = [];

  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    const text = result?.[0]?.transcript ?? '';
    if (!text) continue;
    if (result.isFinal) finalParts.push(text);
    else interimParts.push(text);
  }

  const finalTranscript = finalParts.join(' ').replace(/\s+/g, ' ').trim();
  const interimTranscript = interimParts.join(' ').replace(/\s+/g, ' ').trim();
  const transcript = [finalTranscript, interimTranscript]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    transcript,
    finalTranscript,
    isFinal: finalTranscript.length > 0,
  };
}

export interface SpeechRecognizerInitState {
  isSupported: boolean;
  permissionDenied: boolean;
}

/** Whether this browser exposes the Web Speech recognition API at all. */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export class SpeechRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-internal
  public recognition: any = null;
  public isSupported: boolean = false;
  public permissionDenied: boolean = false;
  private isListening: boolean = false;

  constructor(accent: 'en-US' | 'en-GB' = 'en-US') {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-internal
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = accent;
      }
    }
  }

  setAccent(accent: 'en-US' | 'en-GB') {
    if (this.recognition) this.recognition.lang = accent;
  }

  startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError(
        'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Hãy dùng Chrome hoặc Edge, hoặc dùng nút "Tôi đã đọc to" để tiếp tục.'
      );
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    let finished = false;
    const finishOnce = (callback: () => void) => {
      if (finished) return;
      finished = true;
      callback();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-internal
    this.recognition.onresult = (event: any) => {
      onResult(buildTranscriptUpdate(event.results));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-internal
    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      const errorCode = event?.error || 'unknown';

      // User-initiated stop/abort is not an error worth showing.
      if (errorCode === 'aborted') {
        finishOnce(() => onError(''));
        return;
      }

      if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
        this.permissionDenied = true;
        finishOnce(() =>
          onError(
            'Quyền truy cập micro đang bị chặn. Bấm biểu tượng ổ khóa/cài đặt trên thanh địa chỉ, cấp quyền Microphone cho trang này, rồi thử lại.'
          )
        );
        return;
      }

      if (errorCode === 'no-speech') {
        finishOnce(() =>
          onError(
            'Không nghe thấy giọng nói. Hãy bấm micro, đợi biểu tượng chuyển sang trạng thái ghi âm rồi đọc to câu mẫu trong vài giây.'
          )
        );
        return;
      }

      if (errorCode === 'audio-capture') {
        finishOnce(() =>
          onError(
            'Không tìm thấy micro đang hoạt động. Kiểm tra micro đã kết nối và được chọn trong cài đặt âm thanh của máy.'
          )
        );
        return;
      }

      if (errorCode === 'network') {
        finishOnce(() =>
          onError(
            'Dịch vụ nhận diện giọng nói không kết nối được. Kiểm tra mạng rồi thử lại, hoặc dùng nút "Tôi đã đọc to" để tiếp tục.'
          )
        );
        return;
      }

      finishOnce(() =>
        onError(
          `Không nhận diện được giọng nói (mã: ${errorCode}). Hãy thử lại hoặc dùng nút "Tôi đã đọc to".`
        )
      );
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.permissionDenied = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      finishOnce(onEnd);
    };

    try {
      this.isListening = true;
      this.recognition.start();
    } catch {
      this.isListening = false;
      finishOnce(() =>
        onError(
          'Không thể bắt đầu ghi âm. Hãy đợi một chút rồi thử lại, hoặc tải lại trang nếu lỗi tiếp diễn.'
        )
      );
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

  /** Abort without producing a user-facing error (used when closing a session). */
  abort() {
    if (!this.recognition) return;
    try {
      this.recognition.abort();
    } catch {
      // Ignore
    }
    this.isListening = false;
  }
}
