import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';
import { driver } from 'driver.js';

import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

@Component({
  selector: 'app-extrato',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './extrato.page.html',
  styleUrl: './extrato.page.scss'
})
export class ExtratoPage implements OnInit {
  userName: string = '';
  loading: boolean = false;

  // Definição das datas do ciclo (Por padrão: primeiro dia do mês atual até hoje)
  startDate: string = '';
  endDate: string = '';

  // Dados retornados pelo extrator
  statementData: {
    totalIncomes: number;
    totalExpenses: number;
    balance: number;
    transactions: Transaction[];
  } = {
    totalIncomes: 0,
    totalExpenses: 0,
    balance: 0,
    transactions: []
  };

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.userName = JSON.parse(userJson).name;
    }

    // Define intervalo padrão (Ex: dia 01 do mês atual até o último dia do mês)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.startDate = firstDay.toLocaleDateString('en-CA');
    this.endDate = lastDay.toLocaleDateString('en-CA');

    this.loadStatement();
  }

  ngAfterViewInit() {
    const jaViu = localStorage.getItem('extrato_tutorial');
    if (!jaViu) {
      this.restartTour();
      localStorage.setItem('extrato_tutorial', 'true');
    }
  }

  setDefaultDates() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
    this.endDate = `${year}-${month}-${lastDay}`;
  }

  // Busca o extrato do período selecionado
  loadStatement(): void {
    if (!this.startDate || !this.endDate) return;

    this.loading = true;
    this.transactionService.getStatement(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.statementData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar extrato:', err);
        this.loading = false;
      }
    });
  }

  handleLogout(): void {
    this.authService.logout();
  }

  // EXPORTAR EXTRATO EM CSV (EXCEL)
  exportToCsv(): void {
    if (!this.statementData.transactions || this.statementData.transactions.length === 0) {
      alert('Não há dados para exportar neste período.');
      return;
    }

    const headers = ['Data', 'Tipo', 'Descricao', 'Categoria', 'Banco', 'Forma Pagamento', 'Valor (R$)'];
    const rows = this.statementData.transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'INCOME' ? 'Entrada' : 'Saida',
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category?.name || 'Sem Categoria'}"`,
      `"${t.bank || '-'}"`,
      `"${t.paymentMethod || '-'}"`,
      t.amount.toFixed(2).replace('.', ',')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Extrato_Financeiro_${this.startDate}_a_${this.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // EXPORTAR EXTRATO EM PDF (Módulo de Impressão Formatado)
  exportToPdf(): void {
    if (!this.statementData.transactions || this.statementData.transactions.length === 0) {
      alert('Não há dados para exportar neste período.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = this.statementData.transactions.map(t => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(t.date).toLocaleDateString('pt-BR')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.title}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.category?.name || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.bank || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${t.type === 'INCOME' ? 'green' : 'red'}; font-weight: bold;">
          ${t.type === 'INCOME' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Extrato Financeiro (${this.startDate} a ${this.endDate})</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h2 { color: #4f46e5; margin-bottom: 5px; }
            .summary { margin-bottom: 20px; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #1e293b; color: white; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Relatório de Extrato Financeiro</h2>
          <p><strong>Usuário:</strong> ${this.userName}</p>
          <p><strong>Período:</strong> ${this.startDate} até ${this.endDate}</p>
          
          <div class="summary">
            <strong>Entradas:</strong> R$ ${this.statementData.totalIncomes.toFixed(2)} | 
            <strong>Saídas:</strong> R$ ${this.statementData.totalExpenses.toFixed(2)} | 
            <strong>Balanço:</strong> R$ ${this.statementData.balance.toFixed(2)}
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Banco</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>F
      </html>
    `);
    printWindow.document.close();
  }

  restartTour() {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      nextBtnText: 'Próximo →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Concluir',
      steps: [
        { popover: { title: 'Extrator Detalhado 📄', description: 'Aqui você audita e filtra o histórico completo das suas finanças em um período específico.', align: 'center' } },
        { element: '#extrato-filtros', popover: { title: 'Filtro por Período', description: 'Escolha a data de início e término para fechar o ciclo de análise que preferir.', side: 'bottom', align: 'start' } },
        { element: '#btn-exportar', popover: { title: 'Exportar Relatórios', description: 'Baixe seus dados rapidamente em formato CSV ou imprima/salve em PDF.', side: 'bottom', align: 'start' } },
        { element: '#extrato-tabela', popover: { title: 'Lançamentos', description: 'Lista completa com status, valores, categorias e instituições bancárias de cada registro.', side: 'top', align: 'start' } }
      ]
    });
    driverObj.drive();
  }
  
}