import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'redis';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    try {
      this.client = new Redis({
        host,
        port,
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        retryStrategy: (times) => {
          if (times > 5) {
            this.logger.warn(`Redis retry limit reached (${times}). Bỏ qua đệm tạm thời.`);
            return null; // Stop retrying
          }
          return Math.min(times * 1000, 3000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`⚡ Kết nối Redis thành công tại ${host}:${port}`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis warning: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (e: any) {
      this.logger.warn(`Không thể khởi tạo Redis client: ${e.message}`);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Lấy dữ liệu từ Cache (tự parse JSON)
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isHealthy() || !this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (e: any) {
      this.logger.warn(`Lỗi đọc cache key "${key}": ${e.message}`);
      return null;
    }
  }

  /**
   * Ghi dữ liệu vào Cache (tự stringify JSON) kèm thời gian sống (TTL tính bằng giây)
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.isHealthy() || !this.client) return;
    try {
      const stringified = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.setex(key, ttlSeconds, stringified);
      } else {
        await this.client.set(key, stringified);
      }
    } catch (e: any) {
      this.logger.warn(`Lỗi ghi cache key "${key}": ${e.message}`);
    }
  }

  /**
   * Xóa 1 cache key
   */
  async del(key: string): Promise<void> {
    if (!this.isHealthy() || !this.client) return;
    try {
      await this.client.del(key);
    } catch (e: any) {
      this.logger.warn(`Lỗi xóa cache key "${key}": ${e.message}`);
    }
  }

  /**
   * Xóa nhiều cache keys theo mẫu (sử dụng SCAN non-blocking chuẩn Shopee)
   * Ví dụ: delByPattern('products:*')
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.isHealthy() || !this.client) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (e: any) {
      this.logger.warn(`Lỗi xóa cache theo pattern "${pattern}": ${e.message}`);
    }
  }
}
