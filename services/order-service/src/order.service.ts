import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          buyerId: dto.buyerId,
          buyerEmail: dto.buyerEmail,
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          shippingAddress: dto.shippingAddress,
          totalAmount: dto.totalAmount,
          shippingFee: dto.shippingFee,
          paymentMethod: dto.paymentMethod,
          status: dto.paymentMethod === 'cod' ? 'PROCESSING' : 'PENDING_PAYMENT',
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              shopId: item.shopId,
              name: item.name,
              image: item.image,
              variant: item.variant || null,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    });
  }

  async getOrdersByBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrdersBySeller(shopId: string) {
    return this.prisma.order.findMany({
      where: {
        items: {
          some: {
            shopId: shopId,
          },
        },
      },
      include: {
        items: {
          where: {
            shopId: shopId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const exists = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        items: true,
      },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }
}
