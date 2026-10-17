import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { AiModule } from './ai/ai.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [AiModule, RedisModule],
  controllers: [AppController, ProductController],
  providers: [AppService, PrismaService, ProductService],
})
export class AppModule {}


