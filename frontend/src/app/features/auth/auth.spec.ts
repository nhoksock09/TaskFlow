import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { FormlyModule } from '@ngx-formly/core';
import { FormControl } from '@angular/forms';
import { FormFieldWrapperComponent } from '../../shared/formly/form-field-wrapper/form-field-wrapper.component';
import { FormlyFieldDatePicker } from '../../shared/formly/datepicker/datepicker.type';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let mockAuthService: jasmine.SpyObj<Pick<AuthService, 'isLoggedIn' | 'login' | 'register' | 'saveToken' | 'saveUser'>>;
  let mockToastService: jasmine.SpyObj<Pick<ToastService, 'success' | 'error'>>;
  let mockRouter: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  const mockLoginResponse = {
    message: 'OK',
    token: 'fake-token-123',
    user: { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' as const, dateOfBirth: '1990-01-01' }
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', {
      isLoggedIn: false,
      login: of(mockLoginResponse),
      register: of({ message: 'Success' }),
      saveToken: undefined,
      saveUser: undefined
    });

    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        Auth,
        FormlyModule.forRoot({
          types: [
            { name: 'datepicker', component: FormlyFieldDatePicker, wrappers: ['custom-form-field'] }
          ],
          wrappers: [
            { name: 'custom-form-field', component: FormFieldWrapperComponent }
          ]
        })
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        provideTranslateService(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
    document.documentElement.classList.remove('dark', 'dark-theme');
    localStorage.clear();
  });

  describe('Initialization Pre-conditions', () => {
    it('should redirect to dashboard on init if already logged in', () => {
      mockAuthService.isLoggedIn.and.returnValue(true);
      fixture.detectChanges();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should load theme config on init', () => {
      localStorage.setItem('theme', 'dark');
      fixture.detectChanges();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

      localStorage.setItem('theme', 'light');
      component.ngOnInit();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    });
  });

  describe('Component Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should check if user is not logged in', () => {
      expect(mockAuthService.isLoggedIn).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should configure min and max DOB on init', () => {
      const today = new Date();
      const minYear = today.getFullYear() - 60;
      const maxYear = today.getFullYear() - 18;

      expect(component.minDob).toContain(String(minYear));
      expect(component.maxDob).toContain(String(maxYear));
    });

    describe('switchMode', () => {
      it('should set isLogin signal and reset both login and register forms', () => {
        const loginResetSpy = spyOn(component.loginForm, 'reset');
        const registerResetSpy = spyOn(component.registerForm, 'reset');

        component.switchMode(false);
        expect(component.isLogin()).toBe(false);
        expect(loginResetSpy).toHaveBeenCalled();
        expect(registerResetSpy).toHaveBeenCalled();
        expect(component.loginModel).toEqual({ email: '', password: '' });
        expect(component.registerModel).toEqual({ name: '', email: '', password: '', dateOfBirth: '' });
      });
    });

    describe('login', () => {
      it('should mark all fields as touched if login form is invalid', () => {
        const touchSpy = spyOn(component.loginForm, 'markAllAsTouched');
        component.loginForm.setErrors({ invalid: true });
        component.login();

        expect(touchSpy).toHaveBeenCalled();
        expect(mockAuthService.login).not.toHaveBeenCalled();
      });

      it('should login successfully, save token, save user, show toast, and redirect to dashboard', () => {
        component.loginModel = { email: 'john@example.com', password: 'password123!' };
        component.loginForm.patchValue(component.loginModel);
        component.login();

        expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'john@example.com', password: 'password123!' });
        expect(mockAuthService.saveToken).toHaveBeenCalledWith('fake-token-123');
        expect(mockAuthService.saveUser).toHaveBeenCalledWith(mockLoginResponse.user);
        expect(mockToastService.success).toHaveBeenCalledWith('AUTH.TOAST.LOGIN_SUCCESS');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      });

      it('should show error toast with custom message if login fails', () => {
        const errorMsg = 'Invalid email or password.';
        mockAuthService.login.and.returnValue(throwError(() => ({ error: { message: errorMsg } })));
        component.loginModel = { email: 'john@example.com', password: 'wrongPassword' };
        component.loginForm.patchValue(component.loginModel);
        component.login();

        expect(mockToastService.error).toHaveBeenCalledWith(errorMsg);
      });

      it('should show error toast with default message if login fails without custom message', () => {
        mockAuthService.login.and.returnValue(throwError(() => ({ error: {} })));
        component.loginModel = { email: 'john@example.com', password: 'password123!' };
        component.loginForm.patchValue(component.loginModel);
        component.login();

        expect(mockToastService.error).toHaveBeenCalledWith('AUTH.TOAST.LOGIN_FAILED');
      });
    });

    describe('register', () => {
      beforeEach(() => {
        component.switchMode(false);
      });

      it('should mark all fields as touched if register form is invalid', () => {
        const touchSpy = spyOn(component.registerForm, 'markAllAsTouched');
        component.registerForm.setErrors({ invalid: true });
        component.register();

        expect(touchSpy).toHaveBeenCalled();
        expect(mockAuthService.register).not.toHaveBeenCalled();
      });

      it('should register successfully, format DOB, switch mode, show toast and reset registration', () => {
        const switchSpy = spyOn(component, 'switchMode');
        const registerResetSpy = spyOn(component.registerForm, 'reset');

        component.registerModel = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          dateOfBirth: new Date('1990-01-01')
        };
        component.registerForm.patchValue(component.registerModel);

        component.register();

        expect(mockAuthService.register).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          dateOfBirth: '1990-01-01'
        });
        expect(mockToastService.success).toHaveBeenCalledWith('AUTH.TOAST.REGISTRATION_SUCCESS');
        expect(switchSpy).toHaveBeenCalledWith(true);
        expect(registerResetSpy).toHaveBeenCalled();
        expect(component.registerModel).toEqual({ name: '', email: '', password: '', dateOfBirth: '' });
      });

      it('should show error toast with custom message if registration fails', () => {
        const errorMsg = 'Email already exists.';
        mockAuthService.register.and.returnValue(throwError(() => ({ error: { message: errorMsg } })));
        component.registerModel = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          dateOfBirth: new Date('1990-01-01')
        };
        component.registerForm.patchValue(component.registerModel);
        component.register();

        expect(mockToastService.error).toHaveBeenCalledWith(errorMsg);
      });

      it('should show error toast with default message if registration fails without custom message', () => {
        mockAuthService.register.and.returnValue(throwError(() => ({ error: {} })));
        component.registerModel = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          dateOfBirth: new Date('1990-01-01')
        };
        component.registerForm.patchValue(component.registerModel);
        component.register();

        expect(mockToastService.error).toHaveBeenCalledWith('AUTH.TOAST.REGISTRATION_FAILED');
      });

      it('should register successfully when dateOfBirth is a string', () => {
        component.registerModel = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          dateOfBirth: '1990-01-01'
        };
        component.registerForm.patchValue(component.registerModel);
        component.register();

        expect(mockAuthService.register).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          dateOfBirth: '1990-01-01'
        });
      });
    });
  });

  describe('Form validators and translate streams', () => {
    it('should translate field validation messages', () => {
      fixture.detectChanges();
      const translateService = TestBed.inject(TranslateService);
      const streamSpy = spyOn(translateService, 'stream').and.callThrough();

      const emailLoginField = component.loginFields.find(f => f.key === 'email');
      emailLoginField?.validators?.['strictEmail']?.message();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.INVALID_EMAIL');

      emailLoginField?.validators?.['emailTypo']?.message();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.EMAIL_TYPO');

      component.switchMode(false);

      const nameField = component.registerFields.find(f => f.key === 'name');
      nameField?.validators?.['fullName']?.message();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.INVALID_FULL_NAME');

      const emailField = component.registerFields.find(f => f.key === 'email');
      emailField?.validators?.['strictEmail']?.message();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.INVALID_EMAIL');

      emailField?.validators?.['emailTypo']?.message();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.EMAIL_TYPO');

      const passwordField = component.registerFields.find(f => f.key === 'password');
      passwordField?.validators?.['passwordRequirements']?.message();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.PASSWORD_REQUIREMENTS');

      const pwExpr = passwordField?.validators?.['passwordRequirements']?.expression;
      expect(pwExpr).toBeDefined();
      expect(pwExpr!(new FormControl('Pass12345!'))).toBe(true);
      expect(pwExpr!(new FormControl('123'))).toBe(false);
      expect(pwExpr!(new FormControl(''))).toBe(false);

      const dobField = component.registerFields.find(f => f.key === 'dateOfBirth');
      dobField?.validators?.['dobAge']?.message();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.OUT_OF_AGE_RANGE');
    });
  });
});
