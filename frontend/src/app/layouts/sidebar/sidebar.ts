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

  get isAdmin(): boolean {
    const localUser = this.authService.getUser();
    return this.user?.role === 'admin' || localUser?.role === 'admin';
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
