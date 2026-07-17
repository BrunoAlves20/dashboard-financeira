import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // <-- IMPORTAÇÕES NOVAS
import { AuthService } from '../../services/auth.service';
import { TransactionService, TransactionSummary, Transaction } from '../../services/transaction.service';

// Configurando a moeda brasileira nos pipes locais
import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})

export class DashboardPage implements OnInit {
  userName: string = '';
  summary: TransactionSummary = { balance: 0, incomes: 0, expenses: 0 };
  transactions: Transaction[] = [];
  // Controle do filtro de transações (Todas, Entradas, Saídas)
  currentFilter: 'ALL' | 'INCOME' | 'EXPENSE' = 'ALL';
  // Controle do Formulário de Nova Transação
  transactionForm: FormGroup;
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private fb: FormBuilder
  ) {
    this.transactionForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['EXPENSE', [Validators.required]],
      category: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.userName = JSON.parse(userJson).name;
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.transactionService.getSummary().subscribe({
      next: (data) => this.summary = data,
      error: (err) => console.error('Erro ao buscar resumo:', err)
    });

    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions = data,
      error: (err) => console.error('Erro ao buscar transações:', err)
    });
  }

  // Função para retornar apenas as transações que batem com o filtro ativo
  get filteredTransactions(): Transaction[] {
    if (this.currentFilter === 'ALL') return this.transactions;
    return this.transactions.filter(t => t.type === this.currentFilter);
  }

  // Altera o filtro ativo (Tudo, Entradas ou Saídas)
  setFilter(filter: 'ALL' | 'INCOME' | 'EXPENSE'): void {
    this.currentFilter = filter;
  }

  // Método para excluir o registro e atualizar os saldos
  onDeleteTransaction(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          // Recarrega o resumo e a lista do banco de dados para sincronizar os saldos na hora!
          this.loadDashboardData();
        },
        error: (err) => console.error('Erro ao deletar transação:', err)
      });
    }
  }

  onAddTransaction(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.transactionForm.value;

    const payload = {
      title: formValue.description,
      amount: Number(formValue.amount),
      type: formValue.type,
      category: formValue.category,
      date: new Date().toISOString()
    };

    this.transactionService.createTransaction(payload).subscribe({
      next: () => {
        this.loading = false;
        this.transactionForm.reset({ type: 'EXPENSE', category: '' });
        this.loadDashboardData();
      },
      error: (err) => {
        this.loading = false;
        console.error('Erro ao criar transação:', err);
      }
    });
  }

  handleLogout(): void {
    this.authService.logout();
  }
}