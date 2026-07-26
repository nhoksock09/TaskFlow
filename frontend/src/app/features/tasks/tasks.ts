import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { TaskService } from '../../shared/services/task.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/services/toast.service';

interface Task {
  _id?: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'todo' | 'in-progress' | 'completed';
  createdAt?: string;
  completedAt?: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss'
})
export class Tasks implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const selectedDate = new Date(control.value).getTime();
      const now = new Date().getTime();
      // Allow a 1-minute grace period to prevent false-positives
      if (selectedDate < now - 60000) {
        return { pastDate: true };
      }
      return null;
    };
  }

  user: any = null;
  minDateTime: string = '';
  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['medium'],
    dueDate: ['', [this.futureDateValidator()]]
  });
  tasks: Task[] = [];
  searchQuery: string = '';
  activeFilter: string = 'all';
  activeStatusFilter: 'all' | 'todo' | 'in-progress' | 'completed' | 'overdue' = 'all';
  editingTaskId: string | null = null;
  taskToDelete: Task | null = null;
  showDeleteModal: boolean = false;
  showAddEditModal: boolean = false;

  taskPage: number = 1;
  taskPageSize: number = 5;

  openAddModal(): void {
    this.resetForm();
    this.minDateTime = this.getFormattedDateForInput(new Date());
    this.showAddEditModal = true;
  }

  closeAddEditModal(): void {
    this.showAddEditModal = false;
    this.resetForm();
  }

  getFormattedDateForInput(dateVal: any): string {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  isUrgent(task: Task): boolean {
    if (task.status === 'completed' || !task.dueDate) return false;
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const diff = due - now;
    return diff > 0 && diff <= 3600000;
  }

  isOverdue(task: Task): boolean {
    if (task.status === 'completed' || !task.dueDate) return false;
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    return now > due;
  }

  getOverdueTime(task: Task): string {
    if (!task.dueDate) return '';
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const diff = now - due;
    if (diff <= 0) return '';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (hours > 0) {
      return `Overdue by ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `Overdue by ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  }

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (err) => console.error(err)
    });
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.tasks = response.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error loading tasks:', err)
    });
  }

  setStatusFilter(status: 'all' | 'todo' | 'in-progress' | 'completed' | 'overdue'): void {
    this.activeStatusFilter = status;
    this.taskPage = 1;
  }

  get overdueTasksCount(): number {
    return this.tasks.filter(t => this.isOverdue(t)).length;
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.taskPage = 1;
  }

  get allFilteredTasks(): Task[] {
    let filtered = this.tasks;
    if (this.activeStatusFilter === 'overdue') {
      filtered = filtered.filter(task => this.isOverdue(task));
    } else if (this.activeStatusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === this.activeStatusFilter);
    }
    if (this.searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === this.activeFilter);
    }
    
    filtered.sort((a, b) => {
      // 1. Completed tasks go to the bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      if (a.status === 'completed' && b.status === 'completed') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      // 2. Overdue tasks go to the very top (sorted by oldest due date first)
      const overdueA = this.isOverdue(a);
      const overdueB = this.isOverdue(b);
      if (overdueA && !overdueB) return -1;
      if (!overdueA && overdueB) return 1;
      if (overdueA && overdueB) {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      // 3. Urgent tasks (within 1-hour deadline)
      const urgentA = this.isUrgent(a);
      const urgentB = this.isUrgent(b);
      if (urgentA && !urgentB) return -1;
      if (!urgentA && urgentB) return 1;
      if (urgentA && urgentB) {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      // 4. In Progress tasks go above To Do tasks
      if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
      if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;

      // 5. Standard sort by due date for same status
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    return filtered;
  }

  get filteredTasks(): Task[] {
    return this.paginatedTasks;
  }

  get paginatedTasks(): Task[] {
    const start = (this.taskPage - 1) * this.taskPageSize;
    return this.allFilteredTasks.slice(start, start + this.taskPageSize);
  }

  get totalTaskPages(): number {
    return Math.ceil(this.allFilteredTasks.length / this.taskPageSize) || 1;
  }

  get taskPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalTaskPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  setTaskPage(page: number): void {
    if (page >= 1 && page <= this.totalTaskPages) {
      this.taskPage = page;
    }
  }

  onPageSizeChange(newSize: number): void {
    this.taskPageSize = newSize;
    this.taskPage = 1;
  }

  addTask(): void {
    if (this.taskForm.valid) {
      const taskData: Partial<Task> = {
        title: this.taskForm.value.title,
        description: this.taskForm.value.description,
        priority: this.taskForm.value.priority,
        dueDate: this.taskForm.value.dueDate,
        status: 'todo' as const
      };
      if (this.editingTaskId) {
        this.taskService.updateTask(this.editingTaskId, taskData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success('Task updated successfully! 🎉');
              this.loadTasks();
              this.closeAddEditModal();
            }
          },
          error: (err) => this.toastService.error('Failed to update task.')
        });
      } else {
        this.taskService.createTask(taskData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success('Task created successfully! 🎉');
              this.loadTasks();
              this.closeAddEditModal();
            }
          },
          error: (err) => this.toastService.error('Failed to create task.')
        });
      }
    } else {
      this.taskForm.markAllAsTouched();
    }
  }

  editTask(task: Task): void {
    this.editingTaskId = task._id || null;
    this.minDateTime = this.getFormattedDateForInput(new Date());
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: this.getFormattedDateForInput(task.dueDate)
    });
    this.showAddEditModal = true;
  }

  deleteTask(id: string): void {
    const task = this.tasks.find(t => t._id === id);
    if (task) {
      this.taskToDelete = task;
      this.showDeleteModal = true;
    }
  }

  confirmDelete(): void {
    if (this.taskToDelete && this.taskToDelete._id) {
      this.taskService.deleteTask(this.taskToDelete._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Task deleted successfully! 🗑️');
            this.loadTasks();
            this.closeDeleteModal();
          }
        },
        error: (err) => this.toastService.error('Failed to delete task.')
      });
    }
  }

  closeDeleteModal(): void {
    this.taskToDelete = null;
    this.showDeleteModal = false;
  }

  completeTask(task: Task): void {
    let nextStatus: 'todo' | 'in-progress' | 'completed';
    if (task.status === 'todo') {
      nextStatus = 'in-progress';
    } else if (task.status === 'in-progress') {
      nextStatus = 'completed';
    } else {
      nextStatus = 'in-progress';
    }
    this.taskService.updateTask(task._id!, { status: nextStatus }).subscribe({
      next: (response) => {
        if (response.success) {
          let msg = 'Task is in progress! ⏰';
          if (nextStatus === 'completed') msg = 'Task completed! ✅';
          if (nextStatus === 'in-progress' && task.status === 'completed') msg = 'Task restarted! ⏰';
          this.toastService.success(msg);
          this.loadTasks();
        }
      },
      error: (err) => this.toastService.error('Failed to update task status.')
    });
  }

  resetForm(): void {
    this.editingTaskId = null;
    this.taskForm.reset({ priority: 'medium' });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  }
}
