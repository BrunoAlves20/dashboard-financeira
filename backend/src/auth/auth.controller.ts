import { Controller, Post, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // Rota para login de usuário
  @Post('login')
  @HttpCode(HttpStatus.OK) // Define o status de sucesso para 200 (padrão de Login)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  // Rota para solicitar redefinição de senha
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.generatePasswordResetToken(email);
  }
  // Rota para redefinir a senha usando o token
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    // Em um cenário ideal de Clean Code, usaríamos um DTO (Data Transfer Object) aqui,
    // mas vamos extrair direto do body para acelerar a implementação
    const { email, token, newPassword } = body;
    
    if (!email || !token || !newPassword) {
      throw new HttpException('Email, token e nova senha são obrigatórios.', HttpStatus.BAD_REQUEST);
    }

    return this.authService.resetPassword(email, token, newPassword);
  }
}