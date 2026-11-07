import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";

/** Real Chromium interactions with deterministic, explicitly mocked Web Speech.
 * These tests do not verify audible output on physical desktop/mobile hardware.
 */
declare global {
  interface Window {
    storySpeechTest: {
      spoken: SpeechSynthesisUtterance[];
      cancelled: number;
      finish: (index: number) => void;
      fail: (index: number) => void;
    };
  }
}

async function installSpeech(page: Page) {
  await page.addInitScript(() => {
    const spoken: SpeechSynthesisUtterance[] = [];
    const state = {
      spoken,
      cancelled: 0,
      finish(index: number) {
        spoken[index]?.onend?.(new Event("end") as SpeechSynthesisEvent);
      },
      fail(index: number) {
        spoken[index]?.onerror?.(
          Object.assign(new Event("error"), {
            error: "interrupted",
          }) as SpeechSynthesisErrorEvent,
        );
      },
    };
    class Utterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      volume = 1;
      voice = null;
      onend = null;
      onerror = null;
      onstart = null;
      constructor(text = "") {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: Utterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        speak: (utterance: SpeechSynthesisUtterance) => {
          spoken.push(utterance);
          utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
        },
        cancel: () => {
          state.cancelled += 1;
        },
        pause: () => {},
        resume: () => {},
        speaking: false,
        pending: false,
        paused: false,
      },
    });
    window.storySpeechTest = state;
  });
}

async function openLibrary(page: Page) {
  await page
    .getByRole("button", { name: "Đọc truyện", exact: true })
    .filter({ visible: true })
    .click();
}

async function openFirstStory(page: Page) {
  await openLibrary(page);
  await page.locator("[data-open-story]").first().click();
  await expect(page.getByTestId("story-passage")).toBeVisible();
}

async function startClean(page: Page) {
  await installSpeech(page);
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("dailylingo_saved_words", "[]");
  });
  await page.reload();
  await openFirstStory(page);
}

const sentence = (page: Page, index = 0) =>
  page.getByTestId("story-passage").locator("[data-sentence-id]").nth(index);
const word = (page: Page) =>
  page
    .getByTestId("story-passage")
    .locator('[data-word-id]:not([data-word-id^="occ:"])')
    .first();
const lookup = (page: Page) =>
  page.getByRole("dialog", { name: "Tra từ trong ngữ cảnh" });
const spokenTexts = (page: Page) =>
  page.evaluate(() => window.storySpeechTest.spoken.map((item) => item.text));
async function speakCount(page: Page, count: number) {
  await expect.poll(async () => (await spokenTexts(page)).length).toBe(count);
}
async function finish(page: Page, index: number) {
  await page.evaluate((i) => window.storySpeechTest.finish(i), index);
}
async function clickSentence(target: Locator) {
  // Keyboard activation avoids a nested glossary token when testing sentence controls.
  await target.focus();
  await target.press("Enter");
}

test("story library contains three levelled original passages and continuous paragraphs", async ({
  page,
}) => {
  await startClean(page);
  const passage = page.getByTestId("story-passage");
  expect(await passage.locator("p").count()).toBeGreaterThan(0);
  expect(
    await passage.locator("[data-sentence-id]").count(),
  ).toBeGreaterThanOrEqual(10);
  expect(
    await passage.locator("[data-sentence-id]").count(),
  ).toBeLessThanOrEqual(20);
  await expect(passage.locator("[data-sentence-id]").first()).toHaveRole(
    "button",
  );
  expect(await spokenTexts(page)).toEqual([]);
  await page
    .getByRole("button", { name: "Tất cả truyện", exact: true })
    .click();
  for (const level of ["A1", "A2", "B1"])
    await expect(page.getByText(level, { exact: true })).toBeVisible();
  await expect(page.locator("[data-open-story]")).toHaveCount(3);
});

