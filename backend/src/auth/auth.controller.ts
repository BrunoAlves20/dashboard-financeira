import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK) // Define o status de sucesso para 200 (padrão de Login)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}