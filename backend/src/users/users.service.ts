import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer'; // <-- 1. IMPORTADO AQUI

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // <-- 2. FUNÇÃO DE ENVIO DE E-MAIL ADICIONADA AQUI
  private async sendVerificationEmail(email: string, code: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Dashboard Financeira" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Seu Código de Verificação',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Confirmação de Cadastro</h2>
          <p>Olá! Seu código de verificação é:</p>
          <h1 style="color: #2b6cb0; letter-spacing: 4px;">${code}</h1>
          <p>Insira este código na tela para ativar sua conta.</p>
        </div>
      `,
    });
  }

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

    // SEU CONSOLE LOG MANTIDO INTACTO
    console.log(`\n=================================================`);
    console.log(`🔑 CÓDIGO ÚNICO GERADO PARA: ${user.email}`);
    console.log(`👉 CÓDIGO: ${verificationCode}`);
    console.log(`=================================================\n`);

    // <-- 3. DISPARO DO E-MAIL LOGO APÓS O CONSOLE.LOG
    try {
      await this.sendVerificationEmail(user.email, verificationCode);
      console.log(`📧 E-mail enviado com sucesso para ${user.email}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar e-mail para ${user.email}:`, error);
    }

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