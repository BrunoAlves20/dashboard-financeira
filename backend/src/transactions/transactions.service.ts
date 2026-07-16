import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Cria uma transação vinculada ao usuário logado
  async create(createTransactionDto: CreateTransactionDto, userId: string) {
    return this.prisma.transaction.create({
      data: {
        title: createTransactionDto.title,
        amount: createTransactionDto.amount,
        type: createTransactionDto.type,
        category: createTransactionDto.category,
        date: new Date(createTransactionDto.date),
        userId,
      },
    });
  }

  // 2. Lista todas as transações de um usuário específico
  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }, // Organiza das mais recentes para as mais antigas
    });
  }

  // 3. Busca uma única transação garantindo a posse do usuário
  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  // 4. Atualiza uma transação existente
  async update(id: string, updateTransactionDto: UpdateTransactionDto, userId: string) {
    // Garante que ela existe e é do usuário antes de atualizar
    await this.findOne(id, userId);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...updateTransactionDto,
        date: updateTransactionDto.date ? new Date(updateTransactionDto.date) : undefined,
      },
    });
  }

  // 5. Remove uma transação do banco
  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.transaction.delete({
      where: { id },
    });

    return { message: 'Transação removida com sucesso' };
  }
}