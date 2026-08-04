import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { UserService } from '../../core/services/user.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { User } from '../../shared/models';

interface LangOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    CommonModule,
    ButtonModule,
    Select,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit {
  private userService = inject(UserService);
  public router = inject(Router);
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  user: User | null = null;
  currentDate: string = '';
  isDarkMode: boolean = false;
  isSidebarCollapsed: boolean = false;

  currentLang: string = 'en';
  langOptions: LangOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Tiếng Việt', value: 'vi' }
  ];

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  ngOnInit() {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
    this.user = this.authService.getUser();
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.authService.saveUser(user);
      },
      error: (err) => console.error(err)
    });

    this.currentLang = this.translateService.currentLang() || localStorage.getItem('lang') || 'en';
    this.updateDate();

    // Subscribe to lang changes to keep date format in sync
    this.translateService.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.updateDate();
    });
  }

  updateDate() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    const locale = this.currentLang === 'vi' ? 'vi-VN' : 'en-US';
    this.currentDate = now.toLocaleDateString(locale, options);
  }

  onLangChange(lang: string) {
    this.translateService.use(lang);
    localStorage.setItem('lang', lang);
    this.currentLang = lang;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  isDashboard(): boolean {
    return this.router.url === '/dashboard';
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }
  
  applyTheme() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme', 'dark');
    }
  }
}
