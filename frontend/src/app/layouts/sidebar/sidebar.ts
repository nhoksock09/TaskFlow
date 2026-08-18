import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '@core/models';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Drawer } from 'primeng/drawer';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, ButtonModule, TranslatePipe, Drawer],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})

export class Sidebar {
  private authService = inject(AuthService);
  @Input() user: User | null = null;
  @Input() isCollapsed = true;
  @Output() toggleRequest = new EventEmitter<void>();

  menuItems = [
    { route: '/dashboard', label: 'SIDEBAR.DASHBOARD', icon: 'pi pi-th-large' },
    { route: '/tasks', label: 'SIDEBAR.TASKS', icon: 'pi pi-check-square' },
    { route: '/settings', label: 'SIDEBAR.SETTINGS', icon: 'pi pi-cog' },
    { route: '/connections', label: 'SIDEBAR.CONNECTIONS', icon: 'pi pi-user-plus' },
    { route: '/users', label: 'SIDEBAR.USERS', icon: 'pi pi-user-edit', adminOnly: true }
  ];

  get isAdmin(): boolean {
    const localUser = this.authService.getUser();
    return this.user?.role === 'admin' || localUser?.role === 'admin';
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
