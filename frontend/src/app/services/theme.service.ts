import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Usamos BehaviorSubject para que qualquer tela seja notificada da mudança na hora
  public isDarkMode = new BehaviorSubject<boolean>(true); 

  constructor() {
    this.checkTheme();
  }

  checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme !== 'light';
    this.isDarkMode.next(isDark);
    this.applyTheme(isDark);
  }

  toggleTheme() {
    const newTheme = !this.isDarkMode.value;
    this.isDarkMode.next(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    this.applyTheme(newTheme);
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}