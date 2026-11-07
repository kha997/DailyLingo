import { beforeEach, describe, expect, it, vi } from "vitest";
import { stories } from "./content.ts";
import {
  emptyStoryLearning,
  findNotebookWord,
  getWordState,
  reconcileStoryProgress,
  sanitizeStoryLearning,
  toSavedStoryWord,
} from "./progress.ts";
import {
  clearAllUserData,
  consumeStorageRecoveryNotice,
  createUserDataBackup,
  importUserDataBackup,
  loadStoryLearning,
  saveStoryLearning,
  STORAGE_KEYS,
  INITIAL_USER_STATS,
} from "../utils/storage.ts";

beforeEach(() => {
  localStorage.clear();
  consumeStorageRecoveryNotice();
  vi.restoreAllMocks();
});

describe("story progress identity and migration", () => {
  it("starts at the first stable sentence without marking anything completed", () => {
    const progress = reconcileStoryProgress(stories[0]);
    expect(progress.activeSentenceId).toBe(stories[0].paragraphs[0][0].id);
    expect(progress.completedSentenceIds).toEqual([]);
    expect(progress.lookedUpWordIds).toEqual([]);
  });

  it("retains stable IDs across revisions and removes deleted references without positional guessing", () => {
    const story = stories[0];
    const sentence = story.paragraphs.flat()[1].id;
    const word = story.glossary[0].id;
    const result = reconcileStoryProgress(
      { ...story, version: story.version + 1 },
      {
        version: story.version,
        activeSentenceId: sentence,
        completedSentenceIds: [sentence, "removed", sentence],
        lookedUpWordIds: [word, "removed", word],
        updatedAt: "2026-11-07T12:00:00Z",
      },
    );
    expect(result.version).toBe(story.version + 1);
    expect(result.activeSentenceId).toBe(sentence);
    expect(result.completedSentenceIds).toEqual([sentence]);
    expect(result.lookedUpWordIds).toEqual([word]);
    expect(
      reconcileStoryProgress(story, { ...result, activeSentenceId: "removed" })
        .activeSentenceId,
    ).toBe(story.paragraphs[0][0].id);
  });

  it("preserves valid uncurated word occurrences only for the same content version", () => {
    const story = stories[0];
    const sentence = story.paragraphs[0][0];
    const candidate = [
      ...sentence.text.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu),
    ].find(
      (match) =>
        !sentence.words.some(
          (range) => match.index! >= range.start && match.index! < range.end,
        ),
    )!;
    const occurrence = `occ:${sentence.id}:${candidate.index!}`;
    const editorial = story.glossary[0].id;
    const stored = {
      ...reconcileStoryProgress(story),
      lookedUpWordIds: [
        occurrence,
        editorial,
        `occ:${sentence.id}:${candidate.index! + 1}`,
        `occ:unknown:0`,
        `occ:${sentence.id}:${sentence.text.length}`,
      ],
    };
    expect(reconcileStoryProgress(story, stored).lookedUpWordIds).toEqual([
      occurrence,
      editorial,
    ]);
    expect(
      reconcileStoryProgress({ ...story, version: story.version + 1 }, stored)
        .lookedUpWordIds,
    ).toEqual([editorial]);
  });

  it("validates Unicode words and contractions as whole occurrences, not substrings", () => {
    const original = stories[0];
    const sentence = {
      ...original.paragraphs[0][0],
      text: "I can't café 20.",
      words: [],
    };
    const story = { ...original, paragraphs: [[sentence]] };
    const ids = [0, 2, 4, 6, 8, 9, 13, 14, 15].map(
      (offset) => `occ:${sentence.id}:${offset}`,
    );
    const stored = { ...reconcileStoryProgress(story), lookedUpWordIds: ids };
    expect(reconcileStoryProgress(story, stored).lookedUpWordIds).toEqual(
      [0, 2, 8, 13].map((offset) => `occ:${sentence.id}:${offset}`),
    );
  });

  it("sanitizes malformed preferences and preserves well formed absent-story data", () => {
    const data = sanitizeStoryLearning({
      schemaVersion: 1,
      preferences: { rate: 99, showMarks: false },
      stories: {
        future: {
          version: 2,
          activeSentenceId: "s1",
          completedSentenceIds: ["s1", "s1", 2],
          lookedUpWordIds: ["word"],
          updatedAt: "bad",
        },
        invalid: { version: -1 },
      },
    });
    expect(data.preferences).toEqual({ rate: 1.5, showMarks: false });
    expect(data.stories.future.completedSentenceIds).toEqual(["s1"]);
    expect(data.stories.future.updatedAt).toBeNull();
    expect(data.stories.invalid).toBeUndefined();
    expect(sanitizeStoryLearning(null)).toEqual(emptyStoryLearning());
    expect(sanitizeStoryLearning({ schemaVersion: 2 })).toEqual(
      emptyStoryLearning(),
    );
    expect(
      sanitizeStoryLearning({
        schemaVersion: 1,
        preferences: { rate: NaN },
        stories: {},
      }).preferences.rate,
    ).toBe(1);
  });

  it("does not let an imported prototype key alter progress objects", () => {
    const data = sanitizeStoryLearning(
      JSON.parse(
        '{"schemaVersion":1,"stories":{"__proto__":{"version":1,"activeSentenceId":"bad"}}}',
      ),
    );
    expect(Object.keys(data.stories)).toEqual([]);
    expect(Object.getPrototypeOf(data.stories)).toBe(Object.prototype);
  });
});

