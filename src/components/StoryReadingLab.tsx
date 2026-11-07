import React, { useEffect, useRef, useState } from "react";
import type { SavedWord } from "../types/index.ts";
import {
  stories,
  type Story,
  type StoryWord,
  type StorySentence,
} from "../stories/content.ts";
import {
  reconcileStoryProgress,
  getWordState,
  findNotebookWord,
  toSavedStoryWord,
  type StoryLearning,
  type StoryProgress,
} from "../stories/progress.ts";
import {
  loadStoryLearning,
  saveStoryLearning,
  consumeStorageRecoveryNotice,
} from "../utils/storage.ts";
import { StorySpeechQueue } from "../utils/storySpeech.ts";
import "./StoryReadingLab.css";

type Props = {
  savedWords: SavedWord[];
  onSaveWord: (word: SavedWord) => void;
  onToggleMastered: (id: string) => void;
  audioAccent: "en-US" | "en-GB";
  suspended?: boolean;
};
type Lookup = { word: StoryWord; sentenceId: string; authored: boolean };

export function StoryReadingLab(props: Props) {
  const [learning, setLearning] = useState(loadStoryLearning);
  const learningRef = useRef(learning);
  const [storyId, setStoryId] = useState<string | null>(null);
  const story = stories.find((s) => s.id === storyId);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupMode, setLookupMode] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [writeFailed, setWriteFailed] = useState(false);
  const passage = useRef<HTMLElement>(null);
  const storyRef = useRef<Story | undefined>(story);
  storyRef.current = story;
  const queueRef = useRef<StorySpeechQueue | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const press = useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const touch = useRef(false);
  const lookupTrigger = useRef<HTMLElement | null>(null);
  const lookupPanel = useRef<HTMLDivElement>(null);

  function persist(update: (value: StoryLearning) => StoryLearning) {
    const next = update(learningRef.current);
    learningRef.current = next;
    setLearning(next);
    setWriteFailed(!saveStoryLearning(next));
  }
  function updateProgress(
    update: (p: StoryProgress, s: Story) => StoryProgress,
  ) {
    const s = storyRef.current;
    if (!s) return;
    persist((l) => ({
      ...l,
      lastStoryId: s.id,
      lastSessionAt: new Date().toISOString(),
      stories: {
        ...l.stories,
        [s.id]: update(reconcileStoryProgress(s, l.stories[s.id]), s),
      },
    }));
  }
  useEffect(() => {
    const recovered = consumeStorageRecoveryNotice();
    if (recovered.length)
      setError(
        recovered.some((e) => e.kind === "corrupt")
          ? "Dữ liệu truyện không hợp lệ. Bản gốc được giữ trong bản khôi phục khi trình duyệt cho phép."
          : "Bộ nhớ trình duyệt không khả dụng; hãy xuất dữ liệu trong Cài đặt.",
      );
    const q = new StorySpeechQueue({
      onSentence(index) {
        setSpeaking(index);
        updateProgress((p, s) => ({
          ...p,
          activeSentenceId: s.paragraphs.flat()[index].id,
          updatedAt: new Date().toISOString(),
        }));
      },
      onComplete(index) {
        updateProgress((p, s) => ({
          ...p,
          completedSentenceIds: Array.from(
            new Set([...p.completedSentenceIds, s.paragraphs.flat()[index].id]),
          ),
          updatedAt: new Date().toISOString(),
        }));
      },
      onState(next) {
        setState(next);
        if (next !== "playing") setSpeaking(null);
      },
      onError(message) {
        setError(message);
        setSpeaking(null);
      },
    });
    queueRef.current = q;
    const hidden = () => {
      if (document.hidden) {
        if (q.state === "playing") q.pause();
        else if (q.state === "idle") q.stop();
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      q.dispose();
      queueRef.current = null;
      document.removeEventListener("visibilitychange", hidden);
      clearPending();
      clearPress();
    };
  }, []);
  useEffect(() => {
    if (props.suspended) {
      clearPending();
      if (queueRef.current?.state === "playing") queueRef.current.pause();
      else if (queueRef.current?.state === "idle") queueRef.current.stop();
    }
  }, [props.suspended]);
  useEffect(() => {
    if (speaking === null) return;
    const s = storyRef.current?.paragraphs.flat()[speaking];
    if (!s) return;
    const el = passage.current?.querySelector(`[data-sentence-id="${s.id}"]`);
    const rect = el?.getBoundingClientRect();
    if (rect && (rect.top < 170 || rect.bottom > window.innerHeight - 100))
      el?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [speaking]);
  useEffect(() => {
    if (lookup) lookupPanel.current?.focus();
  }, [lookup]);

  const sentences = story?.paragraphs.flat() ?? [];
  const progress = story
    ? reconcileStoryProgress(story, learning.stories[story.id])
    : null;
  const activeIndex = Math.max(
    0,
    sentences.findIndex((s) => s.id === progress?.activeSentenceId),
  );
  const active = sentences[activeIndex];
  const options = {
    rate: learning.preferences.rate,
    accent: props.audioAccent,
  };
  function clearPending() {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
  }
  function clearPress() {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  }
  function closeLookup() {
    setLookup(null);
    lookupTrigger.current?.focus();
  }
  function openStory(s: Story) {
    clearPending();
    queueRef.current?.stop();
    setLookup(null);
    setTranslation(false);
    setError("");
    setStoryId(s.id);
    storyRef.current = s;
    persist((l) => ({
      ...l,
      lastStoryId: s.id,
      lastSessionAt: new Date().toISOString(),
      stories: {
        ...l.stories,
        [s.id]: reconcileStoryProgress(s, l.stories[s.id]),
      },
    }));
  }
  function select(index: number, play = true) {
    clearPending();
    queueRef.current?.stop();
    setLookup(null);
    setError("");
    setTranslation(false);
    setStudyOpen(true);
    updateProgress((p) => ({
      ...p,
      activeSentenceId: sentences[index].id,
      updatedAt: new Date().toISOString(),
    }));
    if (play)
      queueRef.current?.play(
        sentences.map((s) => s.text),
        index,
        false,
        options,
      );
  }
  function playAll() {
    clearPending();
    setError("");
    setLookup(null);
    queueRef.current?.play(
      sentences.map((s) => s.text),
      activeIndex,
      true,
      options,
    );
  }
  function lookupWord(target: HTMLElement) {
    clearPending();
    clearPress();
    queueRef.current?.stop();
    setError("");
    const id = target.dataset.wordId;
    const sentenceId =
      target.closest<HTMLElement>("[data-sentence-id]")?.dataset.sentenceId;
    if (!story || !id || !sentenceId) return;
    const authored = story.glossary.find((w) => w.id === id);
    const word = authored ?? {
      id,
      word: target.textContent ?? "",
      ipa: "",
      partOfSpeech: "",
      meaningVi:
        "Chưa có nghĩa biên tập cho từ này trong truyện. Hãy xem bản dịch cả câu để hiểu ngữ cảnh.",
      exampleEn: sentences.find((s) => s.id === sentenceId)?.text ?? "",
      exampleVi:
        sentences.find((s) => s.id === sentenceId)?.translationVi ?? "",
    };
    lookupTrigger.current = target;
    setLookup({ word, sentenceId, authored: !!authored });
    updateProgress((p) => ({
      ...p,
      activeSentenceId: sentenceId,
      lookedUpWordIds: Array.from(new Set([...p.lookedUpWordIds, id])),
      updatedAt: new Date().toISOString(),
    }));
  }
  function targetOf(event: React.SyntheticEvent) {
    return (event.target as HTMLElement).closest<HTMLElement>("[data-word-id]");
  }
  function onClick(event: React.MouseEvent) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const token = targetOf(event);
    const sentence = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-sentence-id]",
    );
    if (!sentence) return;
    const index = sentences.findIndex(
      (s) => s.id === sentence.dataset.sentenceId,
    );
    if (index < 0) return;
    if (token && lookupMode) {
      lookupWord(token);
      return;
    }
    if (token && !touch.current) {
      clearPending();
      if (event.detail > 1) return;
      // Browser click arrives before dblclick. Delay only word clicks; sentence
      // whitespace and keyboard remain immediate. A second click cancels this job.
      queueRef.current?.stop();
      pending.current = setTimeout(() => select(index), 550);
    } else select(index);
    touch.current = false;
  }
  function onPointerDown(event: React.PointerEvent) {
    touch.current = event.pointerType === "touch";
    suppressClick.current = false;
    clearPress();
    if (event.pointerType !== "touch") return;
    const token = targetOf(event);
    if (!token) return;
    press.current = {
      x: event.clientX,
      y: event.clientY,
      timer: setTimeout(() => {
        suppressClick.current = true;
        lookupWord(token);
      }, 500),
    };
  }
  function renderSentence(s: StorySentence, index: number) {
    // Editorial ranges carry contextual sense IDs. Other words get occurrence IDs
    // rather than substring matching; apostrophes stay within the word token.
    const ranges = s.words ?? [];
    const fragments: React.ReactNode[] = [];
    let pos = 0;
    const addText = (text: string, offset: number) => {
      const pattern = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
      let cursor = 0;
      for (const match of text.matchAll(pattern)) {
        const start = match.index!;
        fragments.push(text.slice(cursor, start));
        const id = `occ:${s.id}:${offset + start}`;
        fragments.push(wordSpan(match[0], id));
        cursor = start + match[0].length;
      }
      fragments.push(text.slice(cursor));
    };
    function wordSpan(text: string, id: string) {
      const word = story!.glossary.find((w) => w.id === id);
      const mark = getWordState(
        word ??
          ({ id, word: text, partOfSpeech: "", meaningVi: "" } as StoryWord),
        !!progress?.lookedUpWordIds.includes(id),
        props.savedWords,
      );
      return (
        <span
          key={`${s.id}-${pos}-${id}-${fragments.length}`}
          data-word-id={id}
          data-learning-state={mark}
          tabIndex={lookupMode ? 0 : -1}
          role={lookupMode ? "button" : undefined}
          aria-label={
            lookupMode
              ? `Tra từ ${text}${mark === "unseen" ? "" : mark === "looked_up" ? ", đã tra" : mark === "saved" ? ", đã lưu" : ", đã thuộc"}`
              : undefined
          }
          title={mark === "unseen" ? undefined : `${text}: ${mark}`}
          className="story-word"
        >
          {text}
        </span>
      );
    }
    for (const range of ranges) {
      addText(s.text.slice(pos, range.start), pos);
      pos = range.start;
      fragments.push(
        wordSpan(s.text.slice(range.start, range.end), range.wordId),
      );
      pos = range.end;
    }
    addText(s.text.slice(pos), pos);
    return (
      <React.Fragment key={s.id}>
        <span
          data-sentence-id={s.id}
          data-speaking={
            speaking === index && state === "playing" ? "true" : "false"
          }
          aria-current={index === activeIndex ? "true" : undefined}
          tabIndex={lookupMode ? -1 : 0}
          role={lookupMode ? undefined : "button"}
          aria-label={lookupMode ? undefined : `Câu ${index + 1}: ${s.text}`}
          className="story-sentence"
        >
          {fragments}
        </span>{" "}
      </React.Fragment>
    );
  }

  if (!story)
    return (
      <section className="story-lab" aria-label="Thư viện truyện">
        <div className="story-library-intro">
          <span className="story-eyebrow">STORY READING LAB</span>
          <h1>
            Những câu chuyện nhỏ.
            <br />
            Một thế giới tiếng Anh.
          </h1>
          <p>
            Đọc chậm, nghe rõ, khám phá từng câu. Ba truyện nguyên bản, từ A1
            đến B1.
          </p>
          <small>Tiến độ và dấu học tập chỉ lưu trên trình duyệt này.</small>
        </div>
        {learning.lastStoryId &&
          stories.some((s) => s.id === learning.lastStoryId) && (
            <button
              className="story-primary"
              onClick={() =>
                openStory(stories.find((s) => s.id === learning.lastStoryId)!)
              }
            >
              Tiếp tục truyện gần nhất
            </button>
          )}
        {(error || writeFailed) && (
          <p role="alert" className="story-warning">
            {writeFailed
              ? "Không thể lưu tiến độ. Hãy xuất dữ liệu trong Cài đặt."
              : error}
          </p>
        )}
        <div className="story-library-grid">
          {stories.map((s, i) => {
            const p = reconcileStoryProgress(s, learning.stories[s.id]);
            const count = s.paragraphs.flat().length;
            return (
              <article className="story-book" key={s.id}>
                <div
                  className={`story-cover story-cover-${i}`}
                  aria-hidden="true"
                >
                  <span>{s.level}</span>
                  <b>{["☀", "☂", "✉"][i]}</b>
                  <small>DAILYLINGO ORIGINAL</small>
                </div>
                <div className="story-book-info">
                  <span className="story-eyebrow">
                    {s.level} · {count} câu ·{" "}
                    {Math.max(1, Math.ceil(s.source.split(/\s+/).length / 100))}{" "}
                    phút đọc
                  </span>
                  <h2>{s.title}</h2>
                  <p>{s.synopsis}</p>
                  <progress
                    aria-label={`Tiến độ ${s.title}`}
                    value={p.completedSentenceIds.length}
                    max={count}
                  />
                  <small>
                    {p.completedSentenceIds.length}/{count} câu đã nghe / xác
                    nhận đọc
                  </small>
                  <button
                    data-open-story={s.id}
                    className="story-primary"
                    aria-label={`${learning.stories[s.id] ? "Tiếp tục đọc" : "Đọc"} ${s.title}`}
                    onClick={() => openStory(s)}
                  >
                    {learning.stories[s.id] ? "Tiếp tục đọc" : "Mở truyện"}{" "}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );

  const notebookWord = lookup?.authored
    ? findNotebookWord(lookup.word, props.savedWords)
    : undefined;
  return (
    <section className="story-lab" aria-label="Đọc truyện">
      <div className="story-reader-heading">
        <button
          aria-label="Tất cả truyện"
          onClick={() => {
            clearPending();
            queueRef.current?.stop();
            setStoryId(null);
            setLookup(null);
          }}
        >
          ← Tất cả truyện
        </button>
        <span>
          {story.level} · {sentences.length} câu
        </span>
      </div>
      <header className="story-title">
        <span className="story-eyebrow">
          DAILYLINGO ORIGINAL · {story.level}
        </span>
        <h1>{story.title}</h1>
        <p>{story.synopsis}</p>
      </header>
      <div
        className="story-controls"
        role="group"
        aria-label="Điều khiển nghe truyện"
      >
        <button className="story-primary" onClick={playAll}>
          Nghe toàn truyện
        </button>
        {state === "paused" ? (
          <button
            onClick={() => {
              setError("");
              queueRef.current?.resume();
            }}
          >
            Tiếp tục nghe
          </button>
        ) : (
          <button
            disabled={state !== "playing"}
            onClick={() => {
              clearPending();
              queueRef.current?.pause();
            }}
          >
            Tạm dừng
          </button>
        )}
        <button
          onClick={() => {
            clearPending();
            queueRef.current?.stop();
          }}
        >
          Dừng
        </button>
        <button onClick={() => select(activeIndex)}>Đọc lại câu</button>
        <label>
          Tốc độ đọc{" "}
          <select
            aria-label="Tốc độ đọc"
            value={learning.preferences.rate}
            onChange={(e) => {
              queueRef.current?.stop();
              persist((l) => ({
                ...l,
                preferences: { ...l.preferences, rate: Number(e.target.value) },
              }));
            }}
          >
            {Array.from(new Set([0.8, 1, 1.2, learning.preferences.rate]))
              .sort((a, b) => a - b)
              .map((r) => (
                <option value={r} key={r}>
                  {r}×
                </option>
              ))}
          </select>
        </label>
        <button
          aria-pressed={lookupMode}
          onClick={() => {
            clearPending();
            setLookupMode(!lookupMode);
          }}
        >
          Tra từ
        </button>
        <button
          aria-pressed={learning.preferences.showMarks}
          onClick={() =>
            persist((l) => ({
              ...l,
              preferences: {
                ...l.preferences,
                showMarks: !l.preferences.showMarks,
              },
            }))
          }
        >
          Hiện dấu học tập
        </button>
      </div>
      <p className="story-help">
        Chạm câu để nghe · Nhấp đúp hoặc nhấn giữ từ để tra · Bật “Tra từ” rồi
        chọn từ bằng chuột hoặc bàn phím. Tạm dừng và tiếp tục sẽ đọc lại câu
        hiện tại.
      </p>
      <p className="story-status" role="status">
        {state === "playing"
          ? `Đang nghe câu ${(speaking ?? activeIndex) + 1}`
          : state === "paused"
            ? "Đã tạm dừng"
            : "Sẵn sàng"}{" "}
        · Câu {activeIndex + 1}/{sentences.length} ·{" "}
        {progress?.completedSentenceIds.length} câu hoàn thành
      </p>
      {(error || writeFailed) && (
        <p role="alert" className="story-warning">
          {writeFailed
            ? "Không thể lưu tiến độ. Hãy xuất dữ liệu trong Cài đặt."
            : error}
        </p>
      )}
      <div className="story-reader-grid">
        <article
          ref={passage}
          className="story-passage"
          lang="en"
          data-testid="story-passage"
          data-marks-visible={learning.preferences.showMarks ? "true" : "false"}
          onClick={onClick}
          onDoubleClick={(e) => {
            const token = targetOf(e);
            if (token) {
              lookupWord(token);
            }
          }}
          onPointerDown={onPointerDown}
          onPointerUp={clearPress}
          onPointerCancel={() => {
            clearPress();
            suppressClick.current = true;
          }}
          onPointerMove={(e) => {
            if (
              press.current &&
              Math.hypot(
                e.clientX - press.current.x,
                e.clientY - press.current.y,
              ) > 10
            )
              clearPress();
          }}
          onContextMenu={(e) => {
            if (suppressClick.current) e.preventDefault();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            const token = targetOf(e);
            e.preventDefault();
            if (token && lookupMode) lookupWord(token);
            else {
              const id = (e.target as HTMLElement).closest<HTMLElement>(
                "[data-sentence-id]",
              )?.dataset.sentenceId;
              const i = sentences.findIndex((s) => s.id === id);
              if (i >= 0) select(i);
            }
          }}
        >
          {story.paragraphs.map((p, i) => (
            <p key={i}>
              {p.map((s) => renderSentence(s, sentences.indexOf(s)))}
            </p>
          ))}
        </article>
        <button
          className="story-mobile-study-trigger"
          aria-label="Mở giải thích câu"
          aria-expanded={studyOpen}
          onClick={() => setStudyOpen(!studyOpen)}
        >
          Khám phá câu {activeIndex + 1} · Dịch & ngữ pháp
        </button>
        <aside
          className={`story-study ${studyOpen ? "story-study-open" : ""}`}
          aria-label="Khám phá câu"
        >
          <button
            className="story-mobile-study-close"
            aria-label="Đóng giải thích câu"
            onClick={() => setStudyOpen(false)}
          >
            Đóng giải thích câu ×
          </button>
          <span className="story-eyebrow">KHÁM PHÁ CÂU {activeIndex + 1}</span>
          <p lang="en" className="story-study-sentence">
            {active.text}
          </p>
          <div className="story-sentence-nav">
            <button
              disabled={activeIndex === 0}
              onClick={() => select(activeIndex - 1, false)}
            >
              Câu trước
            </button>
            <button
              disabled={activeIndex === sentences.length - 1}
              onClick={() => select(activeIndex + 1, false)}
            >
              Câu tiếp
            </button>
          </div>
          <button
            aria-expanded={translation}
            onClick={() => setTranslation(!translation)}
          >
            Hiện bản dịch
          </button>
          {translation && <p lang="vi">{active.translationVi}</p>}
          <details key={active.id}>
            <summary>Ngữ pháp</summary>
            <h3>{active.grammar.title}</h3>
            <p>{active.grammar.explanation}</p>
            <p lang="en">
              <em>{active.grammar.example}</em>
            </p>
          </details>
          <details>
            <summary>Từ vựng trong câu</summary>
            <div className="story-vocab-list">
              {Array.from(new Set(active.words.map((w) => w.wordId))).map(
                (id) => {
                  const w = story.glossary.find((w) => w.id === id)!;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        const el = passage.current?.querySelector<HTMLElement>(
                          `[data-sentence-id="${active.id}"] [data-word-id="${id}"]`,
                        );
                        if (el) lookupWord(el);
                      }}
                    >
                      {w.word} — {w.partOfSpeech}
                    </button>
                  );
                },
              )}
              {active.words.length === 0 && (
                <p>Bật Tra từ để chọn một từ trong đoạn văn.</p>
              )}
            </div>
          </details>
          <button
            onClick={() =>
              updateProgress((p) => ({
                ...p,
                completedSentenceIds: Array.from(
                  new Set([...p.completedSentenceIds, active.id]),
                ),
                updatedAt: new Date().toISOString(),
              }))
            }
          >
            Xác nhận đã đọc câu
          </button>
          <details className="story-legend">
            <summary>Dấu học tập</summary>
            <p>
              <span data-legend="looked_up">Chấm: đã tra</span> ·{" "}
              <span data-legend="saved">Gạch: đã lưu</span> ·{" "}
              <span data-legend="mastered">Gạch đôi: đã thuộc</span>
            </p>
            <small>
              Dấu áp dụng cùng nghĩa biên tập trong truyện. Trạng thái lưu/thuộc
              lấy từ sổ từ; không cộng XP.
            </small>
          </details>
        </aside>
      </div>
      <div className="story-end-actions">
        <button
          onClick={() => {
            queueRef.current?.stop();
            select(0, false);
            updateProgress((p) => ({ ...p, completedSentenceIds: [] }));
          }}
        >
          Đọc lại từ đầu
        </button>
        <button
          onClick={() =>
            updateProgress((p) => ({
              ...p,
              completedSentenceIds: sentences.map((s) => s.id),
              updatedAt: new Date().toISOString(),
            }))
          }
        >
          Đánh dấu hoàn thành truyện
        </button>
      </div>
      {lookup && (
        <div
          ref={lookupPanel}
          tabIndex={-1}
          className="story-lookup"
          role="dialog"
          aria-modal="false"
          aria-label="Tra từ trong ngữ cảnh"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeLookup();
          }}
        >
          <button
            className="story-lookup-close"
            aria-label="Đóng tra từ"
            onClick={closeLookup}
          >
            ×
          </button>
          <span className="story-eyebrow">TRA TỪ TRONG NGỮ CẢNH</span>
          <h2 lang="en">{lookup.word.word}</h2>
          <p>
            {lookup.word.ipa} {lookup.word.partOfSpeech}
          </p>
          <p>{lookup.word.meaningVi}</p>
          <blockquote lang="en">{lookup.word.exampleEn}</blockquote>
          <small>{lookup.word.exampleVi}</small>
          <div className="story-lookup-actions">
            <button
              onClick={() =>
                queueRef.current?.speakWord(lookup.word.word, options)
              }
            >
              Nghe từ
            </button>
            {lookup.authored && (
              <button
                disabled={!!notebookWord}
                onClick={() =>
                  props.onSaveWord(toSavedStoryWord(story, lookup.word))
                }
              >
                {notebookWord ? "Đã lưu vào sổ từ" : "Lưu vào sổ từ"}
              </button>
            )}
            {notebookWord && (
              <button onClick={() => props.onToggleMastered(notebookWord.id)}>
                {notebookWord.mastered ? "Cần ôn lại" : "Đánh dấu đã thuộc"}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
