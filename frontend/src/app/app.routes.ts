import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { authGuard } from './guards/auth.guard';
import { ExtratoPage } from './pages/extrato/extrato.page';
import { GraficosPage } from './pages/graficos/graficos.page';
import { PerfilPage } from './pages/perfil/perfil.page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
  { path: 'extrato', component: ExtratoPage, canActivate: [authGuard] },
  { path: 'graficos', component: GraficosPage, canActivate: [authGuard] },
  { path: 'perfil', component: PerfilPage, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];