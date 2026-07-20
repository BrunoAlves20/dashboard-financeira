import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, userId: string) {
    const categoryExists = await this.prisma.category.findUnique({
      where: {
        name_userId: {
          name: dto.name,
          userId,
        },
      },
    });

    if (categoryExists) {
      throw new ConflictException('Você já possui uma categoria com esse nome.');
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAllByUser(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
          },
          select: {
            amount: true,
          },
        },
      },
    });

    return categories.map((cat: any) => {
      const totalSpent = cat.transactions.reduce((acc: number, curr: { amount: number }) => acc + curr.amount, 0);
      const { transactions, ...categoryData } = cat;
      return {
        ...categoryData,
        totalSpent,
      };
    });
  }

  async remove(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}