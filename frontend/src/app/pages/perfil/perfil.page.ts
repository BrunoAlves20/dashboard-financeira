import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(private authService: AuthService) {}

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
    
    // Atualiza os dados no LocalStorage (e no estado local)
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      user.name = this.userName;
      localStorage.setItem('user', JSON.stringify(user));
    }

    setTimeout(() => {
      this.loading = false;
      this.successMessage = '✅ Perfil atualizado com sucesso!';
      setTimeout(() => this.successMessage = '', 3000);
    }, 500);
  }

  handleLogout(): void {
    this.authService.logout();
  }
}