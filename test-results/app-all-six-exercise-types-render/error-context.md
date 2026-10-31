# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.test.ts >> all six exercise types render
- Location: e2e-tests/app.test.ts:18:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.ExerciseRunner')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.ExerciseRunner') with timeout 5000ms
  - waiting for locator('.ExerciseRunner')

```

```yaml
- banner:
  - button "DL DailyLingo"
  - navigation:
    - button "Bài Học"
    - button "Luyện Tập Nhanh"
    - button "Sổ Tay Từ Vựng"
    - button "Tiến Độ & Thống Kê"
  - button "Đổi giao diện sáng/tối"
  - button "0 ngày liên tiếp"
  - button "Cài đặt"
- main:
  - text: Học tiếng Anh mỗi ngày · Phương pháp tương tác
  - heading "Chào bạn, hãy hoàn thành mục tiêu hôm nay!" [level=1]
  - paragraph: Chỉ 5-10 phút luyện tập phản xạ, ghi nhớ từ vựng và ngữ pháp thực chiến sẽ giúp bạn nói tiếng Anh tự tin hơn từng ngày.
  - text: "Mục tiêu XP hôm nay: 0 / 50 XP 0% Còn thiếu"
  - strong: 50 XP
  - text: "nữa để đạt mục tiêu ngày. Đã làm:"
  - strong: 0/5
  - text: "bài tập Tiến độ tuần: T2 T3 T4 T5 T6 T6 T7 T7 CN CN"
  - button "Thử Thách 5 Phút Hôm Nay (+30 XP)"
  - button "Tạo Bài Theo Chủ Đề Mới"
  - text: Đã tích lũy
  - strong: 0 XP
  - text: · Cấp độ 1
  - img "Góc học tập tiếng Anh mỗi ngày"
  - text: Bài Học Tiêu Biểu Hôm Nay
  - paragraph: “Small daily improvements over time lead to stunning results.”
  - text: Luyện tập đều đặn tạo nên sự trôi chảy vượt bậc.
  - heading "Lộ Trình Học Tập Chuẩn Khung CEFR" [level=2]
  - paragraph: Tổng hợp 12 bài học chuyên sâu từ sơ cấp đến nâng cao với hơn 70 bài tập tương tác.
  - button "Tất cả (12 bài)"
  - button "A1"
  - button "A2"
  - button "B1"
  - button "B2"
  - img "Giao Tiếp Hàng Ngày & Phản Xạ Nhanh"
  - text: 6 bài tập tương tác đa dạng A1 daily 6 phút
  - heading "Giao Tiếp Hàng Ngày & Phản Xạ Nhanh" [level=3]
  - paragraph: Nắm vững các câu chào hỏi, giới thiệu bản thân và thói quen mỗi ngày
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "💬 Hội thoại"
  - button "Bắt Đầu Toàn Bộ Bài Học (+90 XP)"
  - img "Tiếng Anh Du Lịch, Sân Bay & Khách Sạn"
  - text: 5 bài tập tương tác đa dạng A2 travel 7 phút
  - heading "Tiếng Anh Du Lịch, Sân Bay & Khách Sạn" [level=3]
  - paragraph: Tự tin hỏi đường, làm thủ tục check-in sân bay và nhận phòng khách sạn
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Tiếng Anh Công Sở, Họp & Gửi Email"
  - text: 5 bài tập tương tác đa dạng B1 work 8 phút
  - heading "Tiếng Anh Công Sở, Họp & Gửi Email" [level=3]
  - paragraph: Giao tiếp chuyên nghiệp trong cuộc họp, gửi email và phản biện ý kiến
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Ẩm Thực, Nhà Hàng & Gọi Món Quốc Tế"
  - text: 5 bài tập tương tác đa dạng A2 food 6 phút
  - heading "Ẩm Thực, Nhà Hàng & Gọi Món Quốc Tế" [level=3]
  - paragraph: Tự tin gọi món, hỏi về nguyên liệu, dị ứng và khen ngợi món ăn
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Mua Sắm, Thanh Toán & Trả Hàng"
  - text: 5 bài tập tương tác đa dạng A2 daily 6 phút
  - heading "Mua Sắm, Thanh Toán & Trả Hàng" [level=3]
  - paragraph: Hỏi kích cỡ quần áo, thử đồ, hỏi chính sách hoàn tiền và trả giá lịch thiệp
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Công Nghệ, Trí Tuệ Nhân Tạo & Đời Sống Số"
  - text: 5 bài tập tương tác đa dạng B1 tech 7 phút
  - heading "Công Nghệ, Trí Tuệ Nhân Tạo & Đời Sống Số" [level=3]
  - paragraph: Thảo luận về ứng dụng AI, phần mềm, bảo mật dữ liệu và làm việc từ xa
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Tình Bạn, Hẹn Hò & Mối Quan Hệ"
  - text: 5 bài tập tương tác đa dạng B1 social 6 phút
  - heading "Tình Bạn, Hẹn Hò & Mối Quan Hệ" [level=3]
  - paragraph: Mời bạn bè đi chơi, hỏi thăm chân thành, tâm sự và duy trì tình bạn đẹp
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Sức Khỏe, Khám Bệnh & Thể Thao"
  - text: 5 bài tập tương tác đa dạng B1 daily 7 phút
  - heading "Sức Khỏe, Khám Bệnh & Thể Thao" [level=3]
  - paragraph: Mô tả triệu chứng bệnh, đặt lịch hẹn bác sĩ và nói về lối sống lành mạnh
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "IELTS & TOEIC Idioms & Collocations Ăn Điểm"
  - text: 5 bài tập tương tác đa dạng B2 social 8 phút
  - heading "IELTS & TOEIC Idioms & Collocations Ăn Điểm" [level=3]
  - paragraph: Nâng tầm cách diễn đạt với các thành ngữ tự nhiên và từ nối ăn điểm cao
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Phỏng Vấn Xin Việc & Đàm Phán Lương Bổng"
  - text: 5 bài tập tương tác đa dạng B2 work 8 phút
  - heading "Phỏng Vấn Xin Việc & Đàm Phán Lương Bổng" [level=3]
  - paragraph: Trả lời các câu hỏi phỏng vấn hóc búa, nêu bật thế mạnh và đàm phán đãi ngộ
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Thành Ngữ & Tiếng Lóng Phổ Biến Trong Đời Thực"
  - text: 5 bài tập tương tác đa dạng B2 social 7 phút
  - heading "Thành Ngữ & Tiếng Lóng Phổ Biến Trong Đời Thực" [level=3]
  - paragraph: Nói tiếng Anh tự nhiên như người bản xứ qua các câu lóng và thành ngữ đời sống
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - img "Thuyết Trình, Phản Biện & Tư Duy Phản Biện"
  - text: 5 bài tập tương tác đa dạng B2 work 8 phút
  - heading "Thuyết Trình, Phản Biện & Tư Duy Phản Biện" [level=3]
  - paragraph: Kỹ năng trình bày ý tưởng thuyết phục, chuyển đoạn mượt mà và tranh luận học thuật
  - text: "Kỹ năng trong bài học này:"
  - button "📖 Từ vựng"
  - button "🧩 Sắp xếp câu"
  - button "🎧 Luyện nghe"
  - button "🎙️ Luyện phát âm"
  - button "❓ Trắc nghiệm"
  - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)"
  - heading "Muốn luyện tập chủ đề theo ý muốn?" [level=4]
  - paragraph: Bạn có thể tự tạo bài học theo các chủ đề chuyên sâu như IT, Nhà Hàng, Mua Sắm, Phỏng Vấn...
  - button "Tạo Bài Luyện Mới"