describe("notebook is the sole source of saved and mastered state", () => {
  it("updates saved/mastered/deleted marks directly from the existing notebook", () => {
    const word = stories[0].glossary[0];
    const saved = toSavedStoryWord(stories[0], word);
    expect(getWordState(word, false, [])).toBe("unseen");
    expect(getWordState(word, true, [])).toBe("looked_up");
    expect(getWordState(word, true, [saved])).toBe("saved");
    expect(getWordState(word, false, [{ ...saved, mastered: true }])).toBe(
      "mastered",
    );
    expect(getWordState(word, true, [])).toBe("looked_up");
    expect(saved.reviewCount).toBe(0);
    expect(saved.mastered).toBe(false);
    expect(saved.nextReviewDate > saved.lastReviewedAt).toBe(true);
  });

  it("finds existing manual/library entries without conflating POS, senses or inflections", () => {
    const word = stories[0].glossary[0];
    const saved = toSavedStoryWord(stories[0], word);
    expect(
      findNotebookWord(word, [
        { ...saved, id: "manual", word: ` ${word.word.toUpperCase()} ` },
      ])?.id,
    ).toBe("manual");
    if (word.partOfSpeech === "n")
      expect(
        findNotebookWord(word, [{ ...saved, partOfSpeech: "noun" }]),
      ).toBeDefined();
    expect(
      findNotebookWord(word, [{ ...saved, partOfSpeech: "other-pos" }]),
    ).toBeUndefined();
    expect(
      findNotebookWord(word, [{ ...saved, meaningVi: "another sense" }]),
    ).toBeUndefined();
    expect(
      findNotebookWord(word, [{ ...saved, word: `${word.word}s` }]),
    ).toBeUndefined();
  });
});

