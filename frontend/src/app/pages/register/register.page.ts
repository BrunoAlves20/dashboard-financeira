import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // <-- Importações para o Formulário
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule], // <-- Adicione o ReactiveFormsModule aqui
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  registerForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

  togglePasswordVisibility(): void {
  this.showPassword = !this.showPassword;
  }
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Definindo os campos e as regras de validação
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      // Senha precisa de: mínimo 6 caracteres, pelo menos 1 letra e 1 número
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Retorna o texto da senha com base no tamanho
  getPasswordStrengthText(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (!password || password.length < 6) return 'Senha Fraca';
    if (password.length >= 6 && password.length < 8) return 'Senha Média';
    return 'Senha Forte';
  }

  // Retorna a largura da barra de progresso (em porcentagem)
  getPasswordStrengthWidth(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (!password) return 'w-0';
    if (password.length < 6) return 'w-1/3 bg-red-500';
    if (password.length >= 6 && password.length < 8) return 'w-2/3 bg-amber-500';
    return 'w-full bg-emerald-500';
  }
  // Atalho fácil para checar os erros no HTML
  get f() { return this.registerForm.controls; }

  // Função auxiliar para verificar se a senha atende ao padrão forte
  isPasswordStrong(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return hasLetterAndNumber.test(password);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { name, email, password } = this.registerForm.value;

    this.authService.register(name, email, password).subscribe({
      next: () => {
        // Cadastro feito com sucesso! Redireciona para o login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Erro ao criar conta. Tente novamente.';
      }
    });
  }
}