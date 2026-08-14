import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [PrismaService, ChatService, ChatGateway],
})
export class AppModule {}
