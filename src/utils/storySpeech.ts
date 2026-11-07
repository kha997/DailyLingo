import {
  cancelEnglishSpeech,
  onEnglishSpeechCancelled,
  selectEnglishVoice,
} from "./speech";

export type StorySpeechState = "idle" | "playing" | "paused";
export interface StorySpeechOptions {
  rate?: number;
  accent?: "en-US" | "en-GB";
}
export interface StorySpeechCallbacks {
  onSentence?: (index: number) => void;
  onComplete?: (index: number) => void;
  onState?: (state: StorySpeechState) => void;
  onError?: (message: string) => void;
}

/** Sentence-level queue. Cancellation invalidates callbacks before touching the
 * platform, which may synchronously deliver end/error during cancel(). Native
 * pause is deliberately avoided: explicit resume restarts the current sentence.
 * Only actual onend events complete sentences; elapsed time is never evidence. */
export class StorySpeechQueue {
  private generation = 0;
  private utterance: SpeechSynthesisUtterance | null = null;
  private texts: string[] = [];
  private index = 0;
  private all = false;
  private options: StorySpeechOptions = {};
  private disposed = false;
  private currentState: StorySpeechState = "idle";
  private unsubscribe: () => void;
  constructor(private callbacks: StorySpeechCallbacks = {}) {
    this.unsubscribe = onEnglishSpeechCancelled(() => {
      this.generation += 1;
      this.utterance = null;
      if (this.currentState !== "idle") this.setState("idle");
    });
  }
  get state(): StorySpeechState {
    return this.currentState;
  }
  get supported(): boolean {
    return (
      typeof window !== "undefined" &&
      !!window.speechSynthesis &&
      typeof SpeechSynthesisUtterance !== "undefined"
    );
  }
  private setState(state: StorySpeechState) {
    this.currentState = state;
    this.callbacks.onState?.(state);
  }
  private cancel() {
    this.generation += 1;
    this.utterance = null;
    cancelEnglishSpeech();
  }
  play(
    texts: string[],
    start = 0,
    all = true,
    options: StorySpeechOptions = {},
  ) {
    if (this.disposed) return;
    this.cancel();
    this.texts = [...texts];
    this.index = Math.max(
      0,
      Math.min(
        texts.length - 1,
        Number.isFinite(start) ? Math.floor(start) : 0,
      ),
    );
    this.all = all;
    this.options = { ...options };
    if (!texts.length) {
      this.setState("idle");
      return;
    }
    this.speakCurrent();
  }
  private speakCurrent() {
    this.speak(this.texts[this.index], this.index);
  }
  private speak(text: string, sentence: number | null) {
    if (!this.supported) {
      this.setState("idle");
      this.callbacks.onError?.(
        "Trình duyệt chưa hỗ trợ đọc văn bản. Bạn vẫn có thể đọc và học từ.",
      );
      return;
    }
    const generation = this.generation;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      this.utterance = utterance; // Keep a strong reference until completion.
      const accent = this.options.accent ?? "en-US";
      utterance.lang = accent;
      utterance.rate = Number.isFinite(this.options.rate)
        ? Math.min(1.5, Math.max(0.5, this.options.rate!))
        : 1;
      utterance.pitch = 1;
      const voice = selectEnglishVoice(accent);
      if (voice) utterance.voice = voice; // Empty voices: browser's lang default.
      let finished = false;
      const valid = () =>
        !this.disposed &&
        generation === this.generation &&
        !finished &&
        this.utterance === utterance;
      utterance.onend = () => {
        if (!valid()) return;
        finished = true;
        this.utterance = null;
        if (sentence === null) return;
        this.callbacks.onComplete?.(sentence);
        // A callback may synchronously stop/switch stories.
        if (generation !== this.generation || this.disposed) return;
        if (this.all && this.index + 1 < this.texts.length) {
          this.index += 1;
          this.speakCurrent();
        } else this.setState("idle");
      };
      utterance.onerror = () => {
        if (!valid()) return;
        finished = true;
        this.utterance = null;
        this.setState("idle");
        this.callbacks.onError?.(
          "Không thể phát âm thanh. Hãy bấm nghe để thử lại; kiểm tra giọng đọc trong trình duyệt.",
        );
      };
      if (sentence !== null) {
        this.setState("playing");
        if (generation !== this.generation || this.disposed) return;
        this.callbacks.onSentence?.(sentence);
      }
      if (generation === this.generation && !this.disposed)
        window.speechSynthesis.speak(utterance);
    } catch {
      if (generation !== this.generation || this.disposed) return;
      this.utterance = null;
      this.setState("idle");
      this.callbacks.onError?.(
        "Không thể bắt đầu giọng đọc. Hãy thử lại bằng nút nghe.",
      );
    }
  }
  pause() {
    if (this.currentState !== "playing" || this.disposed) return;
    this.cancel();
    this.setState("paused");
  }
  resume() {
    if (this.currentState !== "paused" || this.disposed) return;
    this.speakCurrent();
  }
  stop() {
    this.cancel();
    this.texts = [];
    this.setState("idle");
  }
  speakWord(text: string, options: StorySpeechOptions = {}) {
    if (this.disposed) return;
    this.stop();
    this.options = { ...options };
    this.speak(text, null);
  }
  dispose() {
    this.stop();
    this.disposed = true;
    this.unsubscribe();
  }
}