test("whole-story playback highlights queue transitions, cancels stale callbacks, and stops", async ({
  page,
}) => {
  await startClean(page);
  const firstText = (await sentence(page, 0).innerText()).trim();
  const secondText = (await sentence(page, 1).innerText()).trim();
  await page
    .getByRole("button", { name: "Nghe toàn truyện", exact: true })
    .click();
  await speakCount(page, 1);
  expect(await spokenTexts(page)).toEqual([firstText]);
  await expect(sentence(page, 0)).toHaveAttribute("data-speaking", "true");
  await finish(page, 0);
  await speakCount(page, 2);
  expect((await spokenTexts(page))[1]).toBe(secondText);
  await expect(sentence(page, 1)).toHaveAttribute("data-speaking", "true");
  await expect(sentence(page, 0)).not.toHaveAttribute("data-speaking", "true");

  await sentence(page, 4).click();
  await speakCount(page, 3);
  await expect(sentence(page, 4)).toHaveAttribute("data-speaking", "true");
  const cancels = await page.evaluate(() => window.storySpeechTest.cancelled);
  expect(cancels).toBeGreaterThan(0);
  await finish(page, 1);
  await page.evaluate(() => window.storySpeechTest.fail(1));
  await expect(sentence(page, 4)).toHaveAttribute("data-speaking", "true");
  await page.getByRole("button", { name: "Dừng", exact: true }).click();
  await finish(page, 2);
  await expect(page.locator('[data-speaking="true"]')).toHaveCount(0);
  expect(await spokenTexts(page)).toHaveLength(3);
});

test("sentence study, replay, pause/resume, speed and reload preserve position without autoplay", async ({
  page,
}) => {
  await startClean(page);
  const targetId = await sentence(page, 3).getAttribute("data-sentence-id");
  await clickSentence(sentence(page, 3));
  await speakCount(page, 1);
  await page
    .getByRole("button", { name: "Hiện bản dịch", exact: true })
    .click();
  await expect(page.locator('.story-study p[lang="vi"]')).toBeVisible();
  await expect(page.getByText("Ngữ pháp", { exact: true })).toBeVisible();
  await page
    .locator(".story-study summary")
    .filter({ hasText: /^Ngữ pháp$/ })
    .click();
  await expect(page.locator(".story-study details h3")).toBeVisible();
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await page
    .getByRole("button", { name: "Tiếp tục nghe", exact: true })
    .click();
  await speakCount(page, 2);
  expect((await spokenTexts(page))[1]).toBe((await spokenTexts(page))[0]);
  await page.getByRole("button", { name: "Dừng", exact: true }).click();
  await page.getByRole("button", { name: "Đọc lại câu", exact: true }).click();
  await speakCount(page, 3);
  await page.getByLabel("Tốc độ đọc", { exact: true }).selectOption("1.2");
  await page.getByRole("button", { name: "Câu tiếp", exact: true }).click();
  await expect(sentence(page, 4)).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Câu trước", exact: true }).click();
  await expect(
    page.locator(`[data-sentence-id="${targetId}"]`),
  ).toHaveAttribute("aria-current", "true");
  await page.reload();
  await openFirstStory(page);
  await expect(
    page.locator(`[data-sentence-id="${targetId}"]`),
  ).toHaveAttribute("aria-current", "true");
  await expect(page.getByLabel("Tốc độ đọc", { exact: true })).toHaveValue(
    "1.2",
  );
  expect(await spokenTexts(page)).toEqual([]);
  const xp = await page.evaluate(
    () => JSON.parse(localStorage.getItem("dailylingo_user_stats")!).xp,
  );
  expect(xp).toBe(0);
});

test("double-click word performs word-only lookup, marks immediately, and persists after reload", async ({
  page,
}) => {
  await startClean(page);
  const token = word(page);
  const tokenId = await token.getAttribute("data-word-id");
  const tokenText = (await token.innerText()).trim();
  await token.evaluate((element) => {
    const times: number[] = [];
    element.addEventListener("click", (event) => {
      times.push(event.timeStamp);
      (element as HTMLElement).dataset.testClickTimes = JSON.stringify(times);
    });
  });
  // Playwright waits `delay` both between down/up and between clicks. A delay
  // of 200 therefore creates a real click-event gap of approximately 400ms.
  await token.dblclick({ delay: 200 });
  const clickTimes: number[] = JSON.parse(
    (await token.getAttribute("data-test-click-times"))!,
  );
  expect(clickTimes).toHaveLength(2);
  expect(clickTimes[1] - clickTimes[0]).toBeGreaterThanOrEqual(380);
  expect(clickTimes[1] - clickTimes[0]).toBeLessThanOrEqual(500);
  await expect(lookup(page)).toBeVisible();
  await expect(token).toHaveAttribute("data-learning-state", "looked_up");
  // Wait past the sentence click disambiguation window to catch delayed accidental speech.
  await page.waitForTimeout(650);
  expect((await spokenTexts(page)).every((text) => text === tokenText)).toBe(
    true,
  );
  await lookup(page)
    .getByRole("button", { name: "Nghe từ", exact: true })
    .click();
  await expect
    .poll(async () => (await spokenTexts(page)).length)
    .toBeGreaterThan(0);
  expect((await spokenTexts(page)).every((text) => text === tokenText)).toBe(
    true,
  );
  await lookup(page)
    .getByRole("button", { name: "Đóng tra từ", exact: true })
    .click();
  await expect(lookup(page)).toBeHidden();
  await expect(token).toHaveAttribute("data-learning-state", "looked_up");
  await page.reload();
  await openFirstStory(page);
  await expect(
    page
      .getByTestId("story-passage")
      .locator(`[data-word-id="${tokenId}"]`)
      .first(),
  ).toHaveAttribute("data-learning-state", "looked_up");
  expect(await spokenTexts(page)).toEqual([]);
});

