import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';

export class TrackActionDto {
  userId: string;
  action: 'VIEW' | 'CART' | 'LIKE' | 'PURCHASE' | 'SEARCH';
  productId?: string;
  category?: string;
  metadata?: any;
}

export class RecommendationQueryDto {
  userId?: string;
  gender?: string; // "NAM" | "NU" | "KHAC"
  limit?: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 1. Ghi nhận hành vi tương tác của người dùng
   * Hệ thống tính điểm trọng số và cập nhật đồng thời vào Redis (Session thực tế) & PostgreSQL (Analytics)
   */
  async trackUserAction(dto: TrackActionDto): Promise<void> {
    if (!dto.userId) return;

    // Trọng số hành vi chuẩn Shopee/TikTok
    const ACTION_WEIGHTS: Record<string, number> = {
      VIEW: 1,
      SEARCH: 2,
      LIKE: 3,
      CART: 5,
      PURCHASE: 10,
    };

    const weight = ACTION_WEIGHTS[dto.action] || 1;

    try {
      // 1. Nếu có category, cập nhật điểm quan tâm vào Redis Hash
      if (dto.category) {
        const catKey = `user:rec:cat_weights:${dto.userId}`;
        const currentData = await this.redis.get<Record<string, number>>(catKey) || {};
        currentData[dto.category] = (currentData[dto.category] || 0) + weight;
        await this.redis.set(catKey, currentData, 86400 * 7); // Giữ 7 ngày
      }

      // 2. Nếu có productId, lưu danh sách sản phẩm vừa tương tác vào Redis
      if (dto.productId) {
        const pidsKey = `user:rec:recent_pids:${dto.userId}`;
        let recentPids = await this.redis.get<string[]>(pidsKey) || [];
        recentPids = [dto.productId, ...recentPids.filter((id) => id !== dto.productId)].slice(0, 10);
        await this.redis.set(pidsKey, recentPids, 86400 * 7);
      }

      // 3. Xóa cache gợi ý cũ của user này để lần tải trang tiếp theo phản ánh ngay lập tức
      await this.redis.del(`rec:feed:${dto.userId}`);

      // 4. Lưu log chi tiết vào PostgreSQL dưới nền (non-blocking)
      this.prisma.userActivity.create({
        data: {
          id: randomUUID(),
          userId: dto.userId,
          action: dto.action,
          productId: dto.productId || null,
          category: dto.category || null,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
        },
      }).catch((e) => this.logger.warn(`Lỗi lưu UserActivity: ${e.message}`));
    } catch (err: any) {
      this.logger.warn(`Lỗi xử lý trackUserAction: ${err.message}`);
    }
  }

