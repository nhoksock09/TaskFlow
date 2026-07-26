import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Toast } from '../../shared/components/toast/toast';
import { UserService } from '../../shared/services/user.service';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    Toast,
    CommonModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit {
  private userService = inject(UserService);
  public router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  user: any = null;
  currentDate: string = '';
  isDarkMode: boolean = false;
  isSidebarCollapsed: boolean = true;
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.cdr.detectChanges();
  }
  ngOnInit(): void {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
    this.user = this.authService.getUser();
    this.cdr.detectChanges();
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.authService.saveUser(user);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
    this.updateDate();
  }

  updateDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    this.currentDate = now.toLocaleDateString('en-US', options);
    this.cdr.detectChanges();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
  isDashboard(): boolean {
    return this.router.url === '/dashboard';
  }
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }
  applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme', 'dark');
    }
  }
}