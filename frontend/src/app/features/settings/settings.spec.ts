import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';
import { AbstractControl } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormFieldWrapperComponent } from '../../shared/formly/form-field-wrapper/form-field-wrapper.component';
import { FormlyFieldDatePicker } from '../../shared/formly/datepicker/datepicker.type';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { User } from '@core/models';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockUserService: jasmine.SpyObj<Pick<UserService, 'getProfile' | 'updateProfile' | 'changePassword'>>;
  let mockAuthService: jasmine.SpyObj<Pick<AuthService, 'saveUser' | 'logout'>>;
  let mockToastService: jasmine.SpyObj<Pick<ToastService, 'success' | 'error' | 'info'>>;
  let mockRouter: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  const mockUser: User = {
    _id: 'user123',
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    dateOfBirth: '1990-01-01',
    createdAt: '2026-08-01'
  };

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', {
      getProfile: of(mockUser),
      updateProfile: of({ message: 'Success', user: { ...mockUser, name: 'John Smith', dateOfBirth: '1990-01-01' } }),
      changePassword: of({ message: 'Success' })
    });

    mockAuthService = jasmine.createSpyObj('AuthService', ['saveUser', 'logout']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        Settings,
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
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        provideTranslateService(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should load profile on init', () => {
    expect(mockUserService.getProfile).toHaveBeenCalled();
    expect(component.user).toEqual(mockUser);
    expect(component.profileModel.name).toBe('John Doe');
    expect(component.profileModel.dateOfBirth).toBeInstanceOf(Date);
  });

  it('should calculate min and max Date of Birth correctly', () => {
    const today = new Date();
    const maxYear = today.getFullYear() - 18;
    const minYear = today.getFullYear() - 60;

    expect(component.maxDob).toContain(String(maxYear));
    expect(component.minDob).toContain(String(minYear));
  });

  describe('loadProfile', () => {
    it('should show toast error if profile loading fails', () => {
      mockUserService.getProfile.and.returnValue(throwError(() => new Error('API Error')));
      component.loadProfile();
      expect(mockToastService.error).toHaveBeenCalledWith('SETTINGS.TOAST.LOAD_FAILED');
    });

    it('should handle loadProfile when dateOfBirth is falsy', () => {
      const userNoDob = { ...mockUser, dateOfBirth: '' };
      mockUserService.getProfile.and.returnValue(of(userNoDob));
      component.loadProfile();
      expect(component.profileModel.dateOfBirth).toBe('');
    });
  });

  describe('onSaveProfile', () => {
    it('should show error toast if profile form is invalid', () => {
      component.profileForm.setErrors({ invalid: true });
      component.onSaveProfile();
      expect(mockToastService.error).toHaveBeenCalledWith('SETTINGS.TOAST.FILL_REQUIRED');
      expect(mockUserService.updateProfile).not.toHaveBeenCalled();
    });

    it('should show info toast if there are no profile changes', () => {
      component.profileModel = { name: 'John Doe', dateOfBirth: new Date('1990-01-01') };
      component.onSaveProfile();
      expect(mockToastService.info).toHaveBeenCalledWith('SETTINGS.TOAST.NO_CHANGES');
      expect(mockUserService.updateProfile).not.toHaveBeenCalled();
    });

    it('should call updateProfile service and save user state on success', () => {
      component.user = { ...mockUser };
      component.profileModel = { name: 'John Smith', dateOfBirth: new Date('1990-01-01') };
      component.onSaveProfile();

      expect(mockUserService.updateProfile).toHaveBeenCalledWith({ name: 'John Smith', dateOfBirth: '1990-01-01' });
      expect(mockToastService.success).toHaveBeenCalledWith('SETTINGS.TOAST.PROFILE_SUCCESS');
      expect(mockAuthService.saveUser).toHaveBeenCalledWith({
        ...mockUser,
        name: 'John Smith',
        dateOfBirth: '1990-01-01'
      });
    });

    it('should show error toast if updateProfile service fails', () => {
      component.user = { ...mockUser };
      mockUserService.updateProfile.and.returnValue(throwError(() => new Error('API Error')));
      component.profileModel = { name: 'John Smith', dateOfBirth: new Date('1990-01-01') };
      component.onSaveProfile();

      expect(mockToastService.error).toHaveBeenCalledWith('SETTINGS.TOAST.PROFILE_FAILED');
    });

    it('should handle profileModel dateOfBirth when it is a string', () => {
      component.user = { ...mockUser };
      component.profileModel = { name: 'John Smith', dateOfBirth: '1990-01-01' };
      component.onSaveProfile();

      expect(mockUserService.updateProfile).toHaveBeenCalledWith({ name: 'John Smith', dateOfBirth: '1990-01-01' });
    });
  });

  describe('Password Modal and changing password', () => {
    it('should reset form and show password modal', () => {
      const resetSpy = spyOn(component.passwordForm, 'reset');
      component.openPasswordModal();

      expect(resetSpy).toHaveBeenCalled();
      expect(component.showPasswordModal).toBe(true);
      expect(component.passwordModel).toEqual({ currentPassword: '', newPassword: '', confirmPassword: '' });
    });

    it('should close password modal', () => {
      component.showPasswordModal = true;
      component.closePasswordModal();
      expect(component.showPasswordModal).toBe(false);
    });

    it('should mark all fields as touched if password form is invalid', () => {
      const touchSpy = spyOn(component.passwordForm, 'markAllAsTouched');
      component.passwordForm.setErrors({ invalid: true });
      component.onChangePassword();

      expect(touchSpy).toHaveBeenCalled();
      expect(mockUserService.changePassword).not.toHaveBeenCalled();
    });

    it('should show error toast if newPassword and confirmPassword do not match', () => {
      component.passwordForm.setErrors(null);
      component.passwordModel = { currentPassword: 'oldPassword123', newPassword: 'newPassword123!', confirmPassword: 'differentPassword!' };
      component.onChangePassword();

      expect(mockToastService.error).toHaveBeenCalledWith('SETTINGS.TOAST.PASSWORD_MISMATCH');
      expect(mockUserService.changePassword).not.toHaveBeenCalled();
    });

    it('should call changePassword service, show toast, close modal, logout and navigate to login on success', () => {
      component.passwordForm.setErrors(null);
      component.passwordModel = { currentPassword: 'oldPassword123', newPassword: 'newPassword123!', confirmPassword: 'newPassword123!' };
      component.onChangePassword();

      expect(mockUserService.changePassword).toHaveBeenCalledWith({ currentPassword: 'oldPassword123', newPassword: 'newPassword123!' });
      expect(mockToastService.success).toHaveBeenCalledWith('SETTINGS.TOAST.PASSWORD_SUCCESS');
      expect(component.showPasswordModal).toBe(false);
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should show error toast if changePassword service fails', () => {
      mockUserService.changePassword.and.returnValue(throwError(() => new Error('API Error')));
      component.passwordForm.setErrors(null);
      component.passwordModel = { currentPassword: 'oldPassword123', newPassword: 'newPassword123!', confirmPassword: 'newPassword123!' };
      component.onChangePassword();

      expect(mockToastService.error).toHaveBeenCalledWith('SETTINGS.TOAST.PASSWORD_FAILED');
    });
  });

  describe('Validators and Helper Methods', () => {
    it('should validate fullName field', () => {
      const nameField = component.profileFields.find(f => f.key === 'name');
      const expression = nameField?.validators?.['fullName']?.expression;
      const message = nameField?.validators?.['fullName']?.message;

      expect(expression).toBeDefined();
      expect(message).toBeDefined();

      const validControl = { value: 'John Doe' } as AbstractControl;
      const invalidControl = { value: 'John123' } as AbstractControl;

      expect(expression!(validControl)).toBe(true);
      expect(expression!(invalidControl)).toBe(false);

      const translateService = TestBed.inject(TranslateService);
      const streamSpy = spyOn(translateService, 'stream').and.callThrough();
      message!();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.INVALID_FULL_NAME');
    });

    it('should validate dobAge field', () => {
      const dobField = component.profileFields.find(f => f.key === 'dateOfBirth');
      const expression = dobField?.validators?.['dobAge']?.expression;
      const message = dobField?.validators?.['dobAge']?.message;

      expect(expression).toBeDefined();
      expect(message).toBeDefined();

      const validControl = { value: '1990-01-01' } as AbstractControl;
      const invalidControl = { value: '2026-01-01' } as AbstractControl;

      expect(expression!(validControl)).toBe(true);
      expect(expression!(invalidControl)).toBe(false);

      const translateService = TestBed.inject(TranslateService);
      const streamSpy = spyOn(translateService, 'stream').and.callThrough();
      message!();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.OUT_OF_AGE_RANGE_60');
    });

    it('should validate passwordRequirements field', () => {
      const pwField = component.passwordFields.find(f => f.key === 'newPassword');
      const expression = pwField?.validators?.['passwordRequirements']?.expression;
      const message = pwField?.validators?.['passwordRequirements']?.message;

      expect(expression).toBeDefined();
      expect(message).toBeDefined();

      const validControl = { value: 'Abc12345!' } as AbstractControl;
      const invalidControl = { value: '123' } as AbstractControl;

      expect(expression!(validControl)).toBe(true);
      expect(expression!(invalidControl)).toBe(false);

      const translateService = TestBed.inject(TranslateService);
      const streamSpy = spyOn(translateService, 'stream').and.callThrough();
      message!();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.PASSWORD_REQUIREMENTS');
    });
  });

  describe('onSaveProfile branch coverage details', () => {
    it('should handle when user is null', () => {
      component.user = null;
      component.profileModel = { name: 'John Smith', dateOfBirth: new Date('1990-01-01') };
      mockUserService.updateProfile.and.returnValue(of({ message: 'Success', user: null as unknown as User }));
      component.onSaveProfile();
      expect(mockUserService.updateProfile).toHaveBeenCalled();
    });

    it('should handle when user is defined but res.user is null', () => {
      component.user = { ...mockUser };
      component.profileModel = { name: 'John Smith', dateOfBirth: new Date('1990-01-01') };
      mockUserService.updateProfile.and.returnValue(of({ message: 'Success', user: null as unknown as User }));
      component.onSaveProfile();
      expect(mockUserService.updateProfile).toHaveBeenCalled();
    });

    it('should handle empty profileModel.name and falsy dateOfBirth', () => {
      component.user = { ...mockUser };
      component.profileModel = { name: '', dateOfBirth: '' };
      component.onSaveProfile();
      expect(mockUserService.updateProfile).toHaveBeenCalled();
    });
  });
});
