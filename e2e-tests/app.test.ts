import { test, expect, Page } from '@playwright/test';

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
  await expect(page.getByText('Chuỗi Ngày Học')).toBeVisible();
  await expect(page.getByText('Tiến Độ XP 7 Ngày Qua')).toBeVisible();

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

  await page.getByRole('button', { name: 'Đã Nhớ (+15 XP)' }).click();
  await expect(page.getByRole('heading', { name: 'Tuyệt vời! Hoàn thành xuất sắc!' })).toBeVisible();
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
