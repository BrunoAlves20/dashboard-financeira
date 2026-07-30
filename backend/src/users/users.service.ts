import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;

    // 1. Verifica se o email já está cadastrado
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new ConflictException('Este email já está cadastrado');
    }

    // 2. Criptografa a senha do usuário
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Salva no banco e retorna o usuário sem a senha por segurança
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    
    // Remove a senha usando desestruturação
    const { password: _, ...result } = user;
    return result;
  }

  async update(id: string, updateData: { name: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { name: updateData.name },
    });
    
    // Remove a senha usando desestruturação
    const { password: _, ...result } = user;
    return result;
  }

  async remove(id: string) {
    // 1. Apaga primeiro as dependências (Transações e Categorias) para evitar erro de chave estrangeira
    await this.prisma.transaction.deleteMany({ where: { userId: id } });
    await this.prisma.category.deleteMany({ where: { userId: id } });
    
    // 2. Apaga o usuário
    return this.prisma.user.delete({ where: { id } });
  }
}