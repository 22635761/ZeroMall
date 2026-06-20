import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static getAdapter() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zeromall?schema=product';
    const pool = new Pool({ connectionString });
    return new PrismaPg(pool, { schema: 'product' });
  }

  constructor() {
    super({
      adapter: PrismaService.getAdapter(),
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.enforceForeignKeys();
  }

  private async enforceForeignKeys() {
    try {
      console.log('Enforcing database foreign key constraints...');

      // 1. Clean up orphaned records to prevent foreign key errors
      await this.$executeRawUnsafe(`
        DELETE FROM product."Product" WHERE "shopId" NOT IN (SELECT id FROM auth."Shop");
        DELETE FROM product."ProductLike" WHERE "userId" NOT IN (SELECT id FROM auth."User");
        DELETE FROM product."ProductLike" WHERE "productId" NOT IN (SELECT id FROM product."Product");
        DELETE FROM product."Review" WHERE "productId" NOT IN (SELECT id FROM product."Product");
      `);

      // 2. Intra-schema Review -> Product
      await this.$executeRawUnsafe(`
        ALTER TABLE product."Review"
        DROP CONSTRAINT IF EXISTS fk_review_product;
        ALTER TABLE product."Review"
        ADD CONSTRAINT fk_review_product
        FOREIGN KEY ("productId")
        REFERENCES product."Product"(id)
        ON DELETE CASCADE;
      `);

      // 3. Intra-schema ProductLike -> Product
      await this.$executeRawUnsafe(`
        ALTER TABLE product."ProductLike"
        DROP CONSTRAINT IF EXISTS fk_productlike_product;
        ALTER TABLE product."ProductLike"
        ADD CONSTRAINT fk_productlike_product
        FOREIGN KEY ("productId")
        REFERENCES product."Product"(id)
        ON DELETE CASCADE;
      `);

      // 4. Cross-schema Product -> Shop
      await this.$executeRawUnsafe(`
        ALTER TABLE product."Product"
        DROP CONSTRAINT IF EXISTS fk_product_shop;
        ALTER TABLE product."Product"
        ADD CONSTRAINT fk_product_shop
        FOREIGN KEY ("shopId")
        REFERENCES auth."Shop"(id)
        ON DELETE CASCADE;
      `);

      // 5. Cross-schema ProductLike -> User
      await this.$executeRawUnsafe(`
        ALTER TABLE product."ProductLike"
        DROP CONSTRAINT IF EXISTS fk_productlike_user;
        ALTER TABLE product."ProductLike"
        ADD CONSTRAINT fk_productlike_user
        FOREIGN KEY ("userId")
        REFERENCES auth."User"(id)
        ON DELETE CASCADE;
      `);

      console.log('Database foreign key constraints successfully enforced.');
    } catch (err) {
      console.error('Failed to enforce database foreign key constraints:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
