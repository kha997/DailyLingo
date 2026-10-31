# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.test.ts >> vocabulary notebook add word flow
- Location: e2e-tests/app.test.ts:50:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Thêm Từ Mới')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "DL DailyLingo" [ref=e6]:
        - generic [ref=e7]: DL
        - generic [ref=e8]: DailyLingo
      - navigation [ref=e9]:
        - button "Bài Học" [ref=e10]
        - button "Luyện Tập Nhanh" [ref=e14]
        - button "Sổ Tay Từ Vựng" [ref=e22]
        - button "Tiến Độ & Thống Kê" [ref=e27]
      - generic [ref=e31]:
        - button "Đổi giao diện sáng/tối" [ref=e32]
        - button "0 ngày liên tiếp" [ref=e35]:
          - generic [ref=e38]: "0"
          - generic [ref=e39]: ngày liên tiếp
        - button "Cài đặt" [ref=e40]
  - main [ref=e44]:
    - generic [ref=e46]:
      - generic [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]: Học tiếng Anh mỗi ngày · Phương pháp tương tác
          - heading "Chào bạn, hãy hoàn thành mục tiêu hôm nay!" [level=1] [ref=e53]
          - paragraph [ref=e54]: Chỉ 5-10 phút luyện tập phản xạ, ghi nhớ từ vựng và ngữ pháp thực chiến sẽ giúp bạn nói tiếng Anh tự tin hơn từng ngày.
        - generic [ref=e55]:
          - generic [ref=e56]:
            - generic [ref=e57]:
              - generic [ref=e61]: "Mục tiêu XP hôm nay:"
              - generic [ref=e62]: 0 / 50 XP
            - generic [ref=e63]: 0%
          - generic [ref=e66]:
            - generic [ref=e68]:
              - text: Còn thiếu
              - strong [ref=e69]: 50 XP
              - text: nữa để đạt mục tiêu ngày.
            - generic [ref=e75]:
              - text: "Đã làm:"
              - strong [ref=e76]: 0/5
              - text: bài tập
          - generic [ref=e77]:
            - generic [ref=e78]: "Tiến độ tuần:"
            - generic [ref=e80]:
              - generic "Thứ T2" [ref=e81] [cursor=pointer]: T2
              - generic "Thứ T3" [ref=e88] [cursor=pointer]: T3
              - generic "Thứ T4" [ref=e95] [cursor=pointer]: T4
              - generic "Thứ T5" [ref=e102] [cursor=pointer]: T5
              - generic "Hôm nay" [ref=e109] [cursor=pointer]:
                - generic [ref=e110]: T6
                - generic [ref=e111]: T6
              - generic "Thứ T7" [ref=e113] [cursor=pointer]:
                - generic [ref=e114]: T7
                - generic [ref=e115]: T7
              - generic "Thứ CN" [ref=e117] [cursor=pointer]:
                - generic [ref=e118]: CN
                - generic [ref=e119]: CN
        - generic [ref=e121]:
          - button "Thử Thách 5 Phút Hôm Nay (+30 XP)" [ref=e122] [cursor=pointer]
          - button "Tạo Bài Theo Chủ Đề Mới" [ref=e126] [cursor=pointer]
          - generic [ref=e134]:
            - text: Đã tích lũy
            - strong [ref=e135]: 0 XP
            - text: · Cấp độ 1
      - generic [ref=e137]:
        - img "Góc học tập tiếng Anh mỗi ngày" [ref=e138]
        - generic [ref=e139]:
          - generic [ref=e140]: Bài Học Tiêu Biểu Hôm Nay
          - paragraph [ref=e141]: “Small daily improvements over time lead to stunning results.”
          - generic [ref=e142]: Luyện tập đều đặn tạo nên sự trôi chảy vượt bậc.
    - generic [ref=e143]:
      - generic [ref=e144]:
        - generic [ref=e145]:
          - heading "Lộ Trình Học Tập Chuẩn Khung CEFR" [level=2] [ref=e146]
          - paragraph [ref=e147]: Tổng hợp 12 bài học chuyên sâu từ sơ cấp đến nâng cao với hơn 70 bài tập tương tác.
        - generic [ref=e148]:
          - button "Tất cả (12 bài)" [ref=e149]
          - button "A1" [ref=e150]
          - button "A2" [ref=e151]
          - button "B1" [ref=e152]
          - button "B2" [ref=e153]
      - generic [ref=e154]:
        - generic [ref=e155]:
          - generic [ref=e156]:
            - generic [ref=e157]:
              - img "Giao Tiếp Hàng Ngày & Phản Xạ Nhanh" [ref=e158]
              - generic [ref=e159]: 6 bài tập tương tác đa dạng
            - generic [ref=e161]:
              - generic [ref=e162]:
                - generic [ref=e163]: A1
                - generic [aria-hidden] [ref=e164]: ·
                - generic [ref=e165]: daily
                - generic [aria-hidden] [ref=e166]: ·
                - generic [ref=e167]: 6 phút
              - heading "Giao Tiếp Hàng Ngày & Phản Xạ Nhanh" [level=3] [ref=e171]
              - paragraph [ref=e172]: Nắm vững các câu chào hỏi, giới thiệu bản thân và thói quen mỗi ngày
              - generic [ref=e173]:
                - generic [ref=e174]: "Kỹ năng trong bài học này:"
                - generic [ref=e175]:
                  - button "📖 Từ vựng" [ref=e176]
                  - button "🧩 Sắp xếp câu" [ref=e177]
                  - button "🎧 Luyện nghe" [ref=e178]
                  - button "🎙️ Luyện phát âm" [ref=e179]
                  - button "❓ Trắc nghiệm" [ref=e180]
                  - button "💬 Hội thoại" [ref=e181]
          - button "Bắt Đầu Toàn Bộ Bài Học (+90 XP)" [ref=e183]
        - generic [ref=e187]:
          - generic [ref=e188]:
            - generic [ref=e189]:
              - img "Tiếng Anh Du Lịch, Sân Bay & Khách Sạn" [ref=e190]
              - generic [ref=e191]: 5 bài tập tương tác đa dạng
            - generic [ref=e193]:
              - generic [ref=e194]:
                - generic [ref=e195]: A2
                - generic [aria-hidden] [ref=e196]: ·
                - generic [ref=e197]: travel
                - generic [aria-hidden] [ref=e198]: ·
                - generic [ref=e199]: 7 phút
              - heading "Tiếng Anh Du Lịch, Sân Bay & Khách Sạn" [level=3] [ref=e203]
              - paragraph [ref=e204]: Tự tin hỏi đường, làm thủ tục check-in sân bay và nhận phòng khách sạn
              - generic [ref=e205]:
                - generic [ref=e206]: "Kỹ năng trong bài học này:"
                - generic [ref=e207]:
                  - button "📖 Từ vựng" [ref=e208]
                  - button "🧩 Sắp xếp câu" [ref=e209]
                  - button "🎧 Luyện nghe" [ref=e210]
                  - button "🎙️ Luyện phát âm" [ref=e211]
                  - button "❓ Trắc nghiệm" [ref=e212]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e214]
        - generic [ref=e218]:
          - generic [ref=e219]:
            - generic [ref=e220]:
              - img "Tiếng Anh Công Sở, Họp & Gửi Email" [ref=e221]
              - generic [ref=e222]: 5 bài tập tương tác đa dạng
            - generic [ref=e224]:
              - generic [ref=e225]:
                - generic [ref=e226]: B1
                - generic [aria-hidden] [ref=e227]: ·
                - generic [ref=e228]: work
                - generic [aria-hidden] [ref=e229]: ·
                - generic [ref=e230]: 8 phút
              - heading "Tiếng Anh Công Sở, Họp & Gửi Email" [level=3] [ref=e234]
              - paragraph [ref=e235]: Giao tiếp chuyên nghiệp trong cuộc họp, gửi email và phản biện ý kiến
              - generic [ref=e236]:
                - generic [ref=e237]: "Kỹ năng trong bài học này:"
                - generic [ref=e238]:
                  - button "📖 Từ vựng" [ref=e239]
                  - button "🧩 Sắp xếp câu" [ref=e240]
                  - button "🎧 Luyện nghe" [ref=e241]
                  - button "🎙️ Luyện phát âm" [ref=e242]
                  - button "❓ Trắc nghiệm" [ref=e243]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e245]
        - generic [ref=e249]:
          - generic [ref=e250]:
            - generic [ref=e251]:
              - img "Ẩm Thực, Nhà Hàng & Gọi Món Quốc Tế" [ref=e252]
              - generic [ref=e253]: 5 bài tập tương tác đa dạng
            - generic [ref=e255]:
              - generic [ref=e256]:
                - generic [ref=e257]: A2
                - generic [aria-hidden] [ref=e258]: ·
                - generic [ref=e259]: food
                - generic [aria-hidden] [ref=e260]: ·
                - generic [ref=e261]: 6 phút
              - heading "Ẩm Thực, Nhà Hàng & Gọi Món Quốc Tế" [level=3] [ref=e265]
              - paragraph [ref=e266]: Tự tin gọi món, hỏi về nguyên liệu, dị ứng và khen ngợi món ăn
              - generic [ref=e267]:
                - generic [ref=e268]: "Kỹ năng trong bài học này:"
                - generic [ref=e269]:
                  - button "📖 Từ vựng" [ref=e270]
                  - button "🧩 Sắp xếp câu" [ref=e271]
                  - button "🎧 Luyện nghe" [ref=e272]
                  - button "🎙️ Luyện phát âm" [ref=e273]
                  - button "❓ Trắc nghiệm" [ref=e274]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e276]
        - generic [ref=e280]:
          - generic [ref=e281]:
            - generic [ref=e282]:
              - img "Mua Sắm, Thanh Toán & Trả Hàng" [ref=e283]
              - generic [ref=e284]: 5 bài tập tương tác đa dạng
            - generic [ref=e286]:
              - generic [ref=e287]:
                - generic [ref=e288]: A2
                - generic [aria-hidden] [ref=e289]: ·
                - generic [ref=e290]: daily
                - generic [aria-hidden] [ref=e291]: ·
                - generic [ref=e292]: 6 phút
              - heading "Mua Sắm, Thanh Toán & Trả Hàng" [level=3] [ref=e296]
              - paragraph [ref=e297]: Hỏi kích cỡ quần áo, thử đồ, hỏi chính sách hoàn tiền và trả giá lịch thiệp
              - generic [ref=e298]:
                - generic [ref=e299]: "Kỹ năng trong bài học này:"
                - generic [ref=e300]:
                  - button "📖 Từ vựng" [ref=e301]
                  - button "🧩 Sắp xếp câu" [ref=e302]
                  - button "🎧 Luyện nghe" [ref=e303]
                  - button "🎙️ Luyện phát âm" [ref=e304]
                  - button "❓ Trắc nghiệm" [ref=e305]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e307]
        - generic [ref=e311]:
          - generic [ref=e312]:
            - generic [ref=e313]:
              - img "Công Nghệ, Trí Tuệ Nhân Tạo & Đời Sống Số" [ref=e314]
              - generic [ref=e315]: 5 bài tập tương tác đa dạng
            - generic [ref=e317]:
              - generic [ref=e318]:
                - generic [ref=e319]: B1
                - generic [aria-hidden] [ref=e320]: ·
                - generic [ref=e321]: tech
                - generic [aria-hidden] [ref=e322]: ·
                - generic [ref=e323]: 7 phút
              - heading "Công Nghệ, Trí Tuệ Nhân Tạo & Đời Sống Số" [level=3] [ref=e327]
              - paragraph [ref=e328]: Thảo luận về ứng dụng AI, phần mềm, bảo mật dữ liệu và làm việc từ xa
              - generic [ref=e329]:
                - generic [ref=e330]: "Kỹ năng trong bài học này:"
                - generic [ref=e331]:
                  - button "📖 Từ vựng" [ref=e332]
                  - button "🧩 Sắp xếp câu" [ref=e333]
                  - button "🎧 Luyện nghe" [ref=e334]
                  - button "🎙️ Luyện phát âm" [ref=e335]
                  - button "❓ Trắc nghiệm" [ref=e336]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e338]
        - generic [ref=e342]:
          - generic [ref=e343]:
            - generic [ref=e344]:
              - img "Tình Bạn, Hẹn Hò & Mối Quan Hệ" [ref=e345]
              - generic [ref=e346]: 5 bài tập tương tác đa dạng
            - generic [ref=e348]:
              - generic [ref=e349]:
                - generic [ref=e350]: B1
                - generic [aria-hidden] [ref=e351]: ·
                - generic [ref=e352]: social
                - generic [aria-hidden] [ref=e353]: ·
                - generic [ref=e354]: 6 phút
              - heading "Tình Bạn, Hẹn Hò & Mối Quan Hệ" [level=3] [ref=e358]
              - paragraph [ref=e359]: Mời bạn bè đi chơi, hỏi thăm chân thành, tâm sự và duy trì tình bạn đẹp
              - generic [ref=e360]:
                - generic [ref=e361]: "Kỹ năng trong bài học này:"
                - generic [ref=e362]:
                  - button "📖 Từ vựng" [ref=e363]
                  - button "🧩 Sắp xếp câu" [ref=e364]
                  - button "🎧 Luyện nghe" [ref=e365]
                  - button "🎙️ Luyện phát âm" [ref=e366]
                  - button "❓ Trắc nghiệm" [ref=e367]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e369]
        - generic [ref=e373]:
          - generic [ref=e374]:
            - generic [ref=e375]:
              - img "Sức Khỏe, Khám Bệnh & Thể Thao" [ref=e376]
              - generic [ref=e377]: 5 bài tập tương tác đa dạng
            - generic [ref=e379]:
              - generic [ref=e380]:
                - generic [ref=e381]: B1
                - generic [aria-hidden] [ref=e382]: ·
                - generic [ref=e383]: daily
                - generic [aria-hidden] [ref=e384]: ·
                - generic [ref=e385]: 7 phút
              - heading "Sức Khỏe, Khám Bệnh & Thể Thao" [level=3] [ref=e389]
              - paragraph [ref=e390]: Mô tả triệu chứng bệnh, đặt lịch hẹn bác sĩ và nói về lối sống lành mạnh
              - generic [ref=e391]:
                - generic [ref=e392]: "Kỹ năng trong bài học này:"
                - generic [ref=e393]:
                  - button "📖 Từ vựng" [ref=e394]
                  - button "🧩 Sắp xếp câu" [ref=e395]
                  - button "🎧 Luyện nghe" [ref=e396]
                  - button "🎙️ Luyện phát âm" [ref=e397]
                  - button "❓ Trắc nghiệm" [ref=e398]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e400]
        - generic [ref=e404]:
          - generic [ref=e405]:
            - generic [ref=e406]:
              - img "IELTS & TOEIC Idioms & Collocations Ăn Điểm" [ref=e407]
              - generic [ref=e408]: 5 bài tập tương tác đa dạng
            - generic [ref=e410]:
              - generic [ref=e411]:
                - generic [ref=e412]: B2
                - generic [aria-hidden] [ref=e413]: ·
                - generic [ref=e414]: social
                - generic [aria-hidden] [ref=e415]: ·
                - generic [ref=e416]: 8 phút
              - heading "IELTS & TOEIC Idioms & Collocations Ăn Điểm" [level=3] [ref=e420]
              - paragraph [ref=e421]: Nâng tầm cách diễn đạt với các thành ngữ tự nhiên và từ nối ăn điểm cao
              - generic [ref=e422]:
                - generic [ref=e423]: "Kỹ năng trong bài học này:"
                - generic [ref=e424]:
                  - button "📖 Từ vựng" [ref=e425]
                  - button "🧩 Sắp xếp câu" [ref=e426]
                  - button "🎧 Luyện nghe" [ref=e427]
                  - button "🎙️ Luyện phát âm" [ref=e428]
                  - button "❓ Trắc nghiệm" [ref=e429]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e431]
        - generic [ref=e435]:
          - generic [ref=e436]:
            - generic [ref=e437]:
              - img "Phỏng Vấn Xin Việc & Đàm Phán Lương Bổng" [ref=e438]
              - generic [ref=e439]: 5 bài tập tương tác đa dạng
            - generic [ref=e441]:
              - generic [ref=e442]:
                - generic [ref=e443]: B2
                - generic [aria-hidden] [ref=e444]: ·
                - generic [ref=e445]: work
                - generic [aria-hidden] [ref=e446]: ·
                - generic [ref=e447]: 8 phút
              - heading "Phỏng Vấn Xin Việc & Đàm Phán Lương Bổng" [level=3] [ref=e451]
              - paragraph [ref=e452]: Trả lời các câu hỏi phỏng vấn hóc búa, nêu bật thế mạnh và đàm phán đãi ngộ
              - generic [ref=e453]:
                - generic [ref=e454]: "Kỹ năng trong bài học này:"
                - generic [ref=e455]:
                  - button "📖 Từ vựng" [ref=e456]
                  - button "🧩 Sắp xếp câu" [ref=e457]
                  - button "🎧 Luyện nghe" [ref=e458]
                  - button "🎙️ Luyện phát âm" [ref=e459]
                  - button "❓ Trắc nghiệm" [ref=e460]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e462]
        - generic [ref=e466]:
          - generic [ref=e467]:
            - generic [ref=e468]:
              - img "Thành Ngữ & Tiếng Lóng Phổ Biến Trong Đời Thực" [ref=e469]
              - generic [ref=e470]: 5 bài tập tương tác đa dạng
            - generic [ref=e472]:
              - generic [ref=e473]:
                - generic [ref=e474]: B2
                - generic [aria-hidden] [ref=e475]: ·
                - generic [ref=e476]: social
                - generic [aria-hidden] [ref=e477]: ·
                - generic [ref=e478]: 7 phút
              - heading "Thành Ngữ & Tiếng Lóng Phổ Biến Trong Đời Thực" [level=3] [ref=e482]
              - paragraph [ref=e483]: Nói tiếng Anh tự nhiên như người bản xứ qua các câu lóng và thành ngữ đời sống
              - generic [ref=e484]:
                - generic [ref=e485]: "Kỹ năng trong bài học này:"
                - generic [ref=e486]:
                  - button "📖 Từ vựng" [ref=e487]
                  - button "🧩 Sắp xếp câu" [ref=e488]
                  - button "🎧 Luyện nghe" [ref=e489]
                  - button "🎙️ Luyện phát âm" [ref=e490]
                  - button "❓ Trắc nghiệm" [ref=e491]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e493]
        - generic [ref=e497]:
          - generic [ref=e498]:
            - generic [ref=e499]:
              - img "Thuyết Trình, Phản Biện & Tư Duy Phản Biện" [ref=e500]
              - generic [ref=e501]: 5 bài tập tương tác đa dạng
            - generic [ref=e503]:
              - generic [ref=e504]:
                - generic [ref=e505]: B2
                - generic [aria-hidden] [ref=e506]: ·
                - generic [ref=e507]: work
                - generic [aria-hidden] [ref=e508]: ·
                - generic [ref=e509]: 8 phút
              - heading "Thuyết Trình, Phản Biện & Tư Duy Phản Biện" [level=3] [ref=e513]
              - paragraph [ref=e514]: Kỹ năng trình bày ý tưởng thuyết phục, chuyển đoạn mượt mà và tranh luận học thuật
              - generic [ref=e515]:
                - generic [ref=e516]: "Kỹ năng trong bài học này:"
                - generic [ref=e517]:
                  - button "📖 Từ vựng" [ref=e518]
                  - button "🧩 Sắp xếp câu" [ref=e519]
                  - button "🎧 Luyện nghe" [ref=e520]
                  - button "🎙️ Luyện phát âm" [ref=e521]
                  - button "❓ Trắc nghiệm" [ref=e522]
          - button "Bắt Đầu Toàn Bộ Bài Học (+75 XP)" [ref=e524]
      - generic [ref=e528]:
        - generic [ref=e534]:
          - heading "Muốn luyện tập chủ đề theo ý muốn?" [level=4] [ref=e535]
          - paragraph [ref=e536]: Bạn có thể tự tạo bài học theo các chủ đề chuyên sâu như IT, Nhà Hàng, Mua Sắm, Phỏng Vấn...
        - button "Tạo Bài Luyện Mới" [ref=e537]
  - contentinfo [ref=e538]:
    - generic [ref=e539]:
      - generic [ref=e540]: DailyLingo · Học tiếng Anh tương tác mỗi ngày
      - generic [ref=e541]:
        - generic [ref=e542]: Tiến độ lưu trữ cục bộ
        - generic [aria-hidden] [ref=e543]: ·
        - generic [ref=e544]: Hỗ trợ Web Speech API
        - generic [aria-hidden] [ref=e545]: ·
        - generic [ref=e546]: Chuẩn khung CEFR A1 - B2
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
  21 |   await expect(page.locator('.ExerciseRunner')).toBeVisible();
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
> 53 |   await page.click('text=Thêm Từ Mới');
     |              ^ Error: page.click: Test timeout of 30000ms exceeded.
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