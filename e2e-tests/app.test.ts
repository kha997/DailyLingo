import { test, expect, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/**
 * Real browser journeys against the Vite dev server started by playwright.config.ts.
 * Storage is seeded once per test (not via addInitScript, which would re-seed on
 * reload and hide persistence bugs).
 */

const STATS_KEY = 'dailylingo_user_stats';
const WORDS_KEY = 'dailylingo_saved_words';

const localDate = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-CA');
};

const TODAY = () => localDate(0);
const YESTERDAY = () => localDate(-1);

interface SeedStats {
  [key: string]: unknown;
}

const baseStats = (overrides: SeedStats = {}): SeedStats => ({
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  studyDays: [],
  todayExercisesDone: 0,
  dailyGoal: 5,
  dailyXpGoal: 50,
  totalExercisesCompleted: 0,
  correctAnswersCount: 0,
  timeSpentMinutes: 0,
  skillMastery: { vocabulary: 0, grammar: 0, listening: 0, speaking: 0 },
  audioAccent: 'en-US',
  audioRate: 0.95,
  theme: 'light',
  reminderEnabled: false,
  reminderTime: '20:00',
  lastReminderSentDate: null,
  dailyXpHistory: {},
  ...overrides,
});

const savedWord = (overrides: Record<string, unknown> = {}) => ({
  id: 'w-test-1',
  word: 'resilient',
  ipa: '/rɪˈzɪl.i.ənt/',
  partOfSpeech: 'adj',
  meaningVi: 'kiên cường',
  exampleEn: 'She stayed resilient through hard times.',
  exampleVi: 'Cô ấy vẫn kiên cường qua những lúc khó khăn.',
  level: 'B1',
  topic: 'daily',
  mastered: false,
  reviewCount: 1,
  lastReviewedAt: localDate(-2),
  nextReviewDate: localDate(-1),
  ...overrides,
});

async function seed(page: Page, words: unknown[], stats: SeedStats = baseStats()) {
  await page.goto('/');
  await page.evaluate(
    ({ stats, words, statsKey, wordsKey }) => {
      localStorage.setItem(statsKey, JSON.stringify(stats));
      localStorage.setItem(wordsKey, JSON.stringify(words));
    },
    { stats, words, statsKey: STATS_KEY, wordsKey: WORDS_KEY }
  );
  await page.reload();
}

const readStorage = async (page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) as string), key);

test('lesson catalog renders all CEFR units and filters by level', async ({ page }) => {
  await seed(page, []);
  await expect(page).toHaveTitle(/DailyLingo/);
  await expect(page.getByRole('heading', { name: 'Lộ Trình Học Tập Chuẩn Khung CEFR' })).toBeVisible();

  const cards = page.getByTestId('lesson-unit-card');
  await expect(cards).toHaveCount(12);

  await page.getByRole('button', { name: 'A1', exact: true }).click();
  const filteredCount = await cards.count();
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(12);
  await expect(cards.first()).toContainText('A1');
});

test('all four tabs render their own content', async ({ page }) => {
  await seed(page, []);
  await expect(page.getByRole('heading', { name: 'Lộ Trình Học Tập Chuẩn Khung CEFR' })).toBeVisible();

  await page.getByRole('button', { name: 'Luyện Tập Nhanh' }).click();
  await expect(page.getByRole('heading', { name: 'Chế Độ Luyện Tập Chuyên Sâu' })).toBeVisible();

  await page.getByRole('button', { name: 'Sổ Tay Từ Vựng' }).click();
  await expect(page.getByRole('heading', { name: 'Kho từ vựng của bạn' })).toBeVisible();

  await page.getByRole('button', { name: 'Tiến Độ & Thống Kê' }).click();
  await expect(page.getByText('Chuỗi ngày học')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'XP theo ngày' })).toBeVisible();

  await page.getByRole('button', { name: 'Bài Học' }).click();
  await expect(page.getByRole('heading', { name: 'Lộ Trình Học Tập Chuẩn Khung CEFR' })).toBeVisible();
});

