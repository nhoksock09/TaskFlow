import { User } from './user.model';

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}