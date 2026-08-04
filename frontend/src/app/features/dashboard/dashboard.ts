import { Component, inject, OnInit, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../shared/models';
import { UserService } from '../../core/services/user.service';
import { Router } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, Select, Tag, ButtonModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  user: User | null = null;
  tasks: Task[] = [];
  timeFilter: 'today' | 'last-month' | 'month' | 'next-month' = 'today';
  timeFilterOptions: any[] = [];

  readonly TASK_STATUS_MAP = TASK_STATUS_MAP;
  readonly TASK_PRIORITY_MAP = TASK_PRIORITY_MAP;

  showLoginAlert = false;
  alertOverdueTasks: Task[] = [];
  alertUpcomingTasks: Task[] = [];

  translateFilters() {
    this.translateService.get([
      'DASHBOARD.FILTERS.TODAY',
      'DASHBOARD.FILTERS.THIS_MONTH',
      'DASHBOARD.FILTERS.LAST_MONTH',
      'DASHBOARD.FILTERS.NEXT_MONTH'
    ]).subscribe(translations => {
      this.timeFilterOptions = [
        { label: translations['DASHBOARD.FILTERS.TODAY'], value: 'today' },
        { label: translations['DASHBOARD.FILTERS.THIS_MONTH'], value: 'month' },
        { label: translations['DASHBOARD.FILTERS.LAST_MONTH'], value: 'last-month' },
        { label: translations['DASHBOARD.FILTERS.NEXT_MONTH'], value: 'next-month' }
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
          this.checkLoginAlerts(response.data);
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error loading tasks:', err)
    });
  }

  get totalTasks(): number {
    return this.tasks.length;
  }

  get todoTasks(): number {
    return this.tasks.filter(t => t.status === 'todo' && !this.isOverdue(t)).length;
  }

  get inProgressTasks(): number {
    return this.tasks.filter(t => t.status === 'in-progress' && !this.isOverdue(t)).length;
  }

  get completedTasks(): number {
    return this.tasks.filter(t => t.status === 'completed').length;
  }

  get overdueTasks(): number {
    return this.tasks.filter(t => this.isOverdue(t)).length;
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

  isDueTomorrow(dueDateString: string): boolean {
    if (!dueDateString) return false;
    const due = new Date(dueDateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return due.getFullYear() === tomorrow.getFullYear() &&
           due.getMonth() === tomorrow.getMonth() &&
           due.getDate() === tomorrow.getDate();
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

  /* Legacy dropdown toggle methods removed - migrated to PrimeNG Select */

  get filteredChartTasks(): Task[] {
    return this.tasks.filter(t => {
      if (!t.dueDate) return false;
      if (this.timeFilter === 'today') {
        return this.isDueToday(t.dueDate);
      }
      if (this.timeFilter === 'month') {
        return this.isDueThisMonth(t.dueDate);
      }
      if (this.timeFilter === 'last-month') {
        return this.isDueLastMonth(t.dueDate);
      }
      if (this.timeFilter === 'next-month') {
        return this.isDueNextMonth(t.dueDate);
      }
      return true;
    });
  }

  get statusDistribution() {
    const chartTasks = this.filteredChartTasks;
    const total = chartTasks.length || 1;
    const overdue = chartTasks.filter(t => this.isOverdue(t)).length;
    const completed = chartTasks.filter(t => t.status === 'completed').length;
    const progress = chartTasks.filter(t => t.status === 'in-progress' && !this.isOverdue(t)).length;
    const todo = chartTasks.filter(t => t.status === 'todo' && !this.isOverdue(t)).length;

    // Circumference of circle of r=36 is 226.19
    const circumference = 226.19;
    
    const overduePct = chartTasks.length > 0 ? overdue / total : 0;
    const completedPct = chartTasks.length > 0 ? completed / total : 0;
    const progressPct = chartTasks.length > 0 ? progress / total : 0;
    const todoPct = chartTasks.length > 0 ? todo / total : 0;
    
    // 1. Overdue is drawn first (Red)
    const overdueDashArray = `${overduePct * circumference} ${circumference}`;
    const overdueDashOffset = 0;

    // 2. Completed is drawn next (Green)
    const completedDashArray = `${completedPct * circumference} ${circumference}`;
    const completedDashOffset = -(overduePct * circumference);
    
    // 3. Progress is drawn next (Amber)
    const progressDashArray = `${progressPct * circumference} ${circumference}`;
    const progressDashOffset = -((overduePct + completedPct) * circumference);
    
    // 4. Todo is drawn last (Blue)
    const todoDashArray = `${todoPct * circumference} ${circumference}`;
    const todoDashOffset = -((overduePct + completedPct + progressPct) * circumference);

    return {
      todo: { count: todo, percent: Math.round(todoPct * 100), dashArray: todoDashArray, dashOffset: todoDashOffset },
      progress: { count: progress, percent: Math.round(progressPct * 100), dashArray: progressDashArray, dashOffset: progressDashOffset },
      completed: { count: completed, percent: Math.round(completedPct * 100), dashArray: completedDashArray, dashOffset: completedDashOffset },
      overdue: { count: overdue, percent: Math.round(overduePct * 100), dashArray: overdueDashArray, dashOffset: overdueDashOffset },
      completionRate: chartTasks.length > 0 ? Math.round((completed / chartTasks.length) * 100) : 0,
      totalTasks: chartTasks.length
    };
  }

  get groupedUpcomingTasks() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const getGroupType = (dueDateString: string): { name: string; order: number; class: string } | null => {
      if (!dueDateString) return null;
      const due = new Date(dueDateString);
      if (due.getTime() < startOfToday.getTime()) {
        return { name: 'Overdue', order: 0, class: 'overdue-group' };
      }
      if (due.getTime() >= startOfToday.getTime() && due.getTime() <= endOfToday.getTime()) {
        return { name: 'Today', order: 1, class: 'today-group' };
      }
      if (due.getTime() >= startOfTomorrow.getTime() && due.getTime() <= endOfTomorrow.getTime()) {
        return { name: 'Tomorrow', order: 2, class: 'tomorrow-group' };
      }
      return null; // Skip "Upcoming" entirely
    };

    const priorityWeight = { high: 3, medium: 2, low: 1 };
    
    // Group structures mapping
    const groupsMap = new Map<string, { title: string; class: string; order: number; tasks: Task[] }>();
    
    // Get all uncompleted tasks with due dates
    const uncompletedTasks = this.tasks.filter(t => t.status !== 'completed' && t.dueDate);

    // Initial grouping
    uncompletedTasks.forEach(task => {
      const group = getGroupType(task.dueDate);
      if (!group) return; // Skip if null (Upcoming)
      if (!groupsMap.has(group.name)) {
        groupsMap.set(group.name, {
          title: group.name,
          class: group.class,
          order: group.order,
          tasks: []
        });
      }
      groupsMap.get(group.name)!.tasks.push(task);
    });

    // For each group, sort tasks by Priority first, then by Due Time ascending, then cap at 4 tasks
    groupsMap.forEach(group => {
      group.tasks.sort((a, b) => {
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pA !== pB) {
          return pB - pA; // High priority first
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // Chronological second
      });
      // Cap at maximum 4 tasks per group independently
      group.tasks = group.tasks.slice(0, 4);
    });

    // Return non-empty groups sorted chronologically by group order
    return Array.from(groupsMap.values())
      .filter(group => group.tasks.length > 0)
      .sort((a, b) => a.order - b.order);
  }

  get upcomingTasks(): Task[] {
    // Keep as fallback for other uses, sorted by priority first then due date
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return this.tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pA !== pB) return pB - pA;
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 6);
  }

  checkLoginAlerts(tasks: Task[]) {
    if (sessionStorage.getItem('hasShownLoginAlert') === 'true') {
      return;
    }

    const now = new Date();
    const nowTime = now.getTime();
    const next24HoursTime = nowTime + 24 * 60 * 60 * 1000;

    // Overdue tasks: dueDate < currentTime
    this.alertOverdueTasks = tasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      return new Date(t.dueDate).getTime() < nowTime;
    });

    // Impending deadlines: currentTime <= dueDate <= next 24 hours
    this.alertUpcomingTasks = tasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const dueTime = new Date(t.dueDate).getTime();
      return dueTime >= nowTime && dueTime <= next24HoursTime;
    });

    // Sort both lists strictly chronologically (dueDate ascending)
    const sortByDueDateAsc = (a: Task, b: Task) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    };
    this.alertOverdueTasks.sort(sortByDueDateAsc);
    this.alertUpcomingTasks.sort(sortByDueDateAsc);

    if (this.alertOverdueTasks.length > 0 || this.alertUpcomingTasks.length > 0) {
      this.showLoginAlert = true;
    }

    sessionStorage.setItem('hasShownLoginAlert', 'true');
  }

  closeLoginAlert() {
    this.showLoginAlert = false;
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

  navigateToTasks() {
    this.router.navigate(['/tasks']);
  }
}