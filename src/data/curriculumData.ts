import { Badge, LessonUnit, SavedWord } from '../types/index.ts';

// 12 Comprehensive Units covering CEFR A1 -> C1 and everyday life to career/academic
export const LESSON_UNITS: LessonUnit[] = [
  {
    id: 'unit-1',
    title: 'Giao Tiếp Hàng Ngày & Phản Xạ Nhanh',
    subtitle: 'Nắm vững các câu chào hỏi, giới thiệu bản thân và thói quen mỗi ngày',
    level: 'A1',
    topic: 'daily',
    image: '/src/assets/images/english_learning_hero_1790648876420.jpg',
    estimatedMinutes: 6,
    exercises: [
      {
        id: 'u1-ex-1',
        type: 'flashcard',
        level: 'A1',
        topic: 'daily',
        title: 'Từ Vựng Cốt Lõi: Hào Hứng',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'enthusiastic',
        ipa: '/ɪnˌθjuː.ziˈæs.tɪk/',
        partOfSpeech: 'adjective',
        definitionVi: 'Hào hứng, nhiệt huyết, say mê',
        exampleEn: 'She is very enthusiastic about learning new languages.',
        exampleVi: 'Cô ấy rất hào hứng với việc học các ngôn ngữ mới.'
      },
      {
        id: 'u1-ex-2',
        type: 'word-reorder',
        level: 'A1',
        topic: 'daily',
        title: 'Sắp Xếp Câu: Thói Quen Buổi Sáng',
        vietnamesePrompt: 'Sắp xếp các từ thành câu: "Tôi thường uống một tách cà phê vào mỗi buổi sáng."',
        targetSentence: 'I usually drink a cup of coffee every morning.',
        scrambledWords: ['a', 'drink', 'morning.', 'every', 'usually', 'I', 'cup', 'of', 'coffee'],
        grammarTip: 'Trạng từ chỉ tần suất (usually, always, often) đứng trước động từ thường (drink).'
      },
      {
        id: 'u1-ex-3',
        type: 'listening-cloze',
        level: 'A1',
        topic: 'daily',
        title: 'Luyện Nghe: Cuối Tuần Vừa Qua',
        vietnamesePrompt: 'Lắng nghe phát âm và chọn từ chính xác để điền vào chỗ trống',
        audioText: 'How was your weekend? Did you do anything special?',
        blankWord: 'weekend',
        fullSentenceEn: 'How was your weekend? Did you do anything special?',
        fullSentenceVi: 'Cuối tuần của bạn thế nào? Bạn có làm gì đặc biệt không?',
        options: ['weekend', 'weekday', 'vacation', 'morning']
      },
      {
        id: 'u1-ex-4',
        type: 'speaking',
        level: 'A1',
        topic: 'daily',
        title: 'Luyện Phát Âm: Chào Hỏi Lịch Thiệp',
        vietnamesePrompt: 'Hãy đọc to câu sau để kiểm tra độ chuẩn xác của giọng nói',
        speakingTarget: 'It is a pleasure to meet you.',
        speakingPhonetic: '/ɪt ɪz ə ˈpleʒ.ər tuː miːt juː/',
        speakingHint: 'Chú ý nối âm nhẹ giữa "is a" (/ɪz ə/) và âm /ʒ/ trong "pleasure".'
      },
      {
        id: 'u1-ex-5',
        type: 'quiz',
        level: 'A1',
        topic: 'daily',
        title: 'Trắc Nghiệm: Đáp Lại Lời Cảm Ơn',
        vietnamesePrompt: 'Chọn câu đáp lại tự nhiên và lịch sự nhất',
        questionEn: 'Someone says: "Thank you so much for helping me today!" What is the most natural reply?',
        questionVi: 'Khi ai đó cảm ơn bạn: "Thank you so much for helping me today!", câu đáp lại tự nhiên nhất là gì?',
        quizOptions: [
          {
            id: 'q1-opt1',
            text: "You're welcome! Happy to help anytime.",
            isCorrect: true,
            explanation: '"You\'re welcome!" hoặc "Happy to help!" là cách trả lời tiêu chuẩn và chân thành khi được cảm ơn.'
          },
          {
            id: 'q1-opt2',
            text: 'Yes, I helped you very well.',
            isCorrect: false,
            explanation: 'Câu này mang sắc thái tự mãn và không tự nhiên trong văn hóa giao tiếp tiếng Anh.'
          },
          {
            id: 'q1-opt3',
            text: 'Never mind about it.',
            isCorrect: false,
            explanation: '"Never mind" thường dùng khi muốn bảo người khác đừng bận tâm/bỏ qua điều gì đó khó chịu.'
          },
          {
            id: 'q1-opt4',
            text: 'Of course you must say that.',
            isCorrect: false,
            explanation: 'Câu này bất lịch sự và kỳ quặc trong tình huống hàng ngày.'
          }
        ]
      },
      {
        id: 'u1-ex-6',
        type: 'dialogue',
        level: 'A1',
        topic: 'daily',
        title: 'Hội Thoại Mẫu: Chào Hỏi Đồng Nghiệp Mới',
        vietnamesePrompt: 'Bấm nghe từng câu và luyện đọc theo cuộc hội thoại',
        dialogueContext: 'Tại sảnh văn phòng vào buổi sáng thứ Hai',
        dialogueLines: [
          {
            speaker: 'Alex',
            avatar: '👨‍💼',
            en: 'Good morning! You must be Minh, our new designer.',
            vi: 'Chào buổi sáng! Bạn chắc hẳn là Minh, nhà thiết kế mới của chúng ta.'
          },
          {
            speaker: 'Minh',
            avatar: '👩‍💻',
            en: 'Good morning Alex! Yes, today is my first day here.',
            vi: 'Chào buổi sáng Alex! Đúng rồi, hôm nay là ngày đầu tiên của tôi ở đây.'
          },
          {
            speaker: 'Alex',
            avatar: '👨‍💼',
            en: 'Welcome aboard! Let me know if you need any help settling in.',
            vi: 'Chào mừng gia nhập đội ngũ! Cứ báo tôi nếu bạn cần giúp đỡ để làm quen nhé.'
          },
          {
            speaker: 'Minh',
            avatar: '👩‍💻',
            en: 'Thank you so much, I really appreciate it!',
            vi: 'Cảm ơn bạn rất nhiều, tôi thực sự rất trân trọng!'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-2',
    title: 'Tiếng Anh Du Lịch, Sân Bay & Khách Sạn',
    subtitle: 'Tự tin hỏi đường, làm thủ tục check-in sân bay và nhận phòng khách sạn',
    level: 'A2',
    topic: 'travel',
    image: '/src/assets/images/travel_english_art_1790648889488.jpg',
    estimatedMinutes: 7,
    exercises: [
      {
        id: 'u2-ex-1',
        type: 'flashcard',
        level: 'A2',
        topic: 'travel',
        title: 'Từ Vựng Du Lịch: Lịch Trình',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'itinerary',
        ipa: '/aɪˈtɪn.ər.ər.i/',
        partOfSpeech: 'noun',
        definitionVi: 'Lịch trình chuyến đi, kế hoạch hành trình',
        exampleEn: 'We planned a detailed travel itinerary for our week in Japan.',
        exampleVi: 'Chúng tôi đã lên một lịch trình du lịch chi tiết cho một tuần ở Nhật Bản.'
      },
      {
        id: 'u2-ex-2',
        type: 'word-reorder',
        level: 'A2',
        topic: 'travel',
        title: 'Sắp Xếp Câu: Hỏi Đường',
        vietnamesePrompt: 'Sắp xếp thành câu: "Xin lỗi, bạn có thể chỉ cho tôi đường đến ga tàu gần nhất không?"',
        targetSentence: 'Excuse me, could you tell me the way to the nearest train station?',
        scrambledWords: ['could', 'me,', 'to', 'train', 'Excuse', 'station?', 'the', 'tell', 'way', 'nearest', 'you', 'me', 'the'],
        grammarTip: 'Cấu trúc lịch sự hỏi đường: "Could you tell me the way to + địa điểm...?"'
      },
      {
        id: 'u2-ex-3',
        type: 'listening-cloze',
        level: 'A2',
        topic: 'travel',
        title: 'Luyện Nghe: Thủ Tục Hải Quan',
        vietnamesePrompt: 'Lắng nghe nhân viên an ninh sân bay và chọn từ còn thiếu',
        audioText: 'Please place your boarding pass and passport on the tray.',
        blankWord: 'boarding pass',
        fullSentenceEn: 'Please place your boarding pass and passport on the tray.',
        fullSentenceVi: 'Vui lòng đặt thẻ lên máy bay và hộ chiếu của quý khách vào khay.',
        options: ['boarding pass', 'credit card', 'flight ticket', 'luggage tag']
      },
      {
        id: 'u2-ex-4',
        type: 'speaking',
        level: 'A2',
        topic: 'travel',
        title: 'Luyện Nói: Nhận Phòng Khách Sạn',
        vietnamesePrompt: 'Hãy đọc to câu check-in khách sạn chuẩn xác',
        speakingTarget: 'I have a reservation under the name Nguyen for three nights.',
        speakingPhonetic: '/aɪ hæv ə ˌrez.əˈveɪ.ʃən ˈʌn.dər ðə neɪm...',
        speakingHint: 'Nhấn trọng âm vào âm tiết thứ ba của từ "re-ser-VA-tion".'
      },
      {
        id: 'u2-ex-5',
        type: 'quiz',
        level: 'A2',
        topic: 'travel',
        title: 'Trắc Nghiệm: Gọi Món & Thanh Toán',
        vietnamesePrompt: 'Khi muốn thanh toán hoá đơn ở nhà hàng quốc tế, câu nào chuẩn nhất?',
        questionEn: 'You finish your dinner at a restaurant abroad. How do you politely ask for the bill?',
        questionVi: 'Khi ăn xong ở nhà hàng nước ngoài, bạn xin hóa đơn thế nào cho lịch sự?',
        quizOptions: [
          {
            id: 'q2-opt1',
            text: 'Could we get the bill, please?',
            isCorrect: true,
            explanation: '"Could we get the bill, please?" (Anh-Anh) hoặc "Could we have the check, please?" (Anh-Mỹ) là cách gọi thanh toán nhã nhặn và phổ biến nhất.'
          },
          {
            id: 'q2-opt2',
            text: 'Money time now, waiter!',
            isCorrect: false,
            explanation: 'Cách diễn đạt này bất lịch sự và sai ngữ pháp.'
          },
          {
            id: 'q2-opt3',
            text: 'How much I pay you?',
            isCorrect: false,
            explanation: 'Thiếu trợ động từ và không mang tính trang trọng lịch thiệp.'
          },
          {
            id: 'q2-opt4',
            text: 'Take my cash immediately.',
            isCorrect: false,
            explanation: 'Nghe như một mệnh lệnh gắt gỏng.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-3',
    title: 'Tiếng Anh Công Sở, Họp & Gửi Email',
    subtitle: 'Giao tiếp chuyên nghiệp trong cuộc họp, gửi email và phản biện ý kiến',
    level: 'B1',
    topic: 'work',
    image: '/src/assets/images/business_english_art_1790648901506.jpg',
    estimatedMinutes: 8,
    exercises: [
      {
        id: 'u3-ex-1',
        type: 'flashcard',
        level: 'B1',
        topic: 'work',
        title: 'Từ Vựng Doanh Nghiệp: Hợp Tác',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'collaborate',
        ipa: '/kəˈlæb.ə.reɪt/',
        partOfSpeech: 'verb',
        definitionVi: 'Hợp tác, cùng làm việc để đạt mục tiêu chung',
        exampleEn: 'Our marketing and tech teams collaborate closely on this feature.',
        exampleVi: 'Đội ngũ marketing và công nghệ của chúng tôi hợp tác chặt chẽ trong tính năng này.'
      },
      {
        id: 'u3-ex-2',
        type: 'word-reorder',
        level: 'B1',
        topic: 'work',
        title: 'Sắp Xếp Câu: Mở Đầu Cuộc Họp',
        vietnamesePrompt: 'Sắp xếp thành câu: "Hãy bắt đầu bằng việc điểm lại các mục tiêu chính của quý này."',
        targetSentence: "Let's kick off by reviewing the key objectives for this quarter.",
        scrambledWords: ['for', 'reviewing', "Let's", 'this', 'key', 'quarter.', 'objectives', 'the', 'by', 'kick', 'off'],
        grammarTip: '"Kick off" là cụm động từ rất phổ biến trong công sở mang nghĩa "bắt đầu/khởi động". Sau giới từ "by" dùng V-ing.'
      },
      {
        id: 'u3-ex-3',
        type: 'listening-cloze',
        level: 'B1',
        topic: 'work',
        title: 'Luyện Nghe: Email & Deadline',
        vietnamesePrompt: 'Lắng nghe câu trao đổi về hạn chót và điền từ thích hợp',
        audioText: 'Could you please submit your progress report before the deadline tomorrow?',
        blankWord: 'deadline',
        fullSentenceEn: 'Could you please submit your progress report before the deadline tomorrow?',
        fullSentenceVi: 'Bạn có thể vui lòng nộp báo cáo tiến độ trước hạn chót ngày mai được không?',
        options: ['deadline', 'meeting', 'presentation', 'interview']
      },
      {
        id: 'u3-ex-4',
        type: 'speaking',
        level: 'B1',
        topic: 'work',
        title: 'Luyện Nói: Đưa Ra Ý Kiến Trong Cuộc Họp',
        vietnamesePrompt: 'Phát âm to và tự tin câu bày tỏ quan điểm sau',
        speakingTarget: 'From my perspective, this strategy will significantly improve customer satisfaction.',
        speakingPhonetic: '/frɒm maɪ pəˈspek.tɪv, ðɪs ˈstræt.ə.dʒi wɪl sɪɡˈnɪf.ɪ.kənt.li...',
        speakingHint: 'Cụm "From my perspective" giúp câu nói chuyên nghiệp hơn thay vì chỉ dùng "I think".'
      },
      {
        id: 'u3-ex-5',
        type: 'quiz',
        level: 'B1',
        topic: 'work',
        title: 'Trắc Nghiệm: Kết Thúc Email Chuyên Nghiệp',
        vietnamesePrompt: 'Câu nào thường dùng ở cuối email để thể hiện sự mong đợi phản hồi?',
        questionEn: 'Which phrase is the most professional closing when you await a reply?',
        questionVi: 'Cụm từ nào là cách kết thúc email chuyên nghiệp nhất khi bạn chờ thư trả lời?',
        quizOptions: [
          {
            id: 'q3-opt1',
            text: 'I look forward to hearing from you soon.',
            isCorrect: true,
            explanation: '"I look forward to hearing from you soon" là quy chuẩn vàng trong thư từ kinh doanh (chú ý "to + V-ing").'
          },
          {
            id: 'q3-opt2',
            text: 'Answer me fast please.',
            isCorrect: false,
            explanation: 'Cộc lốc và tạo cảm giác áp đặt người nhận.'
          },
          {
            id: 'q3-opt3',
            text: 'I will wait until you talk.',
            isCorrect: false,
            explanation: 'Không tự nhiên và mang tính gượng ép trong văn phong văn phòng.'
          },
          {
            id: 'q3-opt4',
            text: 'Send me info quickly now.',
            isCorrect: false,
            explanation: 'Quá thiếu lịch sự đối với đối tác hoặc cấp trên.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-4',
    title: 'Ẩm Thực, Nhà Hàng & Gọi Món Quốc Tế',
    subtitle: 'Tự tin gọi món, hỏi về nguyên liệu, dị ứng và khen ngợi món ăn',
    level: 'A2',
    topic: 'food',
    image: '/src/assets/images/english_learning_hero_1790648876420.jpg',
    estimatedMinutes: 6,
    exercises: [
      {
        id: 'u4-ex-1',
        type: 'flashcard',
        level: 'A2',
        topic: 'food',
        title: 'Từ Vựng Ẩm Thực: Khẩu Vị',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'savory',
        ipa: '/ˈseɪ.vər.i/',
        partOfSpeech: 'adjective',
        definitionVi: 'Đậm đà, thơm ngon vừa miệng (vị mặn béo hấp dẫn, không ngọt)',
        exampleEn: 'This savory beef pie is the specialty of the house.',
        exampleVi: 'Món bánh nướng thịt bò đậm đà này là đặc sản của nhà hàng.'
      },
      {
        id: 'u4-ex-2',
        type: 'word-reorder',
        level: 'A2',
        topic: 'food',
        title: 'Sắp Xếp Câu: Yêu Cầu Món Không Cay',
        vietnamesePrompt: 'Sắp xếp thành câu: "Bạn có thể làm món này bớt cay được không?"',
        targetSentence: 'Could you please make this dish less spicy?',
        scrambledWords: ['make', 'spicy?', 'please', 'Could', 'this', 'less', 'you', 'dish'],
        grammarTip: 'Cấu trúc "Make + tân ngữ + tính từ" (make this dish less spicy).'
      },
      {
        id: 'u4-ex-3',
        type: 'listening-cloze',
        level: 'A2',
        topic: 'food',
        title: 'Luyện Nghe: Gợi Ý Của Bồi Bàn',
        vietnamesePrompt: 'Lắng nghe gợi ý của phục vụ và chọn từ còn thiếu',
        audioText: 'What would you recommend for dessert tonight?',
        blankWord: 'recommend',
        fullSentenceEn: 'What would you recommend for dessert tonight?',
        fullSentenceVi: 'Tối nay bạn gợi ý món tráng miệng nào ngon nhất?',
        options: ['recommend', 'request', 'remember', 'refuse']
      },
      {
        id: 'u4-ex-4',
        type: 'speaking',
        level: 'A2',
        topic: 'food',
        title: 'Luyện Nói: Khen Món Ăn',
        vietnamesePrompt: 'Đọc to lời khen ngợi đầu bếp một cách tự nhiên',
        speakingTarget: 'The steak is cooked to absolute perfection, thank you!',
        speakingPhonetic: '/ðə steɪk ɪz kʊkt tuː ˈæb.sə.luːt pəˈfek.ʃən...',
        speakingHint: 'Nhớ phát âm đuôi /t/ trong "cooked" (/kʊkt/).'
      },
      {
        id: 'u4-ex-5',
        type: 'quiz',
        level: 'A2',
        topic: 'food',
        title: 'Trắc Nghiệm: Dị Ứng Thực Phẩm',
        vietnamesePrompt: 'Khi bạn bị dị ứng đậu phộng, câu nào nói chuẩn xác nhất?',
        questionEn: 'How do you tell the waiter that you cannot eat peanuts?',
        questionVi: 'Cách nào để nói với nhân viên rằng bạn bị dị ứng đậu phộng?',
        quizOptions: [
          {
            id: 'q4-opt1',
            text: "I am allergic to peanuts, does this contain any?",
            isCorrect: true,
            explanation: '"To be allergic to + noun" là cấu trúc y tế và đời sống chuẩn xác nhất để thông báo dị ứng.'
          },
          {
            id: 'q4-opt2',
            text: 'I hate peanut very dangerous.',
            isCorrect: false,
            explanation: '"Hate" chỉ biểu thị sở thích không thích ăn, không thể hiện được mức độ dị ứng nguy hiểm.'
          },
          {
            id: 'q4-opt3',
            text: 'Peanut cannot touch me.',
            isCorrect: false,
            explanation: 'Dịch từng từ gượng gạo và không tự nhiên.'
          },
          {
            id: 'q4-opt4',
            text: 'Do not put peanut or I will die.',
            isCorrect: false,
            explanation: 'Quá kịch tính và thiếu tính tự nhiên trong giao tiếp nhà hàng.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-5',
    title: 'Mua Sắm, Thanh Toán & Trả Hàng',
    subtitle: 'Hỏi kích cỡ quần áo, thử đồ, hỏi chính sách hoàn tiền và trả giá lịch thiệp',
    level: 'A2',
    topic: 'daily',
    image: '/src/assets/images/english_learning_hero_1790648876420.jpg',
    estimatedMinutes: 6,
    exercises: [
      {
        id: 'u5-ex-1',
        type: 'flashcard',
        level: 'A2',
        topic: 'daily',
        title: 'Từ Vựng Mua Sắm: Hoàn Tiền',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'refund',
        ipa: '/ˈriː.fʌnd/',
        partOfSpeech: 'noun / verb',
        definitionVi: 'Tiền hoàn lại, trả lại tiền khi trả hàng',
        exampleEn: 'You can get a full refund within thirty days with your receipt.',
        exampleVi: 'Bạn có thể nhận lại toàn bộ tiền trong vòng 30 ngày nếu còn hóa đơn.'
      },
      {
        id: 'u5-ex-2',
        type: 'word-reorder',
        level: 'A2',
        topic: 'daily',
        title: 'Sắp Xếp Câu: Thử Quần Áo',
        vietnamesePrompt: 'Sắp xếp thành câu: "Tôi có thể thử chiếc áo khoác này trong phòng thay đồ được không?"',
        targetSentence: 'Can I try on this jacket in the fitting room?',
        scrambledWords: ['jacket', 'the', 'try', 'room?', 'in', 'Can', 'I', 'on', 'this', 'fitting'],
        grammarTip: '"Try on" là cụm động từ mang nghĩa "mặc thử đồ".'
      },
      {
        id: 'u5-ex-3',
        type: 'listening-cloze',
        level: 'A2',
        topic: 'daily',
        title: 'Luyện Nghe: Hỏi Kích Cỡ',
        vietnamesePrompt: 'Lắng nghe câu hỏi kích cỡ và chọn từ còn thiếu',
        audioText: 'Do you have this stylish shirt in a larger size?',
        blankWord: 'larger',
        fullSentenceEn: 'Do you have this stylish shirt in a larger size?',
        fullSentenceVi: 'Bạn có chiếc áo sơ mi kiểu này ở cỡ lớn hơn không?',
        options: ['larger', 'taller', 'wider', 'longer']
      },
      {
        id: 'u5-ex-4',
        type: 'speaking',
        level: 'A2',
        topic: 'daily',
        title: 'Luyện Nói: Hỏi Phương Thức Thanh Toán',
        vietnamesePrompt: 'Đọc to câu hỏi thanh toán thẻ một cách tự nhiên',
        speakingTarget: 'Do you accept contactless payments or Apple Pay?',
        speakingPhonetic: '/duː juː əkˈsept kɒnˈtækt.ləs ˈpeɪ.mənts...',
        speakingHint: 'Nhấn trọng âm vào "con-tact-less" và "pay-ments".'
      },
      {
        id: 'u5-ex-5',
        type: 'quiz',
        level: 'A2',
        topic: 'daily',
        title: 'Trắc Nghiệm: Mua Hàng Được Giảm Giá',
        vietnamesePrompt: 'Khi muốn hỏi một sản phẩm có đang trong đợt giảm giá không, câu nào đúng?',
        questionEn: 'How do you ask if an item has a discounted price?',
        questionVi: 'Câu nào dùng để hỏi món hàng này có đang giảm giá không?',
        quizOptions: [
          {
            id: 'q5-opt1',
            text: 'Is this item on sale right now?',
            isCorrect: true,
            explanation: '"On sale" có nghĩa là đang được giảm giá (khác với "for sale" là đang được rao bán).'
          },
          {
            id: 'q5-opt2',
            text: 'Is this item for sell cheaper?',
            isCorrect: false,
            explanation: '"Sell" là động từ, không dùng sau "for". Cụm từ đúng là "for sale".'
          },
          {
            id: 'q5-opt3',
            text: 'Give me lower price please.',
            isCorrect: false,
            explanation: 'Nghe như một yêu cầu gắt gỏng trong cửa hàng.'
          },
          {
            id: 'q5-opt4',
            text: 'Why this cost too much money?',
            isCorrect: false,
            explanation: 'Thiếu trợ động từ và không mang tính lịch sự.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-6',
    title: 'Công Nghệ, Trí Tuệ Nhân Tạo & Đời Sống Số',
    subtitle: 'Thảo luận về ứng dụng AI, phần mềm, bảo mật dữ liệu và làm việc từ xa',
    level: 'B1',
    topic: 'tech',
    image: '/src/assets/images/business_english_art_1790648901506.jpg',
    estimatedMinutes: 7,
    exercises: [
      {
        id: 'u6-ex-1',
        type: 'flashcard',
        level: 'B1',
        topic: 'tech',
        title: 'Từ Vựng Công Nghệ: Tự Động Hóa',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'automate',
        ipa: '/ˈɔː.tə.meɪt/',
        partOfSpeech: 'verb',
        definitionVi: 'Tự động hóa, sử dụng máy móc hoặc phần mềm thay thế con người',
        exampleEn: 'We use intelligent scripts to automate repetitive daily tasks.',
        exampleVi: 'Chúng tôi dùng các đoạn mã thông minh để tự động hóa những tác vụ lặp lại hàng ngày.'
      },
      {
        id: 'u6-ex-2',
        type: 'word-reorder',
        level: 'B1',
        topic: 'tech',
        title: 'Sắp Xếp Câu: Bảo Mật Mật Khẩu',
        vietnamesePrompt: 'Sắp xếp thành câu: "Điều tối quan trọng là phải kích hoạt xác thực hai yếu tố."',
        targetSentence: 'It is crucial to enable two-factor authentication on your account.',
        scrambledWords: ['crucial', 'on', 'to', 'your', 'It', 'account.', 'authentication', 'two-factor', 'is', 'enable'],
        grammarTip: 'Cấu trúc giả định: "It is crucial to + V-infinitive".'
      },
      {
        id: 'u6-ex-3',
        type: 'listening-cloze',
        level: 'B1',
        topic: 'tech',
        title: 'Luyện Nghe: Làm Việc Từ Xa',
        vietnamesePrompt: 'Lắng nghe phát âm và chọn từ khóa thích hợp',
        audioText: 'Cloud tools allow team members to communicate seamlessly from anywhere.',
        blankWord: 'seamlessly',
        fullSentenceEn: 'Cloud tools allow team members to communicate seamlessly from anywhere.',
        fullSentenceVi: 'Các công cụ điện toán đám mây cho phép các thành viên trong nhóm giao tiếp liền mạch từ bất cứ đâu.',
        options: ['seamlessly', 'silently', 'slowly', 'separately']
      },
      {
        id: 'u6-ex-4',
        type: 'speaking',
        level: 'B1',
        topic: 'tech',
        title: 'Luyện Nói: Đánh Giá Công Nghệ AI',
        vietnamesePrompt: 'Đọc to nhận xét về ảnh hưởng của AI đối với năng suất',
        speakingTarget: 'Artificial intelligence enhances our productivity by processing data rapidly.',
        speakingPhonetic: '/ˌɑː.tɪˈfɪʃ.əl ɪnˈtel.ɪ.dʒəns ɪnˈhɑːns.ɪz...',
        speakingHint: 'Nhớ nhấn trọng âm ở "pro-duc-TIV-i-ty" và "RAP-id-ly".'
      },
      {
        id: 'u6-ex-5',
        type: 'quiz',
        level: 'B1',
        topic: 'tech',
        title: 'Trắc Nghiệm: Lỗi Phần Mềm',
        vietnamesePrompt: 'Khi một ứng dụng bị đơ hoặc tắt đột ngột, từ chuẩn nhất là gì?',
        questionEn: 'The video conference app suddenly stopped working. We say: "The app ______."',
        questionVi: 'Khi ứng dụng tự động bị đóng bất ngờ, ta nói:',
        quizOptions: [
          {
            id: 'q6-opt1',
            text: 'crashed',
            isCorrect: true,
            explanation: 'Trong công nghệ, "an app crashed" là thuật ngữ tiêu chuẩn khi ứng dụng bị tắt đột ngột hoặc dừng hoạt động do lỗi.'
          },
          {
            id: 'q6-opt2',
            text: 'broke down',
            isCorrect: false,
            explanation: '"Broke down" thường dùng cho xe cộ, máy móc cơ khí, không dùng cho phần mềm.'
          },
          {
            id: 'q6-opt3',
            text: 'slept',
            isCorrect: false,
            explanation: 'Không tự nhiên trong tiếng Anh công nghệ.'
          },
          {
            id: 'q6-opt4',
            text: 'destroyed',
            isCorrect: false,
            explanation: '"Destroyed" mang nghĩa bị phá hủy vật lý nặng nề.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-7',
    title: 'Tình Bạn, Hẹn Hò & Mối Quan Hệ',
    subtitle: 'Mời bạn bè đi chơi, hỏi thăm chân thành, tâm sự và duy trì tình bạn đẹp',
    level: 'B1',
    topic: 'social',
    image: '/src/assets/images/english_learning_hero_1790648876420.jpg',
    estimatedMinutes: 6,
    exercises: [
      {
        id: 'u7-ex-1',
        type: 'flashcard',
        level: 'B1',
        topic: 'social',
        title: 'Từ Vựng Tình Cảm: Đồng Điệu',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'compatible',
        ipa: '/kəmˈpæt.ə.bəl/',
        partOfSpeech: 'adjective',
        definitionVi: 'Hợp nhau, tương thích, ăn ý trong tính cách',
        exampleEn: 'They get along wonderfully because their values are truly compatible.',
        exampleVi: 'Họ chơi với nhau rất hòa thuận vì hệ giá trị sống của họ thực sự rất hợp nhau.'
      },
      {
        id: 'u7-ex-2',
        type: 'word-reorder',
        level: 'B1',
        topic: 'social',
        title: 'Sắp Xếp Câu: Hẹn Gặp Lại Bạn Cũ',
        vietnamesePrompt: 'Sắp xếp thành câu: "Lâu lắm rồi chúng ta chưa gặp, hãy cùng đi uống cà phê để cập nhật tin tức nhé!"',
        targetSentence: "It has been ages, let's grab a coffee and catch up soon!",
        scrambledWords: ['ages,', 'a', 'soon!', 'has', 'coffee', 'and', 'catch', 'let\'s', 'It', 'grab', 'up', 'been'],
        grammarTip: '"Catch up" là thành ngữ rất phổ biến mang nghĩa "hàn huyên, cập nhật cuộc sống của nhau sau thời gian xa cách".'
      },
      {
        id: 'u7-ex-3',
        type: 'listening-cloze',
        level: 'B1',
        topic: 'social',
        title: 'Luyện Nghe: Lời Động Viên',
        vietnamesePrompt: 'Lắng nghe lời chia sẻ và chọn từ còn thiếu',
        audioText: 'No matter what happens, you can always count on me.',
        blankWord: 'count on',
        fullSentenceEn: 'No matter what happens, you can always count on me.',
        fullSentenceVi: 'Bất kể chuyện gì xảy ra, bạn luôn có thể tin tưởng và dựa vào tôi.',
        options: ['count on', 'look at', 'turn down', 'give up']
      },
      {
        id: 'u7-ex-4',
        type: 'speaking',
        level: 'B1',
        topic: 'social',
        title: 'Luyện Nói: Thể Hiện Sự Thấu Cảm',
        vietnamesePrompt: 'Đọc to lời an ủi một người bạn đang gặp khó khăn',
        speakingTarget: 'I completely understand how overwhelming this situation must feel.',
        speakingPhonetic: '/aɪ kəmˈpliːt.li ˌʌn.dəˈstænd haʊ ˌoʊ.vərˈwel.mɪŋ...',
        speakingHint: 'Từ "overwhelming" nhấn trọng âm ở "WHEL".'
      },
      {
        id: 'u7-ex-5',
        type: 'quiz',
        level: 'B1',
        topic: 'social',
        title: 'Trắc Nghiệm: Mời Đi Chơi Tự Nhiên',
        vietnamesePrompt: 'Khi muốn rủ bạn đi xem phim vào thứ Sáu, câu nào tự nhiên nhất?',
        questionEn: 'What is the most casual and natural way to invite a friend out?',
        questionVi: 'Cách nào rủ bạn bè đi chơi tự nhiên và thân mật nhất?',
        quizOptions: [
          {
            id: 'q7-opt1',
            text: 'Are you free this Friday? Do you feel like catching a movie?',
            isCorrect: true,
            explanation: '"Feel like + V-ing" (bạn có hứng thú làm gì không) là cách rủ rê cực kỳ tự nhiên của người bản xứ.'
          },
          {
            id: 'q7-opt2',
            text: 'I demand you to come to cinema with me.',
            isCorrect: false,
            explanation: '"Demand" là ra lệnh, cưỡng ép.'
          },
          {
            id: 'q7-opt3',
            text: 'Must you go watch film with me now?',
            isCorrect: false,
            explanation: 'Gượng gạo và gây khó chịu.'
          },
          {
            id: 'q7-opt4',
            text: 'Cinema is open, walk there now.',
            isCorrect: false,
            explanation: 'Không tự nhiên và thiếu tính mời mọc.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-8',
    title: 'Sức Khỏe, Khám Bệnh & Thể Thao',
    subtitle: 'Mô tả triệu chứng bệnh, đặt lịch hẹn bác sĩ và nói về lối sống lành mạnh',
    level: 'B1',
    topic: 'daily',
    image: '/src/assets/images/english_learning_hero_1790648876420.jpg',
    estimatedMinutes: 7,
    exercises: [
      {
        id: 'u8-ex-1',
        type: 'flashcard',
        level: 'B1',
        topic: 'daily',
        title: 'Từ Vựng Y Tế: Kê Đơn Thuốc',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'prescription',
        ipa: '/prɪˈskrɪp.ʃən/',
        partOfSpeech: 'noun',
        definitionVi: 'Đơn thuốc do bác sĩ kê',
        exampleEn: 'You will need a doctor\'s prescription to buy this medication.',
        exampleVi: 'Bạn sẽ cần đơn thuốc của bác sĩ để mua loại thuốc này.'
      },
      {
        id: 'u8-ex-2',
        type: 'word-reorder',
        level: 'B1',
        topic: 'daily',
        title: 'Sắp Xếp Câu: Đau Đầu Kéo Dài',
        vietnamesePrompt: 'Sắp xếp thành câu: "Tôi bị đau đầu dữ dội suốt hai ngày qua."',
        targetSentence: 'I have had a severe headache for the past two days.',
        scrambledWords: ['for', 'past', 'severe', 'days.', 'I', 'a', 'two', 'had', 'the', 'headache', 'have'],
        grammarTip: 'Dùng thì hiện tại hoàn thành (have had) để diễn tả triệu chứng bắt đầu trong quá khứ và vẫn đang tiếp diễn.'
      },
      {
        id: 'u8-ex-3',
        type: 'listening-cloze',
        level: 'B1',
        topic: 'daily',
        title: 'Luyện Nghe: Lời Dặn Của Bác Sĩ',
        vietnamesePrompt: 'Lắng nghe bác sĩ dặn dò và chọn từ đúng',
        audioText: 'Make sure to take this medicine twice a day after meals.',
        blankWord: 'twice a day',
        fullSentenceEn: 'Make sure to take this medicine twice a day after meals.',
        fullSentenceVi: 'Hãy chắc chắn uống loại thuốc này hai lần một ngày sau bữa ăn.',
        options: ['twice a day', 'once a month', 'every hour', 'before sleep']
      },
      {
        id: 'u8-ex-4',
        type: 'speaking',
        level: 'B1',
        topic: 'daily',
        title: 'Luyện Nói: Thói Quen Tập Luyện',
        vietnamesePrompt: 'Đọc to thói quen rèn luyện sức khỏe',
        speakingTarget: 'Staying hydrated and getting eight hours of sleep boost our immune system.',
        speakingPhonetic: '/ˈsteɪ.ɪŋ haɪˈdreɪ.tɪd ænd ˈɡet.ɪŋ eɪt ˈaʊ.əz...',
        speakingHint: '"Hydrated" phát âm là /ˈhaɪ.dreɪ.tɪd/, "immune" nhấn âm hai.'
      },
      {
        id: 'u8-ex-5',
        type: 'quiz',
        level: 'B1',
        topic: 'daily',
        title: 'Trắc Nghiệm: Đặt Lịch Hẹn Khám',
        vietnamesePrompt: 'Cách nào để gọi điện đặt lịch khám với bác sĩ?',
        questionEn: 'You call a medical clinic. What is the most appropriate opening sentence?',
        questionVi: 'Khi gọi đến phòng khám để hẹn giờ, câu nào phù hợp nhất?',
        quizOptions: [
          {
            id: 'q8-opt1',
            text: 'Hello, I would like to make an appointment to see Dr. Smith, please.',
            isCorrect: true,
            explanation: '"Make an appointment to see + Doctor" là cụm từ chuẩn mực khi đặt lịch khám y khoa.'
          },
          {
            id: 'q8-opt2',
            text: 'Doctor must meet me today right now.',
            isCorrect: false,
            explanation: 'Bất lịch sự và không phải cách giao tiếp chuẩn với lễ tân phòng khám.'
          },
          {
            id: 'q8-opt3',
            text: 'I buy one hour with doctor.',
            isCorrect: false,
            explanation: 'Không ai dùng từ "buy time with doctor" trong tiếng Anh.'
          },
          {
            id: 'q8-opt4',
            text: 'Open the door for me today.',
            isCorrect: false,
            explanation: 'Sai hoàn toàn ngữ cảnh giao tiếp.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-9',
    title: 'IELTS & TOEIC Idioms & Collocations Ăn Điểm',
    subtitle: 'Nâng tầm cách diễn đạt với các thành ngữ tự nhiên và từ nối ăn điểm cao',
    level: 'B2',
    topic: 'social',
    image: '/src/assets/images/english_learning_hero_1790648876420.jpg',
    estimatedMinutes: 8,
    exercises: [
      {
        id: 'u9-ex-1',
        type: 'flashcard',
        level: 'B2',
        topic: 'social',
        title: 'Thành Ngữ Ăn Điểm: Hiếm Khi',
        vietnamesePrompt: 'Lật thẻ để xem ngữ cảnh và cách dùng idiom thực tế',
        word: 'once in a blue moon',
        ipa: '/wʌns ɪn ə bluː muːn/',
        partOfSpeech: 'idiom',
        definitionVi: 'Rất hiếm khi, năm thì mười họa mới xảy ra',
        exampleEn: 'Because of his busy work schedule, he only goes fishing once in a blue moon.',
        exampleVi: 'Vì lịch làm việc bận rộn, anh ấy rất hiếm khi mới đi câu cá.'
      },
      {
        id: 'u9-ex-2',
        type: 'word-reorder',
        level: 'B2',
        topic: 'social',
        title: 'Sắp Xếp Câu: Cân Nhắc Lợi Hại',
        vietnamesePrompt: 'Sắp xếp thành câu: "Điều quan trọng là phải cân nhắc kỹ cả ưu điểm lẫn nhược điểm."',
        targetSentence: 'It is essential to weigh the pros and cons carefully.',
        scrambledWords: ['pros', 'essential', 'carefully.', 'to', 'is', 'the', 'and', 'weigh', 'It', 'cons'],
        grammarTip: '"Weigh the pros and cons" (cân nhắc mặt lợi và mặt hại) là cụm từ rất hay trong IELTS Writing Task 2 & Speaking Part 3.'
      },
      {
        id: 'u9-ex-3',
        type: 'listening-cloze',
        level: 'B2',
        topic: 'social',
        title: 'Luyện Nghe: Cụm Từ Học Thuật',
        vietnamesePrompt: 'Lắng nghe câu nhận xét và chọn từ đồng nghĩa nâng cao',
        audioText: 'Regular physical exercise plays a vital role in maintaining mental health.',
        blankWord: 'vital',
        fullSentenceEn: 'Regular physical exercise plays a vital role in maintaining mental health.',
        fullSentenceVi: 'Tập thể dục thường xuyên đóng vai trò thiết yếu trong việc duy trì sức khỏe tinh thần.',
        options: ['vital', 'trivial', 'minor', 'casual']
      },
      {
        id: 'u9-ex-4',
        type: 'speaking',
        level: 'B2',
        topic: 'social',
        title: 'Luyện Nói: Cụm Nối Diễn Đạt Ý Tưởng',
        vietnamesePrompt: 'Luyện phát âm trôi chảy câu nêu luận điểm',
        speakingTarget: 'Taking everything into consideration, technological advances have enriched our lives.',
        speakingPhonetic: '/ˈteɪ.kɪŋ ˈev.ri.θɪŋ ˈɪn.tuː kənˌsɪd.əˈreɪ.ʃən...',
        speakingHint: 'Cụm "Taking everything into consideration" là cụm mở đầu kết luận cực kỳ ghi điểm.'
      },
      {
        id: 'u9-ex-5',
        type: 'quiz',
        level: 'B2',
        topic: 'social',
        title: 'Trắc Nghiệm: Collocation Chuẩn Xác',
        vietnamesePrompt: 'Động từ nào đi kèm với "decision" để mang nghĩa "đưa ra quyết định sáng suốt"?',
        questionEn: 'We need to ______ an informed decision based on reliable data.',
        questionVi: 'Động từ nào kết hợp với "decision" trong câu trên?',
        quizOptions: [
          {
            id: 'q9-opt1',
            text: 'make',
            isCorrect: true,
            explanation: 'Collocation chuẩn là "make a decision" (hoặc "reach a decision"). Tuyệt đối không dùng "do a decision".'
          },
          {
            id: 'q9-opt2',
            text: 'do',
            isCorrect: false,
            explanation: '"Do" đi với tasks, jobs, chores ("do homework", "do research"), không đi với "decision".'
          },
          {
            id: 'q9-opt3',
            text: 'create',
            isCorrect: false,
            explanation: 'Không tự nhiên trong tiếng Anh chuẩn.'
          },
          {
            id: 'q9-opt4',
            text: 'build',
            isCorrect: false,
            explanation: '"Build" đi với trust, relationship, career, không đi với "decision".'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-10',
    title: 'Phỏng Vấn Xin Việc & Đàm Phán Lương Bổng',
    subtitle: 'Trả lời các câu hỏi phỏng vấn hóc búa, nêu bật thế mạnh và đàm phán đãi ngộ',
    level: 'B2',
    topic: 'work',
    image: '/src/assets/images/business_english_art_1790648901506.jpg',
    estimatedMinutes: 8,
    exercises: [
      {
        id: 'u10-ex-1',
        type: 'flashcard',
        level: 'B2',
        topic: 'work',
        title: 'Từ Vựng Tuyển Dụng: Thích Ứng',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'adaptable',
        ipa: '/əˈdæp.tə.bəl/',
        partOfSpeech: 'adjective',
        definitionVi: 'Có khả năng thích ứng linh hoạt với hoàn cảnh mới',
        exampleEn: 'Employers value candidates who are adaptable in fast-paced environments.',
        exampleVi: 'Nhà tuyển dụng rất coi trọng các ứng viên có khả năng thích nghi trong môi trường tốc độ cao.'
      },
      {
        id: 'u10-ex-2',
        type: 'word-reorder',
        level: 'B2',
        topic: 'work',
        title: 'Sắp Xếp Câu: Nêu Bật Thành Tựu',
        vietnamesePrompt: 'Sắp xếp thành câu: "Trong vai trò trước đây của tôi, tôi đã dẫn dắt một nhóm gồm năm kỹ sư."',
        targetSentence: 'In my previous role, I led a cross-functional team of five engineers.',
        scrambledWords: ['a', 'led', 'engineers.', 'role,', 'of', 'team', 'five', 'In', 'my', 'cross-functional', 'I', 'previous'],
        grammarTip: 'Khi kể về thành tựu trong quá khứ ở CV hoặc phỏng vấn, luôn dùng động từ hành động ở thì quá khứ đơn (led, managed, designed).'
      },
      {
        id: 'u10-ex-3',
        type: 'listening-cloze',
        level: 'B2',
        topic: 'work',
        title: 'Luyện Nghe: Hỏi Về Kỳ Vọng Lương',
        vietnamesePrompt: 'Lắng nghe nhà tuyển dụng hỏi về kỳ vọng lương và chọn từ đúng',
        audioText: 'What are your compensation expectations for this senior position?',
        blankWord: 'compensation',
        fullSentenceEn: 'What are your compensation expectations for this senior position?',
        fullSentenceVi: 'Kỳ vọng về chế độ đãi ngộ và mức lương của bạn cho vị trí cấp cao này là gì?',
        options: ['compensation', 'communication', 'competition', 'contribution']
      },
      {
        id: 'u10-ex-4',
        type: 'speaking',
        level: 'B2',
        topic: 'work',
        title: 'Luyện Nói: Giới Thiệu Điểm Mạnh',
        vietnamesePrompt: 'Đọc to câu trả lời phỏng vấn khẳng định giá trị bản thân',
        speakingTarget: 'My greatest strength is my ability to solve complex problems under tight deadlines.',
        speakingPhonetic: '/maɪ ˈɡreɪ.tɪst streŋθ ɪz maɪ əˈbɪl.ə.ti...',
        speakingHint: 'Nhớ phát âm âm /ŋθ/ ở cuối từ "strength".'
      },
      {
        id: 'u10-ex-5',
        type: 'quiz',
        level: 'B2',
        topic: 'work',
        title: 'Trắc Nghiệm: Đặt Câu Hỏi Cho Nhà Tuyển Dụng',
        vietnamesePrompt: 'Cuối buổi phỏng vấn khi được hỏi "Do you have any questions for us?", câu nào thông minh nhất?',
        questionEn: 'Which question shows genuine enthusiasm and strategic thinking at the end of an interview?',
        questionVi: 'Câu hỏi nào thể hiện sự nhiệt tình và tư duy chiến lược tốt nhất?',
        quizOptions: [
          {
            id: 'q10-opt1',
            text: 'What does success look like for this role in the first ninety days?',
            isCorrect: true,
            explanation: 'Câu hỏi này cho thấy bạn là người hướng đến kết quả và mong muốn tạo ra giá trị ngay từ những ngày đầu.'
          },
          {
            id: 'q10-opt2',
            text: 'How many days of paid vacation do I get immediately?',
            isCorrect: false,
            explanation: 'Hỏi về ngày nghỉ phép ngay lập tức tạo ấn tượng không tốt khi chưa nhận được offer.'
          },
          {
            id: 'q10-opt3',
            text: 'No, I have no questions at all.',
            isCorrect: false,
            explanation: 'Nói không có câu hỏi nào thể hiện sự thiếu chuẩn bị hoặc thiếu hứng thú với công ty.'
          },
          {
            id: 'q10-opt4',
            text: 'Are you sure you want to hire me?',
            isCorrect: false,
            explanation: 'Thể hiện sự tự ti hoặc nghi ngờ quá mức.'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-11',
    title: 'Thành Ngữ & Tiếng Lóng Phổ Biến Trong Đời Thực',
    subtitle: 'Nói tiếng Anh tự nhiên như người bản xứ qua các câu lóng và thành ngữ đời sống',
    level: 'B2',
    topic: 'social',
    image: '/src/assets/images/english_learning_hero_1790648876420.jpg',
    estimatedMinutes: 7,
    exercises: [
      {
        id: 'u11-ex-1',
        type: 'flashcard',
        level: 'B2',
        topic: 'social',
        title: 'Thành Ngữ Đời Thường: Tiết Lộ Bí Mật',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'spill the beans',
        ipa: '/spɪl ðə biːnz/',
        partOfSpeech: 'idiom',
        definitionVi: 'Lỡ miệng làm lộ bí mật, bật mí điều bất ngờ',
        exampleEn: 'We were planning a surprise party, but Tom accidentally spilled the beans.',
        exampleVi: 'Chúng tôi đang lên kế hoạch cho bữa tiệc bất ngờ, nhưng Tom lỡ làm lộ mất.'
      },
      {
        id: 'u11-ex-2',
        type: 'word-reorder',
        level: 'B2',
        topic: 'social',
        title: 'Sắp Xếp Câu: Mọi Chuyện Đều Có Mặt Tích Cực',
        vietnamesePrompt: 'Sắp xếp thành câu: "Mọi đám mây đen đều có ánh bạc (trong cái rủi có cái may)."',
        targetSentence: 'Every cloud has a silver lining.',
        scrambledWords: ['a', 'has', 'Every', 'lining.', 'silver', 'cloud'],
        grammarTip: '"Every cloud has a silver lining" là thành ngữ cổ vũ tinh thần lạc quan rất nổi tiếng trong văn hóa phương Tây.'
      },
      {
        id: 'u11-ex-3',
        type: 'listening-cloze',
        level: 'B2',
        topic: 'social',
        title: 'Luyện Nghe: Quyết Định Cắn Răng Chịu Đựng',
        vietnamesePrompt: 'Lắng nghe thành ngữ diễn tả việc dũng cảm đối mặt khó khăn',
        audioText: 'It is a tough decision, but you just have to bite the bullet.',
        blankWord: 'bite the bullet',
        fullSentenceEn: 'It is a tough decision, but you just have to bite the bullet.',
        fullSentenceVi: 'Đó là một quyết định khó khăn, nhưng bạn đành phải cắn răng chấp nhận thôi.',
        options: ['bite the bullet', 'break the ice', 'hit the sack', 'call it a day']
      },
      {
        id: 'u11-ex-4',
        type: 'speaking',
        level: 'B2',
        topic: 'social',
        title: 'Luyện Nói: Thành Ngữ "Hit the sack"',
        vietnamesePrompt: 'Đọc to cách nói đi ngủ tự nhiên của người Mỹ',
        speakingTarget: 'I am completely exhausted after a long journey, time to hit the sack.',
        speakingPhonetic: '/aɪ æm kəmˈpliːt.li ɪɡˈzɔː.stɪd...',
        speakingHint: '"Hit the sack" là tiếng lóng rất thân thuộc tương đương với "go to sleep".'
      },
      {
        id: 'u11-ex-5',
        type: 'quiz',
        level: 'B2',
        topic: 'social',
        title: 'Trắc Nghiệm: Thành Ngữ "Under the weather"',
        vietnamesePrompt: 'Khi ai đó nói "I am feeling a bit under the weather today", họ có ý gì?',
        questionEn: 'If someone tells you: "I am feeling a bit under the weather", what do they mean?',
        questionVi: 'Cụm từ "under the weather" có nghĩa là gì?',
        quizOptions: [
          {
            id: 'q11-opt1',
            text: 'They are feeling slightly sick or unwell.',
            isCorrect: true,
            explanation: '"Under the weather" là thành ngữ chỉ trạng thái hơi mệt, cảm nhẹ hoặc không được khỏe trong người.'
          },
          {
            id: 'q11-opt2',
            text: 'They are standing in the rain.',
            isCorrect: false,
            explanation: 'Không mang nghĩa đen về thời tiết mưa gió bên ngoài.'
          },
          {
            id: 'q11-opt3',
            text: 'They are looking at the sky forecast.',
            isCorrect: false,
            explanation: 'Sai hoàn toàn nghĩa thành ngữ.'
          },
          {
            id: 'q11-opt4',
            text: 'They are extremely happy.',
            isCorrect: false,
            explanation: 'Rất vui sướng là "on cloud nine" hoặc "over the moon", không phải "under the weather".'
          }
        ]
      }
    ]
  },
  {
    id: 'unit-12',
    title: 'Thuyết Trình, Phản Biện & Tư Duy Phản Biện',
    subtitle: 'Kỹ năng trình bày ý tưởng thuyết phục, chuyển đoạn mượt mà và tranh luận học thuật',
    level: 'B2',
    topic: 'work',
    image: '/src/assets/images/business_english_art_1790648901506.jpg',
    estimatedMinutes: 8,
    exercises: [
      {
        id: 'u12-ex-1',
        type: 'flashcard',
        level: 'B2',
        topic: 'work',
        title: 'Từ Vựng Thuyết Trình: Minh Họa',
        vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
        word: 'illustrate',
        ipa: '/ˈɪl.ə.streɪt/',
        partOfSpeech: 'verb',
        definitionVi: 'Minh họa, làm sáng tỏ một quan điểm bằng ví dụ hoặc số liệu',
        exampleEn: 'To illustrate this trend, let us examine the chart on the screen.',
        exampleVi: 'Để minh họa cho xu hướng này, chúng ta hãy cùng nhìn vào biểu đồ trên màn hình.'
      },
      {
        id: 'u12-ex-2',
        type: 'word-reorder',
        level: 'B2',
        topic: 'work',
        title: 'Sắp Xếp Câu: Chuyển Đoạn Thuyết Trình',
        vietnamesePrompt: 'Sắp xếp thành câu: "Bây giờ, tôi xin phép chuyển sang phần tiếp theo của bài thuyết trình."',
        targetSentence: 'Now, let us move on to the next section of our presentation.',
        scrambledWords: ['presentation.', 'move', 'to', 'next', 'let', 'section', 'of', 'Now,', 'us', 'our', 'on', 'the'],
        grammarTip: '"Move on to" là cụm từ chuyển ý kinh điển khi thuyết trình trước công chúng.'
      },
      {
        id: 'u12-ex-3',
        type: 'listening-cloze',
        level: 'B2',
        topic: 'work',
        title: 'Luyện Nghe: Phản Biện Lịch Sự',
        vietnamesePrompt: 'Lắng nghe cách phản biện nhã nhặn và chọn từ đúng',
        audioText: 'While I understand your point, there is another aspect to consider.',
        blankWord: 'aspect',
        fullSentenceEn: 'While I understand your point, there is another aspect to consider.',
        fullSentenceVi: 'Dù tôi hiểu quan điểm của bạn, nhưng vẫn còn một khía cạnh khác cần cân nhắc.',
        options: ['aspect', 'accident', 'action', 'answer']
      },
      {
        id: 'u12-ex-4',
        type: 'speaking',
        level: 'B2',
        topic: 'work',
        title: 'Luyện Nói: Kết Luận Bài Thuyết Trình',
        vietnamesePrompt: 'Đọc to lời kết thúc bài thuyết trình chuyên nghiệp',
        speakingTarget: 'In conclusion, investing in talent development yields the highest long-term returns.',
        speakingPhonetic: '/ɪn kənˈkluː.ʒən, ɪnˈves.tɪŋ ɪn ˈtæl.ənt dɪˈvel.əp.mənt...',
        speakingHint: 'Nhấn mạnh từ "yields" và "returns" để tạo sức nặng cho luận điểm kết thúc.'
      },
      {
        id: 'u12-ex-5',
        type: 'quiz',
        level: 'B2',
        topic: 'work',
        title: 'Trắc Nghiệm: Mở Lượt Hỏi Đáp (Q&A)',
        vietnamesePrompt: 'Cách nào để mời khán giả đặt câu hỏi một cách nồng nhiệt và chuyên nghiệp?',
        questionEn: 'How do you invite the audience to ask questions at the end of a presentation?',
        questionVi: 'Câu nào dùng để mở phần hỏi đáp (Q&A) ở cuối bài thuyết trình?',
        quizOptions: [
          {
            id: 'q12-opt1',
            text: 'I would now be delighted to answer any questions you may have.',
            isCorrect: true,
            explanation: '"I would be delighted to answer any questions you may have" là câu kết thúc trang trọng, thanh lịch và hiếu khách.'
          },
          {
            id: 'q12-opt2',
            text: 'Ask me anything if you dare.',
            isCorrect: false,
            explanation: 'Nghe như một lời thách thức thô lỗ.'
          },
          {
            id: 'q12-opt3',
            text: 'Nobody should talk now please.',
            isCorrect: false,
            explanation: 'Bảo khán giả im lặng là phá vỡ mục đích của bài thuyết trình.'
          },
          {
            id: 'q12-opt4',
            text: 'Are you done looking at me?',
            isCorrect: false,
            explanation: 'Hoàn toàn không phù hợp.'
          }
        ]
      }
    ]
  }
];

// Expanded Vocabulary Notebook with 36 high-frequency practical words
export const INITIAL_SAVED_WORDS: SavedWord[] = [
  {
    id: 'w-1',
    word: 'consistent',
    ipa: '/kənˈsɪs.tənt/',
    partOfSpeech: 'adj',
    meaningVi: 'Kiên trì, nhất quán, đều đặn',
    exampleEn: 'Consistent daily practice is the true key to fluency.',
    exampleVi: 'Luyện tập đều đặn hàng ngày là chìa khóa thực sự để nói trôi chảy.',
    level: 'B1',
    topic: 'daily',
    mastered: true,
    reviewCount: 5,
    lastReviewedAt: '2026-10-25'
  },
  {
    id: 'w-2',
    word: 'fluency',
    ipa: '/ˈfluː.ən.si/',
    partOfSpeech: 'n',
    meaningVi: 'Sự trôi chảy, lưu loát trong ngôn ngữ',
    exampleEn: 'She speaks English with incredible fluency and confidence.',
    exampleVi: 'Cô ấy nói tiếng Anh với sự trôi chảy và tự tin đáng kinh ngạc.',
    level: 'B2',
    topic: 'daily',
    mastered: false,
    reviewCount: 2,
    lastReviewedAt: '2026-10-26'
  },
  {
    id: 'w-3',
    word: 'itinerary',
    ipa: '/aɪˈtɪn.ər.ər.i/',
    partOfSpeech: 'n',
    meaningVi: 'Lịch trình, lộ trình chuyến đi',
    exampleEn: 'Please check the itinerary for departure times.',
    exampleVi: 'Vui lòng kiểm tra lịch trình để biết giờ khởi hành.',
    level: 'A2',
    topic: 'travel',
    mastered: false,
    reviewCount: 3,
    lastReviewedAt: '2026-10-27'
  },
  {
    id: 'w-4',
    word: 'collaborate',
    ipa: '/kəˈlæb.ə.reɪt/',
    partOfSpeech: 'v',
    meaningVi: 'Cộng tác, hợp tác làm việc',
    exampleEn: 'We collaborate with international partners every week.',
    exampleVi: 'Chúng tôi hợp tác với các đối tác quốc tế hàng tuần.',
    level: 'B1',
    topic: 'work',
    mastered: true,
    reviewCount: 4,
    lastReviewedAt: '2026-10-24'
  },
  {
    id: 'w-5',
    word: 'perspective',
    ipa: '/pəˈspek.tɪv/',
    partOfSpeech: 'n',
    meaningVi: 'Góc nhìn, quan điểm cá nhân',
    exampleEn: 'Traveling gives you a fresh perspective on life.',
    exampleVi: 'Du lịch mang lại cho bạn một góc nhìn mới mẻ về cuộc sống.',
    level: 'B2',
    topic: 'social',
    mastered: false,
    reviewCount: 1,
    lastReviewedAt: '2026-10-27'
  },
  {
    id: 'w-6',
    word: 'resilient',
    ipa: '/rɪˈzɪl.jənt/',
    partOfSpeech: 'adj',
    meaningVi: 'Kiên cường, bền bỉ vượt qua khó khăn',
    exampleEn: 'Language learners need to be resilient when making mistakes.',
    exampleVi: 'Người học ngôn ngữ cần kiên cường khi mắc lỗi sai.',
    level: 'B2',
    topic: 'daily',
    mastered: false,
    reviewCount: 1,
    lastReviewedAt: '2026-10-27'
  },
  {
    id: 'w-7',
    word: 'spontaneous',
    ipa: '/spɒnˈteɪ.ni.əs/',
    partOfSpeech: 'adj',
    meaningVi: 'Tự phát, ngẫu hứng, không lên kế hoạch trước',
    exampleEn: 'We took a spontaneous weekend road trip to the mountains.',
    exampleVi: 'Chúng tôi đã có một chuyến phượt ngẫu hứng lên vùng núi vào cuối tuần.',
    level: 'B2',
    topic: 'travel',
    mastered: false,
    reviewCount: 1,
    lastReviewedAt: '2026-10-27'
  },
  {
    id: 'w-8',
    word: 'negotiate',
    ipa: '/nəˈɡoʊ.ʃi.eɪt/',
    partOfSpeech: 'v',
    meaningVi: 'Đàm phán, thương lượng các điều khoản',
    exampleEn: 'He managed to negotiate a higher starting salary.',
    exampleVi: 'Anh ấy đã đàm phán thành công mức lương khởi điểm cao hơn.',
    level: 'B2',
    topic: 'work',
    mastered: true,
    reviewCount: 3,
    lastReviewedAt: '2026-10-26'
  },
  {
    id: 'w-9',
    word: 'pragmatic',
    ipa: '/præɡˈmæt.ɪk/',
    partOfSpeech: 'adj',
    meaningVi: 'Thực dụng, thực tế, chú trọng vào kết quả thực tiễn',
    exampleEn: 'We need a pragmatic approach to solving this customer problem.',
    exampleVi: 'Chúng ta cần một cách tiếp cận thực tế để giải quyết vấn đề của khách hàng này.',
    level: 'B2',
    topic: 'work',
    mastered: false,
    reviewCount: 2,
    lastReviewedAt: '2026-10-27'
  },
  {
    id: 'w-10',
    word: 'serendipity',
    ipa: '/ˌser.ənˈdɪp.ə.ti/',
    partOfSpeech: 'n',
    meaningVi: 'Sự tình cờ may mắn, duyên may bất ngờ',
    exampleEn: 'Finding my current business partner was pure serendipity.',
    exampleVi: 'Tìm được đối tác kinh doanh hiện tại của tôi hoàn toàn là một duyên may tình cờ.',
    level: 'B2',
    topic: 'social',
    mastered: false,
    reviewCount: 1,
    lastReviewedAt: '2026-10-27'
  },
  {
    id: 'w-11',
    word: 'sustainable',
    ipa: '/səˈsteɪ.nə.bəl/',
    partOfSpeech: 'adj',
    meaningVi: 'Bền vững, có thể duy trì lâu dài',
    exampleEn: 'Sustainable habits are more effective than extreme study sessions.',
    exampleVi: 'Những thói quen bền vững hiệu quả hơn nhiều so với các buổi học nhồi nhét cực đoan.',
    level: 'B1',
    topic: 'daily',
    mastered: true,
    reviewCount: 4,
    lastReviewedAt: '2026-10-25'
  },
  {
    id: 'w-12',
    word: 'versatile',
    ipa: '/ˈvɜː.sə.taɪl/',
    partOfSpeech: 'adj',
    meaningVi: 'Đa năng, linh hoạt, nhiều công dụng',
    exampleEn: 'This software is versatile enough for both designers and developers.',
    exampleVi: 'Phần mềm này đủ đa năng cho cả các nhà thiết kế lẫn lập trình viên.',
    level: 'B2',
    topic: 'tech',
    mastered: false,
    reviewCount: 2,
    lastReviewedAt: '2026-10-26'
  }
];

// Achievement Badges
export const DEFAULT_BADGES: Badge[] = [
  {
    id: 'first-step',
    name: 'Bước Chân Đầu Tiên',
    description: 'Hoàn thành bài tập tương tác đầu tiên của bạn',
    iconName: 'Footprints',
    unlockedAt: '2026-10-25',
    targetCount: 1,
    currentCount: 1
  },
  {
    id: 'streak-3',
    name: 'Ngọn Lửa Kiên Trì',
    description: 'Duy trì chuỗi học tập 3 ngày liên tiếp',
    iconName: 'Flame',
    unlockedAt: '2026-10-27',
    targetCount: 3,
    currentCount: 3
  },
  {
    id: 'vocab-collector',
    name: 'Nhà Sưu Tầm Từ Vựng',
    description: 'Lưu và ghi nhớ từ 5 từ vựng vào sổ tay',
    iconName: 'BookMarked',
    unlockedAt: '2026-10-26',
    targetCount: 5,
    currentCount: 12
  },
  {
    id: 'perfect-score',
    name: 'Phát Âm Chuẩn Xác',
    description: 'Đạt độ chính xác phát âm từ 85% trở lên trong bài luyện nói',
    iconName: 'Mic',
    unlockedAt: null,
    targetCount: 1,
    currentCount: 0
  },
  {
    id: 'streak-7',
    name: 'Chiến Binh 7 Ngày',
    description: 'Học tập không gián đoạn suốt 7 ngày liên tục',
    iconName: 'Trophy',
    unlockedAt: null,
    targetCount: 7,
    currentCount: 3
  },
  {
    id: 'mastery-level-2',
    name: 'Cấp Độ Thăng Tiến',
    description: 'Tích lũy từ 300 điểm kinh nghiệm (XP) trở lên',
    iconName: 'Zap',
    unlockedAt: null,
    targetCount: 300,
    currentCount: 180
  }
];

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Dynamic randomized Daily Challenge: Never repeats the exact same 5 questions!
export function getDailyChallengeExercises(seed?: number): { unitTitle: string; exercise: LessonUnit['exercises'][0] }[] {
  // Collect all exercises from all 12 units
  const allPool: { unitTitle: string; exercise: LessonUnit['exercises'][0] }[] = [];
  
  LESSON_UNITS.forEach((unit) => {
    unit.exercises.forEach((ex) => {
      allPool.push({
        unitTitle: unit.title,
        exercise: ex,
      });
    });
  });

  // Shuffle the pool to ensure non-repetitive daily challenges
  const shuffled = shuffleArray(allPool);

  // Pick diverse exercise types (e.g. 1 flashcard, 1 word-reorder, 1 listening-cloze, 1 speaking, 1 quiz)
  const typesNeeded = ['flashcard', 'word-reorder', 'listening-cloze', 'speaking', 'quiz'];
  const selected: { unitTitle: string; exercise: LessonUnit['exercises'][0] }[] = [];

  typesNeeded.forEach((t) => {
    const found = shuffled.find(
      (item) => item.exercise.type === t && !selected.some((s) => s.exercise.id === item.exercise.id)
    );
    if (found) {
      selected.push(found);
    }
  });

  // If still need more to reach 5, fill from remaining
  for (const item of shuffled) {
    if (selected.length >= 5) break;
    if (!selected.some((s) => s.exercise.id === item.exercise.id)) {
      selected.push(item);
    }
  }

  return selected.slice(0, 5);
}
