import { IsNotEmpty, IsString } from 'class-validator';

export class AskAiDto {
  @IsString()
  @IsNotEmpty({ message: 'A pergunta não pode estar vazia.' })
  prompt!: string;
}