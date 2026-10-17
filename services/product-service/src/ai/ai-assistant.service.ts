import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GeminiAiService } from './gemini-ai.service';
import { LocalAiService } from './local-ai.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: any[];
  timestamp?: number;
}

export class AssistantChatDto {
  message: string;
  history?: ChatMessage[];
  userId?: string;
  userGender?: string;
}

export interface AssistantChatResponse {
  reply: string;
  suggestedProducts: any[];
  quickReplies?: string[];
  detectedIntent?: {
    category?: string;
    targetGender?: string;
    priceRange?: { min?: number; max?: number };
    keywords?: string[];
  };
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiAiService: GeminiAiService,
    private readonly localAiService: LocalAiService,
  ) {}

  /**
   * Xử lý tin nhắn hỏi đáp tư vấn mua sắm của khách hàng
   */
  async processChat(dto: AssistantChatDto): Promise<AssistantChatResponse> {
    const rawMsg = (dto.message || '').trim();
    if (!rawMsg) {
      return {
        reply: 'Chào bạn! Mình là ZeroAI - Trợ lý mua sắm của ZeroMall. Bạn đang cần tìm kiếm hoặc tư vấn món đồ gì hôm nay?',
        suggestedProducts: [],
        quickReplies: ['Gợi ý đồ hot hôm nay', 'Balo học sinh sinh viên', 'Ốp lưng iPhone 15 Pro Max', 'Quà tặng bạn gái'],
      };
    }

    // 1. Phân tích ngữ nghĩa & Intent người dùng (0ms Regex & Rule-based)
    const intent = this.extractIntent(rawMsg, dto.userGender);

    // 2. Truy vấn sản phẩm THỰC TẾ từ Database PostgreSQL (100% Dynamic)
    const products = await this.queryRelevantProducts(intent, rawMsg);

    // 3. Chuẩn hóa sản phẩm trả về cho giao diện
    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      image: (Array.isArray(p.images) && p.images[0]) || p.image || '',
      category: p.category,
      sales: p.sales || 0,
      stock: p.stock ?? 100,
      rating: 4.9,
      brand: p.brand || 'No Brand',
      shopId: p.shopId,
      recommendationReason: this.generateReasonForProduct(p, intent),
    }));

    // 4. Sinh câu trả lời qua Gemini RAG (với Fallback tự động khi offline)
    let aiResponse: { reply: string; quickReplies: string[] } | null = null;
    try {
      const contextSummary = `Ý định tìm kiếm: Ngành hàng [${intent.category || 'Mọi ngành'}], Ngân sách tối đa [${intent.maxPrice ? intent.maxPrice.toLocaleString('vi-VN') + 'đ' : 'Không giới hạn'}], Đối tượng [${intent.targetGender || 'Mọi người'}].`;
      aiResponse = await this.geminiAiService.generateShoppingChat(
        rawMsg,
        dto.history || [],
        formattedProducts,
        contextSummary,
      );
    } catch (e: any) {
      this.logger.warn(`Gemini Chat RAG error: ${e.message}`);
    }

    // Nếu Gemini phản hồi hợp lệ, dùng kết quả đó
    if (aiResponse && aiResponse.reply) {
      return {
        reply: aiResponse.reply,
        suggestedProducts: formattedProducts,
        quickReplies: aiResponse.quickReplies?.length ? aiResponse.quickReplies : this.getDefaultQuickReplies(intent),
        detectedIntent: intent,
      };
    }

    // 5. Fallback thông minh cục bộ khi không có mạng ngoại vi
    const fallbackReply = this.generateLocalFallbackReply(rawMsg, intent, formattedProducts);

    return {
      reply: fallbackReply,
      suggestedProducts: formattedProducts,
      quickReplies: this.getDefaultQuickReplies(intent),
      detectedIntent: intent,
    };
  }

  /**
   * Trích xuất thông số: Giá, Danh mục, Đối tượng từ câu chat
   */
  private extractIntent(msg: string, defaultGender?: string) {
    const lower = msg.toLowerCase();

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    // A. Bóc tách giá tiền: "dưới 300k", "< 500.000", "tầm 200k", "từ 100k đến 300k"
    const rangeMatch = lower.match(/từ\s*(\d+)\s*(k|nghìn|ngàn|tr|triệu)?\s*(?:đến|tới|-)\s*(\d+)\s*(k|nghìn|ngàn|tr|triệu)?/i);
    if (rangeMatch) {
      minPrice = this.parseMoneyUnit(rangeMatch[1], rangeMatch[2]);
      maxPrice = this.parseMoneyUnit(rangeMatch[3], rangeMatch[4]);
    } else {
      const underMatch = lower.match(/(?:dưới|<|không quá|tầm|khoảng)\s*(\d+)\s*(k|nghìn|ngàn|tr|triệu|đ|vnd)?/i);
      if (underMatch) {
        maxPrice = this.parseMoneyUnit(underMatch[1], underMatch[2]);
        if (lower.includes('tầm') || lower.includes('khoảng')) {
          minPrice = Math.max(0, Math.round(maxPrice * 0.7));
          maxPrice = Math.round(maxPrice * 1.3);
        }
      }
    }

    // B. Bóc tách đối tượng & giới tính & quà tặng
    let targetGender: string | undefined;
    let recipientNoun: string | undefined;
    let isGift = false;
    let isAmbiguousRecipient = false;

    const normUserGender = (defaultGender || '').toUpperCase();
    const isUserMale = normUserGender === 'MALE' || normUserGender === 'NAM';
    const isUserFemale = normUserGender === 'FEMALE' || normUserGender === 'NU';

    // 1. Kiểm tra nếu người dùng tìm áo đôi / đồ unisex
    if (lower.includes('áo đôi') || lower.includes('áo cặp') || lower.includes('đồ đôi') || lower.includes('unisex')) {
      targetGender = 'UNISEX';
      recipientNoun = 'cặp đôi';
      isGift = true;
    }
    // 2. Kiểm tra nếu người nhận là Nam (chồng, bạn trai, nam giới)
    else if (
      lower.includes('chồng') ||
      lower.includes('ông xã') ||
      lower.includes('anh xã') ||
      lower.includes('bạn trai') ||
      lower.includes('cho nam') ||
      lower.includes('cho anh') ||
      lower.includes('anh ấy') ||
      lower.includes('bố') ||
      lower.includes('cho ba') ||
      lower.includes('tặng bạn trai')
    ) {
      targetGender = 'NAM';
      if (lower.includes('chồng') || lower.includes('ông xã') || lower.includes('anh xã')) recipientNoun = 'chồng';
      else if (lower.includes('bạn trai')) recipientNoun = 'bạn trai';
      else if (lower.includes('bố') || lower.includes('cho ba')) recipientNoun = 'bố';
      else recipientNoun = 'nam';
    }
    // 3. Kiểm tra nếu người nhận là Nữ (vợ, bạn gái, nữ giới)
    else if (
      lower.includes('vợ') ||
      lower.includes('bà xã') ||
      lower.includes('bạn gái') ||
      lower.includes('cho nữ') ||
      lower.includes('chị em') ||
      lower.includes('cho chị') ||
      lower.includes('cho mẹ') ||
      lower.includes('mẹ tôi') ||
      lower.includes('tặng bạn gái')
    ) {
      targetGender = 'NU';
      if (lower.includes('vợ') || lower.includes('bà xã')) recipientNoun = 'vợ';
      else if (lower.includes('bạn gái')) recipientNoun = 'bạn gái';
      else if (lower.includes('cho mẹ') || lower.includes('mẹ tôi')) recipientNoun = 'mẹ';
      else recipientNoun = 'nữ';
    }
    // 4. Kiểm tra người nhận là "người yêu", "crush", "người thương", "bồ"
    else if (lower.includes('người yêu') || lower.includes('crush') || lower.includes('người thương') || lower.includes('bồ')) {
      recipientNoun = 'người yêu';
      isGift = true;

      // SUY LUẬN ĐẢO CHIỀU TỪ HỒ SƠ TÀI KHOẢN (User Profile):
      if (isUserMale) {
        // Tài khoản đang đăng nhập là Nam -> Tặng người yêu thường là Nữ (bạn gái)
        targetGender = 'NU';
        recipientNoun = 'bạn gái';
      } else if (isUserFemale) {
        // Tài khoản đang đăng nhập là Nữ -> Tặng người yêu thường là Nam (bạn trai)
        targetGender = 'NAM';
        recipientNoun = 'bạn trai';
      } else {
        // Chưa có dữ liệu giới tính tài khoản -> Cần AI hỏi lại khéo léo và cung cấp Quick Replies
        isAmbiguousRecipient = true;
      }
    }

    if (lower.includes('tặng') || lower.includes('quà') || lower.includes('sinh nhật') || lower.includes('kỷ niệm') || !!recipientNoun) {
      isGift = true;
    }

    // C. Bóc tách loại đồ vật (itemNoun) & ngành hàng & từ khóa tìm kiếm
    let itemNoun: string | undefined;
    let category: string | undefined;
    const relatedCategories: string[] = [];
    const keywords: string[] = [];

    if (/balo|ba lô|cặp/i.test(lower)) {
      itemNoun = 'balo';
      keywords.push('balo', 'ba lô');
      category = 'Túi Ví Nữ'; // Category tương ứng trong ZeroMall DB
      relatedCategories.push('Túi Ví Nữ', 'Thời Trang Nam');
    } else if (/túi|túi xách|túi đeo chéo|clutch/i.test(lower)) {
      itemNoun = 'túi xách';
      keywords.push('túi');
      category = 'Túi Ví Nữ';
      relatedCategories.push('Túi Ví Nữ', 'Phụ Kiện Nữ');
    } else if (/ví|bóp/i.test(lower)) {
      itemNoun = 'ví';
      keywords.push('ví', 'bóp');
      category = 'Túi Ví Nữ';
      relatedCategories.push('Túi Ví Nữ', 'Thời Trang Nam', 'Phụ Kiện Nữ');
    } else if (/tai nghe|bluetooth|airpods/i.test(lower)) {
      itemNoun = 'tai nghe';
      category = 'Thiết Bị Điện Tử';
      keywords.push('tai nghe');
    } else if (/ốp lưng|ốp|case|kính cường lực/i.test(lower)) {
      itemNoun = 'ốp lưng';
      category = 'Điện Thoại & Phụ Kiện';
      keywords.push('ốp lưng', 'case');
    } else if (/áo|bomber|hoodie|áo thun|áo khoác/i.test(lower)) {
      itemNoun = 'áo';
      if (targetGender === 'NAM') {
        category = 'Thời Trang Nam';
        relatedCategories.push('Thời Trang Nam');
        keywords.push('áo', 'bomber');
      } else if (targetGender === 'NU') {
        category = 'Thời Trang Nữ';
        relatedCategories.push('Thời Trang Nữ', 'Phụ Kiện Nữ');
        keywords.push('áo', 'váy', 'đầm');
      } else {
        // UNISEX hoặc Chưa rõ -> Lấy Thời Trang Nam (chứa Áo Bomber Unisex) và Thời Trang Nữ
        category = 'Thời Trang Nam';
        relatedCategories.push('Thời Trang Nam', 'Thời Trang Nữ');
        keywords.push('áo', 'bomber', 'unisex');
      }
    } else if (/váy|đầm|chân váy/i.test(lower)) {
      itemNoun = 'váy đầm';
      category = 'Thời Trang Nữ';
      keywords.push('váy', 'đầm');
    } else if (/nồi|chảo|bát đĩa|bình giữ nhiệt|đồ gia dụng|cốc/i.test(lower)) {
      itemNoun = 'đồ gia dụng';
      category = 'Nhà Cửa';
      keywords.push('bình giữ nhiệt', 'bát đĩa');
    } else if (/mũ|nón/i.test(lower)) {
      itemNoun = 'mũ nón';
      category = 'Phụ Kiện Nữ';
      keywords.push('nón', 'mũ');
    } else if (/giày|dép|sneaker/i.test(lower)) {
      itemNoun = 'giày dép';
      category = targetGender === 'NAM' ? 'Giày Dép Nam' : 'Thời Trang Nữ';
      keywords.push('giày', 'dép');
    }

    return {
      itemNoun,
      recipientNoun,
      category,
      relatedCategories,
      targetGender,
      minPrice,
      maxPrice,
      keywords,
      isGift,
      isAmbiguousRecipient,
    };
  }

  private parseMoneyUnit(numStr: string, unitStr?: string): number {
    const num = parseInt(numStr, 10);
    if (!num) return 0;
    const unit = (unitStr || '').toLowerCase();
    if (unit.startsWith('tr')) return num * 1000000;
    if (unit.startsWith('k') || unit.startsWith('ngh') || unit.startsWith('ngà')) return num * 1000;
    if (num < 1000) return num * 1000; // Mặc định nếu người dùng gõ "dưới 200" tức là 200.000đ
    return num;
  }

  /**
   * Truy vấn sản phẩm thực tế từ Database
   */
  private async queryRelevantProducts(intent: any, rawQuery: string) {
    try {
      const priceFilter: any = {};
      if (intent.minPrice) priceFilter.gte = intent.minPrice;
      if (intent.maxPrice) priceFilter.lte = intent.maxPrice;

      const baseWhere: any = {
        status: 'active',
        stock: { gt: 0 },
        name: { notIn: ['test', 'cuong', '2'] },
      };
      if (Object.keys(priceFilter).length > 0) {
        baseWhere.price = priceFilter;
      }

      // ƯU TIÊN 1: Nếu người dùng có tìm từ khóa cụ thể (VD: "balo", "áo")
      if (intent.keywords && intent.keywords.length > 0) {
        const keywordOrConditions = intent.keywords.map((kw: string) => ({
          name: { contains: kw, mode: 'insensitive' },
        }));

        let catFilter: any = undefined;
        if (intent.category) {
          catFilter = { in: Array.from(new Set([intent.category, ...(intent.relatedCategories || [])])) };
        }

        let keywordList = await this.prisma.product.findMany({
          where: {
            ...baseWhere,
            ...(catFilter ? { category: catFilter } : {}),
            OR: keywordOrConditions,
          },
          take: 6,
          orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
        });

        // Nếu có lọc giá mà không có kết quả, nới lỏng giá để vẫn giữ đúng món đồ khách muốn tìm
        if (keywordList.length === 0) {
          keywordList = await this.prisma.product.findMany({
            where: {
              status: 'active',
              stock: { gt: 0 },
              name: { notIn: ['test', 'cuong', '2'] },
              OR: keywordOrConditions,
            },
            take: 6,
            orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
          });
        }

        if (keywordList.length > 0) {
          return keywordList;
        }
      }

      // ƯU TIÊN 2: Tìm theo Category / Related Categories nếu không có keyword hoặc keyword không ra
      const catList = Array.from(new Set([
        ...(intent.category ? [intent.category] : []),
        ...(intent.relatedCategories || []),
      ]));

      if (catList.length > 0) {
        let catListProducts = await this.prisma.product.findMany({
          where: {
            ...baseWhere,
            category: { in: catList },
          },
          take: 6,
          orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
        });

        if (catListProducts.length === 0 && Object.keys(priceFilter).length > 0) {
          catListProducts = await this.prisma.product.findMany({
            where: {
              status: 'active',
              stock: { gt: 0 },
              name: { notIn: ['test', 'cuong', '2'] },
              category: { in: catList },
            },
            take: 6,
            orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
          });
        }

        if (catListProducts.length > 0) {
          return catListProducts;
        }
      }

      // ƯU TIÊN 3: Tìm theo từ ngữ tự do trong câu chat
      const stopWords = new Set(['tôi', 'muốn', 'tìm', '1', 'cái', 'để', 'tặng', 'cho', 'ở', 'với', 'các', 'những', 'một', 'mình', 'em', 'nhé', 'giúp', 'ạ']);
      const words = rawQuery.split(/\s+/).filter((w) => w.length >= 2 && !stopWords.has(w.toLowerCase()));
      if (words.length > 0) {
        const freeTextList = await this.prisma.product.findMany({
          where: {
            status: 'active',
            stock: { gt: 0 },
            name: { notIn: ['test', 'cuong', '2'] },
            OR: words.slice(0, 3).map((w) => ({
              name: { contains: w, mode: 'insensitive' },
            })),
          },
          take: 6,
          orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
        });
        if (freeTextList.length > 0) {
          return freeTextList;
        }
      }

      // ƯU TIÊN 4: Fallback lấy các sản phẩm bán chạy nhất toàn sàn
      return await this.prisma.product.findMany({
        where: {
          status: 'active',
          stock: { gt: 0 },
          name: { notIn: ['test', 'cuong', '2'] },
        },
        take: 6,
        orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (e: any) {
      this.logger.error(`Error querying database for assistant: ${e.message}`);
      return [];
    }
  }

  private generateReasonForProduct(product: any, intent: any): string {
    const pName = (product.name || '').toLowerCase();
    const pCat = product.category || '';

    // 1. Áo khoác Bomber Unisex / Đồ cặp đôi
    if (pName.includes('unisex') || pName.includes('bomber') || intent.targetGender === 'UNISEX') {
      return '👫 Áo khoác Unisex / Thích hợp cả nam & nữ';
    }

    // 2. Món đồ tặng người yêu
    if (intent.recipientNoun === 'người yêu' || intent.isAmbiguousRecipient) {
      if (pCat === 'Thời Trang Nam' || pName.includes('nam') || pName.includes('bomber')) {
        return '👨 Quà tặng bạn trai phong cách';
      }
      if (pCat === 'Thời Trang Nữ' || pName.includes('váy') || pName.includes('nữ')) {
        return '👩 Quà tặng bạn gái xinh xắn';
      }
      return '🎁 Quà tặng người yêu ý nghĩa';
    }

    // 3. Phù hợp balo
    if (intent.itemNoun === 'balo' || pName.includes('balo') || pName.includes('ba lô')) {
      if (intent.recipientNoun === 'chồng' || intent.recipientNoun === 'bạn trai' || intent.targetGender === 'NAM') {
        return '🎒 Balo nam / Unisex chống nước';
      }
      return '🎒 Balo học sinh / công sở hot';
    }

    // 4. Phù hợp túi xách
    if (intent.itemNoun === 'túi xách' || pName.includes('túi')) {
      if (intent.isGift) {
        return '🎁 Quà tặng túi xách thanh lịch';
      }
      return '👜 Túi thời trang cao cấp';
    }

    // 5. Phù hợp quà tặng
    if (intent.isGift && (intent.recipientNoun === 'chồng' || intent.recipientNoun === 'bạn trai' || intent.targetGender === 'NAM')) {
      return `🎁 Quà tặng ${intent.recipientNoun || 'nam'} ý nghĩa`;
    }
    if (intent.isGift && (intent.recipientNoun === 'vợ' || intent.recipientNoun === 'bạn gái' || intent.targetGender === 'NU')) {
      return `🎁 Quà tặng ${intent.recipientNoun || 'nàng'} tinh tế`;
    }

    // 6. Đúng ngân sách
    if (intent.maxPrice && product.price <= intent.maxPrice) {
      return `💰 Đúng ngân sách < ${(intent.maxPrice).toLocaleString('vi-VN')}đ`;
    }

    // 7. Bán chạy
    if (product.sales && product.sales > 10) {
      return `🔥 Đã bán ${product.sales} lượt`;
    }

    return '✨ ZeroAI tuyển chọn';
  }

  private generateLocalFallbackReply(rawMsg: string, intent: any, products: any[]): string {
    if (products.length === 0) {
      return `Dạ ZeroAI đã tìm kiếm nhưng chưa thấy sản phẩm nào khớp với yêu cầu "${rawMsg}". Bạn có thể thử tìm bằng tên món đồ khác hoặc xem các gợi ý hot bên dưới nha!`;
    }

    const count = products.length;
    let priceText = '';
    if (intent.maxPrice) {
      priceText = ` trong tầm giá dưới ${intent.maxPrice.toLocaleString('vi-VN')}đ`;
    }

    // A. Nếu người dùng hỏi mua áo tặng người yêu
    if (intent.itemNoun === 'áo' && (intent.recipientNoun === 'người yêu' || intent.isGift)) {
      if (intent.isAmbiguousRecipient) {
        return `Dạ, ZeroAI có rất nhiều mẫu áo đẹp thích hợp làm quà tặng người yêu nè ✨ Để mình gợi ý đúng form dáng và phong cách nhất, bạn đang muốn tìm áo tặng cho Bạn trai hay Bạn gái nè? Mời bạn chọn nhanh bên dưới hoặc tham khảo mẫu áo khoác Unisex cực chất này nhé:`;
      }
      if (intent.targetGender === 'NU') {
        return `Dạ, ZeroAI gợi ý bạn các mẫu áo & thời trang xinh xắn rất thích hợp dành tặng bạn gái nè ✨ Bạn xem thử mẫu dưới đây có ưng ý không nhé:`;
      }
      if (intent.targetGender === 'NAM') {
        return `Dạ, ZeroAI gợi ý bạn các mẫu áo phong cách, chuẩn form rất thích hợp dành tặng bạn trai nè ✨ Mời bạn tham khảo nhé:`;
      }
      if (intent.targetGender === 'UNISEX') {
        return `Dạ, ZeroAI gợi ý bạn mẫu áo khoác Unisex cực chất mà cả bạn và người yêu đều có thể diện đôi cùng nhau nè ✨:`;
      }
    }

    // B. Nếu người dùng tìm kiếm theo loại đồ cụ thể (balo, túi xách, áo, tai nghe...)
    if (intent.itemNoun) {
      if (intent.recipientNoun) {
        return `Dạ, ZeroAI đã chọn lọc các mẫu ${intent.itemNoun}${priceText} rất phù hợp để làm quà tặng cho ${intent.recipientNoun} nè ✨ Mời bạn tham khảo các mẫu được đánh giá cao nhất trên ZeroMall nhé:`;
      }
      if (intent.targetGender === 'NAM') {
        return `Dạ, ZeroAI gợi ý bạn các mẫu ${intent.itemNoun}${priceText} dành cho nam đang được ưa chuộng nhất trên ZeroMall nè. Mời bạn tham khảo nhé:`;
      }
      if (intent.targetGender === 'NU') {
        return `Dạ, ZeroAI gợi ý bạn các mẫu ${intent.itemNoun}${priceText} dành cho nữ xinh xắn và phong cách nhất trên ZeroMall nè:`;
      }
      return `Dạ, mình đã tìm thấy ${count} mẫu ${intent.itemNoun}${priceText} đang được yêu thích nhất trên ZeroMall nè. Mời bạn tham khảo nhé:`;
    }

    // C. Nếu tìm quà tặng chung
    if (intent.isGift && intent.recipientNoun) {
      return `Dạ, ZeroAI đã chọn lọc các món quà tặng cho ${intent.recipientNoun}${priceText} ý nghĩa và bán chạy nhất trên ZeroMall nè ✨ Bạn xem thử các mẫu này nhé:`;
    }

    return `Dạ, ZeroAI gửi bạn ${count} sản phẩm phù hợp nhất với yêu cầu của bạn${priceText}. Bạn xem thử các mẫu này có ưng ý không nhé! ✨`;
  }

  private getDefaultQuickReplies(intent: any): string[] {
    // Nếu tìm áo tặng người yêu hoặc quà tặng chưa rõ giới tính
    if (intent.itemNoun === 'áo' && (intent.recipientNoun === 'người yêu' || intent.isAmbiguousRecipient)) {
      return ['👨 Áo tặng Bạn trai', '👩 Áo tặng Bạn gái', '👫 Áo đôi Unisex'];
    }
    if (intent.targetGender === 'UNISEX') {
      return ['Áo bomber nỉ ngoại', 'Xem bảng size', 'Mã giảm giá hôm nay'];
    }
    if (intent.itemNoun === 'balo') {
      return ['Balo chống nước', 'Balo đựng laptop 15.6 inch', 'Balo thời trang học sinh'];
    }
    if (intent.itemNoun === 'túi xách') {
      return ['Túi đeo chéo nữ', 'Túi xách công sở', 'Túi đi chơi phong cách Hàn'];
    }
    if (intent.recipientNoun === 'chồng' || intent.recipientNoun === 'bạn trai' || intent.targetGender === 'NAM') {
      return ['Áo khoác bomber nam', 'Balo nam đa năng', 'Phụ kiện công nghệ cho nam'];
    }
    if (intent.recipientNoun === 'vợ' || intent.recipientNoun === 'bạn gái' || intent.targetGender === 'NU') {
      return ['Váy đầm công chúa', 'Túi xách tặng bạn gái', 'Gợi ý quà sinh nhật'];
    }
    return ['Sản phẩm bán chạy nhất', 'Đồ công nghệ hot', 'Mã giảm giá hôm nay'];
  }
}
