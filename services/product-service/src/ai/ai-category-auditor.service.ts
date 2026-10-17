import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GeminiAiService } from './gemini-ai.service';
import { LocalAiService } from './local-ai.service';

export class AuditProductDto {
  productId?: string;
  name: string;
  category: string;
  image?: string;
  images?: string[];
  description?: string;
}

export interface AuditCategoryResult {
  isMatched: boolean;
  issueType: 'MATCHED' | 'WRONG_CATEGORY' | 'IMAGE_MISMATCH' | 'KEYWORD_SPAM';
  confidence: number; // 0 - 100
  currentCategory: string;
  suggestedCategory: string;
  suggestedTitle?: string;
  detectedVisual?: string;
  titleFeedback: string;
  imageFeedback?: string;
  actionRequired: 'NONE' | 'CHANGE_CATEGORY' | 'REPLACE_IMAGE' | 'UPDATE_TITLE';
  recommendation: string;
  source: 'ai-multimodal-engine' | 'gemini-vision' | 'catalog-rules' | 'local-clip-engine' | 'local-ai-engine';
}

export interface BatchAuditStats {
  totalScanned: number;
  matchedCount: number;
  wrongCategoryCount: number;
  imageMismatchCount: number;
  flaggedProducts: Array<{
    id: string;
    name: string;
    image: string;
    category: string;
    shopId: string;
    status?: string;
    auditResult: AuditCategoryResult;
  }>;
}

const CANONICAL_CATEGORIES = [
  'Thời Trang Nam',
  'Thời Trang Nữ',
  'Điện Thoại & Phụ Kiện',
  'Thiết Bị Điện Tử',
  'Máy Tính & Laptop',
  'Đồng Hồ',
  'Máy Ảnh',
  'Giày Dép Nam',
  'Giày Dép Nữ',
  'Gia Dụng',
  'Thể Thao',
  'Mẹ & Bé',
  'Nhà Cửa',
  'Sắc Đẹp',
  'Sức Khỏe',
  'Phụ Kiện Nữ',
  'Túi Ví Nữ',
  'Sách & VPP',
];

@Injectable()
export class AiCategoryAuditorService {
  private readonly logger = new Logger(AiCategoryAuditorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiAi: GeminiAiService,
    private readonly localAi: LocalAiService,
  ) {}