describe("story learning storage and existing backup transaction", () => {
  const populated = () => ({
    ...emptyStoryLearning(),
    lastStoryId: stories[0].id,
    lastSessionAt: "2026-11-07T12:00:00Z",
    stories: {
      [stories[0].id]: {
        ...reconcileStoryProgress(stories[0]),
        lookedUpWordIds: [stories[0].glossary[0].id],
      },
    },
  });

  it("round trips marks, sentence progress and preferences through reload and backup/import", () => {
    const data = populated();
    data.preferences = { rate: 1.2, showMarks: false };
    expect(saveStoryLearning(data)).toBe(true);
    expect(loadStoryLearning()).toEqual(data);
    const backup = createUserDataBackup();
    expect(backup.stories).toEqual(data);
    localStorage.clear();
    expect(importUserDataBackup(JSON.stringify(backup)).ok).toBe(true);
    expect(loadStoryLearning()).toEqual(data);
    expect(clearAllUserData()).toBe(true);
    expect(loadStoryLearning()).toEqual(emptyStoryLearning());
  });

  it("preserves current story data byte for byte when importing a legacy v1 backup", () => {
    saveStoryLearning(populated());
    const original = localStorage.getItem(STORAGE_KEYS.stories);
    const backup = createUserDataBackup();
    delete backup.stories;
    expect(importUserDataBackup(JSON.stringify(backup)).ok).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.stories)).toBe(original);
  });

  it("rejects invalid story backup before writing legitimate data", () => {
    saveStoryLearning(populated());
    const original = localStorage.getItem(STORAGE_KEYS.stories);
    const backup = {
      ...createUserDataBackup(),
      stories: { schemaVersion: 99 },
    };
    expect(importUserDataBackup(JSON.stringify(backup)).ok).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.stories)).toBe(original);
  });

  it.each([false, true])(
    "rejects all-invalid or partially-invalid story entries before any profile writes (partial=%s)",
    (partial) => {
      saveStoryLearning(populated());
      localStorage.setItem(
        STORAGE_KEYS.stats,
        JSON.stringify({ ...INITIAL_USER_STATS, xp: 876 }),
      );
      const before = Object.fromEntries(
        Object.keys(localStorage).map((key) => [
          key,
          localStorage.getItem(key),
        ]),
      );
      const backup = createUserDataBackup();
      const malformed = {
        ...populated(),
        stories: {
          ...(partial ? populated().stories : {}),
          corrupt: {
            version: "bad",
            activeSentenceId: "s1",
            completedSentenceIds: [],
            lookedUpWordIds: [],
            updatedAt: null,
          },
        },
      };
      expect(
        importUserDataBackup(
          JSON.stringify({
            ...backup,
            stats: { ...INITIAL_USER_STATS, xp: 1 },
            stories: malformed,
          }),
        ).ok,
      ).toBe(false);
      expect(
        Object.fromEntries(
          Object.keys(localStorage).map((key) => [
            key,
            localStorage.getItem(key),
          ]),
        ),
      ).toEqual(before);
    },
  );

  it("recovers valid loaded entries but keeps original malformed story bytes in a recovery snapshot", () => {
    const malformed = {
      ...populated(),
      stories: { ...populated().stories, corrupt: { version: "bad" } },
    };
    const raw = JSON.stringify(malformed);
    localStorage.setItem(STORAGE_KEYS.stories, raw);
    expect(loadStoryLearning()).toEqual(populated());
    expect(localStorage.getItem(STORAGE_KEYS.stories)).toBe(raw);
    const notice = consumeStorageRecoveryNotice().find(
      (event) => event.key === STORAGE_KEYS.stories,
    )!;
    expect(notice.kind).toBe("corrupt");
    expect(localStorage.getItem(notice.backupKey!)).toBe(raw);
  });

  it("rolls back stats and words if the last story write fails", () => {
    saveStoryLearning(populated());
    localStorage.setItem(
      STORAGE_KEYS.stats,
      JSON.stringify({ ...INITIAL_USER_STATS, xp: 333 }),
    );
    const before = localStorage.getItem(STORAGE_KEYS.stories);
    const backup = {
      ...createUserDataBackup(),
      stats: { ...INITIAL_USER_STATS, xp: 1 },
      stories: emptyStoryLearning(),
    };
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === STORAGE_KEYS.stories && value !== before)
        throw new Error("quota");
      return original.call(this, key, value);
    });
    expect(importUserDataBackup(JSON.stringify(backup)).ok).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.stats)!).xp).toBe(333);
    expect(localStorage.getItem(STORAGE_KEYS.stories)).toBe(before);
    const snapshot = Object.keys(localStorage).find((key) =>
      key.startsWith("dailylingo_recovery_pre_import_"),
    )!;
    expect(
      JSON.parse(localStorage.getItem(snapshot)!).raw[STORAGE_KEYS.stories],
    ).toBe(before);
  });

  it("backs up corrupt raw bytes before returning defaults", () => {
    localStorage.setItem(STORAGE_KEYS.stories, "{bad");
    expect(loadStoryLearning()).toEqual(emptyStoryLearning());
    const notice = consumeStorageRecoveryNotice().find(
      (event) => event.key === STORAGE_KEYS.stories,
    )!;
    expect(notice.kind).toBe("corrupt");
    expect(localStorage.getItem(notice.backupKey!)).toBe("{bad");
    localStorage.setItem(STORAGE_KEYS.stories, "[]");
    expect(loadStoryLearning()).toEqual(emptyStoryLearning());
    expect(consumeStorageRecoveryNotice()[0].kind).toBe("corrupt");
  });

  it("reports blocked reads and failed writes without throwing or changing other keys", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadStoryLearning()).toEqual(emptyStoryLearning());
    expect(consumeStorageRecoveryNotice()[0].kind).toBe("blocked");
    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(saveStoryLearning(populated())).toBe(false);
    expect(consumeStorageRecoveryNotice()[0].kind).toBe("quota");
  });
});
