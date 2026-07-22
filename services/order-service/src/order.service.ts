import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';

@Injectable()
export class OrderService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      console.log('[Kafka] OrderService connected to Kafka successfully');
    } catch (e) {
      console.error('[Kafka] OrderService failed to connect to Kafka:', e);
    }
    this.startAutoCancelScanner();
  }

  private startAutoCancelScanner() {
    // Quét mỗi 5 phút một lần
    setInterval(async () => {
      try {
        await this.cancelOverdueOrders();
      } catch (err) {
        console.error('[AutoCancel] Error scanning overdue orders:', err);
      }
    }, 5 * 60 * 1000);
    
    // Chạy kiểm tra ban đầu sau 10 giây
    setTimeout(async () => {
      try {
        await this.cancelOverdueOrders();
      } catch (err) {
        console.error('[AutoCancel] Initial scan error:', err);
      }
    }, 10000);
  }

  async cancelOverdueOrders() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    console.log(`[AutoCancel] Scanning for PENDING_PAYMENT orders created before: ${oneDayAgo.toISOString()}`);

    const overdueOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });

    if (overdueOrders.length === 0) {
      return;
    }

    console.log(`[AutoCancel] Found ${overdueOrders.length} overdue orders. Proceeding to cancel...`);

    for (const order of overdueOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
      console.log(`[AutoCancel] Cancelled overdue order: ${order.id}`);
    }
  }

  async createOrder(dto: CreateOrderDto) {
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
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
          ghnDistrictId: dto.ghnDistrictId || null,
          ghnWardCode: dto.ghnWardCode || null,
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

      return newOrder;
    });

    // Bắn sự kiện order.created sang Kafka bất đồng bộ sau khi lưu DB thành công
    try {
      this.kafkaClient.emit('order.created', JSON.stringify({
        orderId: order.id,
        buyerId: order.buyerId,
        buyerEmail: order.buyerEmail,
        buyerName: order.buyerName,
        buyerPhone: order.buyerPhone,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        shippingFee: order.shippingFee,
        paymentMethod: order.paymentMethod,
        status: order.status,
        items: order.items,
        createdAt: order.createdAt,
      }));
      console.log(`[Kafka] Published order.created event for order ${order.id}`);
    } catch (e) {
      console.error('[Kafka] Failed to publish order.created event:', e);
    }

    return order;
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
      include: {
        items: true,
      },
    });

    if (!exists) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updateData: any = {
      status: dto.status,
    };
    if (dto.ghnOrderCode !== undefined) {
      updateData.ghnOrderCode = dto.ghnOrderCode;
    }
    if (dto.refundReason !== undefined) {
      updateData.refundReason = dto.refundReason;
    }
    if (dto.refundDescription !== undefined) {
      updateData.refundDescription = dto.refundDescription;
    }
    if (dto.refundEmail !== undefined) {
      updateData.refundEmail = dto.refundEmail;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    if (dto.status === 'COMPLETED' && exists.status !== 'COMPLETED') {
      try {
        const payload = {
          orderId: exists.id,
          totalAmount: exists.totalAmount,
          items: exists.items.map(item => ({
            shopId: item.shopId,
            amount: item.price * item.quantity
          }))
        };
        await fetch('http://payment-service:3005/payments/credit-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('Error calling payment-service for shop revenue:', err);
      }
    }

    return updatedOrder;
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
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
