import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';

@Module({
  imports: [],
  controllers: [DiscountController],
  providers: [PrismaService, DiscountService],
})
export class AppModule {}
