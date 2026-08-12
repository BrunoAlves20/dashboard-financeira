import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

// Interfaces para tipar as respostas e requisições (Padrão Sênior)
interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private apiUrl = 'https://financas-bruno-api.duckdns.org';
  // private apiUrl = 'http://98.81.217.35:3000';
  // URL do nosso backend NestJS
  private apiUrl = 'http://localhost:3000';
  // private apiUrl = 'https://dashboard-financeira.onrender.com';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Método auxiliar para pegar os headers com o token de autorização
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 1. Método de Cadastro (Sign Up)
  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, { name, email, password });
  }

  // 2. Método de Login (Sign In)
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        // O operator 'tap' executa um efeito colateral assim que a requisição dá certo
        tap((res) => {
          // Salva o Token JWT no LocalStorage do navegador do usuário
          localStorage.setItem('token', res.access_token);
          // Salva os dados básicos do usuário para usar no Header do Dashboard
          localStorage.setItem('user', JSON.stringify(res.user));
        })
      );
  }

  // 3. Método para pegar o token salvo (útil para os próximos passos)
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 4. Método de Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // 5. Verifica se o usuário está logado
  isLoggedIn(): boolean {
    // Se existir um token no localStorage, consideramos que está logado
    return !!this.getToken();
  }

  // 6. Atualizar Perfil (Novo)
  updateProfile(name: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/me`, { name }, { headers: this.getHeaders() });
  }

  // 7. Deletar Conta (Novo)
  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/me`, { headers: this.getHeaders() });
  }

  // 8. Método para enviar o e-mail e o código de 6 dígitos
  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { email, code });
  }

  // 9. Solicita o envio do e-mail com o link de recuperação
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  // 10. Envia a nova senha junto com o token recebido no link
  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { email, token, newPassword });
  }

}