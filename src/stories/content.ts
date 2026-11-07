/** Original DailyLingo stories. Editorial IDs are durable; never derive them from position. */
export interface StoryWord {
  id: string;
  word: string;
  meaningVi: string;
  ipa: string;
  partOfSpeech: string;
  exampleEn: string;
  exampleVi: string;
}
export interface StorySentence {
  id: string;
  text: string;
  translationVi: string;
  grammar: { title: string; explanation: string; example: string };
  words: { start: number; end: number; wordId: string }[];
}
export interface Story {
  id: string;
  version: number;
  title: string;
  synopsis: string;
  level: "A1" | "A2" | "B1";
  source: string;
  paragraphs: StorySentence[][];
  glossary: StoryWord[];
}

/** Deterministic preparation splitter; explicit end offsets can override unusual editorial boundaries.
 * Offsets address the original UTF-16 source, so quotes and paragraph separators are never discarded.
 * A small deliberate grammar is used rather than engine-dependent Intl.Segmenter revisions.
 */
export function segmentSentences(
  source: string,
  editorialBoundaries?: number[],
): string[] {
  if (editorialBoundaries) {
    let start = 0;
    return [...editorialBoundaries, source.length]
      .filter((end, i, ends) => i === 0 || end !== ends[i - 1])
      .map((end) => {
        if (!Number.isInteger(end) || end <= start || end > source.length)
          throw new Error("Invalid editorial boundary");
        const text = source.slice(start, end).trim();
        start = end;
        return text;
      })
      .filter(Boolean);
  }
  const result: string[] = [];
  let start = 0;
  const boundaries = /[.!?]+[”’"']*(?=\s|$)/g;
  for (const match of source.matchAll(boundaries)) {
    const end = match.index! + match[0].length;
    const prefix = source.slice(start, end);
    const remainder = source.slice(end).trimStart();
    const titleOrInitial =
      /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St)\.$/i.test(prefix) ||
      /(?:^|\s)[A-Z]\.$/.test(prefix);
    const explanatoryAbbreviation = /\b(?:e\.g|i\.e)\.$/i.test(prefix);
    // Acronyms before lower-case continuations remain inside a sentence. At an
    // uppercase continuation their role is ambiguous; editors may override it.
    const continuingAcronym =
      /(?:^|\s)(?:[A-Z]\.){2,}$/.test(prefix) && /^[a-z]/.test(remainder);
    if (
      remainder &&
      (titleOrInitial || explanatoryAbbreviation || continuingAcronym)
    )
      continue;
    result.push(prefix.trim());
    start = end;
  }
  if (source.slice(start).trim()) result.push(source.slice(start).trim());
  return result;
}

export interface StoryToken {
  text: string;
  start: number;
  end: number;
  wordId?: string;
}
/** Exact editorial ranges protect inflections, casing, contractions and distinct senses. */
export function tokenizeSentence(sentence: StorySentence): StoryToken[] {
  const tokens: StoryToken[] = [];
  let start = 0;
  for (const occurrence of sentence.words) {
    if (occurrence.start > start)
      tokens.push({
        text: sentence.text.slice(start, occurrence.start),
        start,
        end: occurrence.start,
      });
    tokens.push({
      text: sentence.text.slice(occurrence.start, occurrence.end),
      ...occurrence,
    });
    start = occurrence.end;
  }
  if (start < sentence.text.length)
    tokens.push({
      text: sentence.text.slice(start),
      start,
      end: sentence.text.length,
    });
  return tokens;
}

