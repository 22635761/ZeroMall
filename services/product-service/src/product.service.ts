import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { CreateReviewDto } from './review.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(shopId?: string, category?: string) {
    let whereClause: any = {};
    if (shopId) whereClause.shopId = shopId;
    if (category && category !== 'all') {
      const trimmed = category.trim();
      whereClause.OR = [
        { category: { contains: trimmed, mode: 'insensitive' } },
        { categoryRef: { slug: { equals: trimmed, mode: 'insensitive' } } },
        { categoryRef: { name: { contains: trimmed, mode: 'insensitive' } } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: { categoryRef: true },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      products.map(async (p) => {
        const reviews = await this.prisma.review.findMany({
          where: { productId: p.id },
          select: { rating: true },
        });
        const ratingCount = reviews.length;
        const avgRating = ratingCount > 0
          ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / ratingCount).toFixed(1))
          : 0;
        return {
          ...p,
          rating: avgRating,
          reviewsCount: ratingCount,
        };
      })
    );
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID ${id} không tồn tại`);
    }

    const reviews = await this.prisma.review.findMany({
      where: { productId: id },
      select: { rating: true },
    });
    const ratingCount = reviews.length;
    const avgRating = ratingCount > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / ratingCount).toFixed(1))
      : 0;

    return {
      ...product,
      rating: avgRating,
      reviewsCount: ratingCount,
    };
  }

  async create(dto: CreateProductDto) {
    const imagesStr = typeof dto.images === 'string' ? dto.images : (dto.images ? JSON.stringify(dto.images) : '[]');
    const variationGroupsStr = typeof dto.variationGroups === 'string' ? dto.variationGroups : (dto.variationGroups ? JSON.stringify(dto.variationGroups) : null);
    const variationRowsStr = typeof dto.variationRows === 'string' ? dto.variationRows : (dto.variationRows ? JSON.stringify(dto.variationRows) : null);
    const categoryStr = typeof dto.category === 'string' ? dto.category : ((dto.category as any)?.name || 'Tổng Hợp');

    return this.prisma.product.create({
      data: {
        shopId: String(dto.shopId),
        name: String(dto.name || 'Sản phẩm mới'),
        image: dto.image ? String(dto.image) : null,
        images: imagesStr,
        video: dto.video ? String(dto.video) : null,
        category: categoryStr,
        brand: dto.brand ? String(dto.brand) : 'No Brand',
        description: dto.description ? String(dto.description) : String(dto.name || 'Mô tả sản phẩm'),
        price: String(dto.price || '0'),
        originalPrice: dto.originalPrice ? String(dto.originalPrice) : null,
        stock: typeof dto.stock === 'number' ? dto.stock : parseInt(String(dto.stock || '0'), 10) || 0,
        sales: typeof dto.sales === 'number' ? dto.sales : parseInt(String(dto.sales || '0'), 10) || 0,
        status: dto.status ? String(dto.status) : 'active',
        sku: dto.sku ? String(dto.sku) : null,
        variationsText: dto.variationsText ? String(dto.variationsText) : null,
        hasVariations: Boolean(dto.hasVariations),
        variationGroups: variationGroupsStr,
        variationRows: variationRowsStr,
        weight: dto.weight != null ? String(dto.weight) : null,
        length: dto.length != null ? String(dto.length) : null,
        width: dto.width != null ? String(dto.width) : null,
        height: dto.height != null ? String(dto.height) : null,
        condition: dto.condition ? String(dto.condition) : 'new',
        isPreOrder: Boolean(dto.isPreOrder),
        preOrderDays: dto.preOrderDays != null ? String(dto.preOrderDays) : '7',
      },
    });
  }

  async purchase(items: { productId: string; quantity: number }[]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            sales: { increment: item.quantity },
          },
        }),
      ),
    );
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Ensure product exists
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = String(dto.name);
    if (dto.image !== undefined) updateData.image = dto.image ? String(dto.image) : null;
    if (dto.images !== undefined) updateData.images = typeof dto.images === 'string' ? dto.images : (dto.images ? JSON.stringify(dto.images) : '[]');
    if (dto.video !== undefined) updateData.video = dto.video ? String(dto.video) : null;
    if (dto.category !== undefined) updateData.category = typeof dto.category === 'string' ? dto.category : ((dto.category as any)?.name || 'Tổng Hợp');
    if (dto.brand !== undefined) updateData.brand = String(dto.brand);
    if (dto.description !== undefined) updateData.description = String(dto.description);
    if (dto.price !== undefined) updateData.price = String(dto.price);
    if (dto.originalPrice !== undefined) updateData.originalPrice = dto.originalPrice ? String(dto.originalPrice) : null;
    if (dto.stock !== undefined) updateData.stock = typeof dto.stock === 'number' ? dto.stock : parseInt(String(dto.stock || '0'), 10) || 0;
    if (dto.sales !== undefined) updateData.sales = typeof dto.sales === 'number' ? dto.sales : parseInt(String(dto.sales || '0'), 10) || 0;
    if (dto.status !== undefined) updateData.status = String(dto.status);
    if (dto.sku !== undefined) updateData.sku = dto.sku ? String(dto.sku) : null;
    if (dto.variationsText !== undefined) updateData.variationsText = dto.variationsText ? String(dto.variationsText) : null;
    if (dto.hasVariations !== undefined) updateData.hasVariations = Boolean(dto.hasVariations);
    if (dto.variationGroups !== undefined) updateData.variationGroups = typeof dto.variationGroups === 'string' ? dto.variationGroups : (dto.variationGroups ? JSON.stringify(dto.variationGroups) : null);
    if (dto.variationRows !== undefined) updateData.variationRows = typeof dto.variationRows === 'string' ? dto.variationRows : (dto.variationRows ? JSON.stringify(dto.variationRows) : null);
    if (dto.weight !== undefined) updateData.weight = dto.weight != null ? String(dto.weight) : null;
    if (dto.length !== undefined) updateData.length = dto.length != null ? String(dto.length) : null;
    if (dto.width !== undefined) updateData.width = dto.width != null ? String(dto.width) : null;
    if (dto.height !== undefined) updateData.height = dto.height != null ? String(dto.height) : null;
    if (dto.condition !== undefined) updateData.condition = String(dto.condition);
    if (dto.isPreOrder !== undefined) updateData.isPreOrder = Boolean(dto.isPreOrder);
    if (dto.preOrderDays !== undefined) updateData.preOrderDays = dto.preOrderDays != null ? String(dto.preOrderDays) : '7';

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleStatus(id: string) {
    const product = await this.findOne(id);
    const newStatus = product.status === 'active' ? 'hidden' : 'active';
    return this.prisma.product.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async delete(id: string) {
    await this.findOne(id); // Ensure product exists
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async getReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReview(productId: string, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        productId,
        orderId: dto.orderId,
        username: dto.username,
        rating: dto.rating,
        comment: dto.comment,
        variant: dto.variant,
        images: dto.images,
      },
    });
  }

  async getShopStats(shopId: string) {
    const totalProducts = await this.prisma.product.count({
      where: { shopId },
    });

    const products = await this.prisma.product.findMany({
      where: { shopId },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);
    const totalReviews = await this.prisma.review.count({
      where: { productId: { in: productIds } },
    });

    return {
      totalProducts,
      totalReviews,
    };
  }

  async getProductLikes(productId: string, userId?: string) {
    const count = await this.prisma.productLike.count({
      where: { productId },
    });
    let isLiked = false;
    if (userId) {
      const like = await this.prisma.productLike.findUnique({
        where: {
          productId_userId: { productId, userId },
        },
      });
      isLiked = !!like;
    }
    return {
      count,
      isLiked,
    };
  }

  async toggleLikeProduct(productId: string, userId: string) {
    const existingLike = await this.prisma.productLike.findUnique({
      where: {
        productId_userId: { productId, userId },
      },
    });

    if (existingLike) {
      await this.prisma.productLike.delete({
        where: {
          productId_userId: { productId, userId },
        },
      });
    } else {
      await this.prisma.productLike.create({
        data: {
          productId,
          userId,
        },
      });
    }

    return this.getProductLikes(productId, userId);
  }

  async getAllCategories() {
    const list = await this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } }
    });
    if (list.length === 0) {
      const defaults = [
        { name: 'Thời Thời Trang Nam', slug: 'thoi-trang-nam' },
        { name: 'Điện Thoại & Phụ Kiện', slug: 'dien-thoai-phu-kien' },
        { name: 'Thiết Bị Điện Tử', slug: 'thiet-bi-dien-tu' },
        { name: 'Mẹ & Bé', slug: 'me-va-be' }
      ];
      await Promise.all(
        defaults.map(d => this.prisma.category.create({ data: d }))
      );
      const newList = await this.prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { products: true } } }
      });
      return newList.map(c => ({ ...c, productCount: c._count.products }));
    }
    return list.map(c => ({ ...c, productCount: c._count.products }));
  }

  async createCategory(name: string) {
    const slug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    return this.prisma.category.create({
      data: { name, slug }
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({
      where: { id }
    });
  }

  async getViolatedProducts() {
    const list = await this.prisma.product.findMany({
      where: { isViolated: true },
      orderBy: { reportsCount: 'desc' }
    });
    if (list.length === 0) {
      const products = await this.prisma.product.findMany({ take: 2 });
      if (products.length > 0) {
        await Promise.all(
          products.map((p, idx) =>
            this.prisma.product.update({
              where: { id: p.id },
              data: {
                isViolated: true,
                violationReason: idx === 0 ? 'Hàng giả/nhái thương hiệu, lừa đảo' : 'Mặt hàng chưa kiểm định y tế',
                reportsCount: idx === 0 ? 42 : 15
              }
            })
          )
        );
        return this.prisma.product.findMany({
          where: { isViolated: true },
          orderBy: { reportsCount: 'desc' }
        });
      }
    }
    return list;
  }

  async updateProductViolation(id: string, isViolated: boolean, reason?: string) {
    return this.prisma.product.update({
      where: { id },
      data: {
        isViolated,
        violationReason: reason || null,
        reportsCount: isViolated ? 1 : 0
      }
    });
  }

  async getFlashSales() {
    const list = await this.prisma.flashSale.findMany({
      orderBy: { createdAt: 'desc' }
    });
    if (list.length === 0) {
      const defaults = [
        { timeSlot: '00:00 - 02:00', productsCount: 15, status: 'ENDED' },
        { timeSlot: '12:00 - 14:00', productsCount: 8, status: 'RUNNING' },
        { timeSlot: '20:00 - 22:00', productsCount: 25, status: 'UPCOMING' }
      ];
      await Promise.all(
        defaults.map(d => this.prisma.flashSale.create({ data: d }))
      );
      return this.prisma.flashSale.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }
    return list;
  }

  private parseTimeRange(slot: string): { start: number; end: number } | null {
    try {
      const parts = slot.split('-').map(s => s.trim());
      if (parts.length !== 2) return null;
      const startH = parseInt(parts[0].split(':')[0], 10);
      const endH = parseInt(parts[1].split(':')[0], 10);
      if (isNaN(startH) || isNaN(endH)) return null;
      return { start: startH, end: endH === 0 ? 24 : endH };
    } catch (e) {
      return null;
    }
  }

  async createFlashSale(timeSlot: string) {
    const newRange = this.parseTimeRange(timeSlot);
    if (!newRange) {
      throw new Error('Định dạng khung giờ không hợp lệ. Vui lòng nhập định dạng HH:mm - HH:mm');
    }

    const existingSlots = await this.prisma.flashSale.findMany();
    for (const slot of existingSlots) {
      const range = this.parseTimeRange(slot.timeSlot);
      if (range) {
        // Check time overlap: (start1 < end2) && (end1 > start2)
        if (newRange.start < range.end && newRange.end > range.start) {
          throw new Error(`Khung giờ "${timeSlot}" bị trùng lặp thời gian với khung giờ đã có "${slot.timeSlot}"!`);
        }
      }
    }

    return this.prisma.flashSale.create({
      data: { timeSlot }
    });
  }

  async updateFlashSaleStatus(id: string, status: string) {
    if (status === 'RUNNING') {
      // Đảm bảo chỉ có DUY NHẤT 1 khung giờ ở trạng thái RUNNING tại một thời điểm
      await this.prisma.flashSale.updateMany({
        where: { id: { not: id }, status: 'RUNNING' },
        data: { status: 'ENDED' }
      });
    }

    return this.prisma.flashSale.update({
      where: { id },
      data: { status }
    });
  }

  async getShopReviews(shopId: string) {
    const products = await this.prisma.product.findMany({
      where: { shopId },
      select: { id: true, name: true, image: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const productIds = Array.from(productMap.keys());
    if (productIds.length === 0) return [];
    
    const reviews = await this.prisma.review.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => ({
      ...r,
      productName: productMap.get(r.productId)?.name || 'Sản phẩm',
      productImage: productMap.get(r.productId)?.image || '',
    }));
  }
}