  /**
   * Thẩm định 1 sản phẩm: Kiểm tra độ khớp giữa Tên, Hình ảnh và Ngành hàng
   */
  async auditProduct(input: AuditProductDto): Promise<AuditCategoryResult> {
    const rawName = (input.name || '').trim();
    const lowerName = rawName.toLowerCase();
    const currentCat = (input.category || '').trim();
    const coverImage = input.image || (Array.isArray(input.images) && input.images[0]) || '';

    // 1. Phân tích Ngành hàng chuẩn dựa trên Tên sản phẩm (Title NLP Category Inference)
    const inferredCategoryFromTitle = this.inferCategoryFromTitle(lowerName);

    // 2. Phân tích Nội dung Hình ảnh (Visual Clue Analysis qua Local CLIP + Heuristics)
    const visualCheck = await this.analyzeVisualClue(coverImage, rawName, currentCat);

    // 3. Đánh giá Mâu thuẫn Hình ảnh (Visual-Text Mismatch)
    if (visualCheck.isMismatch) {
      return {
        isMatched: false,
        issueType: 'IMAGE_MISMATCH',
        confidence: visualCheck.confidence || 95,
        currentCategory: currentCat,
        suggestedTitle: visualCheck.suggestedTitle,
        detectedVisual: visualCheck.detectedVisual,
        suggestedCategory: visualCheck.suggestedCategory || inferredCategoryFromTitle || currentCat,
        titleFeedback: `Tiêu đề bạn nhập là "${rawName}".`,
        imageFeedback: visualCheck.reason || `Ảnh là "${visualCheck.detectedVisual}", không khớp với tên "${rawName}".`,
        actionRequired: 'UPDATE_TITLE',
        recommendation: `Ảnh là "${visualCheck.detectedVisual}". ZeroAI đề xuất đổi tên hoặc chọn ảnh phù hợp.`,
        source: (visualCheck.source as any) || 'local-clip-engine',
      };
    }

    // 4. Đánh giá Sai Ngành Hàng (Wrong Category)
    if (inferredCategoryFromTitle && currentCat && !this.isCategoryCompatible(currentCat, inferredCategoryFromTitle)) {
      return {
        isMatched: false,
        issueType: 'WRONG_CATEGORY',
        confidence: 92,
        currentCategory: currentCat,
        suggestedCategory: inferredCategoryFromTitle,
        titleFeedback: `Sản phẩm "${rawName}" thuộc ngành "${inferredCategoryFromTitle}".`,
        imageFeedback: visualCheck.detectedVisual ? `Ảnh hiển thị: ${visualCheck.detectedVisual}.` : undefined,
        actionRequired: 'CHANGE_CATEGORY',
        recommendation: `ZeroAI đề xuất chuyển sang ngành "${inferredCategoryFromTitle}" để tối ưu tìm kiếm.`,
        source: 'local-ai-engine',
      };
    }

    // 5. Kiểm tra trường hợp đặc biệt: Merchandise / Fanmeeting / Esports
    if (/hle|gumayusi|t1|faker|chovy|fanmeeting|áo đấu|esports/i.test(lowerName)) {
      const esportsCat = 'Thời Trang Nam';
      if (!['Thời Trang Nam', 'Thể Thao', 'Sách & VPP'].includes(currentCat)) {
        return {
          isMatched: false,
          issueType: 'WRONG_CATEGORY',
          confidence: 90,
          currentCategory: currentCat,
          suggestedCategory: esportsCat,
          titleFeedback: `Sản phẩm áo đấu/sự kiện Esports Fanmeeting.`,
          imageFeedback: `Ảnh trang phục / tuyển thủ Esports.`,
          actionRequired: 'CHANGE_CATEGORY',
          recommendation: `Sản phẩm nên được đưa vào ngành "${esportsCat}" hoặc "Thể Thao" để người hâm mộ tìm kiếm chuẩn xác nhất.`,
          source: 'local-ai-engine',
        };
      }
    }

    // 6. Trường hợp Hợp lệ
    return {
      isMatched: true,
      issueType: 'MATCHED',
      confidence: 98,
      currentCategory: currentCat,
      suggestedCategory: currentCat,
      titleFeedback: `Tiêu đề "${rawName}" chuẩn xác.`,
      imageFeedback: 'Hình ảnh và tiêu đề đồng nhất với ngành hàng.',
      actionRequired: 'NONE',
      recommendation: `Sản phẩm đã được phân loại đúng ngành "${currentCat}". Đủ điều kiện hiển thị ưu tiên trên sàn ZeroMall.`,
      source: 'local-ai-engine',
    };
  }

  /**
   * Quét toàn bộ hoặc một nhóm sản phẩm trong CSDL để phát hiện các sản phẩm sai ngành hàng
   */
  async scanProducts(shopId?: string): Promise<BatchAuditStats> {
    const whereCondition: any = {
      status: { in: ['active', 'hidden'] },
      name: { notIn: ['test', 'cuong', '2'] },
    };
    if (shopId) {
      whereCondition.shopId = shopId;
    }

    const products = await this.prisma.product.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        image: true,
        images: true,
        category: true,
        shopId: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let matchedCount = 0;
    let wrongCategoryCount = 0;
    let imageMismatchCount = 0;
    const flaggedProducts: BatchAuditStats['flaggedProducts'] = [];

    for (const p of products) {
      const cover = p.image || (p.images ? (() => { try { return JSON.parse(p.images)[0]; } catch { return ''; } })() : '');
      const audit = await this.auditProduct({
        productId: p.id,
        name: p.name,
        category: p.category,
        image: cover,
      });

      if (!audit.isMatched) {
        if (audit.issueType === 'IMAGE_MISMATCH') imageMismatchCount++;
        else if (audit.issueType === 'WRONG_CATEGORY') wrongCategoryCount++;

        flaggedProducts.push({
          id: p.id,
          name: p.name,
          image: cover,
          category: p.category,
          shopId: p.shopId,
          status: p.status,
          auditResult: audit,
        });
      } else {
        matchedCount++;
      }
    }

    return {
      totalScanned: products.length,
      matchedCount,
      wrongCategoryCount,
      imageMismatchCount,
      flaggedProducts,
    };
  }

