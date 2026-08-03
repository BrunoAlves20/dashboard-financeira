import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss'
})
export class PerfilPage implements OnInit {
  userName: string = '';
  userEmail: string = '';
  loading: boolean = false;
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.userName = user.name || '';
      this.userEmail = user.email || '';
    }
  }

  onSaveProfile(): void {
    if (!this.userName.trim()) {
      alert('O nome não pode ficar em branco.');
      return;
    }

    this.loading = true;
    
    // Envia o novo nome para o backend
    this.authService.updateProfile(this.userName).subscribe({
      next: (updatedUser) => {
        this.loading = false;
        
        // Atualiza o LocalStorage com o nome novo
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          user.name = updatedUser.name;
          localStorage.setItem('user', JSON.stringify(user));
        }

        this.successMessage = '✅ Perfil atualizado com sucesso!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.loading = false;
        alert('Erro ao atualizar perfil.');
        console.error(err);
      }
    });
  }

  onDeleteAccount(): void {
    const confirmDelete = confirm(
      '⚠️ ATENÇÃO! Tem certeza que deseja excluir sua conta?\n\n' +
      'Esta ação é irreversível e apagará TODAS as suas transações, categorias e dados pessoais permanentemente.'
    );

    if (confirmDelete) {
      this.authService.deleteAccount().subscribe({
        next: () => {
          alert('Sua conta foi excluída com sucesso. Sentiremos sua falta!');
          this.authService.logout();
        },
        error: (err) => {
          alert('Ocorreu um erro ao tentar excluir a conta.');
          console.error(err);
        }
      });
    }
  }

  handleLogout(): void {
    this.authService.logout();
  }
}