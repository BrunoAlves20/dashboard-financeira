import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TransactionService, TransactionSummary, Transaction } from '../../services/transaction.service';
import { CategoryService, Category } from '../../services/category.service';
import { AiService } from '../../services/ai.service';
import { RouterModule } from '@angular/router';
import { driver } from 'driver.js';
import localePt from '@angular/common/locales/pt';
import introJs from 'intro.js';
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
  
  banks: string[] = [];

  loadBanks(): void {
    const savedBanks = localStorage.getItem('user_banks');
    if (savedBanks !== null) {
      this.banks = JSON.parse(savedBanks);
    } else {
      const defaultBanks = ['Nubank', 'Itaú', 'Bradesco', 'Banco do Brasil', 'Santander', 'Inter'];
      this.banks = defaultBanks;
      this.saveBanks();
    }
  }

  saveBanks(): void {
    localStorage.setItem('user_banks', JSON.stringify(this.banks));
  }

  newBankName: string = '';
  currentFilter: 'ALL' | 'INCOME' | 'EXPENSE' = 'ALL';

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  selectedDate: string = new Date().toLocaleDateString('en-CA');

  // Formatação de Datas em PT-BR
  get formattedTransactionDateBr(): string {
    const rawDate = this.transactionForm.get('date')?.value;
    if (!rawDate) return 'DD/MM/AAAA';
    const [year, month, day] = rawDate.split('-');
    if (!year || !month || !day) return 'DD/MM/AAAA';
    return `${day}/${month}/${year}`;
  }

  get formattedEditTransactionDateBr(): string {
    const rawDate = this.editTransactionForm.get('date')?.value;
    if (!rawDate) return 'DD/MM/AAAA';
    const [year, month, day] = rawDate.split('-');
    if (!year || !month || !day) return 'DD/MM/AAAA';
    return `${day}/${month}/${year}`;
  }

  get formattedBrDate(): string {
    if (!this.selectedDate) return 'DD/MM/AAAA';
    const [year, month, day] = this.selectedDate.split('-');
    return `${day}/${month}/${year}`;
  }

  transactionForm: FormGroup;
  editTransactionForm: FormGroup;
  categoryForm: FormGroup;

  loading: boolean = false;
  showCategoryModal: boolean = false;
  showBankModal: boolean = false;
  showEditTransactionModal: boolean = false;

  selectedCategoryForEdit: Category | null = null;
  selectedTransactionForEdit: Transaction | null = null;

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
      installments: [1, [Validators.min(1), Validators.max(48)]],
      paidInstallments: [0, [Validators.min(0)]],
      isPartialInstallment: [false],
      date: [''],
      isRecurring: [false]
    });

    this.editTransactionForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['EXPENSE', [Validators.required]],
      paymentMethod: ['PIX', Validators.required],
      bank: ['Nubank'],
      categoryId: [''],
      installments: [1, [Validators.min(1), Validators.max(48)]],
      date: ['']
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
    this.loadBanks();

    setTimeout(() => {
      this.checkAndStartTour();
    }, 500);
  }

  ngAfterViewInit() {
    this.iniciarTutorial();
  }

  iniciarTutorial() {
    const jaViuTutorial = localStorage.getItem('dashboard_tutorial');
    if (!jaViuTutorial) {
      this.executarTour();
    }
  }

  restartTour() {
    this.executarTour();
  }

  private executarTour() {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      nextBtnText: 'Próximo →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Concluir',
      steps: [
        { popover: { title: 'Bem-vindo ao FinAI! 🚀', description: 'Este é o seu painel central.', align: 'center' } },
        { element: '#saldo-card', popover: { title: 'Seu Saldo Atual', description: 'Balanço total acumulado.', side: "bottom", align: 'start' } },
        { element: '#metas-card', popover: { title: 'Suas Entradas', description: 'Total de receitas do mês.', side: "bottom", align: 'start' } },
        { element: '#graficos-card', popover: { title: 'Suas Saídas', description: 'Total de despesas do mês.', side: "bottom", align: 'start' } },
        { element: '#categorias-section', popover: { title: 'Categorias Inteligentes', description: 'Organize suas movimentações.', side: 'top', align: 'start' } },
        { element: '#transacoes-section', popover: { title: 'Extrato Rápido', description: 'Últimos lançamentos.', side: 'top', align: 'start' } },
        { element: '#form-section', popover: { title: 'Lançamentos', description: 'Registre novas despesas/receitas.', side: 'left', align: 'start' } },
        { element: '#ai-button', popover: { title: 'Inteligência Artificial', description: 'Consultor financeiro.', side: 'left', align: 'end' } }
      ],
      onDestroyStarted: () => {
        if (!driverObj.hasNextStep() || confirm("Deseja fechar o tutorial?")) {
          driverObj.destroy();
          localStorage.setItem('dashboard_tutorial', 'true');
        }
      },
    });
    driverObj.drive();
  }

  private parseLocalDate(dateString: string): string {
    if (!dateString) return new Date().toISOString();
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0);
    return localDate.toISOString();
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

  get isEditExpense(): boolean {
    return this.editTransactionForm.get('type')?.value === 'EXPENSE';
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

  // MODAL DE EDIÇÃO DE TRANSAÇÃO
  openEditTransactionModal(transaction: Transaction): void {
    this.selectedTransactionForEdit = transaction;
    
    let formattedDate = '';
    if (transaction.date) {
      const dateObj = new Date(transaction.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }

    this.editTransactionForm.patchValue({
      description: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      paymentMethod: transaction.paymentMethod || 'PIX',
      bank: transaction.bank || 'Nubank',
      categoryId: transaction.category?.id || (transaction as any).categoryId || '',
      installments: (transaction as any).installments || 1,
      date: formattedDate
    });

    this.showEditTransactionModal = true;
  }

  closeEditTransactionModal(): void {
    this.showEditTransactionModal = false;
    this.selectedTransactionForEdit = null;
    this.editTransactionForm.reset();
  }

  onUpdateTransaction(): void {
    if (this.editTransactionForm.invalid || !this.selectedTransactionForEdit) {
      alert('⚠️ Preencha os campos da transação corretamente.');
      return;
    }

    this.loading = true;
    const val = this.editTransactionForm.value;

    const transactionDate = val.date 
      ? this.parseLocalDate(val.date) 
      : this.selectedTransactionForEdit.date;

    const payload = {
      title: val.description,
      amount: Number(val.amount),
      type: val.type,
      paymentMethod: val.type === 'EXPENSE' ? val.paymentMethod : undefined,
      bank: val.bank || 'Geral',
      categoryId: (val.type === 'EXPENSE' && val.categoryId && val.categoryId !== '') ? val.categoryId : undefined,
      date: transactionDate,
      installments: (val.type === 'EXPENSE' && val.paymentMethod === 'CREDIT') ? Number(val.installments) : 1
    };

    this.transactionService.updateTransaction(this.selectedTransactionForEdit.id, payload).subscribe({
      next: () => {
        this.loading = false;
        this.closeEditTransactionModal();
        this.loadDashboardData();
        this.loadCategories();
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || err.message;
        alert('❌ Erro ao atualizar movimentação: ' + errorMessage);
      }
    });
  }

  toggleRecurring(): void {
    const current = this.transactionForm.get('isRecurring')?.value;
    this.transactionForm.patchValue({ isRecurring: !current });
  }

  onAddTransaction(): void {
    if (this.transactionForm.invalid) {
      alert('⚠️ Preencha a descrição e o valor corretamente.');
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.transactionForm.value;

    const transactionDate = formValue.date 
      ? this.parseLocalDate(formValue.date) 
      : new Date().toISOString();

    const totalInstallments = Number(formValue.installments) || 1;
    const paid = formValue.isPartialInstallment ? (Number(formValue.paidInstallments) || 0) : 0;
    const remainingInstallments = Math.max(1, totalInstallments - paid);

    const payload = {
      title: formValue.isPartialInstallment 
        ? `${formValue.description} (${paid + 1}/${totalInstallments})`
        : formValue.description,
      amount: Number(formValue.amount),
      type: formValue.type,
      paymentMethod: this.isExpense ? formValue.paymentMethod : undefined,
      bank: formValue.bank || 'Geral',
      categoryId: (this.isExpense && formValue.categoryId && formValue.categoryId !== '') ? formValue.categoryId : undefined,
      date: transactionDate,
      installments: (this.isExpense && formValue.paymentMethod === 'CREDIT') 
        ? remainingInstallments 
        : 1,
      isRecurring: formValue.isRecurring || false
    };

    this.transactionService.createTransaction(payload).subscribe({
      next: () => {
        this.loading = false;
        this.transactionForm.reset({ 
          type: formValue.type, 
          paymentMethod: 'PIX', 
          bank: formValue.bank || (this.banks.length > 0 ? this.banks[0] : 'Nubank'),
          categoryId: '',
          installments: 1,
          paidInstallments: 0,
          isPartialInstallment: false,
          date: '',
          isRecurring: false
        });
        
        if (formValue.date) {
          const [y, m] = formValue.date.split('-').map(Number);
          this.selectedYear = y;
          this.selectedMonth = m;
          this.selectedDate = `${y}-${String(m).padStart(2, '0')}-01`;
        }

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

  addBank(newBankName: string): void {
    const bankTrimmed = newBankName.trim();
    if (!bankTrimmed) return;

    if (this.banks.includes(bankTrimmed)) {
      alert('Este banco já está cadastrado.');
      return;
    }

    this.banks.push(bankTrimmed);
    this.saveBanks(); 
  }

  removeBank(bankToRemove: string): void {
    this.banks = this.banks.filter(bank => bank !== bankToRemove);
    this.saveBanks(); 
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

  checkAndStartTour(): void {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      const intro = introJs();
      intro.setOptions({
        nextLabel: 'Próximo',
        prevLabel: 'Anterior',
        doneLabel: 'Entendi!',
        showProgress: true,
        showStepNumbers: false,
        dontShowAgain: true,
        dontShowAgainLabel: 'Não mostrar novamente',
        dontShowAgainCookie: 'hasSeenTour'
      });
      intro.oncomplete(() => localStorage.setItem('hasSeenTour', 'true'));
      intro.onexit(() => localStorage.setItem('hasSeenTour', 'true'));
      intro.start();
    }
  }
}