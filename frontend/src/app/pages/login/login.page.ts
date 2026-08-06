import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage implements OnDestroy {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

  // Controle de Verificação de E-mail
  isAwaitingCode: boolean = false;
  pendingEmail: string = '';
  verificationCode: string = '';

  // Controle de Esqueci a Senha (NOVO)
  isForgotPassword: boolean = false;

  // Temporizador de 10 minutos (600 segundos)
  timeLeft: number = 600; 
  timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  get f() { return this.loginForm.controls; }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get formattedTimer(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  startTimer(): void {
    this.stopTimer();
    this.timeLeft = 600; 
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.stopTimer();
        this.errorMessage = 'O tempo limite de 10 minutos expirou. Faça login novamente para solicitar um novo código.';
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res: any) => {
        if (res.user && res.user.isVerified === false) {
          this.loading = false;
          this.pendingEmail = email;
          this.isAwaitingCode = true;
          this.startTimer();
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      }
    });
  }

  onVerifyCode(): void {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.errorMessage = 'Digite o código completo de 6 dígitos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.verifyEmail(this.pendingEmail, this.verificationCode).subscribe({
      next: () => {
        this.stopTimer();
        this.loading = false;
        alert('E-mail verificado com sucesso! Entrando no sistema...');
        
        const { password } = this.loginForm.value;
        this.authService.login(this.pendingEmail, password).subscribe(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Código incorreto ou expirado.';
      }
    });
  }

  cancelVerification(): void {
    this.stopTimer();
    this.isAwaitingCode = false;
    this.verificationCode = '';
    this.errorMessage = '';
  }

  // ==========================================
  // NOVOS MÉTODOS PARA RECUPERAÇÃO DE SENHA
  // ==========================================
  
  toggleForgotPassword(): void {
    this.isForgotPassword = !this.isForgotPassword;
    this.errorMessage = '';
  }

  onRecoverPassword(): void {
    const email = this.loginForm.get('email')?.value;

    if (!email || this.loginForm.get('email')?.invalid) {
      this.errorMessage = 'Por favor, digite um e-mail válido no campo abaixo.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Chamada para o seu backend solicitar o link de reset
    // Atenção: Certifique-se de ter criado o método requestPasswordReset() no seu auth.service.ts do frontend!
    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.loading = false;
        alert('Se o e-mail existir, um link de recuperação foi enviado!');
        this.toggleForgotPassword();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Erro ao solicitar recuperação de senha.';
      }
    });
  }
}