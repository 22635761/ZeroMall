import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Query('userId') userId: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!userId) {
      return { items: [], total: 0, unreadCount: 0 };
    }
    return this.notificationService.getNotifications(
      userId,
      type,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    if (!userId) return { unreadCount: 0 };
    const count = await this.notificationService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Post()
  async createNotification(
    @Body()
    body: {
      userId: string;
      title: string;
      content: string;
      type?: any;
      metadata?: any;
    },
  ) {
    return this.notificationService.createNotification(body);
  }

  @Patch('read-all')
  async markAllAsRead(@Query('userId') userId: string) {
    if (!userId) return { success: false, message: 'userId is required' };
    return this.notificationService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) return { success: false, message: 'userId is required' };
    return this.notificationService.markAsRead(id, userId);
  }

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: any) {
    try {
      const order = typeof data === 'string' ? JSON.parse(data) : data;
      await this.notificationService.handleOrderCreatedEvent(order);
    } catch (e) {
      console.error('[Notification Kafka] Error handling order.created:', e);
    }
  }

  @EventPattern('order.updated')
  async handleOrderUpdated(@Payload() data: any) {
    try {
      const order = typeof data === 'string' ? JSON.parse(data) : data;
      await this.notificationService.handleOrderUpdatedEvent(order);
    } catch (e) {
      console.error('[Notification Kafka] Error handling order.updated:', e);
    }
  }
}
