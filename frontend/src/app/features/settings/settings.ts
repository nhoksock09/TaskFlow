import { Component, inject, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../shared/models';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { ButtonModule } from 'primeng/button';
import { PASSWORD_REQUIREMENTS } from '../../shared/constants/password-rules';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { fullNameValidator, dobAgeValidator } from '../../shared/validators/form.validators';

export interface ProfileFormModel {
  name: string;
  dateOfBirth: Date | string | null;
}

export interface PasswordFormModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, FormlyPrimeNGModule, ButtonModule, TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private translateService = inject(TranslateService);
  private router = inject(Router);

  user: User | null = null;
  showPasswordModal = false;

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  minDob: string = '';
  maxDob: string = '';

  // ── Profile form ───────────────────────────────────────────────────────────
  profileForm = new FormGroup({});
  profileModel: ProfileFormModel = { name: '', dateOfBirth: '' };
  profileFields: FormlyFieldConfig[] = [];

  // ── Password form ──────────────────────────────────────────────────────────
  passwordForm = new FormGroup({});
  passwordModel: PasswordFormModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordFields: FormlyFieldConfig[] = [
    {
      key: 'currentPassword',
      type: 'input',
      wrappers: ['custom-form-field'],
      props: {
        label: 'COMMON.LABEL.CURRENT_PW',
        placeholder: 'COMMON.PLACEHOLDER.CURRENT_PW',
        required: true,
        type: 'password',
        attributes: { autocomplete: 'current-password' }
      }
    },
    {
      key: 'newPassword',
      type: 'input',
      wrappers: ['custom-form-field'],
      props: {
        label: 'COMMON.LABEL.NEW_PW',
        placeholder: 'COMMON.PLACEHOLDER.NEW_PW',
        required: true,
        type: 'password',
        showRequirements: true,
        attributes: { autocomplete: 'new-password' }
      },
      validators: {
        passwordRequirements: {
          expression: (c: AbstractControl) => {
            const val = c.value || '';
            return PASSWORD_REQUIREMENTS.every(req => req.test(val));
          },
          message: () => this.translateService.stream('VALIDATION.PASSWORD_REQUIREMENTS')
        }
      }
    },
    {
      key: 'confirmPassword',
      type: 'input',
      wrappers: ['custom-form-field'],
      props: {
        label: 'COMMON.LABEL.CONFIRM_PW',
        placeholder: 'COMMON.PLACEHOLDER.CONFIRM_PW',
        required: true,
        type: 'password',
        attributes: { autocomplete: 'new-password' }
      }
    }
  ];

  ngOnInit() {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate());
    this.maxDob = this.getFormattedDateOnly(maxDate);
    this.minDob = this.getFormattedDateOnly(minDate);

    this.profileFields = [
      {
        key: 'name',
        type: 'input',
        wrappers: ['custom-form-field'],
        props: {
          label: 'COMMON.LABEL.FULL_NAME',
          placeholder: 'COMMON.PLACEHOLDER.FULL_NAME',
          required: true,
          attributes: { autocomplete: 'name' }
        },
        validators: {
          fullName: {
            expression: (c: AbstractControl) => !fullNameValidator(c),
            message: () => this.translateService.stream('VALIDATION.INVALID_FULL_NAME')
          }
        }
      },
      {
        key: 'dateOfBirth',
        type: 'datepicker',
        wrappers: ['custom-form-field'],
        props: {
          label: 'COMMON.LABEL.DOB',
          required: true,
          placeholder: 'dd/mm/yyyy',
          mask: '99/99/9999',
          keepCharPositions: true,
          dateFormat: 'dd/mm/yy',
          minDate: new Date(new Date().getFullYear() - 60, new Date().getMonth(), new Date().getDate()),
          maxDate: new Date(new Date().getFullYear() - 10, new Date().getMonth(), new Date().getDate()),
          appendTo: 'body'
        },
        validators: {
          dobAge: {
            expression: (c: AbstractControl) => !dobAgeValidator(c),
            message: () => this.translateService.stream('VALIDATION.OUT_OF_AGE_RANGE_60')
          }
        }
      }
    ];

    this.loadProfile();
  }

  loadProfile() {
    this.userService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user = user;
          let dobDate: Date | null = null;
          if (user.dateOfBirth) dobDate = new Date(user.dateOfBirth);
          // Spread into a new object so Formly's OnPush-style checks detect the reference change,
          // then immediately mark the view dirty so the data appears on first navigation.
          this.profileModel = { ...this.profileModel, name: user.name, dateOfBirth: dobDate };
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading profile:', err)
      });
  }

  onSaveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.error('SETTINGS.TOAST.FILL_REQUIRED');
      return;
    }

    const currentName = (this.user?.name || '').trim();
    const currentDob = this.user?.dateOfBirth ? new Date(this.user.dateOfBirth).toISOString().split('T')[0] : '';
    const normalizedName = (this.profileModel.name || '').trim();
    
    let normalizedDob = '';
    if (this.profileModel.dateOfBirth instanceof Date) {
      normalizedDob = this.getFormattedDateOnly(this.profileModel.dateOfBirth);
    } else if (this.profileModel.dateOfBirth) {
      normalizedDob = new Date(this.profileModel.dateOfBirth).toISOString().split('T')[0];
    }

    if (normalizedName === currentName && normalizedDob === currentDob) {
      this.toastService.info('SETTINGS.TOAST.NO_CHANGES');
      return;
    }

    this.userService.updateProfile({ name: normalizedName, dateOfBirth: normalizedDob })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toastService.success('SETTINGS.TOAST.PROFILE_SUCCESS');
          if (this.user && res.user) {
            this.user.name = res.user.name;
            this.user.dateOfBirth = res.user.dateOfBirth;
            this.authService.saveUser({ ...this.user, name: res.user.name, dateOfBirth: res.user.dateOfBirth });
          }
        },
        error: (err) => this.toastService.error('SETTINGS.TOAST.PROFILE_FAILED')
      });
  }

  openPasswordModal() {
    this.passwordModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.passwordModel;
    if (newPassword !== confirmPassword) {
      this.toastService.error('SETTINGS.TOAST.PASSWORD_MISMATCH');
      return;
    }
    this.userService.changePassword({ currentPassword, newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.toastService.success('SETTINGS.TOAST.PASSWORD_SUCCESS');
          this.closePasswordModal();
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (err) => this.toastService.error('SETTINGS.TOAST.PASSWORD_FAILED')
      });
  }

  getFormattedDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}