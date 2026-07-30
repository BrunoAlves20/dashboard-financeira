import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const installments = dto.installments && dto.installments > 1 ? dto.installments : 1;
    const isCreditCard = dto.paymentMethod === 'CREDIT';

    // Trata categoryId vazia ou 'null' enviada pelo front
    const categoryId = (dto.categoryId && dto.categoryId !== 'null' && dto.categoryId !== '') 
      ? dto.categoryId 
      : null;

    if (isCreditCard && installments > 1) {
      const installmentAmount = Number((dto.amount / installments).toFixed(2));
      const baseDate = dto.date ? new Date(dto.date) : new Date();
      const transactionsToCreate = [];

      for (let i = 0; i < installments; i++) {
        const currentDate = new Date(baseDate);
        
        // Ajuste seguro de adição de mês
        const targetMonth = baseDate.getMonth() + i;
        currentDate.setMonth(targetMonth);
        
        // Se o dia estourar o mês de destino (ex: 31/jan -> fev), ajusta para o último dia útil do mês
        if (currentDate.getMonth() !== targetMonth % 12) {
          currentDate.setDate(0); 
        }

        transactionsToCreate.push({
          userId,
          title: `${dto.title} (${i + 1}/${installments})`,
          amount: installmentAmount,
          type: dto.type,
          paymentMethod: dto.paymentMethod,
          bank: dto.bank,
          categoryId,
          date: currentDate,
        });
      }

      return await this.prisma.transaction.createMany({
        data: transactionsToCreate,
      });
    }

    return await this.prisma.transaction.create({
      data: {
        userId,
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        paymentMethod: dto.paymentMethod,
        bank: dto.bank,
        categoryId,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  // BUSCA APENAS TRANSAÇÕES DO MÊS/ANO SELECIONADO
  async findAllByUser(userId: string, month?: number, year?: number) {
    const whereCondition: any = { userId };

    if (month !== undefined && year !== undefined) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      whereCondition.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.transaction.findMany({
      where: whereCondition,
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  // BUSCA TRANSAÇÕES POR PERÍODO PERSONALIZADO (EXTRATOR)
  async findByCustomPeriod(userId: string, startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    // Ajusta o horário final para o último segundo do dia
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calcula os totais do extrato fechado
    const totalIncomes = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      startDate,
      endDate,
      totalIncomes,
      totalExpenses,
      balance: totalIncomes - totalExpenses,
      transactions,
    };
  }

  // RESUMO ZERADO/RENOVADO MENSALMENTE
  async getSummary(userId: string, month?: number, year?: number) {
    const transactions = await this.findAllByUser(userId, month, year);

    const incomes = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      balance: incomes - expenses,
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