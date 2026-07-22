import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification',
        brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      },
      consumer: {
        groupId: 'notification-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  const port = process.env.PORT ?? 3006;
  await app.listen(port);
  console.log(`[Notification Service] Running HTTP on port ${port} and listening to Kafka events`);
}
bootstrap();
