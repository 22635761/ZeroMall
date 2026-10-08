import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { randomInt, randomUUID } from 'crypto';

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
    setInterval(
      async () => {
        try {
          await this.cancelOverdueOrders();
        } catch (err) {
          console.error('[AutoCancel] Error scanning overdue orders:', err);
        }
      },
      5 * 60 * 1000,
    );

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

    console.log(
      `[AutoCancel] Scanning for PENDING_PAYMENT orders created before: ${oneDayAgo.toISOString()}`,
    );

    const overdueOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: {
          lt: oneDayAgo,
        },
      },
      include: {
        items: true,
      },
    });

    if (overdueOrders.length === 0) {
      return;
    }

    console.log(
      `[AutoCancel] Found ${overdueOrders.length} overdue orders. Proceeding to cancel...`,
    );

    for (const order of overdueOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
      if (order.appliedVoucherIds) {
        this.rollbackVouchers(order.appliedVoucherIds);
      }
      if (order.items && order.items.length > 0) {
        await this.rollbackProductStock(order.items);
      }

      // Hủy shipment và yêu cầu lấy hàng bên delivery-service
      try {
        const deliveryServiceUrl =
          process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3008';
        await fetch(
          `${deliveryServiceUrl}/delivery/shipments/cancel-by-order/${order.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Đơn hàng quá hạn thanh toán (Auto-Cancel)' }),
          },
        );
      } catch (delErr) {
        console.error(`[AutoCancel] Error cancelling delivery shipment for order ${order.id}:`, delErr);
      }

      console.log(`[AutoCancel] Cancelled overdue order, restored stock & cancelled delivery: ${order.id}`);
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
    const rand = randomInt(100000, 999999);
    return `${yy}${mm}${dd}${hh}${min}${ss}${ms}${rand}`;
  }

  async createOrder(dto: CreateOrderDto) {
    const checkoutGroupId = randomUUID();

    // Lấy tỉ lệ chiết khấu hiện tại từ payment-service và bảo lưu vào đơn hàng
    let commissionRate = 5;
    try {
      const cfgRes = await fetch(
        'http://payment-service:3005/payments/system-config/commission_rate',
      );
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        commissionRate = parseFloat(cfgData.value) || 5;
      }
    } catch (e) {
      console.warn('[Order] Could not fetch commission rate, using default 5%');
    }

    // Group items by shopId
    const itemsByShop: Record<string, typeof dto.items> = {};
    let totalItemsValue = 0;

    for (const item of dto.items) {
      if (!itemsByShop[item.shopId]) {
        itemsByShop[item.shopId] = [];
      }
      itemsByShop[item.shopId].push(item);
      totalItemsValue += item.price * item.quantity;
    }

    const shopIds = Object.keys(itemsByShop);
    const shopCount = shopIds.length;
    const createdOrders: any[] = [];
    
    // Chuẩn Shopee: Trừ/Tạm giữ tồn kho ngay khi bấm đặt hàng
    // Nếu bất kỳ sản phẩm nào không đủ kho, notifyProductPurchase sẽ ném lỗi BadRequestException
    await this.notifyProductPurchase(dto.items);

    const totalRawShippingFee = shopIds.reduce(
      (sum, sId) => sum + (dto.shopShippingFees?.[sId] ?? 22000),
      0,
    );

    try {
      // Create a separate order per shop
      for (const shopId of shopIds) {
        const customOrderId = this.generateNumericOrderId();
        const shopItems = itemsByShop[shopId];
        const shopSubtotal = shopItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        const itemRatio =
          totalItemsValue > 0 ? shopSubtotal / totalItemsValue : 1 / shopCount;

        const rawShopShipFee =
          dto.shopShippingFees && dto.shopShippingFees[shopId] !== undefined
            ? dto.shopShippingFees[shopId]
            : totalRawShippingFee > 0
              ? Math.round(totalRawShippingFee / shopCount)
              : 22000;

        const shipRatio =
          totalRawShippingFee > 0
            ? rawShopShipFee / totalRawShippingFee
            : 1 / shopCount;

        const allocatedShippingFee =
          dto.shippingFee !== undefined && dto.shippingFee !== null
            ? Math.round(dto.shippingFee * shipRatio)
            : rawShopShipFee;

        const allocatedPlatformDiscount = Math.round(
          (dto.platformDiscountAmount || 0) * itemRatio,
        );
        const allocatedShopDiscount =
          dto.shopDiscounts && dto.shopDiscounts[shopId] !== undefined
            ? dto.shopDiscounts[shopId]
            : Math.round((dto.shopDiscountAmount || 0) / shopCount);

        const totalAmount = Math.max(
          0,
          shopSubtotal +
            allocatedShippingFee -
            allocatedPlatformDiscount -
            allocatedShopDiscount,
        );

        const invoiceDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const customInvoiceNo = `HD${invoiceDateStr}-${customOrderId.slice(-6).toUpperCase()}`;

        const order = await this.prisma.$transaction(async (tx) => {
          return await tx.order.create({
            data: {
              id: customOrderId,
              invoiceNo: customInvoiceNo,
              shopId: shopId,
              checkoutGroupId: checkoutGroupId,
              buyerId: dto.buyerId,
              buyerEmail: dto.buyerEmail,
              buyerName: dto.buyerName,
              buyerPhone: dto.buyerPhone,
              shippingAddress: dto.shippingAddress,
              totalAmount: totalAmount,
              shippingFee: allocatedShippingFee,
              paymentMethod: dto.paymentMethod,
              status: dto.paymentMethod === 'cod' ? 'PENDING' : 'PENDING_PAYMENT',
              shopDiscountAmount: allocatedShopDiscount,
              platformDiscountAmount: allocatedPlatformDiscount,
              shopVoucherCode: dto.shopVoucherCode || null,
              platformVoucherCode: dto.platformVoucherCode || null,
              appliedVoucherIds: dto.appliedVoucherIds || null,
              ghnDistrictId: dto.ghnDistrictId || null,
              ghnWardCode: dto.ghnWardCode || null,
              commissionRate: commissionRate,
              items: {
                create: shopItems.map((item) => ({
                  productId: item.productId,
                  shopId: item.shopId,
                  name: item.name,
                  image: item.image,
                  variant: item.variant || null,
                  price: item.price,
                  originalPrice: item.originalPrice !== undefined && item.originalPrice !== null ? Number(item.originalPrice) : item.price,
                  costPrice: item.costPrice !== undefined && item.costPrice !== null ? Number(item.costPrice) : 0,
                  quantity: item.quantity,
                })),
              },
            },
            include: {
              items: true,
            },
          });
        });

        createdOrders.push(order);

        // Bắn sự kiện order.created sang Kafka bất đồng bộ sau khi lưu DB thành công
        try {
          this.kafkaClient.emit(
            'order.created',
            JSON.stringify({
              orderId: order.id,
              shopId: order.shopId,
              checkoutGroupId: order.checkoutGroupId,
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
            }),
          );
          console.log(
            `[Kafka] Published order.created event for order ${order.id}`,
          );
        } catch (e) {
          console.error('[Kafka] Failed to publish order.created event:', e);
        }
      }
      return createdOrders;
    } catch (orderError) {
      console.error(
        '[OrderService] Order creation failed after stock deduction. Rolling back stock...',
        orderError,
      );
      await this.rollbackProductStock(dto.items);
      throw orderError;
    }
  }

  private async notifyProductPurchase(
    items: { productId: string; quantity: number }[],
  ) {
    if (!items || items.length === 0) return;
    const productServiceUrl =
      process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
    const url = `${productServiceUrl}/products/purchase`;
    console.log(
      `[OrderService] Notifying product-service of purchase for ${items.length} items at ${url}`,
    );
    try {
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
        console.log(
          '[OrderService] Product sales and stock updated successfully',
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new BadRequestException(
          errData.message || 'Không thể trừ tồn kho sản phẩm (có thể đã hết hàng)',
        );
      }
    } catch (err: any) {
      console.error(
        '[OrderService] Error calling product-service purchase endpoint:',
        err,
      );
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(
        err.message || 'Lỗi khi kiểm tra và trừ tồn kho sản phẩm',
      );
    }
  }

  private async rollbackProductStock(
    items: { productId: string; quantity: number }[],
  ) {
    if (!items || items.length === 0) return;
    try {
      const productServiceUrl =
        process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
      const url = `${productServiceUrl}/products/restock`;
      console.log(
        `[OrderService] Notifying product-service to RESTOCK for ${items.length} items at ${url}`,
      );
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
        console.log('[OrderService] Product stock successfully restored');
      } else {
        console.error('[OrderService] Product service restock error:', res.status);
      }
    } catch (err) {
      console.error(
        '[OrderService] Error calling product-service restock endpoint:',
        err,
      );
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
        OR: [
          { shopId: shopId },
          { items: { some: { shopId: shopId } } },
        ],
      },
      include: {
        items: true,
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

    if (exists.status === 'CANCELLED' && dto.status !== 'CANCELLED') {
      console.warn(
        `[OrderService] Order ${id} is already CANCELLED. Rejecting status change to ${dto.status}.`,
      );
      return exists;
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

    // Stock is reserved/deducted upon order creation (Shopee standard)
    // When order is CANCELLED, restore product stock & rollback vouchers
    if (dto.status === 'CANCELLED' && exists.status !== 'CANCELLED') {
      if (exists.appliedVoucherIds) {
        this.rollbackVouchers(exists.appliedVoucherIds);
      }
      if (exists.items && exists.items.length > 0) {
        await this.rollbackProductStock(exists.items);
      }

      // Hủy shipment và yêu cầu phân công tài xế bên delivery-service
      try {
        const deliveryServiceUrl =
          process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3008';
        await fetch(
          `${deliveryServiceUrl}/delivery/shipments/cancel-by-order/${exists.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason:
                dto.refundReason ||
                dto.refundDescription ||
                'Đơn hàng đã được hủy',
            }),
          },
        );
        console.log(
          `[OrderService] Notified delivery-service to cancel shipment for order ${exists.id}`,
        );
      } catch (delErr) {
        console.error(
          `[OrderService] Error notifying delivery-service of cancellation for order ${exists.id}:`,
          delErr,
        );
      }

      // Nếu đơn hàng đã được thanh toán (hoặc thanh toán qua Ví/Sepay và ở trạng thái PROCESSING/PENDING_PAYMENT), hoàn tiền về Ví ZeroPay cho khách
      if (
        exists.paymentMethod === 'zeropay' ||
        (exists.paymentMethod === 'sepay' && exists.status === 'PROCESSING')
      ) {
        try {
          const paymentServiceUrl =
            process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
          await fetch(`${paymentServiceUrl}/payments/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: exists.id,
              buyerId: exists.buyerId,
              amount: exists.totalAmount,
            }),
          });
          console.log(
            `[OrderService] Automatically refunded ${exists.totalAmount}đ to wallet of buyer ${exists.buyerId} for cancelled order ${exists.id}`,
          );
        } catch (e) {
          console.error(
            '[OrderService] Error auto-refunding buyer on order cancellation:',
            e,
          );
        }
      }
    }

    // Chuẩn Shopee: Hàng trả về KHÔNG tự động nhập lại kho.
    // Người bán sẽ kiểm tra thực tế tình trạng hàng và chủ động bấm "Nhập kho" hoặc "Ghi nhận tổn thất"
    if (dto.status === 'RETURNED' && exists.status !== 'RETURNED') {
      console.log(`[OrderService] Order ${exists.id} marked as RETURNED. Stock restock is deferred to Seller decision.`);
    }

    // Bắn sự kiện order.updated sang Kafka để gửi thông báo Realtime cho Khách hàng
    try {
      this.kafkaClient.emit(
        'order.updated',
        JSON.stringify({
          orderId: updatedOrder.id,
          buyerId: updatedOrder.buyerId,
          buyerName: updatedOrder.buyerName,
          status: updatedOrder.status,
          previousStatus: exists.status,
          items: updatedOrder.items,
          updatedAt: updatedOrder.updatedAt,
        }),
      );
      console.log(
        `[Kafka] Published order.updated event for order ${updatedOrder.id} with status ${updatedOrder.status}`,
      );
    } catch (e) {
      console.error('[Kafka] Failed to publish order.updated event:', e);
    }

    if (
      (dto.status === 'DELIVERED' || dto.status === 'COMPLETED') &&
      exists.status !== dto.status
    ) {
      try {
        // Nhóm các item theo shopId và tính tiền Escrow chuẩn: Subtotal - ShopVoucherDiscount
        const shopItemsMap: Record<string, typeof exists.items> = {};
        for (const item of exists.items) {
          if (!shopItemsMap[item.shopId]) shopItemsMap[item.shopId] = [];
          shopItemsMap[item.shopId].push(item);
        }

        const shopCount = Object.keys(shopItemsMap).length;
        const shopDiscountPerShop =
          shopCount > 0 ? (exists.shopDiscountAmount || 0) / shopCount : 0;

        for (const [shopId, items] of Object.entries(shopItemsMap)) {
          const shopSubtotal = items.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );
          const shopEscrowAmount = Math.max(
            0,
            shopSubtotal - shopDiscountPerShop,
          );

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
          console.log(
            `[Order] Escrow created for shop ${shopId} order ${exists.id}: ${shopEscrowAmount}đ (subtotal ${shopSubtotal}đ - shopDiscount ${shopDiscountPerShop}đ)`,
          );
        }

        // Nếu chuyển sang COMPLETED (khách bấm Đã Nhận Hàng hoặc Đánh Giá SP), giải ngân ngay lập tức vào Ví Shop!
        if (dto.status === 'COMPLETED') {
          await fetch(
            `http://payment-service:3005/payments/escrow/${exists.id}/release`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            },
          );
          console.log(
            `[Order] Escrow released immediately for COMPLETED order ${exists.id}`,
          );
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
        voucherIds = appliedVoucherIdsJson
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (voucherIds.length === 0) return;

      const discountServiceUrl =
        process.env.DISCOUNT_SERVICE_URL || 'http://discount-service:3003';
      console.log(
        `[OrderService] Rolling back voucher usage for ${voucherIds.length} vouchers`,
      );
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

  async getFinancialSummary(shopId?: string, year?: number, quarter?: string, month?: number) {
    const targetYear = year || new Date().getFullYear();
    let startDate = new Date(targetYear, 0, 1);
    let endDate = new Date(targetYear + 1, 0, 1);

    if (month && month >= 1 && month <= 12) {
      startDate = new Date(targetYear, month - 1, 1);
      endDate = new Date(targetYear, month, 1);
    } else if (quarter) {
      if (quarter === 'Q1') {
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 3, 1);
      } else if (quarter === 'Q2') {
        startDate = new Date(targetYear, 3, 1);
        endDate = new Date(targetYear, 6, 1);
      } else if (quarter === 'Q3') {
        startDate = new Date(targetYear, 6, 1);
        endDate = new Date(targetYear, 9, 1);
      } else if (quarter === 'Q4') {
        startDate = new Date(targetYear, 9, 1);
        endDate = new Date(targetYear + 1, 0, 1);
      }
    }

    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (shopId && shopId !== 'ALL') {
      whereClause.shopId = shopId;
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
      },
    });

    let totalGMV = 0;
    let totalShopDiscount = 0;
    let totalPlatformFee = 0;
    let totalNetPayout = 0;
    let totalCOGS = 0;
    let totalGrossProfit = 0;
    const totalInvoices = orders.length;
    let completedInvoices = 0;
    let cancelledInvoices = 0;

    for (const order of orders) {
      const isCancelled = ['CANCELLED', 'REFUNDED', 'RETURNED', 'PENDING', 'PENDING_PAYMENT', 'UNPAID'].includes(order.status);
      if (isCancelled) {
        cancelledInvoices++;
        continue;
      }

      completedInvoices++;
      const itemSubtotal = order.items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
      const itemCOGS = order.items.reduce((sum, it) => sum + (it.costPrice || 0) * (it.quantity || 1), 0);
      const shopDiscount = order.shopDiscountAmount || 0;
      const netSubtotal = Math.max(0, itemSubtotal - shopDiscount);
      const commRate = order.commissionRate ?? 5;
      const commAmount = Math.round(netSubtotal * (commRate / 100));
      const netPayout = Math.max(0, netSubtotal - commAmount);

      totalGMV += itemSubtotal;
      totalShopDiscount += shopDiscount;
      totalPlatformFee += commAmount;
      totalNetPayout += netPayout;
      totalCOGS += itemCOGS;
      totalGrossProfit += (netPayout - itemCOGS);
    }

    return {
      period: {
        year: targetYear,
        quarter: quarter || null,
        month: month || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalInvoices,
        completedInvoices,
        cancelledInvoices,
        totalGMV,
        totalShopDiscount,
        totalPlatformFee,
        totalNetPayout,
        totalCOGS,
        totalGrossProfit,
      },
    };
  }
}