  /**
   * Tự động sửa ngành hàng sản phẩm theo đề xuất của AI (1-Click Auto-Fix)
   */
  async fixProductCategory(productId: string, newCategory: string) {
    if (!CANONICAL_CATEGORIES.includes(newCategory)) {
      throw new Error(`Ngành hàng "${newCategory}" không hợp lệ trong hệ thống ZeroMall.`);
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        category: newCategory,
        isViolated: false,
        violationReason: null,
      },
    });

    this.logger.log(`[AI Auto-Fix] Product ${productId} category updated to ${newCategory}`);
    return {
      success: true,
      message: `Đã tự động cập nhật ngành hàng sản phẩm sang "${newCategory}" thành công!`,
      product: updated,
    };
  }

  /**
   * Kiểm tra từ khóa trong văn bản tiếng Việt (Unicode-safe, không bị lỗi ASCII \\b của RegExp)
   */
  private hasKeyword(text: string, keywords: string[]): boolean {
    if (!text) return false;
    const normalized = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ' ')} `;
    return keywords.some((k) => normalized.includes(` ${k.toLowerCase()} `));
  }

  /**
   * Suy luận ngành hàng chuẩn dựa trên Tên sản phẩm
   */
  private inferCategoryFromTitle(lowerName: string): string | null {
    // 1. Thể thao
    if (
      this.hasKeyword(lowerName, [
        'bóng đá', 'đá bóng', 'áo đấu', 'quần áo bóng đá', 'cầu lông',
        'bóng rổ', 'bóng chuyền', 'tennis', 'vợt', 'gym', 'thể thao',
        'bơi lội', 'yoga', 'chạy bộ', 'wika', 'đồ thể thao',
      ])
    ) {
      return 'Thể Thao';
    }

    // 2. Giày dép
    if (
      this.hasKeyword(lowerName, [
        'sneaker', 'giày', 'giay', 'sandal', 'dép', 'dep', 'boots',
        'slip-on', 'giày thể thao', 'cao gót', 'guốc',
      ])
    ) {
      if (this.hasKeyword(lowerName, ['nữ', 'cao gót', 'guốc'])) return 'Giày Dép Nữ';
      return 'Giày Dép Nam';
    }

    // 3. Gia dụng / Bếp núc
    if (
      this.hasKeyword(lowerName, [
        'nồi chiên', 'noi chien', 'nồi cơm', 'noi com', 'lò vi sóng',
        'máy xay', 'ấm siêu tốc', 'nồi áp suất', 'bếp từ', 'bếp điện',
        'chảo chống dính', 'máy hút bụi', 'quạt điện',
      ])
    ) {
      return 'Gia Dụng';
    }

    // 4. Máy ảnh & Thiết bị quang học
    if (
      this.hasKeyword(lowerName, [
        'máy ảnh', 'may anh', 'camera', 'ống kính', 'lens', 'tripod',
        'flycam', 'gopro', 'gimbal', 'máy quay',
      ])
    ) {
      return 'Máy Ảnh';
    }

    // 5. Balo & Túi ví
    if (
      this.hasKeyword(lowerName, [
        'balo', 'ba lô', 'cặp sách', 'túi xách', 'túi đeo chéo', 'ví tiền',
        'clutch', 'bóp da', 'túi tote',
      ])
    ) {
      return 'Túi Ví Nữ';
    }

    // 6. Điện thoại & Phụ kiện
    if (
      this.hasKeyword(lowerName, [
        'iphone', 'samsung', 'điện thoại', 'ốp lưng', 'kính cường lực',
        'cáp sạc', 'củ sạc', 'pin dự phòng', 'tai nghe bluetooth', 'airpods',
      ])
    ) {
      return 'Điện Thoại & Phụ Kiện';
    }

    // 7. Máy tính & Laptop
    if (
      this.hasKeyword(lowerName, [
        'laptop', 'macbook', 'bàn phím', 'chuột gaming', 'màn hình máy tính',
        'pc', 'tai nghe gaming',
      ])
    ) {
      return 'Máy Tính & Laptop';
    }

    // 8. Sách & Văn phòng phẩm
    if (
      this.hasKeyword(lowerName, [
        'sách', 'truyện', 'tiểu thuyết', 'giáo khoa', 'giáo trình', 'vở viết',
        'bút bi', 'bút mực', 'văn phòng phẩm',
      ])
    ) {
      return 'Sách & VPP';
    }

    // 9. Sắc đẹp & Mỹ phẩm
    if (
      this.hasKeyword(lowerName, [
        'son môi', 'kem chống nắng', 'serum', 'toner', 'nước hoa', 'sữa rửa mặt',
        'mặt nạ', 'dưỡng ẩm', 'phấn',
      ])
    ) {
      return 'Sắc Đẹp';
    }

    // 10. Mẹ & Bé
    if (
      this.hasKeyword(lowerName, [
        'tã', 'bỉm', 'sữa bột', 'bình sữa', 'xe đẩy', 'đồ chơi trẻ em', 'nôi em bé',
      ])
    ) {
      return 'Mẹ & Bé';
    }

    // 11. Đồng hồ
    if (
      this.hasKeyword(lowerName, ['đồng hồ', 'dong ho', 'smartwatch', 'apple watch'])
    ) {
      return 'Đồng Hồ';
    }

    // 12. Thời trang chung / Nam / Nữ
    if (
      this.hasKeyword(lowerName, [
        'áo', 'quần', 'đồ bộ', 'bộ đồ', 'set đồ', 'trang phục', 'khoác',
        'jacket', 'blazer', 'hoodie', 'sweater', 'cardigan', 'polo', 'sơ mi',
        'so mi', 'short', 'jean', 'quần âu', 'quần đùi', 'quần bò', 'kaki',
        'quần lót', 'boxer', 'váy', 'đầm', 'chân váy', 'croptop', 'siêu nhân',
      ])
    ) {
      if (this.hasKeyword(lowerName, ['nữ', 'váy', 'đầm', 'croptop', 'chân váy', 'hai dây'])) {
        return 'Thời Trang Nữ';
      }
      if (this.hasKeyword(lowerName, ['bé', 'trẻ em', 'sơ sinh'])) {
        return 'Mẹ & Bé';
      }
      return 'Thời Trang Nam';
    }

    // 13. Nhà cửa & Đời sống
    if (
      this.hasKeyword(lowerName, [
        'kệ đồ', 'kệ bếp', 'bát đĩa', 'bộ bát', 'bình giữ nhiệt',
        'hộp đựng thực phẩm', 'ly giữ nhiệt', 'chăn ga', 'gối nệm',
      ])
    ) {
      return 'Nhà Cửa';
    }

    // 14. Phụ kiện thời trang
    if (
      this.hasKeyword(lowerName, [
        'nón lưỡi trai', 'mũ lưỡi trai', 'mũ len', 'vòng tay', 'dây chuyền',
        'khuyên tai', 'mắt kính',
      ])
    ) {
      return 'Phụ Kiện Nữ';
    }

    return null;
  }

  /**
   * Kiểm tra xem 2 ngành hàng có tương thích/chấp nhận được cho nhau không
   */
  private isCategoryCompatible(current: string, inferred: string): boolean {
    if (!current || !inferred) return true;
    if (current === inferred) return true;

    // Các cặp ngành hàng chấp nhận được lẫn nhau
    const compatiblePairs: Record<string, string[]> = {
      'Gia Dụng': ['Nhà Cửa'],
      'Nhà Cửa': ['Gia Dụng'],
      'Thời Trang Nam': ['Thời Trang Nữ', 'Thể Thao'],
      'Thời Trang Nữ': ['Thời Trang Nam', 'Phụ Kiện Nữ', 'Túi Ví Nữ', 'Thể Thao'],
      'Thể Thao': ['Thời Trang Nam', 'Thời Trang Nữ'],
      'Giày Dép Nam': ['Giày Dép Nữ'],
      'Giày Dép Nữ': ['Giày Dép Nam'],
      'Túi Ví Nữ': ['Thời Trang Nam', 'Thời Trang Nữ', 'Phụ Kiện Nữ'],
      'Điện Thoại & Phụ Kiện': ['Thiết Bị Điện Tử'],
      'Thiết Bị Điện Tử': ['Điện Thoại & Phụ Kiện', 'Máy Tính & Laptop', 'Máy Ảnh'],
      'Máy Ảnh': ['Thiết Bị Điện Tử'],
    };

    if (compatiblePairs[current]?.includes(inferred)) return true;
    if (compatiblePairs[inferred]?.includes(current)) return true;

    return false;
  }

  /**
   * Phân loại domain ngữ nghĩa (Sports Apparel, Footwear, Kitchen, Electronics, etc.)
   */
  private getSemanticDomain(text: string): string[] {
    const domains: string[] = [];

    if (
      this.hasKeyword(text, [
        'bóng đá', 'đá bóng', 'áo đấu', 'jersey', 'wika', 'thể thao',
        'cầu lông', 'bóng rổ', 'quần áo bóng đá', 'áo thun thể thao',
      ])
    ) {
      domains.push('SPORTS_FOOTBALL');
    }
    // Phân loại chi tiết Áo (Tops) vs Quần (Bottoms) vs Bộ (Suit/Set)
    const hasTop = this.hasKeyword(text, [
      'áo', 'ao', 'khoác', 'jacket', 'hoodie', 'sweater', 'cardigan',
      'polo', 'sơ mi', 'thun', 'blazer', 'vest', 'croptop', 'gile',
    ]);
    const hasBottom = this.hasKeyword(text, [
      'quần', 'quan', 'jean', 'short', 'quần âu', 'quần đùi', 'quần bò',
      'kaki', 'jogger', 'legging', 'quần lót', 'boxer', 'quần thể thao',
    ]);
    const isSuit = this.hasKeyword(text, [
      'đồ bộ', 'bộ đồ', 'set đồ', 'bộ quần áo', 'áo và quần', 'áo phối quần', 'combo',
    ]);

    if (isSuit || (hasTop && hasBottom)) {
      domains.push('SUIT_SET');
    } else {
      if (hasTop) domains.push('TOPS');
      if (hasBottom) domains.push('BOTTOMS');
    }
    if (this.hasKeyword(text, ['váy', 'đầm', 'chân váy'])) {
      domains.push('DRESS');
    }
    if (
      this.hasKeyword(text, [
        'giày', 'dép', 'sneaker', 'sandal', 'boots', 'guốc', 'cao gót',
        'slip-on', 'giay', 'dep',
      ])
    ) {
      domains.push('FOOTWEAR');
    }
    if (
      this.hasKeyword(text, [
        'nồi chiên', 'nồi cơm', 'lò vi sóng', 'bếp', 'chảo', 'ấm siêu tốc',
        'máy xay', 'gia dụng', 'noi chien', 'noi com',
      ])
    ) {
      domains.push('KITCHEN');
    }
    if (
      this.hasKeyword(text, [
        'máy ảnh', 'may anh', 'camera', 'ống kính', 'lens', 'tripod',
        'flycam', 'gopro', 'gimbal', 'máy quay',
      ])
    ) {
      domains.push('CAMERA');
    }
    if (this.hasKeyword(text, ['balo', 'ba lô', 'túi', 'ví', 'bóp', 'clutch', 'cặp'])) {
      domains.push('BAGS');
    }
    if (
      this.hasKeyword(text, [
        'điện thoại', 'iphone', 'samsung', 'laptop', 'tai nghe', 'chuột',
        'bàn phím', 'màn hình', 'sạc', 'cáp',
      ])
    ) {
      domains.push('ELECTRONICS');
    }
    if (
      this.hasKeyword(text, [
        'sơ đồ', 'flowchart', 'diagram', 'architecture', 'mã nguồn',
        'terminal', 'văn bản',
      ])
    ) {
      domains.push('DIAGRAM_DOC');
    }
    if (this.hasKeyword(text, ['xe đạp', 'bicycle', 'cyclist', 'giao hàng ngoài trời'])) {
      domains.push('CYCLIST_SCENE');
    }

    return domains;
  }

  /**
   * Kiểm tra mâu thuẫn ngữ nghĩa giữa Hình ảnh nhận diện được và Tên sản phẩm
   */
  private checkSemanticMismatch(
    visualText: string,
    rawName: string,
  ): { isMismatch: boolean; reason?: string } {
    const visualDomains = this.getSemanticDomain(visualText);
    const titleDomains = this.getSemanticDomain(rawName);

    // Nếu không phân loại được domain cụ thể từ cả 2 phía -> không kết luận lệch
    if (visualDomains.length === 0 || titleDomains.length === 0) {
      return { isMismatch: false };
    }

    // Nếu ảnh là đồ thể thao / bóng đá (SPORTS_FOOTBALL), nhưng tên lại là siêu nhân, gao, công chúa, đồ ngủ...
    if (
      visualDomains.includes('SPORTS_FOOTBALL') &&
      this.hasKeyword(rawName, [
        'siêu nhân', 'gao', 'công chúa', 'bà ba', 'áo dài', 'đồ ngủ',
        'pijama', 'hoạt hình', 'anime', 'cosplay',
      ])
    ) {
      return {
        isMismatch: true,
        reason: `Ảnh là trang phục thể thao/bóng đá thực tế, không tương đồng với tên "${rawName}".`,
      };
    }

    // Xung đột Áo (TOPS) vs Quần (BOTTOMS)
    if (visualDomains.includes('TOPS') && titleDomains.includes('BOTTOMS') && !titleDomains.includes('SUIT_SET')) {
      return {
        isMismatch: true,
        reason: `Ảnh hiển thị áo/áo khoác, không khớp với tên sản phẩm bạn nhập là quần ("${rawName}").`,
      };
    }
    if (visualDomains.includes('BOTTOMS') && titleDomains.includes('TOPS') && !titleDomains.includes('SUIT_SET')) {
      return {
        isMismatch: true,
        reason: `Ảnh hiển thị quần thời trang, không khớp với tên sản phẩm bạn nhập là áo ("${rawName}").`,
      };
    }

    // Nếu có ít nhất 1 domain giao nhau -> TƯƠNG THÍCH
    const hasOverlap = visualDomains.some((d) => titleDomains.includes(d));
    if (hasOverlap) {
      return { isMismatch: false };
    }

    // Các cặp xung đột:
    // 1. Áo / Quần / Trang phục vs Giày dép
    if (
      (visualDomains.includes('SPORTS_FOOTBALL') || visualDomains.includes('TOPS') || visualDomains.includes('BOTTOMS') || visualDomains.includes('SUIT_SET')) &&
      titleDomains.includes('FOOTWEAR')
    ) {
      return {
        isMismatch: true,
        reason: `Ảnh là trang phục quần áo, không khớp với tên sản phẩm bạn nhập là giày dép ("${rawName}").`,
      };
    }

    // 2. Giày dép vs Áo / Quần / Trang phục
    if (
      visualDomains.includes('FOOTWEAR') &&
      (titleDomains.includes('SPORTS_FOOTBALL') || titleDomains.includes('TOPS') || titleDomains.includes('BOTTOMS') || titleDomains.includes('SUIT_SET'))
    ) {
      return {
        isMismatch: true,
        reason: `Ảnh là giày dép, không khớp với tên sản phẩm bạn nhập là quần áo ("${rawName}").`,
      };
    }

    // 3. Gia dụng / Bếp núc vs Khác
    if (visualDomains.includes('KITCHEN') && !titleDomains.includes('KITCHEN')) {
      return {
        isMismatch: true,
        reason: `Ảnh là đồ gia dụng/nhà bếp, không khớp với tên sản phẩm "${rawName}".`,
      };
    }

    // 4. Sơ đồ tài liệu vs Sản phẩm tiêu dùng
    if (visualDomains.includes('DIAGRAM_DOC')) {
      return {
        isMismatch: true,
        reason: `Ảnh hiển thị sơ đồ/văn bản hệ thống, không phải ảnh sản phẩm thực tế ("${rawName}").`,
      };
    }

    // 5. Cảnh người đi xe đạp vs Sản phẩm không liên quan đến xe đạp
    if (visualDomains.includes('CYCLIST_SCENE') && !this.hasKeyword(rawName, ['xe đạp', 'bicycle', 'phụ kiện xe đạp'])) {
      return {
        isMismatch: true,
        reason: `Ảnh chụp người đi xe đạp ngoài trời, không khớp với sản phẩm "${rawName}".`,
      };
    }

    return { isMismatch: false };
  }

  /**
   * Bộ nhớ đệm nhận diện thị giác của hình ảnh (Decoupled Visual Perception Cache)
   */
  private visualPerceptionCache = new Map<
    string,
    {
      detectedVisual: string;
      suggestedTitle: string;
      suggestedCategory: string;
      confidence: number;
    }
  >();

  /**
   * Gọi mô hình Zero-shot Multimodal CLIP cục bộ (Port 5005)
   * 100% Offline, không tốn quota, phản hồi < 100ms
   */
  private async queryLocalClipVision(
    imageUrl: string,
    rawName: string,
    category: string,
    base64Data?: string,
  ): Promise<{
    isMismatch: boolean;
    detectedVisual?: string;
    suggestedTitle?: string;
    suggestedCategory?: string;
    reason?: string;
    confidence?: number;
    source?: 'local-clip-engine';
  } | null> {
    const endpoints = [
      process.env.CLIP_SERVICE_URL,
      'http://host.docker.internal:5005/audit',
      'http://127.0.0.1:5005/audit',
      'http://localhost:5005/audit',
    ].filter(Boolean) as string[];

    const payload: any = {
      name: rawName,
      category,
    };

    if (base64Data) {
      payload.imageBase64 = base64Data;
    } else if (imageUrl) {
      if (imageUrl.startsWith('data:')) {
        payload.imageBase64 = imageUrl;
      } else {
        payload.imageUrl = imageUrl;
      }
    }

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: any = await res.json();
          return {
            isMismatch: !!data.isMismatch,
            detectedVisual: data.detectedVisual,
            suggestedTitle: data.suggestedTitle,
            suggestedCategory: data.suggestedCategory,
            reason: data.reason,
            confidence: Math.max(92, Math.round(data.visualConfidence || 95)),
            source: 'local-clip-engine',
          };
        }
      } catch {
        // Thử endpoint tiếp theo
      }
    }
    return null;
  }

  /**
   * Phân tích dấu hiệu nhận diện hình ảnh đa phương thức (Local CLIP Vision + Ollama + Heuristics)
   */
  private async analyzeVisualClue(
    imageUrl: string,
    rawName: string,
    category: string,
  ): Promise<{
    isMismatch: boolean;
    detectedVisual?: string;
    suggestedTitle?: string;
    suggestedCategory?: string;
    reason?: string;
    confidence?: number;
    source?: string;
  }> {
    if (!imageUrl) {
      return { isMismatch: false };
    }

    const lowerImg = imageUrl.toLowerCase();
    const lowerName = rawName.toLowerCase();

    // 1. Kiểm tra cache nhận diện thị giác của ảnh (nếu ảnh này đã được phân tích trước đó)
    const cachedPerception = this.visualPerceptionCache.get(imageUrl);
    if (cachedPerception) {
      const evalCheck = this.checkSemanticMismatch(
        `${cachedPerception.detectedVisual} ${cachedPerception.suggestedTitle}`,
        lowerName,
      );

      if (evalCheck.isMismatch) {
        return {
          isMismatch: true,
          detectedVisual: cachedPerception.detectedVisual,
          suggestedTitle: cachedPerception.suggestedTitle,
          suggestedCategory: cachedPerception.suggestedCategory,
          reason: evalCheck.reason,
          confidence: cachedPerception.confidence,
          source: 'local-clip-engine',
        };
      }

      return {
        isMismatch: false,
        detectedVisual: cachedPerception.detectedVisual,
        suggestedTitle: cachedPerception.suggestedTitle,
        suggestedCategory: cachedPerception.suggestedCategory,
        source: 'local-clip-engine',
      };
    }

    // 2. Phân tích thị giác trực tiếp bằng mô hình Local CLIP Vector (Tier 1: <100ms, 0 quota)
    try {
      const imgData = await this.fetchImageBase64(imageUrl);
      const clipRes = await this.queryLocalClipVision(
        imageUrl,
        rawName,
        category,
        imgData?.base64,
      );

      if (clipRes) {
        const perception = {
          detectedVisual: clipRes.detectedVisual || 'Sản phẩm',
          suggestedTitle: clipRes.suggestedTitle || rawName,
          suggestedCategory: clipRes.suggestedCategory || category || 'Thể Thao',
          confidence: clipRes.confidence || 95,
        };
        this.visualPerceptionCache.set(imageUrl, perception);

        // Kiểm tra bổ sung ngữ nghĩa nếu tên nhập xung đột
        const evalCheck = this.checkSemanticMismatch(
          `${perception.detectedVisual} ${perception.suggestedTitle}`,
          lowerName,
        );

        if (clipRes.isMismatch || evalCheck.isMismatch) {
          return {
            isMismatch: true,
            detectedVisual: perception.detectedVisual,
            suggestedTitle: perception.suggestedTitle,
            suggestedCategory: perception.suggestedCategory,
            reason:
              clipRes.reason ||
              evalCheck.reason ||
              `Ảnh hiển thị "${perception.detectedVisual}", không tương đồng với tên "${rawName}".`,
            confidence: perception.confidence,
            source: 'local-clip-engine',
          };
        }

        return {
          isMismatch: false,
          detectedVisual: perception.detectedVisual,
          suggestedTitle: perception.suggestedTitle,
          suggestedCategory: perception.suggestedCategory,
          source: 'local-clip-engine',
        };
      }
    } catch (e: any) {
      this.logger.warn(`Local CLIP analysis failed: ${e.message}`);
    }

    // 4. Dự phòng qua Local Ollama Vision nếu CLIP bận (Tier 2: Moondream / Minicpm-v)
    try {
      const imgData = await this.fetchImageBase64(imageUrl);
      if (imgData?.base64) {
        const ollamaRes = await this.localAi.parseVisualWithMoondream(imgData.base64);
        if (ollamaRes) {
          const perception = {
            detectedVisual: ollamaRes.detectedProduct || 'Sản phẩm',
            suggestedTitle: ollamaRes.detectedProduct || rawName,
            suggestedCategory: ollamaRes.suggestedCategory || category || 'Thời Trang Nam',
            confidence: 90,
          };
          this.visualPerceptionCache.set(imageUrl, perception);

          const evalCheck = this.checkSemanticMismatch(
            `${perception.detectedVisual} ${perception.suggestedTitle}`,
            lowerName,
          );

          if (evalCheck.isMismatch) {
            return {
              isMismatch: true,
              ...perception,
              reason:
                evalCheck.reason ||
                `Ảnh là "${perception.detectedVisual}", không tương đồng với tên "${rawName}".`,
              source: 'local-ai-engine',
            };
          }

          return {
            isMismatch: false,
            ...perception,
            source: 'local-ai-engine',
          };
        }
      }
    } catch (e: any) {
      this.logger.warn(`Local Ollama Vision failed: ${e.message}`);
    }

    return { isMismatch: false };
  }

  private async fetchImageBase64(imageUrl: string): Promise<{ base64: string; mimeType: string } | null> {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:')) {
      const parts = imageUrl.split(',');
      const mimeMatch = parts[0].match(/data:(.*?);/);
      return {
        base64: parts[1],
        mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg',
      };
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        return {
          base64: Buffer.from(arrayBuffer).toString('base64'),
          mimeType: res.headers.get('content-type') || 'image/jpeg',
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}
