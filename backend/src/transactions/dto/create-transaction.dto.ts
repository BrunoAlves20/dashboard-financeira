import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  title!: string;
  amount!: number;
  type!: TransactionType; // INCOME (receita) ou EXPENSE (despesa)
  category!: string;
  date!: string; // Receberemos em formato de string ISO e converteremos no banco
}