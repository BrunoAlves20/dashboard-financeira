import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService
  ) {}

  // VERIFICAÇÃO DE ESTOURO DE CATEGORIA
  private async checkCategoryAlert(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.budgetLimit) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const totalSpentResult = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const totalSpent = totalSpentResult._sum.amount || 0;

    if (totalSpent > category.budgetLimit) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email) {
        this.mailerService.sendMail({
          to: user.email,
          subject: `⚠️ Alerta de Gastos: Categoria ${category.name}`,
          html: `
            <h3>Atenção, ${user.name}!</h3>
            <p>Você ultrapassou o limite estipulado para a categoria <strong>${category.name}</strong>.</p>
            <p><strong>Limite Configurado:</strong> R$ ${category.budgetLimit.toFixed(2)}</p>
            <p><strong>Total Gasto:</strong> R$ ${totalSpent.toFixed(2)}</p>
            <br/>
            <p>Acesse sua Dashboard para reavaliar seu planejamento mensal.</p>
          `,
        }).catch(err => console.error('Erro ao enviar e-mail de alerta:', err));
      }
    }
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const installments = dto.installments && dto.installments > 1 ? dto.installments : 1;
    const isCreditCard = dto.paymentMethod === 'CREDIT';

    const categoryId = (dto.categoryId && dto.categoryId !== 'null' && dto.categoryId !== '') 
      ? dto.categoryId 
      : null;

    let createdResult: any;

    if (isCreditCard && installments > 1) {
      const installmentAmount = Number((dto.amount / installments).toFixed(2));
      const baseDate = dto.date ? new Date(dto.date) : new Date();
      const transactionsToCreate = [];

      for (let i = 0; i < installments; i++) {
        const currentDate = new Date(baseDate);
        const targetMonth = baseDate.getMonth() + i;
        currentDate.setMonth(targetMonth);
        
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
          isRecurring: dto.isRecurring || false,
        });
      }

      createdResult = await this.prisma.transaction.createMany({
        data: transactionsToCreate,
      });
    } else {
      createdResult = await this.prisma.transaction.create({
        data: {
          userId,
          title: dto.title,
          amount: dto.amount,
          type: dto.type,
          paymentMethod: dto.paymentMethod,
          bank: dto.bank,
          categoryId,
          date: dto.date ? new Date(dto.date) : new Date(),
          isRecurring: dto.isRecurring || false,
        },
      });
    }

    if (categoryId) {
      this.checkCategoryAlert(userId, categoryId);
    }

    return createdResult;
  }

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

  async findByCustomPeriod(userId: string, startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
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

  // NOVA FUNÇÃO DE ATUALIZAÇÃO ADICIONADA AQUI
  async update(id: string, updateData: any) {
    try {
      const transactionExists = await this.prisma.transaction.findUnique({
        where: { id }
      });

      if (!transactionExists) {
        throw new NotFoundException('Transação não encontrada');
      }

      const dataToUpdate: any = {};
      
      if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
      if (updateData.amount !== undefined) dataToUpdate.amount = Number(updateData.amount);
      if (updateData.type !== undefined) dataToUpdate.type = updateData.type;
      if (updateData.paymentMethod !== undefined) dataToUpdate.paymentMethod = updateData.paymentMethod;
      if (updateData.bank !== undefined) dataToUpdate.bank = updateData.bank;
      
      if (updateData.categoryId !== undefined) {
        dataToUpdate.categoryId = (updateData.categoryId && updateData.categoryId !== 'null' && updateData.categoryId !== '') 
          ? updateData.categoryId 
          : null;
      }
      
      if (updateData.date !== undefined && updateData.date !== null && updateData.date !== '') {
        dataToUpdate.date = new Date(updateData.date);
      }
      
      // 👇 CORREÇÃO: O Prisma espera 'installmentsCount' e não 'installments'
      if (updateData.installments !== undefined) {
        dataToUpdate.installmentsCount = Number(updateData.installments);
      }
      
      if (updateData.isRecurring !== undefined) dataToUpdate.isRecurring = updateData.isRecurring;

      return await this.prisma.transaction.update({
        where: { id },
        data: dataToUpdate,
      });

    } catch (error) {
      console.error('\n=== ❌ ERRO AO ATUALIZAR TRANSAÇÃO ===');
      console.error('ID da transação:', id);
      console.error('Dados Recebidos:', updateData);
      console.error('Detalhe do erro:', error);
      console.error('======================================\n');
      throw new Error('Falha interna ao atualizar transação.');
    }
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