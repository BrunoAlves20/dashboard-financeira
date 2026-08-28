import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);
  const authService = inject(AuthService);

  let cloned = req;
  if (token) {
    cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Intercepta a resposta do backend
  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se o backend disser que não estamos autorizados (Token expirado/inválido)
      if (error.status === 401) {
        console.warn('Sessão expirada. Redirecionando para o login...');
        authService.logout(); // Limpa o localStorage
        router.navigate(['/login']); // Joga para a tela de login
      }
      return throwError(() => error);
    })
  );
};