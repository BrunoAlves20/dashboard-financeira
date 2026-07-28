import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { buildFinancialPrompt } from './prompts/financial.prompt';

@Injectable()
export class AiService {
  private ai: GoogleGenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY não foi configurada no .env');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async askFinancialAssistant(prompt: string, userId: string): Promise<string> {
    try {
      // 1. Busca os dados reais do usuário no banco (Sua lógica mantida intacta)
      const summary = await this.getSummary(userId);
      const categories = await this.getCategories(userId);

      // 2. Gera o texto final chamando o nosso arquivo externo
      const finalPromptText = buildFinancialPrompt(summary, categories, prompt);

      // 3. Executa a chamada no modelo Gemini
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          { role: 'user', parts: [{ text: finalPromptText }] }
        ]
      });

      return response.text || 'Não consegui processar sua dúvida financeira no momento.';
    } catch (error: any) {
      console.error('Erro na chamada do Gemini:', error);
      throw new InternalServerErrorException('Erro ao consultar o assistente de IA.');
    }
  }

  private async getSummary(userId: string) {
    const transactions = await this.prisma.transaction.findMany({ where: { userId } });
    const incomes = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    return { balance: incomes - expenses, incomes, expenses };
  }

  private async getCategories(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: {
        transactions: {
          where: { type: 'EXPENSE' },
          select: { amount: true }
        }
      }
    });

    return categories.map(cat => {
      const totalSpent = cat.transactions.reduce((acc, curr) => acc + curr.amount, 0);
      return {
        name: cat.name,
        budgetLimit: cat.budgetLimit,
        totalSpent
      };
    });
  }
}