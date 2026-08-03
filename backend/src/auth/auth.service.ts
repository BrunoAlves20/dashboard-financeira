import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  prisma: any;
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
    return { 
      message: 'Token gerado com sucesso',
      resetToken 
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
}