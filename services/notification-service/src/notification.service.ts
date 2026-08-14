import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from './generated/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async createNotification(data: {
    userId: string;
    title: string;
    content: string;
    type?: NotificationType;
    metadata?: any;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        type: data.type || NotificationType.ORDER,
        metadata: data.metadata || null,
      },
    });

    const unreadCount = await this.getUnreadCount(data.userId);

    // Push real-time event to socket client
    this.gateway.sendToUser(data.userId, 'new_notification', {
      notification,
      unreadCount,
    });

    return notification;
  }

  async handleOrderCreatedEvent(orderData: any) {
    this.logger.log(`Processing order.created Kafka event for order ${orderData.orderId}`);
    
    // 1. Create notification for Buyer
    if (orderData.buyerId) {
      await this.createNotification({
        userId: orderData.buyerId,
        title: 'Đặt hàng thành công 🛒',
        content: `Đơn hàng #${orderData.orderId?.slice(0, 8)} trị giá ${Number(
          orderData.totalAmount || 0,
        ).toLocaleString('vi-VN')}đ đã được khởi tạo thành công.`,
        type: NotificationType.ORDER,
        metadata: { action: 'VIEW_ORDER', orderId: orderData.orderId },
      });
    }

    // 2. Extract unique shopIds from items or fallback to orderData.shopId
    const shopIds = new Set<string>();
    if (Array.isArray(orderData.items)) {
      orderData.items.forEach((item: any) => {
        if (item.shopId) shopIds.add(item.shopId);
      });
    }
    if (orderData.shopId) {
      shopIds.add(orderData.shopId);
    }

    // 3. Send notification to each Shop (Seller)
    for (const shopId of shopIds) {
      await this.createNotification({
        userId: shopId,
        title: 'Đơn hàng mới từ Khách hàng 📦',
        content: `Shop có 1 đơn hàng mới #${orderData.orderId?.slice(0, 8)} từ khách hàng ${orderData.buyerName || ''}. Vui lòng kiểm tra và chuẩn bị hàng.`,
        type: NotificationType.ORDER,
        metadata: { action: 'VIEW_ORDER', orderId: orderData.orderId },
      });
    }
  }

  async handleOrderUpdatedEvent(orderData: any) {
    this.logger.log(
      `Processing order.updated Kafka event for order ${orderData.orderId}, status: ${orderData.status}`,
    );

    if (!orderData.buyerId || !orderData.orderId) {
      this.logger.warn('order.updated event missing buyerId or orderId – skipping.');
      return;
    }

    const statusLabels: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPING: 'Đang giao hàng',
      DELIVERED: 'Đã giao hàng',
      CANCELLED: 'Đã hủy',
      REFUNDED: 'Đã hoàn tiền',
    };

    const statusEmoji: Record<string, string> = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      PROCESSING: '⚙️',
      SHIPPING: '🚚',
      DELIVERED: '🎉',
      CANCELLED: '❌',
      REFUNDED: '💸',
    };

    const status = orderData.status || 'UNKNOWN';
    const label = statusLabels[status] || status;
    const emoji = statusEmoji[status] || '📦';

    await this.createNotification({
      userId: orderData.buyerId,
      title: `${emoji} Đơn hàng được cập nhật`,
      content: `Đơn hàng #${orderData.orderId?.slice(0, 8)} của bạn đã chuyển sang trạng thái: ${label}.`,
      type: NotificationType.ORDER,
      metadata: {
        action: 'VIEW_ORDER',
        orderId: orderData.orderId,
        status,
      },
    });
  }

  async getNotifications(userId: string, type?: string, page = 1, limit = 20) {
    const where: any = { userId };
    if (type && type !== 'ALL') {
      where.type = type as NotificationType;
    }

    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.getUnreadCount(userId),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.sendToUser(userId, 'unread_count_updated', { unreadCount });

    return { success: true, count: updated.count, unreadCount };
  }

  async markAllAsRead(userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    this.gateway.sendToUser(userId, 'unread_count_updated', { unreadCount: 0 });

    return { success: true, count: updated.count, unreadCount: 0 };
  }
}
