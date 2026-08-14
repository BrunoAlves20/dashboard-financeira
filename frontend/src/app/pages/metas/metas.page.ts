import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { driver } from 'driver.js';
import { 
  LucideAngularModule, 
  Target, 
  Shield, 
  Plane, 
  Car, 
  Home, 
  Laptop, 
  GraduationCap, 
  Heart, 
  Smartphone, 
  Sun, 
  PiggyBank, 
  Gamepad2, 
  Briefcase, 
  Trophy,
  Pencil,
  Trash2,
  PlusCircle,
  HelpCircle,
  Coins
} from 'lucide-angular';

import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
}

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './metas.page.html',
  styleUrl: './metas.page.scss'
})
export class MetasPage implements OnInit, AfterViewInit {
  userName: string = '';
  showGoalModal: boolean = false;
  showDepositModal: boolean = false;
  isEditing: boolean = false;

  selectedGoal: Goal | null = null;
  depositAmount: number = 0;

  // Dicionário de ícones disponíveis para busca dinâmica por chave
  readonly iconsMap: { [key: string]: any } = {
    'Target': Target,
    'Shield': Shield,
    'Plane': Plane,
    'Car': Car,
    'Home': Home,
    'Laptop': Laptop,
    'GraduationCap': GraduationCap,
    'Heart': Heart,
    'Smartphone': Smartphone,
    'Sun': Sun,
    'PiggyBank': PiggyBank,
    'Gamepad2': Gamepad2,
    'Briefcase': Briefcase,
    'Trophy': Trophy
  };

  // Exposição direta dos ícones estáticos para uso no HTML ([img]="Target")
  readonly Target = Target;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly PlusCircle = PlusCircle;
  readonly HelpCircle = HelpCircle;
  readonly Coins = Coins;

  availableIconKeys: string[] = [
    'Target', 'Shield', 'Plane', 'Car', 'Home', 'Laptop', 
    'GraduationCap', 'Heart', 'Smartphone', 'Sun', 'PiggyBank', 
    'Gamepad2', 'Briefcase', 'Trophy'
  ];

  // Form de meta (Criar / Editar)
  goalIdToEdit: string | null = null;
  newGoalTitle: string = '';
  newGoalTarget: number = 0;
  newGoalIcon: string = 'Target';

  goals: Goal[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.userName = JSON.parse(userJson).name;
    }
    this.loadGoals();
  }

  ngAfterViewInit(): void {
    const jaViu = localStorage.getItem('metas_tutorial');
    if (!jaViu) {
      this.restartTour();
      localStorage.setItem('metas_tutorial', 'true');
    }
  }

  // CARREGA APENAS O QUE O USUÁRIO SALVOU (Sem criar exemplos automaticamente)
  loadGoals(): void {
    const savedGoals = localStorage.getItem('user_goals');
    if (savedGoals) {
      this.goals = JSON.parse(savedGoals);
    } else {
      this.goals = []; // Inicia completamente limpo!
    }
  }

  saveGoals(): void {
    localStorage.setItem('user_goals', JSON.stringify(this.goals));
  }

  getIconComponent(iconName: string): any {
    return this.iconsMap[iconName] || Target;
  }

  // Abre modal para CRIAR
  openCreateModal(): void {
    this.isEditing = false;
    this.goalIdToEdit = null;
    this.newGoalTitle = '';
    this.newGoalTarget = 0;
    this.newGoalIcon = 'Target';
    this.showGoalModal = true;
  }

  // Abre modal para EDITAR
  openEditModal(goal: Goal): void {
    this.isEditing = true;
    this.goalIdToEdit = goal.id;
    this.newGoalTitle = goal.title;
    this.newGoalTarget = goal.targetAmount;
    this.newGoalIcon = goal.icon || 'Target';
    this.showGoalModal = true;
  }

  // Salva (Criação ou Edição)
  onSaveGoal(): void {
    if (!this.newGoalTitle.trim() || this.newGoalTarget <= 0) {
      alert('Preencha o título e um valor alvo válido.');
      return;
    }

    if (this.isEditing && this.goalIdToEdit) {
      const index = this.goals.findIndex(g => g.id === this.goalIdToEdit);
      if (index !== -1) {
        this.goals[index].title = this.newGoalTitle;
        this.goals[index].targetAmount = this.newGoalTarget;
        this.goals[index].icon = this.newGoalIcon;
      }
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: this.newGoalTitle,
        targetAmount: this.newGoalTarget,
        currentAmount: 0,
        icon: this.newGoalIcon || 'Target'
      };
      this.goals.push(newGoal);
    }

    this.saveGoals();
    this.showGoalModal = false;
  }

  openDepositModal(goal: Goal): void {
    this.selectedGoal = goal;
    this.depositAmount = 0;
    this.showDepositModal = true;
  }

  onDeposit(): void {
    if (!this.selectedGoal || this.depositAmount <= 0) return;

    this.selectedGoal.currentAmount += this.depositAmount;
    this.saveGoals();
    this.showDepositModal = false;
  }

  onDeleteGoal(id: string): void {
    if (confirm('Deseja realmente remover esta meta?')) {
      this.goals = this.goals.filter(g => g.id !== id);
      this.saveGoals();
    }
  }

  handleLogout(): void {
    this.authService.logout();
  }

  restartTour(): void {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      nextBtnText: 'Próximo →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Concluir',
      steps: [
        { popover: { title: 'Metas e Caixinhas 🎯', description: 'Gerencie suas economias e acompanhe o crescimento dos seus objetivos para o futuro.', align: 'center' } },
        { element: '#btn-nova-meta', popover: { title: 'Criar Objetivo', description: 'Clique aqui para adicionar uma nova meta financeira, definindo nome, ícone e valor alvo.', side: 'bottom', align: 'start' } },
        { element: '#lista-metas', popover: { title: 'Acompanhamento', description: 'Monitore as barras de progresso de cada caixinha e faça novos aportes de saldo quando quiser.', side: 'top', align: 'start' } }
      ]
    });
    driverObj.drive();
  }
}