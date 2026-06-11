import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.API_FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  if (!process.env.API_PORT) {
    throw new Error('API_PORT is not set');
  }
  await app.listen(process.env.API_PORT);
}
void bootstrap();
