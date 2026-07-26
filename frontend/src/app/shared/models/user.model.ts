export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
  taskCount?: number;
}

export interface UserResponse {
  success: boolean;
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}