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
      if (order.appliedVoucherIds) {
        this.rollbackVouchers(order.appliedVoucherIds);
      }
      console.log(`[AutoCancel] Cancelled overdue order: ${order.id}`);
    }
  }

  private generateNumericOrderId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0'); // Miligiây (000-999)
    const rand = Math.floor(10 + Math.random() * 90); // 2 số ngẫu nhiên (10-99)
    return `${yy}${mm}${dd}${hh}${min}${ss}${ms}${rand}`;
  }

  async createOrder(dto: CreateOrderDto) {
    const customOrderId = this.generateNumericOrderId();

    // Lấy tỉ lệ chiết khấu hiện tại từ payment-service và bảo lưu vào đơn hàng
    let commissionRate = 5;
    try {
      const cfgRes = await fetch('http://payment-service:3005/payments/system-config/commission_rate');
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        commissionRate = parseFloat(cfgData.value) || 5;
      }
    } catch (e) {
      console.warn('[Order] Could not fetch commission rate, using default 5%');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order with pure numeric ID (e.g. 260723849102)
      const newOrder = await tx.order.create({
        data: {
          id: customOrderId,
          buyerId: dto.buyerId,
          buyerEmail: dto.buyerEmail,
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          shippingAddress: dto.shippingAddress,
          totalAmount: dto.totalAmount,
          shippingFee: dto.shippingFee,
          paymentMethod: dto.paymentMethod,
          status: dto.paymentMethod === 'cod' ? 'PROCESSING' : 'PENDING_PAYMENT',
          shopDiscountAmount: dto.shopDiscountAmount || 0,
          platformDiscountAmount: dto.platformDiscountAmount || 0,
          shopVoucherCode: dto.shopVoucherCode || null,
          platformVoucherCode: dto.platformVoucherCode || null,
          appliedVoucherIds: dto.appliedVoucherIds || null,
          ghnDistrictId: dto.ghnDistrictId || null,
          ghnWardCode: dto.ghnWardCode || null,
          commissionRate: commissionRate,
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

    // Nếu đơn hàng COD (status = PROCESSING ngay từ đầu), cập nhật ngay số lượng đã bán (sales) và kho (stock)
    if (order.status === 'PROCESSING') {
      this.notifyProductPurchase(order.items);
    }

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

  private async notifyProductPurchase(items: { productId: string; quantity: number }[]) {
    if (!items || items.length === 0) return;
    try {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
      const url = `${productServiceUrl}/products/purchase`;
      console.log(`[OrderService] Notifying product-service of purchase for ${items.length} items at ${url}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      if (res.ok) {
        console.log('[OrderService] Product sales and stock updated successfully');
      } else {
        console.error('[OrderService] Product service returned error:', res.status);
      }
    } catch (err) {
      console.error('[OrderService] Error calling product-service purchase endpoint:', err);
    }
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

    const isPaidStatus = ['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'SUCCESS'].includes(dto.status);
    const wasUnpaidStatus = ['PENDING', 'PENDING_PAYMENT', 'UNPAID'].includes(exists.status);

    if (isPaidStatus && wasUnpaidStatus) {
      this.notifyProductPurchase(exists.items);
    }

    if (dto.status === 'CANCELLED' && exists.status !== 'CANCELLED' && exists.appliedVoucherIds) {
      this.rollbackVouchers(exists.appliedVoucherIds);
    }

    // Bắn sự kiện order.updated sang Kafka để gửi thông báo Realtime cho Khách hàng
    try {
      this.kafkaClient.emit('order.updated', JSON.stringify({
        orderId: updatedOrder.id,
        buyerId: updatedOrder.buyerId,
        buyerName: updatedOrder.buyerName,
        status: updatedOrder.status,
        previousStatus: exists.status,
        items: updatedOrder.items,
        updatedAt: updatedOrder.updatedAt,
      }));
      console.log(`[Kafka] Published order.updated event for order ${updatedOrder.id} with status ${updatedOrder.status}`);
    } catch (e) {
      console.error('[Kafka] Failed to publish order.updated event:', e);
    }

    if ((dto.status === 'DELIVERED' || dto.status === 'COMPLETED') && exists.status !== dto.status) {
      try {
        // Nhóm các item theo shopId và tính tiền Escrow chuẩn: Subtotal - ShopVoucherDiscount
        const shopItemsMap: Record<string, typeof exists.items> = {};
        for (const item of exists.items) {
          if (!shopItemsMap[item.shopId]) shopItemsMap[item.shopId] = [];
          shopItemsMap[item.shopId].push(item);
        }

        const shopCount = Object.keys(shopItemsMap).length;
        const shopDiscountPerShop = shopCount > 0 ? (exists.shopDiscountAmount || 0) / shopCount : 0;

        for (const [shopId, items] of Object.entries(shopItemsMap)) {
          const shopSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const shopEscrowAmount = Math.max(0, shopSubtotal - shopDiscountPerShop);

          await fetch('http://payment-service:3005/payments/escrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: exists.id,
              shopId,
              amount: shopEscrowAmount,
              commissionRate: (exists as any).commissionRate ?? 5,
            }),
          });
          console.log(`[Order] Escrow created for shop ${shopId} order ${exists.id}: ${shopEscrowAmount}đ (subtotal ${shopSubtotal}đ - shopDiscount ${shopDiscountPerShop}đ)`);
        }

        // Nếu chuyển sang COMPLETED (khách bấm Đã Nhận Hàng hoặc Đánh Giá SP), giải ngân ngay lập tức vào Ví Shop!
        if (dto.status === 'COMPLETED') {
          await fetch(`http://payment-service:3005/payments/escrow/${exists.id}/release`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          console.log(`[Order] Escrow released immediately for COMPLETED order ${exists.id}`);
        }
      } catch (err) {
        console.error('[Order] Error managing escrow for order:', err);
      }
    }

    return updatedOrder;
  }

  private async rollbackVouchers(appliedVoucherIdsJson: string) {
    if (!appliedVoucherIdsJson) return;
    try {
      let voucherIds: string[] = [];
      try {
        voucherIds = JSON.parse(appliedVoucherIdsJson);
      } catch {
        voucherIds = appliedVoucherIdsJson.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (voucherIds.length === 0) return;

      const discountServiceUrl = process.env.DISCOUNT_SERVICE_URL || 'http://discount-service:3003';
      console.log(`[OrderService] Rolling back voucher usage for ${voucherIds.length} vouchers`);
      await fetch(`${discountServiceUrl}/discounts/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherIds }),
      });
    } catch (e) {
      console.error('[OrderService] Failed to rollback voucher usage:', e);
    }
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
