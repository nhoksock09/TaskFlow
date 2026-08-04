import { Component, inject, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../shared/models';
import { UserService } from '../../core/services/user.service';
import { TaskService } from '../../core/services/task.service';
import { FormGroup, ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { Tag } from 'primeng/tag';
import { Badge } from 'primeng/badge';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ScrollArea, ScrollAreaContent, ScrollAreaScrollbar, ScrollAreaHandle } from '../../shared/components/scrollarea/scrollarea';

export const TASK_STATUS_MAP: Record<string, string> = {
  'todo': 'TASKS.STATUS.TODO',
  'in-progress': 'TASKS.STATUS.IN_PROGRESS',
  'completed': 'TASKS.STATUS.COMPLETED'
};

export const TASK_PRIORITY_MAP: Record<string, string> = {
  'high': 'TASKS.FILTERS.HIGH',
  'medium': 'TASKS.FILTERS.MEDIUM',
  'low': 'TASKS.FILTERS.LOW'
};


export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskTimeframe = 'all' | 'today' | 'last-month' | 'month' | 'next-month';
export type TaskUrgencyFilter = 'all' | 'overdue' | 'due-soon';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface TaskFormModel {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: Date | string | null;
  status: TaskStatus;
}

export interface PaginatorState {
  page?: number;
  first?: number;
  rows?: number;
  pageCount?: number;
}

interface Task {
  _id?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  createdAt?: string;
  completedAt?: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    Select,
    ButtonModule,
    InputText,
    DragDropModule,
    FormlyModule,
    FormlyPrimeNGModule,
    ScrollArea,
    ScrollAreaContent,
    ScrollAreaScrollbar,
    ScrollAreaHandle,
    Tag,
    Badge,
    TranslatePipe
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss'
})
export class Tasks implements OnInit {
  private userService = inject(UserService);
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private translateService = inject(TranslateService);

  readonly TASK_STATUS_MAP = TASK_STATUS_MAP;
  readonly TASK_PRIORITY_MAP = TASK_PRIORITY_MAP;

  user: User | null = null;
  minDate: Date = new Date();
  maxDate: Date = new Date();
  priorityOptions: SelectOption<TaskPriority>[] = [
    { label: 'TASKS.FILTERS.HIGH', value: 'high' },
    { label: 'TASKS.FILTERS.MEDIUM', value: 'medium' },
    { label: 'TASKS.FILTERS.LOW', value: 'low' }
  ];
  statusOptions: SelectOption<TaskStatus>[] = [
    { label: 'TASKS.STATUS.TODO', value: 'todo' },
    { label: 'TASKS.STATUS.IN_PROGRESS', value: 'in-progress' },
    { label: 'TASKS.STATUS.COMPLETED', value: 'completed' }
  ];

  // ── Formly task form ───────────────────────────────────────────────────────
  taskForm = new FormGroup({});
  taskModel: TaskFormModel = { title: '', description: '', priority: 'medium', dueDate: null, status: 'todo' };
  taskFields: FormlyFieldConfig[] = [
    {
      key: 'title',
      type: 'input',
      wrappers: ['custom-form-field'],
      props: { label: 'TASKS.FORM.TITLE_LABEL', placeholder: 'TASKS.FORM.TITLE_PLACEHOLDER', required: true }
    },
    {
      key: 'description',
      type: 'textarea',
      wrappers: ['custom-form-field'],
      props: { label: 'TASKS.FORM.DESC_LABEL', placeholder: 'TASKS.FORM.DESC_PLACEHOLDER', rows: 3 }
    },
    {
      key: 'priority',
      type: 'select',
      wrappers: ['custom-form-field'],
      props: {
        label: 'TASKS.FORM.PRIORITY_LABEL',
        required: true,
        showClear: false,
        options: [
          { label: 'TASKS.FILTERS.HIGH', value: 'high' },
          { label: 'TASKS.FILTERS.MEDIUM', value: 'medium' },
          { label: 'TASKS.FILTERS.LOW', value: 'low' }
        ]
      }
    },
    {
      key: 'dueDate',
      type: 'datepicker',
      wrappers: ['custom-form-field'],
      props: {
        label: 'TASKS.FORM.DUE_DATE_LABEL',
        required: true,
        showTime: true,
        hourFormat: '24',
        appendTo: 'body'
      },
      validators: {
        pastDate: {
          expression: (c: AbstractControl) => {
            if (!c.value) return true;
            return new Date(c.value).getTime() >= new Date().getTime() - 60000;
          },
          message: () => this.translateService.stream('VALIDATION.PAST_DATE')
        },
        tooFarFuture: {
          expression: (c: AbstractControl) => {
            if (!c.value) return true;
            const sixMonths = new Date();
            sixMonths.setMonth(sixMonths.getMonth() + 6);
            return new Date(c.value).getTime() <= sixMonths.getTime();
          },
          message: () => this.translateService.stream('VALIDATION.TOO_FAR_FUTURE')
        }
      }
    }
  ];
  taskStatusField: FormlyFieldConfig = {
    key: 'status',
    type: 'select',
    wrappers: ['custom-form-field'],
    props: {
      label: 'TASKS.FORM.STATUS_LABEL',
      required: true,
      showClear: false,
      options: [
        { label: 'TASKS.STATUS.TODO', value: 'todo' },
        { label: 'TASKS.STATUS.IN_PROGRESS', value: 'in-progress' },
        { label: 'TASKS.STATUS.COMPLETED', value: 'completed' }
      ]
    }
  };
  tasks: Task[] = [];
  /** Raw value bound to the input — not used for filtering until Enter is pressed */
  searchQuery: string = '';
  /** Committed value actually used by allFilteredTasks — only updated on Enter */
  appliedSearchQuery: string = '';
  activeFilter: TaskPriority | 'all' = 'all';
  activeStatusFilter: TaskUrgencyFilter = 'all';
  activeTimeframeFilter: TaskTimeframe = 'all';
  priorityFilterOptions: SelectOption<TaskPriority | 'all'>[] = [];
  statusFilterOptions: SelectOption<TaskUrgencyFilter>[] = [];
  timeframeOptions: SelectOption<TaskTimeframe>[] = [];
  editingTaskId: string | null = null;
  taskToDelete: Task | null = null;
  showDeleteModal: boolean = false;
  showAddEditModal: boolean = false;

