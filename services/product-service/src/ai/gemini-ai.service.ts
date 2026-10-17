import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_GEMINI_KEY = '';

// Danh sách các model Gemini chính thức hỗ trợ Vision & Multimodal theo thứ tự ưu tiên
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
];

@Injectable()
export class GeminiAiService {
  private readonly logger = new Logger(GeminiAiService.name);

  /**
   * Lấy danh sách API keys (hỗ trợ nhiều key phân cách bằng dấu phẩy để tự động xoay tua)
   */
  private getApiKeys(customApiKey?: string): string[] {
    if (customApiKey) return [customApiKey];
    const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
    return raw.split(',').map(k => k.trim()).filter(Boolean);
  }

  /**
   * Gọi Gemini AI phân tích ngữ nghĩa truy vấn (tự động fallback model & xoay key)
   */
  async parseSemantic(customApiKey?: string, query: string = '', contextCategory?: string) {
    const keys = this.getApiKeys(customApiKey);
    const systemPrompt = `Bạn là Trí tuệ Nhân tạo Phân tích Ngữ nghĩa & Ý định Tìm kiếm của sàn TMĐT ZeroMall Việt Nam.
Đọc hiểu ngôn ngữ tự nhiên từ người dùng, giải mã từ viết tắt ("15prm" -> iPhone 15 Pro Max, "snk" -> giày sneaker, "nck" -> nồi chiên không dầu), mở rộng từ khóa tìm kiếm thực tế.
CHỈ TRẢ VỀ JSON:
{
  "detectedIntent": "Tóm tắt ý định tìm kiếm ngắn gọn",
  "suggestedCategory": "Tên ngành hàng phù hợp",
  "expandedKeywords": ["5-8 từ khóa cụ thể tiếng Việt"],
  "priceRangeMin": number hoặc null,
  "priceRangeMax": number hoặc null
}`;

    const userPrompt = `Truy vấn: "${query}"${contextCategory ? ` (Ngành hàng: ${contextCategory})` : ''}`;

    for (const model of CANDIDATE_MODELS) {
      for (const key of keys) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeout);

          if (!response.ok) {
            this.logger.warn(`Gemini Semantic [${model}] HTTP ${response.status} -> thử model tiếp theo...`);
            continue;
          }

          const data: any = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) continue;

