import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { User, SelectOption } from '@core/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

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
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  user: User | null = null;
  currentDate: string = '';
  isDarkMode: boolean = false;
  isSidebarCollapsed: boolean = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  currentLang: string = 'en';
  langOptions: SelectOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Tiếng Việt', value: 'vi' }
  ];

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
    }
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
      error: () => this.toastService.error('SETTINGS.TOAST.LOAD_FAILED')
    });

    this.currentLang = this.translateService.currentLang() || localStorage.getItem('lang') || 'en';
    this.updateDate();

    // Subscribe to lang changes to keep date format in sync
    this.translateService.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.updateDate();
    });

    // Auto-close sidebar on router navigation on mobile screens
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.closeSidebarOnMobile();
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
