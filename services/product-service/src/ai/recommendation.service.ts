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
  page?: number;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 1. Ghi nhận hành vi tương tác của người dùng theo thời gian thực (Real-time Session Tracking)
   * Lưu trữ Session tương tác tức thì trong Redis và lưu log phân tích vào PostgreSQL
   */
  async trackUserAction(dto: TrackActionDto): Promise<void> {
    if (!dto.userId) return;

    // Trọng số hành vi chuẩn Shopee: CART (5) > LIKE (3) > SEARCH (2) > VIEW (1)
    const ACTION_WEIGHTS: Record<string, number> = {
      VIEW: 1,
      SEARCH: 2,
      LIKE: 3,
      CART: 5,
      PURCHASE: 10,
    };

    const weight = ACTION_WEIGHTS[dto.action] || 1;

    try {
      // 1. Lưu hành vi tương tác gần nhất để ưu tiên xen kẽ vào bảng "Gợi Ý Hôm Nay"
      const lastActionKey = `user:rec:last_action:${dto.userId}`;
      await this.redis.set(
        lastActionKey,
        {
          action: dto.action,
          productId: dto.productId || null,
          category: dto.category || null,
          timestamp: Date.now(),
        },
        86400 * 3, // Giữ 3 ngày
      );

      // 2. Cập nhật điểm quan tâm danh mục vào Redis Hash
      if (dto.category) {
        const catKey = `user:rec:cat_weights:${dto.userId}`;
        const currentData = (await this.redis.get<Record<string, number>>(catKey)) || {};
        currentData[dto.category] = (currentData[dto.category] || 0) + weight;
        await this.redis.set(catKey, currentData, 86400 * 7); // Giữ 7 ngày
      }

      // 3. Cập nhật danh sách các sản phẩm vừa xem/thêm giỏ hàng gần đây
      if (dto.productId) {
        const pidsKey = `user:rec:recent_pids:${dto.userId}`;
        let recentPids = (await this.redis.get<string[]>(pidsKey)) || [];
        recentPids = [dto.productId, ...recentPids.filter((id) => id !== dto.productId)].slice(0, 10);
        await this.redis.set(pidsKey, recentPids, 86400 * 7);
      }

      // 4. Xóa sạch mọi cache feed gợi ý của user này để phản ánh ngay lập tức (Zero-Latency Invalidation)
      await this.redis.delByPattern(`rec:feed:${dto.userId}:*`);

      // 5. Lưu log chi tiết vào PostgreSQL dưới nền (non-blocking)
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
   * 2. Thuật toán "Gợi Ý Hôm Nay" (Daily Discover) chuẩn Shopee:
   * Xen kẽ tỷ lệ 30/70 (Interleaving):
   * - 30% khai thác (Exploitation): 1 đến 2 sản phẩm liên quan mật thiết đến món vừa xem/thêm giỏ hàng
   * - 70% khám phá (Exploration): Các sản phẩm bán chạy, giảm sâu, đa dạng ngành hàng khác trên sàn ZeroMall
   */
  async getPersonalizedFeed(dto: RecommendationQueryDto): Promise<{
    products: any[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
    userProfile: {
      isPersonalized: boolean;
      detectedGender?: string;
      topInterests: string[];
      hasRecentInteractions: boolean;
      recentAction?: string;
    };
  }> {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(Math.max(1, dto.limit || 30), 60);
    const userId = dto.userId || 'guest';
    const gender = (dto.gender || '').toUpperCase();

    // 1. Kiểm tra Cache Redis
    const cacheKey = `rec:feed:${userId}:${gender}:${limit}:${page}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Đọc hồ sơ sở thích và hành vi gần nhất từ Redis
    let lastAction: any = null;
    let catWeights: Record<string, number> = {};
    let recentPids: string[] = [];

    if (userId !== 'guest') {
      lastAction = await this.redis.get<any>(`user:rec:last_action:${userId}`);
      catWeights = (await this.redis.get<Record<string, number>>(`user:rec:cat_weights:${userId}`)) || {};
      recentPids = (await this.redis.get<string[]>(`user:rec:recent_pids:${userId}`)) || [];
    }

    const topCategories = Object.entries(catWeights)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 3);

    const hasInteractions = Boolean(lastAction || recentPids.length > 0 || topCategories.length > 0);

    // -------------------------------------------------------------------------
    // BƯỚC A: TÌM 1-2 SẢN PHẨM GỢI Ý CÁ NHÂN HÓA (EXPLOITATION: 30%)
    // Dựa trên sản phẩm vừa xem (VIEW) hoặc vừa thêm vào giỏ (CART)
    // -------------------------------------------------------------------------
    const personalizedProducts: any[] = [];
    const usedProductIds = new Set<string>();

    // Đánh dấu các sản phẩm user vừa xem/tương tác để không gợi ý lại chính sản phẩm đó
    recentPids.forEach((id) => usedProductIds.add(id));
    if (lastAction?.productId) {
      usedProductIds.add(lastAction.productId);
    }

    if (page === 1 && hasInteractions) {
      try {
        let seedCategory = lastAction?.category;
        let seedProductId = lastAction?.productId || recentPids[0];

        // Nếu thiếu category, truy vấn nhanh thông tin sản phẩm seed từ CSDL
        if (seedProductId && !seedCategory) {
          const seedProduct = await this.prisma.product.findUnique({
            where: { id: seedProductId },
            select: { id: true, name: true, category: true },
          });
          if (seedProduct) {
            seedCategory = seedProduct.category;
          }
        }

        // Định dạng nhãn thông minh dựa theo hành vi gần nhất
        let badgeReason = '🎯 Gợi ý cho bạn';
        if (lastAction?.action === 'CART') {
          badgeReason = '🛒 Tương tự món trong giỏ';
        } else if (lastAction?.action === 'VIEW') {
          badgeReason = '🎯 Dựa trên món bạn vừa xem';
        } else if (topCategories.length > 0) {
          badgeReason = `✨ Bạn quan tâm ${topCategories[0]}`;
        }

        // Lấy 1 - 2 sản phẩm liên quan cùng danh mục, có lượt bán và đánh giá tốt
        if (seedCategory || topCategories.length > 0) {
          const targetCategory = seedCategory || topCategories[0];
          const relatedItems = await this.prisma.product.findMany({
            where: {
              status: { not: 'hidden' },
              stock: { gt: 0 },
              id: { notIn: Array.from(usedProductIds) },
              category: targetCategory,
            },
            orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
            take: 2, // CHỈ LẤY ĐÚNG 1 ĐẾN 2 SẢN PHẨM (Quy tắc Shopee)
          });

          for (const item of relatedItems) {
            usedProductIds.add(item.id);
            personalizedProducts.push({
              ...item,
              price: Number(item.price),
              originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
              stock: Number(item.stock),
              sales: Number(item.sales),
              isPersonalized: true,
              recommendationReason: badgeReason,
            });
          }
        }
      } catch (err: any) {
        this.logger.warn(`Lỗi tìm sản phẩm cá nhân hóa: ${err.message}`);
      }
    }

    // -------------------------------------------------------------------------
    // BƯỚC B: LẤY CÁC SẢN PHẨM BÁN CHẠY VÀ ĐA DẠNG NGÀNH HÀNG (EXPLORATION: 70%)
    // -------------------------------------------------------------------------
    const totalActive = await this.prisma.product.count({
      where: {
        status: { not: 'hidden' },
        stock: { gt: 0 },
      },
    });

    const neededExplorationCount = limit - personalizedProducts.length;
    const skipOffset = (page - 1) * limit;

    const exploreItems = await this.prisma.product.findMany({
      where: {
        status: { not: 'hidden' },
        stock: { gt: 0 },
        id: { notIn: Array.from(usedProductIds) },
      },
      orderBy: [{ sales: 'desc' }, { createdAt: 'desc' }],
      skip: skipOffset,
      take: neededExplorationCount + 4,
    });

    const formattedExplore = exploreItems.map((p) => {
      const orig = p.originalPrice ? Number(p.originalPrice) : Number(p.price);
      const cur = Number(p.price);
      const discountPct = orig > cur && orig > 0 ? Math.round((1 - cur / orig) * 100) : 0;

      let reason = '🔥 Bán chạy hôm nay';
      if (discountPct >= 20) {
        reason = `🏷️ Giảm sâu ${discountPct}%`;
      } else if (p.sales && p.sales > 100) {
        reason = `⭐ Đã bán ${(p.sales / 1000).toFixed(1)}k+`;
      }

      return {
        ...p,
        price: cur,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        stock: Number(p.stock),
        sales: Number(p.sales),
        isPersonalized: false,
        recommendationReason: reason,
      };
    });

    // -------------------------------------------------------------------------
    // BƯỚC C: CƠ CHẾ XEN KẼ THÔNG MINH (INTERLEAVING PATTERN CHUẨN SHOPEE)
    // Slot 0: Sản phẩm Hot nhất toàn sàn
    // Slot 1: 🎯 1 Sản phẩm cá nhân hóa từ món vừa xem/thêm giỏ hàng
    // Slot 2, 3, 4, 5: Sản phẩm đa dạng ngành hàng khác
    // Slot 6: 🛒 1 Sản phẩm cá nhân hóa thứ 2 (nếu có)
    // Các slot còn lại: Sản phẩm thịnh hành
    // -------------------------------------------------------------------------
    const finalProducts: any[] = [];
    let pIdx = 0;
    let eIdx = 0;

    for (let slot = 0; slot < limit; slot++) {
      if (finalProducts.length >= limit) break;

      // Đặt 1 món cá nhân hóa ở Slot 1 (Vị trí số 2) và Slot 6 (Vị trí số 7)
      if ((slot === 1 || slot === 6) && pIdx < personalizedProducts.length) {
        finalProducts.push(personalizedProducts[pIdx++]);
      } else if (eIdx < formattedExplore.length) {
        finalProducts.push(formattedExplore[eIdx++]);
      } else if (pIdx < personalizedProducts.length) {
        finalProducts.push(personalizedProducts[pIdx++]);
      }
    }

    const totalPages = Math.ceil(totalActive / limit) || 1;
    const responsePayload = {
      products: finalProducts,
      total: totalActive,
      pagination: {
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
      userProfile: {
        isPersonalized: personalizedProducts.length > 0,
        detectedGender: gender || undefined,
        topInterests: topCategories,
        hasRecentInteractions: hasInteractions,
        recentAction: lastAction?.action,
      },
    };

    // Cache trong Redis trong 60 giây (vừa đủ nhanh, lại được xóa tức thì khi có click/thêm giỏ)
    await this.redis.set(cacheKey, responsePayload, 60);

    return responsePayload;
  }
}