test('a newly added word is visible immediately, scheduled for tomorrow, and persists', async ({ page }) => {
  await seed(page, []);
  await page.getByRole('button', { name: 'Sổ Tay Từ Vựng' }).click();
  await expect(page.getByText('Không tìm thấy từ vựng phù hợp')).toBeVisible();

  await page.getByRole('button', { name: 'Thêm Từ Mới' }).click();
  await page.getByPlaceholder('Ví dụ: resilient, serendipity, deadline...').fill('serendipity');
  await page.getByPlaceholder('Ví dụ: kiên cường, bền bỉ...').fill('sự tình cờ may mắn');
  await page.getByRole('button', { name: 'Thêm Vào Sổ Tay' }).click();

  // Bug fix under test: a word scheduled for review tomorrow must not disappear.
  await expect(page.getByRole('heading', { name: 'serendipity' })).toBeVisible();

  await expect
    .poll(async () => {
      const words = await readStorage(page, WORDS_KEY);
      return words.length === 1 ? words[0].word : null;
    })
    .toBe('serendipity');

  const stored = await readStorage(page, WORDS_KEY);
  expect(stored[0]).toMatchObject({
    mastered: false,
    reviewCount: 0,
    lastReviewedAt: TODAY(),
    nextReviewDate: localDate(1),
  });

  await page.reload();
  await page.getByRole('button', { name: 'Sổ Tay Từ Vựng' }).click();
  await expect(page.getByRole('heading', { name: 'serendipity' })).toBeVisible();
});

