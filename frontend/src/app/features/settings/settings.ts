import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { User } from '../../shared/models';
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  user: User | null = null;
  showPasswordModal = false;
  profileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    dateOfBirth: ['']
  });
  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });
  ngOnInit(): void {
    this.loadProfile();
  }
  loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        let formattedDob = '';
        if (user.dateOfBirth) formattedDob = new Date(user.dateOfBirth).toISOString().split('T')[0];
        this.profileForm.patchValue({ name: user.name, dateOfBirth: formattedDob });
      },
      error: (err) => console.error('Error loading profile:', err)
    });
  }
  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.toastService.error('Please fill in all required fields.');
      return;
    }
    const { name, dateOfBirth } = this.profileForm.value;
    this.userService.updateProfile({ name, dateOfBirth }).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Profile updated successfully!');
        if (this.user && res.user) {
          this.user.name = res.user.name;
          this.user.dateOfBirth = res.user.dateOfBirth;
          this.authService.saveUser({ ...this.user, name: res.user.name, dateOfBirth: res.user.dateOfBirth });
        }
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to update profile.')
    });
  }
  openPasswordModal(): void {
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }
  closePasswordModal(): void {
    this.showPasswordModal = false;
  }
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.toastService.error('Password confirmation does not match!');
      return;
    }
    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Password changed successfully!');
        this.closePasswordModal();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Incorrect current password.')
    });
  }
}
