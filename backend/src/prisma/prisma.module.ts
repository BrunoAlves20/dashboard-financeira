import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Deixa o Prisma disponível globalmente na aplicação
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}