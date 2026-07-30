import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { TransactionService, Transaction } from '../../services/transaction.service';
import { CategoryService, Category } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';

import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective],
  templateUrl: './graficos.page.html',
  styleUrl: './graficos.page.scss'
})
export class GraficosPage implements OnInit {
  userName: string = '';
  loading: boolean = false;

  selectedDate: string = new Date().toLocaleDateString('en-CA');
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  bankTotals: { bank: string; amount: number }[] = [];

  get formattedBrDate(): string {
    if (!this.selectedDate) return 'DD/MM/AAAA';
    const [year, month, day] = this.selectedDate.split('-');
    return `${day}/${month}/${year}`;
  }

  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } }
    }
  };
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'] }]
  };

  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
    }
  };
  public barChartData: ChartData<'bar'> = {
    labels: ['Resumo do Mês'],
    datasets: [
      { data: [0], label: 'Entradas (R$)', backgroundColor: '#10b981', borderRadius: 8 },
      { data: [0], label: 'Saídas (R$)', backgroundColor: '#ef4444', borderRadius: 8 }
    ]
  };

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.userName = JSON.parse(userJson).name;
    }
    this.loadChartData();
  }

  onDateChange(): void {
    if (!this.selectedDate) return;
    const parts = this.selectedDate.split('-');
    if (parts.length === 3) {
      this.selectedYear = parseInt(parts[0], 10);
      this.selectedMonth = parseInt(parts[1], 10);
      this.loadChartData();
    }
  }

  loadChartData(): void {
    this.loading = true;

    // 1. Resumo Entradas vs Saídas
    this.transactionService.getSummary(this.selectedMonth, this.selectedYear).subscribe({
      next: (summary) => {
        this.barChartData = {
          labels: ['Resumo Mensal'],
          datasets: [
            { data: [Number(summary.incomes) || 0], label: 'Entradas (R$)', backgroundColor: '#10b981', borderRadius: 8 },
            { data: [Number(summary.expenses) || 0], label: 'Saídas (R$)', backgroundColor: '#ef4444', borderRadius: 8 }
          ]
        };
      },
      error: (err) => console.error('Erro ao carregar resumo:', err)
    });

    // 2. Transações agrupadas por BANCO (Saídas)
    this.transactionService.getTransactions(this.selectedMonth, this.selectedYear).subscribe({
      next: (transactions: Transaction[]) => {
        const bankMap: { [key: string]: number } = {};

        transactions.forEach(t => {
          // Considera todas as despesas que possuem um banco atribuído (ou define 'Outros')
          if (t.type === 'EXPENSE') {
            const bankName = t.bank ? t.bank.trim() : 'Outros';
            const value = Number(t.amount) || 0;
            bankMap[bankName] = (bankMap[bankName] || 0) + value;
          }
        });

        this.bankTotals = Object.keys(bankMap).map(bank => ({
          bank,
          amount: bankMap[bank]
        })).sort((a, b) => b.amount - a.amount);
      },
      error: (err) => console.error('Erro ao carregar transações por banco:', err)
    });

    // 3. Categorias para o Gráfico de Rosca
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        const labels: string[] = [];
        const data: number[] = [];

        categories.forEach(cat => {
          const val = Number(cat.totalSpent) || 0;
          if (val > 0) {
            labels.push(cat.name);
            data.push(val);
          }
        });

        this.doughnutChartData = {
          labels: labels.length > 0 ? labels : ['Sem despesas'],
          datasets: [{
            data: data.length > 0 ? data : [1],
            backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
          }]
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        this.loading = false;
      }
    });
  }

  handleLogout(): void {
    this.authService.logout();
  }
}