import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async getOrCreateConversation(
    @Body() body: { buyerId: string; shopId: string },
  ) {
    if (!body.buyerId || !body.shopId) {
      throw new BadRequestException('buyerId and shopId are required');
    }
    return this.chatService.getOrCreateConversation(body.buyerId, body.shopId);
  }

  @Get('conversations')
  async getConversations(
    @Query('buyerId') buyerId?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.chatService.getConversations({ buyerId, shopId });
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatService.getMessages(
      conversationId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('messages')
  async sendMessage(
    @Body()
    body: {
      conversationId: string;
      senderId: string;
      senderType: 'BUYER' | 'SHOP' | 'SYSTEM';
      type?: 'TEXT' | 'IMAGE' | 'PRODUCT_CARD' | 'ORDER_CARD';
      content: string;
      metadata?: any;
    },
  ) {
    if (!body.conversationId || !body.senderId || !body.content) {
      throw new BadRequestException(
        'conversationId, senderId, and content are required',
      );
    }
    return this.chatService.sendMessage(body);
  }

  @Patch('conversations/:id/read')
  async markAsRead(
    @Param('id') conversationId: string,
    @Body() body: { userType: 'BUYER' | 'SHOP' },
  ) {
    if (!body.userType) {
      throw new BadRequestException('userType is required');
    }
    return this.chatService.markConversationAsRead(conversationId, body.userType);
  }
}
