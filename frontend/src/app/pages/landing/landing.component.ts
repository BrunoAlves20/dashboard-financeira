import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { 
  LucideAngularModule, 
  Bot, 
  BarChart3, 
  Target, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Sun, 
  Moon, 
  Wallet, 
  Layers, 
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LucideAngularModule
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {

  // Definição dos ícones Lucide para utilização no HTML
  readonly Bot = Bot;
  readonly BarChart3 = BarChart3;
  readonly Target = Target;
  readonly ShieldCheck = ShieldCheck;
  readonly Cpu = Cpu;
  readonly ArrowRight = ArrowRight;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Wallet = Wallet;
  readonly Layers = Layers;
  readonly CheckCircle2 = CheckCircle2;
  readonly TrendingUp = TrendingUp;
  readonly Sparkles = Sparkles;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }
}