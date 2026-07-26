import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);
  @Input() user: any = null;
  @Input() isCollapsed = true;
  @Output() toggleRequest = new EventEmitter<void>();
  isAdmin = false;
  ngOnInit(): void {
    const localUser = this.authService.getUser();
    this.isAdmin = this.user?.role === 'admin' || localUser?.role === 'admin';
  }
  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}