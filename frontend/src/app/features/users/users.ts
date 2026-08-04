import { Component, inject, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../shared/models';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Paginator } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

export interface Column {
  field: string;
  header: string; // Translation key e.g., 'USERS.COL_MEMBER'
  class: string;  // CSS class e.g., 'col-user'
  sortable: boolean;
}

export const USER_ROLE_MAP: Record<string, string> = {
  'admin': 'COMMON.ROLE_ADMIN',
  'user': 'COMMON.ROLE_USER'
};

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, Dialog, ButtonModule, InputText, Paginator, Select, Tag, TableModule, TranslatePipe],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  readonly USER_ROLE_MAP = USER_ROLE_MAP;

  cols: Column[] = [
    { field: 'name', header: 'COMMON.LABEL.MEMBER', class: 'col-user', sortable: true },
    { field: 'email', header: 'COMMON.LABEL.EMAIL', class: 'col-email', sortable: true },
    { field: 'role', header: 'COMMON.LABEL.ROLE', class: 'col-role', sortable: true },
    { field: 'dateOfBirth', header: 'COMMON.LABEL.DOB', class: 'col-dob', sortable: true },
    { field: 'taskCount', header: 'COMMON.LABEL.TOTAL_TASKS', class: 'col-tasks', sortable: true },
    { field: 'actions', header: 'COMMON.LABEL.ACTIONS', class: 'col-actions', sortable: false }
  ];

  users: User[] = [];
  totalUsers = 0;
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  isLoading = false;

  sortField: 'name' | 'email' | 'role' | 'dateOfBirth' | 'taskCount' | '' = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  searchQuery = '';
  appliedSearchQuery = '';

  showPromoteModal = false;
  userToPromote: User | null = null;

  showDeleteModal = false;
  userToDelete: User | null = null;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;

    this.userService.getUsers(
      this.appliedSearchQuery,
      this.currentPage,
      this.pageSize,
      this.sortField || undefined,
      this.sortDirection || undefined
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.totalUsers = res.total || 0;
        this.totalPages = res.totalPages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error('USERS.TOAST.LOAD_FAILED');
        this.isLoading = false;
      }
    });
  }

  toggleColumnSort(field: string) {
    const validFields = ['name', 'email', 'role', 'dateOfBirth', 'taskCount'];
    if (!validFields.includes(field)) return;
    const typedField = field as 'name' | 'email' | 'role' | 'dateOfBirth' | 'taskCount';
    if (this.sortField === typedField) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortField = '';
        this.sortDirection = '';
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortField = typedField;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadUsers();
  }

  onSearch() {
    this.appliedSearchQuery = this.searchQuery.trim();
    this.currentPage = 1;
    this.loadUsers();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  onUserPageChange(event: any) {
    this.currentPage = event.page + 1; // event.page is 0-based
    this.pageSize = event.rows;
    this.loadUsers();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadUsers();
  }

  get pages(): number[] {
    const pagesArr: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pagesArr.push(i);
    return pagesArr;
  }

  openPromoteModal(user: User) {
    if (user.role === 'admin') {
      this.toastService.error('USERS.TOAST.DEMOTE_ADMIN_ERROR');
      return;
    }
    this.userToPromote = user;
    this.showPromoteModal = true;
  }

  closePromoteModal() {
    this.showPromoteModal = false;
    this.userToPromote = null;
  }

  confirmPromote() {
    if (!this.userToPromote || (!this.userToPromote._id && !this.userToPromote.id)) return;
    const userId = this.userToPromote._id || this.userToPromote.id!;
    this.userService.updateUserRole(userId, 'admin')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        this.toastService.show('USERS.TOAST.PROMOTE_SUCCESS', 'success', { name: this.userToPromote?.name });
        this.closePromoteModal();
        this.loadUsers();
      },
      error: (err) => this.toastService.error('USERS.TOAST.PROMOTE_FAILED')
    });
  }

  openDeleteModal(user: User) {
    if (user.role === 'admin') {
      this.toastService.error('USERS.TOAST.DELETE_ADMIN_ERROR');
      return;
    }
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (!this.userToDelete || (!this.userToDelete._id && !this.userToDelete.id)) return;
    const userId = this.userToDelete._id || this.userToDelete.id!;
    this.userService.deleteUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        this.toastService.show('USERS.TOAST.DELETE_SUCCESS', 'success', { name: this.userToDelete?.name });
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (err) => this.toastService.error('USERS.TOAST.DELETE_FAILED')
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