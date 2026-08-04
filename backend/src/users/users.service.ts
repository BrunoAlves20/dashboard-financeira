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

    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new ConflictException('Este email já está cadastrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // GARANTIA DE CÓDIGO ÚNICO

    let verificationCode = '';
    let isUnique = false;

    // Fica gerando um código novo até encontrar um que não exista no banco
    while (!isUnique) {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExists = await this.prisma.user.findFirst({
        where: { verificationCode }
      });
      if (!codeExists) {
        isUnique = true; 
      }
    }
    // Expiração em 10 minutos  
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isVerified: false,
        verificationCode: verificationCode,
        verificationCodeExpiresAt: verificationCodeExpiresAt,
      },
    });

    console.log(`\n=================================================`);
    console.log(`🔑 CÓDIGO ÚNICO GERADO PARA: ${user.email}`);
    console.log(`👉 CÓDIGO: ${verificationCode}`);
    console.log(`=================================================\n`);

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
    
    const { password: _, ...result } = user;
    return result;
  }

  async update(id: string, updateData: { name: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { name: updateData.name },
    });
    
    const { password: _, ...result } = user;
    return result;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado no banco de dados.');
    }

    await this.prisma.transaction.deleteMany({ where: { userId: id } });
    await this.prisma.category.deleteMany({ where: { userId: id } });
    
    return this.prisma.user.delete({ where: { id } });
  }
}