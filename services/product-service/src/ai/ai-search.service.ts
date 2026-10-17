import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LocalAiService } from './local-ai.service';
import { GeminiAiService } from './gemini-ai.service';
import {
  AiSemanticSearchDto,
  AiVisualSearchDto,
  SemanticSearchResult,
  VisualSearchResult,
  SearchStatsResult,
} from './ai.types';

function createSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly localAi: LocalAiService,
    private readonly geminiAi: GeminiAiService,
  ) {}

  /**
   * =========================================================================
   * 1. TÌM KIẾM NGỮ NGHĨA (SEMANTIC SEARCH)
   * Sử dụng Local AI Engine có sẵn (không train) + Cloud Gemini hỗ trợ
   * =========================================================================
   */
  async searchSemantic(dto: AiSemanticSearchDto): Promise<SemanticSearchResult> {
    const rawQuery = (dto.query || '').trim();
    if (!rawQuery) {
      return {
        query: '',
        detectedIntent: 'Truy vấn trống',
        expandedKeywords: [],
        products: [],
        totalMatches: 0,
        source: 'local-ai-engine',
      };
    }

    const limit = Math.min(dto.limit || 30, 60);

    // 1. Dùng Local AI có sẵn phân tích ngữ nghĩa thô ngay lập tức (0ms delay)
    const localParsed = this.localAi.parseQuery(rawQuery);

    // -------------------------------------------------------------------------
    // BƯỚC 1: TRA CỨU BỘ NÃO TRI THỨC ZEROAI (ĐÃ HỌC TỪ CÁC LẦN TRƯỚC)
    // Nếu đã học cụm từ này -> TRẢ VỀ NGAY (0ms delay, 0 tốn token Gemini/Ollama)
    // -------------------------------------------------------------------------
    try {
      const existingKnowledge = await this.prisma.aiSearchKnowledge.findFirst({
        where: { searchType: 'SEMANTIC', queryKey: localParsed.normalizedQuery },
      });

      if (existingKnowledge) {
        this.prisma.aiSearchKnowledge.update({
          where: { id: existingKnowledge.id },
          data: { hitCount: { increment: 1 }, updatedAt: new Date() },
        }).catch(() => {});

        let cachedKeywords: string[] = [];
        try {
          cachedKeywords = JSON.parse(existingKnowledge.expandedKeywords);
        } catch {
          cachedKeywords = localParsed.expandedKeywords;
        }

        const products = await this.fetchAndScoreProducts(
          cachedKeywords,
          existingKnowledge.suggestedCategory || undefined,
          existingKnowledge.priceRangeMin || undefined,
          existingKnowledge.priceRangeMax || undefined,
          limit,
          false
        );

        return {
          query: rawQuery,
          detectedIntent: existingKnowledge.detectedIntent || localParsed.detectedIntent,
          suggestedCategory: existingKnowledge.suggestedCategory || localParsed.suggestedCategory,
          expandedKeywords: cachedKeywords.slice(0, 10),
          priceRange: { min: existingKnowledge.priceRangeMin || undefined, max: existingKnowledge.priceRangeMax || undefined },
          products,
          totalMatches: products.length,
          source: 'local-knowledge',
          hitCount: existingKnowledge.hitCount + 1,
          message: `🎯 Khớp từ Bộ Não Tri Thức ZeroAI (Đã học • 0ms • Tiết kiệm 100% Token)`,
        };
      }
    } catch {
      // Tiếp tục nếu chưa có trong CSDL
    }

    // -------------------------------------------------------------------------
    // BƯỚC 2: NẾU BỘ NÃO CHƯA CÓ -> MỚI GỌI GEMINI HOẶC OLLAMA ĐỂ GIẢI MÃ
    // -------------------------------------------------------------------------
    let geminiResult: any = null;
    const apiKey = dto.customApiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiResult = await this.geminiAi.parseSemantic(apiKey, rawQuery, dto.category || localParsed.suggestedCategory);
    }

    // Hợp nhất từ khóa tìm kiếm
    let detectedIntent = localParsed.detectedIntent;
    let suggestedCategory = dto.category || localParsed.suggestedCategory;
    let expandedKeywords = [...localParsed.expandedKeywords];
    let priceRangeMin = localParsed.priceRangeMin;
    let priceRangeMax = localParsed.priceRangeMax;
    let source: 'gemini-ai' | 'local-ai-engine' = 'local-ai-engine';

    if (geminiResult) {
      source = 'gemini-ai';
      if (geminiResult.detectedIntent) detectedIntent = geminiResult.detectedIntent;
      if (geminiResult.suggestedCategory && suggestedCategory === 'Tất cả danh mục') {
        suggestedCategory = geminiResult.suggestedCategory;
      }
      if (Array.isArray(geminiResult.expandedKeywords)) {
        expandedKeywords = [...new Set([...expandedKeywords, ...geminiResult.expandedKeywords])];
      }
      if (typeof geminiResult.priceRangeMin === 'number') priceRangeMin = geminiResult.priceRangeMin;
      if (typeof geminiResult.priceRangeMax === 'number') priceRangeMax = geminiResult.priceRangeMax;
    } else {
      // Tầng 2: Gọi Ollama Qwen2.5 Local trên Mac nếu Gemini hết quota
      const ollamaResult = await this.localAi.parseSemanticWithOllama(rawQuery);
      if (ollamaResult) {
        if (ollamaResult.detectedIntent) detectedIntent = ollamaResult.detectedIntent;
        if (ollamaResult.suggestedCategory && suggestedCategory === 'Tất cả danh mục') {
          suggestedCategory = ollamaResult.suggestedCategory;
        }
        if (Array.isArray(ollamaResult.expandedKeywords) && ollamaResult.expandedKeywords.length > 0) {
          expandedKeywords = [...new Set([...expandedKeywords, ...ollamaResult.expandedKeywords])];
        }
      }
    }

    // Tìm kiếm và chấm điểm sản phẩm thực tế từ PostgreSQL
    const products = await this.fetchAndScoreProducts(
      expandedKeywords,
      suggestedCategory,
      priceRangeMin,
      priceRangeMax,
      limit,
      false
    );

    // -------------------------------------------------------------------------
    // BƯỚC 3: ĐỒNG THỜI HUẤN LUYỆN / NẠP TRI THỨC VÀO BỘ NÃO CHO LẦN SAU (0 TOKEN)
    // -------------------------------------------------------------------------
    this.cacheSearchResult('SEMANTIC', localParsed.normalizedQuery, rawQuery, detectedIntent, expandedKeywords, suggestedCategory, products.map(p => p.id), source).catch(() => {});

    return {
      query: rawQuery,
      detectedIntent,
      suggestedCategory,
      expandedKeywords: expandedKeywords.slice(0, 10),
      priceRange: { min: priceRangeMin, max: priceRangeMax },
      products,
      totalMatches: products.length,
      source,
      message: source === 'gemini-ai' ? '✨ Đã phân tích qua Gemini AI & Nạp vào Bộ Não Tri Thức' : '🧠 Đã phân tích qua ZeroAI Local Engine',
    };
  }

  /**
   * =========================================================================
   * 2. TÌM KIẾM BẰNG HÌNH ẢNH (VISUAL SEARCH)
   * =========================================================================
   */
  async searchVisual(dto: AiVisualSearchDto): Promise<VisualSearchResult> {
    let base64Data = (dto.imageBase64 || '').trim();
    let mimeType = dto.mimeType || 'image/jpeg';
    const limit = Math.min(dto.limit || 30, 60);

    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    if (!base64Data && dto.imageUrl) {
      try {
        const imgRes = await fetch(dto.imageUrl);
        const arrayBuf = await imgRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuf).toString('base64');
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      } catch (e: any) {
        this.logger.error(`Tải ảnh thất bại: ${e.message}`);
      }
    }

    if (!base64Data) {
      return {
        visualAnalysis: { detectedProduct: 'Không có ảnh', dominantColors: [], searchTerms: [] },
        products: [],
        totalMatches: 0,
        source: 'local-ai-engine',
        message: 'Vui lòng cung cấp hình ảnh hợp lệ.',
      };
    }

    const imageSig = createSimpleHash(base64Data.substring(0, 200) + base64Data.length);

    // -------------------------------------------------------------------------
    // BƯỚC 1: TÌM KIẾM VECTOR QUANG HỌC (CLIP-ViT-B-32 + PGVECTOR)
    // Tương tự công nghệ tìm kiếm bằng hình ảnh của Shopee / Taobao
    // So sánh trực tiếp đặc trưng thị giác quang học thay vì đoán từ ngữ
    // -------------------------------------------------------------------------
    try {
      const clipUrl = process.env.CLIP_SERVICE_URL || 'http://host.docker.internal:5005';
      const embedPayload = dto.imageUrl ? { imageUrl: dto.imageUrl } : { imageBase64: base64Data };
      const clipRes = await fetch(`${clipUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedPayload),
      });

      if (clipRes.ok) {
        const clipData: any = await clipRes.json();
        if (Array.isArray(clipData.embedding) && clipData.embedding.length === 512) {
          const vectorProducts = await this.searchByImageVector(clipData.embedding, limit, 74.0);
          if (vectorProducts.length > 0) {
            const topProd = vectorProducts[0];
            return {
              visualAnalysis: {
                detectedProduct: topProd.name,
                suggestedCategory: topProd.category,
                dominantColors: [],
                searchTerms: [topProd.name, topProd.category].filter(Boolean),
              },
              products: vectorProducts,
              totalMatches: vectorProducts.length,
              source: 'clip-vector-engine',
              message: '⚡ Tìm kiếm quang học chuẩn xác bằng Vector Embeddings (CLIP-ViT-B-32)',
            };
          } else {
            return {
              visualAnalysis: {
                detectedProduct: 'Không tìm thấy sản phẩm tương đồng',
                dominantColors: [],
                searchTerms: [],
              },
              products: [],
              totalMatches: 0,
              source: 'clip-vector-engine',
              message: 'ZeroAI không tìm thấy sản phẩm nào trên sàn có hình ảnh tương đồng.',
            };
          }
        }
      }
    } catch (clipErr: any) {
      this.logger.warn(`CLIP microservice không phản hồi: ${clipErr.message}`);
    }

    // -------------------------------------------------------------------------
    // BƯỚC 2: TRA CỨU BỘ NÃO THỊ GIÁC ZEROAI (ẢNH ĐÃ ĐƯỢC NHẬN DIỆN TRƯỚC ĐÓ)
    // Nếu ảnh này đã quét qua -> TRẢ VỀ NGAY (0ms delay, 0 tốn token Gemini/Ollama)
    // -------------------------------------------------------------------------
    try {
      const existingVisual = await this.prisma.aiSearchKnowledge.findFirst({
        where: { searchType: 'VISUAL', queryKey: imageSig },
      });

      if (existingVisual) {
        this.prisma.aiSearchKnowledge.update({
          where: { id: existingVisual.id },
          data: { hitCount: { increment: 1 }, updatedAt: new Date() },
        }).catch(() => {});

        let cachedTerms: string[] = [];
        try {
          cachedTerms = JSON.parse(existingVisual.expandedKeywords);
        } catch {
          cachedTerms = [existingVisual.detectedIntent || 'Sản phẩm tương tự'];
        }

        const matchedProducts = await this.fetchAndScoreProducts(
          cachedTerms,
          existingVisual.suggestedCategory || undefined,
          undefined,
          undefined,
          limit,
          true
        );

        return {
          visualAnalysis: {
            detectedProduct: existingVisual.detectedIntent || 'Sản phẩm tương tự',
            suggestedCategory: existingVisual.suggestedCategory || undefined,
            dominantColors: [],
            searchTerms: cachedTerms,
          },
          products: matchedProducts,
          totalMatches: matchedProducts.length,
          source: 'local-knowledge',
          hitCount: existingVisual.hitCount + 1,
          message: `🎯 Khớp từ Bộ Não Thị Giác ZeroAI (Đã học • 0ms • 0 Token)`,
        };
      }
    } catch {
      // Tiếp tục nếu chưa có trong bộ nhớ thị giác
    }

    // -------------------------------------------------------------------------
    // BƯỚC 2: NẾU BỘ NÃO CHƯA CÓ -> GỌI GEMINI HOẶC OLLAMA ĐỂ PHÂN TÍCH
    // -------------------------------------------------------------------------
    const apiKey = dto.customApiKey || process.env.GEMINI_API_KEY;
    let visualParsed = await this.geminiAi.parseVisual(apiKey, base64Data, mimeType);
    let visualSource: 'gemini-ai' | 'local-ai-engine' = 'gemini-ai';

    // Nếu Gemini không phản hồi, gọi Ollama Vision Local trên Mac M4
    // Thứ tự: minicpm-v (OCR tốt) → moondream (nhẹ) → Qwen2.5 (mở rộng keyword)
    if (!visualParsed) {
      const ollamaVisual = await this.localAi.parseVisualWithMoondream(base64Data);
      if (ollamaVisual) {
        visualParsed = {
          detectedProduct: ollamaVisual.detectedProduct,
          searchTerms: ollamaVisual.searchTerms,
          suggestedCategory: ollamaVisual.suggestedCategory || undefined,
          dominantColors: [],
        } as any;
        visualSource = 'local-ai-engine';
      }
    }

    if (!visualParsed) {
      return {
        visualAnalysis: {
          detectedProduct: 'Mô hình AI Vision đang bận',
          dominantColors: [],
          searchTerms: [],
        },
        products: [],
        totalMatches: 0,
        source: 'local-ai-engine',
        message: 'Hệ thống AI Vision tạm thời quá tải. Vui lòng bấm thử lại sau 3-5 giây.',
      };
    }

    const detectedProduct = visualParsed.detectedProduct || 'Sản phẩm tương tự';
    const suggestedCategory = visualParsed.suggestedCategory;
    const dominantColors = visualParsed.dominantColors || [];
    const searchTerms = Array.isArray(visualParsed.searchTerms) && visualParsed.searchTerms.length > 0
      ? visualParsed.searchTerms
      : [detectedProduct];

    // Tìm kiếm trong CSDL
    const matchedProducts = await this.fetchAndScoreProducts(searchTerms, suggestedCategory, undefined, undefined, limit, true);

    // -------------------------------------------------------------------------
    // BƯỚC 3: ĐỒNG THỜI NẠP TRI THỨC THỊ GIÁC CHO LẦN SAU (0 TOKEN)
    // -------------------------------------------------------------------------
    this.cacheSearchResult('VISUAL', imageSig, detectedProduct, detectedProduct, searchTerms, suggestedCategory, matchedProducts.map(p => p.id), visualSource).catch(() => {});

    return {
      visualAnalysis: {
        detectedProduct,
        suggestedCategory,
        dominantColors,
        style: visualParsed.style,
        material: visualParsed.material,
        gender: visualParsed.gender,
        searchTerms,
      },
      products: matchedProducts,
      totalMatches: matchedProducts.length,
      source: 'gemini-ai',
      message: '📸 ZeroAI Visual Vision đã phân tích chi tiết hình ảnh',
    };
  }

  /**
   * Truy vấn sản phẩm bằng vector đặc trưng quang học (512 chiều từ CLIP-ViT-B-32)
   * Sử dụng pgvector HNSW index và toán tử Cosine Distance <=>
   */
  async searchByImageVector(
    embedding: number[],
    limit: number = 30,
    minScore: number = 74.0,
  ): Promise<any[]> {
    try {
      const vecStr = `[${embedding.join(',')}]`;
      const rawResults: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT p.id, p.name, p.price, p."originalPrice", p."costPrice", p.image, p.images, p.category, p."categoryId", p.brand, p.description, p.stock, p.sales, p.status, p."shopId", p.sku,
               ROUND(((1 - (p."imageEmbedding" OPERATOR(public.<=>) $1::public.vector)) * 100)::numeric, 1) as "relevanceScore"
        FROM product."Product" p
        WHERE p.status != 'hidden' AND p."imageEmbedding" IS NOT NULL
        ORDER BY p."imageEmbedding" OPERATOR(public.<=>) $1::public.vector ASC
        LIMIT $2;
      `, vecStr, limit);

      if (!rawResults || rawResults.length === 0) return [];
      const topScore = Number(rawResults[0]?.relevanceScore || 0);
      if (topScore < minScore) return [];

      return rawResults
        .filter((p: any) => Number(p.relevanceScore) >= minScore && (topScore - Number(p.relevanceScore) <= 18.0))
        .map((p: any) => ({
          ...p,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          costPrice: p.costPrice ? Number(p.costPrice) : null,
          stock: Number(p.stock),
          sales: Number(p.sales),
          relevanceScore: Number(p.relevanceScore),
        }));
    } catch (e: any) {
      this.logger.error(`Lỗi truy vấn pgvector: ${e.message}`);
      return [];
    }
  }

  /**
   * =========================================================================
   * 3. TRUY VẤN VÀ CHẤM ĐIỂM SẢN PHẨM THỰC TẾ TỪ POSTGRESQL
   * =========================================================================
   * Logic chấm điểm nghiêm ngặt:
   * - Score bắt đầu từ 0, KHÔNG inflate lên 70 như trước
   * - Mỗi sản phẩm PHẢI có ít nhất 1 keyword substantive match
   * - Nếu 0 keyword match → loại bỏ ngay (không trả về)
   * - Visual search yêu cầu score >= 40 để hiển thị
   * - Category chỉ là bonus, KHÔNG dùng làm OR filter kéo sản phẩm không liên quan
   * =========================================================================
   */
  private async fetchAndScoreProducts(
    searchTerms: string[],
    suggestedCategory?: string,
    priceMin?: number,
    priceMax?: number,
    limit: number = 30,
    isVisual: boolean = false,
  ) {
    const orClauses: any[] = [];
    const termSet = new Set<string>();
    // Tách riêng các từ khóa substantive (không phải generic) để kiểm tra match bắt buộc
    const substantiveTerms = new Set<string>();

    const GENERIC_WORDS = new Set([
      'thoi', 'trang', 'thời', 'trang', 'nam', 'nu', 'nữ', 'cho', 'va', 'và', 'cac', 'các',
      'cua', 'của', 'la', 'là', 'ao', 'áo', 'quan', 'quần', 'do', 'đồ', 'hang', 'hàng',
      'dep', 'đẹp', 'cao', 'cap', 'cấp', 'chinh', 'chính', 'hang', 'hãng', 'the', 'thể', 'thao',
      'bo', 'bộ', 'mau', 'màu', 'cam', 'den', 'đen', 'trang', 'trắng', 'xanh', 'do', 'đỏ',
      'san', 'sản', 'pham', 'phẩm', 'moi', 'mới', 'tot', 'tốt', 'gia', 'giá', 're', 'rẻ',
      'ban', 'bán', 'mua', 'dat', 'đặt', 'tim', 'tìm', 'kiem', 'kiếm', 'tuong', 'tương', 'tu', 'tự',
      'chi', 'tiet', 'tiết', 'vi', 'ví', 'du', 'dụ', 'sau', 'day', 'đây', 'dua', 'dựa', 'tren', 'trên',
      'hinh', 'hình', 'anh', 'ảnh', 'chiec', 'chiếc', 'cai', 'cái', 'co', 'có', 'nay', 'này',
    ]);

    for (const term of searchTerms) {
      const clean = (term || '').trim();
      if (clean.length >= 2) {
        // Bỏ qua các term vô nghĩa là câu mô tả chung chung
        if (clean.length > 50 || clean.includes('dựa trên') || clean.includes('cho thấy')) continue;
        termSet.add(clean);
        // Tách nhỏ cụm từ thành các từ khóa đơn lẻ (bỏ qua từ quá chung chung)
        const tokens = clean.split(/[\s,.-]+/).filter((w) => w.length >= 2);
        for (const tok of tokens) {
          const lower = tok.toLowerCase();
          if (!GENERIC_WORDS.has(lower) && lower.length >= 2) {
            termSet.add(tok);
            substantiveTerms.add(tok.toLowerCase());
          }
        }
        // Cụm từ >= 3 ký tự cũng là substantive
        if (clean.length >= 3 && !GENERIC_WORDS.has(clean.toLowerCase())) {
          substantiveTerms.add(clean.toLowerCase());
        }
      }
    }

    // CHỈ dùng keyword để query OR, KHÔNG thêm category vào OR
    for (const term of termSet) {
      orClauses.push({ name: { contains: term, mode: 'insensitive' } });
      orClauses.push({ description: { contains: term, mode: 'insensitive' } });
      orClauses.push({ brand: { contains: term, mode: 'insensitive' } });
    }

    const where: any = {
      status: { not: 'hidden' },
      stock: { gt: 0 },
    };

    if (orClauses.length > 0) {
      where.OR = orClauses;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    const products = await this.prisma.product.findMany({
      where,
      take: Math.max(limit * 2, 40),
      include: {
        categoryRef: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { sales: 'desc' },
    });

    // Chấm điểm tương quan NGHIÊM NGẶT bằng WHOLE-WORD MATCHING
    const scoredList: Array<any> = [];

    // Helper kiểm tra từ nguyên vẹn (word boundary) trong văn bản
    const matchWholeWord = (text: string, word: string): boolean => {
      if (!text || !word) return false;
      // Dùng regex boundary để 'chi' không khớp với 'chiên', 'da' không khớp với 'đa năng'
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s,.-/()_])${escaped}($|[\\s,.-/()_])`, 'i');
      return regex.test(text);
    };

    for (const p of products) {
      let score = 0; // Bắt đầu từ 0
      let substantiveMatchCount = 0; // Đếm số keyword substantive thực sự match
      const pNameLower = p.name.toLowerCase();
      const pDescLower = (p.description || '').toLowerCase();
      const pBrandLower = (p.brand || '').toLowerCase();

      for (const term of termSet) {
        const tLower = term.toLowerCase().trim();
        if (!tLower) continue;
        const isGeneric = GENERIC_WORDS.has(tLower);

        let termMatchedHere = false;

        // Dùng matchWholeWord cho từ ngắn (<= 4 ký tự), hoặc includes cho cụm từ dài (>= 5 ký tự)
        const nameMatches = tLower.length <= 4 ? matchWholeWord(pNameLower, tLower) : pNameLower.includes(tLower);
        const brandMatches = tLower.length <= 4 ? matchWholeWord(pBrandLower, tLower) : pBrandLower.includes(tLower);
        const descMatches = tLower.length <= 4 ? matchWholeWord(pDescLower, tLower) : pDescLower.includes(tLower);

        if (nameMatches) {
          score += isGeneric ? 2 : 25;
          termMatchedHere = true;
        }
        if (brandMatches) {
          score += isGeneric ? 1 : 20;
          termMatchedHere = true;
        }
        if (descMatches) {
          score += isGeneric ? 1 : 8;
          termMatchedHere = true;
        }

        // Chỉ đếm substantive match khi match ở TÊN hoặc THƯƠNG HIỆU (không tính match lướt ở mô tả)
        if ((nameMatches || brandMatches) && !isGeneric) {
          substantiveMatchCount++;
        }
      }

      // Bonus nhẹ cho category match (chỉ bonus, KHÔNG phải điều kiện chính)
      if (suggestedCategory && p.category.toLowerCase().includes(suggestedCategory.toLowerCase())) {
        score += 5;
      }

      // Bonus nhẹ cho sản phẩm bán chạy
      if (p.sales > 20) score += 2;

      // ===================================================================
      // ĐIỀU KIỆN BẮT BUỘC: Sản phẩm PHẢI có ít nhất 1 substantive keyword match
      // Nếu 0 substantive match → LOẠI BỎ NGAY, không trả về
      // Đây là fix chính cho bug "áo bóng đá nhưng hiện ra bát đĩa sứ 99%"
      // ===================================================================
      if (substantiveMatchCount === 0) {
        continue; // BỎ QUA sản phẩm này hoàn toàn
      }

      // Score tối đa 99, KHÔNG có tối thiểu (nếu thấp thì đúng là không liên quan)
      const finalScore = Math.min(score, 99);

      // Visual search yêu cầu ngưỡng cao hơn
      const minThreshold = isVisual ? 40 : 20;
      if (finalScore < minThreshold) {
        continue; // Điểm quá thấp, không hiển thị
      }

      let parsedImages: string[] = [];
      if (p.images) {
        try {
          parsedImages = JSON.parse(p.images);
        } catch {
          parsedImages = [p.images];
        }
      }

      scoredList.push({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice || undefined,
        costPrice: p.costPrice || 0,
        image: p.image || parsedImages[0] || '',
        images: parsedImages,
        category: p.category,
        categoryId: p.categoryId || undefined,
        categoryRef: p.categoryRef ? { name: p.categoryRef.name, slug: p.categoryRef.slug } : undefined,
        brand: p.brand,
        description: p.description,
        stock: p.stock,
        sales: p.sales,
        sold: p.sales,
        rating: 5,
        shopId: p.shopId,
        sku: p.sku || undefined,
        relevanceScore: finalScore,
        matchBadge: isVisual ? `${finalScore}% Khớp hình ảnh` : `${finalScore}% Khớp ngữ nghĩa`,
      });
    }

    scoredList.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scoredList.slice(0, limit);
  }

  /**
   * Lưu cache tìm kiếm vào CSDL để tăng tốc độ phản hồi
   */
  private async cacheSearchResult(
    searchType: 'SEMANTIC' | 'VISUAL',
    queryKey: string,
    rawQuery: string,
    detectedIntent: string,
    expandedKeywords: string[],
    suggestedCategory?: string,
    matchedProductIds: string[] = [],
    source: string = 'local-ai-engine',
  ) {
    try {
      const existing = await this.prisma.aiSearchKnowledge.findFirst({ where: { searchType, queryKey } });
      if (existing) {
        await this.prisma.aiSearchKnowledge.update({
          where: { id: existing.id },
          data: {
            hitCount: { increment: 1 },
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.aiSearchKnowledge.create({
          data: {
            searchType,
            queryKey,
            rawQuery,
            detectedIntent,
            expandedKeywords: JSON.stringify(expandedKeywords),
            suggestedCategory,
            matchedProductIds: JSON.stringify(matchedProductIds),
            hitCount: 1,
            source,
          },
        });
      }
    } catch {
      // Bỏ qua lỗi cache để không ảnh hưởng luồng chính
    }
  }

  /**
   * Thống kê AI Search
   */
  async getSearchStats(): Promise<SearchStatsResult> {
    try {
      const totalLearned = await this.prisma.aiSearchKnowledge.count();
      const semanticCount = await this.prisma.aiSearchKnowledge.count({ where: { searchType: 'SEMANTIC' } });
      const visualCount = await this.prisma.aiSearchKnowledge.count({ where: { searchType: 'VISUAL' } });
      const hits = await this.prisma.aiSearchKnowledge.aggregate({ _sum: { hitCount: true } });
      const last = await this.prisma.aiSearchKnowledge.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } });

      return {
        totalLearned,
        totalHits: hits._sum.hitCount || 0,
        semanticCount,
        visualCount,
        modelStatus: 'ACTIVE & READY',
        lastUpdated: last?.updatedAt || null,
      };
    } catch {
      return { totalLearned: 0, totalHits: 0, semanticCount: 0, visualCount: 0, modelStatus: 'READY', lastUpdated: null };
    }
  }
}