  /**
   * 2. Thuật toán AI Gợi ý Cá nhân hóa (Hybrid: Vector quang học + Giới tính + Trọng số hành vi)
   */
  async getPersonalizedFeed(dto: RecommendationQueryDto): Promise<{
    products: any[];
    total: number;
    userProfile: {
      isPersonalized: boolean;
      detectedGender?: string;
      topInterests: string[];
      hasRecentInteractions: boolean;
    };
  }> {
    const limit = Math.min(dto.limit || 30, 60);
    const userId = dto.userId || 'guest';
    const gender = (dto.gender || '').toUpperCase();

    // 1. Kiểm tra Cache Redis
    const cacheKey = `rec:feed:${userId}:${gender}:${limit}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Đọc hồ sơ sở thích từ Redis
    let catWeights: Record<string, number> = {};
    let recentPids: string[] = [];

    if (userId !== 'guest') {
      catWeights = (await this.redis.get<Record<string, number>>(`user:rec:cat_weights:${userId}`)) || {};
      recentPids = (await this.redis.get<string[]>(`user:rec:recent_pids:${userId}`)) || [];
    }

    // Top ngành hàng người này tương tác nhiều nhất
    const topCategories = Object.entries(catWeights)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 3);

    const hasInteractions = recentPids.length > 0 || topCategories.length > 0;
    const isPersonalized = hasInteractions || gender === 'NAM' || gender === 'NU';

    // -------------------------------------------------------------------------
    // BƯỚC A: TÌM SẢN PHẨM TƯƠNG ĐỒNG QUANG HỌC (VECTOR SEARCH VIA PGVECTOR)
    // Nếu người dùng vừa xem/thêm giỏ hàng balo hay áo -> tìm đồ tương đồng quang học
    // -------------------------------------------------------------------------
    const vectorMatchedProducts: any[] = [];
    const usedProductIds = new Set<string>();

    if (recentPids.length > 0) {
      try {
        const seedPid = recentPids[0]; // Sản phẩm tương tác gần nhất
        const seedProduct = await this.prisma.product.findUnique({
          where: { id: seedPid },
          select: { id: true, name: true, category: true },
        });

        if (seedProduct) {
          const rawVectorMatches: any[] = await this.prisma.$queryRawUnsafe(`
            WITH seed AS (
              SELECT "imageEmbedding" as vec
              FROM product."Product"
              WHERE id = $1 AND "imageEmbedding" IS NOT NULL
            )
            SELECT p.id, p.name, p.price, p."originalPrice", p.image, p.images, p.category, p.brand, p.sales, p.stock, p.status, p."shopId",
                   ROUND(((1 - (p."imageEmbedding" OPERATOR(public.<=>) seed.vec)) * 100)::numeric, 1) as "relevanceScore"
            FROM product."Product" p, seed
            WHERE p.status != 'hidden'
              AND p."imageEmbedding" IS NOT NULL
              AND p.id != $1
            ORDER BY p."imageEmbedding" OPERATOR(public.<=>) seed.vec ASC
            LIMIT 6;
          `, seedPid);

          for (const item of rawVectorMatches) {
            if (Number(item.relevanceScore) >= 65.0) {
              usedProductIds.add(item.id);
              vectorMatchedProducts.push({
                ...item,
                price: Number(item.price),
                originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
                stock: Number(item.stock),
                sales: Number(item.sales),
                recommendationReason: `✨ Tương tự "${seedProduct.name.slice(0, 28)}..."`,
              });
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Vector recommendation skip: ${err.message}`);
      }
    }

    // -------------------------------------------------------------------------
    // BƯỚC B: TẤT CẢ SẢN PHẨM KHẢ DỤNG TỪ CSDL
    // -------------------------------------------------------------------------
    const allProducts = await this.prisma.product.findMany({
      where: {
        status: { not: 'hidden' },
        stock: { gt: 0 },
      },
      include: { categoryRef: true },
    });

    // -------------------------------------------------------------------------
    // BƯỚC C: CHẤM ĐIỂM CÁ NHÂN HÓA CHO TỪNG SẢN PHẨM (SCORING ENGINE)
    // -------------------------------------------------------------------------
    const scoredProducts = allProducts
      .filter((p) => !usedProductIds.has(p.id))
      .map((p) => {
        const cat = p.category || '';
        let personalScore = 0;
        let reason = '🔥 Bán chạy hôm nay';

        // 1. Điểm cơ sở: Sales + Rating + Discount
        const sold = Number(p.sales || 0);
        const origPrice = Number(p.originalPrice || p.price || 0);
        const sellPrice = Number(p.price || 0);
        const discountPct = origPrice > sellPrice && origPrice > 0 ? (1 - sellPrice / origPrice) * 100 : 0;
        const baseScore = sold * 0.4 + discountPct * 0.2;

        // 2. Điểm theo lịch sử hành vi (Behavioral boost)
        const catWeight = catWeights[cat] || 0;
        if (catWeight > 0) {
          personalScore += catWeight * 15;
          reason = `🎯 Danh mục bạn quan tâm (${cat})`;
        }

        // 3. Điểm theo Giới tính (Gender boost)
        if (gender === 'NAM') {
          if (cat.includes('Nam') || cat.includes('Điện Thoại') || cat.includes('Thể Thao') || cat.includes('Công Nghệ')) {
            personalScore += 50;
            reason = '👨 Phù hợp với phái nam';
          } else if (cat.includes('Nữ') || cat.includes('Váy') || cat.includes('Mỹ Phẩm')) {
            personalScore -= 80; // Giảm ưu tiên đồ thuần nữ
          }
        } else if (gender === 'NU') {
          if (cat.includes('Nữ') || cat.includes('Mỹ Phẩm') || cat.includes('Túi Ví') || cat.includes('Làm Đẹp') || cat.includes('Phụ Kiện')) {
            personalScore += 50;
            reason = '👩 Dành riêng cho phái nữ';
          } else if (cat.includes('Thời Trang Nam')) {
            personalScore -= 80; // Giảm ưu tiên đồ thuần nam
          }
        }

        const totalScore = baseScore + personalScore;

        return {
          ...p,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          costPrice: p.costPrice ? Number(p.costPrice) : null,
          stock: Number(p.stock),
          sales: Number(p.sales),
          rankingScore: totalScore,
          recommendationReason: reason,
        };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore);

    // -------------------------------------------------------------------------
    // BƯỚC D: DIVERSITY SAMPLING TRỘN ĐỀU VỚI VECTOR PRODUCTS
    // Đảm bảo có cả món tương tự món vừa xem + các món gợi ý theo giới tính & danh mục
    // -------------------------------------------------------------------------
    const finalProducts = [...vectorMatchedProducts];

    for (const item of scoredProducts) {
      if (finalProducts.length >= limit) break;
      finalProducts.push(item);
    }

    const responsePayload = {
      products: finalProducts,
      total: finalProducts.length,
      userProfile: {
        isPersonalized,
        detectedGender: gender || undefined,
        topInterests: topCategories,
        hasRecentInteractions: recentPids.length > 0,
      },
    };

    // Lưu vào Redis TTL = 90 giây
    await this.redis.set(cacheKey, responsePayload, 90);

    return responsePayload;
  }
}
