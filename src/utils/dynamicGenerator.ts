import { CEFRLevel, ExerciseItem, ExerciseType, TopicCategory } from '../types/index.ts';

export interface CustomGeneratorParams {
  topic: string;
  level: CEFRLevel;
  skillFocus: 'all' | 'speaking' | 'reorder' | 'listening' | 'quiz' | 'flashcard';
  questionCount: number;
}

// Procedural exercise templates database with authentic vocabulary, sentences, audio prompts, and bilingual explanations
const EXERCISE_LIBRARY: Record<string, ExerciseItem[]> = {
  cafe: [
    {
      id: 'gen-cafe-1',
      type: 'flashcard',
      level: 'A1',
      topic: 'food',
      title: 'Từ Vựng Quán Cà Phê',
      vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
      word: 'beverage',
      ipa: '/ˈbev.ər.ɪdʒ/',
      partOfSpeech: 'noun',
      definitionVi: 'Đồ uống, thức uống các loại',
      exampleEn: 'Hot and cold beverages are served at the counter.',
      exampleVi: 'Các loại đồ uống nóng và lạnh được phục vụ tại quầy.'
    },
    {
      id: 'gen-cafe-2',
      type: 'word-reorder',
      level: 'A1',
      topic: 'food',
      title: 'Sắp Xếp Câu: Gọi Cà Phê Mang Đi',
      vietnamesePrompt: 'Sắp xếp thành câu: "Cho tôi một ly cà phê latte đá mang đi được không?"',
      targetSentence: 'Could I have an iced latte to go, please?',
      scrambledWords: ['an', 'latte', 'to', 'go,', 'Could', 'I', 'please?', 'have', 'iced'],
      grammarTip: '"To go" (ở Mỹ) hoặc "Takeaway" (ở Anh) có nghĩa là mang đi.'
    },
    {
      id: 'gen-cafe-3',
      type: 'listening-cloze',
      level: 'A1',
      topic: 'food',
      title: 'Luyện Nghe: Chọn Loại Sữa',
      vietnamesePrompt: 'Lắng nghe barista hỏi và chọn từ đúng',
      audioText: 'Would you prefer oat milk or regular dairy milk?',
      blankWord: 'oat milk',
      fullSentenceEn: 'Would you prefer oat milk or regular dairy milk?',
      fullSentenceVi: 'Bạn muốn dùng sữa yến mạch hay sữa bò thông thường?',
      options: ['oat milk', 'sweet tea', 'black coffee', 'cold juice']
    },
    {
      id: 'gen-cafe-4',
      type: 'speaking',
      level: 'A1',
      topic: 'food',
      title: 'Luyện Nói: Gọi Món Thân Mật',
      vietnamesePrompt: 'Đọc to câu gọi cà phê tự nhiên',
      speakingTarget: 'I will have a cappuccino with extra cinnamon on top.',
      speakingPhonetic: '/aɪ wɪl hæv ə ˌkæp.əˈtʃiː.noʊ wɪð ˈek.strə ˈsɪn.ə.mən...',
      speakingHint: 'Nhấn trọng âm ở "cap-puc-CI-no" và "CIN-na-mon".'
    },
    {
      id: 'gen-cafe-5',
      type: 'quiz',
      level: 'A1',
      topic: 'food',
      title: 'Trắc Nghiệm: Hỏi Mật Khẩu Wi-Fi',
      vietnamesePrompt: 'Khi muốn xin mật khẩu Wi-Fi tại quán cà phê, câu nào chuẩn nhất?',
      questionEn: 'How do you politely ask the barista for the cafe Wi-Fi password?',
      questionVi: 'Cách nào để hỏi mật khẩu Wi-Fi lịch sự nhất?',
      quizOptions: [
        {
          id: 'q-cafe-1',
          text: 'Excuse me, could you please share the Wi-Fi password?',
          isCorrect: true,
          explanation: '"Could you please share the Wi-Fi password?" là câu hỏi tiêu chuẩn, nhã nhặn tại mọi quán cà phê trên thế giới.'
        },
        {
          id: 'q-cafe-2',
          text: 'Give internet to me now.',
          isCorrect: false,
          explanation: 'Bất lịch sự và sai ngữ cảnh.'
        },
        {
          id: 'q-cafe-3',
          text: 'Wi-Fi why you lock it?',
          isCorrect: false,
          explanation: 'Gắt gỏng và không đúng ngữ pháp.'
        },
        {
          id: 'q-cafe-4',
          text: 'Tell secret code immediately.',
          isCorrect: false,
          explanation: 'Kỳ quặc và không tự nhiên.'
        }
      ]
    }
  ],
  it_coding: [
    {
      id: 'gen-it-1',
      type: 'flashcard',
      level: 'B2',
      topic: 'tech',
      title: 'Từ Vựng IT: Tái Cấu Trúc Mã',
      vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
      word: 'refactor',
      ipa: '/ˌriːˈfæk.tər/',
      partOfSpeech: 'verb',
      definitionVi: 'Tái cấu trúc mã nguồn để tối ưu mà không làm thay đổi hành vi bên ngoài',
      exampleEn: 'We need to refactor this legacy module before shipping the new release.',
      exampleVi: 'Chúng ta cần tái cấu trúc mô-đun cũ này trước khi phát hành phiên bản mới.'
    },
    {
      id: 'gen-it-2',
      type: 'word-reorder',
      level: 'B2',
      topic: 'tech',
      title: 'Sắp Xếp Câu: Sửa Lỗi Trong Production',
      vietnamesePrompt: 'Sắp xếp thành câu: "Kỹ sư trưởng đã triển khai bản vá khẩn cấp cho môi trường production."',
      targetSentence: 'The lead engineer deployed a hotfix to production immediately.',
      scrambledWords: ['deployed', 'The', 'to', 'production', 'hotfix', 'lead', 'immediately.', 'engineer', 'a'],
      grammarTip: '"Hotfix" là thuật ngữ chỉ bản sửa lỗi khẩn cấp đưa thẳng lên production.'
    },
    {
      id: 'gen-it-3',
      type: 'listening-cloze',
      level: 'B2',
      topic: 'tech',
      title: 'Luyện Nghe: Đánh Giá Hiệu Năng',
      vietnamesePrompt: 'Lắng nghe đánh giá hệ thống và chọn từ còn thiếu',
      audioText: 'Our database query optimization reduced response latency significantly.',
      blankWord: 'latency',
      fullSentenceEn: 'Our database query optimization reduced response latency significantly.',
      fullSentenceVi: 'Việc tối ưu hóa truy vấn cơ sở dữ liệu đã giúp giảm độ trễ phản hồi đáng kể.',
      options: ['latency', 'battery', 'memory', 'security']
    },
    {
      id: 'gen-it-4',
      type: 'speaking',
      level: 'B2',
      topic: 'tech',
      title: 'Luyện Nói: Báo Cáo Trong Buổi Họp Daily Standup',
      vietnamesePrompt: 'Đọc to báo cáo tiến độ kỹ thuật',
      speakingTarget: 'I am currently working on resolving the authentication token expiration bug.',
      speakingPhonetic: '/aɪ æm ˈkʌr.ənt.li ˈwɜː.kɪŋ ɒn rɪˈzɒl.vɪŋ...',
      speakingHint: 'Nhấn mạnh từ "au-then-ti-CA-tion" và "ex-pi-RA-tion".'
    },
    {
      id: 'gen-it-5',
      type: 'quiz',
      level: 'B2',
      topic: 'tech',
      title: 'Trắc Nghiệm: Đánh Giá Mã Nguồn (Code Review)',
      vietnamesePrompt: 'Khi muốn góp ý nhẹ nhàng trong code review, câu nào chuyên nghiệp nhất?',
      questionEn: 'How do you politely suggest an improvement during a code review?',
      questionVi: 'Cách nào để góp ý cải thiện code nhã nhặn và mang tính xây dựng nhất?',
      quizOptions: [
        {
          id: 'q-it-1',
          text: 'Have you considered extracting this logic into a helper function for better readability?',
          isCorrect: true,
          explanation: '"Have you considered + V-ing...?" là câu hỏi gợi mở kinh điển trong văn hóa kỹ thuật, giúp người nhận không cảm thấy bị chỉ trích.'
        },
        {
          id: 'q-it-2',
          text: 'This code is totally bad and ugly.',
          isCorrect: false,
          explanation: 'Mang tính công kích cá nhân, phá hoại tinh thần đồng đội.'
        },
        {
          id: 'q-it-3',
          text: 'Rewrite everything from scratch right now.',
          isCorrect: false,
          explanation: 'Thiếu tính xây dựng và không có giải thích kỹ thuật cụ thể.'
        },
        {
          id: 'q-it-4',
          text: 'Why do you code like this?',
          isCorrect: false,
          explanation: 'Mang sắc thái tiêu cực và chỉ trích.'
        }
      ]
    }
  ],
  interview: [
    {
      id: 'gen-int-1',
      type: 'flashcard',
      level: 'B2',
      topic: 'work',
      title: 'Từ Vựng Phỏng Vấn: Độc Lập',
      vietnamesePrompt: 'Lật thẻ để xem phát âm, nghĩa tiếng Việt và câu ví dụ',
      word: 'autonomous',
      ipa: '/ɔːˈtɒn.ə.məs/',
      partOfSpeech: 'adjective',
      definitionVi: 'Tự chủ, có khả năng làm việc độc lập mà không cần giám sát liên tục',
      exampleEn: 'She is an autonomous contributor who takes initiative on complex projects.',
      exampleVi: 'Cô ấy là nhân sự tự chủ, luôn chủ động nắm bắt công việc trong các dự án phức tạp.'
    },
    {
      id: 'gen-int-2',
      type: 'word-reorder',
      level: 'B2',
      topic: 'work',
      title: 'Sắp Xếp Câu: Lý Do Ứng Tuyển',
      vietnamesePrompt: 'Sắp xếp thành câu: "Tôi bị thu hút mạnh mẽ bởi sứ mệnh và văn hóa sáng tạo của công ty."',
      targetSentence: "I am deeply inspired by the company's mission and innovative culture.",
      scrambledWords: ['mission', 'by', 'the', "company's", 'am', 'inspired', 'culture.', 'and', 'I', 'deeply', 'innovative'],
      grammarTip: 'Cụm từ "deeply inspired by" thể hiện sự hào hứng và động lực chân thành của ứng viên.'
    },
    {
      id: 'gen-int-3',
      type: 'listening-cloze',
      level: 'B2',
      topic: 'work',
      title: 'Luyện Nghe: Kỹ Năng Giải Quyết Vấn Đề',
      vietnamesePrompt: 'Lắng nghe câu trả lời phỏng vấn và chọn từ đúng',
      audioText: 'When facing unexpected roadblocks, I prioritize clear communication with stakeholders.',
      blankWord: 'roadblocks',
      fullSentenceEn: 'When facing unexpected roadblocks, I prioritize clear communication with stakeholders.',
      fullSentenceVi: 'Khi đối mặt với các rào cản bất ngờ, tôi ưu tiên giao tiếp minh bạch với các bên liên quan.',
      options: ['roadblocks', 'vacations', 'interviews', 'arguments']
    },
    {
      id: 'gen-int-4',
      type: 'speaking',
      level: 'B2',
      topic: 'work',
      title: 'Luyện Nói: Tầm Nhìn Nghề Nghiệp 5 Năm',
      vietnamesePrompt: 'Đọc to định hướng phát triển bản thân',
      speakingTarget: 'In five years, I aspire to lead impactful cross-functional teams and mentor junior talents.',
      speakingPhonetic: '/ɪn faɪv jɪəz, aɪ əˈspaɪər tuː liːd ɪmˈpækt.fəl...',
      speakingHint: '"Aspire to" mang nghĩa thiết tha vươn tới, phát âm /əˈspaɪər/.'
    },
    {
      id: 'gen-int-5',
      type: 'quiz',
      level: 'B2',
      topic: 'work',
      title: 'Trắc Nghiệm: Trả Lời Về Điểm Yếu Bản Thân',
      vietnamesePrompt: 'Khi được hỏi "What is your biggest weakness?", cách trả lời nào thuyết phục nhất?',
      questionEn: 'How should you answer the interview question: "What is your greatest weakness?"',
      questionVi: 'Cách trả lời nào thông minh và chuyên nghiệp nhất cho câu hỏi về điểm yếu?',
      quizOptions: [
        {
          id: 'q-int-1',
          text: 'Mention a genuine area of improvement alongside the concrete steps you are taking to overcome it.',
          isCorrect: true,
          explanation: 'Nêu một điểm cần cải thiện thực sự kèm các hành động cụ thể bạn đang làm để khắc phục (tư duy cầu tiến Growth Mindset).'
        },
        {
          id: 'q-int-2',
          text: 'Say: "I am a perfectionist and work too hard."',
          isCorrect: false,
          explanation: 'Câu trả lời sáo rỗng này bị các nhà tuyển dụng chuyên nghiệp coi là thiếu thành thật.'
        },
        {
          id: 'q-int-3',
          text: 'Say: "I have no weaknesses whatsoever."',
          isCorrect: false,
          explanation: 'Thể hiện sự tự cao và thiếu khả năng tự nhận thức.'
        },
        {
          id: 'q-int-4',
          text: 'Reveal that you are frequently late for work.',
          isCorrect: false,
          explanation: 'Nêu điểm yếu về kỷ luật cơ bản sẽ loại bạn ngay lập tức.'
        }
      ]
    }
  ]
};

