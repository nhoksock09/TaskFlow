import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonModule } from 'primeng/button';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { PASSWORD_REQUIREMENTS } from '../../shared/constants/password-rules';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  fullNameValidator,
  dobAgeValidator,
  emailTypoValidator,
  strictEmailValidator
} from '../../shared/validators/form.validators';
import { LoginRequest, RegisterRequest } from '@core/models';

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    FormlyModule,
    FormlyPrimeNGModule,
    TranslatePipe,
  ],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})

export class Auth implements OnInit {
  isLogin = signal(true);

  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  minDob: string = '';
  maxDob: string = '';

  // ── Login form ─────────────────────────────────────────────────────────────
  loginForm = new FormGroup({});
  loginModel: LoginRequest = { email: '', password: '' };
  loginFields: FormlyFieldConfig[] = [
    {
      key: 'email',
      type: 'input',
      wrappers: ['custom-form-field'],
      props: {
        label: 'COMMON.LABEL.EMAIL',
        placeholder: 'COMMON.PLACEHOLDER.EMAIL',
        required: true,
        type: 'email',
      },
      validators: {
        strictEmail: { expression: (c: AbstractControl) => !strictEmailValidator(c), message: () => this.translateService.stream('VALIDATION.INVALID_EMAIL') },
        emailTypo: { expression: (c: AbstractControl) => !emailTypoValidator(c), message: () => this.translateService.stream('VALIDATION.EMAIL_TYPO') },
      }
    },
    {
      key: 'password',
      type: 'input',
      wrappers: ['custom-form-field'],
      props: {
        label: 'COMMON.LABEL.PASSWORD',
        placeholder: 'COMMON.PLACEHOLDER.PASSWORD',
        required: true,
        type: 'password',
      }
    }
  ];

  // ── Register form ──────────────────────────────────────────────────────────
  registerForm = new FormGroup({});
  registerModel: RegisterRequest = { name: '', email: '', password: '', dateOfBirth: '' };
  registerFields: FormlyFieldConfig[] = [];

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark', 'dark-theme');
    } else {
      document.documentElement.classList.remove('dark', 'dark-theme');
    }

    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate());
    this.maxDob = this.getFormattedDateOnly(maxDate);
    this.minDob = this.getFormattedDateOnly(minDate);

    // Build register fields here so minDob/maxDob are ready
    this.registerFields = [
      {
        key: 'name',
        type: 'input',
        wrappers: ['custom-form-field'],
        props: {
          label: 'COMMON.LABEL.FULL_NAME',
          placeholder: 'COMMON.PLACEHOLDER.FULL_NAME',
          required: true,
        },
        validators: {
          fullName: { expression: (c: AbstractControl) => !fullNameValidator(c), message: () => this.translateService.stream('VALIDATION.INVALID_FULL_NAME') }
        }
      },
      {
        key: 'email',
        type: 'input',
        wrappers: ['custom-form-field'],
        props: {
          label: 'COMMON.LABEL.EMAIL',
          placeholder: 'COMMON.PLACEHOLDER.EMAIL',
          required: true,
          type: 'email',
        },
        validators: {
          strictEmail: { expression: (c: AbstractControl) => !strictEmailValidator(c), message: () => this.translateService.stream('VALIDATION.INVALID_EMAIL') },
          emailTypo: { expression: (c: AbstractControl) => !emailTypoValidator(c), message: () => this.translateService.stream('VALIDATION.EMAIL_TYPO') },
        }
      },
      {
        key: 'password',
        type: 'input',
        wrappers: ['custom-form-field'],
        props: {
          label: 'COMMON.LABEL.PASSWORD',
          placeholder: 'COMMON.PLACEHOLDER.NEW_PW',
          required: true,
          type: 'password',
          showRequirements: true,
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
        key: 'dateOfBirth',
        type: 'datepicker',
        wrappers: ['custom-form-field'],
        props: {
          label: 'COMMON.LABEL.DOB',
          placeholder: 'dd/mm/yyyy',
          mask: '99/99/9999',
          keepCharPositions: true,
          dateFormat: 'dd/mm/yy',
          required: true,
          minDate: minDate,
          maxDate: maxDate,
          appendTo: 'body'
        },
        validators: {
          dobAge: { expression: (c: AbstractControl) => !dobAgeValidator(c), message: () => this.translateService.stream('VALIDATION.OUT_OF_AGE_RANGE') }
        }
      }
    ];
  }

  getFormattedDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  switchMode(login: boolean) {
    this.isLogin.set(login);

    // Reset form controls and validation states
    this.loginForm.reset();
    this.loginForm.markAsPristine();
    this.loginForm.markAsUntouched();

    this.registerForm.reset();
    this.registerForm.markAsPristine();
    this.registerForm.markAsUntouched();

    // Reset model references to trigger Formly UI updates
    this.loginModel = { email: '', password: '' };
    this.registerModel = { name: '', email: '', password: '', dateOfBirth: '' };
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.authService.login(this.loginModel)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.authService.saveToken(response.token);
          this.authService.saveUser(response.user);
          this.toastService.success('AUTH.TOAST.LOGIN_SUCCESS');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.toastService.error(err.error.message || 'AUTH.TOAST.LOGIN_FAILED');
        }
      });
  }

  register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.registerModel };
    if (payload.dateOfBirth instanceof Date) {
      payload.dateOfBirth = this.getFormattedDateOnly(payload.dateOfBirth);
    }

    this.authService.register(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('AUTH.TOAST.REGISTRATION_SUCCESS');
          this.switchMode(true);
          this.registerForm.reset();
          this.registerModel = { name: '', email: '', password: '', dateOfBirth: '' };
        },
        error: (err) => {
          this.toastService.error(err.error.message || 'AUTH.TOAST.REGISTRATION_FAILED');
        }
      });
  }
}
