import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [PrismaModule, TransactionsModule, UsersModule, AuthModule, CategoriesModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
