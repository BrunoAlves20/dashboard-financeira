import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da categoria é obrigatório' })
  name!: string;

  @IsOptional()
  @IsNumber({}, { message: 'O limite deve ser um número válido' })
  @Min(0, { message: 'O limite não pode ser negativo' })
  budgetLimit?: number;

  @IsOptional()
  @IsString()
  color?: string;
}