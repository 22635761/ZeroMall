import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo vận đơn giao hàng mới (khi Shop xác nhận gửi hàng)
  async createDeliveryOrder(data: {
    orderId: string;
    shopId?: string;
    shopName?: string;
    buyerId?: string;
    buyerName: string;
    buyerPhone: string;
    shippingAddress: string;
    totalAmount: number;
    paymentMethod: string;
    itemsSummary?: string;
  }) {
    const existing = await this.prisma.deliveryOrder.findUnique({
      where: { orderId: data.orderId },
      include: { logs: true },
    });

    if (existing) {
      return existing;
    }

    const randNum = Math.floor(100000000 + Math.random() * 900000000);
    const trackingNumber = `ZMX-VN-${randNum}`;
    const codAmount = data.paymentMethod === 'cod' ? data.totalAmount : 0;

    const deliveryOrder = await this.prisma.deliveryOrder.create({
      data: {
        orderId: data.orderId,
        trackingNumber,
        shopId: data.shopId,
        shopName: data.shopName || 'Cửa hàng đối tác',
        buyerId: data.buyerId,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        shippingAddress: data.shippingAddress,
        totalAmount: data.totalAmount,
        codAmount,
        paymentMethod: data.paymentMethod,
        currentStage: 'PICKING',
        itemsSummary: data.itemsSummary || 'Gói hàng tiêu chuẩn',
        logs: {
          create: [
            {
              stage: 'ORDER_CREATED',
              title: 'Người bán đã tạo đơn vận chuyển',
              description: `Mã vận đơn ${trackingNumber} đã được tạo. Đơn vị vận chuyển ZeroMall Express (ZMX) đang điều phối tài xế đến lấy hàng.`,
              location: data.shopName || 'Kho người bán',
            },
          ],
        },
      },
      include: { logs: true },
    });

    // Cập nhật mã vận đơn ngược lại cho order-service
    await this.syncOrderStatusToOrderService(data.orderId, 'SHIPPED', trackingNumber);

    return deliveryOrder;
  }

  // 2. Lấy danh sách tất cả đơn hàng vận chuyển (cho App Shipper & Hub)
  async getAllDeliveryOrders(stage?: string) {
    const where: any = {};
    if (stage && stage !== 'ALL') {
      where.currentStage = stage;
    }
    return this.prisma.deliveryOrder.findMany({
      where,
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // 3. Lấy chi tiết lịch sử tracking theo orderId (cho Người Mua & Shop)
  async getTrackingByOrderId(orderId: string) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { orderId },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!order) {
      // Nếu chưa có trong delivery-service, thử tìm bên order-service và tự động khởi tạo
      try {
        const orderRes = await fetch(`http://order-service:3004/orders/${orderId}`);
        if (orderRes.ok) {
          const rawOrder = await orderRes.json();
          const itemsSummary = rawOrder.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ');
          return this.createDeliveryOrder({
            orderId: rawOrder.id,
            buyerId: rawOrder.buyerId,
            buyerName: rawOrder.buyerName,
            buyerPhone: rawOrder.buyerPhone,
            shippingAddress: rawOrder.shippingAddress,
            totalAmount: rawOrder.totalAmount,
            paymentMethod: rawOrder.paymentMethod,
            itemsSummary,
          });
        }
      } catch (e) {
        console.error('Error auto-creating delivery order for tracking:', e);
      }
      throw new NotFoundException(`Không tìm thấy thông tin vận đơn cho đơn hàng ${orderId}`);
    }

    return order;
  }

  // 4. Cập nhật bước tiếp theo trong hành trình vận chuyển (Shopee Lifecycle)
  async advanceStage(deliveryOrderId: string, body: { stage: string; note?: string; location?: string; proofImage?: string; failedReason?: string }) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { id: deliveryOrderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn vận chuyển');
    }

    let title = '';
    let description = '';
    let location = body.location || order.hubName || 'Trung tâm khai thác ZMX';

    switch (body.stage) {
      case 'PICKED_UP':
        title = 'Tài xế đã lấy hàng thành công';
        description = `Tài xế ${order.shipperName} (${order.shipperPhone}) đã nhận kiện hàng từ Shop và đang trên đường nhập kho trung chuyển.`;
        location = order.shopName || 'Kho người bán';
        break;
      case 'IN_HUB':
        title = 'Đơn hàng đã đến kho phân loại';
        description = `Kiện hàng đã nhập kho ${location}. Đang tiến hành phân loại và đóng bao vận chuyển.`;
        break;
      case 'IN_TRANSIT':
        title = 'Đang luân chuyển giữa các kho';
        description = `Kiện hàng đã rời kho phân loại và đang được vận chuyển đến Bưu cục phát hàng địa phương.`;
        location = 'Xe tải chuyên dụng ZMX';
        break;
      case 'DELIVERING':
        title = 'Shipper đang giao hàng đến bạn';
        description = `Tài xế ${order.shipperName} (${order.shipperPhone}) đang trên đường giao hàng đến địa chỉ người nhận. Vui lòng chú ý điện thoại.`;
        location = 'Bưu cục phát hàng khu vực';
        break;
      case 'DELIVERED':
        title = 'Giao hàng thành công';
        description = order.paymentMethod === 'cod'
          ? `Giao hàng thành công. Tài xế đã thu tiền COD: ${order.codAmount.toLocaleString('vi-VN')}đ. Người nhận đã ký nhận đầy đủ.`
          : 'Giao hàng thành công. Người nhận đã kiểm tra và nhận bưu kiện nguyên vẹn.';
        location = order.shippingAddress;
        break;
      case 'FAILED':
        title = 'Giao hàng không thành công';
        description = `Lý do: ${body.failedReason || 'Người nhận hẹn lại thời gian giao khác'}. ZMX sẽ điều phối giao lại vào ngày làm việc tiếp theo.`;
        break;
      default:
        title = body.note || 'Cập nhật trạng thái vận chuyển';
        description = body.note || 'Trạng thái kiện hàng đã được cập nhật trên hệ thống ZMX.';
    }

    const updated = await this.prisma.deliveryOrder.update({
      where: { id: deliveryOrderId },
      data: {
        currentStage: body.stage,
        proofImage: body.proofImage || order.proofImage,
        failedReason: body.failedReason || order.failedReason,
        logs: {
          create: {
            stage: body.stage,
            title,
            description,
            location,
          },
        },
      },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    // Đồng bộ trạng thái đơn hàng sang order-service nếu hoàn tất hoặc đang phát
    if (body.stage === 'DELIVERED') {
      await this.syncOrderStatusToOrderService(order.orderId, 'DELIVERED');
    } else if (body.stage === 'DELIVERING' || body.stage === 'IN_TRANSIT') {
      await this.syncOrderStatusToOrderService(order.orderId, 'SHIPPED');
    }

    return updated;
  }

  // Helper gọi sync order-service
  private async syncOrderStatusToOrderService(orderId: string, status: string, ghnOrderCode?: string) {
    try {
      const url = `http://order-service:3004/orders/${orderId}/status`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ghnOrderCode,
        }),
      });
      console.log(`[DeliveryService] Synced order ${orderId} to status ${status}`);
    } catch (e) {
      console.error(`[DeliveryService] Failed to sync order status to order-service:`, e);
    }
  }
}
