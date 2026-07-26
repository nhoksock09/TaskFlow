import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { User } from '../../shared/models';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  users: User[] = [];
  currentUser: User | null = null;
  searchQuery: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  totalUsers: number = 0;
  totalPages: number = 1;
  isLoading: boolean = false;
  userToPromote: User | null = null;
  userToDelete: User | null = null;
  showPromoteModal = false;
  showDeleteModal = false;
  sortDirection: 'asc' | 'desc' | '' = '';

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    this.loadUsers();
  }
  loadUsers(): void {
    this.isLoading = true;
    const sortField = this.sortDirection ? 'name' : undefined;
    const sortOrd = this.sortDirection || undefined;
    this.userService.getUsers(this.searchQuery, this.currentPage, this.pageSize, sortField, sortOrd).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.users = res.data;
          this.totalUsers = res.total;
          this.totalPages = res.totalPages;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading users:', err);
        this.toastService.error(err.error?.message || 'Failed to load user list.');
        this.cdr.detectChanges();
      }
    });
  }

  toggleSort(): void {
    if (this.sortDirection === '') {
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = '';
    }
    this.currentPage = 1;
    this.loadUsers();
  }
  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUsers();
    }
  }
  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadUsers();
  }
  get pages(): number[] {
    const pagesArr: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pagesArr.push(i);
    return pagesArr;
  }
  openPromoteModal(user: User): void {
    if (user.role === 'admin') {
      this.toastService.error("Cannot demote another Admin's role.");
      return;
    }
    this.userToPromote = user;
    this.showPromoteModal = true;
    this.cdr.detectChanges();
  }
  closePromoteModal(): void {
    this.showPromoteModal = false;
    this.userToPromote = null;
    this.cdr.detectChanges();
  }
  confirmPromote(): void {
    if (!this.userToPromote || (!this.userToPromote._id && !this.userToPromote.id)) return;
    const userId = this.userToPromote._id || this.userToPromote.id!;
    this.userService.updateUserRole(userId, 'admin').subscribe({
      next: (res) => {
        this.toastService.success(res.message || `Promoted ${this.userToPromote?.name} to Admin successfully.`);
        this.closePromoteModal();
        this.loadUsers();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to promote user.')
    });
  }
  openDeleteModal(user: User): void {
    if (user.role === 'admin') {
      this.toastService.error('Cannot delete an Admin account.');
      return;
    }
    this.userToDelete = user;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.cdr.detectChanges();
  }
  confirmDelete(): void {
    if (!this.userToDelete || (!this.userToDelete._id && !this.userToDelete.id)) return;
    const userId = this.userToDelete._id || this.userToDelete.id!;
    this.userService.deleteUser(userId).subscribe({
      next: (res) => {
        this.toastService.success(res.message || `Deleted account ${this.userToDelete?.name} successfully.`);
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to delete user.')
    });
  }
  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
  getAvatarBg(name: string): string {
    const colors = ['#3b82f6', '#10b981', '#6366f1', '#ec4899', '#f59e0b', '#8b5cf6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
  formatDate(dateStr?: string): string {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--/--/----';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }
}
