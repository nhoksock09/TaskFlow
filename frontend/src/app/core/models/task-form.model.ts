import { Task } from './task.model';

export interface TaskFormModel extends Pick<Task, 'title' | 'priority' | 'status'> {
  description: string;
  dueDate: Date | string;
}

export interface TaskResponse {
  success: boolean;
  data: Task | Task[];
  message?: string;
}
