import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private ai: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY não foi configurada no .env');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async askFinancialAssistant(prompt: string, userId: string): Promise<string> {
    try {
      // 1. Busca os dados reais do usuário no banco
      const summary = await this.getSummary(userId);
      const categories = await this.getCategories(userId);

      // 2. Formata o contexto do usuário para a IA entender
      const contextText = `
        Você é o "FinAI", um assistente financeiro pessoal, direto, amigável e focado em manter o usuário dentro do orçamento.
        
        SITUAÇÃO FINANCEIRA ATUAL DO USUÁRIO:
        - Saldo Geral Atual: R$ ${summary.balance.toFixed(2)}
        - Receitas do Mês: R$ ${summary.incomes.toFixed(2)}
        - Despesas do Mês: R$ ${summary.expenses.toFixed(2)}

        LIMITES E GASTOS ACUMULADOS POR CATEGORIA:
        ${categories.map(c => `- Categoria: "${c.name}" | Limite Definido: ${c.budgetLimit ? 'R$ ' + c.budgetLimit.toFixed(2) : 'Sem limite'} | Já Gasto no Mês: R$ ${c.totalSpent.toFixed(2)} | Restante Disponível: ${c.budgetLimit ? 'R$ ' + (c.budgetLimit - c.totalSpent).toFixed(2) : 'Ilimitado'}`).join('\n')}

        INSTRUÇÕES DE RESPOSTA:
        - Responda em Português do Brasil.
        - Seja direto e objetivo (no máximo 3 a 4 frases).
        - Se a pergunta for sobre uma compra, avalie se ela ultrapassa o saldo atual ou o limite da categoria correspondente.
        - Diga claramente "Sim" ou "Não" logo no início e explique o motivo com base nos valores numéricos.
      `;

      // 3. Executa a chamada no modelo Gemini
      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${contextText}\n\nPERGUNTA DO USUÁRIO:\n"${prompt}"` }] }
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