// Web Audio API Sound Effects Utility
// High-performance, zero external asset dependency sound synthesizer

class AudioEffectsManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Check saved mute preference
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dailylingo_sound_muted');
        if (saved !== null) {
          this.muted = saved === 'true';
        }
      } catch {
        // Ignore localStorage error
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Handled silently if autoplay restricted
      });
    }

    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dailylingo_sound_muted', String(muted));
      } catch {
        // Ignore
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * 'pop': Short, cheerful bubble-pop sound for correct answers and actions
   */
  public pop(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary oscillator for bubbly frequency sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Rapid upward chirp then subtle bounce: 520Hz -> 880Hz -> 780Hz
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);

      // Crisp percussive envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.16);

      // Harmonic second sparkle tone
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonicOsc.type = 'sine';
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);

      harmonicOsc.frequency.setValueAtTime(1046.5, now + 0.02); // C6
      harmonicGain.gain.setValueAtTime(0.08, now + 0.02);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      harmonicOsc.start(now + 0.02);
      harmonicOsc.stop(now + 0.15);
    } catch {
      // Ignore audio policy restriction
    }
  }

  /**
   * 'tada': Celebratory fanfare chord for finishing a lesson / exercise set
   */
  public tada(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Ascending triumphant fanfare: C5, E5, G5, C6 arpeggio followed by final sustained chord
      const fanfareNotes = [
        { freq: 523.25, time: 0.00, dur: 0.15, vol: 0.15 }, // C5
        { freq: 659.25, time: 0.08, dur: 0.15, vol: 0.16 }, // E5
        { freq: 783.99, time: 0.16, dur: 0.18, vol: 0.18 }, // G5
        { freq: 1046.50, time: 0.25, dur: 0.65, vol: 0.22 }, // C6 (Peak)
        { freq: 1318.51, time: 0.27, dur: 0.62, vol: 0.15 }, // E6 (Harmony)
        { freq: 1567.98, time: 0.30, dur: 0.58, vol: 0.10 }, // G6 (Shimmer)
      ];

      fanfareNotes.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Richer harmonics for celebratory brass/horn effect
        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + time;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.start(startTime);
        osc.stop(startTime + dur + 0.05);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * 'ding': Crisp, sparkling bell chime when reaching a daily goal or milestone
   */
  public ding(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Crystalline bell dual-frequency strike (Fundamental + Octave harmonic with detune)
      const fundamentalFreq = 1174.66; // D6
      const harmonicFreq = 2349.32; // D7

      // Fundamental Bell Tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.frequency.setValueAtTime(fundamentalFreq, now);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.start(now);
      osc1.stop(now + 0.9);

      // Shimmering High Harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.frequency.setValueAtTime(harmonicFreq + 3, now); // Slight acoustic beating
      gain2.gain.setValueAtTime(0.12, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc2.start(now);
      osc2.stop(now + 0.7);

      // Extra sparkle chime after 0.07s
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.frequency.setValueAtTime(1760, now + 0.07); // A6
      gain3.gain.setValueAtTime(0.10, now + 0.07);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc3.start(now + 0.07);
      osc3.stop(now + 0.65);
    } catch {
      // Ignore
    }
  }

  /**
   * 'wrong': Gentle, constructive soft low tone for incorrect responses
   */
  public wrong(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Gentle descending tone (Eb4 -> C4)
      osc.frequency.setValueAtTime(311.13, now);
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  /**
   * 'click': Micro-click for UI buttons and chips
   */
  public click(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  // Aliases for convenience
  public correct(): void {
    this.pop();
  }

  public complete(): void {
    this.tada();
  }

  public goalReached(): void {
    this.ding();
  }
}

export const soundEffects = new AudioEffectsManager();

// Convenient direct function exports
export const playPopSound = (): void => soundEffects.pop();
export const playTadaSound = (): void => soundEffects.tada();
export const playDingSound = (): void => soundEffects.ding();
export const playWrongSound = (): void => soundEffects.wrong();
export const playClickSound = (): void => soundEffects.click();
