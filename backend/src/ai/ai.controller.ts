import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AskAiDto } from './dto/ask-ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  async ask(@Body() dto: AskAiDto, @GetUser('id') userId: string) {
    const answer = await this.aiService.askFinancialAssistant(dto.prompt, userId);
    return { answer };
  }
}