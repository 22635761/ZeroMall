import { Injectable } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to ZeroMall E-Commerce API!';
  }

  private checkPort(host: string, port: number, timeout = 1000): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      socket.setTimeout(timeout);

      const cleanup = () => {
        socket.destroy();
      };

      socket.on('connect', () => {
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      });

      socket.on('error', () => {
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });

      socket.on('timeout', () => {
        cleanup();
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });

      socket.connect(port, host);
    });
  }

  async getHealth() {
    const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

    const pgHost = isDocker ? 'postgres' : '127.0.0.1';
    const redisHost = isDocker ? 'redis' : '127.0.0.1';

    const [postgres, redis] = await Promise.all([
      this.checkPort(pgHost, 5432),
      this.checkPort(redisHost, 6379),
    ]);

    return {
      status: postgres && redis ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        postgres: { status: postgres ? 'UP' : 'DOWN', host: pgHost, port: 5432 },
        redis: { status: redis ? 'UP' : 'DOWN', host: redisHost, port: 6379 },
      },
    };
  }
}
