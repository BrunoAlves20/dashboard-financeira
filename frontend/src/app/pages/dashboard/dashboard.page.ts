import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TransactionService, TransactionSummary, Transaction } from '../../services/transaction.service';
import { CategoryService, Category } from '../../services/category.service';
import { AiService } from '../../services/ai.service';


import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  transactionForm: FormGroup;
  categoryForm: FormGroup;

  loading: boolean = false;
  showCategoryModal: boolean = false;
  showBankModal: boolean = false;

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
      paymentMethod: ['PIX'],
      bank: ['Nubank'],
      categoryId: ['']
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

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Erro ao buscar categorias:', err)
    });
  }

  // === EXCLUSÃO DE CATEGORIA ===
  onDeleteCategory(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta categoria? As transações antigas não serão apagadas, mas ficarão "Sem categoria".')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.loadCategories();
          this.loadDashboardData(); // Recarrega para atualizar a lista
        },
        error: (err) => alert('Erro ao excluir categoria: ' + err.message)
      });
    }
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
    // 1. AVISO DE ERRO NO FORMULÁRIO
    if (this.transactionForm.invalid) {
      const controls = this.transactionForm.controls;
      let camposInvalidos = [];
      if (controls['description'].invalid) camposInvalidos.push('Descrição (mínimo 3 letras)');
      if (controls['amount'].invalid) camposInvalidos.push('Valor (maior que zero)');
      
      alert('⚠️ Preencha corretamente os campos:\n- ' + camposInvalidos.join('\n- '));
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
      bank: formValue.bank || undefined,
      categoryId: formValue.categoryId ? formValue.categoryId : undefined,
      date: new Date().toISOString()
    };

    this.transactionService.createTransaction(payload).subscribe({
      next: () => {
        this.loading = false;
        // Mantém a data de hoje, zera descrição e valor, mas lembra o banco e o tipo.
        this.transactionForm.reset({ 
          type: formValue.type, 
          paymentMethod: 'PIX', 
          bank: formValue.bank || 'Nubank',
          categoryId: '' 
        });
        this.loadDashboardData();
        this.loadCategories();
      },
      error: (err) => {
        this.loading = false;
        // 2. AVISO DE ERRO DO BACKEND
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

    this.categoryService.createCategory(payload).subscribe({
      next: () => {
        this.categoryForm.reset();
        this.showCategoryModal = false;
        this.loadCategories();
      },
      error: (err) => alert('Erro ao criar categoria: ' + err.message)
    });
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
        
        // Tratamento elegante para o limite de requisições (Erro 429)
        if (err.status === 429) {
          this.chatMessages.push({ 
            sender: 'ai', 
            text: 'Estou processando muitos cálculos ao mesmo tempo agora! 😅 Por favor, aguarde uns 30 segundinhos e tente me perguntar de novo.' 
          });
        } else {
          this.chatMessages.push({ 
            sender: 'ai', 
            text: 'Ops! Ocorreu um erro ao consultar o assistente. Tente novamente em instantes.' 
          });
        }
        
        this.aiLoading = false;
      }
    });
  }

}