// Procedural generator that combines templates to produce fresh, non-repetitive exercises
export function generateDynamicExerciseSet(params: CustomGeneratorParams): ExerciseItem[] {
  const result: ExerciseItem[] = [];

  // Match best category
  let matchedKey = 'cafe';
  const lowerTopic = params.topic.toLowerCase();
  if (lowerTopic.includes('it') || lowerTopic.includes('code') || lowerTopic.includes('tech') || lowerTopic.includes('phần mềm') || lowerTopic.includes('công nghệ')) {
    matchedKey = 'it_coding';
  } else if (lowerTopic.includes('phỏng vấn') || lowerTopic.includes('interview') || lowerTopic.includes('việc') || lowerTopic.includes('cv') || lowerTopic.includes('job')) {
    matchedKey = 'interview';
  }

  const pool = EXERCISE_LIBRARY[matchedKey] || EXERCISE_LIBRARY['cafe'];

  // Filter by skill if requested
  let filtered = pool;
  if (params.skillFocus !== 'all') {
    const focusMap: Record<string, ExerciseType> = {
      speaking: 'speaking',
      reorder: 'word-reorder',
      listening: 'listening-cloze',
      quiz: 'quiz',
      flashcard: 'flashcard',
    };
    const targetType = focusMap[params.skillFocus];
    if (targetType) {
      filtered = pool.filter((ex) => ex.type === targetType);
      if (filtered.length === 0) filtered = pool;
    }
  }

  // Shuffle and pick desired count
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  
  // Clone exercises with unique IDs to ensure clean state
  shuffled.slice(0, params.questionCount).forEach((item, idx) => {
    result.push({
      ...item,
      id: `${item.id}-${Date.now()}-${idx}`,
    });
  });

  return result;
}
