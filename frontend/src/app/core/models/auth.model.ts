import { ProfileFormModel } from './settings-form.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends ProfileFormModel, LoginRequest {}
