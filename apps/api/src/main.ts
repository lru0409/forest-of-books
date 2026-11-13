import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
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
