import * as dotenv from 'dotenv';
// Carrega o arquivo .env imediatamente na raiz antes de tudo
dotenv.config(); 

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HABILITAR CORS (Essencial para o Angular conversar com o Nest localmente)
  // app.enableCors({
  //   origin: '*', // Aceita requisições de qualquer origem (ideal para dev local)
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   credentials: true,
  // });

  app.enableCors({
    origin: [
    'http://localhost:4200',
    'http://localhost:8100',
    'https://dashboard-financeira-blush.vercel.app',
    /\.vercel\.app$/ // Permite qualquer subdomínio da Vercel
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  await app.listen(port, '0.0.0.0');
  console.log(`Aplicação rodando na porta: ${port}`);
}
bootstrap();