test("lookup fallback supports keyboard, saved/mastered notebook states and hidden marks", async ({
  page,
}) => {
  await startClean(page);
  await page.getByRole("button", { name: "Tra từ", exact: true }).click();
  const tokenId = await word(page).getAttribute("data-word-id");
  await word(page).focus();
  await word(page).press("Enter");
  await expect(lookup(page)).toBeVisible();
  await lookup(page)
    .getByRole("button", { name: "Lưu vào sổ từ", exact: true })
    .click();
  await expect(word(page)).toHaveAttribute("data-learning-state", "saved");
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dailylingo_saved_words")!).length,
      ),
    )
    .toBe(1);
  await expect(
    lookup(page).getByRole("button", { name: "Đã lưu vào sổ từ", exact: true }),
  ).toBeDisabled();
  await lookup(page)
    .getByRole("button", { name: "Đóng tra từ", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hiện dấu học tập", exact: true })
    .click();
  await expect(page.getByTestId("story-passage")).toHaveAttribute(
    "data-marks-visible",
    "false",
  );
  await expect(word(page)).toHaveAttribute("data-learning-state", "saved");
  await page
    .getByRole("button", { name: "Sổ Tay Từ Vựng", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByTitle("Đánh dấu đã thuộc").click();
  await openFirstStory(page);
  await expect(
    page
      .getByTestId("story-passage")
      .locator(`[data-word-id="${tokenId}"]`)
      .first(),
  ).toHaveAttribute("data-learning-state", "mastered");
  await expect(page.getByTestId("story-passage")).toHaveAttribute(
    "data-marks-visible",
    "false",
  );
  await page
    .getByRole("button", { name: "Hiện dấu học tập", exact: true })
    .click();
  await expect(page.getByTestId("story-passage")).toHaveAttribute(
    "data-marks-visible",
    "true",
  );
  await page.reload();
  await openFirstStory(page);
  await expect(
    page
      .getByTestId("story-passage")
      .locator(`[data-word-id="${tokenId}"]`)
      .first(),
  ).toHaveAttribute("data-learning-state", "mastered");
});

test("finishing every queued sentence records only genuine completed speech", async ({
  page,
}) => {
  await startClean(page);
  const sentences = page
    .getByTestId("story-passage")
    .locator("[data-sentence-id]");
  const count = await sentences.count();
  await page
    .getByRole("button", { name: "Nghe toàn truyện", exact: true })
    .click();
  for (let index = 0; index < count; index += 1) {
    await speakCount(page, index + 1);
    await expect(sentences.nth(index)).toHaveAttribute("data-speaking", "true");
    expect((await spokenTexts(page))[index]).toBe(
      (await sentences.nth(index).innerText()).trim(),
    );
    await finish(page, index);
  }
  await expect(page.locator('[data-speaking="true"]')).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(
    `${count} câu hoàn thành`,
  );
  expect(await spokenTexts(page)).toHaveLength(count);
  await page
    .getByRole("button", { name: "Tất cả truyện", exact: true })
    .click();
  await expect(page.locator("progress").first()).toHaveAttribute(
    "value",
    String(count),
  );
});

test("story marks and position survive backup/reset/import with existing learner data", async ({
  page,
}) => {
  await startClean(page);
  await word(page).dblclick();
  const tokenId = await word(page).getAttribute("data-word-id");
  await lookup(page)
    .getByRole("button", { name: "Đóng tra từ", exact: true })
    .click();
  await clickSentence(sentence(page, 2));
  const sentenceId = await sentence(page, 2).getAttribute("data-sentence-id");
  await page.getByRole("button", { name: "Dừng", exact: true }).click();
  await page.getByRole("button", { name: "Cài đặt", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Xuất tệp sao lưu", exact: true })
    .click();
  const filePath = await (await downloaded).path();
  expect(filePath).not.toBeNull();
  const exported = JSON.parse(await readFile(filePath!, "utf8"));
  expect(JSON.stringify(exported)).toContain(tokenId);
  expect(JSON.stringify(exported)).toContain(sentenceId);
  await page
    .getByRole("button", { name: "Đặt lại toàn bộ dữ liệu", exact: true })
    .click();
  await page.getByLabel(/Nhập XOA để xác nhận/).fill("XOA");
  await page
    .getByRole("button", { name: "Đồng ý xóa tất cả", exact: true })
    .click();
  await page.getByRole("button", { name: "Cài đặt", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(filePath!);
  await expect(page.getByText(/Đã khôi phục .* từ vựng/)).toBeVisible();
  await page.getByRole("button", { name: "Đóng cài đặt", exact: true }).click();
  await openFirstStory(page);
  await expect(
    page
      .getByTestId("story-passage")
      .locator(`[data-word-id="${tokenId}"]`)
      .first(),
  ).toHaveAttribute("data-learning-state", "looked_up");
  await expect(
    page.locator(`[data-sentence-id="${sentenceId}"]`),
  ).toHaveAttribute("aria-current", "true");
  await page.reload();
  await openFirstStory(page);
  expect(await spokenTexts(page)).toEqual([]);
});

test("desktop reader and yellow highlight render in both themes without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await startClean(page);
  await page
    .getByRole("button", { name: "Nghe toàn truyện", exact: true })
    .click();
  await speakCount(page, 1);
  await expect(sentence(page)).toHaveAttribute("data-speaking", "true");
  await page.screenshot({
    path: testInfo.outputPath("story-desktop-light.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Đổi giao diện sáng/tối", exact: true })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(sentence(page)).toHaveAttribute("data-speaking", "true");
  await page.screenshot({
    path: testInfo.outputPath("story-desktop-dark.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test.describe("story reader mobile Chromium emulation (physical audio UNTESTED)", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("long press opens lookup without sentence playback and touch fallback persists marks", async ({
    page,
  }, testInfo) => {
    await startClean(page);
    const token = word(page);
    await token.scrollIntoViewIfNeeded();
    const bounds = await token.boundingBox();
    expect(bounds).not.toBeNull();
    const touch = await page.context().newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: bounds!.x + bounds!.width / 2, y: bounds!.y + bounds!.height / 2 },
      ],
    });
    await page.waitForTimeout(650);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.detach();
    await expect(lookup(page)).toBeVisible();
    await expect(token).toHaveAttribute("data-learning-state", "looked_up");
    expect(await spokenTexts(page)).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath("story-mobile-lookup.png"),
      fullPage: true,
    });
    await lookup(page)
      .getByRole("button", { name: "Đóng tra từ", exact: true })
      .click();
    await page.getByRole("button", { name: "Tra từ", exact: true }).tap();
    await token.tap();
    await expect(lookup(page)).toBeVisible();
    await lookup(page)
      .getByRole("button", { name: "Lưu vào sổ từ", exact: true })
      .tap();
    await expect(token).toHaveAttribute("data-learning-state", "saved");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("sentence tap interrupts, highlights, resumes after reload and fits a phone", async ({
    page,
  }, testInfo) => {
    await startClean(page);
    await page
      .getByRole("button", { name: "Nghe toàn truyện", exact: true })
      .tap();
    await speakCount(page, 1);
    await sentence(page, 2).tap();
    await speakCount(page, 2);
    await expect(sentence(page, 2)).toHaveAttribute("data-speaking", "true");
    await finish(page, 0);
    await expect(sentence(page, 2)).toHaveAttribute("data-speaking", "true");
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).tap();
    await page.screenshot({
      path: testInfo.outputPath("story-mobile-reading.png"),
      fullPage: true,
    });
    await page.reload();
    await openFirstStory(page);
    await expect(sentence(page, 2)).toHaveAttribute("aria-current", "true");
    expect(await spokenTexts(page)).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });
});
