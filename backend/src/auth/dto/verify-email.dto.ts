import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email!: string;

  @IsNotEmpty({ message: 'O código é obrigatório.' })
  @Length(6, 6, { message: 'O código deve ter exatamente 6 dígitos.' })
  code!: string;
}