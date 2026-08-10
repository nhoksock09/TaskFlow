import { BaseDocument } from './common.model';

export interface User extends BaseDocument {
  name: string;
  email: string;
  role: 'user' | 'admin';
  dateOfBirth: string;
  taskCount?: number;
}

export interface UserResponse {
  success: boolean;
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}