test('completing a flashcard review extends the streak, awards XP and reschedules the word', async ({ page }) => {
  await seed(page, [savedWord()], baseStats({
    xp: 120,
    level: 2,
    currentStreak: 3,
    longestStreak: 3,
    lastStudyDate: YESTERDAY(),
    studyDays: [YESTERDAY()],
    dailyXpHistory: { [YESTERDAY()]: 30 },
  }));

  await page.getByRole('button', { name: 'Sổ Tay Từ Vựng' }).click();
  await page.getByRole('button', { name: 'Ôn Tập Bằng Flashcard' }).click();
  await expect(page.getByText('Câu 1 / 1')).toBeVisible();

  // Grading is disabled until the learner has actually seen the answer.
  await page.getByRole('button', { name: 'Lật thẻ để xem nghĩa' }).click();
  await page.getByRole('button', { name: 'Đã Nhớ (+15 XP)' }).click();
  await expect(page.getByRole('heading', { name: 'Hoàn thành bài luyện tập!' })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu Kết Quả & Tiếp Tục' }).click();

  await expect(page.getByTitle('Xem chi tiết chuỗi ngày học')).toContainText('4');

  const stats = await readStorage(page, STATS_KEY);
  expect(stats).toMatchObject({
    xp: 135,
    currentStreak: 4,
    longestStreak: 4,
    lastStudyDate: TODAY(),
    todayExercisesDone: 1,
    dailyXpHistory: { [TODAY()]: 15 },
  });
  expect(stats.studyDays).toContain(TODAY());

  // Spaced repetition: the reviewed word is rescheduled past today.
  await expect
    .poll(async () => (await readStorage(page, WORDS_KEY))[0].reviewCount)
    .toBe(2);
  const words = await readStorage(page, WORDS_KEY);
  expect(words[0].lastReviewedAt).toBe(TODAY());
  expect(words[0].nextReviewDate > TODAY()).toBe(true);

  // Persistence across a full reload.
  await page.reload();
  await expect(page.getByTitle('Xem chi tiết chuỗi ngày học')).toContainText('4');
  await page.getByRole('button', { name: 'Tiến Độ & Thống Kê' }).click();
  await expect(page.getByText('135', { exact: true }).first()).toBeVisible();
});

test('marking a word as mastered updates its review schedule and persists', async ({ page }) => {
  await seed(page, [savedWord()]);
  await page.getByRole('button', { name: 'Sổ Tay Từ Vựng' }).click();

  await page.getByTitle('Đánh dấu đã thuộc').click();
  await expect(page.getByText('Đã thành thạo')).toBeVisible();

  const words = await readStorage(page, WORDS_KEY);
  expect(words[0]).toMatchObject({
    mastered: true,
    reviewCount: 2,
    lastReviewedAt: TODAY(),
  });
  expect(words[0].nextReviewDate > TODAY()).toBe(true);

  // A scheduled-for-the-future word must still be visible after reload.
  await page.reload();
  await page.getByRole('button', { name: 'Sổ Tay Từ Vựng' }).click();
  await expect(page.getByRole('heading', { name: 'resilient' })).toBeVisible();
  await expect(page.getByText('Đã thành thạo')).toBeVisible();
});

test('review session includes only words that are due today', async ({ page }) => {
  const notDueYet = savedWord({
    id: 'w-test-2',
    word: 'tomorrowish',
    reviewCount: 0,
    nextReviewDate: localDate(1),
  });
  await seed(page, [savedWord(), notDueYet]);
  await page.getByRole('button', { name: 'Sổ Tay Từ Vựng' }).click();

  await page.getByRole('button', { name: 'Ôn Tập Bằng Flashcard' }).click();
  await expect(page.getByText('Câu 1 / 1')).toBeVisible();
  const runner = page.getByTestId('exercise-runner');
  await expect(runner.getByRole('heading', { name: 'resilient' })).toBeVisible();
  await expect(runner.getByText('tomorrowish', { exact: true })).toHaveCount(0);

  await page.getByTitle('Thoát bài tập').click();
  await expect(page.getByRole('heading', { name: 'Kho từ vựng của bạn' })).toBeVisible();
});

test('recovers from corrupt local storage without losing the raw data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(
    ({ statsKey, wordsKey }) => {
      localStorage.setItem(statsKey, '{"xp": 120, broken');
      localStorage.setItem(wordsKey, 'not-json');
    },
    { statsKey: STATS_KEY, wordsKey: WORDS_KEY }
  );
  await page.reload();

  // The app renders on defaults and explains what happened.
  await expect(page.getByRole('heading', { name: 'Lộ Trình Học Tập Chuẩn Khung CEFR' })).toBeVisible();
  await expect(page.getByRole('alert').first()).toContainText('bị hỏng');

  const backups = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) => key.startsWith('dailylingo_recovery_'))
  );
  expect(backups.length).toBeGreaterThanOrEqual(2);
  const originals = await page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), backups);
  expect(originals).toContain('{"xp": 120, broken');
  expect(originals).toContain('not-json');
});

