import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { authGuard } from './guards/auth.guard';
import { ExtratoPage } from './pages/extrato/extrato.page';
import { GraficosPage } from './pages/graficos/graficos.page';
import { PerfilPage } from './pages/perfil/perfil.page';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard] 
  },
  { 
    path: 'extrato', 
    loadComponent: () => import('./pages/extrato/extrato.page').then(m => m.ExtratoPage),
    canActivate: [authGuard] 
  },
  { 
    path: 'graficos', 
    loadComponent: () => import('./pages/graficos/graficos.page').then(m => m.GraficosPage),
    canActivate: [authGuard] 
  },
  { 
    path: 'metas', 
    loadComponent: () => import('./pages/metas/metas.page').then(m => m.MetasPage),
    canActivate: [authGuard] 
  },
  { 
    path: 'perfil', 
    loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage),
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: '' }
];