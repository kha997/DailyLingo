import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi } from "vitest";
import { StoryReadingLab } from "./StoryReadingLab.tsx";

describe("StoryReadingLab", () => {
  it("opens a continuous passage and restores selection without autoplay", async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const props = {
      savedWords: [],
      onSaveWord: vi.fn(),
      onToggleMastered: vi.fn(),
      audioAccent: "en-US" as const,
    };
    await act(async () => root.render(<StoryReadingLab {...props} />));
    const open = host.querySelector("[data-open-story]") as HTMLButtonElement;
    expect(open).not.toBeNull();
    await act(async () => open.click());
    expect(
      host.querySelector('[data-testid="story-passage"] p'),
    ).not.toBeNull();
    expect(
      host.querySelectorAll("[data-sentence-id]").length,
    ).toBeGreaterThanOrEqual(10);
    expect(host.querySelector('[data-speaking="true"]')).toBeNull();
    expect(
      host.querySelector('[aria-label="Mở giải thích câu"]'),
    ).not.toBeNull();
    await act(async () => root.unmount());
    host.remove();
  });
});