- contentinfo: DailyLingo · Học tiếng Anh tương tác mỗi ngày Tiến độ lưu trữ cục bộ Hỗ trợ Web Speech API Chuẩn khung CEFR A1 - B2
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('page has title', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page).toHaveTitle(/DailyLingo/);
  6  | });
  7  | 
  8  | test('vocabulary notebook loads', async ({ page }) => {
  9  |   await page.goto('/');
  10 |   await expect(page.locator('.bg-white')).toBeVisible();
  11 | });
  12 | 
  13 | test('lesson catalog is accessible', async ({ page }) => {
  14 |   await page.goto('/');
  15 |   await expect(page.locator('.LessonCatalog')).toBeVisible();
  16 | });
  17 | 
  18 | test('all six exercise types render', async ({ page }) => {
  19 |   await page.goto('/');
  20 |   // Flashcard
> 21 |   await expect(page.locator('.ExerciseRunner')).toBeVisible();
     |                                                 ^ Error: expect(locator).toBeVisible() failed
  22 |   // Word reorder
  23 |   await expect(page.locator('.min-h-24.sm\\:min-h-28')).toBeVisible();
  24 |   // Listening cloze
  25 |   await expect(page.locator('.p-4.bg-slate-50')).toBeVisible();
  26 |   // Quiz
  27 |   await expect(page.locator('.p-4.rounded-xl.border')).toBeVisible();
  28 |   // Speaking - check microphone button exists
  29 |   await expect(page.locator('.w-18.h-18.rounded-full')).toBeVisible();
  30 |   // Dialogue
  31 |   await expect(page.locator('.dialogue')).toBeVisible();
  32 | });
  33 | 
  34 | test('user can navigate between tabs', async ({ page }) => {
  35 |   await page.goto('/');
  36 |   // Lessons tab
  37 |   await page.click('text=Bài Học');
  38 |   await expect(page.locator('.LessonCatalog')).toBeVisible();
  39 |   // Practice tab
  40 |   await page.click('text=Luyện Tập Nhanh');
  41 |   await expect(page.locator('.QuickPractice')).toBeVisible();
  42 |   // Notebook tab
  43 |   await page.click('text=Sổ Tay Từ Vựng');
  44 |   await expect(page.locator('.VocabularyNotebook')).toBeVisible();
  45 |   // Analytics tab
  46 |   await page.click('text=Tiến Độ');
  47 |   await expect(page.locator('.ProgressAnalytics')).toBeVisible();
  48 | });
  49 | 
  50 | test('vocabulary notebook add word flow', async ({ page }) => {
  51 |   await page.goto('/');
  52 |   // Open add word modal
  53 |   await page.click('text=Thêm Từ Mới');
  54 |   await expect(page.locator('.bg-white.dark:bg-slate-900.rounded-2xl')).toBeVisible();
  55 |   // Enter word and save
  56 |   await page.fill('input[placeholder="Ví dụ: resilient, serendipity, deadline..."', 'testword');
  57 |   await page.fill('input[placeholder="Ví dụ: kiên cường, bền bỉ..."', 'kiên cường');
  58 |   await page.click('button:has-text("Thêm Vào Sổ Tay")');
  59 |   // Should see success
  60 |   await expect(page.locator('.text-emerald-600.dark:text-emerald-400')).toContainText('Thêm Vào Sổ Tay');
  61 | });
  62 | 
  63 | test('streak display updates correctly', async ({ page }) => {
  64 |   await page.goto('/');
  65 |   // Check streak display
  66 |   await expect(page.locator('.font-mono.tabular-nums')).toContainText('0');
  67 |   // The streak should be 0 for a new user
  68 | });
  69 | 
  70 | test('progress analytics loads', async ({ page }) => {
  71 |   await page.goto('/');
  72 |   await expect(page.locator('.bg-white.dark:bg-slate-900.rounded-2xl.p-6.shadow-xs.transition-colors')).toBeVisible();
  73 | });
```