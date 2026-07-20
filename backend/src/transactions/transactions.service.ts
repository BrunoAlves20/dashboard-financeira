import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto, userId: string) {
    const { categoryId, date, ...data } = createTransactionDto;

    return this.prisma.transaction.create({
      data: {
        ...data,
        date: date ? new Date(date) : new Date(),
        userId,
        ...(categoryId ? { categoryId } : {}),
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getSummary(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
    });

    const incomes = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = incomes - expenses;

    return {
      balance,
      incomes,
      expenses,
    };
  }

  async remove(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}