test('exports a backup, restores it after a reset, and requires XOA to erase', async ({ page }) => {
  await seed(page, [savedWord()], baseStats({
    xp: 420,
    level: 5,
    currentStreak: 6,
    longestStreak: 9,
    lastStudyDate: YESTERDAY(),
    studyDays: [YESTERDAY()],
    dailyXpHistory: { [YESTERDAY()]: 55 },
  }));

  await page.getByRole('button', { name: 'Cài đặt' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất tệp sao lưu' }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  expect(download.suggestedFilename()).toMatch(/^dailylingo-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(filePath).not.toBeNull();
  const exported = JSON.parse(await readFile(filePath!, 'utf8'));
  expect(exported.app).toBe('DailyLingo');
  expect(exported.schemaVersion).toBe(1);
  expect(exported.stats.xp).toBe(420);
  expect(exported.words[0].word).toBe('resilient');

  // Reset all data. The destructive button stays disabled until "XOA" is typed.
  await page.getByRole('button', { name: 'Đặt lại toàn bộ dữ liệu' }).click();
  const confirm = page.getByRole('button', { name: 'Đồng ý xóa tất cả' });
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/Nhập XOA để xác nhận/).fill('XOA');
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.getByRole('dialog', { name: 'Cài Đặt Ứng Dụng' })).toHaveCount(0);
  await expect.poll(async () => (await readStorage(page, STATS_KEY)).xp).toBe(0);
  await expect(page.getByRole('button', { name: 'Sổ Tay Từ Vựng' })).toBeVisible();
  const wordsAfterReset = await readStorage(page, WORDS_KEY);
  expect(wordsAfterReset.some((word: { word: string }) => word.word === 'resilient')).toBe(false);

  // Restore the exported file through the hidden file input.
  await page.getByRole('button', { name: 'Cài đặt' }).click();
  await page.locator('input[type="file"]').setInputFiles(filePath!);
  await expect(page.getByText(/Đã khôi phục .* từ vựng/)).toBeVisible();
  await expect.poll(async () => (await readStorage(page, STATS_KEY)).xp).toBe(420);
  const restoredWords = await readStorage(page, WORDS_KEY);
  expect(restoredWords[0].word).toBe('resilient');
  await expect(page.getByText(/Đã khôi phục dữ liệu từ tệp sao lưu/)).toBeVisible();
});

test('analytics shows no invented history, rankings or accuracy for a fresh device', async ({ page }) => {
  await seed(page, []);
  await page.getByRole('button', { name: 'Tiến Độ & Thống Kê' }).click();

  await expect(page.getByRole('heading', { name: 'XP theo ngày' })).toBeVisible();
  await expect(page.getByText('Chưa có XP nào được ghi lại. Hoàn thành một bài luyện tập để bắt đầu biểu đồ.')).toBeVisible();
  await expect(page.getByText('Chưa có câu nào được chấm')).toBeVisible();
  await expect(page.getByText('0 / 6 đã đạt')).toBeVisible();
  await expect(page.getByText('Những gì các số liệu này không đo')).toBeVisible();
  await expect(page.getByText(/Không có xếp hạng hay so sánh với người học khác/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Bảng Xếp Hạng/ })).toHaveCount(0);
});

test('custom practice previews real curriculum matches and never claims AI generation', async ({ page }) => {
  await seed(page, []);
  await page.getByRole('button', { name: 'Tạo Bài Luyện Mới' }).click();

  const dialog = page.getByRole('dialog', { name: 'Luyện Tập Theo Chủ Đề' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Có \d+ bài phù hợp/)).toBeVisible();
  await expect(dialog.getByText(/không dùng AI để sinh nội dung/)).toBeVisible();

  await dialog.getByRole('button', { name: 'A2 - Sơ cấp' }).click();
  await dialog.getByRole('button', { name: 'Nghe' }).click();
  await dialog.getByRole('button', { name: '8 bài' }).click();
  await expect(dialog.getByText(/Có \d+ bài phù hợp/)).toBeVisible();

  await dialog.getByRole('button', { name: 'Bắt Đầu Luyện Ngay' }).click();
  const runner = page.getByTestId('exercise-runner');
  await expect(runner).toBeVisible();
  await expect(runner.getByText(/Luyện Nghe & Điền Từ/)).toBeVisible();
  await page.getByTitle('Thoát bài tập').click();
});

test('quiz options are reachable and selectable with the keyboard alone', async ({ page }) => {
  await seed(page, []);
  await page.getByTestId('lesson-unit-card').first().getByRole('button', { name: /Trắc nghiệm/ }).click();

  const runner = page.getByTestId('exercise-runner');
  await expect(runner).toBeVisible();
  const options = runner.locator('button[aria-pressed]');
  await expect(options.first()).toBeVisible();

  await options.first().focus();
  await page.keyboard.press('Enter');
  await expect(runner.getByRole('button', { name: /Tiếp Tục/ })).toBeVisible();
});

