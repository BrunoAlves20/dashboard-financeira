import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  // URL do nosso backend NestJS
  private apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

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
}