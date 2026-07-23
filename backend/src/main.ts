import * as dotenv from 'dotenv';
// Carrega o arquivo .env imediatamente na raiz antes de tudo
dotenv.config(); 

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
    'http://localhost:4200',
    'https://dashboard-financeira-blush.vercel.app',
    /\.vercel\.app$/ // Permite qualquer subdomínio da Vercel
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(3000);
}
bootstrap();