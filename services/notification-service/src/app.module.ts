import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [PrismaService, NotificationGateway, NotificationService],
})
export class AppModule {}
