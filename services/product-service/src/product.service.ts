import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateProductDto, UpdateProductDto, UpdatePriceDto, ImportBatchDto, RegisterFlashSaleDto } from './product.dto';
import { CreateReviewDto } from './review.dto';
import { findProhibitedKeyword } from './banned-words';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(shopId?: string, category?: string, search?: string, inStockOnly?: string) {
    const andConditions: any[] = [];

    if (inStockOnly === 'true' || (!shopId && inStockOnly !== 'false')) {
      andConditions.push({
        stock: { gt: 0 },
        status: { not: 'hidden' }
      });
    }

    if (shopId) {
      andConditions.push({ shopId });
    }

    if (category && category !== 'all') {
      const trimmed = category.trim();
      andConditions.push({
        OR: [
          { category: { contains: trimmed, mode: 'insensitive' } },
          { categoryRef: { slug: { equals: trimmed, mode: 'insensitive' } } },
          { categoryRef: { name: { contains: trimmed, mode: 'insensitive' } } },
        ],
      });
    }

    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      andConditions.push({
        OR: [
          { name: { contains: trimmedSearch, mode: 'insensitive' } },
          { description: { contains: trimmedSearch, mode: 'insensitive' } },
          { brand: { contains: trimmedSearch, mode: 'insensitive' } },
          { category: { contains: trimmedSearch, mode: 'insensitive' } },
          { sku: { contains: trimmedSearch, mode: 'insensitive' } },
        ],
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : undefined;

    const products = await this.prisma.product.findMany({
      where: whereClause,
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
    const productName = String(dto.name || 'Sản phẩm mới');
    const prohibitedWord = findProhibitedKeyword(productName);
    if (prohibitedWord) {
      throw new BadRequestException(`Tên sản phẩm chứa từ ngữ bị cấm không được phép kinh doanh: "${prohibitedWord}". Vui lòng sửa lại tên sản phẩm!`);
    }

    const description = String(dto.description || '');
    const prohibitedWordDesc = findProhibitedKeyword(description);
    if (prohibitedWordDesc) {
      throw new BadRequestException(`Mô tả sản phẩm chứa từ ngữ bị cấm không được phép kinh doanh: "${prohibitedWordDesc}". Vui lòng sửa lại mô tả sản phẩm!`);
    }

    const imagesStr = typeof dto.images === 'string' ? dto.images : (dto.images ? JSON.stringify(dto.images) : '[]');
    const isHasVariations = Boolean(dto.hasVariations);
    const variationGroupsStr = isHasVariations && dto.variationGroups && dto.variationGroups !== '[]' && dto.variationGroups !== 'null'
      ? (typeof dto.variationGroups === 'string' ? dto.variationGroups : JSON.stringify(dto.variationGroups))
      : null;
    const variationRowsStr = isHasVariations && dto.variationRows && dto.variationRows !== '[]' && dto.variationRows !== 'null'
      ? (typeof dto.variationRows === 'string' ? dto.variationRows : JSON.stringify(dto.variationRows))
      : null;
    let categoryStr = typeof dto.category === 'string' ? dto.category : ((dto.category as any)?.name || 'Tổng Hợp');
    let categoryId = (dto as any).categoryId || null;

    if (!categoryId && categoryStr) {
      const foundCat = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: categoryStr, mode: 'insensitive' } },
            { slug: { equals: categoryStr.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } },
          ],
        },
      });
      if (foundCat) {
        categoryId = foundCat.id;
        categoryStr = foundCat.name;
      }
    } else if (categoryId) {
      const foundCat = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (foundCat) {
        categoryStr = foundCat.name;
      }
    }

    const product = await this.prisma.product.create({
      data: {
        shopId: String(dto.shopId),
        name: productName,
        image: dto.image ? String(dto.image) : null,
        images: imagesStr,
        video: dto.video ? String(dto.video) : null,
        category: categoryStr,
        categoryId: categoryId,
        brand: dto.brand ? String(dto.brand) : 'No Brand',
        description: dto.description ? String(dto.description) : String(dto.name || 'Mô tả sản phẩm'),
        price: typeof dto.price === 'number' ? dto.price : (parseFloat(String(dto.price || '0').replace(/[^0-9.]/g, '')) || 0),
        originalPrice: dto.originalPrice != null ? (typeof dto.originalPrice === 'number' ? dto.originalPrice : (parseFloat(String(dto.originalPrice).replace(/[^0-9.]/g, '')) || null)) : null,
        costPrice: dto.costPrice != null ? Number(dto.costPrice) : ((typeof dto.price === 'number' ? dto.price : parseFloat(String(dto.price || '0'))) * 0.7 || 0),
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
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, stock: true },
        });
        if (!prod) {
          throw new BadRequestException(`Sản phẩm không tồn tại (ID: ${item.productId})`);
        }
        if (prod.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${prod.name}" không đủ số lượng trong kho (Còn: ${prod.stock}, Yêu cầu: ${item.quantity})`,
          );
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            sales: { increment: item.quantity },
          },
        });
      }
      return { success: true };
    });
  }

  async restock(items: { productId: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, sales: true },
        });
        if (prod) {
          const newSalesDecrement = Math.min(prod.sales, item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              sales: { decrement: newSalesDecrement },
            },
          });
        }
      }
      return { success: true };
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Ensure product exists
    const updateData: any = {};

    if (dto.name !== undefined) {
      const nameStr = String(dto.name);
      const prohibitedWord = findProhibitedKeyword(nameStr);
      if (prohibitedWord) {
        throw new BadRequestException(`Tên sản phẩm chứa từ ngữ bị cấm không được phép kinh doanh: "${prohibitedWord}". Vui lòng sửa lại tên sản phẩm!`);
      }
      updateData.name = nameStr;
    }
    if (dto.image !== undefined) updateData.image = dto.image ? String(dto.image) : null;
    if (dto.images !== undefined) updateData.images = typeof dto.images === 'string' ? dto.images : (dto.images ? JSON.stringify(dto.images) : '[]');
    if (dto.video !== undefined) updateData.video = dto.video ? String(dto.video) : null;
    if (dto.category !== undefined || (dto as any).categoryId !== undefined) {
      let categoryStr = typeof dto.category === 'string' ? dto.category : ((dto.category as any)?.name || 'Tổng Hợp');
      let categoryId = (dto as any).categoryId || null;

      if (!categoryId && categoryStr) {
        const foundCat = await this.prisma.category.findFirst({
          where: {
            OR: [
              { name: { equals: categoryStr, mode: 'insensitive' } },
              { slug: { equals: categoryStr.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } },
            ],
          },
        });
        if (foundCat) {
          categoryId = foundCat.id;
          categoryStr = foundCat.name;
        }
      } else if (categoryId) {
        const foundCat = await this.prisma.category.findUnique({
          where: { id: categoryId },
        });
        if (foundCat) {
          categoryStr = foundCat.name;
        }
      }
      updateData.category = categoryStr;
      updateData.categoryId = categoryId;
    }
    if (dto.brand !== undefined) updateData.brand = String(dto.brand);
    if (dto.description !== undefined) {
      const descStr = String(dto.description);
      const prohibitedWordDesc = findProhibitedKeyword(descStr);
      if (prohibitedWordDesc) {
        throw new BadRequestException(`Mô tả sản phẩm chứa từ ngữ bị cấm không được phép kinh doanh: "${prohibitedWordDesc}". Vui lòng sửa lại mô tả sản phẩm!`);
      }
      updateData.description = descStr;
    }
    if (dto.price !== undefined) {
      updateData.price = typeof dto.price === 'number' ? dto.price : (parseFloat(String(dto.price).replace(/[^0-9.]/g, '')) || 0);
    }
    if (dto.originalPrice !== undefined) {
      updateData.originalPrice = dto.originalPrice != null ? (typeof dto.originalPrice === 'number' ? dto.originalPrice : (parseFloat(String(dto.originalPrice).replace(/[^0-9.]/g, '')) || null)) : null;
    }
    if (dto.stock !== undefined) updateData.stock = typeof dto.stock === 'number' ? dto.stock : parseInt(String(dto.stock || '0'), 10) || 0;
    if (dto.sales !== undefined) updateData.sales = typeof dto.sales === 'number' ? dto.sales : parseInt(String(dto.sales || '0'), 10) || 0;
    if (dto.hasVariations !== undefined) {
      updateData.hasVariations = Boolean(dto.hasVariations);
      if (!updateData.hasVariations) {
        updateData.variationGroups = null;
        updateData.variationRows = null;
        updateData.variationsText = null;
      }
    }
    if (dto.variationGroups !== undefined && updateData.hasVariations !== false) {
      if (!dto.variationGroups || dto.variationGroups === '[]' || dto.variationGroups === 'null') {
        updateData.variationGroups = null;
      } else {
        updateData.variationGroups = typeof dto.variationGroups === 'string' ? dto.variationGroups : JSON.stringify(dto.variationGroups);
      }
    }
    if (dto.variationRows !== undefined && updateData.hasVariations !== false) {
      if (!dto.variationRows || dto.variationRows === '[]' || dto.variationRows === 'null') {
        updateData.variationRows = null;
      } else {
        updateData.variationRows = typeof dto.variationRows === 'string' ? dto.variationRows : JSON.stringify(dto.variationRows);
      }
    }
    if (dto.variationsText !== undefined && updateData.hasVariations !== false) {
      updateData.variationsText = dto.variationsText ? String(dto.variationsText) : null;
    }
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
      const oldPrice = Number(currentProduct.price) || 0;
      const newPrice = Number(updateData.price) || 0;
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
    const review = await this.prisma.review.create({
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

    // Tạo thông báo cho Shop khi có đánh giá mới
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, shopId: true },
      });

      if (product?.shopId) {
        const notifServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
        const stars = '⭐'.repeat(dto.rating || 5);
        const reviewer = dto.username || 'Khách hàng';
        const shortComment = dto.comment ? ` - "${dto.comment.slice(0, 60)}..."` : '';

        fetch(`${notifServiceUrl}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: product.shopId,
            title: `Đánh giá mới ${stars}`,
            content: `${reviewer} vừa đánh giá ${dto.rating} sao cho sản phẩm "${product.name}"${shortComment}`,
            type: 'SYSTEM',
            metadata: { action: 'VIEW_REVIEWS', productId, reviewId: review.id },
          }),
        }).catch((err) => console.error('Error sending review notification to shop:', err));
      }
    } catch (notifErr) {
      console.error('Failed to trigger review notification:', notifErr);
    }

    return review;
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
    // 1. Tự động đồng bộ các sản phẩm chưa có categoryId hoặc sai tên
    try {
      const allCategories = await this.prisma.category.findMany();
      const unlinkedProducts = await this.prisma.product.findMany({
        where: { categoryId: null },
        select: { id: true, category: true },
      });

      for (const p of unlinkedProducts) {
        const pCat = (p.category || '').toLowerCase().trim();
        const matched = allCategories.find((c) => {
          const cName = c.name.toLowerCase().trim();
          const cSlug = c.slug.toLowerCase().trim();
          return (
            cName === pCat ||
            cSlug === pCat ||
            cSlug === pCat.replace(/\s+/g, '-') ||
            pCat.includes(cName) ||
            cName.includes(pCat)
          );
        });

        if (matched) {
          await this.prisma.product.update({
            where: { id: p.id },
            data: { categoryId: matched.id, category: matched.name },
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Auto sync categoryId error:', err);
    }

    const list = await this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return list.map((c) => ({
      ...c,
      productCount: c._count.products,
    }));
  }

  async createCategory(name: string) {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const created = await this.prisma.category.create({
      data: { name, slug },
    });

    // Đồng bộ các sản phẩm có cùng tên ngành hàng
    await this.prisma.product.updateMany({
      where: {
        category: { equals: name, mode: 'insensitive' },
      },
      data: {
        categoryId: created.id,
        category: created.name,
      },
    }).catch(() => {});

    return created;
  }

  async updateCategory(id: string, name: string) {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const oldCat = await this.prisma.category.findUnique({ where: { id } });
    const updated = await this.prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    if (oldCat) {
      await this.prisma.product.updateMany({
        where: {
          OR: [
            { categoryId: id },
            { category: { equals: oldCat.name, mode: 'insensitive' } },
          ],
        },
        data: {
          categoryId: id,
          category: name,
        },
      }).catch(() => {});
    }

    return updated;
  }

  async deleteCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    
    // Gỡ liên kết categoryId từ các sản phẩm thuộc danh mục này
    await this.prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    }).catch(() => {});

    return this.prisma.category.delete({
      where: { id },
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
    let list = await this.prisma.flashSale.findMany({
      include: {
        items: true,
      },
    });

    const targetSlots = [
      '00:00 - 03:00',
      '03:00 - 06:00',
      '06:00 - 09:00',
      '09:00 - 12:00',
      '12:00 - 15:00',
      '15:00 - 18:00',
      '18:00 - 21:00',
      '21:00 - 24:00',
    ];

    const existingSlotNames = new Set(list.map((s) => s.timeSlot));
    const missingSlots = targetSlots.filter((s) => !existingSlotNames.has(s));

    if (missingSlots.length > 0) {
      for (const slotName of missingSlots) {
        try {
          await this.prisma.flashSale.create({
            data: {
              timeSlot: slotName,
              productsCount: 0,
              status: 'UPCOMING',
            },
          });
        } catch (e) {}
      }

      // Clean up legacy non-3-hour empty slots
      const legacySlots = list.filter((s) => !targetSlots.includes(s.timeSlot));
      for (const legacy of legacySlots) {
        if (!legacy.items || legacy.items.length === 0) {
          try {
            await this.prisma.flashSale.delete({ where: { id: legacy.id } });
          } catch (e) {}
        }
      }

      list = await this.prisma.flashSale.findMany({
        include: { items: true },
      });
    }

    const sorted = [...list].sort((a, b) => {
      const rangeA = this.parseTimeRange(a.timeSlot);
      const rangeB = this.parseTimeRange(b.timeSlot);
      return (rangeA?.start ?? 0) - (rangeB?.start ?? 0);
    });

    return sorted.map((s) => ({
      ...s,
      productsCount: s.items ? s.items.length : s.productsCount,
    }));
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

  async getActiveFlashSale() {
    // Luôn tính toán chính xác theo Giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const nowHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const nowMinutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const nowSeconds = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);

    let allSlots = await this.prisma.flashSale.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (allSlots.length === 0) {
      await this.getFlashSales();
      allSlots = await this.prisma.flashSale.findMany({
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Check if any slot is matching current real-time clock
    let activeSlot = allSlots.find(slot => {
      const range = this.parseTimeRange(slot.timeSlot);
      return range && nowHour >= range.start && nowHour < range.end;
    });

    if (!activeSlot) {
      activeSlot = allSlots.find(s => s.status === 'RUNNING') || allSlots[0];
    }

    if (!activeSlot) return null;

    // Calculate remaining seconds to end of slot
    const range = this.parseTimeRange(activeSlot.timeSlot);
    let remainingSeconds = 7200; // fallback 2 hours
    if (range) {
      const endHour = range.end;
      const currentSecondsInDay = nowHour * 3600 + nowMinutes * 60 + nowSeconds;
      const endSecondsInDay = endHour * 3600;
      if (endSecondsInDay > currentSecondsInDay) {
        remainingSeconds = endSecondsInDay - currentSecondsInDay;
      } else {
        remainingSeconds = 3600;
      }
    }

    // Map registered items
    const flashProducts = (activeSlot.items || [])
      .filter(item => item.product && item.product.stock > 0 && item.product.status !== 'hidden')
      .map(item => {
        const orig = item.originalPrice || parseFloat(String(item.product?.price || 0)) || 0;
        const flash = item.flashPrice;
        const discountPct = orig > 0 ? Math.round((1 - flash / orig) * 100) : 0;
        return {
          id: item.product.id,
          name: item.product.name,
          originalPrice: orig.toLocaleString('vi-VN') + 'đ',
          flashPrice: flash.toLocaleString('vi-VN') + 'đ',
          rawPrice: flash,
          rawOriginalPrice: orig,
          image: item.product.image || '',
          sold: item.stockSold || 0,
          total: item.stockLimit || 10,
          stock: item.product.stock,
          status: item.product.status,
          discountPercent: discountPct,
          shopId: item.shopId,
        };
      });

    return {
      slotId: activeSlot.id,
      timeSlot: activeSlot.timeSlot,
      status: 'RUNNING',
      remainingSeconds,
      products: flashProducts,
    };
  }

  async getShopFlashSales(shopId: string) {
    return this.prisma.flashSaleItem.findMany({
      where: { shopId },
      include: {
        flashSale: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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

  async registerFlashSale(slotId: string, dto: RegisterFlashSaleDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm!');
    }

    if (product.stock <= 0 || product.status === 'hidden') {
      throw new BadRequestException('Sản phẩm này hiện có số lượng tồn bằng 0 hoặc đang bị ẩn, không thể tham gia Flash Sale!');
    }

    const slot = await this.prisma.flashSale.findUnique({
      where: { id: slotId },
    });
    if (!slot) {
      throw new NotFoundException('Không tìm thấy khung giờ Flash Sale!');
    }

    if (dto.saleDate) {
      const today = new Date().toISOString().split('T')[0];
      if (dto.saleDate < today) {
        throw new BadRequestException('Ngày diễn ra Flash Sale không được là ngày trong quá khứ (trước ngày hiện hành)!');
      }
    }

    const currentPrice = parseFloat(String(product.price).replace(/[^0-9]/g, '')) || 0;
    const origPrice = product.originalPrice ? parseFloat(String(product.originalPrice).replace(/[^0-9]/g, '')) : currentPrice;

    // Upsert FlashSaleItem
    const item = await this.prisma.flashSaleItem.upsert({
      where: {
        flashSaleId_productId: {
          flashSaleId: slotId,
          productId: dto.productId,
        },
      },
      create: {
        flashSaleId: slotId,
        productId: dto.productId,
        shopId: dto.shopId,
        flashPrice: dto.flashPrice,
        originalPrice: origPrice,
        stockLimit: dto.stockLimit,
        stockSold: 0,
        status: 'ACTIVE',
      },
      update: {
        flashPrice: dto.flashPrice,
        originalPrice: origPrice,
        stockLimit: dto.stockLimit,
        status: 'ACTIVE',
      },
    });

    // Update Product price to flash price
    await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        price: Number(dto.flashPrice),
        originalPrice: Number(origPrice),
      },
    });

    // Update productsCount on slot
    const count = await this.prisma.flashSaleItem.count({
      where: { flashSaleId: slotId },
    });
    await this.prisma.flashSale.update({
      where: { id: slotId },
      data: { productsCount: count },
    });

    return item;
  }

  async deleteFlashSaleItem(itemId: string) {
    const item = await this.prisma.flashSaleItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy bản ghi Flash Sale!');
    }

    // Restore product price
    await this.prisma.product.update({
      where: { id: item.productId },
      data: {
        price: Number(item.originalPrice),
        originalPrice: null,
      },
    });

    // Delete item
    await this.prisma.flashSaleItem.delete({
      where: { id: itemId },
    });

    // Update productsCount on slot
    const count = await this.prisma.flashSaleItem.count({
      where: { flashSaleId: item.flashSaleId },
    });
    await this.prisma.flashSale.update({
      where: { id: item.flashSaleId },
      data: { productsCount: count },
    });

    return { success: true };
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

    const oldPrice = Number(product.price) || 0;
    const updateData: any = {};
    let recordedReason = dto.reason || 'Cập nhật giá bán sản phẩm';

    // 1. Trường hợp cập nhật mảng variationRows trực tiếp
    if (dto.variationRows) {
      let rows: any[] = [];
      try {
        rows = typeof dto.variationRows === 'string' ? JSON.parse(dto.variationRows) : dto.variationRows;
      } catch (e) {
        throw new BadRequestException('variationRows không hợp lệ');
      }

      if (Array.isArray(rows) && rows.length > 0) {
        const validPrices = rows.map((r: any) => parseFloat(String(r.price || 0).replace(/[^0-9]/g, '')) || 0).filter((v: number) => v > 0);
        if (validPrices.length === 0) {
          throw new BadRequestException('Vui lòng nhập giá bán hợp lệ cho các biến thể');
        }
        const minPrice = Math.min(...validPrices);
        updateData.variationRows = JSON.stringify(rows);
        updateData.price = minPrice;
        
        const origPrices = rows.map((r: any) => parseFloat(String(r.originalPrice || 0).replace(/[^0-9]/g, '')) || 0).filter((v: number) => v > 0);
        if (origPrices.length > 0) {
          updateData.originalPrice = Math.min(...origPrices);
        }
        recordedReason = dto.reason || 'Cập nhật bảng giá biến thể sản phẩm';
      }
    } 
    // 2. Trường hợp cập nhật 1 biến thể cụ thể (dto.variantKey)
    else if (dto.variantKey && product.hasVariations && product.variationRows) {
      let rows: any[] = [];
      try {
        rows = typeof product.variationRows === 'string' ? JSON.parse(product.variationRows) : product.variationRows;
      } catch (e) {}

      const targetRow = rows.find((r: any) => r.key === dto.variantKey || r.name === dto.variantKey);
      if (!targetRow) {
        throw new NotFoundException(`Không tìm thấy biến thể ${dto.variantKey}`);
      }

      const newP = Number(dto.newPrice);
      if (isNaN(newP) || newP < 0) {
        throw new BadRequestException('Giá bán mới không hợp lệ');
      }
      const oldRowPrice = targetRow.price;
      targetRow.price = String(newP);
      if (dto.originalPrice !== undefined) {
        targetRow.originalPrice = String(dto.originalPrice);
      }

      const validPrices = rows.map((r: any) => parseFloat(String(r.price || 0).replace(/[^0-9]/g, '')) || 0).filter((v: number) => v > 0);
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : newP;

      updateData.variationRows = JSON.stringify(rows);
      updateData.price = minPrice;
      recordedReason = dto.reason || `Cập nhật giá biến thể [${targetRow.name || targetRow.key}]: ${oldRowPrice}₫ -> ${newP.toLocaleString('vi-VN')}₫`;
    }
    // 3. Trường hợp cập nhật giá cho sản phẩm đơn lẻ (hoặc cập nhật đồng loạt cho tất cả biến thể)
    else {
      const newPrice = Number(dto.newPrice);
      if (isNaN(newPrice) || newPrice < 0) {
        throw new BadRequestException('Giá mới không hợp lệ');
      }
      updateData.price = newPrice;
      if (dto.originalPrice !== undefined && dto.originalPrice !== null) {
        updateData.originalPrice = Number(dto.originalPrice);
      }

      // Nếu sản phẩm có biến thể và cập nhật đồng loạt giá chung:
      if (product.hasVariations && product.variationRows) {
        try {
          const rows = typeof product.variationRows === 'string' ? JSON.parse(product.variationRows) : product.variationRows;
          if (Array.isArray(rows)) {
            const updatedRows = rows.map((r: any) => ({
              ...r,
              price: String(newPrice),
              originalPrice: dto.originalPrice !== undefined ? String(dto.originalPrice) : r.originalPrice,
            }));
            updateData.variationRows = JSON.stringify(updatedRows);
          }
        } catch (e) {}
      }
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
        newPrice: Number(updateData.price) || Number(dto.newPrice) || oldPrice,
        changeType: 'MANUAL',
        changedBy: dto.changedBy || 'Người bán',
        changedByRole: dto.changedByRole || 'SELLER',
        reason: recordedReason,
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
      throw new BadRequestException('Giá nhập và số lượng nhập phải lớn hơn 0');
    }

    const importDate = dto.importDate ? new Date(dto.importDate) : new Date();
    const updateData: any = {
      costPrice: costPrice,
    };

    let variantLabel = '';

    // Nếu nhập hàng theo biến thể cụ thể
    if (dto.variantKey && product.hasVariations && product.variationRows) {
      try {
        const rows = typeof product.variationRows === 'string' ? JSON.parse(product.variationRows) : product.variationRows;
        const targetRow = rows.find((r: any) => r.key === dto.variantKey || r.name === dto.variantKey);
        if (targetRow) {
          targetRow.stock = String((parseInt(String(targetRow.stock || 0), 10) || 0) + quantity);
          targetRow.costPrice = costPrice;
          variantLabel = ` (Biến thể: ${targetRow.name || targetRow.key})`;
          updateData.variationRows = JSON.stringify(rows);
          updateData.stock = rows.reduce((sum: number, r: any) => sum + (parseInt(String(r.stock || 0), 10) || 0), 0);
        } else {
          updateData.stock = { increment: quantity };
        }
      } catch (e) {
        updateData.stock = { increment: quantity };
      }
    } else if (dto.variationRows) {
      try {
        const rows = typeof dto.variationRows === 'string' ? JSON.parse(dto.variationRows) : dto.variationRows;
        updateData.variationRows = JSON.stringify(rows);
        updateData.stock = rows.reduce((sum: number, r: any) => sum + (parseInt(String(r.stock || 0), 10) || 0), 0);
      } catch (e) {
        updateData.stock = { increment: quantity };
      }
    } else {
      updateData.stock = { increment: quantity };
      // Nếu sản phẩm có biến thể mà nhập chung: cập nhật costPrice cho các dòng
      if (product.hasVariations && product.variationRows) {
        try {
          const rows = typeof product.variationRows === 'string' ? JSON.parse(product.variationRows) : product.variationRows;
          if (Array.isArray(rows) && rows.length > 0) {
            rows.forEach((r: any) => { r.costPrice = costPrice; });
            updateData.variationRows = JSON.stringify(rows);
          }
        } catch (e) {}
      }
    }

    const costHistory = await this.prisma.costPriceHistory.create({
      data: {
        productId: product.id,
        shopId: product.shopId,
        costPrice: costPrice,
        quantity: quantity,
        invoiceCode: dto.invoiceCode || `HD-NK-${Date.now().toString().slice(-6)}`,
        supplier: dto.supplier || 'Nhà cung cấp',
        note: (dto.note || 'Nhập hàng vào kho') + variantLabel,
        importedBy: dto.importedBy || 'Quản lý kho',
        importDate: importDate,
      },
    });

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
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
      const curSelling = prod ? Number(prod.price) || 0 : 0;
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
      const curSelling = Number(prod.price) || 0;
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
      currentSellingPrice = Number(products[0].price) || 0;
      currentCostPrice = products[0].costPrice || 0;
    } else {
      currentSellingPrice = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / (products.length || 1);
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
        currentSellingPrice: Number(selectedProd.price) || 0,
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
