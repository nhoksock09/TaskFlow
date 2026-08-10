export interface ProfileFormModel {
  name: string;
  dateOfBirth: Date | string;
}

export interface PasswordFormModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
