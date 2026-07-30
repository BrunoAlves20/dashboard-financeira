import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TransactionService, TransactionSummary, Transaction } from '../../services/transaction.service';
import { CategoryService, Category } from '../../services/category.service';
import { AiService } from '../../services/ai.service';
import { RouterModule } from '@angular/router';

import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage implements OnInit {
  userName: string = '';
  summary: TransactionSummary = { balance: 0, incomes: 0, expenses: 0 };
  transactions: Transaction[] = [];
  categories: Category[] = [];
  
  banks: string[] = ['Nubank', 'Banco Inter', 'Itaú', 'Bradesco', 'Caixa', 'Santander'];
  newBankName: string = '';
  
  currentFilter: 'ALL' | 'INCOME' | 'EXPENSE' = 'ALL';

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  
  selectedDate: string = new Date().toLocaleDateString('en-CA');

  get formattedBrDate(): string {
    if (!this.selectedDate) return 'DD/MM/AAAA';
    const [year, month, day] = this.selectedDate.split('-');
    return `${day}/${month}/${year}`;
  }

  transactionForm: FormGroup;
  categoryForm: FormGroup;

  loading: boolean = false;
  showCategoryModal: boolean = false;
  showBankModal: boolean = false;

  selectedCategoryForEdit: Category | null = null;

  showAiChat: boolean = false;
  aiPrompt: string = '';
  aiLoading: boolean = false;
  chatMessages: { sender: 'user' | 'ai'; text: string }[] = [
    { sender: 'ai', text: 'Olá! Sou o FinAI, seu assistente. Pode me perguntar se você pode fazer uma compra ou se o seu orçamento aguenta!' }
  ];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private aiService: AiService,
    private fb: FormBuilder
  ) {
    this.transactionForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['EXPENSE', [Validators.required]],
      paymentMethod: ['PIX', Validators.required],
      bank: ['Nubank'],
      categoryId: [''],
      installments: [1, [Validators.min(1), Validators.max(24)]],
      isRecurring: [false]
    });

    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      budgetLimit: [''] 
    });
  }

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.userName = JSON.parse(userJson).name;
    }
    this.loadDashboardData();
    this.loadCategories();
  }

  onDateChange(): void {
    if (!this.selectedDate) return;
    const parts = this.selectedDate.split('-');
    if (parts.length === 3) {
      this.selectedYear = parseInt(parts[0], 10);
      this.selectedMonth = parseInt(parts[1], 10);
      this.loadDashboardData();
    }
  }
  
  loadDashboardData(): void {
    this.transactionService.getSummary(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        this.summary = {
          balance: Number(data.balance) || 0,
          incomes: Number(data.incomes) || 0,
          expenses: Number(data.expenses) || 0
        };
      },
      error: (err) => console.error('Erro ao buscar resumo:', err)
    });

    this.transactionService.getTransactions(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        // Converte o valor de cada transação de forma garantida para Number
        this.transactions = data.map(t => ({
          ...t,
          amount: Number(t.amount) || 0
        }));
      },
      error: (err) => console.error('Erro ao buscar transações:', err)
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data.map(c => ({
          ...c,
          totalSpent: Number(c.totalSpent) || 0,
          budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : undefined
        }));
      },
      error: (err) => console.error('Erro ao buscar categorias:', err)
    });
  }

  onDeleteCategory(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.loadCategories();
          this.loadDashboardData();
        },
        error: (err) => alert('Erro ao excluir categoria: ' + err.message)
      });
    }
  }

  openEditCategoryModal(category: Category): void {
    this.selectedCategoryForEdit = category;
    this.categoryForm.patchValue({
      name: category.name,
      budgetLimit: category.budgetLimit || ''
    });
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.selectedCategoryForEdit = null;
    this.categoryForm.reset();
  }

  setTransactionType(type: 'INCOME' | 'EXPENSE'): void {
    this.transactionForm.patchValue({ type });
  }

  get isExpense(): boolean {
    return this.transactionForm.get('type')?.value === 'EXPENSE';
  }

  get filteredTransactions(): Transaction[] {
    if (this.currentFilter === 'ALL') return this.transactions;
    return this.transactions.filter(t => t.type === this.currentFilter);
  }

  setFilter(filter: 'ALL' | 'INCOME' | 'EXPENSE'): void {
    this.currentFilter = filter;
  }

  onDeleteTransaction(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadDashboardData();
          this.loadCategories();
        },
        error: (err) => console.error('Erro ao deletar transação:', err)
      });
    }
  }

  onAddTransaction(): void {
    if (this.transactionForm.invalid) {
      alert('⚠️ Preencha a descrição e o valor corretamente.');
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.transactionForm.value;

    const payload = {
      title: formValue.description,
      amount: Number(formValue.amount),
      type: formValue.type,
      paymentMethod: this.isExpense ? formValue.paymentMethod : undefined,
      bank: formValue.bank || 'Geral',
      categoryId: (this.isExpense && formValue.categoryId && formValue.categoryId !== '') ? formValue.categoryId : undefined,
      date: new Date().toISOString(),
      installments: (this.isExpense && formValue.paymentMethod === 'CREDIT') 
        ? Number(formValue.installments) 
        : 1,
      isRecurring: formValue.isRecurring || false
    };

    this.transactionService.createTransaction(payload).subscribe({
      next: () => {
        this.loading = false;
        this.transactionForm.reset({ 
          type: formValue.type, 
          paymentMethod: 'PIX', 
          bank: formValue.bank || 'Nubank',
          categoryId: '',
          installments: 1,
          isRecurring: false
        });
        this.loadDashboardData();
        this.loadCategories();
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || err.message;
        alert('❌ Erro no Servidor ao salvar: ' + errorMessage);
      }
    });
  }

  onAddCategory(): void {
    if (this.categoryForm.invalid) {
      alert('O nome da categoria precisa ter no mínimo 2 letras.');
      return;
    }

    const val = this.categoryForm.value;
    const payload = {
      name: val.name,
      budgetLimit: val.budgetLimit ? Number(val.budgetLimit) : undefined
    };

    if (this.selectedCategoryForEdit) {
      this.categoryService.updateCategory(this.selectedCategoryForEdit.id, payload).subscribe({
        next: () => {
          this.closeCategoryModal();
          this.loadCategories();
          this.loadDashboardData();
        },
        error: (err) => alert('Erro ao atualizar categoria: ' + err.message)
      });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: () => {
          this.closeCategoryModal();
          this.loadCategories();
        },
        error: (err) => alert('Erro ao criar categoria: ' + err.message)
      });
    }
  }

  addBank(name: string): void {
    if (name.trim() && !this.banks.includes(name.trim())) {
      this.banks.push(name.trim());
      this.transactionForm.patchValue({ bank: name.trim() });
      this.newBankName = '';
    }
  }

  removeBank(bankName: string): void {
    this.banks = this.banks.filter(b => b !== bankName);
    if (this.transactionForm.get('bank')?.value === bankName) {
      this.transactionForm.patchValue({ bank: this.banks[0] || '' });
    }
  }

  handleLogout(): void {
    this.authService.logout();
  }

  sendAiQuery(): void {
    if (!this.aiPrompt.trim() || this.aiLoading) return;

    const userText = this.aiPrompt.trim();
    this.chatMessages.push({ sender: 'user', text: userText });
    this.aiPrompt = '';
    this.aiLoading = true;

    this.aiService.askAssistant(userText).subscribe({
      next: (res) => {
        this.chatMessages.push({ sender: 'ai', text: res.answer });
        this.aiLoading = false;
      },
      error: (err) => {
        console.error('Erro na IA:', err);
        this.chatMessages.push({ 
          sender: 'ai', 
          text: 'Ops! Ocorreu um erro ao consultar o assistente. Tente novamente.' 
        });
        this.aiLoading = false;
      }
    });
  }
}