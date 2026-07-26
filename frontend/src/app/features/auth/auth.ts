import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { Toast } from '../../shared/components/toast/toast';

function dobAgeValidator(control: AbstractControl): ValidationErrors | null {
  const dobValue = control.value;
  if (!dobValue) return null;
  const dob = new Date(dobValue);
  if (isNaN(dob.getTime())) return { invalidDob: true };
  const today = new Date();
  if (dob > today) return { futureDob: true };
  return null;
}

function emailTypoValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  if (!email) return null;
  const lowerEmail = email.toLowerCase().trim();
  if (lowerEmail.endsWith('@gmail.co')) {
    return { gmailCoTypo: true };
  }
  const typos = [
    '@gmal.com',
    '@gmail.c',
    '@yahoo.co',
    '@yaho.com',
    '@gmail.con',
    '@hotmal.com',
    '@outlook.co'
  ];
  if (typos.some(typo => lowerEmail.endsWith(typo))) {
    return {
      emailTypo: true
    };
  }
  return null;
}

function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  if (!email) return null;
  const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!regex.test(email)) {
    const atIndex = email.indexOf('@');
    if (atIndex > 0) {
      const username = email.substring(0, atIndex);
      if (!/[a-zA-Z]/.test(username)) {
        return { noLetterInUsername: true };
      }
    }
    return { pattern: true };
  }
  return null;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Toast
  ],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth implements OnInit {
  isLogin = signal(true);
  hidePassword = signal(true);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  loginForm: FormGroup;
  registerForm: FormGroup;

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark', 'dark-theme');
    } else {
      document.documentElement.classList.remove('dark', 'dark-theme');
    }
  }
  switchMode(login: boolean) {
    this.isLogin.set(login);
  }
  togglePassword() {
    this.hidePassword.update(value => !value);
  }
  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        strictEmailValidator,
        emailTypoValidator
      ]],
      password: ['', Validators.required]
    });
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [
        Validators.required,
        strictEmailValidator,
        emailTypoValidator
      ]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dateOfBirth: ['', dobAgeValidator]
    });
  }
  login() {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }

    this.authService.login(this.loginForm.value).subscribe({

      next: (response) => {

        this.authService.saveToken(response.token);

        this.authService.saveUser(response.user);
        this.toastService.success('Login successful! 🎉');

        this.router.navigate(['/dashboard']);

      },

      error: (err) => {

        this.toastService.error(err.error.message || 'Login failed');

      }

    });

  }
  register() {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }

    this.authService.register(this.registerForm.value).subscribe({

      next: () => {

        this.toastService.success('Registration successful! 🎉');

        this.switchMode(true);

        this.registerForm.reset();

      },

      error: (err) => {

        this.toastService.error(err.error.message || 'Registration failed');

      }

    });

  }
}