test('dialogs contain keyboard focus, close on Escape, and restore focus', async ({ page }) => {
  await seed(page, []);
  const settingsTrigger = page.getByRole('button', { name: 'Cài đặt' });
  await settingsTrigger.click();

  const dialog = page.getByRole('dialog', { name: 'Cài Đặt Ứng Dụng' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((element) => element.contains(document.activeElement))
    ).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(settingsTrigger).toBeFocused();
});

test('warns before discarding an unfinished session', async ({ page }) => {
  await seed(page, []);
  await page.getByTestId('lesson-unit-card').first().getByRole('button', { name: /Bắt Đầu Bài Học/ }).click();
  const runner = page.getByTestId('exercise-runner');
  await expect(runner).toBeVisible();

  await runner.getByRole('button', { name: /Lật thẻ để xem nghĩa/ }).click();
  await runner.getByRole('button', { name: /Đã Nhớ/ }).click();
  await expect(runner.getByText(/Câu 2 \//)).toBeVisible();

  await page.getByRole('button', { name: 'Thoát bài tập' }).click();
  const confirm = page.getByRole('dialog', { name: 'Thoát khi chưa lưu?' });
  await expect(confirm).toBeVisible();

  await confirm.getByRole('button', { name: 'Ở lại làm tiếp' }).click();
  await expect(confirm).toBeHidden();
  await expect(runner).toBeVisible();

  await page.getByRole('button', { name: 'Thoát bài tập' }).click();
  await page.getByRole('button', { name: 'Thoát và bỏ lượt này' }).click();
  await expect(runner).toBeHidden();
  await expect(page.getByTestId('lesson-unit-card').first()).toBeVisible();
});

test.describe('mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('catalog and a lesson fit a phone viewport', async ({ page }) => {
    await seed(page, []);
    await expect(page.getByTestId('lesson-unit-card')).toHaveCount(12);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await page.getByTestId('lesson-unit-card').first().getByRole('button', { name: /Bắt Đầu Bài Học/ }).click();
    const runner = page.getByTestId('exercise-runner');
    await expect(runner).toBeVisible();
    const runnerOverflow = await runner.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(runnerOverflow).toBeLessThanOrEqual(1);
    await page.getByTitle('Thoát bài tập').click();
  });
});

test('diagnostics stay local, exclude learner content, and feedback is opt-in', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await seed(page, [savedWord()], baseStats({ xp: 321 }));

  await page.getByRole('button', { name: 'Cài đặt' }).click();
  await page.getByRole('button', { name: 'Xem chẩn đoán cục bộ' }).click();
  await expect(page.getByText(/Chẩn đoán chỉ nằm trên thiết bị/)).toBeVisible();
  await expect(page.getByText(/không có từ vựng, câu trả lời, âm thanh/)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải tệp chẩn đoán' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^dailylingo-diagnostics-\d{4}-\d{2}-\d{2}\.json$/
  );
  const report = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(report.app).toBe('DailyLingo');
  expect(report.storage.savedWords).toBe(1);
  expect(report.privacy.automaticallyUploaded).toBe(false);
  const serialised = JSON.stringify(report);
  expect(serialised).not.toContain('resilient');
  expect(serialised).not.toContain('321');

  await page.getByRole('button', { name: 'Sao chép góp ý + chẩn đoán' }).click();
  await expect(page.getByText('Hãy nhập nội dung góp ý trước khi sao chép.')).toBeVisible();

  await page.getByLabel(/Góp ý cho bản Beta/).fill('Bài học dễ hiểu.');
  await page.getByRole('button', { name: 'Sao chép góp ý + chẩn đoán' }).click();
  await expect(page.getByText(/Đã sao chép góp ý kèm chẩn đoán/)).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('Bài học dễ hiểu.');
  expect(clipboard).toContain('"automaticallyUploaded": false');
  expect(clipboard).not.toContain('resilient');
});
