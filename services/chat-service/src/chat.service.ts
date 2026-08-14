import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SenderType, MessageType } from './generated/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(buyerId: string, shopId: string) {
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        buyerId_shopId: {
          buyerId,
          shopId,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          buyerId,
          shopId,
          lastMessage: 'Cuộc trò chuyện mới được khởi tạo 👋',
          lastMessageAt: new Date(),
        },
      });
      this.logger.log(`Created new conversation ${conversation.id} for buyer ${buyerId} and shop ${shopId}`);
    }

    return conversation;
  }

  async getConversations(filter: { buyerId?: string; shopId?: string }) {
    const where: any = {};
    if (filter.buyerId) where.buyerId = filter.buyerId;
    if (filter.shopId) where.shopId = filter.shopId;

    if (!filter.buyerId && !filter.shopId) {
      return [];
    }

    return this.prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, limit = 50, offset = 0) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    return {
      conversation,
      messages,
    };
  }

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderType: 'BUYER' | 'SHOP' | 'SYSTEM';
    type?: 'TEXT' | 'IMAGE' | 'PRODUCT_CARD' | 'ORDER_CARD';
    content: string;
    metadata?: any;
  }) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const senderTypeEnum = SenderType[data.senderType] || SenderType.BUYER;
    const messageTypeEnum = MessageType[data.type || 'TEXT'] || MessageType.TEXT;

    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: senderTypeEnum,
        type: messageTypeEnum,
        content: data.content,
        metadata: data.metadata || null,
      },
    });

    // Update conversation summary & unread counts
    const isBuyerSender = data.senderType === 'BUYER';
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessage: data.content,
        lastMessageAt: new Date(),
        unreadShopCount: isBuyerSender
          ? { increment: 1 }
          : conversation.unreadShopCount,
        unreadBuyerCount: !isBuyerSender
          ? { increment: 1 }
          : conversation.unreadBuyerCount,
      },
    });

    return message;
  }

  async markConversationAsRead(conversationId: string, userType: 'BUYER' | 'SHOP') {
    const isBuyer = userType === 'BUYER';

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        isRead: false,
        senderType: isBuyer ? SenderType.SHOP : SenderType.BUYER,
      },
      data: {
        isRead: true,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: isBuyer ? { unreadBuyerCount: 0 } : { unreadShopCount: 0 },
    });

    return { success: true };
  }
}
