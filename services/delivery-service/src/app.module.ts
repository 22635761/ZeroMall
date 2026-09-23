import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { ReturnDeliveryService } from './return.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [DeliveryController],
  providers: [DeliveryService, ReturnDeliveryService, PrismaService],
})
export class AppModule {}
