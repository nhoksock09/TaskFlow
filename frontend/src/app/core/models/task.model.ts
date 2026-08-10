export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TaskFilterStatus {
  ALL = 'all',
  OVERDUE = 'overdue',
  DUE_SOON = 'due-soon'
}

import { BaseDocument } from './common.model';

export interface Task extends BaseDocument {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  userId?: string;
  completedAt?: string;
}
