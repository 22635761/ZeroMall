import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateProductDto, UpdateProductDto, UpdatePriceDto, ImportBatchDto } from './product.dto';
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

    const product = await this.prisma.product.create({
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
        costPrice: dto.costPrice != null ? Number(dto.costPrice) : (parseFloat(String(dto.price || '0')) * 0.7 || 0),
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

    const parsedPrice = parseFloat(String(dto.price || '0')) || 0;
    if (parsedPrice > 0) {
      await this.prisma.priceHistory.create({
        data: {
          productId: product.id,
          shopId: product.shopId,
          oldPrice: parsedPrice,
          newPrice: parsedPrice,
          changeType: 'INITIAL',
          changedBy: 'Hệ thống / Khởi tạo',
          changedByRole: 'SELLER',
          reason: 'Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm',
        },
      }).catch((e) => console.error('Failed to create initial price history:', e));
    }

    const initialCost = dto.costPrice != null ? Number(dto.costPrice) : (parsedPrice * 0.7);
    if (product.stock > 0 && initialCost > 0) {
      await this.prisma.costPriceHistory.create({
        data: {
          productId: product.id,
          shopId: product.shopId,
          costPrice: initialCost,
          quantity: product.stock,
          invoiceCode: `NK-INIT-${Date.now().toString().slice(-6)}`,
          supplier: 'Lô hàng ban đầu',
          note: 'Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu',
          importedBy: 'Chủ cửa hàng',
        },
      }).catch((e) => console.error('Failed to create initial cost history:', e));
    }

    return product;
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
    if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice != null ? Number(dto.costPrice) : null;

    const currentProduct = await this.findOne(id);
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Tự động ghi lại lịch sử nếu giá bán thay đổi qua form sửa sản phẩm
    if (dto.price !== undefined) {
      const oldPrice = parseFloat(currentProduct.price) || 0;
      const newPrice = parseFloat(String(dto.price)) || 0;
      if (oldPrice !== newPrice && !isNaN(newPrice)) {
        await this.prisma.priceHistory.create({
          data: {
            productId: currentProduct.id,
            shopId: currentProduct.shopId,
            oldPrice: oldPrice,
            newPrice: newPrice,
            changeType: 'MANUAL',
            changedBy: 'Người bán',
            changedByRole: 'SELLER',
            reason: 'Cập nhật giá từ trang quản lý sản phẩm',
          },
        }).catch(err => console.error('Lỗi lưu PriceHistory khi cập nhật sản phẩm:', err));
      }
    }

    return updatedProduct;
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

    let totalReviews = 0;
    let averageRating = 0;

    if (productIds.length > 0) {
      const reviews = await this.prisma.review.findMany({
        where: { productId: { in: productIds } },
        select: { rating: true },
      });
      totalReviews = reviews.length;
      if (totalReviews > 0) {
        averageRating = parseFloat(
          (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
        );
      }
    }

    return {
      totalProducts,
      totalReviews,
      averageRating,
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

  // ============================================================
  // QUẢN LÝ GIÁ VÀ BIẾN ĐỘNG GIÁ
  // ============================================================

  async updatePrice(id: string, dto: UpdatePriceDto) {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Phân quyền: Seller chỉ được sửa sản phẩm của chính shop mình
    if (dto.shopId && dto.changedByRole !== 'ADMIN' && product.shopId !== dto.shopId) {
      throw new ForbiddenException('Bạn chỉ có quyền cập nhật giá cho sản phẩm thuộc Shop mình quản lý!');
    }

    const oldPrice = parseFloat(product.price) || 0;
    const newPrice = Number(dto.newPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      throw new Error('Giá mới không hợp lệ');
    }

    const updateData: any = {
      price: String(newPrice),
    };
    if (dto.originalPrice !== undefined && dto.originalPrice !== null) {
      updateData.originalPrice = String(dto.originalPrice);
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Tuyệt đối không xóa lịch sử; lưu giá cũ, giá mới, thời gian, người thay đổi
    const priceHistory = await this.prisma.priceHistory.create({
      data: {
        productId: product.id,
        shopId: product.shopId,
        oldPrice: oldPrice,
        newPrice: newPrice,
        changeType: 'MANUAL',
        changedBy: dto.changedBy || 'Người bán',
        changedByRole: dto.changedByRole || 'SELLER',
        reason: dto.reason || 'Cập nhật giá bán sản phẩm',
      },
    });

    return {
      success: true,
      product: updatedProduct,
      priceHistory,
    };
  }

  async importBatch(id: string, dto: ImportBatchDto) {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Phân quyền: Seller chỉ được nhập hàng cho sản phẩm của shop mình
    if (dto.shopId && dto.importedBy && product.shopId !== dto.shopId && !dto.importedBy.toLowerCase().includes('admin')) {
      throw new ForbiddenException('Bạn chỉ có quyền nhập hàng cho sản phẩm thuộc Shop mình quản lý!');
    }

    const costPrice = Number(dto.costPrice);
    const quantity = Number(dto.quantity);
    if (isNaN(costPrice) || costPrice < 0 || isNaN(quantity) || quantity <= 0) {
      throw new Error('Giá nhập và số lượng nhập phải lớn hơn 0');
    }

    const importDate = dto.importDate ? new Date(dto.importDate) : new Date();

    const costHistory = await this.prisma.costPriceHistory.create({
      data: {
        productId: product.id,
        shopId: product.shopId,
        costPrice: costPrice,
        quantity: quantity,
        invoiceCode: dto.invoiceCode || `HD-NK-${Date.now().toString().slice(-6)}`,
        supplier: dto.supplier || 'Nhà cung cấp',
        note: dto.note || 'Nhập hàng vào kho',
        importedBy: dto.importedBy || 'Quản lý kho',
        importDate: importDate,
      },
    });

    // Cập nhật giá vốn hiện tại và cộng dồn số lượng tồn kho
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        costPrice: costPrice,
        stock: { increment: quantity },
      },
    });

    return {
      success: true,
      product: updatedProduct,
      costHistory,
    };
  }

  async getPriceHistory(productId: string) {
    await this.findOne(productId);
    return this.prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCostHistory(productId: string) {
    await this.findOne(productId);
    return this.prisma.costPriceHistory.findMany({
      where: { productId },
      orderBy: { importDate: 'desc' },
    });
  }

  async getPriceAnalytics(shopId?: string, productId?: string, range: string = '30d') {
    let whereProduct: any = {};
    if (productId) whereProduct.id = productId;
    if (shopId) whereProduct.shopId = shopId;

    const products = await this.prisma.product.findMany({
      where: Object.keys(whereProduct).length > 0 ? whereProduct : undefined,
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        originalPrice: true,
        costPrice: true,
        stock: true,
        sales: true,
        category: true,
        shopId: true,
        createdAt: true,
      },
    });

    if (products.length === 0) {
      return {
        products: [],
        timeline: [],
        priceHistories: [],
        costHistories: [],
        summary: {
          currentSellingPrice: 0,
          currentCostPrice: 0,
          profitMargin: 0,
          marginPercentage: 0,
          totalImportedQuantity: 0,
          totalPriceChangesCount: 0,
          totalBatchesCount: 0,
        },
      };
    }

    const targetProductIds = products.map((p) => p.id);

    // Xử lý khoảng thời gian
    let startDate: Date | undefined = undefined;
    const now = new Date();
    if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === '1y') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const priceWhere: any = {
      productId: { in: targetProductIds },
    };
    const costWhere: any = {
      productId: { in: targetProductIds },
    };
    if (startDate) {
      priceWhere.createdAt = { gte: startDate };
      costWhere.importDate = { gte: startDate };
    }

    const [priceHistories, costHistories] = await Promise.all([
      this.prisma.priceHistory.findMany({
        where: priceWhere,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.costPriceHistory.findMany({
        where: costWhere,
        orderBy: { importDate: 'asc' },
      }),
    ]);

    // Lập bản đồ sản phẩm để gán tên và thông tin
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Tạo các mốc thời gian tổng hợp cho biểu đồ
    const timelineMap = new Map<string, any>();

    // 1. Ghi nhận các điểm thay đổi giá bán
    for (const ph of priceHistories) {
      const dateStr = ph.createdAt.toISOString().slice(0, 10);
      const prod = productMap.get(ph.productId);
      const existing = timelineMap.get(dateStr) || {
        date: dateStr,
        timestamp: ph.createdAt.getTime(),
        sellingPrice: ph.newPrice,
        costPrice: prod?.costPrice || (ph.newPrice * 0.7),
        events: [],
      };
      existing.sellingPrice = ph.newPrice;
      existing.timestamp = ph.createdAt.getTime();
      existing.events.push({
        type: 'PRICE_CHANGE',
        oldPrice: ph.oldPrice,
        newPrice: ph.newPrice,
        changedBy: ph.changedBy,
        reason: ph.reason,
        productName: prod?.name,
        time: ph.createdAt,
      });
      timelineMap.set(dateStr, existing);
    }

    // 2. Ghi nhận các điểm hóa đơn giá nhập
    for (const ch of costHistories) {
      const dateStr = ch.importDate.toISOString().slice(0, 10);
      const prod = productMap.get(ch.productId);
      const curSelling = prod ? parseFloat(prod.price) || 0 : 0;
      const existing = timelineMap.get(dateStr) || {
        date: dateStr,
        timestamp: ch.importDate.getTime(),
        sellingPrice: curSelling,
        costPrice: ch.costPrice,
        events: [],
      };
      existing.costPrice = ch.costPrice;
      existing.events.push({
        type: 'COST_IMPORT',
        costPrice: ch.costPrice,
        quantity: ch.quantity,
        invoiceCode: ch.invoiceCode,
        supplier: ch.supplier,
        importedBy: ch.importedBy,
        note: ch.note,
        productName: prod?.name,
        time: ch.importDate,
      });
      timelineMap.set(dateStr, existing);
    }

    // Nếu là xem 1 sản phẩm cụ thể và chưa có nhiều điểm, đảm bảo có điểm khởi tạo & điểm hiện tại
    if (productId && products.length === 1) {
      const prod = products[0];
      const curSelling = parseFloat(prod.price) || 0;
      const curCost = prod.costPrice || (curSelling * 0.7);
      const todayStr = now.toISOString().slice(0, 10);
      if (!timelineMap.has(todayStr)) {
        timelineMap.set(todayStr, {
          date: todayStr,
          timestamp: now.getTime(),
          sellingPrice: curSelling,
          costPrice: curCost,
          events: [],
        });
      }
      const createdStr = prod.createdAt.toISOString().slice(0, 10);
      if (!timelineMap.has(createdStr)) {
        timelineMap.set(createdStr, {
          date: createdStr,
          timestamp: prod.createdAt.getTime(),
          sellingPrice: curSelling,
          costPrice: curCost,
          events: [],
        });
      }
    }

    // Sắp xếp timeline theo thứ tự thời gian tăng dần
    const timeline = Array.from(timelineMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((item) => {
        const profitMargin = item.sellingPrice - item.costPrice;
        const marginPercentage = item.sellingPrice > 0 ? (profitMargin / item.sellingPrice) * 100 : 0;
        return {
          ...item,
          profitMargin,
          marginPercentage: Number(marginPercentage.toFixed(2)),
        };
      });

    // Tính toán số liệu tổng kết KPI
    let currentSellingPrice = 0;
    let currentCostPrice = 0;
    if (productId && products.length === 1) {
      currentSellingPrice = parseFloat(products[0].price) || 0;
      currentCostPrice = products[0].costPrice || 0;
    } else {
      currentSellingPrice = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / (products.length || 1);
      currentCostPrice = products.reduce((sum, p) => sum + (p.costPrice || 0), 0) / (products.length || 1);
    }
    const profitMargin = currentSellingPrice - currentCostPrice;
    const marginPercentage = currentSellingPrice > 0 ? (profitMargin / currentSellingPrice) * 100 : 0;
    const totalImportedQuantity = costHistories.reduce((sum, c) => sum + c.quantity, 0);

    const selectedProd = products.find(p => p.id === productId) || products[0];

    return {
      product: selectedProd ? {
        id: selectedProd.id,
        name: selectedProd.name,
        currentSellingPrice: parseFloat(selectedProd.price) || 0,
        currentCostPrice: selectedProd.costPrice || 0,
      } : null,
      products,
      timeline,
      chartData: timeline,
      priceHistories: priceHistories.slice().reverse(),
      costHistories: costHistories.slice().reverse(),
      metrics: {
        currentSellingPrice: Math.round(currentSellingPrice),
        currentCostPrice: Math.round(currentCostPrice),
        marginAmount: Math.round(profitMargin),
        marginPercent: Number(marginPercentage.toFixed(2)),
        totalPriceChanges: priceHistories.length,
        totalBatches: costHistories.length,
      },
      summary: {
        currentSellingPrice: Math.round(currentSellingPrice),
        currentCostPrice: Math.round(currentCostPrice),
        profitMargin: Math.round(profitMargin),
        marginPercentage: Number(marginPercentage.toFixed(2)),
        totalImportedQuantity,
        totalPriceChangesCount: priceHistories.length,
        totalBatchesCount: costHistories.length,
      },
    };
  }
}
