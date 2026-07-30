import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';

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
}