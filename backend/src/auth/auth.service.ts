import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService, // <-- CORREÇÃO: Injetado corretamente para evitar erro de undefined
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Busca o usuário pelo e-mail
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Compara a senha digitada com a criptografada no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Gera o payload do JWT contendo o ID e E-mail do usuário
    const payload = { sub: user.id, email: user.email };

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified, // <-- ADICIONADO: Fundamental para o frontend exibir/ocultar o modal
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async generatePasswordResetToken(email: string) {
    // 1. Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Por segurança, não informamos que o e-mail não existe para evitar rastreio
      throw new HttpException('Se o e-mail existir, um token foi gerado.', HttpStatus.OK);
    }

    // 2. Invalida tokens anteriores desse usuário (boa prática de segurança)
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // 3. Gera um token aleatório criptograficamente seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 4. Cria o hash do token para salvar no banco (nunca salvamos em texto plano)
    const tokenHash = await bcrypt.hash(resetToken, 10);
    
    // 5. Define a expiração para 10 minutos no futuro
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 6. Salva no banco de dados
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // IMPORTANTE: Retornamos o token em texto plano APENAS aqui. 
    // Em um cenário real, você injetaria o serviço de E-mail aqui e enviaria. 
    // Como queremos uma API de validação direta para exibir no frontend (ou logs), retornamos ele.
    // Disparo do e-mail de recuperação
    try {
      await this.sendPasswordResetEmail(user.email, resetToken);
      console.log(`📧 E-mail de redefinição enviado para ${user.email}`);
    } catch (error) {
      console.error(`❌ Erro ao enviar redefinição para ${user.email}:`, error);
    }

    // Por segurança, a API só avisa que o e-mail foi enviado (sem expor o token no frontend)
    return { 
      message: 'Se o e-mail existir no sistema, um link de recuperação foi enviado.' 
    };
  }
  
  /**
   * Valida o token e redefine a senha do usuário
   */
  async resetPassword(email: string, token: string, newPassword: string) {
    // 1. Busca o usuário
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpException('Dados inválidos.', HttpStatus.BAD_REQUEST);
    }

    // 2. Busca o token de reset atrelado a este usuário
    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id }
    });

    if (!resetRecord) {
      throw new HttpException('Nenhum token de redefinição encontrado.', HttpStatus.BAD_REQUEST);
    }

    // 3. Verifica se o token expirou (passou de 10 minutos)
    if (resetRecord.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      throw new HttpException('O token expirou. Solicite um novo.', HttpStatus.BAD_REQUEST);
    }

    // 4. Compara o token recebido com o hash salvo no banco
    const isValidToken = await bcrypt.compare(token, resetRecord.tokenHash);
    if (!isValidToken) {
      throw new HttpException('Token inválido.', HttpStatus.BAD_REQUEST);
    }

    // 5. Gera o hash da NOVA senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 6. Atualiza a senha no banco de dados
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: newPasswordHash },
    });

    // 7. Limpa o token usado para que não possa ser reaproveitado (Segurança)
    await this.prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });

    return { message: 'Senha atualizada com sucesso!' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { email, code } = dto;

    // 1. Busca o usuário pelo e-mail
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.isVerified) {
      return { message: 'Este e-mail já foi verificado anteriormente.' };
    }

    // 1. Checa se o código está correto
    if (!user.verificationCode || user.verificationCode !== code) {
      throw new BadRequestException('Código de verificação incorreto.');
    }

    // 2. Checa se o código expirou (passou dos 10 minutos)
    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('O código de verificação expirou (limite de 10 minutos). Solicite um novo código.');
    }

    // 3. Atualiza o usuário como verificado e limpa os campos temporários
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });
    return {
      message: 'E-mail verificado com sucesso!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
      },
    };
  }

  private async sendPasswordResetEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // O link aponta direto para a tela de nova senha no seu frontend da Vercel
  const resetLink = `https://dashboard-financeira-blush.vercel.app/reset-password?token=${token}&email=${email}`;

  await transporter.sendMail({
    from: `"Dashboard Financeira" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Redefinição de Senha - Dashboard Financeira',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Recuperação de Senha</h2>
        <p>Você solicitou a redefinição da sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha. O link é válido por 10 minutos:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2b6cb0; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
      </div>
    `,
  });
}
}