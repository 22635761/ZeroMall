import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  const port = process.env.PORT ?? 3008;
  await app.listen(port);
  console.log(`ZeroMall Delivery & Logistics Service is running on port ${port}`);
}
bootstrap();
