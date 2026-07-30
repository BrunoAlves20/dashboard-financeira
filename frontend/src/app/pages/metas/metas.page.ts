import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './metas.page.html',
  styleUrl: './metas.page.scss'
})
export class MetasPage implements OnInit {
  userName: string = '';
  showGoalModal: boolean = false;
  showDepositModal: boolean = false;
  isEditing: boolean = false;

  selectedGoal: Goal | null = null;
  depositAmount: number = 0;

  // Lista de emojis pré-definidos para escolha rápida
  availableEmojis: string[] = ['🎯', '🛡️', '✈️', '🚗', '🏠', '💻', '🎓', '💍', '📱', '🏖️', '💰', '🎮'];

  // Form de meta (Criar / Editar)
  goalIdToEdit: string | null = null;
  newGoalTitle: string = '';
  newGoalTarget: number = 0;
  newGoalIcon: string = '🎯';

  goals: Goal[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.userName = JSON.parse(userJson).name;
    }
    this.loadGoals();
  }

  loadGoals(): void {
    const savedGoals = localStorage.getItem('user_goals');
    if (savedGoals) {
      this.goals = JSON.parse(savedGoals);
    } else {
      this.goals = [
        { id: '1', title: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 3500, icon: '🛡️' },
        { id: '2', title: 'Viagem de Fim de Ano', targetAmount: 5000, currentAmount: 1200, icon: '✈️' }
      ];
      this.saveGoals();
    }
  }

  saveGoals(): void {
    localStorage.setItem('user_goals', JSON.stringify(this.goals));
  }

  // Abre modal para CRIAR
  openCreateModal(): void {
    this.isEditing = false;
    this.goalIdToEdit = null;
    this.newGoalTitle = '';
    this.newGoalTarget = 0;
    this.newGoalIcon = '🎯';
    this.showGoalModal = true;
  }

  // Abre modal para EDITAR
  openEditModal(goal: Goal): void {
    this.isEditing = true;
    this.goalIdToEdit = goal.id;
    this.newGoalTitle = goal.title;
    this.newGoalTarget = goal.targetAmount;
    this.newGoalIcon = goal.icon;
    this.showGoalModal = true;
  }

  // Salva (Criação ou Edição)
  onSaveGoal(): void {
    if (!this.newGoalTitle.trim() || this.newGoalTarget <= 0) {
      alert('Preencha o título e um valor alvo válido.');
      return;
    }

    if (this.isEditing && this.goalIdToEdit) {
      // Atualiza meta existente
      const index = this.goals.findIndex(g => g.id === this.goalIdToEdit);
      if (index !== -1) {
        this.goals[index].title = this.newGoalTitle;
        this.goals[index].targetAmount = this.newGoalTarget;
        this.goals[index].icon = this.newGoalIcon;
      }
    } else {
      // Cria nova meta
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: this.newGoalTitle,
        targetAmount: this.newGoalTarget,
        currentAmount: 0,
        icon: this.newGoalIcon || '🎯'
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
}