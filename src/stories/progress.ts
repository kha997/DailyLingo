import type { SavedWord } from "../types/index.ts";
import type { Story, StoryWord } from "./content.ts";

export interface StoryProgress {
  version: number;
  activeSentenceId: string;
  completedSentenceIds: string[];
  lookedUpWordIds: string[];
  updatedAt: string | null;
}

export interface StoryLearning {
  schemaVersion: 1;
  lastStoryId: string | null;
  lastSessionAt: string | null;
  preferences: { rate: number; showMarks: boolean };
  stories: Record<string, StoryProgress>;
}

export const emptyStoryLearning = (): StoryLearning => ({
  schemaVersion: 1,
  lastStoryId: null,
  lastSessionAt: null,
  preferences: { rate: 1, showMarks: true },
  stories: {},
});

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const date = (value: unknown): string | null =>
  typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : null;
const ids = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      ]
    : [];

/** Import validation is deliberately stricter than recovery sanitization: never
 * replace a learner's data with a partially discarded backup. Unknown story IDs
 * are valid; the structure, not this build's content catalogue, is authoritative.
 */
export function isValidStoryLearning(value: unknown): boolean {
  if (!record(value) || value.schemaVersion !== 1 || !record(value.stories))
    return false;
  const validIds = (input: unknown) =>
    Array.isArray(input) &&
    input.every((id) => typeof id === "string" && id.length > 0);
  const validDate = (input: unknown) => input === null || date(input) !== null;
  if (
    value.lastStoryId !== undefined &&
    value.lastStoryId !== null &&
    typeof value.lastStoryId !== "string"
  )
    return false;
  if (value.lastSessionAt !== undefined && !validDate(value.lastSessionAt))
    return false;
  if (
    value.preferences !== undefined &&
    (!record(value.preferences) ||
      typeof value.preferences.rate !== "number" ||
      !Number.isFinite(value.preferences.rate) ||
      typeof value.preferences.showMarks !== "boolean")
  )
    return false;
  return Object.entries(value.stories).every(
    ([id, progress]) =>
      id.length > 0 &&
      !["__proto__", "constructor", "prototype"].includes(id) &&
      record(progress) &&
      typeof progress.version === "number" &&
      Number.isInteger(progress.version) &&
      progress.version >= 1 &&
      typeof progress.activeSentenceId === "string" &&
      validIds(progress.completedSentenceIds) &&
      validIds(progress.lookedUpWordIds) &&
      validDate(progress.updatedAt),
  );
}

/** Validate shape without discarding progress for stories absent from this build. */
export function sanitizeStoryLearning(value: unknown): StoryLearning {
  const result = emptyStoryLearning();
  if (!record(value) || value.schemaVersion !== 1) return result;
  result.lastStoryId =
    typeof value.lastStoryId === "string" ? value.lastStoryId : null;
  result.lastSessionAt = date(value.lastSessionAt);
  if (record(value.preferences)) {
    const rate = value.preferences.rate;
    result.preferences.rate =
      typeof rate === "number" && Number.isFinite(rate)
        ? Math.max(0.5, Math.min(1.5, rate))
        : 1;
    result.preferences.showMarks = value.preferences.showMarks !== false;
  }
  if (record(value.stories)) {
    for (const [id, progress] of Object.entries(value.stories)) {
      if (
        id === "__proto__" ||
        id === "constructor" ||
        id === "prototype" ||
        !record(progress)
      )
        continue;
      if (
        typeof progress.version !== "number" ||
        !Number.isInteger(progress.version) ||
        progress.version < 1
      )
        continue;
      result.stories[id] = {
        version: progress.version,
        activeSentenceId:
          typeof progress.activeSentenceId === "string"
            ? progress.activeSentenceId
            : "",
        completedSentenceIds: ids(progress.completedSentenceIds),
        lookedUpWordIds: ids(progress.lookedUpWordIds),
        updatedAt: date(progress.updatedAt),
      };
    }
  }
  return result;
}

/** Editorial IDs survive revisions. Removed IDs fall back safely, never by index. */
export function reconcileStoryProgress(
  story: Story,
  stored?: StoryProgress,
): StoryProgress {
  const sentences = story.paragraphs.flat();
  const sentenceIds = sentences.map((sentence) => sentence.id);
  const wordIds = new Set(story.glossary.map((word) => word.id));
  // Uncurated words use occurrence offsets, which are safe only in the exact
  // content version. Validate whole-token starts rather than a loose numeric
  // suffix: an offset in punctuation or inside a contraction is not a word ID.
  if (stored?.version === story.version) {
    for (const sentence of sentences) {
      for (const match of sentence.text.matchAll(
        /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu,
      )) {
        if (
          !sentence.words.some(
            (range) => match.index! >= range.start && match.index! < range.end,
          )
        ) {
          wordIds.add(`occ:${sentence.id}:${match.index!}`);
        }
      }
    }
  }
  return {
    version: story.version,
    activeSentenceId:
      stored && sentenceIds.includes(stored.activeSentenceId)
        ? stored.activeSentenceId
        : (sentenceIds[0] ?? ""),
    completedSentenceIds: [
      ...new Set(stored?.completedSentenceIds ?? []),
    ].filter((id) => sentenceIds.includes(id)),
    lookedUpWordIds: [...new Set(stored?.lookedUpWordIds ?? [])].filter((id) =>
      wordIds.has(id),
    ),
    updatedAt: stored?.updatedAt ?? null,
  };
}

const normalize = (value: string) =>
  value.normalize("NFC").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
const normalizePos = (value: string) => {
  const key = normalize(value).replace(/\.$/, "");
  const aliases: Record<string, string> = {
    n: "noun",
    v: "verb",
    adj: "adjective",
    adv: "adverb",
    prep: "preposition",
    pron: "pronoun",
    conj: "conjunction",
  };
  return aliases[key] ?? key;
};

/** Exact lexical form, part of speech AND meaning: never substring/inflection matching. */
export function findNotebookWord(
  word: StoryWord,
  words: SavedWord[],
): SavedWord | undefined {
  return words.find(
    (saved) =>
      normalize(saved.word) === normalize(word.word) &&
      normalizePos(saved.partOfSpeech) === normalizePos(word.partOfSpeech) &&
      normalize(saved.meaningVi) === normalize(word.meaningVi),
  );
}

export function getWordState(
  word: StoryWord,
  lookedUp: boolean,
  words: SavedWord[],
): "unseen" | "looked_up" | "saved" | "mastered" {
  const saved = findNotebookWord(word, words);
  return saved
    ? saved.mastered
      ? "mastered"
      : "saved"
    : lookedUp
      ? "looked_up"
      : "unseen";
}

export function toSavedStoryWord(story: Story, word: StoryWord): SavedWord {
  const today = new Date();
  const localDate = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  const next = new Date(today);
  next.setDate(next.getDate() + 1);
  return {
    ...word,
    id: `story:${story.id}:${word.id}`,
    level: story.level,
    topic: "daily",
    mastered: false,
    reviewCount: 0,
    lastReviewedAt: localDate(today),
    nextReviewDate: localDate(next),
  };
}
