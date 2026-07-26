import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { TaskService } from '../../shared/services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  tasks: Task[] = [];
  timeFilter: 'today' | 'week' | 'month' | 'all' = 'all';

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

  get totalTasks(): number {
    return this.tasks.length;
  }

  get todoTasks(): number {
    return this.tasks.filter(t => t.status === 'todo').length;
  }

  get inProgressTasks(): number {
    return this.tasks.filter(t => t.status === 'in-progress').length;
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

  get filteredChartTasks(): Task[] {
    if (this.timeFilter === 'all') return this.tasks;
    
    return this.tasks.filter(t => {
      if (!t.dueDate) return false;
      if (this.timeFilter === 'today') {
        return this.isDueToday(t.dueDate);
      }
      if (this.timeFilter === 'week') {
        return this.isDueThisWeek(t.dueDate);
      }
      if (this.timeFilter === 'month') {
        return this.isDueThisMonth(t.dueDate);
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
      completionRate: chartTasks.length > 0 ? Math.round((completed / chartTasks.length) * 100) : 0
    };
  }

  get upcomingTasks(): Task[] {
    return this.tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        // 1. Overdue tasks (sorted by oldest due date first)
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

        // 2. Urgent tasks (within 1-hour deadline)
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

        // 3. In Progress tasks go above To Do tasks
        if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
        if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;

        // 4. Standard sort by due date for same status
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 4);
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

  navigateToTasks(): void {
    this.router.navigate(['/tasks']);
  }
}