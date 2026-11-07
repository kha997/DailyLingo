import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { StorySpeechQueue } from "./storySpeech";

class Utterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}
let spoken: Utterance[];
const callbacks = () => ({
  onSentence: vi.fn(),
  onComplete: vi.fn(),
  onState: vi.fn(),
  onError: vi.fn(),
});
let cancel: ReturnType<typeof vi.fn>;
beforeEach(() => {
  spoken = [];
  cancel = vi.fn();
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  vi.stubGlobal("speechSynthesis", {
    cancel,
    getVoices: () => [],
    speak: (u: Utterance) => spoken.push(u),
    addEventListener: vi.fn(),
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("StorySpeechQueue", () => {
  it("queues sentences in order and only completes on genuine end events", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["One.", "Two."], 0, true, { rate: 1.2, accent: "en-GB" });
    expect(spoken.map((u) => u.text)).toEqual(["One."]);
    expect(cb.onSentence).toHaveBeenLastCalledWith(0);
    expect(spoken[0].lang).toBe("en-GB");
    expect(spoken[0].rate).toBe(1.2);
    spoken[0].onend?.();
    expect(cb.onComplete).toHaveBeenCalledWith(0);
    expect(spoken.map((u) => u.text)).toEqual(["One.", "Two."]);
    spoken[1].onend?.();
    expect(queue.state).toBe("idle");
    expect(cb.onComplete).toHaveBeenLastCalledWith(1);
  });
  it("ignores cancelled and duplicate callbacks without advancing the new selection", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["One.", "Two.", "Three."], 0, true);
    const old = spoken[0];
    queue.play(["One.", "Two.", "Three."], 2, false);
    old.onend?.();
    old.onerror?.({ error: "interrupted" });
    expect(spoken.map((u) => u.text)).toEqual(["One.", "Three."]);
    expect(cb.onComplete).not.toHaveBeenCalled();
    spoken[1].onend?.();
    spoken[1].onend?.();
    expect(cb.onComplete).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();
  });
  it("pause cancels and explicit resume restarts the same sentence without false completion", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["One.", "Two."], 0, true);
    const old = spoken[0];
    queue.pause();
    old.onend?.();
    expect(queue.state).toBe("paused");
    expect(cb.onComplete).not.toHaveBeenCalled();
    queue.resume();
    expect(spoken.map((u) => u.text)).toEqual(["One.", "One."]);
    spoken[1].onend?.();
    expect(spoken[2].text).toBe("Two.");
  });
  it("word pronunciation cancels the story and never advances or completes a sentence", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["A sentence."], 0, true);
    const old = spoken[0];
    queue.speakWord("sentence");
    old.onend?.();
    expect(spoken.map((u) => u.text)).toEqual(["A sentence.", "sentence"]);
    spoken[1].onend?.();
    expect(cb.onComplete).not.toHaveBeenCalled();
    expect(cb.onSentence).toHaveBeenCalledTimes(1);
    expect(queue.state).toBe("idle");
    queue.resume();
    expect(spoken).toHaveLength(2);
  });
  it("surfaces speech failure without marking any sentence read or continuing", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["One.", "Two."], 0, true);
    spoken[0].onerror?.({ error: "not-allowed" });
    spoken[0].onend?.();
    expect(cb.onError).toHaveBeenCalled();
    expect(cb.onComplete).not.toHaveBeenCalled();
    expect(queue.state).toBe("idle");
    expect(spoken).toHaveLength(1);
  });
  it("stop and dispose invalidate pending events and disable resume", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["One.", "Two."], 0, true);
    queue.stop();
    spoken[0].onend?.();
    queue.resume();
    expect(spoken).toHaveLength(1);
    expect(cb.onComplete).not.toHaveBeenCalled();
    queue.play(["New."], 0, false);
    queue.dispose();
    spoken[1].onend?.();
    queue.play(["Never."], 0, true);
    expect(spoken).toHaveLength(2);
    expect(cb.onComplete).not.toHaveBeenCalled();
  });
  it("fails gracefully when Web Speech is unavailable", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    expect(queue.supported).toBe(false);
    queue.play(["One."], 0, true);
    expect(cb.onError).toHaveBeenCalled();
    expect(queue.state).toBe("idle");
  });
  it("invalidates events before a platform cancel synchronously dispatches them", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["One.", "Two."], 0, true);
    cancel.mockImplementation(() => spoken[0].onend?.());
    queue.play(["Replacement."], 0, false);
    expect(spoken.map((u) => u.text)).toEqual(["One.", "Replacement."]);
    expect(cb.onComplete).not.toHaveBeenCalled();
  });
  it("never invents completion when a platform omits all speech callbacks", () => {
    vi.useFakeTimers();
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play(["One.", "Two."], 0, true);
    vi.advanceTimersByTime(120_000);
    expect(spoken).toHaveLength(1);
    expect(cb.onComplete).not.toHaveBeenCalled();
    queue.stop();
    expect(queue.state).toBe("idle");
  });
  it("does not queue another sentence after an onComplete callback stops playback", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    cb.onComplete.mockImplementation(() => queue.stop());
    queue.play(["One.", "Two."], 0, true);
    spoken[0].onend?.();
    expect(spoken).toHaveLength(1);
    expect(queue.state).toBe("idle");
  });
  it("clamps rates, handles empty/out-of-range input and synchronous platform failures", () => {
    const cb = callbacks();
    const queue = new StorySpeechQueue(cb);
    queue.play([], 0, true);
    expect(spoken).toHaveLength(0);
    queue.play(["One."], 99, false, { rate: 99 });
    expect(spoken[0].rate).toBe(1.5);
    queue.stop();
    vi.stubGlobal("speechSynthesis", {
      cancel: () => {
        throw Error("cancel");
      },
      getVoices: () => [],
      speak: () => {
        throw Error("speak");
      },
    });
    queue.play(["Two."], 0, true, { rate: NaN });
    expect(queue.state).toBe("idle");
    expect(cb.onError).toHaveBeenCalled();
  });
});

it("cancels delayed legacy English speech before starting a story", async () => {
  vi.useFakeTimers();
  const { speakEnglish } = await import("./speech");
  const oldPromise = speakEnglish("Old exercise.");
  const queue = new StorySpeechQueue(callbacks());
  queue.play(["New story."], 0, false);
  vi.runAllTimers();
  await oldPromise;
  expect(spoken.map((u) => u.text)).toEqual(["New story."]);
  queue.dispose();
  vi.useRealTimers();
});

it("legacy speech interrupts a live story without stale completion or highlighting", async () => {
  vi.useFakeTimers();
  const { speakEnglish } = await import("./speech");
  const cb = callbacks();
  const queue = new StorySpeechQueue(cb);
  queue.play(["Old story.", "Never advance."], 0, true);
  const old = spoken[0];
  const legacy = speakEnglish("Settings preview.");
  old.onend?.();
  old.onerror?.({ error: "interrupted" });
  expect(queue.state).toBe("idle");
  expect(cb.onComplete).not.toHaveBeenCalled();
  expect(cb.onError).not.toHaveBeenCalled();
  vi.advanceTimersByTime(45);
  expect(spoken.map((u) => u.text)).toEqual([
    "Old story.",
    "Settings preview.",
  ]);
  spoken[1].onend?.();
  await legacy;
  queue.dispose();
});