          return JSON.parse(rawText.trim());
        } catch (err: any) {
          this.logger.warn(`Gemini Semantic [${model}] failed (${err.message}) -> fallback`);
        }
      }
    }
    return null;
  }

  /**
   * Gọi Gemini Multimodal Vision phân tích ảnh toàn diện cho mọi ngành hàng TMĐT
   */
  async parseVisual(customApiKey?: string, base64Data: string = '', mimeType: string = 'image/jpeg') {
    const keys = this.getApiKeys(customApiKey);
    const systemPrompt = `Bạn là Chuyên gia Trí tuệ Nhân tạo Thị giác Máy tính TMĐT của sàn ZeroMall Việt Nam.
Nhiệm vụ: Phân tích bức ảnh sản phẩm để tìm kiếm sản phẩm tương đồng chính xác nhất trên sàn TMĐT.
Nhận diện khách quan, toàn diện cho MỌI ngành hàng (không thiên vị bất kỳ loại hàng nào):
1. LOẠI SẢN PHẨM: Nhận diện chính xác vật thể trọng tâm (ví dụ: balo, cặp sách, túi xách, ví, áo thun, áo khoác, váy, đầm, giày sneaker, dép, điện thoại, ốp lưng, tai nghe, bàn phím, nồi chiên, bình giữ nhiệt, bát đĩa, sách...).
2. THƯƠNG HIỆU & CHỮ IN / LOGO: Đọc tất cả chữ, logo, thương hiệu, tên đội/tuyển thủ/nhân vật xuất hiện trên sản phẩm (ví dụ: Apple, Nike, Adidas, Corsair, Wika, Hanwha Life, HLE, T1, Lock&Lock, Philips...). Nếu là sản phẩm trơn không thương hiệu, ghi nhận loại kiểu dáng.
3. TỪ ĐỒNG NGHĨA & TỪ KHÓA TÌM KIẾM TIẾNG VIỆT: Liệt kê các từ khóa mà người mua hàng Việt Nam thường gõ khi tìm sản phẩm này (kèm từ đồng nghĩa: balo/ba lô/cặp, mũ/nón, dép/sandal, bình nước/bình giữ nhiệt).

CHỈ TRẢ VỀ DUY NHẤT 1 CHUỖI JSON HỢP LỆ:
{
  "detectedProduct": "Tên sản phẩm định danh rõ ràng bằng tiếng Việt (ví dụ: Balo thời trang học sinh sinh viên / Áo thun thể thao Wika / Điện thoại iPhone 15 Pro Max)",
  "suggestedCategory": "Ngành hàng phù hợp nhất (ví dụ: Balo & Túi Ví | Túi Ví Nữ | Thời Trang Nam | Thời Trang Nữ | Giày Dép Nam | Điện Thoại & Phụ Kiện | Thiết Bị Điện Tử | Nhà Cửa | Gia Dụng)",
  "dominantColors": ["Màu chính 1", "Màu chính 2"],
  "style": "Phong cách nhận diện (Học sinh, Công sở, Thể thao, Đường phố, Tối giản...)",
  "material": "Chất liệu phỏng đoán (Vải oxford, Da, Cotton, Nhựa, Kim loại...)",
  "gender": "Nam | Nữ | Unisex",
  "searchTerms": ["6 đến 12 từ khóa tìm kiếm tiếng Việt phổ biến, gồm tên loại sản phẩm, từ đồng nghĩa, thương hiệu, màu sắc, công dụng"]
}`;

    for (const model of CANDIDATE_MODELS) {
      for (const key of keys) {
        try {
          const controller = new AbortController();
          // Tăng timeout lên 35s vì Gemini xử lý hình ảnh qua mạng cần từ 12-25 giây
          const timeout = setTimeout(() => controller.abort(), 35000);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: systemPrompt },
                      { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } },
                    ],
                  },
                ],
                generationConfig: { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: 'application/json' },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeout);

          if (!response.ok) {
            this.logger.warn(`Gemini Vision [${model}] HTTP ${response.status} -> thử model tiếp theo...`);
            continue;
          }

          const data: any = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) continue;

          return JSON.parse(rawText.trim());
        } catch (err: any) {
          this.logger.warn(`Gemini Vision [${model}] failed (${err.message}) -> fallback`);
        }
      }
    }
    return null;
  }

  /**
   * Thẩm định hình ảnh sản phẩm thực tế, đối chiếu với tên và ngành hàng khai báo
   */
  async auditVisualProduct(
    customApiKey?: string,
    imageBase64: string = '',
    mimeType: string = 'image/jpeg',
    declaredTitle: string = '',
    declaredCategory: string = ''
  ): Promise<{
    detectedVisual: string;
    isMismatch: boolean;
    suggestedTitle: string;
    suggestedCategory: string;
    reason: string;
    confidence: number;
  } | null> {
    const keys = this.getApiKeys(customApiKey);
    const systemPrompt = `Bạn là Trí tuệ Nhân tạo Giám định Hình ảnh & Danh mục TMĐT của sàn ZeroMall Việt Nam.
Nhiệm vụ: Nhìn vào bức ảnh sản phẩm, nhận diện chính xác vật thể thực tế và đối chiếu với Tên sản phẩm & Ngành hàng người bán nhập.

Quy tắc quan trọng:
1. NHẬN DIỆN VẬT THỂ THỰC TẾ:
   - Nếu ảnh là áo bóng đá / trang phục thể thao / quần áo: detectedVisual = "Bộ quần áo bóng đá / Áo thể thao".
   - Nếu ảnh là giày sneaker / giày thể thao: detectedVisual = "Giày thể thao / Giày sneaker".
   - Tương tự cho balo, điện thoại, nồi chiên, mỹ phẩm, đồ gia dụng, sách...
2. ĐỐI CHIẾU LỆCH HÌNH ẢNH & TIÊU ĐỀ:
   - Nếu ảnh là ÁO / TRANG PHỤC THỂ THAO, nhưng tiêu đề lại ghi là "giày...", "dép...", "nồi chiên..." -> isMismatch = true!
   - Nếu ảnh là GIÀY, nhưng tiêu đề lại là "áo...", "điện thoại..." -> isMismatch = true!
   - Tương tự nếu ảnh là đồ gia dụng mà tiêu đề là xe cộ/quần áo -> isMismatch = true!
3. ĐỀ XUẤT TÊN & NGÀNH HÀNG THEO ẢNH:
   - suggestedTitle: Đề xuất 1 tên sản phẩm chuẩn SEO TMĐT tiếng Việt cho sản phẩm nhìn thấy trong ảnh (ví dụ: "Áo Bóng Đá Thể Thao Cam Cổ Bẻ Thoáng Khí Hút Mồ Hôi" hoặc "Bộ Quần Áo Đấu Bóng Đá Wika Nam Nữ").
   - suggestedCategory: Ngành hàng chuẩn (Thời Trang Nam | Thời Trang Nữ | Giày Dép Nam | Giày Dép Nữ | Thể Thao | Gia Dụng | Điện Thoại & Phụ Kiện | Balo & Túi Ví...).
   - reason: Giải thích ngắn gọn cho người bán (ví dụ: "Hình ảnh tải lên là áo bóng đá thể thao, hoàn toàn không tương đồng với tên sản phẩm là 'giày đẹp giá rẻ'.").

CHỈ TRẢ VỀ DUY NHẤT JSON:
{
  "detectedVisual": "Tên vật thể trong ảnh",
  "isMismatch": boolean,
  "suggestedTitle": "Tên sản phẩm chuẩn SEO đề xuất theo ảnh",
  "suggestedCategory": "Ngành hàng chuẩn",
  "reason": "Lý do đối chiếu",
  "confidence": number
}`;

    for (const model of CANDIDATE_MODELS) {
      for (const key of keys) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000);

          const userText = `Người bán nhập:\n- Tên sản phẩm: "${declaredTitle}"\n- Ngành hàng chọn: "${declaredCategory}"\n\nHãy phân tích ảnh và đối chiếu xem có đúng sản phẩm không.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: `${systemPrompt}\n\n${userText}` },
                      { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
                    ],
                  },
                ],
                generationConfig: { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: 'application/json' },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeout);

          if (!response.ok) continue;

          const data: any = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) continue;

          return JSON.parse(rawText.trim());
        } catch (err: any) {
          this.logger.warn(`auditVisualProduct [${model}] failed (${err.message}) -> fallback`);
        }
      }
    }
    return null;
  }


  /**
   * Gọi Gemini kiểm duyệt nội dung văn bản
   */
  async moderateText(apiKey: string = DEFAULT_GEMINI_KEY, text: string, category?: string) {
    const key = apiKey || DEFAULT_GEMINI_KEY;
    const systemPrompt = `Bạn là Hệ thống Thẩm định Nội dung An toàn của sàn TMĐT ZeroMall Việt Nam.
Phân biệt chính xác giữa hàng hợp pháp (ví dụ: "áo bóng đá", "đá hoa cương", "khay đá", "pin dự phòng") và hàng cấm (ma túy đá, chất kích thích, vũ khí).
CHỈ TRẢ VỀ JSON:
{
  "isViolated": boolean,
  "violationType": "SAFE" | "NARCOTICS" | "WEAPONS" | "COUNTERFEIT" | "OBSCENE" | "DANGEROUS" | "RESTRICTED",
  "confidence": number,
  "reason": "Giải thích ngắn gọn",
  "suggestion": "Khuyến nghị chỉnh sửa nếu có",
  "detectedKeywords": ["từ vi phạm nếu có"]
}`;

    for (const model of CANDIDATE_MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nNội dung: "${text}"` }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 512, responseMimeType: 'application/json' },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!response.ok) continue;
        const data: any = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        return JSON.parse(rawText.trim());
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Gọi Gemini AI tư vấn mua sắm theo ngữ cảnh RAG
   */
  async generateShoppingChat(
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    retrievedProducts: any[] = [],
    contextSummary: string = ''
  ): Promise<{ reply: string; quickReplies: string[] } | null> {
    const keys = this.getApiKeys();

    const productBriefs = retrievedProducts.slice(0, 6).map((p, idx) => {
      const priceFmt = (p.price || 0).toLocaleString('vi-VN') + 'đ';
      return `${idx + 1}. [${p.name}] - Giá: ${priceFmt} - Ngành hàng: ${p.category || 'Khác'} - Đã bán: ${p.sales || 0} - Đánh giá: ${p.rating || 5}★`;
    }).join('\n');

    const systemPrompt = `Bạn là "ZeroAI" - Trợ lý Mua sắm Ảo thông minh, thân thiện, chu đáo và am hiểu sản phẩm của sàn Thương mại Điện tử ZeroMall Việt Nam.
Nhiệm vụ: Tư vấn nhiệt tình, giải đáp thắc mắc và gợi ý cho khách hàng dựa trên danh sách sản phẩm THỰC TẾ đang có trong kho của ZeroMall.
Quy tắc:
1. Giọng điệu thân thiện, lịch sự, dùng đại từ "mình" hoặc "ZeroAI" và gọi khách là "bạn" hoặc "quý khách".
2. Chỉ giới thiệu các sản phẩm có trong danh sách được cung cấp. Nêu bật ưu điểm về giá cả, công dụng và độ tin cậy.
3. Không bịa đặt thông tin kỹ thuật hay sản phẩm không có thật.
4. Trả lời súc tích, trực tiếp, dễ đọc (khoảng 2-4 câu ngắn gọn, có emoji nhẹ nhàng).
5. CHÚ Ý NGÔN TỪ: Dùng từ ngữ tự nhiên của người Việt (ví dụ: 'mẫu balo chống nước', 'balo laptop', 'túi xách', 'quà tặng chồng/bạn trai'). Tuyệt đối KHÔNG nhắc lại các tên ngành hàng kỹ thuật trong cơ sở dữ liệu như 'Túi Ví Nữ' khi khách hàng đang hỏi về balo hoặc quà tặng cho nam/chồng.
6. CHỈ TRẢ VỀ DUY NHẤT 1 CHUỖI JSON HỢP LỆ THEO SCHEMA:
{
  "reply": "Nội dung phản hồi tư vấn thân thiện cho khách",
  "quickReplies": ["3 gợi ý câu hỏi tiếp theo ngắn gọn (dưới 5 từ/câu) để khách bấm nhanh"]
}`;

    const contextPrompt = `Danh sách sản phẩm phù hợp hiện có tại ZeroMall:\n${productBriefs || '(Hiện không có sản phẩm nào khớp hoàn toàn tiêu chí)'}\n\nThông tin thêm: ${contextSummary}\n\nTin nhắn gần đây của khách: "${userMessage}"`;

    for (const model of CANDIDATE_MODELS) {
      for (const key of keys) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);

          const contents: any[] = [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${contextPrompt}` }] },
          ];

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024, responseMimeType: 'application/json' },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeout);

          if (!response.ok) continue;

          const data: any = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) continue;

          return JSON.parse(rawText.trim());
        } catch {
          continue;
        }
      }
    }
    return null;
  }
}

