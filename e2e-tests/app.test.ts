import { test, expect } from '@playwright/test';

test('page has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/DailyLingo/);
});

test('vocabulary notebook loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.bg-white')).toBeVisible();
});

test('lesson catalog is accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.LessonCatalog')).toBeVisible();
});

test('all six exercise types render', async ({ page }) => {
  await page.goto('/');
  // Flashcard
  await expect(page.locator('.ExerciseRunner')).toBeVisible();
  // Word reorder
  await expect(page.locator('.min-h-24.sm\\:min-h-28')).toBeVisible();
  // Listening cloze
  await expect(page.locator('.p-4.bg-slate-50')).toBeVisible();
  // Quiz
  await expect(page.locator('.p-4.rounded-xl.border')).toBeVisible();
  // Speaking - check microphone button exists
  await expect(page.locator('.w-18.h-18.rounded-full')).toBeVisible();
  // Dialogue
  await expect(page.locator('.dialogue')).toBeVisible();
});

test('user can navigate between tabs', async ({ page }) => {
  await page.goto('/');
  // Lessons tab
  await page.click('text=Bài Học');
  await expect(page.locator('.LessonCatalog')).toBeVisible();
  // Practice tab
  await page.click('text=Luyện Tập Nhanh');
  await expect(page.locator('.QuickPractice')).toBeVisible();
  // Notebook tab
  await page.click('text=Sổ Tay Từ Vựng');
  await expect(page.locator('.VocabularyNotebook')).toBeVisible();
  // Analytics tab
  await page.click('text=Tiến Độ');
  await expect(page.locator('.ProgressAnalytics')).toBeVisible();
});

test('vocabulary notebook add word flow', async ({ page }) => {
  await page.goto('/');
  // Open add word modal
  await page.click('text=Thêm Từ Mới');
  await expect(page.locator('.bg-white.dark:bg-slate-900.rounded-2xl')).toBeVisible();
  // Enter word and save
  await page.fill('input[placeholder="Ví dụ: resilient, serendipity, deadline..."', 'testword');
  await page.fill('input[placeholder="Ví dụ: kiên cường, bền bỉ..."', 'kiên cường');
  await page.click('button:has-text("Thêm Vào Sổ Tay")');
  // Should see success
  await expect(page.locator('.text-emerald-600.dark:text-emerald-400')).toContainText('Thêm Vào Sổ Tay');
});

test('streak display updates correctly', async ({ page }) => {
  await page.goto('/');
  // Check streak display
  await expect(page.locator('.font-mono.tabular-nums')).toContainText('0');
  // The streak should be 0 for a new user
});

test('progress analytics loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.bg-white.dark:bg-slate-900.rounded-2xl.p-6.shadow-xs.transition-colors')).toBeVisible();
});