/** The first field is an explicit durable ID, never an ordinal computed at preparation time. */
export type SentenceDraft = [
  id: string,
  text: string,
  translationVi: string,
  grammarTitle: string,
  explanation: string,
  example: string,
];
export type WordDraft = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];
export function makeStory(
  id: string,
  title: string,
  synopsis: string,
  level: Story["level"],
  drafts: SentenceDraft[][],
  wordDrafts: WordDraft[],
): Story {
  const glossary = wordDrafts.map(
    ([id, word, meaningVi, ipa, partOfSpeech, exampleEn, exampleVi]) => ({
      id,
      word,
      meaningVi,
      ipa,
      partOfSpeech,
      exampleEn,
      exampleVi,
    }),
  );
  const paragraphs = drafts.map((paragraph) =>
    paragraph.map(
      ([sentenceId, text, translationVi, title, explanation, example]) => {
        const words: StorySentence["words"] = [];
        for (const entry of glossary) {
          // Case-sensitive whole lexical tokens. Each draft maps only one unambiguous sense per spelling.
          for (const match of text.matchAll(/[\p{L}]+(?:['’][\p{L}]+)*/gu)) {
            if (match[0] === entry.word)
              words.push({
                start: match.index!,
                end: match.index! + match[0].length,
                wordId: entry.id,
              });
          }
        }
        words.sort((a, b) => a.start - b.start);
        return {
          id: sentenceId,
          text,
          translationVi,
          grammar: { title, explanation, example },
          words,
        };
      },
    ),
  );
  return {
    id,
    version: 1,
    title,
    synopsis,
    level,
    paragraphs,
    glossary,
    source: paragraphs.map((p) => p.map((s) => s.text).join(" ")).join("\n\n"),
  };
}

export const stories: Story[] = [
  makeStory(
    "little-blue-bag",
    "The Little Blue Bag",
    "Một chiếc túi nhỏ giúp Mai làm quen với người hàng xóm.",
    "A1",
    [
      [
        [
          "little-blue-bag-s01",
          "Mai has a little blue bag.",
          "Mai có một chiếc túi nhỏ màu xanh dương.",
          "Have / has",
          "Với chủ ngữ số ít Mai, dùng has để nói về sự sở hữu.",
          "Lan has a red hat.",
        ],
        [
          "little-blue-bag-s02",
          "She puts two apples in it.",
          "Cô bé bỏ hai quả táo vào túi.",
          "Hiện tại đơn",
          "Thêm -s vào động từ put với chủ ngữ she.",
          "She puts a book on the desk.",
        ],
        [
          "little-blue-bag-s03",
          "Today she walks to the park.",
          "Hôm nay cô bé đi bộ đến công viên.",
          "To + địa điểm",
          "To chỉ nơi người nói đi đến.",
          "I walk to school.",
        ],
        [
          "little-blue-bag-s04",
          "The sun is warm.",
          "Nắng thật ấm áp.",
          "Be + tính từ",
          "Is nối chủ ngữ số ít với tính từ warm.",
          "The water is cold.",
        ],
      ],
      [
        [
          "little-blue-bag-s05",
          "A boy sits on a bench.",
          "Một cậu bé ngồi trên ghế dài.",
          "A + danh từ",
          "A giới thiệu một người hoặc vật chưa được nhắc tới.",
          "A girl sits here.",
        ],
        [
          "little-blue-bag-s06",
          "He has a book, but he has no lunch.",
          "Cậu bé có một quyển sách nhưng không có bữa trưa.",
          "But",
          "But nối hai ý có sự tương phản.",
          "I have tea, but I have no milk.",
        ],
        [
          "little-blue-bag-s07",
          "Mai opens her bag.",
          "Mai mở túi của mình.",
          "Tính từ sở hữu her",
          "Her đứng trước danh từ để chỉ vật thuộc về cô bé.",
          "She opens her book.",
        ],
        [
          "little-blue-bag-s08",
          "She gives him an apple.",
          "Cô bé cho cậu bé một quả táo.",
          "Give + người + vật",
          "Him chỉ người nhận; an apple là vật được cho.",
          "I give her a pen.",
        ],
      ],
      [
        [
          "little-blue-bag-s09",
          "They eat their apples together.",
          "Hai bạn cùng ăn táo của mình.",
          "Their",
          "Their chỉ sự sở hữu của nhiều người.",
          "They carry their bags.",
        ],
        [
          "little-blue-bag-s10",
          "The boy shows Mai a picture in his book.",
          "Cậu bé cho Mai xem một bức tranh trong sách của mình.",
          "In",
          "In diễn tả vị trí bên trong một vật.",
          "There is a picture in the book.",
        ],
        [
          "little-blue-bag-s11",
          "It is a picture of their street.",
          "Đó là bức tranh về con phố của hai bạn.",
          "A picture of",
          "Of giới thiệu người hoặc cảnh được thể hiện trong tranh.",
          "This is a picture of my house.",
        ],
        [
          "little-blue-bag-s12",
          "Now Mai has a new friend.",
          "Giờ Mai có một người bạn mới.",
          "Trật tự tính từ",
          "New đứng trước danh từ friend.",
          "He has a new bike.",
        ],
      ],
    ],
    [
      [
        "bag-container",
        "bag",
        "túi",
        "/bæɡ/",
        "n",
        "My bag is blue.",
        "Túi của tôi màu xanh dương.",
      ],
      [
        "apples-fruit",
        "apples",
        "những quả táo",
        "/ˈæpəlz/",
        "n (plural)",
        "These apples are sweet.",
        "Những quả táo này ngọt.",
      ],
      [
        "bench-seat",
        "bench",
        "ghế dài",
        "/bentʃ/",
        "n",
        "We sit on a bench.",
        "Chúng tôi ngồi trên ghế dài.",
      ],
      [
        "together-adverb",
        "together",
        "cùng nhau",
        "/təˈɡeðər/",
        "adv",
        "We read together.",
        "Chúng tôi cùng đọc.",
      ],
      [
        "street-road",
        "street",
        "phố; đường phố",
        "/striːt/",
        "n",
        "Our street is quiet.",
        "Phố của chúng tôi yên tĩnh.",
      ],
      [
        "friend-person",
        "friend",
        "người bạn",
        "/frend/",
        "n",
        "He is my friend.",
        "Cậu ấy là bạn tôi.",
      ],
    ],
  ),
  makeStory(
    "rainy-day-map",
    "A Map for a Rainy Day",
    "Nam tìm một con đường mới khi chuyến đi thư viện gặp mưa.",
    "A2",
    [
      [
        [
          "rainy-day-map-s01",
          "Last Saturday, Nam planned a visit to the library.",
          "Thứ Bảy tuần trước, Nam lên kế hoạch đến thư viện.",
          "Quá khứ đơn",
          "Planned là dạng quá khứ có quy tắc của plan; phụ âm n được gấp đôi.",
          "We planned a short trip.",
        ],
        [
          "rainy-day-map-s02",
          "He wanted to borrow a book about birds.",
          "Cậu muốn mượn một quyển sách về chim.",
          "Want to + động từ",
          "Sau wanted dùng to và động từ nguyên mẫu borrow.",
          "I wanted to learn a song.",
        ],
        [
          "rainy-day-map-s03",
          "When he left home, it started to rain.",
          "Khi cậu rời nhà, trời bắt đầu mưa.",
          "When",
          "When nối thời điểm rời nhà với sự việc bắt đầu mưa.",
          "When I arrived, she opened the door.",
        ],
        [
          "rainy-day-map-s04",
          "He waited under the roof of a small shop.",
          "Cậu đợi dưới mái hiên của một cửa hàng nhỏ.",
          "Under",
          "Under chỉ vị trí ở phía dưới.",
          "The cat waited under the table.",
        ],
      ],
      [
        [
          "rainy-day-map-s05",
          "An older woman was drawing a map at the counter.",
          "Một phụ nữ lớn tuổi đang vẽ bản đồ tại quầy.",
          "Quá khứ tiếp diễn",
          "Was drawing diễn tả hành động đang diễn ra lúc Nam thấy bà.",
          "She was reading at the counter.",
        ],
        [
          "rainy-day-map-s06",
          "She needed to find the same library.",
          "Bà cần tìm chính thư viện mà Nam định đến.",
          "The same",
          "The same chỉ hai người cùng nói đến một đối tượng.",
          "We take the same bus.",
        ],
        [
          "rainy-day-map-s07",
          "Nam knew a path beside the river.",
          "Nam biết một lối đi bên cạnh dòng sông.",
          "Knew",
          "Knew là dạng quá khứ bất quy tắc của know.",
          "I knew the answer.",
        ],
        [
          "rainy-day-map-s08",
          "It was longer than the main road, but it had tall trees.",
          "Lối đó dài hơn đường chính nhưng có những hàng cây cao.",
          "So sánh hơn",
          "Longer than so sánh chiều dài của hai con đường.",
          "This path is shorter than that road.",
        ],
      ],
      [
        [
          "rainy-day-map-s09",
          "They decided to walk there together.",
          "Họ quyết định cùng đi bộ đến đó.",
          "Decide to",
          "Sau decided dùng to và động từ nguyên mẫu.",
          "We decided to wait.",
        ],
        [
          "rainy-day-map-s10",
          "The trees kept some of the rain off their coats.",
          "Những tán cây che bớt mưa để áo khoác của họ ít bị ướt hơn.",
          "Some of",
          "Some of nói đến một phần của lượng mưa, không phải toàn bộ.",
          "Some of the water fell on my coat.",
        ],
        [
          "rainy-day-map-s11",
          "At the library, the woman found a book about local birds.",
          "Tại thư viện, người phụ nữ tìm thấy một quyển sách về các loài chim địa phương.",
          "About",
          "About giới thiệu chủ đề của quyển sách.",
          "This book is about rivers.",
        ],
        [
          "rainy-day-map-s12",
          "Nam borrowed another book and drew his own map inside his notebook.",
          "Nam mượn một quyển sách khác và vẽ bản đồ của riêng mình trong sổ tay.",
          "His own",
          "His own nhấn mạnh vật do chính Nam sở hữu hoặc tạo ra.",
          "He made his own map.",
        ],
      ],
    ],
    [
      [
        "library-building",
        "library",
        "thư viện",
        "/ˈlaɪbreri/",
        "n",
        "The library closes at six.",
        "Thư viện đóng cửa lúc sáu giờ.",
      ],
      [
        "borrow-use",
        "borrow",
        "mượn",
        "/ˈbɑːroʊ/",
        "v",
        "May I borrow your pen?",
        "Tôi có thể mượn bút của bạn không?",
      ],
      [
        "roof-cover",
        "roof",
        "mái nhà; mái che",
        "/ruːf/",
        "n",
        "The roof keeps us dry.",
        "Mái che giúp chúng tôi không bị ướt.",
      ],
      [
        "map-drawing",
        "map",
        "bản đồ",
        "/mæp/",
        "n",
        "This map shows the river.",
        "Bản đồ này thể hiện dòng sông.",
      ],
      [
        "path-route",
        "path",
        "lối đi",
        "/pæθ/",
        "n",
        "Follow this path.",
        "Hãy đi theo lối này.",
      ],
      [
        "local-area",
        "local",
        "thuộc địa phương",
        "/ˈloʊkəl/",
        "adj",
        "We visit the local market.",
        "Chúng tôi ghé chợ địa phương.",
      ],
    ],
  ),
  makeStory(
    "quiet-repair",
    "The Quiet Repair",
    "Một nhóm hàng xóm học cách lắng nghe khi cùng sửa chiếc ghế cộng đồng.",
    "B1",
    [
      [
        [
          "quiet-repair-s01",
          "For years, a wooden bench had stood outside our community kitchen.",
          "Suốt nhiều năm, một chiếc ghế gỗ đã nằm bên ngoài bếp ăn cộng đồng của chúng tôi.",
          "Quá khứ hoàn thành",
          "Had stood diễn tả tình trạng bắt đầu trước thời điểm kể trong quá khứ.",
          "The shop had stood there for years.",
        ],
        [
          "quiet-repair-s02",
          "People often stopped there to exchange news while their soup cooled.",
          "Mọi người thường dừng ở đó để trao đổi tin tức trong khi súp nguội bớt.",
          "While",
          "While nối hai hoạt động diễn ra đồng thời trong quá khứ.",
          "We talked while the food cooled.",
        ],
        [
          "quiet-repair-s03",
          "One morning, I noticed that a board was beginning to split.",
          "Một buổi sáng, tôi nhận thấy một tấm ván đang bắt đầu nứt.",
          "Notice that",
          "Mệnh đề sau that diễn tả điều người kể nhận thấy.",
          "I noticed that the door was open.",
        ],
        [
          "quiet-repair-s04",
          "I suggested replacing the bench before anyone got hurt.",
          "Tôi đề nghị thay chiếc ghế trước khi có ai bị thương.",
          "Suggest + V-ing",
          "Sau suggested dùng dạng -ing replacing để nêu đề xuất.",
          "She suggested checking the lock.",
        ],
      ],
      [
        [
          "quiet-repair-s05",
          "However, our neighbour Rosa asked whether we could repair it instead.",
          "Tuy nhiên, người hàng xóm Rosa hỏi liệu chúng tôi có thể sửa nó thay vì thay mới không.",
          "Câu hỏi gián tiếp",
          "Sau asked whether dùng trật tự chủ ngữ we rồi động từ could, không đảo ngữ.",
          "He asked whether we could help.",
        ],
        [
          "quiet-repair-s06",
          "She explained that her father had built it from leftover wood.",
          "Bà giải thích rằng cha mình đã làm chiếc ghế từ gỗ còn thừa.",
          "Had built",
          "Việc làm ghế xảy ra trước lúc Rosa giải thích, nên dùng quá khứ hoàn thành.",
          "She said that he had built the table.",
        ],
        [
          "quiet-repair-s07",
          "Although I still worried about safety, I agreed to inspect it with her.",
          "Dù vẫn lo về sự an toàn, tôi đồng ý cùng bà kiểm tra chiếc ghế.",
          "Although",
          "Although giới thiệu ý nhượng bộ; mệnh đề chính nêu quyết định vẫn được thực hiện.",
          "Although it was late, we stayed.",
        ],
        [
          "quiet-repair-s08",
          "We discovered that only one board needed replacing.",
          "Chúng tôi phát hiện chỉ có một tấm ván cần thay.",
          "Need + V-ing",
          "Needed replacing mang nghĩa cần được thay; tấm ván không tự thay thứ khác.",
          "The window needs cleaning.",
        ],
      ],
      [
        [
          "quiet-repair-s09",
          "By the afternoon, three neighbours had offered tools and spare wood.",
          "Đến buổi chiều, ba người hàng xóm đã đề nghị góp dụng cụ và gỗ dự phòng.",
          "By + mốc thời gian",
          "By the afternoon đặt mốc mà các lời đề nghị đã được đưa ra.",
          "By noon, two friends had arrived.",
        ],
        [
          "quiet-repair-s10",
          "Rosa showed us how to measure the gap before cutting anything.",
          "Rosa chỉ cho chúng tôi cách đo khoảng trống trước khi cắt bất cứ thứ gì.",
          "How to",
          "How to measure tạo cụm diễn tả cách thực hiện việc đo.",
          "He showed me how to fold the paper.",
        ],
        [
          "quiet-repair-s11",
          "When we finally sat down, the bench felt as solid as it used to.",
          "Khi cuối cùng chúng tôi ngồi xuống, chiếc ghế cho cảm giác chắc chắn như trước đây.",
          "As + tính từ + as",
          "As solid as so sánh mức độ chắc chắn bằng nhau; used to gợi trạng thái trước đây.",
          "This chair is as solid as that one.",
        ],
        [
          "quiet-repair-s12",
          "I realised that listening first could save more than a piece of furniture.",
          "Tôi nhận ra rằng lắng nghe trước có thể gìn giữ nhiều hơn chỉ một món đồ nội thất.",
          "V-ing làm chủ ngữ",
          "Listening first là cụm danh động từ làm chủ ngữ của could save.",
          "Listening carefully can prevent mistakes.",
        ],
      ],
    ],
    [
      [
        "bench-seat",
        "bench",
        "ghế dài",
        "/bentʃ/",
        "n",
        "We repaired the wooden bench.",
        "Chúng tôi sửa chiếc ghế gỗ.",
      ],
      [
        "board-wood",
        "board",
        "tấm ván",
        "/bɔːrd/",
        "n",
        "This board is made of wood.",
        "Tấm ván này làm bằng gỗ.",
      ],
      [
        "repair-fix",
        "repair",
        "sửa chữa",
        "/rɪˈper/",
        "v",
        "We can repair this chair.",
        "Chúng tôi có thể sửa chiếc ghế này.",
      ],
      [
        "leftover-remaining",
        "leftover",
        "còn thừa",
        "/ˈleftoʊvər/",
        "adj",
        "Use the leftover wood.",
        "Hãy dùng phần gỗ còn thừa.",
      ],
      [
        "inspect-examine",
        "inspect",
        "kiểm tra kỹ",
        "/ɪnˈspekt/",
        "v",
        "Please inspect the roof.",
        "Vui lòng kiểm tra kỹ mái nhà.",
      ],
      [
        "solid-firm",
        "solid",
        "chắc chắn; vững chắc",
        "/ˈsɑːlɪd/",
        "adj",
        "The table feels solid.",
        "Chiếc bàn có vẻ chắc chắn.",
      ],
    ],
  ),
];
