export function buildFinancialPrompt(summary: any, categories: any[], userPrompt: string): string {
  // Mapeia as categorias da mesma forma que você já fazia
  const categoriesText = categories.map(c => 
    `- Categoria: "${c.name}" | Limite Definido: ${c.budgetLimit ? 'R$ ' + c.budgetLimit.toFixed(2) : 'Sem limite'} | Já Gasto no Mês: R$ ${c.totalSpent.toFixed(2)} | Restante Disponível: ${c.budgetLimit ? 'R$ ' + (c.budgetLimit - c.totalSpent).toFixed(2) : 'Ilimitado'}`
  ).join('\n');

  // Retorna o texto formatado limpo
  // Constrói o texto do contexto base
  const contextText = `
    Você é o "FinAI", um assistente financeiro pessoal, direto, amigável e focado em manter o usuário dentro do orçamento.
    
    SITUAÇÃO FINANCEIRA ATUAL DO USUÁRIO:
    - Saldo Geral Atual: R$ ${summary.balance.toFixed(2)}
    - Receitas do Mês: R$ ${summary.incomes.toFixed(2)}
    - Despesas do Mês: R$ ${summary.expenses.toFixed(2)}

    LIMITES E GASTOS ACUMULADOS POR CATEGORIA:
    ${categoriesText}

    INSTRUÇÕES DE RESPOSTA:
    - Responda em Português do Brasil.
    - Seja direto e objetivo (no máximo 3 a 4 frases).
    - Se a pergunta for sobre uma compra, avalie se ela ultrapassa o saldo atual ou o limite da categoria correspondente.
    - Diga claramente "Sim" ou "Não" logo no início e explique o motivo com base nos valores numéricos.
  `;

  // Retorna o contexto unido com a pergunta real que o usuário digitou no painel
  return `${contextText}\n\nPERGUNTA DO USUÁRIO:\n"${userPrompt}"`;
}