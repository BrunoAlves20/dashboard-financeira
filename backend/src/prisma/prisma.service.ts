import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 1. Criamos um pool de conexão nativo do PostgreSQL usando a URL do .env
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // 2. Criamos o adapter do Prisma
    const adapter = new PrismaPg(pool);

    // 3. Inicializamos o super() passando o adapter e os logs de debug
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}