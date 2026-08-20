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

    // Soma os gastos acumulados nesta categoria no mês atual
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

    // Se ultrapassou o limite, envia o e-mail de alerta!
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

    // Trata categoryId vazia ou 'null' enviada pelo front
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

    // Dispara a checagem de limite por e-mail após a criação
    if (categoryId) {
      this.checkCategoryAlert(userId, categoryId);
    }

    return createdResult;
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

  async update(id: string, updateData: any) {
    // Verifica se a transação existe antes de atualizar
    const transactionExists = await this.prisma.transaction.findUnique({
      where: { id }
    });

    if (!transactionExists) {
      throw new NotFoundException('Transação não encontrada');
    }

    // Atualiza os dados no banco de dados
    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
    });
  }

}