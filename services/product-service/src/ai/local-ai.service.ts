import { Injectable, Logger } from '@nestjs/common';

export interface LocalParsedIntent {
  normalizedQuery: string;
  expandedKeywords: string[];
  detectedIntent: string;
  suggestedCategory: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
}

// Bảng viết tắt & thuật ngữ TMĐT tiếng Việt có sẵn (0ms)
const READY_MADE_ABBREVIATIONS: Record<string, { keywords: string[]; category: string; intent: string }> = {
  // Điện thoại & Công nghệ
  '15prm': { keywords: ['iPhone 15 Pro Max', 'apple iphone 15 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 15 Pro Max' },
  '15pm': { keywords: ['iPhone 15 Pro Max', 'apple iphone 15 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 15 Pro Max' },
  '15promax': { keywords: ['iPhone 15 Pro Max', 'apple iphone 15 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 15 Pro Max' },
  '16prm': { keywords: ['iPhone 16 Pro Max', 'apple iphone 16 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 16 Pro Max' },
  '16pm': { keywords: ['iPhone 16 Pro Max', 'apple iphone 16 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 16 Pro Max' },
  '14prm': { keywords: ['iPhone 14 Pro Max', 'apple iphone 14 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 14 Pro Max' },
  '14pm': { keywords: ['iPhone 14 Pro Max', 'apple iphone 14 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 14 Pro Max' },
  '13prm': { keywords: ['iPhone 13 Pro Max', 'apple iphone 13 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 13 Pro Max' },
  '12prm': { keywords: ['iPhone 12 Pro Max', 'apple iphone 12 pro max'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm iPhone 12 Pro Max' },
  'ip': { keywords: ['iPhone', 'điện thoại apple'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm điện thoại iPhone' },
  'iphone': { keywords: ['iPhone', 'điện thoại apple'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm điện thoại iPhone' },
  'ss': { keywords: ['Samsung Galaxy', 'điện thoại samsung'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm điện thoại Samsung' },
  's24u': { keywords: ['Samsung Galaxy S24 Ultra', 'samsung s24 ultra'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm Samsung Galaxy S24 Ultra' },
  's23u': { keywords: ['Samsung Galaxy S23 Ultra', 'samsung s23 ultra'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm Samsung Galaxy S23 Ultra' },
  'dt': { keywords: ['điện thoại', 'smartphone'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm điện thoại di động' },
  'đt': { keywords: ['điện thoại', 'smartphone'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm điện thoại di động' },
  'dtdd': { keywords: ['điện thoại di động', 'smartphone'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm điện thoại di động' },

  // Máy tính & Phụ kiện
  'mbp': { keywords: ['MacBook Pro', 'laptop apple macbook pro'], category: 'Laptop & Máy Tính', intent: 'Tìm kiếm MacBook Pro' },
  'mba': { keywords: ['MacBook Air', 'laptop apple macbook air'], category: 'Laptop & Máy Tính', intent: 'Tìm kiếm MacBook Air' },
  'macbook': { keywords: ['MacBook', 'laptop apple macbook'], category: 'Laptop & Máy Tính', intent: 'Tìm kiếm MacBook' },
  'lap': { keywords: ['laptop', 'máy tính xách tay'], category: 'Laptop & Máy Tính', intent: 'Tìm kiếm laptop' },
  'laptop': { keywords: ['laptop', 'máy tính xách tay'], category: 'Laptop & Máy Tính', intent: 'Tìm kiếm laptop' },
  'pc': { keywords: ['máy tính để bàn', 'PC desktop'], category: 'Laptop & Máy Tính', intent: 'Tìm kiếm máy tính để bàn' },
  'bpck': { keywords: ['bàn phím cơ', 'bàn phím gaming'], category: 'Thiết Bị Điện Tử', intent: 'Tìm kiếm bàn phím cơ' },
  'phim co': { keywords: ['bàn phím cơ', 'mechanical keyboard'], category: 'Thiết Bị Điện Tử', intent: 'Tìm kiếm bàn phím cơ' },
  'corsair': { keywords: ['Corsair', 'bàn phím corsair'], category: 'Thiết Bị Điện Tử', intent: 'Tìm kiếm sản phẩm Corsair' },

  // Âm thanh
  'tn': { keywords: ['tai nghe', 'headphone', 'earphone'], category: 'Thiết Bị Điện Tử', intent: 'Tìm kiếm tai nghe' },
  'tws': { keywords: ['tai nghe không dây', 'earbuds bluetooth'], category: 'Thiết Bị Điện Tử', intent: 'Tìm kiếm tai nghe true wireless' },
  'airpods': { keywords: ['AirPods', 'tai nghe apple airpods'], category: 'Thiết Bị Điện Tử', intent: 'Tìm kiếm AirPods' },

  // Giày dép & Thời trang & Esports
  'hle': { keywords: ['HLE', 'Hanwha Life Esports', 'Gumayusi'], category: 'Thể Thao', intent: 'Tìm kiếm vật phẩm Hanwha Life Esports' },
  'gumayusi': { keywords: ['Gumayusi', 'HLE Gumayusi Fanmeeting'], category: 'Thể Thao', intent: 'Tìm kiếm sản phẩm Gumayusi Fanmeeting' },
  'snk': { keywords: ['giày sneaker', 'giày thể thao', 'sneaker'], category: 'Giày Dép Nam', intent: 'Tìm kiếm giày sneaker thể thao' },
  'giay snk': { keywords: ['giày sneaker', 'giày thể thao', 'sneaker'], category: 'Giày Dép Nam', intent: 'Tìm kiếm giày sneaker thể thao' },
  'sneaker': { keywords: ['giày sneaker', 'giày thể thao'], category: 'Giày Dép Nam', intent: 'Tìm kiếm giày sneaker' },
  'mwc': { keywords: ['dép mwc', 'giày mwc', 'dép nam'], category: 'Thời Trang Nam', intent: 'Tìm kiếm sản phẩm MWC' },
  'dep': { keywords: ['dép', 'dép quai ngang', 'sandal'], category: 'Giày Dép Nam', intent: 'Tìm kiếm dép' },
  'hoodie': { keywords: ['áo hoodie', 'áo nỉ có mũ'], category: 'Thời Trang Nam', intent: 'Tìm kiếm áo hoodie' },
  'bomber': { keywords: ['áo bomber', 'áo khoác bomber'], category: 'Thời Trang Nam', intent: 'Tìm kiếm áo bomber' },
  'vay': { keywords: ['váy', 'chân váy', 'váy xòe'], category: 'Thời Trang Nữ', intent: 'Tìm kiếm váy nữ' },
  'dam': { keywords: ['đầm', 'váy đầm công chúa'], category: 'Thời Trang Nữ', intent: 'Tìm kiếm đầm nữ' },

  // Balo & Túi ví & Phụ kiện
  'balo': { keywords: ['balo', 'ba lô', 'cặp', 'balo học sinh', 'balo laptop', 'balo thời trang'], category: 'Túi Ví Nữ', intent: 'Tìm kiếm balo / cặp sách' },
  'ba lo': { keywords: ['balo', 'ba lô', 'cặp', 'balo học sinh', 'balo laptop', 'balo thời trang'], category: 'Túi Ví Nữ', intent: 'Tìm kiếm balo / cặp sách' },
  'cap': { keywords: ['cặp', 'balo', 'ba lô', 'cặp sách', 'cặp học sinh', 'túi xách'], category: 'Túi Ví Nữ', intent: 'Tìm kiếm cặp sách / balo' },
  'cặp': { keywords: ['cặp', 'balo', 'ba lô', 'cặp sách', 'cặp học sinh', 'túi xách'], category: 'Túi Ví Nữ', intent: 'Tìm kiếm cặp sách / balo' },
  'tui': { keywords: ['túi', 'túi xách', 'túi đeo chéo', 'túi ví'], category: 'Túi Ví Nữ', intent: 'Tìm kiếm túi xách' },
  'túi': { keywords: ['túi', 'túi xách', 'túi đeo chéo', 'túi ví'], category: 'Túi Ví Nữ', intent: 'Tìm kiếm túi xách' },
  'vi': { keywords: ['ví', 'bóp', 'ví tiền', 'ví nam', 'ví nữ'], category: 'Túi Ví Nữ', intent: 'Tìm kiếm ví tiền' },
  'non': { keywords: ['nón', 'mũ', 'nón lưỡi trai', 'mũ lưỡi trai'], category: 'Phụ Kiện Nữ', intent: 'Tìm kiếm nón mũ' },
  'nón': { keywords: ['nón', 'mũ', 'nón lưỡi trai', 'mũ lưỡi trai'], category: 'Phụ Kiện Nữ', intent: 'Tìm kiếm nón mũ' },
  'mu': { keywords: ['mũ', 'nón', 'nón lưỡi trai', 'mũ lưỡi trai'], category: 'Phụ Kiện Nữ', intent: 'Tìm kiếm nón mũ' },
  'mũ': { keywords: ['mũ', 'nón', 'nón lưỡi trai', 'mũ lưỡi trai'], category: 'Phụ Kiện Nữ', intent: 'Tìm kiếm nón mũ' },

  // Đồ gia dụng & Nhà cửa
  'nck': { keywords: ['nồi chiên không dầu', 'air fryer'], category: 'Gia Dụng', intent: 'Tìm kiếm nồi chiên không dầu' },
  'nckhd': { keywords: ['nồi chiên không dầu', 'air fryer'], category: 'Gia Dụng', intent: 'Tìm kiếm nồi chiên không dầu' },
  'noi chien': { keywords: ['nồi chiên không dầu', 'nồi chiên điện tử'], category: 'Gia Dụng', intent: 'Tìm kiếm nồi chiên không dầu' },
  'mxst': { keywords: ['máy xay sinh tố', 'máy xay đa năng'], category: 'Gia Dụng', intent: 'Tìm kiếm máy xay sinh tố' },
  'may xay': { keywords: ['máy xay sinh tố', 'máy xay cầm tay'], category: 'Gia Dụng', intent: 'Tìm kiếm máy xay' },
  'bgh': { keywords: ['bình giữ nhiệt', 'bình nước inox'], category: 'Nhà Cửa', intent: 'Tìm kiếm bình giữ nhiệt' },
  'binh nuoc': { keywords: ['bình nước', 'bình giữ nhiệt', 'ly giữ nhiệt'], category: 'Nhà Cửa', intent: 'Tìm kiếm bình nước' },
  'binh giu nhiet': { keywords: ['bình giữ nhiệt', 'bình nước inox', 'ly giữ nhiệt'], category: 'Nhà Cửa', intent: 'Tìm kiếm bình giữ nhiệt' },
  'bat dia': { keywords: ['bát đĩa', 'bộ bát đĩa sứ', 'chén dĩa'], category: 'Nhà Cửa', intent: 'Tìm kiếm bát đĩa' },
  'ke bep': { keywords: ['kệ đồ nhà bếp', 'kệ để đồ 3 tầng', 'kệ gia vị'], category: 'Nhà Cửa', intent: 'Tìm kiếm kệ nhà bếp' },
  'ghe': { keywords: ['ghế', 'ghế làm việc', 'ghế tựa'], category: 'Nhà Cửa', intent: 'Tìm kiếm ghế' },
  'sach': { keywords: ['sách', 'sách giáo khoa'], category: 'Nhà Cửa', intent: 'Tìm kiếm sách' },
  'op': { keywords: ['ốp lưng điện thoại', 'case điện thoại'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm ốp lưng' },
  'op lung': { keywords: ['ốp lưng điện thoại', 'case điện thoại'], category: 'Điện Thoại & Phụ Kiện', intent: 'Tìm kiếm ốp lưng' },
};

// Chuẩn hóa lỗi chính tả thông dụng
const COMMON_TYPOS: Record<string, string> = {
  'promax': 'pro max',
  'prmax': 'pro max',
  'prm': 'pro max',
  'prom': 'pro max',
  'macbookpro': 'macbook pro',
  'macbookair': 'macbook air',
  'aothun': 'áo thun',
  'aosomi': 'áo sơ mi',
  'quanjean': 'quần jeans',
  'giaythethao': 'giày thể thao',
  'tuidep': 'túi đẹp',
};

@Injectable()
export class LocalAiService {
  private readonly logger = new Logger(LocalAiService.name);
  private readonly ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';

  /**
   * Phân tích ý định & chuẩn hóa từ khóa cục bộ (Local NLP sẵn có, 0ms)
   */
  parseQuery(rawQuery: string): LocalParsedIntent {
    const original = (rawQuery || '').trim();
    let q = original
      .toLowerCase()
      .replace(/[đĐ]/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Sửa lỗi chính tả cơ bản
    for (const [typo, correct] of Object.entries(COMMON_TYPOS)) {
      if (q.includes(typo)) {
        q = q.replace(new RegExp(typo, 'g'), correct);
      }
    }

    const expandedKeywords: string[] = [];
    let detectedIntent = `Tìm kiếm sản phẩm liên quan đến "${original}"`;
    let suggestedCategory = 'Tất cả danh mục';
    let priceRangeMin: number | undefined;
    let priceRangeMax: number | undefined;

    // 2. Tra cứu cụm từ viết tắt từ điển TMĐT
    const tokens = q.split(' ');
    for (let i = tokens.length; i >= 1; i--) {
      for (let start = 0; start <= tokens.length - i; start++) {
        const phrase = tokens.slice(start, start + i).join(' ');
        if (READY_MADE_ABBREVIATIONS[phrase]) {
          const matched = READY_MADE_ABBREVIATIONS[phrase];
          expandedKeywords.push(...matched.keywords);
          detectedIntent = matched.intent;
          suggestedCategory = matched.category;
        }
      }
    }

    // Tra cứu chuỗi dính liền (ví dụ "15prm")
    const qNoSpace = q.replace(/\s/g, '');
    if (READY_MADE_ABBREVIATIONS[qNoSpace]) {
      const matched = READY_MADE_ABBREVIATIONS[qNoSpace];
      expandedKeywords.push(...matched.keywords);
      detectedIntent = matched.intent;
      suggestedCategory = matched.category;
    }

    // 3. Trích xuất khoảng giá
    const priceMaxMatch = q.match(/(?:duoi|dưới)\s+(\d+)\s*(k|trieu|triệu|tr|nghin|nghìn)?/i);
    if (priceMaxMatch) {
      const num = parseInt(priceMaxMatch[1], 10);
      const unit = (priceMaxMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'nghin' || unit === 'nghìn') priceRangeMax = num * 1000;
      else if (unit === 'trieu' || unit === 'triệu' || unit === 'tr') priceRangeMax = num * 1_000_000;
      else if (num > 1000) priceRangeMax = num;
      else priceRangeMax = num * 1000;
    }

    // 4. Nhận diện danh mục nếu chưa có
    if (suggestedCategory === 'Tất cả danh mục') {
      if (/dien thoai|smartphone|iphone|samsung|apple|xiaomi|oppo/.test(q))
        suggestedCategory = 'Điện Thoại & Phụ Kiện';
      else if (/laptop|macbook|may tinh|pc|dell|hp|asus|lenovo/.test(q))
        suggestedCategory = 'Laptop & Máy Tính';
      else if (/tai nghe|airpods|earbuds|loa|bluetooth|phim co/.test(q))
        suggestedCategory = 'Thiết Bị Điện Tử';
      else if (/quan|ao|vay|dam|giay|dep|non/.test(q) && /nu|gai|women/.test(q))
        suggestedCategory = 'Thời Trang Nữ';
      else if (/quan|ao|giay|dep|sneaker|hoodie|bomber|polo|hle|esports/.test(q))
        suggestedCategory = 'Thời Trang Nam';
      else if (/noi chien|may xay|noi com|may giat|tu lanh|bep/.test(q))
        suggestedCategory = 'Gia Dụng';
      else if (/binh giu nhiet|ke|bat dia|noi|chao/.test(q))
        suggestedCategory = 'Nhà Cửa';
    }

    // 5. Tổng hợp từ khóa tìm kiếm (Loại bỏ từ dừng)
    const STOPWORDS = new Set(['va', 'cho', 'de', 'cua', 'la', 'tren', 'trong', 'cac', 'co', 'khong', 'voi', 'tu', 'toi', 'muon', 'tim']);
    const meaningfulTokens = q.split(' ').filter(t => t.length >= 2 && !STOPWORDS.has(t));

    expandedKeywords.unshift(original);
    expandedKeywords.push(...meaningfulTokens);

    const dedupedKeywords = [...new Set(expandedKeywords.filter(k => k && k.length >= 1))];

    return {
      normalizedQuery: q,
      expandedKeywords: dedupedKeywords.slice(0, 10),
      detectedIntent,
      suggestedCategory,
      priceRangeMin,
      priceRangeMax,
    };
  }

  /**
   * Gọi mô hình Ollama Qwen2.5 để phân tích ngữ nghĩa nâng cao (Fallback khi Gemini hết quota)
   */
  async parseSemanticWithOllama(rawQuery: string): Promise<Partial<LocalParsedIntent> | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const prompt = `Bạn là trợ lý tìm kiếm TMĐT ZeroMall. Phân tích cụm từ: "${rawQuery}".
Trả về duy nhất JSON hợp lệ:
{
  "detectedIntent": "Ý định tìm kiếm bằng tiếng Việt",
  "suggestedCategory": "Ngành hàng phù hợp",
  "expandedKeywords": ["3 đến 6 từ khóa tìm kiếm cụ thể tiếng Việt"]
}`;

      const res = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          prompt,
          format: 'json',
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data: any = await res.json();
        const parsed = JSON.parse(data.response);
        return {
          detectedIntent: parsed.detectedIntent || parsed.intent,
          suggestedCategory: parsed.suggestedCategory || parsed.category,
          expandedKeywords: parsed.expandedKeywords || parsed.keywords || [],
        };
      }
    } catch {
      // Bỏ qua nếu Ollama bận hoặc chưa tải xong
    }
    return null;
  }

  /**
   * Gọi mô hình Ollama Vision Local để phân tích hình ảnh
   * Thứ tự ưu tiên: minicpm-v (OCR tốt, đọc text trên áo) → moondream (nhẹ, fallback)
   * Sau đó dùng Qwen2.5 để mở rộng keyword từ mô tả thô
   */
  async parseVisualWithMoondream(base64Image: string): Promise<{ detectedProduct: string; searchTerms: string[]; suggestedCategory?: string } | null> {
    // Thử lần lượt các vision model
    const visionModels = [
      {
        model: 'minicpm-v',
        prompt: `Bạn là chuyên gia nhận diện sản phẩm e-commerce. Phân tích hình ảnh này chi tiết:
1. ĐỌC TẤT CẢ TEXT/LOGO/CHỮ xuất hiện trên sản phẩm (ví dụ: tên thương hiệu, tên đội, tên sự kiện trên áo/sản phẩm)
2. Xác định loại sản phẩm chính (áo đấu, giày, điện thoại, ốp lưng, v.v.)
3. Nhận diện thương hiệu, đội tuyển esports, tên người nổi tiếng nếu có
4. Mô tả màu sắc, chất liệu, phong cách

Trả lời chi tiết bằng tiếng Việt hoặc tiếng Anh, liệt kê rõ ràng tất cả text/logo nhìn thấy được.`,
        timeout: 15000,
      },
      {
        model: 'moondream',
        prompt: `Look at this image carefully. Answer these questions:
1. What is the main product shown? (clothing, shoes, phone, etc.)
2. Read ALL text, logos, brand names, team names visible on the product or clothing
3. What brand or team does this product belong to? (e.g. HLE, Hanwha Life, Nike, Adidas, T1, GenG)
4. What colors are dominant?
List every word and logo you can read on the product.`,
        timeout: 8000,
      },
    ];

    let rawDescription = '';

    for (const vm of visionModels) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), vm.timeout);

        const res = await fetch(`${this.ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: vm.model,
            prompt: vm.prompt,
            images: [base64Image],
            stream: false,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: any = await res.json();
          const text = (data.response || '').trim();
          if (text && text.length > 5) {
            rawDescription = text;
            this.logger.log(`✅ Ollama Vision [${vm.model}] → ${text.substring(0, 120)}...`);
            break;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Ollama Vision [${vm.model}] failed: ${err.message}`);
      }
    }

    if (!rawDescription) return null;

    // Trích xuất từ khóa nổi bật từ mô tả thô
    const STOP_WORDS = new Set([
      'this', 'that', 'with', 'from', 'shows', 'image', 'person', 'wearing', 'appears',
      'the', 'and', 'for', 'are', 'was', 'has', 'have', 'its', 'their', 'there',
      'which', 'what', 'where', 'when', 'how', 'who', 'into', 'about', 'also',
      'very', 'just', 'main', 'product', 'shown', 'answer', 'visible', 'dominant',
      'colors', 'text', 'logo', 'brand', 'look', 'carefully', 'these', 'questions',
      'read', 'list', 'every', 'word', 'they', 'does', 'been', 'being', 'could',
      'would', 'should', 'might', 'like', 'seem', 'than', 'then', 'here', 'some',
      'một', 'các', 'của', 'cho', 'này', 'trong', 'với', 'được', 'không', 'trên',
      'hình', 'ảnh', 'sản', 'phẩm', 'chính', 'xuất', 'hiện', 'nhìn', 'thấy',
    ]);

    const rawWords = rawDescription
      .split(/[\s,.\-;:!?()\[\]{}'"\/]+/)
      .filter((w: string) => w.length >= 2 && !STOP_WORDS.has(w.toLowerCase()))
      .map((w: string) => w.replace(/^[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]+|[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]+$/g, ''))
      .filter((w: string) => w.length >= 2);

    const uniqueWords = [...new Set(rawWords)];

    // Tìm các cụm từ khóa quan trọng (tên thương hiệu, tên đội)
    const KNOWN_BRANDS_TEAMS = [
      'HLE', 'Hanwha', 'Hanwha Life', 'Hanwha Life Esports', 'Gumayusi', 'Zeka', 'Delight',
      'T1', 'Faker', 'GenG', 'Gen.G', 'DRX', 'KT', 'Dplus', 'BLG', 'JDG', 'TES',
      'Nike', 'Adidas', 'Puma', 'New Balance', 'Converse', 'Vans',
      'Apple', 'iPhone', 'Samsung', 'Galaxy', 'Xiaomi', 'OPPO', 'Huawei',
      'Corsair', 'Logitech', 'Razer',
      'MSI', 'LCK', 'LPL', 'Worlds', 'Esports', 'Fanmeeting',
      'Wika', 'Wika Rider',
    ];

    const detectedBrands: string[] = [];
    const descLower = rawDescription.toLowerCase();
    for (const brand of KNOWN_BRANDS_TEAMS) {
      if (descLower.includes(brand.toLowerCase())) {
        detectedBrands.push(brand);
      }
    }

    // Xác định danh mục từ mô tả
    let suggestedCategory: string | undefined;
    if (/esports|jersey|đấu|thể thao|sports|team|uniform|đội/i.test(rawDescription)) {
      suggestedCategory = 'Thể Thao';
    } else if (/shirt|áo|polo|hoodie|jacket|bomber|t-shirt|tshirt/i.test(rawDescription)) {
      suggestedCategory = 'Thời Trang Nam';
    } else if (/phone|điện thoại|iphone|samsung|galaxy|smartphone/i.test(rawDescription)) {
      suggestedCategory = 'Điện Thoại & Phụ Kiện';
    } else if (/shoe|giày|sneaker|boot|dép|sandal/i.test(rawDescription)) {
      suggestedCategory = 'Giày Dép Nam';
    } else if (/dress|váy|đầm|skirt/i.test(rawDescription)) {
      suggestedCategory = 'Thời Trang Nữ';
    }

    // Tổ hợp searchTerms: thương hiệu nhận diện + từ khóa nổi bật
    const searchTerms = [...detectedBrands, ...uniqueWords.slice(0, 10)];
    const dedupedTerms = [...new Set(searchTerms.filter(t => t.length >= 2))].slice(0, 12);

    // Dùng Qwen2.5 để mở rộng keyword nếu có thể
    const expandedTerms = await this.expandVisualKeywordsWithQwen(rawDescription, dedupedTerms);

    return {
      detectedProduct: rawDescription.substring(0, 120),
      searchTerms: expandedTerms.length > 0 ? expandedTerms : dedupedTerms,
      suggestedCategory,
    };
  }

  /**
   * Dùng Qwen2.5 để phân tích mô tả thô từ vision model và mở rộng thành keyword tìm kiếm
   */
  private async expandVisualKeywordsWithQwen(visualDescription: string, existingTerms: string[]): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const prompt = `Từ mô tả hình ảnh sản phẩm sau, trích xuất TẤT CẢ tên thương hiệu, tên đội, tên người, model sản phẩm, và từ khóa tìm kiếm quan trọng.

Mô tả: "${visualDescription}"
Các keyword hiện có: ${existingTerms.join(', ')}

Trả về JSON duy nhất:
{"keywords": ["danh sách 5-10 từ khóa tìm kiếm cụ thể nhất, ưu tiên tên thương hiệu/đội/người"]}`;

      const res = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          prompt,
          format: 'json',
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data: any = await res.json();
        const parsed = JSON.parse(data.response);
        if (Array.isArray(parsed.keywords) && parsed.keywords.length > 0) {
          return [...new Set([...existingTerms, ...parsed.keywords])].filter(k => k && k.length >= 2).slice(0, 12);
        }
      }
    } catch {
      // Fallback to existing terms if Qwen fails
    }
    return existingTerms;
  }
}