  taskPage: number = 1;
  taskPageSize: number = 5;

  onTaskPageChange(event: PaginatorState) {
    if (event.page !== undefined) {
      this.taskPage = event.page + 1; // event.page is 0-based
    }
    if (event.rows !== undefined) {
      this.taskPageSize = event.rows;
    }
  }

  getTasksByStatus(status: 'todo' | 'in-progress' | 'completed'): Task[] {
    return this.allFilteredTasks.filter(t => t.status === status);
  }

  getTasksCountByStatus(status: 'todo' | 'in-progress' | 'completed'): number {
    return this.getTasksByStatus(status).length;
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      // Reordering items in the same column
    } else {
      const task = event.item.data as Task;
      const newStatus = event.container.id as 'todo' | 'in-progress' | 'completed';
      
      this.taskService.updateTask(task._id!, { status: newStatus })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: (response) => {
          if (response.success) {
            const localizedStatus = this.translateService.instant(TASK_STATUS_MAP[newStatus] || newStatus);
            this.toastService.show('TASKS.TOAST.MOVE_SUCCESS', 'success', { status: localizedStatus });
            this.loadTasks();
          }
        },
        error: (err) => this.toastService.error('TASKS.TOAST.MOVE_FAILED')
      });
    }
  }

  openAddModal(defaultStatus?: 'todo' | 'in-progress' | 'completed') {
    this.resetForm();
    this.minDate = new Date();
    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    this.maxDate = max;
    this.taskModel = { title: '', description: '', priority: 'medium', dueDate: null, status: defaultStatus || 'todo' };
    // Only show status field when editing
    this.taskFields = this.taskFields.filter(f => f.key !== 'status');
    this.showAddEditModal = true;
  }

  closeAddEditModal() {
    this.showAddEditModal = false;
    this.resetForm();
  }

  getFormattedDateForInput(dateVal: string | Date | null | undefined): string {
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

  isDueSoon(task: Task): boolean {
    if (task.status === 'completed' || !task.dueDate) return false;
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const diff = due - now;
    // Due in less than 24 hours but not overdue
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  }

  isDueToday(dueDateString: string): boolean {
    if (!dueDateString) return false;
    const due = new Date(dueDateString);
    const today = new Date();
    return due.getFullYear() === today.getFullYear() &&
           due.getMonth() === today.getMonth() &&
           due.getDate() === today.getDate();
  }

  isDueThisWeek(dueDateString: string): boolean {
    if (!dueDateString) return false;
    const due = new Date(dueDateString);
    const now = new Date();
    
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);  
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const dueTime = due.getTime();
    return dueTime >= startOfWeek.getTime() && dueTime <= endOfWeek.getTime();
  }

  isDueLastMonth(dueDateString: string): boolean {
    if (!dueDateString) return false;
    const due = new Date(dueDateString);
    const today = new Date();
    
    let lastMonthYear = today.getFullYear();
    let lastMonthVal = today.getMonth() - 1;
    if (lastMonthVal < 0) {
      lastMonthVal = 11;
      lastMonthYear--;
    }
    return due.getFullYear() === lastMonthYear && due.getMonth() === lastMonthVal;
  }

  isDueThisMonth(dueDateString: string): boolean {
    if (!dueDateString) return false;
    const due = new Date(dueDateString);
    const today = new Date();
    return due.getFullYear() === today.getFullYear() &&
           due.getMonth() === today.getMonth();
  }

  isDueNextMonth(dueDateString: string): boolean {
    if (!dueDateString) return false;
    const due = new Date(dueDateString);
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0, 23, 59, 59, 999);
    
    const dueTime = due.getTime();
    return dueTime >= nextMonth.getTime() && dueTime <= endOfNextMonth.getTime();
  }

  filterTasks() {
    this.taskPage = 1;
  }

  getDueSoonTime(task: Task): string {
    if (!task.dueDate) return '';
    const now = new Date().getTime();
    const due = new Date(task.dueDate).getTime();
    const diff = due - now;
    if (diff <= 0) return '';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `Due in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `Due in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  }

  translateFilters() {
    this.translateService.get([
      'TASKS.FILTERS.ALL_PRIORITIES',
      'TASKS.FILTERS.HIGH',
      'TASKS.FILTERS.MEDIUM',
      'TASKS.FILTERS.LOW',
      'TASKS.FILTERS.ALL_STATUS',
      'TASKS.FILTERS.OVERDUE',
      'TASKS.FILTERS.DUE_SOON',
      'TASKS.FILTERS.ALL_TIME',
      'TASKS.FILTERS.TODAY',
      'TASKS.FILTERS.THIS_MONTH',
      'TASKS.FILTERS.LAST_MONTH',
      'TASKS.FILTERS.NEXT_MONTH'
    ]).subscribe(translations => {
      this.priorityFilterOptions = [
        { label: translations['TASKS.FILTERS.ALL_PRIORITIES'], value: 'all' },
        { label: translations['TASKS.FILTERS.HIGH'], value: 'high' },
        { label: translations['TASKS.FILTERS.MEDIUM'], value: 'medium' },
        { label: translations['TASKS.FILTERS.LOW'], value: 'low' }
      ];
      this.statusFilterOptions = [
        { label: translations['TASKS.FILTERS.ALL_STATUS'], value: 'all' },
        { label: translations['TASKS.FILTERS.OVERDUE'], value: 'overdue' },
        { label: translations['TASKS.FILTERS.DUE_SOON'], value: 'due-soon' }
      ];
      this.timeframeOptions = [
        { label: translations['TASKS.FILTERS.ALL_TIME'], value: 'all' },
        { label: translations['TASKS.FILTERS.TODAY'], value: 'today' },
        { label: translations['TASKS.FILTERS.THIS_MONTH'], value: 'month' },
        { label: translations['TASKS.FILTERS.LAST_MONTH'], value: 'last-month' },
        { label: translations['TASKS.FILTERS.NEXT_MONTH'], value: 'next-month' }
      ];
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    this.translateFilters();
    this.translateService.onLangChange.subscribe(() => {
      this.translateFilters();
    });

    this.userService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (err) => console.error(err)
    });
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.tasks = response.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
      }
    });
  }

  /** Triggered only on Enter key press — commits search and resets pagination */
  onSearch() {
    this.appliedSearchQuery = this.searchQuery.trim();
    this.taskPage = 1;
  }

  get allFilteredTasks(): Task[] {
    let filtered = this.tasks;
    if (this.activeStatusFilter === 'overdue') {
      filtered = filtered.filter(task => this.isOverdue(task));
    } else if (this.activeStatusFilter === 'due-soon') {
      filtered = filtered.filter(task => this.isDueSoon(task));
    }
    // Apply committed search query (only updates on Enter key press)
    if (this.appliedSearchQuery) {
      const query = this.appliedSearchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        (task.title?.toLowerCase().includes(query)) ||
        (task.description?.toLowerCase().includes(query))
      );
    }
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === this.activeFilter);
    }
    
    // Apply timeframe filter
    if (this.activeTimeframeFilter !== 'all') {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        if (this.activeTimeframeFilter === 'today') {
          return this.isDueToday(task.dueDate);
        }
        if (this.activeTimeframeFilter === 'last-month') {
          return this.isDueLastMonth(task.dueDate);
        }
        if (this.activeTimeframeFilter === 'month') {
          return this.isDueThisMonth(task.dueDate);
        }
        if (this.activeTimeframeFilter === 'next-month') {
          return this.isDueNextMonth(task.dueDate);
        }
        return true;
      });
    }

    filtered.sort((a, b) => {
      // If timeframe filter is selected, sort strictly chronologically by due date ascending
      if (this.activeTimeframeFilter !== 'all') {
        // 1. Completed tasks must always go to the bottom
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (b.status === 'completed' && a.status !== 'completed') return -1;
        
        // If both are completed, sort by dueDate descending (newest due date first, oldest due date at the bottom)
        if (a.status === 'completed' && b.status === 'completed') {
          const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return timeB - timeA;
        }

        // 2. Sort chronologically by due date ascending for same status group
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      // 1. Completed tasks go to the bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      if (a.status === 'completed' && b.status === 'completed') {
        // Sort by dueDate descending (newest due date first, oldest due date at the bottom)
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return timeB - timeA;
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

  setTaskPage(page: number) {
    if (page >= 1 && page <= this.totalTaskPages) {
      this.taskPage = page;
    }
  }

  onPageSizeChange(newSize: number) {
    this.taskPageSize = newSize;
    this.taskPage = 1;
  }

  addTask() {
    if (this.taskForm.valid) {
      const selectedDate = this.taskModel.dueDate;
      const taskData: Partial<Task> = {
        title: this.taskModel.title,
        description: this.taskModel.description,
        priority: this.taskModel.priority,
        dueDate: selectedDate ? new Date(selectedDate).toISOString() : '',
        status: this.taskModel.status || 'todo'
      };
      if (this.editingTaskId) {
        this.taskService.updateTask(this.editingTaskId, taskData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success('TASKS.TOAST.UPDATE_SUCCESS');
              this.loadTasks();
              this.closeAddEditModal();
            }
          },
          error: (err) => this.toastService.error('TASKS.TOAST.UPDATE_FAILED')
        });
      } else {
        this.taskService.createTask(taskData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success('TASKS.TOAST.CREATE_SUCCESS');
              this.loadTasks();
              this.closeAddEditModal();
            }
          },
          error: (err) => this.toastService.error('TASKS.TOAST.CREATE_FAILED')
        });
      }
    } else {
      this.taskForm.markAllAsTouched();
    }
  }

  editTask(task: Task) {
    this.editingTaskId = task._id || null;
    this.minDate = new Date();
    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    this.maxDate = max;
    this.taskModel = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: new Date(task.dueDate),
      status: task.status
    };
    // Show status field only when editing
    const hasStatus = this.taskFields.some(f => f.key === 'status');
    if (!hasStatus) {
      // Insert status field before dueDate
      const dueDateIdx = this.taskFields.findIndex(f => f.key === 'dueDate');
      this.taskFields = [
        ...this.taskFields.slice(0, dueDateIdx),
        this.taskStatusField,
        ...this.taskFields.slice(dueDateIdx)
      ];
    }
    this.showAddEditModal = true;
  }

  deleteTask(id: string) {
    const task = this.tasks.find(t => t._id === id);
    if (task) {
      this.taskToDelete = task;
      this.showDeleteModal = true;
    }
  }

  confirmDelete() {
    if (this.taskToDelete && this.taskToDelete._id) {
      this.taskService.deleteTask(this.taskToDelete._id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('TASKS.TOAST.DELETE_SUCCESS');
            this.loadTasks();
            this.closeDeleteModal();
          }
        },
        error: (err) => this.toastService.error('TASKS.TOAST.DELETE_FAILED')
      });
    }
  }

  closeDeleteModal() {
    this.taskToDelete = null;
    this.showDeleteModal = false;
  }

  completeTask(task: Task) {
    let nextStatus: 'todo' | 'in-progress' | 'completed';
    if (task.status === 'todo') {
      nextStatus = 'in-progress';
    } else if (task.status === 'in-progress') {
      nextStatus = 'completed';
    } else {
      nextStatus = 'in-progress';
    }
    this.taskService.updateTask(task._id!, { status: nextStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (response) => {
        if (response.success) {
          let msgKey = 'TASKS.TOAST.IN_PROGRESS';
          if (nextStatus === 'completed') msgKey = 'TASKS.TOAST.COMPLETED';
          if (nextStatus === 'in-progress' && task.status === 'completed') msgKey = 'TASKS.TOAST.RESTARTED';
          this.toastService.success(msgKey);
          this.loadTasks();
        }
      },
      error: (err) => this.toastService.error('TASKS.TOAST.MOVE_FAILED')
    });
  }

  resetForm() {
    this.editingTaskId = null;
    this.taskModel = { title: '', description: '', priority: 'medium', dueDate: null, status: 'todo' };
    this.taskForm.reset();
    // Remove status field for add mode
    this.taskFields = this.taskFields.filter(f => f.key !== 'status');
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