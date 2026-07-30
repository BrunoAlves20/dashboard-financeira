import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    PrismaModule, TransactionsModule, UsersModule, AuthModule, CategoriesModule, AiModule,

    // CONFIGURAÇÃO DO SERVIDOR DE E-MAIL DA APLICAÇÃO
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        auth: {
          user: process.env.MAIL_USER || 'seu-email-emissor@gmail.com', // E-mail da sua aplicação/sistema
          pass: process.env.MAIL_PASS || 'sua-senha-de-app',
        },
      },
      defaults: {
        from: '"FinAI Alertas" <no-reply@finai.com>',
      },
    }),
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
