import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayout } from './main-layout';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { MessageService } from 'primeng/api';
import { of, throwError, Subject } from 'rxjs';
import { User } from '@core/models';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;
  let authService: AuthService;
  let userService: UserService;
  let toastService: ToastService;
  let translateService: TranslateService;
  let router: Router;

  const mockUser: User = {
    _id: 'user123',
    id: 'user123',
    name: 'Test User',
    email: 'test@taskflow.com',
    role: 'user',
    dateOfBirth: '1990-01-01',
    createdAt: '2026-08-01'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        provideRouter([]),
        AuthService,
        UserService,
        ToastService,
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    toastService = TestBed.inject(ToastService);
    translateService = TestBed.inject(TranslateService);
    router = TestBed.inject(Router);

    spyOn(userService, 'getProfile').and.returnValue(of(mockUser));
    spyOn(authService, 'getUser').and.returnValue(mockUser);
    spyOn(authService, 'saveUser');
    spyOn(toastService, 'error');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
    document.documentElement.classList.remove('dark', 'dark-theme');
    localStorage.clear();
  });

  it('should load profile on init', () => {
    expect(authService.getUser).toHaveBeenCalled();
    expect(userService.getProfile).toHaveBeenCalled();
    expect(component.user).toEqual(mockUser);
    expect(authService.saveUser).toHaveBeenCalledWith(mockUser);
  });

  it('should load theme dark on init if theme is dark in localStorage', () => {
    localStorage.setItem('theme', 'dark');
    component.ngOnInit();

    expect(component.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('should load theme light on init if theme is light in localStorage', () => {
    localStorage.setItem('theme', 'light');
    component.ngOnInit();

    expect(component.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should show error toast if loading profile fails on init', () => {
    (userService.getProfile as jasmine.Spy).and.returnValue(throwError(() => new Error('API Error')));
    component.ngOnInit();

    expect(toastService.error).toHaveBeenCalledWith('SETTINGS.TOAST.LOAD_FAILED');
  });

  it('should toggle sidebar collapsed state', () => {
    const initialState = component.isSidebarCollapsed;
    component.toggleSidebar();
    expect(component.isSidebarCollapsed).toBe(!initialState);
  });

  it('should collapse sidebar on mobile resize screen (< 768)', () => {
    Object.defineProperty(window, 'innerWidth', { get: () => 500, configurable: true });
    component.isSidebarCollapsed = false;

    component.closeSidebarOnMobile();
    expect(component.isSidebarCollapsed).toBe(true);
  });

  it('should not collapse sidebar on desktop resize screen (>= 768)', () => {
    Object.defineProperty(window, 'innerWidth', { get: () => 1024, configurable: true });
    component.isSidebarCollapsed = false;

    component.closeSidebarOnMobile();
    expect(component.isSidebarCollapsed).toBe(false);
  });

  it('should handle lang change and update local storage and translate service', () => {
    const useSpy = spyOn(translateService, 'use').and.returnValue(of({}));

    component.onLangChange('vi');
    expect(useSpy).toHaveBeenCalledWith('vi');
    expect(localStorage.getItem('lang')).toBe('vi');
    expect(component.currentLang).toBe('vi');
  });

  it('should format date correctly on language change global event', () => {
    (translateService.onLangChange as Subject<LangChangeEvent>).next({ lang: 'vi', translations: {} });
    expect(component.currentLang).toBe('vi');
    expect(component.currentDate).toBeTruthy();
  });

  it('should toggle theme mode', () => {
    const initialTheme = component.isDarkMode;

    // Toggle 1: changes from initial to opposite
    component.toggleTheme();
    expect(component.isDarkMode).toBe(!initialTheme);
    expect(localStorage.getItem('theme')).toBe(component.isDarkMode ? 'dark' : 'light');

    // Toggle 2: changes back to initial
    component.toggleTheme();
    expect(component.isDarkMode).toBe(initialTheme);
    expect(localStorage.getItem('theme')).toBe(component.isDarkMode ? 'dark' : 'light');
  });

  it('should handle logout correctly and redirect to root', () => {
    const logoutSpy = spyOn(authService, 'logout');
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.logout();
    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should auto-close sidebar on router navigation on mobile screens', async () => {
    Object.defineProperty(window, 'innerWidth', { get: () => 500, configurable: true });
    component.isSidebarCollapsed = false;

    await router.navigate(['/']);
    expect(component.isSidebarCollapsed).toBe(true);
  });
});
