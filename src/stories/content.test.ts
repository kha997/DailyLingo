import { describe, expect, it } from "vitest";
import {
  makeStory,
  segmentSentences,
  stories,
  tokenizeSentence,
  type SentenceDraft,
} from "./content";

describe("original story content QA", () => {
  it("ships three level matched original stories with stable unique IDs", () => {
    expect(stories.map((s) => s.level)).toEqual(["A1", "A2", "B1"]);
    expect(new Set(stories.map((s) => s.id)).size).toBe(3);
    const ids = stories.flatMap((s) => s.paragraphs.flat().map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const story of stories) {
      expect(story.version).toBe(1);
      expect(story.paragraphs.flat().length).toBeGreaterThanOrEqual(10);
      expect(story.paragraphs.flat().length).toBeLessThanOrEqual(20);
      expect(story.source).toBe(
        story.paragraphs
          .map((p) => p.map((s) => s.text).join(" "))
          .join("\n\n"),
      );
      expect(segmentSentences(story.source)).toEqual(
        story.paragraphs.flat().map((s) => s.text),
      );
      expect(story.synopsis.length).toBeGreaterThan(20);
    }
  });
  it("preserves editorial sentence identities when inserting and reordering drafts", () => {
    for (const story of stories) {
      const existing = story.paragraphs.flat();
      const drafts: SentenceDraft[] = existing.map((s) => [
        s.id,
        s.text,
        s.translationVi,
        s.grammar.title,
        s.grammar.explanation,
        s.grammar.example,
      ]);
      const inserted: SentenceDraft = [
        `${story.id}-new-editorial-id`,
        "A new sentence.",
        "Một câu mới.",
        "Danh từ",
        "Ví dụ kiểm tra danh từ trong câu.",
        "This is a sentence.",
      ];
      const revised = makeStory(
        story.id,
        story.title,
        story.synopsis,
        story.level,
        [[drafts[2], inserted, ...drafts.slice(3), drafts[0], drafts[1]]],
        [],
      );
      const byText = new Map(
        revised.paragraphs
          .flat()
          .map((sentence) => [sentence.text, sentence.id]),
      );
      for (const sentence of existing)
        expect(byText.get(sentence.text)).toBe(sentence.id);
      expect(byText.get(inserted[1])).toBe(inserted[0]);
    }
  });
  it("provides Vietnamese translation, grammar and complete contextual glossary", () => {
    for (const story of stories) {
      const used = new Set<string>();
      for (const sentence of story.paragraphs.flat()) {
        expect(sentence.translationVi.length).toBeGreaterThan(10);
        expect(sentence.grammar.title.length).toBeGreaterThanOrEqual(2);
        expect(sentence.grammar.explanation.length).toBeGreaterThan(25);
        expect(sentence.grammar.example).toMatch(/[.!?]$/);
        expect(
          tokenizeSentence(sentence)
            .map((t) => t.text)
            .join(""),
        ).toBe(sentence.text);
        let end = 0;
        for (const range of sentence.words) {
          expect(range.start).toBeGreaterThanOrEqual(end);
          const word = story.glossary.find((w) => w.id === range.wordId);
          expect(word).toBeDefined();
          expect(sentence.text.slice(range.start, range.end)).toBe(word!.word);
          used.add(range.wordId);
          end = range.end;
        }
      }
      expect(new Set(story.glossary.map((w) => w.id)).size).toBe(
        story.glossary.length,
      );
      for (const word of story.glossary) {
        expect(used.has(word.id)).toBe(true);
        expect(word.meaningVi).toBeTruthy();
        expect(word.ipa).toMatch(/^\/.*\/$/);
        expect(word.partOfSpeech).toBeTruthy();
        expect(word.exampleEn).toBeTruthy();
        expect(word.exampleVi).toBeTruthy();
      }
    }
  });
  it("does not conflate inflection, casing or substrings", () => {
    const story = stories[0];
    const sentence = story.paragraphs[0][0];
    expect(
      sentence.words.map((w) => sentence.text.slice(w.start, w.end)),
    ).toEqual(["bag"]);
    expect(story.paragraphs[0][1].words.map((w) => w.wordId)).toContain(
      "apples-fruit",
    );
    expect(story.paragraphs[1][3].words).toEqual([]); // apple is not apples
  });
});

describe("deterministic editorial sentence segmentation", () => {
  it("retains abbreviations, initials, quotation marks and punctuation", () => {
    expect(
      segmentSentences(
        "Mr. Lee met Dr. A. Green. “Hello!” she said. Is it 3.5? Yes!",
      ),
    ).toEqual([
      "Mr. Lee met Dr. A. Green.",
      "“Hello!”",
      "she said.",
      "Is it 3.5?",
      "Yes!",
    ]);
  });
  it("retains common dotted abbreviations and distinguishes acronym sentence endings", () => {
    expect(
      segmentSentences(
        "Bring fruit, e.g. apples and pears. Use a bag, i.e. a cloth one.",
      ),
    ).toEqual([
      "Bring fruit, e.g. apples and pears.",
      "Use a bag, i.e. a cloth one.",
    ]);
    expect(
      segmentSentences(
        "The U.S. embassy is nearby. She lives in the U.S. We visit her.",
      ),
    ).toEqual([
      "The U.S. embassy is nearby.",
      "She lives in the U.S.",
      "We visit her.",
    ]);
  });
  it("handles blank sources and unpunctuated tails without losing content", () => {
    expect(segmentSentences("   ")).toEqual([]);
    expect(segmentSentences("Hello.\n\nA quiet ending")).toEqual([
      "Hello.",
      "A quiet ending",
    ]);
  });
  it("lets editors correct dialogue attribution and unusual abbreviations", () => {
    const source = "“Hello!” she said. Then she left.";
    expect(segmentSentences(source, [18])).toEqual([
      "“Hello!” she said.",
      "Then she left.",
    ]);
    expect(segmentSentences("Two. Ends.", [4, 10])).toEqual(["Two.", "Ends."]);
    expect(() => segmentSentences("Hello.", [0])).toThrow(
      "Invalid editorial boundary",
    );
    expect(() => segmentSentences("Hello.", [99])).toThrow(
      "Invalid editorial boundary",
    );
    expect(() => segmentSentences("Hello.", [2.5])).toThrow(
      "Invalid editorial boundary",
    );
  });
});
