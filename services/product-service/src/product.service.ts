import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { CreateReviewDto } from './review.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(shopId?: string) {
    if (shopId) {
      return this.prisma.product.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Sản phẩm với ID ${id} không tồn tại`);
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        shopId: dto.shopId,
        name: dto.name,
        image: dto.image,
        category: dto.category,
        brand: dto.brand,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        sales: dto.sales ?? 0,
        status: dto.status,
        sku: dto.sku,
        variationsText: dto.variationsText,
        hasVariations: dto.hasVariations ?? false,
        variationGroups: dto.variationGroups,
        variationRows: dto.variationRows,
        weight: dto.weight,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        condition: dto.condition ?? 'new',
        isPreOrder: dto.isPreOrder ?? false,
        preOrderDays: dto.preOrderDays,
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
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        image: dto.image,
        category: dto.category,
        brand: dto.brand,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        sales: dto.sales,
        status: dto.status,
        sku: dto.sku,
        variationsText: dto.variationsText,
        hasVariations: dto.hasVariations,
        variationGroups: dto.variationGroups,
        variationRows: dto.variationRows,
        weight: dto.weight,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        condition: dto.condition,
        isPreOrder: dto.isPreOrder,
        preOrderDays: dto.preOrderDays,
      },
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
        username: dto.username,
        rating: dto.rating,
        comment: dto.comment,
        variant: dto.variant,
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
}
