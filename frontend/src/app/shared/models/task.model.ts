export interface Task {
  _id?: string;

  title: string;

  description?: string;

  priority: 'low' | 'medium' | 'high';

  status: 'todo' | 'in-progress' | 'done';

  dueDate: string;

  userId?: string;

  createdAt?: string;

  updatedAt?: string;
}