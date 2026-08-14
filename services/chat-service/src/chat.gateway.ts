import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Chat Gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Chat Gateway: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (data?.conversationId) {
      const room = `chat_${data.conversationId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { event: 'joined', room };
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      senderType: 'BUYER' | 'SHOP';
      type?: 'TEXT' | 'IMAGE' | 'PRODUCT_CARD' | 'ORDER_CARD';
      content: string;
      metadata?: any;
    },
  ) {
    if (!data.conversationId || !data.senderId || !data.content) {
      return { error: 'Missing required fields' };
    }

    try {
      const message = await this.chatService.sendMessage(data);
      const room = `chat_${data.conversationId}`;

      // Broadcast to room
      this.server.to(room).emit('new_message', message);
      
      // Also notify user/shop list updates
      this.server.emit('conversation_updated', {
        conversationId: data.conversationId,
        lastMessage: data.content,
        senderType: data.senderType,
      });

      return { success: true, message };
    } catch (e) {
      this.logger.error(`Error sending message: ${e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; senderId: string; isTyping: boolean },
  ) {
    if (data?.conversationId) {
      const room = `chat_${data.conversationId}`;
      client.to(room).emit('user_typing', data);
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; userId: string; userType: 'BUYER' | 'SHOP' },
  ) {
    if (data?.conversationId && data?.userType) {
      const result = await this.chatService.markConversationAsRead(
        data.conversationId,
        data.userType,
      );
      const room = `chat_${data.conversationId}`;
      this.server.to(room).emit('messages_read', {
        conversationId: data.conversationId,
        userType: data.userType,
      });
      return result;
    }
  }
}
